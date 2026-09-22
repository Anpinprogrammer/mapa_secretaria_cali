import { AllyRecord, ZonaKey } from '../types';

/**
 * Persistencia LOCAL (por navegador/dispositivo) del último dataset cargado
 * manualmente (Excel) o traído con "Actualizar" (Google Sheets).
 *
 * Por qué existe: la app es un sitio estático (Vite) sin backend ni base de
 * datos, así que no hay ningún servidor donde "guardar" el Excel subido. Sin
 * esto, al refrescar o volver a abrir la pestaña, React se reinicia desde
 * cero y solo queda el dataset por defecto embebido en el build.
 *
 * Con esto, el navegador recuerda el último dataset cargado y lo restaura
 * automáticamente al volver a abrir la app — pero SOLO en ese navegador /
 * dispositivo. No es un dataset compartido entre distintas personas que
 * visiten el sitio: para eso hace falta una fuente central real, como la
 * hoja de Google Sheets que ya usa el botón "Actualizar", o un backend.
 */

const STORAGE_KEY = 'cali-educational-map:dataset:v1';

export interface StoredDataset {
  records: AllyRecord[];
  accionesPorZona: Partial<Record<ZonaKey, string>>;
  datasetLabel: string;
  savedAt: string; // ISO date
}

export function saveDatasetToLocalCache(data: Omit<StoredDataset, 'savedAt'>): void {
  try {
    const payload: StoredDataset = { ...data, savedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // localStorage puede fallar (modo privado, cuota excedida, SSR, etc.);
    // no es crítico para el funcionamiento de la app, así que se ignora.
    console.warn('No se pudo guardar el dataset en el almacenamiento local del navegador:', e);
  }
}

export function loadDatasetFromLocalCache(): StoredDataset | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDataset;
    if (!Array.isArray(parsed.records)) return null;
    return parsed;
  } catch (e) {
    console.warn('No se pudo leer el dataset guardado localmente:', e);
    return null;
  }
}

export function clearDatasetLocalCache(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // no-op
  }
}
