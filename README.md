# Krea2H32LTX

High-performance, self-contained single-page web interfaces for video and image generation with **ComfyUI** and **SwarmUI** backends.

The project provides four standalone, zero-dependency web applications designed to maximize local GPU utilization and enable full control from both desktop workstations and mobile devices across local networks (LAN).

> [!IMPORTANT]
> **Update (v1.0.1) — Full Portability & Auto-Configuration**:
> If you downloaded this repository recently and experienced errors due to hardcoded paths or missing files, please run `git pull` or download the latest release (**[v1.0.1](https://github.com/tonetxo/Krea2H32LTX/releases/tag/v1.0.1)**).
> All internal paths, ComfyUI backend ports, and model directories are now dynamically resolved, slots are auto-pruned, and a pre-flight diagnostic tool (`python diagnostico_comfyui.py`) is included.

---

## Overview of Web Interfaces

| WebUI | Generated File | Default Port | Model / Architecture | Core Purpose & Modes |
|---|---|---|---|---|
| **MMH3X2** | `MMH3X2_WebUI.html` | `:8003` | **MiniMax H3 (2 Segments)** | **Continuous narrative video (up to 30s+)**: 2 chained segments, up to 4 reference images + 1 video, visual continuity powered by Ollama (with real-time fused prompt inspection), audio crossfade, and flexible attention/optimization pipelines (Standard & BlockATT with AIMDO / Spectrum). |
| **MiniMaxH3** | `MiniMaxH3_WebUI.html` | `:8002` | **MiniMax H3** | **Single-segment video generation**: **i2v** (image-to-video), **flf2v** (first-and-last frame), and **r2v** (multi-reference: up to 6 images, 3 videos, 3 audio tracks). Includes **Dual-Mode H3 FaceRefine** (inline toggle & on-demand player button), **Sol-H3 SM120 Blackwell Attention**, **3D Latent Upscaler**, and RIFE frame interpolation. |
| **LTXV** | `LTXV_WebUI.html` | `:8000` | **LTX-Video / LTX-2.5** | **Ultra-fast video generation**: First Pass & Full Pass pipelines with SageAttention, DMD LoRA, custom VAE selectors, and high-speed distilled transformers. |
| **KreaQwen** | `KreaQwen_WebUI.html` | `:8004` | **Qwen 2.1 Image + Krea2 / Flux2** | **Dual-model fusion & guided editing**: Base + Refiner stages with dynamic model inversion, native Qwen Edit mode (img2img / faceswap with multi-reference images), integrated Post-FX suite (LUTs, 35mm grain, vignette, radial blur), RGB smart seed variance, and FaceRefine. |
| **Krea2** | `Krea2_WebUI.html` | `:8001` | **Krea2 / Flux2** | **First-frame generation**: High-fidelity text-to-image pipeline for Flux2 / Krea2 with RGB variance control and a direct "Send to Video" handoff button. |

---

## Key Features

### 1. 100% Portable & Zero Hardcoded Paths
- Runs out-of-the-box on any machine.
- Automatically discovers ComfyUI root directories (`~/ComfyUI`, `../ComfyUI`, SwarmUI, etc.) and models.
- Automatically probes active ComfyUI ports (`:8188`, `:7821`, etc.).
- Clean JSON workflows with dynamic slot pruning: slots without uploaded images are not sent to the backend, avoiding missing file errors.

### 2. Pre-Flight Check & Diagnostics (`diagnostico_comfyui.py`)
- One-click health check that inspects ComfyUI connection, GPU/VRAM status, Ollama availability, and verifies all required custom nodes.
- If any custom node is missing, it provides the exact `git clone` command to install it.

### 3. Asynchronous Non-Blocking Queue Engine
- **Continuous Enqueuing**: Modify prompts, adjust parameters, and queue new tasks while previous generations execute on the GPU.
- **Immutable Job Snapshots**: Every queued job preserves its exact parameter configuration at the moment of submission.
- **Granular Control**: Stop current generation or abort all queued tasks.
- **Queue Drawer**: Remove specific waiting jobs individually without clearing the entire queue.

### 4. Real-Time Dual-Queue Monitoring
- Dedicated dashboard reporting:
  - **Local WebUI Queue**: Displays remaining jobs, video/variant counts, and active generation step.
  - **ComfyUI Server Queue**: Real-time polling of backend execution state (`/queue`), identifying active GPU workloads and tasks queued from other devices.

### 5. Multi-Device Prompt Library Synchronization
- **Tree Hierarchy**: Organize prompts using forward-slash path notation (`landscapes/night/moonlight`, `characters/cyberpunk/`).
- **Disk Persistence**: Stored automatically as atomic JSON files on the host filesystem (`prompts_<ui>.json`).
- **LAN Sync**: Prompts saved, renamed, or deleted on a desktop are instantly synchronized with mobile devices connected over the local network.

### 6. Built-in Prompt Enhancer & Continuity Assistant
- Direct integration with local or cloud Ollama models (`deepseek-v4.1-flash`, `qwen3.8`, `llama3.2`, `gemma4`, etc.).
- Presets for cinematic lighting, camera movements, and visual styles.
- **MMH3X2 Continuity Mode**: Seamlessly fuses Segment 1 character/setting definitions with Segment 2 direction prompts in runtime, streaming the exact final prompt to the UI via WebSockets.

### 7. Full Local Network (LAN) Access
- Integrated server bound to `HOST=0.0.0.0` for access from smartphones, tablets, and secondary PCs (`http://<LAN_IP>:8003/MMH3X2_WebUI.html`).
- Media is served via direct HTTP streaming, avoiding local storage consumption on mobile clients.
- Metadata is fully preserved in all generated PNGs and MP4s.

---

## Technical Architecture

The build system utilizes lightweight Python generators that compile self-contained HTML files from modular template components:

```text
generar_mmh3x2.py / generar_minimaxh3.py / generar_krea2.py / generar_kreaqwen.py / generar_ltxv.py
        ↓ (reads config via config_loader.py & scans model directories)
generar_common.py (Shared template assembly logic)
        ↓
templates/
  ├── base.css            (Dark theme, control panels, two-column layout, queue monitor)
  ├── mmh3x2.css / minimaxh3.css / krea2.css / kreaqwen.css / ltxv.css
  ├── common.js           (WebSockets, /queue monitor, synced prompt library, timers)
  ├── mmh3x2.js / minimaxh3.js / krea2.js / kreaqwen.js / ltxv.js
  ├── common_head.html / common_html.html
  └── mmh3x2_html.html / minimaxh3_html.html / krea2_html.html / kreaqwen_html.html / ltxv_html.html
        ↓ Generates standalone single-page apps:
MMH3X2_WebUI.html / MiniMaxH3_WebUI.html / Krea2_WebUI.html / KreaQwen_WebUI.html / LTXV_WebUI.html
```

### Static File Server and Proxy (`serve.py`)
- Implemented using Python standard library only (`http.server`, `urllib`, `socket`, `subprocess`).
- Proxies requests to ComfyUI (`:8188` / `:7821`) and Ollama (`:11434`), handling CORS headers and WebSocket pass-through.
- Custom local API routes:
  - `GET / POST /api/prompts`: Prompt storage and multi-client synchronization.
  - `GET /api/*_list`: Output gallery indexing with fast caching.
  - `POST /api/file_delete`: Safe deletion of generated artifacts within permitted output paths.
  - `POST /api/video_preprocess`: FFmpeg-based video trimming, scaling, and audio stream extraction.

---

## Required ComfyUI Custom Nodes

The web interfaces utilize specialized nodes for math expressions, attention backends, and video processing.

| Custom Node Package | Recommended Repository | Primary Node Classes | Used By |
|---|---|---|---|
| **ComfyMath** | [ComfyMath](https://github.com/evanspearman/ComfyMath) | `ComfyMathExpression` | MMH3X2, MiniMaxH3, LTXV |
| **comfyui-ollama** | [comfyui-ollama](https://github.com/stavsap/comfyui-ollama) | `OllamaConnectivityV2`, `OllamaChat` | MMH3X2 (Assisted Mode) |
| **ComfyUI-KJNodes** | [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) | `GetImageSize`, `ImageResizeKJv2` | MMH3X2, MiniMaxH3, LTXV |
| **VideoHelperSuite (VHS)** | [ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite) | `VHS_LoadVideo` | MMH3X2 (Video reference), LTXV |
| **Frame-Interpolation** | [ComfyUI-Frame-Interpolation](https://github.com/Fannovel16/ComfyUI-Frame-Interpolation) | `FrameInterpolate`, `FrameInterpolationModelLoader` | MMH3X2 (RIFE), MiniMaxH3, LTXV |
| **ComfyUI-H3-FaceRefine** *(optional)* | [ComfyUI-H3-FaceRefine](https://github.com/Carasibana/ComfyUI-H3-FaceRefine.git) | `H3FaceTrackCrop`, `H3FaceStitch`, `H3PerFrameDenoise`, `H3InjectVideoLatent` | MiniMaxH3 (Dual-mode face refine: inline toggle & on-demand player button) |
| **ComfyUI-Sol-H3** *(optional)* | [ComfyUI-Sol-H3](https://github.com/xmarre/ComfyUI-Sol-H3.git) | `SolH3Experimental` | MiniMaxH3 (SM120 Blackwell fast attention acceleration with mutual exclusion fail-safe) |
| **Comfyui_Minimax_h3_latent_Upscaler** *(optional)* | [Comfyui_Minimax_h3_latent_Upscaler](https://github.com/LBH-123-AI/Comfyui_Minimax_h3_latent_Upscaler.git) | `MinimaxH3LatentUpscaler3D` | MiniMaxH3 (3D temporal latent upscaler with VRAM dynamic chunking) |
| **Spectrum** *(optional)* | [ComfyUI-Spectrum](https://github.com/MinusZoneAI/ComfyUI-Spectrum) | `SpectrumApplyMiniMaxH3` | MMH3X2 (Spectrum), MiniMaxH3 |
| **rgthree-comfy** *(optional)* | [rgthree-comfy](https://github.com/rgthree/rgthree-comfy) | `Power Lora Loader`, `Seed` | Krea2, LTXV |
| **ComfyUI-H3PromptStudio** | [ComfyUI-H3PromptStudio](https://github.com/tonetxo/ComfyUI-H3PromptStudio) | `MiniMaxH3ReferenceToVideo`, `MiniMaxH3SigmaShift`, `ModelAttentionBackend` | MMH3X2, MiniMaxH3 |
| **ComfyUI-ProPost** *(optional)* | [ComfyUI-ProPost](https://github.com/digitaljohn/comfyui-propost) | `ProPostApplyLUT`, `ProPostFilmGrain`, `ProPostRadialBlur`, `ProPostVignette` | KreaQwen (Post-FX Suite) |
| **ComfyUI-RBG-SmartSeedVariance** *(optional)* | [ComfyUI-RBG-SmartSeedVariance](https://github.com/RamonGuthrie/ComfyUI-RBG-SmartSeedVariance.git) | `RBG_Smart_Seed_Variance` | Krea2, KreaQwen (Smart Seed Variance) |
| **H3-Optimizations** *(optional)* | [H3-Optimizations](https://github.com/Zironic/H3-Optimizations) | `H3VSAAttention`, `H3MemoryOptimization`, `H3SparseAttention`, `H3AIMDOResidencyLimiter` | MiniMaxH3 (VSA Attention, AIMDO) |

> [!TIP]
> You can run `python3 diagnostico_comfyui.py` at any time to automatically check which nodes are installed on your backend.

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/tonetxo/Krea2H32LTX.git
cd Krea2H32LTX
```

### 2. Pre-Flight Diagnostics
Run the diagnostic script to verify your ComfyUI connection, GPU status, custom nodes, and Ollama:
```bash
python3 diagnostico_comfyui.py
```
If any custom node is missing, the script will output the exact `git clone` command to run inside your `custom_nodes/` folder.

### 3. Custom Configuration (Optional)
If your ComfyUI install is in a standard location (`~/ComfyUI`, `../ComfyUI`, `~/SwarmUI/dlbackend/ComfyUI`), it will be **auto-detected automatically**.

If you use custom paths, ports, or a remote server, copy and edit the configuration file:
```bash
cp config.example.json config.json
```
Example `config.json`:
```json
{
  "comfyui": {
    "url": "http://127.0.0.1:8188",
    "root_dir": "/path/to/ComfyUI",
    "models_dir": "/path/to/models",
    "output_dir": "/path/to/ComfyUI/output"
  },
  "ollama": {
    "url": "http://127.0.0.1:11434"
  },
  "ports": {
    "ltxv": 8000,
    "krea2": 8001,
    "minimaxh3": 8002,
    "mmh3x2": 8003,
    "kreaqwen": 8004
  }
}
```

### 4. Build the Web Interfaces
Compile the standalone HTML files and index your local models, LoRAs, and VAEs:
```bash
# Build all interfaces at once:
python3 generar_mmh3x2.py && python3 generar_minimaxh3.py && python3 generar_krea2.py && python3 generar_kreaqwen.py && python3 generar_ltxv.py
```

### 5. Launch the Web Servers
Launch whichever interface you want to use:

```bash
# KreaQwen (Qwen 2.1 + Krea2/Flux2 image generation & guided editing) - Port 8004
./lanzar_kreaqwen.sh

# MMH3X2 (2-segment continuous video generation) - Port 8003
./lanzar_mmh3x2.sh

# MiniMaxH3 (Single-segment i2v / flf2v / r2v video generation) - Port 8002
./lanzar_minimaxh3.sh

# LTXV (LTX-Video / LTX-2.5 high-speed video) - Port 8000
./lanzar_ltxv.sh

# Krea2 (Flux2 / Krea2 image generation) - Port 8001
./lanzar_krea2.sh
```

Open your browser at `http://localhost:8003` (or replace with the port of the interface you launched).

---

## LAN Access from Mobile Devices

To access your interfaces from a phone or tablet on the same Wi-Fi network:

1. Ensure ComfyUI was started with `--listen 0.0.0.0` (or configured for LAN).
2. The launcher scripts automatically serve on `0.0.0.0`.
3. Open your mobile browser and navigate to:
   ```text
   http://<YOUR_PC_LOCAL_IP>:8003/MMH3X2_WebUI.html
   ```
4. You can monitor the GPU, queue prompts, and play back generated videos directly on your phone.

---

## ComfyUI Workflows

For users wishing to inspect or run workflows directly inside standard ComfyUI:

- **`MMH3X2_4IMG.json`** — Standard 2-segment pipeline (Kitchen Attention + Sigma Shift).
- **`MMH3X2_4IMG_BLOCKATT.json`** — Advanced 2-segment pipeline with `H3SparseAttentionAdvanced`, AIMDO, and Spectrum optimization.
- **`MiniMaxH3_I2V.json`** — Universal official vanilla workflow for single-segment MiniMax H3.
- **`Krea2_OK.json`** — Flux2 / Krea2 text-to-image with RGB variance control.
- **`video_ltx2_3_i2v_comfyui.json`** — LTXV two-pass video generation.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
