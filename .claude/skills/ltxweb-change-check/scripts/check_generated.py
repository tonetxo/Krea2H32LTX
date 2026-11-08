#!/usr/bin/env python3
"""Comprueba que los *_WebUI*.html generados no tienen placeholders sin sustituir
ni errores de sintaxis en su JS incrustado (con `node --check`).

Uso: check_generated.py [fichero.html ...]   (por defecto, todos los *_WebUI*.html)
Se ejecuta desde la raíz de LTXWeb.
"""
import glob
import os
import re
import shutil
import subprocess
import sys
import tempfile

SCRIPT_RE = re.compile(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", re.S | re.I)
PLACEHOLDER_RE = re.compile(r"__[A-Z][A-Z0-9_]{2,}__")


def main():
    pages = sys.argv[1:] or sorted(glob.glob("*_WebUI*.html"))
    if not pages:
        sys.exit("No hay *_WebUI*.html: ejecuta antes los generadores.")
    node = shutil.which("node")
    if not node:
        print("Aviso: node no está en el PATH; solo se comprueban los placeholders.")

    bad = 0
    for page in pages:
        html = open(page, encoding="utf-8").read()
        problems = sorted(set(PLACEHOLDER_RE.findall(html)))
        msg = [f"placeholders sin sustituir: {', '.join(problems)}"] if problems else []
        if node:
            for i, js in enumerate(SCRIPT_RE.findall(html)):
                with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
                    f.write(js)
                res = subprocess.run([node, "--check", f.name], capture_output=True, text=True)
                os.unlink(f.name)
                if res.returncode != 0:
                    err = res.stderr.strip().splitlines()
                    msg.append(f"script #{i}: " + " | ".join(err[:4]))
        status = "OK" if not msg else "FALLO"
        bad += bool(msg)
        print(f"[{status}] {page}")
        for m in msg:
            print("    " + m)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
