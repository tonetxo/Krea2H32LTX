from generar_common import generate_html

# --- CONFIGURACIÓN ---
JSON_FILE = 'Krea2_OK.json'
OUTPUT_HTML = 'Krea2_WebUI.html'
MODELS_DIR = '/home/tonetxo/SwarmUI/Models/diffusion_models/flux2'
LORAS_DIR = '/home/tonetxo/SwarmUI/Models/Lora/K2'
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
    })

if __name__ == '__main__':
    main()