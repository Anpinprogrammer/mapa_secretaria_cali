# Mapa Institucional Educativo — Distrito de Santiago de Cali

Aplicación React + TypeScript + Tailwind para explorar las 22 comunas urbanas
y los corregimientos rurales de Cali por Zona Educativa, con las
intervenciones de aliados estratégicos cargadas desde un archivo Excel.

## Instalación y ejecución

Este paquete es un proyecto completo (Vite + React + TypeScript + Tailwind),
listo para instalar y correr tal cual:

```bash
npm install
npm run dev       # abre http://localhost:5173
```

Otros scripts disponibles:

```bash
npm run build      # compila TypeScript y genera el build de producción en dist/
npm run preview    # sirve ese build de producción localmente
```

Se verificó que `npm install`, `npm run build` y `npm run dev` corren sin
errores antes de entregar este paquete.

## Uso

El punto de entrada es `src/App.tsx`, que ya monta el componente principal:

```tsx
import CaliEducationalMap from './components/CaliEducationalMap';

export default function App() {
  return <CaliEducationalMap />;
}
```

El componente ya trae un dataset de ejemplo. El usuario puede sustituirlo en
tiempo real con el botón **"Cargar nuevo Excel"** en el panel lateral, o
puedes precargar tu propio archivo por defecto pasando `initialRecords`:

```tsx
import { parseExcelFile } from './utils/excelParser';
```

Si vas a integrar `CaliEducationalMap.tsx` dentro de otro proyecto React ya
existente (en vez de usar este scaffold), solo necesitas copiar la carpeta
`src/` (menos `main.tsx`/`App.tsx`, que son específicos de este scaffold de
Vite) y asegurarte de tener Tailwind configurado con `tailwindcss-animate`
como plugin.

## Estructura del Excel esperado

La app lee específicamente la hoja llamada **"Copia de ZONAS"** del Excel (si
no existe, intenta con una hoja llamada "ZONAS" y, si tampoco existe, usa la
primera hoja). Esa hoja debe tener estas columnas, en este orden:

| ZONA | COMUNA | ALIADOS | *(sin encabezado)* |
|---|---|---|---|
| ZONA NOR-ORIENTE | 4 | Bienestar Social: Programa Familia y Niñez | 🚨 En el marco de la emergencia... |
| ZONA NOR-ORIENTE | 5 | CEPE (Comunidad de Empresarios por la Educación). | |

- `ZONA`: acepta las variantes reales del Excel ("ZONA NOR-ORIENTE", "ZONA
  SUR-ORIENTE", etc.) y las normaliza a la Zona Educativa correspondiente.
- `COMUNA`: el número de comuna (1–22) o el código usado para corregimientos
  rurales (51 Navarro, 53 Pance, 54 La Buitrera, 56 Los Andes, 57 Pichindé,
  58 La Leonera, 59 Felidia, 65 Golondrinas). Solo se usa como referencia — el
  mapa ya no dibuja un polígono por comuna, ver más abajo.
- `ALIADOS`: texto libre describiendo la entidad/programa aliado. El color del
  badge se asigna por palabra clave (ver `colorForAliado` en
  `src/data/zonasComunas.ts`), no por coincidencia exacta.
- La **cuarta columna (sin encabezado)**, inmediatamente a la derecha de
  `ALIADOS`, es el mensaje de "Acciones desarrolladas" de esa Zona Educativa
  (pestaña 2 de la burbuja). Solo hace falta una fila con ese mensaje por
  zona; si una zona no tiene ninguna, la pestaña muestra un aviso en vez del
  mensaje.
- **Corrección permanente**: la comuna 12 siempre se trata como Zona Centro,
  sin importar qué diga la columna `ZONA` en esa fila (el Excel real trae esa
  comuna con zona inconsistente entre filas). Ver `COMUNA_ZONA_OVERRIDE` en
  `src/utils/excelParser.ts` si necesitas agregar otra corrección similar.

## ⚠️ Nota sobre la geometría del mapa (actualizada — divisiones por zona)

La geometría de las 22 comunas se extrajo por visión por computador del mapa
real (`Comunas_de_Cali.png`), igual que antes. Pero ahora el mapa **ya no
dibuja un polígono clickeable por comuna**: los píxeles de las comunas que
pertenecen a la misma Zona Educativa se fusionaron en un único polígono por
zona (cerrando las costuras que dejaban las antiguas líneas divisorias entre
comunas), y ese es el que se colorea y se puede clickear. Zona Sur, al no ser
geográficamente contigua (la comuna 20 queda separada del resto por la
comuna 19, que es Zona Norte), se representa con dos sub-polígonos que
igual cuentan como una sola zona clickeable.

Los números de comuna (`COMUNA_LABELS` en `src/data/zonasComunas.ts`) se
conservan dibujados en su posición original, solo como **referencia visual**
de qué comuna cae en cada zona — ya no son formas independientes ni abren su
propia burbuja.

La zonificación se calculó a partir de tu Excel real (con la corrección de la
comuna 12 → Zona Centro explicada arriba), y ese archivo es el **dataset por
defecto** de la aplicación (73 registros reales, embebidos en
`src/data/aliadosPorZona.json`).

Los corregimientos rurales (Golondrinas, Montebello, Pichindé, Los Andes,
Villacarmelo, La Buitrera, Navarro, Pance, Rural Norte, Rural Sur, Felidia,
La Leonera) se representan como **pines** alrededor de la silueta urbana; al
hacer clic abren la burbuja de la Zona Educativa a la que pertenecen (no
tienen datos propios independientes).

## Funcionalidades incluidas

- Mapa SVG interactivo dividido por Zona Educativa (paleta pastel según
  especificación), con los números de comuna como referencia y los
  corregimientos rurales como pines — todo clickeable por zona.
- Burbuja/popup emergente al hacer clic en una zona (o en un pin rural), con
  **dos pestañas**:
  1. **Aliados**: total de intervenciones y cada entidad aliada agrupada con
     las comunas donde interviene dentro de esa zona.
  2. **Acciones desarrolladas**: el mensaje de la última columna del Excel
     para esa zona (o un aviso si no hay ninguno registrado).
  Altura fija con scroll interno, y se reposiciona automáticamente para no
  salirse de la pantalla.
- Sidebar con filtro por Zona Educativa, filtro por Aliado y búsqueda de
  texto libre (aliado, zona o "comuna N").
- Carga manual de un nuevo Excel (`xlsx`/`xls`, hoja "Copia de ZONAS") vía
  `sheetjs`, botón "Cargar nuevo Excel".
- **Botón "Actualizar"**: descarga la información directamente desde Google
  Sheets (en formato CSV) y refresca el mapa, para mantenerlo al día cada vez
  que alguien agregue una fila nueva en la hoja — sin tener que exportar y
  volver a subir el Excel a mano. Ver la sección siguiente para configurarlo.
- Botón "Restablecer filtros".

## Configurar el botón "Actualizar" (Google Sheets)

El botón "Actualizar" del sidebar necesita la URL de exportación CSV de tu
hoja de Google Sheets:

1. Abre la hoja en Google Sheets.
2. **Compartir** → Acceso general → "Cualquiera con el enlace" → Lector.
   (Sin este paso, Google bloqueará la descarga y el botón mostrará un error.)
3. En la URL del navegador verás algo como
   `https://docs.google.com/spreadsheets/d/1AbCdEfG.../edit#gid=123456789`.
   El texto entre `/d/` y `/edit` es el **ID** de la hoja; el número después
   de `gid=` es el **GID** de la pestaña (`0` si es la primera pestaña).
4. Arma la URL de exportación CSV:
   `https://docs.google.com/spreadsheets/d/TU_ID/export?format=csv&gid=TU_GID`
5. Copia `.env.example` a `.env` en la raíz del proyecto y pega esa URL en
   `VITE_SHEET_CSV_URL`. También puedes pasarla directamente como prop:
   `<CaliEducationalMap sheetCsvUrl="https://docs.google.com/..." />`.

La hoja debe tener las mismas columnas que el Excel (`ZONA`, `COMUNA`,
`ALIADOS` y, sin encabezado, el mensaje de acciones desarrolladas); el mismo
parser que lee el Excel se usa para interpretar el CSV, buscando primero una
pestaña llamada "Copia de ZONAS" o "ZONAS". Si no se configura ninguna URL,
el botón "Actualizar" muestra un mensaje explicando qué falta en vez de
fallar en silencio.

## Estructura de archivos

```
src/
  types/index.ts              Tipos compartidos (AllyRecord, ZonaGeometry, ZonaAggregate...)
  data/
    zonasComunas.ts            Colores, geometría fusionada por zona, etiquetas de comuna y pines rurales
    aliadosPorZona.json         Dataset real por defecto (hoja "Copia de ZONAS", 73 registros)
  utils/excelParser.ts         Parser de Excel/CSV + agregación por Zona Educativa
  components/
    CaliEducationalMap.tsx     Componente principal
    Sidebar.tsx                 Filtros y acciones (incluye "Actualizar")
    ZonaPopup.tsx                Burbuja emergente con pestañas (Aliados / Acciones desarrolladas)
    AllyBadge.tsx                Badge de entidad aliada
    Legend.tsx                   Leyenda de zonas y aliados
  index.ts                     Barrel export
```
