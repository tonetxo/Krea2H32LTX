"""Config loader and path auto-detection for LTXWeb workflows.

Provides clean, portable resolution of ComfyUI installation, models,
outputs, ports, and Ollama settings without hardcoding machine-specific paths.
"""

import json
import os

_REPO_DIR = os.path.dirname(os.path.abspath(__file__))
_CONFIG_CACHE = None


def load_config():
    """Load config.json if available, or return defaults."""
    global _CONFIG_CACHE
    if _CONFIG_CACHE is not None:
        return _CONFIG_CACHE

    config_path = os.path.join(_REPO_DIR, "config.json")
    if os.path.isfile(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                _CONFIG_CACHE = json.load(f)
                return _CONFIG_CACHE
        except Exception as e:
            print(f"⚠️ [config_loader] Error al leer config.json: {e}")

    _CONFIG_CACHE = {}
    return _CONFIG_CACHE


def get_comfyui_root():
    """Detect ComfyUI root directory dynamically."""
    cfg = load_config()
    cfg_root = cfg.get("comfyui", {}).get("root_dir")
    if cfg_root and os.path.isdir(os.path.expanduser(cfg_root)):
        return os.path.realpath(os.path.expanduser(cfg_root))

    env_root = os.environ.get("COMFYUI_ROOT") or os.environ.get("COMFYUI_DIR")
    if env_root and os.path.isdir(os.path.expanduser(env_root)):
        return os.path.realpath(os.path.expanduser(env_root))

    candidates = [
        os.path.join(_REPO_DIR, "..", "ComfyUI"),
        os.path.join(_REPO_DIR, "..", "..", "ComfyUI"),
        os.path.join(_REPO_DIR, "..", "..", "dlbackend", "ComfyUI"),
        os.path.expanduser("~/ComfyUI"),
        os.path.expanduser("~/SwarmUI/dlbackend/ComfyUI"),
    ]
    for c in candidates:
        r = os.path.realpath(os.path.expanduser(c))
        if os.path.isdir(r) and (
            os.path.isdir(os.path.join(r, "output"))
            or os.path.isdir(os.path.join(r, "models"))
            or os.path.isfile(os.path.join(r, "main.py"))
        ):
            return r

    # Fallback si no existe: devuelve ~/ComfyUI expandido
    return os.path.realpath(os.path.expanduser("~/ComfyUI"))


def get_models_dir():
    """Detect models directory dynamically."""
    cfg = load_config()
    cfg_models = cfg.get("comfyui", {}).get("models_dir")
    if cfg_models and os.path.isdir(os.path.expanduser(cfg_models)):
        return os.path.realpath(os.path.expanduser(cfg_models))

    env_models = os.environ.get("MODELS_DIR")
    if env_models and os.path.isdir(os.path.expanduser(env_models)):
        return os.path.realpath(os.path.expanduser(env_models))

    # Verificar si SwarmUI tiene Models compartido
    swarm_models = os.path.expanduser("~/SwarmUI/Models")
    if os.path.isdir(swarm_models):
        return os.path.realpath(swarm_models)

    root = get_comfyui_root()
    comfy_models = os.path.join(root, "models")
    if os.path.isdir(comfy_models):
        return os.path.realpath(comfy_models)

    return comfy_models


def get_output_dir():
    """Detect output directory dynamically."""
    cfg = load_config()
    cfg_out = cfg.get("comfyui", {}).get("output_dir")
    if cfg_out and os.path.isdir(os.path.expanduser(cfg_out)):
        return os.path.realpath(os.path.expanduser(cfg_out))

    env_out = os.environ.get("OUTPUT_DIR") or os.environ.get("COMFYUI_OUTPUT_DIR")
    if env_out and os.path.isdir(os.path.expanduser(env_out)):
        return os.path.realpath(os.path.expanduser(env_out))

    root = get_comfyui_root()
    comfy_out = os.path.join(root, "output")
    if os.path.isdir(comfy_out):
        return os.path.realpath(comfy_out)

    return comfy_out


def get_model_subdirs(model_type):
    """Devuelve la mejor ruta existente para un tipo de modelo específico.

    model_type puede ser:
      - 'diffusion_models'
      - 'text_encoders'
      - 'loras'
      - 'vae'
      - 'frame_interpolation'
      - 'checkpoints'
    """
    base_models = get_models_dir()
    comfy_root = get_comfyui_root()

    variations = {
        "diffusion_models": [
            os.path.join(base_models, "diffusion_models"),
            os.path.join(comfy_root, "models", "diffusion_models"),
        ],
        "text_encoders": [
            os.path.join(base_models, "text_encoders"),
            os.path.join(base_models, "clip"),
            os.path.join(comfy_root, "models", "text_encoders"),
            os.path.join(comfy_root, "models", "clip"),
        ],
        "loras": [
            os.path.join(base_models, "Lora"),
            os.path.join(base_models, "loras"),
            os.path.join(comfy_root, "models", "loras"),
        ],
        "vae": [
            os.path.join(base_models, "VAE"),
            os.path.join(base_models, "vae"),
            os.path.join(comfy_root, "models", "vae"),
        ],
        "frame_interpolation": [
            os.path.join(comfy_root, "models", "frame_interpolation"),
            os.path.join(base_models, "frame_interpolation"),
        ],
        "checkpoints": [
            os.path.join(base_models, "checkpoints"),
            os.path.join(base_models, "Stable-Diffusion"),
            os.path.join(comfy_root, "models", "checkpoints"),
        ],
    }

    candidates = variations.get(model_type, [os.path.join(base_models, model_type)])
    for c in candidates:
        if os.path.isdir(c):
            return os.path.realpath(c)

    return os.path.realpath(candidates[0])


def get_port(name, default):
    """Devuelve el puerto configurado para un servicio."""
    cfg = load_config()
    val = cfg.get("ports", {}).get(name)
    if val:
        return str(val)
    env_name = f"{name.upper()}_UI_PORT"
    return os.environ.get(env_name, str(default))


def get_comfyui_url():
    """Devuelve la URL de ComfyUI (con sondeo de puertos activos si no está configurada)."""
    cfg = load_config()
    configured = cfg.get("comfyui", {}).get("url") or os.environ.get("COMFYUI_URL")
    if configured:
        return configured

    import socket
    for p in (8188, 7821, 7820):
        try:
            with socket.create_connection(("127.0.0.1", p), timeout=0.08):
                return f"http://127.0.0.1:{p}"
        except OSError:
            pass

    return "http://127.0.0.1:8188"


def get_ollama_url():
    """Devuelve la URL de Ollama."""
    cfg = load_config()
    return cfg.get("ollama", {}).get("url") or os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
