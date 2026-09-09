# TODO — LTXWeb

Pendientes e ideas acordadas en sesiones. Se marcan con [x] al completar.

## Mejoras del Enhancer / Ollama (acordadas 2026-09-09)

- [ ] **Estilo F (Continuación Seg 2) con 2 imágenes**: actualmente solo recibe 1
  imagen (slot 3 o 4). Permitir pasar también la imagen del último frame de Seg 1
  (slot extraído) para que Ollama compare "de dónde viene → a dónde va".
  Código: `templates/mmh3x2.js` (bloque `styleKey === "F"` dentro de
  `$("btnEnhance")`), y guía en `CONFIG.ENHANCER_DEFAULT_PROMPTS.F`.
- [ ] **Hint de estilo según modo**: indicar en la UI qué estilo del Enhancer
  conviene según `seg2PromptMode` (Directo → E/F según uso; Asistido en grafo →
  el Enhancer es solo para Prompt 1, porque el grafo ya fusiona visión).
  Código: `templates/mmh3x2.js` (hint dinámico junto a `enhancerStyle`) y
  `templates/mmh3x2_html.html`.
- [ ] **Modo Ollama en grafo + refs compartidas**: hoy la cadena guiada del grafo
  (nodos 51-59) siempre ve los 12 frames reales de Seg 1; no depende del toggle.
  Evaluar si conviene añadir las imágenes de referencia compartidas también al
  LLM 2 (nodo 55, input `images`), p. ej. Img3/Img4 con el toggle activado.
  Código: `templates/mmh3x2.js` (`seg2Mode === "ollama"` en `buildGraph()`).

## Backend (ComfyUI) — conocidos, sin parchear

- [ ] **OOM de la VAE de audio (ref_audio)**: el fallback tiled de
  `comfy/sd.py` no soporta VAEs de audio 3D y lanza
  `IndexError: tuple index out of range`. Mitigado desde la UI (recorte de
  audios a duración del segmento + `POST /free` al encolar, commits
  `8b33487`/`9b176bd`). Fix definitivo si algún día se parchea comfy:
  chunking del audio en `_encode_ref_audio`
  (`comfy_extras/nodes_minimax_h3.py`) o routing 3D en `comfy/sd.py`.

## Persistencia

- [ ] **Homogeneizar persistencia de LTXV y Krea2** al estilo MMH3X2/
  MiniMaxH3 (localStorage de ajustes + IndexedDB de medios). MiniMaxH3 ya
  está hecho (commit `13b1cd4`); falta revisar qué le falta a LTXV y Krea2.