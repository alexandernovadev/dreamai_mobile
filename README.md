# DreamAI — diario y análisis de sueños

Aplicación móvil (Expo / React Native) pensada para **registrar sueños**, **analizarlos con criterio** y **descubrir patrones** en el tiempo: qué se repite, qué figuras o escenarios vuelven, y cómo eso se relaciona con tu vida despierta.

## Para qué existe

El sueño no es ruido aleatorio: suele condensar tensiones, deseos no dichos, memorias y modos en los que te relacionas contigo y con los demás. Esta app apoya un proceso sencillo pero profundo:

- **Registrar** el sueño con fidelidad (texto por segmentos, orden narrativo).
- **Estructurar** lo que aparece: perspectiva (actor u observador), personajes con arquetipos inspirados en la tradición junguiana, uno o varios escenarios por segmento, lucidez.
- **Reflexionar** en cada sesión: tus conclusiones en un único espacio de texto, para anclar sentido sin sustituir tu criterio por uno automático.
- **Explorar en el tiempo** (dirección del producto): repeticiones, temas recurrentes y “por qué ahora” — no una respuesta única de laboratorio, sino material para tu propia lectura y, si quieres, para diálogo con un profesional.

La ciencia aún debate *por qué* soñamos (consolidación de memoria, simulación emocional, regulación…). La app no pretende resolver ese debate: **te da herramientas para ver *qué* sueñas y *qué* podría estar en juego** detrás de imágenes y escenas.

## Modelo de datos (visión actual)

El contrato principal vive en `docs/types.ts`:

- **Sesión de sueño** (`DreamSession`): fecha, reflexiones tuyas, lista de segmentos.
- **Segmento** (`DreamSegment`): trozo ordenado del relato con análisis asociado.
- **Análisis**: perspectiva, personajes (nombre, si los reconoces, arquetipo), **varias ubicaciones** por segmento, lucidez.

Los arquetipos incluyen sombra, ánima/ánimus, figura sabia, persona y *desconocido*, para no forzar etiquetas donde no encajan.

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
