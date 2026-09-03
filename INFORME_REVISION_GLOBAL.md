# Informe de Revisión Global y Detalles Técnicos

Documento de auditoría y revisión técnica del repositorio **LTXWeb / MMH3X2 / MiniMaxH3 / LTXV / Krea2**, estructurado según las directrices de [REVISION.md](/home/tonetxo/Desenvolvemento/LLMsArena/REVISION.md).

---

## 1. 🔴 Seguridad

| Área | Estado | Detalle de Implementación |
| :--- | :---: | :--- |
| **Protección Path Traversal** | **OK** | En `_do_view` y `_do_file_delete` (`serve.py`):<br>• Se utiliza `os.path.realpath` para resolver enlaces y rutas canónicas.<br>• Se verifica que la ruta resultante comience estrictamente por las carpetas autorizadas de ComfyUI (`output/`, `temp/`, `input/`).<br>• Se rechazan nombres de archivo con separadores (`/`, `\`) o secuencias de escape (`..`). |
| **Protección CSRF / Same-Origin** | **OK** | La función `_allowed_origin()` valida que la cabecera `Origin` coincida exactamente con el `Host` (esquema + dominio + puerto) antes de permitir acciones mutables o acceso a WebSockets. |
| **Sanitización de Parámetros** | **OK** | • En `/api/prompts`: sanitización de claves mediante `re.sub(r"[^a-zA-Z0-9_]", "", key)`.<br>• En `/api/video_preprocess`: validación de rangos de escalado, volumen y saltos de fotogramas (1 a 60 fps). Limpieza garantizada del fichero temporal en bloque `finally`. |
| **Límites de Carga (Anti-DoS / OOM)** | **OK** | Límites explícitos de `Content-Length`:<br>• Subidas de imagen: 20 MB.<br>• Subidas de vídeo de referencia: 256 MB.<br>• Guardado de prompts: 10 MB.<br>• Cuerpo genérico de proxy: 100 MB. |

---

## 2. 🔴 Corrección Básica y Lógica de Negocio

### A. Sincronización de Fotogramas y Empalme Continuo (MMH3X2)
- **Causa del Salto Previo**: El operador `%` en JavaScript calcula el resto manteniendo el signo negativo: `(-11) % 17 === -11`, mientras que en Python (ComfyUI) calcula el módulo matemático euclídeo `(-11) % 17 === 6`. Para 12 segundos, ComfyUI generaba 294 frames pero JavaScript calculaba 277 frames, recortando por error 17 fotogramas intermedios (0.75 s) en el nodo `61`.
- **Solución Implementada**: Función determinista `calcFramesForDuration(dur)`:
  ```javascript
  function calcFramesForDuration(dur) {
    let f = Math.max(5, Math.round(dur * 24));
    while (f % 17 !== 5) {
      f++;
    }
    return f;
  }
  ```
- **Resultado**: Coincidencia matemática del 100% en todas las duraciones. El nodo `61` toma exactamente los fotogramas `0` a `N-2`, y el fotograma `N-1` pasa al Segmento 2 con suavizado temporal sin pérdida de movimiento.

### B. Gestión y Timeout de Ollama (`keep_alive: 0`)
- **WebUI (`templates/common.js`)**: En el streaming del mejorador de prompts se añade explícitamente `bodyPayload.keep_alive = 0`, forzando la descarga inmediata del modelo de la memoria RAM y VRAM nada más terminar.
- **Grafo ComfyUI (`MMH3X2_4IMG.json`)**: Nodo `51` (`OllamaConnectivityV2`) configurado con `"keep_alive": 0`.
- **Modo Directo**: Cuando el usuario selecciona `Modo de continuidad: Directo`, los 5 nodos de Ollama (`51`, `52`, `53`, `55`, `86`) se eliminan físicamente del JSON enviado a ComfyUI, ejecutándose a la velocidad máxima nativa de la GPU.

### C. Corrección en Borrado de Archivos Multinivel (`serve.py`)
- Se ajustó la validación de `subfolder` para permitir subcarpetas anidadas legítimas (p. ej. `video/MiniMax_H3/archivo.mp4`), impidiendo únicamente inicios con barra o secuencias `..`.

---

## 3. 🟠 Arquitectura de Reproductores (Nivelación con H3 y LTXV)

Los 3 reproductores de MMH3X2 (`Seg1`, `Seg2`, `Final`) y el historial comparten ahora la misma arquitectura probada de **MiniMaxH3** y **LTXV**:

1. **Rastreo Unificado de Medios (`currentMedia`)**:
   - `displayVideoInPlayer` acepta tanto objetos `{ filename, subfolder, type }` como URLs de texto plano.
   - Resuelve URLs directas con ancla `#t=0.001` y habilita `crossOrigin = "anonymous"`.
2. **Reproducción Automática**:
   - Al terminar la generación, los vídeos se reproducen automáticamente (`options.autoplay !== false`).
3. **Recuperación de Workflow (`📋 Workflow`)**:
   - Algoritmo de inspección binaria de átomos MP4 (`extractWorkflowFromMP4Buffer`).
   - Función `applyWorkflow(workflow)` en MMH3X2 que restaura:
     - Prompts (1 y 2).
     - Modo de Segmento 2 (Directo vs Asistido).
     - Sliders de Duración, Megapíxeles y Pasos.
     - Semilla de ruido.
     - LoRAs (1 y 2) con sus intensidades.
     - Estados de RTX, RIFE y suavizado de empalme.
   - Botón `📋` añadido en cada tarjeta del **Historial de Vídeos**.
4. **Navegación Fotograma a Fotograma**:
   - `tabindex="0"` en las cajas de vídeo.
   - **Flecha Izquierda / Flecha Derecha**: avance o retroceso exacto de 1 fotograma (`0.0417 s` a 24 fps).
   - **Tecla F / Botón 📸**: captura directa sobre Canvas y asignación al slot de imagen correspondiente sin errores de CORS.
5. **Descargas y Etiquetas de Resolución**:
   - Descarga con el nombre de archivo real generado en el servidor.
   - Cálculo del ratio de aspecto con MCD en la etiqueta inferior (`1280×736 · 16:9`).

---

## 4. 🟡 Rendimiento y Servidor Local

1. **Entrega Directa de Disco (Range Requests HTTP 206)**:
   - Los archivos de vídeo e imagen se transmiten directamente desde `serve.py` en fragmentos de 64 KB, permitiendo *seeking* instantáneo en los reproductores y descargando a ComfyUI del tráfico estático.
2. **Caché de Listados en Memoria**:
   - `_LIST_CACHE` con TTL de 5 segundos para `/api/*_list`, invalidado al instante tras operaciones de borrado o subida.
3. **Conexiones WebSocket**:
   - Puente bidireccional no bloqueante mediante `select.select()`, con reconexión transparente y fallback a polling en el cliente.

---

## 5. 🟡 Observabilidad

- **Servidor**: Trazas de depuración con prefijo `[serve]` en `stderr` para monitorizar peticiones proxificadas, tiempos de respuesta y errores de conexión.
- **Cliente**: Panel de registro en vivo en la interfaz web con niveles de severidad (`l-ok`, `l-warn`, `l-err`, `l-info`).

---

## 6. Puertos de Servicios

| Interfaz | Archivo Generador | Script de Lanzamiento | Puerto |
| :--- | :--- | :--- | :---: |
| **LTXV** | `generar_ltxv.py` | `./lanzar_ltxv.sh` | `8000` |
| **Krea2** | `generar_krea2.py` | `./lanzar_krea2.sh` | `8001` |
| **MiniMaxH3** | `generar_minimaxh3.py` | `./lanzar_minimaxh3.sh` | `8002` |
| **MMH3X2** | `generar_mmh3x2.py` | `./lanzar_mmh3x2.sh` | `8003` |
| **ComfyUI Backend** | — | — | `7821` |
| **Ollama LLM** | — | — | `11434` |
