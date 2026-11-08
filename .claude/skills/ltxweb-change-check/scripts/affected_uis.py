#!/usr/bin/env python3
"""Decide qué generadores de LTXWeb hay que ejecutar según los ficheros cambiados.

Uso:
  affected_uis.py                 # cambios sin commit + commits sin push
  affected_uis.py --base <ref>    # además, todo lo cambiado desde <ref>
  affected_uis.py --all           # todas las UIs
  affected_uis.py --run           # ejecuta los generadores elegidos

Se ejecuta desde la raíz del repo (la que contiene generar_common.py).
"""
import argparse
import glob
import os
import re
import subprocess
import sys

# Ficheros que entran en todas las UIs: un cambio aquí obliga a regenerarlas todas.
SHARED = {
    "templates/base.css",
    "templates/common.js",
    "templates/common_html.html",
    "templates/common_head.html",
    "generar_common.py",
    "config_loader.py",
}


def git_lines(*args):
    out = subprocess.run(["git", *args], capture_output=True, text=True)
    return [l for l in out.stdout.splitlines() if l.strip()] if out.returncode == 0 else []


def changed_files(base):
    files = set()
    for line in git_lines("status", "--porcelain"):
        path = line[3:].split(" -> ")[-1]
        files.add(path)
    files.update(git_lines("diff", "--name-only", "@{u}..HEAD"))
    if base:
        files.update(git_lines("diff", "--name-only", f"{base}..HEAD"))
    return files


def generators():
    """Devuelve {ui: (script, {workflow.json, ...})} leyendo cada generar_*.py."""
    gens = {}
    for script in sorted(glob.glob("generar_*.py")):
        ui = script[len("generar_"):-3]
        if ui == "common":
            continue
        text = open(script, encoding="utf-8").read()
        jsons = set(re.findall(r"['\"]([\w.\-]+\.json)['\"]", text))
        gens[ui] = (script, jsons)
    return gens


def affected(files, gens):
    if files & SHARED:
        return set(gens), sorted(files & SHARED)
    uis, reasons = set(), []
    for f in files:
        name = os.path.basename(f)
        for ui, (script, jsons) in gens.items():
            if f == script or name in jsons or (f.startswith("templates/") and (name.startswith(ui + ".") or name.startswith(ui + "_"))):
                uis.add(ui)
                reasons.append(f"{f} -> {ui}")
    return uis, reasons


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--run", action="store_true")
    args = ap.parse_args()

    if not os.path.exists("generar_common.py"):
        sys.exit("Ejecuta desde la raíz de LTXWeb (no se encuentra generar_common.py).")

    gens = generators()
    if args.all:
        uis, reasons = set(gens), ["--all"]
    else:
        files = changed_files(args.base)
        uis, reasons = affected(files, gens)
        if "serve.py" in files:
            print("Aviso: serve.py cambió; reinicia los servidores de las UIs (no basta con regenerar).")

    if not uis:
        print("Ninguna UI afectada.")
        return
    print("UIs afectadas:", " ".join(sorted(uis)))
    for r in reasons:
        print("  ", r)

    if args.run:
        failed = []
        for ui in sorted(uis):
            script = gens[ui][0]
            res = subprocess.run([sys.executable, script], capture_output=True, text=True)
            last = (res.stdout.strip().splitlines() or [""])[-1]
            print(f"[{'OK' if res.returncode == 0 else 'FALLO'}] {script}: {last}")
            if res.returncode != 0:
                failed.append(script)
                print(res.stderr[-1500:])
        if failed:
            sys.exit(1)


if __name__ == "__main__":
    main()
