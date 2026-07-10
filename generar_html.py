import json
import os

# --- CONFIGURACIÓN ---
JSON_FILE = 'LTXV_DMD_OK.json'
OUTPUT_HTML = 'LTXV_WebUI.html'
LORAS_DIR = '/home/tonetxo/SwarmUI/Models/Lora/ltxv' 
# ---------------------

def get_lora_list(directory):
    loras = []
    if not os.path.exists(directory): 
        return ["ltxv/Ltx2.3-Licon-VBVR-I2V-390K-R32.safetensors"]
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.safetensors'):
                rel_path = os.path.relpath(os.path.join(root, file), directory)
                loras.append(rel_path.replace('\\', '/'))
    
    loras.sort()
    return loras if loras else ["No LoRAs found"]

def main():
    if not os.path.exists(JSON_FILE):
        print(f"❌ Error: No se encontró '{JSON_FILE}'")
        return

    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        graph_json = f.read()

    lora_files = get_lora_list(LORAS_DIR)
    lora_js_array = json.dumps(lora_files)

    html_template = r'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LTXV · Panel Pro</title>
<style>
  :root{--bg:#0a0c0e;--panel:#12161a;--panel-2:#171c21;--border:#242b31;--text:#e7ecef;--muted:#8b96a0;--muted-2:#5b6670;--accent:#57e8c9;--accent-dim:#2a4d47;--warn:#ffb454;--danger:#ff6a6a;--mono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;--sans:-apple-system,"Segoe UI",Inter,Roboto,sans-serif;}
  *{box-sizing:border-box;}body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:14px;line-height:1.45;}
  .wrap{max-width:1400px;margin:0 auto;padding:22px 18px 60px;}
  .head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:18px;flex-wrap:wrap;}
  .head h1{font-family:var(--mono);font-size:15px;letter-spacing:.12em;text-transform:uppercase;margin:0;color:var(--text);font-weight:600;}
  .head h1 span{color:var(--accent);}.head .sub{font-family:var(--mono);font-size:11px;color:var(--muted-2);letter-spacing:.04em;}
  .chain{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10px;color:var(--muted-2);letter-spacing:.08em;text-transform:uppercase;margin:2px 0 22px;flex-wrap:wrap;}
  .chain .node{padding:3px 8px;border:1px solid var(--border);border-radius:3px;background:var(--panel);}
  .chain .node.active{border-color:var(--accent);color:var(--accent);box-shadow:0 0 0 1px var(--accent-dim) inset;}
  .chain .arrow{color:var(--muted-2);}
  .grid{display:grid;grid-template-columns:1fr 1.2fr;gap:20px;}@media(max-width:1000px){.grid{grid-template-columns:1fr;}}
  .panel{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:16px 16px 18px;margin-bottom:16px;}
  .panel h2{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:0 0 14px;display:flex;align-items:center;gap:8px;}
  .panel h2::before{content:"";width:5px;height:5px;background:var(--accent);border-radius:1px;display:inline-block;}
  label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px;}
  .row{margin-bottom:14px;}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  input[type=text],input[type=number],textarea,select{width:100%;background:var(--panel-2);border:1px solid var(--border);color:var(--text);border-radius:5px;padding:8px 9px;font-family:var(--sans);font-size:13px;outline:none;transition:border-color .15s;}
  select{cursor:pointer; appearance:none; background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b96a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat:no-repeat; background-position:right 8px center; background-size:14px;}
  input[type=number]{font-family:var(--mono);}input:focus,textarea:focus,select:focus{border-color:var(--accent);}
  textarea{resize:vertical;min-height:92px;line-height:1.5;}
  .seed-toggle{display:flex;gap:8px;margin-bottom:8px;}
  .seg{flex:1;text-align:center;padding:7px 0;border:1px solid var(--border);border-radius:5px;font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;color:var(--muted);background:var(--panel-2);user-select:none;}
  .seg.on{border-color:var(--accent);color:var(--accent);background:var(--accent-dim);}
  .slider-row{display:flex;align-items:center;gap:10px;}
  input[type=range]{flex:1;-webkit-appearance:none;height:3px;background:var(--border);border-radius:2px;outline:none;}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:var(--accent);cursor:pointer;border:2px solid var(--bg);box-shadow:0 0 0 1px var(--accent);}
  .slider-val{font-family:var(--mono);font-size:12px;color:var(--accent);width:52px;text-align:right;flex-shrink:0;}
  .dropzone{border:1.5px dashed var(--border);border-radius:7px;padding:14px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s;color:var(--muted);font-size:12px;position:relative;overflow:hidden;}
  .dropzone.drag{border-color:var(--accent);background:var(--accent-dim);}
  .dropzone img{max-width:100%;max-height:360px;border-radius:5px;display:block;margin:0 auto;}
  .dropzone .ph{padding:22px 0;font-family:var(--mono);font-size:11px;letter-spacing:.04em;}
  .dropzone input{display:none;}
  .lora{border:1px solid var(--border);border-radius:6px;padding:10px 11px;margin-bottom:8px;background:var(--panel-2);}
  .lora.off{opacity:.5;}
  .lora-top{display:flex;align-items:center;gap:9px;margin-bottom:8px;}
  .switch{width:30px;height:17px;background:var(--border);border-radius:20px;position:relative;cursor:pointer;flex-shrink:0;transition:background .15s;}
  .switch.on{background:var(--accent-dim);border:1px solid var(--accent);}
  .switch i{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--muted-2);transition:left .15s,background .15s;}
  .switch.on i{left:15px;background:var(--accent);}
  .btn-row{display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;}
  button{font-family:var(--mono);font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;border-radius:6px;border:1px solid var(--border);background:var(--panel-2);color:var(--text);padding:11px 16px;cursor:pointer;transition:all .15s;flex:1;min-width:150px;}
  button.primary{background:var(--accent);border-color:var(--accent);color:#08110f;font-weight:700;}
  button:hover{filter:brightness(1.08);}button:disabled{opacity:.4;cursor:not-allowed;}
  .statusbar{display:flex;align-items:center;gap:9px;font-family:var(--mono);font-size:11.5px;color:var(--muted);margin:10px 2px 0;min-height:16px;}
  .dot{width:7px;height:7px;border-radius:50%;background:var(--muted-2);flex-shrink:0;}
  .dot.ok{background:var(--accent);box-shadow:0 0 6px var(--accent);}.dot.bad{background:var(--danger);}.dot.busy{background:var(--warn);animation:pulse 1s infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
  .server-row{display:flex;gap:8px;}.server-row input{flex:1;}
  .results-col{display:flex;flex-direction:column;gap:16px;position:sticky;top:20px;}
  
  /* Estructura vidbox corregida */
  .vidbox{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:14px;flex:1;display:flex;flex-direction:column; position: relative;}
  .vid-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
  .vid-header h3{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:0;display:flex;align-items:center;gap:8px;}
  .vid-footer{margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:11px; min-height: 24px;}
  
  video{width:100%;border-radius:5px;background:#000;display:block;flex-grow:1;max-height:50vh;}
  .empty{height:200px;display:flex;align-items:center;justify-content:center;color:var(--muted-2);font-family:var(--mono);font-size:11px;border:1px dashed var(--border);border-radius:5px;}
  .log{font-family:var(--mono);font-size:11px;color:var(--muted-2);background:#050607;border:1px solid var(--border);border-radius:6px;padding:9px 11px;max-height:110px;overflow-y:auto;margin-top:12px;white-space:pre-wrap;}
  .hint{font-size:11px;color:var(--muted-2);margin-top:5px;font-family:var(--mono);}
  
  .gallery-grid{display:grid;grid-template-columns:repeat(auto-fill, minmax(150px, 1fr));gap:10px;}
  .gallery-item{border:1px solid var(--border);border-radius:5px;overflow:hidden;cursor:pointer;position:relative;background:var(--panel-2);}
  .gallery-item img{width:100%;height:auto;display:block;transition:transform .2s;}
  .gallery-item:hover img{transform:scale(1.04);}
  .gallery-item.selected{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-dim);}
  .gallery-item .info-tag{position:absolute;left:0;right:0;bottom:0;padding:4px 6px;background:linear-gradient(transparent, rgba(0,0,0,.88));font-family:var(--mono);font-size:10px;color:var(--text);letter-spacing:.02em;pointer-events:none;}
  .gallery-item .del-btn{position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:4px;background:rgba(0,0,0,.65);color:#fff;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;cursor:pointer;opacity:0;transition:opacity .15s, background .15s;z-index:2;}
  .gallery-item:hover .del-btn{opacity:1;}
  .gallery-item .del-btn:hover{background:var(--danger);border-color:var(--danger);}
  .gallery-item .lq-badge{position:absolute;top:4px;left:4px;background:rgba(255,180,84,.9);color:#1a1200;font-family:var(--mono);font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;z-index:2;letter-spacing:.03em;}
  .panel-head-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
  .panel-head-row h2{margin:0;}
  .btn-mini{padding:5px 9px;font-size:10px;min-width:auto;flex:none;}
  .dz-info{font-family:var(--mono);font-size:10.5px;color:var(--muted);text-align:center;margin-top:8px;letter-spacing:.03em;}
  .prompt-actions{display:flex;gap:8px;margin-top:8px;}
  .prompt-actions button{padding:6px 10px;font-size:10px;min-width:auto;}

  /* Estilos Pantalla Completa */
  .fs-btn {
    position: absolute; top: 10px; right: 10px; z-index: 10;
    background: rgba(0,0,0,0.6); border: 1px solid var(--border); color: var(--text);
    width: 32px; height: 32px; border-radius: 4px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 16px;
    opacity: 0; transition: opacity 0.2s;
  }
  .vidbox:hover .fs-btn { opacity: 1; }
  .fs-btn:hover { background: var(--accent); color: #000; border-color: var(--accent); }
  
  /* Asegurar que el contenido persista en fullscreen */
  .vidbox:fullscreen, .vidbox:-webkit-full-screen, .vidbox:-moz-full-screen {
    width: 100vw !important; height: 100vh !important; max-height: none !important;
    background: #000; border: none; border-radius: 0; padding: 0; position: fixed; top: 0; left: 0; z-index: 9999;
  }
  .vidbox:fullscreen video, .vidbox:-webkit-full-screen video, .vidbox:-moz-full-screen video {
    width: 100%; height: 100%; object-fit: contain; max-height: none; border-radius: 0;
  }
  .vidbox:fullscreen .fs-btn, .vidbox:-webkit-full-screen .fs-btn, .vidbox:-moz-full-screen .fs-btn {
    opacity: 1; top: 20px; right: 20px; width: 48px; height: 48px; font-size: 24px;
  }
  .vidbox:fullscreen .vid-header, .vidbox:fullscreen .vid-footer, .vidbox:fullscreen .empty {
    display: none !important;
  }

  /* Animación para actualización de semilla */
  @keyframes seedFlash {
    0% { background-color: var(--panel-2); border-color: var(--border); }
    50% { background-color: var(--accent-dim); border-color: var(--accent); box-shadow: 0 0 10px var(--accent); }
    100% { background-color: var(--panel-2); border-color: var(--border); }
  }
  .seed-updated { animation: seedFlash 1.5s ease-out; }

  /* Estilos Galería Variantes */
  .variant-gallery { margin-top: 20px; }
  .variant-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .variant-card { background: var(--panel-2); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .variant-card video { width: 100%; height: auto; aspect-ratio: 16/9; object-fit: cover; }
  .variant-info { padding: 8px; font-size: 11px; color: var(--muted); font-family: var(--mono); display: flex; justify-content: space-between; align-items: center; }
  .variant-seed-display { color: var(--accent); cursor: pointer; user-select: text; display: flex; align-items: center; gap: 6px; }
  .variant-seed-display:hover { color: #fff; }
  .copy-icon { font-size: 12px; opacity: 0.7; transition: opacity 0.2s; }
  .variant-seed-display:hover .copy-icon { opacity: 1; }
</style>
</head>
<body>
<div class="wrap">
  <div class="head"><h1>LTXV <span>//</span> panel pro</h1><div class="sub">grafo: LTXV_DMD_OK</div></div>
  <div class="chain" id="chain">
    <div class="node" data-n="img">imagen</div><div class="arrow">→</div><div class="node" data-n="cond">cond</div><div class="arrow">→</div>
    <div class="node" data-n="p1">1er pase</div><div class="arrow">→</div><div class="node" data-n="up">upscale</div><div class="arrow">→</div>
    <div class="node" data-n="p2">2º pase</div><div class="arrow">→</div><div class="node" data-n="out">final</div>
  </div>
  <div class="grid">
    <div class="controls-col">
      <div class="panel"><h2>Servidor</h2><div class="server-row"><input type="text" id="serverUrl" value="http://127.0.0.1:7821" spellcheck="false"><button id="btnTest" class="ghost">Probar</button></div><div class="statusbar"><span class="dot" id="connDot"></span><span id="connText">sin comprobar</span></div></div>
      
      <div class="panel">
        <h2>Biblioteca de Prompts</h2>
        <div class="row"><select id="promptLibSelect"><option value="">-- Seleccionar Prompt Guardado --</option></select></div>
        <div class="prompt-actions"><button id="btnSavePrompt">Guardar Actual</button><button id="btnDeletePrompt" class="ghost">Eliminar</button></div>
      </div>

      <div class="panel"><h2>Imagen entrada</h2><div class="dropzone" id="dropzone"><input type="file" id="fileInput" accept="image/*"><div class="ph" id="dzPlaceholder">arrastra imagen o clic</div></div><div class="dz-info" id="dzInfo"></div></div>
      
      <div class="panel">
        <div class="panel-head-row"><h2>Historial de Imágenes</h2><button id="btnClearGallery" class="ghost btn-mini">Vaciar</button></div>
        <div class="gallery-grid" id="galleryGrid"></div>
      </div>

      <div class="panel"><h2>Prompt</h2><div class="row"><textarea id="prompt" placeholder="Describe la escena..."></textarea></div></div>
      <div class="panel"><h2>Semilla</h2><div class="seed-toggle"><div class="seg on" id="segRandom">Aleatoria</div><div class="seg" id="segFixed">Fija</div></div><input type="number" id="seedVal" value="12345" step="1" disabled></div>
      <div class="panel"><h2>LoRAs</h2><div id="loraList"></div></div>
      <div class="panel"><h2>Resolución & duración</h2><div class="row two-col"><div><label>Ancho (x32)</label><input type="number" id="width" value="1280" step="32" min="256"></div><div><label>Alto (x32)</label><input type="number" id="height" value="736" step="32" min="256"></div></div><div class="row"><label>Frames <span class="hint" id="durHint">(600 / 24fps = 25.0s)</span></label><input type="number" id="frames" value="600" step="8" min="8"></div>
      <div class="row"><label>Batch Size (Variantes) <span class="hint">(Genera N semillas distintas)</span></label><input type="number" id="batchSize" value="1" step="1" min="1" max="16"></div></div>
      <div class="panel"><h2>Fidelidad</h2><div class="row slider-row"><input type="range" id="fidelitySlider" min="0" max="2" step="0.05" value="1"><div class="slider-val" id="fidelityVal">1.00</div></div></div>
      <div class="panel"><h2>Movimiento</h2><div class="row slider-row"><input type="range" id="motionSlider" min="0" max="30" step="0.5" value="10"><div class="slider-val" id="motionVal">10.0</div></div></div>
      <div class="panel"><h2>Ejecución</h2><div class="btn-row"><button id="btnFirstPass">Solo 1er pase</button><button id="btnFull" class="primary">Generar completo</button></div><div class="statusbar"><span class="dot" id="runDot"></span><span id="runText">en reposo</span></div><div class="log" id="log">listo.</div></div>
    </div>
    <div class="results-col">
      <!-- REPRODUCTOR 1ER PASE -->
      <div class="vidbox">
        <button class="fs-btn" onclick="toggleFullscreen('video1')" title="Pantalla completa">⛶</button>
        <div class="vid-header">
          <h3>Vídeo <em style="color:var(--accent)">1er pase</em></h3>
        </div>
        <div class="empty" id="empty1">sin generar</div>
        <video id="video1" controls allowfullscreen playsinline style="display:none"></video>
        <div class="vid-footer">
          <span></span>
          <a class="dl" id="dl1" style="display:none" download onclick="event.stopPropagation();">⬇ Descargar</a>
        </div>
      </div>

      <!-- REPRODUCTOR FINAL -->
      <div class="vidbox">
        <button class="fs-btn" onclick="toggleFullscreen('video2')" title="Pantalla completa">⛶</button>
        <div class="vid-header">
          <h3>Vídeo <em style="color:var(--accent)">final</em></h3>
        </div>
        <div class="empty" id="empty2">sin generar</div>
        <video id="video2" controls allowfullscreen playsinline style="display:none"></video>
        <div class="vid-footer">
          <span></span>
          <a class="dl" id="dl2" style="display:none" download onclick="event.stopPropagation();">⬇ Descargar</a>
        </div>
      </div>
      
      <!-- GALERÍA DE VARIANTES -->
      <div class="vidbox variant-gallery" id="variantGalleryBox" style="display:none;">
        <h3>Galería de Variantes <span id="variantCount" style="color:var(--accent)"></span></h3>
        <div class="variant-grid" id="variantGrid"></div>
      </div>
    </div>
  </div>
</div>

<script>
const BASE_GRAPH = __GRAPH_JSON__;
const AVAILABLE_LORAS = __LORA_LIST__;

const N = {IMAGE:"917",PROMPT:"536",SEED:"524",WIDTH:"791",HEIGHT:"792",FRAMES:"796",FIDELITY:"797",MOTION:"915",LORA:"853",FINAL_SAVE:"920",PURGE_VRAM:"925",FIRST_SAVE:"923"};
const CLIENT_ID = crypto.randomUUID ? crypto.randomUUID() : "wc-" + Math.random().toString(36).slice(2);
let uploadedImage=null, localFile=null, seedMode="random";
let loras = [{on:true, lora:"", strength:1},{on:false, lora:"", strength:0.15},{on:false, lora:"", strength:0.65}];
let socket = null;
let currentBatchIndex = 0;
let totalBatchSize = 0;
let pendingSeeds = {};      // prompt_id -> semilla realmente usada en ese envío
let handledPrompts = new Set(); // prompt_id ya procesados (evita duplicados WS+polling)
let batchSeedMode = "random"; // modo capturado al lanzar el batch (independiente del toggle en vivo)

function randomSeed(){
  // entero positivo de 32 bits, válido para el sampler
  return Math.floor(Math.random() * 0xFFFFFFFF);
}

const $ = (id) => document.getElementById(id);
function server(){ return $("serverUrl").value.replace(/\/+$/,""); }
function log(msg, cls){const el=$("log"),line=document.createElement("div");if(cls)line.className=cls;line.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`;el.appendChild(line);el.scrollTop=el.scrollHeight;}
function setConn(s,t){$("connDot").className="dot"+(s?" "+s:"");$("connText").textContent=t;}
function setRun(s,t){$("runDot").className="dot"+(s?" "+s:"");$("runText").textContent=t;}
function setChainActive(keys){document.querySelectorAll(".chain .node").forEach(n=>n.classList.toggle("active",keys.includes(n.dataset.n)));}

// --- WEBSOCKET SETUP ---
function connectSocket() {
    // evitar abrir un segundo socket mientras el primero aún está conectando
    if(socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
    const url = server().replace('http', 'ws') + '/ws?clientId=' + CLIENT_ID;
    socket = new WebSocket(url);
    socket.onopen = () => { console.log("WebSocket conectado"); setConn("ok", "Conectado (WS)"); };
    socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if(msg.type === 'execution_success') handlePromptDone(msg.data.prompt_id);
        if(msg.type === 'execution_error') {
            const pid = msg.data && msg.data.prompt_id;
            log(`❌ Error en prompt ${pid || ''}: ${JSON.stringify(msg.data && msg.data.exception_message || msg.data)}`, "l-err");
            if(pid){ handledPrompts.add(pid); delete pendingSeeds[pid]; }
            currentBatchIndex++;
            processNextBatch();
        }
    };
    socket.onerror = (err) => console.error("WS Error", err);
}

// Procesa un prompt_id terminado, venga del WS o del polling de respaldo.
// Idempotente: si ya se ha procesado, no hace nada.
async function handlePromptDone(promptId) {
    if(handledPrompts.has(promptId)) return;
    let entry;
    try {
        const hr = await fetch(server()+"/history/"+promptId);
        if(!hr.ok) return;
        const hist = await hr.json();
        entry = hist[promptId];
    } catch(e) { return; }
    if(!entry || !entry.outputs) return; // aún no ha terminado

    handledPrompts.add(promptId);

    // La semilla real la conocemos desde que se encoló (la genera el propio navegador),
    // no hace falta (ni se puede) leerla del historial de ComfyUI.
    const realSeed = (promptId in pendingSeeds) ? pendingSeeds[promptId] : null;
    if(realSeed !== null) {
        updateSeedUI(realSeed);
        log(`🎲 Semilla usada: ${realSeed}`, "l-ok");
    }

    // Mostrar en reproductores principales
    if(entry.outputs[N.FIRST_SAVE]) showVideo(1, findMedia(entry.outputs[N.FIRST_SAVE]));
    if(entry.outputs[N.FINAL_SAVE]) showVideo(2, findMedia(entry.outputs[N.FINAL_SAVE]));

    // Añadir a la galería de variantes (usando siempre findMedia para extraer filename/subfolder/type)
    const outNode = entry.outputs[N.FIRST_SAVE] || entry.outputs[N.FINAL_SAVE];
    const media = outNode ? findMedia(outNode) : null;
    addToVariantGallery(media, realSeed);

    log(`✅ Variante ${currentBatchIndex + 1}/${totalBatchSize} completada.`, "l-ok");
    delete pendingSeeds[promptId];
    currentBatchIndex++;
    processNextBatch();
}

// Red de seguridad: si el WS no entrega 'execution_success' (build distinta de ComfyUI,
// reconexión, mensaje perdido...), esto igualmente recupera el resultado por polling.
function pollFallback(promptId) {
    let tries = 0;
    const iv = setInterval(async () => {
        tries++;
        if(handledPrompts.has(promptId) || tries > 180) { clearInterval(iv); return; } // ~12 min máx
        await handlePromptDone(promptId);
        if(handledPrompts.has(promptId)) clearInterval(iv);
    }, 4000);
}

// FUNCIÓN PARA ACTUALIZAR LA SEMILLA EN EL UI
function updateSeedUI(seedValue) {
    $("seedVal").value = seedValue;
    $("seedVal").classList.remove("seed-updated");
    void $("seedVal").offsetWidth;
    $("seedVal").classList.add("seed-updated");
    // Solo cambiamos el toggle a "Fija" fuera de un batch (una sola generación):
    // durante un batch de variantes esto no debe tocar seedMode, o las siguientes
    // variantes perderían la aleatoriedad (ver batchSeedMode).
    if(totalBatchSize <= 1) {
        seedMode = "fixed";
        $("segFixed").classList.add("on");
        $("segRandom").classList.remove("on");
        $("seedVal").disabled = false;
    }
}

// Galería de variantes. `media` debe venir ya resuelto por findMedia() como
// {filename, subfolder, type} — antes se reimplementaba el parseo aquí con
// claves equivocadas (media.images) y casi nunca encontraba el archivo real,
// cayendo siempre en el fallback "video.mp4" (inexistente -> vídeo roto).
function addToVariantGallery(media, seedValue) {
    if(!media || !media.filename) {
        log("⚠️ No se encontró vídeo de salida para añadir a la galería de variantes.", "l-err");
        return;
    }
    const box = $("variantGalleryBox");
    const grid = $("variantGrid");
    box.style.display = "block";

    const { filename, subfolder, type } = media;
    const ts = Date.now();
    const url = `${server()}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${encodeURIComponent(type)}&t=${ts}`;
    
    // Determinar qué texto mostrar
    const hasSeed = seedValue !== null && seedValue !== undefined;
    const displayText = hasSeed ? String(seedValue) : `Var. #${currentBatchIndex + 1}`;
    const tooltipText = hasSeed ? "Click para copiar semilla" : "Semilla no disponible";
    
    const card = document.createElement("div");
    card.className = "variant-card";
    
    // Usamos un span limpio solo con el texto y el icono
    card.innerHTML = `
        <video src="${url}" type="video/mp4" controls muted preload="metadata"></video>
        <div class="variant-info">
            <span class="variant-seed-display" title="${tooltipText}">
                <span class="seed-text">${displayText}</span>
                <span class="copy-icon">📋</span>
            </span>
            <a href="${url}" download style="color:var(--accent)" onclick="event.stopPropagation();">⬇</a>
        </div>
    `;
    
    // Añadir evento de copia SOLO si hay semilla
    if(hasSeed) {
        const seedSpan = card.querySelector('.variant-seed-display');
        seedSpan.addEventListener('click', async (e) => {
            e.stopPropagation(); // Evitar burbujeo
            try {
                await navigator.clipboard.writeText(String(seedValue));
                const originalHTML = seedSpan.innerHTML;
                seedSpan.innerHTML = '<span class="seed-text">¡Copiado!</span> <span class="copy-icon">✅</span>';
                setTimeout(() => { 
                    seedSpan.innerHTML = originalHTML; 
                }, 1200);
            } catch(err) {
                console.error("Error al copiar:", err);
            }
        });
    }
    
    grid.appendChild(card);
    $("variantCount").textContent = `(${currentBatchIndex + 1})`;
}

function processNextBatch() {
    if(currentBatchIndex < totalBatchSize) {
        setTimeout(() => runSingleGeneration(currentBatchIndex), 1000);
    } else {
        setRun("ok", "Batch finalizado");
        log("🏁 Todas las variantes han sido procesadas.", "l-ok");
        $("btnFirstPass").disabled=false;
        $("btnFull").disabled=false;
    }
}

// --- GESTIÓN DE PROMPTS ---
function loadPrompts(){
  const saved = JSON.parse(localStorage.getItem('ltxv_prompts') || '{}');
  const select = $("promptLibSelect");
  select.innerHTML = '<option value="">-- Seleccionar Prompt Guardado --</option>';
  Object.keys(saved).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key; opt.textContent = key;
    select.appendChild(opt);
  });
}
function savePrompt(){
  const name = prompt("Nombre para este prompt:");
  if(!name) return;
  const text = $("prompt").value;
  const saved = JSON.parse(localStorage.getItem('ltxv_prompts') || '{}');
  saved[name] = text;
  localStorage.setItem('ltxv_prompts', JSON.stringify(saved));
  loadPrompts();
  log(`Prompt "${name}" guardado.`, "l-ok");
}
function deletePrompt(){
  const select = $("promptLibSelect");
  const name = select.value;
  if(!name) return;
  if(!confirm(`¿Eliminar "${name}"?`)) return;
  const saved = JSON.parse(localStorage.getItem('ltxv_prompts') || '{}');
  delete saved[name];
  localStorage.setItem('ltxv_prompts', JSON.stringify(saved));
  loadPrompts();
}
$("promptLibSelect").addEventListener("change", (e) => {
  const saved = JSON.parse(localStorage.getItem('ltxv_prompts') || '{}');
  if(saved[e.target.value]) $("prompt").value = saved[e.target.value];
});
$("btnSavePrompt").addEventListener("click", savePrompt);
$("btnDeletePrompt").addEventListener("click", deletePrompt);
loadPrompts();

// --- GESTIÓN DE GALERÍA DE IMÁGENES (IndexedDB: miniatura + original a resolución completa) ---
// Antes se guardaba solo la miniatura comprimida (260px) en localStorage y se descartaba
// el original -> al reseleccionar una imagen del historial, se reinyectaba la miniatura
// de baja resolución como si fuera la imagen de entrada. localStorage tiene ~5-10MB de
// cuota, insuficiente para guardar originales, así que usamos IndexedDB (sin ese límite
// práctico) y guardamos AMBAS: 'thumb' (para pintar la miniatura rápido) y 'full' (el
// original intacto, que es lo que se reinyecta al seleccionar).
const GALLERY_DB_NAME = 'ltxv_gallery_db';
const GALLERY_STORE = 'images';

function openGalleryDB(){
  return new Promise((resolve, reject) => {
    if(!window.indexedDB){ reject(new Error("IndexedDB no disponible en este navegador")); return; }
    const req = indexedDB.open(GALLERY_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains(GALLERY_STORE)){
        db.createObjectStore(GALLERY_STORE, { keyPath: 'hash' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbPutImage(record){
  const db = await openGalleryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GALLERY_STORE, 'readwrite');
    tx.objectStore(GALLERY_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbGetAllImages(){
  const db = await openGalleryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GALLERY_STORE, 'readonly');
    const req = tx.objectStore(GALLERY_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbDeleteImage(hash){
  const db = await openGalleryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GALLERY_STORE, 'readwrite');
    tx.objectStore(GALLERY_STORE).delete(hash);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbClearImages(){
  const db = await openGalleryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GALLERY_STORE, 'readwrite');
    tx.objectStore(GALLERY_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function aspectRatioStr(w, h){
  function gcd(a, b){ return b ? gcd(b, a % b) : a; }
  const d = gcd(w, h) || 1;
  return `${w / d}:${h / d}`;
}

function updateDzInfo(w, h){
  const el = $("dzInfo");
  if(!el) return;
  el.textContent = (w && h) ? `${w}×${h} · ${aspectRatioStr(w, h)}` : "";
}

async function getImageHash(base64Str) {
    const msgBuffer = new TextEncoder().encode(base64Str.substring(0, 500) + base64Str.length);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

function resizeImageForStorage(base64Str, maxWidth = 260) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve({
                dataUrl: canvas.toDataURL('image/jpeg', 0.78),
                width: img.width,
                height: img.height
            });
        };
        img.src = base64Str;
    });
}

async function addToGallery(base64Data) {
    try {
        // base64Data es el ORIGINAL sin tocar (viene de handleFile); 'thumb' es solo
        // para pintar rápido en el grid, pero se guarda también el original completo.
        const { dataUrl: thumb, width, height } = await resizeImageForStorage(base64Data, 260);
        const hash = await getImageHash(thumb);
        await dbPutImage({ hash, thumb, full: base64Data, width, height, ts: Date.now() });
        await renderGallery();
    } catch (err) {
        console.warn("No se pudo guardar en galería:", err);
        log("⚠️ No se pudo guardar la imagen en el historial: " + err.message, "l-err");
    }
}

// Migra una sola vez las entradas antiguas de localStorage (solo tenían miniatura,
// el original ya se había descartado -> quedan marcadas como 'legacy' y seguirán
// siendo de baja resolución hasta que se vuelvan a arrastrar).
async function migrateLegacyGalleryIfNeeded(){
  const raw = localStorage.getItem('ltxv_gallery');
  if(!raw) return;
  try {
    const old = JSON.parse(raw);
    for(const raw_item of old){
      const item = typeof raw_item === 'string' ? { data: raw_item, hash: null } : raw_item;
      const hash = item.hash || await getImageHash(item.data);
      await dbPutImage({
        hash, thumb: item.data, full: item.data,
        width: item.width || null, height: item.height || null,
        ts: Date.now(), legacy: true
      });
    }
    log(`↪️ Migradas ${old.length} imágenes del historial antiguo (quedan como baja resolución, arrástralas de nuevo para tenerlas a resolución completa).`, "l-ok");
  } catch(e) {
    console.warn("No se pudo migrar el historial antiguo:", e);
  } finally {
    localStorage.removeItem('ltxv_gallery'); // no volver a intentar migrar
  }
}

async function renderGallery(){
  const grid = $("galleryGrid");
  let history = [];
  try { history = await dbGetAllImages(); }
  catch(e) { console.warn("No se pudo leer el historial de imágenes:", e); }

  history.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  grid.innerHTML = "";

  if(history.length === 0){
    grid.innerHTML = `<div class="hint" style="grid-column:1/-1;">sin imágenes guardadas</div>`;
    return;
  }

  history.forEach((item) => {
    const div = document.createElement("div");
    div.className = "gallery-item";

    const hasRes = !!(item.width && item.height);
    const infoHtml = hasRes
      ? `<div class="info-tag">${item.width}×${item.height} · ${aspectRatioStr(item.width, item.height)}</div>`
      : "";
    const lqBadge = item.legacy
      ? `<div class="lq-badge" title="Guardada antes de la actualización: solo hay disponible en baja resolución">LQ</div>`
      : "";

    div.innerHTML = `<button class="del-btn" title="Eliminar del historial">×</button>${lqBadge}<img src="${item.thumb}">${infoHtml}`;

    div.querySelector(".del-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteFromGallery(item.hash);
    });

    div.addEventListener("click", () => {
      // 'full' es el original a resolución completa; solo cae a 'thumb' en entradas legacy sin original.
      const sourceData = item.full || item.thumb;
      fetch(sourceData).then(res => res.blob()).then(blob => {
        const uniqueName = `historial_${Date.now()}.png`;
        const file = new File([blob], uniqueName, {type: blob.type || "image/png"});
        // Pasamos false para indicar que no debe re-guardarse en el historial
        handleFile(file, false);

        document.querySelectorAll(".gallery-item").forEach(i => i.classList.remove("selected"));
        div.classList.add("selected");
      });
    });
    grid.appendChild(div);
  });
}

(async () => {
  await migrateLegacyGalleryIfNeeded();
  await renderGallery();
})();

async function deleteFromGallery(hash){
  try { await dbDeleteImage(hash); } catch(e) { console.warn(e); }
  await renderGallery();
}

async function clearGallery(){
  if(!confirm("¿Vaciar todo el historial de imágenes de entrada? No se puede deshacer.")) return;
  try { await dbClearImages(); } catch(e) { console.warn(e); }
  await renderGallery();
  log("🗑️ Historial de imágenes vaciado.", "l-ok");
}
$("btnClearGallery").addEventListener("click", clearGallery);


// --- GESTIÓN DE LORAS CON MEMORIA ---
function saveLoraState() { localStorage.setItem('ltxv_loras_state', JSON.stringify(loras)); }
function loadLoraState() {
  const saved = localStorage.getItem('ltxv_loras_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 3) {
        parsed.forEach((l, i) => {
          if (AVAILABLE_LORAS.includes(l.lora) || l.lora === "") loras[i] = l;
        });
      }
    } catch (e) { console.error("Error cargando estado LoRA", e); }
  }
}
function renderLoras(){
  const wrap=$("loraList"); wrap.innerHTML="";
  loras.forEach((l,i)=>{
    const box=document.createElement("div");
    box.className="lora"+(l.on?"":" off");
    let optionsHtml = '<option value="">-- Ninguno --</option>';
    AVAILABLE_LORAS.forEach(path => {
      const selected = path === l.lora ? 'selected' : '';
      const displayName = path.split('/').pop(); 
      optionsHtml += `<option value="${path}" ${selected} title="${path}">${displayName}</option>`;
    });
    box.innerHTML=`<div class="lora-top"><div class="switch ${l.on?'on':''}" data-i="${i}"><i></i></div><div class="lname">LoRA ${i+1}</div></div>
    <div class="row" style="margin-bottom:8px;"><select data-field="lora" data-i="${i}">${optionsHtml}</select></div>
    <div class="slider-row"><input type="range" min="0" max="2" step="0.05" value="${l.strength}" data-field="strength" data-i="${i}"><div class="slider-val" data-val="${i}">${Number(l.strength).toFixed(2)}</div></div>`;
    wrap.appendChild(box);
  });
  wrap.querySelectorAll(".switch").forEach(sw=>sw.addEventListener("click",()=>{loras[+sw.dataset.i].on=!loras[+sw.dataset.i].on;renderLoras();saveLoraState();}));
  wrap.querySelectorAll('select[data-field="lora"]').forEach(sel=>sel.addEventListener("change",()=>{loras[+sel.dataset.i].lora=sel.value;saveLoraState();}));
  wrap.querySelectorAll('input[data-field="strength"]').forEach(inp=>inp.addEventListener("input",()=>{const i=+inp.dataset.i;loras[i].strength=parseFloat(inp.value);wrap.querySelector(`[data-val="${i}"]`).textContent=loras[i].strength.toFixed(2);saveLoraState();}));
}
loadLoraState(); renderLoras();

// --- RESTO DEL CÓDIGO ---
$("segRandom").addEventListener("click",()=>{seedMode="random";$("segRandom").classList.add("on");$("segFixed").classList.remove("on");$("seedVal").disabled=true;});
$("segFixed").addEventListener("click",()=>{seedMode="fixed";$("segFixed").classList.add("on");$("segRandom").classList.remove("on");$("seedVal").disabled=false;});
$("fidelitySlider").addEventListener("input",(e)=>{$("fidelityVal").textContent=parseFloat(e.target.value).toFixed(2);});
$("motionSlider").addEventListener("input",(e)=>{$("motionVal").textContent=parseFloat(e.target.value).toFixed(1);});
$("frames").addEventListener("input",updateDuration);
function updateDuration(){const f=parseInt($("frames").value||"0",10);$("durHint").textContent=`(${f}/24fps=${(f/24).toFixed(1)}s)`;}

const dz=$("dropzone"),fileInput=$("fileInput");
dz.addEventListener("click",()=>fileInput.click());
["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("drag");}));
["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("drag");}));
dz.addEventListener("drop",e=>{if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);});
fileInput.addEventListener("change",e=>{if(e.target.files[0])handleFile(e.target.files[0]);});

// FUNCIÓN DE CARGA DE IMAGEN CORREGIDA Y ROBUSTA
function handleFile(f, shouldSaveToGallery = true){
  uploadedImage = null;
  localFile = null;
  
  const uniqueName = `temp_${Date.now()}_${f.name}`;
  localFile = new File([f], uniqueName, {type: f.type});
  
  const reader = new FileReader();
  reader.onload = (e) => {
    // Solo guardar si es una carga nueva (drag/drop o input), no si es selección de galería
    if (shouldSaveToGallery) {
        addToGallery(e.target.result);
    }
    
    const ph = dz.querySelector(".ph");
    if(ph) ph.remove();
    
    let img = dz.querySelector("img");
    if(!img){
      img = document.createElement("img");
      dz.appendChild(img);
    }
    img.onload = () => updateDzInfo(img.naturalWidth, img.naturalHeight);
    img.src = e.target.result;
    
    log(`🖼️ Imagen cargada: ${f.name}`, "l-ok");
  };
  reader.readAsDataURL(f);
}

$("btnTest").addEventListener("click", async ()=>{
    setConn("busy","comprobando...");
    try{
        const r=await fetch(server()+"/system_stats");
        if(!r.ok) throw new Error("HTTP "+r.status);
        await r.json(); 
        setConn("ok","conectado"); 
        connectSocket();
        log("Conexión OK","l-ok");
    }catch(err){setConn("bad","sin conexión");log("Error: "+err.message,"l-err");}
});

async function ensureImageUploaded(){
  if(!localFile) throw new Error("selecciona imagen");
  setRun("busy","subiendo...");
  const fd=new FormData();
  // Usar el nombre original sin el prefijo temporal para que ComfyUI lo guarde limpio
  fd.append("image", localFile, localFile.name.replace(/^temp_\d+_/, '')); 
  fd.append("overwrite","true");
  const r=await fetch(server()+"/upload/image",{method:"POST",body:fd});
  if(!r.ok) throw new Error("fallo subida");
  const data=await r.json();
  uploadedImage={name:data.name, subfolder:data.subfolder||"", type:data.type||"input"};
  log("Imagen subida al servidor: "+uploadedImage.name,"l-ok");
}

function buildGraph(firstPassOnly){
  const g=JSON.parse(JSON.stringify(BASE_GRAPH));
  if(uploadedImage) g[N.IMAGE].inputs.image = uploadedImage.name;
  if($("prompt").value.trim())g[N.PROMPT].inputs.text=$("prompt").value.trim();
  g[N.SEED].inputs.seed=(seedMode==="random")?-1:parseInt($("seedVal").value,10);
  const w=parseInt($("width").value,10),h=parseInt($("height").value,10);
  g[N.WIDTH].inputs.Xi=w;g[N.WIDTH].inputs.Xf=w;g[N.HEIGHT].inputs.Xi=h;g[N.HEIGHT].inputs.Xf=h;
  const frames=parseInt($("frames").value,10);g[N.FRAMES].inputs.Xi=frames;g[N.FRAMES].inputs.Xf=frames;
  g[N.FIDELITY].inputs.Xi=parseFloat($("fidelitySlider").value);g[N.FIDELITY].inputs.Xf=g[N.FIDELITY].inputs.Xi;
  g[N.MOTION].inputs.Xi=parseFloat($("motionSlider").value);g[N.MOTION].inputs.Xf=g[N.MOTION].inputs.Xi;
  g[N.LORA].inputs.lora_1={on:loras[0].on,lora:loras[0].lora,strength:loras[0].strength};
  g[N.LORA].inputs.lora_2={on:loras[1].on,lora:loras[1].lora,strength:loras[1].strength};
  g[N.LORA].inputs.lora_3={on:loras[2].on,lora:loras[2].lora,strength:loras[2].strength};
  if(firstPassOnly){delete g[N.FINAL_SAVE]; delete g[N.PURGE_VRAM];}
  return g;
}

function findMedia(nodeOutput){
  for(const k of["videos","gifs","images"]) if(nodeOutput[k]?.length) return nodeOutput[k][nodeOutput[k].length-1];
  return null;
}

function showVideo(slot, media){
  if(!media) return;
  const url=`${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder||"")}&type=${encodeURIComponent(media.type||"output")}`;
  const v=$("video"+slot), empty=$("empty"+slot), dl=$("dl"+slot);
  v.src=url; v.style.display="block"; empty.style.display="none";
  dl.href=url; dl.style.display="inline";
}

// FUNCIÓN PANTALLA COMPLETA ROBUSTA
function toggleFullscreen(videoId) {
    const video = document.getElementById(videoId);
    if (!video) return;
    if (!document.fullscreenElement) {
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
        else if (video.msRequestFullscreen) video.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
}

async function runSingleGeneration(index) {
    try {
        const graph = buildGraph(window.currentBatchMode);
        // Seed(rgthree) con -1 solo se randomiza en el editor de ComfyUI (JS del nodo);
        // por la API llega tal cual. Generamos aquí la semilla real para cada variante.
        const seedUsed = (batchSeedMode === "random") ? randomSeed() : parseInt($("seedVal").value, 10);
        graph[N.SEED].inputs.seed = seedUsed;

        log(`🚀 Procesando variante ${index + 1}/${totalBatchSize} (seed ${seedUsed})...`);
        const r = await fetch(server()+"/prompt",{
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({prompt:graph, client_id:CLIENT_ID})
        });
        if(!r.ok){
            const t = await r.text().catch(()=> "");
            throw new Error("HTTP "+r.status+" "+t.slice(0,300));
        }
        const data = await r.json();
        if(data.error) throw new Error(JSON.stringify(data.error));

        pendingSeeds[data.prompt_id] = seedUsed;
        pollFallback(data.prompt_id); // respaldo por si el WS no avisa
    } catch(err) {
        // Si el envío falla (p.ej. validación del grafo), no se queda colgado:
        // se registra el fallo y se pasa a la siguiente variante del batch.
        log(`❌ No se pudo encolar la variante ${index + 1}: ${err.message}`, "l-err");
        currentBatchIndex++;
        processNextBatch();
    }
}

async function queueAndWait(firstPassOnly){
  connectSocket();
  await ensureImageUploaded();
  totalBatchSize = parseInt($("batchSize").value || "1", 10);
  currentBatchIndex = 0;
  batchSeedMode = seedMode; // capturado aquí: el toggle en vivo puede cambiar tras cada variante
  window.currentBatchMode = firstPassOnly;
  $("variantGrid").innerHTML = "";
  $("variantGalleryBox").style.display = "none";
  setRun("busy", `Iniciando batch de ${totalBatchSize} variantes...`);
  $("btnFirstPass").disabled=true;
  $("btnFull").disabled=true;
  runSingleGeneration(0);
}

async function runGeneration(fp){
  try{ await queueAndWait(fp); }
  catch(err){ setRun("bad","error");log("Error: "+err.message,"l-err"); $("btnFirstPass").disabled=false;$("btnFull").disabled=false; }
}

$("btnFirstPass").addEventListener("click",()=>runGeneration(true));
$("btnFull").addEventListener("click",()=>runGeneration(false));
updateDuration();
</script>
</body>
</html>
'''

    final_html = html_template.replace("__GRAPH_JSON__", graph_json)
    final_html = final_html.replace("__LORA_LIST__", lora_js_array)

    with open(OUTPUT_HTML, 'w', encoding='utf-8') as f:
        f.write(final_html)
    
    print(f"✅ HTML generado con {len(lora_files)} LoRAs.")

if __name__ == "__main__":
    main()
