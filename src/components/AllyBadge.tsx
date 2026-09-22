import React from 'react';
import { colorForAliado } from '../data/zonasComunas';

interface AllyBadgeProps {
  nombre: string;
  count?: number;
  /** Color explícito (del mapa de colores construido con todos los aliados
   *  disponibles, para que coincida exactamente con el filtro/leyenda). Si
   *  se omite, cae a un color por hash sobre el nombre. */
  color?: string;
}

/** Etiqueta de color intenso para una entidad aliada (Salud, Policía, ICBF, etc.) */
export function AllyBadge({ nombre, count, color }: AllyBadgeProps) {
  const resolvedColor = color ?? colorForAliado(nombre);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm"
      style={{ backgroundColor: resolvedColor }}
      title={nombre}
    >
      {nombre}
      {typeof count === 'number' && (
        <span className="rounded-full bg-white/25 px-1.5 text-[10px] font-semibold">
          {count}
        </span>
      )}
    </span>
  );
}
