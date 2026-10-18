// ltxv.js — LTXV-specific JavaScript.
// Injected AFTER common.js. CONFIG must be defined before initCommon().

const CONFIG = {
  PROMPTS_KEY: 'ltxv_prompts',
  LORA_STATE_KEY: 'ltxv_loras_state',
  ENHANCER_SYSKEY: 'ltxv_enhancer_sysprompts',
  SERVERURL_KEY: 'ltxv_serverUrl',
  DEFAULT_BACKEND_PORT: "7821",
  UI_TYPE: "ltxv",
  DEFAULT_MODEL: "ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors",
  DEFAULT_VAE: "ltx-2.5-video-vae-conv-bf16",
  N: {IMAGE:"917",PROMPT:"536",SEED:"524",WIDTH:"791",HEIGHT:"792",FRAMES:"796",FIDELITY:"797",MOTION:"915",LORA:"853",FINAL_SAVE:"920",PURGE_VRAM:"925",CLEAN_GPU:"918",FIRST_SAVE:"923",CHECKPOINT:"646",CUSTOM_VAE:"1005",CREATE_VIDEO_1:"922",CREATE_VIDEO_2:"919",SAMPLER_1:"888",SAMPLER_2:"891",LATENT_UPSAMPLER:"744",IMG2VIDEO_2:"770",RTX_SR:"921",REFERENCE_1:"860",REFERENCE_2:"870",SAGE_PATCH:"1001",RAW_PROMPT:"1002",LTX2_PROMPT:"1003",LTX2_PREVIEW:"1004",FIRST_SIGMAS:"914",LTXAV_TEXT_ENCODER:"616",RIFE_LOADER:"1080",RIFE_INTERP:"1081",DECODE_VIDEO_2:"740"},
  loras: [
    {on:true, lora:"", strength:1},
    {on:false, lora:"", strength:0.15},
    {on:false, lora:"", strength:0.65},
    {on:false, lora:"", strength:1.0}
  ],
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
// Opciones válidas del selector: PathchSageAttentionKJ no acepta "sageattn"/"sageattn2"/"sageattn_qk"
// (fallan al ejecutar). Kitchen y sageattn3 empatan en velocidad; "auto" (sage2) es ~20% más lento.
const SAGE_DEFAULT = "comfy kitchen attention";
const SAGE_TYPES = [SAGE_DEFAULT, "sageattn3", "auto"];
let finalVariantIndex = null;
// Mapa prompt_id -> índice de variante, para que tanto WS como fallback
// sepan a qué variante pertenece cada resultado.
let promptVariantMap = {};
// Set para evitar duplicados en la galería: clave = filename|subfolder|slot.
const displayedGalleryFiles = new Set();
// Slots ya mostrados en vivo por prompt_id (evita que displayResult vuelva a
// machacar el reproductor y el tiempo cuando llega el fallback).
const displayedSlots = {};
const BITDEPTH_KEY = "ltxv_bit_depth";
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

// --- FRAME INTERPOLATION (RIFE / RTX FRAME GEN) ---
const RIFE_KEY = "ltxv_rife_state";
const RIFE_DEFAULTS = { enabled: true, engine: "rife", multiplier: 2, model: "rife_v4.26.safetensors" };
function loadRife(){
  try { return Object.assign({}, RIFE_DEFAULTS, JSON.parse(localStorage.getItem(RIFE_KEY) || "{}")); }
  catch(_) { return {...RIFE_DEFAULTS}; }
}
function saveRife(r){ try { localStorage.setItem(RIFE_KEY, JSON.stringify(r)); } catch(_){} }
function toggleRifeEngineUI(engine){
  const modelRow = $("rifeModelRow");
  if(modelRow) modelRow.style.display = (engine === "rtx") ? "none" : "";
}
function setRifeUI(r){
  const on = $("segRifeOn"), off = $("segRifeOff");
  if(r.enabled){ on?.classList.add("on"); off?.classList.remove("on"); }
  else { off?.classList.add("on"); on?.classList.remove("on"); }
  if($("rifeEngine") && r.engine){
    $("rifeEngine").value = r.engine;
    toggleRifeEngineUI(r.engine);
  }
  if($("rifeMultiplier")){
    $("rifeMultiplier").value = r.multiplier;
    const fps = 24 * parseInt(r.multiplier, 10);
    if($("rifeFpsHint")) $("rifeFpsHint").textContent = `(24fps → ${fps}fps)`;
  }
  setSelectIfPresent("rifeModel", r.model);
}
function getRifeState(){
  const mult = parseInt($("rifeMultiplier")?.value || "2", 10);
  return {
    enabled: $("segRifeOn")?.classList.contains("on") ?? true,
    engine: $("rifeEngine")?.value || "rife",
    multiplier: mult,
    model: $("rifeModel")?.value || "rife_v4.26.safetensors"
  };
}
function loadInterpModels(){
  const sel = $("rifeModel");
  if(!sel) return;
  const models = (typeof AVAILABLE_INTERP_MODELS !== "undefined" && AVAILABLE_INTERP_MODELS.length)
    ? AVAILABLE_INTERP_MODELS
    : ["rife_v4.26.safetensors", "rife_v4.26_heavy.safetensors", "rife_v4.25.safetensors", "rife_v4.25_lite.safetensors", "rife_v4.25_heavy.safetensors", "film_net_fp16.safetensors"];
  const current = sel.value;
  sel.innerHTML = "";
  for(const m of models){
    const opt = document.createElement("option");
    opt.value = m;
    const clean = m.split("/").pop();
    opt.textContent = (clean === "rife_v4.26.safetensors") ? `${clean} (Recomendado)` : clean;
    sel.appendChild(opt);
  }
  if(current && models.includes(current)) sel.value = current;
}
const _rifeState = loadRife();
loadInterpModels();
setRifeUI(_rifeState);
$("segRifeOn")?.addEventListener("click", () => { const r = getRifeState(); r.enabled = true; setRifeUI(r); saveRife(r); });
$("segRifeOff")?.addEventListener("click", () => { const r = getRifeState(); r.enabled = false; setRifeUI(r); saveRife(r); });
$("rifeEngine")?.addEventListener("change", (e) => {
  const engine = e.target.value;
  toggleRifeEngineUI(engine);
  const r = getRifeState(); r.engine = engine; saveRife(r);
});
$("rifeMultiplier")?.addEventListener("change", (e) => {
  const mult = parseInt(e.target.value, 10);
  if($("rifeFpsHint")) $("rifeFpsHint").textContent = `(24fps → ${24 * mult}fps)`;
  const r = getRifeState(); r.multiplier = mult; saveRife(r);
});
$("rifeModel")?.addEventListener("change", (e) => { const r = getRifeState(); r.model = e.target.value; saveRife(r); });

// --- RTX VIDEO SUPER RESOLUTION (2x) ---
const RTX_KEY = "ltxv_rtx_state";
const RTX_DEFAULTS = { enabled: true, quality: "HIGHBITRATE_ULTRA", scale: 2 };
function loadRtx(){
  try { return Object.assign({}, RTX_DEFAULTS, JSON.parse(localStorage.getItem(RTX_KEY) || "{}")); }
  catch(_) { return {...RTX_DEFAULTS}; }
}
function saveRtx(r){ try { localStorage.setItem(RTX_KEY, JSON.stringify(r)); } catch(_){} }
function setRtxUI(r){
  const on = $("segRtxOn"), off = $("segRtxOff");
  const panel = $("rtxControls");
  if(r.enabled){
    on?.classList.add("on"); off?.classList.remove("on");
    if(panel) panel.style.display = "";
  } else {
    off?.classList.add("on"); on?.classList.remove("on");
    if(panel) panel.style.display = "none";
  }
  if($("rtxQuality") && r.quality) $("rtxQuality").value = r.quality;
  if($("rtxScale") && r.scale) $("rtxScale").value = String(r.scale);
}
function getRtxState(){
  return {
    enabled: $("segRtxOn")?.classList.contains("on") ?? true,
    quality: $("rtxQuality")?.value || "HIGHBITRATE_ULTRA",
    scale: parseFloat($("rtxScale")?.value || "2")
  };
}
const _rtxState = loadRtx();
setRtxUI(_rtxState);
$("segRtxOn")?.addEventListener("click", () => { const r = getRtxState(); r.enabled = true; setRtxUI(r); saveRtx(r); });
$("segRtxOff")?.addEventListener("click", () => { const r = getRtxState(); r.enabled = false; setRtxUI(r); saveRtx(r); });
$("rtxQuality")?.addEventListener("change", () => { const r = getRtxState(); saveRtx(r); });
$("rtxScale")?.addEventListener("change", () => { const r = getRtxState(); saveRtx(r); });

// --- REFINADO DE ELEMENTOS (ComfyUI-H3-FaceRefine) ---
// Reutiliza el seguimiento/recorte (H3FaceTrackCrop) y el pegado (H3FaceStitch), que no
// dependen del modelo; el resampleado de los recortes se hace con LTXV (ver appendElementRefine).
let uploadedRefFace1=null, localRefFace1=null;
let uploadedRefFace2=null, localRefFace2=null;
const FACEREFINE_KEY = "ltxv_facerefine_state";
const ELEMENT_REFINE_CONFIG = {
  face: {
    detector: "face_yolov8m.pt",
    cropFactor: 3.0,
    prompt: "cinematic face, natural expression, ultra high detail, sharp focus, 8k"
  },
  hands: {
    detector: "hand_yolov8s.pt",
    cropFactor: 2.8,
    prompt: "detailed realistic hands, 5 distinct fingers, natural fingernails, high quality skin texture, sharp focus"
  },
  hair: {
    detector: "hair_yolov8n-seg_60.pt",
    cropFactor: 2.2,
    prompt: "detailed strands of hair, natural hair flow, clean scalp, high definition, sharp focus"
  },
  skin: {
    detector: "skin_yolov8m-seg_400.pt",
    cropFactor: 2.5,
    prompt: "smooth natural skin texture, realistic pores, fine details, sharp focus, 8k"
  },
  body: {
    detector: "person_yolov8m-seg.pt",
    cropFactor: 1.3,
    prompt: "detailed clothing fabric, realistic anatomy, natural posture, ultra high definition"
  }
};

const FACEREFINE_DEFAULTS = {
  enabled: false,
  target: "face",
  canvas: 512,
  steps: 4,
  denoise: 0.35,
  feather: 16,
  select: "largest_face",
  postproc: false
};
function loadFaceRefine(){
  try { return Object.assign({}, FACEREFINE_DEFAULTS, JSON.parse(localStorage.getItem(FACEREFINE_KEY) || "{}")); }
  catch(_) { return {...FACEREFINE_DEFAULTS}; }
}
function saveFaceRefine(s){
  try {
    const { refFace1, refFace2, ...rest } = s || {};
    localStorage.setItem(FACEREFINE_KEY, JSON.stringify(rest));
  } catch(_){}
}
function getFaceRefineState(){
  return {
    enabled: $("segFaceRefineOn")?.classList.contains("on") ?? false,
    target: $("faceRefineTarget")?.value || "face",
    canvas: parseInt($("faceRefineCanvasMode")?.value || "512", 10),
    steps: parseInt($("faceRefineStepsSlider")?.value || "4", 10),
    denoise: parseFloat($("faceRefineDenoiseSlider")?.value || "0.35"),
    feather: parseInt($("faceRefineFeatherSlider")?.value || "16", 10),
    select: $("faceRefineSelectMode")?.value || "largest_face",
    postproc: $("faceRefinePostprocToggle")?.checked ?? false,
    refFace1: uploadedRefFace1 || localRefFace1 || null,
    refFace2: uploadedRefFace2 || localRefFace2 || null
  };
}
function setFaceRefineUI(s){
  if(!s) return;
  const on = $("segFaceRefineOn"), off = $("segFaceRefineOff");
  const panel = $("faceRefineControls");
  if(s.enabled){
    on?.classList.add("on"); off?.classList.remove("on");
    if(panel) panel.style.display = "";
  } else {
    off?.classList.add("on"); on?.classList.remove("on");
    if(panel) panel.style.display = "none";
  }
  if($("faceRefineTarget") && s.target){
    $("faceRefineTarget").value = s.target;
  }
  if($("faceRefineCanvasMode")){
    $("faceRefineCanvasMode").value = String(s.canvas || 512);
  }
  if($("faceRefineStepsSlider")){
    const st = parseInt(s.steps != null ? s.steps : 4, 10);
    $("faceRefineStepsSlider").value = st;
    if($("faceRefineStepsVal")) $("faceRefineStepsVal").textContent = st;
    if($("faceRefineStepsHint")) $("faceRefineStepsHint").textContent = `(${st})`;
  }
  if($("faceRefineDenoiseSlider")){
    const d = parseFloat(s.denoise != null ? s.denoise : 0.35);
    $("faceRefineDenoiseSlider").value = d;
    if($("faceRefineDenoiseVal")) $("faceRefineDenoiseVal").textContent = d.toFixed(2);
    if($("faceRefineDenoiseHint")) $("faceRefineDenoiseHint").textContent = `(${d.toFixed(2)})`;
  }
  if($("faceRefineFeatherSlider")){
    const f = parseInt(s.feather != null ? s.feather : 16, 10);
    $("faceRefineFeatherSlider").value = f;
    if($("faceRefineFeatherVal")) $("faceRefineFeatherVal").textContent = f + " px";
    if($("faceRefineFeatherHint")) $("faceRefineFeatherHint").textContent = `(${f} px)`;
  }
  if($("faceRefineSelectMode") && s.select){
    $("faceRefineSelectMode").value = s.select;
  }
  if($("faceRefinePostprocToggle")){
    $("faceRefinePostprocToggle").checked = !!s.postproc;
  }
}
const _faceRefineState = loadFaceRefine();
setFaceRefineUI(_faceRefineState);
$("segFaceRefineOn")?.addEventListener("click", () => {
  const s = getFaceRefineState();
  s.enabled = true;
  setFaceRefineUI(s);
  saveFaceRefine(s);
  scheduleSaveLtxvSettings();
});
$("segFaceRefineOff")?.addEventListener("click", () => {
  const s = getFaceRefineState();
  s.enabled = false;
  setFaceRefineUI(s);
  saveFaceRefine(s);
  scheduleSaveLtxvSettings();
});
$("faceRefineTarget")?.addEventListener("change", (e) => {
  const s = getFaceRefineState();
  s.target = e.target.value;
  saveFaceRefine(s);
  scheduleSaveLtxvSettings();
});
$("faceRefineCanvasMode")?.addEventListener("change", (e) => {
  const s = getFaceRefineState();
  s.canvas = parseInt(e.target.value, 10) || 512;
  saveFaceRefine(s);
  scheduleSaveLtxvSettings();
});
$("faceRefineStepsSlider")?.addEventListener("input", (e) => {
  const st = parseInt(e.target.value, 10) || 4;
  if($("faceRefineStepsVal")) $("faceRefineStepsVal").textContent = st;
  if($("faceRefineStepsHint")) $("faceRefineStepsHint").textContent = `(${st})`;
  const s = getFaceRefineState();
  s.steps = st;
  saveFaceRefine(s);
  scheduleSaveLtxvSettings();
});
$("faceRefineDenoiseSlider")?.addEventListener("input", (e) => {
  const d = parseFloat(e.target.value) || 0.35;
  if($("faceRefineDenoiseVal")) $("faceRefineDenoiseVal").textContent = d.toFixed(2);
  if($("faceRefineDenoiseHint")) $("faceRefineDenoiseHint").textContent = `(${d.toFixed(2)})`;
  const s = getFaceRefineState();
  s.denoise = d;
  saveFaceRefine(s);
  scheduleSaveLtxvSettings();
});
$("faceRefineFeatherSlider")?.addEventListener("input", (e) => {
  const f = parseInt(e.target.value, 10) || 16;
  if($("faceRefineFeatherVal")) $("faceRefineFeatherVal").textContent = f + " px";
  if($("faceRefineFeatherHint")) $("faceRefineFeatherHint").textContent = `(${f} px)`;
  const s = getFaceRefineState();
  s.feather = f;
  saveFaceRefine(s);
  scheduleSaveLtxvSettings();
});
$("faceRefineSelectMode")?.addEventListener("change", (e) => {
  const s = getFaceRefineState();
  s.select = e.target.value;
  saveFaceRefine(s);
  scheduleSaveLtxvSettings();
});
$("faceRefinePostprocToggle")?.addEventListener("change", (e) => {
  const s = getFaceRefineState();
  s.postproc = e.target.checked;
  saveFaceRefine(s);
  scheduleSaveLtxvSettings();
});

// --- CARAS DE REFERENCIA PARA FACE REFINE ---
function handleRefFaceFile(f, slotIndex){
  if(!f) return;
  const isSlot1 = (slotIndex === 1);
  const uniqueName = `temp_face_${slotIndex}_${Date.now()}_${f.name}`;
  const fileObj = new File([f], uniqueName, {type: f.type || "image/png"});
  if(isSlot1){
    localRefFace1 = fileObj;
    uploadedRefFace1 = null;
  } else {
    localRefFace2 = fileObj;
    uploadedRefFace2 = null;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const imgEl = $(`faceRefineSlotImg${slotIndex}`);
    const prevEl = $(`faceRefineSlotPreview${slotIndex}`);
    const phEl = $(`faceRefineSlotPlaceholder${slotIndex}`);
    if(imgEl) imgEl.src = dataUrl;
    if(prevEl) prevEl.style.display = "block";
    if(phEl) phEl.style.display = "none";
    log(`Foto referencia facial ${slotIndex} cargada: ${f.name}`, "l-ok");
  };
  reader.readAsDataURL(f);
}

function clearRefFace(slotIndex){
  const isSlot1 = (slotIndex === 1);
  if(isSlot1){
    localRefFace1 = null;
    uploadedRefFace1 = null;
  } else {
    localRefFace2 = null;
    uploadedRefFace2 = null;
  }
  const imgEl = $(`faceRefineSlotImg${slotIndex}`);
  const prevEl = $(`faceRefineSlotPreview${slotIndex}`);
  const phEl = $(`faceRefineSlotPlaceholder${slotIndex}`);
  const fileInp = $(`faceRefineImgFile${slotIndex}`);
  if(imgEl) imgEl.src = "";
  if(prevEl) prevEl.style.display = "none";
  if(phEl) phEl.style.display = "block";
  if(fileInp) fileInp.value = "";
  log(`Referencia facial ${slotIndex} eliminada.`, "l-info");
}

[1, 2].forEach(slot => {
  const fileInp = $(`faceRefineImgFile${slot}`);
  const ph = $(`faceRefineSlotPlaceholder${slot}`);
  const clearBtn = $(`faceRefineSlotClear${slot}`);
  const slotWrap = ph?.closest(".ref-face-slot");

  ph?.addEventListener("click", () => fileInp?.click());
  fileInp?.addEventListener("change", (e) => {
    if(e.target.files && e.target.files[0]) handleRefFaceFile(e.target.files[0], slot);
  });
  clearBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    clearRefFace(slot);
  });

  if(slotWrap){
    ["dragenter", "dragover"].forEach(ev => {
      slotWrap.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        slotWrap.style.borderColor = "var(--accent)";
      });
    });
    ["dragleave", "drop"].forEach(ev => {
      slotWrap.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        slotWrap.style.borderColor = "var(--border)";
      });
    });
    slotWrap.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      slotWrap.style.borderColor = "var(--border)";
      if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]){
        handleRefFaceFile(e.dataTransfer.files[0], slot);
      }
    });
  }
});

// --- CALLBACKS FOR common.js ---
CONFIG.findMedia = function(nodeOutput){
  for(const k of["videos","gifs","images"]) if(nodeOutput[k]?.length) return nodeOutput[k][nodeOutput[k].length-1];
  return null;
};
CONFIG.showMedia = showVideo;
CONFIG.addToVariantGallery = addToVariantGallery;
CONFIG.renderVariantMedia = function(card, url, media){
  return `<video src="${escapeHtml(url)}" crossorigin="anonymous" controls muted preload="metadata" playsinline></video>`;
};
// Metadata para el tooltip de la variant-card: captura los sliders/LoRAs en el
// momento de crear la tarjeta (no al hacer hover, que podría haber cambiado).
  CONFIG.variantMeta = function(seedValue, timeText){
  const r = getRifeState();
  const w = parseInt($("width")?.value || 0, 10);
  const h = parseInt($("height")?.value || 0, 10);
  const rows = [
    ["Modelo", $("modelSelect")?.value || ""],
    ["Text Encoder", $("textEncoderSelect")?.value ? $("textEncoderSelect").value.split('/').pop() : ""],
    ["VAE Vídeo", $("vaeSelect")?.value || "Checkpoint"],
    ["VAE Audio", $("audioVaeSelect")?.value || "Checkpoint"],
    ["Atención", $("sageAttentionType")?.value || SAGE_DEFAULT],
    ["Interpolación", r.enabled ? ((r.engine === "rtx") ? `RTX Frame Gen · ${r.multiplier}x (${24*r.multiplier} fps)` : `RIFE · ${r.multiplier}x (${24*r.multiplier} fps) · ${(r.model||"").split('/').pop()}`) : "off"],
    ["RTX Super Resolution", (typeof getRtxState === "function" && getRtxState().enabled) ? `on (2x ${getRtxState().quality})` : "off"],
    ["Refinado", (() => { const fr = getFaceRefineState(); return fr.enabled ? `${fr.target} · ${fr.canvas}px · ${fr.steps} pasos · denoise ${Number(fr.denoise).toFixed(2)}` : "off"; })()],
    ["Cadena", $("enhancerChainMode")?.value || "off"],
    ["Resolución", (w && h) ? `${w}×${h}` : `${$("width")?.value || ""}×${$("height")?.value || ""}`],
    ["A/R", getFriendlyRatio(w, h)],
    ["Frames", $("frames")?.value || ""],
    ["Fidelidad", parseFloat($("fidelitySlider")?.value || 0).toFixed(2)],
    ["Movimiento", parseFloat($("motionSlider")?.value || 0).toFixed(1)],
  ];
  if(timeText) rows.unshift(["Tiempo gen.", timeText]);
  const loraList = (typeof loras !== "undefined" && Array.isArray(loras)) ? loras : [];
  const lorasMeta = loraList.map(l => ({
    name: l.lora ? l.lora.replace(/^.*\//, "") : "",
    strength: l.strength != null ? Number(l.strength).toFixed(2) : null,
    on: !!l.on,
  }));
  return { title: "Parámetros LTXV", rows, loras: lorasMeta };
};
CONFIG.onSeedUpdate = updateSeedUI;
// Recibe eventos `executed` del WebSocket por cada nodo que completa. En modo
// "full" (1er + final en un solo grafo) no hay un segundo prompt_id, así que
// aprovechamos estos eventos para mostrar el 1er pase en cuanto esté listo y
// mover el timer al slot 2 para que cuente solo el tiempo del 2º pase.
function displayVariantMedia(media, slot, promptId, timeText, { allowShow = true } = {}){
  if(!media || !media.filename) return;
  if(timeText) saveVideoTiming(media.filename, timeText);
  const varIndex = promptVariantMap[promptId] != null
    ? promptVariantMap[promptId]
    : (activeJob?.currentVariantIndex != null ? activeJob.currentVariantIndex : (variantCounter + 1));
  const key = `${media.filename}|${media.subfolder || ""}|${slot}`;
  const isNewGallery = !displayedGalleryFiles.has(key);

  if(allowShow){
    showVideo(slot, media, { variantIndex: varIndex });
  }
  if(isNewGallery){
    displayedGalleryFiles.add(key);
    addToVariantGallery(media, pendingSeeds[promptId] ?? null, timeText || "", slot, varIndex);
  } else if(timeText){
    // La tarjeta ya existe (creada en caliente por onNodeExecuted sin tiempo);
    // actualizar el tiempo con el valor real del backend.
    const cards = document.querySelectorAll(`.variant-card[data-slot="${slot}"]`);
    for(const card of cards){
      if(card.dataset.filename === media.filename
         && (card.dataset.subfolder || "") === (media.subfolder || "")){
        const timeSpan = card.querySelector(".variant-time");
        if(timeSpan) timeSpan.textContent = `⏱ ${timeText}`;
        break;
      }
    }
  }
}

// Limpia el preview EN VIVO de un slot específico (no el reproductor de resultado).
// Cuando el 1er pase termina, su preview obsoleto (congelado en el último frame)
// debe desaparecer del visor mientras el 2º pase sigue muestreando.
function clearPreviewSlot(slot){
  const p = $("previewImg" + slot);
  const pv = $("previewVideo" + slot);
  const e = $("empty" + slot);
  if(p){ p.style.display = "none"; p.removeAttribute("src"); }
  if(pv){ pv.pause(); pv.style.display = "none"; pv.removeAttribute("src"); pv.load(); }
  if(e) e.style.display = "";
}

CONFIG.onNodeExecuted = function(data){
  if(!data || !data.node || !data.prompt_id) return;
  const pid = data.prompt_id;
  // Solo nos interesan los save nodes del job activo en modo full.
  const job = activeJob;
  if(!job || job.firstPassOnly) return;
  if(!(pid in pendingSeeds)) return;
  const realSeed = pendingSeeds[pid];

  // FIRST_SAVE (923): el 1er pase está listo. Lo mostramos, registramos su
  // tiempo y movemos el timer al slot 2 para contar solo el 2º pase.
  if(data.node === N.FIRST_SAVE && data.output){
    const media = CONFIG.findMedia(data.output);
    if(media){
      if(!displayedSlots[pid]) displayedSlots[pid] = new Set();
      const isFirstLive = !displayedSlots[pid].has(1);
      let firstElapsedStr = "";
      if(isFirstLive){
        displayedSlots[pid].add(1);
        const t = timers[pid];
        if(t){
          const elapsed = Date.now() - t.start;
          firstElapsedStr = fmtMs(elapsed);
          const el1 = $("time1");
          if(el1){ el1.textContent = `⏱ 1er ${firstElapsedStr}`; el1.classList.remove("live"); }
          // Reiniciar el timer en el slot 2 para contar solo el 2º pase.
          clearInterval(t.iv);
          t.start = Date.now();
          const el2 = $("time2");
          t.iv = setInterval(() => {
            if(!timers[pid]) return;
            const live = `⏱ ${fmtMs(Date.now() - t.start)}`;
            if(el2){ el2.textContent = live; el2.classList.add("live"); }
          }, 500);
        }
        log(`✅ 1er pase listo (esperando 2º pase)...`, "l-ok");
      }
      // Si ya se había mostrado por fallback, no volvemos a cambiar el reproductor;
      // solo aseguramos la tarjeta de galería. Pasamos el tiempo medido por el
      // timer del cliente porque el backend no siempre registra t1 en el history.
      displayVariantMedia(media, 1, pid, firstElapsedStr, { allowShow: isFirstLive });
      if(isFirstLive){
        // El 1er pase ya tiene vídeo propio: su preview en vivo (congelado)
        // sobra mientras el 2º pase sigue muestreando.
        clearPreviewSlot(1);
      }
    }
  }

  // FINAL_SAVE (920): el 2º pase está listo. Lo mostramos y detenemos el timer.
  if(data.node === N.FINAL_SAVE && data.output){
    const media = CONFIG.findMedia(data.output);
    if(media){
      if(!displayedSlots[pid]) displayedSlots[pid] = new Set();
      const isFinalLive = !displayedSlots[pid].has(2);
      let finalElapsedStr = "";
      if(isFinalLive){
        displayedSlots[pid].add(2);
        const t = timers[pid];
        if(t){
          const elapsed = Date.now() - t.start;
          finalElapsedStr = fmtMs(elapsed);
          const el2 = $("time2");
          if(el2){ el2.textContent = `⏱ final ${finalElapsedStr}`; el2.classList.remove("live"); }
        }
        log(`✅ 2º pase listo.`, "l-ok");
      }
      displayVariantMedia(media, 2, pid, finalElapsedStr, { allowShow: isFinalLive });
      if(isFinalLive){
        // Resultado final cargado: fuera el preview del 2º pase congelado.
        clearPreviewSlot(2);
      }
    }
  }
};

CONFIG.onPreview = function(url, meta){
  const pid = currentPromptId;
  const isFirst = activeJob?.firstPassOnly || (!displayedSlots[pid] || !displayedSlots[pid].has(1));
  const slot = isFirst ? 1 : 2;
  // El backend puede seguir mandando frames del pase que ya terminó (el preview
  // va por latente, no por save node): ignorar los del pase ya mostrado, si no
  // revivirían el preview que acabamos de limpiar en clearPreviewSlot.
  if(displayedSlots[pid] && displayedSlots[pid].has(slot)) return;
  const p = $("previewImg" + slot);
  const pv = $("previewVideo" + slot);
  const e = $("empty" + slot);
  const v = $("video" + slot);
  if(!p && !pv) return;
  const isVideoUrl = typeof url === "string" && (url.startsWith("data:video/mp4") || url.startsWith("data:video/webm"));
  const target = isVideoUrl && pv ? pv : p;
  const other  = isVideoUrl ? p : pv;
  target.src = url;
  target.style.display = "block";
  if(other) other.style.display = "none";
  if(e) e.style.display = "none";
  if(v && (!displayedSlots[pid] || !displayedSlots[pid].has(slot))){
    v.style.display = "none";
  }
  if(isVideoUrl && pv && pv.autoplay !== true){ pv.autoplay = true; pv.muted = true; pv.loop = true; }
  if(isVideoUrl && target.play) target.play().catch(()=>{});
  if(currentPromptId && promptVariantMap[currentPromptId]){
    const varIdx = promptVariantMap[currentPromptId];
    const cardImg = document.querySelector(`.variant-card[data-variant-index="${varIdx}"] .variant-live-thumb`);
    if(cardImg && !isVideoUrl){
      cardImg.src = url;
      cardImg.style.opacity = "1";
    }
  }
};

CONFIG.onClearPreview = function(){
  const p1 = $("previewImg1"), p2 = $("previewImg2");
  const pv1 = $("previewVideo1"), pv2 = $("previewVideo2");
  if(p1){ p1.style.display = "none"; p1.removeAttribute("src"); }
  if(p2){ p2.style.display = "none"; p2.removeAttribute("src"); }
  if(pv1){ pv1.pause(); pv1.style.display = "none"; pv1.removeAttribute("src"); pv1.load(); }
  if(pv2){ pv2.pause(); pv2.style.display = "none"; pv2.removeAttribute("src"); pv2.load(); }
};

CONFIG.onPromptError = function(pid){
  // No avanzar la cola aquí: common.js ya hace currentBatchIndex++ +
  // processNextBatch tras este callback; llamar a finishCurrentJob() desde
  // aquí arranca el siguiente job mientras processNextBatch dispara una
  // variante del job ANTIGUO (race de batch/variantCounter).
  delete promptVariantMap[pid];
  delete displayedSlots[pid];
  if(generationStep === 1) generationStep = 0;
};
CONFIG.startNextVariant = function(index){
  // LTXV gestiona sus propios pasos; este callback solo se usa por common.js
  // en caso de error o borde. Empezamos siempre en paso 1.
  if(!activeJob) return;
  generationStep = 1;
  finalVariantIndex = null;
  runSingleGeneration(index);
};
CONFIG.onBatchComplete = function(){
  finishCurrentJob();
};
CONFIG.onStopCurrent = function(pid){
  delete pendingSeeds[pid];
  delete promptVariantMap[pid];
  delete displayedSlots[pid];
  generationStep = 0;
  finalVariantIndex = null;
};
CONFIG.onStopAll = function(){
  if(currentPromptId) handledPrompts.add(currentPromptId);
  promptVariantMap = {};
  displayedGalleryFiles.clear();
  for(const k of Object.keys(displayedSlots)) delete displayedSlots[k];
  currentPromptId = null;
  generationStep = 0;
  // Vaciar cola pendiente al parar todo.
  jobQueue = [];
  activeJob = null;
  updateQueueUI();
  enableStopButtons(false);
  $("btnFirstPass").disabled=false;
  $("btnFull").disabled=false;
};

// --- LTXV displayResult callback (handles step 1 -> step 2 logic) ---
CONFIG.displayResult = async function(entry, realSeed, tTotal, promptId, timings){
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

  const media1 = entry.outputs[N.FIRST_SAVE] ? CONFIG.findMedia(entry.outputs[N.FIRST_SAVE]) : null;
  const media2 = entry.outputs[N.FINAL_SAVE] ? CONFIG.findMedia(entry.outputs[N.FINAL_SAVE]) : null;

  const job = activeJob;
  const firstPassOnly = job ? job.firstPassOnly : true;
  const t1 = timings && timings.t1;
  const t2 = timings && timings.t2;

  if(!displayedSlots[promptId]) displayedSlots[promptId] = new Set();
  const already1 = displayedSlots[promptId].has(1);
  const already2 = displayedSlots[promptId].has(2);

  // Modo "full" (1er pase + final en un solo grafo): ComfyUI ejecuta ambos
  // samplers dentro del mismo prompt_id y dispara un único execution_success.
  // Los vídeos se muestran incrementalmente vía onNodeExecuted (evento executed
  // del WS) en cuanto cada save node completa. Aquí actuamos como respaldo
  // solo si el WS no llegó a mostrar ese slot, pero siempre actualizamos el
  // tiempo de la tarjeta de galería con el valor real del backend.
  if(!firstPassOnly){
    if(media1){
      if(!already1){
        displayedSlots[promptId].add(1);
        displayVariantMedia(media1, 1, promptId, t1 || "", { allowShow: true });
      } else if(t1){
        displayVariantMedia(media1, 1, promptId, t1, { allowShow: false });
      }
      paint(1, "1er", t1 || "—");
    } else if(job && job.savePreview === false){
      paint(1, "1er", "sin preview");
    }
    if(media2){
      if(!already2){
        displayedSlots[promptId].add(2);
        displayVariantMedia(media2, 2, promptId, t2 || tTotal || "", { allowShow: true });
      } else if(t2 || tTotal){
        displayVariantMedia(media2, 2, promptId, t2 || tTotal || "", { allowShow: false });
      }
      paint(2, "final", t2 || tTotal || "—");
    }
  } else {
    // Modo "first" (solo 1er pase).
    if(media1){
      if(!already1){
        displayedSlots[promptId].add(1);
        displayVariantMedia(media1, 1, promptId, t1 || tTotal || "", { allowShow: true });
      } else if(t1 || tTotal){
        displayVariantMedia(media1, 1, promptId, t1 || tTotal || "", { allowShow: false });
      }
      paint(1, "1er", t1 || tTotal || "—");
    }
  }

  delete pendingSeeds[promptId];
  delete promptVariantMap[promptId];
  delete displayedSlots[promptId];
  generationStep = 0;
  finalVariantIndex = null;
  handledPrompts.add(promptId);

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
  const ratioStr = getFriendlyRatio(w, h);
  if($("arDetectHint")) $("arDetectHint").textContent = `(${ratioStr})`;
}

function updateQueueUI(){
  const count = jobQueue.length;
  const clearBtn = $("btnClearQueue");
  if(clearBtn) clearBtn.disabled = count === 0;

  // Auto-recuperación si activeJob quedó huérfano con ComfyUI en reposo
  // (patrón mmh3x2/minimaxh3): un POST colgado dejaba la cola atascada.
  if(activeJob && typeof serverQueueState !== "undefined" && serverQueueState.running === 0 && serverQueueState.pending === 0){
    queueIdleCount = (queueIdleCount || 0) + 1;
    if(queueIdleCount >= 2){
      queueIdleCount = 0;
      console.warn("Liberando activeJob huérfano (ComfyUI está en reposo)");
      log("🧟 Job activo huérfano liberado (ComfyUI está en reposo); retomando la cola...", "l-warn");
      activeJob = null;
      currentPromptId = null;
      generationStep = 0;
      enableStopButtons(false);
      if(jobQueue.length > 0){
        const next = jobQueue.shift();
        updateQueueUI();
        log(`⏭️ Iniciando siguiente job de la cola (${jobQueue.length} restantes)...`, "l-info");
        startJob(next);
      }
      return;
    }
  } else {
    queueIdleCount = 0;
  }

  // Cálculo de variantes/vídeos pendientes
  const activeRemainingVars = activeJob ? Math.max(1, (totalBatchSize - currentBatchIndex)) : 0;
  const queueVariants = jobQueue.reduce((acc, j) => acc + (j.batchSize || 1), 0);
  const totalLocalVideos = (activeJob ? activeRemainingVars : 0) + queueVariants;
  const serverPending = (typeof serverQueueState !== "undefined" && serverQueueState.pending) ? serverQueueState.pending : 0;
  const serverRunning = (typeof serverQueueState !== "undefined" && serverQueueState.running) ? serverQueueState.running : 0;
  const totalPendingGlobal = totalLocalVideos + serverPending;

  // Badge total
  const totalNumEl = $("queueTotalNum");
  const totalBadgeEl = $("queueTotalBadge");
  if(totalNumEl) totalNumEl.textContent = totalPendingGlobal;
  if(totalBadgeEl){
    if(totalPendingGlobal > 0) totalBadgeEl.classList.add("active");
    else totalBadgeEl.classList.remove("active");
  }

  // Tarjeta Esta WebUI
  const webuiSummary = $("queueWebuiSummary");
  const webuiDetail = $("queueWebuiDetail");
  if(webuiSummary){
    if(count === 0 && !activeJob){
      webuiSummary.textContent = "0 en espera";
    } else {
      webuiSummary.textContent = `${count} en cola (${queueVariants} vids)`;
    }
  }
  if(webuiDetail){
    if(activeJob){
      const stepText = activeJob.firstPassOnly ? "1er pase" : `Paso ${generationStep || 1}/2`;
      webuiDetail.textContent = `▶ Job #${activeJob.id} · Var ${currentBatchIndex + 1}/${totalBatchSize} (${stepText})`;
    } else {
      webuiDetail.textContent = "En reposo";
    }
  }

  // Tarjeta Servidor ComfyUI
  const srvSummary = $("queueServerSummary");
  const srvDetail = $("queueServerDetail");
  if(srvSummary){
    srvSummary.textContent = `${serverPending} en espera`;
  }
  if(srvDetail){
    srvDetail.textContent = `${serverRunning} en GPU · ${serverPending} en cola ComfyUI`;
  }

  // Desplegable de trabajos en cola
  const accordion = $("queueItemsAccordion");
  const itemsTitle = $("queueItemsTitle");
  const itemsList = $("queueItemsList");
  if(itemsTitle) itemsTitle.textContent = `Ver trabajos en cola (${count})`;
  if(accordion){
    accordion.style.display = count > 0 ? "block" : "none";
  }
  if(itemsList && count > 0){
    itemsList.innerHTML = "";
    jobQueue.forEach((job, idx) => {
      const row = document.createElement("div");
      row.className = "queue-item-row";
      const pEsc = escapeHtml((job.prompt || "sin prompt").trim());
      const pText = pEsc;
      const pShort = pText.length > 35 ? pText.slice(0, 35) + "…" : pText;
      const typeLabel = job.firstPassOnly ? "1er pase" : "completo";
      row.innerHTML = `
        <div class="queue-item-left" title="${pText}">
          <span class="queue-item-id">#${job.id}</span>
          <span class="queue-item-desc">${pShort} · ${job.batchSize || 1} var(s) · ${typeLabel}</span>
        </div>
        <span class="queue-item-del" title="Eliminar este trabajo de la cola">×</span>
      `;
      row.querySelector(".queue-item-del").addEventListener("click", (e) => {
        e.stopPropagation();
        jobQueue.splice(idx, 1);
        updateQueueUI();
        log(`🗑️ Job #${job.id} eliminado de la cola.`, "l-ok");
      });
      itemsList.appendChild(row);
    });
  }
}

$("queueItemsToggle")?.addEventListener("click", () => {
  $("queueItemsAccordion")?.classList.toggle("open");
});

let jobCounter = 0;
// --- DIÁLOGO / AUDIO NATIVO (LTX-2.5 genera audio con el vídeo) ---
// Términos que desalientan la voz, aplicados dinámicamente al negativo:
// "Sin diálogo" los añade; "Con diálogo" los retira junto a newscast/interview...
const DIALOGUE_NEG_TERMS = "dialogue, speech, talking, voices, conversation, chatter, murmuring, whispering, monologue, lip-sync";
const DIALOGUE_STRIP_FOR_SPEECH = ["yelling", "newscast", "interview", "podcast"];
const DIALOGUE_STRIP_RE = new RegExp(",?\\s*\\b(dialogue|speech|talking|voices|conversation|chatter|murmuring|whispering|monologue|lip-sync)\\b", "gi");

function getDialogueMode(){
  const byId = { "segDlgAuto": "auto", "segDlgSilence": "no_dialogue", "segDlgSpeak": "dialogue" };
  for(const [id, val] of Object.entries(byId)){
    if($(id)?.classList.contains("on")) return val;
  }
  return "no_dialogue";
}
function setDialogueModeUI(mode){
  const map = { "auto": "segDlgAuto", "no_dialogue": "segDlgSilence", "dialogue": "segDlgSpeak" };
  for(const [val, id] of Object.entries(map)){
    $(id)?.classList.toggle("on", val === (mode || "no_dialogue"));
  }
}
function initDialogueListeners(){
  $("segDlgAuto")?.addEventListener("click", () => {
    setDialogueModeUI("auto");
    if(typeof scheduleSaveLtxvSettings === "function") scheduleSaveLtxvSettings();
  });
  $("segDlgSilence")?.addEventListener("click", () => {
    setDialogueModeUI("no_dialogue");
    if(typeof scheduleSaveLtxvSettings === "function") scheduleSaveLtxvSettings();
  });
  $("segDlgSpeak")?.addEventListener("click", () => {
    setDialogueModeUI("dialogue");
    if(typeof scheduleSaveLtxvSettings === "function") scheduleSaveLtxvSettings();
  });
}
// Aplica el modo al negativo (nodo 537 CLIPTextEncode estático del workflow) y al volumen de audio (551/598).
function applyDialogueMode(g, mode){
  mode = mode || "no_dialogue";
  const negNode = g["537"];
  if(negNode && negNode.inputs && typeof negNode.inputs.text === "string"){
    let neg = negNode.inputs.text.replace(DIALOGUE_STRIP_RE, "");
    neg = neg.replace(/\s+,/g, ",").replace(/,\s*,/g, ",");
    if(mode === "no_dialogue"){
      if(!neg.toLowerCase().includes("dialogue")) neg = neg.replace("yelling", "yelling, " + DIALOGUE_NEG_TERMS);
    } else if(mode === "dialogue"){
      for(const t of DIALOGUE_STRIP_FOR_SPEECH){
        neg = neg.replace(new RegExp(",?\\s*\\b" + t + "\\b", "gi"), "");
      }
      neg = neg.replace(/\s+,/g, ",").replace(/,\s*,/g, ",");
    }
    negNode.inputs.text = neg.replace(/,\s*$/, "");
  }
  // Audio en la salida: -100 dB silencia; el resto suena tal cual se generó.
  for(const vid of ["551", "598"]){
    if(g[vid] && g[vid].class_type === "AudioAdjustVolume"){
      g[vid].inputs.volume = (mode === "no_dialogue") ? -100 : 1;
    }
  }
}

// --- COLOR GRADING & LOOK CINEMÁTICO (implementación MiniMaxH3) ---
const LTXV_COLORFX_KEY = "ltxv_colorfx_v1";
function loadLtxvColorFx(){
  try { return JSON.parse(localStorage.getItem(LTXV_COLORFX_KEY) || "null") || null; }
  catch(_){ return null; }
}
function saveLtxvColorFx(s){
  try { localStorage.setItem(LTXV_COLORFX_KEY, JSON.stringify(s)); } catch(_){}
}
function getPostFxState(){
  return {
    enabled: $("segPostFxOn")?.classList.contains("on") ?? false,
    lut: {
      enabled: $("postFxLutToggle")?.checked ?? true,
      name: $("postFxLutSelect")?.value || "",
      strength: parseFloat($("postFxLutStrength")?.value || "0.8")
    },
    vignette: {
      enabled: $("postFxVigToggle")?.checked ?? false,
      intensity: parseFloat($("postFxVigIntensity")?.value || "0.25")
    },
    grain: {
      enabled: $("postFxGrainToggle")?.checked ?? false,
      power: parseFloat($("postFxGrainPower")?.value || "0.15")
    }
  };
}
function setPostFxUI(s){
  if(!s) return;
  const on = $("segPostFxOn"), off = $("segPostFxOff");
  const panel = $("postFxControls");
  if(s.enabled){
    on?.classList.add("on"); off?.classList.remove("on");
    if(panel) panel.style.display = "block";
  } else {
    off?.classList.add("on"); on?.classList.remove("on");
    if(panel) panel.style.display = "none";
  }
  if($("postFxLutToggle")) $("postFxLutToggle").checked = s.lut?.enabled ?? true;
  if($("postFxLutSelect") && s.lut?.name) $("postFxLutSelect").value = s.lut.name;
  if($("postFxLutStrength")){
    $("postFxLutStrength").value = s.lut?.strength ?? 0.8;
    if($("postFxLutVal")) $("postFxLutVal").textContent = Math.round(parseFloat($("postFxLutStrength").value) * 100) + "%";
  }
  if($("postFxVigToggle")) $("postFxVigToggle").checked = !!s.vignette?.enabled;
  if($("postFxVigIntensity")){
    $("postFxVigIntensity").value = s.vignette?.intensity ?? 0.25;
    if($("postFxVigVal")) $("postFxVigVal").textContent = parseFloat($("postFxVigIntensity").value).toFixed(2);
  }
  if($("postFxGrainToggle")) $("postFxGrainToggle").checked = !!s.grain?.enabled;
  if($("postFxGrainPower")){
    $("postFxGrainPower").value = s.grain?.power ?? 0.15;
    if($("postFxGrainVal")) $("postFxGrainVal").textContent = parseFloat($("postFxGrainPower").value).toFixed(2);
  }
}
function populatePostFxLuts(){
  const sel = $("postFxLutSelect");
  if(!sel) return;
  const luts = (typeof AVAILABLE_LUTS !== "undefined" && Array.isArray(AVAILABLE_LUTS)) ? AVAILABLE_LUTS : [];
  const prev = sel.value;
  sel.innerHTML = '<option value="">-- Seleccionar LUT (.cube) --</option>';
  for(const name of luts){
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name.endsWith(".cube") ? name.slice(0, -5) : name;
    sel.appendChild(opt);
  }
  if(luts.length === 0){
    sel.innerHTML = '<option value="">-- Sin LUTs (.cube) disponibles --</option>';
  }
  if(prev && luts.includes(prev)){
    sel.value = prev;
  }
}
function initPostFxListeners(){
  const persist = () => {
    saveLtxvColorFx(getPostFxState());
    if(typeof scheduleSaveLtxvSettings === "function") scheduleSaveLtxvSettings();
  };
  $("segPostFxOn")?.addEventListener("click", () => { const s = getPostFxState(); s.enabled = true; setPostFxUI(s); persist(); });
  $("segPostFxOff")?.addEventListener("click", () => { const s = getPostFxState(); s.enabled = false; setPostFxUI(s); persist(); });
  $("postFxLutToggle")?.addEventListener("change", persist);
  $("postFxLutSelect")?.addEventListener("change", persist);
  $("postFxLutStrength")?.addEventListener("input", (e) => {
    if($("postFxLutVal")) $("postFxLutVal").textContent = Math.round(parseFloat(e.target.value) * 100) + "%";
    persist();
  });
  $("postFxVigToggle")?.addEventListener("change", persist);
  $("postFxVigIntensity")?.addEventListener("input", (e) => {
    if($("postFxVigVal")) $("postFxVigVal").textContent = parseFloat(e.target.value).toFixed(2);
    persist();
  });
  $("postFxGrainToggle")?.addEventListener("change", persist);
  $("postFxGrainPower")?.addEventListener("input", (e) => {
    if($("postFxGrainVal")) $("postFxGrainVal").textContent = parseFloat(e.target.value).toFixed(2);
    persist();
  });
  populatePostFxLuts();
  const st = loadLtxvColorFx();
  if(st) setPostFxUI(st);
}
function appendVideoPostFx(g, imageRef, postFxState, seedHint){
  const fx = postFxState || getPostFxState();
  if(fx && fx.enabled){
    const grainSeed = 1 + (Math.abs(parseInt(seedHint || 1, 10) || 1) % 1000);
    const useLut = !!(fx.lut?.enabled && fx.lut?.name);
    // El slider de viñeta (0–0.6) se escala ×4 como en h3; el nodo recorta
    // internamente la opacidad a 0..1 (igual que ProPostVignette).
    const vig = fx.vignette?.enabled ? Math.min(2.0, parseFloat(fx.vignette.intensity || 0) * 4) : 0;
    const grain = fx.grain?.enabled ? parseFloat(fx.grain.power || 0) : 0;
    if(useLut || vig > 0 || grain > 0){
      // Nodo propio (vectorizado + chunking + in-place): los nodos ProPost
      // (comfyui-propost) hacen bucle Python por frame/píxel y reservan el batch
      // completo (zeros_like) → RAM disparada y reinicio de ComfyUI con vídeos
      // de 360-1200 frames. Este nodo hace LUT+viñeta+grano en segundos y acota RAM.
      g["post_fx"] = {
        class_type: "LTXWebVideoFX",
        inputs: {
          image: imageRef,
          lut_name: useLut ? fx.lut.name : "",
          lut_strength: useLut ? parseFloat(fx.lut.strength ?? 0.8) : 0.8,
          vignette: vig,
          vignette_cx: 0.5,
          vignette_cy: 0.5,
          grain: grain,
          grain_size: 1.0,
          grain_seed: grainSeed,
          grain_mono: true,
          chunk_mb: 1024,
        },
        _meta: { title: "LTXWeb Video FX (LUT/Viñeta/Grano)" }
      };
      return ["post_fx", 0];
    }
  }
  delete g["post_fx"];
  return imageRef;
}

// Sigmas del refinado: rampa lineal desde el denoise hasta 0 (img2img de flujo).
function buildRefineSigmas(denoise, steps){
  const d = Math.max(0.05, Math.min(1, parseFloat(denoise) || 0.35));
  const n = Math.max(1, parseInt(steps, 10) || 4);
  const out = [];
  for(let i = 0; i <= n; i++) out.push((d * (1 - i / n)).toFixed(6));
  return out.join(", ");
}

// Refinado de elementos sobre el vídeo final decodificado (antes de RIFE / RTX SR / Post-FX).
// H3FaceTrackCrop y H3FaceStitch son independientes del modelo; el resampleado de los
// recortes se hace con LTXV: VAEEncode → AV latent (con el audio del 2º pase) →
// SamplerCustom a bajo denoise → VAEDecode. No se usan H3PerFrameDenoise ni
// H3InjectVideoLatent: el parche de modelo del primero llama a audio_scale() (solo H3).
function appendElementRefine(g, imagesRef, j){
  const fr = j ? j.faceRefine : getFaceRefineState();
  ["fr_ref_img_1", "fr_ref_img_2", "fr_sampler_select"].forEach(id => { delete g[id]; });
  const passIds = ["crop", "trim", "enc", "av", "ref", "pos", "cond", "sigmas", "sampler", "sep", "dec", "stitch"];
  const clearPass = (p) => passIds.forEach(id => { delete g[`fr${p}_${id}`]; });
  clearPass(1); clearPass(2);
  if(!fr || !fr.enabled) return imagesRef;

  const vaeRef = g[N.DECODE_VIDEO_2]?.inputs?.vae || [N.CHECKPOINT, 2];
  const clipRef = g[N.PROMPT]?.inputs?.clip || [N.LTXAV_TEXT_ENCODER, 0];
  const negRef = g["523"]?.inputs?.negative || ["537", 0];
  const frameRateRef = g["523"]?.inputs?.frame_rate || ["542", 0];
  // Longitud real del vídeo (frames+1 = 8k+1). H3FaceTrackCrop rellena los recortes
  // hasta la rejilla 17k+5 de H3; se recortan de vuelta para que el VAE de LTXV
  // reciba 8k+1 frames y el audio del 2º pase encaje en duración.
  const lengthRef = g["534"]?.inputs?.length || ["798", 1];
  const audioLatentRef = ["596", 1];

  const canvas = parseInt(fr.canvas || 512, 10) || 512;
  const steps = (typeof fr.steps === "number") ? fr.steps : 4;
  const denoise = fr.denoise || 0.35;
  const feather = fr.feather || 16;
  const target = fr.target || "face";
  const isCombo = (target === "face_hands");
  const rawSelect = fr.select || "largest_face";
  const isDual = (rawSelect === "dual_faces") || isCombo;
  const elemCfg1 = ELEMENT_REFINE_CONFIG[isCombo ? "face" : target] || ELEMENT_REFINE_CONFIG.face;
  const elemCfg2 = isCombo ? ELEMENT_REFINE_CONFIG.hands : elemCfg1;

  let pass1Select = "largest_face", pass1Index = 0;
  if(rawSelect === "second_face"){
    pass1Index = 1;
  } else if(rawSelect === "centre_most" || rawSelect === "left_most" || rawSelect === "right_most"){
    pass1Select = rawSelect;
  }

  const sMode = j ? j.seedMode : seedMode;
  const sVal = j ? j.seedValue : parseInt($("seedVal")?.value || "12345", 10);
  const seedFor = (k) => (sMode === "random") ? Math.floor(Math.random() * 100000000) : (sVal + k);

  const refFace1 = j ? j.uploadedRefFace1 : uploadedRefFace1;
  const refFace2 = j ? j.uploadedRefFace2 : uploadedRefFace2;
  const loadRef = (id, obj, title) => {
    g[id] = {
      class_type: "LoadImage",
      inputs: { image: (obj.subfolder ? obj.subfolder + "/" : "") + obj.name },
      _meta: { title }
    };
    return [id, 0];
  };
  const ref1 = refFace1 ? loadRef("fr_ref_img_1", refFace1, "Element Refine · Ref. Cara 1") : null;
  const ref2 = refFace2 ? loadRef("fr_ref_img_2", refFace2, "Element Refine · Ref. Cara 2") : null;

  g["fr_sampler_select"] = {
    class_type: "KSamplerSelect",
    inputs: { sampler_name: "euler" },
    _meta: { title: "Element Refine · Sampler" }
  };

  const basePrompt = ((j ? j.prompt : $("prompt")?.value) || "").trim();

  const addPass = (p, srcImages, elemCfg, select, selectIndex, refImg, seed) => {
    const id = (s) => `fr${p}_${s}`;
    const cropInputs = {
      images: srcImages,
      detector: elemCfg.detector,
      confidence: 0.35,
      crop_factor: elemCfg.cropFactor,
      canvas_width: canvas,
      canvas_height: canvas,
      canvas_mode: "manual",
      smooth_window: 21,
      size_smooth_window: 51,
      smooth_method: "gaussian",
      size_mode: "per_frame",
      identity_track: !!refImg,
      identity_threshold: 0.28,
      select,
      fallback_detector: "none",
      fallback_head_frac: 0.5,
      select_index: selectIndex,
      identity_model: "insightface",
      cut_detection: "none",
      cut_threshold: 3.0,
      absent_shots: "off",
      X: 0,
      Y: 0,
      frame_index: 0
    };
    if(refImg) cropInputs.identity_reference = refImg;
    g[id("crop")] = { class_type: "H3FaceTrackCrop", inputs: cropInputs, _meta: { title: `Element Track Crop ${p}` } };
    g[id("trim")] = {
      class_type: "ImageFromBatch",
      inputs: { image: [id("crop"), 0], batch_index: 0, length: lengthRef },
      _meta: { title: `Element Crops 8k+1 ${p}` }
    };
    g[id("enc")] = {
      class_type: "VAEEncode",
      inputs: { pixels: [id("trim"), 0], vae: vaeRef },
      _meta: { title: `Element Crops Encode ${p}` }
    };
    g[id("av")] = {
      class_type: "LTXVConcatAVLatent",
      inputs: { video_latent: [id("enc"), 0], audio_latent: audioLatentRef },
      _meta: { title: `Element AV Latent ${p}` }
    };
    // LTXReferenceConditioning con strength 0 solo limpia la referencia de la imagen de
    // entrada que 860/870 dejan en el diffusion_model (si no, se colaría en el recorte);
    // target_latent fuerza además a que se ejecute tras el 2º pase. Las caras de referencia
    // NO se usan para condicionar: medido con InsightFace, ni este nodo (reference /
    // prefix_continuous, strength 1–1.5) ni subir el denoise a 0.9 acercan la identidad
    // (similitud ~0.03). En LTXV solo sirven para elegir a quién sigue el recorte.
    g[id("ref")] = {
      class_type: "LTXReferenceConditioning",
      inputs: {
        model: [N.LORA, 0],
        vae: vaeRef,
        image: [id("trim"), 0],
        target_latent: [id("enc"), 0],
        strength: 0.0,
        position_mode: "reference",
        verbose: false
      },
      _meta: { title: `Element Reference Clear ${p}` }
    };
    const prompt = basePrompt ? `${basePrompt}, ${elemCfg.prompt}` : elemCfg.prompt;
    g[id("pos")] = {
      class_type: "CLIPTextEncode",
      inputs: { text: prompt, clip: clipRef },
      _meta: { title: `Element Prompt ${p}` }
    };
    g[id("cond")] = {
      class_type: "LTXVConditioning",
      inputs: { positive: [id("pos"), 0], negative: negRef, frame_rate: frameRateRef },
      _meta: { title: `Element Conditioning ${p}` }
    };
    g[id("sigmas")] = {
      class_type: "ManualSigmas",
      inputs: { sigmas: buildRefineSigmas(denoise, steps) },
      _meta: { title: `Element Refine Sigmas ${p}` }
    };
    g[id("sampler")] = {
      class_type: "SamplerCustom",
      inputs: {
        add_noise: true,
        noise_seed: seed,
        cfg: 1,
        model: [id("ref"), 0],
        positive: [id("cond"), 0],
        negative: [id("cond"), 1],
        sampler: ["fr_sampler_select", 0],
        sigmas: [id("sigmas"), 0],
        latent_image: [id("av"), 0]
      },
      _meta: { title: `Element Refine Sampler ${p}` }
    };
    g[id("sep")] = {
      class_type: "LTXVSeparateAVLatent",
      inputs: { av_latent: [id("sampler"), 0] },
      _meta: { title: `Element Separate AV ${p}` }
    };
    g[id("dec")] = {
      class_type: "VAEDecode",
      inputs: { samples: [id("sep"), 0], vae: vaeRef },
      _meta: { title: `Element Crops Decode ${p}` }
    };
    g[id("stitch")] = {
      class_type: "H3FaceStitch",
      inputs: {
        base_images: srcImages,
        refined_crops: [id("dec"), 0],
        transform: [id("crop"), 1],
        paste_region: "face_ellipse",
        mask_dilation: 6,
        feather,
        colour_match: 0.5,
        blend: 1.0,
        undetected_frames: "fade_out",
        feather_scales_with_crop: false
      },
      _meta: { title: `Element Stitch ${p}` }
    };
    return [id("stitch"), 0];
  };

  let out = addPass(1, imagesRef, elemCfg1, pass1Select, pass1Index, ref1, seedFor(0));
  if(isDual){
    // Pasada 2: segundo rostro (Dual) o manos (Combo). Solo usa la Ref. 2: reutilizar la
    // Ref. 1 haría que el seguimiento volviese a la misma persona de la pasada 1.
    out = addPass(2, out, elemCfg2, "largest_face", isCombo ? 0 : 1, isCombo ? null : ref2, seedFor(1));
  }
  return out;
}

function snapshotJob(firstPassOnly){
  // Captura inmutable de todos los parámetros necesarios para reproducir el job
  return {
    id: ++jobCounter,
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
    dialogueMode: getDialogueMode(),
    postfx: getPostFxState(),
    firstPassSteps: $("firstPassSteps")?.value || "8",
    model: $("modelSelect")?.value,
    textEncoder: $("textEncoderSelect")?.value,
    vae: $("vaeSelect")?.value,
    audioVae: $("audioVaeSelect")?.value,
    filenamePrefix: $("filenamePrefix")?.value,
    sageType: $("sageAttentionType")?.value,
    purgeVram: !!$("purgeVram")?.checked,
    savePreview: $("savePreview")?.checked ?? true,
    rife: getRifeState(),
    rtx: getRtxState(),
    faceRefine: getFaceRefineState(),
    uploadedRefFace1: uploadedRefFace1 ? {...uploadedRefFace1} : null,
    uploadedRefFace2: uploadedRefFace2 ? {...uploadedRefFace2} : null,
    localRefFace1: localRefFace1,
    localRefFace2: localRefFace2,
    bitDepth: getBitDepth(),
    loras: JSON.parse(JSON.stringify(loras)),
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
      div.innerHTML = `<img src="${url}" loading="lazy" referrerpolicy="no-referrer"><div class="info-tag">${escapeHtml(tsTxt)} · ${sizeKB}KB</div>`;
      div.addEventListener("click", () => {
        const items = Array.from(grid.querySelectorAll(".gallery-item"));
        krea2RecentIndex = items.indexOf(div);
        loadKrea2ImageAsInput(url, it.filename);
      });
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
  // Limpiamos ?ref de la URL tras procesarlo: al recargar no debe volver a
  // desplegarse el panel de imágenes Krea2 recientes ni recargarse la imagen.
  try {
    const clean = new URL(window.location.href);
    clean.searchParams.delete("ref");
    history.replaceState(null, "", clean.pathname + (clean.search ? clean.search : "") + clean.hash);
  } catch(_){}
  // El panel de "Imágenes Krea2 recientes" NO se despliega automáticamente:
  // se mantiene colapsado y sus miniaturas se cargan al abrirlo (toggle).
  (async () => {
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


async function applyWorkflow(workflow, opts={}){
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
  const unetLoader = findByClass("UNETLoader");
  const modelName = (checkpoint && checkpoint.inputs && checkpoint.inputs.ckpt_name) ||
                    (unetLoader && unetLoader.inputs && unetLoader.inputs.unet_name);
  if(modelName){
    const sel = $("modelSelect");
    if(sel){
      for(const opt of sel.options){
        if(opt.value === modelName || modelName.endsWith("/"+opt.value) || opt.value === modelName.replace("ltxv/","") || opt.value === modelName.replace("Stable-Diffusion/","") || opt.value === modelName.replace("Ligazón para ","")){
          opt.selected = true; modelSet = true; break;
        }
      }
    }
  }
  if(modelSet) setApplied("modelo"); else setMissing("modelo");

  // Restaurar VAE (Vídeo y Audio)
  let vaeSet = false;
  const vaeLoaders = (function(){
    const list = [];
    for(const k of Object.keys(workflow)){
      const n = workflow[k];
      if(n && (n.class_type === "VAELoader" || n.type === "VAELoader")) list.push(n);
    }
    return list;
  })();
  const vaeSel = $("vaeSelect");
  const audioVaeSel = $("audioVaeSelect");
  if(vaeLoaders.length && (vaeSel || audioVaeSel)){
    for(const vl of vaeLoaders){
      const name = vl.inputs && vl.inputs.vae_name;
      if(!name) continue;
      const isAudio = name.toLowerCase().includes("audio");
      const targetSel = isAudio ? audioVaeSel : vaeSel;
      if(targetSel){
        for(const opt of targetSel.options){
          if(opt.value === name || name.endsWith("/"+opt.value)){
            opt.selected = true; vaeSet = true; break;
          }
        }
      }
    }
  }
  if(vaeSet) setApplied("VAE"); else setMissing("VAE");

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
    recalcResolution();
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

  // Restaurar tipo de atención (Sage o Kitchen)
  const sageNode = findByClass("PathchSageAttentionKJ");
  const kitchenNode = findByClass("ModelAttentionBackend");
  if(kitchenNode && kitchenNode.inputs && kitchenNode.inputs.attention === "comfy kitchen attention"){
    $("sageAttentionType").value = "comfy kitchen attention";
    setApplied("atención (kitchen)");
  } else if(sageNode && sageNode.inputs && sageNode.inputs.sage_attention && SAGE_TYPES.includes(sageNode.inputs.sage_attention)){
    $("sageAttentionType").value = sageNode.inputs.sage_attention;
    setApplied("atención (" + sageNode.inputs.sage_attention + ")");
  } else { setMissing("tipo de atención"); }

  // Restaurar TextGenerateLTX2Prompt settings
  // Restaurar raw prompt si existe
  const rawPromptNode = findByClass("PrimitiveStringMultiline");
  if(rawPromptNode && rawPromptNode.inputs && typeof rawPromptNode.inputs.value === "string" && rawPromptNode.inputs.value.length > 0){
    $("prompt").value = rawPromptNode.inputs.value;
    setApplied("prompt");
  }

  // Restaurar modo diálogo: negativo con términos de ban o volumen -100 → "Sin diálogo".
  let dlgSet = false;
  {
    const negNodes = [];
    for(const k of Object.keys(workflow)){
      const n = workflow[k];
      if(n && n.class_type === "CLIPTextEncode" && n.inputs && typeof n.inputs.text === "string") negNodes.push(n);
    }
    const neg = negNodes.map(n => n.inputs.text).join(" ");
    if(/\b(dialogue|speech|talking|voices|chatter)\b/i.test(neg)){ setDialogueModeUI("no_dialogue"); dlgSet = true; }
  }
  {
    const avNodes = [];
    for(const k of Object.keys(workflow)){
      const n = workflow[k];
      if(n && n.class_type === "AudioAdjustVolume" && n.inputs && n.inputs.volume != null) avNodes.push(n);
    }
    if(avNodes.some(n => Number(n.inputs.volume) <= -90)){ setDialogueModeUI("no_dialogue"); dlgSet = true; }
    else if(avNodes.some(n => Number(n.inputs.volume) >= 1) && !dlgSet){
      const negNodes2 = [];
      for(const k of Object.keys(workflow)){
        const n = workflow[k];
        if(n && n.class_type === "CLIPTextEncode" && n.inputs && typeof n.inputs.text === "string") negNodes2.push(n);
      }
      const neg2 = negNodes2.map(n => n.inputs.text).join(" ").toLowerCase();
      if(!/(newscast|podcast|yelling)/.test(neg2)){ setDialogueModeUI("dialogue"); dlgSet = true; }
      else { setDialogueModeUI("auto"); dlgSet = true; }
    }
    if(dlgSet) setApplied("diálogo");
  }

  const powerLora = findByClass("Power Lora Loader (rgthree)");
  if(powerLora && powerLora.inputs){
    for(let i = 0; i < loras.length; i++){
      const slot = `lora_${i + 1}`;
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

  // Color Grading & Look Cinemático
  const lutNode = findByClass("LayerColor: LUT Apply");
  if(lutNode && lutNode.inputs){
    setPostFxUI(Object.assign(getPostFxState(), { enabled: true }));
    if($("postFxLutToggle")) $("postFxLutToggle").checked = true;
    if(lutNode.inputs.LUT != null && $("postFxLutSelect")) $("postFxLutSelect").value = lutNode.inputs.LUT;
    if(lutNode.inputs.strength != null){
      $("postFxLutStrength").value = Math.max(0, Math.min(1, Number(lutNode.inputs.strength) / 100));
      if($("postFxLutVal")) $("postFxLutVal").textContent = Math.round(parseFloat($("postFxLutStrength").value) * 100) + "%";
    }
    setApplied("color grading (LUT)");
  }
  const lutNodePP = findByClass("ProPostApplyLUT");
  if(lutNodePP && lutNodePP.inputs){
    setPostFxUI(Object.assign(getPostFxState(), { enabled: true }));
    if($("postFxLutToggle")) $("postFxLutToggle").checked = true;
    if(lutNodePP.inputs.lut_name != null && $("postFxLutSelect")) $("postFxLutSelect").value = lutNodePP.inputs.lut_name;
    if(lutNodePP.inputs.strength != null){
      $("postFxLutStrength").value = lutNodePP.inputs.strength;
      if($("postFxLutVal")) $("postFxLutVal").textContent = Math.round(parseFloat($("postFxLutStrength").value) * 100) + "%";
    }
    setApplied("color grading (LUT GPU)");
  }
  const grainNodePP = findByClass("ProPostFilmGrain");
  if(grainNodePP && grainNodePP.inputs && Number(grainNodePP.inputs.grain_power ?? 0) > 0){
    setPostFxUI(Object.assign(getPostFxState(), { enabled: true }));
    if($("postFxGrainToggle")) $("postFxGrainToggle").checked = true;
    $("postFxGrainPower").value = Math.min(0.4, Number(grainNodePP.inputs.grain_power));
    if($("postFxGrainVal")) $("postFxGrainVal").textContent = Math.min(0.4, Number(grainNodePP.inputs.grain_power)).toFixed(2);
    setApplied("grano (GPU)");
  }
  const filmNode = findByClass("LayerFilter: FilmV2");
  if(filmNode && filmNode.inputs){
    setPostFxUI(Object.assign(getPostFxState(), { enabled: true }));
    const vi = Number(filmNode.inputs.vignette_intensity ?? 0);
    const gp = Number(filmNode.inputs.grain_power ?? 0);
    if(vi > 0 && $("postFxVigToggle")){ $("postFxVigToggle").checked = true; $("postFxVigIntensity").value = Math.min(0.6, vi); if($("postFxVigVal")) $("postFxVigVal").textContent = Math.min(0.6, vi).toFixed(2); }
    if(gp > 0 && $("postFxGrainToggle")){ $("postFxGrainToggle").checked = true; $("postFxGrainPower").value = Math.min(0.4, gp); if($("postFxGrainVal")) $("postFxGrainVal").textContent = Math.min(0.4, gp).toFixed(2); }
    setApplied("viñeta/grano (FilmV2)");
  }
  const fxNode = findByClass("LTXWebVideoFX");
  if(fxNode && fxNode.inputs){
    setPostFxUI(Object.assign(getPostFxState(), { enabled: true }));
    const inps = fxNode.inputs;
    const lutName = inps.lut_name && inps.lut_name !== "" ? String(inps.lut_name) : "";
    if(lutName){
      if($("postFxLutToggle")) $("postFxLutToggle").checked = true;
      if($("postFxLutSelect")){
        $("postFxLutSelect").value = lutName;
        if($("postFxLutSelect").value !== lutName){
          const opt = document.createElement("option");
          opt.value = lutName; opt.textContent = lutName.endsWith(".cube") ? lutName.slice(0, -5) : lutName;
          $("postFxLutSelect").appendChild(opt);
          $("postFxLutSelect").value = lutName;
        }
      }
      if(inps.lut_strength != null){
        $("postFxLutStrength").value = inps.lut_strength;
        if($("postFxLutVal")) $("postFxLutVal").textContent = Math.round(parseFloat($("postFxLutStrength").value) * 100) + "%";
      }
      setApplied("color grading (LUT)");
    }
    const vig = Number(inps.vignette ?? 0) / 4;
    if(vig > 0 && $("postFxVigToggle")){
      $("postFxVigToggle").checked = true;
      $("postFxVigIntensity").value = Math.min(0.6, vig);
      if($("postFxVigVal")) $("postFxVigVal").textContent = Math.min(0.6, vig).toFixed(2);
      setApplied("viñeta");
    }
    const gp = Number(inps.grain ?? 0);
    if(gp > 0 && $("postFxGrainToggle")){
      $("postFxGrainToggle").checked = true;
      $("postFxGrainPower").value = Math.min(0.4, gp);
      if($("postFxGrainVal")) $("postFxGrainVal").textContent = Math.min(0.4, gp).toFixed(2);
      setApplied("grano");
    }
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

  // Restaurar Frame Interpolation (RIFE / RTX Frame Gen)
  const rtxFgNode = findByClass("RTXVideoFrameGeneration");
  const interpNode = findByClass("FrameInterpolate");
  const interpLoader = findByClass("FrameInterpolationModelLoader");
  if(rtxFgNode && rtxFgNode.inputs){
    const mult = (typeof rtxFgNode.inputs["generation_type.multiplier"] === "number")
      ? rtxFgNode.inputs["generation_type.multiplier"]
      : (typeof rtxFgNode.inputs.multiplier === "number" ? rtxFgNode.inputs.multiplier : 2);
    const r = { enabled: true, engine: "rtx", multiplier: mult, model: "rife_v4.26.safetensors" };
    setRifeUI(r);
    saveRife(r);
    setApplied("interpolación RTX Frame Gen (" + mult + "x)");
  } else if(interpNode && interpNode.inputs){
    const mult = interpNode.inputs.multiplier || 2;
    const model = (interpLoader && interpLoader.inputs) ? interpLoader.inputs.model_name : "rife_v4.26.safetensors";
    const r = { enabled: true, engine: "rife", multiplier: mult, model: model };
    setRifeUI(r);
    saveRife(r);
    setApplied("interpolación RIFE (" + mult + "x)");
  } else {
    const r = getRifeState();
    r.enabled = false;
    setRifeUI(r);
    saveRife(r);
  }

  // Restaurar Refinado de elementos (fr1_* / fr2_*). Vídeos sin estos nodos → desactivado.
  const frCrop1 = workflow["fr1_crop"];
  if(frCrop1 && frCrop1.inputs){
    const ci = frCrop1.inputs;
    const frCrop2 = workflow["fr2_crop"];
    const detTarget = (det) => Object.keys(ELEMENT_REFINE_CONFIG).find(k => ELEMENT_REFINE_CONFIG[k].detector === det) || "face";
    const t1 = detTarget(ci.detector);
    const t2 = frCrop2?.inputs ? detTarget(frCrop2.inputs.detector) : null;
    const target = (t1 === "face" && t2 === "hands") ? "face_hands" : t1;
    let select = ci.select || "largest_face";
    if(frCrop2 && target !== "face_hands") select = "dual_faces";
    else if(select === "largest_face" && ci.select_index === 1) select = "second_face";
    const fr = { ...FACEREFINE_DEFAULTS, enabled: true, target, select, canvas: parseInt(ci.canvas_width, 10) || 512 };
    const sig = workflow["fr1_sigmas"]?.inputs?.sigmas;
    if(typeof sig === "string"){
      const vals = sig.split(",").map(v => parseFloat(v)).filter(v => !isNaN(v));
      if(vals.length >= 2){ fr.denoise = vals[0]; fr.steps = vals.length - 1; }
    }
    const fe = workflow["fr1_stitch"]?.inputs?.feather;
    if(typeof fe === "number") fr.feather = fe;
    setFaceRefineUI(fr);
    saveFaceRefine(fr);
    setApplied(`refinado de elementos (${target}, denoise ${Number(fr.denoise).toFixed(2)}, ${fr.steps} pasos)`);
  } else {
    const fr = getFaceRefineState();
    if(fr.enabled){
      fr.enabled = false;
      setFaceRefineUI(fr);
      saveFaceRefine(fr);
    }
  }

  // Restaurar RTX Video Super Resolution
  const rtxNode = findByClass("RTXVideoSuperResolution");
  if(rtxNode && rtxNode.inputs){
    const q = rtxNode.inputs.quality || "HIGHBITRATE_ULTRA";
    const r = { enabled: true, quality: q };
    setRtxUI(r);
    saveRtx(r);
    setApplied("RTX Super Resolution (" + q + ")");
  } else {
    const r = { enabled: false, quality: "HIGHBITRATE_ULTRA" };
    setRtxUI(r);
    saveRtx(r);
  }

  // Text Encoder (Gemma / LTX-2.5)
  const ltxavTeNode = findByClass("LTXAVTextEncoderLoader");
  if(ltxavTeNode && ltxavTeNode.inputs && ltxavTeNode.inputs.text_encoder){
    const teName = ltxavTeNode.inputs.text_encoder;
    if($("textEncoderSelect")){
      $("textEncoderSelect").value = teName;
      localStorage.setItem("ltxv_text_encoder", teName);
      setApplied("text encoder (" + teName.split("/").pop() + ")");
    }
  }

  // Imagen de entrada: restaurar el LoadImage del workflow (visor + generación).
  // inputs.image puede venir como "name.ext" o "subfolder/name.ext" y vive en el
  // input dir de ComfyUI → sirve /view con type=input. Solo I2V (no vídeo ref).
  const loadImgNode = findByClass("LoadImage");
  if(loadImgNode && loadImgNode.inputs && typeof loadImgNode.inputs.image === "string" && loadImgNode.inputs.image.trim()){
    const imgSpec = loadImgNode.inputs.image.trim().replace(/\\/g, "/");
    const slashIdx = imgSpec.indexOf("/");
    const subfolder = slashIdx > 0 ? imgSpec.slice(0, slashIdx) : "";
    const fname = slashIdx > 0 ? imgSpec.slice(slashIdx + 1) : imgSpec;
    const media = { filename: fname, subfolder: subfolder, type: "input" };
    const viewUrl = `${server()}${mediaViewUrl(media, { anchor: "" })}`;
    // Comprobar que el fichero sigue existiendo antes de enlazarlo a la generación:
    // si ComfyUI lo borró (input/temp se limpian), el usuario ve el aviso pero los
    // demás parámetros restaurados permanecen válidos.
    try {
      // HEAD: verificar existencia sin descargar (la descarga la hace <img src>).
      const probe = await fetch(viewUrl, { method: "HEAD" });
      if(probe.ok){
        // name Y filename: buildGraph lee .name (LoadImage) y las helpers de
        // galería/drag leen .filename — ambos deben estar rellenos.
        uploadedImage = { name: fname, filename: fname, subfolder: subfolder, type: "input" };
        localFile = null;
        showInputImage(viewUrl);
        setApplied("imagen de entrada (" + fname + ")");
      } else {
        setMissing("imagen de entrada (fichero borrado del backend)");
      }
    } catch(e){
      setMissing("imagen de entrada (no verificable)");
    }
  } else {
    const hasLocal = uploadedImage || localFile;
    if(!hasLocal) setMissing("imagen de entrada");
  }

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
  const ratioStr = getFriendlyRatio(w, h);
  info.textContent = `${w}×${h} · ${ratioStr}`;
  if(w && h){
    currentAspectRatio = w / h;
    recalcResolution();
  }
}

$("segRandom").addEventListener("click",()=>{seedMode="random";$("segRandom").classList.add("on");$("segFixed").classList.remove("on");$("seedVal").disabled=true;});
$("segFixed").addEventListener("click",()=>{seedMode="fixed";$("segFixed").classList.add("on");$("segRandom").classList.remove("on");$("seedVal").disabled=false;});
function updateDuration(){
  const f = parseInt($("frames")?.value || "0", 10);
  if($("durHint")) $("durHint").textContent = `(${f}/24fps=${(f/24).toFixed(1)}s)`;
}

$("fidelitySlider")?.addEventListener("input",(e)=>{ if($("fidelityVal")) $("fidelityVal").textContent=parseFloat(e.target.value).toFixed(2); });
$("firstPassSteps")?.addEventListener("input",(e)=>{ if($("firstPassStepsVal")) $("firstPassStepsVal").textContent=e.target.value; });
$("motionSlider")?.addEventListener("input",(e)=>{ if($("motionVal")) $("motionVal").textContent=parseFloat(e.target.value).toFixed(1); });
$("mpSlider")?.addEventListener("input",()=>{ recalcResolution(); });
$("frames")?.addEventListener("input", updateDuration);

function loadVaes(){
  const selVideo = $("vaeSelect");
  const selAudio = $("audioVaeSelect");
  
  if(selVideo){
    selVideo.innerHTML = "";
    const checkpointOpt = document.createElement("option");
    checkpointOpt.value = "Checkpoint";
    checkpointOpt.textContent = "Checkpoint (VAE integrado)";
    selVideo.appendChild(checkpointOpt);
    const videoVaes = (typeof AVAILABLE_VAES !== "undefined" ? AVAILABLE_VAES : []).filter(v => !v.toLowerCase().includes("audio"));
    const otherVaes = (typeof AVAILABLE_VAES !== "undefined" ? AVAILABLE_VAES : []).filter(v => v.toLowerCase().includes("audio"));
    for(const v of [...videoVaes, ...otherVaes]){
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selVideo.appendChild(opt);
    }
    const defaultVae = CONFIG.DEFAULT_VAE || "Checkpoint";
    const matchedOpt = Array.from(selVideo.options).find(o => o.value.toLowerCase().includes(defaultVae.toLowerCase()));
    if(matchedOpt){
      selVideo.value = matchedOpt.value;
    }
  }

  if(selAudio){
    selAudio.innerHTML = "";
    const chkAudio = document.createElement("option");
    chkAudio.value = "Checkpoint";
    chkAudio.textContent = "Checkpoint (Audio VAE integrado)";
    selAudio.appendChild(chkAudio);
    const audioVaes = (typeof AVAILABLE_VAES !== "undefined" ? AVAILABLE_VAES : []).filter(v => v.toLowerCase().includes("audio"));
    const otherVaes = (typeof AVAILABLE_VAES !== "undefined" ? AVAILABLE_VAES : []).filter(v => !v.toLowerCase().includes("audio"));
    for(const v of [...audioVaes, ...otherVaes]){
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selAudio.appendChild(opt);
    }
    const defAudio = (typeof AVAILABLE_VAES !== "undefined" ? AVAILABLE_VAES : []).find(v => v.includes("ltx-2.5-audio-vae-bf16")) || "Checkpoint";
    if(defAudio && Array.from(selAudio.options).some(o => o.value === defAudio)){
      selAudio.value = defAudio;
    }
  }
}
loadVaes();

function loadTextEncoders(){
  const sel = $("textEncoderSelect");
  if(!sel) return;
  const clips = (typeof AVAILABLE_CLIPS !== "undefined" && AVAILABLE_CLIPS.length)
    ? AVAILABLE_CLIPS
    : ["gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot-v2.safetensors", "gemma-3-12b-it-ablit-norms-biproj-fp8mixed.safetensors"];
  sel.innerHTML = "";
  for(const c of clips){
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c.split("/").pop();
    opt.title = c;
    sel.appendChild(opt);
  }
}

// --- PERSISTENCIA INTEGRAL DE AJUSTES LTXV ---
const LTXV_SETTINGS_KEY = "ltxv_ui_settings_v1";
let ltxvSaveTimer = null;

function scheduleSaveLtxvSettings(){
  clearTimeout(ltxvSaveTimer);
  ltxvSaveTimer = setTimeout(saveLtxvSettings, 350);
}

function saveLtxvSettings(){
  const s = {
    prompt: $("prompt")?.value || "",
    filenamePrefix: $("filenamePrefix")?.value?.trim() || "video/LTX_2.5",
    model: $("modelSelect")?.value || "",
    textEncoder: $("textEncoderSelect")?.value || "",
    vae: $("vaeSelect")?.value || "",
    audioVae: $("audioVaeSelect")?.value || "",
    seedMode,
    seedValue: seedMode === "random" ? -1 : parseInt($("seedVal")?.value || "12345", 10),
    mp: $("mpSlider")?.value || "0.9",
    width: $("width")?.value || "1280",
    height: $("height")?.value || "736",
    frames: $("frames")?.value || "241",
    batchSize: $("batchSize")?.value || "1",
    fidelity: $("fidelitySlider")?.value || "0.25",
    firstPassSteps: $("firstPassSteps")?.value || "8",
    motion: $("motionSlider")?.value || "1.0",
    dialogueMode: getDialogueMode(),
    postfx: getPostFxState(),
    rife: getRifeState(),
    rtx: getRtxState(),
    faceRefine: (({ refFace1, refFace2, ...rest }) => rest)(getFaceRefineState()),
    bitDepth: getBitDepth(),
    sageType: $("sageAttentionType")?.value || SAGE_DEFAULT,
    purgeVram: !!$("purgeVram")?.checked,
    savePreview: $("savePreview")?.checked ?? true,
    ltx2Temperature: $("ltx2Temperature")?.value || "0.7",
    ltx2Seed: $("ltx2Seed")?.value || "-1",
    ltx2PreviewText: $("ltx2PreviewText")?.checked ?? true,
    aspectRatio: currentAspectRatio,
    loras: (typeof loras !== "undefined" && Array.isArray(loras)) ? JSON.parse(JSON.stringify(loras)) : undefined
  };
  try {
    localStorage.setItem(LTXV_SETTINGS_KEY, JSON.stringify(s));
    // Sincronizar claves individuales legacy por compatibilidad
    localStorage.setItem("ltxv_prompt", s.prompt);
    localStorage.setItem("ltxv_filename_prefix", s.filenamePrefix);
    if(s.textEncoder) localStorage.setItem("ltxv_text_encoder", s.textEncoder);
  } catch(e){
    console.warn("Error guardando ajustes LTXV:", e);
  }
}

function restoreLtxvSettings(){
  const raw = localStorage.getItem(LTXV_SETTINGS_KEY);
  if(!raw) return false;
  try {
    const s = JSON.parse(raw);
    if(!s || typeof s !== "object") return false;

    if(s.prompt !== undefined && $("prompt")) $("prompt").value = s.prompt;
    if(s.filenamePrefix !== undefined && $("filenamePrefix")) $("filenamePrefix").value = s.filenamePrefix;

    if(s.model && $("modelSelect")){
      const opt = Array.from($("modelSelect").options).find(o => o.value === s.model);
      if(opt) $("modelSelect").value = s.model;
    }

    if(s.textEncoder && $("textEncoderSelect")){
      const opt = Array.from($("textEncoderSelect").options).find(o => o.value === s.textEncoder);
      if(opt) $("textEncoderSelect").value = s.textEncoder;
    }

    if(s.vae && $("vaeSelect")){
      const opt = Array.from($("vaeSelect").options).find(o => o.value === s.vae);
      if(opt) $("vaeSelect").value = s.vae;
    }

    if(s.audioVae && $("audioVaeSelect")){
      const opt = Array.from($("audioVaeSelect").options).find(o => o.value === s.audioVae);
      if(opt) $("audioVaeSelect").value = s.audioVae;
    }

    if(s.seedMode){
      seedMode = s.seedMode;
      if(seedMode === "random"){
        $("segRandom")?.classList.add("on");
        $("segFixed")?.classList.remove("on");
        if($("seedVal")) $("seedVal").disabled = true;
      } else {
        $("segFixed")?.classList.add("on");
        $("segRandom")?.classList.remove("on");
        if($("seedVal")) $("seedVal").disabled = false;
      }
    }
    if(s.seedValue !== undefined && s.seedValue >= 0 && $("seedVal")){
      $("seedVal").value = s.seedValue;
    }

    if(s.aspectRatio) currentAspectRatio = s.aspectRatio;
    if(s.mp !== undefined && $("mpSlider")){
      $("mpSlider").value = s.mp;
      if($("mpVal")) $("mpVal").textContent = parseFloat(s.mp).toFixed(2);
    }
    if(s.width && $("width")) $("width").value = s.width;
    if(s.height && $("height")) $("height").value = s.height;
    if($("arDetectHint") && s.width && s.height){
      $("arDetectHint").textContent = `(${getFriendlyRatio(parseInt(s.width,10), parseInt(s.height,10))})`;
    }

    if(s.frames !== undefined && $("frames")){
      $("frames").value = s.frames;
      updateDuration();
    }
    if(s.batchSize !== undefined && $("batchSize")) $("batchSize").value = s.batchSize;

    if(s.dialogueMode) setDialogueModeUI(s.dialogueMode);
    if(s.postfx) setPostFxUI(s.postfx);
    if(s.fidelity !== undefined && $("fidelitySlider")){
      $("fidelitySlider").value = s.fidelity;
      if($("fidelityVal")) $("fidelityVal").textContent = parseFloat(s.fidelity).toFixed(2);
    }
    if(s.firstPassSteps !== undefined && $("firstPassSteps")){
      $("firstPassSteps").value = s.firstPassSteps;
      if($("firstPassStepsVal")) $("firstPassStepsVal").textContent = s.firstPassSteps;
    }
    if(s.motion !== undefined && $("motionSlider")){
      $("motionSlider").value = s.motion;
      if($("motionVal")) $("motionVal").textContent = parseFloat(s.motion).toFixed(1);
    }

    if(s.rife){ setRifeUI(s.rife); saveRife(s.rife); }
    if(s.rtx){ setRtxUI(s.rtx); saveRtx(s.rtx); }
    if(s.faceRefine){ setFaceRefineUI(s.faceRefine); saveFaceRefine(s.faceRefine); }
    if(s.bitDepth !== undefined){ setBitDepthUI(s.bitDepth); saveBitDepth(s.bitDepth); }

    setSelectIfPresent("sageAttentionType", s.sageType);
    if(s.purgeVram !== undefined && $("purgeVram")) $("purgeVram").checked = !!s.purgeVram;
    if(s.savePreview !== undefined && $("savePreview")) $("savePreview").checked = !!s.savePreview;

    if(s.ltx2Temperature !== undefined && $("ltx2Temperature")){
      $("ltx2Temperature").value = s.ltx2Temperature;
      if($("ltx2TemperatureVal")) $("ltx2TemperatureVal").textContent = parseFloat(s.ltx2Temperature).toFixed(2);
    }
    if(s.ltx2Seed !== undefined && $("ltx2Seed")) $("ltx2Seed").value = s.ltx2Seed;
    if(s.ltx2PreviewText !== undefined && $("ltx2PreviewText")) $("ltx2PreviewText").checked = !!s.ltx2PreviewText;

    if(Array.isArray(s.loras) && s.loras.length && typeof loras !== "undefined"){
      s.loras.forEach((l, i) => {
        if(i < loras.length && l) loras[i] = l;
      });
      if(typeof renderLoras === "function") renderLoras();
      if(typeof saveLoraState === "function") saveLoraState();
    }

    return true;
  } catch(e){
    console.warn("Error restaurando ajustes LTXV:", e);
    return false;
  }
}

// Inicialización de selectores y restauración
loadVaes();
loadTextEncoders();

// Restaurar ajustes guardados o fallback legacy
initDialogueListeners();
if(!restoreLtxvSettings()){
  const legacyPrompt = localStorage.getItem("ltxv_prompt");
  if(legacyPrompt !== null && $("prompt")) $("prompt").value = legacyPrompt;
  const legacyPrefix = localStorage.getItem("ltxv_filename_prefix");
  if(legacyPrefix && $("filenamePrefix")) $("filenamePrefix").value = legacyPrefix;
}

// Escuchar cambios en todos los controles para autoguardado
$("prompt")?.addEventListener("input", scheduleSaveLtxvSettings);
$("filenamePrefix")?.addEventListener("input", scheduleSaveLtxvSettings);
$("modelSelect")?.addEventListener("change", () => {
  const m = $("modelSelect").value || "";
  const is25 = m.includes("ltx-2.5") || m.includes("transformer");
  if(is25 && typeof AVAILABLE_VAES !== "undefined"){
    const v25 = AVAILABLE_VAES.find(v => v.includes("ltx-2.5-video-vae-conv-bf16")) ||
                AVAILABLE_VAES.find(v => v.includes("ltx-2.5-video-vae-bf16"));
    const a25 = AVAILABLE_VAES.find(v => v.includes("ltx-2.5-audio-vae-bf16"));
    if(v25 && $("vaeSelect")) $("vaeSelect").value = v25;
    if(a25 && $("audioVaeSelect")) $("audioVaeSelect").value = a25;
    log("ℹ️ Modelo LTX-2.5 seleccionado: VAEs 2.5 de vídeo y audio asignados automáticamente", "l-info");
  }
  scheduleSaveLtxvSettings();
});
$("textEncoderSelect")?.addEventListener("change", scheduleSaveLtxvSettings);
$("vaeSelect")?.addEventListener("change", scheduleSaveLtxvSettings);
$("audioVaeSelect")?.addEventListener("change", scheduleSaveLtxvSettings);
$("segRandom")?.addEventListener("click", () => { seedMode = "random"; $("segRandom").classList.add("on"); $("segFixed").classList.remove("on"); if($("seedVal")) $("seedVal").disabled = true; scheduleSaveLtxvSettings(); });
$("segFixed")?.addEventListener("click", () => { seedMode = "fixed"; $("segFixed").classList.add("on"); $("segRandom").classList.remove("on"); if($("seedVal")) $("seedVal").disabled = false; scheduleSaveLtxvSettings(); });
$("seedVal")?.addEventListener("input", scheduleSaveLtxvSettings);
$("mpSlider")?.addEventListener("input", () => { recalcResolution(); scheduleSaveLtxvSettings(); });
$("width")?.addEventListener("change", scheduleSaveLtxvSettings);
$("height")?.addEventListener("change", scheduleSaveLtxvSettings);
$("frames")?.addEventListener("input", () => { updateDuration(); scheduleSaveLtxvSettings(); });
$("batchSize")?.addEventListener("change", scheduleSaveLtxvSettings);
$("fidelitySlider")?.addEventListener("input", (e) => { if($("fidelityVal")) $("fidelityVal").textContent = parseFloat(e.target.value).toFixed(2); scheduleSaveLtxvSettings(); });
$("firstPassSteps")?.addEventListener("input", (e) => { if($("firstPassStepsVal")) $("firstPassStepsVal").textContent = e.target.value; scheduleSaveLtxvSettings(); });
$("motionSlider")?.addEventListener("input", (e) => { if($("motionVal")) $("motionVal").textContent = parseFloat(e.target.value).toFixed(1); scheduleSaveLtxvSettings(); });
$("sageAttentionType")?.addEventListener("change", scheduleSaveLtxvSettings);
$("purgeVram")?.addEventListener("change", scheduleSaveLtxvSettings);
$("savePreview")?.addEventListener("change", scheduleSaveLtxvSettings);
$("ltx2Temperature")?.addEventListener("input", (e) => { if($("ltx2TemperatureVal")) $("ltx2TemperatureVal").textContent = parseFloat(e.target.value).toFixed(2); scheduleSaveLtxvSettings(); });
$("ltx2Seed")?.addEventListener("input", scheduleSaveLtxvSettings);
$("ltx2PreviewText")?.addEventListener("change", scheduleSaveLtxvSettings);
$("segBitDepth8")?.addEventListener("click", () => { setBitDepthUI(8); saveBitDepth(8); scheduleSaveLtxvSettings(); });
$("segBitDepth10")?.addEventListener("click", () => { setBitDepthUI(10); saveBitDepth(10); scheduleSaveLtxvSettings(); });
$("segRifeOn")?.addEventListener("click", () => { const r = getRifeState(); r.enabled = true; setRifeUI(r); saveRife(r); scheduleSaveLtxvSettings(); });
$("segRifeOff")?.addEventListener("click", () => { const r = getRifeState(); r.enabled = false; setRifeUI(r); saveRife(r); scheduleSaveLtxvSettings(); });
$("rifeEngine")?.addEventListener("change", (e) => { const engine = e.target.value; toggleRifeEngineUI(engine); const r = getRifeState(); r.engine = engine; saveRife(r); scheduleSaveLtxvSettings(); });
$("rifeMultiplier")?.addEventListener("change", (e) => { const mult = parseInt(e.target.value, 10); if($("rifeFpsHint")) $("rifeFpsHint").textContent = `(24fps → ${24 * mult}fps)`; const r = getRifeState(); r.multiplier = mult; saveRife(r); scheduleSaveLtxvSettings(); });
$("rifeModel")?.addEventListener("change", (e) => { const r = getRifeState(); r.model = e.target.value; saveRife(r); scheduleSaveLtxvSettings(); });
$("segRtxOn")?.addEventListener("click", () => { const r = getRtxState(); r.enabled = true; setRtxUI(r); saveRtx(r); scheduleSaveLtxvSettings(); });
$("segRtxOff")?.addEventListener("click", () => { const r = getRtxState(); r.enabled = false; setRtxUI(r); saveRtx(r); scheduleSaveLtxvSettings(); });
$("rtxQuality")?.addEventListener("change", (e) => { const r = getRtxState(); r.quality = e.target.value; saveRtx(r); scheduleSaveLtxvSettings(); });

// Zoom/pan/fullscreen para imagen de entrada
const inputZoom = setupZoomPan("inputWrap", "inputImg", "btnResetZoomInput", "btnFullscreenInput");

// Navegación cíclica por imágenes Krea2 recientes (flechas PC + swipe móvil)
let krea2RecentIndex = -1;
let krea2NavTimer = null;

function getKrea2RecentItems(){
  const grid = $("krea2RecentGrid");
  if(!grid || !grid.dataset.loaded) return [];
  return Array.from(grid.querySelectorAll(".gallery-item"));
}

function navigateKrea2Recent(dir){
  const items = getKrea2RecentItems();
  if(!items.length) return;
  if(krea2RecentIndex < 0 || krea2RecentIndex >= items.length) krea2RecentIndex = 0;
  let newIdx = krea2RecentIndex + dir;
  if(newIdx < 0) newIdx = items.length - 1;
  if(newIdx >= items.length) newIdx = 0;
  krea2RecentIndex = newIdx;
  const item = items[newIdx];
  const img = item.querySelector("img");
  if(!img || !img.src) return;
  showInputImage(img.src);
  const info = item.querySelector(".info-tag");
  if(info) log("🖼️ " + (info.textContent || ""), "l-info");
}

document.addEventListener("keydown", (e) => {
  if(!inputZoom.isFullscreen()) return;
  if(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if(e.key === "ArrowLeft" || e.key === "ArrowRight"){
    e.preventDefault();
    if(krea2NavTimer) return;
    navigateKrea2Recent(e.key === "ArrowRight" ? 1 : -1);
    krea2NavTimer = setTimeout(() => { krea2NavTimer = null; }, 250);
  }
});
inputZoom.onSwipe((dir) => { if(inputZoom.isFullscreen()) navigateKrea2Recent(dir); });

// Click en el wrap de la imagen de entrada -> abrir file dialog para reemplazar
$("inputWrap").addEventListener("click", (e) => {
  if(inputZoom.isFullscreen()) return;
  if(e.target.closest("#btnResetZoomInput") || e.target.closest("#btnFullscreenInput") || e.target.closest("#btnClearInput")) return;
  if(inputZoom.wasPan && inputZoom.wasPan()) return;
  $("fileInput").click();
});
// Drag/drop sobre el wrap también
["dragenter","dragover"].forEach(ev=>$("inputWrap").addEventListener(ev,e=>{e.preventDefault();$("dropzone").classList.add("drag");}));
["dragleave","drop"].forEach(ev=>$("inputWrap").addEventListener(ev,e=>{e.preventDefault();$("dropzone").classList.remove("drag");}));
$("inputWrap").addEventListener("drop",e=>{if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);});

function clearInputImage(){
  uploadedImage = null;
  localFile = null;
  currentVideoFile = null;
  const wrap = $("inputWrap"), img = $("inputImg"), actions = $("imgInputActions");
  if(img){ img.src = ""; img.style.display = "none"; }
  if(wrap) wrap.style.visibility = "hidden";
  if(actions) actions.style.display = "none";
  const dz = $("dropzone");
  if(dz) dz.style.display = "";
  const dzInfo = $("dzInfo");
  if(dzInfo) dzInfo.textContent = "";
  const fileInp = $("fileInput");
  if(fileInp) fileInp.value = "";
  const frameSel = $("frameSelector");
  if(frameSel) frameSel.style.display = "none";
  if(inputZoom) inputZoom.resetZoom();
  log("Imagen de entrada eliminada.", "l-info");
}

$("btnClearInput")?.addEventListener("click", clearInputImage);

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
    $("inputWrap").style.visibility = "hidden";
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
  if(!wrap || !img) { console.warn("[LTXV] showInputImage: wrap/img no disponible"); return; }
  img.onload = () => {
    updateDzInfo(img.naturalWidth, img.naturalHeight);
    inputZoom.resetZoom();
  };
  img.onerror = (e) => console.error("[LTXV] inputImg error", e);
  img.src = src;
  img.style.display = "block";
  wrap.style.visibility = "visible";
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
    // Si ya estamos en la posición pedida, el navegador NO dispara "seeked"
    // (no hay seek real): dibujamos directamente para no colgar el callback.
    if(Math.abs(vid.currentTime - time) < 0.001){
      try {
        const canvas = document.createElement("canvas");
        canvas.width = vid.videoWidth || 640;
        canvas.height = vid.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        callback(null, canvas.toDataURL("image/jpeg", 0.92));
      } catch(err) { callback(err); }
      return;
    }
    vid.currentTime = time;
    // Timeout de seguridad: un vídeo corrupto no dispara seeked nunca.
    const timer = setTimeout(() => {
      vid.removeEventListener("seeked", onSeeked);
      callback(new Error("timeout esperando el frame"));
    }, 5000);
    function onSeeked(){
      clearTimeout(timer);
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
    }
    vid.addEventListener("seeked", onSeeked, { once: true });
  }

  function setFrameAsInput(dataUrl, frameLabel){
    fetch(dataUrl).then(r => r.blob()).then(blob => {
      const frameName = `temp_${Date.now()}_${file.name.replace(/\.[^.]+$/, '')}_${frameLabel}.jpg`;
      localFile = new File([blob], frameName, {type: "image/jpeg"});

      showInputImage(dataUrl);
      log(`🎬 Vídeo cargado: ${file.name} (${frameLabel} frame como imagen de entrada)`, "l-ok");

      metaPromise.then(async (workflow) => {
        if(workflow){
          log(`📋 Workflow encontrado en ${file.name}`, "l-ok");
          await applyWorkflow(workflow);
        } else {
          log(`ℹ️ ${file.name} no contiene metadatos de workflow.`, "l-warn");
        }
      }).catch(e => log("❌ Error aplicando workflow: "+e.message, "l-err"));
    }).catch(e => log("❌ Error convirtiendo el frame: "+e.message, "l-err"));
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

// Sube las caras de referencia del refinado (si el refinado está activo y hay fotos locales).
async function ensureJobRefFacesUploaded(job){
  if(!(job.faceRefine && job.faceRefine.enabled)) return;
  for(const slot of [1, 2]){
    const local = job[`localRefFace${slot}`];
    if(!local || job[`uploadedRefFace${slot}`]) continue;
    const fd = new FormData();
    fd.append("image", local, local.name);
    fd.append("overwrite", "true");
    const r = await fetch(server()+"/upload/image", {method:"POST", body:fd});
    if(!r.ok) throw new Error(`Fallo al subir la cara de referencia ${slot}`);
    const d = await r.json();
    const up = {name:d.name, subfolder:d.subfolder||"", type:d.type||"input"};
    job[`uploadedRefFace${slot}`] = up;
    if(slot === 1){ if(localRefFace1 === local){ uploadedRefFace1 = {...up}; localRefFace1 = null; } }
    else { if(localRefFace2 === local){ uploadedRefFace2 = {...up}; localRefFace2 = null; } }
    log(`Foto Ref. Cara ${slot} subida: ${up.name}`, "l-ok");
  }
}

async function ensureJobImageUploaded(job){
  if(job.uploadedImage) return;
  const f = job.localFile || localFile;
  if(!f){
    if(uploadedImage){
      job.uploadedImage = {...uploadedImage};
      return;
    }
    throw new Error("No hay imagen seleccionada. Arrastra una imagen a la zona de entrada.");
  }
  setRun("busy","subiendo imagen...");
  const fd=new FormData();
  fd.append("image", f, f.name.replace(/^temp_\d+_/, ''));
  fd.append("overwrite","true");
  const r=await fetch(server()+"/upload/image",{method:"POST",body:fd});
  if(!r.ok) throw new Error("Fallo al subir la imagen al servidor");
  const data=await r.json();
  job.uploadedImage={name:data.name, subfolder:data.subfolder||"", type:data.type||"input"};
  uploadedImage = {...job.uploadedImage};
  log("Imagen subida al servidor: "+job.uploadedImage.name,"l-ok");
}

function buildPostProcessGraph(j){
  // Grafo mínimo on-demand: cargar el clip final y aplicar SOLO el post-proceso
  // pedido (interpolación de frames o RTX Super Resolution). El vídeo ya lleva
  // el Color Grading de la generación, así que aquí no se re-aplica.
  const sourceMedia = j.sourceMedia || currentMedia[2];
  if(!sourceMedia || !sourceMedia.filename){
    throw new Error("No hay vídeo final cargado para el post-proceso.");
  }
  const file = (sourceMedia.subfolder ? sourceMedia.subfolder + "/" : "") + sourceMedia.filename + " [output]";
  const g = {};
  g["900_load"] = { class_type:"LoadVideo", inputs:{ file }, _meta:{ title:"Load Video (Native)" } };
  g["901_comp"] = { class_type:"GetVideoComponents", inputs:{ video:["900_load", 0] }, _meta:{ title:"Get Video Components (Native)" } };
  const audio = ["901_comp", 1];
  const srcFps = ["901_comp", 2];
  let images = ["901_comp", 0];
  let fps = srcFps;
  const prefix = (j.filenamePrefix || $("filenamePrefix")?.value || "templo/mensaje_botella").trim();

  if(j.isInterpolateOnly){
    const rife = j.rife || getRifeState();
    const mult = parseInt(rife.multiplier || "2", 10);
    const engine = rife.engine || "rife";
    if(engine === "rtx"){
      g["902_fg"] = {
        class_type: "RTXVideoFrameGeneration",
        inputs: {
          images,
          generation_type: "frame rate multiplier",
          "generation_type.multiplier": mult,
          mode: "HIGH",
          automatic_shot_change_detection: true,
          shot_change: false,
          image_encoding: "8-bit RGB"
        },
        _meta: { title: "RTX Video Frame Generation" }
      };
      images = ["902_fg", 0];
    } else {
      g["902_rife_load"] = {
        class_type: "FrameInterpolationModelLoader",
        inputs: { model_name: rife.model || "rife_v4.26.safetensors" },
        _meta: { title: "Frame Interpolation Model Loader" }
      };
      g["903_rife"] = {
        class_type: "FrameInterpolate",
        inputs: { multiplier: mult, images, interp_model: ["902_rife_load", 0] },
        _meta: { title: "Frame Interpolate" }
      };
      images = ["903_rife", 0];
    }
    // fps de salida = fps origen × mult
    g["904_fps"] = {
      class_type: "ComfyMathExpression",
      inputs: { expression: "a * b", "values.a": srcFps, "values.b": mult },
      _meta: { title: "FPS × mult" }
    };
    fps = ["904_fps", 0];
  } else if(j.isRtxUpscaleOnly){
    const rtx = j.rtx || getRtxState();
    const quality = rtx.quality || "HIGHBITRATE_ULTRA";
    // Los modos DENOISE_*/DEBLUR_* conservan la resolución (el nodo ignora el resize).
    const sameRes = /^(DENOISE|DEBLUR)_/.test(quality);
    const scale = parseFloat(rtx.scale || 2);
    g["902_sr"] = {
      class_type: "RTXVideoSuperResolution",
      inputs: {
        images,
        resize_type: "scale by multiplier",
        "resize_type.scale": sameRes ? 1.0 : scale,
        quality,
        strength: 1.0,
        image_encoding: "8-bit RGB"
      },
      _meta: { title: sameRes ? "RTX Limpieza (misma resolución)" : `RTX Super Resolution (${scale}x)` }
    };
    images = ["902_sr", 0];
  }

  // Color Grading / Post-FX del panel: se aplica si está activo al pulsar el
  // botón (así puedes añadirlo a un clip que no lo llevaba). Se aplica TRAS el
  // post-proceso para que el grano quede nítido a la resolución final.
  // OJO: si el clip YA llevaba FX de la generación, desactívalo aquí para no
  // duplicarlo (mismo criterio que MiniMaxH3).
  images = appendVideoPostFx(g, images, j.postfx, j.seedValue);

  g["905_create"] = {
    class_type: "CreateVideo",
    inputs: { images, fps, audio, bit_depth: 8, color_space: "sRGB", codec: "none" },
    _meta: { title: "Create Video" }
  };
  const rtxMode = (j.rtx && j.rtx.quality) || "";
  const suffix = j.isInterpolateOnly
    ? `_interp_${(j.rife?.multiplier || 2)}x`
    : (/^(DENOISE|DEBLUR)_/.test(rtxMode)
        ? `_${rtxMode.toLowerCase()}`
        : `_rtx${parseFloat((j.rtx && j.rtx.scale) || 2)}x`);
  // Reutilizamos el id del save final (N.FINAL_SAVE) para que el visor y el
  // manejador de resultados lo muestren en el reproductor final (slot 2).
  g[N.FINAL_SAVE] = {
    class_type: "SaveVideo",
    inputs: { filename_prefix: prefix + suffix, format: "auto", codec: "auto", video: ["905_create", 0] },
    _meta: { title: "Save Video" }
  };
  return g;
}

function buildGraph(mode, job){
  // mode: "first" | "second" | "full"
  const j = job || activeJob || null;
  // Post-proceso on-demand sobre el clip ya generado (no re-muestrea).
  if(j && (j.isInterpolateOnly || j.isRtxUpscaleOnly)){
    return buildPostProcessGraph(j);
  }
  const g=JSON.parse(JSON.stringify(BASE_GRAPH));
  const imgObj = j ? j.uploadedImage : uploadedImage;
  // LoadImage acepta "subfolder/name.ext" (necesario para imágenes restauradas
  // desde metadatos, p.ej. "pasted/image (3).png"); una subida fresca vive en
  // la raíz de input y solo tiene name. Guard: un name ausente/inválido mandaría
  // literalmente "undefined" al backend (FileNotFoundError en ComfyUI).
  const imgSpecFull = (imgObj && typeof imgObj.name === "string" && imgObj.name)
    ? (imgObj.subfolder ? imgObj.subfolder + "/" : "") + imgObj.name
    : null;
  if(imgSpecFull){
    g[N.IMAGE].inputs.image = imgSpecFull;
  } else if(imgObj){
    log("⚠️ Imagen de entrada sin nombre válido; se mantiene la del grafo base.", "l-warn");
  }
  const promptText = (j ? j.prompt : $("prompt").value) || "";
  if(promptText.trim()) g[N.PROMPT].inputs.text = promptText.trim();
  const sMode = j ? j.seedMode : seedMode;
  const sVal = j ? j.seedValue : parseInt($("seedVal").value, 10);
  g[N.SEED].inputs.seed = (sMode === "random") ? -1 : sVal;
  const w = j ? j.width : parseInt($("width").value, 10);
  const h = j ? j.height : parseInt($("height").value, 10);
  g[N.WIDTH].inputs.Xi=w;g[N.WIDTH].inputs.Xf=w;g[N.HEIGHT].inputs.Xi=h;g[N.HEIGHT].inputs.Xf=h;
  const frames = j ? j.frames : parseInt($("frames").value, 10);
  g[N.FRAMES].inputs.Xi=frames;g[N.FRAMES].inputs.Xf=frames;
  const fid = j ? parseFloat(j.fidelity) : parseFloat($("fidelitySlider").value);
  g[N.FIDELITY].inputs.Xi=fid;g[N.FIDELITY].inputs.Xf=fid;
  const mot = j ? parseFloat(j.motion) : parseFloat($("motionSlider").value);
  g[N.MOTION].inputs.Xi=mot;g[N.MOTION].inputs.Xf=mot;
  const jobLoras = j ? j.loras : loras;
  g[N.LORA].inputs.lora_1={on:jobLoras[0]?.on??false,lora:jobLoras[0]?.lora??"",strength:jobLoras[0]?.strength??1};
  g[N.LORA].inputs.lora_2={on:jobLoras[1]?.on??false,lora:jobLoras[1]?.lora??"",strength:jobLoras[1]?.strength??1};
  g[N.LORA].inputs.lora_3={on:jobLoras[2]?.on??false,lora:jobLoras[2]?.lora??"",strength:jobLoras[2]?.strength??1};
  g[N.LORA].inputs.lora_4={on:jobLoras[3]?.on??false,lora:jobLoras[3]?.lora??"",strength:jobLoras[3]?.strength??1};
  // Desconectar o saltar el nodo legacy 906 (DMD LoRA) conectando el cargador de LoRAs directamente al modelo fuente (868)
  g[N.LORA].inputs.model = ["868", 0];
  delete g["906"];
  const modelChoice = (j ? j.model : $("modelSelect")?.value) || "";
  const isDiffusionModel = modelChoice.startsWith("diffusion_models/") || modelChoice.includes("diffusion_models") || modelChoice.includes("transformer") || modelChoice.includes("int8-convrot");

  if(isDiffusionModel){
    // ComfyUI (UNETLoader) busca dentro de la carpeta 'diffusion_models',
    // por lo que espera la ruta relativa interna (sin el prefijo 'diffusion_models/').
    const unetName = modelChoice.startsWith("diffusion_models/")
      ? modelChoice.slice("diffusion_models/".length)
      : modelChoice;

    g[N.CHECKPOINT] = {
      class_type: "UNETLoader",
      inputs: {
        unet_name: unetName,
        weight_dtype: "default"
      },
      _meta: { title: "Load Diffusion Model (LTX-2.5)" }
    };
    // Helper para obtener un checkpoint base LTXV disponible para el Text Encoder y Audio VAE
    const availableLtxvModels = (typeof AVAILABLE_MODELS !== "undefined" && Array.isArray(AVAILABLE_MODELS)) ? AVAILABLE_MODELS : [];
    // ckpt_name se resuelve contra la carpeta 'checkpoints' de ComfyUI: excluir
    // el modelo diffusion elegido (UNETLoader) y cualquier variante del mismo
    // basename (con/sin prefijo diffusion_models/). "ltxv/" como subcadena
    // colaba audio-separación (ltxv/MelBandRoformer...) → FileNotFoundError.
    const diffBase = unetName.split("/").pop().toLowerCase();
    const looksLikeLtxCkpt = (m) => {
      const base = m.split("/").pop().toLowerCase();
      if (base === diffBase) return false;
      return !m.includes("diffusion_models") && (base.includes("ltx-") || base.includes("ltx_") || base.includes("sulphur"));
    };
    const baseCkpt = availableLtxvModels.find(looksLikeLtxCkpt) || "Ligazón para Stable-Diffusion/ltx-2.5-av-proj-ref.safetensors";

    const textEncoderChoice = (j ? j.textEncoder : $("textEncoderSelect")?.value) || "gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot-v2.safetensors";
    if(g[N.LTXAV_TEXT_ENCODER] && g[N.LTXAV_TEXT_ENCODER].inputs){
      g[N.LTXAV_TEXT_ENCODER].inputs.text_encoder = textEncoderChoice;
      g[N.LTXAV_TEXT_ENCODER].inputs.ckpt_name = baseCkpt;
    }
  } else {
    if(g[N.CHECKPOINT] && g[N.CHECKPOINT].inputs){
      g[N.CHECKPOINT].class_type = "CheckpointLoaderSimple";
      g[N.CHECKPOINT].inputs.ckpt_name = modelChoice;
    }
    if(g[N.LTXAV_TEXT_ENCODER] && g[N.LTXAV_TEXT_ENCODER].inputs){
      g[N.LTXAV_TEXT_ENCODER].inputs.ckpt_name = modelChoice;
    }
  }

  // VAE Vídeo: "Checkpoint" mantiene el VAE del nodo CHECKPOINT; cualquier otro valor
  // activa el VAELoader personalizado y redirige todas las entradas vae.
  let vaeChoice = (j ? j.vae : $("vaeSelect")?.value) || "";
  if(isDiffusionModel && (!vaeChoice || vaeChoice === "Checkpoint")){
    vaeChoice = (typeof AVAILABLE_VAES !== "undefined" ? AVAILABLE_VAES : []).find(v => v.includes("ltx-2.5-video-vae-conv-bf16")) ||
                (typeof AVAILABLE_VAES !== "undefined" ? AVAILABLE_VAES : []).find(v => v.includes("ltx-2.5-video-vae-bf16")) ||
                "LTX-2/ltx-2.5-video-vae-conv-bf16.safetensors";
  }
  const useCustomVae = vaeChoice && vaeChoice !== "Checkpoint";
  if(useCustomVae && g[N.CUSTOM_VAE] && g[N.CUSTOM_VAE].inputs){
    g[N.CUSTOM_VAE].inputs.vae_name = vaeChoice;
    const vaeRef = [N.CUSTOM_VAE, 0];
    for(const k of Object.keys(g)){
      const node = g[k];
      if(!node || !node.inputs) continue;
      for(const inputKey of Object.keys(node.inputs)){
        const val = node.inputs[inputKey];
        if(Array.isArray(val) && val.length >= 2 && String(val[0]) === N.CHECKPOINT && val[1] === 2){
          node.inputs[inputKey] = vaeRef;
        }
      }
    }
  }

  // VAE Audio
  let audioVaeChoice = (j ? j.audioVae : $("audioVaeSelect")?.value) || "";
  if(isDiffusionModel && (!audioVaeChoice || audioVaeChoice === "Checkpoint")){
    audioVaeChoice = (typeof AVAILABLE_VAES !== "undefined" ? AVAILABLE_VAES : []).find(v => v.includes("ltx-2.5-audio-vae-bf16")) ||
                     "LTX-2/ltx-2.5-audio-vae-bf16.safetensors";
  }
  if(audioVaeChoice && audioVaeChoice !== "Checkpoint" && g["617"]){
    g["617"] = {
      class_type: "VAELoader",
      inputs: {
        vae_name: audioVaeChoice
      },
      _meta: { title: "Load LTXV Audio VAE" }
    };
  } else if(g["617"] && g["617"].inputs){
    const availableLtxvModels = (typeof AVAILABLE_MODELS !== "undefined" && Array.isArray(AVAILABLE_MODELS)) ? AVAILABLE_MODELS : [];
    const diffBase2 = (isDiffusionModel ? modelChoice : "").split("/").pop().toLowerCase();
    const looksLikeLtxCkpt2 = (m) => {
      const base = m.split("/").pop().toLowerCase();
      if (base === diffBase2) return false;
      return !m.includes("diffusion_models") && (base.includes("ltx-") || base.includes("ltx_") || base.includes("sulphur"));
    };
    const baseCkpt = availableLtxvModels.find(looksLikeLtxCkpt2) || "Ligazón para Stable-Diffusion/ltx-2.5-av-proj-ref.safetensors";
    g["617"].class_type = "LTXVAudioVAELoader";
    g["617"].inputs.ckpt_name = isDiffusionModel ? baseCkpt : modelChoice;
  }

  // Latent Upscaler Model (nodo 743 para el 2º pase) — exclusivo LTX 2.5
  if(g["743"] && g["743"].inputs){
    g["743"].inputs.model_name = "ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors";
  }

  const bitDepth = j ? j.bitDepth : getBitDepth();
  if(g[N.CREATE_VIDEO_1] && g[N.CREATE_VIDEO_1].inputs) g[N.CREATE_VIDEO_1].inputs.bit_depth = bitDepth;
  if(g[N.CREATE_VIDEO_2] && g[N.CREATE_VIDEO_2].inputs) g[N.CREATE_VIDEO_2].inputs.bit_depth = bitDepth;

  // Tipo de atención: Sage Attention o Comfy Kitchen Attention
  let sageType = (j ? j.sageType : $("sageAttentionType")?.value) || SAGE_DEFAULT;
  if(!SAGE_TYPES.includes(sageType)) sageType = SAGE_DEFAULT;
  if(g[N.SAGE_PATCH] && g[N.SAGE_PATCH].inputs){
    const modelInput = g[N.SAGE_PATCH].inputs.model;
    if(sageType === "comfy kitchen attention"){
      g[N.SAGE_PATCH].class_type = "ModelAttentionBackend";
      g[N.SAGE_PATCH].inputs = {
        attention: "comfy kitchen attention",
        model: modelInput
      };
      g[N.SAGE_PATCH]._meta = { title: "Model Attention Backend (Kitchen)" };
    } else {
      g[N.SAGE_PATCH].class_type = "PathchSageAttentionKJ";
      g[N.SAGE_PATCH].inputs = {
        sage_attention: sageType,
        allow_compile: false,
        model: modelInput
      };
      g[N.SAGE_PATCH]._meta = { title: "Patch Sage Attention KJ" };
    }
  }

  // Steps del primer pase: regenerar sigmas interpolando desde la curva base oficial 8-step
  const firstSteps = parseInt((j ? j.firstPassSteps : $("firstPassSteps")?.value) || 8, 10);
  if(g[N.FIRST_SIGMAS] && g[N.FIRST_SIGMAS].inputs){
    g[N.FIRST_SIGMAS].inputs.sigmas = buildFirstPassSigmas(firstSteps);
  }
  // Diálogo / audio nativo: negativo dinámico + volumen de la salida (551/598).
  applyDialogueMode(g, j ? j.dialogueMode : getDialogueMode());

  // El prompt de entrada para CLIPTextEncode procede siempre de RAW_PROMPT (el texto de #prompt).
  const rawPrompt = promptText.trim();
  if(g[N.RAW_PROMPT] && g[N.RAW_PROMPT].inputs) g[N.RAW_PROMPT].inputs.value = rawPrompt;
  if(g[N.PROMPT] && g[N.PROMPT].inputs){
    g[N.PROMPT].inputs.text = [N.RAW_PROMPT, 0];
  }
  // Eliminamos LTX2_PROMPT y LTX2_PREVIEW para que ComfyUI no ejecute el nodo LLM durante la inferencia de vídeo
  delete g[N.LTX2_PROMPT];
  delete g[N.LTX2_PREVIEW];

  // Model Preview Override (preview animado multi-frame en tiempo real L2RGB / NVENC / WebP)
  const prevMethod = getPreviewMethod();
  if(prevMethod !== "none"){
    const previewOverrideKey = "1070";
    g[previewOverrideKey] = {
      class_type: "ModelPreviewOverrideKJ",
      inputs: {
        model: [N.LORA, 0],
        max_resolution: 768,
        jpeg_quality: 80,
        suppress_default_preview: true,
        preview_frames: 32,
        preview_fps: 6,
        tiny_vae: "none"
      },
      _meta: { title: "Model Preview Override (animado LTXV L2RGB)" }
    };
    if(g[N.REFERENCE_1] && g[N.REFERENCE_1].inputs && g[N.REFERENCE_1].inputs.model){
      g[N.REFERENCE_1].inputs.model = [previewOverrideKey, 0];
    }
    if(g[N.REFERENCE_2] && g[N.REFERENCE_2].inputs && g[N.REFERENCE_2].inputs.model){
      g[N.REFERENCE_2].inputs.model = [previewOverrideKey, 0];
    }
    if(g[N.SAMPLER_1] && g[N.SAMPLER_1].inputs && g[N.SAMPLER_1].inputs.model && g[N.SAMPLER_1].inputs.model[0] === N.LORA){
      g[N.SAMPLER_1].inputs.model = [previewOverrideKey, 0];
    }
    if(g[N.SAMPLER_2] && g[N.SAMPLER_2].inputs && g[N.SAMPLER_2].inputs.model && g[N.SAMPLER_2].inputs.model[0] === N.LORA){
      g[N.SAMPLER_2].inputs.model = [previewOverrideKey, 0];
    }
  }

  // Prefijo de archivo configurable (validado: sin "..", solo caracteres seguros)
  let prefix = (j ? j.filenamePrefix : $("filenamePrefix")?.value)?.trim() || "templo/mensaje_botella";
  prefix = prefix.replace(/\\/g, "/").split("/").filter(seg => seg && seg !== "." && seg !== "..").join("/");
  if(!prefix || !/^[A-Za-z0-9_\-\/]+$/.test(prefix)){
    log(`⚠️ filename_prefix inválido ("${prefix || "vacío"}"); usando "ltxv_ui".`, "l-warn");
    prefix = "ltxv_ui";
  }
  if(g[N.FINAL_SAVE] && g[N.FINAL_SAVE].inputs){
    g[N.FINAL_SAVE].inputs.filename_prefix = prefix;
  }
  if(g[N.FIRST_SAVE] && g[N.FIRST_SAVE].inputs){
    g[N.FIRST_SAVE].inputs.filename_prefix = prefix + "_prev";
  }

  // Frame Interpolation (RIFE / RTX Frame Gen) — se conecta entre VAEDecode (740) y RTX_SR (921) o CreateVideo (919)
  const rifeState = j ? j.rife : getRifeState();
  const rifeEnabled = rifeState ? rifeState.enabled : true;
  const rifeMultiplier = rifeState ? parseInt(rifeState.multiplier || "2", 10) : 2;
  const rifeModel = rifeState ? (rifeState.model || "rife_v4.26.safetensors") : "rife_v4.26.safetensors";
  const rifeEngine = rifeState ? (rifeState.engine || "rife") : "rife";

  let currentVideoSource = [N.DECODE_VIDEO_2, 0];
  // Refinado de elementos (rostro/manos/...) sobre los frames finales, antes de interpolar/escalar.
  if(mode !== "first" && g[N.DECODE_VIDEO_2]){
    currentVideoSource = appendElementRefine(g, currentVideoSource, j);
  }

  if(rifeEnabled){
    if(rifeEngine === "rtx"){
      delete g[N.RIFE_LOADER];
      g[N.RIFE_INTERP] = {
        inputs: {
          images: currentVideoSource,
          generation_type: "frame rate multiplier",
          "generation_type.multiplier": rifeMultiplier,
          mode: "HIGH",
          automatic_shot_change_detection: true,
          shot_change: false,
          image_encoding: "8-bit RGB"
        },
        class_type: "RTXVideoFrameGeneration",
        _meta: {
          title: "RTX Video Frame Generation"
        }
      };
    } else {
      g[N.RIFE_LOADER] = {
        inputs: {
          model_name: rifeModel
        },
        class_type: "FrameInterpolationModelLoader",
        _meta: {
          title: "Frame Interpolation Model Loader"
        }
      };
      g[N.RIFE_INTERP] = {
        inputs: {
          multiplier: rifeMultiplier,
          images: currentVideoSource,
          interp_model: [N.RIFE_LOADER, 0]
        },
        class_type: "FrameInterpolate",
        _meta: {
          title: "Frame Interpolate"
        }
      };
    }
    currentVideoSource = [N.RIFE_INTERP, 0];
    if(g[N.CREATE_VIDEO_2] && g[N.CREATE_VIDEO_2].inputs){
      g[N.CREATE_VIDEO_2].inputs.fps = 24 * rifeMultiplier;
    }
  } else {
    delete g[N.RIFE_LOADER];
    delete g[N.RIFE_INTERP];
    if(g[N.CREATE_VIDEO_2] && g[N.CREATE_VIDEO_2].inputs){
      g[N.CREATE_VIDEO_2].inputs.fps = 24;
    }
  }

  // RTX Video Super Resolution / limpieza — opcional tras RIFE/DECODE_VIDEO_2
  const rtxState = j ? j.rtx : getRtxState();
  const rtxEnabled = rtxState ? rtxState.enabled : true;
  const rtxQuality = rtxState ? (rtxState.quality || "HIGHBITRATE_ULTRA") : "HIGHBITRATE_ULTRA";
  const rtxScale = rtxState ? parseFloat(rtxState.scale || 2) : 2;

  if(rtxEnabled){
    if(!g[N.RTX_SR] || !g[N.RTX_SR].inputs){
      g[N.RTX_SR] = {
        class_type: "RTXVideoSuperResolution",
        inputs: {
          resize_type: "scale by multiplier",
          "resize_type.scale": rtxScale,
          quality: rtxQuality,
          strength: 1.0,
          image_encoding: "8-bit RGB",
          images: currentVideoSource
        },
        _meta: { title: "RTX Video Super Resolution" }
      };
    } else {
      g[N.RTX_SR].inputs.images = currentVideoSource;
      g[N.RTX_SR].inputs.quality = rtxQuality;
      g[N.RTX_SR].inputs["resize_type.scale"] = rtxScale;
    }
    if(g[N.CREATE_VIDEO_2] && g[N.CREATE_VIDEO_2].inputs){
      g[N.CREATE_VIDEO_2].inputs.images = [N.RTX_SR, 0];
    }
  } else {
    if(g[N.RTX_SR]) delete g[N.RTX_SR];
    if(g[N.CREATE_VIDEO_2] && g[N.CREATE_VIDEO_2].inputs){
      g[N.CREATE_VIDEO_2].inputs.images = currentVideoSource;
    }
  }

  // Color Grading & Look Cinemático sobre los fotogramas del vídeo final
  const postFxState = j ? j.postfx : getPostFxState();
  if(postFxState && postFxState.enabled && g[N.CREATE_VIDEO_2] && g[N.CREATE_VIDEO_2].inputs){
    const fxSeed = (j ? j.seedValue : parseInt($("seedVal")?.value || "1", 10) || 1);
    g[N.CREATE_VIDEO_2].inputs.images = appendVideoPostFx(g, g[N.CREATE_VIDEO_2].inputs.images, postFxState, fxSeed);
  }

  // Purgas de VRAM (918 entre pases, 925 al final): con DynamicVRAM solo obligan
  // a recargar el modelo (~2.4 s antes del 2º pase y ~5.5 s en el siguiente
  // trabajo, medido con bench_comfyui.py). Se mantienen solo si se piden.
  const purgeVram = j ? !!j.purgeVram : !!$("purgeVram")?.checked;
  if(!purgeVram){
    delete g[N.CLEAN_GPU];
    delete g[N.PURGE_VRAM];
  }

  // Preview del 1er pase en modo full: decode de vídeo (552) + volumen (551) +
  // CreateVideo (922) + save (923), ~5 s. El decode de audio (550) se conserva:
  // el 2º pase lo re-codifica (274). En modo "first" el preview es la salida.
  const savePreview = j ? j.savePreview !== false : ($("savePreview")?.checked ?? true);
  if(!savePreview && mode !== "first"){
    ["552", "551", N.CREATE_VIDEO_1, N.FIRST_SAVE].forEach(id => { delete g[id]; });
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
    if(g[N.RIFE_LOADER]) delete g[N.RIFE_LOADER];
    if(g[N.RIFE_INTERP]) delete g[N.RIFE_INTERP];
  }
  // mode "full" mantiene ambos save nodes para ejecutar 1er pase + final de una vez.
  return g;
}

function showVideo(slot, media, options={}){
  if(!media) return;
  const url=`${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder||"")}&type=${encodeURIComponent(media.type||"output")}#t=0.1`;
  const v=$("video"+slot), empty=$("empty"+slot), badge=$("badge"+slot), btn=$("btnLoadMeta"+slot), dl=$("btnDownload"+slot), sf=$("btnSaveFrame"+slot);
  const ip=$("btnInterpolate"+slot), us=$("btnRtxUpscale"+slot);
  const prev=$("previewImg"+slot);
  if(prev) prev.style.display="none";
  v.crossOrigin = "anonymous";
  v.src = url;
  v.style.display = "block";
  empty.style.display = "none";
  if(options.autoplay !== false) v.play().catch(err => console.debug("Autoplay bloqueado:", err));
  if(btn) btn.disabled = false;
  if(dl) dl.style.display="inline-flex";
  if(sf) sf.style.display="inline-flex";
  // Post-proceso on-demand (solo existe en el reproductor final)
  if(ip) ip.style.display="inline-flex";
  if(us) us.style.display="inline-flex";
  currentMedia[slot] = { filename: media.filename, subfolder: media.subfolder||"", type: media.type||"output" };
  if(badge){
    const onDemand = activeJob?.isInterpolateOnly
      ? `Interp ${activeJob.rife?.multiplier || 2}x`
      : (activeJob?.isRtxUpscaleOnly
          ? (/^(DENOISE|DEBLUR)_/.test(activeJob.rtx?.quality || "")
              ? activeJob.rtx.quality.replace("_", " ").toLowerCase()
              : `RTX ${parseFloat(activeJob.rtx?.scale || 2)}x`)
          : null);
    const typeLabel = slot === 1 ? "1er pase" : "final";
    if(onDemand){
      badge.textContent = onDemand;
    } else if(options.badge != null){
      badge.textContent = options.badge;
    } else if(options.variantIndex != null){
      badge.textContent = `Var ${options.variantIndex} · ${slot === 1 ? "1er" : "final"}`;
    } else {
      badge.textContent = typeLabel;
    }
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
        await applyWorkflow(workflow);
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
        // Si ya estamos en la posición, no hay seek real y "seeked" nunca
        // dispara: resolvemos directamente (con pequeño delay para asegurar
        // que el frame está pintado).
        if(Math.abs(v.currentTime - targetTime) < 0.001){
          setTimeout(resolve, 50);
          return;
        }
        let settled = false;
        const timer = setTimeout(() => {
          if(settled) return; settled = true;
          v.removeEventListener("seeked", onSeeked); v.removeEventListener("error", onError);
          reject(new Error("timeout durante seek"));
        }, 5000);
        const onSeeked = () => { if(settled) return; settled = true; clearTimeout(timer); v.removeEventListener("seeked", onSeeked); v.removeEventListener("error", onError); resolve(); };
        const onError = () => { if(settled) return; settled = true; clearTimeout(timer); v.removeEventListener("seeked", onSeeked); v.removeEventListener("error", onError); reject(new Error("error durante seek")); };
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
  syncHistoryTimings();
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
        const videoUrl = mediaViewUrl(item, { anchor: "#t=0.001" });
        const isFirstPass = item.filename.includes("_prev");
        const typeBadge = isFirstPass ? "1er pase" : "final";
        const slot = isFirstPass ? 1 : 2;
        card.innerHTML = `
          <span class="variant-badge">${typeBadge}</span>
          <video src="${videoUrl}" crossorigin="anonymous" controls muted preload="metadata" playsinline></video>
          <div class="variant-info">
            <span style="font-size:10px;color:var(--muted-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;" title="${escapeHtml(item.filename)}">${escapeHtml(item.filename)}</span>
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
        makeCardDraggable(card);

        card.addEventListener("mouseenter", async () => {
          if(!card.dataset.meta && item.filename){
            try {
              const wfUrl = `${server()}/view?filename=${encodeURIComponent(item.filename)}&subfolder=${encodeURIComponent(item.subfolder)}&type=${encodeURIComponent(item.type)}`;
              const videoEl = card.querySelector("video");
              const [wf, specs] = await Promise.all([
                extractWorkflowFromMP4(wfUrl),
                resolveVideoSpecs(videoEl)
              ]);
              let timing = getVideoTiming(item.filename);
              if(!timing){
                await syncHistoryTimings();
                timing = getVideoTiming(item.filename);
              }
              function findModel(w){
                for(const k of Object.keys(w)){
                  const n = w[k];
                  if(!n || !n.inputs) continue;
                  if(n.inputs.unet_name) return String(n.inputs.unet_name).split("/").pop();
                  if(n.inputs.ckpt_name) return String(n.inputs.ckpt_name).split("/").pop();
                  if(n.inputs.model_name) return String(n.inputs.model_name).split("/").pop();
                }
                return "";
              }
              const modelName = wf ? findModel(wf) : "";
              const rows = [];
              if(specs.resolution && specs.resolution !== "—") rows.push(["Resolución", specs.resolution]);
              if(specs.aspectRatio && specs.aspectRatio !== "—") rows.push(["A/R", specs.aspectRatio]);
              if(timing) rows.push(["Tiempo gen.", timing]);
              if(modelName) rows.push(["Modelo", modelName]);
              const p = wf ? (wf["6"]?.inputs?.text || wf["50"]?.inputs?.value || "") : "";
              if(p) rows.push(["Prompt", p.length > 80 ? p.slice(0, 77) + "..." : p]);
              const loras = [];
              if(wf){
                for(const k of Object.keys(wf)){
                  if(wf[k]?.inputs?.lora_name){
                    loras.push(`${String(wf[k].inputs.lora_name).split("/").pop()} (${wf[k].inputs.strength_model || 1})`);
                  }
                }
              }
              card.dataset.meta = JSON.stringify({ title: "Metadata Vídeo", rows, loras });
              showVariantTooltip(card);
            } catch(_){}
          } else if(card.dataset.meta){
            showVariantTooltip(card);
          }
        });
        card.addEventListener("mouseleave", () => hideVariantTooltip());
        card.addEventListener("mousemove", (e) => positionVariantTooltip(e));

        card.addEventListener("click", (e) => {
          if(e.target.closest("video")) return;
          if(e.target.closest("button") || e.target.closest(".variant-icons")) return;
          const media = { filename: item.filename, subfolder: item.subfolder || "", type: item.type || "output" };
          const baseName = item.filename.replace(/\.[^.]+$/, "");
          requestAnimationFrame(() => showVideo(slot, media, { badge: baseName, autoplay: false }));
          log("▶ Reproduciendo en panel principal: "+item.filename, "l-ok");
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
              await applyWorkflow(workflow);
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
        });
        grid.appendChild(moreBtn);
      }

      status.textContent = `${allItems.length} vídeos encontrados (${items.length} mostrados).`;
    }

    renderBatch();
  } catch(err){
    status.textContent = "Error: "+err.message;
  }
}

// --- GENERACIÓN ---
async function runSingleGeneration(index) {
    if(!activeJob) return; // guard: stop/error puede dejar la cola vacía entre el setTimeout y la ejecución
    try {
        const mode = activeJob ? (activeJob.firstPassOnly ? "first" : "full") : "full";
        const graph = buildGraph(mode, activeJob);
        const jobSeedMode = activeJob ? activeJob.seedMode : seedMode;
        const jobSeedValue = activeJob ? activeJob.seedValue : parseInt($("seedVal").value || "12345", 10);
        const seedUsed = (jobSeedMode === "random") ? randomSeed() : jobSeedValue;
        if(graph[N.SEED]) graph[N.SEED].inputs.seed = seedUsed;

        // Reservamos un índice de variante global al inicio de cada flujo nuevo.
        if(activeJob && activeJob.currentVariantIndex == null){
          variantCounter++;
          activeJob.currentVariantIndex = variantCounter;
        }
        const varIndex = activeJob?.currentVariantIndex || (variantCounter + 1);

        const stepLabel = (activeJob?.firstPassOnly ? `1er pase · Var ${varIndex}` : `paso 1+2 · Var ${varIndex}`);
        log(`🚀 Procesando ${stepLabel} (seed ${seedUsed})...`);
        const r = await fetch(server()+"/prompt",{
          signal: AbortSignal.timeout(60000), // colgado → activeJob fantasma
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            prompt:graph,
            client_id:CLIENT_ID,
            extra_data: {
              extra_pnginfo: {
                workflow: graph,
                prompt: graph
              },
              preview_method: (getPreviewMethod() === "none" ? "none" : "latent2rgb")
            }
          })
        });
        if(!r.ok){
            const t = await r.text().catch(()=> "");
            throw new Error("HTTP "+r.status+" "+t.slice(0,300));
        }
        const data = await r.json();
        if(data.error) throw new Error(JSON.stringify(data.error));

        pendingSeeds[data.prompt_id] = seedUsed;
        promptVariantMap[data.prompt_id] = varIndex;
        currentPromptId = data.prompt_id;
        startTimer(data.prompt_id, (activeJob?.isInterpolateOnly || activeJob?.isRtxUpscaleOnly) ? 2 : 1);
        pollFallback(data.prompt_id);
    } catch(err) {
        log(`❌ No se pudo encolar: ${err.message || err}`, "l-err");
        generationStep = 0;
        finishCurrentJob();
    }
}

async function startJob(job){
  activeJob = job;
  updateQueueUI();
  try {
    await ensureSocketConnected();
    if(!(job.isInterpolateOnly || job.isRtxUpscaleOnly)){
      await ensureJobImageUploaded(job);
      await ensureJobRefFacesUploaded(job);
    }
    totalBatchSize = job.batchSize || 1;
    currentBatchIndex = 0;
    generationStep = 1;
      job.currentVariantIndex = null;
    // Limpiamos tiempos de jobs anteriores para evitar confusión visual.
    $("time1").textContent = "";
    $("time1").classList.remove("live");
    $("time2").textContent = "";
    $("time2").classList.remove("live");
    setRun("busy", `Job #${job.id} en proceso · ${job.firstPassOnly ? "1er pase" : "completo"} · ${job.batchSize} variante(s)...`);
    enableStopButtons(true);
    await runSingleGeneration(0);
  } catch(err) {
    log(`❌ Error al iniciar Job #${job.id}: ${err.message || err}`, "l-err");
    setRun("bad", "Error");
    finishCurrentJob();
  }
}

function finishCurrentJob(){
  activeJob = null;
  if(jobQueue.length > 0){
    const next = jobQueue.shift();
    updateQueueUI();
    log(`⏭️ Iniciando siguiente job de la cola (${jobQueue.length} restantes)...`, "l-info");
    startJob(next);
  } else {
    setRun("ok", "en reposo");
    // Preview obsoleto al quedar en reposo (final de job, error o stop).
    clearPreview();
    log("🏁 Cola vacía. Todos los jobs completados.", "l-ok");
    enableStopButtons(false);
    updateQueueUI();
  }
}

async function enqueueGeneration(firstPassOnly){
  const job = snapshotJob(firstPassOnly);
  if(activeJob){
    jobQueue.push(job);
    updateQueueUI();
    log(`📥 Job #${job.id} añadido a la cola (${jobQueue.length} en espera). Puedes seguir cambiando parámetros o encolar más.`, "l-info");
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

// --- POST-PROCESO ON-DEMAND sobre el clip final (slot 2) ---
async function enqueuePostProcess(kind){
  const media = currentMedia[2];
  if(!media || !media.filename){
    log("No hay vídeo final en el reproductor para procesar.", "l-warn");
    return;
  }
  const job = snapshotJob();
  job.sourceMedia = { ...media };
  job.batchSize = 1;
  job.firstPassOnly = false;
  if(kind === "interp"){
    job.isInterpolateOnly = true;
    job.rife = getRifeState();
    const r = job.rife;
    log(`⚡ Añadida interpolación (${(r.engine||"rife").toUpperCase()} ${r.multiplier}x) de ${media.filename} a la cola.`, "l-info");
  } else {
    job.isRtxUpscaleOnly = true;
    job.rtx = getRtxState();
    const q = job.rtx.quality || "";
    const mdl = /^(DENOISE|DEBLUR)_/.test(q) ? `limpieza ${q.replace("_"," ").toLowerCase()}` : `escalado ${job.rtx.scale}x`;
    log(`🔍 Añadido RTX VSR (${mdl}) de ${media.filename} a la cola.`, "l-info");
  }
  if(activeJob){
    jobQueue.push(job);
    updateQueueUI();
  } else {
    await startJob(job);
  }
}
$("btnInterpolate2")?.addEventListener("click", () => enqueuePostProcess("interp"));
$("btnRtxUpscale2")?.addEventListener("click", () => enqueuePostProcess("rtx"));

// --- ENHANCER (solo Ollama; sin LTX2) ---
(function initLtxvEnhancerUI(){
  const chain = $("enhancerChainMode");
  if(chain){
    chain.innerHTML = `
      <option value="off">Desactivado</option>
      <option value="ollama">Ollama</option>
    `;
    chain.value = "ollama";
  }
  const ltx2Controls = ["ltx2Temperature", "ltx2Seed", "ltx2PreviewText"];
  for(const id of ltx2Controls){
    const el = $(id);
    const row = el?.closest(".enhancer-row");
    if(row) row.style.display = "none";
  }
})();

$("btnEnhance").addEventListener("click", async () => {
  const chainMode = $("enhancerChainMode")?.value || "ollama";
  if(chainMode === "off"){
    log("⚠️ Cadena de mejora desactivada. Activa 'LLM' para usar el botón.", "l-warn");
    return;
  }

  const model = $("enhancerModel").value;
  if(!model){ log("⚠️ Selecciona un modelo de LLM (Ollama / llama.cpp)", "l-err"); return; }
  const mode = $("enhancerMode").value;
  const styleKey = $("enhancerStyle").value;
  const data = loadSysPrompts();
  const system = getCurrentSysPrompt(data, mode, styleKey);
  const userPrompt = $("prompt").value.trim();
  if(mode !== "vision" && !userPrompt){ log("⚠️ Escribe un prompt primero", "l-err"); return; }

  const payload = { model, system, prompt: userPrompt || "Describe this image.", options: { num_ctx: 4096 } };
  if(mode === "vision"){
    if(!localFile){ log("No hay imagen de entrada para modo vision", "l-err"); return; }
    try {
      const b64 = await resizeFileToBase64(localFile, 768);
      payload.images = [b64];
    } catch(e) {
      log("No se pudo leer la imagen: "+(e.message || e), "l-err");
      return;
    }
  }

  $("btnEnhance").disabled = true;
  $("btnEnhance").textContent = "Mejorando...";
  $("enhancerOutput").value = "";
  if($("enhancerMetaInfo")) $("enhancerMetaInfo").textContent = "";
  try {
    const { text, elapsedMs } = await streamOllamaGenerate(payload, $("enhancerOutput"));
    const timeStr = fmtMs(elapsedMs);
    $("enhancerOutput").value = text;
    if($("enhancerMetaInfo")) $("enhancerMetaInfo").textContent = `${model} · ${mode} · ${styleKey} · ${timeStr}`;
    log(`Prompt mejorado en ${timeStr} (${model}, ${mode}, ${styleKey}). Pulsa 'Usar como prompt' para aplicarlo.`, "l-ok");
  } catch(e) {
    log("Error al mejorar: "+e.message, "l-err");
    $("enhancerOutput").value = "Error: "+e.message;
  } finally {
    $("btnEnhance").disabled = false;
    $("btnEnhance").textContent = "Mejorar prompt";
  }
});

// --- INIT ---
updateDuration();
updateQueueUI();
if(!$("enhancerChainMode").value) $("enhancerChainMode").value = "ollama";

// Guía de prompt para el audio nativo de LTX-2.5 (hint en el panel Prompt compartido).
(function addLtxvPromptAudioHint(){
  const ta = $("prompt");
  if(!ta) return;
  const panel = ta.closest(".panel");
  if(!panel) return;
  if(panel.querySelector(".ltxv-audio-hint")) return;
  const hint = document.createElement("div");
  hint.className = "hint ltxv-audio-hint";
  hint.style.cssText = "font-size:10px;margin-top:6px;";
  hint.innerHTML = "LTX-2.5 genera audio nativo: describe el ambiente sonoro en positivo (olas, viento, cristales, música de bar). Frases tipo \u00abno dialogue is spoken\u00bb <b>promueven</b> el murmullo (labios en movimiento); los t\u00e9rminos de di\u00e1logo van en el negativo (ya incluidos). En i2v, \u00abFidelidad\u00bb es el anclaje a la imagen: b\u00e1jala (0.4\u20130.7) para darle protagonismo a las acciones del prompt (besar, caminar\u2026).";
  panel.appendChild(hint);
})();

initPostFxListeners();

// --- FIRST PASS SIGMAS ---
// Curva base oficial 8-step de la receta distill LTX-2.5:
// 1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0
const BASE_FIRST_SIGMAS = [1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0];
function lerp(a, b, t){ return a + (b - a) * t; }
function buildFirstPassSigmas(steps){
  // `steps` = pasos reales del sampler; ManualSigmas necesita steps+1 entradas
  // (la última siempre 0). Con steps=8 reproduce la curva oficial exacta.
  steps = Math.max(4, Math.min(12, steps));
  const positions = steps + 1;
  const out = [];
  const maxIdx = BASE_FIRST_SIGMAS.length - 1;
  for(let i = 0; i < positions; i++){
    const rawPos = (i / (positions - 1)) * maxIdx;
    const idx = Math.floor(rawPos);
    const t = rawPos - idx;
    const a = BASE_FIRST_SIGMAS[idx];
    const b = BASE_FIRST_SIGMAS[Math.min(idx + 1, maxIdx)];
    let s = (t === 0) ? a : lerp(a, b, t);
    if(i === positions - 1) s = 0;
    out.push(s);
  }
  return out.map(s => s.toFixed(6).replace(/\.?0+$/,"")).join(", ");
}

// --- EVOLVE / TRANSMUTAR PROMPT ---
// EVOLVE_VOCAB, EVOLVE_SYNONYMS y generateEvolved() están en common.js.

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

// --- DRAG HACIA FUERA (LTXV) ---
// Vídeos de los slots 1 y 2: arrastrables hacia Krea2, otra pestaña, o el escritorio.
makeDragSource($("video1"), () => currentMedia[1] || null);
makeDragSource($("video2"), () => currentMedia[2] || null);

// Imagen de entrada: arrastrable hacia Krea2 (ref) u otra pestaña.
// Si es un File local, usamos DownloadURL con el dataURL; si vino del backend,
// usamos la URL del servidor.
// Nota: #inputImg tiene pointer-events:none (para que el zoom/pan funcione en
// el wrap), así que escuchamos dragstart en #inputWrap que sí recibe eventos.
$("inputWrap")?.addEventListener("dragstart", (e) => {
  if(!localFile){ e.preventDefault(); return; }
  const url = $("inputImg").src;
  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData("text/uri-list", url);
  e.dataTransfer.setData("text/plain", url);
  // Si es dataURL, el DownloadURL no funciona bien; en ese caso pasamos el File
  // directamente vía DataTransferItem (cuando el navegador lo permite).
  const isVideo = /\.(mp4|webm|mov|mkv|avi)$/i.test(localFile.name);
  const mime = isVideo ? "video/mp4" : (localFile.type || "image/png");
  if(!url.startsWith("data:")){
    e.dataTransfer.setData("DownloadURL", `${mime}:${localFile.name}:${url}`);
  }
  // MIME custom para drag entre UIs (Krea2 lo lee y hace fetch si no es dataURL).
  e.dataTransfer.setData(LTXV_MEDIA_MIME, JSON.stringify({
    filename: localFile.name,
    subfolder: "",
    type: "input",
    _dataUrl: url.startsWith("data:") ? url : undefined,
  }));
});

// Dropzone de LTXV: aceptar drag desde Krea2 (imagen final o ref) o desde el
// historial de Krea2. Si no hay archivos del OS, descargamos la URL arrastrada.
enableInterUIDrop($("dropzone"), (file, filename) => handleFile(file, true));
enableInterUIDrop($("inputWrap"), (file, filename) => handleFile(file, true));