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
| `LTXV_WebUI.html` | LTXV video UI. Self-contained (inline CSS + JS). | **No** for template content. |
| `generar_ltxv.py` | Reads `LTXV_DMD_OK.json`, walks `ltxv/` LoRAs, emits `LTXV_WebUI.html`. | Yes — source of truth for LTXV UI. |
| `LTXV_DMD_OK.json` | LTXV workflow graph. | Rarely. |
| `Krea2_WebUI.html` | Krea2 image UI. Self-contained (inline CSS + JS). | **No** for template content. |
| `generar_krea2.py` | Reads `Krea2_OK.json`, walks `flux2/` models and `K2/` LoRAs, emits `Krea2_WebUI.html`. | Yes — source of truth for Krea2 UI. |
| `Krea2_OK.json` | Krea2 workflow graph. | Rarely. |
| `lanzar_ltxv.sh` | Launches `serve.py` on port 8000, opens `LTXV_WebUI.html`. | Edit `BROWSER` and `PORT`. |
| `lanzar_krea2.sh` | Launches `serve.py` on port 8001, opens `Krea2_WebUI.html`. | Edit `BROWSER` and `PORT`. |
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

## Generator gotchas

- `generar_ltxv.py:7` — `LORAS_DIR` hardcoded to `/home/tonetxo/SwarmUI/Models/Lora/ltxv`.
- `generar_krea2.py:7-8` — `MODELS_DIR` hardcoded to `.../diffusion_models/flux2`, `LORAS_DIR` to `.../Lora/K2`.
- Both generators use a raw `r'''...'''` string with placeholders (`__GRAPH_JSON__`, `__LORA_LIST__`, `__MODEL_LIST__`).
- Directory walks are recursive; results sorted; backslashes normalised to forward slashes.

## Backend connection

- Default backend port is `7821` for both UIs.
- `serve.py` proxies API routes to ComfyUI (`:7821`) and `/api/*` to Ollama (`:11434`).
- WebSocket (`/ws`) is rejected with 426; `pollFallback` handles it via polling every 4s.
- The user can type a custom backend URL to bypass the proxy.

## LAN access gotcha (móvil / otro PC)

`serve.py` binds to `0.0.0.0`, so the UI is reachable on the LAN.
**ComfyUI binds to `127.0.0.1:<port>` by default** — launch it with
`--listen 0.0.0.0` to make it accessible from other devices.
`lanzar_ltxv.sh` and `lanzar_krea2.sh` both check `ss` and warn when
the backend is on a loopback address.

## Conventions

- Spanish UI copy (`lang="es"`, labels like "Servidor", "Probar").
- Dark theme, monospace headings, accent colour `--accent: #57e8c9`.
- All JS is vanilla, inline at the bottom of the HTML. No build step.
- No `package.json`, no `requirements.txt` (only stdlib: `json`, `os`).
- No tests, no linter, no typechecker, no formatter, no CI.
