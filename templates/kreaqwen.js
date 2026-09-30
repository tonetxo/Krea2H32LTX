// kreaqwen.js — KreaQwen-specific JavaScript (Krea2 + Qwen 2.1 Refiner bidireccional, Upscale y Spectrum).
// Injected AFTER common.js. CONFIG must be defined before initCommon().

const QWEN_TEXT_SYS = `# Image Prompt Rewriting Expert

You turn a user's image request into one long English paragraph that describes the
finished image as if you were looking at it, plus the aspect ratio it should be
rendered at. You are not talking to the user and not talking to a renderer: you are
an observer reporting what is in the frame.

Work through the eight steps below in order. Each step commits one decision; later
steps never revise an earlier one.

## Step 1 — Read the brief and split it in two
Fixed, and it must survive into your description unchanged: every string of text
they want shown, every named object, every count, every stated colour, every stated
position, and the aspect ratio if they gave one. Copy their text strings character
for character, in their own script, including punctuation and spacing.
Obey instructions silently where they apply and never echo them. Open: invent the frame.

## Step 2 — Fix the frame
Decide the orientation from the subject, then pick the ratio.
If the user states a ratio, use it. Otherwise: 3:2 for horizontal, 2:3 for vertical,
1:1 for square badge/icon, 16:9 for wide cinematic, 9:16 for phone screen.
The ratio lives only in the wh_ratio field. Never write ratio or resolution in the description.

## Step 3 — Write the opening sentence
One sentence (~20 words): orientation, style, medium, subject, background palette.
The style word goes here: realistic, photorealistic, minimalist, flat-vector, cinematic, etc.

## Step 4 — Inventory before you write
8 to 14 positional phrases reaching corners, edges and center. Every legible text in reading order.

## Step 5 — Walk the frame
Background and surface first, top band, body across regions, bottom band. If single subject: background falloff, pose, face, attire, held objects, edges. 1/3 of sentences open with positional phrase. One cohesive paragraph.

## Step 6 — Set every piece of text
Put exact text in double quotes in native script. Weight, colour, relative size. If blurred, call it indistinct.

## Step 7 — Give the lighting its own sentence
Source, direction, quality, shadows, specular highlights.

## Step 8 — Close with the whole frame
End on a single sentence: "The overall composition ..." covering balance, palette, mood.

## Throughout
Size: ~20 sentences, 400-500 words. Observational, present tense, third person. No boosters ("8K", "masterpiece"). Realistic observational hedges ("appears to be", "likely").

## Language
Always English except text shown inside the image.

## Output format
Return one strictly valid JSON object on a single line, nothing before or after:
{"rewritten_prompt": "<the description>", "wh_ratio": "<e.g. 3:2>"}`;

const QWEN_VISION_SYS = `# Vision-to-Prompt Reverse Engineering Expert

You are a Vision-Language Model (VLM) tasked with inspecting an input image and translating it into an exhaustive, highly structured English description optimized for the Qwen 2.1 text-to-image pipeline, accompanied by its calculated aspect ratio.

You do not talk to the user, interpret abstract intent, or give instructions. You are an objective, sharp-eyed observer reporting the exact layout, visible contents, typography, materials, and lighting of the frame.

Work through the steps below in order.

## Step 1 — Inspect the Input Image and Derive Aspect Ratio
Measure or calculate the visual aspect ratio. Match closest: 3:2, 2:3, 1:1, 16:9, 9:16, 4:3, 3:4, 21:9. Store solely in wh_ratio.

## Step 2 — Craft the Opening Sentence
One sentence (~20 words): orientation, style, medium, subject, background palette.

## Step 3 — Structural Spatial Breakdown
Scan frame edge to edge with 8 to 14 distinct positional anchors. Background first, top band, mid-ground, bottom band.

## Step 4 — Transcribe Typography & Legible Text
Exact string in double quotes in original script. Font weight, color, size. If unreadable, call it indistinct or blurred.

## Step 5 — Detail Lighting & Atmosphere
Dedicated sentence for source, direction, quality, shadows and reflections.

## Step 6 — Closing Synthesis
Single concluding sentence: "The overall composition [is / uses / feels] ..."

## Output Format
Return strictly valid JSON on a single line, with no Markdown wrapper, no thoughts, and no text before or after:
{"rewritten_prompt": "<the single-paragraph description>", "wh_ratio": "<e.g. 3:2>"}`;

const CONFIG = {
  PROMPTS_KEY: 'kreaqwen_prompts',
  LORA_STATE_KEY: 'kreaqwen_loras_state',
  ENHANCER_SYSKEY: 'kreaqwen_enhancer_sysprompts',
  SERVERURL_KEY: 'kreaqwen_serverUrl',
  DEFAULT_BACKEND_PORT: "7821",
  UI_TYPE: "kreaqwen",
  N: {
    UNET_BASE: "4",
    ATTN_BASE: "102",
    CLIP_BASE: "100",
    POS_BASE: "6",
    NEG_BASE: "7",
    LATENT_BASE: "5",
    SAMPLER_BASE: "10",
    VAE_BASE: "101",
    DECODE_BASE: "8",
    PREVIEW_BASE: "50",
    UPSCALE_LOADER: "27",
    UPSCALE_MODEL: "28",
    IMAGE_SCALE: "26",
    VAE_REFINER: "106",
    ENCODE_REFINER: "25",
    UNET_REFINER: "20",
    ATTN_REFINER: "107",
    CLIP_REFINER: "105",
    POS_REFINER: "109",
    NEG_REFINER: "110",
    SAMPLER_REFINER: "23",
    DECODE_REFINER: "24",
    SAVE_IMAGE: "9"
  },
  ENHANCER_DEFAULT_PROMPTS: {
    text: {
      A: { name: "Qwen 2.1 Oficial (Rewriter JSON)", prompt: QWEN_TEXT_SYS },
      B: { name: "Krea2 Fotorrealista", prompt: "You are an expert in prompts for Krea2/Flux2 image generation. Transform the user's idea into a detailed photorealistic prompt. Include: subject, lighting, colors, texture, composition, and atmosphere. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt, no explanations or prefaces." },
      C: { name: "Krea2 Artístico / Cinematográfico", prompt: "You are a creative assistant specialized in artistic image prompts. Take the user's idea and turn it into an evocative, artistic prompt. Use descriptive, poetic language. Focus on style, mood, and visual impact. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
    },
    vision: {
      A: { name: "Qwen 2.1 VLM Oficial (Reverse Eng JSON)", prompt: QWEN_VISION_SYS },
      B: { name: "Krea2 Visión Descriptiva", prompt: "You are an expert at describing images for image generation. Analyze the provided image and generate a detailed prompt describing: composition, subjects, background, lighting, colors, and style. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
      C: { name: "Krea2 Visión Estilizada", prompt: "You are a digital artist. Look at the image and turn it into a stylized artistic description. Focus on the artistic style, color palette, and emotional impact. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
    },
  },
};

const N = CONFIG.N;
initCommon();

let currentBaseMedia = null;
let currentFinalMedia = null;
let currentViewMode = "final"; // "final" or "base"
let jobQueue = [];
let activeJob = null;
let jobCounter = 0;

// Helper ratio match
const RATIO_MAP = {
  "1:1": "1:1 (Square)",
  "2:3": "2:3 (Portrait Photo)",
  "3:2": "3:2 (Photo)",
  "3:4": "3:4 (Portrait Standard)",
  "4:3": "4:3 (Standard)",
  "9:16": "9:16 (Portrait Widescreen)",
  "16:9": "16:9 (Widescreen)",
  "21:9": "21:9 (Ultrawide)"
};

// Sincronización de dimensiones Base y Upscale
function calculateDimensions(megapixels, aspectRatioStr){
  let wRatio = 16, hRatio = 9;
  if(aspectRatioStr.includes("1:1")) { wRatio = 1; hRatio = 1; }
  else if(aspectRatioStr.includes("2:3")) { wRatio = 2; hRatio = 3; }
  else if(aspectRatioStr.includes("3:2")) { wRatio = 3; hRatio = 2; }
  else if(aspectRatioStr.includes("3:4")) { wRatio = 3; hRatio = 4; }
  else if(aspectRatioStr.includes("4:3")) { wRatio = 4; hRatio = 3; }
  else if(aspectRatioStr.includes("9:16")) { wRatio = 9; hRatio = 16; }
  else if(aspectRatioStr.includes("16:9")) { wRatio = 16; hRatio = 9; }
  else if(aspectRatioStr.includes("21:9")) { wRatio = 21; hRatio = 9; }

  const targetPixels = megapixels * 1024 * 1024;
  const scale = Math.sqrt(targetPixels / (wRatio * hRatio));
  let w = Math.round((wRatio * scale) / 16) * 16;
  let h = Math.round((hRatio * scale) / 16) * 16;
  return { w: Math.max(256, w), h: Math.max(256, h) };
}

function updateDimensionHints(){
  const mp = parseFloat($("mpSlider")?.value || "1.0");
  const ar = $("aspectRatio")?.value || "16:9 (Widescreen)";
  const factor = parseFloat($("upscaleFactor")?.value || "1.5");
  const baseDim = calculateDimensions(mp, ar);
  const upW = Math.round((baseDim.w * factor) / 8) * 8;
  const upH = Math.round((baseDim.h * factor) / 8) * 8;

  if($("resHint")) $("resHint").textContent = `Dimensiones base estimadas: ${baseDim.w} x ${baseDim.h} px`;
  if($("targetResHint")) $("targetResHint").textContent = `Resolución tras upscale (${factor.toFixed(2)}x): ~${upW} x ${upH} px`;
}

// Poblar selectores de modelos
function populateModelSelects(){
  const unets = typeof AVAILABLE_UNETS !== "undefined" ? AVAILABLE_UNETS : [];
  const clips = typeof AVAILABLE_CLIPS !== "undefined" ? AVAILABLE_CLIPS : [];
  const vaes = typeof AVAILABLE_VAES !== "undefined" ? AVAILABLE_VAES : [];
  const upscales = typeof AVAILABLE_UPSCALE_MODELS !== "undefined" ? AVAILABLE_UPSCALE_MODELS : [];

  function fill(elId, list, fallbackKeyword){
    const sel = $(elId);
    if(!sel) return;
    sel.innerHTML = "";
    list.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      sel.appendChild(opt);
    });
    if(fallbackKeyword){
      for(const opt of sel.options){
        if(opt.value.toLowerCase().includes(fallbackKeyword.toLowerCase())){
          opt.selected = true; break;
        }
      }
    }
  }

  fill("baseUnetSelect", unets, "habanero");
  fill("refinerUnetSelect", unets, "qwen");
  fill("baseClipSelect", clips, "qwen3vl_4b");
  fill("refinerClipSelect", clips, "qwen3vl_8b");
  fill("baseVaeSelect", vaes, "qwen_image_vae");
  fill("refinerVaeSelect", vaes, "qwen_image_2.1_vae");
  fill("upscaleModelSelect", upscales, "4xpurephoto");
}

// Gestión del modo de combinación
function applyComboMode(mode){
  const selBaseU = $("baseUnetSelect");
  const selRefU = $("refinerUnetSelect");
  const selBaseC = $("baseClipSelect");
  const selRefC = $("refinerClipSelect");
  const selBaseV = $("baseVaeSelect");
  const selRefV = $("refinerVaeSelect");
  const hint = $("comboHint");
  const refWrap = $("refinerControls")?.closest(".panel");

  function selectByKw(sel, kw){
    if(!sel) return;
    for(const opt of sel.options){
      if(opt.value.toLowerCase().includes(kw.toLowerCase())){
        opt.selected = true; break;
      }
    }
  }

  if(mode === "krea_qwen"){
    selectByKw(selBaseU, "flux2");
    selectByKw(selBaseC, "qwen3vl_4b");
    selectByKw(selBaseV, "wan");
    selectByKw(selRefU, "qwen");
    selectByKw(selRefC, "qwen3vl_8b");
    selectByKw(selRefV, "qwen_image_2.1_vae");
    if(hint) hint.textContent = "Krea2 compone la escena con estética fotográfica cinematográfica; Qwen 2.1 refina microtexturas y nitidez tras el reescalado.";
    if($("refinerEnabled")) $("refinerEnabled").checked = true;
    if(refWrap) refWrap.style.opacity = "1";
  } else if(mode === "qwen_krea"){
    selectByKw(selBaseU, "qwen");
    selectByKw(selBaseC, "qwen3vl_8b");
    selectByKw(selBaseV, "qwen_image_2.1_vae");
    selectByKw(selRefU, "flux2");
    selectByKw(selRefC, "qwen3vl_4b");
    selectByKw(selRefV, "wan");
    if(hint) hint.textContent = "Qwen 2.1 genera la composición con adherencia profunda al prompt; Krea2 aporta riqueza tonal y grano en la pasada de refinamiento.";
    if($("refinerEnabled")) $("refinerEnabled").checked = true;
    if(refWrap) refWrap.style.opacity = "1";
  } else if(mode === "krea_krea"){
    selectByKw(selBaseU, "flux2");
    selectByKw(selBaseC, "qwen3vl_4b");
    selectByKw(selBaseV, "wan");
    selectByKw(selRefU, "flux2");
    selectByKw(selRefC, "qwen3vl_4b");
    selectByKw(selRefV, "wan");
    if(hint) hint.textContent = "Pipeline homogéneo Krea2: generación inicial y refinado en superresolución dentro del modelo Flux2.";
    if($("refinerEnabled")) $("refinerEnabled").checked = true;
    if(refWrap) refWrap.style.opacity = "1";
  } else if(mode === "qwen_qwen"){
    selectByKw(selBaseU, "qwen");
    selectByKw(selBaseC, "qwen3vl_8b");
    selectByKw(selBaseV, "qwen_image_2.1_vae");
    selectByKw(selRefU, "qwen");
    selectByKw(selRefC, "qwen3vl_8b");
    selectByKw(selRefV, "qwen_image_2.1_vae");
    if(hint) hint.textContent = "Pipeline homogéneo Qwen 2.1: renderizado y refinado con máxima nitidez textual y detalle anatómico.";
    if($("refinerEnabled")) $("refinerEnabled").checked = true;
    if(refWrap) refWrap.style.opacity = "1";
  } else if(mode === "base_only"){
    if($("refinerEnabled")) $("refinerEnabled").checked = false;
    if($("upscaleEnabled")) $("upscaleEnabled").checked = false;
    if(hint) hint.textContent = "Generación directa de una sola pasada sin escalado ni refiner.";
    if(refWrap) refWrap.style.opacity = "0.6";
  }
}

// Invertir orden Base y Refiner
function invertOrder(){
  const modeSel = $("comboMode");
  const curMode = modeSel?.value || "krea_qwen";
  if(curMode === "krea_qwen"){
    modeSel.value = "qwen_krea";
    applyComboMode("qwen_krea");
  } else if(curMode === "qwen_krea"){
    modeSel.value = "krea_qwen";
    applyComboMode("krea_qwen");
  } else {
    // Intercambiar selectores manualmente
    const swap = (id1, id2) => {
      const el1 = $(id1), el2 = $(id2);
      if(el1 && el2){ const tmp = el1.value; el1.value = el2.value; el2.value = tmp; }
    };
    swap("baseUnetSelect", "refinerUnetSelect");
    swap("baseClipSelect", "refinerClipSelect");
    swap("baseVaeSelect", "refinerVaeSelect");
  }
  log("⇄ Orden de modelos invertido.", "l-ok");
}

// Cálculo preciso de aspect ratio y dimensiones de imagen
function getAspectRatioString(w, h){
  if(!w || !h) return "";
  const r = w / h;
  const known = [
    { ratio: 1.0, label: "1:1" },
    { ratio: 16 / 9, label: "16:9" },
    { ratio: 9 / 16, label: "9:16" },
    { ratio: 3 / 2, label: "3:2" },
    { ratio: 2 / 3, label: "2:3" },
    { ratio: 4 / 3, label: "4:3" },
    { ratio: 3 / 4, label: "3:4" },
    { ratio: 21 / 9, label: "21:9" },
    { ratio: 9 / 21, label: "9:21" }
  ];
  for(const k of known){
    if(Math.abs(r - k.ratio) < 0.08) return k.label;
  }
  function gcd(a, b){ return b ? gcd(b, a % b) : a; }
  const d = gcd(w, h) || 1;
  const rw = Math.round(w / d);
  const rh = Math.round(h / d);
  return (rw < 100 && rh < 100) ? `${rw}:${rh}` : `${r.toFixed(2)}:1`;
}

function updateViewerDimensions(){
  const imgEl = $("outputImg");
  const infoEl = $("imgInfo");
  const badgeEl = $("imgDimBadge");
  if(!imgEl || !imgEl.naturalWidth || !imgEl.naturalHeight){
    if(badgeEl) badgeEl.style.display = "none";
    return;
  }
  const w = imgEl.naturalWidth;
  const h = imgEl.naturalHeight;
  const ratioStr = getAspectRatioString(w, h);
  const textFull = `${w}×${h} · ${ratioStr}`;
  if(infoEl) infoEl.textContent = textFull;
  if(badgeEl){
    badgeEl.textContent = `${w}×${h} (${ratioStr})`;
    badgeEl.style.display = "block";
  }
}

// Visor dual (Final vs Base)
function showImageView(mode){
  currentViewMode = mode;
  const tabFinal = $("tabViewFinal"), tabBase = $("tabViewBase");
  const imgEl = $("outputImg"), titleEl = $("lblViewerTitle"), dl = $("dl1");
  const mediaObj = (mode === "final") ? currentFinalMedia : currentBaseMedia;

  if(mode === "final"){
    tabFinal?.classList.add("active");
    tabBase?.classList.remove("active");
    if(titleEl) titleEl.innerHTML = 'Imagen <em style="color:var(--accent)">final refinada</em>';
  } else {
    tabBase?.classList.add("active");
    tabFinal?.classList.remove("active");
    if(titleEl) titleEl.innerHTML = 'Imagen <em style="color:var(--accent)">base borrador</em>';
  }

  if(mediaObj && mediaObj.url){
    imgEl.src = mediaObj.url;
    imgEl.style.display = "block";
    if($("empty1")) $("empty1").style.display = "none";
    if(dl){
      dl.href = mediaObj.url;
      dl.download = `kreaqwen_${mode}_${mediaObj.media?.filename || 'imagen.png'}`;
      dl.style.display = "inline";
    }
    imgEl.onload = () => {
      updateViewerDimensions();
      if(window.outputZoom) window.outputZoom.resetZoom();
    };
    if(imgEl.complete && imgEl.naturalWidth){
      updateViewerDimensions();
      if(window.outputZoom) window.outputZoom.resetZoom();
    }
  } else {
    imgEl.style.display = "none";
    if($("empty1")) $("empty1").style.display = "flex";
    if(dl) dl.style.display = "none";
    if($("imgDimBadge")) $("imgDimBadge").style.display = "none";
    if($("imgInfo")) $("imgInfo").textContent = "";
  }
}

// Interceptor de respuesta de Enhancer con parser JSON inteligente
const origSetEnhancerOutput = window.setEnhancerOutput || null;
function handleEnhancerResult(rawText){
  if(!rawText) return;
  let textToApply = rawText.trim();
  let ratioToApply = null;

  // Intentar parsear JSON estricto o regex de bloque JSON
  try {
    const jsonMatch = textToApply.match(/\{[\s\S]*"rewritten_prompt"[\s\S]*\}/);
    if(jsonMatch){
      const parsed = JSON.parse(jsonMatch[0]);
      if(parsed.rewritten_prompt) textToApply = parsed.rewritten_prompt.trim();
      if(parsed.wh_ratio) ratioToApply = parsed.wh_ratio.trim();
    }
  } catch(e){
    console.debug("Enhancer output no es JSON estricto, usando texto directo:", e);
  }

  // Aplicar prompt
  if($("prompt")) $("prompt").value = textToApply;
  if($("enhancerOutput")) $("enhancerOutput").value = textToApply;

  // Si devuelve wh_ratio, auto-seleccionar ratio
  if(ratioToApply && RATIO_MAP[ratioToApply]){
    const targetOpt = RATIO_MAP[ratioToApply];
    if($("aspectRatio")){
      $("aspectRatio").value = targetOpt;
      updateDimensionHints();
      log(`🎯 Relación de aspecto auto-ajustada por Qwen a ${ratioToApply}`, "l-ok");
    }
  }
}

// Sustituir o hookear el botón de aceptar enhancer
$("btnEnhanceUse")?.addEventListener("click", () => {
  const out = $("enhancerOutput")?.value;
  if(out) handleEnhancerResult(out);
});

// Gestión de LoRAs (4 por modelo)
let baseLoras = [
  { lora: "", strength: 1.0, on: false },
  { lora: "", strength: 1.0, on: false },
  { lora: "", strength: 1.0, on: false },
  { lora: "", strength: 1.0, on: false }
];

let refinerLoras = [
  { lora: "", strength: 1.0, on: false },
  { lora: "", strength: 1.0, on: false },
  { lora: "", strength: 1.0, on: false },
  { lora: "", strength: 1.0, on: false }
];

function loadLoraStates(){
  try {
    const b = localStorage.getItem("kreaqwen_base_loras");
    if(b) baseLoras = JSON.parse(b);
  } catch(e){}
  try {
    const r = localStorage.getItem("kreaqwen_refiner_loras");
    if(r) refinerLoras = JSON.parse(r);
  } catch(e){}
}

function saveLoraStates(){
  try {
    localStorage.setItem("kreaqwen_base_loras", JSON.stringify(baseLoras));
    localStorage.setItem("kreaqwen_refiner_loras", JSON.stringify(refinerLoras));
  } catch(e){}
}

function renderLoraGroup(containerId, list, labelPrefix, onChange){
  const wrap = $(containerId);
  if(!wrap) return;
  wrap.innerHTML = "";
  const loraOptions = (typeof AVAILABLE_LORAS !== "undefined" && Array.isArray(AVAILABLE_LORAS)) ? AVAILABLE_LORAS : [];

  list.forEach((l, i) => {
    const box = document.createElement("div");
    box.className = "lora" + (l.on ? "" : " off");
    box.style.marginBottom = "8px";

    let opts = '<option value="">-- Ninguno --</option>';
    loraOptions.forEach(path => {
      const selected = (path === l.lora) ? 'selected' : '';
      const displayName = path.split('/').pop();
      opts += `<option value="${path}" ${selected} title="${path}">${displayName}</option>`;
    });

    box.innerHTML = `
      <div class="lora-top">
        <div class="switch ${l.on ? 'on' : ''}" data-idx="${i}"><i></i></div>
        <div class="lname">${labelPrefix} ${i + 1}</div>
      </div>
      <div class="row" style="margin-bottom:6px;">
        <select data-field="lora" data-idx="${i}">${opts}</select>
      </div>
      <div class="slider-row">
        <input type="range" min="-2" max="2" step="0.05" value="${l.strength}" data-field="strength" data-idx="${i}">
        <div class="slider-val" data-val="${i}">${Number(l.strength).toFixed(2)}</div>
      </div>
    `;
    wrap.appendChild(box);
  });

  wrap.querySelectorAll(".switch").forEach(sw => sw.addEventListener("click", () => {
    const idx = +sw.dataset.idx;
    list[idx].on = !list[idx].on;
    renderLoraGroup(containerId, list, labelPrefix, onChange);
    onChange();
  }));

  wrap.querySelectorAll('select[data-field="lora"]').forEach(sel => sel.addEventListener("change", () => {
    const idx = +sel.dataset.idx;
    list[idx].lora = sel.value;
    onChange();
  }));

  wrap.querySelectorAll('input[data-field="strength"]').forEach(inp => inp.addEventListener("input", () => {
    const idx = +inp.dataset.idx;
    list[idx].strength = parseFloat(inp.value);
    const valEl = wrap.querySelector(`[data-val="${idx}"]`);
    if(valEl) valEl.textContent = list[idx].strength.toFixed(2);
    onChange();
  }));
}

// Snapshot de Job
function snapshotJob(isBaseOnly = false){
  const mp = parseFloat($("mpSlider")?.value || "1.0");
  const ar = $("aspectRatio")?.value || "16:9 (Widescreen)";
  const factor = parseFloat($("upscaleFactor")?.value || "1.5");
  const baseDim = calculateDimensions(mp, ar);
  const upW = Math.round((baseDim.w * factor) / 8) * 8;
  const upH = Math.round((baseDim.h * factor) / 8) * 8;

  return {
    id: ++jobCounter,
    prompt: $("prompt")?.value || "",
    negPrompt: $("negPrompt")?.value || "",
    comboMode: isBaseOnly ? "base_only" : ($("comboMode")?.value || "krea_qwen"),
    baseUnet: $("baseUnetSelect")?.value,
    baseClip: $("baseClipSelect")?.value,
    baseVae: $("baseVaeSelect")?.value,
    baseAttn: $("baseAttentionBackend")?.value || "comfy kitchen attention",
    baseSteps: parseInt($("baseSteps")?.value || "8", 10),
    baseCfg: parseFloat($("baseCfg")?.value || "1.0"),
    baseSampler: $("baseSamplerName")?.value || "euler",
    baseScheduler: $("baseSchedulerName")?.value || "simple",
    seedMode: $("segSamplerRandom")?.classList.contains("on") ? "random" : "fixed",
    seedValue: parseInt($("samplerSeed")?.value || "1062442950133633", 10),
    baseW: baseDim.w,
    baseH: baseDim.h,
    baseLoras: JSON.parse(JSON.stringify(baseLoras)),
    variancePreset: $("variancePreset")?.value || "❌ Disabled",
    protectMode: $("protectMode")?.value || "Last Half",
    varianceSeedMode: $("segVarianceRandom")?.classList.contains("on") ? "random" : "fixed",
    varianceSeedValue: parseInt($("varianceSeed")?.value || "315489554057974", 10),
    upscaleEnabled: isBaseOnly ? false : $("upscaleEnabled")?.checked,
    upscaleModel: $("upscaleModelSelect")?.value || "4xPurePhoto-Span.pth",
    targetW: upW,
    targetH: upH,
    refinerEnabled: isBaseOnly ? false : $("refinerEnabled")?.checked,
    refinerUnet: $("refinerUnetSelect")?.value,
    refinerClip: $("refinerClipSelect")?.value,
    refinerVae: $("refinerVaeSelect")?.value,
    refinerAttn: $("refinerAttentionBackend")?.value || "comfy kitchen attention",
    refinerDenoise: parseFloat($("refinerDenoise")?.value || "0.35"),
    refinerSteps: parseInt($("refinerSteps")?.value || "6", 10),
    refinerCfg: parseFloat($("refinerCfg")?.value || "1.0"),
    refinerSampler: $("refinerSamplerName")?.value || "euler",
    refinerScheduler: $("refinerSchedulerName")?.value || "simple",
    refinerLoras: JSON.parse(JSON.stringify(refinerLoras)),
    spectrumEnabled: $("spectrumEnabled")?.checked,
    spectrumW: parseFloat($("spectrumW")?.value || "0.3"),
    spectrumLam: parseFloat($("spectrumLam")?.value || "0.1"),
    keepModelInRam: $("keepModelInRam")?.checked,
    batchSize: parseInt($("batchSize")?.value || "1", 10),
    filenamePrefix: $("filenamePrefix")?.value || "kreaqwen/imagen",
    createdAt: Date.now()
  };
}

// Construcción del grafo dinámico nativo ComfyUI
function buildGraph(job){
  const j = job || activeJob || snapshotJob();
  const g = JSON.parse(JSON.stringify(BASE_GRAPH));

  // Detección estricta de arquitectura por el modelo UNET (difusión).
  // ComfyUI exige que el tipo de CLIPLoader ('krea2' vs 'qwen_image') coincida exactamente
  // con la arquitectura del UNET receptor:
  // - Krea2 / Flux2 requiere type: 'krea2' (12 capas Qwen3-VL, 30720 features).
  // - QwenImage requiere type: 'qwen_image' (2560 features).
  // NO debe verificarse el nombre del CLIP, ya que ambos usan encoders qwen3vl.
  const unetBaseLower = (j.baseUnet || "").toLowerCase();
  const isQwenBase = unetBaseLower.includes("qwen");
  const isKreaBase = !isQwenBase;

  const unetRefLower = (j.refinerUnet || "").toLowerCase();
  const isQwenRefiner = unetRefLower.includes("qwen");
  const isKreaRefiner = !isQwenRefiner;

  // --- ETAPA 1 (BASE) ---
  g[N.UNET_BASE].inputs.unet_name = j.baseUnet;

  let curBaseModel = [N.UNET_BASE, 0];
  if(j.baseAttn && j.baseAttn !== "none"){
    g[N.ATTN_BASE].inputs.attention = j.baseAttn;
    g[N.ATTN_BASE].inputs.model = curBaseModel;
    curBaseModel = [N.ATTN_BASE, 0];
  } else {
    delete g[N.ATTN_BASE];
  }

  // Encadenar LoRAs Base (hasta 4)
  if(Array.isArray(j.baseLoras)){
    j.baseLoras.forEach((l, i) => {
      if(l.on && l.lora){
        const loraNodeId = `base_lora_${i + 1}`;
        g[loraNodeId] = {
          class_type: "LoraLoaderModelOnly",
          inputs: {
            lora_name: l.lora,
            strength_model: l.strength,
            model: curBaseModel
          },
          _meta: { title: `LoRA Base ${i + 1}` }
        };
        curBaseModel = [loraNodeId, 0];
      }
    });
  }

  // Spectrum Base (exclusivo para Qwen)
  if(isQwenBase && j.spectrumEnabled){
    g["swarm_spectrum_base"] = {
      class_type: "SwarmSpectrum",
      inputs: {
        w: j.spectrumW,
        m: 3,
        lam: j.spectrumLam,
        window_size: 2,
        flex_window: 0.25,
        warmup_steps: Math.min(6, j.baseSteps),
        stop_caching_step: -1,
        steps: j.baseSteps,
        calibrated: false,
        calibration_strength: 0.5,
        model: curBaseModel
      },
      _meta: { title: "SwarmSpectrum (Base Qwen)" }
    };
    curBaseModel = ["swarm_spectrum_base", 0];
  }

  g[N.SAMPLER_BASE].inputs.model = curBaseModel;

  // CLIP Base
  g[N.CLIP_BASE].inputs.clip_name = j.baseClip;
  g[N.CLIP_BASE].inputs.type = isQwenBase ? "qwen_image" : "krea2";

  g[N.POS_BASE].inputs.text = (j.prompt || "").trim();
  g[N.NEG_BASE].inputs.text = (j.negPrompt || "").trim();

  // RBG Smart Seed Variance Base (solo si la etapa contiene Krea2)
  const varianceActive = j.variancePreset && !j.variancePreset.includes("Disabled");
  if(isKreaBase && varianceActive){
    g["rbg_variance_base"] = {
      class_type: "RBG_Smart_Seed_Variance",
      inputs: {
        variance_preset: j.variancePreset,
        fine_tune_variance: 46,
        model_type: "📸 Krea2 (SingleStream)",
        fade_curve: "Instant",
        noise_injection: "Beginning Steps",
        protect_mode: j.protectMode,
        protect_regions: "",
        direction_shift: "🚫 None",
        shift_strength: 116,
        variance_schedule: "constant",
        cutoff_step: 8,
        total_steps: j.baseSteps,
        cutoff_strength: 0.1,
        seed: (j.varianceSeedMode === "random") ? -1 : j.varianceSeedValue,
        vibe_blend: 0.59,
        conditioning: [N.POS_BASE, 0]
      },
      _meta: { title: "RBG Smart Seed Variance (Base Krea2)" }
    };
    g[N.SAMPLER_BASE].inputs.positive = ["rbg_variance_base", 0];
  } else {
    g[N.SAMPLER_BASE].inputs.positive = [N.POS_BASE, 0];
  }

  g[N.LATENT_BASE].inputs.width = j.baseW;
  g[N.LATENT_BASE].inputs.height = j.baseH;

  g[N.SAMPLER_BASE].inputs.steps = j.baseSteps;
  g[N.SAMPLER_BASE].inputs.cfg = j.baseCfg;
  g[N.SAMPLER_BASE].inputs.sampler_name = j.baseSampler;
  g[N.SAMPLER_BASE].inputs.scheduler = j.baseScheduler;
  g[N.SAMPLER_BASE].inputs.seed = j.seedValue;

  g[N.VAE_BASE].inputs.vae_name = j.baseVae;

  // --- MODO SOLO BASE (BYPASS DE UPSCALE Y REFINER) ---
  if(!j.refinerEnabled || j.comboMode === "base_only"){
    delete g[N.UPSCALE_LOADER];
    delete g[N.UPSCALE_MODEL];
    delete g[N.IMAGE_SCALE];
    delete g[N.VAE_REFINER];
    delete g[N.ENCODE_REFINER];
    delete g[N.UNET_REFINER];
    delete g[N.ATTN_REFINER];
    delete g[N.CLIP_REFINER];
    delete g[N.POS_REFINER];
    delete g[N.NEG_REFINER];
    delete g[N.SAMPLER_REFINER];
    delete g[N.DECODE_REFINER];
    // Guardar imagen directamente de la base
    g[N.SAVE_IMAGE].inputs.images = [N.DECODE_BASE, 0];
    g[N.SAVE_IMAGE].inputs.filename_prefix = j.filenamePrefix;
    return g;
  }

  // --- INTER-ETAPA (UPSCALE NEURONAL) ---
  if(j.upscaleEnabled){
    g[N.UPSCALE_LOADER].inputs.model_name = j.upscaleModel;
    g[N.IMAGE_SCALE].inputs.width = j.targetW;
    g[N.IMAGE_SCALE].inputs.height = j.targetH;
  } else {
    delete g[N.UPSCALE_LOADER];
    delete g[N.UPSCALE_MODEL];
    g[N.IMAGE_SCALE].inputs.image = [N.DECODE_BASE, 0];
    g[N.IMAGE_SCALE].inputs.width = j.baseW;
    g[N.IMAGE_SCALE].inputs.height = j.baseH;
  }

  // --- ETAPA 2 (REFINER) ---
  g[N.UNET_REFINER].inputs.unet_name = j.refinerUnet;

  let curRefinerModel = [N.UNET_REFINER, 0];
  if(j.refinerAttn && j.refinerAttn !== "none"){
    g[N.ATTN_REFINER].inputs.attention = j.refinerAttn;
    g[N.ATTN_REFINER].inputs.model = curRefinerModel;
    curRefinerModel = [N.ATTN_REFINER, 0];
  } else {
    delete g[N.ATTN_REFINER];
  }

  // Encadenar LoRAs Refiner (hasta 4)
  if(Array.isArray(j.refinerLoras)){
    j.refinerLoras.forEach((l, i) => {
      if(l.on && l.lora){
        const loraNodeId = `refiner_lora_${i + 1}`;
        g[loraNodeId] = {
          class_type: "LoraLoaderModelOnly",
          inputs: {
            lora_name: l.lora,
            strength_model: l.strength,
            model: curRefinerModel
          },
          _meta: { title: `LoRA Refiner ${i + 1}` }
        };
        curRefinerModel = [loraNodeId, 0];
      }
    });
  }

  // Spectrum Refiner (exclusivo para Qwen)
  if(isQwenRefiner && j.spectrumEnabled){
    g["swarm_spectrum_refiner"] = {
      class_type: "SwarmSpectrum",
      inputs: {
        w: j.spectrumW,
        m: 3,
        lam: j.spectrumLam,
        window_size: 2,
        flex_window: 0.25,
        warmup_steps: Math.min(6, j.refinerSteps),
        stop_caching_step: -1,
        steps: j.refinerSteps,
        calibrated: false,
        calibration_strength: 0.5,
        model: curRefinerModel
      },
      _meta: { title: "SwarmSpectrum (Refiner Qwen)" }
    };
    curRefinerModel = ["swarm_spectrum_refiner", 0];
  }

  g[N.SAMPLER_REFINER].inputs.model = curRefinerModel;

  g[N.CLIP_REFINER].inputs.clip_name = j.refinerClip;
  g[N.CLIP_REFINER].inputs.type = isQwenRefiner ? "qwen_image" : "krea2";

  g[N.POS_REFINER].inputs.text = (j.prompt || "").trim();
  g[N.NEG_REFINER].inputs.text = (j.negPrompt || "").trim();

  // RBG Smart Seed Variance Refiner (solo si Krea2 está en Refiner y no en Base)
  if(!isKreaBase && isKreaRefiner && varianceActive){
    g["rbg_variance_refiner"] = {
      class_type: "RBG_Smart_Seed_Variance",
      inputs: {
        variance_preset: j.variancePreset,
        fine_tune_variance: 46,
        model_type: "📸 Krea2 (SingleStream)",
        fade_curve: "Instant",
        noise_injection: "Beginning Steps",
        protect_mode: j.protectMode,
        protect_regions: "",
        direction_shift: "🚫 None",
        shift_strength: 116,
        variance_schedule: "constant",
        cutoff_step: 4,
        total_steps: j.refinerSteps,
        cutoff_strength: 0.1,
        seed: (j.varianceSeedMode === "random") ? -1 : j.varianceSeedValue,
        vibe_blend: 0.59,
        conditioning: [N.POS_REFINER, 0]
      },
      _meta: { title: "RBG Smart Seed Variance (Refiner Krea2)" }
    };
    g[N.SAMPLER_REFINER].inputs.positive = ["rbg_variance_refiner", 0];
  } else {
    g[N.SAMPLER_REFINER].inputs.positive = [N.POS_REFINER, 0];
  }

  g[N.VAE_REFINER].inputs.vae_name = j.refinerVae;

  g[N.SAMPLER_REFINER].inputs.steps = j.refinerSteps;
  g[N.SAMPLER_REFINER].inputs.cfg = j.refinerCfg;
  g[N.SAMPLER_REFINER].inputs.sampler_name = j.refinerSampler;
  g[N.SAMPLER_REFINER].inputs.scheduler = j.refinerScheduler;
  g[N.SAMPLER_REFINER].inputs.denoise = j.refinerDenoise;
  g[N.SAMPLER_REFINER].inputs.seed = j.seedValue + 1;

  g[N.SAVE_IMAGE].inputs.filename_prefix = j.filenamePrefix;

  return g;
}

// Metadata para variantes
CONFIG.variantMeta = function(){
  const rows = [
    ["Modo", $("comboMode")?.value || ""],
    ["Base", $("baseUnetSelect")?.value || ""],
    ["Refiner", $("refinerEnabled")?.checked ? ($("refinerUnetSelect")?.value || "") : "Desactivado"],
    ["Denoise Refiner", $("refinerDenoise")?.value || ""],
    ["Upscale Model", $("upscaleEnabled")?.checked ? ($("upscaleModelSelect")?.value || "") : "Desactivado"],
    ["Factor Escala", `${$("upscaleFactor")?.value || "1.5"}x`],
    ["Pasos Base/Ref", `${$("baseSteps")?.value || "8"} / ${$("refinerSteps")?.value || "6"}`],
  ];
  if($("variancePreset") && !$("variancePreset").value.includes("Disabled")){
    rows.push(["Variance", `${$("variancePreset").value} (${$("protectMode")?.value || ""})`]);
  }
  const activeLoras = [];
  baseLoras.forEach((l, i) => {
    if(l.on && l.lora) activeLoras.push({ name: `Base: ${l.lora.split('/').pop()}`, strength: Number(l.strength).toFixed(2), on: true });
  });
  refinerLoras.forEach((l, i) => {
    if(l.on && l.lora) activeLoras.push({ name: `Ref: ${l.lora.split('/').pop()}`, strength: Number(l.strength).toFixed(2), on: true });
  });
  return { title: "Parámetros KreaQwen", rows, loras: activeLoras };
};

// Helper URL y medios
function getServerUrl(){
  return (typeof server === "function") ? server() : (CONFIG.serverUrl || "http://127.0.0.1:7821");
}

function mediaUrl(media){
  if(!media) return "";
  const srv = getServerUrl();
  return `${srv}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder||"")}&type=${encodeURIComponent(media.type||"output")}`;
}

// Captura de medios devueltos
CONFIG.findMedia = function(nodeOutput){
  for(const k of ["images", "videos", "gifs"]){
    if(nodeOutput[k]?.length) return nodeOutput[k][nodeOutput[k].length - 1];
  }
  return null;
};

let currentBatchStage = "base";

// Monitoreo de nodo en ejecución para feedback en vivo
CONFIG.onNodeExecuting = function(nodeId){
  if(nodeId === N.SAMPLER_BASE){
    currentBatchStage = "base";
    setRun("busy", "Generando etapa Base...");
  } else if(nodeId === N.UPSCALE_MODEL || nodeId === N.IMAGE_SCALE){
    currentBatchStage = "upscale";
    setRun("busy", "Reescalando imagen (Upscale)...");
  } else if(nodeId === N.SAMPLER_REFINER){
    currentBatchStage = "refiner";
    setRun("busy", "Refinando imagen (Etapa Refiner)...");
  } else if(nodeId === N.DECODE_BASE || nodeId === N.DECODE_REFINER){
    setRun("busy", "Decodificando VAE...");
  }
};

// Captura de nodos ejecutados (ej. PreviewImage de Base)
CONFIG.onNodeExecuted = function(data){
  if(!data || !data.output) return;
  if(data.node === N.PREVIEW_BASE || data.node === N.DECODE_BASE){
    const media = CONFIG.findMedia(data.output);
    if(media){
      const url = mediaUrl(media);
      currentBaseMedia = { media, url };
      if(currentViewMode === "base" || !currentFinalMedia){
        showImageView("base");
      }
    }
  }
};

// Renderizado de previews en vivo (Latent2RGB / TAESD por WebSocket)
CONFIG.onPreview = function(url, meta){
  const img = $("outputImg"), empty = $("empty1"), dl = $("dl1"), badge = $("imgDimBadge");
  if(img && empty){
    img.src = url;
    img.style.display = "block";
    empty.style.display = "none";
    if(dl) dl.style.display = "none";
    if(badge) badge.style.display = "none";
    const info = $("imgInfo");
    if(info){
      const stageName = (currentBatchStage === "refiner") ? "Refiner" : "Base";
      const stepStr = (meta && meta.step != null && meta.max_steps) ? ` (${meta.step}/${meta.max_steps})` : "";
      info.textContent = `⚡ Muestreando ${stageName}${stepStr}`;
    }
  }
};

// Limpieza de preview
CONFIG.onClearPreview = function(){
  if(!currentFinalMedia && !currentBaseMedia){
    const img = $("outputImg"), empty = $("empty1"), dl = $("dl1"), badge = $("imgDimBadge");
    if(img){ img.style.display = "none"; img.removeAttribute("src"); }
    if(empty) empty.style.display = "flex";
    if(dl) dl.style.display = "none";
    if(badge) badge.style.display = "none";
    const info = $("imgInfo");
    if(info) info.textContent = "";
  }
};

CONFIG.showMedia = function(slot, media, options){
  const url = mediaUrl(media);
  if(options?.node === N.PREVIEW_BASE || options?.node === N.DECODE_BASE){
    currentBaseMedia = { media, url };
  } else {
    currentFinalMedia = { media, url };
    showImageView("final");
  }
};

CONFIG.renderVariantMedia = function(card, url, media){
  return `<img src="${url}">`;
};

// Galería de variantes
function addToVariantGallery(media, seedValue, timeText) {
  if(!media || !media.filename) return;
  const box = $("variantGalleryBox");
  const grid = $("variantGrid");
  if(!box || !grid) return;
  box.style.display = "block";

  const meta = CONFIG.variantMeta ? CONFIG.variantMeta() : null;
  const card = buildVariantCard(grid, box, media, seedValue, timeText, null, null, "var", meta);
  const url = mediaUrl(media);

  const icons = card.querySelector(".variant-icons");
  if(icons){
    const dl = document.createElement("a");
    dl.href = url;
    dl.download = "";
    dl.style.cssText = "color:var(--accent);text-decoration:none";
    dl.textContent = "Descargar";
    dl.addEventListener("click", (e) => e.stopPropagation());
    icons.insertBefore(dl, icons.firstChild);
  }

  const hasSeed = seedValue !== null && seedValue !== undefined;
  if(hasSeed) {
    const seedSpan = card.querySelector('.variant-seed-display');
    if(seedSpan){
      seedSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        copySeedToClipboard(seedSpan, seedValue);
      });
    }
  }

  const delBtn = card.querySelector(".variant-del-btn");
  if(delBtn){
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const updateCount = (g, b) => {
        const remaining = g.querySelectorAll(".variant-card").length;
        if($("variantCount")) $("variantCount").textContent = `(${remaining})`;
        if(remaining === 0) b.style.display = "none";
      };
      deleteMediaFile(card, delBtn, {
        filename: card.dataset.filename,
        subfolder: card.dataset.subfolder,
        type: card.dataset.type,
      }, grid, box, "Variante", updateCount, updateCount);
    });
  }

  const thumbImg = card.querySelector("img");
  if(thumbImg){
    const applyDimTag = () => {
      const w = thumbImg.naturalWidth, h = thumbImg.naturalHeight;
      if(w && h){
        const ratio = getAspectRatioString(w, h);
        let tag = card.querySelector(".variant-dim-tag");
        if(!tag){
          tag = document.createElement("span");
          tag.className = "variant-dim-tag";
          const footer = card.querySelector(".variant-footer") || card.querySelector(".variant-icons") || card;
          if(footer) footer.appendChild(tag);
        }
        tag.textContent = `${w}×${h} (${ratio})`;
      }
    };
    thumbImg.onload = applyDimTag;
    if(thumbImg.complete && thumbImg.naturalWidth) applyDimTag();
  }

  card.addEventListener("click", (e) => {
    if(e.target.closest(".variant-seed-display") || e.target.closest("a") || e.target.closest(".variant-del-btn")) return;
    currentFinalMedia = { filename: card.dataset.filename, subfolder: card.dataset.subfolder, type: card.dataset.type, url };
    showImageView("final");
  });

  variantCounter++;
  if($("variantCount")) $("variantCount").textContent = `(${variantCounter})`;
}

// Callback displayResult de ComfyUI
CONFIG.displayResult = async function(entry, realSeed, tTotal, promptId){
  const timeText = tTotal || "";
  const outNodeFinal = entry.outputs[N.SAVE_IMAGE] || entry.outputs[N.DECODE_REFINER];
  const outNodeBase = entry.outputs[N.PREVIEW_BASE] || entry.outputs[N.DECODE_BASE];

  if(outNodeBase){
    const baseMedia = CONFIG.findMedia(outNodeBase);
    if(baseMedia){
      const url = mediaUrl(baseMedia);
      currentBaseMedia = { media: baseMedia, url };
    }
  }

  const outNode = outNodeFinal || outNodeBase;
  if(!outNode) return { foundOutput: false };

  const media = CONFIG.findMedia(outNode);
  if(!media) return { foundOutput: false };

  const url = mediaUrl(media);
  if(outNodeFinal){
    currentFinalMedia = { media, url };
    showImageView("final");
  } else {
    currentBaseMedia = { media, url };
    showImageView("base");
  }

  const t1 = $("time1");
  if(t1 && timeText){ t1.textContent = timeText; t1.classList.remove("live"); }
  addToVariantGallery(media, realSeed, timeText);
  return { foundOutput: true };
};

// Callbacks de ciclo de vida
CONFIG.startNextVariant = function(index){ runSingleGeneration(index); };
CONFIG.onBatchComplete = function(){
  finishCurrentJob();
  if(jobQueue.length > 0){
    const next = jobQueue.shift();
    startJob(next);
  }
};
CONFIG.onStopCurrent = function(pid){};
CONFIG.onStopAll = function(){
  for(const pid of Object.keys(pendingSeeds)) discardTimer(pid);
  pendingSeeds = {};
  handledPrompts.clear();
  processingPrompts.clear();
  currentPromptId = null;
  currentBatchIndex = totalBatchSize;
  const t1 = $("time1");
  if(t1){ t1.textContent = ""; t1.classList.remove("live"); }
  jobQueue = [];
  activeJob = null;
  updateQueueUI();
  enableStopButtons(false);
};

// Carga de imagen de referencia
function loadRefImage(url){
  const img = $("refImg"), wrap = $("refWrap"), ph = $("refPlaceholder"), dz = $("refDropzone"), info = $("refInfo");
  if(!img || !wrap) return;
  const newImg = document.createElement("img");
  newImg.id = "refImg";
  newImg.style.cssText = "display:block;max-width:100%;height:auto;user-select:none;-webkit-user-drag:none;pointer-events:none;transform-origin:center center;";
  img.parentNode.replaceChild(newImg, img);
  if(window.refZoom) window.refZoom.resetZoom();
  newImg.src = url;
  newImg.style.display = "block";
  wrap.style.visibility = "visible";
  if(ph) ph.style.display = "none";
  if(dz){
    dz.style.display = "flex";
    dz.style.padding = "4px 8px";
    dz.style.minHeight = "auto";
    const phEl = dz.querySelector(".ph");
    if(phEl) phEl.textContent = "arrastra otra imagen para reemplazar";
  }
  newImg.onload = () => {
    const w = newImg.naturalWidth, h = newImg.naturalHeight;
    if(w && h){
      function gcd(a,b){ return b ? gcd(b, a % b) : a; }
      const d = gcd(w, h) || 1;
      if(info) info.textContent = `${w}x${h} · ${w/d}:${h/d}`;
    }
  };
}

function handleRefFile(f){
  const reader = new FileReader();
  reader.onload = (e) => {
    if(typeof addToGallery === "function") addToGallery(e.target.result);
    loadRefImage(e.target.result);
  };
  reader.readAsDataURL(f);
}

// Generación individual
async function runSingleGeneration(index){
  try {
    const job = activeJob || snapshotJob();
    const seedUsed = (job.seedMode === "random") ? randomSeed() : job.seedValue;
    job.seedValue = seedUsed;
    const graph = buildGraph(job);

    const srv = getServerUrl();
    const r = await fetch(`${srv}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: graph,
        client_id: CLIENT_ID,
        extra_data: {
          extra_pnginfo: { workflow: graph, prompt: graph },
          preview_method: getPreviewMethod()
        }
      })
    });
    if(!r.ok){
      const t = await r.text().catch(() => "");
      throw new Error(`HTTP ${r.status}: ${t.slice(0, 300)}`);
    }
    const data = await r.json();
    if(data.error) throw new Error(JSON.stringify(data.error));

    pendingSeeds[data.prompt_id] = seedUsed;
    currentPromptId = data.prompt_id;
    startTimer(data.prompt_id, 1);
    pollFallback(data.prompt_id);
  } catch(err){
    log(`Error en variante ${index + 1}: ${err.message}`, "l-err");
    finishCurrentJob();
  }
}

async function startJob(job){
  activeJob = job;
  updateQueueUI();
  try {
    connectSocket();
    totalBatchSize = job.batchSize || 1;
    currentBatchIndex = 0;
    setRun("busy", `KreaQwen #${job.id} en proceso (${job.comboMode})...`);
    enableStopButtons(true);
    await runSingleGeneration(0);
  } catch(err){
    log(`Error al iniciar KreaQwen #${job.id}: ${err.message || err}`, "l-err");
    setRun("bad", "Error");
    finishCurrentJob();
  }
}

function enqueueGeneration(isBaseOnly = false){
  const job = snapshotJob(isBaseOnly);
  if(activeJob){
    jobQueue.push(job);
    updateQueueUI();
    log(`Job KreaQwen #${job.id} encolado (${jobQueue.length} pendientes).`, "l-info");
  } else {
    startJob(job);
  }
}

function updateQueueUI(){
  const count = jobQueue.length;
  if($("btnClearQueue")) $("btnClearQueue").disabled = count === 0;
  if($("queueWebuiSummary")) $("queueWebuiSummary").textContent = `${count} en espera`;
  if($("queueTotalNum")) $("queueTotalNum").textContent = `${count + (activeJob ? 1 : 0)}`;
}

function finishCurrentJob(){
  activeJob = null;
  updateQueueUI();
  enableStopButtons(false);
  setRun("idle", "en reposo");
}

// Inicialización de Listeners y Componentes
function initKreaQwenUI() {
  populateModelSelects();
  updateDimensionHints();

  // Carga y renderizado de LoRAs (Base y Refiner)
  loadLoraStates();
  renderLoraGroup("baseLoraList", baseLoras, "LoRA Base", saveLoraStates);
  renderLoraGroup("refinerLoraList", refinerLoras, "LoRA Refiner", saveLoraStates);

  // Activación de paneles desplegables (collapsible)
  if(typeof makeCollapsible === "function"){
    makeCollapsible("negPromptToggle", "negPromptBody");
    makeCollapsible("evolveToggle", "evolveBody");
    makeCollapsible("baseLorasToggle", "baseLorasBody");
    makeCollapsible("varianceToggle", "varianceBody");
    makeCollapsible("refinerLorasToggle", "refinerLorasBody");
    makeCollapsible("spectrumToggle", "spectrumBody");
    makeCollapsible("galleryToggle", "galleryBody");
  }

  window.outputZoom = setupZoomPan("imgWrap", "outputImg", "btnResetZoom", "btnFullscreenImg");
  window.refZoom = setupZoomPan("refWrap", "refImg", "btnResetZoomRef", "btnFullscreenRef");

  // Dropzone de referencia
  const dz = $("refDropzone"), input = $("refFileInput"), btn = $("btnBrowseRef"), wrap = $("refWrap");
  if(dz && input && btn){
    btn.addEventListener("click", (e) => { e.stopPropagation(); input.click(); });
    const onDragEnter = (e) => { e.preventDefault(); dz.classList.add("drag"); };
    const onDragOver = (e) => { e.preventDefault(); dz.classList.add("drag"); };
    const onDragLeave = () => { dz.classList.remove("drag"); };
    const onDrop = (e) => {
      e.preventDefault(); e.stopPropagation();
      dz.classList.remove("drag");
      const files = e.dataTransfer?.files;
      if(files && files.length > 0) handleRefFile(files[0]);
    };
    dz.addEventListener("dragenter", onDragEnter);
    dz.addEventListener("dragover", onDragOver);
    dz.addEventListener("dragleave", onDragLeave);
    dz.addEventListener("drop", onDrop);
    if(wrap){
      wrap.addEventListener("dragenter", onDragEnter);
      wrap.addEventListener("dragover", onDragOver);
      wrap.addEventListener("dragleave", onDragLeave);
      wrap.addEventListener("drop", onDrop);
    }
    input.addEventListener("change", e => { if(e.target.files[0]) handleRefFile(e.target.files[0]); });
  }

  $("comboMode")?.addEventListener("change", (e) => applyComboMode(e.target.value));
  $("btnInvertOrder")?.addEventListener("click", invertOrder);

  $("mpSlider")?.addEventListener("input", (e) => {
    if($("mpVal")) $("mpVal").textContent = parseFloat(e.target.value).toFixed(2);
    updateDimensionHints();
  });
  $("aspectRatio")?.addEventListener("change", updateDimensionHints);
  $("upscaleFactor")?.addEventListener("input", (e) => {
    if($("upscaleFactorVal")) $("upscaleFactorVal").textContent = `${parseFloat(e.target.value).toFixed(2)}x`;
    updateDimensionHints();
  });
  $("refinerDenoise")?.addEventListener("input", (e) => {
    if($("refinerDenoiseVal")) $("refinerDenoiseVal").textContent = parseFloat(e.target.value).toFixed(2);
  });
  $("spectrumW")?.addEventListener("input", (e) => {
    if($("spectrumWVal")) $("spectrumWVal").textContent = parseFloat(e.target.value).toFixed(2);
  });
  $("spectrumLam")?.addEventListener("input", (e) => {
    if($("spectrumLamVal")) $("spectrumLamVal").textContent = parseFloat(e.target.value).toFixed(2);
  });

  // Semilla de Sampler
  $("segSamplerRandom")?.addEventListener("click", () => {
    $("segSamplerRandom")?.classList.add("on");
    $("segSamplerFixed")?.classList.remove("on");
    if($("samplerSeed")) $("samplerSeed").disabled = true;
  });
  $("segSamplerFixed")?.addEventListener("click", () => {
    $("segSamplerFixed")?.classList.add("on");
    $("segSamplerRandom")?.classList.remove("on");
    if($("samplerSeed")) $("samplerSeed").disabled = false;
  });

  // Semilla de Varianza (Krea2)
  $("segVarianceRandom")?.addEventListener("click", () => {
    $("segVarianceRandom")?.classList.add("on");
    $("segVarianceFixed")?.classList.remove("on");
    if($("varianceSeed")) $("varianceSeed").disabled = true;
  });
  $("segVarianceFixed")?.addEventListener("click", () => {
    $("segVarianceFixed")?.classList.add("on");
    $("segVarianceRandom")?.classList.remove("on");
    if($("varianceSeed")) $("varianceSeed").disabled = false;
  });

  $("tabViewFinal")?.addEventListener("click", () => showImageView("final"));
  $("tabViewBase")?.addEventListener("click", () => showImageView("base"));

  $("btnGenerate")?.addEventListener("click", () => enqueueGeneration(false));
  $("btnGenerateBaseOnly")?.addEventListener("click", () => enqueueGeneration(true));

  $("btnClearNegPrompt")?.addEventListener("click", () => {
    if($("negPrompt")) $("negPrompt").value = "";
  });

  $("btnClearQueue")?.addEventListener("click", () => {
    jobQueue = [];
    updateQueueUI();
    log("Cola de trabajos vaciada.", "l-info");
  });

  $("btnFreeMemory")?.addEventListener("click", async () => {
    try {
      const srv = getServerUrl();
      await fetch(`${srv}/free`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unload_models: true, free_memory: true })
      });
      log("Memoria VRAM y modelos liberados en ComfyUI.", "l-ok");
    } catch(e){
      log("Error liberando memoria: " + e.message, "l-err");
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initKreaQwenUI);
} else {
  initKreaQwenUI();
}
