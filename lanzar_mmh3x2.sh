#!/bin/bash
# Configuración
HTML_FILE="MMH3X2_WebUI.html"
PORT=8003
BROWSER="firefox"

echo "Iniciando servidor local para MMH3X2 Panel..."

# Verificar si el archivo HTML existe
if [ ! -f "$HTML_FILE" ]; then
    echo "Error: No se encuentra $HTML_FILE en esta carpeta."
    echo "Ejecuta primero: python3 generar_mmh3x2.py"
    exit 1
fi

if command -v ss >/dev/null 2>&1; then
  BACKEND_BIND=$(ss -tlnp 2>/dev/null | awk '/:7821 /{print $4; exit}')
  if [ -n "$BACKEND_BIND" ] && echo "$BACKEND_BIND" | grep -q '^127\.'; then
    echo "Aviso: El backend (ComfyUI :7821) solo escucha en $BACKEND_BIND."
    echo "Si abres esta UI desde otro dispositivo en la LAN, relánzalo con --listen 0.0.0.0."
  fi
fi

if command -v ss >/dev/null 2>&1; then
  UI_BIND=$(ss -tlnp 2>/dev/null | awk -v p=":$PORT " '$4 ~ p {print $0; exit}')
  if [ -n "$UI_BIND" ]; then
    echo "Aviso: Ya hay algo escuchando en :$PORT: $UI_BIND"
  fi
fi

echo "Abriendo navegador en http://localhost:$PORT/$HTML_FILE ..."
"$BROWSER" "http://localhost:$PORT/$HTML_FILE" &

echo "Sirviendo en el puerto $PORT (Ctrl+C para detener)..."
HOST=0.0.0.0 python3 serve.py "$PORT" "$@"

echo "Servidor detenido."
