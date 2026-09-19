#!/usr/bin/env python3
"""Diagnóstico de compatibilidad y dependencias para LTXWeb.

Comprueba:
  1. Conexión con ComfyUI y detección de nodos requeridos por los flujos de trabajo.
  2. Conexión con Ollama y disponibilidad de modelos (visión y texto).
  3. Detección automática o configurada de rutas de ComfyUI y modelos.
"""

import json
import os
import sys
import urllib.error
import urllib.request

import config_loader

# Mapeo de paquetes de nodos custom requeridos por los workflows
REQUIRED_PACKAGES = [
    {
        "name": "ComfyMath",
        "repo": "https://github.com/evanspearman/ComfyMath",
        "nodes": ["ComfyMathExpression"],
        "critical": True,
        "workflows": ["MMH3X2", "MiniMaxH3", "LTXV"],
    },
    {
        "name": "comfyui-ollama",
        "repo": "https://github.com/stavsap/comfyui-ollama",
        "nodes": ["OllamaConnectivityV2", "OllamaChat"],
        "critical": True,
        "workflows": ["MMH3X2 (modo asistido)"],
    },
    {
        "name": "ComfyUI-KJNodes",
        "repo": "https://github.com/kijai/ComfyUI-KJNodes",
        "nodes": ["GetImageSize", "ImageResizeKJv2"],
        "critical": True,
        "workflows": ["MMH3X2", "MiniMaxH3", "LTXV"],
    },
    {
        "name": "ComfyUI-VideoHelperSuite (VHS)",
        "repo": "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite",
        "nodes": ["VHS_LoadVideo"],
        "critical": False,
        "workflows": ["MMH3X2 (vídeo ref)", "LTXV"],
    },
    {
        "name": "comfyui-frame-interpolation",
        "repo": "https://github.com/Fannovel16/ComfyUI-Frame-Interpolation",
        "nodes": ["FrameInterpolate", "FrameInterpolationModelLoader"],
        "critical": False,
        "workflows": ["MMH3X2 (RIFE)", "MiniMaxH3", "LTXV"],
    },
    {
        "name": "Spectrum",
        "repo": "https://github.com/MinusZoneAI/ComfyUI-Spectrum",
        "nodes": ["SpectrumApplyMiniMaxH3"],
        "critical": False,
        "workflows": ["MMH3X2 (Spectrum)", "MiniMaxH3"],
    },
    {
        "name": "rgthree-comfy",
        "repo": "https://github.com/rgthree/rgthree-comfy",
        "nodes": ["Power Lora Loader (rgthree)", "Seed (rgthree)"],
        "critical": False,
        "workflows": ["Krea2", "LTXV"],
    },
    {
        "name": "MiniMax-H3 / Sparse Attention",
        "repo": "Nativo en ComfyUI / ComfyUI-PromptStudio",
        "nodes": ["MiniMaxH3ReferenceToVideo", "MiniMaxH3SigmaShift", "ModelAttentionBackend"],
        "critical": True,
        "workflows": ["MMH3X2", "MiniMaxH3"],
    },
]


def check_comfyui(comfy_url):
    print(f"\n📡 1. Verificando ComfyUI en {comfy_url}...")
    try:
        req = urllib.request.Request(f"{comfy_url}/system_stats", headers={"User-Agent": "LTXWeb-Doctor"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode())
            devices = data.get("devices", [])
            dev_str = ", ".join(f"{d.get('name')} (VRAM: {d.get('vram_total', 0)//(1024**2)} MB)" for d in devices)
            print(f"   ✅ ComfyUI activo y respondiendo. Dispositivos: {dev_str or 'CPU/Desconocido'}")
    except Exception as e:
        print(f"   ❌ No se pudo conectar con ComfyUI en {comfy_url}: {e}")
        print("   💡 Asegúrate de que ComfyUI esté iniciado o ajusta 'url' en config.json / variable COMFYUI_URL.")
        return None

    # Consultar /object_info para ver nodos instalados
    try:
        req = urllib.request.Request(f"{comfy_url}/object_info", headers={"User-Agent": "LTXWeb-Doctor"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            nodes_dict = json.loads(resp.read().decode())
            print(f"   ℹ️  Total de tipos de nodos registrados en ComfyUI: {len(nodes_dict)}")
            return nodes_dict
    except Exception as e:
        print(f"   ⚠️  No se pudo consultar /object_info: {e}")
        return {}


def check_custom_nodes(installed_nodes, comfy_root):
    print("\n🧩 2. Verificando Custom Nodes requeridos:")
    missing_packages = []

    for pkg in REQUIRED_PACKAGES:
        missing_in_pkg = [n for n in pkg["nodes"] if n not in installed_nodes]
        if not missing_in_pkg:
            print(f"   ✅ {pkg['name']} (OK)")
        else:
            status = "❌ CRÍTICO" if pkg["critical"] else "⚠️ OPCIONAL"
            print(f"   {status}: Falta '{pkg['name']}'")
            print(f"      Nodos ausentes: {', '.join(missing_in_pkg)}")
            print(f"      Usado en: {', '.join(pkg['workflows'])}")
            if pkg["repo"].startswith("http"):
                print(f"      Instalación: git clone {pkg['repo']}")
            missing_packages.append(pkg)

    if missing_packages and comfy_root and os.path.isdir(os.path.join(comfy_root, "custom_nodes")):
        cn_dir = os.path.join(comfy_root, "custom_nodes")
        print(f"\n💡 Para instalar los nodos ausentes en tu ComfyUI ({cn_dir}):")
        print(f"   cd {cn_dir}")
        for p in missing_packages:
            if p["repo"].startswith("http"):
                print(f"   git clone {p['repo']}")
        print("   Y reinicia ComfyUI.")

    return missing_packages


def check_ollama(ollama_url):
    print(f"\n🦙 3. Verificando Ollama en {ollama_url}...")
    try:
        req = urllib.request.Request(f"{ollama_url}/api/tags", headers={"User-Agent": "LTXWeb-Doctor"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode())
            models = [m.get("name") for m in data.get("models", [])]
            if models:
                print(f"   ✅ Ollama activo con {len(models)} modelos disponibles:")
                for m in models[:6]:
                    print(f"      • {m}")
                if len(models) > 6:
                    print(f"      ... y {len(models)-6} más.")
            else:
                print("   ⚠️  Ollama está activo pero no tiene modelos descargados.")
                print("      Recomendado: ollama pull deepseek-v4.1-flash (o tu modelo preferido)")
            return True
    except Exception as e:
        print(f"   ⚠️  Ollama no disponible en {ollama_url} (Opcional, necesario para Asistido de Seg 2 y Enhancer): {e}")
        return False


def check_directories():
    print("\n📁 4. Verificando rutas del sistema:")
    comfy_root = config_loader.get_comfyui_root()
    models_dir = config_loader.get_models_dir()
    output_dir = config_loader.get_output_dir()

    print(f"   • ComfyUI Root:  {comfy_root} {'✅' if os.path.isdir(comfy_root) else '❌ (No existe)'}")
    print(f"   • Models Dir:    {models_dir} {'✅' if os.path.isdir(models_dir) else '❌ (No existe)'}")
    print(f"   • Output Dir:    {output_dir} {'✅' if os.path.isdir(output_dir) else '⚠️ (Se creará al generar)'}")

    # Subcarpetas de modelos
    subtypes = ["diffusion_models", "text_encoders", "loras", "vae", "frame_interpolation"]
    for st in subtypes:
        p = config_loader.get_model_subdirs(st)
        count = 0
        if os.path.isdir(p):
            for _, _, files in os.walk(p):
                count += len([f for f in files if f.endswith(".safetensors") or f.endswith(".ckpt") or f.endswith(".pt")])
            print(f"     - {st:20}: {count} modelos en {p}")
        else:
            print(f"     - {st:20}: ⚠️  No encontrada ({p})")

    return comfy_root


def main():
    print("=" * 65)
    print("🔍 DIAGNÓSTICO DE ENTORNO Y PORTABILIDAD · LTXWeb")
    print("=" * 65)

    comfy_root = check_directories()
    comfy_url = config_loader.get_comfyui_url()
    ollama_url = config_loader.get_ollama_url()

    nodes_dict = check_comfyui(comfy_url)
    if nodes_dict is not None:
        check_custom_nodes(nodes_dict, comfy_root)

    check_ollama(ollama_url)

    print("\n" + "=" * 65)
    print("🚀 Para compilar las UIs web:")
    print("   python3 generar_mmh3x2.py && python3 generar_minimaxh3.py && python3 generar_krea2.py && python3 generar_ltxv.py")
    print("\n🌐 Para iniciar los servidores:")
    print("   python3 serve.py 8003  # MMH3X2 Panel Pro")
    print("   python3 serve.py 8002  # MiniMaxH3 Panel Pro")
    print("   python3 serve.py 8001  # Krea2 Panel Pro")
    print("   python3 serve.py 8000  # LTXV Panel Pro")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
