# AGENTS.md

Repo-specific notes for agents working in `/home/tonetxo/Documentos/worflows/LTXWeb`.

## What this repo is

Two single-page web UIs for ComfyUI/SwarmUI backends:

- **LTXV** (`LTXV_WebUI.html`) — video generation with LTXV model
- **Krea2** (`Krea2_WebUI.html`) — image generation with Krea2/Flux2 model

Both are **generated** by their respective Python scripts from JSON graphs;
do not hand-edit the HTML for things the generator controls.

## Files

| File | Role | Edit by hand? |
|------|------|---------------|
| `LTXV_WebUI.html` | LTXV video UI. Self-contained (inline CSS + JS). | **No** — generated. |
| `Krea2_WebUI.html` | Krea2 image UI. Self-contained (inline CSS + JS). | **No** — generated. |
| `generar_ltxv.py` | LTXV generator config. Calls `generar_common.generate_html()`. | Yes — paths, config. |
| `generar_krea2.py` | Krea2 generator config. Calls `generar_common.generate_html()`. | Yes — paths, config. |
| `generar_common.py` | Shared generator logic: file walking, template assembly, placeholder substitution. | Yes — assembly logic. |
| `templates/base.css` | Shared CSS (theme, panels, buttons, sliders, gallery, prompt-tree, collapsible, enhancer, modal). | Yes. |
| `templates/ltxv.css` | LTXV-only CSS (vidbox, video, chain, frame-selector). | Yes. |
| `templates/krea2.css` | Krea2-only CSS (imgbox, ref dropzone, img-wrap). | Yes. |
| `templates/common.js` | Shared JS (timers, socket, prompt library, LoRA, enhancer, stop). Uses `CONFIG` object. | Yes. |
| `templates/ltxv.js` | LTXV-only JS (CONFIG def, N, video, frames, MP4 workflow, buildGraph, applyWorkflow). | Yes. |
| `templates/krea2.js` | Krea2-only JS (CONFIG def, N, zoom/pan, IndexedDB gallery, buildGraph, applyWorkflow). | Yes. |
| `templates/common_head.html` | Shared `<head>` (meta, title placeholder, style placeholder). | Yes. |
| `templates/common_html.html` | Shared HTML panels (Servidor, Biblioteca de Prompts, Prompt, Enhancer). | Yes. |
| `templates/ltxv_html.html` | LTXV-only HTML (chain, dropzone, video players, controls, video history). | Yes. |
| `templates/krea2_html.html` | Krea2-only HTML (output image, ref image, Krea2 enhancer, RBG variance, sampler). | Yes. |
| `LTXV_DMD_OK.json` | LTXV workflow graph. | Rarely. |
| `Krea2_OK.json` | Krea2 workflow graph. | Rarely. |
| `lanzar_ltxv.sh` | Launches `serve.py` on port 8000, opens `LTXV_WebUI.html`. Binds to `0.0.0.0` via `HOST` env var. | Edit `BROWSER` and `PORT`. |
| `lanzar_krea2.sh` | Launches `serve.py` on port 8001, opens `Krea2_WebUI.html`. Binds to `0.0.0.0` via `HOST` env var. | Edit `BROWSER` and `PORT`. |
| `serve.py` | Static file server + HTTP proxy to ComfyUI + Ollama. | Yes, for proxy routes or backend URL. |

## How to run

```bash
# LTXV (video)
python3 generar_ltxv.py
./lanzar_ltxv.sh          # port 8000

# Krea2 (image)
python3 generar_krea2.py
./lanzar_krea2.sh         # port 8001
```

Opening via `file://` will not work — always go through the local server.

## Architecture

The generators assemble a self-contained HTML file from template fragments:

```
generar_ltxv.py / generar_krea2.py   ← config only (~30 lines each)
        ↓ calls
generar_common.py                    ← shared assembly logic (~160 lines)
        ↓ reads
templates/
  base.css    ← shared CSS
  ltxv.css    ← LTXV-specific CSS
  krea2.css   ← Krea2-specific CSS
  common.js   ← shared JS (uses CONFIG object set by UI-specific JS)
  ltxv.js     ← LTXV-specific JS (defines CONFIG, N, callbacks, UI functions)
  krea2.js    ← Krea2-specific JS (defines CONFIG, N, callbacks, UI functions)
  common_head.html  ← shared <head>
  common_html.html  ← shared HTML panels
  ltxv_html.html    ← LTXV-specific HTML
  krea2_html.html   ← Krea2-specific HTML
```

The generated HTML is self-contained (inline CSS + JS, no external requests).
Templates are **not served** to the browser — they are build-time sources only.

### JS injection order in the generated HTML

1. `const BASE_GRAPH = __GRAPH_JSON__;` (placeholder, substituted by generator)
2. `const AVAILABLE_MODELS = __MODEL_LIST__;` (placeholder)
3. `const AVAILABLE_LORAS = __LORA_LIST__;` (placeholder)
4. UI-specific JS (`ltxv.js` or `krea2.js`) — defines `CONFIG`, `N`, callbacks, UI functions
5. Shared JS (`common.js`) — uses `CONFIG`, defines shared functions

### CONFIG object

Each UI sets a `CONFIG` global before `common.js` runs. Required fields:
- `PROMPTS_KEY`, `LORA_STATE_KEY`, `ENHANCER_SYSKEY`, `SERVERURL_KEY` — localStorage keys
- `N` — node-key map for the workflow graph
- `DEFAULT_BACKEND_PORT`, `UI_TYPE`, `DEFAULT_MODEL`
- `loras` — initial LoRA state array
- `ENHANCER_DEFAULT_PROMPTS` — enhancer style presets
- Callbacks: `findMedia`, `showMedia`, `addToVariantGallery`, `onSeedUpdate`, `displayResult`, `onPromptError`, `startNextVariant`, `onBatchComplete`, `onStopCurrent`, `onStopAll`

## Generator gotchas

- `generar_ltxv.py:8` — `LORAS_DIR` hardcoded to `/home/tonetxo/SwarmUI/Models/Lora/ltxv`.
- `generar_krea2.py:7-8` — `MODELS_DIR` hardcoded to `.../diffusion_models/flux2`, `LORAS_DIR` to `.../Lora/K2`.
- Placeholders: `__GRAPH_JSON__`, `__LORA_LIST__`, `__MODEL_LIST__`, `__TITLE__`, `__CSS__`, `__ENHANCER_TITLE__`.
- Directory walks are recursive; results sorted; backslashes normalised to forward slashes.

## Backend connection

- Default backend port is `7821` for both UIs.
- `serve.py` proxies API routes to ComfyUI (`:7821`) and `/api/*` to Ollama (`:11434`).
- WebSocket (`/ws`) is rejected with 426; `pollFallback` handles it via polling every 4s.
- The user can type a custom backend URL to bypass the proxy.

## LAN access (móvil / otro PC)

`lanzar_ltxv.sh` and `lanzar_krea2.sh` launch `serve.py` with `HOST=0.0.0.0`,
so the UI is reachable on the LAN at `http://<IP_LAN>:8000/LTXV_WebUI.html`
(or `:8001/...`). If you run `serve.py` manually, set `HOST=0.0.0.0` to
allow LAN access; otherwise it defaults to `127.0.0.1`.

**ComfyUI binds to `127.0.0.1:<port>` by default** — launch it with
`--listen 0.0.0.0` to make the backend accessible from other devices.
`lanzar_ltxv.sh` and `lanzar_krea2.sh` both check `ss` and warn when
the backend is on a loopback address.

## Conventions

- Spanish UI copy (`lang="es"`, labels like "Servidor", "Probar").
- Dark theme, monospace headings, accent colour `--accent: #57e8c9`.
- All JS is vanilla, inline at the bottom of the HTML. No build step.
- No `package.json`, no `requirements.txt` (only stdlib: `json`, `os`).
- No tests, no linter, no typechecker, no formatter, no CI.