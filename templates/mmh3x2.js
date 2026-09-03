// mmh3x2.js — MMH3X2-specific JavaScript (2 segmentos, 4 imágenes, 1 vídeo, RTX y RIFE).
// Injected AFTER common.js. CONFIG must be defined before initCommon().

const CONFIG = {
  PROMPTS_KEY: 'mmh3x2_prompts',
  LORA_STATE_KEY: 'mmh3x2_loras_state',
  ENHANCER_SYSKEY: 'mmh3x2_enhancer_sysprompts',
  SERVERURL_KEY: 'mmh3x2_serverUrl',
  DEFAULT_BACKEND_PORT: "7821",
  UI_TYPE: "mmh3x2",
  DEFAULT_MODEL: "",
  DEFAULT_VAE: "Checkpoint",
  N: {
    UNET: "1",
    ATTN: "2",
    SPARSE: "4",
    SIGMA_SHIFT: "5",
    MEM_OPT: "6",
    CLIP: "7",
    VAE_VID: "8",
    VAE_AUD: "9",
    IMG1: "10",
    DURATION: "12",
    FRAMES_EXPR: "13",
    REF2V_SEG1: "14",
    SEED: "15",
    GUIDER_1: "16",
    SAMPLER_1: "17",
    SCHEDULER_1: "18",
    SAMPLE_1: "19",
    DECODE_VID_1: "20",
    DECODE_AUD_1: "21",
    CREATE_VID_1: "22",
    SAVE_VID_1: "23",
    LAST_48: "25",
    LAST_FRAME: "26",
    SAVE_LAST_FRAME: "28",
    SAVE_REF_GRID: "29",
    REF2V_SEG2: "30",
    GUIDER_2: "32",
    SAMPLER_2: "33",
    SCHEDULER_2: "34",
    SAMPLE_2: "35",
    DECODE_VID_2: "36",
    DECODE_AUD_2: "37",
    CREATE_VID_2: "38",
    SAVE_VID_2: "39",
    IMAGE_BATCH: "40",
    AUDIO_CONCAT: "41",
    CREATE_VID_FINAL: "42",
    SAVE_VID_FINAL: "43",
    PROMPT_1: "50",
    OLLAMA_CONN: "51",
    OLLAMA_CHAT_1: "53",
    SCALE_2S: "54",
    OLLAMA_CHAT_2: "55",
    PROMPT_2: "58",
    BLEND: "66",
    INJECT_LATENT: "68",
    ADD_GUIDE: "70",
    RTX: "71",
    RIFE: "72",
    RIFE_LOADER: "73",
    RIFE_MULT: "74",
    BASE_FPS: "75",
    FPS_EXPR: "76",
    MEGAPIXELS: "77",
    GET_SIZE: "78",
    STEPS: "79",
    IMG2: "81",
    IMG3: "82",
    IMG4: "83",
    PURGE: "87"
  },
  loras: [
    { on: false, lora: "", strength: 1.0 },
    { on: false, lora: "", strength: 1.0 }
  ],
  ENHANCER_DEFAULT_PROMPTS: {
    text: {
      A: { name: "Estilo A (cinematográfico)", prompt: "You are an expert in prompts for MiniMaxH3 video generation. Transform the user's idea into a detailed cinematic prompt. Include: shot type, lighting, camera movement, atmosphere, colors, and visual style. Respond in English with ONLY the enhanced prompt." },
      B: { name: "Estilo B (continuación de acción)", prompt: "You are an assistant specialized in visual continuity and scene escalation. Describe the direct, logical evolution of the ongoing action for the next video segment. Respond in English with ONLY the enhanced continuation prompt." }
    },
    vision: {
      A: { name: "Estilo A (descriptivo)", prompt: "Analyze the provided reference image and describe composition, subjects, lighting, colors, and motion for a video segment. Respond in English with ONLY the enhanced prompt." }
    }
  }
};

const N = CONFIG.N;
initCommon();

// Estado de imágenes y vídeo
let mediaSlots = {
  1: { file: null, dataUrl: null, uploaded: null, name: "" },
  2: { file: null, dataUrl: null, uploaded: null, name: "" },
  3: { file: null, dataUrl: null, uploaded: null, name: "" },
  4: { file: null, dataUrl: null, uploaded: null, name: "" }
};
let videoSlot = { file: null, dataUrl: null, uploaded: null, name: "" };

let isInitializing = true;
let jobQueue = [];
let activeJob = null;
let promptVariantMap = {};
let promptSteps = {};
let displayedSlots = {};
let currentActiveSamplerSlot = 1; // 1 o 2

// UI Tabs
let currentViewMode = "all";

// Callbacks CONFIG requeridos por common.js
CONFIG.findMedia = function(output){
  if(!output) return null;
  const vids = output.videos || output.gifs || output.images;
  if(Array.isArray(vids) && vids.length > 0){
    const item = vids[0];
    const fn = item.filename || item;
    const sub = item.subfolder || "";
    const type = item.type || "output";
    return server() + `/view?filename=${encodeURIComponent(fn)}&subfolder=${encodeURIComponent(sub)}&type=${encodeURIComponent(type)}`;
  }
  return null;
};

CONFIG.showMedia = function(url, meta){
  const targetPlayer = meta?.targetSlot || 3;
  if(targetPlayer === 1){
    displayVideoInPlayer(1, url);
  } else if(targetPlayer === 2){
    displayVideoInPlayer(2, url);
  } else {
    displayVideoInPlayer(3, url);
  }
};

CONFIG.onNodeExecuting = function(data){
  if(!data) return;
  const nid = String(data.node);
  // Conmutar a slot Seg 2 tan pronto como empiece la inferencia del Segmento 2
  if(nid === N.SAMPLE_2 || nid === N.REF2V_SEG2 || nid === N.DECODE_VID_2 || nid === N.CREATE_VID_2){
    currentActiveSamplerSlot = 2;
  }
};

CONFIG.onNodeExecuted = function(data){
  if(!data) return;
  const nid = String(data.node);
  if(nid === N.SAMPLE_1 || nid === N.SAVE_VID_1){
    currentActiveSamplerSlot = 2;
  }
  if(nid === N.SAVE_VID_1 && data.output){
    const m1 = CONFIG.findMedia(data.output);
    if(m1) displayVideoInPlayer(1, m1);
  }
  if(nid === N.SAVE_VID_2 && data.output){
    const m2 = CONFIG.findMedia(data.output);
    if(m2) displayVideoInPlayer(2, m2);
  }
  if(nid === N.SAVE_VID_FINAL && data.output){
    const mf = CONFIG.findMedia(data.output);
    if(mf) displayVideoInPlayer(3, mf);
  }
};

CONFIG.onPreview = function(url, meta){
  const slot = (currentActiveSamplerSlot === 2) ? "Seg2" : "Seg1";
  const p = $("previewImg" + slot);
  const pv = $("previewVideo" + slot);
  const e = $("empty" + slot);
  const v = $("video" + slot);
  if(!p && !pv) return;

  // Si Seg 1 ya terminó y tiene vídeo cargado, jamás pisarlo con previsualizaciones
  if(slot === "Seg1" && v && v.src && v.style.display === "block"){
    return;
  }

  const isVideoUrl = typeof url === "string" && (url.startsWith("data:video/mp4") || url.startsWith("data:video/webm"));
  const target = isVideoUrl && pv ? pv : p;
  const other = isVideoUrl ? p : pv;

  target.src = url;
  target.style.display = "block";
  if(other) other.style.display = "none";
  if(e) e.style.display = "none";
  if(v && !v.src) v.style.display = "none";
  if(isVideoUrl && pv && pv.autoplay !== true){ pv.autoplay = true; pv.muted = true; pv.loop = true; }
  if(isVideoUrl && target.play) target.play().catch(()=>{});
};

CONFIG.onClearPreview = function(){
  ["Seg1", "Seg2"].forEach(slot => {
    const p = $("previewImg" + slot);
    const pv = $("previewVideo" + slot);
    if(p){ p.style.display = "none"; p.removeAttribute("src"); }
    if(pv){ pv.pause(); pv.style.display = "none"; pv.removeAttribute("src"); pv.load(); }
  });
};

CONFIG.addToVariantGallery = function(url, seed, varIdx, promptText){
  const gallery = $("variantGalleryBox");
  const grid = $("variantGrid");
  if(!gallery || !grid) return;
  gallery.style.display = "block";

  const countBadge = $("variantCount");
  const totalCards = grid.querySelectorAll(".variant-card").length + 1;
  if(countBadge) countBadge.textContent = `(${totalCards})`;

  const card = document.createElement("div");
  card.className = "variant-card";
  card.innerHTML = `
    <div class="thumb-wrap">
      <video src="${url}#t=0.001" preload="metadata" muted playsinline loop style="width:100%;height:140px;object-fit:cover;cursor:pointer;"></video>
      <span class="variant-badge">Var ${varIdx} · Seed ${seed}</span>
    </div>
    <div style="padding:6px;display:flex;justify-content:space-between;align-items:center;background:var(--panel);">
      <button class="ghost btn-mini btn-load-card" title="Cargar en reproductor principal">▶ Cargar</button>
      <button class="ghost btn-mini btn-del-card" title="Quitar de galería">✕</button>
    </div>
  `;

  const videoEl = card.querySelector("video");
  videoEl.addEventListener("mouseenter", () => { videoEl.play().catch(()=>{}); });
  videoEl.addEventListener("mouseleave", () => { videoEl.pause(); videoEl.currentTime = 0; });
  videoEl.addEventListener("click", () => { displayVideoInPlayer(3, url); });

  card.querySelector(".btn-load-card").addEventListener("click", () => { displayVideoInPlayer(3, url); });
  card.querySelector(".btn-del-card").addEventListener("click", () => {
    card.remove();
    const remaining = grid.querySelectorAll(".variant-card").length;
    if(countBadge) countBadge.textContent = remaining > 0 ? `(${remaining})` : "";
    if(remaining === 0) gallery.style.display = "none";
  });

  grid.insertBefore(card, grid.firstChild);
};

CONFIG.displayResult = async function(entry, realSeed, tTotal, promptId, timings){
  let found = false;
  try {
    if(entry?.outputs?.[N.SAVE_VID_1]){
      const m1 = CONFIG.findMedia(entry.outputs[N.SAVE_VID_1]);
      if(m1){ displayVideoInPlayer(1, m1); found = true; }
    }
    if(entry?.outputs?.[N.SAVE_VID_2]){
      const m2 = CONFIG.findMedia(entry.outputs[N.SAVE_VID_2]);
      if(m2){ displayVideoInPlayer(2, m2); found = true; }
    }
    if(entry?.outputs?.[N.SAVE_VID_FINAL]){
      const mf = CONFIG.findMedia(entry.outputs[N.SAVE_VID_FINAL]);
      if(mf){
        displayVideoInPlayer(3, mf);
        const varIndex = promptVariantMap[promptId] || (variantCounter + 1);
        CONFIG.addToVariantGallery(mf, realSeed, varIndex);
        found = true;
      }
    }
  } catch(e){
    console.error("Error mostrando resultados de media:", e);
    log(`⚠️ Error renderizando medios: ${e.message}`, "l-err");
  } finally {
    delete pendingSeeds[promptId];
    delete promptVariantMap[promptId];
    delete displayedSlots[promptId];
    handledPrompts.add(promptId);

    currentBatchIndex++;
    if(currentBatchIndex < totalBatchSize){
      log(`➡️ Siguiente variante ${currentBatchIndex + 1}/${totalBatchSize}...`, "l-ok");
      await CONFIG.startNextVariant();
    } else {
      log(`🏁 Generación completada (${totalBatchSize} variantes).`, "l-ok");
      finishCurrentJob();
    }
  }
  return true;
};

CONFIG.onSeedUpdate = function(newSeed){
  const sv = $("seedVal");
  if(sv && $("segRandom")?.classList.contains("on")){
    sv.value = newSeed;
  }
};

CONFIG.onPromptError = function(pid){
  delete promptSteps[pid];
  delete pendingSeeds[pid];
  delete promptVariantMap[pid];
  delete displayedSlots[pid];
  finishCurrentJob();
};

CONFIG.startNextVariant = async function(){
  if(!activeJob) return;
  if(currentBatchIndex < totalBatchSize){
    const nextSeed = activeJob.seedMode === "random" ? Math.floor(Math.random()*1000000000) : (activeJob.seed + currentBatchIndex);
    variantCounter++;
    activeJob.currentVariantIndex = variantCounter;
    await enqueueJobVariant(activeJob, nextSeed, variantCounter);
  } else {
    finishCurrentJob();
  }
};

CONFIG.onBatchComplete = function(){
  finishCurrentJob();
};

CONFIG.onStopCurrent = async function(){
  try {
    if(currentPromptId){
      await fetch(server() + "/interrupt", { method: "POST" });
      log("⏹ Interrupción solicitada para la tarea actual", "l-warn");
    }
  } catch(e){
    log(`Error al interrumpir: ${e.message}`, "l-err");
  } finally {
    finishCurrentJob();
  }
};

CONFIG.onStopAll = async function(){
  try {
    await fetch(server() + "/interrupt", { method: "POST" });
    await fetch(server() + "/queue", { method: "POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({clear:true}) });
    jobQueue = [];
    activeJob = null;
    currentPromptId = null;
    updateQueueUI();
    log("⏹ Todas las tareas canceladas y cola vaciada", "l-warn");
  } catch(e){
    log(`Error al cancelar todo: ${e.message}`, "l-err");
  }
};

let queueIdleCount = 0;
function updateQueueUI(){
  const count = jobQueue.length;
  const badge = $("queueCountBadge");
  if(badge) badge.textContent = count > 0 ? `${count} tarea${count > 1 ? 's' : ''}` : "0 tareas";
  const clearBtn = $("btnClearQueue");
  if(clearBtn) clearBtn.disabled = (count === 0 && !activeJob);

  // Auto-recuperación si activeJob quedó huérfano con ComfyUI en reposo
  if(activeJob && typeof serverQueueState !== "undefined" && serverQueueState.running === 0 && serverQueueState.pending === 0){
    queueIdleCount++;
    if(queueIdleCount >= 2){
      queueIdleCount = 0;
      console.warn("Liberando activeJob huérfano (ComfyUI está en reposo)");
      activeJob = null;
      currentPromptId = null;
      enableStopButtons(false);
      return;
    }
  } else {
    queueIdleCount = 0;
  }

  enableStopButtons(!!activeJob);

  const list = $("queueList");
  if(!list) return;
  if(!activeJob && count === 0){
    list.innerHTML = '<div class="hint" style="padding:6px;text-align:center;font-size:10px;">En reposo</div>';
    return;
  }
  let html = "";
  if(activeJob){
    html += `<div class="queue-item active" style="font-size:10.5px;color:var(--accent);margin-bottom:4px;">
      ▶ Ejecutando: ${activeJob.runMode || 'Completo'} (Var ${currentBatchIndex + 1}/${totalBatchSize})
    </div>`;
  }
  jobQueue.forEach((job, idx) => {
    html += `<div class="queue-item" style="display:flex;justify-content:space-between;align-items:center;font-size:10px;padding:2px 0;">
      <span>#${idx+1} · ${job.runMode || 'Completo'} (${job.batchSize || 1} var)</span>
      <button class="ghost btn-mini" style="font-size:9px;padding:1px 4px;" onclick="jobQueue.splice(${idx},1);updateQueueUI();">✕</button>
    </div>`;
  });
  list.innerHTML = html;
}

// ==========================================
// RENDER Y GESTIÓN DE REPRODUCTORES
// ==========================================
function displayVideoInPlayer(slotIndex, url){
  const suffix = (slotIndex === 1) ? "Seg1" : (slotIndex === 2 ? "Seg2" : "Final");
  const video = $("video" + suffix);
  const empty = $("empty" + suffix);
  const pImg = $("previewImg" + suffix);
  const pVid = $("previewVideo" + suffix);
  const btnDl = $("btnDownload" + suffix);
  const btnExt = $("btnExtractFrame" + suffix);
  const btnMeta = $("btnLoadMeta" + suffix);
  const timeTag = $("time" + suffix);
  const resTag = $("res" + suffix);

  if(empty) empty.style.display = "none";
  if(pImg) pImg.style.display = "none";
  if(pVid){ pVid.pause(); pVid.style.display = "none"; }

  if(video){
    video.src = url;
    video.style.display = "block";
    video.load();
    video.onloadedmetadata = () => {
      if(timeTag) timeTag.textContent = `${video.duration.toFixed(1)}s`;
      if(resTag) resTag.textContent = `${video.videoWidth}x${video.videoHeight}`;
    };
    video.onerror = (e) => {
      const err = video.error;
      const code = err ? err.code : "desconocido";
      const msg = err ? err.message : "";
      console.error(`Error cargando vídeo slot ${suffix} (código ${code}):`, msg);
      log(`⚠️ Vídeo ${suffix}: error de reproducción (${code}). Prueba el botón '⬇ Descargar' si el navegador no soporta el formato.`, "l-err");
    };
  }

  if(btnDl){
    btnDl.style.display = "inline-flex";
    btnDl.onclick = () => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `MMH3X2_${suffix}_${Date.now()}.mp4`;
      a.click();
    };
  }

  if(btnExt){
    btnExt.style.display = "inline-flex";
    btnExt.onclick = () => {
      extractCurrentFrame(video, slotIndex);
    };
  }

  if(btnMeta){
    btnMeta.disabled = false;
  }
}

function extractCurrentFrame(videoEl, fromSlot){
  if(!videoEl || videoEl.videoWidth === 0) return;
  const canvas = document.createElement("canvas");
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/png");

  const targetSlot = (fromSlot === 1) ? 3 : 1;
  setMediaSlotData(targetSlot, null, dataUrl, `Frame extraído de Seg ${fromSlot}`);
  log(`📸 Frame de ${videoEl.currentTime.toFixed(2)}s asignado al Slot de Imagen ${targetSlot}`, "l-ok");
}

// ==========================================
// PERSISTENCIA DE SESIÓN (AJUSTES & MEDIOS)
// ==========================================
const MMH3X2_SETTINGS_KEY = "mmh3x2_ui_settings_v1";
const MMH3X2_DB_NAME = "mmh3x2_media_db";
const MMH3X2_STORE_NAME = "slots";

function openMediaDB(){
  return new Promise((resolve, reject) => {
    if(!window.indexedDB){ reject(new Error("IndexedDB no disponible")); return; }
    const req = indexedDB.open(MMH3X2_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains(MMH3X2_STORE_NAME)){
        db.createObjectStore(MMH3X2_STORE_NAME, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbSaveSlot(key, data){
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MMH3X2_STORE_NAME, "readwrite");
      tx.objectStore(MMH3X2_STORE_NAME).put({ key, ...data });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch(e){ console.warn("Error guardando en IndexedDB:", e); }
}

async function dbDeleteSlot(key){
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MMH3X2_STORE_NAME, "readwrite");
      tx.objectStore(MMH3X2_STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch(e){ console.warn("Error borrando en IndexedDB:", e); }
}

async function dbGetAllSlots(){
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MMH3X2_STORE_NAME, "readonly");
      const req = tx.objectStore(MMH3X2_STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch(e){ console.warn("Error leyendo IndexedDB:", e); return []; }
}

function saveSettings(){
  const s = {
    prompt: $("prompt")?.value || "",
    prompt2: $("prompt2")?.value || "",
    seg2PromptMode: $("seg2PromptMode")?.value || "direct",
    seedMode: $("segRandom")?.classList.contains("on") ? "random" : "fixed",
    seedVal: $("seedVal")?.value || "12345",
    duration: $("durationSlider")?.value || "15.0",
    megapixels: $("mpSlider")?.value || "0.70",
    batchSize: $("batchSize")?.value || "1",
    filenamePrefix: $("filenamePrefix")?.value || "video/MiniMax_H3",
    steps: $("stepsSlider")?.value || "20",
    sampler: $("samplerName")?.value || "res_multistep",
    scheduler: $("schedulerName")?.value || "simple",
    unetModel: $("unetModel")?.value || "",
    clipModel: $("clipModel")?.value || "",
    h3Sparse: $("h3SparseToggle") ? $("h3SparseToggle").checked : true,
    h3Budget: $("h3BudgetSlider")?.value || "0.30",
    h3EarlyLate: $("h3EarlyLateToggle") ? $("h3EarlyLateToggle").checked : true,
    h3Mem: $("h3MemToggle") ? $("h3MemToggle").checked : true,
    h3ShiftVideo: $("h3ShiftVideo")?.value || "12.0",
    h3ShiftAudio: $("h3ShiftAudio")?.value || "3.0",
    lora1Toggle: $("lora1Toggle") ? $("lora1Toggle").checked : false,
    lora1Select: $("lora1Select")?.value || "",
    lora1Strength: $("lora1Strength")?.value || "1.0",
    lora2Toggle: $("lora2Toggle") ? $("lora2Toggle").checked : false,
    lora2Select: $("lora2Select")?.value || "",
    lora2Strength: $("lora2Strength")?.value || "1.0",
    blendToggle: $("blendToggle") ? $("blendToggle").checked : true,
    rtxToggle: $("rtxToggle") ? $("rtxToggle").checked : true,
    rifeToggle: $("rifeToggle") ? $("rifeToggle").checked : true,
    rifeMultiplier: $("rifeMultiplier")?.value || "2",
    rifeModel: $("rifeModel")?.value || "rife_v4.26.safetensors"
  };
  try {
    localStorage.setItem(MMH3X2_SETTINGS_KEY, JSON.stringify(s));
  } catch(e){
    console.warn("Error guardando ajustes en localStorage:", e);
  }
}

let saveTimer = null;
function scheduleSaveSettings(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettings, 350);
}

function restoreSettings(){
  const raw = localStorage.getItem(MMH3X2_SETTINGS_KEY);
  if(!raw) return false;
  try {
    const s = JSON.parse(raw);
    if(!s || typeof s !== "object") return false;

    if(s.prompt !== undefined && $("prompt")) $("prompt").value = s.prompt;
    if(s.prompt2 !== undefined && $("prompt2")) $("prompt2").value = s.prompt2;
    if(s.seg2PromptMode !== undefined && $("seg2PromptMode")) $("seg2PromptMode").value = s.seg2PromptMode;

    if(s.seedMode === "random"){
      $("segRandom")?.classList.add("on");
      $("segFixed")?.classList.remove("on");
      if($("seedVal")) $("seedVal").disabled = true;
    } else if(s.seedMode === "fixed"){
      $("segFixed")?.classList.add("on");
      $("segRandom")?.classList.remove("on");
      if($("seedVal")) $("seedVal").disabled = false;
    }
    if(s.seedVal !== undefined && $("seedVal")) $("seedVal").value = s.seedVal;

    if(s.duration !== undefined && $("durationSlider")){
      $("durationSlider").value = s.duration;
      if($("durationVal")) $("durationVal").textContent = parseFloat(s.duration).toFixed(1) + "s";
      updateDurationFrames();
    }
    if(s.megapixels !== undefined && $("mpSlider")){
      $("mpSlider").value = s.megapixels;
      if($("mpVal")) $("mpVal").textContent = parseFloat(s.megapixels).toFixed(2);
    }
    if(s.batchSize !== undefined && $("batchSize")) $("batchSize").value = s.batchSize;
    if(s.filenamePrefix !== undefined && $("filenamePrefix")) $("filenamePrefix").value = s.filenamePrefix;

    if(s.steps !== undefined && $("stepsSlider")){
      $("stepsSlider").value = s.steps;
      if($("stepsVal")) $("stepsVal").textContent = s.steps;
    }
    if(s.sampler !== undefined && $("samplerName")) $("samplerName").value = s.sampler;
    if(s.scheduler !== undefined && $("schedulerName")) $("schedulerName").value = s.scheduler;

    if(s.unetModel && $("unetModel")) $("unetModel").value = s.unetModel;
    if(s.clipModel && $("clipModel")) $("clipModel").value = s.clipModel;

    if(s.h3Sparse !== undefined && $("h3SparseToggle")) $("h3SparseToggle").checked = s.h3Sparse;
    if(s.h3Budget !== undefined && $("h3BudgetSlider")){
      $("h3BudgetSlider").value = s.h3Budget;
      if($("h3BudgetVal")) $("h3BudgetVal").textContent = parseFloat(s.h3Budget).toFixed(2);
    }
    if(s.h3EarlyLate !== undefined && $("h3EarlyLateToggle")) $("h3EarlyLateToggle").checked = s.h3EarlyLate;
    if(s.h3Mem !== undefined && $("h3MemToggle")) $("h3MemToggle").checked = s.h3Mem;

    if(s.h3ShiftVideo !== undefined && $("h3ShiftVideo")){
      $("h3ShiftVideo").value = s.h3ShiftVideo;
      if($("h3ShiftVideoVal")) $("h3ShiftVideoVal").textContent = parseFloat(s.h3ShiftVideo).toFixed(1);
    }
    if(s.h3ShiftAudio !== undefined && $("h3ShiftAudio")){
      $("h3ShiftAudio").value = s.h3ShiftAudio;
      if($("h3ShiftAudioVal")) $("h3ShiftAudioVal").textContent = parseFloat(s.h3ShiftAudio).toFixed(1);
    }

    if(s.lora1Toggle !== undefined && $("lora1Toggle")) $("lora1Toggle").checked = s.lora1Toggle;
    if(s.lora1Select && $("lora1Select")) $("lora1Select").value = s.lora1Select;
    if(s.lora1Strength !== undefined && $("lora1Strength")){
      $("lora1Strength").value = s.lora1Strength;
      if($("lora1StrengthVal")) $("lora1StrengthVal").textContent = parseFloat(s.lora1Strength).toFixed(2);
    }

    if(s.lora2Toggle !== undefined && $("lora2Toggle")) $("lora2Toggle").checked = s.lora2Toggle;
    if(s.lora2Select && $("lora2Select")) $("lora2Select").value = s.lora2Select;
    if(s.lora2Strength !== undefined && $("lora2Strength")){
      $("lora2Strength").value = s.lora2Strength;
      if($("lora2StrengthVal")) $("lora2StrengthVal").textContent = parseFloat(s.lora2Strength).toFixed(2);
    }

    if(s.blendToggle !== undefined && $("blendToggle")) $("blendToggle").checked = s.blendToggle;
    if(s.rtxToggle !== undefined && $("rtxToggle")) $("rtxToggle").checked = s.rtxToggle;
    if(s.rifeToggle !== undefined && $("rifeToggle")) $("rifeToggle").checked = s.rifeToggle;
    if(s.rifeMultiplier !== undefined && $("rifeMultiplier")) $("rifeMultiplier").value = s.rifeMultiplier;
    if(s.rifeModel && $("rifeModel")) $("rifeModel").value = s.rifeModel;

    return true;
  } catch(e){
    console.warn("Error restaurando ajustes:", e);
    return false;
  }
}

async function restoreSavedMedia(){
  const records = await dbGetAllSlots();
  if(!records || records.length === 0) return false;

  let restoredAny = false;
  for(const rec of records){
    if(rec.key && rec.key.startsWith("slot_") && rec.key !== "slot_vid"){
      const slotIdx = parseInt(rec.key.replace("slot_", ""), 10);
      if(slotIdx >= 1 && slotIdx <= 4 && rec.dataUrl){
        setMediaSlotData(slotIdx, null, rec.dataUrl, rec.name || `slot_${slotIdx}.png`, false);
        if(rec.uploaded) mediaSlots[slotIdx].uploaded = rec.uploaded;
        restoredAny = true;
      }
    } else if(rec.key === "slot_vid" && rec.blob){
      const url = URL.createObjectURL(rec.blob);
      videoSlot = { file: rec.blob, dataUrl: url, uploaded: null, name: rec.name || "video_ref.mp4" };
      const v = $("previewSlotVid");
      const ph = $("phVid");
      const info = $("infoVid");
      const btnDel = $("btnDelVid");
      if(v){ v.src = url; v.style.display = "block"; }
      if(ph) ph.style.display = "none";
      if(info) info.textContent = `${rec.name || 'video'} (${(rec.blob.size / 1024 / 1024).toFixed(1)} MB)`;
      if(btnDel) btnDel.style.display = "inline-flex";
      restoredAny = true;
    }
  }
  return restoredAny;
}

function attachAutoSaveListeners(){
  const inputIds = [
    "prompt", "prompt2", "seg2PromptMode", "durationSlider", "mpSlider", "stepsSlider",
    "seedVal", "batchSize", "filenamePrefix", "samplerName", "schedulerName",
    "unetModel", "clipModel", "h3SparseToggle", "h3BudgetSlider", "h3EarlyLateToggle",
    "h3MemToggle", "h3ShiftVideo", "h3ShiftAudio", "lora1Toggle", "lora1Select",
    "lora1Strength", "lora2Toggle", "lora2Select", "lora2Strength", "blendToggle",
    "rtxToggle", "rifeToggle", "rifeMultiplier", "rifeModel"
  ];

  inputIds.forEach(id => {
    const el = $(id);
    if(el){
      el.addEventListener("input", scheduleSaveSettings);
      el.addEventListener("change", scheduleSaveSettings);
    }
  });

  $("segRandom")?.addEventListener("click", scheduleSaveSettings);
  $("segFixed")?.addEventListener("click", scheduleSaveSettings);
  window.addEventListener("beforeunload", saveSettings);
}

// ==========================================
// GESTIÓN DE MEDIOS (4 IMÁGENES + 1 VÍDEO)
// ==========================================
function setupMediaSlots(){
  for(let i = 1; i <= 4; i++){
    const slotEl = $(`slotImg${i}`);
    const fileInput = $(`fileInput${i}`);
    const delBtn = $(`btnDelImg${i}`);

    if(slotEl && fileInput){
      slotEl.addEventListener("click", (e) => {
        if(e.target === delBtn || delBtn.contains(e.target)) return;
        fileInput.click();
      });

      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if(file) handleImageFile(i, file);
      });

      slotEl.addEventListener("dragover", (e) => { e.preventDefault(); slotEl.classList.add("drag"); });
      slotEl.addEventListener("dragleave", () => { slotEl.classList.remove("drag"); });
      slotEl.addEventListener("drop", (e) => {
        e.preventDefault();
        slotEl.classList.remove("drag");
        const file = e.dataTransfer.files[0];
        if(file && file.type.startsWith("image/")){
          handleImageFile(i, file);
        } else {
          const url = e.dataTransfer.getData("text/plain");
          if(url) handleImageUrl(i, url);
        }
      });
    }

    if(delBtn){
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        clearMediaSlot(i);
      });
    }
  }

  const vidSlot = $("slotVid");
  const vidInput = $("fileInputVid");
  const btnDelVid = $("btnDelVid");

  if(vidSlot && vidInput){
    vidSlot.addEventListener("click", (e) => {
      if(e.target === btnDelVid || (btnDelVid && btnDelVid.contains(e.target))) return;
      vidInput.click();
    });

    vidInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if(file) handleVideoFile(file);
    });

    vidSlot.addEventListener("dragover", (e) => { e.preventDefault(); vidSlot.classList.add("drag"); });
    vidSlot.addEventListener("dragleave", () => { vidSlot.classList.remove("drag"); });
    vidSlot.addEventListener("drop", (e) => {
      e.preventDefault();
      vidSlot.classList.remove("drag");
      const file = e.dataTransfer.files[0];
      if(file && file.type.startsWith("video/")){
        handleVideoFile(file);
      }
    });
  }

  if(btnDelVid){
    btnDelVid.addEventListener("click", (e) => {
      e.stopPropagation();
      clearVideoSlot();
    });
  }

  window.addEventListener("paste", (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for(let item of items){
      if(item.kind === 'file' && item.type.startsWith('image/')){
        const blob = item.getAsFile();
        let target = 1;
        for(let s = 1; s <= 4; s++){
          if(!mediaSlots[s].dataUrl && !mediaSlots[s].file){ target = s; break; }
        }
        handleImageFile(target, blob);
        break;
      }
    }
  });
}

function handleImageFile(slotIdx, file){
  const reader = new FileReader();
  reader.onload = (e) => {
    setMediaSlotData(slotIdx, file, e.target.result, file.name);
  };
  reader.readAsDataURL(file);
}

function handleImageUrl(slotIdx, url){
  setMediaSlotData(slotIdx, null, url, url.split("/").pop().split("?")[0]);
}

function setMediaSlotData(slotIdx, file, dataUrl, name, shouldSave = true){
  mediaSlots[slotIdx] = { file, dataUrl, uploaded: null, name };
  const img = $(`previewSlotImg${slotIdx}`);
  const ph = $(`phImg${slotIdx}`);
  const info = $(`infoImg${slotIdx}`);

  if(img){
    img.src = dataUrl;
    img.style.display = "block";
    img.onload = () => {
      if(slotIdx === 1) updateCalculatedResolution(img.naturalWidth, img.naturalHeight);
      if(info) info.textContent = `${img.naturalWidth}x${img.naturalHeight} · ${name || 'img'}`;
    };
  }
  if(ph) ph.style.display = "none";
  if(shouldSave && dataUrl){
    dbSaveSlot("slot_" + slotIdx, { dataUrl, name });
  }
}

function clearMediaSlot(slotIdx){
  mediaSlots[slotIdx] = { file: null, dataUrl: null, uploaded: null, name: "" };
  const img = $(`previewSlotImg${slotIdx}`);
  const ph = $(`phImg${slotIdx}`);
  const info = $(`infoImg${slotIdx}`);
  const fileInput = $(`fileInput${slotIdx}`);

  if(img){ img.removeAttribute("src"); img.style.display = "none"; }
  if(ph) ph.style.display = "block";
  if(info) info.textContent = "";
  if(fileInput) fileInput.value = "";
  dbDeleteSlot("slot_" + slotIdx);
}

function handleVideoFile(file, shouldSave = true){
  const url = URL.createObjectURL(file);
  videoSlot = { file, dataUrl: url, uploaded: null, name: file.name };
  const v = $("previewSlotVid");
  const ph = $("phVid");
  const info = $("infoVid");
  const btnDel = $("btnDelVid");

  if(v){
    v.src = url;
    v.style.display = "block";
  }
  if(ph) ph.style.display = "none";
  if(info) info.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  if(btnDel) btnDel.style.display = "inline-flex";
  if(shouldSave){
    dbSaveSlot("slot_vid", { blob: file, name: file.name });
  }
}

function clearVideoSlot(){
  videoSlot = { file: null, dataUrl: null, uploaded: null, name: "" };
  const v = $("previewSlotVid");
  const ph = $("phVid");
  const info = $("infoVid");
  const btnDel = $("btnDelVid");
  const input = $("fileInputVid");

  if(v){ v.removeAttribute("src"); v.style.display = "none"; }
  if(ph) ph.style.display = "block";
  if(info) info.textContent = "";
  if(btnDel) btnDel.style.display = "none";
  if(input) input.value = "";
  dbDeleteSlot("slot_vid");
}

async function ensureAllMediaUploaded(){
  for(let i = 1; i <= 4; i++){
    const slot = mediaSlots[i];
    if(slot.file && !slot.uploaded){
      slot.uploaded = await uploadSingleFile(slot.file, `mmh3x2_slot_${i}.png`);
    } else if(slot.dataUrl && !slot.uploaded){
      if(slot.dataUrl.startsWith("data:")){
        const blob = dataUrlToBlob(slot.dataUrl);
        slot.uploaded = await uploadSingleFile(blob, `mmh3x2_slot_${i}.png`);
      } else {
        const urlParams = new URL(slot.dataUrl, window.location.origin).searchParams;
        const fn = urlParams.get("filename") || slot.name || `mmh3x2_slot_${i}.png`;
        slot.uploaded = { name: fn, subfolder: urlParams.get("subfolder") || "", type: urlParams.get("type") || "input" };
      }
    }
  }

  if(videoSlot.file && !videoSlot.uploaded){
    videoSlot.uploaded = await uploadSingleFile(videoSlot.file, videoSlot.name || "mmh3x2_ref_vid.mp4");
  }
}

async function uploadSingleFile(fileOrBlob, filename){
  const fd = new FormData();
  fd.append("image", fileOrBlob, filename);
  fd.append("overwrite", "true");
  const r = await fetch(server() + "/upload/image", { method: "POST", body: fd });
  if(!r.ok) throw new Error("Fallo al subir archivo multimedia a ComfyUI");
  const d = await r.json();
  return { name: d.name, subfolder: d.subfolder || "", type: d.type || "input" };
}

function dataUrlToBlob(dataUrl){
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){ u8arr[n] = bstr.charCodeAt(n); }
  return new Blob([u8arr], { type: mime });
}

// ==========================================
// CÁLCULOS DE RESOLUCIÓN Y DURACIÓN
// ==========================================
function updateCalculatedResolution(origW, origH){
  const mp = parseFloat($("mpSlider")?.value || "0.70");
  const ar = (origW && origH) ? (origW / origH) : (16 / 9);

  const targetPixels = mp * 1000000;
  let h = Math.round(Math.sqrt(targetPixels / ar) / 32) * 32;
  let w = Math.round((h * ar) / 32) * 32;
  w = Math.max(256, w);
  h = Math.max(256, h);

  if($("width")) $("width").value = w;
  if($("height")) $("height").value = h;
  if($("arDetectHint")) $("arDetectHint").textContent = `(${ar.toFixed(2)}:1 · ${w}x${h})`;
}

function updateDurationFrames(){
  const dur = parseFloat($("durationSlider")?.value || "15.0");
  const baseFrames = Math.max(5, Math.round(dur * 24));
  const framesPerSeg = baseFrames + ((5 - (baseFrames % 17)) % 17);
  const totalFrames = framesPerSeg * 2;
  const totalSecs = (totalFrames / 24).toFixed(1);

  if($("durHint")) $("durHint").textContent = `(${dur.toFixed(1)}s → ${framesPerSeg} frames)`;
  if($("durationVal")) $("durationVal").textContent = `${dur.toFixed(1)}s`;
  if($("totalFramesHint")){
    $("totalFramesHint").textContent = `Total: 2 segmentos x ${framesPerSeg}f = ${totalFrames} frames (~${totalSecs}s a 24fps)`;
  }
}

// ==========================================
// CONSTRUCCIÓN DEL GRAFO (buildGraph)
// ==========================================
function buildGraph(j){
  const g = JSON.parse(JSON.stringify(BASE_GRAPH));

  // 1. Prompts
  const p1 = (j ? j.prompt : $("prompt")?.value) || "";
  const p2 = (j ? j.prompt2 : $("prompt2")?.value) || "";
  if(g[N.PROMPT_1]?.inputs) g[N.PROMPT_1].inputs.value = p1;
  if(g[N.PROMPT_2]?.inputs) g[N.PROMPT_2].inputs.value = p2;

  const seg2Mode = $("seg2PromptMode")?.value || "direct";
  if(seg2Mode === "direct" && g[N.REF2V_SEG2]?.inputs){
    g[N.REF2V_SEG2].inputs.prompt = [N.PROMPT_2, 0];
    ["51", "53", "55", "84", "85", "86"].forEach(id => { delete g[id]; });
  }

  // 2. Duración y Megapíxeles
  const dur = parseFloat((j ? j.duration : $("durationSlider")?.value) || "15.0");
  if(g[N.DURATION]?.inputs) g[N.DURATION].inputs.value = dur;

  // Cálculo dinámico exacto de frames para corte y empalme (resuelve IndexError en nodo 61)
  const baseFrames = Math.max(5, Math.round(dur * 24));
  const framesPerSeg = baseFrames + ((5 - (baseFrames % 17)) % 17);
  if(g["61"]?.inputs){
    g["61"].inputs.indexes = Array.from({ length: framesPerSeg - 1 }, (_, i) => i).join(", ");
  }
  if(g["65"]?.inputs){
    g["65"].inputs.start_index = 0.0;
    g["65"].inputs.duration = parseFloat(((framesPerSeg - 1) / 24).toFixed(4));
  }

  const mp = parseFloat((j ? j.megapixels : $("mpSlider")?.value) || "0.70");
  if(g[N.MEGAPIXELS]?.inputs) g[N.MEGAPIXELS].inputs.megapixels = mp;

  // 3. Semilla
  const seed = (j ? j.seed : parseInt($("seedVal")?.value || "12345", 10));
  if(g[N.SEED]?.inputs) g[N.SEED].inputs.noise_seed = seed;

  // 4. Pasos (Steps)
  const steps = parseInt((j ? j.steps : $("stepsSlider")?.value) || "20", 10);
  if(g[N.STEPS]?.inputs) g[N.STEPS].inputs.value = steps;
  if(g[N.SCHEDULER_1]?.inputs) g[N.SCHEDULER_1].inputs.steps = steps;
  if(g[N.SCHEDULER_2]?.inputs) g[N.SCHEDULER_2].inputs.steps = steps;

  // 5. Sampler y Scheduler
  const sampler = (j ? j.sampler : $("samplerName")?.value) || "res_multistep";
  const scheduler = (j ? j.scheduler : $("schedulerName")?.value) || "simple";
  if(g[N.SAMPLER_1]?.inputs) g[N.SAMPLER_1].inputs.sampler_name = sampler;
  if(g[N.SAMPLER_2]?.inputs) g[N.SAMPLER_2].inputs.sampler_name = sampler;
  if(g[N.SCHEDULER_1]?.inputs) g[N.SCHEDULER_1].inputs.scheduler = scheduler;
  if(g[N.SCHEDULER_2]?.inputs) g[N.SCHEDULER_2].inputs.scheduler = scheduler;

  // 6. Modelos: UNet y CLIP
  const unet = $("unetModel")?.value;
  if(unet && g[N.UNET]?.inputs) g[N.UNET].inputs.unet_name = unet;
  const clip = $("clipModel")?.value;
  if(clip && g[N.CLIP]?.inputs) g[N.CLIP].inputs.clip_name = clip;

  // 7. Pipeline de Modelo Base & Optimizaciones H3
  let currentModelNode = N.MEM_OPT;

  // Sparse Attention
  const sparseOn = $("h3SparseToggle") ? $("h3SparseToggle").checked : true;
  if(sparseOn && g[N.SPARSE]?.inputs){
    g[N.SPARSE].inputs.video_budget = parseFloat($("h3BudgetSlider")?.value || "0.30");
    g[N.SPARSE].inputs.denser_early_late_steps = $("h3EarlyLateToggle") ? $("h3EarlyLateToggle").checked : true;
  } else if(!sparseOn && g[N.SPARSE]){
    if(g[N.SIGMA_SHIFT]?.inputs) g[N.SIGMA_SHIFT].inputs.model = [N.ATTN, 0];
    delete g[N.SPARSE];
  }

  // Memory Optimization
  const memOn = $("h3MemToggle") ? $("h3MemToggle").checked : true;
  if(!memOn && g[N.MEM_OPT]){
    currentModelNode = N.SIGMA_SHIFT;
    delete g[N.MEM_OPT];
  }

  // Sigma Shift (valores estándar MiniMax H3: 12.0 vídeo, 3.0 audio)
  if(g[N.SIGMA_SHIFT]?.inputs){
    g[N.SIGMA_SHIFT].inputs.shift_video = parseFloat($("h3ShiftVideo")?.value || "12.0");
    g[N.SIGMA_SHIFT].inputs.shift_audio = parseFloat($("h3ShiftAudio")?.value || "3.0");
  }

  // 8. Inyección dinámica de LoRAs
  if($("lora1Toggle")?.checked && $("lora1Select")?.value){
    const l1 = $("lora1Select").value;
    const s1 = parseFloat($("lora1Strength")?.value || "1.0");
    g["145_1"] = {
      class_type: "LoraLoaderModelOnly",
      inputs: { model: [currentModelNode, 0], lora_name: l1, strength_model: s1 },
      _meta: { title: "LoRA 1" }
    };
    currentModelNode = "145_1";
  }

  if($("lora2Toggle")?.checked && $("lora2Select")?.value){
    const l2 = $("lora2Select").value;
    const s2 = parseFloat($("lora2Strength")?.value || "1.0");
    g["145_2"] = {
      class_type: "LoraLoaderModelOnly",
      inputs: { model: [currentModelNode, 0], lora_name: l2, strength_model: s2 },
      _meta: { title: "LoRA 2" }
    };
    currentModelNode = "145_2";
  }

  // 9. ModelPreviewOverrideKJ (Live preview animado multi-frame en tiempo real)
  const prevMethod = getPreviewMethod();
  if(prevMethod !== "none"){
    const previewOverrideKey = "170";
    g[previewOverrideKey] = {
      class_type: "ModelPreviewOverrideKJ",
      inputs: {
        model: [currentModelNode, 0],
        max_resolution: 768,
        jpeg_quality: 80,
        suppress_default_preview: true,
        preview_frames: 32,
        preview_fps: 6,
        tiny_vae: "none"
      },
      _meta: { title: "Model Preview Override (animado L2RGB)" }
    };
    currentModelNode = previewOverrideKey;
  }

  // Conectar el modelo resultante a Guiders y Schedulers
  if(g[N.GUIDER_1]?.inputs) g[N.GUIDER_1].inputs.model = [currentModelNode, 0];
  if(g[N.SCHEDULER_1]?.inputs) g[N.SCHEDULER_1].inputs.model = [currentModelNode, 0];
  if(g[N.GUIDER_2]?.inputs) g[N.GUIDER_2].inputs.model = [currentModelNode, 0];
  if(g[N.SCHEDULER_2]?.inputs) g[N.SCHEDULER_2].inputs.model = [currentModelNode, 0];

  // 10. Conexión de Imágenes de Entrada (Slots 1..4)
  if(mediaSlots[1].uploaded && g[N.IMG1]?.inputs) g[N.IMG1].inputs.image = mediaSlots[1].uploaded.name;
  if(mediaSlots[2].uploaded && g[N.IMG2]?.inputs) g[N.IMG2].inputs.image = mediaSlots[2].uploaded.name;
  if(mediaSlots[3].uploaded && g[N.IMG3]?.inputs) g[N.IMG3].inputs.image = mediaSlots[3].uploaded.name;
  if(mediaSlots[4].uploaded && g[N.IMG4]?.inputs) g[N.IMG4].inputs.image = mediaSlots[4].uploaded.name;

  // 11. Vídeo de Referencia para Seg 2
  if(videoSlot.uploaded && g[N.REF2V_SEG2]?.inputs){
    g["195_user_vid"] = {
      class_type: "VHS_LoadVideo",
      inputs: { video: videoSlot.uploaded.name, force_rate: 0, force_size: "Disabled", custom_width: 512, custom_height: 512, frame_load_cap: 0, skip_first_frames: 0, select_every_nth: 1 },
      _meta: { title: "Vídeo Ref Usuario" }
    };
    if(g[N.REF2V_SEG2].inputs['ref_videos.ref_video_0']){
      g[N.REF2V_SEG2].inputs['ref_videos.ref_video_0'] = ["195_user_vid", 0];
    }
  }

  // 12. Postprocesado: RTX Video Super Resolution y RIFE
  const rtxOn = $("rtxToggle") ? $("rtxToggle").checked : true;
  const rifeOn = $("rifeToggle") ? $("rifeToggle").checked : true;
  const blendOn = $("blendToggle") ? $("blendToggle").checked : true;

  if(!blendOn && g[N.BLEND]){
    if(g[N.IMAGE_BATCH]?.inputs) g[N.IMAGE_BATCH].inputs.image_2 = ["64", 0];
    delete g[N.BLEND];
  }

  let finalImagesSource = [N.IMAGE_BATCH, 0];

  if(rtxOn && g[N.RTX]?.inputs){
    g[N.RTX].inputs.images = finalImagesSource;
    finalImagesSource = [N.RTX, 0];
  } else {
    delete g[N.RTX];
  }

  if(rifeOn && g[N.RIFE]?.inputs){
    const mult = parseInt($("rifeMultiplier")?.value || "2", 10);
    if(g[N.RIFE_MULT]?.inputs) g[N.RIFE_MULT].inputs.value = mult;
    const rifeModel = $("rifeModel")?.value || "rife_v4.26.safetensors";
    if(g[N.RIFE_LOADER]?.inputs) g[N.RIFE_LOADER].inputs.model_name = rifeModel;
    g[N.RIFE].inputs.images = finalImagesSource;
    finalImagesSource = [N.RIFE, 0];
  } else {
    delete g[N.RIFE];
    delete g[N.RIFE_LOADER];
    delete g[N.RIFE_MULT];
    if(g[N.CREATE_VID_FINAL]?.inputs) g[N.CREATE_VID_FINAL].inputs.fps = [N.BASE_FPS, 0];
  }

  if(g[N.CREATE_VID_FINAL]?.inputs){
    g[N.CREATE_VID_FINAL].inputs.images = finalImagesSource;
  }

  // 13. Prefijos de guardado de vídeo
  const prefix = ($("filenamePrefix")?.value || "video/MiniMax_H3").trim();
  if(g[N.SAVE_VID_1]?.inputs) g[N.SAVE_VID_1].inputs.filename_prefix = prefix + "_seg1";
  if(g[N.SAVE_VID_2]?.inputs) g[N.SAVE_VID_2].inputs.filename_prefix = prefix + "_seg2";
  if(g[N.SAVE_VID_FINAL]?.inputs) g[N.SAVE_VID_FINAL].inputs.filename_prefix = prefix + "_cont";

  // 14. Modo de Ejecución (Completo vs Solo Seg 1 vs Solo Seg 2)
  const runMode = j?.runMode || "full";
  if(runMode === "seg1_only"){
    const nodesToDelete = [
      N.REF2V_SEG2, N.SAMPLE_2, N.DECODE_VID_2, N.DECODE_AUD_2, N.CREATE_VID_2, N.SAVE_VID_2,
      N.IMAGE_BATCH, N.AUDIO_CONCAT, N.CREATE_VID_FINAL, N.SAVE_VID_FINAL,
      N.BLEND, N.INJECT_LATENT, N.ADD_GUIDE, N.RTX, N.RIFE, N.RIFE_LOADER, N.RIFE_MULT
    ];
    nodesToDelete.forEach(id => { delete g[id]; });
  }

  return g;
}

// ==========================================
// EJECUCIÓN Y COLAS
// ==========================================
async function queueJob(runMode){
  if(isInitializing){
    console.warn("queueJob bloqueado durante la inicialización de la página");
    return;
  }
  const p1 = $("prompt")?.value?.trim();
  if(!p1){
    log("⚠️ Por favor escribe al menos el Prompt 1 (Segmento 1)", "l-warn");
    return;
  }

  try {
    await ensureAllMediaUploaded();
  } catch(e){
    log(`❌ Error preparando medios: ${e.message}`, "l-err");
    return;
  }

  const batchSize = parseInt($("batchSize")?.value || "1", 10);
  const seedMode = $("segRandom")?.classList.contains("on") ? "random" : "fixed";
  const baseSeed = parseInt($("seedVal")?.value || "12345", 10);

  const job = {
    id: "job_" + Date.now(),
    runMode: runMode || "full",
    prompt: p1,
    prompt2: $("prompt2")?.value?.trim() || "",
    duration: parseFloat($("durationSlider")?.value || "15.0"),
    megapixels: parseFloat($("mpSlider")?.value || "0.70"),
    steps: parseInt($("stepsSlider")?.value || "20", 10),
    sampler: $("samplerName")?.value || "res_multistep",
    scheduler: $("schedulerName")?.value || "simple",
    seedMode,
    seed: baseSeed,
    batchSize
  };

  // Si activeJob estaba retenido pero ComfyUI no tiene ninguna tarea activa, liberar el bloqueo
  const comfyIdle = (typeof serverQueueState !== "undefined") && serverQueueState.running === 0 && serverQueueState.pending === 0;
  if(activeJob && (!currentPromptId || comfyIdle)){
    console.warn("Liberando activeJob huérfano (ComfyUI está libre)");
    activeJob = null;
    currentPromptId = null;
  }

  if(!activeJob){
    startJob(job);
  } else {
    jobQueue.push(job);
    updateQueueUI();
    log(`📥 Tarea añadida a la cola (${jobQueue.length} en espera)`, "l-ok");
  }
}

async function startJob(job){
  activeJob = job;
  updateQueueUI();
  try {
    connectSocket();
    totalBatchSize = job.batchSize || 1;
    currentBatchIndex = 0;
    variantCounter = 0;
    const seedUsed = job.seedMode === "random" ? Math.floor(Math.random()*1000000000) : job.seed;
    variantCounter++;
    job.currentVariantIndex = variantCounter;
    await enqueueJobVariant(job, seedUsed, variantCounter);
  } catch(e){
    log(`❌ Error al iniciar tarea: ${e.message}`, "l-err");
    finishCurrentJob();
  }
}

async function enqueueJobVariant(job, seedUsed, varIdx){
  try {
    CONFIG.onSeedUpdate(seedUsed);
    currentActiveSamplerSlot = 1;
    const graph = buildGraph({ ...job, seed: seedUsed });

    log(`🚀 Procesando ${job.runMode === 'seg1_only' ? 'Solo Seg 1' : 'Vídeo MMH3X2'} · Var ${varIdx} (seed ${seedUsed})...`);
    const r = await fetch(server() + "/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: graph,
        client_id: CLIENT_ID,
        extra_data: {
          extra_pnginfo: { workflow: graph, prompt: graph },
          preview_method: (getPreviewMethod() === "none" ? "none" : "latent2rgb")
        }
      })
    });

    if(!r.ok){
      const t = await r.text().catch(()=>"");
      throw new Error("HTTP " + r.status + " " + t.slice(0, 300));
    }

    const data = await r.json();
    if(data.error) throw new Error(JSON.stringify(data.error));

    pendingSeeds[data.prompt_id] = seedUsed;
    promptVariantMap[data.prompt_id] = varIdx;
    currentPromptId = data.prompt_id;
    promptSteps[data.prompt_id] = "1";
    startTimer(data.prompt_id, "Final");
    pollFallback(data.prompt_id);
  } catch(e){
    log(`❌ No se pudo encolar: ${e.message}`, "l-err");
    finishCurrentJob();
  }
}

function finishCurrentJob(){
  activeJob = null;
  currentPromptId = null;
  updateQueueUI();
  if(jobQueue.length > 0){
    const nextJob = jobQueue.shift();
    startJob(nextJob);
  }
}

// ==========================================
// HISTORIAL DE VÍDEOS (/api/mmh3x2_list)
// ==========================================
async function loadVideoHistory(){
  const grid = $("videoHistoryGrid");
  const countBadge = $("historyCountBadge");
  if(!grid) return;

  try {
    const r = await fetch(server() + "/api/mmh3x2_list");
    if(!r.ok) return;
    const data = await r.json();
    const items = data.items || [];
    if(countBadge) countBadge.textContent = `(${items.length})`;
    grid.innerHTML = "";

    if(items.length === 0){
      grid.innerHTML = '<div class="hint" style="padding:12px;text-align:center;">No hay vídeos generados aún.</div>';
      return;
    }

    items.forEach(item => {
      const url = server() + `/view?filename=${encodeURIComponent(item.filename)}&subfolder=${encodeURIComponent(item.subfolder)}&type=${encodeURIComponent(item.type)}`;
      const card = document.createElement("div");
      card.className = "variant-card";
      card.innerHTML = `
        <div class="thumb-wrap">
          <video src="${url}#t=0.001" preload="metadata" muted playsinline loop style="width:100%;height:130px;object-fit:cover;cursor:pointer;"></video>
          <span class="variant-badge" style="font-size:9.5px;">${item.filename}</span>
        </div>
        <div style="padding:6px;display:flex;justify-content:space-between;align-items:center;background:var(--panel);">
          <button class="ghost btn-mini btn-play-hist" title="Ver en reproductor">▶ Ver</button>
          <a class="ghost btn-mini" href="${url}" download="${item.filename}" title="Descargar">⬇</a>
          <button class="ghost btn-mini btn-del-hist" title="Eliminar archivo">✕</button>
        </div>
      `;

      const videoEl = card.querySelector("video");
      videoEl.addEventListener("mouseenter", () => { videoEl.play().catch(()=>{}); });
      videoEl.addEventListener("mouseleave", () => { videoEl.pause(); videoEl.currentTime = 0; });
      videoEl.addEventListener("click", () => { displayVideoInPlayer(3, url); });

      card.querySelector(".btn-play-hist").addEventListener("click", () => { displayVideoInPlayer(3, url); });
      card.querySelector(".btn-del-hist").addEventListener("click", async () => {
        if(!confirm(`¿Eliminar ${item.filename}?`)) return;
        try {
          await fetch(server() + `/api/file_delete?filename=${encodeURIComponent(item.filename)}&subfolder=${encodeURIComponent(item.subfolder)}&type=${encodeURIComponent(item.type)}`, { method: "POST" });
          card.remove();
          loadVideoHistory();
        } catch(err){
          log(`Error eliminando archivo: ${err.message}`, "l-err");
        }
      });

      grid.appendChild(card);
    });
  } catch(e){
    // Silencioso si falla la carga
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  setupMediaSlots();

  if($("btnFull")) $("btnFull").addEventListener("click", (e) => { e.currentTarget?.blur(); queueJob("full"); });
  if($("btnSeg1")) $("btnSeg1").addEventListener("click", (e) => { e.currentTarget?.blur(); queueJob("seg1_only"); });
  if($("btnSeg2")) $("btnSeg2").addEventListener("click", (e) => { e.currentTarget?.blur(); queueJob("seg2_only"); });

  if($("btnStopVideo")) $("btnStopVideo").addEventListener("click", () => { CONFIG.onStopCurrent(); });
  if($("btnStopAll")) $("btnStopAll").addEventListener("click", () => { CONFIG.onStopAll(); });
  if($("btnClearQueue")) $("btnClearQueue").addEventListener("click", () => {
    jobQueue = [];
    activeJob = null;
    currentPromptId = null;
    updateQueueUI();
    log("Cola de tareas vaciada y estado reseteado", "l-ok");
  });

  if($("btnRefreshHistory")) $("btnRefreshHistory").addEventListener("click", () => { loadVideoHistory(); });

  if($("btnPrompt2FromEnhancer")) $("btnPrompt2FromEnhancer").addEventListener("click", () => {
    const text = $("enhancerOutput")?.value;
    if(text){
      $("prompt2").value = text;
      log("Prompt de Enhancer copiado a Prompt 2 (Segmento 2)", "l-ok");
    } else {
      log("No hay texto generado en el Enhancer", "l-warn");
    }
  });

  if($("btnClearPrompt2")) $("btnClearPrompt2").addEventListener("click", () => {
    $("prompt2").value = "";
  });

  if($("mpSlider")){
    $("mpSlider").addEventListener("input", (e) => {
      $("mpVal").textContent = parseFloat(e.target.value).toFixed(2);
      const img1 = $("previewSlotImg1");
      updateCalculatedResolution(img1?.naturalWidth || 1280, img1?.naturalHeight || 720);
    });
  }

  if($("durationSlider")){
    $("durationSlider").addEventListener("input", () => {
      updateDurationFrames();
    });
  }

  if($("stepsSlider")){
    $("stepsSlider").addEventListener("input", (e) => {
      $("stepsVal").textContent = e.target.value;
    });
  }

  if($("h3BudgetSlider")){
    $("h3BudgetSlider").addEventListener("input", (e) => {
      $("h3BudgetVal").textContent = parseFloat(e.target.value).toFixed(2);
    });
  }

  if($("h3ShiftVideo")){
    $("h3ShiftVideo").addEventListener("input", (e) => {
      $("h3ShiftVideoVal").textContent = parseFloat(e.target.value).toFixed(1);
    });
  }
  if($("h3ShiftAudio")){
    $("h3ShiftAudio").addEventListener("input", (e) => {
      $("h3ShiftAudioVal").textContent = parseFloat(e.target.value).toFixed(1);
    });
  }

  if($("lora1Strength")){
    $("lora1Strength").addEventListener("input", (e) => {
      $("lora1StrengthVal").textContent = parseFloat(e.target.value).toFixed(2);
    });
  }
  if($("lora2Strength")){
    $("lora2Strength").addEventListener("input", (e) => {
      $("lora2StrengthVal").textContent = parseFloat(e.target.value).toFixed(2);
    });
  }

  document.querySelectorAll(".vid-view-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".vid-view-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const mode = tab.getAttribute("data-view");
      currentViewMode = mode;
      const bFinal = $("boxFinal"), b1 = $("boxSeg1"), b2 = $("boxSeg2");
      if(mode === "all"){
        if(bFinal) bFinal.style.display = "flex";
        if(b1) b1.style.display = "flex";
        if(b2) b2.style.display = "flex";
      } else if(mode === "final"){
        if(bFinal) bFinal.style.display = "flex";
        if(b1) b1.style.display = "none";
        if(b2) b2.style.display = "none";
      } else if(mode === "seg1"){
        if(bFinal) bFinal.style.display = "none";
        if(b1) b1.style.display = "flex";
        if(b2) b2.style.display = "none";
      } else if(mode === "seg2"){
        if(bFinal) bFinal.style.display = "none";
        if(b1) b1.style.display = "none";
        if(b2) b2.style.display = "flex";
      }
    });
  });

  ["h3OptToggle", "postprocToggle", "videoHistoryToggle"].forEach(id => {
    const el = $(id);
    if(el){
      el.addEventListener("click", () => {
        const body = $(id.replace("Toggle", "Body"));
        el.classList.toggle("open");
        if(body) body.classList.toggle("open");
      });
    }
  });

  if(typeof AVAILABLE_UNETS !== "undefined" && $("unetModel")){
    const sel = $("unetModel");
    const defaultUnet = BASE_GRAPH[N.UNET]?.inputs?.unet_name || "";
    sel.innerHTML = AVAILABLE_UNETS.map(m => `<option value="${m}" ${m === defaultUnet ? 'selected' : ''}>${m.split("/").pop()}</option>`).join("");
  }
  if(typeof AVAILABLE_CLIPS !== "undefined" && $("clipModel")){
    const sel = $("clipModel");
    const defaultClip = BASE_GRAPH[N.CLIP]?.inputs?.clip_name || "";
    sel.innerHTML = AVAILABLE_CLIPS.map(m => `<option value="${m}" ${m === defaultClip ? 'selected' : ''}>${m.split("/").pop()}</option>`).join("");
  }
  if(typeof AVAILABLE_LORAS !== "undefined"){
    ["lora1Select", "lora2Select"].forEach(id => {
      const sel = $(id);
      if(sel){
        sel.innerHTML = '<option value="">(ninguno)</option>' +
          AVAILABLE_LORAS.map(l => `<option value="${l}">${l.split("/").pop()}</option>`).join("");
      }
    });
  }

  // Restaurar ajustes guardados previamente
  restoreSettings();
  attachAutoSaveListeners();

  // Poblar prompts por defecto si están vacíos
  if($("prompt") && !$("prompt").value.trim() && BASE_GRAPH[N.PROMPT_1]?.inputs?.value){
    $("prompt").value = BASE_GRAPH[N.PROMPT_1].inputs.value;
  }
  if($("prompt2") && !$("prompt2").value.trim() && BASE_GRAPH[N.PROMPT_2]?.inputs?.value){
    $("prompt2").value = BASE_GRAPH[N.PROMPT_2].inputs.value;
  }

  // Restaurar medios guardados en IndexedDB con fallback al grafo por defecto
  restoreSavedMedia().then(hasSavedMedia => {
    if(!hasSavedMedia){
      const defaultImgs = [
        BASE_GRAPH[N.IMG1]?.inputs?.image,
        BASE_GRAPH[N.IMG2]?.inputs?.image,
        BASE_GRAPH[N.IMG3]?.inputs?.image,
        BASE_GRAPH[N.IMG4]?.inputs?.image
      ];
      defaultImgs.forEach((fn, idx) => {
        const slotIdx = idx + 1;
        if(fn && !mediaSlots[slotIdx].file && !mediaSlots[slotIdx].dataUrl){
          mediaSlots[slotIdx].uploaded = { name: fn, subfolder: "", type: "input" };
          mediaSlots[slotIdx].name = fn;
          const url = server() + `/view?filename=${encodeURIComponent(fn)}&type=input`;
          const img = $(`previewSlotImg${slotIdx}`);
          const ph = $(`phImg${slotIdx}`);
          const info = $(`infoImg${slotIdx}`);
          if(img){
            img.src = url;
            img.style.display = "block";
            img.onload = () => {
              if(slotIdx === 1) updateCalculatedResolution(img.naturalWidth, img.naturalHeight);
              if(info) info.textContent = `${img.naturalWidth}x${img.naturalHeight} · ${fn.slice(0, 25)}…`;
            };
          }
          if(ph) ph.style.display = "none";
        }
      });
    } else {
      log("💾 Sesión anterior restaurada (ajustes y medios guardados)", "l-ok");
    }
    const img1 = $("previewSlotImg1");
    if(img1 && img1.naturalWidth) updateCalculatedResolution(img1.naturalWidth, img1.naturalHeight);
    else updateCalculatedResolution(1280, 720);
  });

  updateDurationFrames();
  loadVideoHistory();
  updateQueueUI();
  setTimeout(() => { isInitializing = false; }, 800);
});
