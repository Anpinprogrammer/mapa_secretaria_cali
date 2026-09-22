import React from 'react';
import { ZONA_COLORS, ZONA_ORDER } from '../data/zonasComunas';

interface LegendProps {
  /** Mismo listado (y mismo orden) que llena el filtro "Aliado / Entidad" del sidebar */
  aliados: string[];
  /** Mapa nombre → color, construido a partir de ese mismo listado */
  aliadoColorMap: Map<string, string>;
}

/** Leyenda de zonas educativas (color de fondo) y entidades aliadas (color de badge).
 *  El listado de aliados es exactamente el mismo que el filtro del sidebar: se
 *  recibe como prop en vez de estar fijo, para incluir siempre a todos. */
export function Legend({ aliados, aliadoColorMap }: LegendProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/20 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/50">
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          Zonas educativas
        </h3>
        <ul className="space-y-1.5">
          {ZONA_ORDER.map((zona) => (
            <li key={zona} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <span
                className="h-3.5 w-3.5 flex-shrink-0 rounded-sm border border-black/10"
                style={{ backgroundColor: ZONA_COLORS[zona].fill }}
              />
              {zona}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          Entidades aliadas
        </h3>
        <ul className="flex flex-wrap gap-1.5">
          {aliados.map((nombre) => (
            <li
              key={nombre}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
              style={{ backgroundColor: aliadoColorMap.get(nombre) }}
              title={nombre}
            >
              {nombre}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
