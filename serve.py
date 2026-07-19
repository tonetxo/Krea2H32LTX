"""Static file server with no-cache headers + backend proxy.

Used by lanzar_ltxv.sh. Serves LTXV_WebUI.html and proxies API
requests to the ComfyUI backend (127.0.0.1:7821) so the phone can
reach the backend through the same port 8000 (no extra firewall
rules, no CORS issues).

Backend routes proxied:
  /system_stats, /prompt, /history/*, /view, /upload/image
  /ws -> returns 426 (pollFallback handles it)

Custom routes:
  /api/krea2_list -> lists PNGs in KREA2_OUTPUT_DIR (default: ComfyUI/output/krea2)

Usage: python3 serve.py [PORT] [BACKEND_URL] [KREA2_OUTPUT_DIR]
  PORT              default 8000
  BACKEND_URL       default http://127.0.0.1:7821
  KREA2_OUTPUT_DIR  default auto-detected
"""
import glob
import http.server
import json
import os
import socketserver
import sys
import time
import urllib.request
import urllib.error

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
BACKEND = sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:7821"
OLLAMA = "http://127.0.0.1:11434"

# Custom routes that should be served locally (not proxied).
CUSTOM_PREFIXES = ("/api/krea2_list", "/api/ltxv_list", "/api/file_delete")

# ComfyUI's output dir holds subfolders per SaveImage filename_prefix.
# Default: relative to ComfyUI's typical install at ~/ComfyUI/output/krea2.
# Override via env var KREA2_OUTPUT_DIR or third CLI arg.
def _resolve_krea2_dir():
    if len(sys.argv) > 3:
        return os.path.expanduser(sys.argv[3])
    env = os.environ.get("KREA2_OUTPUT_DIR")
    if env:
        return os.path.expanduser(env)
    candidates = [
        os.path.expanduser("~/ComfyUI/output/krea2"),
        "/home/tonetxo/ComfyUI/output/krea2",
        os.path.expanduser("~/SwarmUI/dlbackend/ComfyUI/output/krea2"),
        "/home/tonetxo/SwarmUI/dlbackend/ComfyUI/output/krea2",
    ]
    for c in candidates:
        if os.path.isdir(c):
            return c
    return candidates[0]  # fall back; will report empty list

KREA2_OUTPUT_DIR = _resolve_krea2_dir()

# Caché simple por endpoint para /api/krea2_list y /api/ltxv_list.
# Evita hacer glob+stat en cada refresh. TTL bajo (5s) para que el usuario vea
# borrados/adiciones recientes sin esperar a que expire. Invalidado en file_delete.
_LIST_CACHE = {}  # key -> (expires_at, payload_dict)
LIST_CACHE_TTL = 5.0  # segundos

# ComfyUI's install root (parent of /output and /temp). Used to validate
# that file_delete targets are inside the backend's writable areas.
def _resolve_comfyui_root():
    candidates = [
        os.path.expanduser("~/ComfyUI"),
        os.path.expanduser("~/SwarmUI/dlbackend/ComfyUI"),
        "/home/tonetxo/ComfyUI",
        "/home/tonetxo/SwarmUI/dlbackend/ComfyUI",
    ]
    for c in candidates:
        if os.path.isdir(os.path.join(c, "output")):
            return c
    return os.path.dirname(KREA2_OUTPUT_DIR) + "/.."  # best-effort

COMFYUI_ROOT = os.path.realpath(_resolve_comfyui_root())
ALLOWED_DELETE_DIRS = (
    os.path.realpath(os.path.join(COMFYUI_ROOT, "output")),
    os.path.realpath(os.path.join(COMFYUI_ROOT, "temp")),
)

# Routes that should be proxied to the backend instead of served as files.
PROXY_PREFIXES = ("/system_stats", "/prompt", "/history", "/view", "/upload/image", "/queue", "/interrupt")
OLLAMA_PREFIXES = ("/api",)
WS_PREFIX = "/ws"


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        sys.stderr.write("[serve] " + (format % args) + "\n")

    # ---- dispatch ----
    def do_GET(self):
        if self._is_ws():
            self._ws_reject()
        elif self._is_krea2_list():
            self._do_krea2_list()
        elif self._is_ltxv_list():
            self._do_ltxv_list()
        elif self._is_ollama_route():
            self._proxy("GET", OLLAMA)
        elif self._is_proxy_route():
            self._proxy("GET", BACKEND)
        else:
            super().do_GET()

    def do_POST(self):
        if self._is_ws():
            self._ws_reject()
        elif self._is_krea2_list():
            self._send_json(405, {"error": "method not allowed"})
        elif self._is_ltxv_list():
            self._send_json(405, {"error": "method not allowed"})
        elif self._is_file_delete():
            self._do_file_delete()
        elif self._is_ollama_route():
            self._proxy("POST", OLLAMA)
        elif self._is_proxy_route():
            self._proxy("POST", BACKEND)
        else:
            self.send_error(405, "Method Not Allowed")

    def do_OPTIONS(self):
        if self._is_ws():
            self._ws_reject()
        elif self._is_ollama_route():
            # Ollama rechaza preflight CORS desde orígenes no-localhost con 403.
            # Respondemos nosotros con los headers CORS correctos para que el
            # navegador deje pasar la POST real.
            self._cors_preflight()
        elif self._is_proxy_route():
            self._proxy("OPTIONS", BACKEND)
        else:
            self.send_error(405, "Method Not Allowed")

    def _allowed_origin(self):
        """Devuelve el Origin del cliente si coincide con el host de esta petición
        (same-origin estricto). Bloquea que webs externas llamadas desde el mismo
        navegador puedan reachar el proxy o los endpoints locales con credenciales.
        Devuelve None si el origen no está permitido."""
        origin = self.headers.get("Origin")
        if not origin:
            return None
        host = self.headers.get("Host")
        if not host:
            return None
        # Orígenes válidos: mismo esquema (http/https) + mismo Host (host:port).
        # El Host header ya contiene el puerto que el navegador usó para llegar.
        for scheme in ("http", "https"):
            expected = f"{scheme}://{host}"
            if origin == expected:
                return origin
        return None

    def _cors_preflight(self):
        origin = self._allowed_origin()
        if not origin:
            # Origen no permitido: respondemos sin cabeceras CORS, el navegador bloqueará.
            self.send_response(204)
            self.end_headers()
            return
        req_method = self.headers.get("Access-Control-Request-Method", "POST")
        req_headers = self.headers.get("Access-Control-Request-Headers", "Content-Type")
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", req_headers)
        self.send_header("Access-Control-Max-Age", "43200")
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.end_headers()

    def do_HEAD(self):
        if self._is_ws():
            self._ws_reject()
        elif self._is_ollama_route():
            self._proxy("HEAD", OLLAMA)
        elif self._is_proxy_route():
            self._proxy("HEAD", BACKEND)
        else:
            super().do_HEAD()

    # ---- helpers ----
    def _is_proxy_route(self):
        path = self.path.split("?")[0]
        return any(path.startswith(p) for p in PROXY_PREFIXES)

    def _is_ollama_route(self):
        path = self.path.split("?")[0]
        return any(path.startswith(p) for p in OLLAMA_PREFIXES)

    def _is_krea2_list(self):
        path = self.path.split("?")[0]
        return path == "/api/krea2_list"

    def _is_ltxv_list(self):
        path = self.path.split("?")[0]
        return path == "/api/ltxv_list"

    def _is_file_delete(self):
        path = self.path.split("?")[0]
        return path == "/api/file_delete"

    def _is_ws(self):
        return self.path.split("?")[0].startswith(WS_PREFIX)

    def _ws_reject(self):
        self.send_response(426, "Upgrade Required")
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"WebSocket not proxied; pollFallback handles it.\n")

    def _do_krea2_list(self):
        """List PNGs in KREA2_OUTPUT_DIR, newest first, max 50."""
        cached = _LIST_CACHE.get("krea2")
        if cached and cached[0] > time.time():
            self._send_json(200, cached[1])
            return
        result = self._build_krea2_list()
        _LIST_CACHE["krea2"] = (time.time() + LIST_CACHE_TTL, result)
        self._send_json(200, result)

    def _build_krea2_list(self):
        items = []
        try:
            paths = glob.glob(os.path.join(KREA2_OUTPUT_DIR, "*.png"))
            paths_with_time = []
            for p in paths:
                try:
                    paths_with_time.append((os.path.getmtime(p), p))
                except OSError:
                    continue
            paths_with_time.sort(key=lambda x: x[0], reverse=True)
            paths = [p for _, p in paths_with_time][:50]

            for p in paths:
                try:
                    st = os.stat(p)
                    items.append({
                        "filename": os.path.basename(p),
                        "subfolder": "krea2",
                        "type": "output",
                        "mtime": int(st.st_mtime),
                        "size": st.st_size,
                    })
                except OSError:
                    continue
        except OSError as e:
            sys.stderr.write(f"[serve] krea2_list error: {e}\n")
        return {
            "dir": KREA2_OUTPUT_DIR,
            "count": len(items),
            "items": items,
        }

    def _do_ltxv_list(self):
        """List MP4s in ComfyUI output dir (recursive), newest first, max 100."""
        cached = _LIST_CACHE.get("ltxv")
        if cached and cached[0] > time.time():
            self._send_json(200, cached[1])
            return
        result = self._build_ltxv_list()
        _LIST_CACHE["ltxv"] = (time.time() + LIST_CACHE_TTL, result)
        self._send_json(200, result)

    def _build_ltxv_list(self):
        items = []
        output_dir = os.path.join(COMFYUI_ROOT, "output")
        try:
            paths = glob.glob(os.path.join(output_dir, "**", "*.mp4"), recursive=True)
            paths_with_time = []
            for p in paths:
                try:
                    paths_with_time.append((os.path.getmtime(p), p))
                except OSError:
                    continue
            paths_with_time.sort(key=lambda x: x[0], reverse=True)
            paths = [p for _, p in paths_with_time][:100]

            for p in paths:
                try:
                    st = os.stat(p)
                    rel = os.path.relpath(p, output_dir)
                    parts = rel.split(os.sep)
                    filename = parts[-1]
                    subfolder = "/".join(parts[:-1]) if len(parts) > 1 else ""
                    items.append({
                        "filename": filename,
                        "subfolder": subfolder,
                        "type": "output",
                        "mtime": int(st.st_mtime),
                        "size": st.st_size,
                    })
                except OSError:
                    continue
        except OSError as e:
            sys.stderr.write(f"[serve] ltxv_list error: {e}\n")
        return {
            "dir": output_dir,
            "count": len(items),
            "items": items,
        }

    def _do_file_delete(self):
        """Delete a file inside ComfyUI's output/ or temp/. Validates path and origin."""
        # Same-origin estricto: bloquea que una web externa abierta en el navegador
        # pueda borrar archivos del disco del usuario vía CSRF.
        if not self._allowed_origin():
            self._send_json(403, {"error": "forbidden: solo same-origin puede llamar a file_delete"})
            return
        length = int(self.headers.get("Content-Length", 0))
        if length > 1024 * 1024:  # Limit payload to 1MB
            self._send_json(400, {"error": "Content-Length demasiado grande"})
            return
        raw = self.rfile.read(length) if length > 0 else b""
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            self._send_json(400, {"error": "JSON inválido"})
            return
        filename = payload.get("filename", "")
        subfolder = payload.get("subfolder", "")
        ftype = payload.get("type", "output")
        if not filename or "/" in filename or "\\" in filename or ".." in filename:
            self._send_json(400, {"error": "filename inválido"})
            return
        if "/" in subfolder or "\\" in subfolder or ".." in subfolder:
            self._send_json(400, {"error": "subfolder inválido"})
            return
        if ftype not in ("output", "temp", "input"):
            self._send_json(400, {"error": "type inválido"})
            return
        base = os.path.join(COMFYUI_ROOT, ftype)
        if subfolder:
            base = os.path.join(base, subfolder)
        target = os.path.realpath(os.path.join(base, filename))
        # Path must resolve inside one of the allowed directories
        if not any(target.startswith(d + os.sep) or target == d for d in ALLOWED_DELETE_DIRS):
            self._send_json(403, {"error": "path fuera de zonas permitidas", "target": target})
            return
        if not os.path.isfile(target):
            self._send_json(404, {"error": "no existe", "target": target})
            return
        try:
            os.remove(target)
            sys.stderr.write(f"[serve] file_delete: {target}\n")
            # Invalidar cachés de listado para que el siguiente /api/*_list refleje el borrado.
            _LIST_CACHE.pop("krea2", None)
            _LIST_CACHE.pop("ltxv", None)
            self._send_json(200, {"ok": True, "deleted": target})
        except OSError as e:
            self._send_json(500, {"error": str(e)})

    def _send_json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _proxy(self, method, base):
        """Forward the request to `base` and relay the response."""
        target = base + self.path
        body = None
        if method in ("POST", "PUT", "PATCH"):
            length = int(self.headers.get("Content-Length", 0))
            # Tope para evitar que un cliente (o un atacante desde una web maliciosa)
            # OOMee el proceso enviando cuerpos enormes al proxy. 100 MB es amplio
            # para los payloads de /prompt (workflow JSON) y de /upload/image (imágenes
            # y vídeos cortos). Subidas de vídeo muy grandes deberían trocearse por
            # el cliente o subirse directamente a ComfyUI.
            if length > 100 * 1024 * 1024:
                self.send_error(413, "Payload Too Large (máx 100 MB en el proxy)")
                return
            body = self.rfile.read(length) if length > 0 else b""

        # Exclude accept-encoding to prevent backend from returning compressed data,
        # which would require complex decompression logic and cause client issues
        # since we strip the Content-Encoding headers from the response.
        # Exclude cookie/authorization too: el proxy no debe reenviar credenciales
        # de sesión que pertenezcan a otros servicios de 127.0.0.1.
        req = urllib.request.Request(
            target,
            data=body,
            headers={
                k: v
                for k, v in self.headers.items()
                if k.lower()
                not in ("host", "connection", "transfer-encoding", "content-length",
                        "origin", "accept-encoding", "cookie", "authorization")
            },
            method=method,
        )
        # Forzar cierre de conexión tras la respuesta: evita reuse de sockets
        # que Ollama pueda haber reseteado por carga/descarga de modelos.
        req.add_header("Connection", "close")

        # Si reenviamos a Ollama, le mentimos sobre el Origin: Ollama solo
        # permite CORS desde localhost/127.0.0.1. Ponemos uno que sí acepte.
        if base == OLLAMA:
            req.add_header("Origin", "http://127.0.0.1:11434")

        # Siempre añadimos los headers CORS correctos para el cliente en la respuesta,
        # pero solo si el origen del cliente es same-origin (mismo host:port).
        client_origin = self._allowed_origin()

        try:
            with urllib.request.urlopen(req, timeout=600) as resp:
                self.send_response(resp.status)
                # Copy response headers (except transfer-encoding / connection)
                for k, v in resp.headers.items():
                    if k.lower() not in ("transfer-encoding", "connection", "content-encoding", "access-control-allow-origin"):
                        self.send_header(k, v)
                # Force closing connection on proxy responses under HTTP/1.1 to prevent browser hangs,
                # but preserve keep-alive for /view requests to allow smooth video streaming.
                if not self.path.split("?")[0].startswith("/view"):
                    self.send_header("Connection", "close")
                    self.close_connection = True
                if client_origin:
                    self.send_header("Access-Control-Allow-Origin", client_origin)
                    self.send_header("Vary", "Origin")
                self.end_headers()
                # Stream the body
                chunk = resp.read(65536)
                while chunk:
                    self.wfile.write(chunk)
                    chunk = resp.read(65536)
        except (ConnectionError, BrokenPipeError) as e:
            # Client disconnected early (e.g. browser cancelled request, closed tab, or seeked)
            # We log a simple line and return cleanly.
            sys.stderr.write(f"[serve] Client disconnected: {e}\n")
            return
        except urllib.error.HTTPError as e:
            try:
                self.send_response(e.code)
                for k, v in e.headers.items():
                    if k.lower() not in ("transfer-encoding", "connection", "content-encoding", "access-control-allow-origin"):
                        self.send_header(k, v)
                if not self.path.split("?")[0].startswith("/view"):
                    self.send_header("Connection", "close")
                    self.close_connection = True
                if client_origin:
                    self.send_header("Access-Control-Allow-Origin", client_origin)
                    self.send_header("Vary", "Origin")
                self.end_headers()
                chunk = e.read(65536)
                while chunk:
                    self.wfile.write(chunk)
                    chunk = e.read(65536)
            finally:
                e.close()
        except urllib.error.URLError as e:
            reason = str(e.reason)
            if "reset" in reason.lower() or "broken pipe" in reason.lower():
                sys.stderr.write(f"[serve] Backend reset: {reason} -> {target}\n")
                self.send_error(504, f"Backend cerró la conexión (puede estar cargando el modelo): {reason}")
            else:
                self.send_error(502, f"Backend unreachable: {reason}")
        except OSError as e:
            # If the socket is already closed, write fails can raise BrokenPipe/ConnectionReset here too.
            # We check and return cleanly.
            if e.errno in (32, 104):  # EPIPE, ECONNRESET
                sys.stderr.write(f"[serve] Client disconnected during error handler: {e}\n")
                return
            self.send_error(502, f"Backend error: {e}")


class ReusableServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    try:
        with ReusableServer(("0.0.0.0", PORT), ProxyHandler) as httpd:
            sys.stderr.write(
                f"[serve] Sirviendo en 0.0.0.0:{PORT} (proxy -> {BACKEND}, krea2 -> {KREA2_OUTPUT_DIR}, delete-allowed -> {ALLOWED_DELETE_DIRS}, no-cache)\n"
            )
            sys.stderr.flush()
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98:  # Address already in use
            sys.stderr.write(f"❌ Error: El puerto {PORT} ya está en uso. Cierra el proceso que lo está usando o elige otro puerto.\n")
        else:
            sys.stderr.write(f"❌ Error al iniciar el servidor: {e}\n")
        sys.exit(1)
    except KeyboardInterrupt:
        sys.stderr.write("[serve] Ctrl+C, saliendo.\n")


if __name__ == "__main__":
    main()
