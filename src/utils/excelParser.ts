import * as XLSX from 'xlsx';
import { AllyRecord, ZonaAggregate, ZonaKey } from '../types';
import defaultData from '../data/aliadosPorZona.json';

function normalize(text: string): string {
  return text
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Normaliza las variantes de texto de zona del Excel a la clave canónica ZonaKey */
const ZONA_TEXT_MAP: Record<string, ZonaKey> = {
  'ZONA NORTE': 'Zona Norte',
  'ZONA NOR-ORIENTE': 'Zona Nororiente',
  'ZONA NORORIENTE': 'Zona Nororiente',
  'ZONA NOR ORIENTE': 'Zona Nororiente',
  'ZONA CENTRO': 'Zona Centro',
  'ZONA SUR-ORIENTE': 'Zona Suroriente',
  'ZONA SURORIENTE': 'Zona Suroriente',
  'ZONA SUR ORIENTE': 'Zona Suroriente',
  'ZONA ORIENTE': 'Zona Oriente',
  'ZONA SUR': 'Zona Sur',
};

export function normalizeZona(raw: string): ZonaKey | undefined {
  if (!raw) return undefined;
  return ZONA_TEXT_MAP[normalize(raw)];
}

/**
 * El Excel real trae algunas filas inconsistentes (p.ej. la comuna 12 aparece
 * tanto en "ZONA CENTRO" como en "ZONA SUR-ORIENTE" según la fila). Estas
 * correcciones fuerzan la zona correcta por número de comuna, sin importar
 * qué diga la columna ZONA de esa fila en particular — se aplican a
 * cualquier fuente de datos (Excel subido, Google Sheets o el dataset por
 * defecto) para que el mapa sea siempre consistente.
 */
const COMUNA_ZONA_OVERRIDE: Record<number, ZonaKey> = {
  12: 'Zona Centro',
};

function resolveZona(zonaTexto: string, comunaNumero: number | null): ZonaKey | undefined {
  if (comunaNumero !== null && COMUNA_ZONA_OVERRIDE[comunaNumero]) {
    return COMUNA_ZONA_OVERRIDE[comunaNumero];
  }
  return normalizeZona(zonaTexto);
}

export function extractComunaNumero(raw: unknown): number | null {
  if (typeof raw === 'number') return raw;
  const match = String(raw ?? '').match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export class ExcelFormatError extends Error {}
export class SheetFetchError extends Error {}

export interface ParsedSheetResult {
  records: AllyRecord[];
  accionesPorZona: Partial<Record<ZonaKey, string>>;
}

/** Busca, dentro de un workbook, la hoja "Copia de ZONAS" (o "ZONAS" como
 *  respaldo); si no existe ninguna, usa la primera hoja del archivo. */
function pickSheet(workbook: XLSX.WorkBook): XLSX.WorkSheet {
  const byName = (target: string) =>
    workbook.SheetNames.find((n) => normalize(n) === normalize(target));
  const name = byName('Copia de ZONAS') ?? byName('ZONAS') ?? workbook.SheetNames[0];
  return workbook.Sheets[name];
}

/** Convierte un workbook (Excel real, CSV de Google Sheets, etc.) ya cargado
 *  en los registros ZONA/COMUNA/ALIADOS + el mensaje de "acciones
 *  desarrolladas" por zona (última columna, sin encabezado en el Excel real). */
function workbookToResult(workbook: XLSX.WorkBook): ParsedSheetResult {
  const sheet = pickSheet(workbook);
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

  if (rows.length === 0) {
    throw new ExcelFormatError('La hoja no tiene filas de datos.');
  }

  const headerRow = rows[0].map((h) => normalize(String(h ?? '')));
  const zonaIdx = headerRow.findIndex((h) => h === 'ZONA' || h === 'ZONA EDUCATIVA');
  const comunaIdx = headerRow.findIndex((h) => h === 'COMUNA');
  const aliadoIdx = headerRow.findIndex((h) => h === 'ALIADOS' || h === 'ALIADO');

  if (zonaIdx === -1 || comunaIdx === -1 || aliadoIdx === -1) {
    throw new ExcelFormatError(
      `La hoja debe tener las columnas ZONA, COMUNA y ALIADOS. Encabezados encontrados: ${rows[0].join(', ')}`
    );
  }
  // La columna de "acciones desarrolladas" no trae encabezado en el Excel real:
  // es la columna inmediatamente a la derecha de ALIADOS.
  const accionesIdx = aliadoIdx + 1;

  const records: AllyRecord[] = [];
  const accionesPorZona: Partial<Record<ZonaKey, string>> = {};

  for (const row of rows.slice(1)) {
    const zonaTexto = String(row[zonaIdx] ?? '').trim();
    const comunaRaw = row[comunaIdx];
    const aliadoTexto = String(row[aliadoIdx] ?? '').trim();
    const accionesTexto = accionesIdx < row.length ? String(row[accionesIdx] ?? '').trim() : '';

    if (!zonaTexto && !aliadoTexto) continue;

    const zona = resolveZona(zonaTexto, extractComunaNumero(comunaRaw));
    if (!zona || !aliadoTexto) continue;

    const comunaNumero = extractComunaNumero(comunaRaw);
    records.push({ zona, comunaNumero, aliado: aliadoTexto });

    if (accionesTexto && !accionesPorZona[zona]) {
      accionesPorZona[zona] = accionesTexto;
    }
  }

  if (records.length === 0) {
    throw new ExcelFormatError('No se encontraron filas válidas (con ZONA y ALIADOS) en la hoja.');
  }

  return { records, accionesPorZona };
}

/** Lee un archivo Excel (.xlsx/.xls) usando la hoja "Copia de ZONAS" */
export async function parseExcelFile(file: File): Promise<ParsedSheetResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  return workbookToResult(workbook);
}

/**
 * Descarga y parsea datos publicados en Google Sheets (o cualquier URL que
 * devuelva CSV), para el botón "Actualizar". La hoja debe estar publicada
 * como "Cualquiera con el enlace puede ver" y se debe usar la URL de
 * exportación CSV, por ejemplo:
 *   https://docs.google.com/spreadsheets/d/<ID>/export?format=csv&gid=<GID>
 */
export async function fetchRecordsFromSheetUrl(url: string): Promise<ParsedSheetResult> {
  let response: Response;
  try {
    response = await fetch(url, { cache: 'no-store' });
  } catch (e) {
    throw new SheetFetchError(
      'No se pudo conectar con Google Sheets. Verifica tu conexión a internet y que la hoja esté compartida como "Cualquiera con el enlace puede ver".'
    );
  }
  if (!response.ok) {
    throw new SheetFetchError(
      `Google Sheets respondió con un error (HTTP ${response.status}). Verifica la URL y los permisos de la hoja.`
    );
  }
  const csvText = await response.text();
  if (!csvText.trim()) {
    throw new SheetFetchError('La hoja no devolvió contenido. Verifica la URL configurada.');
  }
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(csvText, { type: 'string' });
  } catch (e) {
    throw new SheetFetchError('No se pudo interpretar la respuesta de Google Sheets como una tabla CSV.');
  }
  return workbookToResult(workbook);
}

/** Agrupa los registros por Zona Educativa, incorporando el mensaje de
 *  "acciones desarrolladas" de esa zona si existe. */
export function aggregateByZona(
  records: AllyRecord[],
  accionesPorZona: Partial<Record<ZonaKey, string>> = {}
): Map<ZonaKey, ZonaAggregate> {
  const map = new Map<ZonaKey, ZonaAggregate>();

  for (const r of records) {
    const zona = (normalizeZona(r.zona) ?? (r.zona as ZonaKey)) as ZonaKey;
    if (!zona) continue;

    if (!map.has(zona)) {
      map.set(zona, {
        zona,
        totalIntervenciones: 0,
        items: [],
        aliadoCounts: {},
        acciones: accionesPorZona[zona] ?? null,
      });
    }

    const agg = map.get(zona)!;
    agg.totalIntervenciones += 1;
    agg.items.push({ aliado: r.aliado, comunaNumero: r.comunaNumero });
    agg.aliadoCounts[r.aliado] = (agg.aliadoCounts[r.aliado] || 0) + 1;
  }

  return map;
}

/**
 * Dataset real por defecto, extraído de la hoja "Copia de ZONAS" de
 * "INFORMACION DE ALIADOS POR ZONA EDUCATIVA.xlsx" (73 registros).
 * Se usa mientras el usuario no cargue un archivo nuevo ni presione "Actualizar".
 */
export function buildDefaultDataset(): ParsedSheetResult {
  const data = defaultData as { records: AllyRecord[]; acciones: Record<string, string> };
  const accionesPorZona: Partial<Record<ZonaKey, string>> = {};
  for (const [zona, msg] of Object.entries(data.acciones)) {
    const key = normalizeZona(zona) ?? (zona as ZonaKey);
    accionesPorZona[key] = msg;
  }
  const records = data.records.map((r) => ({
    ...r,
    zona: resolveZona(r.zona, r.comunaNumero) ?? r.zona,
  }));
  return { records, accionesPorZona };
}
