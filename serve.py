"""Tiny static file server with no-cache headers.

Used by lanzar_ltxv.sh so that the phone's browser always reloads the
latest LTXV_WebUI.html (without this, the phone keeps showing a cached
build pointing at the old backend port).

Usage: python3 serve.py [PORT]   (default 8000)
"""
import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        # Prefix with a tag so the user can tell server logs from
        # the launcher's other output, and so Ctrl+C cleanup is obvious.
        sys.stderr.write("[serve] " + (format % args) + "\n")


class ReusableServer(socketserver.TCPServer):
    allow_reuse_address = True


def main():
    with ReusableServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
        sys.stderr.write(f"[serve] Sirviendo en 0.0.0.0:{PORT} (no-cache habilitado)\n")
        sys.stderr.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            sys.stderr.write("[serve] Ctrl+C, saliendo.\n")


if __name__ == "__main__":
    main()
