// ltxv.js — LTXV-specific JavaScript.
// Injected AFTER common.js. CONFIG must be defined before initCommon().

const CONFIG = {
  PROMPTS_KEY: 'ltxv_prompts',
  LORA_STATE_KEY: 'ltxv_loras_state',
  ENHANCER_SYSKEY: 'ltxv_enhancer_sysprompts',
  SERVERURL_KEY: 'ltxv_serverUrl',
  DEFAULT_BACKEND_PORT: "7821",
  UI_TYPE: "ltxv",
  DEFAULT_MODEL: "10Eros_v1.3_fp8mixed_learned.safetensors",
  N: {IMAGE:"917",PROMPT:"536",SEED:"524",WIDTH:"791",HEIGHT:"792",FRAMES:"796",FIDELITY:"797",MOTION:"915",LORA:"853",FINAL_SAVE:"920",PURGE_VRAM:"925",FIRST_SAVE:"923",CHECKPOINT:"646"},
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
let finalVariantIndex = null;
let promptSteps = {};
// Exposed for common.js WS error handler.
window.currentBatchMode = false;

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
};
CONFIG.startNextVariant = function(index){
  generationStep = window.currentBatchMode ? 0 : 1;
  firstPromptId = null;
  finalVariantIndex = null;
  runSingleGeneration(index);
};
CONFIG.onBatchComplete = function(){
  $("btnFirstPass").disabled=false;
  $("btnFull").disabled=false;
  enableStopButtons(false);
};
CONFIG.onStopCurrent = function(pid){
  delete promptSteps[pid];
  if(generationStep === 1){
    generationStep = 0;
    if(firstPromptId) handledPrompts.add(firstPromptId);
  }
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
  currentBatchIndex = totalBatchSize;
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
  const isFirstOnly = (step === "1");
  const media1 = entry.outputs[N.FIRST_SAVE] ? CONFIG.findMedia(entry.outputs[N.FIRST_SAVE]) : null;
  const media2 = entry.outputs[N.FINAL_SAVE] ? CONFIG.findMedia(entry.outputs[N.FINAL_SAVE]) : null;

  if(isFirstOnly){
    if(media1){
      showVideo(1, media1, { variantIndex: variantCounter + 1 });
      paint(1, "1er", tTotal || "—");
      addToVariantGallery(media1, realSeed, tTotal || "", 1, variantCounter + 1);
    }
  } else {
    if(media2){
      const finalIdx = finalVariantIndex != null ? (finalVariantIndex + 1) : (variantCounter + 1);
      showVideo(2, media2, { variantIndex: finalIdx });
      paint(2, "final", tTotal || "—");
      addToVariantGallery(media2, realSeed, tTotal || "", 2, finalIdx);
    }
  }

  delete promptSteps[promptId];

  // --- ¿Continuamos con el paso 2? ---
  if(generationStep === 1 && step === "1" && window.currentBatchMode === false){
    log(`➡️ Paso 1 completado, iniciando paso 2 (2º pase)...`, "l-ok");
    generationStep = 2;
    const step1Seed = pendingSeeds[promptId];
    delete pendingSeeds[promptId];
    // Solo transferimos la seed al prompt del paso 2 si firstPromptId es válido;
    // si por algún borde raro firstPromptId es null (p.ej. /prompt falló y luego
    // llegó un execution_success tardío), no contaminamos pendingSeeds con clave "null".
    if(firstPromptId && step1Seed != null){
      pendingSeeds[firstPromptId] = step1Seed;
    } else {
      log("⚠️ No se pudo encadenar el paso 2: firstPromptId no asignado.", "l-warn");
    }
    finalVariantIndex = variantCounter;
    runSingleGeneration(currentBatchIndex);
    // Marcamos el prompt del paso 1 como handled para que pollFallback no lo reprocese
    // como paso 2 si llega otro execution_success/poll tardío.
    handledPrompts.add(promptId);
    return true;
  }

  delete pendingSeeds[promptId];
  generationStep = 0;
  firstPromptId = null;
  finalVariantIndex = null;
  return false;
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
  const filename = decodeURIComponent(ref);
  const h = $("krea2RecentToggle");
  const b = $("krea2RecentBody");
  if(h && b && !h.classList.contains("open")){
    h.classList.add("open");
    b.classList.add("open");
    const arr = h.querySelector(".arrow"); if(arr) arr.textContent = "▼";
  }
  // Cargamos la lista para que la tarjeta aparezca en el panel (UX), y luego
  // cargamos la imagen directamente como entrada via loadKrea2ImageAsInput,
  // que descarga el fichero y lo pasa por handleFile. Antes hacíamos click
  // en la tarjeta encontrada por substring de img.src, pero era frágil
  // (codificación, nombre devuelto por ComfyUI vs. el de /api/krea2_list).
  loadKrea2Recent().then(async () => {
    const url = `${server()}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent("krea2")}&type=${encodeURIComponent("output")}`;
    try {
      await loadKrea2ImageAsInput(url, filename);
    } catch(e){
      log("⚠️ La imagen '"+filename+"' no se pudo cargar desde Krea2: "+e.message, "l-err");
    }
  });
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
    const startsNeg = /^\s*(blurry|low quality|distorted|ugly|watermark|worst|overexposed|underexposed|grainy|noise|out of focus|deformed|jpeg|nsfw|mutation|cropped)/i.test(t);
    const manyNegWords = (t.match(/\b(blurry|low quality|distorted|ugly|watermark|worst|overexposed|underexposed|grainy|deformed|mutation|artifacts)\b/gi) || []).length >= 3;
    return startsNeg || manyNegWords;
  }
  let promptSet = false;
  for(const {node} of textEncoders){
    const t = (node.inputs && node.inputs.text) || "";
    if(!isNegativePrompt(t) && t.length > 50){
      $("prompt").value = t;
      promptSet = true; break;
    }
  }
  if(!promptSet && textEncoders.length){
    let longest = textEncoders[0].node;
    for(const {node} of textEncoders){
      if((node.inputs?.text || "").length > (longest.inputs?.text || "").length) longest = node;
    }
    $("prompt").value = longest.inputs?.text || "";
    promptSet = !!$("prompt").value;
  }
  if(promptSet) setApplied("prompt"); else setMissing("prompt");

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
  const wrap = $("inputWrap"), img = $("inputImg"), actions = $("imgInputActions");
  if(!wrap || !img) return;
  img.onload = () => {
    updateDzInfo(img.naturalWidth, img.naturalHeight);
    inputZoom.resetZoom();
  };
  img.src = src;
  img.style.display = "block";
  wrap.style.display = "flex";
  actions.style.display = "flex";
  // Ocultar el dropzone y el placeholder
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
  if(g[N.CHECKPOINT] && g[N.CHECKPOINT].inputs) g[N.CHECKPOINT].inputs.ckpt_name = $("modelSelect").value;
  // DMD bypass: saltar el nodo LoraLoaderModelOnly (906) y conectar directamente al modelo fuente (868)
  if(dmdBypass && g[N.LORA] && g[N.LORA].inputs.model){
    g[N.LORA].inputs.model = [DMD_MODEL_SOURCE, 0];
  }
  if(firstPassOnly){delete g[N.FINAL_SAVE]; delete g[N.PURGE_VRAM];}
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
    status.textContent = `${data.count} vídeos encontrados.`;
    for(const item of data.items){
      const card = document.createElement("div");
      card.className = "variant-card";
      const url = `${server()}/view?filename=${encodeURIComponent(item.filename)}&subfolder=${encodeURIComponent(item.subfolder)}&type=${encodeURIComponent(item.type)}&t=${item.mtime}#t=0.1`;
      const dateStr = new Date(item.mtime * 1000).toLocaleString("es-ES", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
      card.innerHTML = `
        <video src="${url}" crossorigin="anonymous" muted preload="none" playsinline></video>
        <div class="variant-info">
          <span style="font-size:10px;color:var(--muted-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;" title="${item.filename}">${item.filename}</span>
          <span class="variant-icons">
            <button class="variant-meta-btn" title="Reproducir" data-action="play">▶</button>
            <button class="variant-meta-btn" title="Copiar workflow" data-action="workflow">📋</button>
            <button class="variant-del-btn" title="Eliminar" data-action="delete">×</button>
          </span>
        </div>
        <div style="padding:2px 8px 6px;font-size:9px;color:var(--muted-2);font-family:var(--mono);">${dateStr}</div>
      `;
      card.dataset.filename = item.filename;
      card.dataset.subfolder = item.subfolder;
      card.dataset.type = item.type;

      const videoEl = card.querySelector("video");

      // Reproducir al pasar el cursor (hover-play) para evitar que salgan en negro
      card.addEventListener("mouseenter", () => {
        videoEl.play().catch(err => console.log("Hover play failed:", err));
      });
      card.addEventListener("mouseleave", () => {
        videoEl.pause();
        videoEl.currentTime = 0.1; // reset frame
      });

      // Toda la tarjeta carga y reproduce el vídeo en el reproductor principal al hacer clic
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
        const updateStatus = (grid) => {
          const remaining = grid.querySelectorAll(".variant-card").length;
          status.textContent = remaining ? `${remaining} vídeos.` : "No hay vídeos en el historial.";
        };
        deleteMediaFile(card, btn, {
          filename: item.filename,
          subfolder: item.subfolder,
          type: item.type,
        }, grid, null, "Vídeo",
          (grid) => updateStatus(grid),
          (grid) => updateStatus(grid));
      });

      grid.appendChild(card);
    }
  } catch(err){
    status.textContent = "Error: "+err.message;
  }
}

// --- GENERACIÓN ---
async function runSingleGeneration(index) {
    try {
        const isStep2 = (generationStep === 2);
        const firstPassOnly = isStep2 ? false : true;
        const graph = buildGraph(firstPassOnly);
        let seedUsed;
        if(isStep2 && firstPromptId && pendingSeeds[firstPromptId] != null){
            seedUsed = pendingSeeds[firstPromptId];
        } else {
            seedUsed = (batchSeedMode === "random") ? randomSeed() : parseInt($("seedVal").value, 10);
        }
        graph[N.SEED].inputs.seed = seedUsed;

        const stepLabel = isStep2 ? "paso 2/2 (2º pase)" : (generationStep === 1 ? "paso 1/2 (1er pase)" : `variante ${variantCounter + 1} (batch ${index + 1}/${totalBatchSize})`);
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
        startTimer(data.prompt_id, isStep2 ? 2 : 1);
        pollFallback(data.prompt_id);
    } catch(err) {
        log(`❌ No se pudo encolar: ${err.message || err}`, "l-err");
        if(generationStep === 1){
            generationStep = 0;
        }
        currentBatchIndex++;
        processNextBatch();
    }
}

async function queueAndWait(firstPassOnly){
  connectSocket();
  await ensureImageUploaded();
  totalBatchSize = parseInt($("batchSize").value || "1", 10);
  currentBatchIndex = 0;
  batchSeedMode = $("segRandom").classList.contains("on") ? "random" : "fixed";
  window.currentBatchMode = firstPassOnly;
  generationStep = firstPassOnly ? 0 : 1;
  firstPromptId = null;
  setRun("busy", `Iniciando batch de ${totalBatchSize} variantes...`);
  $("btnFirstPass").disabled=true;
  $("btnFull").disabled=true;
  enableStopButtons(true);
  runSingleGeneration(0);
}

async function runGeneration(fp){
  try{ await queueAndWait(fp); }
  catch(err){ setRun("bad","error");log("Error: "+err.message,"l-err"); $("btnFirstPass").disabled=false;$("btnFull").disabled=false; }
}

$("btnFirstPass").addEventListener("click",()=>runGeneration(true));
$("btnFull").addEventListener("click",()=>runGeneration(false));

// --- ENHANCER (LTXV vision-mode uses localFile) ---
$("btnEnhance").addEventListener("click", async () => {
  const model = $("enhancerModel").value;
  if(!model){ log("⚠️ Selecciona un modelo de Ollama", "l-err"); return; }
  const mode = $("enhancerMode").value;
  const styleKey = $("enhancerStyle").value;
  const data = loadSysPrompts();
  const system = getCurrentSysPrompt(data, mode, styleKey);
  const userPrompt = $("prompt").value.trim();
  if(!userPrompt){ log("⚠️ Escribe un prompt primero", "l-err"); return; }

  const payload = { model, system, prompt: userPrompt, stream: false, options: { num_ctx: 8192 } };
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
    log("✨ Prompt mejorado ("+model+", "+mode+", "+styleKey+")", "l-ok");
  } catch(e) {
    log("❌ Error al mejorar: "+e.message, "l-err");
    $("enhancerOutput").value = "Error: "+e.message;
  } finally {
    $("btnEnhance").disabled = false;
    $("btnEnhance").textContent = "Mejorar prompt";
  }
});

// --- INIT ---
updateDuration();