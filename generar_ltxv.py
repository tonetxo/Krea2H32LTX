import os
from generar_common import generate_html

# --- CONFIGURACIÓN ---
# Las rutas son configurables vía env vars; los defaults son los del entorno
# original del autor. Sobrescríbelas si tu instalación está en otro sitio:
#   LTXV_JSON, LTXV_OUTPUT_HTML, LTXV_LORAS_DIR, LTXV_MODELS_DIR,
#   LTXV_SD_MODELS_DIR (Stable-Diffusion, segundo origen de modelos).
JSON_FILE = os.environ.get("LTXV_JSON", "LTXV_DMD_OK.json")
OUTPUT_HTML = os.environ.get("LTXV_OUTPUT_HTML", "LTXV_WebUI.html")
LORAS_DIR = os.environ.get("LTXV_LORAS_DIR", "/home/tonetxo/SwarmUI/Models/Lora/ltxv")
MODELS_DIR = os.environ.get("LTXV_MODELS_DIR", "/media/tonetxo/datos/ltxv")
SD_MODELS_DIR = os.environ.get("LTXV_SD_MODELS_DIR", "/home/tonetxo/SwarmUI/Models/Stable-Diffusion")
# Puerto donde se sirve la UI LTXV (para el botón "enviar a LTXV" de Krea2).
LTXV_UI_PORT = os.environ.get("LTXV_UI_PORT", "8000")
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
            (MODELS_DIR, 'ltxv'),
            (SD_MODELS_DIR, ''),
        ],
        'model_fallback': '10Eros_v1.4_bf16.safetensors',
        'model_exclude': ('StableAudio/', 'HiDream/', 'sam3.1_multiplex_fp16', 'lens_turbo_bf16'),
        'lora_dir': LORAS_DIR,
        'lora_fallback': 'ltxv/Ltx2.3-Licon-VBVR-I2V-390K-R32.safetensors',
        'header_title': 'LTXV',
        'header_sub': 'grafo: LTXV_DMD_OK',
        'model_count_label': '',  # LTXV only reports LoRAs
        'ltxv_ui_port': LTXV_UI_PORT,
    })

if __name__ == '__main__':
    main()