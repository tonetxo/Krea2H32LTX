import os
import config_loader
from generar_common import generate_html

# --- CONFIGURACIÓN DINÁMICA Y PORTABLE ---
JSON_FILE = os.environ.get("MMH3X2_JSON", "MMH3X2_4IMG.json")
OUTPUT_HTML = os.environ.get("MMH3X2_OUTPUT_HTML", "MMH3X2_WebUI.html")
UNET_DIR = os.environ.get("MINIMAXH3_UNET_DIR", config_loader.get_model_subdirs("diffusion_models"))
UNET_PREFIX = os.environ.get("MINIMAXH3_UNET_PREFIX", "")
CLIP_DIR = os.environ.get("MINIMAXH3_CLIP_DIR", config_loader.get_model_subdirs("text_encoders"))
_loras_base = config_loader.get_model_subdirs("loras")
_loras_h3 = os.path.join(_loras_base, "h3")
LORAS_DIR = os.environ.get("MINIMAXH3_LORAS_DIR", _loras_h3 if os.path.isdir(_loras_h3) else _loras_base)
LORAS_PREFIX = os.environ.get("MINIMAXH3_LORAS_PREFIX", "h3" if os.path.isdir(_loras_h3) else "")
INTERP_DIR = os.environ.get("MINIMAXH3_INTERP_DIR", config_loader.get_model_subdirs("frame_interpolation"))
VAE_APPROX_DIR = os.environ.get("MINIMAXH3_VAE_DIR", os.path.join(config_loader.get_comfyui_root(), "models", "vae_approx"))
MMH3X2_UI_PORT = config_loader.get_port("mmh3x2", 8003)
LTXV_UI_PORT = config_loader.get_port("ltxv", 8000)
# -----------------------------------------

def build_config(json_file, output_html, header_sub):
    return {
        'json_file': json_file,
        'output_html': output_html,
        'title': 'MMH3X2 · Panel Pro',
        'enhancer_title': 'Mejorar prompt con IA (MiniMax H3 / Ollama)',
        'ui_html': 'mmh3x2_html.html',
        'ui_css': 'mmh3x2.css',
        'ui_js': 'mmh3x2.js',
        'model_dirs': None,
        'model_fallback': '',
        'model_exclude': (),
        'lora_dirs': [(LORAS_DIR, LORAS_PREFIX)],
        'lora_fallback': 'minimax_h3_fl2v_turbo_4step_v1.1_768p_comfyui_bf16.safetensors',
        'vae_dir': VAE_APPROX_DIR,
        'vae_fallback': 'taeh3.safetensors',
        'interp_dir': INTERP_DIR,
        'interp_fallback': 'rife_v4.26.safetensors',
        'unet_dirs': [(UNET_DIR, UNET_PREFIX)],
        'unet_fallback': 'minimaxh3/minimax_h3_fused_refdelta_r1024_turbo8_mystic07_int8_convrot.safetensors',
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
        'header_sub': header_sub,
        'model_count_label': '',
        'mmh3x2_ui_port': MMH3X2_UI_PORT,
        'ltxv_ui_port': LTXV_UI_PORT,
    }

def main():
    # Variante Base: cadena fija del workflow original
    generate_html(build_config(
        JSON_FILE,
        OUTPUT_HTML,
        'grafo: MMH3X2_4IMG'
    ))
    # Variante BlockATT: cadena flexible con H3SparseAttentionAdvanced + AIMDO.
    # BlockSparseAttention está oculto porque falla en MiniMax H3 en MMH3X2
    # (make_forward.<locals>.forward() got an unexpected keyword argument 'attention').
    generate_html(build_config(
        'MMH3X2_4IMG_BLOCKATT.json',
        'MMH3X2_WebUI_BlockATT.html',
        'grafo: MMH3X2_4IMG_BLOCKATT'
    ))

if __name__ == '__main__':
    main()
