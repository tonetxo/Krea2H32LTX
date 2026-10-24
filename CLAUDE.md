# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Self-contained single-page web UIs (one per model family) that drive a local ComfyUI backend (SwarmUI's `dlbackend/ComfyUI` on `:7821`, or plain ComfyUI on `:8188`). Pure Python stdlib + vanilla JS; no build tooling, no package manager, no test suite.

| UI | Generator | Template prefix | Workflow JSON (embedded) | Port |
|---|---|---|---|---|
| LTXV | `generar_ltxv.py` | `ltxv` | `LTXV_DMD_OK.json` | 8000 |
| Krea2 | `generar_krea2.py` | `krea2` | `Krea2_OK.json` | 8001 |
| MiniMaxH3 | `generar_minimaxh3.py` | `minimaxh3` | see generator | 8002 |
| MMH3X2 | `generar_mmh3x2.py` | `mmh3x2` | `MMH3X2_4IMG.json` **and** `MMH3X2_4IMG_BLOCKATT.json` (two outputs) | 8003 |
| KreaQwen | `generar_kreaqwen.py` | `kreaqwen` | see generator | 8004 |

## Commands

```bash
python3 generar_ltxv.py          # rebuild one UI (LTXV_WebUI.html); same pattern for the others
python3 generar_mmh3x2.py        # writes BOTH MMH3X2_WebUI.html and MMH3X2_WebUI_BlockATT.html
./lanzar_ltxv.sh                 # serve on 0.0.0.0:<port> via serve.py and open a browser
python3 serve.py 8000 [BACKEND_URL] [KREA2_OUTPUT_DIR] [HOST]   # server directly
python3 diagnostico_comfyui.py   # pre-flight: backend reachability, GPU, Ollama, required custom nodes
```

There are no tests or linters. Verify changes by regenerating the HTML and exercising the UI against a running ComfyUI.

## Architecture

**The `*_WebUI.html` files are build artifacts, but they are committed.** Never edit them by hand: edit `templates/` (or the generator/workflow JSON), then rerun the matching `generar_*.py` and commit the regenerated HTML together with the source change (see commits like `chore(mmh3x2): regenerate BlockATT variant`). A change to `templates/common.js`, `base.css` or `common_html.html` affects every UI, so all generators must be rerun.

**HTML assembly (`generar_common.generate_html`)**: each `generar_*.py` builds a config dict (workflow file, template names, model dirs with include/exclude filters, fallbacks, ports) and calls `generate_html`, which:
1. Scans model folders (via `config_loader`, following symlinks) into lists of models, LoRAs, VAEs, UNets, CLIPs, interpolation and upscale models, and LUT (`.cube`) files.
2. Concatenates `base.css` + `<ui>.css`, `common_html.html` + `<ui>_html.html` (with `__SERVER_PANEL__` / `__PROMPT_PANELS__` / `__COMMON_PANELS__` splicing), and the JS as: placeholder constants (`BASE_GRAPH`, `AVAILABLE_*`, `*_UI_PORT`), then `common.js`, then `<ui>.js`.
3. Inlines the workflow JSON as `BASE_GRAPH` (with `</` escaped) and substitutes the `__PLACEHOLDER__` tokens.

**Runtime JS**: `common.js` must not touch `CONFIG` at top level. Each `<ui>.js` defines `CONFIG` (including `CONFIG.N`, the map from logical roles to node IDs in the embedded workflow), calls `initCommon()`, and at submit time deep-copies `BASE_GRAPH` and patches or injects nodes (e.g. post-FX, refine, interpolation) before POSTing to `/prompt`. **Node IDs in `CONFIG.N` must match the workflow JSON.** When you edit a workflow JSON, check the `N` map and every place that injects nodes. Optional features are left out of the graph when disabled, and image slots without uploads are pruned. Parameters are restored from the metadata of generated files, so new node types need backward-compatible restore logic.

**`serve.py`** (stdlib only): serves only the `*_WebUI*.html` pages (`STATIC_PAGE_RE`; everything else in the repo returns 404) with `Cache-Control: no-store`. Every non-page request goes through `_request_allowed()`: it rejects `Sec-Fetch-Site: cross-site` and any `Origin` that is not this host:port or the same hostname on another UI port (`UI_PORTS`), so LAN/mobile access keeps working. CORS headers are only echoed for allowed origins, never `*`. The server also proxies ComfyUI HTTP routes and the `/ws` WebSocket (so LAN or mobile clients only need the UI port), proxies Ollama and llama.cpp, and provides custom endpoints: `/api/prompts` (shared prompt library persisted to `prompts_<ui>_prompts.json`, gitignored), `/api/<ui>_list` (output galleries), `/api/krea2_upload`, `/api/file_delete` (restricted to output paths), `/api/video_preprocess` (ffmpeg), and UI launch/close.

**`config_loader.py`**: resolves the ComfyUI root, models, output dir, ports and Ollama URL in this order: `config.json` (gitignored; copy from `config.example.json`), then env vars (`COMFYUI_ROOT`, per-generator `*_DIR` overrides), then auto-detection (`~/ComfyUI`, `../ComfyUI`, `~/SwarmUI/dlbackend/ComfyUI`). Do not hardcode machine paths.

**`comfy_nodes/ltxweb_videofx/`**: the bundled custom node `LTXWebVideoFX` (vectorized GPU LUT + vignette + grain, chunked by `chunk_mb`). It replaces ProPost's per-frame/per-pixel loops, which caused OOM on long videos. It must also be copied into `<comfy_root>/custom_nodes/ltxweb_videofx/` to take effect. It must **not** mutate its input tensor (ComfyUI caches outputs; in-place writes corrupt reruns), so it writes to a fresh `empty_like` output.

## Conventions

- UI text, code comments and log messages are in Spanish. Commit messages are in English Conventional Commits with a UI scope: `feat(minimaxh3,mmh3x2): ...`, `fix(ltxv): ...`.
- `ESTADO_SESION.md` is a running session-handoff note (root causes, verification numbers). `REVISION.md` is a code-review checklist.
- Required and optional ComfyUI custom node packs are listed in `README.md` and checked by `diagnostico_comfyui.py`. When a UI starts depending on a new node class, add it there too.

## Mandatory Context Dependencies
Before performing any tasks, writing code, or running workflows that involve the backend or node execution, read and strictly follow the ComfyUI guidelines:

@~/SwarmUI/dlbackend/ComfyUI/AGENTS.md
