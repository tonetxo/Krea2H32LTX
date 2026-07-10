"""Static file server with no-cache headers + backend proxy.

Used by lanzar_ltxv.sh. Serves LTXV_WebUI.html and proxies API
requests to the ComfyUI backend (127.0.0.1:7821) so the phone can
reach the backend through the same port 8000 (no extra firewall
rules, no CORS issues).

Backend routes proxied:
  /system_stats, /prompt, /history/*, /view, /upload/image
  /ws -> returns 426 (pollFallback handles it)

Usage: python3 serve.py [PORT] [BACKEND_URL]
  PORT        default 8000
  BACKEND_URL default http://127.0.0.1:7821
"""
import http.server
import io
import json
import socketserver
import sys
import urllib.request
import urllib.error

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
BACKEND = sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:7821"
OLLAMA = "http://127.0.0.1:11434"

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

    def _is_ws(self):
        return self.path.split("?")[0].startswith(WS_PREFIX)

    def _ws_reject(self):
        self.send_response(426, "Upgrade Required")
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"WebSocket not proxied; pollFallback handles it.\n")

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
            f"[serve] Sirviendo en 0.0.0.0:{PORT} (proxy -> {BACKEND}, no-cache)\n"
        )
        sys.stderr.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            sys.stderr.write("[serve] Ctrl+C, saliendo.\n")


if __name__ == "__main__":
    main()
