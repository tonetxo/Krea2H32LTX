"""Shared logic for the LTXV and Krea2 HTML generators.

Both generators call `generate_html()` with a config dict describing
their specific paths, placeholders, and template files.
"""

import json
import os

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')


def get_file_list(directory, ext='.safetensors', fallback=None):
    """Acepta un directorio (str) o una lista de tuplas (directorio, prefijo_relativo).
    El prefijo_relativo se antepone a los nombres de archivo para que ComfyUI
    pueda encontrarlos en su carpeta de checkpoints.
    """
    if isinstance(directory, str):
        entries = [(directory, '')]
    else:
        entries = list(directory)
    files = []
    for d, prefix in entries:
        if not os.path.exists(d):
            continue
        for root, _, file_list in os.walk(d):
            for f in file_list:
                if f.endswith(ext):
                    rel = os.path.relpath(os.path.join(root, f), d)
                    if rel.startswith('..'):
                        rel = f
                    rel = rel.replace('\\', '/')
                    if prefix and rel.startswith(prefix + '/'):
                        rel = rel[len(prefix) + 1:]
                    full_name = (prefix + '/' + rel) if prefix else rel
                    files.append(full_name)
    files = sorted(set(files))
    return files if files else ([fallback] if fallback else [])


def get_lora_list(directory, fallback="ltxv/Ltx2.3-Licon-VBVR-I2V-390K-R32.safetensors"):
    loras = []
    if not os.path.exists(directory):
        return [fallback]
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.safetensors'):
                rel_path = os.path.relpath(os.path.join(root, file), directory)
                loras.append(rel_path.replace('\\', '/'))
    loras.sort()
    return loras if loras else ["No LoRAs found"]


def _read_template(name):
    """Read a template file from the templates/ directory."""
    path = os.path.join(TEMPLATES_DIR, name)
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def generate_html(config):
    """Generate a self-contained HTML file from templates.

    config keys:
        json_file:       path to the workflow JSON
        output_html:     path to write the generated HTML
        title:           <title> text
        enhancer_title:  enhancer panel header text
        head_template:    'common_head.html'
        common_html:     'common_html.html'
        ui_html:         'ltxv_html.html' or 'krea2_html.html'
        base_css:        'base.css'
        ui_css:          'ltxv.css' or 'krea2.css'
        ui_js:           'ltxv.js' or 'krea2.js'
        model_dirs:      dir or list of (dir, prefix) tuples for models
        model_fallback:  fallback model name
        model_exclude:   tuple of prefixes to exclude from model list
        lora_dir:        directory for LoRAs
        lora_fallback:   fallback LoRA name
        header_title:    e.g. "LTXV" or "Krea2"
        header_sub:      e.g. "grafo: LTXV_DMD_OK"
        model_count_label: "modelos" or "" (for the success message)
    """
    # --- Read workflow JSON ---
    if not os.path.exists(config['json_file']):
        print(f"❌ Error: No se encontró '{config['json_file']}'")
        return
    with open(config['json_file'], 'r', encoding='utf-8') as f:
        graph_json = f.read()

    # --- Build model and LoRA lists ---
    raw_models = get_file_list(config['model_dirs'], fallback=config['model_fallback'])
    exclude = config.get('model_exclude', ())
    model_files = [m for m in raw_models if not any(m.startswith(x) for x in exclude)]
    model_js_array = json.dumps(model_files)

    lora_files = get_lora_list(config['lora_dir'], fallback=config.get('lora_fallback'))
    lora_js_array = json.dumps(lora_files)

    # --- Assemble CSS ---
    css = _read_template('base.css') + '\n' + _read_template(config['ui_css'])

    # --- Assemble HTML body ---
    common_html = _read_template('common_html.html')
    ui_html = _read_template(config['ui_html'])

    # --- Assemble JS ---
    # Order: BASE_GRAPH + AVAILABLE_MODELS + AVAILABLE_LORAS (placeholders),
    #         then common.js (defines $, log, server, initCommon, etc. — no CONFIG access at top level),
    #         then UI-specific JS (defines CONFIG, N, calls initCommon(), UI functions).
    ui_js = _read_template(config['ui_js'])
    common_js = _read_template('common.js')

    js_block = (
        "const BASE_GRAPH = __GRAPH_JSON__;\n"
        "const AVAILABLE_MODELS = __MODEL_LIST__;\n"
        "const AVAILABLE_LORAS = __LORA_LIST__;\n"
        + common_js + "\n"
        + ui_js
    )

    # --- Assemble full HTML ---
    head = _read_template('common_head.html')
    head = head.replace('__TITLE__', config['title'])
    head = head.replace('__CSS__', css)

    common_html = common_html.replace('__ENHANCER_TITLE__', config['enhancer_title'])

    ui_html = ui_html.replace('__COMMON_PANELS__', common_html)

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
{head}
</head>
<body>
<div class="wrap">
  <div class="head"><h1>{config['header_title']} <span>//</span> panel pro</h1><div class="sub">{config['header_sub']}</div></div>
{ui_html}
</div>
<script>
{js_block}
</script>
</body>
</html>
"""

    # --- Substitute placeholders ---
    html = html.replace('__GRAPH_JSON__', graph_json)
    html = html.replace('__MODEL_LIST__', model_js_array)
    html = html.replace('__LORA_LIST__', lora_js_array)

    # --- Write output ---
    with open(config['output_html'], 'w', encoding='utf-8') as f:
        f.write(html)

    # --- Success message ---
    model_count = len(model_files)
    lora_count = len(lora_files)
    if config.get('model_count_label'):
        print(f"✅ HTML generado con {model_count} {config['model_count_label']} y {lora_count} LoRAs.")
    else:
        print(f"✅ HTML generado con {lora_count} LoRAs.")