import os
import config_loader
from generar_common import generate_html

# --- CONFIGURACIÓN DINÁMICA Y PORTABLE ---
JSON_FILE = os.environ.get("LTXV_JSON", "LTXV_DMD_OK.json")
OUTPUT_HTML = os.environ.get("LTXV_OUTPUT_HTML", "LTXV_WebUI.html")
_loras_base = config_loader.get_model_subdirs("loras")
_loras_ltxv = os.path.join(_loras_base, "ltxv")
LORAS_DIR = os.environ.get("LTXV_LORAS_DIR", _loras_ltxv if os.path.isdir(_loras_ltxv) else _loras_base)

_checkpoints = config_loader.get_model_subdirs("checkpoints")
_diff_models = config_loader.get_model_subdirs("diffusion_models")
_ltxv_models = os.path.join(_diff_models, "ltxv")

MODELS_DIR = os.environ.get("LTXV_MODELS_DIR", _ltxv_models if os.path.isdir(_ltxv_models) else _diff_models)
SD_MODELS_DIR = os.environ.get("LTXV_SD_MODELS_DIR", _checkpoints)
DIFFUSION_MODELS_DIR = os.environ.get("LTXV_DIFFUSION_MODELS_DIR", _diff_models)

VAE_DIR = os.environ.get("LTXV_VAE_DIR", config_loader.get_model_subdirs("vae"))
VAE_PREFIX = os.environ.get("LTXV_VAE_PREFIX", "")
VAE_FALLBACK = os.environ.get("LTXV_VAE_FALLBACK", "LTX-2/ltx-2.5-video-vae-bf16.safetensors")
INTERP_DIR = os.environ.get("LTXV_INTERP_DIR", config_loader.get_model_subdirs("frame_interpolation"))
CLIP_DIR = os.environ.get("LTXV_CLIP_DIR", config_loader.get_model_subdirs("text_encoders"))

LTXV_UI_PORT = config_loader.get_port("ltxv", 8000)
MMH3X2_UI_PORT = config_loader.get_port("mmh3x2", 8003)
# -----------------------------------------

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
            (DIFFUSION_MODELS_DIR, 'diffusion_models'),
        ],
        'model_fallback': 'diffusion_models/ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors',
        'model_include': ('ltx', 'sulphur'),
        'model_exclude': ('StableAudio/', 'HiDream/', 'sam3.1_multiplex_fp16', 'lens_turbo_bf16', 'sd3.5/', 'sdxl/', 'diffusion_models/minimaxh3/'),
        'clip_dirs': [(CLIP_DIR, '')],
        'clip_fallback': 'gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot-v2.safetensors',
        'clip_include': ('gemma', 'ltx'),
        'clip_exclude': ('AceStep', 'ViT-L-14', 'byt5', 'clip_g', 'clip_l',
                         'ministral', 'mistral', 'qwen', 'sulphur',
                         't5xxl', 'gpt_oss'),
        'vae_dir': [(VAE_DIR, VAE_PREFIX)],
        'vae_fallback': VAE_FALLBACK,
        # Frame Interpolation (RIFE / FILM)
        'interp_dir': INTERP_DIR,
        'interp_fallback': 'rife_v4.26.safetensors',
        'lora_dir': LORAS_DIR,
        'lora_fallback': 'ltxv/Ltx2.3-Licon-VBVR-I2V-390K-R32.safetensors',
        'header_title': 'LTXV',
        'header_sub': 'grafo: LTXV_DMD_OK',
        'model_count_label': '',  # LTXV only reports LoRAs
        'ltxv_ui_port': LTXV_UI_PORT,
        'mmh3x2_ui_port': MMH3X2_UI_PORT,
    })

if __name__ == '__main__':
    main()