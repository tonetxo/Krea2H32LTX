#!/bin/bash
# Configuración
HTML_FILE="LTXV_WebUI.html"
PORT=8000
BROWSER="firefox" # Cambia a 'google-chrome' o 'chromium' si prefieres

echo "🚀 Iniciando servidor local para LTXV Panel..."

# Verificar si el archivo HTML existe
if [ ! -f "$HTML_FILE" ]; then
    echo "❌ Error: No se encuentra $HTML_FILE en esta carpeta."
    exit 1
fi

# Aviso: el backend de inferencia (ComfyUI en :7821) debe estar escuchando en la
# LAN también. Por defecto ComfyUI solo escucha en 127.0.0.1; si quieres
# controlarlo desde el móvil u otro PC, lánzalo con --listen 0.0.0.0.
# (Si cambias el puerto, edita DEFAULT_BACKEND_PORT en generar_ltxv.py.)
if command -v ss >/dev/null 2>&1; then
  BACKEND_BIND=$(ss -tlnp 2>/dev/null | awk '/:7821 /{print $4; exit}')
  if [ -n "$BACKEND_BIND" ] && echo "$BACKEND_BIND" | grep -q '^127\.'; then
    echo "⚠️  El backend (ComfyUI :7821) solo escucha en $BACKEND_BIND."
    echo "   Si abres esta UI desde otro dispositivo en la LAN, la auto-detección"
    echo "   apuntará allí pero el backend rechazará la conexión. Relánzalo con"
    echo "   --listen 0.0.0.0 (o --listen <IP_LAN>) para hacerlo accesible."
  fi
fi

# Si ya hay algo escuchando en el puerto de la UI, no se puede bindear.
# Avisamos con el PID para que el usuario pueda matarlo (kill <PID> o
# 'pkill -f serve.py' si lo lanzó este script).
if command -v ss >/dev/null 2>&1; then
  UI_BIND=$(ss -tlnp 2>/dev/null | awk -v p=":$PORT " '$4 ~ p {print $0; exit}')
  if [ -n "$UI_BIND" ]; then
    echo "⚠️  Ya hay algo escuchando en :$PORT:"
    echo "    $UI_BIND"
    echo "    Ciérralo (Ctrl+C en la terminal que lo lanzó, o kill <PID>) y vuelve a ejecutar este script."
  fi
fi

# Abrir el navegador en segundo plano
echo "🌐 Abriendo navegador en http://localhost:$PORT/$HTML_FILE ..."
$BROWSER "http://localhost:$PORT/$HTML_FILE" &

# Servidor: serve.py añade Cache-Control: no-store a todas las respuestas
# para que el móvil siempre recargue la UI al cambiar de versión.
echo "🟢 Sirviendo (Ctrl+C para detener)..."
python3 serve.py "$PORT"

echo "🛑 Servidor detenido."
