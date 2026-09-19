import os
import config_loader
from generar_common import generate_html

# --- CONFIGURACIÓN DINÁMICA Y PORTABLE ---
JSON_FILE = os.environ.get("MINIMAXH3_JSON", "MiniMax_H3_Prewiews_OK.json")
OUTPUT_HTML = os.environ.get("MINIMAXH3_OUTPUT_HTML", "MiniMaxH3_WebUI.html")
UNET_DIR = os.environ.get("MINIMAXH3_UNET_DIR", config_loader.get_model_subdirs("diffusion_models"))
UNET_PREFIX = os.environ.get("MINIMAXH3_UNET_PREFIX", "")
CLIP_DIR = os.environ.get("MINIMAXH3_CLIP_DIR", config_loader.get_model_subdirs("text_encoders"))
_loras_base = config_loader.get_model_subdirs("loras")
_loras_h3 = os.path.join(_loras_base, "h3")
LORAS_DIR = os.environ.get("MINIMAXH3_LORAS_DIR", _loras_h3 if os.path.isdir(_loras_h3) else _loras_base)
LORAS_PREFIX = os.environ.get("MINIMAXH3_LORAS_PREFIX", "h3" if os.path.isdir(_loras_h3) else "")
INTERP_DIR = os.environ.get("MINIMAXH3_INTERP_DIR", config_loader.get_model_subdirs("frame_interpolation"))
VAE_APPROX_DIR = os.environ.get("MINIMAXH3_VAE_DIR", os.path.join(config_loader.get_comfyui_root(), "models", "vae_approx"))
MINIMAXH3_UI_PORT = config_loader.get_port("minimaxh3", 8002)
MMH3X2_UI_PORT = config_loader.get_port("mmh3x2", 8003)
# -----------------------------------------

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
        # LoRAs / Turbo LoRAs de MiniMaxH3
        'lora_dirs': [(LORAS_DIR, LORAS_PREFIX)],
        'lora_fallback': 'minimax_h3_fl2v_turbo_4step_v1.1_768p_comfyui_bf16.safetensors',
        # VAEs aproximados (taeh3 para live previews de alta calidad)
        'vae_dir': VAE_APPROX_DIR,
        'vae_fallback': 'taeh3.safetensors',
        # Frame Interpolation (RIFE / FILM)
        'interp_dir': INTERP_DIR,
        'interp_fallback': 'rife_v4.26.safetensors',
        # UNet y CLIP sí se exponen como selectores.
        'unet_dirs': [(UNET_DIR, UNET_PREFIX)],
        'unet_fallback': 'minimaxh3/minimax_h3_fl2va_pruned_int8_convrot.safetensors',
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
        'mmh3x2_ui_port': MMH3X2_UI_PORT,
    })

if __name__ == '__main__':
    main()