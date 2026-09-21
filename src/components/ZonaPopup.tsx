import React, { useMemo, useState } from 'react';
import { X, Users, Megaphone, HeartHandshake } from 'lucide-react';
import { ZonaKey, ZonaAggregate } from '../types';
import { ZONA_COLORS } from '../data/zonasComunas';
import { AllyBadge } from './AllyBadge';

interface PopupAnchor {
  x: number;
  y: number;
  placement: 'above' | 'below';
}

interface ZonaPopupProps {
  zona: ZonaKey;
  aggregate: ZonaAggregate | undefined;
  anchor: PopupAnchor | null;
  /** Alto fijo (px) de la burbuja; el contenido interno hace scroll si no cabe */
  height?: number;
  onClose: () => void;
}

type Tab = 'aliados' | 'acciones';

/** Burbuja emergente con el detalle de una Zona Educativa completa. Altura FIJA
 *  (no crece con el contenido): el encabezado, las pestañas y el botón cerrar
 *  siempre son visibles; solo el cuerpo de cada pestaña hace scroll interno. */
export function ZonaPopup({ zona, aggregate, anchor, height = 380, onClose }: ZonaPopupProps) {
  const [tab, setTab] = useState<Tab>('aliados');
  const zonaColor = ZONA_COLORS[zona];
  const placement = anchor?.placement ?? 'above';

  const grupos = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const item of aggregate?.items ?? []) {
      if (!map.has(item.aliado)) map.set(item.aliado, new Set());
      if (item.comunaNumero !== null) map.get(item.aliado)!.add(item.comunaNumero);
    }
    return Array.from(map.entries()).map(([aliado, comunas]) => ({
      aliado,
      comunas: Array.from(comunas).sort((a, b) => a - b),
    }));
  }, [aggregate]);

  const content = (
    <div
      className="flex w-80 max-w-[90vw] flex-col rounded-2xl border border-white/30 bg-white/95 shadow-2xl backdrop-blur-xl"
      style={{ height: `${height}px` }}
    >
      <div className="flex flex-shrink-0 items-start justify-between gap-2 p-4 pb-2">
        <div>
          <p
            className="mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: zonaColor.fill, color: zonaColor.text }}
          >
            {zona}
          </p>
          <h3 className="text-base font-semibold text-slate-800">{zona}</h3>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-shrink-0 gap-1 px-4">
        <button
          onClick={() => setTab('aliados')}
          className={`flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition ${
            tab === 'aliados'
              ? 'bg-slate-100 text-slate-800'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <HeartHandshake size={13} /> Aliados
        </button>
        <button
          onClick={() => setTab('acciones')}
          className={`flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition ${
            tab === 'acciones'
              ? 'bg-slate-100 text-slate-800'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Megaphone size={13} /> Acciones desarrolladas
        </button>
      </div>

      <div className="mx-4 h-px flex-shrink-0 bg-slate-200" />

      {!aggregate || aggregate.totalIntervenciones === 0 ? (
        <p className="px-4 py-4 text-sm text-slate-500">
          Sin intervenciones registradas para esta zona con los filtros actuales.
        </p>
      ) : tab === 'aliados' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3">
          <div className="mb-3 flex flex-shrink-0 items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-2 text-sm">
            <Users size={16} className="text-slate-500" />
            <span className="font-semibold text-slate-800">{aggregate.totalIntervenciones}</span>
            <span className="text-slate-500">intervenciones registradas</span>
          </div>
          <div className="space-y-2">
            {grupos.map(({ aliado, comunas }) => (
              <div key={aliado} className="rounded-lg border border-slate-200/70 p-2">
                <AllyBadge nombre={aliado} />
                {comunas.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {comunas.length === 1 ? 'Comuna' : 'Comunas'}:{' '}
                    {comunas.map((c) => `#${c}`).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3">
          {aggregate.acciones ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {aggregate.acciones}
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              No hay acciones desarrolladas registradas todavía para esta zona.
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (!anchor) {
    return <div className="fixed bottom-4 right-4 z-40">{content}</div>;
  }

  return (
    <div
      className="pointer-events-auto absolute z-40"
      style={{
        left: anchor.x,
        top: anchor.y,
        transform: placement === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0%)',
      }}
    >
      {content}
    </div>
  );
}
