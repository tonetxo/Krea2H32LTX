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

# Abrir el navegador en segundo plano
echo "🌐 Abriendo navegador en http://localhost:$PORT/$HTML_FILE ..."
$BROWSER "http://localhost:$PORT/$HTML_FILE" &

# Iniciar el servidor Python (esto mantendrá la terminal ocupada)
python3 -m http.server $PORT

# Cuando cierres el servidor (Ctrl+C), esto se ejecutará
echo "🛑 Servidor detenido."
