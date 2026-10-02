import os
import config_loader
from generar_common import generate_html

# --- CONFIGURACIÓN DINÁMICA Y PORTABLE ---
JSON_FILE = os.environ.get("KREAQWEN_JSON", "KreaQwen_Native.json")
OUTPUT_HTML = os.environ.get("KREAQWEN_OUTPUT_HTML", "KreaQwen_WebUI.html")

_diff_base = config_loader.get_model_subdirs("diffusion_models")
_diff_flux2 = os.path.join(_diff_base, "flux2")
_diff_qwen = os.path.join(_diff_base, "qwen")

UNET_DIRS = [
    (_diff_flux2, "flux2") if os.path.isdir(_diff_flux2) else (_diff_base, ""),
    (_diff_qwen, "qwen") if os.path.isdir(_diff_qwen) else (_diff_base, "")
]

_loras_base = config_loader.get_model_subdirs("loras")
LORAS_DIR = os.environ.get("KREAQWEN_LORAS_DIR", _loras_base)

CLIP_DIR = os.environ.get("KREAQWEN_CLIP_DIR", config_loader.get_model_subdirs("text_encoders"))
VAE_DIR = os.environ.get("KREAQWEN_VAE_DIR", config_loader.get_model_subdirs("vae"))
UPSCALE_DIR = os.environ.get("KREAQWEN_UPSCALE_DIR", config_loader.get_model_subdirs("upscale_models"))

LTXV_UI_PORT = config_loader.get_port("ltxv", 8000)
MINIMAXH3_UI_PORT = config_loader.get_port("minimaxh3", 8002)
MMH3X2_UI_PORT = config_loader.get_port("mmh3x2", 8003)
KREAQWEN_UI_PORT = config_loader.get_port("kreaqwen", 8004)
# -----------------------------------------

def main():
    generate_html({
        'json_file': JSON_FILE,
        'output_html': OUTPUT_HTML,
        'title': 'KreaQwen · Studio Pro',
        'enhancer_title': 'Mejorar prompt con IA (Qwen 2.1 / Krea2 · Ollama)',
        'ui_html': 'kreaqwen_html.html',
        'ui_css': 'kreaqwen.css',
        'ui_js': 'kreaqwen.js',
        'model_dirs': UNET_DIRS,
        'model_fallback': 'flux2/jibMixKrea2_v40Habanero.safetensors',
        'model_exclude': ('/boogu/', '/ernie/', '/nunchaku/', '/zimage/'),
        'lora_dir': LORAS_DIR,
        'lora_fallback': 'K2/realism_engine_krea2_v2.safetensors',
        'unet_dirs': UNET_DIRS,
        'unet_fallback': 'flux2/jibMixKrea2_v40Habanero.safetensors',
        'unet_exclude': ('/boogu/', '/ernie/', '/nunchaku/', '/zimage/'),
        'clip_dirs': [(CLIP_DIR, '')],
        'clip_fallback': 'qwen3vl_8b_int8_convrot.safetensors',
        'clip_include': ('qwen', 'flux', 'krea'),
        'clip_exclude': ('AceStep', 'ViT-L-14', 'byt5', 'clip_g', 'clip_l', 'gemma', 't5xxl'),
        'vae_dir': VAE_DIR,
        'vae_fallback': 'QwenImage/qwen_image_2.1_vae_bf16.safetensors',
        'vae_include': ('qwen', 'flux', 'wan'),
        'vae_exclude': ('audio', 'video'),
        'upscale_dir': UPSCALE_DIR,
        'upscale_fallback': '4xPurePhoto-Span.pth',
        'lut_dirs': config_loader.get_lut_dirs(),
        'header_title': 'KreaQwen',
        'header_sub': 'grafo: KreaQwen_Native · 2-Stage Diffusion & Refiner',
        'model_count_label': 'modelos diffusion',
        'ltxv_ui_port': LTXV_UI_PORT,
        'minimaxh3_ui_port': MINIMAXH3_UI_PORT,
        'mmh3x2_ui_port': MMH3X2_UI_PORT,
        'kreaqwen_ui_port': KREAQWEN_UI_PORT,
    })

if __name__ == '__main__':
    main()
