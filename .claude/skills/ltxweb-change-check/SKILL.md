---
name: ltxweb-change-check
description: Regenerate, verify and safely push LTXWeb changes. Use it whenever you edit anything under templates/, a generar_*.py generator, a workflow JSON (LTXV_DMD_OK.json, Krea2_OK.json, MMH3X2_4IMG*.json, ...), serve.py or config_loader.py in this repo, before saying an LTXWeb change is done, and always before a git push of this repo, even if the user only says "commit and push", "regenerate the UIs" or "check that it works".
---

# LTXWeb change check

LTXWeb's `*_WebUI*.html` pages are build artifacts: a source edit does nothing until the matching generator runs, and a broken page only shows up in a browser. The repo is public, so every push also has to be checked for personal data (model, LoRA and image names, prompts, home paths). This skill covers the three steps that keep both in check. Run the scripts from the repo root; they live in this skill's `scripts/` folder.

## 1. Regenerate the affected UIs

```bash
python3 .claude/skills/ltxweb-change-check/scripts/affected_uis.py --run
python3 .claude/skills/ltxweb-change-check/scripts/check_generated.py
```

`affected_uis.py` looks at uncommitted changes plus unpushed commits (add `--base <ref>` for an older range, `--all` to force every UI) and runs only the generators that need it: a change to a shared file (`base.css`, `common.js`, `common_html.html`, `common_head.html`, `generar_common.py`, `config_loader.py`) rebuilds all of them, a `templates/<ui>.*` or `generar_<ui>.py` change rebuilds that UI, and a workflow JSON rebuilds every generator that embeds it (`generar_mmh3x2.py` writes two pages). If it warns that `serve.py` changed, the running UI servers need a restart, not just a reload.

`check_generated.py` then catches unreplaced `__PLACEHOLDER__` tokens and JS syntax errors in the generated pages without opening a browser. Fix any failure in the sources and run both again; never patch the generated HTML.

When a workflow JSON changed, also check that the node IDs in that UI's `CONFIG.N` (in `templates/<ui>.js`) and every place that injects nodes still match the JSON, because a stale ID fails only at submit time.

## 2. Check it in the browser

Static checks do not show layout, CSS or runtime errors, so look at each affected page:

1. Start a scratch server in the background: `python3 serve.py 8099` (any free port; `serve.py` serves every `*_WebUI*.html`, and it proxies ComfyUI so the pages connect to the real backend).
2. With Claude in Chrome, open `http://localhost:8099/<Page>_WebUI.html` in a new tab, read console errors (`read_console_messages` with `onlyErrors`), and take a screenshot.
3. Exercise what the change touched, not just the first screen: the panel you edited, a restored workflow, the empty and loaded state of a viewer. To test a viewer, load a neutral test image (for example a canvas gradient through `javascript_tool`) instead of the user's outputs: the history panels and galleries show the user's own generations, so open them only when the change is about them.
4. Close the tab and stop the scratch server when done.

If the user already has a UI open on its usual port (8000–8004), they only need to reload it: pages are served with `Cache-Control: no-store`.

## 3. Before pushing

```bash
python3 .claude/skills/ltxweb-change-check/scripts/privacy_scan.py          # @{u}..HEAD by default
```

It compares the added lines and commit messages of the outgoing range with the real file names on this machine (models, LoRAs, VAEs, ComfyUI input images, read at run time), and flags home paths, emails and local-only files (`*_WebUI*.html`, `config.json`, `prompts_*.json`, `ESTADO_SESION.md`).

- `FALLO`: do not push. Tell the user what was found and where, and fix it (amend or a new commit) only with their agreement.
- `REVISAR`: show the items to the user and push only after they confirm. Workflow JSON values such as `image`, `filename_prefix` or `text` land here because only a person can tell a personal prompt from a neutral default.
- Clean: push, and say in the reply that the scan ran and found nothing.

The scan cannot recognise a personal prompt written in free text inside JS or HTML, so also read the diff of any prompt-like strings yourself.

## Conventions to keep

- Commit messages: English Conventional Commits with a UI scope, e.g. `fix(ltxv): ...`, `feat(krea2,mmh3x2): ...`.
- UI text, code comments and log messages stay in Spanish.
- New ComfyUI node classes a UI depends on go into `README.md` and `diagnostico_comfyui.py`.
