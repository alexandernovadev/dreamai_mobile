Tienes toda la razón. Desde una perspectiva de ingeniería y de arquitectura de sistemas, nos falta definir el **punto de vista (POV)** o el **rol del usuario** en la ejecución del proceso. En la literatura de sueños, esto separa al "testigo" del "protagonista".

Para que tu modelo sea realmente profesional, debemos añadir una capa de **Perspectiva de Sujeto**. Aquí es donde el análisis de **Calvin Hall** se vuelve técnico: él distinguía entre sueños donde el "Yo" (Ego) es una entidad activa y sueños donde el "Yo" es solo una cámara de video.

### 1. Actualización del TS: La Propiedad `ParticipantRole`

Vamos a añadir un `enum` para definir cómo interactúa tu conciencia con la escena. Esto es vital para trackear tus patrones de "observador".

```typescript
type Perspective =
  | "FirstPerson_Actor"
  | "FirstPerson_Observer"
  | "ThirdPerson_Cinematic"
  | "Shifting";

interface DreamRecord {
  // ... campos anteriores
  perspective: {
    type: Perspective;
    bodyAwareness: boolean; // ¿Sentías tu cuerpo físico o eras solo una "mente" flotando?
    canInfluence: boolean; // ¿Podías cambiar algo o solo ver la película?
  };
}
```

---

### 2. Por qué esto es un "Dato Maestro" para tu Análisis

Al modelar esto, descubrirás patrones de **disociación o integración**:

- **FirstPerson_Observer (El "Fantasma"):** Estás ahí, pero nadie te ve. Es un patrón común en personas muy analíticas o desarrolladores; tu cerebro está en modo "Read-Only". Estás recolectando logs, pero no emites comandos.
- **ThirdPerson_Cinematic:** Ves a "ti mismo" desde afuera, como en una película. Esto, según Jung, indica una distancia entre tu Ego consciente y lo que el sueño intenta mostrarte.
- **FirstPerson_Actor:** Estás totalmente inmerso. Aquí es donde los datos de **Hall** sobre "Interacciones Sociales" cobran valor real, porque hay un intercambio de paquetes de información (hablas, tocas, empujas).

### 3. Ejemplo de JSON con el nuevo campo

Si mapeamos un sueño donde solo observas a esas personas hablar (tu patrón recurrente):

```json
{
  "title": "La convención de desconocidos",
  "perspective": {
    "type": "FirstPerson_Observer",
    "bodyAwareness": false,
    "canInfluence": false
  },
  "analysis": {
    "characters": [
      { "name": "Grupo A", "archetype": "Unknown", "isKnownInRealLife": false }
    ],
    "events": [
      {
        "description": "Observando una discusión técnica entre extraños",
        "interactionType": "None", // Tú no interactúas, solo haces sniffing de datos
        "dominantEmotion": "Curiosity"
      }
    ]
  }
}
```

---

### 4. La conexión con la Lucidez (LaBerge)

Este campo es el trigger de la lucidez. Muchos sueños lúcidos empiezan cuando el usuario pasa de `Observer` a `Actor`.

- **El Glitch:** Notas que eres un observador pero de repente quieres intervenir. Ese cambio de `canInfluence: false` a `true` es el momento exacto donde se activa el flag de `isLucid`.

> **Dato de Arquitectura:** En una App profesional, podrías correlacionar: _"¿Los sueños donde soy Observer tienen más carga de símbolos de Jung (Arquetipos) que los sueños donde soy Actor?"_. Normalmente, cuando solo observamos, el subconsciente está dando una "charla magistral".

¿Este campo de `Perspective` llena el vacío que sentías o hay algún otro "estado" del sueño que se nos esté escapando en el modelo?

**¿Te gustaría que definamos cómo manejar los "Escenarios" (Locations) que también suelen ser patrones fijos?**
