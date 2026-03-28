# DreamAI — diario y análisis de sueños

Aplicación móvil (Expo / React Native) pensada para **registrar sueños**, **analizarlos con criterio** y **descubrir patrones** en el tiempo: qué se repite, qué figuras o escenarios vuelven, y cómo eso se relaciona con tu vida despierta.

## Para qué existe

El sueño no es ruido aleatorio: suele condensar tensiones, deseos no dichos, memorias y modos en los que te relacionas contigo y con los demás. Esta app apoya un proceso sencillo pero profundo:

- **Registrar** el sueño con fidelidad (texto libre o ya por segmentos).
- **Refinar y extraer** personajes, lugares, **objetos** oníricos y emociones (a mano o con IA que tú validas); personajes y objetos pueden enlazarse a registros recurrentes en tu base.
- **Cerrar** la estructura cuando el relato onírico está modelado; después **añadir tu pensamiento** sobre el sueño.
- **Explorar en el tiempo** (dirección del producto): repeticiones, temas recurrentes y “por qué ahora” — no una respuesta única de laboratorio, sino material para tu propia lectura y, si quieres, para diálogo con un profesional.

La ciencia aún debate *por qué* soñamos (consolidación de memoria, simulación emocional, regulación…). La app no pretende resolver ese debate: **te da herramientas para ver *qué* sueñas y *qué* podría estar en juego** detrás de imágenes y escenas.

## Modelo de datos (visión actual)

El dominio está partido en módulos bajo `docs/types/` (`character`, `location`, `dream-object`, `feeling`, `dream`) y se reexporta desde `docs/types/index.ts` (importable como `@/docs/types`).

- **Sesión** (`DreamSession`): fecha, **`status`** (`Draft` → `Refining` → `Structured` → `ReflectionsDone`), **`dreamKind`**, **`rawNarrative`** opcional (primer volcado), **`userThought`** opcional (paso final), vínculos opcionales a **`relatedLifeEventIds`**, segmentos.
- **Segmento** (`DreamSegment`): texto, **`feelings`**, **`analysis`** opcional hasta que termines la extracción (perspectiva, personajes, lugares, **objetos**, lucidez).

Los arquetipos y `FeelingKind` son etiquetas de trabajo; **`catalogCharacterId`** y **`catalogObjectId`** enlazan apariciones a registros recurrentes si usas catálogo.

## Desarrollo

Requisitos: Node.js y npm (o el gestor que uses con Expo).

```bash
npm install
npx expo start
```

Desde la salida de Expo puedes abrir la app en dispositivo (Expo Go), emulador Android o simulador iOS, o en web según la configuración del proyecto.

```bash
npm run android   # Android
npm run ios       # iOS
npm run web       # Web
npm run lint      # ESLint
```

## Stack

- [Expo](https://expo.dev) (~54) con [Expo Router](https://docs.expo.dev/router/introduction/) para rutas basadas en archivos.
- React 19 y React Native 0.81.

## Licencia y privacidad

El contenido de los sueños es sensible. Cualquier almacenamiento local o sincronización futura debería tratarse con criterios claros de privacidad (documentarlos cuando exista esa capa en el producto).

---

*Proyecto en evolución: la narrativa del README se actualiza con las funcionalidades reales de la app.*
