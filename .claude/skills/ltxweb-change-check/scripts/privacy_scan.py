#!/usr/bin/env python3
"""Revisa lo que va a salir en un push de LTXWeb (repo público) buscando datos personales.

Uso: privacy_scan.py [rango]     (por defecto @{u}..HEAD: commits sin push)

Compara las líneas añadidas y los mensajes de commit con los nombres reales de esta
máquina (modelos, LoRAs, VAEs, imágenes de entrada de ComfyUI), que se leen en el
momento a través de config_loader; el script no guarda ninguno.

Salida: FALLO (bloquea el push) o REVISAR (decide una persona). Exit 1 si hay FALLO.
Se ejecuta desde la raíz de LTXWeb.
"""
import fnmatch
import os
import re
import subprocess
import sys

sys.path.insert(0, os.getcwd())
import config_loader  # noqa: E402

# Ficheros locales que nunca deben salir (además del .gitignore, por si se forzó un add).
NEVER_PUSH = ["*_WebUI*.html", "config.json", "prompts_*.json", "ESTADO_SESION.md", "bench_results.jsonl"]
MEDIA_RE = re.compile(r"[\w.\-() ,'&]+?\.(?:safetensors|gguf|ckpt|pth?|bin|sft|png|jpe?g|webp|mp4|webm|mov|wav|flac|mp3|cube)\b", re.I)
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
ALLOWED_EMAILS = {"noreply@anthropic.com"}
# Claves de workflow cuyos valores suelen llevar contenido personal.
WORKFLOW_KEYS_RE = re.compile(r'"(image|filename_prefix|text|prompt|lora(?:_name|_\d+)?|positive|negative)"\s*:\s*"([^"]{3,})"')


def git(*args):
    res = subprocess.run(["git", *args], capture_output=True, text=True)
    if res.returncode != 0:
        sys.exit(f"git {' '.join(args)} falló: {res.stderr.strip()}")
    return res.stdout


def local_names():
    names = set()
    dirs = [config_loader.get_model_subdirs(t) for t in
            ("loras", "diffusion_models", "text_encoders", "vae", "checkpoints", "upscale_models", "frame_interpolation")]
    dirs.append(os.path.join(config_loader.get_comfyui_root(), "input"))
    for d in dirs:
        if not os.path.isdir(d):
            continue
        for _root, _dirs, files in os.walk(d, followlinks=True):
            names.update(f.lower() for f in files)
    return names


def main():
    rng = sys.argv[1] if len(sys.argv) > 1 else "@{u}..HEAD"
    files = git("diff", "--name-only", rng).split()
    if not files and not git("log", "--format=%H", rng).strip():
        print(f"Nada que revisar en {rng}.")
        return

    home = os.path.expanduser("~")
    user = os.path.basename(home)
    names = local_names()
    fail, review = [], []

    for f in files:
        if any(fnmatch.fnmatch(os.path.basename(f), p) for p in NEVER_PUSH):
            fail.append(f"{f}: fichero local que no debe publicarse")

    def scan(text, where):
        if home in text or f"/home/{user}" in text:
            fail.append(f"{where}: ruta de tu home")
        for m in EMAIL_RE.findall(text):
            if m.lower() not in ALLOWED_EMAILS and not m.lower().endswith("@users.noreply.github.com"):
                review.append(f"{where}: email {m}")
        for m in MEDIA_RE.findall(text):
            if os.path.basename(m.strip()).lower() in names:
                fail.append(f"{where}: nombre real de esta máquina: {m.strip()}")

    current = None
    for line in git("diff", "-U0", rng).splitlines():
        if line.startswith("+++ b/"):
            current = line[6:]
        elif line.startswith("+") and not line.startswith("+++") and current:
            scan(line[1:], current)
            if current.endswith(".json"):
                for key, val in WORKFLOW_KEYS_RE.findall(line):
                    review.append(f"{current}: {key} = {val[:80]}")

    for sha_msg in git("log", "--format=%h%x00%B%x01", rng).split("\x01"):
        if "\x00" in sha_msg:
            sha, msg = sha_msg.split("\x00", 1)
            scan(msg, f"mensaje de commit {sha.strip()}")

    print(f"Rango: {rng} | {len(files)} ficheros | {len(names)} nombres locales comparados")
    for item in dict.fromkeys(fail):
        print("FALLO   " + item)
    for item in dict.fromkeys(review):
        print("REVISAR " + item)
    if not fail and not review:
        print("Limpio: no aparece nada personal.")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
