import os
from generar_common import generate_html

# --- CONFIGURACIÓN ---
# Rutas configurables vía env vars; defaults = entorno original del autor.
#   KREA2_JSON, KREA2_OUTPUT_HTML, KREA2_MODELS_DIR, KREA2_LORAS_DIR.
JSON_FILE = os.environ.get("KREA2_JSON", "Krea2_OK.json")
OUTPUT_HTML = os.environ.get("KREA2_OUTPUT_HTML", "Krea2_WebUI.html")
MODELS_DIR = os.environ.get("KREA2_MODELS_DIR", "/home/tonetxo/SwarmUI/Models/diffusion_models/flux2")
LORAS_DIR = os.environ.get("KREA2_LORAS_DIR", "/home/tonetxo/SwarmUI/Models/Lora/K2")
# Puerto donde se sirve la UI LTXV (para el botón "enviar a LTXV").
LTXV_UI_PORT = os.environ.get("LTXV_UI_PORT", "8000")
# ---------------------

def main():
    generate_html({
        'json_file': JSON_FILE,
        'output_html': OUTPUT_HTML,
        'title': 'Krea2 · Panel Pro',
        'enhancer_title': 'MEJORAR PROMPT CON IA / CAPTION',
        'ui_html': 'krea2_html.html',
        'ui_css': 'krea2.css',
        'ui_js': 'krea2.js',
        'model_dirs': MODELS_DIR,
        'model_fallback': 'flux2/krea2_turbo_convrot_int4_fast.safetensors',
        'model_exclude': (),
        'lora_dir': LORAS_DIR,
        'lora_fallback': 'K2/realism_engine_krea2_v2.safetensors',
        'header_title': 'Krea2',
        'header_sub': 'grafo: Krea2_OK',
        'model_count_label': 'modelos',
        'ltxv_ui_port': LTXV_UI_PORT,
    })

if __name__ == '__main__':
    main()