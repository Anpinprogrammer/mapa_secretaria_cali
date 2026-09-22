import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { AllyRecord, ZonaKey } from '../types';
import { ZONA_GEOMETRY, COMUNA_LABELS, RURAL_PINS, VIEWBOX, ZONA_COLORS, buildAliadoColorMap } from '../data/zonasComunas';
import {
  aggregateByZona,
  buildDefaultDataset,
  parseExcelFile,
  fetchRecordsFromSheetUrl,
  ExcelFormatError,
  SheetFetchError,
  ParsedSheetResult,
} from '../utils/excelParser';
import { saveDatasetToLocalCache, loadDatasetFromLocalCache, clearDatasetLocalCache } from '../utils/localCache';
import { Sidebar } from './Sidebar';
import { ZonaPopup } from './ZonaPopup';
import { Legend } from './Legend';
import { FaseAtencionPanel } from './FaseAtencionPanel';

const [VB_W, VB_H] = VIEWBOX.split(' ').slice(2).map(Number);
const MAP_RATIO = VB_W / VB_H;

/**
 * URL pública de exportación CSV de la hoja de Google Sheets con la información
 * de aliados. Para obtenerla: abre la hoja → Compartir → "Cualquiera con el
 * enlace puede ver" → copia el ID de la URL (.../spreadsheets/d/ESTE_ID/edit)
 * y, si los datos no están en la primera pestaña, el `gid` de la pestaña
 * (aparece al final de la URL como #gid=ESTE_NUMERO), y arma:
 *   https://docs.google.com/spreadsheets/d/ID/export?format=csv&gid=GID
 * También se puede definir en tiempo de build con la variable de entorno
 * VITE_SHEET_CSV_URL (archivo .env), sin tocar el código.
 */
const GOOGLE_SHEET_CSV_URL: string = import.meta.env.VITE_SHEET_CSV_URL ?? '';

interface CaliEducationalMapProps {
  /** Datos iniciales; si se omite, se usa el dataset real embebido */
  initialData?: ParsedSheetResult;
  /** Nombre mostrado del dataset por defecto */
  defaultDatasetLabel?: string;
  /** URL de exportación CSV de Google Sheets a usar por el botón "Actualizar" */
  sheetCsvUrl?: string;
}

export default function CaliEducationalMap({
  initialData,
  defaultDatasetLabel = 'INFORMACION DE ALIADOS POR ZONA EDUCATIVA.xlsx (hoja "Copia de ZONAS")',
  sheetCsvUrl = GOOGLE_SHEET_CSV_URL,
}: CaliEducationalMapProps) {
  const cached = initialData ? null : loadDatasetFromLocalCache();
  const fallback = initialData ?? cached ?? buildDefaultDataset();
  const initial: ParsedSheetResult = {
    records: fallback.records,
    accionesPorZona: (fallback as ParsedSheetResult).accionesPorZona ?? {},
  };
  const initialOrigen: 'embebido' | 'excel-manual' | 'google-sheets' = !cached
    ? 'embebido'
    : cached.datasetLabel === 'Google Sheets (en vivo)'
    ? 'google-sheets'
    : 'excel-manual';

  const [records, setRecords] = useState<AllyRecord[]>(initial.records);
  const [accionesPorZona, setAccionesPorZona] = useState(initial.accionesPorZona);
  const [datasetLabel, setDatasetLabel] = useState(cached?.datasetLabel ?? defaultDatasetLabel);
  const [cargando, setCargando] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [sincronizandoInicial, setSincronizandoInicial] = useState(!!sheetCsvUrl && !initialData);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** De dónde viene lo que se está mostrando ahora mismo, para el aviso del sidebar */
  const [origenDatos, setOrigenDatos] = useState<'embebido' | 'excel-manual' | 'google-sheets'>(initialOrigen);

  const [zonaFiltro, setZonaFiltro] = useState<ZonaKey | 'Todas'>('Todas');
  const [aliadoFiltro, setAliadoFiltro] = useState<string | 'Todos'>('Todos');
  const [busqueda, setBusqueda] = useState('');

  const [selected, setSelected] = useState<ZonaKey | null>(null);

  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // El mapa se ajusta (contain) al espacio disponible del wrapper central,
  // priorizando el alto para que toda la app quepa en una sola pantalla.
  const [mapBox, setMapBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = mapWrapperRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      let boxW = w;
      let boxH = w / MAP_RATIO;
      if (boxH > h) {
        boxH = h;
        boxW = h * MAP_RATIO;
      }
      setMapBox({ width: boxW, height: boxH });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Registros filtrados por aliado y búsqueda de texto (la zona se filtra al pintar el mapa)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (aliadoFiltro !== 'Todos' && r.aliado !== aliadoFiltro) return false;
      if (busqueda.trim()) {
        const q = busqueda.trim().toLowerCase();
        const comunaTxt = r.comunaNumero !== null ? `comuna ${r.comunaNumero}` : '';
        const haystack = `${r.aliado} ${r.zona} ${comunaTxt}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [records, aliadoFiltro, busqueda]);

  const aggregates = useMemo(
    () => aggregateByZona(filteredRecords, accionesPorZona),
    [filteredRecords, accionesPorZona]
  );

  const aliadosDisponibles = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.aliado && set.add(r.aliado));
    return Array.from(set).sort();
  }, [records]);

  // Un color por aliado, calculado sobre TODOS los aliados disponibles (no por
  // categoría), para que el filtro del sidebar y la leyenda muestren siempre
  // el mismo listado con los mismos colores.
  const aliadoColorMap = useMemo(() => buildAliadoColorMap(aliadosDisponibles), [aliadosDisponibles]);

  const isZonaActive = useCallback(
    (zona: ZonaKey) => {
      if (zonaFiltro !== 'Todas' && zona !== zonaFiltro) return false;
      if (aliadoFiltro !== 'Todos' || busqueda.trim()) {
        const agg = aggregates.get(zona);
        return !!agg && agg.totalIntervenciones > 0;
      }
      return true;
    },
    [zonaFiltro, aliadoFiltro, busqueda, aggregates]
  );

  const handleCargarExcel = async (file: File) => {
    setCargando(true);
    setError(null);
    try {
      const parsed = await parseExcelFile(file);
      setRecords(parsed.records);
      setAccionesPorZona(parsed.accionesPorZona);
      setDatasetLabel(file.name);
      setSelected(null);
      setOrigenDatos('excel-manual');
      saveDatasetToLocalCache({
        records: parsed.records,
        accionesPorZona: parsed.accionesPorZona,
        datasetLabel: file.name,
      });
    } catch (e) {
      setError(
        e instanceof ExcelFormatError
          ? e.message
          : 'No se pudo leer el archivo. Verifica que sea un .xlsx/.xls válido con la hoja "Copia de ZONAS".'
      );
    } finally {
      setCargando(false);
    }
  };

  const handleResetFiltros = () => {
    setZonaFiltro('Todas');
    setAliadoFiltro('Todos');
    setBusqueda('');
    setSelected(null);
  };

  /** Descarta cualquier dataset local/en vivo y vuelve al Excel original embebido en la app. */
  const handleRestablecerDatos = () => {
    clearDatasetLocalCache();
    const original = buildDefaultDataset();
    setRecords(original.records);
    setAccionesPorZona(original.accionesPorZona);
    setDatasetLabel(defaultDatasetLabel);
    setOrigenDatos('embebido');
    setUltimaActualizacion(null);
    setSelected(null);
    setError(null);
  };

  /**
   * Trae la información más reciente de Google Sheets. `silent=true` se usa
   * en la sincronización automática al abrir la página: si falla, no se
   * pisa lo que ya se estaba mostrando (caché local o dataset embebido) y el
   * mensaje de error es más suave, porque no fue una acción del usuario.
   */
  const sincronizarConSheet = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!sheetCsvUrl) {
        if (!opts.silent) {
          setError(
            'No hay una hoja de Google Sheets configurada todavía. Define la URL de exportación CSV ' +
              '(prop "sheetCsvUrl" o variable de entorno VITE_SHEET_CSV_URL) para poder actualizar desde ahí.'
          );
        }
        return;
      }
      if (opts.silent) setSincronizandoInicial(true);
      else setActualizando(true);
      setError(null);
      try {
        const parsed = await fetchRecordsFromSheetUrl(sheetCsvUrl);
        setRecords(parsed.records);
        setAccionesPorZona(parsed.accionesPorZona);
        setDatasetLabel('Google Sheets (en vivo)');
        setSelected(null);
        const ahora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        setUltimaActualizacion(ahora);
        setOrigenDatos('google-sheets');
        saveDatasetToLocalCache({
          records: parsed.records,
          accionesPorZona: parsed.accionesPorZona,
          datasetLabel: 'Google Sheets (en vivo)',
        });
      } catch (e) {
        const msg =
          e instanceof SheetFetchError || e instanceof ExcelFormatError
            ? e.message
            : 'No se pudo actualizar desde Google Sheets. Intenta de nuevo en unos segundos.';
        setError(
          opts.silent
            ? `No se pudo sincronizar automáticamente con Google Sheets al abrir la página (mostrando la última versión disponible). ${msg}`
            : msg
        );
      } finally {
        if (opts.silent) setSincronizandoInicial(false);
        else setActualizando(false);
      }
    },
    [sheetCsvUrl]
  );

  const handleActualizar = () => sincronizarConSheet({ silent: false });

  // Sincronización automática con Google Sheets al abrir la página, para que
  // todos los que visitan el sitio vean siempre la data más reciente sin
  // tener que presionar "Actualizar" a mano. Corre una sola vez al montar.
  const autoSyncedRef = useRef(false);
  useEffect(() => {
    if (autoSyncedRef.current) return;
    autoSyncedRef.current = true;
    if (initialData) return; // si el embebedor ya pasó datos explícitos, respétalos
    if (!sheetCsvUrl) return;
    sincronizarConSheet({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedGeometry = useMemo(
    () => (selected ? ZONA_GEOMETRY.find((z) => z.zona === selected) : undefined),
    [selected]
  );

  // La burbuja se ancla a un punto interior fijo de la zona (precalculado para
  // caer siempre dentro de su silueta). Si ese punto está muy cerca del borde
  // superior, la burbuja se muestra hacia ABAJO en vez de hacia arriba, y su
  // posición horizontal se ajusta para que no se salga por los lados.
  const POPUP_WIDTH = 320;
  const POPUP_HEIGHT = 380;
  const EDGE_MARGIN = 10;

  const selectedAnchor = useMemo(() => {
    if (!selectedGeometry || mapBox.width === 0 || mapBox.height === 0) return null;
    const rawX = (selectedGeometry.anchorX / VB_W) * mapBox.width;
    const rawY = (selectedGeometry.anchorY / VB_H) * mapBox.height;

    const halfW = Math.max(40, Math.min(POPUP_WIDTH / 2, mapBox.width / 2 - EDGE_MARGIN));
    const x = Math.min(Math.max(rawX, halfW + EDGE_MARGIN), mapBox.width - halfW - EDGE_MARGIN);

    const placement: 'above' | 'below' = rawY < POPUP_HEIGHT + EDGE_MARGIN ? 'below' : 'above';
    const y = placement === 'above' ? rawY - 12 : rawY + 14;

    return { x, y, placement };
  }, [selectedGeometry, mapBox]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-100 via-white to-indigo-50 p-3 md:p-4">
      <div className="mb-3 flex-shrink-0">
        <h1 className="text-lg font-semibold leading-tight text-slate-800 md:text-xl">
          Mapa Institucional Educativo — Distrito de Santiago de Cali
        </h1>
        <p className="text-xs text-slate-500">
          Zonas educativas y aliados estratégicos · Dataset: {datasetLabel}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-[260px_minmax(0,2.2fr)_260px]">
        <div className="min-h-0">
          <Sidebar
            zonaFiltro={zonaFiltro}
            onZonaChange={setZonaFiltro}
            aliadoFiltro={aliadoFiltro}
            aliadosDisponibles={aliadosDisponibles}
            onAliadoChange={setAliadoFiltro}
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            onResetFiltros={handleResetFiltros}
            onCargarExcel={handleCargarExcel}
            onActualizar={handleActualizar}
            onRestablecerDatos={handleRestablecerDatos}
            totalRegistros={records.length}
            cargando={cargando}
            actualizando={actualizando || sincronizandoInicial}
            ultimaActualizacion={ultimaActualizacion}
            origenDatos={origenDatos}
            error={error}
          />
        </div>

        <div className="relative flex min-h-0 flex-col rounded-2xl border border-white/20 bg-white/60 p-3 shadow-sm backdrop-blur-md">
          <FaseAtencionPanel />
          <div ref={mapWrapperRef} className="flex min-h-0 flex-1 items-center justify-center overflow-visible">
            <div
              ref={mapRef}
              className="relative"
              style={{ width: mapBox.width || undefined, height: mapBox.height || undefined }}
            >
              <svg viewBox={VIEWBOX} className="h-full w-full" role="img" aria-label="Mapa de zonas educativas de Cali">
                {/* Un único polígono (o varios, si la zona no es contigua) por Zona Educativa */}
                {ZONA_GEOMETRY.map((zg) => {
                  const active = isZonaActive(zg.zona);
                  const color = ZONA_COLORS[zg.zona];
                  const isSelected = selected === zg.zona;
                  return (
                    <path
                      key={zg.zona}
                      d={zg.path}
                      onClick={() => setSelected(zg.zona)}
                      className="cursor-pointer transition-opacity duration-150"
                      fill={color.fill}
                      fillOpacity={active ? 1 : 0.25}
                      stroke={isSelected ? '#4338CA' : '#FFFFFF'}
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                  );
                })}

                {/* Números de comuna: solo de referencia, para ver qué comuna pertenece a cada zona.
                    Ya no son formas clickeables independientes. */}
                {COMUNA_LABELS.map((c) => {
                  const active = isZonaActive(c.zona);
                  const color = ZONA_COLORS[c.zona];
                  return (
                    <text
                      key={c.numero}
                      x={c.x}
                      y={c.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={16}
                      fontWeight={700}
                      fill={active ? color.text : '#94A3B8'}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {c.numero}
                    </text>
                  );
                })}

                {/* Corregimientos / área rural: pines fuera de la silueta urbana. Al hacer clic
                    abren la burbuja de la Zona Educativa a la que pertenecen. La etiqueta cambia
                    de anclaje (izquierda/derecha/centro) según su cercanía al borde del viewBox,
                    para que el texto nunca quede cortado. */}
                {RURAL_PINS.map((pin) => {
                  const active = isZonaActive(pin.zona);
                  const color = ZONA_COLORS[pin.zona];
                  const isSelected = selected === pin.zona;

                  let textAnchor: 'start' | 'end' | 'middle' = 'middle';
                  let labelX = pin.x;
                  let labelY = pin.y - 10;
                  if (pin.x < 130) {
                    textAnchor = 'start';
                    labelX = pin.x + 10;
                    labelY = pin.y + 4;
                  } else if (pin.x > VB_W - 35) {
                    textAnchor = 'end';
                    labelX = pin.x - 10;
                    labelY = pin.y + 4;
                  }

                  return (
                    <g
                      key={pin.id}
                      onClick={() => setSelected(pin.zona)}
                      className="cursor-pointer"
                      opacity={active ? 1 : 0.35}
                    >
                      <circle
                        cx={pin.x}
                        cy={pin.y}
                        r={isSelected ? 7 : 5}
                        fill={color.fill}
                        stroke={isSelected ? '#4338CA' : color.ring}
                        strokeWidth={1.5}
                      />
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor={textAnchor}
                        dominantBaseline="middle"
                        fontSize={11}
                        fontWeight={600}
                        fill="#334155"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {pin.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {selected && (
                <ZonaPopup
                  zona={selected}
                  aggregate={aggregates.get(selected)}
                  anchor={selectedAnchor}
                  aliadoColorMap={aliadoColorMap}
                  height={POPUP_HEIGHT}
                  onClose={() => setSelected(null)}
                />
              )}
            </div>
          </div>

          {!selected && (
            <p className="flex flex-shrink-0 items-center justify-center gap-1.5 pt-1 text-center text-xs text-slate-400">
              <MapPin size={12} /> Haz clic en una zona o corregimiento para ver el detalle de intervenciones
            </p>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto">
          <Legend aliados={aliadosDisponibles} aliadoColorMap={aliadoColorMap} />
        </div>
      </div>
    </div>
  );
}
