/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL de exportación CSV de la hoja de Google Sheets usada por el botón "Actualizar" */
  readonly VITE_SHEET_CSV_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
