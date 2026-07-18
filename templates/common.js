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
//   displayResult(entry, realSeed, tTotal, promptId) -> true to skip finalize,
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
  return Math.floor(Math.random() * 0xFFFFFFFF);
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

// --- WEBSOCKET ---
function connectSocket() {
    if(socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
    const url = server().replace('http', 'ws') + '/ws?clientId=' + CLIENT_ID;
    socket = new WebSocket(url);
    socket.onopen = () => { console.log("WebSocket conectado"); setConn("ok", "Conectado (WS)"); };
    socket.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch(e) {
            console.warn("WS mensaje no-JSON, cerrando:", event.data.slice(0,80));
            socket.close();
            return;
        }
        if(msg.type === 'execution_success') handlePromptDone(msg.data.prompt_id);
        if(msg.type === 'execution_error') {
            const pid = msg.data && msg.data.prompt_id;
            log(`❌ Error en prompt ${pid || ''}: ${JSON.stringify(msg.data && msg.data.exception_message || msg.data)}`, "l-err");
            if(pid){
              handledPrompts.add(pid);
              delete pendingSeeds[pid];
              discardTimer(pid);
              if(CONFIG.onPromptError) CONFIG.onPromptError(pid);
            }
            currentBatchIndex++;
            processNextBatch();
        }
    };
    socket.onerror = (err) => console.error("WS Error", err);
}

// --- HANDLE PROMPT DONE ---
async function handlePromptDone(promptId) {
    if(handledPrompts.has(promptId)) return;
    if(processingPrompts.has(promptId)) return;
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
        return;
    }

    if(!(promptId in pendingSeeds)){
        handledPrompts.add(promptId);
        processingPrompts.delete(promptId);
        return;
    }

    handledPrompts.add(promptId);
    processingPrompts.delete(promptId);

    const realSeed = (promptId in pendingSeeds) ? pendingSeeds[promptId] : null;
    if(realSeed !== null) {
        if(CONFIG.onSeedUpdate) CONFIG.onSeedUpdate(realSeed);
        log(`🎲 Semilla usada: ${realSeed}`, "l-ok");
    }

    const timings = extractTimings(entry, CONFIG.N);
    const clientResult = stopTimer(promptId);
    const tTotal = (timings && timings.total != null) ? fmtMs(timings.total) :
                   (clientResult ? fmtMs(clientResult.total) : null);

    const cont = await CONFIG.displayResult(entry, realSeed, tTotal, promptId);
    if(cont) return;

    log(`✅ Variante ${currentBatchIndex + 1}/${totalBatchSize} completada.`, "l-ok");
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
function loadPrompts(){
  let saved = JSON.parse(localStorage.getItem(CONFIG.PROMPTS_KEY) || '{}');
  let dirty = false;
  for(const key of Object.keys(saved)){
    if(key.endsWith('/') || !key.split('/').pop()){
      delete saved[key]; dirty = true;
    }
  }
  if(dirty) localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(saved));

  const tree = $("promptTree");
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

  const openState = JSON.parse(localStorage.getItem(CONFIG.PROMPTS_KEY + '_open') || '{}');

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
        const saved = JSON.parse(localStorage.getItem(CONFIG.PROMPTS_KEY) || '{}');
        let count = 0;
        for(const key of Object.keys(saved)){
          if(key === folderPath || key.startsWith(folderPath + '/')){
            delete saved[key]; count++;
          }
        }
        localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(saved));
        loadPrompts();
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
        const saved = JSON.parse(localStorage.getItem(CONFIG.PROMPTS_KEY) || '{}');
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
  const saved = JSON.parse(localStorage.getItem(CONFIG.PROMPTS_KEY) || '{}');
  if(saved[name]){
    const preview = saved[name].slice(0, 80);
    if(!confirm(`Ya existe "${name}". ¿Sobrescribir?\n\nContenido actual:\n${preview}...`)) return;
  }
  saved[name] = text;
  localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(saved));
  selectedPromptKey = name;
  const parts = name.split('/');
  if(parts.length > 1) lastPromptDir = parts.slice(0, -1).join('/');
  loadPrompts();
  log(`Prompt "${name}" guardado.`, "l-ok");
}

function movePrompt(){
  if(!selectedPromptKey){ log("⚠️ Selecciona un prompt para mover.", "l-err"); return; }
  const oldName = selectedPromptKey;
  const newName = prompt(`Mover/renombrar "${oldName}" a:`, oldName);
  if(!newName || newName === oldName) return;
  const saved = JSON.parse(localStorage.getItem(CONFIG.PROMPTS_KEY) || '{}');
  if(saved[newName]){
    if(!confirm(`Ya existe "${newName}". ¿Sobrescribir?`)) return;
  }
  saved[newName] = saved[oldName];
  delete saved[oldName];
  localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(saved));
  selectedPromptKey = newName;
  loadPrompts();
  log(`Prompt movido: "${oldName}" → "${newName}"`, "l-ok");
}

function deletePrompt(){
  if(!selectedPromptKey){ log("⚠️ Selecciona un prompt para eliminar.", "l-err"); return; }
  if(!confirm(`¿Eliminar "${selectedPromptKey}"?`)) return;
  const saved = JSON.parse(localStorage.getItem(CONFIG.PROMPTS_KEY) || '{}');
  delete saved[selectedPromptKey];
  localStorage.setItem(CONFIG.PROMPTS_KEY, JSON.stringify(saved));
  selectedPromptKey = null;
  loadPrompts();
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
        <input type="text" class="spr-name-input" value="${entry.name}" style="flex:1;background:var(--panel);border:1px solid var(--border);color:var(--text);border-radius:4px;padding:4px 6px;font-family:var(--mono);font-size:11px;">
        ${isDefault ? "" : '<button class="spr-del" data-key="'+key+'">×</button>'}
      </div>
      <textarea data-key="${key}">${entry.prompt}</textarea>
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
    await fetch(server()+"/queue", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"cancel", prompt_id:pid})
    });
  } catch(e) { /* si falla, igual limpiamos local */ }
  discardTimer(pid);
  delete pendingSeeds[pid];
  handledPrompts.add(pid);
  if(CONFIG.onStopCurrent) CONFIG.onStopCurrent(pid);
  log("⏹ Video actual detenido.", "l-err");
  currentBatchIndex++;
  processNextBatch();
}

async function stopAll(){
  try {
    await fetch(server()+"/queue", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"cancel_all"})
    });
  } catch(e) { /* si falla, igual limpiamos local */ }
  for(const pid of Object.keys(pendingSeeds)) discardTimer(pid);
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

  return { resetZoom, getState, isFullscreen, wasPan };
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
    const saved = JSON.parse(localStorage.getItem(CONFIG.PROMPTS_KEY) || '{}');
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