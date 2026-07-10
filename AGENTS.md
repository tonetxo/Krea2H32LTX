# AGENTS.md

Repo-specific notes for agents working in `/home/tonetxo/Documentos/worflows/LTXWeb`.

## What this repo is

A single-page web UI (`LTXV_WebUI.html`) for an LTXV video-generation backend
(SwarmUI / ComfyUI-style graph, default endpoint `http://127.0.0.1:7821`).
The HTML is **generated** by `generar_html.py` from a JSON graph
(`LTXV_DMD_OK.json`); do not hand-edit the HTML for things the generator
controls — your changes will be overwritten on the next regenerate.

## Files

| File | Role | Edit by hand? |
|------|------|---------------|
| `LTXV_WebUI.html` | The delivered UI. Self-contained (inline CSS + JS, no build step, no CDN). | **No** for anything inside the `html_template` in `generar_html.py`. Yes for stuff outside the template (if you ever add it). |
| `generar_html.py` | Reads `LTXV_DMD_OK.json`, walks a LoRA directory, and emits `LTXV_WebUI.html` with `__GRAPH_JSON__` and a `__LORA_LIST__`-style substitution. | Yes — this is the source of truth for the UI. |
| `LTXV_DMD_OK.json` | Workflow graph embedded into the HTML at generation time. | Rarely; only if the backend graph changes. |
| `lanzar_ltxv.sh` | Launches a local `python3 -m http.server 8000` and opens Firefox at `http://localhost:8000/LTXV_WebUI.html`. | Edit `BROWSER` (`firefox` / `google-chrome` / `chromium`) and `PORT` here. |

## How to run

```bash
# 1. Regenerate the HTML (after editing generar_html.py or LTXV_DMD_OK.json)
python3 generar_html.py

# 2. Serve + open in browser
./lanzar_ltxv.sh
```

Opening `LTXV_WebUI.html` via `file://` will not work — it makes `fetch()` /
`/v1/...` calls to the backend and several browsers block them from
`file://`. Always go through the local server.

## Generator gotchas

- `generar_html.py:7` — `LORAS_DIR` is **hardcoded** to
  `/home/tonetxo/SwarmUI/Models/Lora/ltxv`. On machines without that path
  the generator falls back to a single placeholder LoRA
  (`Ltx2.3-Licon-VBVR-I2V-390K-R32.safetensors`). If you're not on the
  SwarmUI host, edit this constant before regenerating.
- The HTML template is a raw `r'''...'''` string (line ~35) with two
  placeholders. Final assembly is at the bottom of the file with
  `.replace("__GRAPH_JSON__", ...)`. If you add a new placeholder, also
  add the corresponding `.replace(...)` call.
- The `LORA_DIR` walk is recursive; results are sorted. Entries with
  backslashes are normalised to forward slashes — keep that in mind if
  you change the join logic.

## Editing workflow

1. Make CSS / HTML / JS changes in `generar_html.py`'s `html_template`.
2. Run `python3 generar_html.py` to regenerate `LTXV_WebUI.html`.
3. Open it via `./lanzar_ltxv.sh` (not `file://`).
4. If you change the LoRA list, just re-run the generator — no rebuild.

## Backend connection

- Default server URL is `http://127.0.0.1:7821` (editable in the
  "Servidor" panel of the UI; key `id="serverUrl"`).
- The UI expects a SwarmUI/ComfyUI-compatible endpoint that accepts
  `POST` with body `{prompt: <graph>, client_id: ...}` — see
  `LTXV_WebUI.html:1853`.
- There is **no backend code in this repo**. The `7821` port must be
  running the LTXV backend separately.

## Conventions

- Spanish UI copy (`lang="es"`, labels like "Servidor", "Probar",
  "sin comprobar"). Keep new copy in Spanish.
- Dark theme, monospace headings, accent colour `--accent: #57e8c9`. All
  design tokens are CSS custom properties on `:root` in the inline
  `<style>` — change them there, do not hardcode colours.
- All JS is vanilla, inline at the bottom of `LTXV_WebUI.html`. No
  bundler, no node_modules, no package.json — there is nothing to
  `npm install`.

## What this repo does NOT have

- No tests, no linter, no typechecker, no formatter, no CI.
- No `package.json`, no `requirements.txt` (only stdlib: `json`, `os`).
- No git history (`.git` is absent). Don't run `git` commands here.
