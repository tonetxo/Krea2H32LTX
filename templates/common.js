// common.js — Shared JavaScript for LTXV and Krea2 WebUIs.
//
// This file is injected BEFORE the UI-specific JS (ltxv.js / krea2.js).
// All top-level code that uses CONFIG or $ is deferred to initCommon(),
// which the UI-specific JS calls after defining CONFIG.
//
// Required CONFIG fields:
//   PROMPTS_KEY, LORA_STATE_KEY, ENHANCER_SYSKEY, SERVERURL_KEY,
//   N, DEFAULT_BACKEND_PORT, UI_TYPE, DEFAULT_MODEL,
//   ENHANCER_DEFAULT_PROMPTS, loras,
//   findMedia(nodeOutput), showMedia(slot, media, options),
//   addToVariantGallery(media, seedValue, timeText, slot, variantIndex),
//   onSeedUpdate(realSeed),
//   displayResult(entry, realSeed, tTotal, promptId) -> return value controls post-processing:
//     - boolean true: skip common finalize (used by LTXV step 1 -> step 2).
//     - object { skipFinalize: true }: same as boolean true.
//     - object { foundOutput: false }: no usable media found; do not mark handled,
//       so pollFallback keeps retrying.
//     - otherwise (false/undefined): standard finalize.
//   onPromptError(pid), startNextVariant(index), onBatchComplete(),
//   onStopCurrent(pid), onStopAll()

const CLIENT_ID = crypto.randomUUID ? crypto.randomUUID() : "wc-" + Math.random().toString(36).slice(2);
let socket = null;
let currentBatchIndex = 0;
let totalBatchSize = 0;
let variantCounter = 0;
let pendingSeeds = {};
let handledPrompts = new Set();
let processingPrompts = new Set();
let batchSeedMode = "random";
let currentPromptId = null;
let timers = {};
let loras = [];
let selectedPromptKey = null;
let lastPromptDir = "";
let sysPromptEditData = null;
let sysPromptEditMode = "text";

// Puertos legacy que deben limpiarse del localStorage al arrancar. "7821" hoy
// es el puerto por defecto del backend: si un usuario lo fija explícitamente,
// NO debe borrarse en cada recarga (bug "el campo de servidor se borra solo").
const LEGACY_PORTS = ["7822"];
let DEFAULT_BACKEND_PORT = "7821";
const $ = (id) => document.getElementById(id);

// --- TIMERS ---
function fmtMs(ms){
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function startTimer(promptId, slot){
  if(timers[promptId]) return;
  const t = { start: Date.now(), iv: null };
  const el = $("time"+slot);
  t.iv = setInterval(() => {
    if(!timers[promptId]) return;
    const live = `⏱ ${fmtMs(Date.now() - t.start)}`;
    el.textContent = live;
    el.classList.add("live");
  }, 500);
  timers[promptId] = t;
}

function stopTimer(promptId){
  const t = timers[promptId];
  if(!t) return null;
  const total = Date.now() - t.start;
  if(t.iv){ clearInterval(t.iv); t.iv = null; }
  delete timers[promptId];
  return { total, text: `⏱ ${fmtMs(total)}` };
}

function discardTimer(promptId){
  const t = timers[promptId];
  if(!t) return;
  if(t.iv) clearInterval(t.iv);
  delete timers[promptId];
}

function extractTimings(entry, N){
  if(!entry || !entry.status) return null;
  const msgs = entry.status.messages || [];
  if(!Array.isArray(msgs) || msgs.length === 0) return null;

  let tStart = null, tSuccess = null;
  const nodeTimes = {};
  for(const m of msgs){
    if(!Array.isArray(m) || m.length < 2) continue;
    const type = m[0];
    const data = m[1] || {};
    if(type === "execution_start" && data.timestamp != null){
      tStart = data.timestamp;
    } else if(type === "execution_success" && data.timestamp != null){
      tSuccess = data.timestamp;
    } else if(type === "executing" && data.node != null && data.timestamp != null){
      if(!nodeTimes[data.node]) nodeTimes[data.node] = { start: null, end: null };
      if(nodeTimes[data.node].start == null) nodeTimes[data.node].start = data.timestamp;
    } else if(type === "executed" && data.node != null && data.timestamp != null){
      if(!nodeTimes[data.node]) nodeTimes[data.node] = { start: null, end: null };
      nodeTimes[data.node].end = data.timestamp;
    }
  }

  const total = (tStart != null && tSuccess != null) ? (tSuccess - tStart) : null;
  const t1 = nodeTimes[N.FIRST_SAVE] && nodeTimes[N.FIRST_SAVE].start != null && nodeTimes[N.FIRST_SAVE].end != null
             ? (nodeTimes[N.FIRST_SAVE].end - nodeTimes[N.FIRST_SAVE].start) : null;
  const t2 = nodeTimes[N.FINAL_SAVE] && nodeTimes[N.FINAL_SAVE].start != null && nodeTimes[N.FINAL_SAVE].end != null
             ? (nodeTimes[N.FINAL_SAVE].end - nodeTimes[N.FINAL_SAVE].start) : null;

  if(total == null && t1 == null && t2 == null) return null;
  return { t1, t2, total };
}

// --- SEED ---
function randomSeed(){
  return Math.floor(Math.random() * 0x100000000);
}

// --- SERVER / LOG ---
function server(){ return $("serverUrl").value.replace(/\/+$/,""); }

async function fetchWithRetry(url, options = {}, attempts = 3, delay = 350){
  for(let i = 0; i < attempts; i++){
    try {
      const res = await fetch(url, options);
      if(res.status === 502 && i < attempts - 1){
        await new Promise(r => setTimeout(r, delay * (i + 1)));
        continue;
      }
      return res;
    } catch(err){
      if(i < attempts - 1 && err.name !== "AbortError"){
        await new Promise(r => setTimeout(r, delay * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

async function postComfyBackend(endpoint, body){
  const payload = JSON.stringify(body);
  const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body: payload };
  const srv = (typeof server === "function" && server()) ? server() : "";
  let r;
  try {
    r = await fetch(`${srv}${endpoint}`, opts);
    if(r.ok) return r;
  } catch(err){
    if(srv) throw err;
  }
  // Si estamos en modo proxy (srv vacío) y falló o devolvió 404/405/502, reintentamos directo al backend
  if(!srv && (r ? (r.status === 404 || r.status === 405 || r.status === 502) : true)){
    const host = window.location.hostname || "127.0.0.1";
    const port = (typeof DEFAULT_BACKEND_PORT !== "undefined" && DEFAULT_BACKEND_PORT) ? DEFAULT_BACKEND_PORT : "8188";
    r = await fetch(`http://${host}:${port}${endpoint}`, opts);
  }
  return r;
}

function getFriendlyRatio(w, h){
  if(!w || !h) return "16:9";
  const r = w / h;
  const known = [
    { name: "16:9", val: 16/9 },
    { name: "9:16", val: 9/16 },
    { name: "1:1", val: 1/1 },
    { name: "4:3", val: 4/3 },
    { name: "3:4", val: 3/4 },
    { name: "3:2", val: 3/2 },
    { name: "2:3", val: 2/3 },
    { name: "21:9", val: 21/9 },
    { name: "9:21", val: 9/21 },
    { name: "4:5", val: 4/5 },
    { name: "5:4", val: 5/4 }
  ];
  let best = known[0];
  let minDiff = Math.abs(r - best.val);
  for(const k of known){
    const diff = Math.abs(r - k.val);
    if(diff < minDiff){
      minDiff = diff;
      best = k;
    }
  }
  if(minDiff / best.val < 0.05){
    return best.name;
  }
  function gcd(a, b){ return b ? gcd(b, a % b) : a; }
  const g = gcd(Math.round(w), Math.round(h)) || 1;
  const rw = Math.round(w / g);
  const rh = Math.round(h / g);
  if(rw < 50 && rh < 50){
    return `${rw}:${rh}`;
  }
  return r >= 1 ? `${r.toFixed(2)}:1` : `1:${(1/r).toFixed(2)}`;
}

// --- VIDEO SPECS & TIMING HELPERS ---
const TIMINGS_STORAGE_KEY = "comfy_video_timings";

async function fetchComfyBackend(endpoint, opts = {}){
  const srv = (typeof server === "function" && server()) ? server() : "";
  let r;
  try {
    r = await fetch(`${srv}${endpoint}`, opts);
    if(r.ok) return r;
  } catch(_){}
  if(!srv && (r ? (r.status === 404 || r.status === 405 || r.status === 502) : true)){
    const host = window.location.hostname || "127.0.0.1";
    const port = (typeof DEFAULT_BACKEND_PORT !== "undefined" && DEFAULT_BACKEND_PORT) ? DEFAULT_BACKEND_PORT : "7821";
    try {
      r = await fetch(`http://${host}:${port}${endpoint}`, opts);
    } catch(_){}
  }
  return r;
}

function formatTimingValue(val){
  if(val == null || val === "" || val === "—") return "—";
  if(typeof val === "number"){
    if(val <= 0) return "—";
    const s = val < 1000 ? val : val / 1000;
    if(s < 60) return `${s < 10 ? s.toFixed(1) : Math.round(s)}s`;
    const m = Math.floor(s / 60);
    const remS = Math.round(s % 60);
    return `${m}m ${remS}s`;
  }
  let str = String(val).replace(/^⏱\s*/, '').trim();
  const m = str.match(/^(\d{1,2}):(\d{2})$/);
  if(m){
    const min = parseInt(m[1], 10);
    const sec = parseInt(m[2], 10);
    if(min === 0) return `${sec}s`;
    return `${min}m ${sec}s`;
  }
  return str;
}

function saveVideoTiming(filename, timeStr){
  if(!filename || !timeStr) return;
  try {
    const raw = localStorage.getItem(TIMINGS_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[filename] = formatTimingValue(timeStr);
    const keys = Object.keys(map);
    if(keys.length > 500){
      for(let i = 0; i < keys.length - 500; i++){
        delete map[keys[i]];
      }
    }
    localStorage.setItem(TIMINGS_STORAGE_KEY, JSON.stringify(map));
  } catch(_){}
}

function getVideoTiming(filename){
  if(!filename) return "";
  try {
    const raw = localStorage.getItem(TIMINGS_STORAGE_KEY);
    if(!raw) return "";
    const map = JSON.parse(raw);
    return map[filename] || "";
  } catch(_){
    return "";
  }
}

let _lastSyncTimingsTime = 0;
let _syncTimingsPromise = null;

async function syncHistoryTimings(){
  const now = Date.now();
  if(_syncTimingsPromise && (now - _lastSyncTimingsTime < 8000)){
    return _syncTimingsPromise;
  }
  _lastSyncTimingsTime = now;
  _syncTimingsPromise = (async () => {
    try {
      const r = await fetchComfyBackend("/history");
      if(!r || !r.ok) return;
      const historyData = await r.json();
      if(!historyData || typeof historyData !== "object") return;

      const raw = localStorage.getItem(TIMINGS_STORAGE_KEY);
      const timingsMap = raw ? JSON.parse(raw) : {};
      let updated = false;

      for(const pid of Object.keys(historyData)){
        const entry = historyData[pid];
        if(!entry || !entry.status || !entry.outputs) continue;
        const msgs = entry.status.messages || [];
        let tStart = null, tEnd = null;
        for(const m of msgs){
          if(!Array.isArray(m) || m.length < 2) continue;
          if(m[0] === "execution_start" && m[1]?.timestamp != null) tStart = m[1].timestamp;
          if(m[0] === "execution_success" && m[1]?.timestamp != null) tEnd = m[1].timestamp;
        }
        if(tStart != null && tEnd != null){
          const durMs = (tEnd > 1e11) ? (tEnd - tStart) : (tEnd - tStart) * 1000;
          if(durMs > 0){
            const formatted = formatTimingValue(durMs);
            for(const nid of Object.keys(entry.outputs)){
              const out = entry.outputs[nid];
              if(!out) continue;
              const files = [
                ...(Array.isArray(out.gifs) ? out.gifs : []),
                ...(Array.isArray(out.videos) ? out.videos : []),
                ...(Array.isArray(out.images) ? out.images : [])
              ];
              for(const f of files){
                if(f && f.filename && !timingsMap[f.filename]){
                  timingsMap[f.filename] = formatted;
                  updated = true;
                }
              }
            }
          }
        }
      }

      if(updated){
        localStorage.setItem(TIMINGS_STORAGE_KEY, JSON.stringify(timingsMap));
      }
    } catch(_){}
  })();
  return _syncTimingsPromise;
}

async function resolveVideoSpecs(videoEl, wf){
  let w = (videoEl && videoEl.videoWidth) ? videoEl.videoWidth : 0;
  let h = (videoEl && videoEl.videoHeight) ? videoEl.videoHeight : 0;

  if((!w || !h) && videoEl){
    if(videoEl.readyState >= 1 && videoEl.videoWidth > 0){
      w = videoEl.videoWidth;
      h = videoEl.videoHeight;
    } else {
      try {
        if(videoEl.preload === "none"){
          videoEl.preload = "metadata";
          videoEl.load();
        }
        await new Promise((resolve) => {
          if(videoEl.videoWidth > 0) return resolve();
          const timer = setTimeout(resolve, 300);
          videoEl.addEventListener("loadedmetadata", () => {
            clearTimeout(timer);
            resolve();
          }, { once: true });
        });
        w = videoEl.videoWidth || 0;
        h = videoEl.videoHeight || 0;
      } catch(_){}
    }
  }

  // Fallback a nodos del workflow si el vídeo no aportó dimensiones todavía
  if((!w || !h) && wf && typeof wf === "object"){
    for(const k of Object.keys(wf)){
      const inp = wf[k]?.inputs;
      if(!inp) continue;
      if(typeof inp.width === "number" && typeof inp.height === "number" && inp.width > 0 && inp.height > 0){
        w = inp.width;
        h = inp.height;
        break;
      }
    }
  }

  let resolution = (w && h) ? `${w}×${h}` : "—";
  let aspectRatio = (w && h) ? getFriendlyRatio(w, h) : "—";

  if(aspectRatio === "—" && wf && typeof wf === "object"){
    for(const k of Object.keys(wf)){
      const inp = wf[k]?.inputs;
      if(inp?.aspect_ratio){
        aspectRatio = String(inp.aspect_ratio);
        break;
      }
    }
  }

  return { width: w, height: h, resolution, aspectRatio };
}

function log(msg, cls){
  const el = $("log");
  if(!el){ console.log(`[log] ${msg}`); return; }
  const line = document.createElement("div");
  if(cls) line.className = cls;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}
function setConn(s,t){$("connDot").className="dot"+(s?" "+s:"");$("connText").textContent=t;}
function setRun(s,t){const d=$("runDot");if(d)d.className="dot"+(s?" "+s:"");const txt=$("runText");if(txt)txt.textContent=t;}

function updateServerHint(){
  const hint = $("serverHint");
  if(!hint) return;
  const v = ($("serverUrl")?.value || "").trim();
  const host = (window.location.hostname || "").trim();
  const isLan = host && !/^(127\.|localhost$|::1$)/i.test(host);

  if(v){
    if(isLan && /^(http:\/\/)?(127\.|localhost|::1)/i.test(v)){
      hint.textContent = "Aviso: 127.0.0.1 apunta a este dispositivo cliente. Déjalo en blanco para usar el proxy o usa http://" + host + ":7821";
      hint.style.color = "var(--err, #ff6b6b)";
      return;
    }
    hint.style.color = "";
    hint.textContent = `URL efectiva: ${v}`;
  } else {
    hint.style.color = "";
    if(isLan){
      hint.textContent = "Proxy activo hacia ComfyUI en el servidor (" + host + ")";
    } else {
      hint.textContent = "Proxy activo hacia ComfyUI local (:7821)";
    }
  }
}

// --- PREVIEWS (TAE VAE / TAESD / Latent2RGB) ---
function getPreviewMethod(){
  const sel = $("previewMethod");
  return sel ? sel.value : "latent2rgb";
}

let currentPreviewUrl = null;

async function handleBinaryPreview(data) {
  try {
    let buffer;
    if (data instanceof Blob) {
      buffer = await data.arrayBuffer();
    } else if (data instanceof ArrayBuffer) {
      buffer = data;
    } else {
      return;
    }
    if (!buffer || buffer.byteLength < 8) return;
    const view = new DataView(buffer);
    const eventType = view.getUint32(0, false);
    let blob = null;
    let meta = null;

    if (eventType === 1) {
      // BinaryEventTypes.PREVIEW_IMAGE: [event_type: uint32][image_type: uint32][image_bytes...]
      const imageType = view.getUint32(4, false);
      const mime = (imageType === 2) ? "image/png" : "image/jpeg";
      blob = new Blob([buffer.slice(8)], { type: mime });
    } else if (eventType === 4) {
      // BinaryEventTypes.PREVIEW_IMAGE_WITH_METADATA: [event_type: uint32][meta_len: uint32][meta_json_utf8][image_bytes...]
      const metaLen = view.getUint32(4, false);
      if (buffer.byteLength >= 8 + metaLen) {
        const metaBytes = new Uint8Array(buffer, 8, metaLen);
        const metaStr = new TextDecoder().decode(metaBytes);
        try { meta = JSON.parse(metaStr); } catch(_) {}
        const mime = (meta && meta.image_type) || "image/jpeg";
        blob = new Blob([buffer.slice(8 + metaLen)], { type: mime });
      }
    } else if (eventType === 2) {
      // BinaryEventTypes.UNENCODED_PREVIEW_IMAGE
      blob = new Blob([buffer.slice(4)], { type: "image/jpeg" });
    }

    if (blob) {
      const oldUrl = currentPreviewUrl;
      currentPreviewUrl = URL.createObjectURL(blob);
      if (oldUrl) {
        try { URL.revokeObjectURL(oldUrl); } catch(_) {}
      }
      if (CONFIG.onPreview) {
        CONFIG.onPreview(currentPreviewUrl, meta);
      }
    }
  } catch (err) {
    console.warn("[WS Binary Preview] Error procesando frame:", err);
  }
}

function clearPreview() {
  if (currentPreviewUrl) {
    try { URL.revokeObjectURL(currentPreviewUrl); } catch(_) {}
    currentPreviewUrl = null;
  }
  if (CONFIG.onClearPreview) {
    CONFIG.onClearPreview();
  }
}

function handleStepProgress(data) {
  if (!data) return;
  const { value, max, prompt_id, node } = data;
  if (value != null && max != null && max > 0) {
    // Un progress tardío de un prompt ya finalizado no debe revivir el
    // estado "muestreando" después de "Batch finalizado"/"en reposo".
    if(prompt_id && handledPrompts.has(prompt_id)) return;
    const pct = Math.round((value / max) * 100);
    setRun("busy", `Muestreando (${value}/${max} · ${pct}%)`);
    if (CONFIG.onProgress) {
      CONFIG.onProgress(value, max, prompt_id, node);
    }
  }
}

// --- WEBSOCKET ---
function getWebSocketUrl() {
  const s = server();
  if(s){
    return s.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://') + '/ws?clientId=' + CLIENT_ID;
  }
  const proto = (window.location.protocol === "https:") ? "wss:" : "ws:";
  const host = window.location.host;
  return `${proto}//${host}/ws?clientId=${CLIENT_ID}`;
}

function connectSocket() {
    if(socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
    const url = getWebSocketUrl();
    try {
      socket = new WebSocket(url);
      socket.binaryType = "blob";
      socket.onopen = () => {
          try {
              socket.send(JSON.stringify({ type: "feature_flags", data: { supports_preview_metadata: true } }));
          } catch(e){ console.warn("WS feature_flags no enviados:", e); }
          console.debug("WebSocket conectado"); setConn("ok", "Conectado (WS)");
          // Tras una reconexión (p.ej. el móvil vuelve del segundo plano) los
          // execution_success emitidos mientras el WS estaba caído se perdieron:
          // comprobar ya los prompts pendientes en vez de esperar al polling.
          for(const pid of Object.keys(pendingSeeds)) handlePromptDone(pid);
      };
      socket.onmessage = (event) => {
          if(event.data instanceof Blob || event.data instanceof ArrayBuffer){
            handleBinaryPreview(event.data);
            return;
          }
          let msg;
          try { msg = JSON.parse(event.data); } catch(e) {
              console.warn("WS mensaje no-JSON, ignorando:", String(event.data).slice(0,80));
              return;
          }
          if(msg.type === 'progress') handleStepProgress(msg.data);
          if(msg.type === 'executing' && CONFIG.onNodeExecuting){
            try { CONFIG.onNodeExecuting(msg.data); } catch(e){ console.warn("onNodeExecuting error:", e); }
          }
          if(msg.type === 'kj_preview_override'){
            if(msg.data && msg.data.image){
              const mime = msg.data.mime || "image/jpeg";
              const dataUrl = `data:${mime};base64,${msg.data.image}`;
              if(CONFIG.onPreview) CONFIG.onPreview(dataUrl, msg.data);
            }
          }
          if(msg.type === 'execution_success') handlePromptDone(msg.data.prompt_id);
          if(msg.type === 'executed' && CONFIG.onNodeExecuted){
            try { CONFIG.onNodeExecuted(msg.data); } catch(e){ console.warn("onNodeExecuted error:", e); }
          }
          if(msg.type === 'execution_error') {
              const pid = msg.data && msg.data.prompt_id;
              log(`Error en prompt ${pid || ''}: ${JSON.stringify(msg.data && msg.data.exception_message || msg.data)}`, "l-err");
              // Guard idéntico al de handlePromptDone: si pollFallback ya tiene
              // este prompt en vuelo, dejar que su rama de error haga el avance
              // del batch (evita doble currentBatchIndex++ y doble
              // processNextBatch → variantes fantasma).
              if(pid && processingPrompts.has(pid)){
                return;
              }
              if(pid){
                processingPrompts.add(pid);
                handledPrompts.add(pid);
                delete pendingSeeds[pid];
                discardTimer(pid);
                if(CONFIG.onPromptError) CONFIG.onPromptError(pid);
              }
              clearPreview();
              currentBatchIndex++;
              processNextBatch();
              if(pid) processingPrompts.delete(pid);
          }
      };
      socket.onerror = (err) => console.error("WS Error", err);
      socket.onclose = () => {
        socket = null;
        setConn("bad", "sin conexión (WS)");
        setTimeout(() => {
          if(!document.hidden) connectSocket();
        }, 1500);
      };
    } catch(err){
      console.warn("No se pudo abrir WebSocket:", err);
    }
}

function ensureSocketConnected(timeoutMs = 1500) {
  connectSocket();
  if(!socket || socket.readyState === WebSocket.OPEN) return Promise.resolve();
  return new Promise((resolve) => {
    const start = Date.now();
    const check = setInterval(() => {
      if(!socket || socket.readyState === WebSocket.OPEN || Date.now() - start > timeoutMs){
        clearInterval(check);
        resolve();
      }
    }, 50);
  });
}

// Auto-reconexión proactiva al volver a la pestaña en navegadores como Chrome
document.addEventListener("visibilitychange", () => {
  if(!document.hidden){
    if(!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING){
      console.debug("[WS] Pestaña visible: reconectando socket...");
      connectSocket();
    }
  }
});

// --- COMFYUI SERVER QUEUE MONITOR ---
let serverQueueState = { running: 0, pending: 0 };
async function fetchServerQueueStatus(){
  try {
    const r = await fetch(server() + "/queue");
    if(r.ok){
      const data = await r.json();
      serverQueueState.running = Array.isArray(data.queue_running) ? data.queue_running.length : 0;
      serverQueueState.pending = Array.isArray(data.queue_pending) ? data.queue_pending.length : 0;
    }
  } catch(_){}
  if(typeof updateQueueUI === "function") updateQueueUI();
}

// Polling suave cada 3s para reflejar trabajos lanzados desde otros dispositivos.
// Con la pestaña oculta no se consulta (nadie ve el monitor y en el móvil gasta
// batería/datos); al volver a ser visible se refresca al momento.
setInterval(() => { if(!document.hidden) fetchServerQueueStatus(); }, 3000);
document.addEventListener("visibilitychange", () => {
  if(!document.hidden) fetchServerQueueStatus();
});

// --- HANDLE PROMPT DONE ---
// Procesa un prompt_id terminado, venga del WS o del polling de respaldo.
// Idempotente: si ya se ha procesado, no hace nada.
async function handlePromptDone(promptId) {
    if(handledPrompts.has(promptId)) return;
    if(processingPrompts.has(promptId)) return; // ya lo está consultando otro
    processingPrompts.add(promptId);
    let entry;
    try {
        const hr = await fetch(server()+"/history/"+promptId);
        if(!hr.ok) {
            log(`⏳ Esperando resultado (HTTP ${hr.status})...`, "l-ok");
            processingPrompts.delete(promptId);
            return;
        }
        const hist = await hr.json();
        entry = hist[promptId];
    } catch(e) {
        log(`⚠️ Error consultando history: ${e.message}`, "l-err");
        processingPrompts.delete(promptId);
        return;
    }
    if(!entry || !entry.outputs) {
        processingPrompts.delete(promptId);
        return; // aún no ha terminado
    }

    const statusInfo = entry.status ? { completed: entry.status.completed, status_str: entry.status.status_str } : null;
    if(window.DEBUG) console.debug("[handlePromptDone]", promptId, statusInfo, Object.keys(entry.outputs));

    if(entry.status && entry.status.status_str === "error") {
        const errMsg = entry.status.exception_message || (entry.status.messages || []).filter(m => m[0] === "execution_error").map(m => m[1] && m[1].exception_message).filter(Boolean)[0] || "error desconocido del backend";
        log(`❌ Error en backend: ${errMsg}`, "l-err");
        if(entry.status.exception_type) log(`   Tipo: ${entry.status.exception_type}`, "l-err");
        _failPrompt(promptId);
        return;
    }

    // Si el prompt fue cancelado (Stop All / Stop Video) y ya no está en pendingSeeds,
    // descartamos silenciosamente cualquier execution_success tardío del backend.
    if(!(promptId in pendingSeeds)){
        handledPrompts.add(promptId);
        processingPrompts.delete(promptId);
        return;
    }

    const realSeed = (promptId in pendingSeeds) ? pendingSeeds[promptId] : null;
    if(realSeed !== null) {
        if(CONFIG.onSeedUpdate) CONFIG.onSeedUpdate(realSeed);
        log(`🎲 Semilla usada: ${realSeed}`, "l-ok");
    }

    const timings = extractTimings(entry, CONFIG.N);
    const clientResult = stopTimer(promptId);
    const tTotal = (timings && timings.total != null) ? fmtMs(timings.total) :
                   (clientResult ? fmtMs(clientResult.total) : null);
    const t1 = (timings && timings.t1 != null) ? fmtMs(timings.t1) : null;
    const t2 = (timings && timings.t2 != null) ? fmtMs(timings.t2) : null;

    if(entry.outputs && (tTotal || t1 || t2)){
      for(const nid of Object.keys(entry.outputs)){
        const out = entry.outputs[nid];
        if(!out) continue;
        const files = [
          ...(Array.isArray(out.gifs) ? out.gifs : []),
          ...(Array.isArray(out.videos) ? out.videos : []),
          ...(Array.isArray(out.images) ? out.images : [])
        ];
        for(const f of files){
          if(f && f.filename){
            let tSpec = tTotal;
            if(CONFIG.N && String(nid) === String(CONFIG.N.FIRST_SAVE) && t1) tSpec = t1;
            else if(CONFIG.N && String(nid) === String(CONFIG.N.FINAL_SAVE || CONFIG.N.SAVE) && t2) tSpec = t2;
            if(tSpec) saveVideoTiming(f.filename, tSpec);
          }
        }
      }
    }

    const displayResult = await CONFIG.displayResult(entry, realSeed, tTotal, promptId, { t1, t2 });
    const skipFinalize = displayResult === true || (displayResult && displayResult.skipFinalize === true);
    const foundOutput = !(displayResult && displayResult.foundOutput === false);

    if(!foundOutput) {
        // displayResult vio outputs pero aún no hay media usable; pollFallback reintentará.
        processingPrompts.delete(promptId);
        return;
    }

    // Si el UI-specific gestionó el batch (LTXV, MMH3X2), marcamos como procesado
    // pero no tocamos currentBatchIndex ni llamamos processNextBatch aquí.
    if(skipFinalize) {
        handledPrompts.add(promptId);
        processingPrompts.delete(promptId);
        delete pendingSeeds[promptId];
        return;
    }

    // En el último prompt del batch, marcar handled ANTES de processNextBatch
    // para que un progress WS tardío (100%) no reviva el estado "muestreando".
    handledPrompts.add(promptId);
    processingPrompts.delete(promptId);
    delete pendingSeeds[promptId];
    currentBatchIndex++;
    if(currentBatchIndex >= totalBatchSize){
        setRun("ok", "Batch finalizado");
        // Preview en vivo obsoleto al terminar todo el batch (ver processNextBatch).
        clearPreview();
    }
    processNextBatch();
}

// Da un prompt por fallido y avanza el batch (mismo efecto que un error del backend).
function _failPrompt(promptId){
    handledPrompts.add(promptId);
    processingPrompts.delete(promptId);
    delete pendingSeeds[promptId];
    discardTimer(promptId);
    if(CONFIG.onPromptError) CONFIG.onPromptError(promptId);
    currentBatchIndex++;
    processNextBatch();
}

// true/false según ComfyUI tenga el prompt en cola o ejecutándose; null si no se sabe.
async function _promptInServerQueue(promptId){
    try {
        const r = await fetch(server() + "/queue");
        if(!r.ok) return null;
        const q = await r.json();
        const has = list => Array.isArray(list) && list.some(it => Array.isArray(it) && it[1] === promptId);
        return has(q.queue_running) || has(q.queue_pending);
    } catch(_){ return null; }
}

// true/false según exista entrada en /history; null si no se sabe.
async function _promptInHistory(promptId){
    try {
        const r = await fetch(server() + "/history/" + promptId);
        if(!r.ok) return null;
        const h = await r.json();
        return !!(h && h[promptId]);
    } catch(_){ return null; }
}

// Respaldo por polling por si el WS pierde execution_success/execution_error
// (típico en el móvil con la pestaña en segundo plano). Antes se rendía a los
// 12 min (180 × 4 s): una generación más larga quedaba sin finalizar y la cola
// local se atascaba. Ahora no hay tope de tiempo mientras ComfyUI tenga el
// prompt en cola o ejecutándose; solo se da por perdido si desaparece de la
// cola sin dejar historial (p.ej. ComfyUI reiniciado), o si terminó pero no
// aparece media utilizable en ~2 min.
const POLL_INTERVAL_MS = 4000;
const POLL_QUEUE_CHECK_EVERY = 15;      // comprobar /queue cada ~1 min
const POLL_LOST_CONFIRMATIONS = 2;      // fuera de cola y sin historial, 2 veces seguidas
const POLL_NO_OUTPUT_LIMIT = 30;        // fuera de cola con historial pero sin media: ~2 min

function pollFallback(promptId) {
    let tries = 0, outOfQueue = 0, busy = false;
    const stop = () => clearInterval(iv);
    const iv = setInterval(async () => {
        if(busy) return;   // no solapar ticks si el backend tarda en responder
        // Terminado, o cancelado por Stop/Stop All (ambos lo sacan de pendingSeeds).
        if(handledPrompts.has(promptId) || !(promptId in pendingSeeds)) { stop(); return; }
        busy = true;
        try {
            tries++;
            await handlePromptDone(promptId);
            if(handledPrompts.has(promptId)) { stop(); return; }

            // Una vez fuera de cola se comprueba en cada tick; si no, cada ~1 min.
            if(outOfQueue === 0 && tries % POLL_QUEUE_CHECK_EVERY !== 0) return;
            const inQueue = await _promptInServerQueue(promptId);
            if(inQueue !== false){ outOfQueue = 0; return; }   // en cola, o backend sin responder
            outOfQueue++;
            const inHistory = await _promptInHistory(promptId);
            if(inHistory === null) return;
            if(handledPrompts.has(promptId) || !(promptId in pendingSeeds)) { stop(); return; }
            if(!inHistory && outOfQueue >= POLL_LOST_CONFIRMATIONS){
                log(`❌ El prompt ${promptId.slice(0, 8)}… ya no está en la cola de ComfyUI ni en su historial (¿ComfyUI reiniciado?). Se da por perdido.`, "l-err");
                stop(); _failPrompt(promptId);
            } else if(inHistory && outOfQueue >= POLL_NO_OUTPUT_LIMIT){
                log(`❌ El prompt ${promptId.slice(0, 8)}… terminó en ComfyUI pero no se encontró ningún resultado utilizable.`, "l-err");
                stop(); _failPrompt(promptId);
            }
        } finally {
            busy = false;
        }
    }, POLL_INTERVAL_MS);
}

function processNextBatch() {
    if(currentBatchIndex < totalBatchSize) {
        setTimeout(() => CONFIG.startNextVariant(currentBatchIndex), 1000);
    } else {
        setRun("ok", "Batch finalizado");
        // Al terminar el batch, el preview en vivo (WS binary/kj_preview_override)
        // queda obsoleto: revoca su objectURL y deja que cada UI oculte sus
        // paneles vía CONFIG.onClearPreview. Sin esto, la imagen/video previo
        // permanece pegado en el visor tras acabar la generación.
        clearPreview();
        log("🏁 Todas las variantes han sido procesadas.", "l-ok");
        CONFIG.onBatchComplete();
    }
}

// --- PROMPT LIBRARY ---
// Helper: lee el store de prompts como objeto; si está corrupto o no es un
// objeto plano, lo resetea a {} para no romper la UI entera.
function _readPromptStore(){
  const raw = localStorage.getItem(CONFIG.PROMPTS_KEY);
  if(!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if(parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch(e){ console.warn("Prompt store corrupto, reseteado:", e); }
  try { localStorage.removeItem(CONFIG.PROMPTS_KEY); } catch(_){}
  log("⚠️ Prompts guardados corruptos, reseteados.", "l-warn");
  return {};
}

function _readOpenState(){
  try {
    const parsed = JSON.parse(localStorage.getItem(CONFIG.PROMPTS_KEY + '_open') || '{}');
    return (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ? parsed : {};
  } catch(e){ return {}; }
}

// Lee la biblioteca del servidor. Devuelve { data, exists } o null si el
// servidor no responde. exists=false: nunca se guardó nada en el servidor.
async function _fetchServerPrompts(){
  try {
    const res = await fetch("/api/prompts?key=" + encodeURIComponent(CONFIG.PROMPTS_KEY));
    if(!res.ok) return null;
    const data = await res.json();
    if(!data || typeof data !== "object" || Array.isArray(data)) return null;
    // Sin cabecera (serve.py antiguo): se asume que existe si trae prompts.
    const hdr = res.headers.get("X-Prompts-Exists");
    const exists = hdr == null ? Object.keys(data).length > 0 : hdr === "1";
    return { data, exists };
  } catch(e){
    console.warn("[Prompts Sync] No se pudo conectar con el servidor de prompts:", e);
    return null;
  }
}

async function _syncPromptsWithServer(){
  const srv = await _fetchServerPrompts();
  if(!srv) return _readPromptStore();
  if(srv.exists){
    // El servidor manda (también si está vacío: se borraron todos y no deben
    // resucitar desde la copia local de este dispositivo).
    localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(srv.data));
    return srv.data;
  }
  // El servidor nunca tuvo prompts pero este cliente sí: los subimos.
  const local = _readPromptStore();
  if(Object.keys(local).length > 0) await _savePromptsToServer(local);
  return local;
}

// Aplica un cambio sobre la versión MÁS RECIENTE del servidor (no sobre la
// copia local, que puede estar desfasada si otro dispositivo guardó después)
// y la sube. Así un móvil con la página abierta desde hace rato no pisa los
// prompts guardados entretanto desde el PC. `mutator(store)` modifica el
// objeto in-place; si devuelve false se cancela sin escribir nada.
async function _mutatePrompts(mutator){
  const srv = await _fetchServerPrompts();
  const store = (srv && srv.exists) ? srv.data : _readPromptStore();
  if(mutator(store) === false) return false;
  localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(store));
  if(srv) await _savePromptsToServer(store);
  return true;
}

async function _savePromptsToServer(data){
  try {
    await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: CONFIG.PROMPTS_KEY, prompts: data })
    });
  } catch(e){
    console.warn("[Prompts Sync] Error al guardar prompts en servidor:", e);
  }
}

async function loadPrompts(skipSync = false){
  if(!skipSync){
    await _syncPromptsWithServer();
  }
  let saved = _readPromptStore();
  let dirty = false;
  for(const key of Object.keys(saved)){
    if(key.endsWith('/') || !key.split('/').pop()){
      delete saved[key]; dirty = true;
    }
  }
  if(dirty){
    localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(saved));
    _savePromptsToServer(saved);
  }

  const tree = $("promptTree");
  if(!tree) return;
  tree.innerHTML = '';

  if(Object.keys(saved).length === 0){
    tree.innerHTML = '<div class="pt-empty">sin prompts guardados</div>';
    return;
  }

  const root = { children: {}, prompts: [] };

  for(const key of Object.keys(saved).sort()){
    const parts = key.split('/');
    const promptName = parts.pop();
    let node = root;
    for(const part of parts){
      if(!node.children[part]) node.children[part] = { children: {}, prompts: [] };
      node = node.children[part];
    }
    node.prompts.push({ key, name: promptName });
  }

  const openState = _readOpenState();

  function renderNode(node, container, path){
    for(const folderName of Object.keys(node.children).sort()){
      const folderPath = path ? `${path}/${folderName}` : folderName;
      const folderDiv = document.createElement('div');
      folderDiv.className = 'pt-folder';
      if(openState[folderPath]) folderDiv.classList.add('open');

      const label = document.createElement('div');
      label.className = 'pt-folder-label';
      const arrow = document.createElement('span');
      arrow.className = 'pt-folder-arrow';
      arrow.textContent = '▶';
      label.appendChild(arrow);
      const nameSpan = document.createElement('span');
      nameSpan.textContent = folderName;
      label.appendChild(nameSpan);
      const delFolder = document.createElement('span');
      delFolder.className = 'pt-folder-del';
      delFolder.textContent = '×';
      delFolder.title = 'Eliminar carpeta y todo su contenido';
      label.appendChild(delFolder);

      delFolder.addEventListener("click", async (e) => {
        e.stopPropagation();
        if(!confirm(`¿Eliminar la carpeta "${folderPath}" y todos los prompts que contiene?`)) return;
        let count = 0;
        await _mutatePrompts(saved => {
          for(const key of Object.keys(saved)){
            if(key === folderPath || key.startsWith(folderPath + '/')){
              delete saved[key]; count++;
            }
          }
        });
        loadPrompts(true);
        log(`Carpeta "${folderPath}" eliminada (${count} prompt(s)).`, "l-ok");
      });

      label.addEventListener("click", (e) => {
        if(e.target === delFolder) return;
        folderDiv.classList.toggle("open");
        openState[folderPath] = folderDiv.classList.contains("open");
        localStorage.setItem(CONFIG.PROMPTS_KEY + '_open', JSON.stringify(openState));
      });

      const childrenDiv = document.createElement('div');
      childrenDiv.className = 'pt-children';
      renderNode(node.children[folderName], childrenDiv, folderPath);

      folderDiv.appendChild(label);
      folderDiv.appendChild(childrenDiv);
      container.appendChild(folderDiv);
    }
    for(const p of node.prompts){
      const item = document.createElement('div');
      item.className = 'pt-item';
      if(p.key === selectedPromptKey) item.classList.add('selected');
      item.textContent = p.name;
      item.title = p.key;
      item.dataset.key = p.key;
      item.addEventListener("click", () => {
        const saved = _readPromptStore();
        if(saved[p.key]){
          $("prompt").value = saved[p.key];
          selectedPromptKey = p.key;
          document.querySelectorAll(".pt-item").forEach(i => i.classList.remove("selected"));
          item.classList.add("selected");
        }
      });
      container.appendChild(item);
    }
  }

  renderNode(root, tree, '');
}

async function savePrompt(){
  const defaultName = selectedPromptKey || (lastPromptDir ? lastPromptDir + "/" : "");
  const name = prompt("Nombre/ruta para este prompt (usa / para clasificar, ej: casa/pasillo/noche):", defaultName);
  if(!name) return;
  const text = $("prompt").value;
  const ok = await _mutatePrompts(saved => {
    if(saved[name] && name !== selectedPromptKey){
      const preview = saved[name].slice(0, 80);
      if(!confirm(`Ya existe "${name}". ¿Sobrescribir?\n\nContenido actual:\n${preview}...`)) return false;
    }
    saved[name] = text;
  });
  if(!ok) return;
  selectedPromptKey = name;
  const parts = name.split('/');
  if(parts.length > 1) lastPromptDir = parts.slice(0, -1).join('/');
  loadPrompts(true);
  log(`Prompt "${name}" guardado.`, "l-ok");
}

async function movePrompt(){
  if(!selectedPromptKey){ log("⚠️ Selecciona un prompt para mover.", "l-err"); return; }
  const oldName = selectedPromptKey;
  const newName = prompt(`Mover/renombrar "${oldName}" a:`, oldName);
  if(!newName || newName === oldName) return;
  let missing = false;
  const ok = await _mutatePrompts(saved => {
    // Otro dispositivo pudo borrarlo o moverlo entretanto.
    if(!(oldName in saved)){ missing = true; return false; }
    if(saved[newName]){
      if(!confirm(`Ya existe "${newName}". ¿Sobrescribir?`)) return false;
    }
    saved[newName] = saved[oldName];
    delete saved[oldName];
  });
  if(missing){
    log(`⚠️ "${oldName}" ya no existe (¿borrado o movido desde otro dispositivo?).`, "l-err");
    loadPrompts(true);
    return;
  }
  if(!ok) return;
  selectedPromptKey = newName;
  loadPrompts(true);
  log(`Prompt movido: "${oldName}" → "${newName}"`, "l-ok");
}

async function deletePrompt(){
  if(!selectedPromptKey){ log("⚠️ Selecciona un prompt para eliminar.", "l-err"); return; }
  if(!confirm(`¿Eliminar "${selectedPromptKey}"?`)) return;
  const key = selectedPromptKey;
  await _mutatePrompts(saved => { delete saved[key]; });
  selectedPromptKey = null;
  loadPrompts(true);
  log(`Prompt eliminado.`, "l-ok");
}

// --- LORA STATE ---
function saveLoraState() { localStorage.setItem(CONFIG.LORA_STATE_KEY, JSON.stringify(loras)); }
function loadLoraState() {
  const saved = localStorage.getItem(CONFIG.LORA_STATE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((l, i) => {
          if (i < loras.length && (AVAILABLE_LORAS.includes(l.lora) || l.lora === "")) loras[i] = l;
        });
      }
    } catch (e) { console.error("Error cargando estado LoRA", e); }
  }
}
function loadModels(){
  const sel = $("modelSelect");
  if(!sel) return;
  sel.innerHTML = "";
  const modelKey = (CONFIG.UI_TYPE || "common") + "_model_selected";
  let savedModel = null;
  try { savedModel = localStorage.getItem(modelKey); } catch(_){}
  // Un nombre guardado sin carpeta (listas antiguas) sigue valiendo si una
  // opción termina en "/<nombre>"; si ya no existe, se usa el modelo por defecto.
  const matchesSaved = m => !!savedModel && (m === savedModel || m.endsWith("/" + savedModel));
  const savedPresent = AVAILABLE_MODELS.some(matchesSaved);
  let selectedOne = false;
  for(const m of AVAILABLE_MODELS){
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    const isDefault = CONFIG.DEFAULT_MODEL && (m === CONFIG.DEFAULT_MODEL || m.endsWith("/" + CONFIG.DEFAULT_MODEL) || CONFIG.DEFAULT_MODEL.endsWith("/" + m));
    if(!selectedOne && (savedPresent ? matchesSaved(m) : isDefault)){ opt.selected = true; selectedOne = true; }
    sel.appendChild(opt);
  }
  sel.addEventListener("change", () => {
    try { localStorage.setItem(modelKey, sel.value); } catch(_){}
  });
}
function renderLoras(){
  const wrap=$("loraList");
  if(!wrap) return;
  wrap.innerHTML="";
  loras.forEach((l,i)=>{
    const box=document.createElement("div");
    box.className="lora"+(l.on?"":" off");
    let optionsHtml = '<option value="">-- Ninguno --</option>';
    AVAILABLE_LORAS.forEach(path => {
      const selected = path === l.lora ? 'selected' : '';
      const escPath = escapeHtml(path);
      const displayName = path.split('/').pop();
      optionsHtml += `<option value="${escPath}" ${selected} title="${escPath}">${escapeHtml(displayName)}</option>`;
    });
    box.innerHTML=`<div class="lora-top"><div class="switch ${l.on?'on':''}" data-i="${i}"><i></i></div><div class="lname">LoRA ${i+1}</div></div>
    <div class="row" style="margin-bottom:8px;"><select data-field="lora" data-i="${i}">${optionsHtml}</select></div>
    <div class="slider-row"><input type="range" min="-4" max="4" step="0.05" value="${l.strength}" data-field="strength" data-i="${i}"><div class="slider-val" data-val="${i}">${Number(l.strength).toFixed(2)}</div></div>`;
    wrap.appendChild(box);
  });
  wrap.querySelectorAll(".switch").forEach(sw=>sw.addEventListener("click",()=>{loras[+sw.dataset.i].on=!loras[+sw.dataset.i].on;renderLoras();saveLoraState();}));
  wrap.querySelectorAll('select[data-field="lora"]').forEach(sel=>sel.addEventListener("change",()=>{loras[+sel.dataset.i].lora=sel.value;saveLoraState();}));
  wrap.querySelectorAll('input[data-field="strength"]').forEach(inp=>inp.addEventListener("input",()=>{const i=+inp.dataset.i;loras[i].strength=parseFloat(inp.value);wrap.querySelector(`[data-val="${i}"]`).textContent=loras[i].strength.toFixed(2);saveLoraState();}));
}

// --- ENHANCER ---
function loadSysPrompts(){
  const defaults = JSON.parse(JSON.stringify(CONFIG.ENHANCER_DEFAULT_PROMPTS));
  const saved = localStorage.getItem(CONFIG.ENHANCER_SYSKEY);
  if(saved){
    try {
      const parsed = JSON.parse(saved);
      for(const mode of Object.keys(defaults)){
        if(!parsed[mode]) parsed[mode] = defaults[mode];
        else {
          for(const k of Object.keys(defaults[mode])){
            if(!parsed[mode][k]) parsed[mode][k] = defaults[mode][k];
          }
        }
      }
      return parsed;
    } catch(e) {}
  }
  return defaults;
}

function saveSysPrompts(data){
  localStorage.setItem(CONFIG.ENHANCER_SYSKEY, JSON.stringify(data));
}

function populateStyleSelect(data, mode){
  const sel = $("enhancerStyle");
  sel.innerHTML = "";
  const styles = data[mode] || {};
  for(const key of Object.keys(styles).sort()){
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = styles[key].name || key;
    sel.appendChild(opt);
  }
}

function getCurrentSysPrompt(data, mode, styleKey){
  const styles = data[mode] || {};
  const entry = styles[styleKey];
  return entry ? entry.prompt : "";
}

function cleanOllamaResponse(raw){
  if(!raw) return "";
  let text = String(raw).trim();

  if(/<\/think>/i.test(text)){
    const parts = text.split(/<\/think>/i);
    const after = parts[parts.length - 1].trim();
    if(after) return after.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/\n?```$/, "").trim();
    const before = parts[0].replace(/<think>/gi, "").trim();
    const paragraphs = before.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if(paragraphs.length > 0) return paragraphs[paragraphs.length - 1];
  }

  if(/<\/thought>/i.test(text)){
    const parts = text.split(/<\/thought>/i);
    const after = parts[parts.length - 1].trim();
    if(after) return after.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/\n?```$/, "").trim();
    const before = parts[0].replace(/<thought>/gi, "").trim();
    const paragraphs = before.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if(paragraphs.length > 0) return paragraphs[paragraphs.length - 1];
  }

  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();
  text = text.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/\n?```$/, "").trim();
  return text;
}

async function streamLlamaCppGenerate(payload, outputEl, onChunk, signal){
  const rawModel = payload.model || "";
  const modelName = rawModel.replace(/^llamacpp:/, "");
  const messages = [];

  if(payload.system && payload.system.trim()){
    messages.push({ role: "system", content: payload.system.trim() });
  }

  const userPrompt = payload.prompt || "";
  if(Array.isArray(payload.images) && payload.images.length > 0){
    const userContent = [];
    if(userPrompt) {
      userContent.push({ type: "text", text: userPrompt });
    }
    for(const img of payload.images){
      const dataUrl = img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`;
      userContent.push({
        type: "image_url",
        image_url: { url: dataUrl }
      });
    }
    messages.push({ role: "user", content: userContent });
  } else {
    messages.push({ role: "user", content: userPrompt });
  }

  const reqBody = {
    model: modelName,
    messages: messages,
    temperature: (payload.options && payload.options.temperature != null) ? payload.options.temperature : 0.3,
    stream: true
  };
  if(payload.options && payload.options.max_tokens){
    reqBody.max_tokens = payload.options.max_tokens;
  }

  const origPlaceholder = outputEl ? outputEl.placeholder : "";
  if(outputEl){
    outputEl.value = "";
    outputEl.placeholder = "Generando prompt con llama.cpp...";
  }

  const startTime = Date.now();

  const r = await fetch("/llamacpp/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reqBody),
    signal
  });

  if(!r.ok){
    const t = await r.text().catch(()=>"");
    if(outputEl) outputEl.placeholder = origPlaceholder;
    let errMsg = "HTTP " + r.status;
    try {
      const errJson = JSON.parse(t);
      if(errJson.error && errJson.error.message) errMsg += ": " + errJson.error.message;
      else errMsg += " " + t.slice(0, 200);
    } catch(_) {
      errMsg += " " + t.slice(0, 200);
    }
    throw new Error(errMsg);
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let accumulated = "";
  let buffer = "";

  while(true){
    const { done, value } = await reader.read();
    if(done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for(const rawLine of lines){
      const line = rawLine.trim();
      if(!line || !line.startsWith("data:")) continue;
      const dataStr = line.slice(5).trim();
      if(dataStr === "[DONE]") break;
      try {
        const json = JSON.parse(dataStr);
        const delta = json.choices && json.choices[0] && json.choices[0].delta;
        if(delta){
          const chunk = delta.content || "";
          if(chunk){
            accumulated += chunk;
            if(outputEl){
              if(accumulated.includes("</think>")){
                const after = accumulated.split(/<\/think>/i).pop().trimStart();
                if(after) outputEl.value = after;
              } else if(accumulated.includes("</thought>")){
                const after = accumulated.split(/<\/thought>/i).pop().trimStart();
                if(after) outputEl.value = after;
              } else {
                outputEl.value = accumulated;
              }
            }
            if(onChunk) onChunk(chunk);
          }
        }
      } catch(_){}
    }
  }

  const elapsedMs = Date.now() - startTime;
  const finalClean = cleanOllamaResponse(accumulated);
  if(outputEl){
    outputEl.value = finalClean;
    outputEl.placeholder = origPlaceholder;
  }
  return { text: finalClean, elapsedMs };
}

async function streamOllamaGenerate(payload, outputEl, onChunk, signal){
  const model = payload.model || "";
  if(model.startsWith("llamacpp:")){
    return streamLlamaCppGenerate(payload, outputEl, onChunk, signal);
  }

  const bodyPayload = Object.assign({ stream: true }, payload, {
    model: model.replace(/^ollama:/, "")
  });
  if(!bodyPayload.options) bodyPayload.options = {};
  if(!bodyPayload.options.num_ctx) bodyPayload.options.num_ctx = 4096;
  if(bodyPayload.options.temperature == null) bodyPayload.options.temperature = 0.3;
  bodyPayload.keep_alive = 0;

  const origPlaceholder = outputEl ? outputEl.placeholder : "";
  if(outputEl){
    outputEl.value = "";
    outputEl.placeholder = "Generando prompt con Ollama...";
  }

  const startTime = Date.now();

  const r = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload),
    signal
  });

  if(!r.ok){
    const t = await r.text().catch(()=>"");
    if(outputEl) outputEl.placeholder = origPlaceholder;
    throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let accumulated = "";
  let buffer = "";

  while(true){
    const { done, value } = await reader.read();
    if(done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for(const line of lines){
      if(!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if(json.response){
          accumulated += json.response;
          if(outputEl){
            if(accumulated.includes("</think>")){
              const after = accumulated.split(/<\/think>/i).pop().trimStart();
              if(after) outputEl.value = after;
            } else if(accumulated.includes("</thought>")){
              const after = accumulated.split(/<\/thought>/i).pop().trimStart();
              if(after) outputEl.value = after;
            } else {
              outputEl.value = accumulated;
            }
          }
          if(onChunk) onChunk(json.response);
        }
      } catch(e){}
    }
  }

  if(buffer && buffer.trim()){
    try {
      const json = JSON.parse(buffer.trim());
      if(json.response) accumulated += json.response;
    } catch(e){}
  }

  const elapsedMs = Date.now() - startTime;
  const finalClean = cleanOllamaResponse(accumulated);
  if(outputEl){
    outputEl.value = finalClean;
    outputEl.placeholder = origPlaceholder;
  }
  return { text: finalClean, elapsedMs };
}

const streamEnhanceGenerate = streamOllamaGenerate;

function makeCollapsible(toggleId, bodyId, onOpen){
  const h = $(toggleId), b = $(bodyId);
  if(!h || !b) return;
  h.addEventListener("click", () => {
    h.classList.toggle("open");
    b.classList.toggle("open");
    const arrow = h.querySelector(".arrow");
    if(arrow) arrow.textContent = h.classList.contains("open") ? "▼" : "▶";
    if(h.classList.contains("open") && onOpen) onOpen();
  });
}

async function loadEnhancerModels(){
  const sel = $("enhancerModel");
  if(!sel) return;

  const prevSelected = localStorage.getItem("enhancer_model_selected") || sel.value;
  sel.innerHTML = '<option value="">Cargando modelos...</option>';

  let ollamaModels = [];
  let llamacppModels = [];

  const fetchOllama = (async () => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3500);
      const r = await fetch("/api/tags", { signal: ctrl.signal });
      clearTimeout(timer);
      if(r.ok){
        const data = await r.json();
        ollamaModels = data.models || [];
      }
    } catch(e){
      console.warn("Ollama no disponible:", e.message);
    }
  })();

  const fetchLlamaCpp = (async () => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3500);
      const r = await fetch("/llamacpp/v1/models", { signal: ctrl.signal });
      clearTimeout(timer);
      if(r.ok){
        const data = await r.json();
        llamacppModels = data.data || [];
      }
    } catch(e){
      console.warn("llama.cpp no disponible:", e.message);
    }
  })();

  await Promise.allSettled([fetchOllama, fetchLlamaCpp]);

  sel.innerHTML = '<option value="">-- Seleccionar modelo --</option>';

  if(llamacppModels.length > 0){
    const grp = document.createElement("optgroup");
    grp.label = "llama.cpp";
    for(const m of llamacppModels){
      const opt = document.createElement("option");
      const id = m.id || m.name;
      opt.value = "llamacpp:" + id;
      const isVision = m.architecture && Array.isArray(m.architecture.input_modalities) && m.architecture.input_modalities.includes("image");
      opt.textContent = id + (isVision ? " [vision]" : "");
      grp.appendChild(opt);
    }
    sel.appendChild(grp);
  }

  if(ollamaModels.length > 0){
    const grp = document.createElement("optgroup");
    grp.label = "Ollama";
    for(const m of ollamaModels){
      const opt = document.createElement("option");
      opt.value = "ollama:" + m.name;
      opt.textContent = m.name;
      grp.appendChild(opt);
    }
    sel.appendChild(grp);
  }

  if(llamacppModels.length === 0 && ollamaModels.length === 0){
    sel.innerHTML = '<option value="">Ningún modelo disponible (Ollama/llama.cpp offline)</option>';
    return;
  }

  // Restaurar selección previa si coincide con algún option
  let restored = false;
  if(prevSelected){
    for(const opt of sel.querySelectorAll("option")){
      if(opt.value === prevSelected || opt.value.endsWith(":" + prevSelected)){
        sel.value = opt.value;
        restored = true;
        break;
      }
    }
  }

  if(!restored){
    const allOptions = Array.from(sel.querySelectorAll("option")).filter(o => o.value);
    const preferred = allOptions.find(o =>
      o.value.includes("minimax-enhancer") ||
      o.value.toLowerCase().includes("qwythos") ||
      o.value.toLowerCase().includes("qwen")
    );
    if(preferred){
      sel.value = preferred.value;
    } else if(allOptions.length > 0){
      sel.value = allOptions[0].value;
    }
  }

  if(!sel.dataset.listenerBound){
    sel.addEventListener("change", () => {
      if(sel.value) localStorage.setItem("enhancer_model_selected", sel.value);
    });
    sel.dataset.listenerBound = "true";
  }

  // Sincronizar selector de Prompt 2 (seg2OllamaModel) si existe en la página
  const selSeg2 = $("seg2OllamaModel");
  if(selSeg2){
    const prevSeg2 = selSeg2.value || (JSON.parse(localStorage.getItem(typeof MMH3X2_SETTINGS_KEY !== "undefined" ? MMH3X2_SETTINGS_KEY : "mmh3x2_settings") || "{}")).seg2OllamaModel || "";
    selSeg2.innerHTML = '<option value="">-- Mismo que Enhancer / Default --</option>';
    for(const child of sel.children){
      if(child.tagName === "OPTGROUP" || (child.tagName === "OPTION" && child.value)){
        selSeg2.appendChild(child.cloneNode(true));
      }
    }
    if(prevSeg2){
      for(const opt of selSeg2.querySelectorAll("option")){
        if(opt.value === prevSeg2 || opt.value.endsWith(":" + prevSeg2)){
          selSeg2.value = opt.value;
          break;
        }
      }
    }
  }
}

function renderSysPromptEditor(){
  const container = $("sysPromptEditor");
  if(!container) return;
  const data = sysPromptEditData;
  const mode = sysPromptEditMode;
  const styles = data[mode] || {};
  const keys = Object.keys(styles).sort();
  container.innerHTML = "";
  for(const key of keys){
    const entry = styles[key];
    const isDefault = (key === "A" || key === "B") && CONFIG.ENHANCER_DEFAULT_PROMPTS[mode] && CONFIG.ENHANCER_DEFAULT_PROMPTS[mode][key];
    const row = document.createElement("div");
    row.className = "sysprompt-row";
    row.innerHTML = `
      <div class="spr-top">
        <span class="spr-name">${key}</span>
        <input type="text" class="spr-name-input" value="${escapeHtml(entry.name)}" style="flex:1;background:var(--panel);border:1px solid var(--border);color:var(--text);border-radius:4px;padding:4px 6px;font-family:var(--mono);font-size:11px;">
        ${isDefault ? "" : '<button class="spr-del" data-key="'+key+'">×</button>'}
      </div>
      <textarea data-key="${key}">${escapeHtml(entry.prompt)}</textarea>
    `;
    container.appendChild(row);
  }
  container.querySelectorAll(".spr-del").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      delete sysPromptEditData[mode][key];
      renderSysPromptEditor();
    });
  });
}

// --- STOP ---
function enableStopButtons(v){ $("btnStopVideo").disabled = !v; $("btnStopAll").disabled = !v; }

async function stopCurrentVideo(){
  if(!currentPromptId) return;
  const pid = currentPromptId;
  currentPromptId = null;
  try {
    // Interrumpir la ejecución activa en el backend ComfyUI
    await fetch(server()+"/interrupt", { method:"POST" });
    // Opcional: borrar el prompt de la cola si estuviese pendiente
    await fetch(server()+"/queue", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({delete:[pid]})
    });
  } catch(e) { console.warn("stopCurrentVideo: fallo al interrumpir backend:", e); }
  discardTimer(pid);
  delete pendingSeeds[pid];
  handledPrompts.add(pid);
  clearPreview();
  if(CONFIG.onStopCurrent) CONFIG.onStopCurrent(pid);
  log("⏹ Generación actual detenida.", "l-err");
  currentBatchIndex++;
  processNextBatch();
}

async function stopAll(){
  try {
    // Interrumpir la ejecución activa en el backend ComfyUI
    await fetch(server()+"/interrupt", { method:"POST" });
    // Limpiar toda la cola pendiente en el backend ComfyUI
    await fetch(server()+"/queue", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({clear:true})
    });
  } catch(e) { /* si falla, igual limpiamos local */ }
  for(const pid of Object.keys(pendingSeeds)) {
    discardTimer(pid);
    handledPrompts.add(pid);
    delete pendingSeeds[pid];
  }
  clearPreview();
  if(CONFIG.onStopAll) CONFIG.onStopAll();
  setRun("bad", "Detenido por usuario");
  log("🛑 Generación detenida.", "l-err");
}

// --- ZOOM / PAN / FULLSCREEN (shared) ---
function getImageVisibleRect(img){
  const rect = img.getBoundingClientRect();
  const natW = img.naturalWidth || rect.width;
  const natH = img.naturalHeight || rect.height;
  if(!natW || !natH) return rect;
  const scale = Math.min(rect.width / natW, rect.height / natH);
  const visW = natW * scale;
  const visH = natH * scale;
  return {
    left: rect.left + (rect.width - visW) / 2,
    top: rect.top + (rect.height - visH) / 2,
    width: visW,
    height: visH,
    right: rect.left + (rect.width + visW) / 2,
    bottom: rect.top + (rect.height + visH) / 2
  };
}

function setupZoomPan(wrapId, imgId, resetBtnId, fullscreenBtnId){
  let zoomLevel = 1, zoomPanX = 0, zoomPanY = 0, zoomDragging = false, zoomStartX, zoomStartY, zoomStartPanX, zoomStartPanY;
  let panMoved = false;
  // Guardar estado de zoom/pan al entrar/salir de fullscreen
  let fsSavedZoom = null;
  const wrap = $(wrapId);
  if(!wrap) return { resetZoom: ()=>{}, isFullscreen: ()=>false };

  function getImg(){ return $(imgId); }

  function resetZoom(){
    zoomLevel = 1; zoomPanX = 0; zoomPanY = 0;
    const img = getImg();
    if(img){
      img.style.transform = "none";
      void img.offsetWidth;
    }
    wrap.style.cursor = "grab";
    bindImgTouch();
  }

  function applyZoom(){
    const img = getImg();
    if(img) img.style.transform = `translate(${zoomPanX}px,${zoomPanY}px) scale(${zoomLevel})`;
  }

  wrap.addEventListener("wheel", (e) => {
    const img = getImg();
    if(!img || img.style.display === "none") return;
    e.preventDefault();
    const visRect = getImageVisibleRect(img);
    if(e.clientX < visRect.left || e.clientX > visRect.right || e.clientY < visRect.top || e.clientY > visRect.bottom) return;
    const mx = e.clientX - visRect.left;
    const my = e.clientY - visRect.top;
    const cx = visRect.width / 2;
    const cy = visRect.height / 2;
    const old = zoomLevel;
    zoomLevel *= (e.deltaY < 0) ? 1.12 : 0.88;
    zoomLevel = Math.max(1, Math.min(20, zoomLevel));
    const ratio = zoomLevel / old;
    zoomPanX += (mx - cx) * (1 - ratio);
    zoomPanY += (my - cy) * (1 - ratio);
    applyZoom();
  });

  wrap.addEventListener("mousedown", (e) => {
    const img = getImg();
    if(!img || img.style.display === "none" || zoomLevel <= 1) return;
    e.preventDefault();
    zoomDragging = true;
    panMoved = false;
    zoomStartX = e.clientX; zoomStartY = e.clientY;
    zoomStartPanX = zoomPanX; zoomStartPanY = zoomPanY;
    wrap.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if(!zoomDragging) return;
    e.preventDefault();
    const dx = e.clientX - zoomStartX;
    const dy = e.clientY - zoomStartY;
    if(Math.abs(dx) > 3 || Math.abs(dy) > 3) panMoved = true;
    zoomPanX = zoomStartPanX + dx;
    zoomPanY = zoomStartPanY + dy;
    applyZoom();
  });

  window.addEventListener("mouseup", () => {
    if(!zoomDragging) return;
    zoomDragging = false;
    wrap.style.cursor = "grab";
  });

  // --- Soporte táctil: pinch-zoom + pan + swipe (móvil) ---
  let touchPinching = false, touchStartDist = 0, touchStartZoom = 1;
  let touchStartCenterX = 0, touchStartCenterY = 0, touchStartPanX = 0, touchStartPanY = 0;
  let touchPanning = false, touchStartT1X = 0, touchStartT1Y = 0;
  let swipeFn = null;
  let swipeStartX = 0, swipeStartY = 0, swipeStartT = 0, swipeTracking = false;

  function touchDist(t1, t2){
    const dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  }

  function onTouchStart(e){
    const img = getImg();
    if(!img || img.style.display === "none") return;
    if(e.touches.length === 2){
      e.preventDefault();
      touchPinching = true; touchPanning = false; zoomDragging = false; panMoved = true; swipeTracking = false;
      touchStartDist = touchDist(e.touches[0], e.touches[1]);
      touchStartZoom = zoomLevel;
      const rect = wrap.getBoundingClientRect();
      touchStartCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      touchStartCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      touchStartPanX = zoomPanX; touchStartPanY = zoomPanY;
    } else if(e.touches.length === 1 && zoomLevel > 1){
      e.preventDefault();
      touchPanning = true; touchPinching = false; panMoved = false; zoomDragging = false; swipeTracking = false;
      touchStartT1X = e.touches[0].clientX; touchStartT1Y = e.touches[0].clientY;
      touchStartPanX = zoomPanX; touchStartPanY = zoomPanY;
    } else if(e.touches.length === 1 && zoomLevel <= 1){
      // Swipe horizontal para cambiar de imagen (solo cuando no hay zoom)
      swipeTracking = true; touchPinching = false; touchPanning = false;
      swipeStartX = e.touches[0].clientX; swipeStartY = e.touches[0].clientY;
      swipeStartT = Date.now();
    }
  }

  function onTouchMove(e){
    if(swipeTracking && e.touches.length === 1 && zoomLevel <= 1){
      // Solo prevenir el scroll si el movimiento es mayormente horizontal (swipe)
      const dx = e.touches[0].clientX - swipeStartX;
      const dy = e.touches[0].clientY - swipeStartY;
      if(Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5){
        e.preventDefault();
      }
    } else if(touchPinching && e.touches.length === 2){
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      const visRect = getImageVisibleRect(getImg());
      const ax = cx, ay = cy;
      const wrapCx = visRect.width / 2, wrapCy = visRect.height / 2;
      const mx = ax - visRect.left, my = ay - visRect.top;
      const dist = touchDist(e.touches[0], e.touches[1]);
      if(touchStartDist > 0){
        zoomLevel = Math.max(1, Math.min(20, touchStartZoom * (dist / touchStartDist)));
      }
      // pan según desplazamiento del centro respecto al inicio
      zoomPanX = touchStartPanX + (cx - touchStartCenterX);
      zoomPanY = touchStartPanY + (cy - touchStartCenterY);
      applyZoom();
    } else if(touchPanning && e.touches.length === 1){
      e.preventDefault();
      const dx = e.touches[0].clientX - touchStartT1X;
      const dy = e.touches[0].clientY - touchStartT1Y;
      if(Math.abs(dx) > 3 || Math.abs(dy) > 3) panMoved = true;
      zoomPanX = touchStartPanX + dx;
      zoomPanY = touchStartPanY + dy;
      applyZoom();
    }
  }

  function onTouchEnd(e){
    if(e.touches.length === 0){
      touchPinching = false; touchPanning = false;
      if(swipeTracking && swipeFn){
        const dx = (e.changedTouches[0] ? e.changedTouches[0].clientX : 0) - swipeStartX;
        const dy = (e.changedTouches[0] ? e.changedTouches[0].clientY : 0) - swipeStartY;
        const dt = Date.now() - swipeStartT;
        if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 800){
          swipeFn(dx < 0 ? 1 : -1);
        }
      }
      swipeTracking = false;
    } else if(e.touches.length === 1){
      // queda un dedo: pasar a pan con el dedo restante
      touchPinching = false;
      if(zoomLevel > 1){
        touchPanning = true; panMoved = false;
        touchStartT1X = e.touches[0].clientX; touchStartT1Y = e.touches[0].clientY;
        touchStartPanX = zoomPanX; touchStartPanY = zoomPanY;
      } else { touchPanning = false; }
    }
  }
  function onTouchCancel(){ touchPinching = false; touchPanning = false; swipeTracking = false; }

  function bindImgTouch(){
    const img = getImg();
    if(!img || img._zoomTouchBound) return;
    img.addEventListener("touchstart", onTouchStart, { passive: false });
    img.addEventListener("touchmove", onTouchMove, { passive: false });
    img.addEventListener("touchend", onTouchEnd);
    img.addEventListener("touchcancel", onTouchCancel);
    img._zoomTouchBound = true;
  }
  bindImgTouch();

  wrap.addEventListener("touchstart", onTouchStart, { passive: false });
  wrap.addEventListener("touchmove", onTouchMove, { passive: false });
  wrap.addEventListener("touchend", onTouchEnd);
  wrap.addEventListener("touchcancel", onTouchCancel);

  if(resetBtnId){
    const btn = $(resetBtnId);
    if(btn) btn.addEventListener("click", (e) => { e.stopPropagation(); resetZoom(); });
  }

  function enterFs(){
    const img = getImg();
    // Guardar estado de zoom/pan actual antes de resetear para fullscreen
    fsSavedZoom = { level: zoomLevel, panX: zoomPanX, panY: zoomPanY, wrapCss: wrap.style.cssText || "", imgCss: img ? (img.style.cssText || "") : "" };
    wrap.dataset.fsPrev = wrap.style.cssText || "";
    wrap.style.cssText = "position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;max-height:none!important;margin:0!important;padding:0!important;background:#000;border-radius:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;";
    if(img){
      img.dataset.fsPrev = img.style.cssText || "";
      img.style.cssText = "display:block!important;width:100vw!important;height:100vh!important;max-width:100vw!important;max-height:100vh!important;object-fit:contain!important;transform:none!important;transform-origin:center center!important;";
    }
    // Resetear zoom/pan para fullscreen (empezar fresco)
    zoomLevel = 1; zoomPanX = 0; zoomPanY = 0;
  }
  function exitFs(){
    const img = getImg();
    if(wrap.dataset.fsPrev !== undefined){ wrap.style.cssText = wrap.dataset.fsPrev; delete wrap.dataset.fsPrev; }
    else { wrap.style.cssText = ""; }
    if(img){
      if(img.dataset.fsPrev !== undefined){ img.style.cssText = img.dataset.fsPrev; delete img.dataset.fsPrev; }
      else { img.style.cssText = ""; }
    }
    // Restaurar estado de zoom/pan anterior al fullscreen
    if(fsSavedZoom){
      zoomLevel = fsSavedZoom.level;
      zoomPanX = fsSavedZoom.panX;
      zoomPanY = fsSavedZoom.panY;
      fsSavedZoom = null;
    }
    applyZoom();
    // Asegurar que el wrap sigue visible (display flex o block según el caso)
    if(wrap.style.display === "" || wrap.style.display === "none") wrap.style.display = "flex";
  }

  function isFullscreen(){ return !!(document.fullscreenElement || document.webkitFullscreenElement); }

  if(fullscreenBtnId){
    const btn = $(fullscreenBtnId);
    if(btn){
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if(!document.fullscreenElement && !document.webkitFullscreenElement){
          if(wrap.requestFullscreen) wrap.requestFullscreen();
          else if(wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
        } else {
          if(document.exitFullscreen) document.exitFullscreen();
          else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
      });
    }
  }

  wrap.addEventListener("fullscreenchange", () => {
    if(document.fullscreenElement || document.webkitFullscreenElement) enterFs();
    else exitFs();
  });
  wrap.addEventListener("webkitfullscreenchange", () => {
    if(document.fullscreenElement || document.webkitFullscreenElement) enterFs();
    else exitFs();
  });

  function getState(){ return { zoomLevel, zoomPanX, zoomPanY }; }

  // Retornar también si el último mousedown+mouseup fue un pan (para que el caller pueda ignorar el click)
  function wasPan(){ return panMoved; }

  function onSwipe(fn){ swipeFn = fn; }

  return { resetZoom, getState, isFullscreen, wasPan, onSwipe };
}

// --- SHARED GALLERY HELPERS ---
// Usados por addToVariantGallery() en ltxv.js y krea2.js.

function gcd(a, b){ return b ? gcd(b, a % b) : a; }

// Redimensiona un File/Blob a un lado máximo (manteniendo proporción) y devuelve
// base64 JPEG (sin el prefijo data:). Útil para enviar imágenes a Ollama sin
// superar el tope de body del servidor (~4 MB por defecto).
async function resizeFileToBase64(file, maxSide){
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return c.toDataURL("image/jpeg", 0.85).split(",")[1];
}

// Variante que acepta una URL (usada por Krea2 desde refImg.src).
async function imageToResizedBase64(srcUrl, maxSide){
  const resp = await fetch(srcUrl);
  const blob = await resp.blob();
  return resizeFileToBase64(blob, maxSide);
}

function mediaViewUrl(media, extra){
  if(!media) return "";
  const anchor = extra && extra.anchor ? extra.anchor : "";
  const f = encodeURIComponent(media.filename || "");
  const s = encodeURIComponent(media.subfolder || "");
  const t = encodeURIComponent(media.type || "output");
  return `/view?filename=${f}&subfolder=${s}&type=${t}${anchor}`;
}

async function copySeedToClipboard(seedSpan, seedValue){
  try {
    await navigator.clipboard.writeText(String(seedValue));
    const originalHTML = seedSpan.innerHTML;
    seedSpan.innerHTML = '<span class="seed-text">¡Copiado!</span> <span class="copy-icon">✅</span>';
    setTimeout(() => { seedSpan.innerHTML = originalHTML; }, 1200);
  } catch(err){
    console.error("Error al copiar:", err);
  }
}

// Borrado de un fichero de output/temp via /api/file_delete.
// Trata 404 como éxito (ya no estaba en disco) y elimina la tarjeta del DOM.
// Callbacks opcionales: onOk(grid, box), onMissing(grid, box).
async function deleteMediaFile(card, delBtn, media, grid, box, logPrefix, onOk, onMissing){
  if(!confirm(`¿Eliminar este fichero del disco y de la galería?`)) return;
  delBtn.disabled = true;
  try {
    const r = await fetch("/api/file_delete", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        filename: media.filename,
        subfolder: media.subfolder || "",
        type: media.type || "output",
      }),
    });
    if(!r.ok){
      const t = await r.text().catch(()=>"");
      throw new Error("HTTP "+r.status+" "+(t||"").slice(0,200));
    }
    const j = await r.json();
    if(!j.ok && !j.deleted) throw new Error("Respuesta inesperada del backend");
    card.remove();
    log("🗑️ "+logPrefix+" eliminado del disco: "+media.filename, "l-ok");
    if(onOk) onOk(grid, box);
  } catch(err){
    if(err.message.includes("404")){
      card.remove();
      log("🗑️ "+logPrefix+" ya no estaba en disco, eliminado de la galería: "+media.filename, "l-ok");
      if(onMissing) onMissing(grid, box);
    } else {
      log("❌ No se pudo borrar del disco: "+err.message, "l-err");
      delBtn.disabled = false;
    }
  }
}

// Construye una tarjeta de variante común y la inserta en el grid.
// CONFIG.renderVariantMedia(card, url, media) debe devolver el HTML del
// elemento media (<video> o <img>) y opcionalmente configurar
// atributos (crossorigin, controls, preload, etc.).
// `meta` (opcional): objeto con metadata de la generación (loas, sliders, etc.)
//   o string preformateado. Se muestra en el tooltip al hacer hover. Si es
//   objeto, se formatea como filas clave/valor. Se guarda en card.dataset.meta
//   como JSON para sobrevivir a re-renders.
// Devuelve la tarjeta creada (ya insertada en el grid).
function buildVariantCard(grid, box, media, seedValue, timeText, variantIndex, slot, typeShort, meta){
  const hasSeed = seedValue !== null && seedValue !== undefined;
  const idx = variantIndex != null ? variantIndex : (currentBatchIndex + 1);
  const displayText = hasSeed ? String(seedValue) : (slot ? (slot === 1 ? "1er pase" : (slot === 2 ? "final" : `Var. #${idx}`)) : `Var. #${idx}`);
  const tooltipText = hasSeed ? "Click para copiar semilla" : "Semilla no disponible";
  const timeStr = timeText || "";

  const card = document.createElement("div");
  card.className = "variant-card";
  card.dataset.filename = media.filename || "";
  card.dataset.subfolder = media.subfolder || "";
  card.dataset.type = media.type || "output";
  if(slot != null) card.dataset.slot = String(slot);
  card.dataset.variantIndex = String(idx);
  if(meta != null){
    card.dataset.meta = (typeof meta === "string") ? meta : JSON.stringify(meta);
  }

  const url = mediaViewUrl(media, { anchor: "#t=0.1" });
  const mediaHtml = CONFIG.renderVariantMedia
    ? CONFIG.renderVariantMedia(card, url, media)
    : `<img src="${url}">`;

  card.innerHTML = `
    <span class="variant-badge">Var ${idx} · ${typeShort}</span>
    ${mediaHtml}
    <div class="variant-info">
      <span class="variant-seed-display" title="${tooltipText}">
        <span class="seed-text">${displayText}</span>
        <span class="copy-icon">📋</span>
      </span>
      <span class="variant-time" title="Tiempo de inferencia">⏱ ${timeStr}</span>
      <span class="variant-icons">
        <button class="variant-del-btn" title="Eliminar de la galería" onclick="event.stopPropagation();">×</button>
      </span>
    </div>
  `;

  // Tooltip de metadata al hacer hover.
  if(meta != null){
    card.addEventListener("mouseenter", () => showVariantTooltip(card));
    card.addEventListener("mouseleave", () => hideVariantTooltip());
    card.addEventListener("mousemove", (e) => positionVariantTooltip(e));
  }

  // Hacer la tarjeta arrastrable hacia fuera (otra UI, escritorio, etc.).
  makeCardDraggable(card);

  grid.appendChild(card);
  return card;
}

// --- TOOLTIP DE METADATA ---
// Un único tooltip global reutilizado para todas las variant-cards.
let _variantTooltipEl = null;

function _ensureVariantTooltip(){
  if(_variantTooltipEl) return _variantTooltipEl;
  _variantTooltipEl = document.createElement("div");
  _variantTooltipEl.className = "variant-tooltip";
  _variantTooltipEl.id = "variantTooltip";
  document.body.appendChild(_variantTooltipEl);
  return _variantTooltipEl;
}

function positionVariantTooltip(e){
  if(!_variantTooltipEl || !_variantTooltipEl.classList.contains("show")) return;
  const pad = 14;
  const tw = _variantTooltipEl.offsetWidth || 280;
  const th = _variantTooltipEl.offsetHeight || 80;
  let x = e.clientX + 16;
  let y = e.clientY + 16;
  if(x + tw + pad > window.innerWidth) x = e.clientX - tw - 16;
  if(y + th + pad > window.innerHeight) y = e.clientY - th - 16;
  _variantTooltipEl.style.left = Math.max(pad, x) + "px";
  _variantTooltipEl.style.top = Math.max(pad, y) + "px";
}

function showVariantTooltip(card){
  const el = _ensureVariantTooltip();
  const raw = card.dataset.meta;
  if(!raw) return;
  let html;
  try {
    const obj = JSON.parse(raw);
    html = formatVariantMeta(obj);
  } catch(_){
    html = `<div class="vt-empty">${escapeHtml(raw)}</div>`; // string preformateado, escapado por seguridad
  }
  el.innerHTML = html;
  el.classList.add("show");
  // Posición inicial cerca de la tarjeta.
  const r = card.getBoundingClientRect();
  el.style.left = Math.max(14, r.left) + "px";
  el.style.top = Math.max(14, r.bottom + 8) + "px";
}

function hideVariantTooltip(){
  if(_variantTooltipEl) _variantTooltipEl.classList.remove("show");
}

// Formatea un objeto meta {title?, rows:[[k,v]...], loras:[{name,strength,on}...]}
// como HTML para el tooltip.
function formatVariantMeta(obj){
  if(!obj || typeof obj !== "object") return String(obj || "");
  const parts = [];
  if(obj.title) parts.push(`<div class="vt-title">${escapeHtml(obj.title)}</div>`);
  if(Array.isArray(obj.rows)){
    for(const [k, v] of obj.rows){
      parts.push(`<div class="vt-row"><span class="vt-key">${escapeHtml(String(k))}</span><span class="vt-val">${escapeHtml(String(v))}</span></div>`);
    }
  }
  if(Array.isArray(obj.loras) && obj.loras.length){
    parts.push(`<div class="vt-row" style="margin-top:6px;"><span class="vt-key">LoRAs</span><span class="vt-val">`);
    for(const l of obj.loras){
      const cls = l.on ? "vt-lora" : "vt-lora off";
      const name = escapeHtml(l.name || "—");
      const strength = l.strength != null ? ` · ${l.strength}` : "";
      const status = l.on ? "" : " (off)";
      parts.push(`<div class="${cls}"><span class="vt-lora-name" title="${name}">${name}</span>${escapeHtml(strength)}${escapeHtml(status)}</div>`);
    }
    parts.push(`</span></div>`);
  }
  if(parts.length === 0) return `<div class="vt-empty">sin metadata</div>`;
  return parts.join("");
}

// Asigna `value` a un <select> solo si existe esa opción. `sel.value = x` con un
// valor inexistente deja el selector VACÍO sin avisar (y el grafo sale con
// nombres de modelo ''). Devuelve true si se aplicó.
function setSelectIfPresent(id, value){
  const sel = $(id);
  if(!sel || value == null || value === "") return false;
  const v = String(value);
  if(![...sel.options].some(o => o.value === v)) return false;
  sel.value = v;
  return true;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

// --- EVOLVE / TRANSMUTAR PROMPT ---
// Compartido por todas las UIs (antes copiado idéntico en cada <ui>.js).
const EVOLVE_VOCAB = [
  "cinematic","dramatic","atmospheric","moody","ethereal","surreal","hyperrealistic","photorealistic","volumetric",
  "noir","neon","golden","misty","stormy","serene","tense","epic","intimate","melancholic","euphoric",
  "ominous","dreamlike","futuristic","rustic","decayed","luxurious","desolate","lush","intricate","minimalist",
  "dynamic","static","fluid","fragmented","seamless","chaotic","ordered","warm","cold","vibrant","muted",
  "wide shot","close up","extreme close up","medium shot","overhead","low angle","dutch angle","tracking","handheld","static tripod",
  "golden hour","blue hour","midday","night","dusk","dawn","backlit","rim light","soft light","hard light",
  "film grain","lens flare","bokeh","motion blur","sharp focus","shallow depth of field","deep focus",
  "anamorphic","35mm","16mm","IMAX","digital","vintage","celluloid",
  "orchestral","electronic","ambient","silence","distant","nearby","echoing","muffled","crisp",
  "slow motion","time lapse","real time","long take","quick cut","montage"
];

const EVOLVE_SYNONYMS = {
  "big": ["massive","enormous","colossal","immense","towering"],
  "small": ["tiny","minuscule","petite","compact","diminutive"],
  "fast": ["rapid","swift","quick","accelerated","hurried"],
  "slow": ["leisurely","gradual","deliberate","unhurried","languid"],
  "happy": ["joyful","elated","euphoric","content","radiant"],
  "sad": ["melancholic","somber","mournful","forlorn","sorrowful"],
  "angry": ["furious","irate","livid","incensed","wrathful"],
  "scared": ["terrified","petrified","horrified","alarmed","panicked"],
  "beautiful": ["gorgeous","stunning","breathtaking","exquisite","radiant"],
  "ugly": ["grotesque","unsightly","repulsive","hideous","monstrous"],
  "dark": ["dim","shadowy","murky","tenebrous","obscure"],
  "light": ["luminous","radiant","brilliant","gleaming","ethereal"],
  "old": ["ancient","weathered","aged","antique","timeworn"],
  "new": ["pristine","modern","novel","recent","fresh"],
  "loud": ["deafening","thunderous","cacophonous","boisterous","clamorous"],
  "quiet": ["silent","hushed","muffled","subdued","tranquil"],
  "hot": ["scorching","blazing","searing","sweltering","torrid"],
  "cold": ["frigid","freezing","icy","glacial","wintry"],
  "good": ["excellent","superb","magnificent","stellar","remarkable"],
  "bad": ["dreadful","abysmal","atrocious","deplorable","lamentable"],
  "run": ["sprint","dash","race","bolt","charge"],
  "walk": ["stride","stroll","saunter","march","amble"],
  "look": ["gaze","stare","glance","peer","behold"],
  "say": ["whisper","shout","declare","mutter","proclaim"],
  "make": ["craft","forge","construct","assemble","create"],
  "break": ["shatter","fracture","splinter","rupture","demolish"],
  "give": ["bestow","grant","present","hand","deliver"],
  "take": ["seize","grab","snatch","claim","capture"],
  "find": ["discover","locate","uncover","detect","unearth"],
  "lose": ["misplace","forfeit","surrender","relinquish","abandon"],
  "begin": ["commence","initiate","launch","embark","inaugurate"],
  "end": ["conclude","terminate","cease","finalize","culminate"],
  "come": ["arrive","approach","enter","emerge","appear"],
  "go": ["depart","leave","exit","vanish","disappear"],
  "know": ["understand","comprehend","grasp","recognize","perceive"],
  "think": ["ponder","contemplate","reflect","deliberate","meditate"],
  "want": ["desire","crave","yearn","covet","long for"],
  "need": ["require","demand","necessitate","warrant","call for"],
  "feel": ["sense","perceive","experience","detect","intuit"],
  "see": ["observe","witness","behold","discern","sight"],
  "hear": ["perceive","detect","listen","catch","make out"],
  "love": ["adore","cherish","treasure","revere","idolize"],
  "hate": ["despise","loathe","abhor","detest","execrate"]
};

function evolveWords(prompt, strength){
  const words = prompt.split(/\b/);
  return words.map(w => {
    if(!/^[a-zA-Z]+$/.test(w) || Math.random() * 100 >= strength) return w;
    return EVOLVE_VOCAB[Math.floor(Math.random() * EVOLVE_VOCAB.length)];
  }).join("");
}

function evolveInternal(prompt, strength){
  const rawWords = prompt.match(/[a-zA-Z]+/g) || [];
  if(rawWords.length < 2) return prompt;
  const words = prompt.split(/\b/);
  return words.map(w => {
    if(!/^[a-zA-Z]+$/.test(w) || Math.random() * 100 >= strength) return w;
    return rawWords[Math.floor(Math.random() * rawWords.length)];
  }).join("");
}

function evolveSynonyms(prompt, strength){
  const words = prompt.split(/\b/);
  return words.map(w => {
    const lower = w.toLowerCase();
    const syns = EVOLVE_SYNONYMS[lower];
    if(!syns || Math.random() * 100 >= strength) return w;
    const repl = syns[Math.floor(Math.random() * syns.length)];
    return w[0] === w[0].toUpperCase() ? repl.charAt(0).toUpperCase() + repl.slice(1) : repl;
  }).join("");
}

function generateEvolved(prompt, mode, strength, count){
  const variants = [];
  for(let i = 0; i < count; i++){
    let v;
    if(mode === "words") v = evolveWords(prompt, strength);
    else if(mode === "internal") v = evolveInternal(prompt, strength);
    else v = evolveSynonyms(prompt, strength);
    variants.push(v.trim().replace(/\s+/g, " "));
  }
  return variants;
}

// --- INIT: all top-level code that uses $ or CONFIG ---
// Called by the UI-specific JS after CONFIG is defined.
// --- PULIDO ITERATIVO DEL PROMPT ---
// Reescribe el último resultado del enhancer (o el prompt actual si no hay) aplicando solo
// los cambios pedidos. El resultado vuelve a #enhancerOutput, así se puede encadenar.
// Cada UI puede definir CONFIG.parseEnhancerOutput(raw) para extraer el texto (p.ej. JSON).
const ENHANCER_REFINE_SYSTEM = `You are an expert editor of prompts for image and video generation models.
You receive an existing prompt and a list of requested changes (the changes may be written in another language).
Rewrite the prompt applying ONLY the requested changes. Keep everything else exactly as it is: subject, composition, action, camera, style, lighting, wording and level of detail. Add, remove or replace details only where the changes require it, and keep the result coherent (no contradictions with the changes).
Write the result in the same language as the existing prompt.
Output ONLY the final prompt as plain text: no explanations, no headings, no quotes, no JSON.`;

function enhancerOutputText(raw){
  if(typeof CONFIG.parseEnhancerOutput === "function") return CONFIG.parseEnhancerOutput(raw);
  return raw.replace(/\n*--- (?:Ollama|llama\.cpp) · [^\n]+ ---/g, "").trim();
}

async function refineEnhancedPrompt(){
  const model = $("enhancerModel").value;
  if(!model){ log("⚠️ Selecciona un modelo de LLM (Ollama / llama.cpp)", "l-err"); return; }
  const changes = $("enhancerRefineInput").value.trim();
  if(!changes){ log("⚠️ Escribe los cambios que quieres aplicar al prompt", "l-err"); return; }
  const out = $("enhancerOutput").value.trim();
  const base = (out && !out.startsWith("Error:")) ? enhancerOutputText(out) : $("prompt").value.trim();
  if(!base){ log("⚠️ No hay prompt que pulir: escribe uno o pulsa 'Mejorar prompt' primero", "l-err"); return; }

  const payload = {
    model,
    system: ENHANCER_REFINE_SYSTEM,
    prompt: `EXISTING PROMPT:\n${base}\n\nREQUESTED CHANGES:\n${changes}`,
    options: { num_ctx: 4096, temperature: 0.4 }
  };
  const btn = $("btnRefinePrompt");
  btn.disabled = true;
  btn.textContent = "Aplicando cambios...";
  $("enhancerOutput").value = "";
  if($("enhancerMetaInfo")) $("enhancerMetaInfo").textContent = "";
  try {
    const { text, elapsedMs } = await streamOllamaGenerate(payload, $("enhancerOutput"));
    const timeStr = fmtMs(elapsedMs);
    if(!text){
      $("enhancerOutput").value = base; // no perder el prompt anterior
      log("Respuesta vacía del LLM: se mantiene el prompt anterior. Prueba a liberar VRAM y reintenta.", "l-err");
      return;
    }
    $("enhancerOutput").value = text;
    if($("enhancerMetaInfo")) $("enhancerMetaInfo").textContent = `${model} · pulido · ${timeStr}`;
    log(`✏️ Cambios aplicados en ${timeStr}. Sigue puliendo o pulsa 'Usar como prompt'.`, "l-ok");
    $("enhancerRefineInput").select(); // escribir encima para el siguiente cambio
  } catch(e){
    $("enhancerOutput").value = base;
    log("Error al aplicar cambios: " + e.message, "l-err");
  } finally {
    btn.disabled = false;
    btn.textContent = "Aplicar cambios";
  }
}

function initCommon(){
  loras = CONFIG.loras;
  DEFAULT_BACKEND_PORT = CONFIG.DEFAULT_BACKEND_PORT;

  // Auto-pick server URL
  (function autoPickServerUrl(){
    try {
      const input = $("serverUrl");
      if(!input) return;
      const stored = localStorage.getItem(CONFIG.SERVERURL_KEY);
      if(stored){
        const storedPort = (stored.match(/:(\d+)\b/) || [])[1];
        const host = (window.location.hostname || "").trim();
        const isLan = host && !/^(127\.|localhost$|::1$)/i.test(host);

        if(storedPort && LEGACY_PORTS.includes(storedPort)){
          localStorage.removeItem(CONFIG.SERVERURL_KEY);
        } else if(isLan && /^(http:\/\/)?(127\.|localhost|::1)/i.test(stored)){
          // En LAN, 127.0.0.1 es el cliente, no el servidor. Limpiamos para usar el proxy automático.
          localStorage.removeItem(CONFIG.SERVERURL_KEY);
          input.value = "";
        } else {
          input.value = stored;
          updateServerHint();
          return;
        }
      }
      updateServerHint();
    } catch(e) { /* si falla, queda el placeholder */ }
  })();

  $("serverUrl").addEventListener("change", (e) => {
    try { localStorage.setItem(CONFIG.SERVERURL_KEY, e.target.value.trim()); } catch(_){}
    updateServerHint();
  });
  $("serverUrl").addEventListener("input", updateServerHint);

  // Preview method persistence
  (function initPreviewMethod(){
    const sel = $("previewMethod");
    if(!sel) return;
    const key = CONFIG.PREVIEW_METHOD_KEY || "ltx_preview_method";
    try {
      const stored = localStorage.getItem(key);
      if(stored && ["taesd", "latent2rgb", "auto", "none"].includes(stored)){
        sel.value = stored;
      }
    } catch(_){}
    sel.addEventListener("change", (e) => {
      try { localStorage.setItem(key, e.target.value); } catch(_){}
    });
  })();

  // Prompt library buttons
  $("btnSavePrompt").addEventListener("click", savePrompt);
  $("btnMovePrompt").addEventListener("click", movePrompt);
  $("btnDeletePrompt").addEventListener("click", deletePrompt);
  loadPrompts();

  // LoRA state
  loadLoraState(); renderLoras(); loadModels();

  // Enhancer shared listeners
  $("enhancerToggle").addEventListener("click", () => {
    const h = $("enhancerToggle");
    const b = $("enhancerBody");
    h.classList.toggle("open");
    b.classList.toggle("open");
    const arrow = h.querySelector(".arrow");
    arrow.textContent = h.classList.contains("open") ? "▼" : "▶";
  });

  $("enhancerMode").addEventListener("change", () => {
    const data = loadSysPrompts();
    populateStyleSelect(data, $("enhancerMode").value);
  });

  $("btnRefinePrompt").addEventListener("click", refineEnhancedPrompt);
  $("enhancerRefineInput").addEventListener("keydown", (e) => {
    if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){ e.preventDefault(); refineEnhancedPrompt(); }
  });

  $("btnUseAsPrompt").addEventListener("click", () => {
    let text = $("enhancerOutput").value.trim();
    text = text.replace(/\n*--- (?:Ollama|llama\.cpp) · [^\n]+ ---/g, "").trim();
    if(!text){ log("⚠️ No hay resultado para usar como prompt", "l-err"); return; }
    $("prompt").value = text;
    log("✏️ Prompt actualizado desde el resultado del enhancer.", "l-ok");
  });

  $("btnSaveEnhanced").addEventListener("click", async () => {
    let text = $("enhancerOutput").value.trim();
    text = text.replace(/\n*--- (?:Ollama|llama\.cpp) · [^\n]+ ---/g, "").trim();
    if(!text){ log("⚠️ No hay resultado que guardar", "l-err"); return; }
    const defaultName = lastPromptDir ? lastPromptDir + "/" : "";
    const name = prompt("Nombre/ruta para este prompt mejorado (usa / para agrupar):", defaultName);
    if(!name) return;
    // Antes solo se escribía en localStorage y el loadPrompts() posterior lo
    // machacaba con la copia del servidor: el prompt se perdía al instante.
    const ok = await _mutatePrompts(saved => {
      if(saved[name]){
        if(!confirm(`Ya existe "${name}". ¿Sobrescribir?`)) return false;
      }
      saved[name] = text;
    });
    if(!ok) return;
    selectedPromptKey = name;
    const parts = name.split('/');
    if(parts.length > 1) lastPromptDir = parts.slice(0, -1).join('/');
    loadPrompts(true);
    log(`Prompt "${name}" guardado desde enhancer.`, "l-ok");
  });

  // Sysprompt modal
  const sysPromptModal = document.createElement("div");
  sysPromptModal.className = "modal-overlay";
  sysPromptModal.id = "sysPromptModal";
  sysPromptModal.innerHTML = '<div class="modal-content">' +
    '<h2>Editar System Prompts</h2>' +
    '<div class="modal-tabs" id="sysPromptTabs">' +
      '<div class="modal-tab active" data-tab="text">Texto</div>' +
      '<div class="modal-tab" data-tab="vision">Visión</div>' +
    '</div>' +
    '<div id="sysPromptEditor"></div>' +
    '<div class="modal-actions">' +
      '<button id="btnAddSysPrompt" class="ghost">+ Añadir estilo</button>' +
      '<button id="btnSaveSysPrompts" class="primary">Guardar</button>' +
      '<button id="btnCancelSysPrompts" class="ghost">Cancelar</button>' +
    '</div>' +
  '</div>';
  document.body.appendChild(sysPromptModal);

  $("btnAddSysPrompt").addEventListener("click", () => {
    const mode = sysPromptEditMode;
    if(!sysPromptEditData[mode]) sysPromptEditData[mode] = {};
    const keys = Object.keys(sysPromptEditData[mode]);
    let nextKey = "C";
    for(let i = 67; i < 91; i++){
      const k = String.fromCharCode(i);
      if(!keys.includes(k)){ nextKey = k; break; }
    }
    sysPromptEditData[mode][nextKey] = { name: "Nuevo estilo", prompt: "" };
    renderSysPromptEditor();
  });
  $("btnSaveSysPrompts").addEventListener("click", () => {
    const container = $("sysPromptEditor");
    container.querySelectorAll(".sysprompt-row").forEach(row => {
      const key = row.querySelector("textarea").dataset.key;
      const name = row.querySelector(".spr-name-input").value;
      const prompt = row.querySelector("textarea").value;
      if(sysPromptEditData[sysPromptEditMode] && sysPromptEditData[sysPromptEditMode][key]){
        sysPromptEditData[sysPromptEditMode][key].name = name;
        sysPromptEditData[sysPromptEditMode][key].prompt = prompt;
      }
    });
    saveSysPrompts(sysPromptEditData);
    populateStyleSelect(sysPromptEditData, $("enhancerMode").value);
    $("sysPromptModal").classList.remove("open");
    log("✅ System prompts guardados.", "l-ok");
  });
  $("btnCancelSysPrompts").addEventListener("click", () => {
    $("sysPromptModal").classList.remove("open");
  });
  document.querySelectorAll(".modal-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".modal-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      sysPromptEditMode = tab.dataset.tab;
      renderSysPromptEditor();
    });
  });

  $("btnEditSysPrompts").addEventListener("click", () => {
    sysPromptEditData = loadSysPrompts();
    sysPromptEditMode = "text";
    renderSysPromptEditor();
    const tabs = document.querySelectorAll(".modal-tab");
    tabs.forEach(t => t.classList.remove("active"));
    const textTab = document.querySelector('.modal-tab[data-tab="text"]');
    if(textTab) textTab.classList.add("active");
    $("sysPromptModal").classList.add("open");
  });

  // Collapsibles
  makeCollapsible("promptLibToggle", "promptLibBody");
  makeCollapsible("loraToggle", "loraBody");

  // Export prompts
  $("btnExportPrompts").addEventListener("click", () => {
    const saved = _readPromptStore();
    const json = JSON.stringify(saved, null, 2);
    const blob = new Blob([json], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = CONFIG.UI_TYPE + "_prompts.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    log(`📥 ${Object.keys(saved).length} prompts exportados.`, "l-ok");
  });

  // Import prompts
  $("btnImportPrompts").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if(!imported || typeof imported !== 'object' || Array.isArray(imported)){
            throw new Error("formato inválido (se esperaba un objeto)");
          }
          let added = 0, overwritten = 0;
          // Igual que btnSaveEnhanced: hay que subirlo al servidor, si no el
          // loadPrompts() siguiente descartaba lo importado.
          await _mutatePrompts(saved => {
            for(const [key, val] of Object.entries(imported)){
              if(typeof val !== 'string') continue;
              if(saved[key]) overwritten++; else added++;
              saved[key] = val;
            }
          });
          loadPrompts(true);
          log(`📤 ${added} prompts importados (${overwritten} sobrescritos).`, "l-ok");
        } catch(err){
          log("❌ Error importando: " + err.message, "l-err");
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });

  // Init enhancer
  (async () => {
    await loadEnhancerModels();
    const data = loadSysPrompts();
    populateStyleSelect(data, $("enhancerMode").value);
  })();

  // Stop buttons
  $("btnStopVideo").addEventListener("click", stopCurrentVideo);
  $("btnStopAll").addEventListener("click", stopAll);

  // Test connection
  $("btnTest").addEventListener("click", async ()=>{
      setConn("busy","comprobando...");
      try{
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 8000);
          const target = (server() ? server() : "") + "/system_stats";
          const r = await fetchWithRetry(target, { signal: ctrl.signal }, 3, 400);
          clearTimeout(timer);
          if(!r.ok) throw new Error("HTTP "+r.status);
          const data = await r.json();
          setConn("ok","conectado");
          connectSocket();
          const vram = data?.devices?.[0]?.vram_free ? ` (VRAM libre: ${(data.devices[0].vram_free / 1024 / 1024 / 1024).toFixed(1)} GB)` : "";
          log("Conexión OK con ComfyUI" + vram, "l-ok");
      }catch(err){
          setConn("bad","sin conexión");
          const msg = (err.name === "AbortError") ? "Timeout (sin respuesta en 8s)" : err.message;
          log("Error de conexión: " + msg, "l-err");
          if(server()){
            log("Sugerencia: si estás en LAN, deja el campo de servidor vacío para usar el proxy automático.", "l-info");
          }
      }
  });

  // --- GESTIÓN DE MEMORIA Y OFFLOAD ---
  const btnOffload = $("btnOffloadVram");
  if(btnOffload && !btnOffload.dataset.bound){
    btnOffload.dataset.bound = "1";
    btnOffload.addEventListener("click", async () => {
      const prevText = btnOffload.textContent;
      btnOffload.disabled = true;
      btnOffload.textContent = "Descargando...";
      try {
        const r = await postComfyBackend("/free", { unload_models: true, free_memory: false });
        if(!r || !r.ok) throw new Error(r ? "HTTP " + r.status : "Sin respuesta");
        log("⚡ VRAM liberada: modelos descargados a RAM (conservados en memoria para generar sin leer del disco).", "l-ok");
      } catch(e){
        log("⚠️ Error descargando VRAM: " + e.message, "l-err");
      } finally {
        btnOffload.disabled = false;
        btnOffload.textContent = prevText;
      }
    });
  }

  const btnFree = $("btnFreeMemory");
  if(btnFree && !btnFree.dataset.bound){
    btnFree.dataset.bound = "1";
    btnFree.addEventListener("click", async () => {
      const prevText = btnFree.textContent;
      btnFree.disabled = true;
      btnFree.textContent = "Purgando...";
      try {
        const r = await postComfyBackend("/free", { unload_models: true, free_memory: true });
        if(!r || !r.ok) throw new Error(r ? "HTTP " + r.status : "Sin respuesta");
        log("🧹 Memoria VRAM y modelos purgados por completo en ComfyUI.", "l-ok");
      } catch(e){
        log("⚠️ Error liberando memoria: " + e.message, "l-err");
      } finally {
        btnFree.disabled = false;
        btnFree.textContent = prevText;
      }
    });
  }
}

// --- DRAG HACIA FUERA (drag-out) ---
// Permite arrastrar medios mostrados (vídeos/imágenes) hacia otras ventanas
// (LTXV ↔ Krea2) o hacia el sistema operativo (escritorio, otras apps).
//
// - En dragstart: establece text/uri-list (URL del backend), DownloadURL
//   (para arrastrar al filesystem como descarga) y application/x-ltxv-media
//   (JSON con {filename, subfolder, type} para drag entre las dos UIs).
// - En drop: si no hay archivos del OS pero hay text/uri-list o el MIME
//   custom, hace fetch de la URL y llama al handler de archivo del destino.

const LTXV_MEDIA_MIME = "application/x-ltxv-media";

// --- HISTORIAL DE IMÁGENES EN INDEXEDDB (Krea2, KreaQwen) ---
// Esquema v2: las miniaturas viven en "thumbs" (índice por ts) y la imagen
// completa en "images" (hash -> full). En v1 todo estaba en "images" y cada
// imagen nueva leía la base entera (getAll, varios GB con 500 imágenes 2K) en
// el hilo principal: la página se colgaba tras cada variante. La migración
// v1→v2 copia las miniaturas una sola vez dentro de la transacción de
// upgrade, que es atómica (si falla, la base queda en v1 intacta).
function createImageHistory({ dbName, gridId, filePrefix, onSelect, maxRecords = 500, thumbWidth = 260 }){
  const FULL = "images", THUMBS = "thumbs";
  const EMPTY_HINT = `<div class="hint" style="grid-column:1/-1;">sin imágenes guardadas</div>`;
  let dbPromise = null;
  let prefetched = null; // { hash, data } — imagen completa precargada para arrastrar

  function openDB(){
    if(dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if(!window.indexedDB){ reject(new Error("IndexedDB no disponible en este navegador")); return; }
      const req = indexedDB.open(dbName, 2);
      req.onupgradeneeded = (ev) => {
        const db = req.result;
        if(!db.objectStoreNames.contains(FULL)) db.createObjectStore(FULL, { keyPath: "hash" });
        if(db.objectStoreNames.contains(THUMBS)) return;
        const thumbs = db.createObjectStore(THUMBS, { keyPath: "hash" });
        thumbs.createIndex("ts", "ts");
        if(ev.oldVersion < 1) return;
        log("🗂️ Actualizando el historial de imágenes (solo esta vez)…", "l-warn");
        req.transaction.objectStore(FULL).openCursor().onsuccess = (e) => {
          const cur = e.target.result;
          if(!cur) return;
          const r = cur.value;
          if(r && r.hash && r.thumb){
            thumbs.put({ hash: r.hash, thumb: r.thumb, width: r.width, height: r.height,
                         ts: r.ts || 0, legacy: !!r.legacy || !r.full });
          }
          cur.continue();
        };
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => { db.close(); dbPromise = null; };
        resolve(db);
      };
      req.onerror = () => { dbPromise = null; reject(req.error); };
      req.onblocked = () => log("⚠️ Historial: cierra las otras pestañas de esta UI para actualizar la base de datos.", "l-warn");
    });
    return dbPromise;
  }

  function txDone(tx){
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  function reqResult(r){
    return new Promise((resolve, reject) => {
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  async function hashOf(thumb){
    try {
      if(!crypto?.subtle?.digest) throw new Error("crypto.subtle no disponible (HTTP)");
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(thumb + "|" + thumb.length));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
    } catch(_){
      return "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
  }

  function makeThumb(dataUrl){
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = thumbWidth;
        canvas.height = Math.round(img.height * thumbWidth / img.width);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.78), width: img.width, height: img.height });
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  async function getFull(hash){
    const db = await openDB();
    const rec = await reqResult(db.transaction(FULL, "readonly").objectStore(FULL).get(hash));
    return rec?.full || null;
  }

  // Borra los registros más antiguos por encima de maxRecords sin leer las
  // imágenes: count() + cursor de claves sobre el índice ts. Devuelve los hash.
  function evict(db){
    return new Promise((resolve) => {
      const tx = db.transaction([THUMBS, FULL], "readwrite");
      const thumbs = tx.objectStore(THUMBS), full = tx.objectStore(FULL);
      const removed = [];
      thumbs.count().onsuccess = (e) => {
        let excess = e.target.result - maxRecords;
        if(excess <= 0) return;
        thumbs.index("ts").openKeyCursor().onsuccess = (ev) => {
          const cur = ev.target.result;
          if(!cur || excess <= 0) return;
          thumbs.delete(cur.primaryKey);
          full.delete(cur.primaryKey);
          removed.push(cur.primaryKey);
          excess--;
          cur.continue();
        };
      };
      tx.oncomplete = () => resolve(removed);
      tx.onerror = tx.onabort = () => { console.warn("Historial: limpieza fallida", tx.error); resolve([]); };
    });
  }

  function itemElement(item){
    if(!/^data:image\/(png|jpe?g|webp);/.test(item.thumb || "")){
      console.warn("Historial: miniatura inválida descartada", item.hash);
      return null;
    }
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.dataset.hash = item.hash;
    let infoHtml = "";
    if(item.width && item.height){
      const w = parseInt(item.width, 10), h = parseInt(item.height, 10), d = gcd(w, h) || 1;
      infoHtml = `<div class="info-tag">${w}×${h} · ${w / d}:${h / d}</div>`;
    }
    const lqBadge = item.legacy
      ? `<div class="lq-badge" title="Guardada antes de la actualización: solo hay disponible en baja resolución">LQ</div>`
      : "";
    div.innerHTML = `<button class="del-btn" title="Eliminar del historial">×</button>${lqBadge}<img src="${item.thumb}" alt="">${infoHtml}`;

    div.querySelector(".del-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      remove(item.hash);
    });
    div.addEventListener("click", async () => {
      document.querySelectorAll(".gallery-item").forEach(i => i.classList.remove("selected"));
      div.classList.add("selected");
      let full = null;
      try { full = await getFull(item.hash); } catch(e){ console.warn("Historial: no se pudo leer la imagen", e); }
      onSelect(full || item.thumb);
    });

    // dragstart tiene que rellenar dataTransfer de forma síncrona, así que la
    // imagen completa se precarga al pasar el puntero (solo la última).
    div.addEventListener("pointerenter", () => {
      if(prefetched && prefetched.hash === item.hash) return;
      const entry = { hash: item.hash, data: null };
      prefetched = entry;
      getFull(item.hash).then(d => { entry.data = d; }).catch(() => {});
    });
    div.setAttribute("draggable", "true");
    div.addEventListener("dragstart", (e) => {
      const dataUrl = (prefetched && prefetched.hash === item.hash && prefetched.data) || item.thumb;
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("text/uri-list", dataUrl);
      e.dataTransfer.setData("text/plain", dataUrl);
      const fakeName = `${filePrefix}_${item.hash}.png`;
      e.dataTransfer.setData(LTXV_MEDIA_MIME, JSON.stringify({ filename: fakeName, subfolder: "", type: "input", _dataUrl: dataUrl }));
      // DownloadURL no admite dataURLs grandes; el navegador lo ignora si no cabe.
      try { e.dataTransfer.setData("DownloadURL", `image/png:${fakeName}:${dataUrl}`); } catch(_){}
    });
    return div;
  }

  async function render(){
    const grid = $(gridId);
    if(!grid) return;
    let items = [];
    try {
      const db = await openDB();
      items = await reqResult(db.transaction(THUMBS, "readonly").objectStore(THUMBS).index("ts").getAll());
    } catch(e){ console.warn("No se pudo leer el historial de imágenes:", e); }
    grid.innerHTML = "";
    const frag = document.createDocumentFragment();
    for(let i = items.length - 1; i >= 0; i--){
      const el = itemElement(items[i]);
      if(el) frag.appendChild(el);
    }
    if(!frag.childNodes.length){ grid.innerHTML = EMPTY_HINT; return; }
    grid.appendChild(frag);
  }

  async function add(dataUrl){
    try {
      const thumb = await makeThumb(dataUrl);
      if(!thumb) return;
      const rec = { hash: await hashOf(thumb.dataUrl), thumb: thumb.dataUrl, width: thumb.width, height: thumb.height, ts: Date.now() };
      const db = await openDB();
      const tx = db.transaction([THUMBS, FULL], "readwrite");
      tx.objectStore(THUMBS).put(rec);
      tx.objectStore(FULL).put({ hash: rec.hash, full: dataUrl });
      await txDone(tx);
      const removed = await evict(db);
      const grid = $(gridId);
      if(grid){
        grid.querySelector(".hint")?.remove();
        grid.querySelector(`[data-hash="${rec.hash}"]`)?.remove();
        const el = itemElement(rec);
        if(el) grid.prepend(el);
        removed.forEach(h => grid.querySelector(`[data-hash="${h}"]`)?.remove());
      }
    } catch(err){
      console.warn("No se pudo guardar en galería:", err);
      log("⚠️ No se pudo guardar la imagen en el historial: " + err.message, "l-err");
    }
  }

  async function remove(hash){
    try {
      const db = await openDB();
      const tx = db.transaction([THUMBS, FULL], "readwrite");
      tx.objectStore(THUMBS).delete(hash);
      tx.objectStore(FULL).delete(hash);
      await txDone(tx);
      if(prefetched && prefetched.hash === hash) prefetched = null;
      const grid = $(gridId);
      grid?.querySelector(`[data-hash="${hash}"]`)?.remove();
      if(grid && !grid.querySelector(".gallery-item")) grid.innerHTML = EMPTY_HINT;
    } catch(e){
      console.warn("Fallo borrando de galería:", e);
      await render();
    }
  }

  async function clear(){
    if(!confirm("¿Vaciar todo el historial de imágenes? No se puede deshacer.")) return;
    try {
      const db = await openDB();
      const tx = db.transaction([THUMBS, FULL], "readwrite");
      tx.objectStore(THUMBS).clear();
      tx.objectStore(FULL).clear();
      await txDone(tx);
    } catch(e){ console.warn(e); }
    prefetched = null;
    await render();
    log("🗑️ Historial de imágenes vaciado.", "l-ok");
  }

  return { add, render, remove, clear };
}

// Registra un elemento <video>/<img> como fuente arrastrable.
// `getMedia` debe devolver un objeto {filename, subfolder, type} o null.
function makeDragSource(el, getMedia){
  if(!el) return;
  el.addEventListener("dragstart", (e) => {
    const media = getMedia();
    if(!media || !media.filename) { e.preventDefault(); return; }
    const url = mediaViewUrl(media, { anchor: "" });
    const display = media.filename || "media";
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/uri-list", url);
    e.dataTransfer.setData("text/plain", url);
    e.dataTransfer.setData(LTXV_MEDIA_MIME, JSON.stringify(media));
    // DownloadURL permite arrastrar al escritorio como archivo descargado.
    // El navegador exige el formato: mime:filename:URL
    const isVideo = /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(media.filename);
    const mime = isVideo ? "video/mp4" : "image/png";
    e.dataTransfer.setData("DownloadURL", `${mime}:${display}:${url}`);
  });
}

// Registra una tarjeta (.variant-card / .gallery-item) como fuente arrastrable.
// Lee los datos del dataset del card.
function makeCardDraggable(card){
  if(!card) return;
  card.setAttribute("draggable", "true");
  card.addEventListener("dragstart", (e) => {
    const media = {
      filename: card.dataset.filename,
      subfolder: card.dataset.subfolder || "",
      type: card.dataset.type || "output",
    };
    if(!media.filename){ e.preventDefault(); return; }
    const url = mediaViewUrl(media, { anchor: card.dataset.slot ? "" : "#t=0.1" });
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/uri-list", url);
    e.dataTransfer.setData("text/plain", url);
    e.dataTransfer.setData(LTXV_MEDIA_MIME, JSON.stringify(media));
    const isVideo = /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(media.filename);
    const mime = isVideo ? "video/mp4" : "image/png";
    e.dataTransfer.setData("DownloadURL", `${mime}:${media.filename}:${url}`);
  });
}

// Habilita un dropzone para aceptar drag entre UIs (no solo archivos del OS).
// `onFile(file, filename)` se llama con un File descargado desde la URL arrastrada.
// El dropzone ya debe tener sus listeners de drop para archivos del OS; este
// helper añade lógica para leer text/uri-list o el MIME custom cuando no hay
// files en dataTransfer.
function enableInterUIDrop(el, onFile){
  if(!el) return;
  el.addEventListener("dragover", (e) => {
    // Permitir drop de URLs (no solo archivos)
    if(!e.dataTransfer.types.includes("Files")){
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  });
  el.addEventListener("drop", async (e) => {
    // Si hay archivos del OS, los maneja el listener existente.
    if(e.dataTransfer.files && e.dataTransfer.files.length > 0) return;
    // Si no hay archivos, intentamos leer una URL arrastrada desde otra UI.
    const custom = e.dataTransfer.getData(LTXV_MEDIA_MIME);
    const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if(!uri && !custom) return;
    e.preventDefault();
    e.stopPropagation();
    let media;
    if(custom){
      try { media = JSON.parse(custom); } catch(_){ media = null; }
    }
    // Caso 1: el medio trae un dataURL embebido (historial IndexedDB de Krea2).
    // Lo convertimos directamente a File sin pasar por la red.
    if(media && media._dataUrl && media._dataUrl.startsWith("data:")){
      try {
        const r = await fetch(media._dataUrl);
        const blob = await r.blob();
        const filename = media.filename || "dragged_media.png";
        const file = new File([blob], filename, { type: blob.type || "image/png" });
        onFile(file, filename);
        return;
      } catch(err){ log("❌ No se pudo cargar el medio arrastrado: "+err.message, "l-err"); return; }
    }
    // Caso 2: URL del backend (http). Descargamos y convertimos a File.
    const url = uri || (media ? mediaViewUrl(media, { anchor: "" }) : null);
    if(!url) return;
    try {
      const r = await fetch(url);
      if(!r.ok) throw new Error("HTTP "+r.status);
      const blob = await r.blob();
      const filename = (media && media.filename) || url.split("/").pop().split("?")[0] || "dragged_media";
      const file = new File([blob], filename, { type: blob.type || (media && /\.(mp4|webm|mov)$/i.test(media.filename) ? "video/mp4" : "image/png") });
      onFile(file, filename);
    } catch(err){
      log("❌ No se pudo cargar el medio arrastrado: "+err.message, "l-err");
    }
  });
}
// --- ARRANQUE AUTOMÁTICO DE OTRAS WEBUIS ---
// Los botones de envío cruzado (→LTXV / →H3 / →X2 ...) no deben fallar si la
// WebUI de destino no está en pie: comprueba si responde (fetch no-cors, que
// resuelve con cualquier respuesta HTTP y rechaza con conexión rechazada) y,
// si no, pide a esta misma serve.py que la lance (/api/ui_launch) esperando
// hasta ~40s antes de abrir la pestaña.
function externalWebUINameFor(page){
  return ({
    "LTXV_WebUI.html": "ltxv",
    "Krea2_WebUI.html": "krea2",
    "MiniMaxH3_WebUI.html": "minimaxh3",
    "MMH3X2_WebUI.html": "mmh3x2",
    "MMH3X2_WebUI_BlockATT.html": "mmh3x2",
    "KreaQwen_WebUI.html": "kreaqwen",
  })[page] || null;
}
async function externalWebUIBaseUrl(targetPort, targetPage){
  const here = window.location;
  const base = `${here.protocol}//${here.hostname}:${targetPort}`;
  try {
    await fetch(`${base}/${targetPage}`, { mode: "no-cors", signal: AbortSignal.timeout(2000) });
    return base;
  } catch(_){}
  const name = externalWebUINameFor(targetPage);
  if(!name) return base; // página sin mapping: comportamiento clásico
  try {
    const r = await fetch(`/api/ui_launch?target=${encodeURIComponent(name)}`, { signal: AbortSignal.timeout(40000) });
    const d = await r.json();
    if(d.error) throw new Error(d.error);
    if(d.started) log(`✅ WebUI ${name} arrancada automáticamente (puerto ${d.port}).`, "l-ok");
    else log(`ℹ️ ${name} ya estaba en pie (puerto ${d.port}).`, "l-info");
  } catch(e){
    log(`⚠️ No se pudo arrancar ${name} (${e.message || e}); abriendo igualmente...`, "l-warn");
  }
  return base;
}
async function openExternalWebUIRef(targetPort, targetPage, filename, subfolder, label){
  const sf = (subfolder || "").replace(/^\/+|\/+$/g, "");
  const ref = encodeURIComponent((sf ? sf + "/" : "") + filename);
  const base = await externalWebUIBaseUrl(targetPort, targetPage);
  const url = `${base}/${targetPage}?ref=${ref}`;
  const win = window.open(url, "_blank");
  if(!win){
    log("⚠️ El navegador bloqueó la nueva pestaña. Permite popups y reintenta.", "l-err");
  } else if(label){
    log(`↗️ Abriendo ${label} con la imagen: ${filename}`, "l-ok");
  }
  return win;
}

// --- Cerrar la WebUI (ventana/pestaña) desde el botón "✕ Cerrar UI" ---
// KreaQwen abre estas UIs con window.open(), por lo que window.close() funciona.
// Si la pestaña se abrió manualmente, el navegador puede bloquear el cierre: en
// ese caso mostramos una ayuda para cerrarla con el teclado.
document.addEventListener("click", (e) => {
  const btn = e.target && e.target.closest && e.target.closest("#btnCloseUI");
  if(!btn) return;
  e.preventDefault();
  try { if(window.opener) window.opener = null; } catch(_){}
  try { window.close(); } catch(_){}
  // Si sigue viva tras intentar cerrarla, no se pudo (pestaña abierta a mano).
  setTimeout(() => {
    if(typeof log === "function"){
      log("No se pudo cerrar automáticamente. Usa Ctrl+W (Cmd+W en Mac) o el aspa ✕ de la pestaña.", "l-warn");
    }
  }, 300);
});
