import os
from generar_common import generate_html

# --- CONFIGURACIÓN ---
# Las rutas son configurables vía env vars; los defaults son los del entorno
# original del autor. Sobrescríbelas si tu instalación está en otro sitio:
#   MINIMAXH3_JSON, MINIMAXH3_OUTPUT_HTML, MINIMAXH3_UNET_DIR,
#   MINIMAXH3_UNET_PREFIX, MINIMAXH3_CLIP_DIR.
JSON_FILE = os.environ.get("MINIMAXH3_JSON", "MiniMaxH3_I2V.json")
OUTPUT_HTML = os.environ.get("MINIMAXH3_OUTPUT_HTML", "MiniMaxH3_WebUI.html")
UNET_DIR = os.environ.get("MINIMAXH3_UNET_DIR", "/home/tonetxo/SwarmUI/Models/diffusion_models")
UNET_PREFIX = os.environ.get("MINIMAXH3_UNET_PREFIX", "Ligazón para diffusion_models")
CLIP_DIR = os.environ.get("MINIMAXH3_CLIP_DIR", "/home/tonetxo/SwarmUI/Models/text_encoders")
# Puerto donde se sirve esta UI (para el botón "enviar a ..." desde otras UIs).
MINIMAXH3_UI_PORT = os.environ.get("MINIMAXH3_UI_PORT", "8002")
# ---------------------

def main():
    generate_html({
        'json_file': JSON_FILE,
        'output_html': OUTPUT_HTML,
        'title': 'MiniMaxH3 · Panel Pro',
        'enhancer_title': 'Mejorar prompt con IA',
        'ui_html': 'minimaxh3_html.html',
        'ui_css': 'minimaxh3.css',
        'ui_js': 'minimaxh3.js',
        # MiniMaxH3 no usa CheckpointLoaderSimple ni el panel "Modelo" genérico.
        # Vaciamos AVAILABLE_MODELS para que loadModels() no falle.
        'model_dirs': None,
        'model_fallback': '',
        'model_exclude': (),
        # Sin LoRAs en el grafo.
        'lora_dir': None,
        'lora_fallback': '',
        # Sin selector de VAE: el workflow lleva 2 VAEs fijos (vídeo + audio).
        'vae_dir': None,
        'vae_fallback': '',
        # UNet y CLIP sí se exponen como selectores.
        'unet_dirs': [(UNET_DIR, UNET_PREFIX)],
        'unet_fallback': 'Ligazón para diffusion_models/minimaxh3/minimax_h3_fl2va_pruned_int8_convrot.safetensors',
        # Conservar solo los modelos de la carpeta minimaxh3.
        'unet_exclude': ('/flux/', '/flux2/', '/ideogram/', '/boogu/', '/ernie/',
                         '/nunchaku/', '/qwen/', '/zimage/', 'MelBand', 'wav2vec',
                         'acestep'),
        'clip_dirs': [(CLIP_DIR, '')],
        'clip_fallback': 'qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors',
        # Conservar solo los CLIP qwen3vl (usados por MiniMaxH3).
        'clip_exclude': ('AceStep', 'ViT-L-14', 'byt5', 'clip_g', 'clip_l',
                         'gemma', 'gpt_oss', 'ltx-2.3', 'ltx2/', 'ministral',
                         'mistral', 'qwen3.5', 'qwen3vl_4b', 'qwen3vl_8b',
                         'qwen_0.6b', 'qwen_1.7b', 'qwen_2.5', 'qwen_3_06',
                         'qwen_3_4b', 'qwen_3_600', 'qwen_3_8b', 'sulphur',
                         't5gemma', 't5xxl'),
        'header_title': 'MiniMaxH3',
        'header_sub': 'grafo: MiniMaxH3_I2V',
        'model_count_label': '',
        'ltxv_ui_port': MINIMAXH3_UI_PORT,
    })

if __name__ == '__main__':
    main()