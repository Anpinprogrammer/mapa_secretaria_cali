import React, { useRef } from 'react';
import { Search, Upload, RefreshCw, RotateCcw, Save } from 'lucide-react';
import { ZONA_ORDER } from '../data/zonasComunas';
import { ZonaKey } from '../types';

interface SidebarProps {
  zonaFiltro: ZonaKey | 'Todas';
  onZonaChange: (z: ZonaKey | 'Todas') => void;
  aliadoFiltro: string | 'Todos';
  aliadosDisponibles: string[];
  onAliadoChange: (a: string | 'Todos') => void;
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  onResetFiltros: () => void;
  onCargarExcel: (file: File) => void;
  onActualizar: () => void;
  onRestablecerDatos: () => void;
  totalRegistros: number;
  cargando?: boolean;
  actualizando?: boolean;
  ultimaActualizacion?: string | null;
  usandoDatosGuardados?: boolean;
  error?: string | null;
}

export function Sidebar({
  zonaFiltro,
  onZonaChange,
  aliadoFiltro,
  aliadosDisponibles,
  onAliadoChange,
  busqueda,
  onBusquedaChange,
  onResetFiltros,
  onCargarExcel,
  onActualizar,
  onRestablecerDatos,
  totalRegistros,
  cargando,
  actualizando,
  ultimaActualizacion,
  usandoDatosGuardados,
  error,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="flex h-full w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-white/20 bg-white/60 p-4 shadow-sm backdrop-blur-md">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Mapa Institucional</h2>
        <p className="text-xs text-slate-500">Distrito de Santiago de Cali</p>
      </div>

      <div className="rounded-xl bg-slate-100/80 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
        {totalRegistros} registro(s) cargados
        {usandoDatosGuardados && (
          <span className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600">
            <Save size={12} /> Guardado en este navegador
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Búsqueda */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
          Buscar IEO o comuna
        </label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Ej: Santa Librada, Comuna 5..."
            className="w-full rounded-lg border border-slate-300/70 bg-white/80 py-2 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600/70 dark:bg-slate-800/70 dark:text-slate-100 dark:focus:ring-indigo-900"
          />
        </div>
      </div>

      {/* Filtro por zona */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
          Zona educativa
        </label>
        <select
          value={zonaFiltro}
          onChange={(e) => onZonaChange(e.target.value as ZonaKey | 'Todas')}
          className="w-full rounded-lg border border-slate-300/70 bg-white/80 px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600/70 dark:bg-slate-800/70 dark:text-slate-100"
        >
          <option value="Todas">Todas las zonas</option>
          {ZONA_ORDER.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro por aliado */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
          Aliado / Entidad
        </label>
        <select
          value={aliadoFiltro}
          onChange={(e) => onAliadoChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300/70 bg-white/80 px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600/70 dark:bg-slate-800/70 dark:text-slate-100"
        >
          <option value="Todos">Todos los aliados</option>
          {aliadosDisponibles.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-slate-200/70 pt-4 dark:border-slate-700/70">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onCargarExcel(file);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={cargando}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
        >
          <Upload size={15} />
          {cargando ? 'Cargando…' : 'Cargar nuevo Excel'}
        </button>
        <button
          onClick={onActualizar}
          disabled={actualizando}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300/70 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-60 dark:border-slate-600/70 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw size={15} className={actualizando ? 'animate-spin' : ''} />
          {actualizando ? 'Actualizando…' : 'Actualizar'}
        </button>
        {ultimaActualizacion && (
          <p className="text-center text-[11px] text-slate-400">
            Última actualización: {ultimaActualizacion}
          </p>
        )}
        {usandoDatosGuardados && (
          <button
            onClick={onRestablecerDatos}
            className="text-center text-[11px] text-slate-400 underline decoration-dotted transition hover:text-slate-600"
          >
            Restablecer al Excel original
          </button>
        )}
        <button
          onClick={onResetFiltros}
          className="flex items-center justify-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-700/60"
        >
          <RotateCcw size={14} />
          Restablecer filtros
        </button>
      </div>
    </aside>
  );
}
