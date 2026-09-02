import os
from generar_common import generate_html

# --- CONFIGURACIÓN ---
JSON_FILE = os.environ.get("MMH3X2_JSON", "MMH3X2_4IMG.json")
OUTPUT_HTML = os.environ.get("MMH3X2_OUTPUT_HTML", "MMH3X2_WebUI.html")
UNET_DIR = os.environ.get("MINIMAXH3_UNET_DIR", "/home/tonetxo/SwarmUI/Models/diffusion_models")
UNET_PREFIX = os.environ.get("MINIMAXH3_UNET_PREFIX", "Ligazón para diffusion_models")
CLIP_DIR = os.environ.get("MINIMAXH3_CLIP_DIR", "/home/tonetxo/SwarmUI/Models/text_encoders")
LORAS_DIR = os.environ.get("MINIMAXH3_LORAS_DIR", "/home/tonetxo/SwarmUI/Models/Lora/h3")
LORAS_PREFIX = os.environ.get("MINIMAXH3_LORAS_PREFIX", "Ligazón para Lora/h3")
INTERP_DIR = os.environ.get("MINIMAXH3_INTERP_DIR", "/home/tonetxo/SwarmUI/dlbackend/ComfyUI/models/frame_interpolation")
MMH3X2_UI_PORT = os.environ.get("MMH3X2_UI_PORT", "8003")
# ---------------------

def main():
    generate_html({
        'json_file': JSON_FILE,
        'output_html': OUTPUT_HTML,
        'title': 'MMH3X2 · Panel Pro',
        'enhancer_title': 'Mejorar prompt con IA',
        'ui_html': 'mmh3x2_html.html',
        'ui_css': 'mmh3x2.css',
        'ui_js': 'mmh3x2.js',
        'model_dirs': None,
        'model_fallback': '',
        'model_exclude': (),
        'lora_dirs': [(LORAS_DIR, LORAS_PREFIX)],
        'lora_fallback': 'Ligazón para Lora/h3/minimax_h3_fl2v_turbo_4step_v1.1_768p_comfyui_bf16.safetensors',
        'vae_dir': '/home/tonetxo/SwarmUI/dlbackend/ComfyUI/models/vae_approx',
        'vae_fallback': 'taeh3.safetensors',
        'interp_dir': INTERP_DIR,
        'interp_fallback': 'rife_v4.26.safetensors',
        'unet_dirs': [(UNET_DIR, UNET_PREFIX)],
        'unet_fallback': 'Ligazón para diffusion_models/minimaxh3/minimax_h3_fused_refdelta_r1024_turbo8_mystic07_int8_convrot.safetensors',
        'unet_exclude': ('/flux/', '/flux2/', '/ideogram/', '/boogu/', '/ernie/',
                         '/nunchaku/', '/qwen/', '/zimage/', 'MelBand', 'wav2vec',
                         'acestep'),
        'clip_dirs': [(CLIP_DIR, '')],
        'clip_fallback': 'qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors',
        'clip_exclude': ('AceStep', 'ViT-L-14', 'byt5', 'clip_g', 'clip_l',
                         'gemma', 'gpt_oss', 'ltx-2.3', 'ltx2/', 'ministral',
                         'mistral', 'qwen3.5', 'qwen3vl_4b', 'qwen3vl_8b',
                         'qwen_0.6b', 'qwen_1.7b', 'qwen_2.5', 'qwen_3_06',
                         'qwen_3_4b', 'qwen_3_600', 'qwen_3_8b', 'sulphur',
                         't5gemma', 't5xxl'),
        'header_title': 'MMH3X2',
        'header_sub': 'grafo: MMH3X2_4IMG',
        'model_count_label': '',
        'mmh3x2_ui_port': MMH3X2_UI_PORT,
    })

if __name__ == '__main__':
    main()
