# Krea2H32LTX

High-performance, self-contained single-page web interfaces for video and image generation with ComfyUI and SwarmUI backends.

The project provides three standalone, zero-dependency web applications designed to maximize local GPU utilization and enable full control from both desktop workstations and mobile devices across local networks (LAN).

---

## Overview

| WebUI | Generated File | Default Port | Model / Architecture | Generation Modes |
|---|---|---|---|---|
| **MiniMaxH3** | `MiniMaxH3_WebUI.html` | `:8002` | **MiniMax H3** | **i2v** (image-to-video), **flf2v** (first-and-last frame), **r2v** (multi-reference: up to 6 images, 3 videos, 3 audio tracks) |
| **LTXV** | `LTXV_WebUI.html` | `:8000` | **LTX-Video / LTX-2.5** | **First Pass**, **Full Pass** (two-pass pipeline with dedicated video/audio VAEs, SageAttention, DMD LoRA) |
| **Krea2** | `Krea2_WebUI.html` | `:8001` | **Krea2 / Flux2** | Text-to-image, RGB variance control, Projector presets, direct handoff to LTXV video |

---

## Key Features

### 1. Asynchronous, Non-Blocking Queue Engine
- **Continuous Enqueuing**: Modify prompts, adjust parameters, and queue new tasks while previous generations execute on the GPU.
- **Immutable Job Snapshots**: Every queued job preserves its exact parameter configuration at the moment of submission.
- **Granular Control**: Stop Video/Image (cancels the current iteration and advances to the next batch item) and Stop All (aborts GPU execution and clears the queue).
- **Individual Item Management**: Expandable queue drawer allows removing specific waiting jobs without clearing the entire queue.

### 2. Real-Time Dual-Queue Monitoring
- Dedicated dashboard reporting:
  - **Local WebUI Queue**: Displays remaining jobs, video/variant counts, and active generation step.
  - **ComfyUI Server Queue**: Real-time polling of backend execution state (`/queue`), identifying active GPU workloads and tasks queued from other devices.

### 3. Automatic Multi-Device Prompt Library Synchronization
- **Tree Hierarchy**: Organize prompts using forward-slash path notation (`landscapes/night/moonlight`, `characters/cyberpunk/`).
- **Disk Persistence**: Stored automatically as atomic JSON files on the host filesystem (`prompts_<ui>.json`).
- **Seamless LAN Sync**: Prompts saved, renamed, or deleted on a desktop are instantly synchronized with mobile devices connected over the local network.
- **Smart Path Prefill**: Selecting an existing prompt preloads its complete path for rapid editing and saves without redundant overwrite prompts.

### 4. Built-in Prompt Enhancer
- Direct local integration with Ollama models (`llama3.2`, `mistral`, `gemma2`, etc.).
- Presets for cinematic lighting, framing, and visual style.
- Evolve / Transmutation mode for token substitution and synonym expansion.

### 5. Live Animated Previews
- Real-time sampling feedback streamed via WebSockets with support for `ModelPreviewOverrideKJ` animated frames.

### 6. Full Local Network (LAN) Access
- Integrated server bound to `HOST=0.0.0.0` for access from smartphones and secondary PCs (`http://<LAN_IP>:8002/MiniMaxH3_WebUI.html`).
- Media is served via direct HTTP streaming, avoiding local storage consumption on mobile clients.

---

## Technical Architecture

The build system utilizes a Python generator that compiles self-contained HTML files from modular template components:

```text
generar_ltxv.py / generar_krea2.py / generar_minimaxh3.py   (Config & model directory scanner)
        ↓
generar_common.py                                          (Shared template assembly logic)
        ↓
templates/
  ├── base.css            (Dark theme, control panels, two-column layout, queue monitor)
  ├── ltxv.css / krea2.css / minimaxh3.css
  ├── common.js           (WebSockets, /queue monitor, synced prompt library, timers)
  ├── ltxv.js / krea2.js / minimaxh3.js
  ├── common_head.html / common_html.html
  └── ltxv_html.html / krea2_html.html / minimaxh3_html.html
        ↓ Generates:
LTXV_WebUI.html / Krea2_WebUI.html / MiniMaxH3_WebUI.html (Self-contained standalone HTMLs)
```

### Static File Server and Proxy (`serve.py`)
- Implemented using Python standard library only (`http.server`, `urllib`, `subprocess`).
- Proxies requests to ComfyUI (`:7821`) and Ollama (`:11434`), handling CORS preflight headers and WebSocket pass-through.
- Custom local API routes:
  - `GET / POST /api/prompts`: Prompt storage and multi-client synchronization.
  - `GET /api/*_list`: Output gallery indexing with cache management.
  - `POST /api/file_delete`: Safe deletion of generated artifacts within permitted output paths.
  - `POST /api/video_preprocess`: FFmpeg-based video trimming, scaling, and audio stream extraction.

---

## Requirements

- **Python 3.8+** (no third-party pip dependencies required for the server).
- **ComfyUI** or **SwarmUI** backend running (default port: `7821`).
  - For remote LAN access, start ComfyUI with `--listen 0.0.0.0`.
- **Ollama** (optional, for local LLM prompt enhancement on `:11434`).
- **FFmpeg** (optional, for video/audio reference pre-processing).

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/tonetxo/Krea2H32LTX.git
cd Krea2H32LTX
```

### 2. Build the Web Interfaces
To index local model, LoRA, and VAE directories:
```bash
python3 generar_minimaxh3.py
python3 generar_ltxv.py
python3 generar_krea2.py
```

### 3. Launch the Servers

```bash
# MiniMaxH3 (Video generation: i2v / flf2v / r2v) - Port 8002
./lanzar_minimaxh3.sh

# LTXV (Video generation: LTX-Video / LTX-2.5) - Port 8000
./lanzar_ltxv.sh

# Krea2 (Image generation: Flux2 / Krea2) - Port 8001
./lanzar_krea2.sh
```

---

## ComfyUI Workflows

For users wishing to run workflows directly within the standard ComfyUI interface:

- **`MiniMaxH3_I2V.json`** — **Universal / Vanilla Official Workflow**:
  - Implemented using 100% native ComfyUI core nodes (`MiniMaxH3ImageToVideo`, `UNETLoader`, `CLIPLoader`, `VAELoader`, `CreateVideo`).
  - Guaranteed out-of-the-box compatibility without any custom node requirements.
- **`MiniMaxH3_Pro_Accelerated.json`** — **High-Performance Pro Pipeline**:
  - Accelerated with `H3-Optimizations` (Sparse Attention), `SpectrumApplyMiniMaxH3`, `RTXVideoSuperResolution` (2x 1080p), and `FrameInterpolate` (RIFE 48fps).
- **`Krea2_OK.json`** — **Frame Zero Image Generation**:
  - High-detail text-to-image pipeline for Flux2 / Krea2 with RGB variance control.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
