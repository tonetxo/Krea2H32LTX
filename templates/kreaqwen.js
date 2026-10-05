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
  // Clave en desuso: kreaqwen gestiona 2x4 LoRAs con sus claves propias
  // (kreaqwen_base_loras / kreaqwen_refiner_loras) y NO define CONFIG.loras,
  // por lo que loadLoraState() de common.js no aplica aquí.
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
    SAVE_IMAGE: "9",
    FACE_CROP: "301",
    FACE_ENCODE: "302",
    FACE_SAMPLER: "303",
    FACE_DECODE: "304",
    FACE_STITCH: "305"
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

// Construye el parámetro ?ref= que entienden LTXV/MiniMaxH3/MMH3X2: incluye el
// subfolder (p.ej. "kreaqwen/imagen") para que /view encuentre la imagen.
function buildRefParam(filename, subfolder){
  const sf = (subfolder || "").replace(/^\/+|\/+$/g, "");
  return encodeURIComponent((sf ? sf + "/" : "") + filename);
}
// Extrae filename+subfolder de una URL /view y devuelve el ?ref= listo.
function refFromViewSrc(src){
  if(!src) return null;
  const m = src.match(/[?&]filename=([^&]+)/);
  if(!m) return null;
  const sm = src.match(/[?&]subfolder=([^&]*)/);
  const filename = decodeURIComponent(m[1]);
  const subfolder = sm ? decodeURIComponent(sm[1]) : "";
  return { filename, subfolder, ref: buildRefParam(filename, subfolder) };
}

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

// --- CLASIFICACION DE ARQUITECTURA POR UNET ---
// Krea2 y Klein viven AMBOS bajo flux2/, asi que el directorio no distingue nada:
// hay que mirar el nombre del modelo. Verificado empiricamente contra este ComfyUI:
//   - Krea2   ("krea")  -> CLIP type 'krea2',      CLIP qwen3vl_4b, VAE 16ch (Wan21)
//   - Qwen2.1 ("qwen")  -> CLIP type 'qwen_image', CLIP qwen3vl_8b, VAE 64ch (QwenImage21)
//   - Flux2/Klein ("klein"/"flux2") -> CLIP type 'flux2', CLIP qwen3vl_8b, VAE 128ch (Flux2)
// Un CLIP con el type equivocado produce "mat1 and mat2 shapes cannot be multiplied".
function unetArchFamily(unetName){
  const u = (unetName || "").toLowerCase();
  if(u.includes("krea")) return "krea2";
  if(u.includes("qwen")) return "qwen21";
  if(u.includes("klein") || u.includes("flux2")) return "flux2";
  return "krea2";
}

// Determina la precisión óptima de carga para el UNET en este hardware (RTX 5070 Ti).
// Para modelos ya cuantizados (int8/convrot/nvfp4) se mantiene 'default' para usar sus tensores nativos.
// Para modelos FP16/BF16 (como Krea2 Habanero o Klein), 'fp8_e4m3fn_fast' ahorra un 50% de VRAM y acelera los tensor cores.
function resolveWeightDtype(selectedOption, unetName){
  if(selectedOption && selectedOption !== "auto") return selectedOption;
  const u = (unetName || "").toLowerCase();
  if(u.includes("int8") || u.includes("convrot") || u.includes("nvfp4") || u.includes("fp8")) {
    return "default";
  }
  return "fp8_e4m3fn_fast";
}

// CLIP requerido por cada arquitectura (fichero + type de CLIPLoader).
const ARCH_CLIP = {
  krea2:  { keyword: "qwen3vl_4b", type: "krea2" },
  qwen21: { keyword: "qwen3vl_8b_nvfp4_heretic", type: "qwen_image" },
  flux2:  { keyword: "qwen3vl_8b", type: "flux2" },
};

function archClipType(family){
  return (ARCH_CLIP[family] || ARCH_CLIP.krea2).type;
}
function archClipKeyword(family){
  return (ARCH_CLIP[family] || ARCH_CLIP.krea2).keyword;
}

// --- Compatibilidad VAE por ARQUITECTURA (canales latentes) ---
// ComfyUI asigna a cada UNet un "latent_format" con un numero fijo de canales, y el
// VAEDecode falla si el VAE no coincide (p.ej. "tensor a (16) must match tensor b (128)").
//   - Krea2  -> latent_format Wan21   -> 16 canales. VAE: wan_2.1_vae o qwen_image_vae.
//   - Qwen2.1 -> latent_format QwenImage21 -> 64 canales. VAE: qwen_image_2.1_vae.
//   - Flux2  -> latent_format Flux2   -> 128 canales. VAE: flux2-vae.
// OJO: el nombre del fichero engana. "QwenImage/qwen_image_vae" es 16ch (vale para Krea2),
// mientras que "QwenImage/qwen_image_2.1_vae" es 64ch (solo Qwen 2.1). No vale fiarse del
// directorio ni de la palabra "qwen"/"flux" en la ruta.
function vaeLatentFamily(vaeName){
  const v = (vaeName || "").toLowerCase();
  if(v.includes("upscale2x")) return "vaeutils";              // VAEUtils (no VAEDecode)
  if(v.includes("flux2-vae")) return "flux2";                // 128ch
  if(v.includes("qwen_image_2.1_vae") ||
     v.includes("texture_fix_vae_for_qwen_image_2.1")) return "qwen21"; // 64ch
  return "krea2";                                             // 16ch (Wan21)
}

// Alias historico: la familia de arquitectura del UNET es la misma que la del VAE.
const unetVaeFamily = unetArchFamily;

function compatibleVaes(family){
  const all = (typeof AVAILABLE_VAES !== "undefined" && Array.isArray(AVAILABLE_VAES)) ? AVAILABLE_VAES : [];
  return all.filter(v => vaeLatentFamily(v) === family);
}

function fallbackVae(family){
  const list = compatibleVaes(family);
  if(family === "qwen21"){
    return list.find(v => v.toLowerCase().includes("texture_fix_vae_for_qwen_image_2.1")) ||
           list.find(v => v.toLowerCase().includes("qwen_image_2.1_vae")) ||
           list[0] || "QwenImage/texture_fix_vae_for_qwen_image_2.1_bf16.safetensors";
  }
  if(family === "flux2"){
    return list.find(v => v.toLowerCase().includes("flux2-vae")) ||
           list[0] || "Flux/flux2-vae.safetensors";
  }
  // Krea2 (16ch): el workflow nativo KreaQwen_Native.json usa qwen_image_vae para la base Krea2.
  return list.find(v => v.toLowerCase().includes("qwen_image_vae")) ||
         list.find(v => v.toLowerCase().includes("wan_2.1_vae")) ||
         list[0] || "QwenImage/qwen_image_vae.safetensors";
}

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

function selectOrFallback(selId, list, fallbackKeyword){
  const sel = $(selId);
  if(!sel) return;
  const current = sel.value;
  fill(selId, list, fallbackKeyword);
  // Si el valor anterior sigue disponible, conservarlo; si no, usar fallback.
  let restored = false;
  for(const opt of sel.options){
    if(opt.value === current){ opt.selected = true; restored = true; break; }
  }
  if(!restored){
    for(const opt of sel.options){
      if(opt.value.toLowerCase().includes(fallbackKeyword.toLowerCase())){
        opt.selected = true; break;
      }
    }
  }
}

function updateVaeSelectors(){
  const baseFam = unetVaeFamily($("baseUnetSelect")?.value);
  const refFam = unetVaeFamily($("refinerUnetSelect")?.value);
  selectOrFallback("baseVaeSelect", compatibleVaes(baseFam), vaeShortKw(baseFam));
  selectOrFallback("refinerVaeSelect", compatibleVaes(refFam), vaeShortKw(refFam));
}

function vaeShortKw(family){
  if(family === "qwen21") return "texture_fix_vae_for_qwen_image_2.1";
  if(family === "flux2") return "flux2-vae";
  return "qwen_image_vae";
}

// Poblar selectores de modelos
function populateModelSelects(){
  const unets = typeof AVAILABLE_UNETS !== "undefined" ? AVAILABLE_UNETS : [];
  const clips = typeof AVAILABLE_CLIPS !== "undefined" ? AVAILABLE_CLIPS : [];
  const upscales = typeof AVAILABLE_UPSCALE_MODELS !== "undefined" ? AVAILABLE_UPSCALE_MODELS : [];

  fill("baseUnetSelect", unets, "habanero");
  fill("refinerUnetSelect", unets, "qwen-image-2.1-UC-NVFP4");
  fill("baseClipSelect", clips, "qwen3vl_4b");
  fill("refinerClipSelect", clips, "qwen3vl_8b_nvfp4_heretic");
  fill("upscaleModelSelect", upscales, "4xPurePhoto-Span.pth");
  updateVaeSelectors();
}

// --- Perfiles de arquitectura para ajustes automáticos ---
const ARCH_PROFILES = {
  krea: {
    steps: 8,
    cfg: 1.0,
    sampler: "euler",
    scheduler: "simple",
    refinerSteps: 6,
    refinerCfg: 1.0,
    refinerSampler: "euler",
    refinerScheduler: "simple",
    refinerDenoise: 0.35,
    clip: "qwen3vl_4b"
  },
  qwen: {
    steps: 20,
    cfg: 1.0,
    sampler: "euler",
    scheduler: "simple",
    refinerSteps: 20,
    refinerCfg: 1.0,
    refinerSampler: "euler",
    refinerScheduler: "simple",
    refinerDenoise: 0.30,
    clip: "qwen3vl_8b"
  },
  flux2: {
    steps: 8,
    cfg: 1.0,
    sampler: "euler",
    scheduler: "simple",
    refinerSteps: 6,
    refinerCfg: 1.0,
    refinerSampler: "euler",
    refinerScheduler: "simple",
    refinerDenoise: 0.35,
    clip: "qwen3vl_8b"
  }
};

// La familia de arquitectura y la clave de perfil no siempre coinciden de nombre.
function profileForFamily(family){
  if(family === "qwen21") return "qwen";
  if(family === "flux2") return "flux2";
  return "krea";
}

// Estado de "tocado por el usuario": solo se resetea a perfil si el campo aún está limpio.
const userTouched = new Set();

function markTouched(elId){ userTouched.add(elId); }
function isTouched(elId){ return userTouched.has(elId); }
function resetTouched(){ userTouched.clear(); }

function setInputValue(elId, value, { silent = false, mark = true } = {}){
  const el = $(elId);
  if(!el) return false;
  if(el.value === String(value)) return false;
  el.value = value;
  if(!silent) el.dispatchEvent(new Event("input", { bubbles: true }));
  if(mark) markTouched(elId);
  return true;
}

// Aplica un perfil SOLO a la etapa indicada (stage: "base" | "refiner" | "base_only").
// Antes aplicaba base y refiner siempre, de modo que dos llamadas seguidas (una por
// etapa) se pisaban entre si y la base terminaba con los valores del refiner.
function applyProfile(profile, stage){
  const p = ARCH_PROFILES[profile];
  if(!p) return;
  if(stage === "base" || stage === "base_only"){
    if(!isTouched("baseSteps")) setInputValue("baseSteps", p.steps, { silent: true, mark: false });
    if(!isTouched("baseCfg")) setInputValue("baseCfg", p.cfg, { silent: true, mark: false });
    if(!isTouched("baseSamplerName")) setInputValue("baseSamplerName", p.sampler, { silent: true, mark: false });
    if(!isTouched("baseSchedulerName")) setInputValue("baseSchedulerName", p.scheduler, { silent: true, mark: false });
  }
  if(stage === "refiner"){
    if(!isTouched("refinerSteps")) setInputValue("refinerSteps", p.refinerSteps, { silent: true, mark: false });
    if(!isTouched("refinerCfg")) setInputValue("refinerCfg", p.refinerCfg, { silent: true, mark: false });
    if(!isTouched("refinerSamplerName")) setInputValue("refinerSamplerName", p.refinerSampler, { silent: true, mark: false });
    if(!isTouched("refinerSchedulerName")) setInputValue("refinerSchedulerName", p.refinerScheduler, { silent: true, mark: false });
    if(!isTouched("refinerDenoise")){
      setInputValue("refinerDenoise", p.refinerDenoise, { silent: true, mark: false });
      if($("refinerDenoiseVal")) $("refinerDenoiseVal").textContent = p.refinerDenoise.toFixed(2);
    }
  }
}

// Gestión del modo de combinación
function applyComboMode(mode){
  const selBaseU = $("baseUnetSelect");
  const selRefU = $("refinerUnetSelect");
  const selBaseC = $("baseClipSelect");
  const selRefC = $("refinerClipSelect");
  const hint = $("comboHint");
  const refWrap = $("refinerControls")?.closest(".panel");

  // Selecciona en un <select> la primera opcion cuya ruta contenga la palabra dada.
  function selectByKw(sel, kw){
    if(!sel) return;
    for(const opt of sel.options){
      if(opt.value.toLowerCase().includes(kw.toLowerCase())){
        opt.selected = true; break;
      }
    }
  }
  // Selecciona un UNET por FAMILIA de arquitectura (krea2/qwen21/flux2), no por ruta:
  // Krea2 y Klein comparten el directorio flux2/ y no deben confundirse.
  // `preferKw` permite elegir el modelo de referencia de esa familia (p.ej. jibMixKrea2).
  function selectByFamily(sel, family, preferKw){
    if(!sel) return;
    let chosen = null;
    for(const opt of sel.options){
      if(unetArchFamily(opt.value) !== family) continue;
      if(!chosen) chosen = opt;
      if(preferKw && opt.value.toLowerCase().includes(preferKw.toLowerCase())){ chosen = opt; break; }
    }
    if(chosen) chosen.selected = true;
  }

  // Aplica perfil y ademas fija el CLIP (fichero+type) coherente con el UNET.
  function setStage(unetSel, clipSel, family, stage, preferKw){
    selectByFamily(unetSel, family, preferKw);
    // selectByKw(clipSel, archClipKeyword(family)); // No cambiar text encoder al cambiar modelo
    applyProfile(profileForFamily(family), stage);
  }

  if(mode === "krea_qwen"){
    setStage(selBaseU, selBaseC, "krea2", "base", "habanero");
    setStage(selRefU, selRefC, "qwen21", "refiner", "qwen-image-2.1-UC-NVFP4");
    if(hint) hint.textContent = "Krea2 compone la escena con estética fotográfica cinematográfica; Qwen 2.1 refina microtexturas y nitidez tras el reescalado.";
    if($("refinerEnabled")) $("refinerEnabled").checked = true;
    if(refWrap) refWrap.style.opacity = "1";
  } else if(mode === "qwen_krea"){
    setStage(selBaseU, selBaseC, "qwen21", "base", "qwen-image-2.1-UC-NVFP4");
    setStage(selRefU, selRefC, "krea2", "refiner", "habanero");
    if(hint) hint.textContent = "Qwen 2.1 genera la composición con adherencia profunda al prompt; Krea2 aporta riqueza tonal y grano en la pasada de refinamiento.";
    if($("refinerEnabled")) $("refinerEnabled").checked = true;
    if(refWrap) refWrap.style.opacity = "1";
  } else if(mode === "krea_krea"){
    setStage(selBaseU, selBaseC, "krea2", "base", "habanero");
    setStage(selRefU, selRefC, "krea2", "refiner", "habanero");
    if(hint) hint.textContent = "Pipeline homogéneo Krea2: generación inicial y refinado en superresolución dentro del modelo Flux2.";
    if($("refinerEnabled")) $("refinerEnabled").checked = true;
    if(refWrap) refWrap.style.opacity = "1";
  } else if(mode === "qwen_qwen"){
    setStage(selBaseU, selBaseC, "qwen21", "base", "qwen-image-2.1-UC-NVFP4");
    setStage(selRefU, selRefC, "qwen21", "refiner", "qwen-image-2.1-UC-NVFP4");
    if(hint) hint.textContent = "Pipeline homogéneo Qwen 2.1: renderizado y refinado con máxima nitidez textual y detalle anatómico.";
    if($("refinerEnabled")) $("refinerEnabled").checked = true;
    if(refWrap) refWrap.style.opacity = "1";
  } else if(mode === "base_only"){
    // En base_only heredamos el perfil (pero no tocamos el text encoder) del modelo base actual
    const baseFam = unetArchFamily(selBaseU?.value);
    // selectByKw(selBaseC, archClipKeyword(baseFam));
    applyProfile(profileForFamily(baseFam), "base_only");
    if($("refinerEnabled")) $("refinerEnabled").checked = false;
    if($("upscaleEnabled")) $("upscaleEnabled").checked = false;
    if(hint) hint.textContent = "Generación directa de una sola pasada sin escalado ni refiner.";
    if(refWrap) refWrap.style.opacity = "0.6";
  }
  updateVaeSelectors();
}

// Invertir orden Base y Refiner
function invertOrder(){
  const swap = (id1, id2) => {
    const el1 = $(id1), el2 = $(id2);
    if(el1 && el2){ const tmp = el1.value; el1.value = el2.value; el2.value = tmp; }
  };
  
  const v1 = $("baseVaeSelect")?.value;
  const v2 = $("refinerVaeSelect")?.value;

  swap("baseUnetSelect", "refinerUnetSelect");
  swap("baseClipSelect", "refinerClipSelect");
  
  updateVaeSelectors();
  
  if($("baseVaeSelect")) $("baseVaeSelect").value = v2;
  if($("refinerVaeSelect")) $("refinerVaeSelect").value = v1;
  
  syncStageToUnet("baseUnetSelect", "baseClipSelect", "base");
  syncStageToUnet("refinerUnetSelect", "refinerClipSelect", "refiner");

  const modeSel = $("comboMode");
  const bFam = unetArchFamily($("baseUnetSelect")?.value);
  const rFam = unetArchFamily($("refinerUnetSelect")?.value);
  const newMode = (bFam === "krea2" && rFam === "qwen21") ? "krea_qwen" :
                  (bFam === "qwen21" && rFam === "krea2") ? "qwen_krea" :
                  (bFam === "krea2" && rFam === "krea2") ? "krea_krea" :
                  (bFam === "qwen21" && rFam === "qwen21") ? "qwen_qwen" : "";
  if(newMode && modeSel) modeSel.value = newMode;
  
  log("⇄ Orden de modelos invertido.", "l-ok");
}

// Recalcula CLIP (fichero+type) y perfil de una etapa a partir de su UNET actual.
function syncStageToUnet(unetSelId, clipSelId, prefix){
  const family = unetArchFamily($(unetSelId)?.value);
  applyProfile(profileForFamily(family), prefix);
  return family;
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

// Parser JSON inteligente del resultado del enhancer Qwen 2.1.
// Devuelve el texto a aplicar y, si el JSON trae "wh_ratio", lo auto-selecciona
// en el selector de relación de aspecto. No escribe en #prompt (lo decide quien
// lo invoca): así puede usarse tanto desde "Usar como prompt" como desde el
// interceptor de captura registrado en initKreaQwenUI().
function parseEnhancerResult(rawText){
  if(!rawText) return "";
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

  // Si devuelve wh_ratio, auto-seleccionar ratio
  if(ratioToApply && RATIO_MAP[ratioToApply]){
    const targetOpt = RATIO_MAP[ratioToApply];
    if($("aspectRatio")){
      $("aspectRatio").value = targetOpt;
      updateDimensionHints();
      log(`🎯 Relación de aspecto auto-ajustada por Qwen a ${ratioToApply}`, "l-ok");
    }
  }

  return textToApply;
}

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
  // Validar estructura: si el localStorage está corrupto (no-array, longitud
  // errónea u objeto sin .lora), mantenemos el default y NO abortamos la
  // inicialización de la UI con un TypeError en renderLoraGroup.
  const isValid = (arr, len) => Array.isArray(arr) && arr.length === len
    && arr.every(l => l && typeof l === "object" && typeof l.lora === "string" && typeof l.on === "boolean");
  try {
    const b = localStorage.getItem("kreaqwen_base_loras");
    if(b){
      const parsed = JSON.parse(b);
      if(isValid(parsed, baseLoras.length)) baseLoras = parsed;
    }
  } catch(e){ console.warn("kreaqwen_loras base corruptos, usando defaults"); }
  try {
    const r = localStorage.getItem("kreaqwen_refiner_loras");
    if(r){
      const parsed = JSON.parse(r);
      if(isValid(parsed, refinerLoras.length)) refinerLoras = parsed;
    }
  } catch(e){ console.warn("kreaqwen_loras refiner corruptos, usando defaults"); }
}

function saveLoraStates(){
  try {
    localStorage.setItem("kreaqwen_base_loras", JSON.stringify(baseLoras));
    localStorage.setItem("kreaqwen_refiner_loras", JSON.stringify(refinerLoras));
  } catch(e){}
  if(typeof scheduleSaveKreaQwenSettings === "function") scheduleSaveKreaQwenSettings();
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
      opts += `<option value="${escapeHtml(path)}" ${selected} title="${escapeHtml(path)}">${escapeHtml(displayName)}</option>`;
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
// --- REFINADO FACIAL (ComfyUI-H3-FaceRefine, recorte/recomposición de imagen) ---
// Reutiliza el detector de rostros y los nodos de recorte/fusión del pack H3
// FaceRefine (ya instalado), pero sustituye la cadena de latentes de vídeo
// (MiniMaxH3ReferenceToVideo / H3InjectVideoLatent / H3PerFrameDenoise) por un
// VAEEncode -> KSampler -> VAEDecode nativo sobre la imagen final.
const FACEREFINE_KEY = "kreaqwen_facerefine_state";
const FACEREFINE_DEFAULTS = {
  enabled: false,
  denoise: 0.40,
  steps: 10,
  canvasSize: 768,
  feather: 12,
  select: "largest_face"
};
function loadFaceRefine(){
  try { return Object.assign({}, FACEREFINE_DEFAULTS, JSON.parse(localStorage.getItem(FACEREFINE_KEY) || "{}")); }
  catch(_) { return {...FACEREFINE_DEFAULTS}; }
}
function saveFaceRefine(s){ try { localStorage.setItem(FACEREFINE_KEY, JSON.stringify(s)); } catch(_){} }
function getFaceRefineState(){
  return {
    enabled: $("segFaceRefineOn")?.classList.contains("on") ?? false,
    denoise: parseFloat($("faceRefineDenoiseSlider")?.value || "0.40"),
    steps: parseInt($("faceRefineStepsSlider")?.value || "10", 10),
    canvasSize: parseInt($("faceRefineCanvasMode")?.value || "768", 10),
    feather: parseInt($("faceRefineFeatherSlider")?.value || "12", 10),
    select: $("faceRefineSelectMode")?.value || "largest_face"
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
  if($("faceRefineStepsSlider")){
    const st = parseInt(s.steps != null ? s.steps : 10, 10);
    $("faceRefineStepsSlider").value = st;
    if($("faceRefineStepsVal")) $("faceRefineStepsVal").textContent = st;
    if($("faceRefineStepsHint")) $("faceRefineStepsHint").textContent = `(${st})`;
  }
  if($("faceRefineCanvasMode") && s.canvasSize){
    $("faceRefineCanvasMode").value = String(s.canvasSize);
  }
  if($("faceRefineDenoiseSlider")){
    const d = parseFloat(s.denoise != null ? s.denoise : 0.40);
    $("faceRefineDenoiseSlider").value = d;
    if($("faceRefineDenoiseVal")) $("faceRefineDenoiseVal").textContent = d.toFixed(2);
    if($("faceRefineDenoiseHint")) $("faceRefineDenoiseHint").textContent = `(${d.toFixed(2)})`;
  }
  if($("faceRefineFeatherSlider")){
    const f = parseInt(s.feather != null ? s.feather : 12, 10);
    $("faceRefineFeatherSlider").value = f;
    if($("faceRefineFeatherVal")) $("faceRefineFeatherVal").textContent = f + " px";
    if($("faceRefineFeatherHint")) $("faceRefineFeatherHint").textContent = `(${f} px)`;
  }
  if($("faceRefineSelectMode") && s.select){
    $("faceRefineSelectMode").value = s.select;
  }
}

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
    baseWeightDtype: $("baseWeightDtype")?.value || "default",
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
    varianceFineTune: parseInt($("varianceFineTune")?.value || "100", 10),
    varianceDirection: $("varianceDirection")?.value || "🌎 Diversity",
    varianceShiftStrength: parseInt($("varianceShiftStrength")?.value || "150", 10),
    varianceNoiseInjection: $("varianceNoiseInjection")?.value || "🚫 None",
    varianceFadeCurve: $("varianceFadeCurve")?.value || "Instant",
    protectMode: $("protectMode")?.value || "🚫 None",
    varianceSeedMode: $("segVarianceRandom")?.classList.contains("on") ? "random" : "fixed",
    varianceSeedValue: parseInt($("varianceSeed")?.value || "315489554057974", 10),
    upscaleEnabled: isBaseOnly ? false : $("upscaleEnabled")?.checked,
    upscaleModel: $("upscaleModelSelect")?.value || "4xPurePhoto-Span.pth",
    targetW: upW,
    targetH: upH,
    refinerEnabled: isBaseOnly ? false : $("refinerEnabled")?.checked,
    refinerUnet: $("refinerUnetSelect")?.value,
    refinerWeightDtype: $("refinerWeightDtype")?.value || "default",
    refinerClip: $("refinerClipSelect")?.value,
    refinerVae: $("refinerVaeSelect")?.value,
    refinerAttn: $("refinerAttentionBackend")?.value || "comfy kitchen attention",
    refinerDenoise: parseFloat($("refinerDenoise")?.value || "0.35"),
    refinerSteps: parseInt($("refinerSteps")?.value || "6", 10),
    refinerCfg: parseFloat($("refinerCfg")?.value || "1.0"),
    refinerSampler: $("refinerSamplerName")?.value || "euler",
    refinerScheduler: $("refinerSchedulerName")?.value || "simple",
    refinerLoras: JSON.parse(JSON.stringify(refinerLoras)),
    spectrumEnabled: $("spectrumEnabled") ? $("spectrumEnabled").checked : true,
    spectrumW: parseFloat($("spectrumW")?.value || "0.3"),
    spectrumLam: parseFloat($("spectrumLam")?.value || "0.1"),
    keepModelInRam: $("keepModelInRam")?.checked,
    batchSize: parseInt($("batchSize")?.value || "1", 10),
    filenamePrefix: $("filenamePrefix")?.value || "kreaqwen/imagen",
    // Refinado facial (recorte + re-muestreo + recomposición sobre la imagen final)
    faceRefine: getFaceRefineState(),
    // Edición con Qwen 2.1 (img2img / faceswap)
    qwenEdit: {
      enabled: !!$("qwenEditEnabled")?.checked,
      stage: $("qwenEditStage")?.value || "refiner",
      prompt: $("qwenEditPrompt")?.value || "",
      resolution: parseInt($("qwenEditResolution")?.value || "1024", 10),
      refSrc: (!!$("qwenEditEnabled")?.checked ? getRefImageSrc() : null),
      extraRefSrcs: (!!$("qwenEditEnabled")?.checked ? qwenEditExtraRefs.slice() : []),
      refB64: null,
      extraRefB64: [],
    },
    // Post-procesado (ProPost Torched)
    postfx: {
      vignette: {
        enabled: !!$("vigEnabled")?.checked,
        intensity: parseFloat($("vigIntensity")?.value || "1.0"),
        cx: parseFloat($("vigCX")?.value || "0.5"),
        cy: parseFloat($("vigCY")?.value || "0.5"),
      },
      grain: {
        enabled: !!$("grainEnabled")?.checked,
        type: $("grainType")?.value || "Fine Simple",
        gray: !!$("grainGray")?.checked,
        sat: parseFloat($("grainSat")?.value || "0.3"),
        power: parseFloat($("grainPower")?.value || "0.3"),
        shadows: parseFloat($("grainShadows")?.value || "0.35"),
        highs: parseFloat($("grainHighs")?.value || "0.1"),
        scale: parseFloat($("grainScale")?.value || "1"),
        sharpen: parseInt($("grainSharpen")?.value || "0", 10),
      },
      radial: {
        enabled: !!$("radialEnabled")?.checked,
        strength: parseFloat($("radialStrength")?.value || "64"),
        cx: parseFloat($("radialCX")?.value || "0.5"),
        cy: parseFloat($("radialCY")?.value || "0.5"),
        spread: parseFloat($("radialSpread")?.value || "1"),
        steps: parseInt($("radialSteps")?.value || "5", 10),
      },
      lut: {
        enabled: !!$("lutEnabled")?.checked,
        name: $("lutName")?.value || "",
        strength: parseFloat($("lutStrength")?.value || "0.8"),
        log: !!$("lutLog")?.checked,
      },
    },
    createdAt: Date.now()
  };
}

// --- PERSISTENCIA DE SESIÓN (ajustes en localStorage) ---
const KREAQWEN_SETTINGS_KEY = 'kreaqwen_settings_v2';
let kreaQwenSaveTimer = null;

function scheduleSaveKreaQwenSettings(){
  clearTimeout(kreaQwenSaveTimer);
  kreaQwenSaveTimer = setTimeout(saveKreaQwenSettings, 300);
}

function saveKreaQwenSettings(){
  const s = {
    prompt: $("prompt")?.value ?? "",
    negPrompt: $("negPrompt")?.value ?? "",
    comboMode: $("comboMode")?.value || "krea_qwen",
    baseUnet: $("baseUnetSelect")?.value,
    baseWeightDtype: $("baseWeightDtype")?.value || "default",
    baseClip: $("baseClipSelect")?.value,
    baseVae: $("baseVaeSelect")?.value,
    baseAttn: $("baseAttentionBackend")?.value || "comfy kitchen attention",
    baseSteps: $("baseSteps")?.value || "8",
    baseCfg: $("baseCfg")?.value || "1.0",
    baseSampler: $("baseSamplerName")?.value || "euler",
    baseScheduler: $("baseSchedulerName")?.value || "simple",
    baseLoras: JSON.parse(JSON.stringify(baseLoras)),

    refinerEnabled: $("refinerEnabled")?.checked ?? true,
    refinerUnet: $("refinerUnetSelect")?.value,
    refinerWeightDtype: $("refinerWeightDtype")?.value || "default",
    refinerClip: $("refinerClipSelect")?.value,
    refinerVae: $("refinerVaeSelect")?.value,
    refinerAttn: $("refinerAttentionBackend")?.value || "comfy kitchen attention",
    refinerDenoise: $("refinerDenoise")?.value || "0.35",
    refinerSteps: $("refinerSteps")?.value || "6",
    refinerCfg: $("refinerCfg")?.value || "1.0",
    refinerSampler: $("refinerSamplerName")?.value || "euler",
    refinerScheduler: $("refinerSchedulerName")?.value || "simple",
    refinerLoras: JSON.parse(JSON.stringify(refinerLoras)),

    mp: $("mpSlider")?.value || "1.0",
    aspectRatio: $("aspectRatio")?.value || "16:9 (Widescreen)",
    upscaleEnabled: $("upscaleEnabled")?.checked ?? true,
    upscaleFactor: $("upscaleFactor")?.value || "1.5",
    upscaleModel: $("upscaleModelSelect")?.value || "4xPurePhoto-Span.pth",

    seedMode: $("segSamplerRandom")?.classList.contains("on") ? "random" : "fixed",
    seedValue: $("samplerSeed")?.value || "1062442950133633",

    variancePreset: $("variancePreset")?.value || "❌ Disabled",
    varianceFineTune: $("varianceFineTune")?.value || "100",
    varianceDirection: $("varianceDirection")?.value || "🌎 Diversity",
    varianceShiftStrength: $("varianceShiftStrength")?.value || "150",
    varianceNoiseInjection: $("varianceNoiseInjection")?.value || "🚫 None",
    varianceFadeCurve: $("varianceFadeCurve")?.value || "Instant",
    protectMode: $("protectMode")?.value || "🚫 None",
    varianceSeedMode: $("segVarianceRandom")?.classList.contains("on") ? "random" : "fixed",
    varianceSeedValue: $("varianceSeed")?.value || "315489554057974",
    eta: $("etaSlider")?.value || "0.5",

    spectrumEnabled: $("spectrumEnabled") ? $("spectrumEnabled").checked : true,
    spectrumW: $("spectrumW")?.value || "0.3",
    spectrumLam: $("spectrumLam")?.value || "0.1",

    qwenEditEnabled: !!$("qwenEditEnabled")?.checked,
    qwenEditStage: $("qwenEditStage")?.value || "refiner",
    qwenEditPrompt: $("qwenEditPrompt")?.value || "",
    qwenEditResolution: $("qwenEditResolution")?.value || "1024",

    faceRefine: getFaceRefineState(),

    evolveMode: $("evolveMode")?.value,
    evolveStrength: $("evolveStrength")?.value,

    // Post-fx
    vigEnabled: !!$("vigEnabled")?.checked,
    vigIntensity: $("vigIntensity")?.value || "1.0",
    grainEnabled: !!$("grainEnabled")?.checked,
    grainType: $("grainType")?.value || "Fine Simple",
    grainPower: $("grainPower")?.value || "0.3",
    grainSat: $("grainSat")?.value || "0.3",
    grainGray: !!$("grainGray")?.checked,
    radialEnabled: !!$("radialEnabled")?.checked,
    radialStrength: $("radialStrength")?.value || "64",
    lutEnabled: !!$("lutEnabled")?.checked,
    lutName: $("lutName")?.value || "",
    lutStrength: $("lutStrength")?.value || "0.8",
    lutLog: !!$("lutLog")?.checked,

    keepModelInRam: $("keepModelInRam")?.checked ?? true,
    batchSize: $("batchSize")?.value || "1",
    filenamePrefix: $("filenamePrefix")?.value || "kreaqwen/imagen",
  };
  try { localStorage.setItem(KREAQWEN_SETTINGS_KEY, JSON.stringify(s)); }
  catch(e){ console.warn("Error guardando ajustes KreaQwen:", e); }
}

function restoreKreaQwenSettings(){
  const raw = localStorage.getItem(KREAQWEN_SETTINGS_KEY);
  if(!raw) return false;
  try {
    const s = JSON.parse(raw);
    if(!s || typeof s !== "object") return false;

    if(s.prompt !== undefined && $("prompt")) $("prompt").value = s.prompt;
    if(s.negPrompt !== undefined && $("negPrompt")) $("negPrompt").value = s.negPrompt;
    if(s.comboMode && $("comboMode")) $("comboMode").value = s.comboMode;

    if(s.baseUnet && $("baseUnetSelect")) $("baseUnetSelect").value = s.baseUnet;
    if(s.baseWeightDtype && $("baseWeightDtype")) $("baseWeightDtype").value = s.baseWeightDtype;
    if(s.baseClip && $("baseClipSelect")) $("baseClipSelect").value = s.baseClip;
    if(s.baseAttn && $("baseAttentionBackend")) $("baseAttentionBackend").value = s.baseAttn;
    if(s.baseSteps !== undefined && $("baseSteps")) $("baseSteps").value = s.baseSteps;
    if(s.baseCfg !== undefined && $("baseCfg")) $("baseCfg").value = s.baseCfg;
    if(s.baseSampler && $("baseSamplerName")) $("baseSamplerName").value = s.baseSampler;
    if(s.baseScheduler && $("baseSchedulerName")) $("baseSchedulerName").value = s.baseScheduler;

    if(Array.isArray(s.baseLoras) && s.baseLoras.length){
      s.baseLoras.forEach((l, i) => { if(i < baseLoras.length && l) baseLoras[i] = l; });
      renderLoraGroup("baseLoraList", baseLoras, "LoRA Base", saveLoraStates);
    }

    if(s.refinerEnabled !== undefined && $("refinerEnabled")) $("refinerEnabled").checked = !!s.refinerEnabled;
    if(s.refinerUnet && $("refinerUnetSelect")) $("refinerUnetSelect").value = s.refinerUnet;
    if(s.refinerWeightDtype && $("refinerWeightDtype")) $("refinerWeightDtype").value = s.refinerWeightDtype;
    if(s.refinerClip && $("refinerClipSelect")) $("refinerClipSelect").value = s.refinerClip;
    if(s.refinerAttn && $("refinerAttentionBackend")) $("refinerAttentionBackend").value = s.refinerAttn;
    if(s.refinerDenoise !== undefined && $("refinerDenoise")){
      $("refinerDenoise").value = s.refinerDenoise;
      if($("refinerDenoiseVal")) $("refinerDenoiseVal").textContent = parseFloat(s.refinerDenoise).toFixed(2);
    }
    if(s.refinerSteps !== undefined && $("refinerSteps")) $("refinerSteps").value = s.refinerSteps;
    if(s.refinerCfg !== undefined && $("refinerCfg")) $("refinerCfg").value = s.refinerCfg;
    if(s.refinerSampler && $("refinerSamplerName")) $("refinerSamplerName").value = s.refinerSampler;
    if(s.refinerScheduler && $("refinerSchedulerName")) $("refinerSchedulerName").value = s.refinerScheduler;

    // Actualizar selectores VAE según UNet restaurado y asignar VAEs
    updateVaeSelectors();
    if(s.baseVae && $("baseVaeSelect")) $("baseVaeSelect").value = s.baseVae;
    if(s.refinerVae && $("refinerVaeSelect")) $("refinerVaeSelect").value = s.refinerVae;

    if(Array.isArray(s.refinerLoras) && s.refinerLoras.length){
      s.refinerLoras.forEach((l, i) => { if(i < refinerLoras.length && l) refinerLoras[i] = l; });
      renderLoraGroup("refinerLoraList", refinerLoras, "LoRA Refiner", saveLoraStates);
    }

    if(s.mp !== undefined && $("mpSlider")){
      $("mpSlider").value = s.mp;
      if($("mpVal")) $("mpVal").textContent = parseFloat(s.mp).toFixed(2);
    }
    if(s.aspectRatio && $("aspectRatio")) $("aspectRatio").value = s.aspectRatio;
    if(s.upscaleEnabled !== undefined && $("upscaleEnabled")) $("upscaleEnabled").checked = !!s.upscaleEnabled;
    if(s.upscaleFactor !== undefined && $("upscaleFactor")){
      $("upscaleFactor").value = s.upscaleFactor;
      if($("upscaleFactorVal")) $("upscaleFactorVal").textContent = `${parseFloat(s.upscaleFactor).toFixed(2)}x`;
    }
    if(s.upscaleModel && $("upscaleModelSelect")) $("upscaleModelSelect").value = s.upscaleModel;

    // Semillas
    if(s.seedMode){
      if(s.seedMode === "random"){
        $("segSamplerRandom")?.classList.add("on");
        $("segSamplerFixed")?.classList.remove("on");
        if($("samplerSeed")) $("samplerSeed").disabled = true;
      } else {
        $("segSamplerFixed")?.classList.add("on");
        $("segSamplerRandom")?.classList.remove("on");
        if($("samplerSeed")) $("samplerSeed").disabled = false;
      }
    }
    if(s.seedValue !== undefined && $("samplerSeed")) $("samplerSeed").value = s.seedValue;

    // Varianza
    if(s.variancePreset && $("variancePreset")) $("variancePreset").value = s.variancePreset;
    if(s.varianceFineTune !== undefined && $("varianceFineTune")){
      $("varianceFineTune").value = s.varianceFineTune;
      if($("varianceFineTuneVal")) $("varianceFineTuneVal").textContent = s.varianceFineTune;
    }
    if(s.varianceDirection && $("varianceDirection")) $("varianceDirection").value = s.varianceDirection;
    if(s.varianceShiftStrength !== undefined && $("varianceShiftStrength")){
      $("varianceShiftStrength").value = s.varianceShiftStrength;
      if($("varianceShiftStrengthVal")) $("varianceShiftStrengthVal").textContent = s.varianceShiftStrength;
    }
    if(s.varianceNoiseInjection && $("varianceNoiseInjection")) $("varianceNoiseInjection").value = s.varianceNoiseInjection;
    if(s.varianceFadeCurve && $("varianceFadeCurve")) $("varianceFadeCurve").value = s.varianceFadeCurve;
    if(s.protectMode && $("protectMode")) $("protectMode").value = s.protectMode;
    if(s.varianceSeedMode){
      if(s.varianceSeedMode === "random"){
        $("segVarianceRandom")?.classList.add("on");
        $("segVarianceFixed")?.classList.remove("on");
        if($("varianceSeed")) $("varianceSeed").disabled = true;
      } else {
        $("segVarianceFixed")?.classList.add("on");
        $("segVarianceRandom")?.classList.remove("on");
        if($("varianceSeed")) $("varianceSeed").disabled = false;
      }
    }
    if(s.varianceSeedValue !== undefined && $("varianceSeed")) $("varianceSeed").value = s.varianceSeedValue;
    if(s.eta !== undefined && $("etaSlider")){
      $("etaSlider").value = s.eta;
      if($("etaVal")) $("etaVal").textContent = parseFloat(s.eta).toFixed(2);
    }

    // Spectrum
    if(s.spectrumEnabled !== undefined && $("spectrumEnabled")) $("spectrumEnabled").checked = !!s.spectrumEnabled;
    else if($("spectrumEnabled")) $("spectrumEnabled").checked = true;
    if(s.spectrumW !== undefined && $("spectrumW")){
      $("spectrumW").value = s.spectrumW;
      if($("spectrumWVal")) $("spectrumWVal").textContent = parseFloat(s.spectrumW).toFixed(2);
    }
    if(s.spectrumLam !== undefined && $("spectrumLam")){
      $("spectrumLam").value = s.spectrumLam;
      if($("spectrumLamVal")) $("spectrumLamVal").textContent = parseFloat(s.spectrumLam).toFixed(2);
    }

    // Qwen Edit
    if(s.qwenEditEnabled !== undefined && $("qwenEditEnabled")) $("qwenEditEnabled").checked = !!s.qwenEditEnabled;
    if(s.qwenEditStage && $("qwenEditStage")) $("qwenEditStage").value = s.qwenEditStage;
    if(s.qwenEditPrompt !== undefined && $("qwenEditPrompt")) $("qwenEditPrompt").value = s.qwenEditPrompt;
    if(s.qwenEditResolution !== undefined && $("qwenEditResolution")){
      $("qwenEditResolution").value = s.qwenEditResolution;
      if($("qwenEditResolutionVal")) $("qwenEditResolutionVal").textContent = s.qwenEditResolution;
    }

    // FaceRefine
    if(s.faceRefine){
      setFaceRefineUI(s.faceRefine);
      saveFaceRefine(s.faceRefine);
    }

    if(s.evolveMode && $("evolveMode")) $("evolveMode").value = s.evolveMode;
    if(s.evolveStrength !== undefined && $("evolveStrength")){
      $("evolveStrength").value = s.evolveStrength;
      if($("evolveStrengthVal")) $("evolveStrengthVal").textContent = `${s.evolveStrength}%`;
    }

    // Post-fx
    if(s.vigEnabled !== undefined && $("vigEnabled")) $("vigEnabled").checked = !!s.vigEnabled;
    if(s.vigIntensity !== undefined && $("vigIntensity")){
      $("vigIntensity").value = s.vigIntensity;
      if($("vigVal")) $("vigVal").textContent = parseFloat(s.vigIntensity).toFixed(2);
    }
    if(s.grainEnabled !== undefined && $("grainEnabled")) $("grainEnabled").checked = !!s.grainEnabled;
    if(s.grainType && $("grainType")) $("grainType").value = s.grainType;
    if(s.grainPower !== undefined && $("grainPower")){
      $("grainPower").value = s.grainPower;
      if($("grainVal")) $("grainVal").textContent = parseFloat(s.grainPower).toFixed(2);
    }
    if(s.grainSat !== undefined && $("grainSat")) $("grainSat").value = s.grainSat;
    if(s.grainGray !== undefined && $("grainGray")) $("grainGray").checked = !!s.grainGray;
    if(s.radialEnabled !== undefined && $("radialEnabled")) $("radialEnabled").checked = !!s.radialEnabled;
    if(s.radialStrength !== undefined && $("radialStrength")){
      $("radialStrength").value = s.radialStrength;
      if($("radialVal")) $("radialVal").textContent = s.radialStrength;
    }
    if(s.lutEnabled !== undefined && $("lutEnabled")) $("lutEnabled").checked = !!s.lutEnabled;
    if(s.lutName && $("lutName")) $("lutName").value = s.lutName;
    if(s.lutStrength !== undefined && $("lutStrength")){
      $("lutStrength").value = s.lutStrength;
      if($("lutVal")) $("lutVal").textContent = parseFloat(s.lutStrength).toFixed(2);
    }
    if(s.lutLog !== undefined && $("lutLog")) $("lutLog").checked = !!s.lutLog;

    // Varios
    if(s.keepModelInRam !== undefined && $("keepModelInRam")) $("keepModelInRam").checked = !!s.keepModelInRam;
    if(s.batchSize !== undefined && $("batchSize")) $("batchSize").value = s.batchSize;
    if(s.filenamePrefix !== undefined && $("filenamePrefix")) $("filenamePrefix").value = s.filenamePrefix;

    updateDimensionHints();
    ["baseSteps","baseCfg","baseSamplerName","baseSchedulerName","refinerSteps","refinerCfg","refinerSamplerName","refinerSchedulerName","refinerDenoise"].forEach(id => markTouched(id));
    return true;
  } catch(e){
    console.warn("Error restaurando ajustes KreaQwen:", e);
    return false;
  }
}

// La caché de prefijo de Qwen-Image 2.1 en ComfyUI peta con CFG>1 (positivo y negativo crean
// slots de tamaño distinto y PoseBranchCache.select usa list.remove → compara tensores).
// "off" recalcula el prefijo en cada paso: algo más lento, pero estable.
function appendQwenCacheOff(g, stage, modelRef){
  const id = `qwen21_cache_${stage}`;
  g[id] = {
    class_type: "QwenImage21Cache",
    inputs: { model: modelRef, device: "off", dtype: "default" },
    _meta: { title: `Qwen 2.1 Cache OFF (${stage})` }
  };
  return [id, 0];
}

// --- EDICIÓN CON QWEN 2.1 (nodos en el grafo) ---
// Añade el encoder de edición y carga las referencias base64. Devuelve las
// referencias de conditioning/latent a usar en la etapa, o null si no aplica.
function appendQwenEditStage(g, stage, opts){
  const qe = opts.job.qwenEdit;
  if(!qe || !qe.enabled) return null;
  const b64s = [];
  if(qe.refB64) b64s.push(qe.refB64);
  if(Array.isArray(qe.extraRefB64)) b64s.push(...qe.extraRefB64);
  if(b64s.length === 0) return null;

  const loadIds = b64s.map((b64, i) => {
    const id = `qwen_edit_img_${stage}_${i + 1}`;
    g[id] = {
      class_type: "SwarmLoadImageB64",
      inputs: { image_base64: b64 },
      _meta: { title: `Qwen Edit Ref ${stage} ${i + 1}` }
    };
    return id;
  });

  const encId = `qwen_edit_encode_${stage}`;
  const inputs = {
    clip: opts.clipRef,
    prompt: qe.prompt || opts.prompt || "",
    negative_prompt: opts.negative || "",
    resolution: qe.resolution,
    vae: opts.vaeRef,
  };
  loadIds.forEach((id, i) => { inputs[`images.image_${i + 1}`] = [id, 0]; });

  g[encId] = {
    class_type: "TextEncodeQwenImage21",
    inputs,
    _meta: { title: `Edición Qwen 2.1 (${stage})` }
  };
  return { encoder: encId, latent: [encId, 2] };
}

// --- POST-PROCESADO (ProPost Torched) ---
// Construye la cadena de efectos sobre `imageRef` ([nodeId, slot]) y devuelve la
// referencia de salida a conectar a SaveImage. Solo añade nodos para efectos activos.
// Orden: Radial Blur (óptica) -> LUT (color) -> Film Grain (película) -> Vignette (lente).
function appendPostFx(g, imageRef, job){
  const fx = job.postfx || {};
  let cur = imageRef;

  if(fx.radial?.enabled){
    g["post_radialblur"] = {
      class_type: "ProPostRadialBlur",
      inputs: {
        image: cur,
        blur_strength: fx.radial.strength,
        center_x: fx.radial.cx,
        center_y: fx.radial.cy,
        focus_spread: fx.radial.spread,
        steps: fx.radial.steps,
      },
      _meta: { title: "ProPost Radial Blur" }
    };
    cur = ["post_radialblur", 0];
  }

  if(fx.lut?.enabled && fx.lut.name){
    g["post_lut"] = {
      class_type: "ProPostApplyLUT",
      inputs: {
        image: cur,
        lut_name: fx.lut.name,
        strength: fx.lut.strength,
        log: fx.lut.log,
      },
      _meta: { title: "ProPost Apply LUT" }
    };
    cur = ["post_lut", 0];
  }

  if(fx.grain?.enabled){
    g["post_filmgrain"] = {
      class_type: "ProPostFilmGrain",
      inputs: {
        image: cur,
        gray_scale: fx.grain.gray,
        grain_type: fx.grain.type,
        grain_sat: fx.grain.sat,
        grain_power: fx.grain.power,
        shadows: fx.grain.shadows,
        highs: fx.grain.highs,
        scale: fx.grain.scale,
        sharpen: fx.grain.sharpen,
        src_gamma: 1.0,
        seed: job.seedValue || 1,
      },
      _meta: { title: "ProPost Film Grain" }
    };
    cur = ["post_filmgrain", 0];
  }

  if(fx.vignette?.enabled){
    g["post_vignette"] = {
      class_type: "ProPostVignette",
      inputs: {
        image: cur,
        intensity: fx.vignette.intensity,
        center_x: fx.vignette.cx,
        center_y: fx.vignette.cy,
      },
      _meta: { title: "ProPost Vignette" }
    };
    cur = ["post_vignette", 0];
  }

  return cur;
}

// --- REFINADO FACIAL SOBRE LA IMAGEN FINAL (H3 FaceRefine, imagen) ---
// Toma la imagen final, recorta el rostro con H3FaceTrackCrop (detector YOLO del
// pack H3 FaceRefine), lo re-muestrea con el modelo de la última etapa y lo
// recompone con H3FaceStitch. Sustituye la cadena de latentes de vídeo del pack
// por VAEEncode -> KSampler -> VAEDecode nativo. Devuelve la referencia de imagen
// a guardar, o la original si está desactivado.
function appendFaceRefine(g, imageRef, job, opts){
  const fr = job.faceRefine;
  if(!fr || !fr.enabled) return imageRef;
  if(!opts || !opts.modelRef || !opts.vaeRef || !opts.posRef || !opts.negRef) return imageRef;

  const canvas = fr.canvasSize || 768;

  g[N.FACE_CROP] = {
    class_type: "H3FaceTrackCrop",
    inputs: {
      images: imageRef,
      detector: "face_yolov8m.pt",
      confidence: 0.35,
      crop_factor: 3.0,
      canvas_width: canvas,
      canvas_height: canvas,
      canvas_mode: "manual",
      smooth_window: 21,
      size_smooth_window: 51,
      smooth_method: "gaussian",
      size_mode: "per_frame",
      identity_track: false,
      identity_threshold: 0.28,
      select: fr.select || "largest_face",
      fallback_detector: "none",
      fallback_head_frac: 0.5,
      select_index: 0,
      identity_model: "insightface",
      cut_detection: "none",
      cut_threshold: 3.0,
      absent_shots: "off",
      X: 0,
      Y: 0,
      frame_index: 0
    },
    _meta: { title: "Face Track Crop" }
  };

  g[N.FACE_ENCODE] = {
    class_type: "VAEEncode",
    inputs: {
      pixels: [N.FACE_CROP, 0],
      vae: opts.vaeRef
    },
    _meta: { title: "VAE Encode (Rostro)" }
  };

  g[N.FACE_SAMPLER] = {
    class_type: "KSampler",
    inputs: {
      seed: (job.seedValue != null ? job.seedValue : 0) + 7919,
      steps: fr.steps || 10,
      cfg: opts.cfg != null ? opts.cfg : 1.0,
      sampler_name: opts.sampler || "euler",
      scheduler: opts.scheduler || "simple",
      denoise: fr.denoise || 0.40,
      model: opts.modelRef,
      positive: opts.posRef,
      negative: opts.negRef,
      latent_image: [N.FACE_ENCODE, 0]
    },
    _meta: { title: "KSampler (Rostro)" }
  };

  g[N.FACE_DECODE] = {
    class_type: "VAEDecode",
    inputs: {
      samples: [N.FACE_SAMPLER, 0],
      vae: opts.vaeRef
    },
    _meta: { title: "VAE Decode (Rostro)" }
  };

  g[N.FACE_STITCH] = {
    class_type: "H3FaceStitch",
    inputs: {
      base_images: imageRef,
      refined_crops: [N.FACE_DECODE, 0],
      transform: [N.FACE_CROP, 1],
      paste_region: "face_only",
      mask_dilation: 16,
      feather: fr.feather || 12,
      colour_match: 1.0,
      blend: 1.0,
      undetected_frames: "fade_out",
      feather_scales_with_crop: false
    },
    _meta: { title: "Stitch Face" }
  };

  return [N.FACE_STITCH, 0];
}

// Construcción del grafo dinámico nativo ComfyUI
function buildGraph(job){
  const j = job || activeJob || snapshotJob();
  const g = JSON.parse(JSON.stringify(BASE_GRAPH));

  // Detección de arquitectura por el modelo UNET (difusión). ComfyUI exige que el
  // tipo de CLIPLoader coincida exactamente con la arquitectura del UNET receptor:
  //   - Krea2   -> 'krea2'      (CLIP qwen3vl_4b, 30720 features)
  //   - Qwen2.1 -> 'qwen_image' (CLIP qwen3vl_8b)
  //   - Flux2/Klein -> 'flux2'  (CLIP qwen3vl_8b, 12288 features)
  // Krea2 y Klein comparten el directorio flux2/, asi que se distinguen por el NOMBRE.
  const famBase = unetArchFamily(j.baseUnet);
  const famRefiner = unetArchFamily(j.refinerUnet);
  const isQwenBase = (famBase === "qwen21");
  const isKreaBase = (famBase === "krea2");
  const isQwenRefiner = (famRefiner === "qwen21");
  const isKreaRefiner = (famRefiner === "krea2");

  // --- VALIDACIÓN DE COMPATIBILIDAD VAE/UNET (por canales latentes) ---
  // El Wan2.1_VAE_upscale2x_imageonly_real_v1 es un VAE especial de upscaling 2x para
  // nodos VAEUtils (como en el workflow nativo Krea2_OK.json). No puede usarse como
  // VAE principal de un pipeline KSampler -> VAEDecode -> SaveImage/PreviewImage.
  function famLabel(f){
    if(f === "qwen21") return "Qwen 2.1 (64 canales · qwen_image_2.1_vae)";
    if(f === "flux2") return "Flux2/Klein (128 canales · flux2-vae)";
    return "Krea2 (16 canales · qwen_image_vae / wan_2.1_vae)";
  }
  function vaeMatches(vaeName, family){
    return vaeLatentFamily(vaeName) === family;
  }
  if(vaeLatentFamily(j.baseVae) === "vaeutils"){
    throw new Error(`VAE Base no soportado: "${j.baseVae}" es un VAE de upscaling 2x para nodos VAEUtils, no para VAEDecode/SaveImage. Usa ${fallbackVae(famBase)}.`);
  }
  if(j.refinerEnabled && j.comboMode !== "base_only" && vaeLatentFamily(j.refinerVae) === "vaeutils"){
    throw new Error(`VAE Refiner no soportado: "${j.refinerVae}" es un VAE de upscaling 2x para nodos VAEUtils, no para VAEDecode/SaveImage. Usa ${fallbackVae(famRefiner)}.`);
  }
  if(!vaeMatches(j.baseVae, famBase)){
    throw new Error(`VAE Base incompatible: "${j.baseVae}" no decodifica los latentes de ${famLabel(famBase)}. Selecciona ${fallbackVae(famBase)}.`);
  }
  if(j.refinerEnabled && j.comboMode !== "base_only" && !vaeMatches(j.refinerVae, famRefiner)){
    throw new Error(`VAE Refiner incompatible: "${j.refinerVae}" no decodifica los latentes de ${famLabel(famRefiner)}. Selecciona ${fallbackVae(famRefiner)}.`);
  }

  // --- ETAPA 1 (BASE) ---
  g[N.UNET_BASE].inputs.unet_name = j.baseUnet;
  g[N.UNET_BASE].inputs.weight_dtype = resolveWeightDtype(j.baseWeightDtype, j.baseUnet);

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

  // Spectrum Base (Aceleración de difusión para Krea2 / Flux2 / Qwen)
  if(j.spectrumEnabled){
    const warmup = Math.min(4, Math.max(1, Math.floor(j.baseSteps * 0.35)));
    g["swarm_spectrum_base"] = {
      class_type: "SwarmSpectrum",
      inputs: {
        w: j.spectrumW,
        m: 3,
        lam: j.spectrumLam,
        window_size: 2,
        flex_window: 0.25,
        warmup_steps: warmup,
        stop_caching_step: -1,
        steps: j.baseSteps,
        calibrated: false,
        calibration_strength: 0.5,
        model: curBaseModel
      },
      _meta: { title: "SwarmSpectrum (Base)" }
    };
    curBaseModel = ["swarm_spectrum_base", 0];
  }

  if(isQwenBase && Number(j.baseCfg) > 1){
    curBaseModel = appendQwenCacheOff(g, "base", curBaseModel);
  }

  g[N.SAMPLER_BASE].inputs.model = curBaseModel;

  // CLIP Base
  g[N.CLIP_BASE].inputs.clip_name = j.baseClip;
  g[N.CLIP_BASE].inputs.type = archClipType(famBase);

  g[N.POS_BASE].inputs.text = (j.prompt || "").trim();
  // Krea 2 (Flux) no soporta prompt negativo (CFG=1), lo vaciamos. Qwen UC sí lo soporta.
  g[N.NEG_BASE].inputs.text = isKreaBase ? "" : (j.negPrompt || "").trim();

  // Edición con Qwen 2.1 en la etapa Base (solo si el Base es Qwen).
  const qwenEditBase = (isQwenBase && j.qwenEdit?.enabled && (j.qwenEdit.stage === "base" || j.qwenEdit.stage === "both"))
    ? appendQwenEditStage(g, "base", { job: j, clipRef: [N.CLIP_BASE, 0], vaeRef: [N.VAE_BASE, 0], prompt: j.prompt, negative: j.negPrompt })
    : null;

  // RBG Smart Seed Variance Base (solo si la etapa contiene Krea2)
  const varianceActive = j.variancePreset && !j.variancePreset.includes("Disabled");
  if(qwenEditBase){
    g[N.SAMPLER_BASE].inputs.positive = [qwenEditBase.encoder, 0];
    g[N.SAMPLER_BASE].inputs.negative = [qwenEditBase.encoder, 1];
  } else if(isKreaBase && varianceActive){
    g["rbg_variance_base"] = {
      class_type: "RBG_Smart_Seed_Variance",
      inputs: {
        variance_preset: j.variancePreset,
        fine_tune_variance: j.varianceFineTune ?? 46,
        model_type: "📸 Krea2 (SingleStream)",
        fade_curve: j.varianceFadeCurve || "Instant",
        noise_injection: j.varianceNoiseInjection || "Beginning Steps",
        protect_mode: j.protectMode,
        protect_regions: "",
        direction_shift: j.varianceDirection || "🌎 Diversity",
        shift_strength: j.varianceShiftStrength ?? 150,
        variance_schedule: "constant",
        cutoff_step: 8,
        total_steps: j.baseSteps,
        cutoff_strength: 0.1,
        seed: j.varianceSeedValue,
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

  // Con edición activa, el latent sale del encoder (resolución de la referencia,
  // que es lo que exige Qwen 2.1 para no desplazar la edición).
  if(qwenEditBase){
    delete g[N.LATENT_BASE];
    g[N.SAMPLER_BASE].inputs.latent_image = qwenEditBase.latent;
  }

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
    // Refinado facial opcional (reutiliza el modelo de la etapa Base) y
    // post-procesado cosmético sobre la imagen resultante.
    const baseFinalRef = appendFaceRefine(g, [N.DECODE_BASE, 0], j, {
      modelRef: g[N.SAMPLER_BASE].inputs.model,
      vaeRef: [N.VAE_BASE, 0],
      posRef: [N.POS_BASE, 0],
      negRef: [N.NEG_BASE, 0],
      cfg: j.baseCfg, sampler: j.baseSampler, scheduler: j.baseScheduler
    });
    g[N.SAVE_IMAGE].inputs.images = appendPostFx(g, baseFinalRef, j);
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
  g[N.UNET_REFINER].inputs.weight_dtype = resolveWeightDtype(j.refinerWeightDtype, j.refinerUnet);

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

  // Spectrum Refiner (Aceleración de difusión para Krea2 / Flux2 / Qwen)
  if(j.spectrumEnabled){
    const warmup = Math.min(3, Math.max(1, Math.floor(j.refinerSteps * 0.35)));
    g["swarm_spectrum_refiner"] = {
      class_type: "SwarmSpectrum",
      inputs: {
        w: j.spectrumW,
        m: 3,
        lam: j.spectrumLam,
        window_size: 2,
        flex_window: 0.25,
        warmup_steps: warmup,
        stop_caching_step: -1,
        steps: j.refinerSteps,
        calibrated: false,
        calibration_strength: 0.5,
        model: curRefinerModel
      },
      _meta: { title: "SwarmSpectrum (Refiner)" }
    };
    curRefinerModel = ["swarm_spectrum_refiner", 0];
  }

  if(isQwenRefiner && Number(j.refinerCfg) > 1){
    curRefinerModel = appendQwenCacheOff(g, "refiner", curRefinerModel);
  }

  g[N.SAMPLER_REFINER].inputs.model = curRefinerModel;

  g[N.CLIP_REFINER].inputs.clip_name = j.refinerClip;
  g[N.CLIP_REFINER].inputs.type = archClipType(famRefiner);

  g[N.POS_REFINER].inputs.text = (j.prompt || "").trim();
  // Krea 2 (Flux) no soporta prompt negativo, lo vaciamos. Qwen UC sí lo soporta.
  g[N.NEG_REFINER].inputs.text = isKreaRefiner ? "" : (j.negPrompt || "").trim();

  // Edición con Qwen 2.1 en la etapa Refiner: mantiene el latent del borrador
  // (VAEEncode de la etapa intermedia) y sustituye el conditioning por el encoder
  // de edición, que aporta los latentes de referencia.
  const qwenEditRefiner = (isQwenRefiner && j.qwenEdit?.enabled && (j.qwenEdit.stage === "refiner" || j.qwenEdit.stage === "both"))
    ? appendQwenEditStage(g, "refiner", { job: j, clipRef: [N.CLIP_REFINER, 0], vaeRef: [N.VAE_REFINER, 0], prompt: j.prompt, negative: j.negPrompt })
    : null;

  // Aviso: edición activada sin ninguna etapa Qwen compatible.
  if(j.qwenEdit?.enabled && !qwenEditBase && !qwenEditRefiner){
    const stage = j.qwenEdit.stage;
    const stageIsQwen = stage === "base" ? isQwenBase : (stage === "refiner" ? isQwenRefiner : (isQwenBase || isQwenRefiner));
    if(!stageIsQwen){
      console.warn("Edición Qwen 2.1 activada pero la etapa seleccionada no usa un modelo Qwen.");
    }
  }

  // RBG Smart Seed Variance Refiner (solo si Krea2 está en Refiner y no en Base)
  if(qwenEditRefiner){
    g[N.SAMPLER_REFINER].inputs.positive = [qwenEditRefiner.encoder, 0];
    g[N.SAMPLER_REFINER].inputs.negative = [qwenEditRefiner.encoder, 1];
  } else if(!isKreaBase && isKreaRefiner && varianceActive){
    g["rbg_variance_refiner"] = {
      class_type: "RBG_Smart_Seed_Variance",
      inputs: {
        variance_preset: j.variancePreset,
        fine_tune_variance: j.varianceFineTune ?? 46,
        model_type: "📸 Krea2 (SingleStream)",
        fade_curve: j.varianceFadeCurve || "Instant",
        noise_injection: j.varianceNoiseInjection || "Beginning Steps",
        protect_mode: j.protectMode,
        protect_regions: "",
        direction_shift: j.varianceDirection || "🌎 Diversity",
        shift_strength: j.varianceShiftStrength ?? 150,
        variance_schedule: "constant",
        cutoff_step: 4,
        total_steps: j.refinerSteps,
        cutoff_strength: 0.1,
        seed: j.varianceSeedValue,
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

  // Refinado facial opcional (reutiliza el modelo de la etapa Refiner) y
  // post-procesado cosmético sobre la imagen resultante.
  const refinerFinalRef = appendFaceRefine(g, [N.DECODE_REFINER, 0], j, {
    modelRef: g[N.SAMPLER_REFINER].inputs.model,
    vaeRef: [N.VAE_REFINER, 0],
    posRef: [N.POS_REFINER, 0],
    negRef: [N.NEG_REFINER, 0],
    cfg: j.refinerCfg, sampler: j.refinerSampler, scheduler: j.refinerScheduler
  });
  g[N.SAVE_IMAGE].inputs.images = appendPostFx(g, refinerFinalRef, j);
  g[N.SAVE_IMAGE].inputs.filename_prefix = j.filenamePrefix;

  return g;
}

// Metadata para variantes
CONFIG.variantMeta = function(seedValue, timeText){
  const realSeed = (seedValue !== null && seedValue !== undefined && seedValue !== "") 
    ? String(seedValue) 
    : ($("samplerSeed")?.value || "—");
  const realTime = (timeText && String(timeText).trim()) ? String(timeText).trim() : ($("time1")?.textContent?.replace("⏱", "")?.trim() || "—");

  const rows = [
    ["Tiempo", realTime],
    ["Semilla", realSeed],
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
  {
    const fr = getFaceRefineState();
    if(fr.enabled){
      rows.push(["FaceRefine", `on · steps ${fr.steps} · denoise ${fr.denoise.toFixed(2)} · ${fr.canvasSize}px · feather ${fr.feather}px`]);
    }
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

// URL directa al backend ComfyUI. Con serverUrl vacío la UI habla con el proxy
// local, que NO reenvía /free; para ese endpoint hay que ir al backend directo
// (mismo host, puerto DEFAULT_BACKEND_PORT).
function getDirectBackendUrl(){
  const s = (typeof server === "function") ? server() : "";
  if(s) return s; // servidor explícito: es el backend directo
  const host = window.location.hostname || "127.0.0.1";
  return `http://${host}:${DEFAULT_BACKEND_PORT}`;
}

// POST a un endpoint del backend tolerando el caso del proxy (que puede no
// reenviar la ruta, p.ej. /free). Si el proxy responde 404/405 reintenta directo.
async function postBackend(endpoint, body){
  const payload = JSON.stringify(body);
  const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body: payload };
  let r = await fetch(`${getServerUrl()}${endpoint}`, opts);
  if(r.ok) return r;
  // El proxy no reenvía esta ruta -> probamos el backend directo.
  if((r.status === 404 || r.status === 405) && !(typeof server === "function" && server())){
    r = await fetch(`${getDirectBackendUrl()}${endpoint}`, opts);
  }
  return r;
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
  } else if(nodeId === N.FACE_CROP){
    setRun("busy", "Detectando y recortando rostro...");
  } else if(nodeId === N.FACE_SAMPLER){
    setRun("busy", "Refinando rostro (FaceRefine)...");
  } else if(nodeId === N.FACE_STITCH){
    setRun("busy", "Recomponiendo rostro...");
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
  return `<img src="${escapeHtml(url)}">`;
};

// Estado y navegación de variantes (teclado / pantalla completa)
let currentVariantIndex = -1;
let _variantFsOverlay = null;
let _variantFsCleanup = null;
let _variantFsIndex = -1;

function getVariantCards(){
  const grid = $("variantGrid");
  if(!grid) return [];
  return Array.from(grid.querySelectorAll(".variant-card"));
}

function selectVariantByIndex(idx){
  const cards = getVariantCards();
  if(!cards.length) return null;
  if(idx < 0) idx = cards.length - 1;
  if(idx >= cards.length) idx = 0;
  currentVariantIndex = idx;
  const card = cards[idx];
  const url = `${server()}/view?filename=${encodeURIComponent(card.dataset.filename)}&subfolder=${encodeURIComponent(card.dataset.subfolder || "")}&type=${encodeURIComponent(card.dataset.type || "output")}`;
  const mediaData = { filename: card.dataset.filename, subfolder: card.dataset.subfolder || "", type: card.dataset.type || "output" };
  currentFinalMedia = { media: mediaData, ...mediaData, url };
  showImageView("final");
  extractWorkflowFromImage(url);
  return { card, url, index: idx, total: cards.length };
}

function navigateVariant(dir){
  const cards = getVariantCards();
  if(!cards.length) return null;
  if(currentVariantIndex < 0) currentVariantIndex = 0;
  return selectVariantByIndex(currentVariantIndex + dir);
}

// Visor a pantalla completa para una variante con navegación por flechas de teclado / swipe
function openVariantFullscreen(target){
  closeVariantFullscreen();

  const cards = getVariantCards();
  let initialUrl = "";
  if(typeof target === "number"){
    _variantFsIndex = target;
  } else if(target && target.nodeType === 1 && target.classList.contains("variant-card")){
    _variantFsIndex = cards.indexOf(target);
  } else if(typeof target === "string"){
    initialUrl = target;
    _variantFsIndex = cards.findIndex(c => {
      const cUrl = `${server()}/view?filename=${encodeURIComponent(c.dataset.filename)}&subfolder=${encodeURIComponent(c.dataset.subfolder || "")}&type=${encodeURIComponent(c.dataset.type || "output")}`;
      return cUrl === target || (c.dataset.filename && target.includes(encodeURIComponent(c.dataset.filename)));
    });
  }
  if(_variantFsIndex < 0){
    if(cards.length > 0) _variantFsIndex = 0;
    else if(!initialUrl) return;
  }

  const overlay = document.createElement("div");
  overlay.className = "variant-fs-overlay";

  const img = document.createElement("img");
  img.draggable = false;

  const closeBtn = document.createElement("button");
  closeBtn.className = "variant-fs-close";
  closeBtn.textContent = "✕";
  closeBtn.title = "Cerrar (Esc)";

  const dl = document.createElement("a");
  dl.className = "variant-fs-dl";
  dl.download = "";
  dl.textContent = "⬇ Descargar";
  dl.title = "Descargar";

  const prevBtn = document.createElement("button");
  prevBtn.className = "variant-fs-prev";
  prevBtn.textContent = "‹";
  prevBtn.title = "Anterior (Flecha izquierda)";

  const nextBtn = document.createElement("button");
  nextBtn.className = "variant-fs-next";
  nextBtn.textContent = "›";
  nextBtn.title = "Siguiente (Flecha derecha)";

  const counter = document.createElement("div");
  counter.className = "variant-fs-counter";

  overlay.appendChild(img);
  overlay.appendChild(closeBtn);
  overlay.appendChild(dl);
  overlay.appendChild(prevBtn);
  overlay.appendChild(nextBtn);
  overlay.appendChild(counter);
  document.body.appendChild(overlay);
  _variantFsOverlay = overlay;

  // Zoom/pan local (sin tocar el visor principal)
  let zoom = 1, panX = 0, panY = 0, dragging = false, sx = 0, sy = 0, spx = 0, spy = 0;
  const apply = () => { img.style.transform = `translate(${panX}px,${panY}px) scale(${zoom})`; };

  function renderFsImage(idx){
    const currentCards = getVariantCards();
    if(currentCards.length > 0){
      if(idx < 0) idx = currentCards.length - 1;
      if(idx >= currentCards.length) idx = 0;
      _variantFsIndex = idx;
      currentVariantIndex = idx;
      const c = currentCards[idx];
      const fn = c.dataset.filename || "";
      const sf = c.dataset.subfolder || "";
      const tp = c.dataset.type || "output";
      const u = `${server()}/view?filename=${encodeURIComponent(fn)}&subfolder=${encodeURIComponent(sf)}&type=${encodeURIComponent(tp)}`;
      img.src = u;
      dl.href = u;
      dl.download = `kreaqwen_${fn || 'variante.png'}`;
      counter.textContent = `${idx + 1} / ${currentCards.length}`;
      prevBtn.style.display = currentCards.length > 1 ? "flex" : "none";
      nextBtn.style.display = currentCards.length > 1 ? "flex" : "none";
      counter.style.display = currentCards.length > 1 ? "block" : "none";
    } else if(initialUrl){
      img.src = initialUrl;
      dl.href = initialUrl;
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
      counter.style.display = "none";
    }
    zoom = 1; panX = 0; panY = 0;
    apply();
  }

  renderFsImage(_variantFsIndex >= 0 ? _variantFsIndex : 0);

  const onWheel = (e) => {
    e.preventDefault();
    const old = zoom;
    zoom = Math.max(1, Math.min(20, zoom * (e.deltaY < 0 ? 1.12 : 0.88)));
    const rect = overlay.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    const ratio = zoom / old;
    panX += mx * (1 - ratio);
    panY += my * (1 - ratio);
    apply();
  };
  const onDown = (e) => {
    if(e.target !== img && e.target !== overlay) return;
    if(zoom <= 1) return;
    e.preventDefault();
    dragging = true; sx = e.clientX; sy = e.clientY; spx = panX; spy = panY;
    overlay.classList.add("dragging");
  };
  const onMove = (e) => {
    if(!dragging) return;
    panX = spx + (e.clientX - sx);
    panY = spy + (e.clientY - sy);
    apply();
  };
  const onUp = () => {
    if(!dragging) return;
    dragging = false;
    overlay.classList.remove("dragging");
  };
  const onKey = (e) => {
    if(e.key === "Escape"){
      closeVariantFullscreen();
    } else if(e.key === "ArrowLeft"){
      e.preventDefault();
      renderFsImage(_variantFsIndex - 1);
    } else if(e.key === "ArrowRight"){
      e.preventDefault();
      renderFsImage(_variantFsIndex + 1);
    }
  };
  const onClick = (e) => { if(e.target === overlay) closeVariantFullscreen(); };
  const onClose = (e) => { e.stopPropagation(); closeVariantFullscreen(); };
  const onPrev = (e) => { e.stopPropagation(); renderFsImage(_variantFsIndex - 1); };
  const onNext = (e) => { e.stopPropagation(); renderFsImage(_variantFsIndex + 1); };

  // Touch swipe en móvil dentro del overlay
  let tStartX = 0, tStartY = 0, tStartT = 0;
  const onTouchStart = (e) => {
    if(e.touches.length === 1){
      tStartX = e.touches[0].clientX;
      tStartY = e.touches[0].clientY;
      tStartT = Date.now();
    }
  };
  const onTouchEnd = (e) => {
    if(e.changedTouches.length === 1 && zoom <= 1){
      const dx = e.changedTouches[0].clientX - tStartX;
      const dy = e.changedTouches[0].clientY - tStartY;
      const dt = Date.now() - tStartT;
      if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 800){
        renderFsImage(_variantFsIndex + (dx < 0 ? 1 : -1));
      }
    }
  };

  overlay.addEventListener("wheel", onWheel, { passive: false });
  overlay.addEventListener("mousedown", onDown);
  overlay.addEventListener("click", onClick);
  closeBtn.addEventListener("click", onClose);
  prevBtn.addEventListener("click", onPrev);
  nextBtn.addEventListener("click", onNext);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  overlay.addEventListener("touchstart", onTouchStart, { passive: true });
  overlay.addEventListener("touchend", onTouchEnd, { passive: true });
  document.addEventListener("keydown", onKey);

  _variantFsCleanup = () => {
    overlay.removeEventListener("wheel", onWheel);
    overlay.removeEventListener("mousedown", onDown);
    overlay.removeEventListener("click", onClick);
    closeBtn.removeEventListener("click", onClose);
    prevBtn.removeEventListener("click", onPrev);
    nextBtn.removeEventListener("click", onNext);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    overlay.removeEventListener("touchstart", onTouchStart);
    overlay.removeEventListener("touchend", onTouchEnd);
    document.removeEventListener("keydown", onKey);
  };
}

function closeVariantFullscreen(){
  if(_variantFsCleanup){ _variantFsCleanup(); _variantFsCleanup = null; }
  if(_variantFsOverlay){ _variantFsOverlay.remove(); _variantFsOverlay = null; }
}

// Galería de variantes
function addToVariantGallery(media, seedValue, timeText) {
  if(!media || !media.filename) return;
  const box = $("variantGalleryBox");
  const grid = $("variantGrid");
  if(!box || !grid) return;
  box.style.display = "block";

  const meta = CONFIG.variantMeta ? CONFIG.variantMeta(seedValue, timeText) : null;
  const card = buildVariantCard(grid, box, media, seedValue, timeText, null, null, "var", meta);
  const url = mediaUrl(media);

  const icons = card.querySelector(".variant-icons");
  if(icons){
    const fs = document.createElement("button");
    fs.type = "button";
    fs.className = "variant-fs-btn";
    fs.title = "Ver a pantalla completa";
    fs.textContent = "⛶";
    fs.style.cssText = "background:none;border:none;color:var(--accent);cursor:pointer;font-size:13px;line-height:1;padding:0 2px;";
    fs.addEventListener("click", (e) => {
      e.stopPropagation();
      openVariantFullscreen(card);
    });
    icons.insertBefore(fs, icons.firstChild);

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
    if(e.target.closest(".variant-seed-display") || e.target.closest("a") || e.target.closest(".variant-del-btn") || e.target.closest(".variant-fs-btn")) return;
    // Incluir la clave "media": sendOutputToExternalUI exige mediaObj.media.filename.
    const mediaData = { filename: card.dataset.filename, subfolder: card.dataset.subfolder || "", type: card.dataset.type || "output" };
    currentFinalMedia = { media: mediaData, ...mediaData, url };
    const cards = getVariantCards();
    currentVariantIndex = cards.indexOf(card);
    showImageView("final");
    extractWorkflowFromImage(url);
  });

  variantCounter++;
  if($("variantCount")) $("variantCount").textContent = `(${variantCounter})`;
}

// --- HISTORIAL DE IMÁGENES (IndexedDB) ---
// Portado de krea2.js. Guarda las imágenes generadas como dataURL en IndexedDB
// (thumb + full) para que el historial sobreviva recargas sin depender del backend.
const GALLERY_DB_NAME = 'kreaqwen_gallery_db';
const GALLERY_STORE = 'images';
const GALLERY_MAX_RECORDS = 500;

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
    tx.onerror = () => reject(tx.error);
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

async function getImageHash(base64Str){
  try {
    if(!crypto?.subtle?.digest) throw new Error("crypto.subtle no disponible (HTTP)");
    const msgBuffer = new TextEncoder().encode(base64Str + "|" + base64Str.length);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  } catch(e){
    return "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

function resizeImageForStorage(base64Str, maxWidth = 260){
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({
        dataUrl: canvas.toDataURL('image/jpeg', 0.78),
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => resolve(null);
    img.src = base64Str;
  });
}

async function _evictOldGalleryEntries(){
  try {
    const all = await dbGetAllImages();
    if(all.length <= GALLERY_MAX_RECORDS) return;
    all.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    const toRemove = all.slice(0, all.length - GALLERY_MAX_RECORDS);
    for(const item of toRemove){
      if(item.hash) await dbDeleteImage(item.hash);
    }
  } catch(e){ console.warn("Eviction de galería falló:", e); }
}

function createGalleryItemElement(item){
  const div = document.createElement("div");
  div.className = "gallery-item";
  if(item.hash) div.dataset.hash = item.hash;

  const hasRes = !!(item.width && item.height);
  const infoHtml = hasRes
    ? `<div class="info-tag">${parseInt(item.width, 10)}×${parseInt(item.height, 10)} · ${escapeHtml(getAspectRatioString(item.width, item.height))}</div>`
    : "";

  if(!/^data:image\/(png|jpe?g|webp);/.test(item.thumb)){
    console.warn("Historial: thumbnail inválido descartado", item.hash);
    return div;
  }
  div.innerHTML = `<button class="del-btn" title="Eliminar del historial">×</button><img src="${item.thumb}">${infoHtml}`;

  div.querySelector(".del-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteFromGallery(item.hash);
  });

  div.addEventListener("click", () => {
    const sourceData = item.full || item.thumb;
    loadRefImage(sourceData);
    document.querySelectorAll(".gallery-item").forEach(i => i.classList.remove("selected"));
    div.classList.add("selected");
  });

  div.setAttribute("draggable", "true");
  div.addEventListener("dragstart", (e) => {
    const dataUrl = item.full || item.thumb;
    if(!dataUrl){ e.preventDefault(); return; }
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/uri-list", dataUrl);
    e.dataTransfer.setData("text/plain", dataUrl);
    const fakeName = `kreaqwen_history_${item.hash || Date.now()}.png`;
    e.dataTransfer.setData(LTXV_MEDIA_MIME, JSON.stringify({
      filename: fakeName,
      subfolder: "",
      type: "input",
      _dataUrl: dataUrl,
    }));
    try { e.dataTransfer.setData("DownloadURL", `image/png:${fakeName}:${dataUrl}`); } catch(_){}
  });
  return div;
}

async function addToGallery(base64Data){
  try {
    const resized = await resizeImageForStorage(base64Data, 260);
    if(!resized){ return; }
    const hash = await getImageHash(resized.dataUrl);
    const record = { hash, thumb: resized.dataUrl, full: base64Data, width: resized.width, height: resized.height, ts: Date.now() };
    await dbPutImage(record);

    const grid = $("galleryGrid");
    if(grid){
      const hint = grid.querySelector(".hint");
      if(hint) hint.remove();
      const existing = grid.querySelector(`[data-hash="${hash}"]`);
      if(existing) existing.remove();
      grid.prepend(createGalleryItemElement(record));
    }
    // Depuración de entradas antiguas en segundo plano
    _evictOldGalleryEntries();
  } catch(err){
    console.warn("No se pudo guardar en galería:", err);
    log("⚠️ No se pudo guardar la imagen en el historial: " + err.message, "l-err");
  }
}

async function renderGallery(){
  const grid = $("galleryGrid");
  if(!grid) return;
  let history = [];
  try { history = await dbGetAllImages(); }
  catch(e){ console.warn("No se pudo leer el historial de imágenes:", e); }

  history.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  grid.innerHTML = "";

  if(history.length === 0){
    grid.innerHTML = `<div class="hint" style="grid-column:1/-1;">sin imágenes guardadas</div>`;
    return;
  }

  history.forEach((item) => {
    grid.appendChild(createGalleryItemElement(item));
  });
}

async function deleteFromGallery(hash){
  try {
    await dbDeleteImage(hash);
    const grid = $("galleryGrid");
    const el = grid?.querySelector(`[data-hash="${hash}"]`);
    if(el) el.remove();
    if(grid && grid.children.length === 0){
      grid.innerHTML = `<div class="hint" style="grid-column:1/-1;">sin imágenes guardadas</div>`;
    }
  } catch(e){
    console.warn("Fallo borrando de galería:", e);
    await renderGallery();
  }
}

async function clearGallery(){
  if(!confirm("¿Vaciar todo el historial de imágenes? No se puede deshacer.")) return;
  try { await dbClearImages(); } catch(e){ console.warn(e); }
  await renderGallery();
  log("🗑️ Historial de imágenes vaciado.", "l-ok");
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

  // Guardar en el historial de imágenes (fetch -> dataURL -> IndexedDB).
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const reader = new FileReader();
    reader.onload = (ev) => addToGallery(ev.target.result);
    reader.readAsDataURL(blob);
  } catch(e){ console.warn("No se pudo añadir al historial:", e); }

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
  // common.js ya vació pendingSeeds/handledPrompts/timers; solo estado propio.
  currentPromptId = null;
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
  newImg.style.cssText = "display:block;max-width:100%;max-height:45vh;width:auto;height:auto;object-fit:contain;user-select:none;-webkit-user-drag:none;pointer-events:none;transform-origin:center center;";
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

const MAX_REF_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function handleRefFile(f){
  if(!f) return;
  if(f.size && f.size > MAX_REF_SIZE_BYTES){
    log(`⚠️ El archivo es demasiado pesado (máx 25 MB): ${(f.size / 1024 / 1024).toFixed(1)} MB`, "l-err");
    return;
  }
  if(f.type && !f.type.startsWith("image/")){
    log("⚠️ Formato de archivo no soportado. Debe ser una imagen.", "l-err");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    if(typeof addToGallery === "function") addToGallery(e.target.result);
    loadRefImage(e.target.result);
  };
  reader.readAsDataURL(f);
}

// --- EDICIÓN CON QWEN 2.1 ---
// Qwen 2.1 es también un modelo de edición (img2img / faceswap). Se usa el nodo
// nativo TextEncodeQwenImage21, que ve las referencias por el text encoder y las
// injerta como latentes de referencia en el conditioning. Las imágenes entran por
// SwarmLoadImageB64 (base64 -> IMAGE), sin necesidad de subirlas al backend.
// IMPORTANTE: el input Autogrow `images` se serializa en formato API con la clave
// PLANA "images.image_N" (no un dict anidado); verificado contra este ComfyUI.
let qwenEditExtraRefs = [];

// Convierte el src de una imagen (dataURL o URL del backend) en base64 sin prefijo,
// que es lo que espera SwarmLoadImageB64 (base64.b64decode directo).
async function imageSrcToBase64(src){
  if(!src) return null;
  if(src.startsWith("data:")){
    const comma = src.indexOf(",");
    return comma >= 0 ? src.slice(comma + 1) : null;
  }
  try {
    const r = await fetch(src);
    const blob = await r.blob();
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => { const s = String(fr.result); const c = s.indexOf(","); resolve(c >= 0 ? s.slice(c + 1) : null); };
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch(e){
    console.warn("No se pudo convertir la referencia a base64:", e);
    return null;
  }
}

// Resuelve las referencias del job a base64 (async, antes de construir el grafo).
async function resolveQwenEditRefs(job){
  const qe = job?.qwenEdit;
  if(!qe || !qe.enabled) return;
  qe.refB64 = await imageSrcToBase64(qe.refSrc);
  const list = Array.isArray(qe.extraRefSrcs) ? qe.extraRefSrcs : [];
  qe.extraRefB64 = (await Promise.all(list.map(imageSrcToBase64))).filter(Boolean);
}

function updateQwenEditRefStatus(){
  const st = $("qwenEditRefStatus");
  const ex = $("qwenEditExtraStatus");
  const hasRef = getRefImageSrc();
  if(st) st.textContent = hasRef ? "1 imagen de referencia cargada" : "sin imagen de referencia";
  if(ex) ex.textContent = qwenEditExtraRefs.length
    ? `${qwenEditExtraRefs.length} referencia(s) extra`
    : "sin referencias extra";
}

// --- METADATOS DE IMAGEN (cargar parámetros) ---
// Lee el chunk tEXt "prompt"/"workflow" del PNG (ComfyUI guarda el grafo API en
// extra_pnginfo) y restaura los controles de KreaQwen.
function extractWorkflowFromImage(url){
  return fetch(url).then(r => r.arrayBuffer()).then(buf => {
    const bytes = new Uint8Array(buf);
    if(bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return null;
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
        if(keyword === "prompt" || keyword === "workflow"){
          workflowRaw = new TextDecoder("utf-8").decode(bytes.slice(nullPos + 1, dataStart + len));
          if(keyword === "prompt") break; // el chunk "prompt" trae el grafo API
        }
      }
      if(type === "IEND") break;
      pos = pos + 12 + len;
    }
    if(workflowRaw == null) return null;
    let workflow;
    try { workflow = JSON.parse(workflowRaw); }
    catch(e1){
      const first = workflowRaw.indexOf("{");
      const last = workflowRaw.lastIndexOf("}");
      if(first !== -1 && last > first){
        try { workflow = JSON.parse(workflowRaw.slice(first, last + 1)); }
        catch(e2){ console.warn("No se pudo parsear workflow de metadatos:", e2.message); return null; }
      } else {
        console.warn("No se pudo parsear workflow de metadatos:", e1.message);
        return null;
      }
    }
    applyKreaQwenWorkflow(workflow);
    return true;
  }).catch(e => { console.warn("No se pudo leer metadatos:", e.message); return null; });
}

// Busca un nodo por su id conocido dentro del grafo API.
function _gNode(g, id){ return g && g[id]; }

function applyKreaQwenWorkflow(workflow){
  const g = workflow;
  if(!g || typeof g !== "object"){ log("⚠️ Metadatos con formato inesperado.", "l-warn"); return; }
  const applied = [];

  const set = (id, val, cb) => {
    const el = $(id);
    if(el && val != null){ el.value = val; if(cb) cb(el); }
  };
  // Selecciona una opción cuyo path coincida (soporta prefijos de carpeta).
  const setModel = (id, name) => {
    const sel = $(id);
    if(!sel || !name) return false;
    for(const opt of sel.options){
      if(opt.value === name || name.endsWith("/" + opt.value) || opt.value.endsWith("/" + name)){
        opt.selected = true; return true;
      }
    }
    return false;
  };

  // --- Prompt / Negativo ---
  const posBase = _gNode(g, N.POS_BASE) || Object.values(g).find(n => n.class_type === "CLIPTextEncode");
  const negBase = _gNode(g, N.NEG_BASE);
  if(posBase?.inputs?.text != null){ set("prompt", posBase.inputs.text); applied.push("prompt"); }
  if(negBase?.inputs?.text != null){ set("negPrompt", negBase.inputs.text); applied.push("negativo"); }

  // --- Combinación de arquitecturas ---
  const unetBaseFam = unetArchFamily(g[N.UNET_BASE]?.inputs?.unet_name);
  const unetRefFam = unetArchFamily(g[N.UNET_REFINER]?.inputs?.unet_name);
  const hasRefiner = !!g[N.UNET_REFINER];
  let combo = "krea_qwen";
  if(!hasRefiner) combo = "base_only";
  else if(unetBaseFam === "qwen21" && unetRefFam === "qwen21") combo = "qwen_qwen";
  else if(unetBaseFam === "krea2" && unetRefFam === "krea2") combo = "krea_krea";
  else if(unetBaseFam === "qwen21" && unetRefFam === "krea2") combo = "qwen_krea";
  else if(unetBaseFam === "krea2" && unetRefFam === "qwen21") combo = "krea_qwen";
  if($("comboMode")) $("comboMode").value = combo;
  applied.push("modo");

  // --- Modelos / VAE / CLIP ---
  if(setModel("baseUnetSelect", g[N.UNET_BASE]?.inputs?.unet_name)) applied.push("modelo base");
  if(hasRefiner && setModel("refinerUnetSelect", g[N.UNET_REFINER]?.inputs?.unet_name)) applied.push("modelo refiner");
  setModel("baseClipSelect", g[N.CLIP_BASE]?.inputs?.clip_name);
  if(hasRefiner) setModel("refinerClipSelect", g[N.CLIP_REFINER]?.inputs?.clip_name);
  setModel("baseVaeSelect", g[N.VAE_BASE]?.inputs?.vae_name);
  if(hasRefiner) setModel("refinerVaeSelect", g[N.VAE_REFINER]?.inputs?.vae_name);
  if(g[N.UNET_BASE]?.inputs?.weight_dtype && $("baseWeightDtype")) $("baseWeightDtype").value = g[N.UNET_BASE].inputs.weight_dtype;
  if(hasRefiner && g[N.UNET_REFINER]?.inputs?.weight_dtype && $("refinerWeightDtype")) $("refinerWeightDtype").value = g[N.UNET_REFINER].inputs.weight_dtype;

  // --- Attention backends ---
  const attnBase = Object.values(g).find(n => n.class_type === "ModelAttentionBackend" && JSON.stringify(n.inputs.model||[]).includes(N.UNET_BASE));
  if($("baseAttentionBackend")) $("baseAttentionBackend").value = attnBase?.inputs?.attention || "none";
  const attnRef = Object.values(g).find(n => n.class_type === "ModelAttentionBackend" && JSON.stringify(n.inputs.model||[]).includes(N.UNET_REFINER));
  if($("refinerAttentionBackend")) $("refinerAttentionBackend").value = attnRef?.inputs?.attention || "none";

  // --- Samplers Base / Refiner ---
  const sb = g[N.SAMPLER_BASE]?.inputs || {};
  set("baseSteps", sb.steps); set("baseCfg", sb.cfg);
  set("baseSamplerName", sb.sampler_name); set("baseSchedulerName", sb.scheduler);
  if(sb.seed != null && sb.seed >= 0){
    set("samplerSeed", sb.seed);
    $("segSamplerFixed")?.classList.add("on");
    $("segSamplerRandom")?.classList.remove("on");
    if($("samplerSeed")) $("samplerSeed").disabled = false;
    applied.push("semilla");
  }
  const sr = g[N.SAMPLER_REFINER]?.inputs || {};
  set("refinerSteps", sr.steps); set("refinerCfg", sr.cfg);
  set("refinerSamplerName", sr.sampler_name); set("refinerSchedulerName", sr.scheduler);
  set("refinerDenoise", sr.denoise, (el) => { if($("refinerDenoiseVal")) $("refinerDenoiseVal").textContent = parseFloat(el.value).toFixed(2); });

  // --- Refiner / Upscale activos ---
  if($("refinerEnabled")) $("refinerEnabled").checked = hasRefiner;
  const hasUpscale = !!g[N.UPSCALE_LOADER] || !!g[N.IMAGE_SCALE];
  if($("upscaleEnabled")) $("upscaleEnabled").checked = hasUpscale;
  setModel("upscaleModelSelect", g[N.UPSCALE_LOADER]?.inputs?.model_name);
  if(g[N.IMAGE_SCALE]?.inputs){
    const tW = g[N.IMAGE_SCALE].inputs.width, tH = g[N.IMAGE_SCALE].inputs.height;
    if(tW && tH && g[N.LATENT_BASE]?.inputs){
      const bw = g[N.LATENT_BASE].inputs.width, bh = g[N.LATENT_BASE].inputs.height;
      if(bw && bh){
        const factor = Math.min(3, Math.max(1, (tW / bw)));
        set("upscaleFactor", Math.round(factor * 100) / 100, (el) => { if($("upscaleFactorVal")) $("upscaleFactorVal").textContent = `${parseFloat(el.value).toFixed(2)}x`; });
      }
    }
  }

  // --- Resolución ---
  if(g[N.LATENT_BASE]?.inputs){
    const w = g[N.LATENT_BASE].inputs.width, h = g[N.LATENT_BASE].inputs.height;
    if(w && h && $("mpSlider")){
      const mp = Math.min(Math.max((w * h) / 1_000_000, parseFloat($("mpSlider").min)), parseFloat($("mpSlider").max));
      $("mpSlider").value = Math.round(mp * 10) / 10;
      if($("mpVal")) $("mpVal").textContent = parseFloat($("mpSlider").value).toFixed(2);
      const ar = w / h;
      const ratios = {
        "1:1 (Square)": 1, "2:3 (Portrait Photo)": 2/3, "3:2 (Photo)": 3/2,
        "3:4 (Portrait Standard)": 3/4, "4:3 (Standard)": 4/3,
        "9:16 (Portrait Widescreen)": 9/16, "16:9 (Widescreen)": 16/9, "21:9 (Ultrawide)": 21/9
      };
      let best = "", bestDiff = Infinity;
      for(const [label, val] of Object.entries(ratios)){
        const diff = Math.abs(ar - val);
        if(diff < bestDiff){ bestDiff = diff; best = label; }
      }
      if($("aspectRatio")) $("aspectRatio").value = best;
    }
  }

  // --- Prefix de archivo ---
  set("filenamePrefix", g[N.SAVE_IMAGE]?.inputs?.filename_prefix);

  // --- LoRAs Base / Refiner ---
  const readLoras = (prefix, target) => {
    let count = 0;
    for(let i = 1; i <= 4; i++){
      const node = g[`${prefix}${i}`];
      if(node?.inputs?.lora_name){
        target[i-1] = { lora: node.inputs.lora_name, strength: node.inputs.strength_model ?? 1, on: true };
        count++;
      } else if(target[i-1]){
        target[i-1] = { lora: "", strength: 1, on: false };
      }
    }
    return count;
  };
  readLoras("base_lora_", baseLoras);
  readLoras("refiner_lora_", refinerLoras);
  renderLoraGroup("baseLoraList", baseLoras, "LoRA Base", saveLoraStates);
  renderLoraGroup("refinerLoraList", refinerLoras, "LoRA Refiner", saveLoraStates);
  saveLoraStates();
  applied.push("LoRAs");

  // --- Variance (RBG) ---
  const varNode = Object.values(g).find(n => n.class_type === "RBG_Smart_Seed_Variance");
  if(varNode?.inputs){
    set("variancePreset", varNode.inputs.variance_preset);
    set("protectMode", varNode.inputs.protect_mode);
    set("varianceFineTune", varNode.inputs.fine_tune_variance, (el) => { if($("varianceFineTuneVal")) $("varianceFineTuneVal").textContent = el.value; });
    set("varianceDirection", varNode.inputs.direction_shift);
    set("varianceShiftStrength", varNode.inputs.shift_strength, (el) => { if($("varianceShiftStrengthVal")) $("varianceShiftStrengthVal").textContent = el.value; });
    set("varianceNoiseInjection", varNode.inputs.noise_injection);
    set("varianceFadeCurve", varNode.inputs.fade_curve);
    const seed = varNode.inputs.seed;
    if(seed != null && seed >= 0){
      set("varianceSeed", seed);
      $("segVarianceFixed")?.classList.add("on");
      $("segVarianceRandom")?.classList.remove("on");
      if($("varianceSeed")) $("varianceSeed").disabled = false;
    }
    applied.push("variance");
  }

  // --- Edición Qwen 2.1 ---
  const qwenEnc = Object.values(g).find(n => n.class_type === "TextEncodeQwenImage21");
  if(qwenEnc?.inputs){
    if($("qwenEditEnabled")) $("qwenEditEnabled").checked = true;
    set("qwenEditPrompt", qwenEnc.inputs.prompt);
    set("qwenEditResolution", qwenEnc.inputs.resolution);
    if($("qwenEditResolutionVal")) $("qwenEditResolutionVal").textContent = (parseInt(qwenEnc.inputs.resolution,10) === 0) ? "auto" : qwenEnc.inputs.resolution;
    // La imagen de referencia no se puede reconstruir de forma fiable; se avisa.
    log("ℹ️ Edición Qwen 2.1 detectada: revisa/carga de nuevo la imagen de referencia.", "l-info");
    applied.push("edición Qwen");
  }

  // --- Refinado facial (H3 FaceRefine) ---
  const frCrop = g[N.FACE_CROP];
  const frSampler = g[N.FACE_SAMPLER];
  if(frCrop?.class_type === "H3FaceTrackCrop"){
    const fr = loadFaceRefine();
    fr.enabled = true;
    if(frCrop.inputs.canvas_width != null) fr.canvasSize = parseInt(frCrop.inputs.canvas_width, 10);
    if(frCrop.inputs.select != null) fr.select = frCrop.inputs.select;
    if(frSampler?.inputs){
      if(frSampler.inputs.steps != null) fr.steps = parseInt(frSampler.inputs.steps, 10);
      if(frSampler.inputs.denoise != null) fr.denoise = parseFloat(frSampler.inputs.denoise);
    }
    if(g[N.FACE_STITCH]?.inputs?.feather != null) fr.feather = parseInt(g[N.FACE_STITCH].inputs.feather, 10);
    setFaceRefineUI(fr);
    saveFaceRefine(fr);
    applied.push("FaceRefine");
  }

  // --- Post-procesado (ProPost) ---
  const postTypes = {
    ProPostVignette: { id: "vigEnabled", params: { intensity: "vigIntensity", center_x: "vigCX", center_y: "vigCY" } },
    ProPostFilmGrain: { id: "grainEnabled", params: { grain_type: "grainType", grain_sat: "grainSat", grain_power: "grainPower", shadows: "grainShadows", highs: "grainHighs", scale: "grainScale", sharpen: "grainSharpen" } },
    ProPostRadialBlur: { id: "radialEnabled", params: { blur_strength: "radialStrength", center_x: "radialCX", center_y: "radialCY", focus_spread: "radialSpread", steps: "radialSteps" } },
    ProPostApplyLUT: { id: "lutEnabled", params: { lut_name: "lutName", strength: "lutStrength" } },
  };
  Object.values(g).forEach(node => {
    const conf = node?.class_type && postTypes[node.class_type];
    if(!conf) return;
    if($(conf.id)) $(conf.id).checked = true;
    for(const [param, ctrl] of Object.entries(conf.params)){
      if(node.inputs[param] != null) set(ctrl, node.inputs[param]);
    }
    if(node.class_type === "ProPostApplyLUT" && node.inputs.log != null && $("lutLog")) $("lutLog").checked = !!node.inputs.log;
    if(node.class_type === "ProPostFilmGrain" && node.inputs.gray_scale != null && $("grainGray")) $("grainGray").checked = !!node.inputs.gray_scale;
    applied.push("post-fx");
  });
  if(typeof updateQwenEditRefStatus === "function") updateQwenEditRefStatus();
  if(typeof updateDimensionHints === "function") updateDimensionHints();
  if(typeof scheduleSaveKreaQwenSettings === "function") scheduleSaveKreaQwenSettings();

  log(`📋 Parámetros restaurados de metadatos (${applied.join(", ")}).`, "l-ok");
}

// Generación individual
async function runSingleGeneration(index){
  if(!activeJob) return; // guard: stop puede dejar la cola vacía entre el setTimeout y la ejecución
  try {
    const job = activeJob || snapshotJob();
    const seedUsed = (job.seedMode === "random") ? randomSeed() : job.seedValue;
    job.seedValue = seedUsed;
    // Semilla de varianza: en modo "Aleatoria" hay que resolver una semilla real
    // por generación. Enviar -1 no basta: el nodo hace torch.manual_seed(-1), que
    // es determinista y produce SIEMPRE el mismo patrón de varianza.
    if(job.varianceSeedMode === "random") job.varianceSeedValue = randomSeed();
    log(`⏳ Preparando grafo para variante ${index + 1}/${totalBatchSize}...`, "l-info");
    await resolveQwenEditRefs(job);
    const graph = buildGraph(job);

    log(`🚀 Enviando variante ${index + 1}/${totalBatchSize} a ComfyUI...`, "l-info");
    const srv = getServerUrl();
    const r = await fetch(`${srv}/prompt`, {
      signal: AbortSignal.timeout(60000), // colgado → activeJob fantasma
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

    log(`📡 Recibido por ComfyUI (Prompt: ${data.prompt_id.slice(0, 8)}...). Procesando...`, "l-ok");
    pendingSeeds[data.prompt_id] = seedUsed;
    currentPromptId = data.prompt_id;
    startTimer(data.prompt_id, 1);
    pollFallback(data.prompt_id);
  } catch(err){
    log(`Error en variante ${index + 1}: ${err.message}`, "l-err");
    finishCurrentJob();
    // Drenar la cola: sin esto, un fallo de una variante deja los jobs
    // en espera fantasma (onBatchComplete nunca dispara).
    if(!activeJob && jobQueue.length > 0){
      const nextJob = jobQueue.shift();
      updateQueueUI();
      log(`⏭️ Iniciando siguiente job de la cola (${jobQueue.length} restantes)...`, "l-info");
      startJob(nextJob);
    }
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
  if(typeof saveKreaQwenSettings === "function") saveKreaQwenSettings();
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
      enableStopButtons(false);
      if(jobQueue.length > 0){
        const nextJob = jobQueue.shift();
        updateQueueUI();
        log(`⏭️ Iniciando siguiente job de la cola (${jobQueue.length} restantes)...`, "l-info");
        startJob(nextJob);
      }
      // cae al render de abajo con el estado ya actualizado
    }
  } else {
    queueIdleCount = 0;
  }

  const activeNow = activeJob; // puede haber cambiado por la recuperación
  if($("queueWebuiSummary")) $("queueWebuiSummary").textContent = `${jobQueue.length} en espera`;
  if($("queueWebuiDetail")) $("queueWebuiDetail").textContent = activeNow
    ? `▶ Job #${activeNow.id} · Var ${currentBatchIndex + 1}/${totalBatchSize}`
    : "En reposo";
  if($("queueTotalNum")) $("queueTotalNum").textContent = `${jobQueue.length + (activeNow ? 1 : 0)}`;
  // Render del estado del servidor ComfyUI (alimentado por el poll de common.js);
  // sin esto el panel mostraba "0 en espera · 0 en GPU" permanente.
  if($("queueServerSummary")) $("queueServerSummary").textContent = `${serverQueueState.pending} en espera`;
  if($("queueServerDetail")) $("queueServerDetail").textContent = `${serverQueueState.running} en GPU · ${serverQueueState.pending} en cola ComfyUI`;
}

function finishCurrentJob(){
  activeJob = null;
  updateQueueUI();
  enableStopButtons(false);
  setRun("idle", "en reposo");
  // Preview de muestreo obsoleto al quedar en reposo (final de job, error o stop).
  // onClearPreview de kreaqwen respeta currentFinalMedia/currentBaseMedia:
  // solo esconde el preview si no hay imagen final ya cargada.
  clearPreview();
}

// --- EVOLVE / TRANSMUTAR PROMPT (portado de krea2.js) ---
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

// KreaQwen no usa el nodo TextGenerateLTX2Prompt de LTXV: la cadena de mejora
// solo tiene sentido en modo LLM. Limitamos el selector y ocultamos los
// controles exclusivos de LTX2 (patrón de krea2.js/ltxv.js).
(function initKreaQwenEnhancerUI(){
  const chain = $("enhancerChainMode");
  if(chain){
    chain.innerHTML = `
      <option value="off">Desactivado</option>
      <option value="ollama">LLM (Ollama / llama.cpp)</option>
    `;
    chain.value = "ollama";
  }
  const ltx2Controls = ["ltx2Temperature", "ltx2Seed", "ltx2PreviewText"];
  for(const id of ltx2Controls){
    const el = $(id);
    const row = el?.closest(".enhancer-row");
    if(row) row.style.display = "none";
  }
  const ltx2Labels = document.querySelectorAll(".enhancer-row label");
  for(const lbl of ltx2Labels){
    if(lbl.textContent.includes("LTX2")){
      const row = lbl.closest(".enhancer-row");
      if(row) row.style.display = "none";
    }
  }
})();

function getRefImageSrc(){
  const el = $("refImg");
  if(!el || !el.src || el.src === window.location.href) return null;
  return el.src;
}

// --- ENHANCER (texto + visión) vía streamOllamaGenerate (common.js) ---
$("btnEnhance")?.addEventListener("click", async () => {
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
    const src = getRefImageSrc();
    if(!src){ log("⚠️ Modo visión: carga una imagen de referencia primero", "l-err"); return; }
    try {
      payload.images = [await imageToResizedBase64(src, 768)];
    } catch(e){
      log("No se pudo leer la imagen: " + (e.message || e), "l-err");
      return;
    }
  }

  const btn = $("btnEnhance");
  btn.disabled = true;
  btn.textContent = "Mejorando...";
  $("enhancerOutput").value = "";
  if($("enhancerMetaInfo")) $("enhancerMetaInfo").textContent = "";
  try {
    const { text, elapsedMs } = await streamOllamaGenerate(payload, $("enhancerOutput"));
    const timeStr = fmtMs(elapsedMs);
    $("enhancerOutput").value = text;
    if($("enhancerMetaInfo")) $("enhancerMetaInfo").textContent = `${model} · ${mode} · ${styleKey} · ${timeStr}`;
    log(`Prompt mejorado en ${timeStr} (${model}, ${mode}, ${styleKey}). Pulsa 'Usar como prompt' para aplicarlo.`, "l-ok");
  } catch(e){
    log("Error al mejorar: " + e.message, "l-err");
    $("enhancerOutput").value = "Error: " + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Mejorar prompt";
  }
});

// --- CAPTION / VISIÓN (Qwen VLM) ---
$("btnCaption")?.addEventListener("click", async () => {
  const model = $("enhancerModel").value;
  if(!model){ log("Selecciona un modelo de LLM (Ollama / llama.cpp)", "l-err"); return; }
  const src = getRefImageSrc();
  if(!src){ log("⚠️ Primero carga una imagen de referencia", "l-err"); return; }
  const mode = $("enhancerMode").value;
  const styleKey = $("enhancerStyle").value;
  const data = loadSysPrompts();
  const system = getCurrentSysPrompt(data, mode, styleKey);

  const btn = $("btnCaption");
  btn.disabled = true;
  btn.textContent = "Analizando imagen...";
  $("enhancerOutput").value = "";
  if($("enhancerMetaInfo")) $("enhancerMetaInfo").textContent = "";
  try {
    const b64 = await imageToResizedBase64(src, 768);
    const userPrompt = $("prompt").value.trim();
    const captionPrompt = userPrompt
      ? `Describe this image. User guidance: ${userPrompt}`
      : "Describe this image.";
    const payload = {
      model, system, prompt: captionPrompt, images: [b64],
      options: { num_ctx: 4096, temperature: 0.4 }
    };
    const { text, elapsedMs } = await streamOllamaGenerate(payload, $("enhancerOutput"));
    const timeStr = fmtMs(elapsedMs);
    if(!text){
      log("Respuesta vacía: el modelo de visión no devolvió texto. Prueba a liberar VRAM de ComfyUI o a elegir un modelo más pequeño.", "l-err");
      $("enhancerOutput").value = "El modelo no devolvió texto. Suele ocurrir por falta de VRAM: pulsa 'Liberar memoria' (o baja a un modelo menor) y reintenta.";
    } else {
      $("enhancerOutput").value = text;
      if($("enhancerMetaInfo")) $("enhancerMetaInfo").textContent = `${model} · ${mode} · ${styleKey} · ${timeStr}`;
      log(`Caption generado en ${timeStr} (${model}, ${mode}/${styleKey}, ${text.length} chars).`, "l-ok");
      log("Pulsa 'Usar como prompt' para aplicarlo.", "l-info");
    }
  } catch(e){
    log("Error en caption: " + e.message, "l-err");
    $("enhancerOutput").value = "Error: " + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Caption (Qwen VLM)";
  }
});

// --- EVOLVE listeners ---
$("evolveStrength")?.addEventListener("input", (e) => {
  if($("evolveStrengthVal")) $("evolveStrengthVal").textContent = e.target.value + "%";
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

// Interceptor en fase de captura para "Usar como prompt".
// common.js enlaza #btnUseAsPrompt y copia el texto crudo; aquí lo interceptamos
// ANTES (capture) para aplicar el parser JSON (rewritten_prompt + wh_ratio) y
// detener la propagación. Sin tocar common.js: las demás WebUIs no se ven afectadas.
document.addEventListener("click", (e) => {
  const t = e.target;
  if(!t || t.id !== "btnUseAsPrompt") return;
  const out = $("enhancerOutput")?.value?.trim();
  if(!out) return; // deja que common.js muestre su aviso normal
  const text = parseEnhancerResult(out) || out;
  if($("prompt")) $("prompt").value = text;
  log("✏️ Prompt actualizado desde el resultado del enhancer.", "l-ok");
  e.stopPropagation();
}, true);

// --- POST-PROCESADO: carga de LUTs y listeners de UI ---
function loadAvailableLuts(){
  const sel = $("lutName");
  if(!sel) return;
  const luts = (typeof AVAILABLE_LUTS !== "undefined" && Array.isArray(AVAILABLE_LUTS)) ? AVAILABLE_LUTS : [];
  const prev = sel.value;
  sel.innerHTML = '<option value="">-- Seleccionar LUT --</option>';
  for(const name of luts){
    const opt = document.createElement("option");
    opt.value = name; opt.textContent = name;
    sel.appendChild(opt);
  }
  if(luts.length === 0){
    sel.innerHTML = '<option value="">-- Sin LUTs (.cube) disponibles --</option>';
  }
  if(prev){ sel.value = prev; }
}

function initPostFxListeners(){
  if(typeof makeCollapsible === "function") makeCollapsible("postfxToggle", "postfxBody");

  // Sincroniza el valor numérico mostrado junto a cada slider.
  const sync = (sliderId, valId, decimals) => {
    const s = $(sliderId), v = $(valId);
    if(!s) return;
    const upd = () => { if(v) v.textContent = parseFloat(s.value).toFixed(decimals); };
    s.addEventListener("input", upd);
    upd();
  };
  sync("vigIntensity", "vigVal", 2);
  sync("radialStrength", "radialVal", 0);
  sync("lutStrength", "lutVal", 2);

  loadAvailableLuts();
}

// --- EDICIÓN CON QWEN 2.1: listeners de UI ---
function initQwenEditListeners(){
  $("qwenEditResolution")?.addEventListener("input", (e) => {
    const v = $("qwenEditResolutionVal");
    if(v) v.textContent = (parseInt(e.target.value, 10) === 0) ? "auto" : e.target.value;
  });

  $("btnQwenEditUseRef")?.addEventListener("click", () => {
    const src = getRefImageSrc();
    if(!src){ log("⚠️ No hay imagen de referencia cargada.", "l-err"); return; }
    if($("qwenEditEnabled")) $("qwenEditEnabled").checked = true;
    updateQwenEditRefStatus();
    log("✅ Imagen de referencia fijada para la edición Qwen 2.1.", "l-ok");
  });

  $("btnQwenEditClearRef")?.addEventListener("click", () => {
    qwenEditExtraRefs = [];
    if($("qwenEditEnabled")) $("qwenEditEnabled").checked = false;
    updateQwenEditRefStatus();
    log("Referencia de edición Qwen 2.1 desactivada.", "l-info");
  });

  $("btnQwenEditAddRef")?.addEventListener("click", () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if(!file) return;
      if(file.size && file.size > MAX_REF_SIZE_BYTES){
        log(`⚠️ La imagen de referencia extra es demasiado pesada (máx 25 MB): ${(file.size / 1024 / 1024).toFixed(1)} MB`, "l-err");
        return;
      }
      if(file.type && !file.type.startsWith("image/")){
        log("⚠️ Formato de archivo no soportado. Debe ser una imagen.", "l-err");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if(qwenEditExtraRefs.length >= 2){
          log("⚠️ Máximo 2 referencias extra.", "l-warn");
          return;
        }
        qwenEditExtraRefs.push(reader.result);
        updateQwenEditRefStatus();
        log(`Referencia extra añadida (${qwenEditExtraRefs.length}).`, "l-ok");
      };
      reader.readAsDataURL(file);
    });
    inp.click();
  });

  $("btnQwenEditClearExtra")?.addEventListener("click", () => {
    qwenEditExtraRefs = [];
    updateQwenEditRefStatus();
    log("Referencias extra limpiadas.", "l-info");
  });

  updateQwenEditRefStatus();
}

// --- REFINADO FACIAL: listeners de UI ---
function initFaceRefineListeners(){
  const persist = () => {
    saveFaceRefine(getFaceRefineState());
    if(typeof scheduleSaveKreaQwenSettings === "function") scheduleSaveKreaQwenSettings();
  };

  $("segFaceRefineOn")?.addEventListener("click", () => {
    const s = getFaceRefineState();
    s.enabled = true;
    setFaceRefineUI(s);
    saveFaceRefine(s);
    if(typeof scheduleSaveKreaQwenSettings === "function") scheduleSaveKreaQwenSettings();
  });
  $("segFaceRefineOff")?.addEventListener("click", () => {
    const s = getFaceRefineState();
    s.enabled = false;
    setFaceRefineUI(s);
    saveFaceRefine(s);
    if(typeof scheduleSaveKreaQwenSettings === "function") scheduleSaveKreaQwenSettings();
  });
  $("faceRefineStepsSlider")?.addEventListener("input", (e) => {
    const st = parseInt(e.target.value, 10) || 10;
    if($("faceRefineStepsVal")) $("faceRefineStepsVal").textContent = st;
    if($("faceRefineStepsHint")) $("faceRefineStepsHint").textContent = `(${st})`;
    persist();
  });
  $("faceRefineCanvasMode")?.addEventListener("change", persist);
  $("faceRefineDenoiseSlider")?.addEventListener("input", (e) => {
    const d = parseFloat(e.target.value) || 0.40;
    if($("faceRefineDenoiseVal")) $("faceRefineDenoiseVal").textContent = d.toFixed(2);
    if($("faceRefineDenoiseHint")) $("faceRefineDenoiseHint").textContent = `(${d.toFixed(2)})`;
    persist();
  });
  $("faceRefineFeatherSlider")?.addEventListener("input", (e) => {
    const f = parseInt(e.target.value, 10) || 12;
    if($("faceRefineFeatherVal")) $("faceRefineFeatherVal").textContent = f + " px";
    if($("faceRefineFeatherHint")) $("faceRefineFeatherHint").textContent = `(${f} px)`;
    persist();
  });
  $("faceRefineSelectMode")?.addEventListener("change", persist);
}

// Inicialización de Listeners y Componentes
function initKreaQwenUI() {
  populateModelSelects();
  updateDimensionHints();

  // Carga y renderizado de LoRAs (Base y Refiner)
  loadLoraStates();
  renderLoraGroup("baseLoraList", baseLoras, "LoRA Base", saveLoraStates);
  renderLoraGroup("refinerLoraList", refinerLoras, "LoRA Refiner", saveLoraStates);

  // Restaurar ajustes completos de sesión si existen en localStorage; si no, aplicar modo inicial por defecto
  const restored = restoreKreaQwenSettings();
  if(!restored){
    resetTouched();
    applyComboMode($("comboMode")?.value || "krea_qwen");
    setFaceRefineUI(loadFaceRefine());
  }

  // Activación de paneles desplegables (collapsible)
  if(typeof makeCollapsible === "function"){
    makeCollapsible("negPromptToggle", "negPromptBody");
    makeCollapsible("evolveToggle", "evolveBody");
    makeCollapsible("baseLorasToggle", "baseLorasBody");
    makeCollapsible("varianceToggle", "varianceBody");
    makeCollapsible("refinerLorasToggle", "refinerLorasBody");
    makeCollapsible("spectrumToggle", "spectrumBody");
    makeCollapsible("galleryToggle", "galleryBody");
    makeCollapsible("qwenEditToggle", "qwenEditBody");
    makeCollapsible("faceRefineToggle", "faceRefineBody");
  }

  window.outputZoom = setupZoomPan("imgWrap", "outputImg", "btnResetZoom", "btnFullscreenImg");
  window.refZoom = setupZoomPan("refWrap", "refImg", "btnResetZoomRef", "btnFullscreenRef");

  // Navegación de variantes en pantalla completa del visor principal con flechas del teclado
  document.addEventListener("keydown", (e) => {
    if(_variantFsOverlay) return; // Si el modal de variantes está abierto, él gestiona sus teclas
    if(!window.outputZoom?.isFullscreen() && !window.refZoom?.isFullscreen()) return;
    if(e.key === "ArrowLeft"){
      e.preventDefault();
      navigateVariant(-1);
    } else if(e.key === "ArrowRight"){
      e.preventDefault();
      navigateVariant(1);
    }
  });

  // Swipe táctil en móvil para cambiar de variante en el visor principal
  window.outputZoom?.onSwipe?.((dir) => navigateVariant(dir));
  window.refZoom?.onSwipe?.((dir) => navigateVariant(dir));

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

  $("comboMode")?.addEventListener("change", (e) => {
    resetTouched(); // Cambiar modo limpia el estado de "tocado" para que el perfil se aplique limpio.
    applyComboMode(e.target.value);
  });
  $("baseUnetSelect")?.addEventListener("change", () => { syncStageToUnet("baseUnetSelect", "baseClipSelect", "base"); updateVaeSelectors(); });
  $("refinerUnetSelect")?.addEventListener("change", () => { syncStageToUnet("refinerUnetSelect", "refinerClipSelect", "refiner"); updateVaeSelectors(); });
  $("btnInvertOrder")?.addEventListener("click", () => { resetTouched(); invertOrder(); });

  $("mpSlider")?.addEventListener("input", (e) => {
    if($("mpVal")) $("mpVal").textContent = parseFloat(e.target.value).toFixed(2);
    updateDimensionHints();
  });
  $("aspectRatio")?.addEventListener("change", updateDimensionHints);
  $("upscaleFactor")?.addEventListener("input", (e) => {
    if($("upscaleFactorVal")) $("upscaleFactorVal").textContent = `${parseFloat(e.target.value).toFixed(2)}x`;
    updateDimensionHints();
  });
  ["baseSteps","baseCfg","baseSamplerName","baseSchedulerName","refinerSteps","refinerCfg","refinerSamplerName","refinerSchedulerName","refinerDenoise"].forEach(id => {
    $(id)?.addEventListener("change", () => markTouched(id));
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

  // --- Post-procesado (ProPost Torched) ---
  initPostFxListeners();

  // --- Edición con Qwen 2.1 ---
  initQwenEditListeners();

  // --- Refinado facial (H3 FaceRefine) ---
  initFaceRefineListeners();

  // Cargar el estado persistido del refinado facial
  setFaceRefineUI(loadFaceRefine());

  // --- Cargar metadatos de la imagen de referencia ---
  $("btnLoadMeta")?.addEventListener("click", async () => {
    const btn = $("btnLoadMeta");
    const src = getRefImageSrc();
    if(!src){ log("⚠️ Primero carga una imagen de referencia", "l-err"); return; }
    const prev = btn?.textContent;
    if(btn){ btn.disabled = true; btn.textContent = "Leyendo metadatos..."; }
    try {
      const found = await extractWorkflowFromImage(src);
      if(found === null) log("ℹ️ Esta imagen no contiene metadatos de workflow.", "l-info");
    } catch(e){
      log("❌ Error leyendo metadatos: " + e.message, "l-err");
    } finally {
      if(btn){ btn.disabled = false; btn.textContent = prev; }
    }
  });

  // Semilla de Sampler
  $("segSamplerRandom")?.addEventListener("click", () => {
    $("segSamplerRandom")?.classList.add("on");
    $("segSamplerFixed")?.classList.remove("on");
    if($("samplerSeed")) $("samplerSeed").disabled = true;
    if(typeof scheduleSaveKreaQwenSettings === "function") scheduleSaveKreaQwenSettings();
  });
  $("segSamplerFixed")?.addEventListener("click", () => {
    $("segSamplerFixed")?.classList.add("on");
    $("segSamplerRandom")?.classList.remove("on");
    if($("samplerSeed")) $("samplerSeed").disabled = false;
    if(typeof scheduleSaveKreaQwenSettings === "function") scheduleSaveKreaQwenSettings();
  });

  // Semilla de Varianza (Krea2)
  $("segVarianceRandom")?.addEventListener("click", () => {
    $("segVarianceRandom")?.classList.add("on");
    $("segVarianceFixed")?.classList.remove("on");
    if($("varianceSeed")) $("varianceSeed").disabled = true;
    if(typeof scheduleSaveKreaQwenSettings === "function") scheduleSaveKreaQwenSettings();
  });
  $("segVarianceFixed")?.addEventListener("click", () => {
    $("segVarianceFixed")?.classList.add("on");
    $("segVarianceRandom")?.classList.remove("on");
    if($("varianceSeed")) $("varianceSeed").disabled = false;
    if(typeof scheduleSaveKreaQwenSettings === "function") scheduleSaveKreaQwenSettings();
  });

  // Controles de varianza RBG
  $("varianceFineTune")?.addEventListener("input", (e) => {
    if($("varianceFineTuneVal")) $("varianceFineTuneVal").textContent = e.target.value;
  });
  $("varianceShiftStrength")?.addEventListener("input", (e) => {
    if($("varianceShiftStrengthVal")) $("varianceShiftStrengthVal").textContent = e.target.value;
  });

  $("tabViewFinal")?.addEventListener("click", () => showImageView("final"));
  $("tabViewBase")?.addEventListener("click", () => showImageView("base"));

  $("btnGenerate")?.addEventListener("click", () => enqueueGeneration(false));
  $("btnGenerateBaseOnly")?.addEventListener("click", () => enqueueGeneration(true));

  $("btnClearNegPrompt")?.addEventListener("click", () => {
    if($("negPrompt")) $("negPrompt").value = "";
    if(typeof scheduleSaveKreaQwenSettings === "function") scheduleSaveKreaQwenSettings();
  });

  // Persistencia reactiva continua en localStorage para cualquier cambio en controles
  document.addEventListener("input", () => {
    if(typeof scheduleSaveKreaQwenSettings === "function") scheduleSaveKreaQwenSettings();
  });
  document.addEventListener("change", () => {
    if(typeof scheduleSaveKreaQwenSettings === "function") scheduleSaveKreaQwenSettings();
  });

  // Historial de imágenes
  $("btnClearGallery")?.addEventListener("click", clearGallery);
  renderGallery();

  $("btnClearQueue")?.addEventListener("click", () => {
    jobQueue = [];
    finishCurrentJob();
    updateQueueUI();
    log("🗑️ Cola de trabajos vaciada y estado restablecido a reposo.", "l-info");
  });

  $("btnOffloadVram")?.addEventListener("click", async () => {
    const btn = $("btnOffloadVram");
    const prevText = btn?.textContent;
    if(btn){ btn.disabled = true; btn.textContent = "Descargando..."; }
    try {
      const r = await postBackend("/free", { unload_models: true, free_memory: false });
      if(!r.ok){
        throw new Error(`HTTP ${r.status}`);
      }
      log("⚡ VRAM liberada: modelos descargados a RAM (conservados en memoria para generar sin leer del disco).", "l-ok");
    } catch(e){
      log("Error descargando VRAM: " + e.message, "l-err");
    } finally {
      if(btn){ btn.disabled = false; btn.textContent = prevText; }
    }
  });

  $("btnFreeMemory")?.addEventListener("click", async () => {
    const btn = $("btnFreeMemory");
    const prevText = btn?.textContent;
    if(btn){ btn.disabled = true; btn.textContent = "Purgando..."; }
    try {
      const r = await postBackend("/free", { unload_models: true, free_memory: true });
      if(!r.ok){
        throw new Error(`HTTP ${r.status}`);
      }
      log("Memoria VRAM y caché de RAM purgados por completo en ComfyUI.", "l-ok");
    } catch(e){
      log("Error liberando memoria: " + e.message, "l-err");
    } finally {
      if(btn){ btn.disabled = false; btn.textContent = prevText; }
    }
  });

  // --- Envío entre WebUIs ---
  function openExternalWebUI(targetPort, targetPage, filename, subfolder, label){
    const ref = buildRefParam(filename, subfolder);
    const here = window.location;
    const targetHost = here.hostname;
    const url = `${here.protocol}//${targetHost}:${targetPort}/${targetPage}?ref=${ref}`;
    const win = window.open(url, "_blank");
    if(!win) log("⚠️ El navegador bloqueó la nueva pestaña. Permite popups y reintenta.", "l-err");
    else log(`↗️ Abriendo ${label} con la imagen: ${filename}`, "l-ok");
  }

  function sendOutputToExternalUI(targetPort, targetPage, label){
    const mediaObj = (currentViewMode === "final") ? currentFinalMedia : currentBaseMedia;
    if(!mediaObj || !mediaObj.media || !mediaObj.media.filename){
      log(`⚠️ Primero genera una imagen para poder enviarla a ${label}.`, "l-err");
      return;
    }
    const filename = mediaObj.media.filename;
    const subfolder = mediaObj.media.subfolder || "kreaqwen/imagen";
    openExternalWebUI(targetPort, targetPage, filename, subfolder, label);
  }

  async function sendRefToExternalUI(targetPort, targetPage, label){
    const refImgEl = $("refImg");
    if(!refImgEl || !refImgEl.src || refImgEl.src === window.location.href){
      log("⚠️ Primero carga una imagen de referencia.", "l-err");
      return;
    }
    const src = refImgEl.src;
    const fromView = refFromViewSrc(src);
    if(fromView){
      openExternalWebUI(targetPort, targetPage, fromView.filename, fromView.subfolder, label);
      return;
    }
    if(!src.startsWith("data:")){
      log("⚠️ Origen de imagen no soportado: " + src.slice(0, 40), "l-err");
      return;
    }
    log(`⏳ Subiendo imagen de referencia para enviarla a ${label}...`, "l-info");
    try {
      const blob = await (await fetch(src)).blob();
      const ts = Date.now();
      const ext = (blob.type && blob.type.split("/")[1]) || "png";
      const filename = `ref_${ts}.${ext.replace(/[^a-z0-9]/i, "")}`;
      const fd = new FormData();
      fd.append("image", new File([blob], filename, { type: blob.type || "image/png" }));
      const r = await fetch("/api/krea2_upload", { method: "POST", body: fd });
      if(!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      if(data.error) throw new Error(data.error);
      const finalName = (data.name || filename).replace(/^.*\//, "");
      log(`✅ Imagen subida a output/krea2/${finalName}`, "l-ok");
      openExternalWebUI(targetPort, targetPage, finalName, "krea2", label);
    } catch(e){
      log(`❌ No se pudo enviar la imagen a ${label}: ` + e.message, "l-err");
    }
  }

  $("btnSendLtxv")?.addEventListener("click", () => {
    const port = (typeof LTXV_UI_PORT !== "undefined" && LTXV_UI_PORT) ? LTXV_UI_PORT : "8000";
    sendOutputToExternalUI(port, "LTXV_WebUI.html", "LTXV");
  });
  $("btnSendH3")?.addEventListener("click", () => {
    const port = (typeof MINIMAXH3_UI_PORT !== "undefined" && MINIMAXH3_UI_PORT) ? MINIMAXH3_UI_PORT : "8002";
    sendOutputToExternalUI(port, "MiniMaxH3_WebUI.html", "MiniMax H3");
  });
  $("btnSendX2")?.addEventListener("click", () => {
    const port = (typeof MMH3X2_UI_PORT !== "undefined" && MMH3X2_UI_PORT) ? MMH3X2_UI_PORT : "8003";
    sendOutputToExternalUI(port, "MMH3X2_WebUI.html", "MMH3X2");
  });

  $("btnSendRefLtxv")?.addEventListener("click", () => {
    const port = (typeof LTXV_UI_PORT !== "undefined" && LTXV_UI_PORT) ? LTXV_UI_PORT : "8000";
    sendRefToExternalUI(port, "LTXV_WebUI.html", "LTXV");
  });
  $("btnSendRefH3")?.addEventListener("click", () => {
    const port = (typeof MINIMAXH3_UI_PORT !== "undefined" && MINIMAXH3_UI_PORT) ? MINIMAXH3_UI_PORT : "8002";
    sendRefToExternalUI(port, "MiniMaxH3_WebUI.html", "MiniMax H3");
  });
  $("btnSendRefX2")?.addEventListener("click", () => {
    const port = (typeof MMH3X2_UI_PORT !== "undefined" && MMH3X2_UI_PORT) ? MMH3X2_UI_PORT : "8003";
    sendRefToExternalUI(port, "MMH3X2_WebUI.html", "MMH3X2");
  });

  // --- Drag & Drop saliente y recepción entre UIs ---
  makeDragSource($("outputImg"), () => {
    const mediaObj = (currentViewMode === "final") ? currentFinalMedia : currentBaseMedia;
    return (mediaObj && mediaObj.media) ? mediaObj.media : null;
  });
  enableInterUIDrop($("refDropzone"), (file) => handleRefFile(file));
  enableInterUIDrop($("refWrap"), (file) => handleRefFile(file));

  // --- Cargar imagen pasada por query ?ref= ---
  (async function maybeLoadFromQuery(){
    const qs = new URLSearchParams(window.location.search);
    const ref = qs.get("ref");
    if(!ref) return;
    const rawName = decodeURIComponent(ref);
    const filename = rawName.replace(/^.*\//, "");
    const subfolder = (rawName.includes("/") && rawName.split("/").slice(0,-1).join("/")) || "krea2";
    const tryLoad = async (sf) => {
      const url = `/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(sf)}&type=${encodeURIComponent("output")}`;
      log("⏳ Cargando imagen de referencia: "+filename+" (subfolder="+sf+")", "l-info");
      const r = await fetch(url);
      if(!r.ok) throw new Error("HTTP "+r.status);
      const blob = await r.blob();
      if(blob.size === 0) throw new Error("respuesta vacía");
      const file = new File([blob], filename, { type: blob.type || "image/png" });
      handleRefFile(file);
      log("✅ Imagen de referencia cargada: "+filename, "l-ok");
    };
    try {
      await tryLoad(subfolder);
    } catch(e1){
      try {
        await tryLoad("");
      } catch(e2){
        log("⚠️ La imagen '"+filename+"' no se pudo cargar: "+e2.message, "l-err");
      }
    }
  })();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initKreaQwenUI);
} else {
  initKreaQwenUI();
}
