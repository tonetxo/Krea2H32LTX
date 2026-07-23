// ltxv.js — LTXV-specific JavaScript.
// Injected AFTER common.js. CONFIG must be defined before initCommon().

const CONFIG = {
  PROMPTS_KEY: 'ltxv_prompts',
  LORA_STATE_KEY: 'ltxv_loras_state',
  ENHANCER_SYSKEY: 'ltxv_enhancer_sysprompts',
  SERVERURL_KEY: 'ltxv_serverUrl',
  DEFAULT_BACKEND_PORT: "7821",
  UI_TYPE: "ltxv",
  DEFAULT_MODEL: "10Eros_v1.4_bf16.safetensors",
  N: {IMAGE:"917",PROMPT:"536",SEED:"524",WIDTH:"791",HEIGHT:"792",FRAMES:"796",FIDELITY:"797",MOTION:"915",LORA:"853",FINAL_SAVE:"920",PURGE_VRAM:"925",FIRST_SAVE:"923",CHECKPOINT:"646",CREATE_VIDEO_1:"922",CREATE_VIDEO_2:"919",SAMPLER_1:"888",SAMPLER_2:"891",LATENT_UPSAMPLER:"744",IMG2VIDEO_2:"770",RTX_SR:"921",REFERENCE_1:"860",REFERENCE_2:"870",SAGE_PATCH:"1001",RAW_PROMPT:"1002",LTX2_PROMPT:"1003",LTX2_PREVIEW:"1004",FIRST_SIGMAS:"914",LTXAV_TEXT_ENCODER:"616"},
  loras: [{on:true, lora:"", strength:1},{on:false, lora:"", strength:0.15},{on:false, lora:"", strength:0.65}],
  ENHANCER_DEFAULT_PROMPTS: {
    text: {
      A: { name: "Estilo A (cinematográfico)", prompt: "You are an expert in prompts for LTXV video generation. Transform the user's idea into a detailed cinematic prompt. Include: shot type, lighting, camera movement, atmosphere, colors, and visual style. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt, no explanations or prefaces." },
      B: { name: "Estilo B (narrativo)", prompt: "You are a creative assistant specialized in visual storytelling. Take the user's idea and turn it into an evocative prompt that captures the essence of the scene. Use descriptive, poetic language. Focus on atmosphere, emotions, and the story the image tells. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
    },
    vision: {
      A: { name: "Estilo A (descriptivo)", prompt: "You are an expert at describing images for video generation. Analyze the provided image and generate a detailed prompt describing: composition, subjects, background, lighting, colors, motion, and atmosphere. The prompt must be suitable for a text-to-video model. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
      B: { name: "Estilo B (cinematográfico)", prompt: "You are a digital cinematographer. Look at the image and turn it into a cinematic description. Describe how the camera would move, how lighting would evolve, what action would unfold, and how the scene would change over time. Think in terms of footage, not a still photo. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
    },
  },
};

const N = CONFIG.N;
initCommon();

let uploadedImage=null, localFile=null, seedMode="random";
let currentAspectRatio = 16/9;
let currentMedia = {};
let generationStep = 0;
let dmdBypass = false;
const DMD_LORA_NODE = "906";
const DMD_MODEL_SOURCE = "868";
let firstPromptId = null;
const SAGE_TYPES = ["auto","sageattn","sageattn2","sageattn3","sageattn_qk"];
const LTX2_CHAIN_OFF = "off";
const LTX2_CHAIN_OLLAMA = "ollama";
const LTX2_CHAIN_LTX2 = "ltx2";
const LTX2_CHAIN_BOTH = "both";
let finalVariantIndex = null;
let promptSteps = {};
const BITDEPTH_KEY = "ltxv_bit_depth";
// Exposed for common.js WS error handler.
window.currentBatchMode = false;
// Cola de jobs pendientes.
let jobQueue = [];
let activeJob = null;

function getBitDepth(){
  return ($("segBitDepth10")?.classList.contains("on") ? 10 : 8);
}
function setBitDepthUI(value){
  const eight = $("segBitDepth8");
  const ten = $("segBitDepth10");
  if(!eight || !ten) return;
  if(value === 10){ ten.classList.add("on"); eight.classList.remove("on"); }
  else { eight.classList.add("on"); ten.classList.remove("on"); }
}
function saveBitDepth(value){
  try { localStorage.setItem(BITDEPTH_KEY, String(value)); } catch(_){}
}
function loadBitDepth(){
  try { return parseInt(localStorage.getItem(BITDEPTH_KEY) || "8", 10); } catch(_){ return 8; }
}
setBitDepthUI(loadBitDepth());
$("segBitDepth8")?.addEventListener("click", () => { setBitDepthUI(8); saveBitDepth(8); });
$("segBitDepth10")?.addEventListener("click", () => { setBitDepthUI(10); saveBitDepth(10); });

// --- CALLBACKS FOR common.js ---
CONFIG.findMedia = function(nodeOutput){
  for(const k of["videos","gifs","images"]) if(nodeOutput[k]?.length) return nodeOutput[k][nodeOutput[k].length-1];
  return null;
};
CONFIG.showMedia = showVideo;
CONFIG.addToVariantGallery = addToVariantGallery;
CONFIG.renderVariantMedia = function(card, url, media){
  return `<video src="${url}" crossorigin="anonymous" controls muted preload="metadata" playsinline></video>`;
};
// Metadata para el tooltip de la variant-card: captura los sliders/LoRAs en el
// momento de crear la tarjeta (no al hacer hover, que podría haber cambiado).
  CONFIG.variantMeta = function(){
  const rows = [
    ["Modelo", $("modelSelect")?.value || ""],
    ["Sage", $("sageAttentionType")?.value || "sageattn"],
    ["Cadena", $("enhancerChainMode")?.value || "off"],
    ["Resolución", `${$("width")?.value || ""}×${$("height")?.value || ""}`],
    ["Frames", $("frames")?.value || ""],
    ["Fidelidad", parseFloat($("fidelitySlider")?.value || 0).toFixed(2)],
    ["Movimiento", parseFloat($("motionSlider")?.value || 0).toFixed(1)],
  ];
  const loraList = (typeof loras !== "undefined" && Array.isArray(loras)) ? loras : [];
  const lorasMeta = loraList.map(l => ({
    name: l.lora ? l.lora.replace(/^.*\//, "") : "",
    strength: l.strength != null ? Number(l.strength).toFixed(2) : null,
    on: !!l.on,
  }));
  return { title: "Parámetros LTXV", rows, loras: lorasMeta };
};
CONFIG.onSeedUpdate = updateSeedUI;
CONFIG.onPromptError = function(pid){
  delete promptSteps[pid];
  if(generationStep === 1) generationStep = 0;
  finishCurrentJob();
};
CONFIG.startNextVariant = function(index){
  // LTXV gestiona sus propios pasos; este callback solo se usa por common.js
  // en caso de error o borde. Empezamos siempre en paso 1.
  generationStep = 1;
  firstPromptId = null;
  finalVariantIndex = null;
  runSingleGeneration(index);
};
CONFIG.onBatchComplete = function(){
  // LTXV gestiona el fin del job vía displayResult/finishCurrentJob.
  if(jobQueue.length === 0 && !activeJob){
    $("btnFirstPass").disabled=false;
    $("btnFull").disabled=false;
    enableStopButtons(false);
  }
};
CONFIG.onStopCurrent = function(pid){
  delete promptSteps[pid];
  if(generationStep === 1){
    generationStep = 0;
    if(firstPromptId) handledPrompts.add(firstPromptId);
  }
  finishCurrentJob();
};
CONFIG.onStopAll = function(){
  for(const pid of Object.keys(pendingSeeds)) handledPrompts.add(pid);
  if(currentPromptId) handledPrompts.add(currentPromptId);
  if(firstPromptId) handledPrompts.add(firstPromptId);
  for(const pid of Object.keys(pendingSeeds)) discardTimer(pid);
  pendingSeeds = {};
  promptSteps = {};
  processingPrompts.clear();
  currentPromptId = null;
  firstPromptId = null;
  generationStep = 0;
  // Vaciar cola pendiente al parar todo.
  jobQueue = [];
  updateQueueUI();
  activeJob = null;
  enableStopButtons(false);
  $("btnFirstPass").disabled=false;
  $("btnFull").disabled=false;
};

// --- LTXV displayResult callback (handles step 1 -> step 2 logic) ---
CONFIG.displayResult = async function(entry, realSeed, tTotal, promptId){
  function paint(slot, label, value){
    const el = $("time"+slot);
    if(!el) return;
    if(value == null){
      el.textContent = "";
      el.classList.remove("live");
    } else {
      el.textContent = label ? `⏱ ${label} ${value}` : `⏱ ${value}`;
      el.classList.remove("live");
    }
  }

  const step = promptSteps[promptId] || "1";
  const isStep1 = (step === "1");
  const media1 = entry.outputs[N.FIRST_SAVE] ? CONFIG.findMedia(entry.outputs[N.FIRST_SAVE]) : null;
  const media2 = entry.outputs[N.FINAL_SAVE] ? CONFIG.findMedia(entry.outputs[N.FINAL_SAVE]) : null;

  // Mostrar el prompt final generado por LTX2 si está disponible
  try {
    const ltx2Preview = entry.outputs[N.LTX2_PREVIEW];
    if(ltx2Preview && ltx2Preview.text?.length){
      const finalText = ltx2Preview.text[ltx2Preview.text.length - 1];
      if(typeof finalText === "string" && finalText.trim()){
        $("enhancerOutput").value = finalText.trim();
        log(`✏️ Prompt final LTX2 (slot ${step}): ${finalText.trim().slice(0,120)}...`, "l-ok");
      }
    }
  } catch(_){}

  // LTXV gestiona su propio flujo de pasos; devolvemos true para que common.js
  // no incremente currentBatchIndex ni llame processNextBatch.
  const job = activeJob;
  const firstPassOnly = job ? job.firstPassOnly : true;
  const varIndex = (job && job.currentVariantIndex != null) ? job.currentVariantIndex : (variantCounter + 1);

  if(isStep1){
    if(media1){
      showVideo(1, media1, { variantIndex: varIndex });
      paint(1, "1er", tTotal || "—");
      addToVariantGallery(media1, realSeed, tTotal || "", 1, varIndex);
    }
  } else {
    if(media2){
      showVideo(2, media2, { variantIndex: varIndex });
      paint(2, "final", tTotal || "—");
      addToVariantGallery(media2, realSeed, tTotal || "", 2, varIndex);
    }
  }

  delete promptSteps[promptId];

  // En modo completo "full" (1er + final en un solo grafo) el paso 1 no inicia
  // un segundo prompt; el mismo grafo genera ambos videos. Aquí sólo marcamos
  // que ya no estamos en paso 1 y dejamos que la ejecución continúe.
  if(isStep1 && !firstPassOnly){
    log(`➡️ Paso 1 completado dentro del grafo completo, esperando paso 2...`, "l-ok");
    generationStep = 2;
    delete pendingSeeds[promptId];
    handledPrompts.add(promptId);
    return true;
  }

  // Fin de un flujo completo (paso 1 en modo solo-1er-pase, o paso 2 en modo completo).
  delete pendingSeeds[promptId];
  generationStep = 0;
  firstPromptId = null;
  finalVariantIndex = null;
  handledPrompts.add(promptId);

  // Avanzamos al siguiente flujo del job actual, o terminamos el job.
  currentBatchIndex++;
  if(job) job.currentVariantIndex = null;
  if(currentBatchIndex < totalBatchSize){
    log(`➡️ Iniciando flujo ${currentBatchIndex + 1}/${totalBatchSize} del job...`, "l-ok");
    await runSingleGeneration(currentBatchIndex);
  } else {
    log(`🏁 Job completado (${totalBatchSize} flujo(s)).`, "l-ok");
    finishCurrentJob();
  }
  return true;
};

// --- RESOLUCIÓN ---
function nearest32(v){ return Math.round(v / 32) * 32; }

  function recalcResolution(){
  const mp = parseFloat($("mpSlider").value) || 0.9;
  const totalPx = mp * 1_000_000;
  let w = nearest32(Math.sqrt(totalPx * currentAspectRatio));
  let h = nearest32(Math.sqrt(totalPx / currentAspectRatio));
  h = nearest32(w / currentAspectRatio);
  if(h < 256) h = 256;
  if(w < 256) w = 256;
  $("width").value = w;
  $("height").value = h;
  $("mpVal").textContent = mp.toFixed(2);
}

function updateQueueUI(){
  const count = jobQueue.length;
  const el = $("queueCount");
  const hint = $("queueHint");
  const clearBtn = $("btnClearQueue");
  if(el) el.textContent = `Cola: ${count}`;
  if(hint) hint.textContent = count > 0 ? `${count} job(s) esperando` : "";
  if(clearBtn) clearBtn.disabled = count === 0;
}

function snapshotJob(firstPassOnly){
  // Captura de todos los parámetros necesarios para reproducir el job más tarde.
  return {
    firstPassOnly: !!firstPassOnly,
    prompt: $("prompt").value,
    seedMode,
    seedValue: parseInt($("seedVal").value || "12345", 10),
    width: parseInt($("width").value, 10),
    height: parseInt($("height").value, 10),
    frames: parseInt($("frames").value, 10),
    mp: $("mpSlider").value,
    fidelity: $("fidelitySlider").value,
    motion: $("motionSlider").value,
    firstPassSteps: $("firstPassSteps")?.value || "10",
    model: $("modelSelect")?.value,
    sageType: $("sageAttentionType")?.value,
    bitDepth: getBitDepth(),
    loras: JSON.parse(JSON.stringify(loras)),
    dmdBypass: !!dmdBypass,
    chainMode: $("enhancerChainMode")?.value,
    ltx2Temperature: $("ltx2Temperature")?.value,
    ltx2Seed: $("ltx2Seed")?.value,
    batchSize: parseInt($("batchSize")?.value || "1", 10),
    uploadedImage: uploadedImage ? {...uploadedImage} : null,
    localFile: localFile,
    aspectRatio: currentAspectRatio,
    createdAt: Date.now(),
  };
}

function restoreJob(job){
  $("prompt").value = job.prompt || "";
  seedMode = job.seedMode || "random";
  if(seedMode === "random"){
    $("segRandom")?.classList.add("on");
    $("segFixed")?.classList.remove("on");
    $("seedVal").disabled = true;
  } else {
    $("segFixed")?.classList.add("on");
    $("segRandom")?.classList.remove("on");
    $("seedVal").disabled = false;
    $("seedVal").value = job.seedValue;
  }
  $("width").value = job.width;
  $("height").value = job.height;
  $("frames").value = job.frames;
  $("mpSlider").value = job.mp;
  $("mpVal").textContent = parseFloat(job.mp).toFixed(2);
  $("fidelitySlider").value = job.fidelity;
  $("fidelityVal").textContent = parseFloat(job.fidelity).toFixed(2);
  $("motionSlider").value = job.motion;
  $("motionVal").textContent = parseFloat(job.motion).toFixed(1);
  $("firstPassSteps").value = job.firstPassSteps;
  $("firstPassStepsVal").textContent = job.firstPassSteps;
  if($("modelSelect") && job.model) $("modelSelect").value = job.model;
  if($("sageAttentionType") && job.sageType) $("sageAttentionType").value = job.sageType;
  setBitDepthUI(job.bitDepth);
  saveBitDepth(job.bitDepth);
  loras = job.loras || loras;
  renderLoras();
  saveLoraState();
  dmdBypass = !!job.dmdBypass;
  $("dmdBypassSwitch")?.classList.toggle("on", !dmdBypass);
  if($("enhancerChainMode") && job.chainMode) $("enhancerChainMode").value = job.chainMode;
  if($("ltx2Temperature") && job.ltx2Temperature) $("ltx2Temperature").value = job.ltx2Temperature;
  if($("ltx2Seed") && job.ltx2Seed) $("ltx2Seed").value = job.ltx2Seed;
  $("batchSize").value = job.batchSize;
  uploadedImage = job.uploadedImage;
  localFile = job.localFile;
  currentAspectRatio = job.aspectRatio || (job.width / job.height) || 16/9;
  if(uploadedImage || localFile){
    // Si hay imagen local, mostramos vista previa si es posible; en caso contrario el job la resubirá.
    if(localFile){
      const reader = new FileReader();
      reader.onload = (e) => showInputImage(e.target.result);
      reader.readAsDataURL(localFile);
    }
  }
  updateDuration();
}

// --- CHAIN ---
function setChainActive(keys){document.querySelectorAll(".chain .node").forEach(n=>n.classList.toggle("active",keys.includes(n.dataset.n)));}

// --- UPDATE SEED UI ---
function updateSeedUI(seedValue) {
    $("seedVal").value = seedValue;
    $("seedVal").classList.remove("seed-updated");
    void $("seedVal").offsetWidth;
    $("seedVal").classList.add("seed-updated");
    if(totalBatchSize <= 1) {
        seedMode = "fixed";
        $("segFixed").classList.add("on");
        $("segRandom").classList.remove("on");
        $("seedVal").disabled = false;
    }
}

// --- EXTRACCIÓN DE WORKFLOW DESDE METADATOS MP4 ---
// Busca el workflow embebido en el MP4 sin decodificar el archivo entero a string
// (que para vídeos de cientos de MB dispararía la memoria). Escanea el Uint8Array
// buscando el marcador ASCII '"prompt": {' o '{"<digitos>":\s*{', y a partir de ahí
// decodifica en streaming con TextDecoder y brace-matching incremental.
async function extractWorkflowFromMP4Buffer(arrayBuffer){
  const bytes = new Uint8Array(arrayBuffer);
  let startIdx = -1;

  // 1) Buscar el marcador '"prompt": {' (12 bytes ASCII). La última '{' del
  //    marcador ES la llave de apertura del objeto prompt; empezamos ahí.
  //    (Antes buscábamos la SIGUIENTE '{', que es la del primer nodo interno,
  //    y parseábamos solo ese nodo en lugar del grafo completo.)
  const marker = new TextEncoder().encode('"prompt": {');
  outer: for(let i = 0; i <= bytes.length - marker.length; i++){
    for(let j = 0; j < marker.length; j++){
      if(bytes[i + j] !== marker[j]) continue outer;
    }
    startIdx = i + marker.length - 1; // última '{' del marcador
    break;
  }

  // 2) Si no aparece, buscamos el patrón '{"<digitos>":\s*{' (comienzo típico del
  //    objeto "prompt" de ComfyUI cuando el primer nodo es numérico). La '{'
  //    inicial (antes de '"') es la apertura del objeto prompt.
  if(startIdx < 0){
    for(let i = 0; i < bytes.length - 4; i++){
      if(bytes[i] !== 0x7B || bytes[i+1] !== 0x22) continue; // '{"'
      let j = i + 2;
      while(j < bytes.length && bytes[j] >= 0x30 && bytes[j] <= 0x39) j++; // dígitos
      if(j === i + 2) continue; // no había dígitos
      if(bytes[j] !== 0x22) continue; // cierre de comillas '"'
      let k = j + 1;
      while(k < bytes.length && (bytes[k] === 0x20 || bytes[k] === 0x09 || bytes[k] === 0x0A || bytes[k] === 0x0D)) k++; // ws
      if(bytes[k] === 0x3A){ // ':'
        let m = k + 1;
        while(m < bytes.length && (bytes[m] === 0x20 || bytes[m] === 0x09 || bytes[m] === 0x0A || bytes[m] === 0x0D)) m++;
        if(bytes[m] === 0x7B){ startIdx = i; break; } // la '{' exterior abre el prompt
      }
    }
  }

  if(startIdx < 0) return null;

  // 3) Brace-matching incremental decodificando en streaming. Sólo conservamos
  //    en memoria el fragmento desde startIdx hasta el cierre del objeto (típicamente
  //    unas pocas decenas de KB en lugar de todo el MP4).
  const decoder = new TextDecoder("latin1");
  let depth = 0, inString = false, escape = false;
  let collected = "";
  const CHUNK = 65536;
  for(let pos = startIdx; pos < bytes.length; pos += CHUNK){
    const slice = bytes.subarray(pos, Math.min(pos + CHUNK, bytes.length));
    const piece = decoder.decode(slice, { stream: true });
    for(let i = 0; i < piece.length; i++){
      const c = piece[i];
      collected += c;
      if(inString){
        if(escape){ escape = false; }
        else if(c === '\\'){ escape = true; }
        else if(c === '"'){ inString = false; }
      } else {
        if(c === '"'){ inString = true; }
        else if(c === '{'){ depth++; }
        else if(c === '}'){ depth--; if(depth === 0){
          try { return JSON.parse(collected); }
          catch(e){ console.warn("No se pudo parsear workflow del MP4:", e.message); return null; }
        } }
      }
    }
  }
  // Si llegamos al final sin cerrar el objeto, no hay workflow válido.
  decoder.decode();
  return null;
}

async function extractWorkflowFromMP4(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error("HTTP "+r.status);
  return extractWorkflowFromMP4Buffer(await r.arrayBuffer());
}

// --- KREA2 RECENT IMAGES PANEL ---
$("krea2RecentToggle").addEventListener("click", () => {
  const h = $("krea2RecentToggle");
  const b = $("krea2RecentBody");
  const isOpen = h.classList.toggle("open");
  b.classList.toggle("open", isOpen);
  h.querySelector(".arrow").textContent = isOpen ? "▼" : "▶";
  if(isOpen && !$("krea2RecentGrid").dataset.loaded) loadKrea2Recent();
});

async function loadKrea2Recent(){
  const grid = $("krea2RecentGrid");
  const status = $("krea2RecentStatus");
  status.textContent = "Cargando...";
  try {
    const r = await fetch("/api/krea2_list");
    if(!r.ok) throw new Error("HTTP "+r.status);
    const data = await r.json();
    const items = data.items || [];
    grid.innerHTML = "";
    if(items.length === 0){
      status.textContent = "Sin imágenes en "+data.dir+". Genera alguna en Krea2 primero.";
      return;
    }
    status.textContent = `${items.length} imagen(es) (${data.dir}):`;
    for(const it of items){
      const url = `${server()}/view?filename=${encodeURIComponent(it.filename)}&subfolder=${encodeURIComponent(it.subfolder)}&type=${encodeURIComponent(it.type)}&t=${it.mtime}`;
      const ts = new Date(it.mtime*1000);
      const tsTxt = ts.toLocaleString();
      const sizeKB = Math.round(it.size/1024);
      const div = document.createElement("div");
      div.className = "gallery-item";
      div.innerHTML = `<img src="${url}" loading="lazy" referrerpolicy="no-referrer"><div class="info-tag">${tsTxt} · ${sizeKB}KB</div>`;
      div.addEventListener("click", () => loadKrea2ImageAsInput(url, it.filename));
      grid.appendChild(div);
    }
    grid.dataset.loaded = "1";
  } catch(e){
    status.textContent = "Error cargando: "+e.message;
  }
}

async function loadKrea2ImageAsInput(url, filename){
  try {
    log("⏳ Descargando "+filename+" desde Krea2...", "l-info");
    const r = await fetch(url);
    if(!r.ok) throw new Error("HTTP "+r.status);
    const blob = await r.blob();
    const file = new File([blob], filename, {type: blob.type || "image/png"});
    handleFile(file, true);
    log("✅ Imagen Krea2 cargada: "+filename, "l-ok");
  } catch(e){
    log("❌ No se pudo cargar la imagen Krea2: "+e.message, "l-err");
  }
}

(function maybeLoadFromQuery(){
  const qs = new URLSearchParams(window.location.search);
  const ref = qs.get("ref");
  if(!ref) return;
  const rawName = decodeURIComponent(ref);
  const filename = rawName.replace(/^.*\//, "");
  const subfolder = (rawName.includes("/") && rawName.split("/").slice(0,-1).join("/")) || "krea2";
  const h = $("krea2RecentToggle");
  const b = $("krea2RecentBody");
  if(h && b && !h.classList.contains("open")){
    h.classList.add("open");
    b.classList.add("open");
    const arr = h.querySelector(".arrow"); if(arr) arr.textContent = "▼";
  }
  (async () => {
    loadKrea2Recent().catch(()=>{});
    const tryLoad = async (sf) => {
      const url = `/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(sf)}&type=${encodeURIComponent("output")}`;
      log("⏳ Cargando imagen Krea2 como entrada: "+filename+" (subfolder="+sf+")", "l-info");
      const r = await fetch(url);
      if(!r.ok) throw new Error("HTTP "+r.status);
      const blob = await r.blob();
      if(blob.size === 0) throw new Error("respuesta vacía");
      const file = new File([blob], filename, { type: blob.type || "image/png" });
      handleFile(file, true);
      log("✅ Imagen Krea2 cargada como entrada: "+filename, "l-ok");
    };
    try {
      await tryLoad(subfolder);
    } catch(e1){
      try {
        await tryLoad("");
      } catch(e2){
        log("⚠️ La imagen '"+filename+"' no se pudo cargar desde Krea2: "+e2.message, "l-err");
      }
    }
  })();
})();

// --- EXTRACCIÓN Y APLICACIÓN DE WORKFLOW DESDE METADATOS PNG/MP4 ---
function extractWorkflowFromImage(url){
  fetch(url).then(r => r.arrayBuffer()).then(buf => {
    const bytes = new Uint8Array(buf);
    if(bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return;
    let pos = 8;
    let workflowRaw = null;
    while(pos < bytes.length - 8){
      const len = (bytes[pos] << 24) | (bytes[pos+1] << 16) | (bytes[pos+2] << 8) | bytes[pos+3];
      const type = String.fromCharCode(bytes[pos+4], bytes[pos+5], bytes[pos+6], bytes[pos+7]);
      if(type === "tEXt"){
        const dataStart = pos + 8;
        let nullPos = dataStart;
        while(nullPos < dataStart + len && bytes[nullPos] !== 0) nullPos++;
        const keyword = new TextDecoder("latin1").decode(bytes.slice(dataStart, nullPos));
        if(keyword === "prompt"){
          workflowRaw = new TextDecoder("utf-8").decode(bytes.slice(nullPos + 1, dataStart + len));
          break;
        }
      }
      if(type === "IEND") break;
      pos = pos + 12 + len;
    }
    if(workflowRaw == null) return;
    let workflow;
    try {
      workflow = JSON.parse(workflowRaw);
    } catch(e1){
      const first = workflowRaw.indexOf("{");
      const last = workflowRaw.lastIndexOf("}");
      if(first !== -1 && last > first){
        try { workflow = JSON.parse(workflowRaw.slice(first, last + 1)); }
        catch(e2){ console.warn("No se pudo parsear workflow de metadatos:", e2.message); return; }
      } else {
        console.warn("No se pudo parsear workflow de metadatos:", e1.message);
        return;
      }
    }
    applyWorkflow(workflow);
  }).catch(e => console.warn("No se pudo leer metadatos:", e.message));
}

function applyWorkflow(workflow, opts={}){
  const applied = [];
  const missing = [];
  const setApplied = (label) => applied.push(label);
  const setMissing = (label) => missing.push(label);

  function findByClass(gt){
    for(const k of Object.keys(workflow)){
      if(workflow[k] && workflow[k].class_type === gt) return workflow[k];
    }
    return null;
  }
  function findAllByClass(gt){
    const out = [];
    for(const k of Object.keys(workflow)){
      if(workflow[k] && workflow[k].class_type === gt) out.push({id: k, node: workflow[k]});
    }
    return out;
  }

  const textEncoders = findAllByClass("CLIPTextEncode");
  function isNegativePrompt(t){
    if(typeof t !== "string") return false;
    const startsNeg = /^\s*(blurry|low quality|distorted|ugly|watermark|worst|overexposed|underexposed|grainy|noise|out of focus|deformed|jpeg|nsfw|mutation|cropped)/i.test(t);
    const manyNegWords = (t.match(/\b(blurry|low quality|distorted|ugly|watermark|worst|overexposed|underexposed|grainy|deformed|mutation|artifacts)\b/gi) || []).length >= 3;
    return startsNeg || manyNegWords;
  }
  let promptSet = false;
  for(const {node} of textEncoders){
    let t = (node.inputs && node.inputs.text) || "";
    // Si el text es una referencia de nodo (array), seguimos el enlace al nodo fuente.
    if(Array.isArray(t)){
      const srcId = String(t[0]);
      const srcNode = workflow[srcId];
      if(srcNode && srcNode.inputs && typeof srcNode.inputs.value === "string"){
        t = srcNode.inputs.value;
      } else {
        continue;
      }
    }
    if(typeof t !== "string") continue;
    if(!isNegativePrompt(t) && t.length > 50){
      // Only set from CLIPTextEncode if no raw prompt primitive already restored it
      if(!$("prompt").value.trim()) $("prompt").value = t;
      promptSet = true; break;
    }
  }
  if(!promptSet && textEncoders.length){
    let longest = null, longestText = "";
    for(const {node} of textEncoders){
      let t = node.inputs?.text || "";
      if(Array.isArray(t)){
        const srcId = String(t[0]);
        const srcNode = workflow[srcId];
        if(srcNode && srcNode.inputs && typeof srcNode.inputs.value === "string") t = srcNode.inputs.value;
        else continue;
      }
      if(typeof t === "string" && t.length > longestText.length){
        longest = node;
        longestText = t;
      }
    }
    if(!$("prompt").value.trim()) $("prompt").value = longestText;
    promptSet = !!$("prompt").value.trim();
  }
  if(promptSet || $("prompt").value.trim()) setApplied("prompt"); else setMissing("prompt");

  let modelSet = false;
  const checkpoint = findByClass("CheckpointLoaderSimple");
  if(checkpoint && checkpoint.inputs && checkpoint.inputs.ckpt_name){
    const name = checkpoint.inputs.ckpt_name;
    const sel = $("modelSelect");
    if(sel){
      for(const opt of sel.options){
        if(opt.value === name || name.endsWith("/"+opt.value) || opt.value === name.replace("ltxv/","") || opt.value === name.replace("Stable-Diffusion/","")){
          opt.selected = true; modelSet = true; break;
        }
      }
    }
  }
  if(modelSet) setApplied("modelo"); else setMissing("modelo");

  function parseFrameValue(v){
    if(typeof v === "number") return v;
    if(Array.isArray(v)) return null;
    if(typeof v === "string") return parseFloat(v) || null;
    return null;
  }
  function parseMxValue(node){
    if(!node || !node.inputs) return null;
    if(node.inputs.Xi != null) return parseFrameValue(node.inputs.Xi);
    if(node.inputs.Xf != null) return parseFrameValue(node.inputs.Xf);
    if(node.inputs.value != null) return parseFrameValue(node.inputs.value);
    return null;
  }
  function applyAspectRatio(w, h){
    if(!w || !h) return;
    currentAspectRatio = w / h;
    const mp = (w * h) / 1_000_000;
    const clamped = Math.min(Math.max(mp, parseFloat($("mpSlider").min)||0.3), parseFloat($("mpSlider").max)||2.0);
    $("mpSlider").value = clamped.toFixed(2);
    $("mpVal").textContent = $("mpSlider").value;
  }

  const mxSlidersAll = findAllByClass("mxSlider");
  let w = null, h = null, len = null, fid = null, mot = null;
  for(const {node} of mxSlidersAll){
    const title = (node._meta?.title || "").toLowerCase();
    const val = parseMxValue(node);
    if(val == null) continue;
    if(/width/i.test(title) && !/mask|crop/i.test(title)) w = val;
    else if(/height/i.test(title) && !/mask|crop/i.test(title)) h = val;
    else if(/length|frame/i.test(title) && !/rate/i.test(title)) len = val;
    else if(/fidelity|conditioning/i.test(title)) fid = val;
    else if(/motion|preprocess/i.test(title)) mot = val;
  }
  if(w == null || h == null){
    const emptyLatent = findByClass("EmptyLTXVLatentVideo");
    if(emptyLatent && emptyLatent.inputs){
      const ew = parseFrameValue(emptyLatent.inputs.width);
      const eh = parseFrameValue(emptyLatent.inputs.height);
      if(ew != null) w = ew;
      if(eh != null) h = eh;
      if(len == null) len = parseFrameValue(emptyLatent.inputs.length);
    }
  }
  if(w != null){ $("width").value = Math.round(w); setApplied("anchura"); } else setMissing("anchura");
  if(h != null){ $("height").value = Math.round(h); setApplied("altura"); } else setMissing("altura");
  if(len != null){ $("frames").value = Math.round(len); setApplied("frames"); } else setMissing("frames");
  if(fid != null){ $("fidelitySlider").value = fid; $("fidelityVal").textContent = parseFloat(fid).toFixed(2); setApplied("fidelidad"); } else setMissing("fidelidad");
  if(mot != null){ $("motionSlider").value = mot; $("motionVal").textContent = parseFloat(mot).toFixed(1); setApplied("movimiento"); } else setMissing("movimiento");
  if(w && h) applyAspectRatio(w, h);
  updateDuration();

  // Restaurar Patch Sage Attention
  const sageNode = findByClass("PathchSageAttentionKJ");
  if(sageNode && sageNode.inputs && sageNode.inputs.sage_attention && SAGE_TYPES.includes(sageNode.inputs.sage_attention)){
    $("sageAttentionType").value = sageNode.inputs.sage_attention;
    setApplied("sage attention");
  } else { setMissing("sage attention"); }

  // Restaurar TextGenerateLTX2Prompt settings
  const ltx2Node = findByClass("TextGenerateLTX2Prompt");
  if(ltx2Node && ltx2Node.inputs){
    const ltx2Temp = ltx2Node.inputs["sampling_mode.temperature"];
    const ltx2Seed = ltx2Node.inputs["sampling_mode.seed"];
    if(typeof ltx2Temp === "number"){ $("ltx2Temperature").value = ltx2Temp; $("ltx2TemperatureVal").textContent = ltx2Temp.toFixed(2); }
    if(typeof ltx2Seed === "number") $("ltx2Seed").value = ltx2Seed;
    // Cadena: si CLIPTextEncode lee del LTX2_PROMPT => activo
    const promptTextSource = workflow[N.PROMPT]?.inputs?.text;
    if(Array.isArray(promptTextSource) && promptTextSource[0] === N.LTX2_PROMPT){
      $("enhancerChainMode").value = LTX2_CHAIN_LTX2;
      setApplied("cadena LTX2");
    } else {
      $("enhancerChainMode").value = LTX2_CHAIN_OFF;
      setApplied("cadena off");
    }
  } else { setMissing("LTX2 Prompt"); }

  // Restaurar raw prompt si existe
  const rawPromptNode = findByClass("PrimitiveStringMultiline");
  if(rawPromptNode && rawPromptNode.inputs && typeof rawPromptNode.inputs.value === "string" && rawPromptNode.inputs.value.length > 0){
    $("prompt").value = rawPromptNode.inputs.value;
    setApplied("prompt raw");
  }

  const powerLora = findByClass("Power Lora Loader (rgthree)");
  if(powerLora && powerLora.inputs){
    for(let i = 0; i < 3; i++){
      const slot = ["lora_1","lora_2","lora_3"][i];
      const lora = powerLora.inputs[slot];
      if(!lora) continue;
      const loraName = lora.lora || "";
      const strength = lora.strength;
      if(loraName && loraName !== "None"){
        loras[i].lora = loraName.replace(/^ltxv\//, "");
        loras[i].on = lora.on === true;
        loras[i].strength = (strength != null) ? strength : 0;
      } else {
        loras[i].on = false;
      }
    }
    renderLoras();
    saveLoraState();
    setApplied("LoRAs");
  } else {
    setMissing("LoRAs");
  }

  let seedVal = null;
  const seedNode = findByClass("Seed (rgthree)");
  if(seedNode){
    if(typeof seedNode.inputs?.seed === "number") seedVal = seedNode.inputs.seed;
    else if(seedNode.widgets_values && typeof seedNode.widgets_values[0] === "number") seedVal = seedNode.widgets_values[0];
  }
  if(seedVal == null){
    const randomNoise = findByClass("RandomNoise");
    if(randomNoise && typeof randomNoise.inputs?.noise_seed === "number"){
      seedVal = randomNoise.inputs.noise_seed;
    }
  }
  if(seedVal != null && seedVal >= 0){
    $("seedVal").value = seedVal;
    $("segFixed").classList.add("on");
    $("segRandom").classList.remove("on");
    $("seedVal").disabled = false;
    seedMode = "fixed";
    setApplied("semilla");
  } else {
    setMissing("semilla");
  }

  const appliedMsg = applied.length ? "✅ Usados: " + applied.join(", ") : "";
  const missingMsg = missing.length ? "⚠️ Sin coincidencia: " + missing.join(", ") : "";

  // Profundidad de color
  let bitDepthSet = false;
  const createVideos = findAllByClass("CreateVideo");
  if(createVideos.length){
    const bdNode = createVideos.find(n => n.node.inputs && (n.node.inputs.bit_depth === 8 || n.node.inputs.bit_depth === 10));
    if(bdNode){
      const bd = bdNode.node.inputs.bit_depth;
      setBitDepthUI(bd);
      saveBitDepth(bd);
      bitDepthSet = true;
      setApplied("profundidad de color");
    }
  }
  if(!bitDepthSet) setMissing("profundidad de color");

  if(opts.silent) return { applied, missing };
  if(appliedMsg) log(appliedMsg, "l-ok");
  if(missingMsg) log(missingMsg, "l-warn");
  if(applied.length) log("📋 Parámetros restaurados desde metadatos.", "l-ok");
  else log("ℹ️ No se encontraron parámetros aplicables en los metadatos.", "l-warn");

  return { applied, missing };
}

// --- DROPZONE / FILE HANDLING ---
function updateDzInfo(w, h){
  const info = $("dzInfo");
  if(!info) return;
  function gcd(a,b){ return b ? gcd(b, a % b) : a; }
  const d = gcd(w, h) || 1;
  info.textContent = `${w}×${h} · ${w/d}:${h/d}`;
  if(w && h){
    currentAspectRatio = w / h;
    recalcResolution();
  }
}

$("segRandom").addEventListener("click",()=>{seedMode="random";$("segRandom").classList.add("on");$("segFixed").classList.remove("on");$("seedVal").disabled=true;});
$("segFixed").addEventListener("click",()=>{seedMode="fixed";$("segFixed").classList.add("on");$("segRandom").classList.remove("on");$("seedVal").disabled=false;});
$("fidelitySlider").addEventListener("input",(e)=>{$("fidelityVal").textContent=parseFloat(e.target.value).toFixed(2);});
$("firstPassSteps")?.addEventListener("input",(e)=>{$("firstPassStepsVal").textContent=e.target.value;});
$("motionSlider").addEventListener("input",(e)=>{$("motionVal").textContent=parseFloat(e.target.value).toFixed(1);});
$("mpSlider").addEventListener("input",()=>{recalcResolution();});
$("frames").addEventListener("input",updateDuration);
function updateDuration(){const f=parseInt($("frames").value||"0",10);$("durHint").textContent=`(${f}/24fps=${(f/24).toFixed(1)}s)`;}

// DMD bypass switch
$("dmdBypassSwitch").addEventListener("click",()=>{
  dmdBypass = !dmdBypass;
  $("dmdBypassSwitch").classList.toggle("on", !dmdBypass);
  log(dmdBypass ? "DMD LoRA desactivada" : "DMD LoRA activada", "l-ok");
});

// LTX2 temperature slider label
$("ltx2Temperature")?.addEventListener("input", (e)=>{
  $("ltx2TemperatureVal").textContent = parseFloat(e.target.value).toFixed(2);
});

// Zoom/pan/fullscreen para imagen de entrada
const inputZoom = setupZoomPan("inputWrap", "inputImg", "btnResetZoomInput", "btnFullscreenInput");

// Click en el wrap de la imagen de entrada -> abrir file dialog para reemplazar
$("inputWrap").addEventListener("click", (e) => {
  if(inputZoom.isFullscreen()) return;
  if(e.target.closest("#btnResetZoomInput") || e.target.closest("#btnFullscreenInput")) return;
  if(inputZoom.wasPan && inputZoom.wasPan()) return;
  $("fileInput").click();
});
// Drag/drop sobre el wrap también
["dragenter","dragover"].forEach(ev=>$("inputWrap").addEventListener(ev,e=>{e.preventDefault();$("dropzone").classList.add("drag");}));
["dragleave","drop"].forEach(ev=>$("inputWrap").addEventListener(ev,e=>{e.preventDefault();$("dropzone").classList.remove("drag");}));
$("inputWrap").addEventListener("drop",e=>{if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);});

const dz=$("dropzone"),fileInput=$("fileInput");
dz.addEventListener("click",()=>fileInput.click());
["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("drag");}));
["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("drag");}));
dz.addEventListener("drop",e=>{if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);});
fileInput.addEventListener("change",e=>{if(e.target.files[0])handleFile(e.target.files[0]);});

function handleFile(f, shouldSaveToGallery = true){
  console.log("[LTXV] handleFile", f.name, f.type, f.size);
  uploadedImage = null;
  localFile = null;

  const isVideo = f.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/i.test(f.name);

  if(isVideo){
    // Mostrar dropzone, ocultar wrap de imagen
    $("dropzone").style.display = "";
    $("inputWrap").style.display = "none";
    $("imgInputActions").style.display = "none";
    handleVideoFile(f, shouldSaveToGallery);
    return;
  }

  const uniqueName = `temp_${Date.now()}_${f.name}`;
  localFile = new File([f], uniqueName, {type: f.type});

  const frameSel = $("frameSelector");
  if(frameSel) frameSel.style.display = "none";

  const reader = new FileReader();
  reader.onload = (e) => {
    showInputImage(e.target.result);
    log(`🖼️ Imagen cargada: ${f.name}`, "l-ok");
  };
  reader.readAsDataURL(f);
}

function showInputImage(src){
  console.log("[LTXV] showInputImage src length:", src ? src.length : 0);
  const wrap = $("inputWrap"), img = $("inputImg"), actions = $("imgInputActions");
  if(!wrap || !img) { console.warn("[LTXV] showInputImage: wrap/img no disponible"); return; }
  img.onload = () => {
    console.log("[LTXV] inputImg loaded", img.naturalWidth, "x", img.naturalHeight);
    updateDzInfo(img.naturalWidth, img.naturalHeight);
    inputZoom.resetZoom();
  };
  img.onerror = (e) => console.error("[LTXV] inputImg error", e);
  img.src = src;
  img.style.display = "block";
  wrap.style.display = "flex";
  actions.style.display = "flex";
  const dz = $("dropzone");
  if(dz) dz.style.display = "none";
}

let currentVideoFile = null;

function handleVideoFile(file, shouldSaveToGallery = true){
  currentVideoFile = file;
  const videoUrl = URL.createObjectURL(file);
  const vid = document.createElement("video");
  vid.muted = true;
  vid.playsInline = true;
  vid.crossOrigin = "anonymous";
  vid.preload = "auto";

  const metaPromise = file.arrayBuffer().then(buf => extractWorkflowFromMP4Buffer(buf)).catch(err => {
    console.warn("Error leyendo metadatos del vídeo:", err);
    return null;
  });

  function extractFrameAt(time, callback){
    vid.currentTime = time;
    vid.addEventListener("seeked", function onSeeked(){
      vid.removeEventListener("seeked", onSeeked);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = vid.videoWidth || 640;
        canvas.height = vid.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        callback(null, dataUrl);
      } catch(err) { callback(err); }
    }, { once: true });
  }

  function setFrameAsInput(dataUrl, frameLabel){
    fetch(dataUrl).then(r => r.blob()).then(blob => {
      const frameName = `temp_${Date.now()}_${file.name.replace(/\.[^.]+$/, '')}_${frameLabel}.jpg`;
      localFile = new File([blob], frameName, {type: "image/jpeg"});

      showInputImage(dataUrl);
      log(`🎬 Vídeo cargado: ${file.name} (${frameLabel} frame como imagen de entrada)`, "l-ok");

      metaPromise.then(workflow => {
        if(workflow){
          log(`📋 Workflow encontrado en ${file.name}`, "l-ok");
          applyWorkflow(workflow);
        } else {
          log(`ℹ️ ${file.name} no contiene metadatos de workflow.`, "l-warn");
        }
      });
    });
  }

  function showFrameSelector(){
    const sel = $("frameSelector");
    sel.style.display = "flex";
    sel.querySelectorAll("button").forEach(b => b.classList.remove("active"));

    const useFirst = () => {
      sel.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      sel.querySelector('[data-frame="first"]').classList.add("active");
      extractFrameAt(0, (err, dataUrl) => {
        if(err) return log("❌ Error extrayendo 1er frame: " + err.message, "l-err");
        setFrameAsInput(dataUrl, "1er");
      });
    };

    const useLast = () => {
      sel.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      sel.querySelector('[data-frame="last"]').classList.add("active");
      const t = Math.max(0, vid.duration - 0.1);
      extractFrameAt(t, (err, dataUrl) => {
        if(err) return log("❌ Error extrayendo último frame: " + err.message, "l-err");
        setFrameAsInput(dataUrl, "último");
      });
    };

    sel.querySelector('[data-frame="first"]').onclick = useFirst;
    sel.querySelector('[data-frame="last"]').onclick = useLast;
    useFirst();
  }

  vid.addEventListener("loadedmetadata", () => {
    showFrameSelector();
    URL.revokeObjectURL(videoUrl);
  }, { once: true });

  vid.addEventListener("error", () => {
    log("❌ No se pudo reproducir el vídeo para extraer frames", "l-err");
    URL.revokeObjectURL(videoUrl);
  }, { once: true });

  vid.src = videoUrl;
}

async function ensureImageUploaded(){
  if(!localFile) throw new Error("selecciona imagen");
  setRun("busy","subiendo...");
  const fd=new FormData();
  fd.append("image", localFile, localFile.name.replace(/^temp_\d+_/, ''));
  fd.append("overwrite","true");
  const r=await fetch(server()+"/upload/image",{method:"POST",body:fd});
  if(!r.ok) throw new Error("fallo subida");
  const data=await r.json();
  uploadedImage={name:data.name, subfolder:data.subfolder||"", type:data.type||"input"};
  log("Imagen subida al servidor: "+uploadedImage.name,"l-ok");
}

function buildGraph(mode){
  // mode: "first" | "second" | "full"
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
  if(g[N.CHECKPOINT] && g[N.CHECKPOINT].inputs) g[N.CHECKPOINT].inputs.ckpt_name = $("modelSelect").value;
  const bitDepth = getBitDepth();
  if(g[N.CREATE_VIDEO_1] && g[N.CREATE_VIDEO_1].inputs) g[N.CREATE_VIDEO_1].inputs.bit_depth = bitDepth;
  if(g[N.CREATE_VIDEO_2] && g[N.CREATE_VIDEO_2].inputs) g[N.CREATE_VIDEO_2].inputs.bit_depth = bitDepth;

  // Patch Sage Attention: tipo configurable, siempre activo
  const sageType = $("sageAttentionType")?.value || "sageattn";
  if(g[N.SAGE_PATCH] && g[N.SAGE_PATCH].inputs) g[N.SAGE_PATCH].inputs.sage_attention = sageType;

  // Steps del primer pase: regenerar sigmas interpolando desde la curva base 10-step
  const firstSteps = parseInt($("firstPassSteps")?.value || 10, 10);
  if(g[N.FIRST_SIGMAS] && g[N.FIRST_SIGMAS].inputs){
    g[N.FIRST_SIGMAS].inputs.sigmas = buildFirstPassSigmas(firstSteps);
  }

  // Cadena de mejora: se rellena el raw prompt siempre
  const rawPrompt = $("prompt").value.trim();
  if(g[N.RAW_PROMPT] && g[N.RAW_PROMPT].inputs) g[N.RAW_PROMPT].inputs.value = rawPrompt;

  // Configurar nodo TextGenerateLTX2Prompt (siempre presente en el grafo)
  if(g[N.LTX2_PROMPT] && g[N.LTX2_PROMPT].inputs){
    g[N.LTX2_PROMPT].inputs["sampling_mode.temperature"] = parseFloat($("ltx2Temperature")?.value || 0.7);
    g[N.LTX2_PROMPT].inputs["sampling_mode.seed"] = parseInt($("ltx2Seed")?.value || 2, 10);
  }

  const chainMode = $("enhancerChainMode")?.value || "off";
  // Si la cadena es LTX2 o Ambos, CLIPTextEncode lee del nodo Generate LTX2 Prompt;
  // si es off u Ollama, lee directamente del raw prompt (Ollama ya ha actualizado el textbox).
  if(g[N.PROMPT] && g[N.PROMPT].inputs){
    if(chainMode === LTX2_CHAIN_LTX2 || chainMode === LTX2_CHAIN_BOTH){
      g[N.PROMPT].inputs.text = [N.LTX2_PROMPT, 0];
    } else {
      g[N.PROMPT].inputs.text = [N.RAW_PROMPT, 0];
    }
  }

  // Si la cadena está desactivada u Ollama, el nodo LTX2 no está conectado a nada útil,
  // así que lo desconectamos explícitamente para que ComfyUI no lo ejecute.
  if(chainMode === LTX2_CHAIN_OFF || chainMode === LTX2_CHAIN_OLLAMA){
    if(g[N.LTX2_PROMPT] && g[N.LTX2_PROMPT].inputs){
      // Marcamos el prompt de entrada vacío y desconectamos el clip para evitar que el nodo corra.
      g[N.LTX2_PROMPT].inputs.prompt = "";
      if(g[N.LTX2_PREVIEW] && g[N.LTX2_PREVIEW].inputs){
        delete g[N.LTX2_PREVIEW];
      }
    }
  }

  // DMD bypass: saltar el nodo LoraLoaderModelOnly (906) y conectar directamente al modelo fuente (868)
  if(dmdBypass && g[N.LORA] && g[N.LORA].inputs.model){
    g[N.LORA].inputs.model = [DMD_MODEL_SOURCE, 0];
  }

  if(mode === "first"){
    // Solo 1er pase: el sampler 888 genera el preview y lo guarda en 923.
    delete g[N.FINAL_SAVE];
    delete g[N.PURGE_VRAM];
    // Desconectar la rama del segundo sampler para que no se ejecute.
    if(g[N.SAMPLER_2]) delete g[N.SAMPLER_2]; // 891
    if(g[N.LATENT_UPSAMPLER]) delete g[N.LATENT_UPSAMPLER]; // 744
    if(g[N.IMG2VIDEO_2]) delete g[N.IMG2VIDEO_2]; // 770
    if(g[N.RTX_SR]) delete g[N.RTX_SR]; // 921
    if(g[N.CREATE_VIDEO_2]) delete g[N.CREATE_VIDEO_2]; // 919
    if(g[N.REFERENCE_2]) delete g[N.REFERENCE_2]; // 870
  }
  else if(mode === "second"){
    delete g[N.FIRST_SAVE];
    // Desconectar la rama del primer sampler; el segundo reutiliza el resultado
    // del primero a través del grafo del backend si se envía junto.
    if(g[N.SAMPLER_1]) delete g[N.SAMPLER_1]; // 888
    if(g[N.CREATE_VIDEO_1]) delete g[N.CREATE_VIDEO_1]; // 922
    if(g[N.REFERENCE_1]) delete g[N.REFERENCE_1]; // 860
  }
  else if(mode === "ltx2preview"){
    // Grafo mnimo solo para generar el prompt con TextGenerateLTX2Prompt.
    // Preservamos la cadena de modelo real (checkpoint + sage + reference enable)
    // para que el PowerLoraLoader aplique las LoRAs sobre el mismo contexto
    // que en la generacin completa.
    for(const k of Object.keys(g)){
      const keep = [
        N.CHECKPOINT, N.SAGE_PATCH, N.LORA, N.LTX2_PROMPT, N.LTX2_PREVIEW,
        N.RAW_PROMPT, N.LTXAV_TEXT_ENCODER
      ];
      if(!keep.includes(k)) delete g[k];
    }
    // Reconstruir la cadena de modelo: 646 -> 1001 -> 924 -> 868 -> 853.model
    // (igual que en el grafo completo, sin el LoRA DMD opcional 906).
    if(g[N.SAGE_PATCH] && g[N.CHECKPOINT]){
      g[N.SAGE_PATCH].inputs.model = [N.CHECKPOINT, 0];
    }
    if(g[N.LORA]){
      // El PowerLoraLoader espera un modelo; conectamos a la salida del checkpoint.
      // Las LoRAs de texto s se aplican sobre el clip proveniente del text encoder.
      g[N.LORA].inputs.model = [N.CHECKPOINT, 0];
    }
    // Asegurar que el nodo preview recibe el texto generado.
    if(g[N.LTX2_PREVIEW] && g[N.LTX2_PROMPT]){
      g[N.LTX2_PREVIEW].inputs.source = [N.LTX2_PROMPT, 0];
    }
  }
  // mode "full" mantiene ambos save nodes para ejecutar 1er pase + final de una vez.
  return g;
}

function showVideo(slot, media, options={}){
  if(!media) return;
  const url=`${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder||"")}&type=${encodeURIComponent(media.type||"output")}#t=0.1`;
  const v=$("video"+slot), empty=$("empty"+slot), badge=$("badge"+slot), btn=$("btnLoadMeta"+slot), dl=$("btnDownload"+slot), sf=$("btnSaveFrame"+slot);
  v.crossOrigin = "anonymous";
  v.src = url;
  v.load();
  v.style.display = "block";
  empty.style.display = "none";
  v.play().catch(err => console.log("Autoplay blocked:", err));
  if(btn) btn.disabled = false;
  if(dl) dl.style.display="inline-flex";
  if(sf) sf.style.display="inline-flex";
  currentMedia[slot] = { filename: media.filename, subfolder: media.subfolder||"", type: media.type||"output" };
  if(badge){
    const varIndex = options.variantIndex != null ? options.variantIndex : (currentBatchIndex + 1);
    const typeLabel = slot === 1 ? "1er" : "final";
    badge.textContent = `Var ${varIndex} · ${typeLabel}`;
  }
  const resEl=$("res"+slot);
  if(resEl){
    resEl.textContent="";
    const onMeta=()=>{
      const vw=v.videoWidth||0, vh=v.videoHeight||0;
      if(vw && vh){
        function gcd(a,b){ return b ? gcd(b, a % b) : a; }
        const d = gcd(vw, vh) || 1;
        resEl.textContent=`${vw}×${vh} · ${vw/d}:${vh/d}`;
      }
      v.removeEventListener("loadedmetadata", onMeta);
    };
    if(v.videoWidth && v.videoHeight){
      onMeta();
    } else {
      v.addEventListener("loadedmetadata", onMeta);
    }
  }
}

// --- Botones "Recuperar workflow" en los reproductores principales ---
function setupMetaButton(slot){
  const btn = $("btnLoadMeta"+slot);
  if(!btn) return;
  btn.addEventListener("click", async () => {
    const media = currentMedia[slot];
    if(!media) { log("⚠️ No hay vídeo cargado en esta ventana", "l-err"); return; }
    const url = `${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder)}&type=${encodeURIComponent(media.type)}`;
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.textContent = "⏳";
    try {
      const workflow = await extractWorkflowFromMP4(url);
      if(workflow) {
        applyWorkflow(workflow);
        log(`📋 Workflow del slot ${slot} restaurado desde ${media.filename}`, "l-ok");
      } else {
        log("ℹ️ Este vídeo no contiene metadatos de workflow.", "l-info");
      }
    } catch(err){
      log("❌ Error leyendo metadatos del vídeo: "+err.message, "l-err");
      console.error("Error al recuperar workflow:", err);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  });
}
setupMetaButton(1);
setupMetaButton(2);

// --- Botones "Descargar" en los reproductores principales ---
function setupDownloadButton(slot){
  const btn = $("btnDownload"+slot);
  if(!btn) return;
  btn.addEventListener("click", async () => {
    const media = currentMedia[slot];
    if(!media) { log("⚠️ No hay vídeo cargado en esta ventana", "l-err"); return; }
    const url = `${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder)}&type=${encodeURIComponent(media.type)}`;
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.textContent = "⏳";
    try {
      const r = await fetch(url);
      if(!r.ok) throw new Error("HTTP "+r.status);
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = media.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      log(`⬇ Descargado ${media.filename}`, "l-ok");
    } catch(err){
      log("❌ Error descargando vídeo: "+err.message, "l-err");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  });
}
setupDownloadButton(1);
setupDownloadButton(2);

// --- Controles de frame en el reproductor final ---
const FRAME_STEP = 1 / 25;

function nudgeFrame(delta){
  const v = $("video2");
  if(!v || !v.src || v.style.display === "none") return;
  const dur = v.duration || 0;
  if(!dur || !isFinite(dur)) return;
  v.pause();
  const t = Math.min(Math.max(0, (v.currentTime || 0) + delta * FRAME_STEP), dur);
  v.currentTime = t;
}

function captureFrameFromPlayer(){
  const v = $("video2");
  if(!v || !v.src || v.style.display === "none"){ log("⚠️ No hay vídeo final cargado", "l-err"); return; }
  btnSaveFrame2.disabled = true;
  const originalHTML = btnSaveFrame2.innerHTML;
  btnSaveFrame2.textContent = "⏳";
  (async () => {
    try {
      await new Promise((resolve, reject) => {
        if(v.readyState >= 2) resolve();
        else {
          const onLoaded = () => { v.removeEventListener("loadeddata", onLoaded); v.removeEventListener("error", onError); resolve(); };
          const onError = () => { v.removeEventListener("loadeddata", onLoaded); v.removeEventListener("error", onError); reject(new Error("error cargando vídeo")); };
          v.addEventListener("loadeddata", onLoaded, { once: true });
          v.addEventListener("error", onError, { once: true });
        }
      });
      const dur = v.duration || 0;
      if(!dur || !isFinite(dur)){ throw new Error("duración del vídeo no disponible"); }
      const targetTime = v.currentTime || 0;
      await new Promise((resolve, reject) => {
        let resolved = false;
        const onSeeked = () => { v.removeEventListener("seeked", onSeeked); v.removeEventListener("error", onError); if(!resolved){ resolved = true; resolve(); } };
        const onError = () => { v.removeEventListener("seeked", onSeeked); v.removeEventListener("error", onError); if(!resolved){ resolved = true; reject(new Error("error durante seek")); } };
        v.addEventListener("seeked", onSeeked, { once: true });
        v.addEventListener("error", onError, { once: true });
        v.currentTime = targetTime;
      });
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth || 640;
      canvas.height = v.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      let dataUrl;
      try { dataUrl = canvas.toDataURL("image/jpeg", 0.92); }
      catch(secErr){ log("❌ Canvas tainted (CORS). No se puede capturar el frame del vídeo.", "l-err"); return; }
      const baseName = (currentMedia[2]?.filename || "video").replace(/\.[^.]+$/, "");
      showInputImage(dataUrl);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
      const frameFile = new File([blob], `${baseName}_frame_${targetTime.toFixed(2)}s.jpg`, { type: "image/jpeg" });
      localFile = frameFile;
      uploadedImage = null;
      log(`📸 Frame extraído a imagen de entrada: ${frameFile.name} (${canvas.width}×${canvas.height}) @ ${targetTime.toFixed(2)}s`, "l-ok");
    } catch(err){
      log("❌ Error guardando frame: "+err.message, "l-err");
    } finally {
      btnSaveFrame2.disabled = false;
      btnSaveFrame2.innerHTML = originalHTML;
    }
  })();
}

const btnSaveFrame2 = $("btnSaveFrame2");
if(btnSaveFrame2){
  btnSaveFrame2.addEventListener("click", captureFrameFromPlayer);
}

const vidbox2 = document.querySelector("#video2")?.closest(".vidbox");
if(vidbox2){
  vidbox2.addEventListener("keydown", (e) => {
    if(!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && ["ArrowLeft", "ArrowRight"].includes(e.key)){
      e.preventDefault();
      nudgeFrame(e.key === "ArrowRight" ? 1 : -1);
    } else if(e.key === "f" || e.key === "F"){
      captureFrameFromPlayer();
    }
  });
  vidbox2.setAttribute("tabindex", "0");
}

// --- VARIANT GALLERY (LTXV video version) ---
function addToVariantGallery(media, seedValue, timeText, slot, variantIndex) {
    if(!media || !media.filename) {
        log("⚠️ No se encontró vídeo de salida para añadir a la galería de variantes.", "l-err");
        return;
    }
    const box = $("variantGalleryBox");
    const grid = $("variantGrid");
    box.style.display = "block";

    const typeShort = slot === 1 ? "1er" : (slot === 2 ? "final" : "var");
    const meta = CONFIG.variantMeta ? CONFIG.variantMeta() : null;
    const card = buildVariantCard(grid, box, media, seedValue, timeText, variantIndex, slot, typeShort, meta);

    const hasSeed = seedValue !== null && seedValue !== undefined;
    if(hasSeed) {
        const seedSpan = card.querySelector('.variant-seed-display');
        seedSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            copySeedToClipboard(seedSpan, seedValue);
        });
    }

    const delBtn = card.querySelector(".variant-del-btn");
    delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const updateCount = (grid, box) => {
            const remaining = grid.querySelectorAll(".variant-card").length;
            $("variantCount").textContent = `(${remaining})`;
            if(remaining === 0) box.style.display = "none";
        };
        deleteMediaFile(card, delBtn, {
            filename: card.dataset.filename,
            subfolder: card.dataset.subfolder,
            type: card.dataset.type,
        }, grid, box, "Vídeo", updateCount, updateCount);
    });

    card.addEventListener("click", (e) => {
        if(e.target.closest("video")) return;
        if(e.target.closest(".variant-seed-display") || e.target.closest(".variant-del-btn")) return;
        const varIndex = parseInt(card.dataset.variantIndex, 10) || (currentBatchIndex + 1);
        showVideo(slot, { filename: card.dataset.filename, subfolder: card.dataset.subfolder, type: card.dataset.type }, { variantIndex: varIndex });
        log("▶ Vídeo cargado en ventana "+(slot===1?"1er pase":"final")+": "+card.dataset.filename, "l-ok");
    });

    $("variantCount").textContent = `(${variantCounter + 1})`;
}

// --- VIDEO HISTORY ---
$("videoHistoryToggle").addEventListener("click", () => {
  const h = $("videoHistoryToggle");
  const b = $("videoHistoryBody");
  h.classList.toggle("open");
  b.classList.toggle("open");
  const arrow = h.querySelector(".arrow");
  arrow.textContent = h.classList.contains("open") ? "▼" : "▶";
  if(h.classList.contains("open")) loadVideoHistory();
});

$("btnRefreshVideoHistory").addEventListener("click", (e) => {
  e.stopPropagation();
  loadVideoHistory();
});

// --- VIDEO HISTORY THUMBNAILS ---
const THUMB_CACHE_PREFIX = "ltxv_thumb_";
const THUMB_WIDTH = 320;
const THUMB_QUALITY = 0.72;

function _thumbCacheKey(item){
  return item.filename + "|" + (item.mtime || 0) + "|" + item.subfolder + "|" + item.type;
}

function _safeCacheGet(key){
  try { return localStorage.getItem(THUMB_CACHE_PREFIX + key); } catch(e){ return null; }
}

function _safeCacheSet(key, value){
  try { localStorage.setItem(THUMB_CACHE_PREFIX + key, value); } catch(e){ /* quota/full: ignore */ }
}

function extractVideoFrame(videoUrl){
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
    let resolved = false;
    function done(result){
      if(resolved) return;
      resolved = true;
      try { v.pause(); v.src = ""; v.load(); } catch(_){}
      resolve(result);
    }
    v.addEventListener("loadedmetadata", () => {
      const t = v.duration ? Math.min(0.5, v.duration / 2) : 0.1;
      v.currentTime = t;
    }, {once:true});
    v.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        const ratio = v.videoHeight / (v.videoWidth || 1);
        canvas.width = THUMB_WIDTH;
        canvas.height = Math.max(1, Math.round(THUMB_WIDTH * ratio));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL("image/jpeg", THUMB_QUALITY));
      } catch(err){ done(null); }
    }, {once:true});
    v.addEventListener("error", () => done(null), {once:true});
    v.src = videoUrl;
  });
}

async function getCachedThumb(item){
  const key = _thumbCacheKey(item);
  const cached = _safeCacheGet(key);
  if(cached) return cached;
  const url = `${server()}/view?filename=${encodeURIComponent(item.filename)}&subfolder=${encodeURIComponent(item.subfolder)}&type=${encodeURIComponent(item.type)}&t=${item.mtime}`;
  const dataUrl = await extractVideoFrame(url + "#t=0.1");
  if(dataUrl) _safeCacheSet(key, dataUrl);
  return dataUrl;
}

let _thumbObserver = null;
function observeThumbs(){
  if(_thumbObserver) _thumbObserver.disconnect();
  if(!("IntersectionObserver" in window)){
    document.querySelectorAll(".thumb-img").forEach(async (img) => {
      if(img.dataset.loaded) return;
      const item = JSON.parse(img.dataset.item || "{}");
      if(!item.filename) return;
      const dataUrl = await getCachedThumb(item);
      if(dataUrl){ img.src = dataUrl; img.style.opacity = 1; }
      img.dataset.loaded = "1";
    });
    return;
  }
  _thumbObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      const img = entry.target;
      if(img.dataset.loaded) return;
      img.dataset.loaded = "1";
      const item = JSON.parse(img.dataset.item || "{}");
      if(!item.filename) return;
      getCachedThumb(item).then(dataUrl => {
        if(dataUrl){ img.src = dataUrl; img.style.opacity = 1; }
      }).catch(() => {});
    });
  }, { rootMargin: "50px" });
  document.querySelectorAll(".thumb-img").forEach(img => _thumbObserver.observe(img));
}

async function loadVideoHistory(){
  const status = $("videoHistoryStatus");
  const grid = $("videoHistoryGrid");
  status.textContent = "Cargando...";
  grid.innerHTML = "";
  try {
    const r = await fetch("/api/ltxv_list");
    if(!r.ok) throw new Error("HTTP "+r.status);
    const data = await r.json();
    if(!data.items || !data.items.length){
      status.textContent = "No hay vídeos en el historial.";
      return;
    }
    const allItems = data.items;
    let visibleCount = Math.min(30, allItems.length);

    function renderBatch(){
      grid.innerHTML = "";
      const items = allItems.slice(0, visibleCount);
      for(const item of items){
        const card = document.createElement("div");
        card.className = "variant-card";
        const dateStr = new Date(item.mtime * 1000).toLocaleString("es-ES", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
        const itemJson = JSON.stringify(item).replace(/"/g, "&quot;");
        card.innerHTML = `
          <div class="thumb-wrap" style="position:relative;background:#000;min-height:120px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:4px 4px 0 0;">
            <img class="thumb-img" data-item="${itemJson}" loading="lazy" alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" style="display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;opacity:.6;transition:opacity .2s;">
          </div>
          <div class="variant-info">
            <span style="font-size:10px;color:var(--muted-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;" title="${item.filename}">${item.filename}</span>
            <span class="variant-icons">
              <button class="variant-meta-btn" title="Copiar workflow" data-action="workflow">📋</button>
              <button class="variant-del-btn" title="Eliminar" data-action="delete">×</button>
            </span>
          </div>
          <div style="padding:2px 8px 6px;font-size:9px;color:var(--muted-2);font-family:var(--mono);">${dateStr}</div>
        `;
        card.dataset.filename = item.filename;
        card.dataset.subfolder = item.subfolder;
        card.dataset.type = item.type;

        card.addEventListener("click", () => {
          const slot = item.filename.includes("_prev") ? 1 : 2;
          const media = { filename: item.filename, subfolder: item.subfolder || "", type: item.type || "output" };
          showVideo(slot, media, { variantIndex: 0 });
          log("▶ Reproduciendo: "+item.filename, "l-ok");
        });

        card.querySelector('[data-action="workflow"]').addEventListener("click", async (e) => {
          e.stopPropagation();
          const btn = e.target;
          btn.disabled = true;
          const orig = btn.textContent;
          btn.textContent = "⏳";
          try {
            const wfUrl = `${server()}/view?filename=${encodeURIComponent(item.filename)}&subfolder=${encodeURIComponent(item.subfolder)}&type=${encodeURIComponent(item.type)}`;
            const workflow = await extractWorkflowFromMP4(wfUrl);
            if(workflow){
              applyWorkflow(workflow);
              log(`📋 Workflow restaurado desde ${item.filename}`, "l-ok");
            } else {
              log(`ℹ️ ${item.filename} no contiene metadatos de workflow.`, "l-warn");
            }
          } catch(err) {
            log("❌ Error leyendo workflow: "+err.message, "l-err");
            console.error("Error al recuperar workflow de la tarjeta:", err);
          } finally {
            btn.disabled = false;
            btn.textContent = orig;
          }
        });

        card.querySelector('[data-action="delete"]').addEventListener("click", (e) => {
          e.stopPropagation();
          const btn = e.target;
          const updateStatus = (g) => {
            const remaining = g.querySelectorAll(".variant-card").length;
            status.textContent = remaining ? `${remaining} vídeos.` : "No hay vídeos en el historial.";
          };
          deleteMediaFile(card, btn, {
            filename: item.filename,
            subfolder: item.subfolder,
            type: item.type,
          }, grid, null, "Vídeo",
            (g) => updateStatus(g),
            (g) => updateStatus(g));
        });

        grid.appendChild(card);
      }

      if(visibleCount < allItems.length){
        const moreBtn = document.createElement("button");
        moreBtn.className = "ghost";
        moreBtn.textContent = `Cargar más (${allItems.length - visibleCount} restantes)`;
        moreBtn.style.cssText = "grid-column:1/-1;justify-self:center;margin:6px 0;";
        moreBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          visibleCount = Math.min(visibleCount + 30, allItems.length);
          renderBatch();
          observeThumbs();
        });
        grid.appendChild(moreBtn);
      }

      status.textContent = `${allItems.length} vídeos encontrados (${items.length} mostrados).`;
    }

    renderBatch();
    observeThumbs();
  } catch(err){
    status.textContent = "Error: "+err.message;
  }
}

// --- GENERACIÓN ---
async function runSingleGeneration(index) {
    try {
        const isStep2 = (generationStep === 2);
        const mode = isStep2 ? "second" : (activeJob ? (activeJob.firstPassOnly ? "first" : "full") : "first");
        const graph = buildGraph(mode);
        let seedUsed;
        if(isStep2 && firstPromptId && pendingSeeds[firstPromptId] != null){
            seedUsed = pendingSeeds[firstPromptId];
        } else {
            const jobSeedMode = activeJob ? activeJob.seedMode : seedMode;
            const jobSeedValue = activeJob ? activeJob.seedValue : parseInt($("seedVal").value || "12345", 10);
            seedUsed = (jobSeedMode === "random") ? randomSeed() : jobSeedValue;
        }
        graph[N.SEED].inputs.seed = seedUsed;

        // Reservamos un índice de variante global al inicio de cada flujo nuevo.
        if(activeJob && activeJob.currentVariantIndex == null){
          variantCounter++;
          activeJob.currentVariantIndex = variantCounter;
        }
        const varIndex = activeJob?.currentVariantIndex || (variantCounter + 1);

        const stepLabel = isStep2 ? `paso 2/2 · Var ${varIndex}` : (activeJob?.firstPassOnly ? `1er pase · Var ${varIndex}` : `paso 1+2 · Var ${varIndex}`);
        log(`🚀 Procesando ${stepLabel} (seed ${seedUsed})...`);
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
        currentPromptId = data.prompt_id;
        promptSteps[data.prompt_id] = isStep2 ? "2" : "1";
        if(!isStep2 && generationStep === 1){
            firstPromptId = data.prompt_id;
        }
        // En modo "full" mostramos el timer en el slot 2 (final); el preview del 1er pase
        // sale como resultado intermedio pero no tiene timer propio.
        const timerSlot = (mode === "full") ? 2 : (isStep2 ? 2 : 1);
        startTimer(data.prompt_id, timerSlot);
        pollFallback(data.prompt_id);
    } catch(err) {
        log(`❌ No se pudo encolar: ${err.message || err}`, "l-err");
        generationStep = 0;
        finishCurrentJob();
    }
}

async function startJob(job){
  activeJob = job;
  restoreJob(job);
  connectSocket();
  await ensureImageUploaded();
  totalBatchSize = job.batchSize || 1;
  currentBatchIndex = 0;
  batchSeedMode = job.seedMode === "random" ? "random" : "fixed";
  // LTXV gestiona sus propios pasos; para common.js el flujo es siempre "completo".
  window.currentBatchMode = false;
  generationStep = 1;
  firstPromptId = null;
  job.currentVariantIndex = null;
  // Limpiamos tiempos de jobs anteriores para evitar confusión visual.
  $("time1").textContent = "";
  $("time1").classList.remove("live");
  $("time2").textContent = "";
  $("time2").classList.remove("live");
  setRun("busy", `Job en cola · ${job.firstPassOnly ? "1er pase" : "completo"} · ${job.batchSize} flujo(s)...`);
  $("btnFirstPass").disabled=true;
  $("btnFull").disabled=true;
  enableStopButtons(true);
  runSingleGeneration(0);
}

function finishCurrentJob(){
  activeJob = null;
  if(jobQueue.length > 0){
    const next = jobQueue.shift();
    updateQueueUI();
    log(`⏭️ Iniciando siguiente job de la cola...`, "l-info");
    startJob(next);
  } else {
    setRun("ok", "en reposo");
    log("🏁 Cola vacía. Todos los jobs completados.", "l-ok");
    $("btnFirstPass").disabled=false;
    $("btnFull").disabled=false;
    enableStopButtons(false);
  }
}

async function enqueueGeneration(firstPassOnly){
  const job = snapshotJob(firstPassOnly);
  if(activeJob || (currentPromptId && !handledPrompts.has(currentPromptId))){
    jobQueue.push(job);
    updateQueueUI();
    log(`📥 Job añadido a la cola (total ${jobQueue.length}). Cambia parámetros libremente.`, "l-info");
  } else {
    await startJob(job);
  }
}

$("btnClearQueue")?.addEventListener("click", () => {
  const count = jobQueue.length;
  jobQueue = [];
  updateQueueUI();
  if(count) log(`🧹 Cola vacía (${count} job(s) eliminados).`, "l-ok");
});

$("btnFirstPass").addEventListener("click",()=>enqueueGeneration(true));
$("btnFull").addEventListener("click",()=>enqueueGeneration(false));

// --- ENHANCER (LTXV vision-mode uses localFile) ---
$("btnEnhance").addEventListener("click", async () => {
  const chainMode = $("enhancerChainMode").value;
  if(chainMode === LTX2_CHAIN_OFF){
    log("⚠️ Cadena de mejora desactivada. Activa 'Ollama', 'LTX2' o 'Ambos' para usar el botón.", "l-warn");
    return;
  }

  // Modo LTX2 puro: ejecutar solo el nodo TextGenerateLTX2Prompt en ComfyUI.
  if(chainMode === LTX2_CHAIN_LTX2){
    await runLTX2Preview();
    return;
  }

  const model = $("enhancerModel").value;
  if(!model){ log("⚠️ Selecciona un modelo de Ollama", "l-err"); return; }
  if(!model){ log("⚠️ Selecciona un modelo de Ollama", "l-err"); return; }
  const mode = $("enhancerMode").value;
  const styleKey = $("enhancerStyle").value;
  const data = loadSysPrompts();
  const system = getCurrentSysPrompt(data, mode, styleKey);
  const userPrompt = $("prompt").value.trim();
  if(mode !== "vision" && !userPrompt){ log("⚠️ Escribe un prompt primero", "l-err"); return; }

  const payload = { model, system, prompt: userPrompt || "Describe this image.", stream: false, options: { num_ctx: 8192 } };
  if(mode === "vision"){
    if(!localFile){ log("⚠️ No hay imagen de entrada para modo visión", "l-err"); return; }
    try {
      // Redimensionamos antes de enviar: Ollama rechaza bodies > ~4 MB
      // ("http: request body too large"). 1280 px de lado máximo es ample para
      // visión y mantiene el JPEG por debajo del tope.
      const b64 = await resizeFileToBase64(localFile, 1280);
      payload.images = [b64];
    } catch(e) {
      log("⚠️ No se pudo leer la imagen: "+(e.message || e), "l-err");
      return;
    }
  }

  $("btnEnhance").disabled = true;
  $("btnEnhance").textContent = "Mejorando...";
  $("enhancerOutput").value = "";
  $("ltx2PreviewText").value = "";
  try {
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });
    if(!r.ok){
      const t = await r.text().catch(()=>"");
      throw new Error("HTTP "+r.status+" "+t.slice(0,200));
    }
    const result = await r.json();
    const text = (result.response || "").trim();
    $("enhancerOutput").value = text;
    // Si el modo es Ollama o Ambos, actualizamos tambin el textbox principal
    if(chainMode === LTX2_CHAIN_OLLAMA || chainMode === LTX2_CHAIN_BOTH){
      $("prompt").value = text;
      log("✏️ Prompt actualizado desde Ollama.", "l-ok");
      // Previsualizacin del prompt final con LTX2 (sin ejecutar ComfyUI)
      if(chainMode === LTX2_CHAIN_BOTH){
        log("⏳ Ejecutando previsualización LTX2 en ComfyUI...", "l-info");
        const ltx2Text = await runLTX2Preview(text);
        $("ltx2PreviewText").value = `[Ollama]\n${text}\n\n[LTX2]\n${ltx2Text || "(no se pudo previsualizar)"}`;
      }
    }
    log("✨ Prompt mejorado ("+model+", "+mode+", "+styleKey+")", "l-ok");
  } catch(e) {
    log("❌ Error al mejorar: "+e.message, "l-err");
    $("enhancerOutput").value = "Error: "+e.message;
  } finally {
    $("btnEnhance").disabled = false;
    $("btnEnhance").textContent = "Mejorar prompt";
  }
});

async function runLTX2Preview(ollamaText){
  const savedJob = activeJob;
  if(!activeJob) activeJob = { firstPassOnly: false, seedMode: seedMode, seedValue: parseInt($("seedVal").value || "12345", 10), batchSize: 1, loras: loras };
  try {
    const graph = buildGraph("ltx2preview");
    const r = await fetch(server()+"/prompt", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({prompt: graph, client_id: CLIENT_ID})
    });
    if(!r.ok){
      const t = await r.text().catch(()=>"");
      throw new Error("HTTP "+r.status+" "+t.slice(0,300));
    }
    const data = await r.json();
    if(data.error) throw new Error(JSON.stringify(data.error));
    const pid = data.prompt_id;
    log("⏳ Esperando prompt LTX2...", "l-info");
    const text = await waitForLTX2Preview(pid, 120);
    if(text){
      $("prompt").value = text;
      log("✏️ Prompt actualizado desde LTX2.", "l-ok");
      if(ollamaText && text.trim() === ollamaText.trim()){
        log("ℹ️ LTX2 no modificó el prompt de Ollama (ya estaba optimizado).", "l-info");
      }
    }
    return text;
  } catch(e) {
    log("❌ Error previsualizando LTX2: "+e.message, "l-err");
    return "";
  } finally {
    activeJob = savedJob;
  }
}

async function waitForLTX2Preview(promptId, maxTries){
  for(let i = 0; i < maxTries; i++){
    await new Promise(r => setTimeout(r, 1000));
    try {
      const hr = await fetch(server()+"/history/"+promptId);
      if(!hr.ok) continue;
      const hist = await hr.json();
      const entry = hist[promptId];
      if(!entry) continue;
      if(entry.status && entry.status.status_str === "error"){
        throw new Error(entry.status.exception_message || "error en LTX2 preview");
      }
      const out = entry.outputs && entry.outputs[N.LTX2_PREVIEW];
      if(out && out.text && out.text.length){
        const txt = out.text[out.text.length - 1];
        if(typeof txt === "string" && txt.trim()) return txt.trim();
      }
    } catch(e) {
      if(e.message.includes("error en LTX2 preview")) throw e;
      // otherwise retry
    }
  }
  return "";
}

// --- INIT ---
updateDuration();
updateQueueUI();
// Default enhancer chain for fresh sessions: Ollama usable out of the box.
if(!$("enhancerChainMode").value) $("enhancerChainMode").value = LTX2_CHAIN_OLLAMA;

// --- FIRST PASS SIGMAS ---
// Curva base 10-step tal como está en el workflow original.
const BASE_FIRST_SIGMAS = [1.000, 0.955, 0.893, 0.812, 0.715, 0.603, 0.482, 0.241, 0.121, 0.0];
function lerp(a, b, t){ return a + (b - a) * t; }
function buildFirstPassSigmas(steps){
  steps = Math.max(4, Math.min(12, steps));
  if(steps === BASE_FIRST_SIGMAS.length) return BASE_FIRST_SIGMAS.join(", ");
  const positions = steps;
  const out = [];
  const maxIdx = BASE_FIRST_SIGMAS.length - 1;
  for(let i = 0; i < positions; i++){
    const rawPos = (i / (positions - 1)) * maxIdx;
    const idx = Math.floor(rawPos);
    const t = rawPos - idx;
    const a = BASE_FIRST_SIGMAS[idx];
    const b = BASE_FIRST_SIGMAS[Math.min(idx + 1, maxIdx)];
    out.push(lerp(a, b, t));
  }
  return out.map(s => s.toFixed(4).replace(/\.?0+$/,"")).join(", ");
}

// --- EVOLVE / TRANSMUTAR PROMPT ---
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

makeCollapsible("evolveToggle", "evolveBody");
$("evolveStrength")?.addEventListener("input", (e) => {
  $("evolveStrengthVal").textContent = e.target.value + "%";
});
$("btnEvolve")?.addEventListener("click", () => {
  const prompt = $("prompt").value.trim();
  if(!prompt){ log("⚠️ Escribe un prompt primero", "l-err"); return; }
  const mode = $("evolveMode").value;
  const strength = parseInt($("evolveStrength").value, 10);
  const count = parseInt($("evolveCount").value, 10) || 4;
  const variants = generateEvolved(prompt, mode, strength, count);
  $("evolveOutput").value = variants.map((v, i) => `--- Variant ${i + 1} ---\n${v}`).join("\n\n");
  log(`🧬 ${count} variantes generadas (${mode}, ${strength}%)`, "l-ok");
});
$("btnEvolveUse")?.addEventListener("click", () => {
  const text = $("evolveOutput").value.trim();
  if(!text){ log("⚠️ Genera variantes primero", "l-err"); return; }
  const first = text.split(/--- Variant \d+ ---/)[1]?.trim() || text.split("\n\n")[0]?.trim();
  if(first){
    $("prompt").value = first;
    log("✏️ Prompt actualizado con la variante #1", "l-ok");
  }
});