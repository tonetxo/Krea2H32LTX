# Estado de sesión (para continuar después)

Última actuación (2026-10-15): ronda de revisión con `REVISION.md` (seguridad de
`serve.py`, polling, prompts, restauración de modelos, refactors), toda
commitada; ver "Ronda de revisión" más abajo. Después: plan de optimización
de velocidad/memoria (puntos 0–3 y 5 hechos, ver "Optimización"); queda el 4 (KreaQwen base cuantizado, el usuario busca int8/nvfp4);
luego KreaQwen + RTX SR.

Anterior: LTXV / Post-FX — **RESUELTO**. El bloqueo de RAM/reinicio de
ComfyUI con LUT+grano en vídeos grandes queda corregido y verificado.

## Problema (causa raíz)
La cadena de Post-FX usaba los nodos de `comfyui-propost` (ProPostApplyLUT /
ProPostFilmGrain / ProPostVignette). Son **bucles Python por frame** y, en el
caso del grano, `filmgrainer` hace un **bucle por píxel**. Además cada nodo
reserva `torch.zeros_like(image)` = una copia del batch completo. Con vídeos LTXV
de 360–1200 frames a 2–4K (batch de 15–30 GB) eso → picos de RAM de 60–90 GB,
bloqueo y reinicio de ComfyUI, y tiempos de decenas de minutos.
(Nodo 740 decode → RIFE `(n-1)*mult+1` → RTX SR ×2 → CreateVideo.)

## Solución implementada
Nodo propio **`LTXWebVideoFX`** (paquete `ltxweb_videofx`):
- `comfy_nodes/ltxweb_videofx/video_fx.py` (en el repo, versionado) e instalado
  en `<comfy_root>/custom_nodes/ltxweb_videofx/` (SwarmUI:
  `~/SwarmUI/dlbackend/ComfyUI/custom_nodes/`).
- LUT 3D **vectorizada en GPU** (`grid_sample`), validada **idéntica a `colour`**
  (~1e-7) para varios `.cube` (parser Iridas con orden de ejes correcto r,g,b).
- Viñeta: misma fórmula que ProPostVignette (verificada).
- Grano: vectorizado (ruido gaussiano por frame escalado, se genera con `seed+i`
  por frame). Sustituye el bucle por píxel → segundos en vez de horas.
- **Chunking** por presupuesto de memoria (`chunk_mb`, def. 1024) y escritura
  **in-place** sobre el batch (no duplica el batch).
- Registra `models/luts` como carpeta `luts` si propost no está cargado.

JS (`templates/ltxv.js`): `appendVideoPostFx` ahora emite **un solo nodo**
`LTXWebVideoFX`. La restauración de metadatos entiende el nodo nuevo y mantiene
compatibilidad con workflows antiguos (LayerColor / FilmV2 / ProPost).
`diagnostico_comfyui.py`: entrada "LTXWeb-VideoFX (incluido)" (bundled).

## Verificación (backend real :7821, RTX 5070 Ti)
- 300 frames @2016×1152, LUT noir + viñeta + grano → **~12 s**, OK.
- **720 frames @2016×1152 (batch ~20 GB) → 18,3 s, pico RSS 22,1 GB, sin OOM.**
- Salida comprobada: saturación 0.047→0.009 (LUT noir), alta frecuencia
  0.006→0.054 (grano), viñeta OK (centro 0.66 / esquina 0.0 con intensidad 1).

## Corrección de caché / reproceso incremental (posterior)
El nodo se escribió inicialmente **in-place** sobre el tensor de entrada. Eso
corrompía el caché de ComfyUI (el input del FX es un output cacheado reutilizado,
`execution.py:447`): al reejecutar con otro LUT, el FX se aplicaba sobre frames ya
procesados (acumulación). **Corregido**: ahora asigna `torch.empty_like` (salida
nueva, no muta el input) y volca cada chunk ahí. Pico ≈ 2× batch, sin churn.
Añadido un log informativo (GB de salida vs RAM libre vía `/proc/meminfo`).

Validado: run1 LUT noir@1.0 → run2 mismo LUT@0.0 ⇒ salida2 **idéntica al original**
(diff 0.00000, sin acumulación); en el log de run2 `execution_cached = ['1','2']`
(LoadImage/Repeat) y **solo se reejecutó el FX**.

Nota de expectativas: este ComfyUI usa caché **RAM_PRESSURE** por defecto
(`main.py:342`; sin flags en el arranque). Mantiene el caché pero lo **expulsa**
si la RAM libre baja de ~9.6 GB (`execution.py:748-751`). Por tanto "solo se
reprocesa el FX" es **best-effort**: se cumple con RAM holgada; bajo presión el
batch decodificado/SR puede expulsarse y el pipeline se recomputa. No se pone
`--cache-classic` (forzaría el incremental pero retendría RAM, chocando con la
prioridad de estabilidad).

## Post-proceso on-demand en el vídeo final (RTX frame interp + RTX upscaler)
Añadidos dos botones en la ventana del **Vídeo final** (slot 2) de LTXV, "como en
minimaxh3": **⚡ Interpolar** (RIFE o RTX Frame Gen, según el motor elegido) y
**🔍 RTX 2x** (RTX Video Super Resolution). Se aplican **después** de generar,
sobre el clip ya cargado, sin re-muestrear.

- `templates/ltxv_html.html`: `#btnInterpolate2` y `#btnRtxUpscale2` en el header
  del slot 2 (ocultos hasta que hay vídeo).
- `templates/ltxv.js`:
  - `buildPostProcessGraph(j)`: grafo mínimo
    `LoadVideo → GetVideoComponents → [RTXVideoFrameGeneration | FrameInterpolate | RTXVideoSuperResolution] → CreateVideo → SaveVideo`.
    El save usa el id `N.FINAL_SAVE` (920) para que el visor/Handler lo muestren
    en el slot 2. `fps` de interpolación = `fps_origen × mult` (ComfyMathExpression);
    RTX SR conserva fps y audio.
  - `buildGraph`: rama temprana si `job.isInterpolateOnly || job.isRtxUpscaleOnly`.
  - `showVideo`: muestra los botones y pone badge "Interp Nx" / "RTX 2x".
  - `startJob`: no exige imagen de entrada en jobs on-demand; `runSingleGeneration`
    no toca `N.SEED` si no existe (grafo mínimo) y el timer va al slot 2.
  - `enqueuePostProcess(kind)` + listeners de los dos botones.
  - El **Color Grading del panel se aplica** en el post-proceso (tras el op) si
    está activo al pulsar, para poder añadirlo a un clip que no lo llevaba. Ojo:
    si el clip ya traía FX de la generación hay que **desactivarlo antes** para no
    duplicarlo (mismo criterio que MiniMaxH3).
- Validado contra el backend real: RTX 2x (320×240→640×480, fps conservado) y
  interpolación RTX 2x (16→31 frames, 8→16 fps). Smoke test Playwright: botones
  presentes, aparecen al cargar vídeo, click dispara el job, sin errores de JS.

## Fixes posteriores
- **Bug RTX en generación**: `snapshotJob()` no capturaba `rtx`, así que
  `buildGraph` leía `j.rtx === undefined` → `rtxEnabled` caía a `true` y el
  **RTX Video Super Resolution se aplicaba SIEMPRE**, aunque el toggle estuviera
  desactivado. Arreglado añadiendo `rtx: getRtxState()` al snapshot. Verificado
  con Playwright: con los toggles off no aparecen `RTXVideoSuperResolution` ni
  `FrameInterpolate`/`RTXVideoFrameGeneration` en el grafo; con on, sí.
- **Colocación de botones**: `.vid-header`/`.vid-actions` con `flex-wrap`. La
  causa real del desborde era `flex-shrink:0` en `.vid-actions` (no encogía, así
  que desbordaba en vez de envolver); ahora `flex:0 1 auto; min-width:0;
  max-width:100%`. Verificado en 600–1400 px: `overflow` negativo (sin desborde).

## RTX VFX Nodes: nuevos modos aprovechados
El pack instalado (`comfyui_nvidia_rtx_nodes` 0.2.1, repo ahora
`Comfy-Org/ComfyUI_Nvidia_VFX_Nodes`) ya está al día con upstream. Se añade a
LTXV lo aprovechable:
- **Modos de limpieza sin escalar** `DENOISE_*` / `DEBLUR_*` (misma resolución):
  expuestos en el selector de calidad (optgroup). El botón on-demand "🔍 RTX VSR"
  detecta estos modos y usa `resize_type.scale = 1` (conserva dimensiones).
- **Factor de escala 1.5×–4×** (`#rtxScale`), usado en generación y on-demand
  (antes estaba fijo a 2×).
- Badge/etiquetas mode-aware ("RTX 3x", "denoise medium", "deblur high", …).
- **RTX Video HDR**: DESCARTADO por ahora — el `IMAGE` de ComfyUI no lleva
  metadatos de color y `CreateVideo` no etiqueta BT.2020/HLG/PQ; el resultado se
  vería mal salvo que el muxing lo marque. (Menor prioridad: 10-bit RGB10A2 y
  frame-gen "specific timestep".)
- Validado en backend: denoise/deblur → misma resolución (320×240), escala 3× →
  960×720; Playwright: selector/estado ok, grafo correcto, sin errores.

## Port de modos RTX a MiniMaxH3 y MMH3X2
- **MiniMaxH3**: `getRtxState`/`RTX_DEFAULTS` con `scale`; select de escala y
  calidades agrupadas (escalado + DENOISE/DEBLUR) en el panel; los DOS builders
  de RTX SR (generación y face-refine on-demand) usan escala y fuerzan `scale=1`
  en modos DENOISE/DEBLUR; hint de resolución y restauración de metadatos
  mode-aware.
- **MMH3X2**: igual + **fix de bug de base**: el job no guardaba
  `rtxToggle/rtxQuality/rife*`, así que el panel se ignoraba en generación
  (usaba defaults). Ahora se snapshotan; escala y denoise/deblur aplicados en
  el builder principal y en el de face-refine.
- Validado con Playwright: job/RTX node con scale 3 (escalado) y scale 1 +
  calidad DENOISE_DEBLUR (misma resolución), sin errores JS.
- **KreaQwen**: NO tiene RTX Video Super Resolution (usa upscale neuronal
  4xPurePhoto). No hay modos que portar; pendiente decidir si se AÑADE un
  nodo RTX SR como etapa nueva (consulta al usuario).

## Ronda de revisión (REVISION.md) — 2026-10-15, todo commitado
Fixes:
- `c97014b` serve: `_request_allowed()` bloquea cross-site/Origin ajeno en todo
  lo que no es página; CORS sin `*`; solo se sirven `*_WebUI*.html`; `/view`
  confinado a output/temp/input (sin `..` ni rutas absolutas).
- `b8ce80d` videofx: LUTs 1D (antes crasheaban), `DOMAIN_MIN/MAX` correcto,
  la carpeta `luts` se fusiona con la existente en vez de reemplazarla.
- `a432d07` prompts: toda mutación se aplica sobre la copia actual del servidor
  (`_mutatePrompts()`), cabecera `X-Prompts-Exists`; trims `HH:MM:SS` en
  `video_preprocess`.
- `4533755` restauración de modelos: `setSelectIfPresent()` en common.js;
  KreaQwen no envía nombres vacíos y rechaza el grafo con "Falta seleccionar".
- `a9fb76b` polling: sin límite de 12 min mientras el prompt siga en `/queue`;
  solo se da por fallido si desaparece sin historial; re-check al reconectar WS.
- `3119d93` serve: `Range` RFC (sufijos, 416), `Content-Length` validado (400),
  rutas no ASCII en el proxy (`sofá`).
Refactors (salida byte-idéntica salvo lo indicado en cada commit):
- `1bd6eff` serve: `EXACT_ROUTES`/`PROXY_ROUTES` + `_dispatch()`;
  `MEDIA_LISTS` + `_build_media_list()`.
- `297c5ec` evolver de prompts único en common.js; no se sondea `/queue` con la
  pestaña oculta.
- `ff91b92` generadores: `filter_names()` (substring, sin mayúsculas) para
  modelos/VAE/UNET/CLIP.

## Optimización velocidad/memoria (plan aprobado: 0–3 y 5 hechos)
**0. `bench_comfyui.py`**: reenvía el grafo API embebido en una salida (mp4/png)
o un .json, con variantes como JSON Merge Patch (`--variant N='{...}'`, `--set`
común). Mide el tiempo total y por nodo (vía WebSocket), el pico de VRAM
(nvidia-smi) y el de RSS de ComfyUI. Misma semilla por ronda en todas las
variantes. Salidas en `output/bench/<tag>/`; resultados en
`bench_results.jsonl` (gitignored).

**1. Backend de atención** (rondas medidas, Gen5, 2026-10-15):

| UI (grafo) | kitchen | sage3 | sage2 | pytorch |
|---|---|---|---|---|
| LTXV 1280×736×321 (`modeux_00008`) | 102.4 s | 102.0 s | 124.9 s | – |
| Krea2 (`imagen_01436`) | 6.0 s | 6.1 s | 5.9 s | 6.3 s |
| KreaQwen (`imagen_00525`) | 16.6 s | 16.2 s | 17.2 s | 19.8 s |
| MiniMax H3 15 s (`MiniMax_H3_00445`) | 236.0 s | 233.6 s | 254.7 s | – |

- kitchen ≈ sage3 (diferencia < ruido). sage2 (= "auto" de KJ) es un 8–22 % más
  lento en vídeo. Pytorch, +19 % en KreaQwen. **Los defaults (kitchen) ya son
  óptimos**: no hay ganancia por esta vía.
- LTXV: `LTX2MemoryEfficientSageAttentionPatch` (924) no cambia el tiempo.
- **Bug corregido**: el selector de LTXV ofrecía `sageattn` (seleccionado por
  defecto), `sageattn2` y `sageattn_qk`, que no existen en `PathchSageAttentionKJ`
  (`get_sage_func` no define `sage_func` → error al ejecutar, aunque `/prompt`
  los acepte). Ahora: kitchen (default), sageattn3, auto (avisa de que es más
  lento); los valores antiguos se mapean a kitchen.

**2. Descargas de modelos** (`--seed-mode unique`; con la misma semilla las
variantes que solo quitan nodos de salida salen de caché y miden ~6 s, falso):
- LTXV 1280×736×321: `PurgeVRAM` final (925) → el **siguiente** trabajo tarda
  ~5.5 s más en el 1er pase (recarga del modelo); `cleanGpuUsed` entre pases
  (918) → +2.4 s en el 2º pase. Total ~8 s/trabajo (~8 %). Pico de VRAM igual
  (~15.8 GB, DynamicVRAM llena la VRAM siempre); 0 OOM en ~40 runs sin purgas.
  → **Quitadas por defecto**; toggle "Liberar VRAM entre pases y al final"
  (`purgeVram`, desactivado) para renders extremos. MMH3X2: mismo toggle para
  su `PurgeVRAM` final (87). Su `VRAM_Debug` (52) se mantiene: libera VRAM
  para Ollama (misma GPU) en el modo seg2 con Ollama.
- H3 8 s: `/free` al encolar 110.1 s vs 109.0 s sin él (~1 s) → se mantiene.
  Residencia AIMDO: 0 blocks 108.8 s / 4 blocks 109.1 s / stock 111.2 s; sin
  efecto en velocidad en Gen5 y 0 blocks usa menos VRAM (10 GB vs 15.9) → se
  mantiene el default.

**3. Preview del 1er pase opcional** (checkbox, activado por defecto):
- LTXV "Guardar vídeo del 1er pase (preview)" (`savePreview`): en modo full
  quita 552/551/922/923; el decode de audio 550 se conserva (lo re-codifica
  274). 1280×736×321: 99.5 → 93.9 s (−5.6 s).
- MiniMaxH3 "Guardar vídeo del 1er pase" (`latentUpscale.savePass1`): no
  inyecta 420–423. Clip de 15 s: 242.2 → 223.9 s (−18.3 s, −7.6 %).

**5. `serve.py` `/api/video_preprocess`**: `-ss` y `-t` pasan a opciones de
entrada (helper `ffmpeg_trimmed()`, antes copiado 3 veces). Recorte a partir del
1:30 de un 1080p de 2 min: 1.25 → 0.40 s, con una salida idéntica (PSNR inf).
Corrige además un bug: con un recorte y `skip_frames>1` no salía vídeo. Ojo:
`-t` debe ir antes de `-i`, porque como opción de salida mide tras el `select` y
lee el doble de fuente. Los errores de ffmpeg incluyen ahora la última línea de
stderr. **NVENC descartado**: 2.7 vs 3.0 s en un clip entero de 2 min, y más
lento en clips cortos. Sin cambiar: con skip>1 el vídeo dura 1/skip del tramo
(se acelera) y el audio dura el tramo entero.

## Pendiente / siguientes pasos
- **KreaQwen + RTX Video Super Resolution**: decidir si se añade una etapa RTX SR
  (hoy solo upscale 4xPurePhoto). En curso.
- Probar el Post-FX con un vídeo real del usuario; ajustar la calibración del
  **grano** (`amp = power * 0.18` en `add_grain`, `video_fx.py:233`) si el look
  difiere del de ProPost.
- Secciones de `REVISION.md` aún sin repasar a fondo: tests (no hay suite),
  rendimiento, logging/métricas.
- Borrar salidas de prueba si se desea (`~/SwarmUI/dlbackend/ComfyUI/output/`):
  `ltxweb_fxtest*`, `fxtestA_*`, `fxtestB_*`, `bench/`.

## Nota de rendimiento (hardware)
La 5070 Ti a veces arranca en PCIe **Gen3** en vez de Gen5 (fallo de
ecualización). Con modelos que no caben en 16 GB (MiniMax H3, Krea2 FP16) eso
ralentiza mucho, porque los pesos se transmiten en cada paso. Un servicio de
usuario (`pcie-check.service` → `~/.local/bin/pcie-check.py`) mide el enlace al
iniciar sesión y avisa si baja de 30 GB/s; el log está en
`~/.local/state/pcie-check.log`. Referencia en Gen5: LTXV 1280×736×321 →
1'51" en caliente, 2'28" en frío.

## Referencias
- ComfyUI backend :7821 (venv en `~/SwarmUI/dlbackend/ComfyUI/venv`).
- Recarga de nodos: `POST /manager/reboot` (content-type JSON); vuelve en ~12 s.
- RIFE RTX: `(n-1)*mult+1`. Decode LTXV: `(frames//8)*8 + 1` (verificado:
  360→361, 480→481). Salida ≈ `round(w/32)*32 × round(h/32)*32` ×2 (upsampler)
  ×(RTX SR? 2:1).
- `GetImageRangeFromBatch` (KJNodes) **lanza error** si `start_index>=len`.
- F5 tras regenerar; regenerar con `python3 generar_ltxv.py`.
