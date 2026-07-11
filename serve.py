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
import io
import json
import os
import socketserver
import sys
import urllib.request
import urllib.error

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
BACKEND = sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:7821"
OLLAMA = "http://127.0.0.1:11434"

# Custom routes that should be served locally (not proxied).
CUSTOM_PREFIXES = ("/api/krea2_list",)

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

# Routes that should be proxied to the backend instead of served as files.
PROXY_PREFIXES = ("/system_stats", "/prompt", "/history", "/view", "/upload/image")
OLLAMA_PREFIXES = ("/api",)
WS_PREFIX = "/ws"


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
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
        elif self._is_ollama_route():
            self._proxy("GET", OLLAMA)
        elif self._is_proxy_route():
            self._proxy("GET", BACKEND)
        else:
            super().do_GET()

    def do_POST(self):
        if self._is_ws():
            self._ws_reject()
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
            self._proxy("OPTIONS", OLLAMA)
        elif self._is_proxy_route():
            self._proxy("OPTIONS", BACKEND)
        else:
            self.send_error(405, "Method Not Allowed")

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
        return any(path == p for p in CUSTOM_PREFIXES)

    def _is_ws(self):
        return self.path.split("?")[0].startswith(WS_PREFIX)

    def _ws_reject(self):
        self.send_response(426, "Upgrade Required")
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"WebSocket not proxied; pollFallback handles it.\n")

    def _do_krea2_list(self):
        """List PNGs in KREA2_OUTPUT_DIR, newest first, max 50."""
        items = []
        try:
            paths = sorted(
                glob.glob(os.path.join(KREA2_OUTPUT_DIR, "*.png")),
                key=lambda p: os.path.getmtime(p),
                reverse=True,
            )[:50]
            for p in paths:
                st = os.stat(p)
                items.append({
                    "filename": os.path.basename(p),
                    "subfolder": "krea2",
                    "type": "output",
                    "mtime": int(st.st_mtime),
                    "size": st.st_size,
                })
        except OSError as e:
            sys.stderr.write(f"[serve] krea2_list error: {e}\n")
        body = json.dumps({
            "dir": KREA2_OUTPUT_DIR,
            "count": len(items),
            "items": items,
        }).encode("utf-8")
        self.send_response(200)
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
            body = self.rfile.read(length) if length > 0 else b""

        req = urllib.request.Request(
            target,
            data=body,
            headers={
                k: v
                for k, v in self.headers.items()
                if k.lower()
                not in ("host", "connection", "transfer-encoding", "content-length")
            },
            method=method,
        )

        try:
            resp = urllib.request.urlopen(req, timeout=600)
            self.send_response(resp.status)
            # Copy response headers (except transfer-encoding / connection)
            for k, v in resp.headers.items():
                if k.lower() not in ("transfer-encoding", "connection", "content-encoding"):
                    self.send_header(k, v)
            self.end_headers()
            # Stream the body
            chunk = resp.read(65536)
            while chunk:
                self.wfile.write(chunk)
                chunk = resp.read(65536)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for k, v in e.headers.items():
                if k.lower() not in ("transfer-encoding", "connection", "content-encoding"):
                    self.send_header(k, v)
            self.end_headers()
            chunk = e.read(65536)
            while chunk:
                self.wfile.write(chunk)
                chunk = e.read(65536)
        except urllib.error.URLError as e:
            self.send_error(502, f"Backend unreachable: {e.reason}")
        except OSError as e:
            self.send_error(502, f"Backend error: {e}")


class ReusableServer(socketserver.TCPServer):
    allow_reuse_address = True


def main():
    with ReusableServer(("0.0.0.0", PORT), ProxyHandler) as httpd:
        sys.stderr.write(
            f"[serve] Sirviendo en 0.0.0.0:{PORT} (proxy -> {BACKEND}, krea2 -> {KREA2_OUTPUT_DIR}, no-cache)\n"
        )
        sys.stderr.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            sys.stderr.write("[serve] Ctrl+C, saliendo.\n")


if __name__ == "__main__":
    main()
