from generar_common import generate_html

# --- CONFIGURACIÓN ---
JSON_FILE = 'LTXV_DMD_OK.json'
OUTPUT_HTML = 'LTXV_WebUI.html'
LORAS_DIR = '/home/tonetxo/SwarmUI/Models/Lora/ltxv'
MODELS_DIR = '/media/tonetxo/datos/ltxv'
# ---------------------

def main():
    generate_html({
        'json_file': JSON_FILE,
        'output_html': OUTPUT_HTML,
        'title': 'LTXV · Panel Pro',
        'enhancer_title': 'Mejorar prompt con IA',
        'ui_html': 'ltxv_html.html',
        'ui_css': 'ltxv.css',
        'ui_js': 'ltxv.js',
        'model_dirs': [
            ('/media/tonetxo/datos/ltxv', 'ltxv'),
            ('/home/tonetxo/SwarmUI/Models/Stable-Diffusion', ''),
        ],
        'model_fallback': '10Eros_v1.3_fp8mixed_learned.safetensors',
        'model_exclude': ('StableAudio/', 'HiDream/', 'sam3.1_multiplex_fp16', 'lens_turbo_bf16'),
        'lora_dir': LORAS_DIR,
        'lora_fallback': 'ltxv/Ltx2.3-Licon-VBVR-I2V-390K-R32.safetensors',
        'header_title': 'LTXV',
        'header_sub': 'grafo: LTXV_DMD_OK',
        'model_count_label': '',  # LTXV only reports LoRAs
    })

if __name__ == '__main__':
    main()