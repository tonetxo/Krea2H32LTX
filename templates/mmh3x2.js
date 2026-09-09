// mmh3x2.js — MMH3X2-specific JavaScript (2 segmentos, 4 imágenes, 1 vídeo, RTX y RIFE).
// Injected AFTER common.js. CONFIG must be defined before initCommon().

const CONFIG = {
  PROMPTS_KEY: 'mmh3x2_prompts',
  LORA_STATE_KEY: 'mmh3x2_loras_state',
  ENHANCER_SYSKEY: 'mmh3x2_enhancer_sysprompts_v2',
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
    SPARSE_ATTN: "88",
    BLOCK_SPARSE: "90",
    AIMDO: "91"
  },
  loras: [
    { on: false, lora: "", strength: 1.0 },
    { on: false, lora: "", strength: 1.0 }
  ],
  ENHANCER_DEFAULT_PROMPTS: {
    text: {
      A: { name: "Estilo A (cinematográfico H3)", prompt: "You are an expert in prompts for MiniMaxH3 video generation. Transform the user's idea into a detailed cinematic prompt. Include: shot type, lighting, camera movement, atmosphere, colors, and visual style. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt, no explanations or prefaces." },
      B: { name: "Estilo B (narrativo)", prompt: "You are a creative assistant specialized in visual storytelling. Take the user's idea and turn it into an evocative prompt that captures the essence of the scene. Use descriptive, poetic language. Focus on atmosphere, emotions, and the story the image tells. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
      C: { name: "T2VA (guía oficial MiniMax H3)", prompt: `You are an expert prompt writer for the MiniMax H3 video model (text-to-video-audio, T2VA). Rewrite the user's idea into a single MiniMax H3 final prompt following the official format strictly.

RULES:
1. The final prompt has NO image-alignment instruction (it is T2VA, no reference image). Begin directly with the three core fields.
2. Use exactly this structure, preserving the field labels verbatim:

integrated_multimodal_description: [Shot 1] <style and initial composition>. <camera motion + amplitude + speed as natural English actions>. <subject appearance, IDs, actions, dialogue, diegetic sound>. [Shot 2] At 00:SS.SSS, the camera cuts to <new information>. ...

overall_soundscape: <1-4 sentences: ambient sound, physical action sounds, non-verbal human sounds across the full video>. Do NOT repeat dialogue or diegetic music here. Use N/A only if the user requests complete silence.

non_diegetic_music: <1-3 sentences: instrumentation, tempo, rhythm, dynamic changes only>. Use N/A if there is no non-diegetic music.

3. At the start of [Shot 1] state the overall style (Cinematic, live-action, 2D-animated, 3D CG, claymation, watercolor, vintage film, etc.) and the initial composition.
4. Do NOT add a timestamp to [Shot 1]. Later shots use sequential numbers and a strictly increasing cut time within the video duration, introduced with "the camera cuts to", "the shot cuts to", "the shot transitions to", "the shot changes to", or "the shot switches to".
5. Camera motion: combine motion type (Zoom In/Out, Push In/Pull Out, Pan Left/Right, Truck Left/Right, Tilt Up/Down, Pedestal Up/Down, Arc Shot, Tracking Shot, Static Shot, Shake Slightly/Strongly, POV, Roll Clockwise/Counterclockwise) + amplitude (with small/large amplitude) + speed (at slow/fast speed). Write it as a natural English action within the shot, not as stacked labels.
6. The user may write in any language; you must ALWAYS respond in English with ONLY the final MiniMax H3 prompt, no explanations or prefaces.` },
      D: { name: "Continuación Seg 2 (evolución de acción)", prompt: `You are an expert prompt writer for the MiniMax H3 2-segment continuation pipeline. You are generating the prompt for Segment 2, which directly continues the action from Segment 1.

RULES:
1. Maintain strict continuity of character identity, clothing, environment, lighting, and camera perspective from Segment 1.
2. Clearly describe the subsequent action, movement, or escalation that takes place right after the conclusion of Segment 1.
3. Include natural camera movement and auditory progression (soundscape).
4. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced continuation prompt, no explanations or prefaces.` }
    },
    vision: {
      A: { name: "Estilo A (descriptivo H3)", prompt: "You are an expert at describing images for MiniMax H3 video generation. Analyze the provided image and generate a detailed prompt describing: composition, subjects, background, lighting, colors, motion, and atmosphere. The prompt must be suitable for a text-to-video model. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
      B: { name: "Estilo B (cinematográfico H3)", prompt: "You are a digital cinematographer for MiniMax H3. Look at the image and turn it into a cinematic description. Describe how the camera would move, how lighting would evolve, what action would unfold, and how the scene would change over time. Think in terms of footage, not a still photo. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
      C: { name: "I2VA (guía oficial - Primer frame)", prompt: `You are an expert prompt writer for the MiniMax H3 video model (image-to-video-audio, I2VA). You are given ONE reference image: it is the exact first frame of the target video at 0.00 seconds and belongs to [Shot 1]. Optionally the user provides a text hint. Rewrite the user's idea into a single MiniMax H3 final prompt following the official format strictly.

RULES:
1. The final prompt MUST start with this exact instruction line (no leading blank line, nothing before it):
For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.
2. Leave exactly ONE blank line after that instruction, then the three core fields with these exact labels:

integrated_multimodal_description: [Shot 1] <derive overall style from the image>. <establish the subjects, composition, clothing, colors, key objects and spatial relationships exactly as in <Picture 1>>. <first-frame anchor → action onset → continuous development → result or reaction>. <camera motion as natural English: motion type + amplitude + speed>.

overall_soundscape: <1-4 sentences: ambient + physical-action + non-verbal human sounds across the full video; no dialogue/diegetic music here; N/A only if user requests silence>.

non_diegetic_music: <1-3 sentences: instrumentation, tempo, rhythm, dynamics only; N/A if none>.

The user may write in any language; you must ALWAYS respond in English with ONLY the final MiniMax H3 prompt, no explanations or prefaces.` },
      D: { name: "FL2VA (guía oficial - Primer y Último frame)", prompt: `You are an expert prompt writer for the MiniMax H3 video model (first-last-frame-to-video-audio, FL2VA). You are given TWO reference images: the FIRST image is the opening frame (Picture 1, 0.00 seconds, [Shot 1]) and the SECOND image is the closing frame (Picture 2, end of the video, final [Shot N]). Optionally the user provides a text hint. Rewrite the user's idea into a single MiniMax H3 final prompt following the official format strictly.

RULES:
1. The final prompt MUST start with this exact instruction line:
How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot N) aligns with the end mark of the target video.
2. Leave exactly ONE blank line after that instruction, then the three core fields:

integrated_multimodal_description: [Shot 1] <derive overall style from the images>. <first-frame state matching Picture 1: subjects, poses, composition, lighting, colors, key objects>. <observable intermediate changes: how the subject moves, poses change, objects are manipulated, composition/lighting evolve>. <progressively narrowing differences>. <last-frame state matching Picture 2 at the end of the shot>. <camera motion as natural English: motion type + amplitude + speed>.

overall_soundscape: <1-4 sentences: ambient + physical-action + non-verbal human sounds across the full video>.

non_diegetic_music: <1-3 sentences: instrumentation, tempo, rhythm, dynamics only; N/A if none>.

The user may write in any language; you must ALWAYS respond in English with ONLY the final MiniMax H3 prompt, no explanations or prefaces.` },
      E: { name: "R2VA (guía oficial - Multi-imagen)", prompt: `You are an expert prompt writer for the MiniMax H3 video model in FULL-REFERENCE mode. You are given reference images (<Picture N>). Rewrite the user's idea into a single MiniMax H3 final prompt using the full-reference format.

RULES:
1. Output exactly SIX sections, in order: subject_definitions, summary, retention_analysis, detailed_description, overall_soundscape, non_diegetic_music.
2. Detailed description: 350-500 English words, shot by shot in playback order with [Shot 1] (no timestamp) then [Shot N]. Write camera motion as natural English.
3. The user may write in any language; you must ALWAYS respond in English with ONLY the final MiniMax H3 full-reference prompt, no explanations or prefaces.` },
      F: { name: "Continuación Seg 2 con imagen (Slot 3/4)", prompt: `You are an expert prompt writer for MiniMax H3 2-segment video continuation. You are provided with reference image(s) for the next segment (Segment 2). Describe how the character and scene transition seamlessly from Segment 1 into the new action, position, or pose shown in the image. Maintain full visual and auditory consistency. Respond in English with ONLY the enhanced prompt.` }
    }
  }
};

const N = CONFIG.N;

// --- MODO DE WORKFLOW (base / blockatt) ---
const WORKFLOW_MODE_KEY = "mmh3x2_workflow_mode";
const IS_BLOCKATT = (() => {
  // Detección automática: el HTML BlockATT trae un nodo 4 de tipo H3SparseAttentionAdvanced o BlockSparseAttention,
  // mientras que el HTML base trae H3SparseAttention (no Advanced).
  const n4 = BASE_GRAPH?.["4"]?.class_type || "";
  const hasAdvanced = n4 === "H3SparseAttentionAdvanced";
  const hasBlockSparse = n4 === "BlockSparseAttention";
  const explicit = (localStorage.getItem(WORKFLOW_MODE_KEY) || "").trim();
  if (explicit === "blockatt") return true;
  if (explicit === "base") return false;
  return hasAdvanced || hasBlockSparse;
})();

initCommon();

// --- MODO WORKFLOW: selector UI ---
function setWorkflowModeUI(){
  const sel = $("workflowMode");
  if(!sel) return;
  sel.value = IS_BLOCKATT ? "blockatt" : "base";
}
function saveWorkflowMode(mode){
  try { localStorage.setItem(WORKFLOW_MODE_KEY, mode); } catch(_){}
}

// --- ATTENTION OPTIMIZATIONS ---
// Modo base: cadena fija UNet -> ModelAttentionBackend -> H3SparseAttention -> SigmaShift -> H3MemoryOptimization.
// Modo blockatt: cadena flexible UNet -> ModelAttentionBackend -> (H3SparseAdvanced / BlockSparse / nada) -> AIMDO? -> SigmaShift -> MemOpt?.
const ATTENTION_BACKEND_KEY = "mmh3x2_attention_backend";
const ATTENTION_OPTIMIZER_KEY = "mmh3x2_attention_optimizer";
const H3OPT_KEY = "mmh3x2_h3opt";
const AIMDO_KEY = "mmh3x2_aimdo";
const BLOCK_SPARSE_KEY = "mmh3x2_block_sparse";

const ATTENTION_BACKEND_DEFAULTS = { backend: "comfy kitchen attention" };
const ATTENTION_OPTIMIZER_DEFAULTS = { mode: "none" };
const H3OPT_DEFAULTS = { sparseBackend: "auto", videoBudget: 0.30, denserEarlyLate: true, memOptEnabled: true };
const AIMDO_DEFAULTS = { residency: "0 blocks" };
// Nota: BlockSparseAttention está desactivado en MMH3X2 porque produce:
// make_forward.<locals>.forward() got an unexpected keyword argument 'attention'
// en el transformer de MiniMax H3. Se conservan las funciones por compatibilidad
// de workflow antiguos, pero la UI no ofrece el modo.
const BLOCK_SPARSE_MODES = {
  "Sol-Attn (adaptive tau)": "sol-attn",
  "top-k (SLA)": "sla",
  "VSA (FastVideo)": "vsa"
};
const BLOCK_SPARSE_MODES_REVERSE = {
  "sol-attn": "Sol-Attn (adaptive tau)",
  "sla": "top-k (SLA)",
  "vsa": "VSA (FastVideo)"
};
function mapBlockSparseSelection(sel){
  return BLOCK_SPARSE_MODES[sel] || BLOCK_SPARSE_MODES_REVERSE[sel] || sel;
}
const BLOCK_SPARSE_DEFAULTS = { selection: "Sol-Attn (adaptive tau)", tau: 1.3, startPercent: 0.2, endPercent: 1.0 };

function loadAttentionBackend(){
  try { return Object.assign({}, ATTENTION_BACKEND_DEFAULTS, JSON.parse(localStorage.getItem(ATTENTION_BACKEND_KEY) || "{}")); }
  catch(_) { return {...ATTENTION_BACKEND_DEFAULTS}; }
}
function saveAttentionBackend(s){ try { localStorage.setItem(ATTENTION_BACKEND_KEY, JSON.stringify(s)); } catch(_){} }
function getAttentionBackendState(){
  return { backend: $("attentionBackend")?.value || ATTENTION_BACKEND_DEFAULTS.backend };
}
function setAttentionBackendUI(s){
  if($("attentionBackend")) $("attentionBackend").value = s.backend;
}

function loadAttentionOptimizer(){
  try { return Object.assign({}, ATTENTION_OPTIMIZER_DEFAULTS, JSON.parse(localStorage.getItem(ATTENTION_OPTIMIZER_KEY) || "{}")); }
  catch(_) { return {...ATTENTION_OPTIMIZER_DEFAULTS}; }
}
function saveAttentionOptimizer(s){ try { localStorage.setItem(ATTENTION_OPTIMIZER_KEY, JSON.stringify(s)); } catch(_){} }
function getAttentionOptimizerState(){
  const none = $("segAttnNone"), h3 = $("segAttnH3");
  if(h3?.classList.contains("on")) return { mode: "h3-optimizations" };
  return { mode: "none" };
}
function setAttentionOptimizerUI(mode){
  const none = $("segAttnNone"), h3 = $("segAttnH3");
  // Block Sparse ya no es seleccionable: normalizar a "none" o "h3-optimizations"
  const safeMode = mode === "block-sparse" ? "none" : (mode || "none");
  none?.classList.toggle("on", safeMode === "none");
  h3?.classList.toggle("on", safeMode === "h3-optimizations");
  const h3Panel = $("h3OptPanel");
  if(h3Panel) h3Panel.style.display = safeMode === "h3-optimizations" ? "" : "none";
}

function loadH3Opt(){
  try { return Object.assign({}, H3OPT_DEFAULTS, JSON.parse(localStorage.getItem(H3OPT_KEY) || "{}")); }
  catch(_) { return {...H3OPT_DEFAULTS}; }
}
function saveH3Opt(state){ try { localStorage.setItem(H3OPT_KEY, JSON.stringify(state)); } catch(_){} }
function getH3OptState(){
  return {
    sparseBackend: $("h3SparseBackend")?.value || "auto",
    videoBudget: parseFloat($("h3VideoBudget")?.value || "0.30"),
    denserEarlyLate: $("segDenserOn")?.classList.contains("on") ?? true,
    memOptEnabled: $("segMemOptOn")?.classList.contains("on") ?? true,
  };
}
function setH3OptUI(state){
  if($("h3SparseBackend")) $("h3SparseBackend").value = state.sparseBackend || "auto";
  if($("h3VideoBudget")){
    $("h3VideoBudget").value = state.videoBudget;
    const pct = Math.round(state.videoBudget * 100);
    if($("h3VideoBudgetVal")) $("h3VideoBudgetVal").textContent = `${pct}%`;
  }
  const dOn = $("segDenserOn"), dOff = $("segDenserOff");
  if(state.denserEarlyLate){ dOn?.classList.add("on"); dOff?.classList.remove("on"); }
  else { dOff?.classList.add("on"); dOn?.classList.remove("on"); }
  const mOn = $("segMemOptOn"), mOff = $("segMemOptOff");
  if(state.memOptEnabled){ mOn?.classList.add("on"); mOff?.classList.remove("on"); }
  else { mOff?.classList.add("on"); mOn?.classList.remove("on"); }
}

function loadAimdo(){
  try { return Object.assign({}, AIMDO_DEFAULTS, JSON.parse(localStorage.getItem(AIMDO_KEY) || "{}")); }
  catch(_) { return {...AIMDO_DEFAULTS}; }
}
function saveAimdo(s){ try { localStorage.setItem(AIMDO_KEY, JSON.stringify(s)); } catch(_){} }
function getAimdoState(){ return { residency: $("aimdoResidency")?.value || AIMDO_DEFAULTS.residency }; }
function setAimdoUI(s){ if($("aimdoResidency")) $("aimdoResidency").value = s.residency; }

function loadBlockSparse(){
  try { return Object.assign({}, BLOCK_SPARSE_DEFAULTS, JSON.parse(localStorage.getItem(BLOCK_SPARSE_KEY) || "{}")); }
  catch(_) { return {...BLOCK_SPARSE_DEFAULTS}; }
}
function saveBlockSparse(s){ try { localStorage.setItem(BLOCK_SPARSE_KEY, JSON.stringify(s)); } catch(_){} }
function getBlockSparseState(){
  return {
    selection: $("blockSparseSelection")?.value || BLOCK_SPARSE_DEFAULTS.selection,
    tau: parseFloat($("blockSparseTau")?.value ?? "1.3"),
    startPercent: parseFloat($("blockSparseStart")?.value ?? "0.2"),
    endPercent: parseFloat($("blockSparseEnd")?.value ?? "1.0"),
  };
}
function setBlockSparseUI(s){
  if($("blockSparseSelection")) $("blockSparseSelection").value = s.selection;
  if($("blockSparseTau")){ $("blockSparseTau").value = s.tau; $("blockSparseTauVal").textContent = parseFloat(s.tau).toFixed(2); }
  if($("blockSparseStart")){ $("blockSparseStart").value = s.startPercent; $("blockSparseStartVal").textContent = parseFloat(s.startPercent).toFixed(2); }
  if($("blockSparseEnd")){ $("blockSparseEnd").value = s.endPercent; $("blockSparseEndVal").textContent = parseFloat(s.endPercent).toFixed(2); }
}

const _attentionBackendState = loadAttentionBackend();
const _attentionOptimizerState = loadAttentionOptimizer();
const _h3OptState = loadH3Opt();
const _aimdoState = loadAimdo();
const _blockSparseState = loadBlockSparse();
setWorkflowModeUI();
setAttentionBackendUI(_attentionBackendState);
if(IS_BLOCKATT){
  setAttentionOptimizerUI(_attentionOptimizerState.mode);
  setH3OptUI(_h3OptState);
  setAimdoUI(_aimdoState);
  setBlockSparseUI(_blockSparseState);
} else {
  setH3OptUI(_h3OptState);
}

// Estado de imágenes, vídeo y audio
let mediaSlots = {
  1: { file: null, dataUrl: null, uploaded: null, name: "" },
  2: { file: null, dataUrl: null, uploaded: null, name: "" },
  3: { file: null, dataUrl: null, uploaded: null, name: "" },
  4: { file: null, dataUrl: null, uploaded: null, name: "" }
};
let videoSlot = { file: null, dataUrl: null, uploaded: null, name: "" };
let audioSlots = {
  1: { file: null, dataUrl: null, uploaded: null, name: "" },
  2: { file: null, dataUrl: null, uploaded: null, name: "" }
};

let jobQueue = [];
let activeJob = null;
let promptVariantMap = {};
let promptSteps = {};
let displayedSlots = {};
let currentActiveSamplerSlot = 1; // 1 o 2

// Control de tiempos precisos de inferencia por etapas
let stageTimers = {
  startPrompt: 0,
  startSeg1: 0,
  endSeg1: 0,
  startSeg2: 0,
  endSeg2: 0,
  startFinal: 0,
  endFinal: 0,
  ivSeg1: null,
  ivSeg2: null,
  ivFinal: null
};

// UI Tabs
let currentViewMode = "all";

// Listeners de optimizaciones (se adjuntan tras DOMContentLoaded)
function attachAttentionOptimizerListeners(){
  $("workflowMode")?.addEventListener("change", (e) => {
    const mode = e.target.value;
    saveWorkflowMode(mode);
    const target = mode === "blockatt" ? "MMH3X2_WebUI_BlockATT.html" : "MMH3X2_WebUI.html";
    window.location.href = target;
  });

  $("attentionBackend")?.addEventListener("change", () => { saveAttentionBackend(getAttentionBackendState()); scheduleSaveSettings(); });
  $("segAttnNone")?.addEventListener("click", () => { setAttentionOptimizerUI("none"); saveAttentionOptimizer({mode:"none"}); scheduleSaveSettings(); });
  $("segAttnH3")?.addEventListener("click", () => { setAttentionOptimizerUI("h3-optimizations"); saveAttentionOptimizer({mode:"h3-optimizations"}); scheduleSaveSettings(); });
  $("h3SparseBackend")?.addEventListener("change", () => { saveH3Opt(getH3OptState()); scheduleSaveSettings(); });
  $("h3VideoBudget")?.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    const pct = Math.round(val * 100);
    if($("h3VideoBudgetVal")) $("h3VideoBudgetVal").textContent = `${pct}%`;
    saveH3Opt(getH3OptState());
    scheduleSaveSettings();
  });
  $("segDenserOn")?.addEventListener("click", () => { const s = getH3OptState(); s.denserEarlyLate = true; setH3OptUI(s); saveH3Opt(s); scheduleSaveSettings(); });
  $("segDenserOff")?.addEventListener("click", () => { const s = getH3OptState(); s.denserEarlyLate = false; setH3OptUI(s); saveH3Opt(s); scheduleSaveSettings(); });
  $("segMemOptOn")?.addEventListener("click", () => { const s = getH3OptState(); s.memOptEnabled = true; setH3OptUI(s); saveH3Opt(s); scheduleSaveSettings(); });
  $("segMemOptOff")?.addEventListener("click", () => { const s = getH3OptState(); s.memOptEnabled = false; setH3OptUI(s); saveH3Opt(s); scheduleSaveSettings(); });
  $("aimdoResidency")?.addEventListener("change", () => { saveAimdo(getAimdoState()); scheduleSaveSettings(); });
}

// Callbacks CONFIG requeridos por common.js
CONFIG.findMedia = function(output){
  if(!output) return null;
  const vids = output.videos || output.gifs || output.images;
  if(Array.isArray(vids) && vids.length > 0){
    const item = vids[vids.length - 1];
    if(typeof item === "string") return { filename: item, subfolder: "video", type: "output" };
    return item;
  }
  return null;
};

CONFIG.showMedia = function(media, meta){
  const targetPlayer = meta?.targetSlot || 3;
  displayVideoInPlayer(targetPlayer, media);
};

let seedMode = "random";

function setSeedMode(mode){
  if(mode === "fixed"){
    seedMode = "fixed";
    $("segFixed")?.classList.add("on");
    $("segRandom")?.classList.remove("on");
    if($("seedVal")) $("seedVal").disabled = false;
  } else {
    seedMode = "random";
    $("segRandom")?.classList.add("on");
    $("segFixed")?.classList.remove("on");
    if($("seedVal")) $("seedVal").disabled = true;
  }
}

function recalcResolution(){
  if($("mpVal") && $("mpSlider")) $("mpVal").textContent = parseFloat($("mpSlider").value).toFixed(2);
  const img1 = $("previewSlotImg1");
  if(img1?.naturalWidth && img1?.naturalHeight){
    updateCalculatedResolution(img1.naturalWidth, img1.naturalHeight);
  }
  // Si Slot 1 aún no ha cargado, no forzamos 16:9; esperamos al onload/decode.
}

CONFIG.variantMeta = function(){
  const p1 = $("prompt")?.value?.trim() || "";
  const p2 = $("prompt2")?.value?.trim() || "";
  const seg2Mode = $("seg2PromptMode")?.value || "direct";
  const dur1 = parseFloat($("durationSlider1")?.value || $("durationSlider")?.value || "15.0");
  const dur2 = parseFloat($("durationSlider2")?.value || "15.0");
  const f1 = calcFramesForDuration(dur1);
  const f2 = calcFramesForDuration(dur2);
  const fTotal = (f1 - 1) + f2;
  const mp = $("mpSlider")?.value || "0.70";
  const steps = $("stepsSlider")?.value || "20";
  const sampler = $("samplerName")?.value || "res_multistep";
  const scheduler = $("schedulerName")?.value || "simple";
  const unet = $("unetModel")?.value?.split('/')?.pop() || "";
  const clip = $("clipModel")?.value?.split('/')?.pop() || "";
  const w = $("width")?.value || "1280";
  const h = $("height")?.value || "720";
  const rMode = $("rifeMultiplier")?.value || "2";

  const lorasActive = [];
  if($("lora1Toggle")?.checked && $("lora1Select")?.value){
    lorasActive.push(`${$("lora1Select").value.split('/').pop()} (${$("lora1Strength")?.value || "1.0"})`);
  }
  if($("lora2Toggle")?.checked && $("lora2Select")?.value){
    lorasActive.push(`${$("lora2Select").value.split('/').pop()} (${$("lora2Strength")?.value || "1.0"})`);
  }

  const audioMode = $("audioMode")?.value || "none";
  let audioDesc = "sin audio externo";
  if(audioMode === "guide") audioDesc = "Guía Ritmo IA (solo condiciona, IA audible)";
  else if(audioMode === "passthrough") audioDesc = "Pista Directa Final (BGM limpio)";
  else if(audioMode === "hybrid") audioDesc = `Híbrido (IA ${$("audioGuideVolume")?.value ?? "-10"} dB + pista)`;

  const audioCfOn = $("audioCrossfadeToggle") ? $("audioCrossfadeToggle").checked : true;
  const audioCfSec = parseFloat($("audioCrossfadeSlider")?.value || "0.40").toFixed(2);

  const rows = [
    ["Prompt Seg 1", p1 ? (p1.length > 80 ? p1.slice(0, 77) + "..." : p1) : "(vacío)"],
    ["Prompt Seg 2", p2 ? (p2.length > 80 ? p2.slice(0, 77) + "..." : p2) : `[${seg2Mode}]`],
    ["Modo Seg 2", seg2Mode === "guided" ? "Guía Ollama (continuación)" : "Prompt Directo"],
    ["Modo Audio", audioDesc],
    ["Refs compartidas", $("shareRefsToggle")?.checked ? "sí (Img 2/3/4 en ambos)" : "no"],
    ["Ref size", $("refImageSize")?.value || "match"],
    ["Crossfade Audio", audioCfOn ? `${audioCfSec}s (${$("audioCrossfadeCurve")?.value || 'equal_power'})` : "desactivado"],
    ["Duración Seg 1", `${dur1.toFixed(1)}s (${f1}f)`],
    ["Duración Seg 2", `${dur2.toFixed(1)}s (${f2}f)`],
    ["Duración Total", `${(fTotal / 24).toFixed(1)}s (${fTotal}f)`],
    ["Resolución", `${w}×${h} (${mp} MP)`],
    ["Pasos (Steps)", steps],
    ["Sampler", sampler],
    ["Scheduler", scheduler],
    ["UNet", unet],
    ["CLIP", clip],
    ["LoRAs", lorasActive.length ? lorasActive.join(", ") : "ninguno"],
    ["Backend denso", $("attentionBackend")?.value || "comfy kitchen attention"],
    ["Video budget", `${Math.round((parseFloat($("h3VideoBudget")?.value || "0.30")) * 100)}%`],
    ["Denser early/late", $("segDenserOn")?.classList.contains("on") ? "Sí" : "No"],
    ["Memory opt", $("segMemOptOn")?.classList.contains("on") ? "Sí" : "No"],
    IS_BLOCKATT ? ["Optimizador", getAttentionOptimizerState().mode] : null,
    ["RIFE", `${rMode}x`]
  ].filter(Boolean);

  return { title: "Parámetros MMH3X2", rows, loras: lorasActive };
};

function formatWorkflowToMeta(workflow){
  if(!workflow || typeof workflow !== "object") return null;
  const rows = [];
  if(workflow["50"]?.inputs?.value) rows.push(["Prompt 1", String(workflow["50"].inputs.value).slice(0, 80)]);
  else if(workflow["6"]?.inputs?.text) rows.push(["Prompt", String(workflow["6"].inputs.text).slice(0, 80)]);
  if(workflow["58"]?.inputs?.value) rows.push(["Prompt 2", String(workflow["58"].inputs.value).slice(0, 80)]);
  if(workflow["12"]?.inputs?.value) rows.push(["Duración", `${workflow["12"].inputs.value}s`]);
  if(workflow["79"]?.inputs?.value) rows.push(["Pasos", workflow["79"].inputs.value]);
  else if(workflow["124"]?.inputs?.steps) rows.push(["Pasos", workflow["124"].inputs.steps]);
  if(workflow["123"]?.inputs?.sampler_name) rows.push(["Sampler", workflow["123"].inputs.sampler_name]);
  if(workflow["124"]?.inputs?.scheduler) rows.push(["Scheduler", workflow["124"].inputs.scheduler]);
  else if(workflow["18"]?.inputs?.scheduler) rows.push(["Scheduler", workflow["18"].inputs.scheduler]);
  if(workflow["15"]?.inputs?.noise_seed !== undefined) rows.push(["Seed", workflow["15"].inputs.noise_seed]);
  if(workflow["77"]?.inputs?.megapixels) rows.push(["Megapixels", workflow["77"].inputs.megapixels]);
  const loras = [];
  if(workflow["145_1"]?.inputs?.lora_name) loras.push(`${workflow["145_1"].inputs.lora_name.split('/').pop()} (${workflow["145_1"].inputs.strength_model || 1})`);
  if(workflow["145_2"]?.inputs?.lora_name) loras.push(`${workflow["145_2"].inputs.lora_name.split('/').pop()} (${workflow["145_2"].inputs.strength_model || 1})`);
  if(loras.length) rows.push(["LoRAs", loras.join(", ")]);

  return { title: "Metadata Vídeo", rows, loras };
}

CONFIG.onNodeExecuted = function(data){
  if(!data) return;
  const nid = String(data.node);
  if(nid === String(N.SAMPLE_1) || nid === String(N.SAVE_VID_1) || nid === "19" || nid === "23"){
    currentActiveSamplerSlot = 2;
  }
  if((nid === String(N.SAVE_VID_1) || nid === "23") && data.output){
    if(stageTimers.ivSeg1){ clearInterval(stageTimers.ivSeg1); stageTimers.ivSeg1 = null; }
    stageTimers.endSeg1 = Date.now();
    const seg1Ms = stageTimers.endSeg1 - (stageTimers.startSeg1 || stageTimers.startPrompt || Date.now());
    const el1 = $("timeSeg1");
    if(el1){ el1.textContent = `⏱ ${fmtMs(seg1Ms)}`; el1.classList.remove("live"); }

    // Iniciar timer en vivo para Segmento 2 si está pendiente
    stageTimers.startSeg2 = Date.now();
    const el2 = $("timeSeg2");
    if(el2){
      el2.textContent = "⏱ 00:00";
      el2.classList.add("live");
      if(stageTimers.ivSeg2) clearInterval(stageTimers.ivSeg2);
      stageTimers.ivSeg2 = setInterval(() => {
        const elapsed = Date.now() - stageTimers.startSeg2;
        if(el2) el2.textContent = `⏱ ${fmtMs(elapsed)}`;
      }, 500);
    }

    const m1 = CONFIG.findMedia(data.output);
    if(m1){
      displayVideoInPlayer(1, m1);
      log("✅ Vídeo Segmento 1 generado y cargado en reproductor 1", "l-ok");
    }
  }
  if((nid === String(N.SAVE_VID_2) || nid === "39") && data.output){
    if(stageTimers.ivSeg2){ clearInterval(stageTimers.ivSeg2); stageTimers.ivSeg2 = null; }
    stageTimers.endSeg2 = Date.now();
    const seg2Ms = stageTimers.endSeg2 - (stageTimers.startSeg2 || stageTimers.startPrompt || Date.now());
    const el2 = $("timeSeg2");
    if(el2){ el2.textContent = `⏱ ${fmtMs(seg2Ms)}`; el2.classList.remove("live"); }

    const m2 = CONFIG.findMedia(data.output);
    if(m2){
      displayVideoInPlayer(2, m2);
      log("✅ Vídeo Segmento 2 generado y cargado en reproductor 2", "l-ok");
    }
  }
  if((nid === String(N.SAVE_VID_FINAL) || nid === "43") && data.output){
    if(stageTimers.ivFinal){ clearInterval(stageTimers.ivFinal); stageTimers.ivFinal = null; }
    stageTimers.endFinal = Date.now();
    const totalMs = stageTimers.endFinal - (stageTimers.startPrompt || Date.now());
    const elFinal = $("timeFinal");
    if(elFinal){ elFinal.textContent = `⏱ ${fmtMs(totalMs)}`; elFinal.classList.remove("live"); }

    const mf = CONFIG.findMedia(data.output);
    if(mf){
      displayVideoInPlayer(3, mf);
      log("✅ Vídeo Final Continuo listo y cargado en reproductor principal", "l-ok");
    }
  }
};

CONFIG.onProgress = function(value, max, prompt_id, node){
  if(!max || max <= 0) return;
  const pct = Math.round((value / max) * 100);
  const nid = node ? String(node) : "";

  // Determinar etapa actual según el nodo de ejecución o el muestreador activo
  let activeSlot = (currentActiveSamplerSlot === 2) ? "Seg2" : "Seg1";
  let label = (activeSlot === "Seg1") ? "Seg 1" : "Seg 2";

  if(nid === String(N.SAMPLE_1) || nid === "19"){
    activeSlot = "Seg1";
    currentActiveSamplerSlot = 1;
    label = "Seg 1";
  } else if(nid === String(N.SAMPLE_2) || nid === "35"){
    activeSlot = "Seg2";
    currentActiveSamplerSlot = 2;
    label = "Seg 2";
  } else if(nid === String(N.RIFE) || nid === "72"){
    label = "RIFE";
  }

  // 1. Actualizar badge del reproductor del segmento activo
  const b = $("previewStep" + activeSlot);
  const t = $("previewStepText" + activeSlot);
  const w = $("previewWrap" + activeSlot);
  const e = $("empty" + activeSlot);
  if(b && t){
    t.textContent = `${label}: Paso ${value}/${max} · ${pct}%`;
    if(w) w.style.display = "block";
    if(e) e.style.display = "none";
    b.style.display = "inline-flex";
  }

  // 2. Actualizar badge del reproductor final continuo
  const bFin = $("previewStepFinal");
  const tFin = $("previewStepTextFinal");
  const wFin = $("previewWrapFinal");
  const eFin = $("emptyFinal");
  if(bFin && tFin){
    tFin.textContent = `${label}: Paso ${value}/${max} · ${pct}%`;
    if(wFin) wFin.style.display = "block";
    if(eFin) eFin.style.display = "none";
    bFin.style.display = "inline-flex";
  }

  // 3. Actualizar badge de progreso en la tarjeta de variante activa (si existe)
  const pid = prompt_id || currentPromptId;
  if(pid && promptVariantMap[pid]){
    const varIdx = promptVariantMap[pid];
    const cardBadge = document.querySelector(`.variant-card[data-variant-index="${varIdx}"] .variant-progress-badge`);
    if(cardBadge){
      cardBadge.textContent = `${label}: ${value}/${max} (${pct}%)`;
      cardBadge.style.display = "block";
    }
  }

  // 4. Log en tiempo real
  const logEl = $("log");
  if(logEl){
    logEl.textContent = `⏳ ${label}: Paso ${value}/${max} (${pct}%)`;
    logEl.className = "log l-busy";
  }
};

CONFIG.onNodeExecuting = function(data){
  if(!data) return;
  const node = typeof data === "object" ? String(data.node || "") : String(data);
  if(!node) return;

  if(node === String(N.SAMPLE_1) || node === "19"){
    currentActiveSamplerSlot = 1;
    log("🧠 Muestreando Segmento 1...", "l-busy");
  } else if(node === String(N.DECODE_VID_1) || node === "20"){
    log("🎬 Decodificando vídeo Segmento 1...", "l-busy");
  } else if(node === String(N.CREATE_VID_1) || node === "22" || node === String(N.SAVE_VID_1) || node === "23"){
    log("💾 Guardando vídeo Segmento 1...", "l-busy");
  } else if(node === "25" || node === "26" || node === "28" || node === "29"){
    log("🎞️ Extrayendo fotogramas de anclaje de Seg 1...", "l-busy");
  } else if(node === "54" || node === "57"){
    log("🔍 Muestreando fotogramas para visión...", "l-busy");
  } else if(node === "52"){
    log("🧹 Liberando VRAM de ComfyUI (14 GB) para que Ollama se ejecute 100% en GPU...", "l-busy");
    const t2 = $("previewStepTextSeg2");
    if(t2) t2.textContent = "Liberando VRAM...";
  } else if(node === "51" || node === "53" || node === "55" || node === "59"){
    log("🤖 Ollama (GPU): Analizando visión y redactando continuidad para Seg 2...", "l-busy");
    const t2 = $("previewStepTextSeg2");
    const b2 = $("previewStepSeg2");
    const w2 = $("previewWrapSeg2");
    if(t2 && b2 && w2){
      t2.textContent = "Seg 2: Ollama (visión + fusión)...";
      w2.style.display = "block";
      b2.style.display = "inline-flex";
    }
    const tFin = $("previewStepTextFinal");
    if(tFin) tFin.textContent = "Ollama: procesando continuidad...";
  } else if(node === String(N.REF2V_SEG2) || node === "30" || node === String(N.INJECT_LATENT) || node === "68" || node === String(N.ADD_GUIDE) || node === "70" || node === "32"){
    currentActiveSamplerSlot = 2;
    log("🔗 Inicializando Segmento 2 (anclando último frame)...", "l-busy");
    const t2 = $("previewStepTextSeg2");
    if(t2) t2.textContent = "Seg 2: Inicializando...";
  } else if(node === String(N.SAMPLE_2) || node === "35"){
    currentActiveSamplerSlot = 2;
    log("🧠 Muestreando Segmento 2...", "l-busy");
  } else if(node === String(N.DECODE_VID_2) || node === "36"){
    log("🎬 Decodificando vídeo Segmento 2...", "l-busy");
  } else if(node === String(N.CREATE_VID_2) || node === "38" || node === String(N.SAVE_VID_2) || node === "39"){
    log("💾 Guardando vídeo Segmento 2...", "l-busy");
  } else if(node === String(N.BLEND) || node === "66" || node === String(N.IMAGE_BATCH) || node === "40"){
    log("✨ Suavizando empalme y uniendo Segmentos 1 y 2...", "l-busy");
  } else if(node === String(N.RTX) || node === "71"){
    log("🚀 Aplicando RTX Video Super Resolution (2x)...", "l-busy");
    const tFin = $("previewStepTextFinal");
    if(tFin) tFin.textContent = "RTX Super Resolution...";
  } else if(node === String(N.RIFE) || node === "72"){
    log("⚡ Interpolando fotogramas con RIFE...", "l-busy");
    const tFin = $("previewStepTextFinal");
    if(tFin) tFin.textContent = "RIFE: Interpolando...";
  } else if(node === String(N.CREATE_VID_FINAL) || node === "42" || node === String(N.SAVE_VID_FINAL) || node === "43"){
    log("💾 Ensamblando y codificando Vídeo Final Continuo...", "l-busy");
  }
};

CONFIG.onPreview = function(url, meta){
  const slot = (currentActiveSamplerSlot === 2) ? "Seg2" : "Seg1";
  const p = $("previewImg" + slot);
  const pv = $("previewVideo" + slot);
  const e = $("empty" + slot);
  const v = $("video" + slot);
  const w = $("previewWrap" + slot);
  if(!p && !pv) return;

  const isVideoUrl = typeof url === "string" && (url.startsWith("data:video/mp4") || url.startsWith("data:video/webm"));
  const target = isVideoUrl && pv ? pv : p;
  const other = isVideoUrl ? p : pv;

  target.src = url;
  target.style.display = "block";
  if(other) other.style.display = "none";
  if(w) w.style.display = "block";
  if(e) e.style.display = "none";
  if(v && !v.src) v.style.display = "none";
  if(isVideoUrl && pv && pv.autoplay !== true){ pv.autoplay = true; pv.muted = true; pv.loop = true; }
  if(isVideoUrl && target.play) target.play().catch(()=>{});

  // Actualizar también en el reproductor final si no hay vídeo terminado cargado
  const vFin = $("videoFinal");
  if(!vFin || !vFin.src || vFin.style.display !== "block"){
    const pFin = $("previewImgFinal");
    const pvFin = $("previewVideoFinal");
    const wFin = $("previewWrapFinal");
    const eFin = $("emptyFinal");
    const targetFin = isVideoUrl && pvFin ? pvFin : pFin;
    const otherFin = isVideoUrl ? pFin : pvFin;
    if(targetFin){
      // Limpiar el preview anterior para evitar que dos videos compitan por recursos
      if(targetFin.tagName === "VIDEO" && targetFin.src){
        targetFin.pause();
        targetFin.removeAttribute("src");
        targetFin.load();
      }
      targetFin.src = url;
      targetFin.style.display = "block";
      if(otherFin){ otherFin.style.display = "none"; otherFin.removeAttribute("src"); }
      if(wFin) wFin.style.display = "block";
      if(eFin) eFin.style.display = "none";
      if(isVideoUrl && targetFin.play) targetFin.play().catch(()=>{});
    }
  }

  // Actualizar miniatura en vivo en la tarjeta de variante activa
  const pid = meta?.promptId || currentPromptId;
  if(pid && promptVariantMap[pid]){
    const varIdx = promptVariantMap[pid];
    const liveThumb = document.querySelector(`.variant-card[data-variant-index="${varIdx}"] .variant-live-thumb`);
    if(liveThumb && !isVideoUrl){
      liveThumb.src = url;
      liveThumb.style.opacity = "1";
    }
  }
};

CONFIG.onClearPreview = function(){
  ["Final", "Seg1", "Seg2"].forEach(slot => {
    const p = $("previewImg" + slot);
    const pv = $("previewVideo" + slot);
    const w = $("previewWrap" + slot);
    const b = $("previewStep" + slot);
    if(p){ p.style.display = "none"; p.removeAttribute("src"); }
    if(pv){ pv.pause(); pv.style.display = "none"; pv.removeAttribute("src"); pv.load(); }
    if(w) w.style.display = "none";
    if(b) b.style.display = "none";
  });
};

// Reset de los 3 paneles de preview al empezar una nueva variante: sin esto,
// Seg1/Final muestran el preview (o resultado) de la generación anterior hasta
// que llega el preview nuevo. Limpia los elementos de preview en vivo (img/video
// de preview) y las cajas de "vacío", pero NO los reproductores de resultados
// (videoSeg1/videoSeg2/videoFinal), que solo se tocan al cargar un resultado.
function resetPreviewPanes(){
  ["Final", "Seg1", "Seg2"].forEach(slot => {
    const p = $("previewImg" + slot);
    const pv = $("previewVideo" + slot);
    const w = $("previewWrap" + slot);
    const b = $("previewStep" + slot);
    const e = $("empty" + slot);
    if(p){ p.style.display = "none"; p.removeAttribute("src"); }
    if(pv){ pv.pause(); pv.style.display = "none"; pv.removeAttribute("src"); pv.load(); }
    if(w) w.style.display = "none";
    if(b) b.style.display = "none";
    if(e) e.style.display = "";
  });
}

function createGeneratingCard(varIdx, seedUsed){
  const box = $("variantGalleryBox");
  const grid = $("variantGrid");
  if(!box || !grid) return;
  box.style.display = "block";

  let card = grid.querySelector(`.variant-card[data-variant-index="${varIdx}"]`);
  if(!card){
    card = document.createElement("div");
    card.className = "variant-card variant-card-generating";
    card.dataset.variantIndex = String(varIdx);
    card.innerHTML = `
      <span class="variant-badge">Var ${varIdx} · procesando...</span>
      <span class="variant-progress-badge" style="display:none;"></span>
      <div class="thumb-wrap" style="position:relative;background:#000;min-height:120px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:4px 4px 0 0;">
        <img class="variant-live-thumb" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" style="display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;opacity:0.4;transition:opacity 0.2s;">
      </div>
      <div class="variant-info" style="padding:6px;background:var(--panel);">
        <span class="variant-seed-display" title="Semilla" style="font-size:10px;font-family:var(--mono);color:var(--muted);">Seed: ${seedUsed}</span>
        <span class="variant-time" style="font-size:10px;color:var(--accent);margin-left:auto;">⏳ En curso...</span>
      </div>
    `;
    grid.insertBefore(card, grid.firstChild);
    const remaining = grid.querySelectorAll(".variant-card").length;
    if($("variantCount")) $("variantCount").textContent = `(${remaining})`;
  }
}

CONFIG.addToVariantGallery = function(mediaOrUrl, seed, varIdx, promptText){
  const gallery = $("variantGalleryBox");
  const grid = $("variantGrid");
  if(!gallery || !grid) return;
  gallery.style.display = "block";

  const url = (typeof mediaOrUrl === "string")
    ? mediaOrUrl.split("#")[0]
    : mediaViewUrl(mediaOrUrl);

  let card = grid.querySelector(`.variant-card[data-variant-index="${varIdx}"]`);
  if(!card){
    card = document.createElement("div");
    card.dataset.variantIndex = String(varIdx);
    grid.insertBefore(card, grid.firstChild);
  }
  card.className = "variant-card";
  card.innerHTML = `
    <div class="thumb-wrap">
      <video src="${url}#t=0.001" crossorigin="anonymous" controls muted preload="metadata" playsinline style="width:100%;height:auto;max-height:220px;object-fit:contain;"></video>
      <span class="variant-badge">Var ${varIdx} · Seed ${seed}</span>
    </div>
    <div style="padding:6px;display:flex;justify-content:space-between;align-items:center;background:var(--panel);">
      <button type="button" class="ghost btn-mini btn-load-card" title="Cargar en reproductor principal">▶ Cargar</button>
      <button type="button" class="ghost btn-mini btn-del-card" title="Quitar de galería">✕</button>
    </div>
  `;

  const countBadge = $("variantCount");
  const totalCards = grid.querySelectorAll(".variant-card").length;
  if(countBadge) countBadge.textContent = `(${totalCards})`;

  const videoEl = card.querySelector("video");
  if(videoEl){
    videoEl.addEventListener("loadedmetadata", () => {
      if(videoEl.currentTime === 0){
        videoEl.currentTime = 0.001;
      }
    }, { once: true });
  }

  const meta = CONFIG.variantMeta ? CONFIG.variantMeta() : null;
  if(meta) card.dataset.meta = JSON.stringify(meta);
  card.addEventListener("mouseenter", () => showVariantTooltip(card));
  card.addEventListener("mouseleave", () => hideVariantTooltip());
  card.addEventListener("mousemove", (e) => positionVariantTooltip(e));

  card.querySelector(".btn-load-card").addEventListener("click", () => { displayVideoInPlayer(3, mediaOrUrl, { autoplay: true, filename: `Var ${varIdx}` }); });
  card.querySelector(".btn-del-card").addEventListener("click", () => {
    card.remove();
    hideVariantTooltip();
    const remaining = grid.querySelectorAll(".variant-card").length;
    if(countBadge) countBadge.textContent = remaining > 0 ? `(${remaining})` : "";
    if(remaining === 0) gallery.style.display = "none";
  });
};

CONFIG.displayResult = async function(entry, realSeed, tTotal, promptId, timings){
  let found = false;
  if(stageTimers.ivFinal){ clearInterval(stageTimers.ivFinal); stageTimers.ivFinal = null; }
  if(stageTimers.ivSeg1){ clearInterval(stageTimers.ivSeg1); stageTimers.ivSeg1 = null; }
  if(stageTimers.ivSeg2){ clearInterval(stageTimers.ivSeg2); stageTimers.ivSeg2 = null; }

  const totalTimeStr = tTotal || fmtMs(Date.now() - (stageTimers.startPrompt || Date.now()));
  const elF = $("timeFinal");
  if(elF){
    elF.textContent = `⏱ ${totalTimeStr}`;
    elF.classList.remove("live");
  }

  try {
    // Los reproductores ya muestran estos vídeos (onNodeExecuted los cargó al
    // guardar cada nodo). Si displayResult los vuelve a cargar, los pausados
    // (seg1/seg2 ya terminaron durante el postproceso) se relanzan y suenan
    // todos a la vez segundos después de que el final empezó. Solo cargamos
    // si el slot NO muestra ya ese mismo medio (ruta pollFallback, WS perdido).
    const playerAlreadyShows = (slotIndex, media) => {
      const cur = currentMedia[slotIndex];
      const suffix = (slotIndex === 1) ? "Seg1" : (slotIndex === 2 ? "Seg2" : "Final");
      const video = $("video" + suffix);
      return !!(cur && media && cur.filename === media.filename
        && video && video.getAttribute("src") && video.style.display === "block");
    };
    if(entry?.outputs?.[N.SAVE_VID_1]){
      const m1 = CONFIG.findMedia(entry.outputs[N.SAVE_VID_1]);
      if(m1){ found = true; if(!playerAlreadyShows(1, m1)) displayVideoInPlayer(1, m1); }
    }
    if(entry?.outputs?.[N.SAVE_VID_2]){
      const m2 = CONFIG.findMedia(entry.outputs[N.SAVE_VID_2]);
      if(m2){ found = true; if(!playerAlreadyShows(2, m2)) displayVideoInPlayer(2, m2); }
    }
    if(entry?.outputs?.[N.SAVE_VID_FINAL]){
      const mf = CONFIG.findMedia(entry.outputs[N.SAVE_VID_FINAL]);
      if(mf){
        found = true;
        if(!playerAlreadyShows(3, mf)) displayVideoInPlayer(3, mf);
        const varIndex = promptVariantMap[promptId] || (variantCounter + 1);
        CONFIG.addToVariantGallery(mf, realSeed, varIndex);
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

// Nota: no borramos pendingSeeds/promptVariantMap aquí porque
// common.js::handlePromptDone() ya se encarga de limpiar tras recibir true
// (skipFinalize), y borrarlos antes haría que pollFallback no reconozca
// la variante y reintente innecesariamente.

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
      if(jobQueue.length > 0){
        const nextJob = jobQueue.shift();
        log(`⏭️ Iniciando tarea en cola (${jobQueue.length} restantes)...`, "l-info");
        startJob(nextJob);
      }
      return;
    }
  } else {
    queueIdleCount = 0;
  }

  enableStopButtons(!!activeJob);

  // Cálculo de variantes/vídeos pendientes (patrón LTXV/MiniMaxH3)
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
      const runLabel = activeJob.runMode === "seg1_only" ? "Solo Seg 1"
        : (activeJob.runMode === "seg2_only" ? "Seg 2 + Final" : "Completo");
      webuiDetail.textContent = `▶ ${runLabel} · Var ${currentBatchIndex + 1}/${totalBatchSize}`;
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
      const pText = (job.prompt || "sin prompt").trim();
      const pShort = pText.length > 35 ? pText.slice(0, 35) + "…" : pText;
      const runLabel = job.runMode === "seg1_only" ? "Solo Seg 1"
        : (job.runMode === "seg2_only" ? "Seg 2 + Final" : "completo");
      row.innerHTML = `
        <div class="queue-item-left" title="${pText}">
          <span class="queue-item-id">#${idx + 1}</span>
          <span class="queue-item-desc">${pShort} · ${job.batchSize || 1} var(s) · ${runLabel}</span>
        </div>
        <span class="queue-item-del" title="Eliminar este trabajo de la cola">×</span>
      `;
      row.querySelector(".queue-item-del").addEventListener("click", (e) => {
        e.stopPropagation();
        jobQueue.splice(idx, 1);
        updateQueueUI();
        log(`🗑️ Trabajo #${idx + 1} eliminado de la cola.`, "l-ok");
      });
      itemsList.appendChild(row);
    });
  }
}

$("queueItemsToggle")?.addEventListener("click", () => {
  $("queueItemsAccordion")?.classList.toggle("open");
});

// ==========================================
// ==========================================
// RENDER Y GESTIÓN DE REPRODUCTORES (H3/LTX PATTERN)
// ==========================================
const currentMedia = { 1: null, 2: null, 3: null };

// --- EXTRACCIÓN DE WORKFLOW DESDE METADATOS MP4 ---
async function extractWorkflowFromMP4Buffer(arrayBuffer){
  const bytes = new Uint8Array(arrayBuffer);
  let startIdx = -1;
  const marker = new TextEncoder().encode('"prompt": {');
  outer: for(let i = 0; i <= bytes.length - marker.length; i++){
    for(let j = 0; j < marker.length; j++){
      if(bytes[i + j] !== marker[j]) continue outer;
    }
    startIdx = i + marker.length - 1;
    break;
  }
  if(startIdx < 0){
    for(let i = 0; i < bytes.length - 4; i++){
      if(bytes[i] !== 0x7B || bytes[i+1] !== 0x22) continue;
      let j = i + 2;
      while(j < bytes.length && bytes[j] >= 0x30 && bytes[j] <= 0x39) j++;
      if(j === i + 2) continue;
      if(bytes[j] !== 0x22) continue;
      let k = j + 1;
      while(k < bytes.length && (bytes[k] === 0x20 || bytes[k] === 0x09 || bytes[k] === 0x0A || bytes[k] === 0x0D)) k++;
      if(bytes[k] === 0x3A){
        let m = k + 1;
        while(m < bytes.length && (bytes[m] === 0x20 || bytes[m] === 0x09 || bytes[m] === 0x0A || bytes[m] === 0x0D)) m++;
        if(bytes[m] === 0x7B){ startIdx = i; break; }
      }
    }
  }
  if(startIdx < 0) return null;
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
  decoder.decode();
  return null;
}

async function extractWorkflowFromMP4(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error("HTTP "+r.status);
  return extractWorkflowFromMP4Buffer(await r.arrayBuffer());
}

function applyWorkflow(workflow){
  if(!workflow || typeof workflow !== "object") return;
  function findByClass(gt){
    for(const k of Object.keys(workflow)){
      if(workflow[k] && workflow[k].class_type === gt) return workflow[k];
    }
    return null;
  }

  // 1. Prompt 1 & Prompt 2
  if(workflow["50"]?.inputs?.value && $("prompt")){
    $("prompt").value = workflow["50"].inputs.value;
  }
  if(workflow["58"]?.inputs?.value && $("prompt2")){
    $("prompt2").value = workflow["58"].inputs.value;
  }

  // 2. Modo Segmento 2 (Ollama vs Directo)
  const isGuided = !!(workflow["53"] || workflow["55"]);
  if($("seg2PromptMode")){
    $("seg2PromptMode").value = isGuided ? "guided" : "direct";
  }

  // 3. Duración (Segmentos 1 y 2)
  if(workflow["12"]?.inputs?.value && $("durationSlider1")){
    $("durationSlider1").value = workflow["12"].inputs.value;
  }
  if(workflow["12_seg2"]?.inputs?.value && $("durationSlider2")){
    $("durationSlider2").value = workflow["12_seg2"].inputs.value;
  } else if(workflow["12"]?.inputs?.value && $("durationSlider2")){
    $("durationSlider2").value = workflow["12"].inputs.value;
  }
  updateDurationFrames();

  // 4. Megapíxeles
  if(workflow["77"]?.inputs?.megapixels && $("mpSlider")){
    $("mpSlider").value = workflow["77"].inputs.megapixels;
  }
  recalcResolution(); // recalcula si Slot 1 ya cargó; si no, el onload lo hará

  // 5. Steps
  if(workflow["79"]?.inputs?.value && $("stepsSlider")){
    $("stepsSlider").value = workflow["79"].inputs.value;
    if($("stepsVal")) $("stepsVal").textContent = workflow["79"].inputs.value;
  }

  // 6. Seed
  if(workflow["15"]?.inputs?.noise_seed !== undefined && $("seedVal")){
    $("seedVal").value = workflow["15"].inputs.noise_seed;
    setSeedMode("fixed");
  }

  // 7. LoRAs
  if(workflow["145_1"]?.inputs && $("lora1Toggle")){
    $("lora1Toggle").checked = true;
    if($("lora1Select")) $("lora1Select").value = workflow["145_1"].inputs.lora_name || "";
    if($("lora1Strength")) $("lora1Strength").value = workflow["145_1"].inputs.strength_model || 1.0;
    if($("lora1Val")) $("lora1Val").textContent = workflow["145_1"].inputs.strength_model || 1.0;
  }
  if(workflow["145_2"]?.inputs && $("lora2Toggle")){
    $("lora2Toggle").checked = true;
    if($("lora2Select")) $("lora2Select").value = workflow["145_2"].inputs.lora_name || "";
    if($("lora2Strength")) $("lora2Strength").value = workflow["145_2"].inputs.strength_model || 1.0;
    if($("lora2Val")) $("lora2Val").textContent = workflow["145_2"].inputs.strength_model || 1.0;
  }

  // 8. Sampler & Scheduler
  const samplerNode = workflow["123"] || findByClass("KSamplerSelect");
  if(samplerNode?.inputs?.sampler_name && $("samplerName")){
    $("samplerName").value = samplerNode.inputs.sampler_name;
  }
  const schedNode = workflow["18"] || workflow["34"] || workflow["124"] || findByClass("BasicScheduler");
  if(schedNode?.inputs?.scheduler && $("schedulerName")){
    $("schedulerName").value = schedNode.inputs.scheduler;
  }

  // 9. Modelos UNet & CLIP
  const unetNode = workflow["14"] || workflow["10"] || findByClass("UNETLoader");
  if(unetNode?.inputs?.unet_name && $("unetModel")){
    $("unetModel").value = unetNode.inputs.unet_name;
  }
  const clipNode = workflow["11"] || findByClass("CLIPLoader");
  if(clipNode?.inputs?.clip_name && $("clipModel")){
    $("clipModel").value = clipNode.inputs.clip_name;
  }

  // 10. Optimizaciones de atención MMH3X2
  const attnBackendNode = findByClass("ModelAttentionBackend");
  if(attnBackendNode?.inputs?.attention){
    setAttentionBackendUI({ backend: attnBackendNode.inputs.attention });
    saveAttentionBackend({ backend: attnBackendNode.inputs.attention });
  }

  const sparseNode = findByClass("H3SparseAttention") || findByClass("H3SparseAttentionAdvanced");
  const sparseAdvancedNode = findByClass("H3SparseAttentionAdvanced");
  const blockSparseNode = findByClass("BlockSparseAttention");
  const aimdoNode = findByClass("H3AIMDOResidencyLimiter");
  const memOptNode = findByClass("H3MemoryOptimization");

  if(blockSparseNode?.inputs){
    const bs = { ...BLOCK_SPARSE_DEFAULTS };
    const sel = blockSparseNode.inputs.selection;
    bs.selection = mapBlockSparseSelection(sel) || bs.selection;
    if(blockSparseNode.inputs["selection.tau"] != null) bs.tau = blockSparseNode.inputs["selection.tau"];
    if(blockSparseNode.inputs.start_percent != null) bs.startPercent = blockSparseNode.inputs.start_percent;
    if(blockSparseNode.inputs.end_percent != null) bs.endPercent = blockSparseNode.inputs.end_percent;
    setBlockSparseUI(bs);
    saveBlockSparse(bs);
    setAttentionOptimizerUI("block-sparse");
    saveAttentionOptimizer({ mode: "block-sparse" });
  } else if(sparseAdvancedNode?.inputs || sparseNode?.class_type === "H3SparseAttentionAdvanced"){
    const h3State = loadH3Opt();
    if(typeof sparseNode.inputs.video_budget === "number") h3State.videoBudget = sparseNode.inputs.video_budget;
    if(typeof sparseNode.inputs.denser_early_late_steps === "boolean") h3State.denserEarlyLate = sparseNode.inputs.denser_early_late_steps;
    else if(typeof sparseNode.inputs.denser_early_late_steps === "string") h3State.denserEarlyLate = sparseNode.inputs.denser_early_late_steps === "true";
    if(typeof sparseNode.inputs.backend === "string") h3State.sparseBackend = sparseNode.inputs.backend;
    h3State.memOptEnabled = !!memOptNode;
    setH3OptUI(h3State);
    saveH3Opt(h3State);
    if(aimdoNode?.inputs?.residency_limit){
      const aimdoState = { residency: aimdoNode.inputs.residency_limit };
      setAimdoUI(aimdoState);
      saveAimdo(aimdoState);
    }
    setAttentionOptimizerUI("h3-optimizations");
    saveAttentionOptimizer({ mode: "h3-optimizations" });
  } else if(sparseNode?.inputs){
    const h3State = loadH3Opt();
    if(typeof sparseNode.inputs.video_budget === "number") h3State.videoBudget = sparseNode.inputs.video_budget;
    if(typeof sparseNode.inputs.denser_early_late_steps === "boolean") h3State.denserEarlyLate = sparseNode.inputs.denser_early_late_steps;
    else if(typeof sparseNode.inputs.denser_early_late_steps === "string") h3State.denserEarlyLate = sparseNode.inputs.denser_early_late_steps === "true";
    h3State.memOptEnabled = !!memOptNode;
    setH3OptUI(h3State);
    saveH3Opt(h3State);
    setAttentionOptimizerUI("none");
    saveAttentionOptimizer({ mode: "none" });
  }

  // 11. Toggles postprocesado y RIFE
  const rifeNode = workflow["72"] || findByClass("FrameInterpolate");
  if($("rifeToggle")) $("rifeToggle").checked = !!rifeNode;
  if(rifeNode?.inputs?.multiplier && $("rifeMultiplier")){
    $("rifeMultiplier").value = String(rifeNode.inputs.multiplier);
  }
  if($("rtxToggle")) $("rtxToggle").checked = !!findByClass("RTXVideoSuperResolution");
  if($("blendToggle")) $("blendToggle").checked = !!findByClass("VideoTemporalBlend");

  saveSettings();
}

function displayVideoInPlayer(slotIndex, mediaOrUrl, options = {}){
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
  const badge = $("badge" + suffix);

  if(!mediaOrUrl) return;

  // Resolver media y url
  let media = null;
  let videoUrl = "";
  if(typeof mediaOrUrl === "string"){
    videoUrl = mediaOrUrl.split("#")[0];
    media = options.media || {
      filename: options.filename || "",
      subfolder: options.subfolder || "video",
      type: options.type || "output"
    };
  } else {
    media = mediaOrUrl;
    const f = encodeURIComponent(media.filename || "");
    const s = encodeURIComponent(media.subfolder || "");
    const t = encodeURIComponent(media.type || "output");
    videoUrl = `${server()}/view?filename=${f}&subfolder=${s}&type=${t}`;
  }
  currentMedia[slotIndex] = media;

  if(empty) empty.style.display = "none";
  if(pImg){ pImg.style.display = "none"; pImg.removeAttribute("src"); }
  if(pVid){ pVid.pause(); pVid.style.display = "none"; pVid.removeAttribute("src"); pVid.load(); }
  const wrap = $("previewWrap" + suffix);
  const step = $("previewStep" + suffix);
  if(wrap) wrap.style.display = "none";
  if(step) step.style.display = "none";

  const fn = media.filename || options.filename;
  if(badge && fn){
    badge.textContent = fn;
    badge.style.display = "inline-block";
  }

  if(video){
    video.crossOrigin = "anonymous";
    // Comparar contra getAttribute("src") (lo que asignamos) y no contra
    // video.src (el DOM lo devuelve como URL absoluta, así que la comparación
    // fallaría siempre y recargaría el vídeo, cortando la reproducción en
    // curso cada vez que displayResult re-carga el mismo media).
    const prevUrl = video.getAttribute("src");
    if(prevUrl !== videoUrl){
      video.src = videoUrl;
      video.load();
    }
    video.style.display = "block";
    const alreadyPlaying = prevUrl === videoUrl && !video.paused && options.autoplay !== false;
    if(options.autoplay !== false && !alreadyPlaying){
      video.play().catch(err => console.log("Autoplay:", err));
    }
    const onMeta = () => {
      const vw = video.videoWidth || 0, vh = video.videoHeight || 0;
      if(vw && vh){
        function gcd(a, b){ return b ? gcd(b, a % b) : a; }
        const d = gcd(vw, vh) || 1;
        const durStr = video.duration ? ` · ${video.duration.toFixed(1)}s` : "";
        if(resTag) resTag.textContent = `${vw}×${vh} · ${vw/d}:${vh/d}${durStr}`;
      }
      video.removeEventListener("loadedmetadata", onMeta);
    };
    if(video.videoWidth && video.videoHeight){
      onMeta();
    } else {
      video.addEventListener("loadedmetadata", onMeta);
    }
    video.onerror = () => {
      const err = video.error;
      const code = err ? err.code : "desconocido";
      console.error(`Error cargando vídeo slot ${suffix} (código ${code})`);
      log(`⚠️ Vídeo ${suffix}: error de reproducción (${code}). Prueba '⬇ Descargar' si el navegador no soporta el formato.`, "l-err");
    };
  }

  if(btnDl){
    btnDl.style.display = "inline-flex";
    btnDl.onclick = async () => {
      const m = currentMedia[slotIndex];
      const dlUrl = m?.filename ? `${server()}/view?filename=${encodeURIComponent(m.filename)}&subfolder=${encodeURIComponent(m.subfolder||"")}&type=${encodeURIComponent(m.type||"output")}` : videoUrl;
      const filename = m?.filename || `MMH3X2_${suffix}.mp4`;
      btnDl.disabled = true;
      const orig = btnDl.innerHTML;
      btnDl.textContent = "⏳";
      try {
        const r = await fetch(dlUrl);
        if(!r.ok) throw new Error("HTTP " + r.status);
        const blob = await r.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        log(`⬇ Descargado ${filename}`, "l-ok");
      } catch(err){
        log("❌ Error descargando: " + err.message, "l-err");
      } finally {
        btnDl.disabled = false;
        btnDl.innerHTML = orig;
      }
    };
  }

  if(btnExt){
    btnExt.style.display = "inline-flex";
    btnExt.onclick = () => {
      captureFrameFromPlayer(slotIndex);
    };
  }

  if(btnMeta){
    btnMeta.disabled = false;
    btnMeta.onclick = async () => {
      const m = currentMedia[slotIndex];
      if(!m || !m.filename){ log("⚠️ No hay metadatos para recuperar", "l-err"); return; }
      const wfUrl = `${server()}/view?filename=${encodeURIComponent(m.filename)}&subfolder=${encodeURIComponent(m.subfolder||"")}&type=${encodeURIComponent(m.type||"output")}`;
      btnMeta.disabled = true;
      const orig = btnMeta.innerHTML;
      btnMeta.textContent = "⏳";
      try {
        const workflow = await extractWorkflowFromMP4(wfUrl);
        if(workflow){
          applyWorkflow(workflow);
          log(`📋 Workflow restaurado desde ${m.filename}`, "l-ok");
        } else {
          log(`ℹ️ ${m.filename} no contiene metadatos de workflow.`, "l-warn");
        }
      } catch(err){
        log("❌ Error leyendo workflow: " + err.message, "l-err");
      } finally {
        btnMeta.disabled = false;
        btnMeta.innerHTML = orig;
      }
    };
  }
}

// Alias showVideo
function showVideo(slotIndex, media, options = {}){
  displayVideoInPlayer(slotIndex, media, options);
}

// --- Extracción de fotograma exacto (patrón H3/LTX) ---
const FRAME_STEP = 1 / 24;

function nudgeFrame(slotIndex, delta){
  const suffix = (slotIndex === 1) ? "Seg1" : (slotIndex === 2 ? "Seg2" : "Final");
  const v = $("video" + suffix);
  if(!v || !v.src || v.style.display === "none") return;
  const dur = v.duration || 0;
  if(!dur || !isFinite(dur)) return;
  v.pause();
  const t = Math.min(Math.max(0, (v.currentTime || 0) + delta * FRAME_STEP), dur);
  v.currentTime = t;
}

async function captureFrameFromPlayer(slotIndex){
  const suffix = (slotIndex === 1) ? "Seg1" : (slotIndex === 2 ? "Seg2" : "Final");
  const v = $("video" + suffix);
  if(!v || !v.src || v.style.display === "none"){
    log("⚠️ No hay vídeo cargado en este reproductor", "l-err");
    return;
  }
  const btn = $("btnExtractFrame" + suffix);
  if(btn) btn.disabled = true;
  try {
    if(v.readyState < 2){
      await new Promise((res) => {
        const onLoaded = () => { v.removeEventListener("loadeddata", onLoaded); res(); };
        v.addEventListener("loadeddata", onLoaded, { once: true });
        setTimeout(res, 800);
      });
    }
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 360;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    let dataUrl;
    try {
      dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    } catch(secErr){
      log("❌ Canvas protegido por CORS. No se puede extraer el frame.", "l-err");
      return;
    }
    const targetSlot = (slotIndex === 1) ? 3 : (slotIndex === 2 ? 4 : 1);
    setMediaSlotData(targetSlot, null, dataUrl, `Frame ${v.currentTime.toFixed(2)}s de ${suffix}`);
    log(`📸 Frame de ${v.currentTime.toFixed(2)}s asignado al Slot de Imagen ${targetSlot}`, "l-ok");
  } catch(e){
    log("❌ Error extrayendo frame: " + e.message, "l-err");
  } finally {
    if(btn) btn.disabled = false;
  }
}

// Atajos de teclado en reproductores (Flechas izq/der para frames, F para extraer)
[1, 2, 3].forEach(slot => {
  const suffix = (slot === 1) ? "Seg1" : (slot === 2 ? "Seg2" : "Final");
  const box = $("box" + suffix);
  if(box){
    box.setAttribute("tabindex", "0");
    box.addEventListener("keydown", (e) => {
      if(!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && ["ArrowLeft", "ArrowRight"].includes(e.key)){
        e.preventDefault();
        nudgeFrame(slot, e.key === "ArrowRight" ? 1 : -1);
      } else if(e.key === "f" || e.key === "F"){
        captureFrameFromPlayer(slot);
      }
    });
  }
});

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
    duration1: $("durationSlider1")?.value || $("durationSlider")?.value || "15.0",
    duration2: $("durationSlider2")?.value || "15.0",
    megapixels: $("mpSlider")?.value || "0.70",
    batchSize: $("batchSize")?.value || "1",
    filenamePrefix: $("filenamePrefix")?.value || "video/MiniMax_H3",
    steps: $("stepsSlider")?.value || "20",
    sampler: $("samplerName")?.value || "res_multistep",
    scheduler: $("schedulerName")?.value || "simple",
    unetModel: $("unetModel")?.value || "",
    clipModel: $("clipModel")?.value || "",
    attentionBackend: getAttentionBackendState(),
    attentionOptimizer: IS_BLOCKATT ? getAttentionOptimizerState() : null,
    h3opt: getH3OptState(),
    aimdo: IS_BLOCKATT ? getAimdoState() : null,
    blockSparse: IS_BLOCKATT ? getBlockSparseState() : null,
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
    rifeModel: $("rifeModel")?.value || "rife_v4.26.safetensors",
    audioMode: $("audioMode")?.value || "none",
    audioCrossfadeToggle: $("audioCrossfadeToggle") ? $("audioCrossfadeToggle").checked : true,
    audioCrossfadeSlider: $("audioCrossfadeSlider")?.value || "0.40",
    audioCrossfadeCurve: $("audioCrossfadeCurve")?.value || "equal_power",
    audioGuideVolume: parseInt($("audioGuideVolume")?.value ?? "-10", 10),
    shareRefsToggle: !!$("shareRefsToggle")?.checked,
    refImageSize: $("refImageSize")?.value || "match"
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

    if(s.duration1 !== undefined && $("durationSlider1")){
      $("durationSlider1").value = s.duration1;
    } else if(s.duration !== undefined && $("durationSlider1")){
      $("durationSlider1").value = s.duration;
    }
    if(s.duration2 !== undefined && $("durationSlider2")){
      $("durationSlider2").value = s.duration2;
    } else if(s.duration !== undefined && $("durationSlider2")){
      $("durationSlider2").value = s.duration;
    }
    updateDurationFrames();
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

    if(s.attentionBackend){ setAttentionBackendUI(s.attentionBackend); saveAttentionBackend(s.attentionBackend); }
    if(IS_BLOCKATT){
      if(s.attentionOptimizer){ setAttentionOptimizerUI(s.attentionOptimizer.mode); saveAttentionOptimizer(s.attentionOptimizer); }
      if(s.h3opt){ setH3OptUI(s.h3opt); saveH3Opt(s.h3opt); }
      if(s.aimdo){ setAimdoUI(s.aimdo); saveAimdo(s.aimdo); }
      if(s.blockSparse){ setBlockSparseUI(s.blockSparse); saveBlockSparse(s.blockSparse); }
    } else {
      if(s.h3opt){ setH3OptUI(s.h3opt); saveH3Opt(s.h3opt); }
    }

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
    if(s.audioMode !== undefined && $("audioMode")) $("audioMode").value = s.audioMode;

    if(s.audioCrossfadeToggle !== undefined && $("audioCrossfadeToggle")) $("audioCrossfadeToggle").checked = s.audioCrossfadeToggle;
    if(s.audioCrossfadeSlider !== undefined && $("audioCrossfadeSlider")){
      $("audioCrossfadeSlider").value = s.audioCrossfadeSlider;
      if($("audioCrossfadeVal")) $("audioCrossfadeVal").textContent = parseFloat(s.audioCrossfadeSlider).toFixed(2) + "s";
    }
    if(s.audioCrossfadeCurve && $("audioCrossfadeCurve")) $("audioCrossfadeCurve").value = s.audioCrossfadeCurve;
    if(s.audioGuideVolume !== undefined && $("audioGuideVolume")){
      $("audioGuideVolume").value = s.audioGuideVolume;
      if($("audioGuideVolumeVal")) $("audioGuideVolumeVal").textContent = `${s.audioGuideVolume} dB`;
    }
    if(s.shareRefsToggle !== undefined && $("shareRefsToggle")) $("shareRefsToggle").checked = s.shareRefsToggle;
    if(s.refImageSize && $("refImageSize")) $("refImageSize").value = s.refImageSize;
    updateRefNumberingHint();

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
    if(rec.key && rec.key.startsWith("slot_") && rec.key !== "slot_vid" && !rec.key.startsWith("slot_audio_")){
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
    } else if(rec.key === "slot_audio_1" && rec.blob){
      handleAudioFile(1, rec.blob, false);
      restoredAny = true;
    } else if(rec.key === "slot_audio_2" && rec.blob){
      handleAudioFile(2, rec.blob, false);
      restoredAny = true;
    }
  }
  return restoredAny;
}

function attachAutoSaveListeners(){
  const baseIds = [
    "prompt", "prompt2", "seg2PromptMode", "durationSlider1", "durationSlider2", "mpSlider", "stepsSlider",
    "seedVal", "batchSize", "filenamePrefix", "samplerName", "schedulerName",
    "unetModel", "clipModel", "attentionBackend", "h3VideoBudget", "h3ShiftVideo", "h3ShiftAudio",
    "lora1Toggle", "lora1Select",
    "lora1Strength", "lora2Toggle", "lora2Select", "lora2Strength", "blendToggle",
    "rtxToggle", "rifeToggle", "rifeMultiplier", "rifeModel", "audioMode",
    "audioCrossfadeToggle", "audioCrossfadeSlider", "audioCrossfadeCurve",
    "audioGuideVolume", "shareRefsToggle", "refImageSize"
  ];
    const blockattIds = IS_BLOCKATT ? [
      "h3SparseBackend", "aimdoResidency"
    ] : [];
  const inputIds = baseIds.concat(blockattIds);

  inputIds.forEach(id => {
    const el = $(id);
    if(el){
      el.addEventListener("input", scheduleSaveSettings);
      el.addEventListener("change", scheduleSaveSettings);
    }
  });

  $("audioCrossfadeSlider")?.addEventListener("input", (e) => {
    if($("audioCrossfadeVal")) $("audioCrossfadeVal").textContent = parseFloat(e.target.value).toFixed(2) + "s";
  });

  $("audioGuideVolume")?.addEventListener("input", (e) => {
    if($("audioGuideVolumeVal")) $("audioGuideVolumeVal").textContent = `${e.target.value} dB`;
  });

  // Hint dinámico: qué sonará según el modo de audio activo.
  function updateAudioModeHint(){
    const hint = $("audioModeHint");
    if(!hint) return;
    const mode = $("audioMode")?.value || "none";
    const map = {
      none: "Solo suena el audio sintetizado por IA en cada segmento y el final.",
      guide: "Tu pista SOLO condiciona el ritmo (ref_audio): lo audible es el audio IA. Tu audio no se mezcla.",
      passthrough: "Solo suena tu pista (recortada al total) en el vídeo final. Sin guía de ritmo.",
      hybrid: "Se mezclan el audio IA (bajado N dB) y tu pista en cada segmento y en el final.",
    };
    hint.textContent = mode === "hybrid"
      ? `Híbrido: audio IA a ${$("audioGuideVolume")?.value ?? "-10"} dB + tu pista, mezclados en Seg 1, Seg 2 y Final.`
      : (mode === "guide" ? "Guía de Ritmo IA: lo audible es el audio IA; tu pista solo guía el ritmo (no suena)." : "Sin pista externa: audio IA puro.");
  }
  updateAudioModeHint();
  $("audioMode")?.addEventListener("change", updateAudioModeHint);
  $("audioGuideVolume")?.addEventListener("input", updateAudioModeHint);

  $("segRandom")?.addEventListener("click", () => {
    seedMode = "random";
    $("segRandom")?.classList.add("on");
    $("segFixed")?.classList.remove("on");
    if($("seedVal")) $("seedVal").disabled = true;
    scheduleSaveSettings();
  });
  $("segFixed")?.addEventListener("click", () => {
    seedMode = "fixed";
    $("segFixed")?.classList.add("on");
    $("segRandom")?.classList.remove("on");
    if($("seedVal")) $("seedVal").disabled = false;
    scheduleSaveSettings();
  });
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

  // Audio Slots (1 y 2)
  for(let i = 1; i <= 2; i++){
    const slotEl = $(`slotAudio${i}`);
    const fileInput = $(`fileInputAudio${i}`);
    const delBtn = $(`btnDelAudio${i}`);

    if(slotEl && fileInput){
      slotEl.addEventListener("click", (e) => {
        if(e.target === delBtn || (delBtn && delBtn.contains(e.target))) return;
        if(e.target.tagName === "AUDIO") return;
        fileInput.click();
      });

      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if(file) handleAudioFile(i, file);
      });

      slotEl.addEventListener("dragover", (e) => { e.preventDefault(); slotEl.classList.add("drag"); });
      slotEl.addEventListener("dragleave", () => { slotEl.classList.remove("drag"); });
      slotEl.addEventListener("drop", (e) => {
        e.preventDefault();
        slotEl.classList.remove("drag");
        const file = e.dataTransfer.files[0];
        if(file && (file.type.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name))){
          handleAudioFile(i, file);
        }
      });
    }

    if(delBtn){
      delBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearAudioSlot(i);
      });
    }
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

function handleAudioFile(slotIdx, file, shouldSave = true){
  const url = URL.createObjectURL(file);
  audioSlots[slotIdx] = { file, dataUrl: url, uploaded: null, name: file.name };
  const a = $(`previewAudio${slotIdx}`);
  const ph = $(`phAudio${slotIdx}`);
  const info = $(`infoAudio${slotIdx}`);
  const delBtn = $(`btnDelAudio${slotIdx}`);

  if(a){
    a.src = url;
    a.style.display = "block";
  }
  if(ph) ph.style.display = "none";
  if(info) info.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  if(delBtn) delBtn.style.display = "inline-flex";
  if(shouldSave){
    dbSaveSlot("slot_audio_" + slotIdx, { blob: file, name: file.name });
  }
}

function clearAudioSlot(slotIdx){
  audioSlots[slotIdx] = { file: null, dataUrl: null, uploaded: null, name: "" };
  const a = $(`previewAudio${slotIdx}`);
  const ph = $(`phAudio${slotIdx}`);
  const info = $(`infoAudio${slotIdx}`);
  const input = $(`fileInputAudio${slotIdx}`);
  const delBtn = $(`btnDelAudio${slotIdx}`);

  if(a){
    try { a.pause(); } catch(_){}
    a.removeAttribute("src");
    try { a.load(); } catch(_){}
    a.style.display = "none";
  }
  if(ph) ph.style.display = "block";
  if(info) info.textContent = "";
  if(input) input.value = "";
  if(delBtn) delBtn.style.display = "none";
  dbDeleteSlot("slot_audio_" + slotIdx);
  log(`🗑️ Audio ${slotIdx} quitado`, "l-info");
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
    img.style.display = "block";
    img.onload = () => {
      if(slotIdx === 1) updateCalculatedResolution(img.naturalWidth, img.naturalHeight);
      if(info) info.textContent = `${img.naturalWidth}x${img.naturalHeight} · ${name || 'img'}`;
    };
    img.src = dataUrl;
  }
  if(ph) ph.style.display = "none";
  if(shouldSave && dataUrl){
    dbSaveSlot("slot_" + slotIdx, { dataUrl, name });
  }
  if(typeof updateRefNumberingHint === "function") updateRefNumberingHint();
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
  if(typeof updateRefNumberingHint === "function") updateRefNumberingHint();
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
  let needUpload = 0;
  for(let i = 1; i <= 4; i++){
    const slot = mediaSlots[i];
    if((slot.file || slot.dataUrl) && !slot.uploaded) needUpload++;
  }
  if(videoSlot.file && !videoSlot.uploaded) needUpload++;
  for(let i = 1; i <= 2; i++){
    const aSlot = audioSlots[i];
    if(aSlot.file && !aSlot.uploaded) needUpload++;
  }

  if(needUpload > 0){
    log(`📤 Subiendo ${needUpload} archivo(s) de medios a ComfyUI...`, "l-busy");
  }

  for(let i = 1; i <= 4; i++){
    const slot = mediaSlots[i];
    if(slot.file && !slot.uploaded){
      slot.uploaded = await uploadSingleFile(slot.file, `mmh3x2_slot_${i}.png`);
      dbSaveSlot("slot_" + i, { dataUrl: slot.dataUrl, name: slot.name, uploaded: slot.uploaded });
    } else if(slot.dataUrl && !slot.uploaded){
      if(slot.dataUrl.startsWith("data:")){
        const blob = dataUrlToBlob(slot.dataUrl);
        slot.uploaded = await uploadSingleFile(blob, `mmh3x2_slot_${i}.png`);
        dbSaveSlot("slot_" + i, { dataUrl: slot.dataUrl, name: slot.name, uploaded: slot.uploaded });
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

  for(let i = 1; i <= 2; i++){
    const aSlot = audioSlots[i];
    if(aSlot.file && !aSlot.uploaded){
      // Mitigación OOM de la VAE de audio: si el audio se usa como ref_audio
      // (modo guide/hybrid), recortarlo con ffmpeg antes de subirlo.
      // Menos muestras = menos VRAM por encode.
      // - Audio 1 en modo guide: recorta a dur1+dur2 (puede alimentar la
      //   pista de Seg 2 como continuación).
      // - Audio 2: a dur2.
      const audioMode = ($("audioMode")?.value || "none");
      const usedAsRef = (audioMode === "guide" || audioMode === "hybrid");
      const d1 = parseFloat($("durationSlider1")?.value || "15.0");
      const d2 = parseFloat($("durationSlider2")?.value || "15.0");
      const dur = usedAsRef ? (i === 1 ? d1 + d2 : d2) : 0;
      if(usedAsRef && dur > 0){
        const fd = new FormData();
        fd.append("image", aSlot.file, aSlot.file.name || ("mmh3x2_audio_"+i));
        fd.append("trim_end", String(dur));
        const r = await fetch("/api/video_preprocess", { method: "POST", body: fd });
        if(r.ok){
          const d = await r.json();
          if(d.audio){
            aSlot.uploaded = { name: d.audio.name, subfolder: d.audio.subfolder || "", type: d.audio.type || "input" };
            log(`🎵 Audio ${i} recortado a ${dur.toFixed(1)}s (ref audio)`, "l-ok");
            continue;
          }
        }
        // Si ffmpeg falla, caemos a la subida directa.
        log(`⚠️ No se pudo recortar el audio ${i}; subiendo sin recortar`, "l-warn");
      }
      const ext = aSlot.name.split('.').pop() || "wav";
      aSlot.uploaded = await uploadSingleFile(aSlot.file, `mmh3x2_audio_${i}.${ext}`);
    }
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

function calcFramesForDuration(dur){
  let f = Math.max(5, Math.round(dur * 24));
  while(f % 17 !== 5){
    f++;
  }
  return f;
}

function updateDurationFrames(){
  const dur1 = parseFloat($("durationSlider1")?.value || $("durationSlider")?.value || "15.0");
  const dur2 = parseFloat($("durationSlider2")?.value || "15.0");
  const frames1 = calcFramesForDuration(dur1);
  const frames2 = calcFramesForDuration(dur2);
  const totalFrames = (frames1 - 1) + frames2;
  const totalSecs = (totalFrames / 24).toFixed(1);

  if($("durHint1")) $("durHint1").textContent = `(${dur1.toFixed(1)}s → ${frames1}f)`;
  if($("durationVal1")) $("durationVal1").textContent = `${dur1.toFixed(1)}s`;
  if($("durHint2")) $("durHint2").textContent = `(${dur2.toFixed(1)}s → ${frames2}f)`;
  if($("durationVal2")) $("durationVal2").textContent = `${dur2.toFixed(1)}s`;
  if($("totalFramesHint")){
    $("totalFramesHint").textContent = `Total: Seg 1 (${frames1}f) + Seg 2 (${frames2}f) = ${totalFrames} frames (~${totalSecs}s a 24fps · Máx 30s)`;
  }
}

// Muestra en vivo la numeración <Picture N> que verá cada segmento según
// el toggle "Referencias compartidas" y qué slots tienen imagen.
function updateRefNumberingHint(){
  const hint = $("refMappingHint");
  if(!hint) return;
  const shared = !!$("shareRefsToggle")?.checked;
  const has = (i) => !!(mediaSlots[i]?.uploaded || mediaSlots[i]?.file || mediaSlots[i]?.dataUrl);
  let seg1, seg2;
  if(!shared){
    seg1 = ["Img1", has(2) ? "Img2" : null].filter(Boolean);
    seg2 = ["1er frame Seg 1", has(3) ? "Img3" : null, has(4) ? "Img4" : null].filter(Boolean);
  } else {
    seg1 = ["Img1", has(2) ? "Img2" : null, has(3) ? "Img3" : null, has(4) ? "Img4" : null].filter(Boolean);
    seg2 = ["1er frame Seg 1", has(2) ? "Img2" : null, has(3) ? "Img3" : null, has(4) ? "Img4" : null].filter(Boolean);
  }
  const num = (arr) => arr.map((n, i) => `P${i + 1}=${n}`).join(" · ");
  hint.textContent = `Seg 1 ve: ${num(seg1)}  |  Seg 2 ve: ${num(seg2)}`;
}

// Refleja el prompt final que el grafo envía al backend (tras fusionar
// Ollama/referencias/direcciones). En modo Directo es exactamente lo que
// llega al nodo 14/30. En modo Asistido, el texto del Seg 2 que se muestra
// es el borrador base + dirección (lo que Ollama reescribirá en runtime;
// el texto reescrito solo existe dentro del backend).
function updateFinalPromptPanel(graph){
  const ta1 = $("finalPromptSeg1");
  const ta2 = $("finalPromptSeg2");
  const hint = $("finalPromptHint");
  if(!ta1 || !ta2 || !graph) return;
  const g = graph;
  const nodeKey = (arr) => (Array.isArray(arr) ? String(arr[0]) : null);
  // Seg 1: el nodo 14 consume el texto del nodo 50 (o literal)
  const p1Node = nodeKey(g[N.REF2V_SEG1]?.inputs?.prompt);
  const p1Text = (p1Node && g[p1Node]?.inputs?.value) || g[N.REF2V_SEG1]?.inputs?.prompt || "";
  // Seg 2: directo = texto del nodo 58; asistido = borrador que entra al LLM 1 (59)
  let p2Text = "";
  const p2Src = nodeKey(g[N.REF2V_SEG2]?.inputs?.prompt);
  if(p2Src && g[p2Src]?.inputs?.value){
    p2Text = g[p2Src].inputs.value;
  } else if(g["59"]?.inputs){
    // Modo asistido: reconstruimos el borrador base que Ollama fusionará
    const baseKey = nodeKey(g["59"].inputs.string_a);
    const guideKey = nodeKey(g["59"].inputs.string_b);
    const base = (baseKey && g[baseKey]?.inputs?.value) || "";
    const guide = (guideKey && g[guideKey]?.inputs?.value) || "";
    p2Text = `${base}${g["59"].inputs.delimiter || "\n"}${guide}\n\n[+ Ollama en grafo: funde esto con la visión de los últimos 2s de Seg 1]`;
  }
  ta1.value = String(p1Text).trim();
  ta2.value = String(p2Text).trim();
  if(hint){
    const mode = $("seg2PromptMode")?.value || "direct";
    hint.textContent = mode === "ollama"
      ? "Seg 2 (Asistido): se muestra el borrador con tu dirección; el texto definitivo lo fusiona Ollama dentro del backend con los frames de Seg 1."
      : "Texto exacto que entra en el condicionamiento de cada segmento.";
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

  // Eliminar siempre nodos de interfaz ShowText (84 y 85) para evitar KeyError: 'nodes' en ComfyUI API
  delete g["84"];
  delete g["85"];

  const seg2Mode = $("seg2PromptMode")?.value || "direct";
  if(seg2Mode === "direct" && g[N.REF2V_SEG2]?.inputs){
    g[N.REF2V_SEG2].inputs.prompt = [N.PROMPT_2, 0];
    [N.OLLAMA_CONN, "52", N.OLLAMA_CHAT_1, N.OLLAMA_CHAT_2, "57", "59", "86"].forEach(id => { delete g[id]; });
  } else if(seg2Mode === "ollama" && g[N.OLLAMA_CONN]?.inputs){
    const ollamaModel = $("enhancerModel")?.value;
    if(ollamaModel){
      g[N.OLLAMA_CONN].inputs.model = ollamaModel;
    } else {
      log("⚠️ Modo Asistido requiere un modelo en Enhancer/Ollama. Se usa el del workflow.", "l-warn");
    }
  }

  // 2. Duración y Megapíxeles
  const dur1 = parseFloat((j ? (j.duration1 || j.duration) : ($("durationSlider1")?.value || $("durationSlider")?.value)) || "15.0");
  const dur2 = parseFloat((j ? (j.duration2 || j.duration) : ($("durationSlider2")?.value || "15.0")) || "15.0");

  if(g[N.DURATION]?.inputs) g[N.DURATION].inputs.value = dur1;

  // Nodo de duración y math para Segmento 2
  g["12_seg2"] = {
    inputs: { value: dur2 },
    class_type: "PrimitiveFloat",
    _meta: { title: "Duration Seg 2 (s)" }
  };
  g["13_seg2"] = {
    inputs: {
      expression: "max(5, round(a * 24)) + (5 - (max(5, round(a * 24)) % 17)) % 17",
      "values.a": ["12_seg2", 0]
    },
    class_type: "ComfyMathExpression",
    _meta: { title: "Frames Seg 2 (17k+5)" }
  };
  if(g[N.REF2V_SEG2]?.inputs){
    g[N.REF2V_SEG2].inputs.length = ["13_seg2", 1];
  }

  // Cálculo dinámico exacto de frames para corte y empalme
  const framesSeg1 = calcFramesForDuration(dur1);
  if(g["61"]?.inputs){
    g["61"].inputs.indexes = Array.from({ length: framesSeg1 - 1 }, (_, i) => i).join(", ");
  }
  if(g["65"]?.inputs){
    g["65"].inputs.start_index = 0.0;
    g["65"].inputs.duration = parseFloat(((framesSeg1 - 1) / 24).toFixed(4));
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
  const backendState = j?.attentionBackend || getAttentionBackendState();
  const h3opt = j?.h3opt || getH3OptState();

  // Backend denso (ModelAttentionBackend) - primero en la cadena
  if(g[N.ATTN]?.inputs){
    g[N.ATTN].inputs.attention = backendState.backend;
  }
  let currentModelNode = N.ATTN;

  if(IS_BLOCKATT){
    // Modo BlockATT: cadena flexible UNet -> ModelAttentionBackend -> (optimizador) -> SigmaShift -> MemOpt?
    const optimizerState = j?.attentionOptimizer || getAttentionOptimizerState();
    const aimdoState = j?.aimdo || getAimdoState();
    const bs = j?.blockSparse || getBlockSparseState();

    // Limpiar nodos alternativos previos
    if(g[N.SPARSE]) delete g[N.SPARSE];
    if(g[N.SPARSE_ATTN]) delete g[N.SPARSE_ATTN];
    if(g[N.BLOCK_SPARSE]) delete g[N.BLOCK_SPARSE];
    if(g[N.AIMDO]) delete g[N.AIMDO];

    // Nodo sparse base siempre presente en BlockATT (incluso en modo "none")
    // para no dejar hueco entre ModelAttentionBackend y SigmaShift.
    const backend = h3opt.sparseBackend || "auto";
    g[N.SPARSE_ATTN] = {
      class_type: "H3SparseAttentionAdvanced",
      inputs: {
        model: [N.ATTN, 0],
        video_budget: h3opt.videoBudget,
        denser_early_late_steps: h3opt.denserEarlyLate,
        backend: backend
      },
      _meta: { title: "H3 Sparse Attention Advanced" }
    };
    currentModelNode = N.SPARSE_ATTN;

    if(optimizerState.mode === "h3-optimizations"){
      if(aimdoState.residency !== "stock"){
        g[N.AIMDO] = {
          class_type: "H3AIMDOResidencyLimiter",
          inputs: { model: [currentModelNode, 0], residency: aimdoState.residency },
          _meta: { title: "H3 AIMDO Residency Limiter" }
        };
        currentModelNode = N.AIMDO;
      }
    }
    // BlockSparseAttention está desactivado en MMH3X2 (fallo con MiniMax H3).
    // Si un workflow antiguo pide "block-sparse", se ignora y se usa H3SparseAttentionAdvanced.

    // Sigma Shift
    if(g[N.SIGMA_SHIFT]?.inputs){
      g[N.SIGMA_SHIFT].inputs.model = [currentModelNode, 0];
      g[N.SIGMA_SHIFT].inputs.shift_video = parseFloat((j ? j.h3ShiftVideo : $("h3ShiftVideo")?.value) || "12.0");
      g[N.SIGMA_SHIFT].inputs.shift_audio = parseFloat((j ? j.h3ShiftAudio : $("h3ShiftAudio")?.value) || "3.0");
      currentModelNode = N.SIGMA_SHIFT;
    }

    // Memory Optimization (toggleable)
    if(h3opt.memOptEnabled){
      if(!g[N.MEM_OPT]){
        g[N.MEM_OPT] = {
          class_type: "H3MemoryOptimization",
          inputs: {
            fused_qkv: "auto", mlp_memory: "auto", chunk_rows: 4096,
            preserve_precision: true, precision_mode: "Auto",
            qkv_streaming_mode: "Auto", embedding_memory_mode: "Auto",
            kitchen_v_memory_mode: "Standard",
            model: [currentModelNode, 0]
          },
          _meta: { title: "H3 Memory Optimization" }
        };
      } else if(g[N.MEM_OPT].inputs){
        g[N.MEM_OPT].inputs.model = [currentModelNode, 0];
      }
      currentModelNode = N.MEM_OPT;
    } else if(g[N.MEM_OPT]){
      delete g[N.MEM_OPT];
    }
  } else {
    // Modo base: cadena fija del workflow original
    // UNet -> ModelAttentionBackend -> H3SparseAttention -> SigmaShift -> H3MemoryOptimization
    if(g[N.SPARSE]?.inputs){
      g[N.SPARSE].inputs.video_budget = h3opt.videoBudget;
      g[N.SPARSE].inputs.denser_early_late_steps = h3opt.denserEarlyLate;
    }
    if(g[N.SPARSE]){
      g[N.SPARSE].inputs.model = [N.ATTN, 0];
      currentModelNode = N.SPARSE;
    }
    if(g[N.SIGMA_SHIFT]?.inputs){
      g[N.SIGMA_SHIFT].inputs.model = [currentModelNode, 0];
      g[N.SIGMA_SHIFT].inputs.shift_video = parseFloat((j ? j.h3ShiftVideo : $("h3ShiftVideo")?.value) || "12.0");
      g[N.SIGMA_SHIFT].inputs.shift_audio = parseFloat((j ? j.h3ShiftAudio : $("h3ShiftAudio")?.value) || "3.0");
      currentModelNode = N.SIGMA_SHIFT;
    }
    if(h3opt.memOptEnabled){
      if(!g[N.MEM_OPT]){
        g[N.MEM_OPT] = {
          class_type: "H3MemoryOptimization",
          inputs: {
            fused_qkv: "auto", mlp_memory: "auto", chunk_rows: 4096,
            preserve_precision: true, precision_mode: "Auto",
            qkv_streaming_mode: "Auto", embedding_memory_mode: "Auto",
            kitchen_v_memory_mode: "Standard",
            model: [currentModelNode, 0]
          },
          _meta: { title: "H3 Memory Optimization" }
        };
      } else if(g[N.MEM_OPT].inputs){
        g[N.MEM_OPT].inputs.model = [currentModelNode, 0];
      }
      currentModelNode = N.MEM_OPT;
    } else if(g[N.MEM_OPT]){
      delete g[N.MEM_OPT];
    }

    // Limpiar nodos de optimizadores avanzados no usados en modo base
    if(g[N.SPARSE_ATTN]) delete g[N.SPARSE_ATTN];
    if(g[N.BLOCK_SPARSE]) delete g[N.BLOCK_SPARSE];
    if(g[N.AIMDO]) delete g[N.AIMDO];
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

  // 10b. Referencias compartidas + tamaño de referencias (match/max)
  const sharedRefs = (j ? (j.sharedRefs !== undefined ? j.sharedRefs : false)
    : !!$("shareRefsToggle")?.checked);
  const refSize = (j ? (j.refImageSize || "match") : ($("refImageSize")?.value || "match"));
  if(g[N.REF2V_SEG1]?.inputs) g[N.REF2V_SEG1].inputs.ref_image_size = refSize;
  if(g[N.REF2V_SEG2]?.inputs) g[N.REF2V_SEG2].inputs.ref_image_size = refSize;
  if(sharedRefs){
    // Seg 1 (nodo 14): base ref_image_0 = Img1, _1 = Img2 (cable base);
    // añadimos Img3/Img4 como _2/_3 cuando el slot tiene imagen.
    if(mediaSlots[3].uploaded && g[N.REF2V_SEG1]?.inputs){
      g[N.REF2V_SEG1].inputs["ref_images.ref_image_2"] = [N.IMG3, 0];
    }
    if(mediaSlots[4].uploaded && g[N.REF2V_SEG1]?.inputs){
      g[N.REF2V_SEG1].inputs["ref_images.ref_image_3"] = [N.IMG4, 0];
    }
    // Seg 2 (nodo 30): base ref_image_0 = last frame (26), _1 = Img3 (82),
    // _2 = Img4 (83). Con compartidas, Img2 entra como _1 y desplazamos.
    if(mediaSlots[2].uploaded && g[N.REF2V_SEG2]?.inputs){
      g[N.REF2V_SEG2].inputs["ref_images.ref_image_1"] = [N.IMG2, 0];
      if(mediaSlots[3].uploaded){
        g[N.REF2V_SEG2].inputs["ref_images.ref_image_2"] = [N.IMG3, 0];
      } else {
        delete g[N.REF2V_SEG2].inputs["ref_images.ref_image_2"];
      }
      if(mediaSlots[4].uploaded){
        g[N.REF2V_SEG2].inputs["ref_images.ref_image_3"] = [N.IMG4, 0];
      } else {
        delete g[N.REF2V_SEG2].inputs["ref_images.ref_image_3"];
      }
    }
  }

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

  // 12. Enrutamiento y Crossfade de Audio
  const audioCrossfadeOn = $("audioCrossfadeToggle") ? $("audioCrossfadeToggle").checked : true;
  const cfSec = parseFloat($("audioCrossfadeSlider")?.value || "0.40");
  const cfCurve = $("audioCrossfadeCurve")?.value || "equal_power";

  // Ajuste en el corte de Seg 1 y fundido de audio generado por IA (nodos 65, 37 y 41)
  if(g["65"]?.inputs){
    const seg1BaseDur = parseFloat(((calcFramesForDuration(dur1) - 1) / 24).toFixed(4));
    g["65"].inputs.start_index = 0.0;
    if(audioCrossfadeOn && cfSec > 0){
      g["65"].inputs.duration = parseFloat((seg1BaseDur + cfSec).toFixed(4));
    } else {
      g["65"].inputs.duration = seg1BaseDur;
    }
  }

  if(g[N.AUDIO_CONCAT]){
    if(audioCrossfadeOn && cfSec > 0){
      g[N.AUDIO_CONCAT] = {
        class_type: "AudioCrossFadeConcat",
        inputs: {
          audio1: ["65", 0],
          audio2: [N.DECODE_AUD_2, 0],
          crossfade_sec: cfSec,
          fade_curve: cfCurve
        },
        _meta: { title: `Crossfade Audio (${cfSec.toFixed(2)}s)` }
      };
    } else {
      g[N.AUDIO_CONCAT] = {
        class_type: "AudioConcat",
        inputs: {
          direction: "after",
          audio1: ["65", 0],
          audio2: [N.DECODE_AUD_2, 0]
        },
        _meta: { title: "Merge audio" }
      };
    }
  }

  const audioMode = (j ? j.audioMode : $("audioMode")?.value) || "none";
  // LoadAudio resuelve el filename relativo a input/ (soporta "sub/name");
  // los audios de /api/video_preprocess se guardan en input/reference/.
  const audioPath = (slot) => {
    const up = slot?.uploaded;
    if(up && up.subfolder) return `${up.subfolder}/${up.name}`;
    return up?.name || (slot?.file ? slot.file.name : null);
  };
  const a1 = audioPath(audioSlots[1]);
  const a2 = audioPath(audioSlots[2]);
  const totalDurExact = parseFloat((((calcFramesForDuration(dur1) - 1) + calcFramesForDuration(dur2)) / 24).toFixed(4));

  if(audioMode !== "none" && (a1 || a2)){
    if(a1){
      g["190_load_audio1"] = {
        inputs: { audio: a1 },
        class_type: "LoadAudio",
        _meta: { title: "Audio Entrada 1" }
      };
    }
    if(a2){
      g["191_load_audio2"] = {
        inputs: { audio: a2 },
        class_type: "LoadAudio",
        _meta: { title: "Audio Entrada 2" }
      };
    }

    // A. Condicionamiento de Ritmo IA (ref_audios en MiniMaxH3ReferenceToVideo)
    if(audioMode === "guide" || audioMode === "hybrid"){
      if(a1 && g[N.REF2V_SEG1]?.inputs){
        g[N.REF2V_SEG1].inputs["ref_audios.ref_audio_0"] = ["190_load_audio1", 0];
      }
      if(g[N.REF2V_SEG2]?.inputs){
        if(a2){
          g[N.REF2V_SEG2].inputs["ref_audios.ref_audio_0"] = ["191_load_audio2", 0];
        } else if(a1){
          g[N.REF2V_SEG2].inputs["ref_audios.ref_audio_0"] = ["190_load_audio1", 0];
        }
      }
    }

    // A2. Semántica de modos (audible):
    //   guide        → solo audio IA en seg1/seg2/final; la pista subida SOLO
    //                  condiciona el ritmo (ref_audio), no suena.
    //   hybrid       → audio IA MEZCLADO con la pista del usuario (AudioMerge),
    //                  con la IA bajada N dB (slider audioGuideVolume).
    //   passthrough  → solo pista del usuario (recortada al total) en el final.
    const guideGainDb = parseInt($("audioGuideVolume")?.value ?? "-10", 10);
    if(audioMode === "hybrid"){
      // --- Híbrido: IA + pista mezcladas por segmento ---
      // Seg 1: IA (21) bajada a guideDb + pista (190) → AudioMerge add → 22
      if(a1 && g[N.CREATE_VID_1]?.inputs && g[N.DECODE_AUD_1] && g[N.DECODE_AUD_1] in g){
        const seg1Dur = parseFloat(((calcFramesForDuration(dur1) - 1) / 24).toFixed(4));
        const seg1TrimH = (audioCrossfadeOn && cfSec > 0) ? parseFloat((seg1Dur + cfSec).toFixed(4)) : seg1Dur;
        g["198_ia_vol_seg1"] = {
          inputs: { audio: [N.DECODE_AUD_1, 0], volume: guideGainDb },
          class_type: "AudioAdjustVolume",
          _meta: { title: `Híbrido: IA Seg 1 a ${guideGainDb} dB` }
        };
        g["199_ia_trim_seg1"] = {
          inputs: { audio: ["198_ia_vol_seg1", 0], start_index: 0.0, duration: seg1TrimH },
          class_type: "TrimAudioDuration",
          _meta: { title: "Híbrido: IA Seg 1 recortada" }
        };
        g["199_user_trim_seg1"] = {
          inputs: { audio: ["190_load_audio1", 0], start_index: 0.0, duration: seg1TrimH },
          class_type: "TrimAudioDuration",
          _meta: { title: "Híbrido: pista Seg 1 recortada" }
        };
        g["199_merge_seg1"] = {
          inputs: { audio1: ["199_user_trim_seg1", 0], audio2: ["199_ia_trim_seg1", 0], merge_method: "add" },
          class_type: "AudioMerge",
          _meta: { title: "Híbrido: mezcla IA + pista (Seg 1)" }
        };
        g[N.CREATE_VID_1].inputs.audio = ["199_merge_seg1", 0];
      }
      // Seg 2: IA (37) + pista usuario → AudioMerge add → 38
      if(g[N.CREATE_VID_2]?.inputs && g[N.DECODE_AUD_2] && g[N.DECODE_AUD_2] in g){
        const seg2Dur = parseFloat((calcFramesForDuration(dur2) / 24).toFixed(4));
        // Pista usuario para Seg 2: audio 2 si existe; si no, audio 1 continuado
        // desde el final de Seg 1 (con reinicio de seguridad si no cubre).
        let userSrc = null;
        let startIdx = 0.0;
        if(a2){
          g["199_user_trim_seg2"] = {
            inputs: { audio: ["191_load_audio2", 0], start_index: 0.0, duration: seg2Dur },
            class_type: "TrimAudioDuration",
            _meta: { title: "Híbrido: pista Seg 2 recortada" }
          };
          userSrc = "199_user_trim_seg2";
        } else if(a1){
          const seg1DurCont = (audioCrossfadeOn && cfSec > 0) ? parseFloat(((calcFramesForDuration(dur1) - 1) / 24 + cfSec).toFixed(4)) : parseFloat(((calcFramesForDuration(dur1) - 1) / 24).toFixed(4));
          const hasContinuation = (seg1Dur + 0.01) < (dur1 + dur2);
          startIdx = hasContinuation ? seg1Dur : 0.0;
          if(!hasContinuation) log("⚠️ El audio 1 no cubre dur1+dur2; Seg 2 reinicia la pista desde 0s.", "l-warn");
          g["199_user_trim_seg2"] = {
            inputs: { audio: ["190_load_audio1", 0], start_index: startIdx, duration: seg2Dur },
            class_type: "TrimAudioDuration",
            _meta: { title: "Híbrido: pista Seg 2 (continuación)" }
          };
          userSrc = "199_user_trim_seg2";
        }
        if(userSrc){
          g["199_ia_vol_seg2"] = {
            inputs: { audio: [N.DECODE_AUD_2, 0], volume: guideGainDb },
            class_type: "AudioAdjustVolume",
            _meta: { title: `Híbrido: IA Seg 2 a ${guideGainDb} dB` }
          };
          g["199_merge_seg2"] = {
            inputs: { audio1: [userSrc, 0], audio2: ["199_ia_vol_seg2", 0], merge_method: "add" },
            class_type: "AudioMerge",
            _meta: { title: "Híbrido: mezcla IA + pista (Seg 2)" }
          };
          g[N.CREATE_VID_2].inputs.audio = ["199_merge_seg2", 0];
        }
      }
      // Final: concat IA (41, ya con crossfade IA) + pista usuario global (192)
      if(g[N.CREATE_VID_FINAL]?.inputs && g[N.AUDIO_CONCAT] && g[N.AUDIO_CONCAT] in g){
        if(a1 && !a2){
          // La pista global ya está recortada en 192 (ver bloque C abajo).
          g["199_ia_vol_final"] = {
            inputs: { audio: [N.AUDIO_CONCAT, 0], volume: guideGainDb },
            class_type: "AudioAdjustVolume",
            _meta: { title: `Híbrido: IA global a ${guideGainDb} dB` }
          };
          g["199_merge_final"] = {
            inputs: { audio1: ["192_trim_final_audio", 0], audio2: ["199_ia_vol_final", 0], merge_method: "add" },
            class_type: "AudioMerge",
            _meta: { title: "Híbrido: mezcla IA + pista (Final)" }
          };
          g[N.CREATE_VID_FINAL].inputs.audio = ["199_merge_final", 0];
        }
        // Con audio 2, la pista global de usuario (195_concat_direct_audio) ya
        // cubre todo; mezclamos esa con el concat IA.
        if(a1 && a2){
          g["199_ia_vol_final"] = {
            inputs: { audio: [N.AUDIO_CONCAT, 0], volume: guideGainDb },
            class_type: "AudioAdjustVolume",
            _meta: { title: `Híbrido: IA global a ${guideGainDb} dB` }
          };
          g["199_merge_final"] = {
            inputs: { audio1: ["195_concat_direct_audio", 0], audio2: ["199_ia_vol_final", 0], merge_method: "add" },
            class_type: "AudioMerge",
            _meta: { title: "Híbrido: mezcla IA + pista (Final)" }
          };
          g[N.CREATE_VID_FINAL].inputs.audio = ["199_merge_final", 0];
        }
      }
    }

    // C. Pista Directa en el Vídeo Final (sustituye el audio sintetizado en CreateVideo nodo 42)
    // En hybrid este bloque SOLO construye las pistas de usuario (192/193/194/195)
    // que la mezcla del bloque anterior referencia; la asignación de 42.audio la
    // hace la mezcla. Sobrescribirla aquí dejaría el final solo con la pista
    // del usuario y sin el audio IA.
    if(audioMode === "passthrough" || audioMode === "hybrid"){
      if(a1 && !a2){
        g["192_trim_final_audio"] = {
          inputs: {
            audio: ["190_load_audio1", 0],
            start_index: 0.0,
            duration: totalDurExact
          },
          class_type: "TrimAudioDuration",
          _meta: { title: "Audio Global recortado" }
        };
        if(audioMode === "passthrough" && g[N.CREATE_VID_FINAL]?.inputs) g[N.CREATE_VID_FINAL].inputs.audio = ["192_trim_final_audio", 0];
      } else if(a1 && a2){
        const seg1Dur = parseFloat(((calcFramesForDuration(dur1) - 1) / 24).toFixed(4));
        const seg1Trim = (audioCrossfadeOn && cfSec > 0) ? parseFloat((seg1Dur + cfSec).toFixed(4)) : seg1Dur;
        g["193_trim_audio1"] = {
          inputs: {
            audio: ["190_load_audio1", 0],
            start_index: 0.0,
            duration: seg1Trim
          },
          class_type: "TrimAudioDuration",
          _meta: { title: "Audio Seg 1 recortado" }
        };
        g["194_trim_audio2"] = {
          inputs: {
            audio: ["191_load_audio2", 0],
            start_index: 0.0,
            duration: parseFloat((calcFramesForDuration(dur2) / 24).toFixed(4))
          },
          class_type: "TrimAudioDuration",
          _meta: { title: "Audio Seg 2 recortado" }
        };
        if(audioCrossfadeOn && cfSec > 0){
          g["195_concat_direct_audio"] = {
            class_type: "AudioCrossFadeConcat",
            inputs: {
              audio1: ["193_trim_audio1", 0],
              audio2: ["194_trim_audio2", 0],
              crossfade_sec: cfSec,
              fade_curve: cfCurve
            },
            _meta: { title: `Crossfade Audio Directo (${cfSec.toFixed(2)}s)` }
          };
        } else {
          g["195_concat_direct_audio"] = {
            class_type: "AudioConcat",
            inputs: {
              direction: "after",
              audio1: ["193_trim_audio1", 0],
              audio2: ["194_trim_audio2", 0]
            },
            _meta: { title: "Concatenar Audios Directos" }
          };
        }
        if(audioMode === "passthrough" && g[N.CREATE_VID_FINAL]?.inputs) g[N.CREATE_VID_FINAL].inputs.audio = ["195_concat_direct_audio", 0];
      } else if(!a1 && a2){
        g["192_trim_final_audio"] = {
          inputs: {
            audio: ["191_load_audio2", 0],
            start_index: 0.0,
            duration: totalDurExact
          },
          class_type: "TrimAudioDuration",
          _meta: { title: "Audio Seg 2 recortado" }
        };
        if(audioMode === "passthrough" && g[N.CREATE_VID_FINAL]?.inputs) g[N.CREATE_VID_FINAL].inputs.audio = ["192_trim_final_audio", 0];
        // Híbrido con solo Audio 2: mezclar esa pista global con el concat IA.
        if(audioMode === "hybrid" && g[N.CREATE_VID_FINAL]?.inputs && g[N.AUDIO_CONCAT] && g[N.AUDIO_CONCAT] in g){
          g["199_ia_vol_final"] = {
            inputs: { audio: [N.AUDIO_CONCAT, 0], volume: guideGainDb },
            class_type: "AudioAdjustVolume",
            _meta: { title: `Híbrido: IA global a ${guideGainDb} dB` }
          };
          g["199_merge_final"] = {
            inputs: { audio1: ["192_trim_final_audio", 0], audio2: ["199_ia_vol_final", 0], merge_method: "add" },
            class_type: "AudioMerge",
            _meta: { title: "Híbrido: mezcla IA + pista (Final)" }
          };
          g[N.CREATE_VID_FINAL].inputs.audio = ["199_merge_final", 0];
        }
      }
    }
  }

  // 13. Postprocesado: RTX Video Super Resolution y RIFE
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

  // 14. Prefijos de guardado de vídeo
  const prefix = ($("filenamePrefix")?.value || "video/MiniMax_H3").trim();
  if(g[N.SAVE_VID_1]?.inputs) g[N.SAVE_VID_1].inputs.filename_prefix = prefix + "_seg1";
  if(g[N.SAVE_VID_2]?.inputs) g[N.SAVE_VID_2].inputs.filename_prefix = prefix + "_seg2";
  if(g[N.SAVE_VID_FINAL]?.inputs) g[N.SAVE_VID_FINAL].inputs.filename_prefix = prefix + "_cont";

  // Los SaveImage auxiliares (último frame + grid de referencias) son solo
  // diagnóstico: los eliminamos del grafo para no llenar output/video/ de PNGs
  // que luego contaminan "Imágenes Krea2 recientes" (el listado escanea todo
  // output/ de forma recursiva).
  if(g[N.SAVE_LAST_FRAME]) delete g[N.SAVE_LAST_FRAME];
  if(g[N.SAVE_REF_GRID]) delete g[N.SAVE_REF_GRID];

  // 15. Modo de Ejecución (Completo vs Solo Seg 1 vs Solo Seg 2)
  const runMode = j?.runMode || "full";
  if(runMode === "seg1_only"){
    const nodesToDelete = [
      N.REF2V_SEG2, N.SAMPLE_2, N.DECODE_VID_2, N.DECODE_AUD_2, N.CREATE_VID_2, N.SAVE_VID_2,
      N.IMAGE_BATCH, N.AUDIO_CONCAT, N.CREATE_VID_FINAL, N.SAVE_VID_FINAL,
      N.BLEND, N.INJECT_LATENT, N.ADD_GUIDE, N.RTX, N.RIFE, N.RIFE_LOADER, N.RIFE_MULT
    ];
    nodesToDelete.forEach(id => { delete g[id]; });
    // Nodos auxiliares de audio que sobran en modo solo-Seg1.
    ["197_trim_guide_audio2", "199_user_trim_seg2", "199_ia_vol_seg2", "199_merge_seg2",
     "199_ia_vol_final", "199_merge_final", "194_trim_audio2", "195_concat_direct_audio"]
      .forEach(id => { delete g[id]; });
  }

  return g;
}

// ==========================================
// EJECUCIÓN Y COLAS
// ==========================================
async function queueJob(runMode){
  const p1 = $("prompt")?.value?.trim();
  if(!p1){
    log("⚠️ Por favor escribe al menos el Prompt 1 (Segmento 1)", "l-warn");
    return;
  }

  // Mitigación OOM: liberar VRAM del backend antes de encolar (no interrumpe
  // jobs en curso; aplica cuando el worker itere).
  try { fetch(server()+"/free", { method:"POST", headers:{"Content-Type":"application/json"}, body:"{\"unload_models\":true}" }).catch(()=>{}); } catch(_){}

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
    duration1: parseFloat($("durationSlider1")?.value || $("durationSlider")?.value || "15.0"),
    duration2: parseFloat($("durationSlider2")?.value || "15.0"),
    megapixels: parseFloat($("mpSlider")?.value || "0.70"),
    steps: parseInt($("stepsSlider")?.value || "20", 10),
    sampler: $("samplerName")?.value || "res_multistep",
    scheduler: $("schedulerName")?.value || "simple",
    audioMode: $("audioMode")?.value || "none",
    audioGuideVolume: parseInt($("audioGuideVolume")?.value ?? "-10", 10),
    sharedRefs: !!$("shareRefsToggle")?.checked,
    refImageSize: $("refImageSize")?.value || "match",
    seedMode,
    seed: baseSeed,
    batchSize,
    attentionBackend: getAttentionBackendState(),
    h3opt: getH3OptState(),
    attentionOptimizer: IS_BLOCKATT ? getAttentionOptimizerState() : null,
    aimdo: IS_BLOCKATT ? getAimdoState() : null,
    blockSparse: IS_BLOCKATT ? getBlockSparseState() : null,
    h3ShiftVideo: $("h3ShiftVideo")?.value || "12.0",
    h3ShiftAudio: $("h3ShiftAudio")?.value || "3.0"
  };

  // Consultar en vivo el estado real de ComfyUI antes de decidir encolar
  if(activeJob){
    try {
      const qr = await fetch(server() + "/queue");
      if(qr.ok){
        const qdata = await qr.json();
        const runningCount = Array.isArray(qdata.queue_running) ? qdata.queue_running.length : 0;
        if(runningCount === 0){
          activeJob = null;
          currentPromptId = null;
        }
      }
    } catch(_){}
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

    // Nueva variante: los 3 paneles de preview vuelven a "sin generar" para que
    // se vea la animación completa (Seg1 → Seg2 → Final) y no se arrastre el
    // preview de la variante anterior.
    resetPreviewPanes();
    updateFinalPromptPanel(graph);

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

    stageTimers.startPrompt = Date.now();
    stageTimers.startSeg1 = Date.now();
    stageTimers.endSeg1 = 0;
    stageTimers.startSeg2 = 0;
    stageTimers.endSeg2 = 0;
    stageTimers.endFinal = 0;
    if(stageTimers.ivSeg1) clearInterval(stageTimers.ivSeg1);
    if(stageTimers.ivSeg2) clearInterval(stageTimers.ivSeg2);
    if(stageTimers.ivFinal) clearInterval(stageTimers.ivFinal);

    const el1 = $("timeSeg1"), el2 = $("timeSeg2");
    if(el1){ el1.textContent = "⏱ 00:00"; el1.classList.add("live"); }
    if(el2){ el2.textContent = ""; el2.classList.remove("live"); }

    stageTimers.ivSeg1 = setInterval(() => {
      const elapsed = Date.now() - stageTimers.startSeg1;
      if(el1) el1.textContent = `⏱ ${fmtMs(elapsed)}`;
    }, 500);

    pendingSeeds[data.prompt_id] = seedUsed;
    promptVariantMap[data.prompt_id] = varIdx;
    currentPromptId = data.prompt_id;
    promptSteps[data.prompt_id] = "1";
    createGeneratingCard(varIdx, seedUsed);
    startTimer(data.prompt_id, "Final");
    pollFallback(data.prompt_id);
  } catch(e){
    log(`❌ No se pudo encolar: ${e.message}`, "l-err");
    finishCurrentJob();
  }
}

function finishCurrentJob(){
  if(stageTimers.ivFinal){ clearInterval(stageTimers.ivFinal); stageTimers.ivFinal = null; }
  if(stageTimers.ivSeg1){ clearInterval(stageTimers.ivSeg1); stageTimers.ivSeg1 = null; }
  if(stageTimers.ivSeg2){ clearInterval(stageTimers.ivSeg2); stageTimers.ivSeg2 = null; }
  const elF = $("timeFinal"), el1 = $("timeSeg1"), el2 = $("timeSeg2");
  if(elF) elF.classList.remove("live");
  if(el1) el1.classList.remove("live");
  if(el2) el2.classList.remove("live");

  // Estado terminal en el indicador de ejecución: sin esto queda el último
  // "Muestreando (n/n · 100%)" en ámbar tras terminar.
  setRun("ok", "en reposo");

  activeJob = null;
  currentPromptId = null;
  updateQueueUI();
  if(jobQueue.length > 0){
    const nextJob = jobQueue.shift();
    startJob(nextJob);
  } else {
    enableStopButtons(false);
  }
}

// ==========================================
// ==========================================
// HISTORIAL DE VÍDEOS (/api/mmh3x2_list)
// ==========================================
async function loadVideoHistory(){
  const status = $("videoHistoryStatus");
  const grid = $("videoHistoryGrid");
  if(!grid) return;
  if(status) status.textContent = "Cargando...";
  grid.innerHTML = "";

  try {
    const r = await fetch("/api/mmh3x2_list");
    if(!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    if(!data.items || !data.items.length){
      if(status) status.textContent = "(0)";
      grid.innerHTML = '<div class="hint" style="padding:12px;text-align:center;">No hay vídeos en el historial.</div>';
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
        const dateStr = new Date((item.mtime || 0) * 1000).toLocaleString("es-ES", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
        const videoUrl = mediaViewUrl(item, { anchor: "#t=0.001" });

        let typeBadge = "continuo";
        let targetSlot = 3;
        if(item.filename.includes("_seg1")){ typeBadge = "seg 1"; targetSlot = 1; }
        else if(item.filename.includes("_seg2")){ typeBadge = "seg 2"; targetSlot = 2; }

        card.innerHTML = `
          <span class="variant-badge">${typeBadge}</span>
          <video src="${videoUrl}" crossorigin="anonymous" controls muted preload="none" playsinline data-lazy-video="true"></video>
          <div class="variant-info">
            <span style="font-size:10px;color:var(--muted-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;" title="${item.filename}">${item.filename}</span>
            <span class="variant-icons">
              <button type="button" class="variant-meta-btn" title="Copiar workflow" data-action="workflow">📋</button>
              <button type="button" class="variant-del-btn" title="Eliminar" data-action="delete">×</button>
            </span>
          </div>
          <div style="padding:2px 8px 6px;font-size:9px;color:var(--muted-2);font-family:var(--mono);">${dateStr}</div>
        `;
        card.dataset.filename = item.filename;
        card.dataset.subfolder = item.subfolder;
        card.dataset.type = item.type;
        makeCardDraggable(card);

        const videoEl = card.querySelector("video");
        if(videoEl){
          // El video empieza con preload="none" para no saturar la red al abrir
          // el historial. Cargamos metadatos bajo demanda al interactuar.
          const loadMetadata = () => {
            if(videoEl.preload === "none"){
              videoEl.preload = "metadata";
              videoEl.load();
            }
          };
          videoEl.addEventListener("mouseenter", loadMetadata, { once: true });
          videoEl.addEventListener("click", loadMetadata, { once: true });
          videoEl.addEventListener("loadedmetadata", () => {
            if(videoEl.currentTime === 0){
              videoEl.currentTime = 0.001;
            }
          }, { once: true });
        }

        card.addEventListener("mouseenter", async () => {
          if(!card.dataset.meta && item.filename){
            try {
              const rawUrl = mediaViewUrl(item);
              const wf = await extractWorkflowFromMP4(rawUrl);
              if(wf){
                const metaObj = formatWorkflowToMeta(wf);
                if(metaObj){
                  card.dataset.meta = JSON.stringify(metaObj);
                  showVariantTooltip(card);
                }
              }
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
          // Activar la vista adecuada para que el reproductor destino sea visible.
          const desiredView = (targetSlot === 1) ? "seg1" : (targetSlot === 2 ? "seg2" : "final");
          if(currentViewMode !== "all" && currentViewMode !== desiredView){
            const tab = document.querySelector(`.vid-view-tab[data-view="${desiredView}"]`);
            if(tab) tab.click();
          }
          displayVideoInPlayer(targetSlot, media, { autoplay: true });
          log("▶ Reproduciendo en reproductor: " + item.filename, "l-ok");
        });

        card.querySelector('[data-action="workflow"]').addEventListener("click", async (e) => {
          e.stopPropagation();
          const btn = e.currentTarget;
          btn.disabled = true;
          const orig = btn.textContent;
          btn.textContent = "⏳";
          try {
            const rawUrl = mediaViewUrl(item);
            const wf = await extractWorkflowFromMP4(rawUrl);
            if(wf){
              applyWorkflow(wf);
              log("📋 Workflow restaurado desde " + item.filename, "l-ok");
            } else {
              log("ℹ️ " + item.filename + " no contiene metadatos de workflow.", "l-warn");
            }
          } catch(err){
            log("❌ Error leyendo workflow: " + err.message, "l-err");
          } finally {
            btn.disabled = false;
            btn.textContent = orig;
          }
        });

        card.querySelector('[data-action="delete"]').addEventListener("click", async (e) => {
          e.stopPropagation();
          if(!confirm(`¿Eliminar ${item.filename}?`)) return;
          try {
            await fetch("/api/file_delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filename: item.filename,
                subfolder: item.subfolder,
                type: item.type || "output"
              })
            });
            card.remove();
            loadVideoHistory();
          } catch(err){
            log("Error eliminando: " + err.message, "l-err");
          }
        });

        grid.appendChild(card);
      }

      if(allItems.length > visibleCount){
        const moreWrap = document.createElement("div");
        moreWrap.style.cssText = "grid-column: 1 / -1; text-align: center; padding: 10px;";
        moreWrap.innerHTML = `<button type="button" class="ghost" style="font-size:11px;">Cargar más vídeos (${visibleCount} de ${allItems.length})...</button>`;
        moreWrap.querySelector("button").addEventListener("click", () => {
          visibleCount = Math.min(visibleCount + 30, allItems.length);
          renderBatch();
        });
        grid.appendChild(moreWrap);
      }
    }

    renderBatch();
    if(status) status.textContent = `(${allItems.length})`;
  } catch(err){
    if(status) status.textContent = "(error)";
    console.error("Error cargando historial de vídeos:", err);
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
// --- IMÁGENES KREA2 RECIENTES (clic → primer slot libre; drag → slot destino) ---
async function loadKrea2Recent(){
  const grid = $("krea2RecentGrid");
  const status = $("krea2RecentStatus");
  if(!grid || !status) return;
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
      const ts = new Date(it.mtime*1000).toLocaleString();
      const sizeKB = Math.round(it.size/1024);
      const div = document.createElement("div");
      div.className = "gallery-item";
      div.innerHTML = `<img src="${url}" loading="lazy" referrerpolicy="no-referrer"><div class="info-tag">${ts} · ${sizeKB}KB</div>`;
      div.addEventListener("click", () => {
        // Primer slot libre (1..4)
        let target = -1;
        for(let s = 1; s <= 4; s++){
          if(!mediaSlots[s].dataUrl && !mediaSlots[s].file){ target = s; break; }
        }
        if(target < 0){ log("⚠️ Los 4 slots de imagen están ocupados. Quita alguna imagen primero.", "l-warn"); return; }
        fetch(url).then(r2 => r2.blob()).then(blob => {
          const file = new File([blob], it.filename, { type: blob.type || "image/png" });
          handleImageFile(target, file);
          log(`✅ Imagen Krea2 → slot ${target}: ${it.filename}`, "l-ok");
        }).catch(e => log("❌ No se pudo cargar la imagen Krea2: "+e.message, "l-err"));
      });
      // Drag: la tarjeta envía la URL vía MIME custom + uri-list.
      div.draggable = true;
      div.addEventListener("dragstart", (e) => {
        const media = { filename: it.filename, subfolder: it.subfolder || "", type: it.type || "output" };
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/uri-list", url);
        e.dataTransfer.setData("text/plain", url);
        e.dataTransfer.setData(LTXV_MEDIA_MIME, JSON.stringify(media));
      });
      grid.appendChild(div);
    }
    grid.dataset.loaded = "1";
  } catch(e){
    status.textContent = "Error cargando: "+e.message;
  }
}

$("krea2RecentToggle")?.addEventListener("click", () => {
  const h = $("krea2RecentToggle");
  const b = $("krea2RecentBody");
  const isOpen = h.classList.toggle("open");
  b.classList.toggle("open", isOpen);
  const arrow = h.querySelector(".arrow");
  if(arrow) arrow.textContent = isOpen ? "▼" : "▶";
  if(isOpen && !$("krea2RecentGrid").dataset.loaded) loadKrea2Recent();
});

// Drop de imágenes Krea2 recientes sobre los slots 1..4.
// El drop nativo de archivos del SO ya está en setupMediaSlots; aquí añadimos
// el caso "URL arrastrada" (desde esta u otra UI).
function enableKrea2RecentSlotDrop(){
  for(let i = 1; i <= 4; i++){
    const slotEl = $(`slotImg${i}`);
    if(!slotEl) continue;
    slotEl.addEventListener("dragover", (e) => {
      if(!e.dataTransfer.types.includes("Files")){
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        slotEl.classList.add("drag");
      }
    });
    slotEl.addEventListener("drop", async (e) => {
      if(e.dataTransfer.files && e.dataTransfer.files.length > 0) return; // archivo OS: listener nativo
      const custom = e.dataTransfer.getData(LTXV_MEDIA_MIME);
      const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
      if(!uri && !custom) return;
      e.preventDefault();
      e.stopPropagation();
      slotEl.classList.remove("drag");
      let media = null;
      if(custom){ try { media = JSON.parse(custom); } catch(_){ media = null; } }
      const url = (media && !String(media.filename||"").startsWith("data:"))
        ? mediaViewUrl(media, { anchor: "" })
        : (uri && !uri.startsWith("data:")) ? uri : null;
      if(!url){
        // dataURL embebido (historial IndexedDB de Krea2)
        if(media && media._dataUrl && media._dataUrl.startsWith("data:")){
          try {
            const blob = await (await fetch(media._dataUrl)).blob();
            handleImageFile(i, new File([blob], media.filename || "krea2.png", { type: blob.type || "image/png" }));
            log(`✅ Imagen Krea2 → slot ${i}`, "l-ok");
          } catch(err){ log("❌ No se pudo cargar la imagen arrastrada: "+err.message, "l-err"); }
        }
        return;
      }
      try {
        const r = await fetch(url);
        if(!r.ok) throw new Error("HTTP "+r.status);
        const blob = await r.blob();
        const filename = (media && media.filename) || url.split("/").pop().split("?")[0] || "krea2.png";
        handleImageFile(i, new File([blob], filename, { type: blob.type || "image/png" }));
        log(`✅ Imagen Krea2 → slot ${i}: ${filename}`, "l-ok");
      } catch(err){
        log("❌ No se pudo cargar la imagen arrastrada: "+err.message, "l-err");
      }
    });
  }
}

// Cargar imagen pasada por query ?ref= (botón "→ MMH3X2" de Krea2) en el slot 1.
(async function maybeLoadFromQuery(){
  const qs = new URLSearchParams(window.location.search);
  const ref = qs.get("ref");
  if(!ref) return;
  const rawName = decodeURIComponent(ref);
  const filename = rawName.replace(/^.*\//, "");
  const subfolder = (rawName.includes("/") && rawName.split("/").slice(0,-1).join("/")) || "krea2";
  const tryLoad = async (sf) => {
    const url = `/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(sf)}&type=${encodeURIComponent("output")}`;
    log("⏳ Cargando imagen Krea2 como entrada: "+filename+" (subfolder="+sf+")", "l-info");
    const r = await fetch(url);
    if(!r.ok) throw new Error("HTTP "+r.status);
    const blob = await r.blob();
    if(blob.size === 0) throw new Error("respuesta vacía");
    const file = new File([blob], filename, { type: blob.type || "image/png" });
    handleImageFile(1, file);
    log("✅ Imagen Krea2 cargada en slot 1 (base Seg 1): "+filename, "l-ok");
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

window.addEventListener("DOMContentLoaded", () => {
  setupMediaSlots();
  enableKrea2RecentSlotDrop();

  if($("btnFull")) $("btnFull").addEventListener("click", (e) => { e.currentTarget?.blur(); queueJob("full"); });
  if($("btnSeg1")) $("btnSeg1").addEventListener("click", (e) => { e.currentTarget?.blur(); queueJob("seg1_only"); });
  if($("btnSeg2")) $("btnSeg2").addEventListener("click", (e) => { e.currentTarget?.blur(); queueJob("seg2_only"); });

  if($("btnStopVideo")) $("btnStopVideo").addEventListener("click", () => { stopCurrentVideo(); });
  if($("btnStopAll")) $("btnStopAll").addEventListener("click", () => { stopAll(); });
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

  if($("durationSlider1")){
    $("durationSlider1").addEventListener("input", (e) => {
      let dur1 = parseFloat(e.target.value);
      let dur2 = parseFloat($("durationSlider2")?.value || "15.0");
      if(dur1 + dur2 > 30.0){
        dur2 = Math.max(1.0, Math.round((30.0 - dur1) * 2) / 2);
        if($("durationSlider2")) $("durationSlider2").value = dur2.toFixed(1);
      }
      updateDurationFrames();
      scheduleSaveSettings();
    });
  }

  if($("durationSlider2")){
    $("durationSlider2").addEventListener("input", (e) => {
      let dur2 = parseFloat(e.target.value);
      let dur1 = parseFloat($("durationSlider1")?.value || "15.0");
      if(dur1 + dur2 > 30.0){
        dur1 = Math.max(1.0, Math.round((30.0 - dur2) * 2) / 2);
        if($("durationSlider1")) $("durationSlider1").value = dur1.toFixed(1);
      }
      updateDurationFrames();
      scheduleSaveSettings();
    });
  }

  if($("stepsSlider")){
    $("stepsSlider").addEventListener("input", (e) => {
      $("stepsVal").textContent = e.target.value;
    });
  }

  if($("h3VideoBudget")){
    $("h3VideoBudget").addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      if($("h3VideoBudgetVal")) $("h3VideoBudgetVal").textContent = `${Math.round(val * 100)}%`;
    });
  }

  // Mostrar/ocultar controles específicos de BlockATT según el modo actual
  if(IS_BLOCKATT){
    const rowOpt = $("rowOptimizer");
    if(rowOpt) rowOpt.style.display = "";
    const mode = getAttentionOptimizerState().mode;
    setAttentionOptimizerUI(mode);
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

  attachAttentionOptimizerListeners();

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

  ["h3OptToggle", "postprocToggle", "videoHistoryToggle", "finalPromptToggle"].forEach(id => {
    const el = $(id);
    if(el){
      el.addEventListener("click", () => {
        const body = $(id.replace("Toggle", "Body"));
        el.classList.toggle("open");
        if(body){
          body.classList.toggle("open");
          if(id === "videoHistoryToggle" && body.classList.contains("open")){
            loadVideoHistory();
          }
        }
      });
    }
  });

  $("btnCopyFinalPrompt")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const t1 = $("finalPromptSeg1")?.value || "";
    const t2 = $("finalPromptSeg2")?.value || "";
    const text = `=== Seg 1 ===\n${t1}\n\n=== Seg 2 ===\n${t2}`.trim();
    navigator.clipboard.writeText(text).then(() => log("📋 Prompt final copiado.", "l-ok"))
      .catch(() => log("❌ No se pudo copiar al portapapeles.", "l-err"));
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
            img.style.display = "block";
            img.onload = () => {
              if(slotIdx === 1) updateCalculatedResolution(img.naturalWidth, img.naturalHeight);
              if(info) info.textContent = `${img.naturalWidth}x${img.naturalHeight} · ${fn.slice(0, 25)}…`;
            };
            img.src = url;
          }
          if(ph) ph.style.display = "none";
        }
      });
    } else {
      log("💾 Sesión anterior restaurada (ajustes y medios guardados)", "l-ok");
    }
    const img1 = $("previewSlotImg1");
    if(img1 && img1.complete && img1.naturalWidth){
      updateCalculatedResolution(img1.naturalWidth, img1.naturalHeight);
    }
    // Si aún no cargó, el listener img.onload ya actualizará al terminar.
    updateRefNumberingHint();
  });

  // Configurar panel Enhancer exclusivamente para MiniMax H3 (Ollama)
  (function setupH3EnhancerUI(){
    const chain = $("enhancerChainMode");
    if(chain){
      chain.innerHTML = `
        <option value="off">Desactivado</option>
        <option value="ollama" selected>Ollama (H3 Vision / Text)</option>
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

  $("btnEnhance")?.addEventListener("click", async () => {
    const chainMode = $("enhancerChainMode")?.value || "ollama";
    if(chainMode === "off"){
      log("⚠️ Cadena de mejora desactivada. Activa 'Ollama' para usar el botón.", "l-warn");
      return;
    }
    const model = $("enhancerModel")?.value;
    if(!model){ log("⚠️ Selecciona un modelo de Ollama en el selector", "l-err"); return; }
    const mode = $("enhancerMode")?.value || "text";
    const styleKey = $("enhancerStyle")?.value || "A";
    const data = loadSysPrompts();
    const system = getCurrentSysPrompt(data, mode, styleKey);
    const userPrompt = $("prompt")?.value?.trim() || "";
    if(mode !== "vision" && !userPrompt){ log("⚠️ Escribe un prompt base primero en Prompt 1", "l-warn"); return; }

    const payload = { model, system, prompt: userPrompt || "Describe this image for video generation.", stream: false, options: { num_ctx: 8192 } };

    if(mode === "vision"){
      const availableSlots = [];
      for(let i = 1; i <= 4; i++){
        if(mediaSlots[i].file || mediaSlots[i].dataUrl) availableSlots.push(i);
      }
      if(availableSlots.length === 0){
        log("⚠️ Carga al menos una imagen en los slots de entrada para usar el modo Visión", "l-err");
        return;
      }

      try {
        payload.images = [];
        const readSlotBase64 = async (slotIdx) => {
          const slot = mediaSlots[slotIdx];
          if(!slot) return null;
          if(slot.file){
            return await resizeFileToBase64(slot.file, 768);
          } else if(slot.dataUrl){
            if(slot.dataUrl.startsWith("data:")){
              const blob = dataUrlToBlob(slot.dataUrl);
              return await resizeFileToBase64(blob, 768);
            } else {
              return await imageToResizedBase64(slot.dataUrl, 768);
            }
          }
          return null;
        };

        if(styleKey === "D" && availableSlots.length >= 2){
          // FL2VA: Primer frame y Último frame
          const firstB64 = await readSlotBase64(1) || await readSlotBase64(availableSlots[0]);
          const secondSlot = (mediaSlots[2].file || mediaSlots[2].dataUrl) ? 2 : availableSlots[availableSlots.length - 1];
          const lastB64 = await readSlotBase64(secondSlot);
          if(firstB64 && lastB64){
            payload.images = [firstB64, lastB64];
            payload.prompt = userPrompt
              ? `FIRST IMAGE (opening frame, Picture 1): see above. SECOND IMAGE (closing frame, Picture 2): see above. User hint: ${userPrompt}`
              : "FIRST IMAGE (opening frame, Picture 1): see above. SECOND IMAGE (closing frame, Picture 2): see above.";
          }
        } else if(styleKey === "F" && (mediaSlots[3].file || mediaSlots[3].dataUrl || mediaSlots[4].file || mediaSlots[4].dataUrl)){
          // Continuación Seg 2 con imagen
          const s3B64 = await readSlotBase64(3) || await readSlotBase64(4);
          if(s3B64){
            payload.images = [s3B64];
            payload.prompt = userPrompt
              ? `REFERENCE IMAGE FOR SEGMENT 2: see above. Existing context / Segment 1 action: ${userPrompt}`
              : "REFERENCE IMAGE FOR SEGMENT 2: see above. Describe the continued action evolving into this scene.";
          }
        } else if(styleKey === "E" && availableSlots.length > 1){
          // R2VA: hasta 3 imágenes
          for(const idx of availableSlots.slice(0, 3)){
            const b64 = await readSlotBase64(idx);
            if(b64) payload.images.push(b64);
          }
          payload.prompt = userPrompt
            ? `REFERENCE IMAGES (in order, <Picture N>): see above. User hint: ${userPrompt}`
            : "REFERENCE IMAGES (in order, <Picture N>): see above.";
        } else {
          // I2VA / Descriptivo / Cinematográfico (Slot 1)
          const b64 = await readSlotBase64(1) || await readSlotBase64(availableSlots[0]);
          if(b64) payload.images = [b64];
        }

        if(payload.images.length === 0){
          log("⚠️ No se pudo procesar la imagen seleccionada para el modelo de visión", "l-err");
          return;
        }
      } catch(e){
        log(`⚠️ Error leyendo imagen para visión: ${e.message}`, "l-err");
        return;
      }
    }

    const btn = $("btnEnhance");
    btn.disabled = true;
    btn.textContent = "Mejorando...";
    $("enhancerOutput").value = "";
    try {
      log(`🧠 Solicitando mejora a Ollama (${model}, modo ${mode}, estilo ${styleKey})...`, "l-busy");
      const { text, elapsedMs } = await streamOllamaGenerate(payload, $("enhancerOutput"));
      const timeStr = fmtMs(elapsedMs);
      $("enhancerOutput").value = text + `\n\n--- Ollama · ${model} · ${mode} · ${styleKey} · ${timeStr} ---`;
      log(`✅ Prompt mejorado en ${timeStr} (${model}, ${mode}, ${styleKey}). Puedes aplicarlo a Prompt 1 ("Usar como prompt") o a Prompt 2 ("Pegar de Enhancer").`, "l-ok");
    } catch(e){
      log(`❌ Error al mejorar prompt con Ollama: ${e.message}`, "l-err");
      $("enhancerOutput").value = "Error: " + e.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "Mejorar prompt";
    }
  });

  updateDurationFrames();
  loadVideoHistory();
  updateQueueUI();
});
