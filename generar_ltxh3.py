import json
import os
import config_loader
from generar_common import generate_html, get_file_list, filter_names

# --- CONFIGURACIÓN DINÁMICA Y PORTABLE ---
# Dos grafos: LTX-2.5 (pase 1) -> MiniMax H3 (refinado) y el inverso. El primero
# va como BASE_GRAPH; el segundo, como constante extra (BASE_GRAPH_H3_LTX).
JSON_LTX_H3 = os.environ.get("LTXH3_JSON_LTX_H3", "LTXH3_LTX_to_H3.json")
JSON_H3_LTX = os.environ.get("LTXH3_JSON_H3_LTX", "LTXH3_H3_to_LTX.json")
OUTPUT_HTML = os.environ.get("LTXH3_OUTPUT_HTML", "LTXH3_WebUI.html")
UNET_DIR = os.environ.get("LTXH3_UNET_DIR", config_loader.get_model_subdirs("diffusion_models"))
CLIP_DIR = os.environ.get("LTXH3_CLIP_DIR", config_loader.get_model_subdirs("text_encoders"))
VAE_DIR = os.environ.get("LTXH3_VAE_DIR", config_loader.get_model_subdirs("vae"))
LORAS_DIR = os.environ.get("LTXH3_LORAS_DIR", config_loader.get_model_subdirs("loras"))
INTERP_DIR = os.environ.get("LTXH3_INTERP_DIR", config_loader.get_model_subdirs("frame_interpolation"))
LATENT_UPSCALE_DIR = os.environ.get("LTXH3_LATENT_UPSCALE_DIR", config_loader.get_model_subdirs("latent_upscale_models"))
VAE_APPROX_DIR = os.environ.get("LTXH3_VAE_APPROX_DIR", config_loader.get_model_subdirs("vae_approx"))
LTXH3_UI_PORT = config_loader.get_port("ltxh3", 8005)
# -----------------------------------------


def main():
    with open(JSON_H3_LTX, 'r', encoding='utf-8') as f:
        graph_h3_ltx = json.load(f)
    latent_upscalers = filter_names(get_file_list(LATENT_UPSCALE_DIR), include=('ltx', 'minimax', 'h3'))
    taeh3 = filter_names(get_file_list(VAE_APPROX_DIR), include=('taeh3',))

    generate_html({
        'json_file': JSON_LTX_H3,
        'output_html': OUTPUT_HTML,
        'title': 'LTXH3 · Panel Pro',
        'enhancer_title': 'Mejorar prompt con IA (idea previa)',
        'ui_html': 'ltxh3_html.html',
        'ui_css': 'ltxh3.css',
        'ui_js': 'ltxh3.js',
        'model_dirs': None,
        'model_fallback': '',
        # La UI separa cada lista por familia (LTX / H3) al rellenar los selectores.
        'lora_dirs': [(LORAS_DIR, '')],
        'lora_fallback': '',
        'unet_dirs': [(UNET_DIR, '')],
        'unet_include': ('ltx', 'minimax', 'fasth3'),
        'unet_exclude': ('music',),
        'clip_dirs': [(CLIP_DIR, '')],
        'clip_include': ('gemma', 'qwen3vl'),
        'vae_dir': VAE_DIR,
        'vae_fallback': '',
        'vae_include': ('ltx', 'minimax_h3'),
        'vae_exclude': ('music', 'taeltx'),
        'interp_dir': INTERP_DIR,
        'interp_fallback': 'rife_v4.26.safetensors',
        'header_title': 'LTXH3',
        'header_sub': 'grafo: LTX-2.5 ⇄ MiniMax H3 · base + refinado latente 2x',
        'model_count_label': '',
        'ltxv_ui_port': config_loader.get_port("ltxv", 8000),
        'minimaxh3_ui_port': config_loader.get_port("minimaxh3", 8002),
        'mmh3x2_ui_port': config_loader.get_port("mmh3x2", 8003),
        'kreaqwen_ui_port': config_loader.get_port("kreaqwen", 8004),
        'extra_consts': {
            'BASE_GRAPH_H3_LTX': graph_h3_ltx,
            'AVAILABLE_LATENT_UPSCALERS': latent_upscalers,
            'AVAILABLE_TAEH3': taeh3,
            # URLs vistas desde ComfyUI: las usa el nodo OllamaConnectivityV2 del grafo.
            'LLM_OLLAMA_URL': config_loader.get_ollama_url(),
            'LLM_LLAMACPP_URL': config_loader.get_llamacpp_url(),
            'LTXH3_UI_PORT': LTXH3_UI_PORT,
        },
    })


if __name__ == '__main__':
    main()
