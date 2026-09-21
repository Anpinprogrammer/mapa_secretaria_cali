import React from 'react';
import { colorForAliado } from '../data/zonasComunas';

interface AllyBadgeProps {
  nombre: string;
  count?: number;
}

/** Etiqueta de color intenso para una entidad aliada (Salud, Policía, ICBF, etc.) */
export function AllyBadge({ nombre, count }: AllyBadgeProps) {
  const color = colorForAliado(nombre);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm"
      style={{ backgroundColor: color }}
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
