#!/bin/bash
# Configuración
HTML_FILE="Krea2_WebUI.html"
PORT=8001
BROWSER="firefox" # Cambia a 'google-chrome' o 'chromium' si prefieres

echo "🚀 Iniciando servidor local para Krea2 Panel..."

if [ ! -f "$HTML_FILE" ]; then
    echo "❌ Error: No se encuentra $HTML_FILE en esta carpeta."
    exit 1
fi

if command -v ss >/dev/null 2>&1; then
  BACKEND_BIND=$(ss -tlnp 2>/dev/null | awk '/:7821 /{print $4; exit}')
  if [ -n "$BACKEND_BIND" ] && echo "$BACKEND_BIND" | grep -q '^127\.'; then
    echo "⚠️  El backend (ComfyUI :7821) solo escucha en $BACKEND_BIND."
    echo "   Si abres esta UI desde otro dispositivo en la LAN, la auto-detección"
    echo "   apuntará allí pero el backend rechazará la conexión. Relánzalo con"
    echo "   --listen 0.0.0.0 (o --listen <IP_LAN>) para hacerlo accesible."
  fi
fi

echo "🌐 Abriendo navegador en http://localhost:$PORT/$HTML_FILE ..."
$BROWSER "http://localhost:$PORT/$HTML_FILE" &

echo "🟢 Sirviendo (Ctrl+C para detener)..."
python3 serve.py "$PORT"

echo "🛑 Servidor detenido."
