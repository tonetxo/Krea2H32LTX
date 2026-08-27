"""Static file server with no-cache headers + backend proxy.

Used by lanzar_ltxv.sh. Serves LTXV_WebUI.html and proxies API
requests to the ComfyUI backend (127.0.0.1:7821) so the phone can
reach the backend through the same port 8000 (no extra firewall
rules, no CORS issues).

Backend routes proxied:
  /system_stats, /prompt, /history/*, /view, /upload/image, /ws

Custom routes:
  /api/krea2_list -> lists PNGs in KREA2_OUTPUT_DIR (default: ComfyUI/output/krea2)

Usage: python3 serve.py [PORT] [BACKEND_URL] [KREA2_OUTPUT_DIR] [HOST]
  PORT              default 8000
  BACKEND_URL       default http://127.0.0.1:7821
  KREA2_OUTPUT_DIR  default auto-detected
  HOST              default 127.0.0.1 (use 0.0.0.0 for LAN access)
"""
import glob
import http.server
import json
import os
import re
import select
import socket
import socketserver
import subprocess
import sys
import time
import urllib.request
import urllib.error

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
HOST = sys.argv[4] if len(sys.argv) > 4 else os.environ.get("HOST", "127.0.0.1")
BACKEND = sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:7821"
OLLAMA = "http://127.0.0.1:11434"

# Custom routes that should be served locally (not proxied).
CUSTOM_PREFIXES = ("/api/krea2_list", "/api/ltxv_list", "/api/minimaxh3_list", "/api/file_delete", "/api/krea2_upload", "/api/video_preprocess")

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

    def handle(self):
        # Silenciar ConnectionResetError / BrokenPipeError cuando el navegador
        # cancela peticiones (típico al hacer scroll en la galería de thumbnails:
        # el IntersectionObserver dispara muchas /view y el navegador las aborta).
        try:
            super().handle()
        except (ConnectionResetError, BrokenPipeError):
            pass

    # ---- WebSocket proxy (/ws) ----
    def _ws_proxy(self):
        """Upgrade the client connection to WebSocket and relay to backend WS.

        Stdlib only: open a raw TCP socket to the backend, perform the WS
        handshake ourselves (forwarding the client's Sec-WebSocket-Key so the
        backend computes the matching Sec-WebSocket-Accept), then bridge raw
        bytes between browser and backend until either side closes. We do not
        parse WS framing: close-frame handling and (de)compression are
        negotiated end-to-end between the browser and the backend.
        """
        # Validar origen: solo same-origin puede conectar WebSocket.
        if not self._allowed_origin():
            sys.stderr.write("[serve] WS rechazado: origen no permitido\n")
            try:
                self.send_response(403)
                self.end_headers()
            except OSError:
                pass
            return
        client = self.connection
        backend_host, backend_port = self._parse_backend_ws_host_port()
        query = self.path.split("?", 1)[1] if "?" in self.path else ""
        backend_path = "/ws" + ("?" + query if query else "")

        # Connect a raw socket to the backend WS endpoint.
        try:
            backend = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            backend.connect((backend_host, backend_port))
        except OSError as e:
            sys.stderr.write(f"[serve] WS backend connect failed: {e}\n")
            try:
                self.send_response(502)
                self.end_headers()
            except OSError:
                pass
            return

        # Build the upgrade request. Forward the client's Sec-WebSocket-Key
        # verbatim so the backend's Sec-WebSocket-Accept matches what the
        # browser expects, and forward Protocol/Extensions so subprotocol and
        # permessage-deflate are negotiated end-to-end.
        ws_key = self.headers.get("Sec-WebSocket-Key") or "dGhlIHNhbXBsZSBub25jZQ=="
        ws_version = self.headers.get("Sec-WebSocket-Version", "13")
        ws_protocol = self.headers.get("Sec-WebSocket-Protocol")
        ws_extensions = self.headers.get("Sec-WebSocket-Extensions")
        req_lines = [
            f"GET {backend_path} HTTP/1.1",
            f"Host: {backend_host}:{backend_port}",
            "Upgrade: websocket",
            "Connection: Upgrade",
            f"Sec-WebSocket-Key: {ws_key}",
            f"Sec-WebSocket-Version: {ws_version}",
        ]
        if ws_protocol:
            req_lines.append(f"Sec-WebSocket-Protocol: {ws_protocol}")
        if ws_extensions:
            req_lines.append(f"Sec-WebSocket-Extensions: {ws_extensions}")
        req_lines.append("")
        req_lines.append("")
        try:
            backend.sendall("\r\n".join(req_lines).encode("latin-1"))
        except OSError as e:
            sys.stderr.write(f"[serve] WS backend send handshake failed: {e}\n")
            backend.close()
            return

        # Read the backend's 101 Switching Protocols response (headers only,
        # but keep any trailing bytes that may be the start of a WS frame).
        backend.settimeout(10)
        resp = b""
        try:
            while b"\r\n\r\n" not in resp:
                chunk = backend.recv(4096)
                if not chunk:
                    break
                resp += chunk
        except socket.timeout:
            sys.stderr.write("[serve] WS backend handshake timed out\n")
            backend.close()
            return
        finally:
            backend.settimeout(None)

        if not resp.startswith(b"HTTP/1.1 101"):
            sys.stderr.write(f"[serve] WS backend handshake failed: {resp[:120]!r}\n")
            backend.close()
            try:
                self.send_response(502)
                self.end_headers()
            except OSError:
                pass
            return

        # Split the 101 headers from any piggybacked WS frame bytes.
        sep = resp.find(b"\r\n\r\n") + 4
        handshake = resp[:sep]
        leftover = resp[sep:]

        # Forward the 101 verbatim to the browser (correct Sec-WebSocket-Accept).
        # From here on we bypass http.server's response machinery.
        try:
            client.sendall(handshake)
        except OSError as e:
            sys.stderr.write(f"[serve] WS client send handshake failed: {e}\n")
            backend.close()
            return

        if leftover:
            try:
                client.sendall(leftover)
            except OSError:
                pass

        # Tell http.server we've taken over the socket; do not handle another
        # request on it.
        self.close_connection = True

        # Bidirectional raw byte bridge until either side closes.
        socks = [client, backend]
        try:
            while True:
                readable, _, _ = select.select(socks, [], [], 60.0)
                if not readable:
                    continue
                for s in readable:
                    other = backend if s is client else client
                    try:
                        data = s.recv(65536)
                    except OSError:
                        data = b""
                    if not data:
                        return
                    try:
                        other.sendall(data)
                    except OSError:
                        return
        finally:
            for s in (backend, client):
                try:
                    s.close()
                except OSError:
                    pass

    def _parse_backend_ws_host_port(self):
        """Return (host, port) for the backend WebSocket from BACKEND URL."""
        from urllib.parse import urlparse
        parsed = urlparse(BACKEND)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        return host, port

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
            self._ws_proxy()
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

    def _is_minimaxh3_list(self):
        path = self.path.split("?")[0]
        return path == "/api/minimaxh3_list"

    def _is_krea2_upload(self):
        path = self.path.split("?")[0]
        return path == "/api/krea2_upload"

    def _is_file_delete(self):
        path = self.path.split("?")[0]
        return path == "/api/file_delete"

    def _is_video_preprocess(self):
        path = self.path.split("?")[0]
        return path == "/api/video_preprocess"

    def _parse_multipart_parts(self):
        """Parsea un POST multipart/form-data y devuelve un dict {field_name: {...}}."""
        import re
        ctype = self.headers.get("Content-Type", "")
        if not ctype.startswith("multipart/form-data"):
            return None
        m = re.search(r'boundary=([^;]+)', ctype)
        if not m:
            return None
        boundary = m.group(1).strip().strip('"')
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0:
            return None
        body = self.rfile.read(length)
        delim = b"--" + boundary.encode()
        parts = body.split(delim)
        out = {}
        for part in parts:
            part = part.strip(b"\r\n")
            if not part or part == b"--":
                continue
            header_end = part.find(b"\r\n\r\n")
            offset = 4
            if header_end == -1:
                header_end = part.find(b"\n\n")
                offset = 2
            if header_end == -1:
                continue
            headers_raw = part[:header_end].decode("latin-1")
            content = part[header_end + offset:]
            # Tras el split por boundary, el contenido de cada parte termina con
            # el CRLF (o LF) que precede al siguiente boundary. Lo quitamos.
            if content.endswith(b"\r\n"):
                content = content[:-2]
            elif content.endswith(b"\n"):
                content = content[:-1]
            fn_match = re.search(r'filename="([^"]+)"', headers_raw)
            name_match = re.search(r'name="([^"]+)"', headers_raw)
            if name_match:
                out[name_match.group(1)] = {
                    "filename": fn_match.group(1) if fn_match else "",
                    "data": content,
                    "headers": headers_raw,
                }
        return out

    def _do_krea2_upload(self):
        """Guarda un blob de imagen en KREA2_OUTPUT_DIR para compartir con LTXV."""
        # Same-origin estricto: no permitir que sitios externos suban archivos.
        if not self._allowed_origin():
            self._send_json(403, {"error": "forbidden: solo same-origin puede subir archivos"})
            return
        parts = self._parse_multipart_parts()
        if not parts or "image" not in parts:
            self._send_json(400, {"error": "falta campo image"})
            return
        img = parts["image"]
        data = img["data"]
        if len(data) == 0:
            self._send_json(400, {"error": "imagen vacía"})
            return
        if len(data) > 20 * 1024 * 1024:
            self._send_json(413, {"error": "imagen demasiado grande (máx 20 MB)"})
            return
        # Determinar extensión por Content-Type o filename original.
        ct = ""
        for h in img["headers"].splitlines():
            if h.lower().startswith("content-type:"):
                ct = h.split(":", 1)[1].strip()
                break
        ext_map = {
            "image/png": ".png",
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/webp": ".webp",
        }
        ext = ".png"
        if ct in ext_map:
            ext = ext_map[ct]
        orig = img["filename"]
        if orig:
            _, e = os.path.splitext(orig)
            e = e.lower()
            if e in (".png", ".jpg", ".jpeg", ".webp"):
                ext = ".jpg" if e == ".jpeg" else e
        filename = f"ref_{int(time.time() * 1000)}{ext}"
        os.makedirs(KREA2_OUTPUT_DIR, exist_ok=True)
        path = os.path.join(KREA2_OUTPUT_DIR, filename)
        try:
            with open(path, "wb") as f:
                f.write(data)
            _LIST_CACHE.pop("krea2", None)
            sys.stderr.write(f"[serve] krea2_upload: {path}\n")
            self._send_json(200, {
                "name": filename,
                "subfolder": "krea2",
                "type": "output",
                "size": len(data),
            })
        except OSError as e:
            self._send_json(500, {"error": str(e)})

    def _do_video_preprocess(self):
        """Recibe un vídeo (mp4/webm/mov) + parámetros de preprocesado y lo
        reduce con ffmpeg para evitar OOM/subir el original a ComfyUI.

        Multipart: image=<file> + campos de texto: scale, ar_lock,
        trim_start, trim_end, skip_frames. Devuelve JSON:
          {video: {name, subfolder, type}, audio: {name, subfolder, type}|null}
        El audio (cuando existe y se pide) sigue el mismo recorte que el vídeo.
        """
        if not self._allowed_origin():
            self._send_json(403, {"error": "forbidden: solo same-origin puede subir archivos"})
            return
        parts = self._parse_multipart_parts()
        if not parts or "image" not in parts:
            self._send_json(400, {"error": "falta campo image"})
            return
        img = parts["image"]
        data = img["data"]
        if len(data) == 0:
            self._send_json(400, {"error": "vídeo vacío"})
            return
        if len(data) > 256 * 1024 * 1024:
            self._send_json(413, {"error": "vídeo demasiado grande (máx 256 MB)"})
            return

        def field(name, default):
            f = parts.get(name)
            if f is None or not f["data"]:
                return default
            return f["data"].decode("utf-8", "replace").strip()

        scale = field("scale", "1") or "1"
        ar_lock = field("ar_lock", "true").lower() in ("true", "1", "on")
        trim_start = field("trim_start", "")
        trim_end = field("trim_end", "")
        skip_frames = field("skip_frames", "1")
        use_audio = field("use_audio", "false").lower() in ("true", "1", "on")
        volume = field("volume", "1")

        try:
            scale = float(scale)
        except ValueError:
            scale = 1.0
        try:
            skip = int(skip_frames)
        except ValueError:
            skip = 1
        skip = max(1, min(skip, 60))
        try:
            vol = float(volume)
        except ValueError:
            vol = 1.0

        input_dir = os.path.join(COMFYUI_ROOT, "input", "reference")
        os.makedirs(input_dir, exist_ok=True)

        base = "ref_" + str(int(time.time() * 1000))
        src = os.path.join(input_dir, base + "_src.mp4")
        out_video = os.path.join(input_dir, base + ".mp4")
        out_audio = os.path.join(input_dir, base + "_audio.m4a")

        try:
            with open(src, "wb") as f:
                f.write(data)

            # --- dimensiones originales + detección de streams ---
            vw = vh = 0
            has_video = False
            has_audio = False
            try:
                out = subprocess.run(
                    ["ffprobe", "-v", "error", "-select_streams", "v:0",
                     "-show_entries", "stream=width,height", "-of", "csv=p=0", src],
                    capture_output=True, text=True, timeout=60)
                dims = out.stdout.strip().split(",")
                if len(dims) == 2 and dims[0].isdigit() and dims[1].isdigit():
                    vw, vh = int(dims[0]), int(dims[1])
                    has_video = True
            except Exception:
                pass
            try:
                out = subprocess.run(
                    ["ffprobe", "-v", "error", "-select_streams", "a:0",
                     "-show_entries", "stream=codec_name", "-of", "csv=p=0", src],
                    capture_output=True, text=True, timeout=60)
                has_audio = bool(out.stdout.strip())
            except Exception:
                pass

            # --- solo audio (pista sin vídeo) ---
            if not has_video:
                if not has_audio:
                    raise RuntimeError("sin pista de vídeo ni audio")
                acmd = ["ffmpeg", "-y", "-i", src]
                if trim_start:
                    acmd += ["-ss", trim_start]
                if trim_end:
                    acmd += ["-t", str(max(0.0, float(trim_end) - (float(trim_start) if trim_start else 0.0)))]
                if vol != 1.0:
                    acmd += ["-af", f"volume={vol}"]
                acmd += ["-vn", "-c:a", "aac", "-b:a", "128k", out_audio]
                subprocess.run(acmd, capture_output=True, timeout=300)
                if not os.path.exists(out_audio) or os.path.getsize(out_audio) == 0:
                    raise RuntimeError("ffmpeg no produjo audio de salida")
                audio_result = {"name": base + "_audio.m4a", "subfolder": "reference", "type": "input"}
                self._send_json(200, {"video": None, "audio": audio_result})
                return

            # --- vf (escalado + skip) ---
            vf = []
            if vw and vh and scale > 0 and scale != 1.0:
                nw = max(2, int(vw * scale) // 2 * 2)
                nh = max(2, int(vh * scale) // 2 * 2)
                if ar_lock:
                    vf.append(f"scale={nw}:{nh}")
                else:
                    vf.append(f"scale={nw}:{nh}")
            if skip > 1:
                vf.append(f"select='not(mod(n,{skip}))'")
                vf.append("setpts=N/FRAME_RATE/TB")

            cmd = ["ffmpeg", "-y", "-i", src]
            if trim_start:
                cmd += ["-ss", trim_start]
            if trim_end:
                cmd += ["-t", str(max(0.0, float(trim_end) - (float(trim_start) if trim_start else 0.0)))]
            if vf:
                cmd += ["-vf", ",".join(vf)]
            cmd += ["-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                    "-pix_fmt", "yuv420p", out_video]

            subprocess.run(cmd, capture_output=True, timeout=300)

            if not os.path.exists(out_video) or os.path.getsize(out_video) == 0:
                raise RuntimeError("ffmpeg no produjo vídeo de salida")

            # --- audio (mismo trim) ---
            audio_result = None
            if use_audio:
                acmd = ["ffmpeg", "-y", "-i", src]
                if trim_start:
                    acmd += ["-ss", trim_start]
                if trim_end:
                    acmd += ["-t", str(max(0.0, float(trim_end) - (float(trim_start) if trim_start else 0.0)))]
                if vol != 1.0:
                    acmd += ["-af", f"volume={vol}"]
                acmd += ["-vn", "-c:a", "aac", "-b:a", "128k", out_audio]
                subprocess.run(acmd, capture_output=True, timeout=300)
                if os.path.exists(out_audio) and os.path.getsize(out_audio) > 0:
                    audio_result = {"name": base + "_audio.m4a", "subfolder": "reference", "type": "input"}

            video_result = {"name": base + ".mp4", "subfolder": "reference", "type": "input"}
            self._send_json(200, {"video": video_result, "audio": audio_result})
        except subprocess.TimeoutExpired:
            self._send_json(500, {"error": "timeout procesando vídeo"})
        except OSError as e:
            self._send_json(500, {"error": str(e)})
        finally:
            try:
                if os.path.exists(src):
                    os.remove(src)
            except OSError:
                pass

    def _is_ws(self):
        return self.path.split("?")[0].startswith(WS_PREFIX)
    def do_GET(self):
        if self._is_ws():
            self._ws_proxy()
        elif self._is_krea2_list():
            self._do_krea2_list()
        elif self._is_ltxv_list():
            self._do_ltxv_list()
        elif self._is_minimaxh3_list():
            self._do_minimaxh3_list()
        elif self._is_ollama_route():
            self._proxy("GET", OLLAMA)
        elif self._is_proxy_route():
            self._proxy("GET", BACKEND)
        else:
            super().do_GET()

    def do_POST(self):
        if self._is_ws():
            self._ws_proxy()
        elif self._is_krea2_list():
            self._send_json(405, {"error": "method not allowed"})
        elif self._is_ltxv_list():
            self._send_json(405, {"error": "method not allowed"})
        elif self._is_minimaxh3_list():
            self._send_json(405, {"error": "method not allowed"})
        elif self._is_file_delete():
            self._do_file_delete()
        elif self._is_krea2_upload():
            self._do_krea2_upload()
        elif self._is_video_preprocess():
            self._do_video_preprocess()
        elif self._is_ollama_route():
            self._proxy("POST", OLLAMA)
        elif self._is_proxy_route():
            self._proxy("POST", BACKEND)
        else:
            self.send_error(405, "Method Not Allowed")

    def do_OPTIONS(self):
        if self._is_ws():
            self._ws_proxy()
        elif self._is_ollama_route():
            # Ollama rechaza preflight CORS desde orígenes no-localhost con 403.
            # Respondemos nosotros con los headers CORS correctos para que el
            # navegador deje pasar la POST real.
            self._cors_preflight()
        elif self._is_proxy_route():
            self._proxy("OPTIONS", BACKEND)
        elif self._is_krea2_upload() or self._is_file_delete() or self._is_video_preprocess() or self._is_krea2_list() or self._is_ltxv_list() or self._is_minimaxh3_list():
            # Endpoints custom también necesitan preflight same-origin.
            self._cors_preflight()
        else:
            self.send_error(405, "Method Not Allowed")

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
        output_dir = os.path.join(COMFYUI_ROOT, "output")
        try:
            paths = []
            for pattern in ("**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.webp"):
                paths.extend(glob.glob(os.path.join(output_dir, pattern), recursive=True))
            # eliminar duplicados si hay alias .jpg/.jpeg
            seen = set()
            unique_paths = []
            for p in paths:
                rp = os.path.realpath(p)
                if rp not in seen:
                    seen.add(rp)
                    unique_paths.append(p)
            paths_with_time = []
            for p in unique_paths:
                try:
                    paths_with_time.append((os.path.getmtime(p), p))
                except OSError:
                    continue
            paths_with_time.sort(key=lambda x: x[0], reverse=True)
            paths = [p for _, p in paths_with_time][:60]

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
            sys.stderr.write(f"[serve] krea2_list error: {e}\n")
        return {
            "dir": output_dir,
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

    def _do_minimaxh3_list(self):
        """List MP4s in ComfyUI output dir (recursive), newest first, max 100."""
        cached = _LIST_CACHE.get("minimaxh3")
        if cached and cached[0] > time.time():
            self._send_json(200, cached[1])
            return
        result = self._build_minimaxh3_list()
        _LIST_CACHE["minimaxh3"] = (time.time() + LIST_CACHE_TTL, result)
        self._send_json(200, result)

    def _build_minimaxh3_list(self):
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
            sys.stderr.write(f"[serve] minimaxh3_list error: {e}\n")
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
            _LIST_CACHE.pop("minimaxh3", None)
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

    def handle_error(self, request, client_address):
        # Silenciar tracebacks por conexiones canceladas por el cliente
        # (ConnectionResetError, BrokenPipeError: típicos al hacer scroll
        # en galerías de thumbnails donde el navegador aborta /view).
        import sys as _sys
        e = _sys.exc_info()[1]
        if isinstance(e, (ConnectionResetError, BrokenPipeError)):
            return
        super().handle_error(request, client_address)


def main():
    try:
        with ReusableServer((HOST, PORT), ProxyHandler) as httpd:
            sys.stderr.write(
                f"[serve] Sirviendo en {HOST}:{PORT} (proxy -> {BACKEND}, krea2 -> {KREA2_OUTPUT_DIR}, delete-allowed -> {ALLOWED_DELETE_DIRS}, no-cache)\n"
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
