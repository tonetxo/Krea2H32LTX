"""LTXWeb Video FX — LUT 3D + viñeta + grano dinámico, vectorizado y por chunks.

Motivación: los nodos de comfyui-propost (ProPostApplyLUT / ProPostFilmGrain /
ProPostVignette) hacen bucles Python por frame (y filmgrainer, por *píxel*),
además de reservar un buffer del tamaño del batch completo (`zeros_like`). Con
vídeos LTXV de 360-1200 frames a 2-4K eso provoca picos de RAM de decenas de GB
(bloqueo/reinicio de ComfyUI) y tiempos de decenas de minutos.

Este nodo aplica la misma cadena sobre GPU de forma vectorizada, troceando el
batch por presupuesto de memoria y escribiendo **in-place** para no duplicar el
batch. El resultado es de segundos y con RAM acotada.
"""

import os
import math
import logging
import numpy as np
import torch
import torch.nn.functional as F

import folder_paths

log = logging.getLogger("LTXWebVideoFX")


def _mem_available_bytes():
    """RAM disponible del sistema (Linux /proc/meminfo). None si no se puede."""
    try:
        with open("/proc/meminfo", "r") as fh:
            for line in fh:
                if line.startswith("MemAvailable:"):
                    return int(line.split()[1]) * 1024
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# LUT (.cube) — parser + aplicación vectorizada
# ---------------------------------------------------------------------------

def _candidate_lut_dirs():
    md = folder_paths.models_dir
    cands = [
        os.path.join(md, "luts"),
        os.path.join(os.path.dirname(md), "src", "Extensions",
                     "SwarmUI-PostRenderTorched", "luts"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                     "comfyui_layerstyle", "lut"),
    ]
    out = []
    for c in cands:
        r = os.path.realpath(os.path.expanduser(c))
        if os.path.isdir(r) and r not in out:
            out.append(r)
    if not out:
        d = os.path.join(md, "luts")
        os.makedirs(d, exist_ok=True)
        out.append(d)
    return out


def _ensure_luts_folder():
    """Registra las carpetas de LUTs conocidas (por si comfyui-propost no está
    cargado) para que el combo del nodo incluya todas las .cube del panel."""
    try:
        existing = list(folder_paths.get_folder_paths("luts"))
    except Exception:
        existing = []
    cands = _candidate_lut_dirs()
    try:
        folder_paths.folder_names_and_paths["luts"] = (cands, {".cube"})
    except Exception:
        pass


def _luts_dir():
    _ensure_luts_folder()
    try:
        for d in folder_paths.get_folder_paths("luts"):
            if os.path.isdir(d):
                return d
    except Exception:
        pass
    d = os.path.join(folder_paths.models_dir, "luts")
    return d if os.path.isdir(d) else None


def parse_cube(path):
    """Lee un .cube (Iridas). Devuelve (size, table, domain, is_1d).

    table: (N,N,N,3) para 3D (ejes r,g,b) o (N,3) para 1D.
    domain: (min_rgb, max_rgb) o None.
    """
    size = None
    is_1d = False
    data = []
    dom_min = None
    dom_max = None
    in_range = None
    with open(path, "r", errors="ignore") as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            up = line.upper()
            if up.startswith("TITLE"):
                continue
            if up.startswith("LUT_3D_SIZE"):
                size = int(line.split()[-1])
                continue
            if up.startswith("LUT_1D_SIZE"):
                size = int(line.split()[-1])
                is_1d = True
                continue
            if up.startswith("DOMAIN_MIN"):
                dom_min = [float(x) for x in line.split()[1:4]]
                continue
            if up.startswith("DOMAIN_MAX"):
                dom_max = [float(x) for x in line.split()[1:4]]
                continue
            if up.startswith("LUT_3D_INPUT_RANGE"):
                vals = [float(x) for x in line.split()[1:3]]
                in_range = vals
                continue
            if up.startswith("LUT_1D_INPUT_RANGE"):
                vals = [float(x) for x in line.split()[1:3]]
                in_range = vals
                continue
            parts = line.split()
            if len(parts) >= 3:
                try:
                    data.append((float(parts[0]), float(parts[1]), float(parts[2])))
                except ValueError:
                    continue
    if size is None:
        raise ValueError(f"LUT sin tamaño declarado: {os.path.basename(path)}")
    arr = np.asarray(data, dtype=np.float32)
    domain = None
    if dom_min is not None and dom_max is not None:
        domain = (np.asarray(dom_min, np.float32), np.asarray(dom_max, np.float32))
    elif in_range is not None:
        domain = (np.full(3, in_range[0], np.float32), np.full(3, in_range[1], np.float32))
    if is_1d:
        if arr.shape[0] < size:
            raise ValueError(f"LUT 1D incompleta: {os.path.basename(path)}")
        return size, arr[:size], domain, True
    expected = size ** 3
    if arr.shape[0] < expected:
        raise ValueError(f"LUT 3D incompleta: {os.path.basename(path)}")
    # Orden Iridas: rojo varía más rápido. flat index = r + N*g + N²*b, de modo
    # que un reshape (N,N,N) queda como [b,g,r]; reordenamos a [r,g,b].
    table = arr[:expected].reshape(size, size, size, 3).transpose(2, 1, 0, 3)
    return size, np.ascontiguousarray(table), domain, False


def _lut_to_tensor(size, table, is_1d, device):
    t = torch.from_numpy(np.ascontiguousarray(table)).to(device=device, dtype=torch.float32)
    if is_1d:
        return t  # (N,3)
    # (N,N,N,rgb)[r,g,b] -> (1, 3, N_r, N_g, N_b)
    t = t.permute(3, 0, 1, 2).unsqueeze(0).contiguous()
    return t


def apply_lut_tensor(rgb, lut, size, is_1d, domain, strength):
    """rgb: (..., H, W, 3) float32 en [0,1] en device. Devuelve mismo shape."""
    x = rgb
    if domain is not None:
        dmin = torch.as_tensor(domain[0], device=rgb.device, dtype=rgb.dtype)
        dmax = torch.as_tensor(domain[1], device=rgb.device, dtype=rgb.dtype)
        x = x * (dmax - dmin) + dmin
    if is_1d:
        n = lut.shape[0]
        pos = x.clamp(0.0, 1.0) * (n - 1)
        lo = pos.floor().long().clamp(0, n - 1)
        hi = (lo + 1).clamp(0, n - 1)
        frac = (pos - lo.to(pos.dtype))
        vlo = lut[lo]  # (...,H,W,3) gather per channel
        vhi = lut[hi]
        out = vlo + (vhi - vlo) * frac
    else:
        # grid_sample: input (1,3,Nr,Ng,Nb); grid (...,W=...) coords (b,g,r)
        b, c, nr, ng, nb = lut.shape
        gx = x[..., 2].clamp(0, 1) * 2 - 1
        gy = x[..., 1].clamp(0, 1) * 2 - 1
        gz = x[..., 0].clamp(0, 1) * 2 - 1
        grid = torch.stack([gx, gy, gz], dim=-1).unsqueeze(0)  # (1, ..., 3)
        out = F.grid_sample(lut, grid, mode="bilinear", padding_mode="border",
                            align_corners=True)
        # out (1,3,n,H,W) -> (n,H,W,3)
        out = out[0].permute(1, 2, 3, 0)
    if domain is not None:
        dmin = torch.as_tensor(domain[0], device=rgb.device, dtype=rgb.dtype)
        dmax = torch.as_tensor(domain[1], device=rgb.device, dtype=rgb.dtype)
        out = (out - dmin) / (dmax - dmin)
    if strength < 1.0:
        out = rgb + strength * (out - rgb)
    return out


# ---------------------------------------------------------------------------
# Viñeta — misma fórmula que ProPostVignette
# ---------------------------------------------------------------------------

def vignette_mask(h, w, intensity, cx, cy, device):
    x = torch.linspace(-1, 1, w, device=device)
    y = torch.linspace(-1, 1, h, device=device)
    X, Y = torch.meshgrid(x - (2 * cx - 1), y - (2 * cy - 1), indexing="xy")
    corners = [
        math.sqrt((0 - cx) ** 2 + (0 - cy) ** 2),
        math.sqrt((1 - cx) ** 2 + (0 - cy) ** 2),
        math.sqrt((0 - cx) ** 2 + (1 - cy) ** 2),
        math.sqrt((1 - cx) ** 2 + (1 - cy) ** 2),
    ]
    maxd = max(corners)
    radius = torch.sqrt(X ** 2 + Y ** 2) / (maxd * math.sqrt(2))
    opacity = min(max(intensity, 0.0), 1.0)
    return (1.0 - radius * opacity).clamp(0.0, 1.0).unsqueeze(-1)  # (H,W,1)


# ---------------------------------------------------------------------------
# Grano — vectorizado (sustituye al bucle por píxel de filmgrainer)
# ---------------------------------------------------------------------------

def add_grain(chunk, power, size, seed, mono, device):
    n, h, w, _ = chunk.shape
    gh = max(1, int(round(h / max(size, 0.25))))
    gw = max(1, int(round(w / max(size, 0.25))))
    amp = float(power) * 0.18
    out = chunk
    frames = []
    for i in range(n):
        g = torch.Generator(device=device)
        g.manual_seed(int(seed) + i)
        ch = 1 if mono else 3
        noise = torch.randn((1, ch, gh, gw), generator=g, device=device, dtype=chunk.dtype)
        noise = F.interpolate(noise, size=(h, w), mode="bilinear", align_corners=False)
        noise = noise.permute(0, 2, 3, 1)  # (1,H,W,ch)
        if mono:
            noise = noise.expand(-1, -1, -1, 3)
        else:
            noise = noise.expand(-1, -1, -1, 3) if ch == 1 else noise
        lum = chunk[i].mean(dim=-1, keepdim=True)
        weight = (1.0 - 0.5 * lum).clamp(0.0, 1.0)
        frames.append(chunk[i] + noise[0] * weight * amp)
    return torch.stack(frames, dim=0)


# ---------------------------------------------------------------------------
# Nodo
# ---------------------------------------------------------------------------

class LTXWebVideoFX:
    CATEGORY = "LTXWeb/Video"
    FUNCTION = "execute"
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)

    @classmethod
    def INPUT_TYPES(cls):
        _ensure_luts_folder()
        try:
            luts = folder_paths.get_filename_list("luts") or []
        except Exception:
            luts = []
        luts = [""] + sorted(luts)
        return {
            "required": {
                "image": ("IMAGE",),
                "lut_name": (luts, {"default": ""}),
                "lut_strength": ("FLOAT", {"default": 0.8, "min": 0.0, "max": 1.0, "step": 0.01}),
                "vignette": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 2.0, "step": 0.01}),
                "vignette_cx": ("FLOAT", {"default": 0.5, "min": 0.0, "max": 1.0, "step": 0.01}),
                "vignette_cy": ("FLOAT", {"default": 0.5, "min": 0.0, "max": 1.0, "step": 0.01}),
                "grain": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 1.0, "step": 0.01}),
                "grain_size": ("FLOAT", {"default": 1.0, "min": 0.25, "max": 4.0, "step": 0.05}),
                "grain_seed": ("INT", {"default": 1, "min": 1, "max": 0xffffffffffffffff}),
                "grain_mono": ("BOOLEAN", {"default": True}),
                "chunk_mb": ("INT", {"default": 1024, "min": 64, "max": 16384, "step": 64}),
            },
        }

    def execute(self, image, lut_name, lut_strength, vignette, vignette_cx,
                vignette_cy, grain, grain_size, grain_seed, grain_mono, chunk_mb):
        if image.dim() != 4:
            return (image,)
        src_device = image.device
        src_dtype = image.dtype
        n, h, w, c = image.shape

        want_lut = bool(lut_name) and lut_strength > 0
        want_vig = vignette > 0
        want_grain = grain > 0
        if not (want_lut or want_vig or want_grain):
            return (image,)

        dev = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")

        # LUT
        lut = size = None
        is_1d = False
        domain = None
        if want_lut:
            base = _luts_dir()
            path = None
            if base and os.path.isfile(os.path.join(base, lut_name)):
                path = os.path.join(base, lut_name)
            if path is None:
                try:
                    found = folder_paths.get_full_path("luts", lut_name)
                    if found and os.path.isfile(found):
                        path = found
                except Exception:
                    path = None
            if path is None:
                raise FileNotFoundError(f"LUT no encontrada: {lut_name}")
            size, table, domain, is_1d = parse_cube(path)
            lut = _lut_to_tensor(size, table, is_1d, dev)

        vig = vignette_mask(h, w, vignette, vignette_cx, vignette_cy, dev) if want_vig else None

        # Chunk por presupuesto: bytes ≈ n*H*W*C*4 (float32) por chunk.
        per_frame = max(1, h * w * c * 4)
        budget = int(chunk_mb) * 1024 * 1024
        chunk = max(1, min(n, max(1, budget // per_frame)))

        # NO mutamos la entrada: puede ser un output cacheado por ComfyUI y
        # reutilizado. Mutarlo corrompería el caché (al reejecutar con otro LUT
        # el FX se aplicaría sobre frames ya procesados). Asignamos una salida
        # nueva y volcamos ahí cada chunk. Pico ≈ 2× batch, pero sin churn.
        nbytes = int(image.numel()) * image.element_size()
        avail = _mem_available_bytes()
        gb = nbytes / (1024 ** 3)
        if avail and nbytes > avail * 0.9:
            log.warning(
                "LTXWebVideoFX: RAM ajustada. Salida nueva ≈ %.1f GB y libre ≈ %.1f GB. "
                "Si hay riesgo de OOM, reduce frames/resolución o sube chunk_mb no ayuda "
                "(el buffer de salida es del tamaño del batch).", gb, avail / (1024 ** 3))
        else:
            log.info("LTXWebVideoFX: %d frames %dx%d, chunk=%d, buffer salida ≈ %.1f GB.",
                     n, w, h, chunk, gb)

        out = torch.empty_like(image)
        for s in range(0, n, chunk):
            e = min(s + chunk, n)
            piece = image[s:e].to(dev, dtype=torch.float32)
            if lut is not None:
                piece = apply_lut_tensor(piece, lut, size, is_1d, domain, float(lut_strength))
            piece = piece.clamp(0.0, 1.0)
            if vig is not None:
                piece = (piece * vig).clamp(0.0, 1.0)
            if want_grain:
                piece = add_grain(piece, grain, grain_size, grain_seed + s, grain_mono, dev)
            piece = piece.clamp(0.0, 1.0)
            out[s:e] = piece.to(src_device, dtype=src_dtype)

        return (out,)


NODE_CLASS_MAPPINGS = {"LTXWebVideoFX": LTXWebVideoFX}
NODE_DISPLAY_NAME_MAPPINGS = {"LTXWebVideoFX": "LTXWeb Video FX (LUT/Viñeta/Grano)"}
