import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';

/**
 * Datos de la fase de atención inmediata (línea de emergencia). Es
 * información fija/institucional, no viene del Excel de aliados, así que se
 * deja como contenido estático aquí mismo.
 */
const LINEA_SED_ITEMS: Array<{ label: string; value: number }> = [
  { label: 'Directivos Docentes', value: 3 },
  { label: 'Docentes', value: 41 },
  { label: 'Estudiantes con auto reporte o reportados por sus familias', value: 108 },
  { label: 'Funcionarios del nivel central SED', value: 2 },
  { label: 'Personal administrativo de IE', value: 1 },
  { label: 'Padres, madres, cuidadores o familias', value: 78 },
];

/** Botón desplegable en la esquina superior derecha del mapa con la
 *  información de la Fase de Atención Inmediata (línea de emergencia). */
export function FaseAtencionPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute right-3 top-3 z-30 flex max-w-[85vw] flex-col items-end">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-red-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-md backdrop-blur transition hover:bg-red-50"
        aria-expanded={open}
      >
        <AlertTriangle size={13} />
        1. Fase de Atención Inmediata
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="mt-2 max-h-[70vh] w-80 max-w-full overflow-y-auto rounded-2xl border border-red-100 bg-white/95 p-4 text-xs shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-start justify-between gap-2">
            <p className="flex items-start gap-1.5 font-bold leading-snug text-red-700">
              🚨 FASE DE ATENCIÓN INMEDIATA MEDIANTE LÍNEA DE EMERGENCIA
            </p>
            <button
              onClick={() => setOpen(false)}
              className="flex-shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mb-4">
            <p className="mb-1 font-semibold text-slate-800">📚 LÍNEA DE EMERGENCIA SED</p>
            <p className="mb-2 leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-800">234 personas</span> recibieron apoyo
              psicosocial/emocional. Atención psicosocial/primeros auxilios psicológicos a través
              de línea de emergencia.
            </p>
            <ul className="space-y-1">
              {LINEA_SED_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1"
                >
                  <span className="text-slate-600">{item.label}</span>
                  <span className="flex-shrink-0 font-semibold text-slate-800">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-1 font-semibold text-slate-800">
              📞 LÍNEA 106 SECRETARÍA DISTRITAL DE SALUD
            </p>
            <p className="leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-800">105 estudiantes</span> recibieron
              apoyo psicosocial/emocional y activación de rutas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
