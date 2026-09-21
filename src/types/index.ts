// Tipos centrales de la aplicación de Mapa Institucional Educativo de Cali

export type ZonaKey =
  | 'Zona Norte'
  | 'Zona Nororiente'
  | 'Zona Centro'
  | 'Zona Suroriente'
  | 'Zona Oriente'
  | 'Zona Sur';

/** Una fila del Excel de aliados (hoja "Copia de ZONAS"), ya normalizada.
 *  El modelo es por ZONA: cada fila es un aliado interviniendo en una comuna
 *  de esa zona; ya no se maneja información por institución educativa. */
export interface AllyRecord {
  zona: string;
  comunaNumero: number | null;
  aliado: string;
}

/** Geometría (posiblemente multi-polígono) de una Zona Educativa completa,
 *  resultado de fusionar los polígonos de las comunas que la componen. */
export interface ZonaGeometry {
  zona: ZonaKey;
  /** Atributo "d" del <path> SVG; puede tener varios sub-paths (M...Z M...Z) si la zona no es contigua */
  path: string;
  /** Punto interior seguro para anclar la burbuja emergente */
  anchorX: number;
  anchorY: number;
}

/** Etiqueta de referencia con el número de una comuna urbana, dibujada sobre
 *  la zona correspondiente (ya no es una forma clickeable independiente) */
export interface ComunaLabel {
  numero: number;
  zona: ZonaKey;
  x: number;
  y: number;
}

/** Un aliado interviniendo en una comuna específica, para listar en la burbuja */
export interface AliadoEnComuna {
  aliado: string;
  comunaNumero: number | null;
}

/** Datos agregados por Zona Educativa, listos para pintar en la burbuja emergente */
export interface ZonaAggregate {
  zona: ZonaKey;
  totalIntervenciones: number;
  items: AliadoEnComuna[];
  aliadoCounts: Record<string, number>;
  /** Mensaje de "acciones desarrolladas" (columna final del Excel), si existe para la zona */
  acciones: string | null;
}
