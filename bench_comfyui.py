#!/usr/bin/env python3
"""Benchmark de grafos de ComfyUI con variantes.

Toma el grafo (formato API) embebido en un vídeo/imagen generado por las UIs, o
un .json, aplica parches por variante y mide tiempo total y por nodo, pico de
VRAM y pico de RAM del proceso de ComfyUI.

Ejemplos:
  python3 bench_comfyui.py salida.mp4 --runs 2
  python3 bench_comfyui.py salida.mp4 --set '{"796":{"inputs":{"Xi":320,"Xf":320}}}' \\
      --variant kitchen='{}' \\
      --variant sage3='{"1001":{"class_type":"PathchSageAttentionKJ","inputs":{"attention":null,"sage_attention":"sageattn3","allow_compile":false}}}'

Los parches siguen JSON Merge Patch (RFC 7386): los objetos se fusionan y un
valor null borra la clave (o el nodo entero). --set se aplica a todas las
variantes, antes que el parche de cada una. La clave especial "_free" de un
parche (p. ej. {"_free":{"unload_models":true}}) no toca el grafo: se envía a
/free antes de cada ejecución de esa variante, como hacen MiniMaxH3/MMH3X2 al
encolar.

En cada ronda todas las variantes usan la misma semilla (comparables entre sí)
y semillas distintas a las de otras rondas (para que ComfyUI no devuelva la
salida de caché). Si una variante solo quita nodos de salida o no toca el grafo,
reutilizaría la caché de la anterior: usa --seed-mode unique (semilla distinta
por variante) para comparar tiempos de gestión de memoria. Las salidas se guardan en output/bench/<etiqueta>/.
"""

import argparse
import base64
import copy
import datetime
import json
import os
import socket
import struct
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

import config_loader

SEED_KEYS = ("seed", "noise_seed")


# --------------------------------------------------------------------------
# Carga del grafo
# --------------------------------------------------------------------------
def _png_prompt(path):
    with open(path, "rb") as f:
        data = f.read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("no es un PNG")
    pos = 8
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos:pos + 4])
        ctype = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + length]
        pos += 12 + length
        if ctype == b"tEXt":
            key, _, val = body.partition(b"\x00")
            if key == b"prompt":
                return val.decode("latin-1")
        elif ctype == b"iTXt":
            key, _, rest = body.partition(b"\x00")
            if key == b"prompt":
                # compresión(1) método(1) idioma\0 clave_traducida\0 texto
                rest = rest[2:]
                _, _, rest = rest.partition(b"\x00")
                _, _, text = rest.partition(b"\x00")
                return text.decode("utf-8")
    raise ValueError("el PNG no contiene metadatos 'prompt'")


def _video_prompt(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format_tags=prompt", "-of", "json", path],
        capture_output=True, text=True, check=True).stdout
    tags = json.loads(out).get("format", {}).get("tags", {})
    if "prompt" not in tags:
        raise ValueError("el vídeo no contiene metadatos 'prompt'")
    return tags["prompt"]


def load_graph(path):
    ext = os.path.splitext(path)[1].lower()
    if ext == ".json":
        with open(path, encoding="utf-8") as f:
            g = json.load(f)
    elif ext == ".png":
        g = json.loads(_png_prompt(path))
    else:
        g = json.loads(_video_prompt(path))
    if "nodes" in g:
        raise ValueError("grafo en formato UI; hace falta formato API")
    return g


def merge_patch(target, patch):
    if not isinstance(patch, dict):
        return copy.deepcopy(patch)
    if not isinstance(target, dict):
        target = {}
    for k, v in patch.items():
        if v is None:
            target.pop(k, None)
        else:
            target[k] = merge_patch(target.get(k), v)
    return target


def prepare(graph, common, patch, seed, prefix):
    g = merge_patch(copy.deepcopy(graph), common)
    g = merge_patch(g, patch)
    for node in g.values():
        inputs = node.get("inputs", {})
        for k in SEED_KEYS:
            if isinstance(inputs.get(k), int):
                inputs[k] = seed
        if isinstance(inputs.get("filename_prefix"), str):
            suffix = "_prev" if inputs["filename_prefix"].endswith("_prev") else ""
            inputs["filename_prefix"] = prefix + suffix
    return g


# --------------------------------------------------------------------------
# WebSocket mínimo (stdlib) para eventos de ejecución
# --------------------------------------------------------------------------
class MiniWS:
    def __init__(self, base_url, client_id):
        u = urllib.parse.urlparse(base_url)
        self.sock = socket.create_connection((u.hostname, u.port or 80), timeout=None)
        key = base64.b64encode(os.urandom(16)).decode()
        req = (f"GET /ws?clientId={client_id} HTTP/1.1\r\nHost: {u.hostname}:{u.port}\r\n"
               f"Upgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\n"
               "Sec-WebSocket-Version: 13\r\n\r\n")
        self.sock.sendall(req.encode())
        head = b""
        while b"\r\n\r\n" not in head:
            chunk = self.sock.recv(1)
            if not chunk:
                raise ConnectionError("WebSocket cerrado durante el handshake")
            head += chunk
        if b" 101 " not in head.split(b"\r\n", 1)[0]:
            raise ConnectionError("handshake WebSocket rechazado: " + head.split(b"\r\n", 1)[0].decode())

    def _recv(self, n):
        buf = b""
        while len(buf) < n:
            chunk = self.sock.recv(n - len(buf))
            if not chunk:
                raise ConnectionError("WebSocket cerrado")
            buf += chunk
        return buf

    def _send(self, opcode, payload=b""):
        mask = os.urandom(4)
        hdr = bytes([0x80 | opcode, 0x80 | len(payload)]) + mask
        self.sock.sendall(hdr + bytes(b ^ mask[i % 4] for i, b in enumerate(payload)))

    def recv_text(self):
        """Devuelve el siguiente mensaje de texto (ignora binarios/previews)."""
        while True:
            b1, b2 = self._recv(2)
            opcode, length = b1 & 0x0F, b2 & 0x7F
            if length == 126:
                (length,) = struct.unpack(">H", self._recv(2))
            elif length == 127:
                (length,) = struct.unpack(">Q", self._recv(8))
            payload = self._recv(length)
            if opcode == 0x1:
                return payload.decode("utf-8")
            if opcode == 0x8:
                raise ConnectionError("WebSocket cerrado por el servidor")
            if opcode == 0x9:
                self._send(0xA, payload[:125])

    def close(self):
        try:
            self.sock.close()
        except OSError:
            pass


# --------------------------------------------------------------------------
# Muestreo de memoria
# --------------------------------------------------------------------------
def comfy_pid(port):
    for pid in os.listdir("/proc"):
        if not pid.isdigit():
            continue
        try:
            with open(f"/proc/{pid}/cmdline", "rb") as f:
                args = f.read().split(b"\x00")
        except OSError:
            continue
        if any(a.endswith(b"main.py") for a in args) and str(port).encode() in args:
            return int(pid)
    return None


class MemSampler(threading.Thread):
    def __init__(self, pid, interval=0.25):
        super().__init__(daemon=True)
        self.pid, self.interval = pid, interval
        self.peak_vram = self.peak_rss = 0
        self._halt = threading.Event()

    def run(self):
        while not self._halt.is_set():
            try:
                out = subprocess.run(
                    ["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"],
                    capture_output=True, text=True, timeout=5).stdout
                self.peak_vram = max(self.peak_vram, int(out.split()[0]))
            except Exception:
                pass
            if self.pid:
                try:
                    with open(f"/proc/{self.pid}/status") as f:
                        for line in f:
                            if line.startswith("VmRSS:"):
                                self.peak_rss = max(self.peak_rss, int(line.split()[1]) // 1024)
                except OSError:
                    pass
            self._halt.wait(self.interval)

    def stop(self):
        self._halt.set()
        self.join()


# --------------------------------------------------------------------------
# Ejecución
# --------------------------------------------------------------------------
def post_prompt(base_url, graph, client_id):
    body = json.dumps({"prompt": graph, "client_id": client_id}).encode()
    req = urllib.request.Request(base_url + "/prompt", body, {"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)["prompt_id"]
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"ComfyUI rechazó el grafo: {e.read().decode()[:1500]}") from None


def post_free(base_url, body):
    req = urllib.request.Request(base_url + "/free", json.dumps(body).encode(),
                                 {"Content-Type": "application/json"})
    urllib.request.urlopen(req).close()
    # El worker de ComfyUI aplica los flags en su bucle (~1 s en reposo).
    time.sleep(2)


def run_once(base_url, graph, port, ws, client_id):
    sampler = MemSampler(comfy_pid(port))
    sampler.start()
    try:
        pid = post_prompt(base_url, graph, client_id)
        t_start = None
        node_times, cached = {}, []
        cur, cur_t = None, None
        while True:
            msg = json.loads(ws.recv_text())
            data = msg.get("data", {})
            if data.get("prompt_id") not in (None, pid):
                continue
            now = time.perf_counter()
            kind = msg.get("type")
            if kind == "execution_start":
                t_start = now
            elif kind == "execution_cached":
                cached = data.get("nodes", [])
            elif kind == "executing":
                if cur is not None:
                    node_times[cur] = node_times.get(cur, 0.0) + now - cur_t
                cur, cur_t = data.get("node"), now
                if cur is None and t_start is not None:
                    return {"ok": True, "total": now - t_start, "nodes": node_times,
                            "cached": cached, "vram_mb": sampler.peak_vram,
                            "rss_mb": sampler.peak_rss}
            elif kind == "execution_error":
                return {"ok": False, "error": f"{data.get('node_type')}: {data.get('exception_message', '')[:500]}",
                        "vram_mb": sampler.peak_vram, "rss_mb": sampler.peak_rss}
            elif kind == "execution_interrupted":
                return {"ok": False, "error": "interrumpido"}
    finally:
        sampler.stop()


def parse_variant(text):
    name, sep, patch = text.partition("=")
    if not sep or not name:
        raise argparse.ArgumentTypeError("formato: NOMBRE='{json}'")
    return name, json.loads(patch or "{}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", help="vídeo/PNG con metadatos 'prompt', o grafo API .json")
    ap.add_argument("--variant", action="append", type=parse_variant, default=[],
                    metavar="NOMBRE=JSON", help="variante con su merge patch (repetible)")
    ap.add_argument("--set", default="{}", help="merge patch común a todas las variantes")
    ap.add_argument("--runs", type=int, default=2, help="rondas medidas (def. 2)")
    ap.add_argument("--warmup", type=int, default=1, help="rondas de calentamiento sin contar (def. 1)")
    ap.add_argument("--seed", type=int, default=1000, help="semilla base")
    ap.add_argument("--seed-mode", choices=("round", "unique"), default="round",
                    help="round: misma semilla por ronda; unique: distinta por variante")
    ap.add_argument("--tag", default=datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    ap.add_argument("--url", default=None, help="URL de ComfyUI (def. config_loader)")
    ap.add_argument("--top", type=int, default=6, help="nodos más lentos a mostrar")
    ap.add_argument("--log", default="bench_results.jsonl", help="fichero JSONL de resultados")
    args = ap.parse_args()

    base_url = (args.url or config_loader.get_comfyui_url()).rstrip("/")
    port = urllib.parse.urlparse(base_url).port or 80
    graph = load_graph(args.source)
    common = json.loads(args.set)
    variants = args.variant or [("base", {})]

    print(f"🎯 {base_url} · {len(graph)} nodos · variantes: {', '.join(n for n, _ in variants)}")
    results = {n: [] for n, _ in variants}
    total_rounds = args.warmup + args.runs
    # Una sola conexión WebSocket para toda la sesión: abrir/cerrar una por
    # ejecución hace que ComfyUI registre "Cannot write to closing transport".
    client_id = "bench-" + uuid.uuid4().hex[:8]
    ws = MiniWS(base_url, client_id)
    try:
        _rounds(args, base_url, port, graph, common, variants, results, total_rounds, ws, client_id)
    finally:
        ws.close()
    _summary(args, graph, common, variants, results)
    return 0


def _rounds(args, base_url, port, graph, common, variants, results, total_rounds, ws, client_id):
    for rnd in range(total_rounds):
        warm = rnd < args.warmup
        for vi, (name, patch) in enumerate(variants):
            seed = args.seed + rnd * (len(variants) if args.seed_mode == "unique" else 1)
            if args.seed_mode == "unique":
                seed += vi
            patch = dict(patch)
            free = patch.pop("_free", None)
            g = prepare(graph, common, patch, seed, f"bench/{args.tag}/{name}_r{rnd}")
            if free:
                post_free(base_url, free)
            label = "calentamiento" if warm else f"ronda {rnd - args.warmup + 1}/{args.runs}"
            print(f"▶ {name:<16} {label} …", end="", flush=True)
            r = run_once(base_url, g, port, ws, client_id)
            if not r["ok"]:
                print(f" ❌ {r['error']}")
                continue
            print(f" {r['total']:7.1f} s · VRAM {r['vram_mb']} MB · RSS {r['rss_mb']} MB")
            if not warm:
                r.update(variant=name, round=rnd, tag=args.tag, source=os.path.basename(args.source))
                results[name].append(r)
                with open(args.log, "a", encoding="utf-8") as f:
                    f.write(json.dumps(r, ensure_ascii=False) + "\n")


def _summary(args, graph, common, variants, results):
    print("\n📊 Resumen (rondas medidas)")
    print(f"{'variante':<16} {'media':>8} {'mín':>8} {'VRAM':>8} {'RSS':>8}")
    for name, rs in results.items():
        if not rs:
            print(f"{name:<16} {'(sin datos)':>8}")
            continue
        tot = [r["total"] for r in rs]
        print(f"{name:<16} {sum(tot) / len(tot):7.1f}s {min(tot):7.1f}s "
              f"{max(r['vram_mb'] for r in rs):6} MB {max(r['rss_mb'] for r in rs):6} MB")
    for name, rs in results.items():
        if not rs:
            continue
        acc = {}
        for r in rs:
            for nid, t in r["nodes"].items():
                acc[nid] = acc.get(nid, 0.0) + t / len(rs)
        top = sorted(acc.items(), key=lambda x: -x[1])[:args.top]
        patch = {k: v for k, v in dict(variants)[name].items() if k != "_free"}
        g = prepare(graph, common, patch, 0, "")
        desc = ", ".join(f"{nid}:{g.get(nid, {}).get('class_type', '?')} {t:.1f}s" for nid, t in top)
        print(f"  {name}: {desc}")


if __name__ == "__main__":
    sys.exit(main())
