import { ZonaGeometry, ComunaLabel, ZonaKey } from '../types';

/**
 * GEOMETRÍA POR ZONA EDUCATIVA
 * ------------------------------------------------------------------
 * El mapa ya no dibuja un polígono por comuna: las 22 siluetas reales
 * (extraídas por visión por computador del mapa oficial, ver commits
 * anteriores) se fusionaron por Zona Educativa — uniendo los píxeles de
 * las comunas de cada zona y cerrando las costuras que dejaban las
 * antiguas líneas divisorias entre comunas — para obtener un único
 * polígono (o varios, si la zona no es geográficamente contigua, como
 * Zona Sur) por zona. Los números de comuna se conservan como simples
 * etiquetas de referencia sobre la zona a la que pertenecen.
 * ------------------------------------------------------------------
 */

export const VIEWBOX = '0 0 700 758';

export const ZONA_COLORS: Record<ZonaKey, { fill: string; ring: string; text: string }> = {
  'Zona Norte': { fill: '#D1D5DB', ring: '#9CA3AF', text: '#1F2937' },
  'Zona Nororiente': { fill: '#FEF08A', ring: '#EAB308', text: '#1F2937' },
  'Zona Centro': { fill: '#DDD6FE', ring: '#8B5CF6', text: '#1F2937' },
  'Zona Suroriente': { fill: '#A5F3FC', ring: '#06B6D4', text: '#1F2937' },
  'Zona Oriente': { fill: '#FBCFE8', ring: '#EC4899', text: '#1F2937' },
  'Zona Sur': { fill: '#BBF7D0', ring: '#22C55E', text: '#1F2937' },
};

export const ZONA_ORDER: ZonaKey[] = [
  'Zona Norte',
  'Zona Nororiente',
  'Zona Centro',
  'Zona Suroriente',
  'Zona Oriente',
  'Zona Sur',
];

/**
 * Colores de badges por entidad aliada.
 * ------------------------------------------------------------------
 * El filtro de "Aliado" del sidebar y la leyenda de "Entidades aliadas"
 * DEBEN mostrar exactamente el mismo listado (el usuario lo pidió
 * explícitamente), así que el color ya no se asigna por categoría fija ni
 * por palabra clave: se reparte un color distinto de esta paleta a cada
 * nombre de aliado que exista realmente en los datos cargados, en el mismo
 * orden (alfabético) en que aparecen en el filtro. Así, sin importar qué
 * traiga el próximo Excel, cualquier aliado nuevo queda incluido
 * automáticamente tanto en el filtro como en la leyenda, con su propio color.
 */
const ALIADO_PALETTE: string[] = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#7C3AED',
  '#0891B2', '#65A30D', '#DC2626', '#DB2777', '#9333EA', '#0D9488',
];

export const ALIADO_COLOR_DEFAULT = '#64748B';

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeAliadoKey(nombre: string): string {
  return stripAccents(nombre.trim().toLowerCase());
}

/**
 * Construye el color de cada aliado a partir de la lista COMPLETA de
 * aliados disponibles (la misma que llena el filtro del sidebar), para que
 * no haya dos aliados distintos con el mismo color mientras alcance la
 * paleta. Se ordena alfabéticamente primero para que la asignación sea
 * estable entre re-renders con la misma lista de datos.
 */
export function buildAliadoColorMap(aliados: string[]): Map<string, string> {
  const unicos = Array.from(new Set(aliados.map((a) => a.trim()))).sort((a, b) =>
    normalizeAliadoKey(a).localeCompare(normalizeAliadoKey(b))
  );
  const map = new Map<string, string>();
  unicos.forEach((nombre, i) => {
    map.set(nombre, ALIADO_PALETTE[i % ALIADO_PALETTE.length]);
  });
  return map;
}

/** Color de respaldo cuando se pinta un badge sin tener a mano el mapa
 *  completo de colores (debería ser la excepción, no la regla). */
export function colorForAliado(nombre: string): string {
  const norm = normalizeAliadoKey(nombre);
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash * 31 + norm.charCodeAt(i)) >>> 0;
  }
  return ALIADO_PALETTE[hash % ALIADO_PALETTE.length] ?? ALIADO_COLOR_DEFAULT;
}

const ZONA_PATHS: Record<ZonaKey, string> = {
  'Zona Norte': 'M 411.0,55.0 L 370.0,70.0 L 360.0,85.0 L 285.0,56.0 L 281.0,80.0 L 247.0,81.0 L 242.0,87.0 L 283.0,131.0 L 262.0,190.0 L 240.0,188.0 L 218.0,230.0 L 151.0,196.0 L 132.0,229.0 L 101.0,226.0 L 85.0,211.0 L 56.0,219.0 L 15.0,184.0 L 50.0,220.0 L 50.0,236.0 L 73.0,252.0 L 161.0,262.0 L 182.0,290.0 L 163.0,311.0 L 172.0,346.0 L 190.0,341.0 L 172.0,401.0 L 124.0,416.0 L 127.0,433.0 L 153.0,409.0 L 167.0,416.0 L 162.0,478.0 L 207.0,472.0 L 208.0,458.0 L 227.0,452.0 L 258.0,359.0 L 285.0,327.0 L 260.0,320.0 L 242.0,299.0 L 261.0,284.0 L 293.0,281.0 L 285.0,252.0 L 321.0,238.0 L 313.0,201.0 L 362.0,125.0 L 385.0,112.0 Z',
  'Zona Nororiente': 'M 427.0,24.0 L 426.0,35.0 L 416.0,38.0 L 414.0,53.0 L 387.0,96.0 L 387.0,112.0 L 365.0,123.0 L 335.0,166.0 L 320.0,197.0 L 313.0,202.0 L 322.0,233.0 L 355.0,222.0 L 368.0,235.0 L 453.0,242.0 L 456.0,249.0 L 442.0,275.0 L 459.0,279.0 L 478.0,272.0 L 501.0,251.0 L 503.0,237.0 L 496.0,201.0 L 506.0,191.0 L 508.0,180.0 L 503.0,152.0 L 491.0,138.0 L 489.0,122.0 L 478.0,112.0 L 469.0,67.0 L 436.0,42.0 L 436.0,24.0 Z',
  'Zona Centro': 'M 456.0,244.0 L 368.0,237.0 L 361.0,232.0 L 358.0,223.0 L 323.0,234.0 L 317.0,242.0 L 286.0,251.0 L 293.0,279.0 L 287.0,283.0 L 261.0,286.0 L 241.0,302.0 L 260.0,318.0 L 283.0,325.0 L 308.0,312.0 L 347.0,307.0 L 354.0,314.0 L 354.0,322.0 L 369.0,340.0 L 369.0,344.0 L 379.0,344.0 L 390.0,356.0 L 406.0,341.0 Z',
  'Zona Suroriente': 'M 470.0,387.0 L 462.0,381.0 L 449.0,380.0 L 431.0,391.0 L 423.0,390.0 L 403.0,409.0 L 397.0,409.0 L 384.0,395.0 L 387.0,387.0 L 376.0,374.0 L 376.0,369.0 L 389.0,357.0 L 359.0,332.0 L 352.0,314.0 L 342.0,308.0 L 304.0,315.0 L 280.0,332.0 L 273.0,352.0 L 260.0,359.0 L 242.0,415.0 L 308.0,439.0 L 298.0,509.0 L 310.0,499.0 L 355.0,508.0 L 381.0,491.0 L 402.0,452.0 L 429.0,431.0 L 437.0,419.0 L 470.0,402.0 Z',
  'Zona Oriente': 'M 500.0,253.0 L 477.0,274.0 L 458.0,281.0 L 440.0,277.0 L 408.0,341.0 L 376.0,371.0 L 387.0,384.0 L 384.0,393.0 L 400.0,410.0 L 421.0,390.0 L 429.0,391.0 L 437.0,383.0 L 454.0,377.0 L 466.0,381.0 L 473.0,395.0 L 486.0,400.0 L 486.0,418.0 L 499.0,433.0 L 500.0,453.0 L 508.0,456.0 L 535.0,450.0 L 535.0,438.0 L 543.0,429.0 L 537.0,405.0 L 554.0,383.0 L 555.0,362.0 L 563.0,347.0 L 563.0,335.0 L 556.0,329.0 L 554.0,309.0 L 536.0,293.0 L 511.0,290.0 L 501.0,279.0 Z',
  'Zona Sur': 'M 242.0,417.0 L 229.0,451.0 L 210.0,456.0 L 206.0,474.0 L 144.0,481.0 L 145.0,497.0 L 137.0,507.0 L 152.0,539.0 L 145.0,579.0 L 158.0,592.0 L 172.0,590.0 L 185.0,598.0 L 200.0,589.0 L 225.0,615.0 L 217.0,627.0 L 219.0,634.0 L 207.0,644.0 L 187.0,695.0 L 192.0,738.0 L 263.0,732.0 L 284.0,724.0 L 294.0,727.0 L 298.0,615.0 L 312.0,606.0 L 339.0,611.0 L 338.0,507.0 L 299.0,498.0 L 305.0,436.0 Z M 188.0,341.0 L 183.0,338.0 L 173.0,344.0 L 167.0,341.0 L 161.0,344.0 L 161.0,352.0 L 155.0,356.0 L 144.0,356.0 L 135.0,352.0 L 132.0,358.0 L 118.0,376.0 L 115.0,411.0 L 118.0,410.0 L 124.0,414.0 L 128.0,412.0 L 132.0,413.0 L 135.0,410.0 L 140.0,409.0 L 146.0,403.0 L 154.0,400.0 L 166.0,407.0 L 169.0,406.0 L 170.0,396.0 L 178.0,376.0 L 181.0,358.0 L 184.0,350.0 L 188.0,346.0 Z',
};

const ZONA_ANCHORS: Record<ZonaKey, { x: number; y: number }> = {
  'Zona Norte': { x: 321.0, y: 115.0 },
  'Zona Nororiente': { x: 428.0, y: 169.0 },
  'Zona Centro': { x: 385.0, y: 283.0 },
  'Zona Suroriente': { x: 322.0, y: 382.0 },
  'Zona Oriente': { x: 505.0, y: 343.0 },
  'Zona Sur': { x: 240.0, y: 534.0 },
};

export const ZONA_GEOMETRY: ZonaGeometry[] = (Object.keys(ZONA_PATHS) as ZonaKey[]).map((zona) => ({
  zona,
  path: ZONA_PATHS[zona],
  anchorX: ZONA_ANCHORS[zona].x,
  anchorY: ZONA_ANCHORS[zona].y,
}));

/** Números de comuna dibujados como referencia sobre su Zona Educativa */
export const COMUNA_LABELS: ComunaLabel[] = [
  { numero: 1, zona: 'Zona Norte', x: 159.0, y: 230.0 },
  { numero: 2, zona: 'Zona Norte', x: 321.0, y: 114.0 },
  { numero: 3, zona: 'Zona Norte', x: 264.0, y: 261.0 },
  { numero: 4, zona: 'Zona Nororiente', x: 355.0, y: 191.0 },
  { numero: 5, zona: 'Zona Nororiente', x: 423.0, y: 165.0 },
  { numero: 6, zona: 'Zona Nororiente', x: 434.0, y: 76.0 },
  { numero: 7, zona: 'Zona Nororiente', x: 470.0, y: 218.0 },
  { numero: 8, zona: 'Zona Centro', x: 359.0, y: 268.0 },
  { numero: 9, zona: 'Zona Centro', x: 276.0, y: 303.0 },
  { numero: 10, zona: 'Zona Suroriente', x: 271.0, y: 401.0 },
  { numero: 11, zona: 'Zona Suroriente', x: 345.0, y: 359.0 },
  { numero: 12, zona: 'Zona Centro', x: 388.0, y: 322.0 },
  { numero: 13, zona: 'Zona Oriente', x: 432.0, y: 355.0 },
  { numero: 14, zona: 'Zona Oriente', x: 500.0, y: 360.0 },
  { numero: 15, zona: 'Zona Suroriente', x: 368.0, y: 471.0 },
  { numero: 16, zona: 'Zona Suroriente', x: 367.0, y: 410.0 },
  { numero: 17, zona: 'Zona Sur', x: 269.0, y: 537.0 },
  { numero: 18, zona: 'Zona Sur', x: 179.0, y: 514.0 },
  { numero: 19, zona: 'Zona Norte', x: 205.0, y: 409.0 },
  { numero: 20, zona: 'Zona Sur', x: 135.0, y: 387.0 },
  { numero: 21, zona: 'Zona Oriente', x: 518.0, y: 428.0 },
  { numero: 22, zona: 'Zona Sur', x: 248.0, y: 681.0 },
];

/**
 * CORREGIMIENTOS / ÁREA RURAL
 * ------------------------------------------------------------------
 * Igual que antes: se representan como pines alrededor de la silueta
 * urbana (el mapa oficial no trae su silueta detallada). Cada pin
 * pertenece a una Zona Educativa y, al hacer clic, abre la burbuja de
 * ESA zona (ya no hay datos independientes por corregimiento).
 * ------------------------------------------------------------------
 */
export interface RuralPin {
  id: string;
  label: string;
  zona: ZonaKey;
  x: number;
  y: number;
}

export const RURAL_PINS: RuralPin[] = [
  { id: 'golondrinas', label: 'Golondrinas', zona: 'Zona Norte', x: 330, y: 18 },
  { id: 'montebello', label: 'Montebello', zona: 'Zona Norte', x: 205, y: 55 },
  { id: 'rural-norte', label: 'Rural Norte', zona: 'Zona Norte', x: 95, y: 130 },
  { id: 'pichinde', label: 'Pichindé', zona: 'Zona Sur', x: 15, y: 260 },
  { id: 'los-andes', label: 'Los Andes', zona: 'Zona Sur', x: 12, y: 340 },
  { id: 'villacarmelo', label: 'Villacarmelo', zona: 'Zona Sur', x: 15, y: 420 },
  { id: 'la-buitrera', label: 'La Buitrera', zona: 'Zona Sur', x: 35, y: 505 },
  { id: 'rural-sur', label: 'Rural Sur', zona: 'Zona Sur', x: 20, y: 625 },
  { id: 'felidia', label: 'Felidia', zona: 'Zona Norte', x: 20, y: 565 },
  { id: 'la-leonera', label: 'La Leonera', zona: 'Zona Norte', x: 20, y: 685 },
  { id: 'pance', label: 'Pance', zona: 'Zona Sur', x: 110, y: 745 },
  { id: 'navarro', label: 'Navarro', zona: 'Zona Sur', x: 625, y: 350 },
];

const RURAL_CODE_TO_ZONA: Record<number, ZonaKey> = {
  51: 'Zona Sur', // Navarro
  53: 'Zona Sur', // Pance
  54: 'Zona Sur', // La Buitrera
  56: 'Zona Sur', // Los Andes
  57: 'Zona Sur', // Pichindé
  58: 'Zona Norte', // La Leonera
  59: 'Zona Norte', // Felidia
  65: 'Zona Norte', // Golondrinas
};

/** Resuelve a qué Zona Educativa pertenece un número de comuna (urbana 1-22
 *  o código rural >22 usado en el Excel), para inferir la zona cuando una
 *  fila no la trae explícita. */
export function zonaForComunaNumero(numero: number): ZonaKey | undefined {
  const urbana = COMUNA_LABELS.find((c) => c.numero === numero);
  if (urbana) return urbana.zona;
  return RURAL_CODE_TO_ZONA[numero];
}
