import os
import config_loader
from generar_common import generate_html

# --- CONFIGURACIÓN DINÁMICA Y PORTABLE ---
JSON_FILE = os.environ.get("KREA2_JSON", "Krea2_OK.json")
OUTPUT_HTML = os.environ.get("KREA2_OUTPUT_HTML", "Krea2_WebUI.html")
_diff_base = config_loader.get_model_subdirs("diffusion_models")
_diff_flux2 = os.path.join(_diff_base, "flux2")
MODELS_DIR = os.environ.get("KREA2_MODELS_DIR", _diff_flux2 if os.path.isdir(_diff_flux2) else _diff_base)

_loras_base = config_loader.get_model_subdirs("loras")
_loras_k2 = os.path.join(_loras_base, "K2")
LORAS_DIR = os.environ.get("KREA2_LORAS_DIR", _loras_k2 if os.path.isdir(_loras_k2) else _loras_base)

LTXV_UI_PORT = config_loader.get_port("ltxv", 8000)
MINIMAXH3_UI_PORT = config_loader.get_port("minimaxh3", 8002)
MMH3X2_UI_PORT = config_loader.get_port("mmh3x2", 8003)
# -----------------------------------------

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
        'minimaxh3_ui_port': MINIMAXH3_UI_PORT,
        'mmh3x2_ui_port': MMH3X2_UI_PORT,
    })

if __name__ == '__main__':
    main()