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

const LEGACY_PORTS = ["7822", "7821"];
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
function log(msg, cls){const el=$("log"),line=document.createElement("div");if(cls)line.className=cls;line.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`;el.appendChild(line);el.scrollTop=el.scrollHeight;}
function setConn(s,t){$("connDot").className="dot"+(s?" "+s:"");$("connText").textContent=t;}
function setRun(s,t){$("runDot").className="dot"+(s?" "+s:"");$("runText").textContent=t;}

function updateServerHint(){
  const hint = $("serverHint");
  if(!hint) return;
  const v = ($("serverUrl")?.value || "").trim();
  if(v){
    hint.textContent = `URL efectiva: ${v}`;
  } else {
    const host = (window.location.hostname || "").trim();
    if(host && !/^(127\.|localhost$|::1$)/i.test(host)){
      hint.textContent = "proxy activo (same-origin)";
    } else {
      hint.textContent = "";
    }
  }
}

// --- PREVIEWS (TAE VAE / TAESD / Latent2RGB) ---
function getPreviewMethod(){
  const sel = $("previewMethod");
  return sel ? sel.value : "taesd";
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
    const pct = Math.round((value / max) * 100);
    setRun("busy", `Muestreando (${value}/${max} · ${pct}%)`);
    if (CONFIG.onProgress) {
      CONFIG.onProgress(value, max, prompt_id, node);
    }
  }
}

// --- WEBSOCKET ---
function connectSocket() {
    if(socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
    const url = server().replace(/^http/, 'ws') + '/ws?clientId=' + CLIENT_ID;
    socket = new WebSocket(url);
    socket.binaryType = "blob";
    socket.onopen = () => {
        // Negociación de capacidades con ComfyUI (protocolo feature_flags).
        // Sin declarar supports_preview_metadata el backend NO manda los previews
        // binarios (PREVIEW_IMAGE_WITH_METADATA) durante la generación.
        try {
            socket.send(JSON.stringify({ type: "feature_flags", data: { supports_preview_metadata: true } }));
        } catch(e){ console.warn("WS feature_flags no enviados:", e); }
        console.log("WebSocket conectado"); setConn("ok", "Conectado (WS)");
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
            log(`❌ Error en prompt ${pid || ''}: ${JSON.stringify(msg.data && msg.data.exception_message || msg.data)}`, "l-err");
            if(pid){
              handledPrompts.add(pid);
              delete pendingSeeds[pid];
              discardTimer(pid);
              if(CONFIG.onPromptError) CONFIG.onPromptError(pid);
            }
            clearPreview();
            currentBatchIndex++;
            processNextBatch();
        }
    };
    socket.onerror = (err) => console.error("WS Error", err);
}

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
        handledPrompts.add(promptId);
        processingPrompts.delete(promptId);
        delete pendingSeeds[promptId];
        discardTimer(promptId);
        if(CONFIG.onPromptError) CONFIG.onPromptError(promptId);
        currentBatchIndex++;
        processNextBatch();
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

    const displayResult = await CONFIG.displayResult(entry, realSeed, tTotal, promptId, { t1, t2 });
    const skipFinalize = displayResult === true || (displayResult && displayResult.skipFinalize === true);
    const foundOutput = !(displayResult && displayResult.foundOutput === false);

    if(!foundOutput) {
        // displayResult vio outputs pero aún no hay media usable; pollFallback reintentará.
        processingPrompts.delete(promptId);
        return;
    }

    if(skipFinalize) {
        // LTXV paso 1->2 ya gestionó sus estados; liberamos el lock para ese prompt_id.
        processingPrompts.delete(promptId);
        return;
    }

    log(`✅ Variante ${currentBatchIndex + 1}/${totalBatchSize} completada.`, "l-ok");
    handledPrompts.add(promptId);
    processingPrompts.delete(promptId);
    delete pendingSeeds[promptId];
    variantCounter++;
    currentBatchIndex++;
    processNextBatch();
}

function pollFallback(promptId) {
    let tries = 0;
    const iv = setInterval(async () => {
        tries++;
        if(handledPrompts.has(promptId) || tries > 180) { clearInterval(iv); return; }
        await handlePromptDone(promptId);
        if(handledPrompts.has(promptId)) clearInterval(iv);
    }, 4000);
}

function processNextBatch() {
    if(currentBatchIndex < totalBatchSize) {
        setTimeout(() => CONFIG.startNextVariant(currentBatchIndex), 1000);
    } else {
        setRun("ok", "Batch finalizado");
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

async function _syncPromptsWithServer(){
  try {
    const res = await fetch("/api/prompts?key=" + encodeURIComponent(CONFIG.PROMPTS_KEY));
    if(res.ok){
      const serverData = await res.json();
      if(serverData && typeof serverData === "object" && !Array.isArray(serverData)){
        const local = _readPromptStore();
        if(Object.keys(serverData).length > 0){
          localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(serverData));
          return serverData;
        } else if(Object.keys(local).length > 0){
          // El servidor no tenía prompts pero este cliente sí: subimos al servidor
          _savePromptsToServer(local);
          return local;
        }
      }
    }
  } catch(e){
    console.warn("[Prompts Sync] No se pudo conectar con el servidor de prompts:", e);
  }
  return _readPromptStore();
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

      delFolder.addEventListener("click", (e) => {
        e.stopPropagation();
        if(!confirm(`¿Eliminar la carpeta "${folderPath}" y todos los prompts que contiene?`)) return;
        const saved = _readPromptStore();
        let count = 0;
        for(const key of Object.keys(saved)){
          if(key === folderPath || key.startsWith(folderPath + '/')){
            delete saved[key]; count++;
          }
        }
        localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(saved));
        _savePromptsToServer(saved);
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

function savePrompt(){
  const defaultName = lastPromptDir ? lastPromptDir + "/" : "";
  const name = prompt("Nombre/ruta para este prompt (usa / para clasificar, ej: casa/pasillo/noche):", defaultName);
  if(!name) return;
  const text = $("prompt").value;
  const saved = _readPromptStore();
  if(saved[name]){
    const preview = saved[name].slice(0, 80);
    if(!confirm(`Ya existe "${name}". ¿Sobrescribir?\n\nContenido actual:\n${preview}...`)) return;
  }
  saved[name] = text;
  localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(saved));
  _savePromptsToServer(saved);
  selectedPromptKey = name;
  const parts = name.split('/');
  if(parts.length > 1) lastPromptDir = parts.slice(0, -1).join('/');
  loadPrompts(true);
  log(`Prompt "${name}" guardado.`, "l-ok");
}

function movePrompt(){
  if(!selectedPromptKey){ log("⚠️ Selecciona un prompt para mover.", "l-err"); return; }
  const oldName = selectedPromptKey;
  const newName = prompt(`Mover/renombrar "${oldName}" a:`, oldName);
  if(!newName || newName === oldName) return;
  const saved = _readPromptStore();
  if(saved[newName]){
    if(!confirm(`Ya existe "${newName}". ¿Sobrescribir?`)) return;
  }
  saved[newName] = saved[oldName];
  delete saved[oldName];
  localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(saved));
  _savePromptsToServer(saved);
  selectedPromptKey = newName;
  loadPrompts(true);
  log(`Prompt movido: "${oldName}" → "${newName}"`, "l-ok");
}

function deletePrompt(){
  if(!selectedPromptKey){ log("⚠️ Selecciona un prompt para eliminar.", "l-err"); return; }
  if(!confirm(`¿Eliminar "${selectedPromptKey}"?`)) return;
  const saved = _readPromptStore();
  delete saved[selectedPromptKey];
  localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(saved));
  _savePromptsToServer(saved);
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
      if (Array.isArray(parsed) && parsed.length === 3) {
        parsed.forEach((l, i) => {
          if (AVAILABLE_LORAS.includes(l.lora) || l.lora === "") loras[i] = l;
        });
      }
    } catch (e) { console.error("Error cargando estado LoRA", e); }
  }
}
function loadModels(){
  const sel = $("modelSelect");
  if(!sel) return;
  sel.innerHTML = "";
  for(const m of AVAILABLE_MODELS){
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    if(m === CONFIG.DEFAULT_MODEL) opt.selected = true;
    sel.appendChild(opt);
  }
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
      const displayName = path.split('/').pop();
      optionsHtml += `<option value="${path}" ${selected} title="${path}">${displayName}</option>`;
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
  const saved = localStorage.getItem(CONFIG.ENHANCER_SYSKEY);
  if(saved){
    try { return JSON.parse(saved); } catch(e) {}
  }
  return JSON.parse(JSON.stringify(CONFIG.ENHANCER_DEFAULT_PROMPTS));
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
  try {
    const r = await fetch("/api/tags");
    if(!r.ok) throw new Error("HTTP "+r.status);
    const data = await r.json();
    const models = data.models || [];
    sel.innerHTML = '<option value="">-- Seleccionar modelo --</option>';
    for(const m of models){
      const opt = document.createElement("option");
      opt.value = m.name;
      opt.textContent = m.name;
      sel.appendChild(opt);
    }
    const defaultModel = models.find(m => m.name.includes("Qwythos") || m.name.includes("qwythos"));
    if(defaultModel) sel.value = defaultModel.name;
  } catch(e) {
    sel.innerHTML = '<option value="">Ollama no disponible</option>';
    console.warn("No se pudieron cargar modelos:", e.message);
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
  const ts = extra && extra.ts != null ? extra.ts : Date.now();
  const anchor = extra && extra.anchor ? extra.anchor : "";
  const f = encodeURIComponent(media.filename || "");
  const s = encodeURIComponent(media.subfolder || "");
  const t = encodeURIComponent(media.type || "output");
  return `${server()}/view?filename=${f}&subfolder=${s}&type=${t}&t=${ts}${anchor}`;
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
    html = raw; // string preformateado
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

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

// --- INIT: all top-level code that uses $ or CONFIG ---
// Called by the UI-specific JS after CONFIG is defined.
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
        if(storedPort && LEGACY_PORTS.includes(storedPort)){
          localStorage.removeItem(CONFIG.SERVERURL_KEY);
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

  $("btnUseAsPrompt").addEventListener("click", () => {
    const text = $("enhancerOutput").value.trim();
    if(!text){ log("⚠️ No hay resultado para usar como prompt", "l-err"); return; }
    $("prompt").value = text;
    log("✏️ Prompt actualizado desde el resultado del enhancer.", "l-ok");
  });

  $("btnSaveEnhanced").addEventListener("click", () => {
    const text = $("enhancerOutput").value.trim();
    if(!text){ log("⚠️ No hay resultado que guardar", "l-err"); return; }
    const defaultName = lastPromptDir ? lastPromptDir + "/" : "";
    const name = prompt("Nombre/ruta para este prompt mejorado (usa / para agrupar):", defaultName);
    if(!name) return;
    const saved = _readPromptStore();
    if(saved[name]){
      if(!confirm(`Ya existe "${name}". ¿Sobrescribir?`)) return;
    }
    saved[name] = text;
    localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(saved));
    selectedPromptKey = name;
    const parts = name.split('/');
    if(parts.length > 1) lastPromptDir = parts.slice(0, -1).join('/');
    loadPrompts();
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
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if(typeof imported !== 'object' || Array.isArray(imported)){
            throw new Error("formato inválido (se esperaba un objeto)");
          }
          const saved = _readPromptStore();
          let added = 0, overwritten = 0;
          for(const [key, val] of Object.entries(imported)){
            if(typeof val !== 'string') continue;
            if(saved[key]) overwritten++; else added++;
            saved[key] = val;
          }
          localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(saved));
          loadPrompts();
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
          const r=await fetch(server()+"/system_stats");
          if(!r.ok) throw new Error("HTTP "+r.status);
          await r.json();
          setConn("ok","conectado");
          connectSocket();
          log("Conexión OK","l-ok");
      }catch(err){setConn("bad","sin conexión");log("Error: "+err.message,"l-err");}
  });
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