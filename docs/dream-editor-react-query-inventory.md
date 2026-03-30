# Inventario — editor de sueños y React Query (paso 1)

Objetivo: localizar **todas** las llamadas HTTP del flujo de edición (`/dream/new`, `/dream/edit/[id]`) y definir **qué claves** (`lib/queryKeys.ts`) conviene alimentar o invalidar en pasos posteriores.

---

## Claves ya definidas (`lib/queryKeys.ts`)

| Clave | Uso actual |
|--------|------------|
| `dreamSessions.list(DREAM_LIST_QUERY_PARAMS)` | Lista en `app/(tabs)/dream/index.tsx` |
| `dreamSessions.detail(id)` | Detalle `app/(tabs)/dream/[id].tsx`; caché tras guardar borrador en `DreamEditorScreen` |
| `dreamSessions.hydrated(id)` | **Reservada** — aún no hay `useQuery`; hoy solo comentario en código |

---

## Archivos del flujo del editor

| Archivo | Rol |
|---------|-----|
| `app/(tabs)/dream/new.tsx` | Monta `DreamEditorScreen` en modo `new` |
| `app/(tabs)/dream/edit/[id].tsx` | Monta `DreamEditorScreen` en modo `edit` |
| `components/dreams/DreamEditorScreen.tsx` | Tabs: borrador, elementos, detalle, reflexión; estado local de sesión |
| `components/dreams/ElementsStep.tsx` | `getHydrated`, sugerencia IA, CRUD catálogo, `update` sesión a `ELEMENTS` |
| `components/dreams/ThoughtStep.tsx` | `update` sesión (reflexión / `aiSummarize`), `suggestThought` |
| `components/dreams/DreamDetailForm.tsx` | `update` sesión (detalle estructurado) — también usado en pantalla detalle `/dream/[id]` |

---

## Llamadas por archivo

### `DreamEditorScreen.tsx`

| API | Contexto |
|-----|----------|
| `dreamSessionsService.getOne` | Solo `mode === 'edit'`: bootstrap de borrador + detalle + reflexión |
| `dreamSessionsService.update` | Guardar borrador (existente) |
| `dreamSessionsService.create` | Primer guardado de borrador (`new`) |
| *(ya integrado)* | Tras create/update borrador: `setQueryData(detail)`, `invalidateQueries(list)` |

**Estado local que debería alinearse con caché en pasos futuros:** `sessionId`, `detailTimestamp`, `detailKinds`, `detailImages`, `userThought`, `aiSummarize` — hoy se actualizan por callbacks de hijos, no por `getOne`/`getHydrated` en query.

---

### `ElementsStep.tsx` (fichero grande; varios flujos)

| API | Ubicación / notas |
|-----|-------------------|
| `dreamSessionsService.getHydrated(sessionId)` | `useEffect` al cambiar `sessionId`: rellena filas desde `session.analysis.entities` + mapas `hydrated.*` |
| `dreamSessionsService.suggestDreamElements(sessionId)` | `runAiSuggest`: merge en estado local (staging; **no persiste** en servidor según comentario en `dreamSessions.ts`) |
| `charactersService.create` | `handleSave`: filas nuevas de personaje |
| `locationsService.create` | idem |
| `dreamObjectsService.create` | idem |
| `contextLivesService.create` | idem |
| `dreamEventsService.create` | incluye `dreamSessionId` |
| `feelingsService.update` / `feelingsService.create` | feelings con o sin `id` |
| `dreamSessionsService.update` | Tras persistir entidades: `status: 'ELEMENTS'`, `analysis: { entities }` |
| `charactersService.update` | Varios handlers (p. ej. edición inline / blur — buscar en archivo ~1539+) |
| `locationsService.update` | ~1708+ |
| `dreamObjectsService.update` | ~1856+ |
| `dreamEventsService.update` | ~1985+ |
| `contextLivesService.update` | ~2116+ |
| `feelingsService.update` | ~2254+ |

**Impacto Signals:** cualquier `create`/`update` de catálogo debería, en invalidación agresiva, tocar `queryKeys.signals.hub()` y/o listas/detalle por entidad afectada (paso 5 del plan amplio).

---

### `ThoughtStep.tsx`

| API | Contexto |
|-----|----------|
| `dreamSessionsService.update` | Guardar reflexión: `userThought`, `status: 'THOUGHT'` |
| `dreamSessionsService.suggestThought` | IA + luego `update` con `aiSummarize` |

**Caché objetivo:** tras cada `update` exitoso, alinear `dreamSessions.detail(sessionId)` y `dreamSessions.list` (y opcionalmente `hydrated` si existiera query).

---

### `DreamDetailForm.tsx`

| API | Contexto |
|-----|----------|
| `dreamSessionsService.update` | `timestamp`, `dreamKind`, `dreamImages`, `status: 'STRUCTURED'` |

**Pantalla `/dream/[id]`:** ya invalida lista y hace `setQueryData` del detalle vía callback `onDreamSaved`. El mismo formulario dentro del **editor** solo actualiza estado en `DreamEditorScreen` (`onSaved`); **no** invalida queries globales hoy.

---

## Matriz sugerida (para implementación en pasos 2–5)

| Evento | Mínimo recomendado | Opcional |
|--------|-------------------|----------|
| `getHydrated` reemplazado por query | `setQueryData` / `hydrated(id)` + sincronizar UI | `detail(id)` si `session` en respuesta sustituye `getOne` |
| Tras `suggestDreamElements` | Nada en servidor persistente; opcional cachear sugerencia solo en estado local | — |
| Tras `handleSave` en Elements (update sesión + creates) | `invalidateQueries(detail)`, `invalidateQueries(hydrated)`, `invalidateQueries(list)` | `invalidateQueries` bajo prefijo `signals` si hubo creates |
| Tras `ThoughtStep` save / suggest+update | `setQueryData` o `invalidate` `detail` + `list` | `hydrated` |
| Tras `DreamDetailForm` en editor | Igual que detalle tab: `detail` + `list` | — |

---

## Resumen

- **Fuente de verdad deseada para el editor:** `getHydrated` + sesión encaja en `dreamSessions.hydrated(id)`; `getOne` sigue siendo suficiente para vistas simples.
- **Mayor superficie:** `ElementsStep.tsx` (creación catálogo + `update` sesión + `getHydrated` + sugerencias).
- **Siguiente paso técnico (paso 2 del plan):** introducir `useQuery` para `getHydrated` con `queryKeys.dreamSessions.hydrated(id)` y reducir estado duplicado donde sea seguro.
