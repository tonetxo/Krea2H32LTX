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
    AIMDO: "91",
    SPECTRUM: "162",
    SOL_H3: "166",
    FACE_CROP: "301",
    FACE_REF2V: "302",
    FACE_INJECT: "303",
    FACE_PERFRAME_DENOISE: "305",
    FACE_SCHEDULER: "306",
    FACE_GUIDER: "307",
    FACE_NOISE: "308",
    FACE_SAMPLER: "309",
    FACE_DECODE: "310",
    FACE_STITCH: "311",
    FACE_LOAD_VIDEO: "312",
    FACE_COMPONENTS: "313",
    FACE_SAMPLER_SELECT: "314",
    FACE_CROP_2: "321",
    FACE_REF2V_2: "322",
    FACE_INJECT_2: "323",
    FACE_PERFRAME_DENOISE_2: "325",
    FACE_SCHEDULER_2: "326",
    FACE_GUIDER_2: "327",
    FACE_NOISE_2: "328",
    FACE_SAMPLER_2: "329",
    FACE_DECODE_2: "330",
    FACE_STITCH_2: "331"
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

const ATTENTION_BACKEND_DEFAULTS = { backend: "comfy kitchen attention" };
const ATTENTION_OPTIMIZER_DEFAULTS = { mode: "none" };
const H3OPT_DEFAULTS = { sparseBackend: "auto", videoBudget: 0.30, denserEarlyLate: true, memOptEnabled: true };
const AIMDO_DEFAULTS = { residency: "0 blocks" };
// Nota: BlockSparseAttention está desactivado en MMH3X2 porque produce:
// make_forward.<locals>.forward() got an unexpected keyword argument 'attention'
// en el transformer de MiniMax H3. Se conservan las funciones por compatibilidad
// de workflow antiguos, pero la UI no ofrece el modo.

// --- SPECTRUM (MiniMax H3) ---
const SPECTRUM_KEY = "mmh3x2_spectrum";
const SPECTRUM_DEFAULTS = { enabled: true, blend: 0.5, flex: 0.75, warmup: 1, bootstrapFirstForecast: true, historyStorage: "system_ram" };

function loadSpectrum(){
  try { return Object.assign({}, SPECTRUM_DEFAULTS, JSON.parse(localStorage.getItem(SPECTRUM_KEY) || "{}")); }
  catch(_) { return {...SPECTRUM_DEFAULTS}; }
}
function saveSpectrum(s){ try { localStorage.setItem(SPECTRUM_KEY, JSON.stringify(s)); } catch(_){} }
function setSpectrumUI(s){
  const on = $("segSpectrumOn"), off = $("segSpectrumOff");
  if(s.enabled){ on?.classList.add("on"); off?.classList.remove("on"); }
  else { off?.classList.add("on"); on?.classList.remove("on"); }
  if($("spectrumBlend")){ $("spectrumBlend").value = s.blend; $("spectrumBlendVal").textContent = parseFloat(s.blend).toFixed(2); }
  if($("spectrumFlex")){ $("spectrumFlex").value = s.flex; $("spectrumFlexVal").textContent = parseFloat(s.flex).toFixed(2); }
  if($("spectrumWarmup")){ $("spectrumWarmup").value = s.warmup; $("spectrumWarmupVal").textContent = s.warmup; }
  const bootOn = $("segBootstrapOn"), bootOff = $("segBootstrapOff");
  if(bootOn && bootOff){
    if(s.bootstrapFirstForecast !== false){ bootOn.classList.add("on"); bootOff.classList.remove("on"); }
    else { bootOff.classList.add("on"); bootOn.classList.remove("on"); }
  }
  if($("spectrumHistoryStorage")) $("spectrumHistoryStorage").value = s.historyStorage;
}
function getSpectrumState(){
  return {
    enabled: $("segSpectrumOn")?.classList.contains("on") ?? true,
    blend: parseFloat($("spectrumBlend")?.value ?? "0.5"),
    flex: parseFloat($("spectrumFlex")?.value ?? "0.75"),
    warmup: parseInt($("spectrumWarmup")?.value ?? "1", 10),
    bootstrapFirstForecast: $("segBootstrapOn")?.classList.contains("on") ?? true,
    historyStorage: $("spectrumHistoryStorage")?.value || "system_ram",
  };
}

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


const _attentionBackendState = loadAttentionBackend();
const _attentionOptimizerState = loadAttentionOptimizer();
const _h3OptState = loadH3Opt();
const _aimdoState = loadAimdo();
setWorkflowModeUI();
setAttentionBackendUI(_attentionBackendState);
if(IS_BLOCKATT){
  setAttentionOptimizerUI(_attentionOptimizerState.mode);
  setH3OptUI(_h3OptState);
  setAimdoUI(_aimdoState);
} else {
  setH3OptUI(_h3OptState);
}

// --- SOL-H3 (SM120 Blackwell) ---
const SOL_H3_KEY = "mmh3x2_sol_h3_state";
const SOL_H3_DEFAULTS = {
  enabled: true,
  exact_fusion: true,
  dense_evaluations: 1,
  dense_layers: 2,
  tau: 1.0
};
function loadSolH3(){
  try { return Object.assign({}, SOL_H3_DEFAULTS, JSON.parse(localStorage.getItem(SOL_H3_KEY) || "{}")); }
  catch(_) { return {...SOL_H3_DEFAULTS}; }
}
function saveSolH3(s){ try { localStorage.setItem(SOL_H3_KEY, JSON.stringify(s)); } catch(_){} }
function getSolH3State(){
  return {
    enabled: $("segSolH3On")?.classList.contains("on") ?? true,
    exact_fusion: $("segSolExactOn")?.classList.contains("on") ?? true,
    dense_evaluations: parseInt($("solDenseEvalSlider")?.value || "1", 10),
    dense_layers: parseInt($("solDenseLayersSlider")?.value || "2", 10),
    tau: parseFloat($("solTauSlider")?.value || "1.0")
  };
}
function setSolH3UI(s){
  if(!s) return;
  const on = $("segSolH3On"), off = $("segSolH3Off");
  const panel = $("solH3Controls");
  if(s.enabled){
    on?.classList.add("on"); off?.classList.remove("on");
    if(panel) panel.style.display = "";
  } else {
    off?.classList.add("on"); on?.classList.remove("on");
    if(panel) panel.style.display = "none";
  }
  const exactOn = $("segSolExactOn"), exactOff = $("segSolExactOff");
  if(s.exact_fusion !== false){
    exactOn?.classList.add("on"); exactOff?.classList.remove("on");
  } else {
    exactOff?.classList.add("on"); exactOn?.classList.remove("on");
  }
  if($("solDenseEvalSlider")){
    const de = (s.dense_evaluations != null) ? parseInt(s.dense_evaluations, 10) : 1;
    $("solDenseEvalSlider").value = de;
    if($("solDenseEvalVal")) $("solDenseEvalVal").textContent = de;
    if($("solDenseEvalHint")) $("solDenseEvalHint").textContent = (de === 0) ? "(0 = turbo, posible inestabilidad)" : `(${de} = estable)`;
  }
  if($("solDenseLayersSlider")){
    const dl = (s.dense_layers != null) ? parseInt(s.dense_layers, 10) : 2;
    $("solDenseLayersSlider").value = dl;
    if($("solDenseLayersVal")) $("solDenseLayersVal").textContent = dl;
  }
  if($("solTauSlider")){
    const tau = (s.tau != null) ? parseFloat(s.tau) : 1.0;
    $("solTauSlider").value = tau;
    if($("solTauVal")) $("solTauVal").textContent = tau.toFixed(1);
  }
}
const _solH3State = loadSolH3();
setSolH3UI(_solH3State);

// --- FACE REFINE (ComfyUI-H3-FaceRefine) ---
const FACEREFINE_KEY = "mmh3x2_facerefine_state";
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
  denoise: 0.35,
  steps: 4,
  canvasSize: 512,
  feather: 16,
  select: "largest_face",
  postproc: false
};
function loadFaceRefine(){
  try { return Object.assign({}, FACEREFINE_DEFAULTS, JSON.parse(localStorage.getItem(FACEREFINE_KEY) || "{}")); }
  catch(_) { return {...FACEREFINE_DEFAULTS}; }
}
function saveFaceRefine(s){ try { localStorage.setItem(FACEREFINE_KEY, JSON.stringify(s)); } catch(_){} }
function getFaceRefineState(){
  return {
    enabled: $("segFaceRefineOn")?.classList.contains("on") ?? false,
    target: $("faceRefineTarget")?.value || "face",
    denoise: parseFloat($("faceRefineDenoiseSlider")?.value || "0.35"),
    steps: parseInt($("faceRefineStepsSlider")?.value || "4", 10),
    canvasSize: parseInt($("faceRefineCanvasMode")?.value || "512", 10),
    feather: parseInt($("faceRefineFeatherSlider")?.value || "16", 10),
    select: $("faceRefineSelectMode")?.value || "largest_face",
    postproc: $("faceRefinePostprocToggle")?.checked ?? false
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
  if($("faceRefineStepsSlider")){
    const st = parseInt(s.steps != null ? s.steps : 4, 10);
    $("faceRefineStepsSlider").value = st;
    if($("faceRefineStepsVal")) $("faceRefineStepsVal").textContent = st;
    if($("faceRefineStepsHint")) $("faceRefineStepsHint").textContent = `(${st})`;
  }
  if($("faceRefineCanvasMode") && s.canvasSize){
    $("faceRefineCanvasMode").value = String(s.canvasSize);
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
  $("segSpectrumOn")?.addEventListener("click", () => { const s = getSpectrumState(); s.enabled = true; setSpectrumUI(s); saveSpectrum(s); scheduleSaveSettings(); });
  $("segSpectrumOff")?.addEventListener("click", () => { const s = getSpectrumState(); s.enabled = false; setSpectrumUI(s); saveSpectrum(s); scheduleSaveSettings(); });
  $("spectrumBlend")?.addEventListener("input", (e) => { $("spectrumBlendVal").textContent = parseFloat(e.target.value).toFixed(2); const s = getSpectrumState(); s.blend = parseFloat(e.target.value); saveSpectrum(s); scheduleSaveSettings(); });
  $("spectrumFlex")?.addEventListener("input", (e) => { $("spectrumFlexVal").textContent = parseFloat(e.target.value).toFixed(2); const s = getSpectrumState(); s.flex = parseFloat(e.target.value); saveSpectrum(s); scheduleSaveSettings(); });
  $("spectrumWarmup")?.addEventListener("input", (e) => { $("spectrumWarmupVal").textContent = e.target.value; const s = getSpectrumState(); s.warmup = parseInt(e.target.value, 10); saveSpectrum(s); scheduleSaveSettings(); });
  $("segBootstrapOn")?.addEventListener("click", () => { const s = getSpectrumState(); s.bootstrapFirstForecast = true; setSpectrumUI(s); saveSpectrum(s); scheduleSaveSettings(); });
  $("segBootstrapOff")?.addEventListener("click", () => { const s = getSpectrumState(); s.bootstrapFirstForecast = false; setSpectrumUI(s); saveSpectrum(s); scheduleSaveSettings(); });
  $("spectrumHistoryStorage")?.addEventListener("change", (e) => { const s = getSpectrumState(); s.historyStorage = e.target.value; saveSpectrum(s); scheduleSaveSettings(); });

  // Listeners Sol-H3
  $("segSolH3On")?.addEventListener("click", () => {
    const s = getSolH3State();
    s.enabled = true;
    setSolH3UI(s);
    saveSolH3(s);
    scheduleSaveSettings();
  });
  $("segSolH3Off")?.addEventListener("click", () => {
    const s = getSolH3State();
    s.enabled = false;
    setSolH3UI(s);
    saveSolH3(s);
    scheduleSaveSettings();
  });
  $("segSolExactOn")?.addEventListener("click", () => {
    const s = getSolH3State();
    s.exact_fusion = true;
    setSolH3UI(s);
    saveSolH3(s);
    scheduleSaveSettings();
  });
  $("segSolExactOff")?.addEventListener("click", () => {
    const s = getSolH3State();
    s.exact_fusion = false;
    setSolH3UI(s);
    saveSolH3(s);
    scheduleSaveSettings();
  });
  $("solDenseEvalSlider")?.addEventListener("input", (e) => {
    const de = parseInt(e.target.value, 10) || 0;
    if($("solDenseEvalVal")) $("solDenseEvalVal").textContent = de;
    if($("solDenseEvalHint")) $("solDenseEvalHint").textContent = (de === 0) ? "(0 = turbo, posible inestabilidad)" : `(${de} = estable)`;
    const s = getSolH3State();
    s.dense_evaluations = de;
    saveSolH3(s);
    scheduleSaveSettings();
  });
  $("solDenseLayersSlider")?.addEventListener("input", (e) => {
    const dl = parseInt(e.target.value, 10) || 0;
    if($("solDenseLayersVal")) $("solDenseLayersVal").textContent = dl;
    const s = getSolH3State();
    s.dense_layers = dl;
    saveSolH3(s);
    scheduleSaveSettings();
  });
  $("solTauSlider")?.addEventListener("input", (e) => {
    const tau = parseFloat(e.target.value) || 1.0;
    if($("solTauVal")) $("solTauVal").textContent = tau.toFixed(1);
    const s = getSolH3State();
    s.tau = tau;
    saveSolH3(s);
    scheduleSaveSettings();
  });

  // Listeners FaceRefine
  $("segFaceRefineOn")?.addEventListener("click", () => {
    const s = getFaceRefineState();
    s.enabled = true;
    setFaceRefineUI(s);
    saveFaceRefine(s);
    scheduleSaveSettings();
  });
  $("segFaceRefineOff")?.addEventListener("click", () => {
    const s = getFaceRefineState();
    s.enabled = false;
    setFaceRefineUI(s);
    saveFaceRefine(s);
    scheduleSaveSettings();
  });
  $("faceRefineTarget")?.addEventListener("change", (e) => {
    const s = getFaceRefineState();
    s.target = e.target.value;
    saveFaceRefine(s);
    scheduleSaveSettings();
  });
  $("faceRefineStepsSlider")?.addEventListener("input", (e) => {
    const st = parseInt(e.target.value, 10) || 4;
    if($("faceRefineStepsVal")) $("faceRefineStepsVal").textContent = st;
    if($("faceRefineStepsHint")) $("faceRefineStepsHint").textContent = `(${st})`;
    const s = getFaceRefineState();
    s.steps = st;
    saveFaceRefine(s);
    scheduleSaveSettings();
  });
  $("faceRefineCanvasMode")?.addEventListener("change", (e) => {
    const s = getFaceRefineState();
    s.canvasSize = parseInt(e.target.value, 10) || 512;
    saveFaceRefine(s);
    scheduleSaveSettings();
  });
  $("faceRefineDenoiseSlider")?.addEventListener("input", (e) => {
    const d = parseFloat(e.target.value) || 0.35;
    if($("faceRefineDenoiseVal")) $("faceRefineDenoiseVal").textContent = d.toFixed(2);
    if($("faceRefineDenoiseHint")) $("faceRefineDenoiseHint").textContent = `(${d.toFixed(2)})`;
    const s = getFaceRefineState();
    s.denoise = d;
    saveFaceRefine(s);
    scheduleSaveSettings();
  });
  $("faceRefineFeatherSlider")?.addEventListener("input", (e) => {
    const f = parseInt(e.target.value, 10) || 16;
    if($("faceRefineFeatherVal")) $("faceRefineFeatherVal").textContent = f + " px";
    if($("faceRefineFeatherHint")) $("faceRefineFeatherHint").textContent = `(${f} px)`;
    const s = getFaceRefineState();
    s.feather = f;
    saveFaceRefine(s);
    scheduleSaveSettings();
  });
  $("faceRefineSelectMode")?.addEventListener("change", (e) => {
    const s = getFaceRefineState();
    s.select = e.target.value;
    saveFaceRefine(s);
    scheduleSaveSettings();
  });
  $("faceRefinePostprocToggle")?.addEventListener("change", (e) => {
    const s = getFaceRefineState();
    s.postproc = e.target.checked;
    saveFaceRefine(s);
    scheduleSaveSettings();
  });
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

// showMedia: common.js solo lo documenta (contrato del header); nunca lo
// invoca. Se conserva por compatibilidad con la firma del contrato
// showMedia(slot, media, options) por si un future caller lo usa.
CONFIG.showMedia = function(slot, media, options){
  const targetPlayer = (typeof slot === "number") ? slot : (media?.targetSlot || 3);
  displayVideoInPlayer(targetPlayer, media, options);
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
  const hasImg1 = !!(img1 && img1.complete && img1.naturalWidth && img1.style.display !== "none");
  updateCalculatedResolution(hasImg1 ? img1.naturalWidth : 1280, hasImg1 ? img1.naturalHeight : 720);
}

CONFIG.variantMeta = function(seedValue, timeText){
  const p1 = $("prompt")?.value?.trim() || "";
  const p2 = $("prompt2")?.value?.trim() || "";
  const seg2Mode = $("seg2PromptMode")?.value || "direct";
  const dur1 = parseFloat($("durationSlider1")?.value || "15.0");
  const dur2 = parseFloat($("durationSlider2")?.value || "15.0");
  const f1 = calcFramesForDuration(dur1);
  const f2 = calcFramesForDuration(dur2);
  const fTotal = (f1 - 1) + f2;
  const mp = $("mpSlider")?.value || "0.70";
  const steps = $("stepsSlider")?.value || "20";
  const sampler = $("samplerName")?.value || "res_multistep";
  const scheduler = $("schedulerName")?.value || "simple";
  const unet = $("unetModel")?.value?.split('/')?.pop() || BASE_GRAPH?.[N.UNET]?.inputs?.unet_name?.split('/')?.pop() || "";
  const clip = $("clipModel")?.value?.split('/')?.pop() || BASE_GRAPH?.[N.CLIP]?.inputs?.clip_name?.split('/')?.pop() || "";
  const vae = $("vaeModel")?.value?.split('/')?.pop() || BASE_GRAPH?.[N.VAE_VID]?.inputs?.vae_name?.split('/')?.pop() || "";
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
    else if(audioMode === "hybrid") audioDesc = `Híbrido (IA puro seg1/seg2; final: pista ${$("audioUserVolume")?.value ?? "-12"} dB + IA ${$("audioGuideVolume")?.value ?? "-6"} dB)`;

  const audioCfOn = $("audioCrossfadeToggle") ? $("audioCrossfadeToggle").checked : false;
  const audioCfSec = $("audioCrossfadeSlider") ? parseFloat($("audioCrossfadeSlider").value).toFixed(2) : "1.00";

  const timingVal = (timeText && String(timeText).trim()) ? String(timeText).trim() : ($("timeFinal")?.textContent?.replace("⏱", "")?.trim() || "");

  const rows = [
    ["Modelo", unet],
    ["CLIP", clip],
    ["VAE Vídeo", vae],
    ["Prompt Seg 1", p1 ? (p1.length > 80 ? p1.slice(0, 77) + "..." : p1) : "(vacío)"],
    ["Prompt Seg 2", p2 ? (p2.length > 80 ? p2.slice(0, 77) + "..." : p2) : `[${seg2Mode}]`],
    ["Modo Seg 2", seg2Mode === "ollama" ? "Guía Ollama (continuación)" : "Prompt Directo"],
    ["Modo Audio", audioDesc],
    ["Refs compartidas", $("shareRefsToggle")?.checked ? "sí (Img 2/3/4 en ambos)" : "no"],
    ["Ref size", $("refImageSize")?.value || "match"],
    ["Crossfade Audio", audioCfOn ? `${audioCfSec}s (${$("audioCrossfadeCurve")?.value || 'equal_power'})` : "desactivado"],
    ["Duración Seg 1", `${dur1.toFixed(1)}s (${f1}f)`],
    ["Duración Seg 2", `${dur2.toFixed(1)}s (${f2}f)`],
    ["Duración Total", `${(fTotal / 24).toFixed(1)}s (${fTotal}f)`],
    ["Resolución", `${w}×${h} (${mp} MP)`],
    ["A/R", getFriendlyRatio(parseInt(w, 10), parseInt(h, 10))],
    ["Pasos (Steps)", steps],
    ["Sampler", sampler],
    ["Scheduler", scheduler],
    ["LoRAs", lorasActive.length ? lorasActive.join(", ") : "ninguno"],
    ["Backend denso", $("attentionBackend")?.value || "comfy kitchen attention"],
    ["Video budget", `${Math.round((parseFloat($("h3VideoBudget")?.value || "0.30")) * 100)}%`],
    ["Denser early/late", $("segDenserOn")?.classList.contains("on") ? "Sí" : "No"],
    ["Memory opt", $("segMemOptOn")?.classList.contains("on") ? "Sí" : "No"],
    (() => { const s = getSpectrumState(); return ["Spectrum", s.enabled ? `on · bw ${s.blend.toFixed(2)} · fw ${s.flex.toFixed(2)} · wu ${s.warmup}${s.bootstrapFirstForecast ? ' · boot' : ''} · ${s.historyStorage}` : "off"]; })(),
    IS_BLOCKATT ? ["Optimizador", getAttentionOptimizerState().mode] : null,
    ["Empalme vídeo", $("blendToggle")?.checked ? `${$("blendFrames")?.value || 4}f · fuerza ${$("blendStrength")?.value || 0.35} · ${$("blendMode")?.value || "transition_only"}` : "desactivado"],
    (() => {
      const rifeOn = $("rifeToggle")?.checked;
      if(!rifeOn) return ["Interpolación", "desactivada"];
      const engine = $("rifeEngine")?.value || "rife";
      const mult = $("rifeMultiplier")?.value || "2";
      return ["Interpolación", (engine === "rtx") ? `RTX Frame Gen ${mult}x` : `RIFE ${mult}x`];
    })(),
    ["RTX Super Resolution", $("rtxToggle")?.checked ? `on (2x ${$("rtxQuality")?.value || "HIGHBITRATE_ULTRA"})` : "off"]
  ].filter(Boolean);

  if(timingVal) rows.unshift(["Tiempo gen.", timingVal]);

  return { title: "Parámetros MMH3X2", rows, loras: lorasActive };
};

function findModelInWorkflow(workflow){
  if(!workflow || typeof workflow !== "object") return "";
  for(const k of Object.keys(workflow)){
    const node = workflow[k];
    if(!node || !node.inputs) continue;
    if(node.inputs.unet_name) return String(node.inputs.unet_name).split("/").pop();
    if(node.inputs.ckpt_name) return String(node.inputs.ckpt_name).split("/").pop();
    if(node.inputs.model_name) return String(node.inputs.model_name).split("/").pop();
  }
  return "";
}

function findClipInWorkflow(workflow){
  if(!workflow || typeof workflow !== "object") return "";
  for(const k of Object.keys(workflow)){
    const node = workflow[k];
    if(!node || !node.inputs) continue;
    if(node.inputs.clip_name) return String(node.inputs.clip_name).split("/").pop();
  }
  return "";
}

function formatWorkflowToMeta(workflow, extra = {}){
  if(!workflow || typeof workflow !== "object") return null;
  const rows = [];

  const res = extra.resolution || "—";
  const ar = extra.aspectRatio || "—";
  const timing = extra.timing || "—";

  if(res !== "—") rows.push(["Resolución", res]);
  if(ar !== "—") rows.push(["A/R", ar]);
  if(timing !== "—") rows.push(["Tiempo gen.", timing]);

  const modelName = findModelInWorkflow(workflow);
  if(modelName) rows.push(["Modelo", modelName]);
  const clipName = findClipInWorkflow(workflow);
  if(clipName) rows.push(["CLIP", clipName]);
  if(workflow["50"]?.inputs?.value) rows.push(["Prompt 1", String(workflow["50"].inputs.value).slice(0, 80)]);
  // Nota: el nodo "6" de MMH3X2 es H3MemoryOptimization (fallback copiado de
  // otra UI eliminado).
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
  if(nid === "99_savetext_prompt2" && data.output){
    const promptSeg2Real = (Array.isArray(data.output.text) ? data.output.text[0] : data.output.text) || "";
    if(promptSeg2Real){
      const ta2 = $("finalPromptSeg2");
      if(ta2){
        ta2.value = promptSeg2Real;
        ta2.style.transition = "border-color 0.5s ease";
        ta2.style.borderColor = "var(--accent)";
        setTimeout(() => { ta2.style.borderColor = ""; }, 2500);
      }
      const hint = $("finalPromptHint");
      if(hint) hint.innerHTML = `<span style="color:var(--accent);font-weight:600;">✨ Prompt Seg 2 definitivo generado por Ollama</span> y aplicado al modelo:`;
      log("🤖 Prompt final de Seg 2 generado por Ollama y aplicado al modelo.", "l-ok");
    }
  }
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
      if(m1.filename) saveVideoTiming(m1.filename, fmtMs(seg1Ms));
      displayVideoInPlayer(1, m1, { variant: promptVariantMap[data.prompt_id], promptId: data.prompt_id });
      // El resultado de Seg 1 ya está en el reproductor: fuera su preview en
      // vivo (congelado) mientras Seg 2 sigue muestreando.
      clearSegmentPreview("Seg1");
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
      if(m2.filename) saveVideoTiming(m2.filename, fmtMs(seg2Ms));
      displayVideoInPlayer(2, m2, { variant: promptVariantMap[data.prompt_id], promptId: data.prompt_id });
      clearSegmentPreview("Seg2");
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
      if(mf.filename) saveVideoTiming(mf.filename, fmtMs(totalMs));
      displayVideoInPlayer(3, mf, { variant: promptVariantMap[data.prompt_id], promptId: data.prompt_id });
      clearSegmentPreview("Final");
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
  } else if(nid === String(N.FACE_SAMPLER) || nid === "309"){
    activeSlot = "Final";
    label = "FaceRefine";
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

  // 4. Estado en tiempo real SIN borrar el log acumulado: escribir sobre #log
  // con textContent destruye el historial de log() (que añade hijos div).
  // Solo refrescamos la primera línea si la UI lo soporta; el resto va al badge.
  const logEl = $("log");
  if(logEl){
    logEl.dataset.busyState = `⏳ ${label}: Paso ${value}/${max} (${pct}%)`;
    logEl.classList.add("l-busy");
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
  } else if(node === String(N.FACE_CROP) || node === "301"){
    log("Rastreando y recortando rostros (Face Track Crop)...", "l-busy");
    const tFin = $("previewStepTextFinal");
    if(tFin) tFin.textContent = "FaceRefine: Detectando rostros...";
  } else if(node === String(N.FACE_PERFRAME_DENOISE) || node === "305"){
    log("Calculando denoise adaptativo por fotograma (FaceRefine)...", "l-busy");
  } else if(node === String(N.FACE_SAMPLER) || node === "309"){
    log("Muestreando detalle facial de alta fidelidad (DiT FaceRefine)...", "l-busy");
  } else if(node === String(N.FACE_DECODE) || node === "310"){
    log("Decodificando rostros refinados (VAE)...", "l-busy");
  } else if(node === String(N.FACE_STITCH) || node === "311"){
    log("Componiendo rostros refinados sobre el vídeo continuo (Face Stitch)...", "l-busy");
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
  const slotIndex = (slot === "Seg2") ? 2 : 1;
  // Los frames tardíos del preview de un pase YA COMPLETADO se ignoran solo si
  // el reproductor de esta etapa muestra el resultado del MISMO prompt en curso
  // (si muestra un prompt anterior, el preview debe salir). Anclado a promptId
  // único para evitar que el reseteo de variantCounter a 1 en cada nuevo job
  // bloquee todos los previews en las generaciones sucesivas.
  const vDone = $("video" + slot);
  if(vDone && vDone.src && vDone.style.display === "block"){
    if(currentPromptId && currentMediaPrompt[slotIndex] != null && currentMediaPrompt[slotIndex] === currentPromptId) return;
  }
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
  if(v && (!currentMediaPrompt[slotIndex] || currentMediaPrompt[slotIndex] !== currentPromptId)) v.style.display = "none";
  if(isVideoUrl && pv && pv.autoplay !== true){ pv.autoplay = true; pv.muted = true; pv.loop = true; }
  if(isVideoUrl && target.play) target.play().catch(()=>{});

  // El preview final también entra si videoFinal muestra un resultado de otro
  // prompt (o nada); con el resultado de ESTE prompt ya no hace falta.
  const vFin = $("videoFinal");
  const finShowsThisPrompt = vFin && vFin.src && vFin.style.display === "block"
    && currentPromptId && currentMediaPrompt[3] != null && currentMediaPrompt[3] === currentPromptId;
  if(!finShowsThisPrompt){
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
      if(vFin && (!currentMediaPrompt[3] || currentMediaPrompt[3] !== currentPromptId)){
        vFin.style.display = "none";
      }
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

// Como clearPreviewSlot de ltxv.js: limpiar el preview EN VIVO de una etapa
// concreta cuando su vídeo de resultado ya está en el reproductor, sin tocar
// los reproductores ni los previews de las etapas que siguen muestreando.
function clearSegmentPreview(slotName){
  const p = $("previewImg" + slotName);
  const pv = $("previewVideo" + slotName);
  const w = $("previewWrap" + slotName);
  const b = $("previewStep" + slotName);
  const e = $("empty" + slotName);
  if(p){ p.style.display = "none"; p.removeAttribute("src"); }
  if(pv){ pv.pause(); pv.style.display = "none"; pv.removeAttribute("src"); pv.load(); }
  if(w) w.style.display = "none";
  if(b) b.style.display = "none";
  if(e) e.style.display = "";
}

// Reset de los 3 paneles de preview al empezar una nueva variante: sin esto,
// Seg1/Final muestran el preview (o resultado) de la generación anterior hasta
// que llega el preview nuevo. Limpia los elementos de preview en vivo (img/video
// de preview) y las cajas de "vacío", pero NO los reproductores de resultados
// (videoSeg1/videoSeg2/videoFinal), que solo se tocan al cargar un resultado.
function resetPreviewPanes(runMode){
  const slots = (runMode === "seg2_only") ? ["Final", "Seg2"] : ["Final", "Seg1", "Seg2"];
  slots.forEach(slot => {
    const p = $("previewImg" + slot);
    const pv = $("previewVideo" + slot);
    const w = $("previewWrap" + slot);
    const b = $("previewStep" + slot);
    const e = $("empty" + slot);
    const v = $("video" + slot);
    if(p){ p.style.display = "none"; p.removeAttribute("src"); }
    if(pv){ pv.pause(); pv.style.display = "none"; pv.removeAttribute("src"); pv.load(); }
    if(w) w.style.display = "none";
    if(b) b.style.display = "none";
    if(e) e.style.display = "";
    if(v) v.style.display = "none";
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
        <span class="variant-seed-display" title="Semilla" style="font-size:10px;font-family:var(--mono);color:var(--muted);">Seed: ${escapeHtml(String(seedUsed))}</span>
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
      <span class="variant-badge">Var ${parseInt(varIdx, 10) || 0} · Seed ${escapeHtml(String(seed))}</span>
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
      if(m1){ found = true; if(!playerAlreadyShows(1, m1)) displayVideoInPlayer(1, m1, { variant: promptVariantMap[promptId], promptId: promptId }); }
    }
    if(entry?.outputs?.[N.SAVE_VID_2]){
      const m2 = CONFIG.findMedia(entry.outputs[N.SAVE_VID_2]);
      if(m2){ found = true; if(!playerAlreadyShows(2, m2)) displayVideoInPlayer(2, m2, { variant: promptVariantMap[promptId], promptId: promptId }); }
    }
    if(entry?.outputs?.[N.SAVE_VID_FINAL]){
      const mf = CONFIG.findMedia(entry.outputs[N.SAVE_VID_FINAL]);
      if(mf){
        found = true;
        if(!playerAlreadyShows(3, mf)) displayVideoInPlayer(3, mf, { variant: promptVariantMap[promptId], promptId: promptId });
        const varIndex = promptVariantMap[promptId] || (variantCounter + 1);
        CONFIG.addToVariantGallery(mf, realSeed, varIndex);
      }
    }
    if(entry?.outputs?.["99_savetext_prompt2"]?.text){
      const promptSeg2Real = (Array.isArray(entry.outputs["99_savetext_prompt2"].text)
        ? entry.outputs["99_savetext_prompt2"].text[0]
        : entry.outputs["99_savetext_prompt2"].text) || "";
      const ta2 = $("finalPromptSeg2");
      if(ta2 && promptSeg2Real && ta2.value !== promptSeg2Real){
        ta2.value = promptSeg2Real;
        const hint = $("finalPromptHint");
        if(hint) hint.innerHTML = `<span style="color:var(--accent);font-weight:600;">✨ Prompt Seg 2 definitivo generado por Ollama</span> y aplicado al modelo:`;
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
  // Contrato de common.js: si hay outputs pero ningún medio usable, señalamos
  // foundOutput:false para que pollFallback reintente en vez de avanzar el
  // batch con una tarjeta "procesando" huérfana. Solo si found==true la UI
  // ya avanzó el batch ella misma (skipFinalize) y devolvemos true.
  if(!found){
    return { foundOutput: false };
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
  // No avanzar la cola aquí: common.js ya hace currentBatchIndex++ +
  // processNextBatch tras este callback; llamar a finishCurrentJob() desde
  // aquí arranca el siguiente job mientras processNextBatch dispara una
  // variante del job ANTIGUO (race de batch/variantCounter).
  delete promptSteps[pid];
  delete promptVariantMap[pid];
  delete displayedSlots[pid];
  // Limpiar la tarjeta "generando" huérfana de esta variante.
  const grid = $("variantGrid");
  if(grid){
    const card = grid.querySelector('.variant-card-generating');
    if(card) card.remove();
  }
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

CONFIG.onStopCurrent = function(pid){
  // common.js ya interrumpió el backend antes de llamar aquí (con el pid que
  // le pasa el contrato); el avance del batch lo hace su processNextBatch.
  delete promptVariantMap[pid];
  delete displayedSlots[pid];
};

CONFIG.onStopAll = function(){
  // common.js ya interrumpió el backend y vació pendingSeeds; solo estado propio.
  promptVariantMap = {};
  for(const k of Object.keys(displayedSlots)) delete displayedSlots[k];
  promptSteps = {};
  jobQueue = [];
  activeJob = null;
  updateQueueUI();
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
      log("🧟 Job activo huérfano liberado (ComfyUI está en reposo); retomando la cola...", "l-warn");
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
      const pText = escapeHtml((job.prompt || "sin prompt").trim());
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
// Prompt al que pertenece el resultado mostrado en cada reproductor. Sirve
// para el guard de onPreview: solo hay que ignorar frames tardíos del preview
// si el reproductor ya muestra el resultado del MISMO prompt que está
// generándose; con el resultado de un prompt ANTERIOR el preview debe salir.
const currentMediaPrompt = { 1: null, 2: null, 3: null };
const currentMediaVariant = { 1: null, 2: null, 3: null };

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
    $("seg2PromptMode").value = isGuided ? "ollama" : "direct";
    if(typeof updateSeg2OllamaModelVisibility === "function") updateSeg2OllamaModelVisibility();
  }
  if(workflow["51"]?.inputs?.model){
    const m = workflow["51"].inputs.model;
    if($("seg2OllamaModel")) $("seg2OllamaModel").value = m;
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
    if($("lora1StrengthVal")) $("lora1StrengthVal").textContent = parseFloat($("lora1Strength").value).toFixed(2);
  }
  if(workflow["145_2"]?.inputs && $("lora2Toggle")){
    $("lora2Toggle").checked = true;
    if($("lora2Select")) $("lora2Select").value = workflow["145_2"].inputs.lora_name || "";
    if($("lora2Strength")) $("lora2Strength").value = workflow["145_2"].inputs.strength_model || 1.0;
    if($("lora2StrengthVal")) $("lora2StrengthVal").textContent = parseFloat($("lora2Strength").value).toFixed(2);
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

  // 9. Modelos UNet, CLIP & VAE Vídeo
  const unetNode = workflow["14"] || workflow["10"] || workflow[N.UNET] || findByClass("UNETLoader");
  if(unetNode?.inputs?.unet_name && $("unetModel")){
    $("unetModel").value = unetNode.inputs.unet_name;
  }
  const clipNode = workflow["11"] || workflow[N.CLIP] || findByClass("CLIPLoader");
  if(clipNode?.inputs?.clip_name && $("clipModel")){
    $("clipModel").value = clipNode.inputs.clip_name;
  }
  const vaeNode = workflow[N.VAE_VID] || workflow["8"] || findByClass("VAELoader");
  if(vaeNode?.inputs?.vae_name && $("vaeModel")){
    $("vaeModel").value = vaeNode.inputs.vae_name;
  }

  // 10. Optimizaciones de atención MMH3X2
  const attnBackendNode = findByClass("ModelAttentionBackend");
  if(attnBackendNode?.inputs?.attention){
    setAttentionBackendUI({ backend: attnBackendNode.inputs.attention });
    saveAttentionBackend({ backend: attnBackendNode.inputs.attention });
  }

  const sparseNode = findByClass("H3SparseAttention") || findByClass("H3SparseAttentionAdvanced");
  const sparseAdvancedNode = findByClass("H3SparseAttentionAdvanced");
  const aimdoNode = findByClass("H3AIMDOResidencyLimiter");
  const memOptNode = findByClass("H3MemoryOptimization");

  // BlockSparseAttention: eliminado (falla con MiniMax H3); los workflows
  // antiguos que lo traigan se normalizan a las ramas de abajo.
  if(sparseAdvancedNode?.inputs || sparseNode?.class_type === "H3SparseAttentionAdvanced"){
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

  // 11. Spectrum
  const spectrumNode = findByClass("SpectrumApplyMiniMaxH3");
  if(spectrumNode && spectrumNode.inputs){
    const s = {
      enabled: spectrumNode.inputs.enabled !== false,
      blend: typeof spectrumNode.inputs.blend_weight === "number" ? spectrumNode.inputs.blend_weight : 0.5,
      flex: typeof spectrumNode.inputs.flex_window === "number" ? spectrumNode.inputs.flex_window : 0.75,
      warmup: typeof spectrumNode.inputs.warmup_steps === "number" ? spectrumNode.inputs.warmup_steps : 1,
      bootstrapFirstForecast: spectrumNode.inputs.bootstrap_first_forecast !== false,
      historyStorage: spectrumNode.inputs.history_storage || "system_ram",
    };
    setSpectrumUI(s);
    saveSpectrum(s);
  }
  // Sin nodo Spectrum en el workflow: no tocar el estado guardado.

  // 12. Toggles postprocesado y RIFE
  const rtxFgNode = findByClass("RTXVideoFrameGeneration");
  const rifeNode = workflow["72"] || findByClass("FrameInterpolate");
  if(rtxFgNode){
    if($("rifeToggle")) $("rifeToggle").checked = true;
    if($("rifeEngine")) $("rifeEngine").value = "rtx";
    const mult = (typeof rtxFgNode.inputs?.["generation_type.multiplier"] === "number")
      ? rtxFgNode.inputs["generation_type.multiplier"]
      : (typeof rtxFgNode.inputs?.multiplier === "number" ? rtxFgNode.inputs.multiplier : 2);
    if($("rifeMultiplier")) $("rifeMultiplier").value = String(mult);
    const col = $("rifeModelCol");
    if(col) col.style.display = "none";
  } else if(rifeNode){
    if($("rifeToggle")) $("rifeToggle").checked = true;
    if($("rifeEngine")) $("rifeEngine").value = "rife";
    if(rifeNode.inputs?.multiplier && $("rifeMultiplier")){
      $("rifeMultiplier").value = String(rifeNode.inputs.multiplier);
    }
    const col = $("rifeModelCol");
    if(col) col.style.display = "";
  } else {
    if($("rifeToggle")) $("rifeToggle").checked = false;
  }

  const rtxNode = findByClass("RTXVideoSuperResolution");
  if($("rtxToggle")) $("rtxToggle").checked = !!rtxNode;
  if(rtxNode?.inputs?.quality && $("rtxQuality")){
    $("rtxQuality").value = rtxNode.inputs.quality;
  }
  const vtbNode = findByClass("VideoTemporalBlend");
  if($("blendToggle")) $("blendToggle").checked = !!vtbNode;
  if(vtbNode && vtbNode.inputs){
    if(typeof vtbNode.inputs.blend_strength === "number" && $("blendStrength")){
      $("blendStrength").value = vtbNode.inputs.blend_strength;
      if($("blendStrengthVal")) $("blendStrengthVal").textContent = parseFloat(vtbNode.inputs.blend_strength).toFixed(2);
    }
    if(typeof vtbNode.inputs.blend_frames === "number" && $("blendFrames")){
      $("blendFrames").value = vtbNode.inputs.blend_frames;
      if($("blendFramesVal")) $("blendFramesVal").textContent = `${vtbNode.inputs.blend_frames}f`;
    }
    if(vtbNode.inputs.mode && $("blendMode")) $("blendMode").value = vtbNode.inputs.mode;
  }
  if(typeof updateBlendControlsVisibility === "function") updateBlendControlsVisibility();

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
  const btnInterp = $("btnInterpolate" + suffix);
  const btnFr = $("btnFaceRefine" + suffix);
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
  // Anclar el prompt y variante del resultado: el guard de onPreview los compara
  // con el prompt activo (frames tardíos del MISMO prompt se ignoran; con el
  // resultado de otro prompt el preview sí debe salir).
  if(options.variant !== undefined){
    currentMediaVariant[slotIndex] = (options.variant != null) ? options.variant : null;
  }
  const shownPrompt = (options.promptId !== undefined) ? options.promptId
    : (currentPromptId || null);
  currentMediaPrompt[slotIndex] = shownPrompt;

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
      video.play().catch(err => console.debug("Autoplay:", err));
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
      log(`Vídeo ${suffix}: error de reproducción (${code}). Prueba 'Descargar' si el navegador no soporta el formato.`, "l-err");
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

  if(btnInterp){
    btnInterp.style.display = "inline-flex";
    btnInterp.onclick = () => {
      enqueueInterpolateCurrent(slotIndex);
    };
  }

  if(btnFr){
    btnFr.style.display = "inline-flex";
    btnFr.onclick = () => {
      enqueueFaceRefineCurrent(slotIndex);
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
      btnMeta.textContent = "...";
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

// --- FACE REFINE ON-DEMAND ---
async function enqueueFaceRefineCurrent(slotIndex = 3){
  const media = currentMedia[slotIndex] || currentMedia[3];
  if(!media || !media.filename){
    log("No hay ningún vídeo en el reproductor para refinar.", "l-warn");
    return;
  }
  const job = {
    id: "fr_" + Date.now(),
    runMode: "facerefine_only",
    isFaceRefineOnly: true,
    sourceMedia: { ...media },
    prompt: $("prompt")?.value?.trim() || "",
    prompt2: $("prompt2")?.value?.trim() || "",
    duration1: parseFloat($("durationSlider1")?.value || "15.0"),
    duration2: parseFloat($("durationSlider2")?.value || "15.0"),
    megapixels: parseFloat($("mpSlider")?.value || "0.70"),
    steps: parseInt($("stepsSlider")?.value || "20", 10),
    sampler: $("samplerName")?.value || "res_multistep",
    scheduler: $("schedulerName")?.value || "simple",
    seedMode: "random",
    seed: Math.floor(Math.random() * 100000000),
    batchSize: 1,
    attentionBackend: getAttentionBackendState(),
    h3opt: getH3OptState(),
    solH3: getSolH3State(),
    faceRefine: getFaceRefineState(),
    mediaSlotsSnapshot: {
      1: mediaSlots[1]?.uploaded ? { ...mediaSlots[1].uploaded } : null,
      2: mediaSlots[2]?.uploaded ? { ...mediaSlots[2].uploaded } : null,
      3: mediaSlots[3]?.uploaded ? { ...mediaSlots[3].uploaded } : null,
      4: mediaSlots[4]?.uploaded ? { ...mediaSlots[4].uploaded } : null
    },
    audioSlotsSnapshot: {
      1: audioSlots[1]?.uploaded ? { ...audioSlots[1].uploaded } : null,
      2: audioSlots[2]?.uploaded ? { ...audioSlots[2].uploaded } : null
    },
    videoSlotSnapshot: videoSlot?.uploaded ? { ...videoSlot.uploaded } : null
  };
  log(`Añadido refinado facial para ${media.filename} a la cola...`, "l-info");
  if(!activeJob){
    startJob(job);
  } else {
    jobQueue.push(job);
    updateQueueUI();
    log(`📥 Tarea añadida a la cola (${jobQueue.length} en espera)`, "l-ok");
  }
}

const btnFaceRefineFinalEl = $("btnFaceRefineFinal");
if(btnFaceRefineFinalEl){
  btnFaceRefineFinalEl.addEventListener("click", () => enqueueFaceRefineCurrent(3));
}

// --- FRAME INTERPOLATION ON-DEMAND ---
async function enqueueInterpolateCurrent(slotIndex = 3){
  const media = currentMedia[slotIndex] || currentMedia[3];
  if(!media || !media.filename){
    log("No hay ningún vídeo en el reproductor para interpolar.", "l-warn");
    return;
  }
  const rifeEngine = $("rifeEngine")?.value || "rife";
  const rifeMult = parseInt($("rifeMultiplier")?.value || "2", 10);
  const rifeModel = $("rifeModel")?.value || "rife_v4.26.safetensors";
  const job = {
    id: "interp_" + Date.now(),
    runMode: "interpolate_only",
    isInterpolateOnly: true,
    sourceMedia: { ...media },
    rife: {
      enabled: true,
      engine: rifeEngine,
      multiplier: rifeMult,
      model: rifeModel
    },
    batchSize: 1
  };
  log(`⚡ Añadida interpolación (${rifeEngine.toUpperCase()} ${rifeMult}x) para ${media.filename} a la cola...`, "l-info");
  if(!activeJob){
    startJob(job);
  } else {
    jobQueue.push(job);
    updateQueueUI();
    log(`📥 Tarea añadida a la cola (${jobQueue.length} en espera)`, "l-ok");
  }
}

const btnInterpolateFinalEl = $("btnInterpolateFinal");
if(btnInterpolateFinalEl){
  btnInterpolateFinalEl.addEventListener("click", () => enqueueInterpolateCurrent(3));
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
    seg2OllamaModel: $("seg2OllamaModel")?.value || "",
    seedMode: $("segRandom")?.classList.contains("on") ? "random" : "fixed",
    seedVal: $("seedVal")?.value || "12345",
    duration1: $("durationSlider1")?.value || "15.0",
    duration2: $("durationSlider2")?.value || "15.0",
    megapixels: $("mpSlider")?.value || "0.70",
    aspectRatio: $("aspectRatioSelect")?.value || "auto",
    batchSize: $("batchSize")?.value || "1",
    filenamePrefix: $("filenamePrefix")?.value || "video/MiniMax_H3",
    steps: $("stepsSlider")?.value || "20",
    sampler: $("samplerName")?.value || "res_multistep",
    scheduler: $("schedulerName")?.value || "simple",
    unetModel: $("unetModel")?.value || "",
    clipModel: $("clipModel")?.value || "",
    vaeModel: $("vaeModel")?.value || "",
    attentionBackend: getAttentionBackendState(),
    attentionOptimizer: IS_BLOCKATT ? getAttentionOptimizerState() : null,
    h3opt: getH3OptState(),
    aimdo: IS_BLOCKATT ? getAimdoState() : null,
    h3ShiftVideo: $("h3ShiftVideo")?.value || "12.0",
    h3ShiftAudio: $("h3ShiftAudio")?.value || "3.0",
    spectrum: getSpectrumState(),
    lora1Toggle: $("lora1Toggle") ? $("lora1Toggle").checked : false,
    lora1Select: $("lora1Select")?.value || "",
    lora1Strength: $("lora1Strength")?.value || "1.0",
    lora2Toggle: $("lora2Toggle") ? $("lora2Toggle").checked : false,
    lora2Select: $("lora2Select")?.value || "",
    lora2Strength: $("lora2Strength")?.value || "1.0",
    blendToggle: $("blendToggle") ? $("blendToggle").checked : true,
    blendStrength: $("blendStrength")?.value || "0.35",
    blendFrames: $("blendFrames")?.value || "4",
    rtxToggle: $("rtxToggle") ? $("rtxToggle").checked : true,
    rtxQuality: $("rtxQuality")?.value || "HIGHBITRATE_ULTRA",
    rifeToggle: $("rifeToggle") ? $("rifeToggle").checked : true,
    rifeEngine: $("rifeEngine")?.value || "rife",
    rifeMultiplier: $("rifeMultiplier")?.value || "2",
    rifeModel: $("rifeModel")?.value || "rife_v4.26.safetensors",
    audioMode: $("audioMode")?.value || "none",
    audioCrossfadeToggle: $("audioCrossfadeToggle") ? $("audioCrossfadeToggle").checked : true,
    audioCrossfadeSlider: $("audioCrossfadeSlider")?.value || "0.40",
    audioCrossfadeCurve: $("audioCrossfadeCurve")?.value || "equal_power",
    audioGuideVolume: parseInt($("audioGuideVolume")?.value ?? "-6", 10),
    audioUserVolume: parseInt($("audioUserVolume")?.value ?? "-12", 10),
    audioNormalizeToggle: $("audioNormalizeToggle") ? $("audioNormalizeToggle").checked : false,
    enhancerModel: $("enhancerModel")?.value || "",
    enhancerMode: $("enhancerMode")?.value || "text",
    enhancerStyle: $("enhancerStyle")?.value || "A",
    enhancerChainMode: $("enhancerChainMode")?.value || "ollama",
    shareRefsToggle: !!$("shareRefsToggle")?.checked,
    refImageSize: $("refImageSize")?.value || "match",
    solH3: getSolH3State(),
    faceRefine: getFaceRefineState()
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
    if(s.seg2OllamaModel !== undefined && $("seg2OllamaModel")) $("seg2OllamaModel").value = s.seg2OllamaModel;
    if(typeof updateSeg2OllamaModelVisibility === "function") updateSeg2OllamaModelVisibility();

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
    if(s.aspectRatio !== undefined && $("aspectRatioSelect")){
      $("aspectRatioSelect").value = s.aspectRatio;
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
    if(s.vaeModel && $("vaeModel")) $("vaeModel").value = s.vaeModel;

    if(s.attentionBackend){ setAttentionBackendUI(s.attentionBackend); saveAttentionBackend(s.attentionBackend); }
    if(IS_BLOCKATT){
      if(s.attentionOptimizer){ setAttentionOptimizerUI(s.attentionOptimizer.mode); saveAttentionOptimizer(s.attentionOptimizer); }
      if(s.h3opt){ setH3OptUI(s.h3opt); saveH3Opt(s.h3opt); }
      if(s.aimdo){ setAimdoUI(s.aimdo); saveAimdo(s.aimdo); }
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
    if(s.spectrum){ setSpectrumUI(s.spectrum); saveSpectrum(s.spectrum); }
    if(s.solH3){ setSolH3UI(s.solH3); saveSolH3(s.solH3); }
    if(s.faceRefine){ setFaceRefineUI(s.faceRefine); saveFaceRefine(s.faceRefine); }

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
    if(s.blendStrength !== undefined && $("blendStrength")){
      $("blendStrength").value = s.blendStrength;
      if($("blendStrengthVal")) $("blendStrengthVal").textContent = parseFloat(s.blendStrength).toFixed(2);
    }
    if(s.blendFrames !== undefined && $("blendFrames")){
      $("blendFrames").value = s.blendFrames;
      if($("blendFramesVal")) $("blendFramesVal").textContent = `${s.blendFrames}f`;
    }
    if(s.blendMode && $("blendMode")) $("blendMode").value = s.blendMode;
    if(typeof updateBlendControlsVisibility === "function") updateBlendControlsVisibility();
    if(s.rtxToggle !== undefined && $("rtxToggle")) $("rtxToggle").checked = s.rtxToggle;
    if(s.rtxQuality && $("rtxQuality")) $("rtxQuality").value = s.rtxQuality;
    if(s.rifeToggle !== undefined && $("rifeToggle")) $("rifeToggle").checked = s.rifeToggle;
    if(s.rifeEngine && $("rifeEngine")){
      $("rifeEngine").value = s.rifeEngine;
      const col = $("rifeModelCol");
      if(col) col.style.display = (s.rifeEngine === "rtx") ? "none" : "";
    }
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
    if(s.audioUserVolume !== undefined && $("audioUserVolume")){
      $("audioUserVolume").value = s.audioUserVolume;
      if($("audioUserVolumeVal")) $("audioUserVolumeVal").textContent = `${s.audioUserVolume} dB`;
    }
    if(s.audioNormalizeToggle !== undefined && $("audioNormalizeToggle")) $("audioNormalizeToggle").checked = s.audioNormalizeToggle;
    if(s.enhancerMode !== undefined && $("enhancerMode")) $("enhancerMode").value = s.enhancerMode;
    if(s.enhancerStyle !== undefined && $("enhancerStyle")) $("enhancerStyle").value = s.enhancerStyle;
    if(s.enhancerChainMode !== undefined && $("enhancerChainMode")) $("enhancerChainMode").value = s.enhancerChainMode;
    // enhancerModel se restaura tras cargar la lista de modelos (loadEnhancerModels).
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
    "prompt", "prompt2", "seg2PromptMode", "seg2OllamaModel", "durationSlider1", "durationSlider2", "aspectRatioSelect", "mpSlider", "stepsSlider",
    "seedVal", "batchSize", "filenamePrefix", "samplerName", "schedulerName",
    "unetModel", "clipModel", "vaeModel", "attentionBackend", "h3VideoBudget", "h3ShiftVideo", "h3ShiftAudio",
    "lora1Toggle", "lora1Select",
    "lora1Strength", "lora2Toggle", "lora2Select", "lora2Strength", "blendToggle", "blendStrength", "blendFrames", "blendMode",
    "rtxToggle", "rtxQuality", "rifeToggle", "rifeEngine", "rifeMultiplier", "rifeModel", "audioMode",
    "audioCrossfadeToggle", "audioCrossfadeSlider", "audioCrossfadeCurve",
    "audioGuideVolume", "audioUserVolume", "audioNormalizeToggle", "shareRefsToggle", "refImageSize",
    "enhancerModel", "enhancerMode", "enhancerStyle", "enhancerChainMode"
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

  function updateBlendControlsVisibility(){
    const on = !!$("blendToggle")?.checked;
    if($("blendControls")) $("blendControls").style.display = on ? "block" : "none";
  }
  // Exponer a top-level: applyWorkflow/restoreSettings la invocan con guard
  // typeof desde otro scope; sin esto la visibilidad del panel quedaba stale.
  window.updateBlendControlsVisibility = updateBlendControlsVisibility;

  $("blendToggle")?.addEventListener("change", updateBlendControlsVisibility);
  updateBlendControlsVisibility();

  $("rifeEngine")?.addEventListener("change", (e) => {
    const col = $("rifeModelCol");
    if(col) col.style.display = (e.target.value === "rtx") ? "none" : "";
  });

  $("blendStrength")?.addEventListener("input", (e) => {
    if($("blendStrengthVal")) $("blendStrengthVal").textContent = parseFloat(e.target.value).toFixed(2);
  });

  $("blendFrames")?.addEventListener("input", (e) => {
    if($("blendFramesVal")) $("blendFramesVal").textContent = `${e.target.value}f`;
  });

  $("audioCrossfadeSlider")?.addEventListener("input", (e) => {
    if($("audioCrossfadeVal")) $("audioCrossfadeVal").textContent = parseFloat(e.target.value).toFixed(2) + "s";
  });

  $("audioGuideVolume")?.addEventListener("input", (e) => {
    if($("audioGuideVolumeVal")) $("audioGuideVolumeVal").textContent = `${e.target.value} dB`;
  });
  $("audioUserVolume")?.addEventListener("input", (e) => {
    if($("audioUserVolumeVal")) $("audioUserVolumeVal").textContent = `${e.target.value} dB`;
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
      hybrid: "Audio IA puro en Seg 1 y Seg 2; en el vídeo final se mezcla con tu pista (niveles independientes).",
    };
    hint.textContent = mode === "hybrid"
      ? `Híbrido: Seg 1/Seg 2 = audio IA ajustado; Final = IA + tu pista a ${$("audioUserVolume")?.value ?? "-12"} dB + IA a ${$("audioGuideVolume")?.value ?? "-6"} dB.`
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
  if(slotIdx === 1 && typeof updateCalculatedResolution === "function") updateCalculatedResolution(1280, 720);
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
        if($("audioNormalizeToggle")?.checked) fd.append("normalize", "true");
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
  const arSelect = $("aspectRatioSelect")?.value || "auto";
  let ar;
  if(arSelect === "16:9") ar = 16 / 9;
  else if(arSelect === "9:16") ar = 9 / 16;
  else if(arSelect === "1:1") ar = 1.0;
  else if(arSelect === "4:3") ar = 4 / 3;
  else if(arSelect === "3:4") ar = 3 / 4;
  else if(arSelect === "21:9") ar = 21 / 9;
  else ar = (origW && origH) ? (origW / origH) : (16 / 9);

  const targetPixels = mp * 1000000;
  let h = Math.round(Math.sqrt(targetPixels / ar) / 32) * 32;
  let w = Math.round((h * ar) / 32) * 32;
  w = Math.max(256, w);
  h = Math.max(256, h);

  if($("width")) $("width").value = w;
  if($("height")) $("height").value = h;
  if($("arDetectHint")){
    const label = arSelect === "auto" ? (origW && origH ? "Auto " : "16:9 ") : `${arSelect} `;
    $("arDetectHint").textContent = `(${label}${ar.toFixed(2)}:1 · ${w}x${h})`;
  }
}

function calcFramesForDuration(dur){
  let f = Math.max(5, Math.round(dur * 24));
  while(f % 17 !== 5){
    f++;
  }
  return f;
}

function updateDurationFrames(){
  const dur1 = parseFloat($("durationSlider1")?.value || "15.0");
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
    seg1 = [has(1) ? "Img1" : null, has(2) ? "Img2" : null].filter(Boolean);
    seg2 = ["1er frame Seg 1", has(3) ? "Img3" : null, has(4) ? "Img4" : null].filter(Boolean);
  } else {
    seg1 = [has(1) ? "Img1" : null, has(2) ? "Img2" : null, has(3) ? "Img3" : null, has(4) ? "Img4" : null].filter(Boolean);
    seg2 = ["1er frame Seg 1", has(2) ? "Img2" : null, has(3) ? "Img3" : null, has(4) ? "Img4" : null].filter(Boolean);
  }
  const num = (arr) => arr.length ? arr.map((n, i) => `P${i + 1}=${n}`).join(" · ") : "T2V puro (sin refs)";
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
    p2Text = `${base}${g["59"].inputs.delimiter || "\n"}${guide}`;
  }
  ta1.value = String(p1Text).trim();
  ta2.value = String(p2Text).trim();
  if(hint){
    const mode = $("seg2PromptMode")?.value || "direct";
    hint.innerHTML = mode === "ollama"
      ? `<span style="color:var(--accent);font-weight:600;">⏳ Seg 2 en modo Asistido:</span> Mostrando el borrador de entrada enviado al backend. En cuanto Ollama analice los frames de Seg 1 en ComfyUI, este campo se actualizará automáticamente con el prompt definitivo generado.`
      : "Texto exacto que entra en el condicionamiento de cada segmento.";
  }
}

// Sanitizador global de seguridad: elimina del grafo cualquier nodo LoadImage, LoadAudio o LoadVideo
// que tenga una ruta vacía o inválida, desconectando sus enlaces dependientes para evitar IsADirectoryError en ComfyUI.
function sanitizeGraph(g){
  if(!g || typeof g !== "object") return g;
  for(const nid of Object.keys(g)){
    const node = g[nid];
    if(!node || !node.class_type || !node.inputs) continue;
    let removeNode = false;
    if(node.class_type === "LoadImage"){
      if(!node.inputs.image || typeof node.inputs.image !== "string" || node.inputs.image.trim() === ""){
        removeNode = true;
      }
    } else if(node.class_type === "LoadAudio"){
      if(!node.inputs.audio || typeof node.inputs.audio !== "string" || node.inputs.audio.trim() === ""){
        removeNode = true;
      }
    } else if(node.class_type === "LoadVideo" || node.class_type === "VHS_LoadVideo"){
      const f = node.inputs.file || node.inputs.video;
      if(!f || typeof f !== "string" || f.trim() === ""){
        removeNode = true;
      }
    }
    if(removeNode){
      for(const otherId of Object.keys(g)){
        const otherInputs = g[otherId]?.inputs;
        if(!otherInputs) continue;
        for(const k of Object.keys(otherInputs)){
          if(Array.isArray(otherInputs[k]) && otherInputs[k][0] === nid){
            delete otherInputs[k];
          }
        }
      }
      delete g[nid];
    }
  }
  return g;
}

// ==========================================
// CONSTRUCCIÓN DEL GRAFO (buildGraph)
// ==========================================
function buildGraph(j){
  const g = JSON.parse(JSON.stringify(BASE_GRAPH));

  // Instantánea de medios (inmunidad a cambios en UI durante el render)
  const mSlots = j?.mediaSlotsSnapshot || {
    1: mediaSlots[1]?.uploaded ? { ...mediaSlots[1].uploaded } : (mediaSlots[1]?.name ? { name: mediaSlots[1].name } : null),
    2: mediaSlots[2]?.uploaded ? { ...mediaSlots[2].uploaded } : (mediaSlots[2]?.name ? { name: mediaSlots[2].name } : null),
    3: mediaSlots[3]?.uploaded ? { ...mediaSlots[3].uploaded } : (mediaSlots[3]?.name ? { name: mediaSlots[3].name } : null),
    4: mediaSlots[4]?.uploaded ? { ...mediaSlots[4].uploaded } : (mediaSlots[4]?.name ? { name: mediaSlots[4].name } : null)
  };
  const aSlots = j?.audioSlotsSnapshot || {
    1: audioSlots[1]?.uploaded ? { ...audioSlots[1].uploaded } : (audioSlots[1]?.file ? { name: audioSlots[1].file.name } : null),
    2: audioSlots[2]?.uploaded ? { ...audioSlots[2].uploaded } : (audioSlots[2]?.file ? { name: audioSlots[2].file.name } : null)
  };
  const vSlot = j?.videoSlotSnapshot !== undefined ? (j.videoSlotSnapshot ? { uploaded: j.videoSlotSnapshot } : null) : videoSlot;

  const slotHasImg = (idx) => !!(mSlots[idx]?.name || mSlots[idx]?.uploaded?.name);
  const getSlotImgName = (idx) => mSlots[idx]?.name || mSlots[idx]?.uploaded?.name || "";

  // 1. Prompts
  const p1 = (j ? j.prompt : $("prompt")?.value) || "";
  const p2 = (j ? j.prompt2 : $("prompt2")?.value) || "";
  if(g[N.PROMPT_1]?.inputs) g[N.PROMPT_1].inputs.value = p1;
  if(g[N.PROMPT_2]?.inputs) g[N.PROMPT_2].inputs.value = p2;

  // Eliminar siempre nodos de interfaz ShowText (84 y 85) para evitar KeyError: 'nodes' en ComfyUI API
  delete g["84"];
  delete g["85"];

  const isFaceRefineOnly = !!(j && j.isFaceRefineOnly);
  const seg2Mode = $("seg2PromptMode")?.value || "direct";
  if(!isFaceRefineOnly && seg2Mode === "direct" && g[N.REF2V_SEG2]?.inputs){
    g[N.REF2V_SEG2].inputs.prompt = [N.PROMPT_2, 0];
    [N.OLLAMA_CONN, "52", N.OLLAMA_CHAT_1, N.OLLAMA_CHAT_2, "57", "59", "86"].forEach(id => { delete g[id]; });
  } else if(!isFaceRefineOnly && seg2Mode === "ollama" && g[N.OLLAMA_CONN]?.inputs){
    const ollamaModel = $("seg2OllamaModel")?.value || $("enhancerModel")?.value;
    if(ollamaModel){
      if(ollamaModel.startsWith("llamacpp:")){
        g[N.OLLAMA_CONN].inputs.url = "http://127.0.0.1:8080";
        g[N.OLLAMA_CONN].inputs.model = ollamaModel.replace(/^llamacpp:/, "");
      } else {
        g[N.OLLAMA_CONN].inputs.url = "http://127.0.0.1:11434";
        g[N.OLLAMA_CONN].inputs.model = ollamaModel.replace(/^ollama:/, "");
      }
    } else {
      log("Modo Asistido requiere un modelo en Ollama / llama.cpp. Se usa el del workflow.", "l-warn");
    }

    // Inyectar system prompts con estricta prioridad a la dirección del director para evitar inercia visual
    if(g[N.OLLAMA_CHAT_1]?.inputs){
      g[N.OLLAMA_CHAT_1].inputs.system = "You are a video continuation prompt writer for MiniMax H3. You receive the prompt of the first segment followed by a 'Next segment direction' instruction written by the director. CRITICAL DIRECTION PRIORITY: The director's 'Next segment direction' takes ABSOLUTE PRECEDENCE for the action of Segment 2. If the director commands an action transition, rotation, or change of movement (e.g. 'turns around', 'walks toward camera', 'stops', 'changes expression'), you MUST execute this transition immediately from the end of the previous segment. Keep the base scene (subject appearance, style, lighting, camera language, audio continuity) from the original prompt, but make the director's direction the main driver of the new action. Do not re-describe what is already visible. Output ONLY the continuation prompt, with no preamble, quotes or explanation.";
    }
    if(g[N.OLLAMA_CHAT_2]?.inputs){
      g[N.OLLAMA_CHAT_2].inputs.system = "You are a video continuation prompt writer for MiniMax H3. You are shown the last frames of the previous video segment and a draft continuation prompt driven by the director's action command. CRITICAL DIRECTION PRIORITY: The director's direction takes ABSOLUTE PRECEDENCE over visual inertia. If the director requested a turn, change of direction, stop, or new action, do NOT continue the old movement seen in the frames; instead, transition IMMEDIATELY from the subject's final pose into the new commanded action. Fuse the visual continuity (subject, environment, lighting, soundscape) with this NEW action into ONE final prompt for the next segment. Output ONLY the final fused prompt, with no preamble, quotes or explanation.";
    }

    // Inyectar nodo nativo SaveText para capturar y devolver el prompt final generado por Ollama
    g["99_savetext_prompt2"] = {
      inputs: {
        text: [N.OLLAMA_CHAT_2, 0],
        filename_prefix: "video/MiniMax_H3_prompt_seg2",
        format: "txt"
      },
      class_type: "SaveText",
      _meta: { title: "Save Prompt Seg 2 (Ollama)" }
    };
  } else {
    delete g["99_savetext_prompt2"];
  }

  // 2. Duración y Megapíxeles
  const dur1 = parseFloat((j ? (j.duration1 || j.duration) : ($("durationSlider1")?.value)) || "15.0");
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

  // 6. Modelos: UNet, CLIP y VAE Vídeo
  const unet = $("unetModel")?.value;
  if(unet && g[N.UNET]?.inputs) g[N.UNET].inputs.unet_name = unet;
  const clip = $("clipModel")?.value;
  if(clip && g[N.CLIP]?.inputs) g[N.CLIP].inputs.clip_name = clip;
  const vae = $("vaeModel")?.value;
  if(vae && g[N.VAE_VID]?.inputs) g[N.VAE_VID].inputs.vae_name = vae;

  // 7. Pipeline de Modelo Base & Optimizaciones H3
  const backendState = j?.attentionBackend || getAttentionBackendState();
  const h3opt = j?.h3opt || getH3OptState();

  // Backend denso (ModelAttentionBackend) - primero en la cadena
  if(g[N.ATTN]?.inputs){
    g[N.ATTN].inputs.attention = backendState.backend;
  }
  let currentModelNode = N.ATTN;

  // Helper para aplicar Spectrum envolviendo el modelo optimizado
  const spectrumState = j?.spectrum || getSpectrumState();
  const applySpectrumNode = (nodeId) => {
    if(spectrumState.enabled){
      if(!g[nodeId] || !g[nodeId].inputs){
        g[nodeId] = {
          class_type: "SpectrumApplyMiniMaxH3",
          inputs: {
            enabled: true, blend_weight: spectrumState.blend, degree: 1, ridge_lambda: 0.1,
            window_size: 2, flex_window: spectrumState.flex, warmup_steps: spectrumState.warmup,
            tail_actual_steps: 1, max_history: 8, debug: false,
            history_storage: spectrumState.historyStorage,
            bootstrap_first_forecast: spectrumState.bootstrapFirstForecast !== false,
            anchor_residual_feedback: false, selective_rollback_correction: false,
            offline_smoothing_replay: false, audio_blend_weight: 0,
            offline_archive_storage: "system_ram", model_aware_mode: "off",
            model_aware_risk_threshold: 0.65, model_aware_trust_shrinkage: false,
            model_aware_replay_generic_correction: false,
            generic_correction_mode: "coordinate_rls", generic_correction_limiter: "hard_clip",
            generic_correction_limit: 0.4, generic_correction_attenuation: "no_attenuation"
          },
          _meta: { title: "Spectrum Apply MiniMax H3" }
        };
      }
      g[nodeId].inputs.model = [currentModelNode, 0];
      g[nodeId].inputs.enabled = spectrumState.enabled;
      g[nodeId].inputs.blend_weight = spectrumState.blend;
      g[nodeId].inputs.flex_window = spectrumState.flex;
      g[nodeId].inputs.warmup_steps = spectrumState.warmup;
      g[nodeId].inputs.bootstrap_first_forecast = spectrumState.bootstrapFirstForecast !== false;
      g[nodeId].inputs.history_storage = spectrumState.historyStorage;
      g[nodeId].inputs.offline_smoothing_replay = false;
      currentModelNode = nodeId;
    } else if(g[nodeId]){
      delete g[nodeId];
    }
  };

  if(IS_BLOCKATT){
    // Modo BlockATT: cadena flexible UNet -> ModelAttentionBackend -> (optimizador) -> SigmaShift -> MemOpt?
    const optimizerState = j?.attentionOptimizer || getAttentionOptimizerState();
    const aimdoState = j?.aimdo || getAimdoState();

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
        video_budget: (typeof h3opt.videoBudget === "number") ? h3opt.videoBudget : 0.3,
        early_steps: h3opt.denserEarlyLate ? 8 : 0,
        early_kv: 0.6833,
        late_steps: 0,
        late_kv: 0.6833,
        backend: backend,
        early_schedule: "Ramp",
        video_token_order: "1x8x8"
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

    // Spectrum (tras MemOpt, para envolver el modelo optimizado)
    applySpectrumNode(N.SPECTRUM);
  } else {
    // Modo base: cadena fija del workflow original
    // UNet -> ModelAttentionBackend -> H3SparseAttention -> SigmaShift -> H3MemoryOptimization -> Spectrum
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

    // Spectrum (tras MemOpt, para envolver el modelo optimizado)
    applySpectrumNode(N.SPECTRUM);

    // Limpiar nodos de optimizadores avanzados no usados en modo base
    if(g[N.SPARSE_ATTN]) delete g[N.SPARSE_ATTN];
    if(g[N.BLOCK_SPARSE]) delete g[N.BLOCK_SPARSE];
    if(g[N.AIMDO]) delete g[N.AIMDO];
  }

  // Sol-H3 SOL Attention (Experimental) — kernel CuTe SM120 para Blackwell
  const solH3State = j ? j.solH3 : getSolH3State();
  if(solH3State && solH3State.enabled){
    g[N.SOL_H3] = {
      class_type: "SolH3Experimental",
      inputs: {
        model: [currentModelNode, 0],
        exact_fusion: solH3State.exact_fusion !== false,
        tau: (typeof solH3State.tau === "number") ? solH3State.tau : 1.0,
        dense_evaluations: (typeof solH3State.dense_evaluations === "number") ? solH3State.dense_evaluations : 1,
        dense_layers: (typeof solH3State.dense_layers === "number") ? solH3State.dense_layers : 2
      },
      _meta: { title: "Sol-H3 SOL Attention (Experimental)" }
    };
    currentModelNode = N.SOL_H3;
  } else {
    delete g[N.SOL_H3];
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

  // MODO ON-DEMAND: Interpolar frames del clip actual sin re-muestrear los dos segmentos principales
  if(j && j.isInterpolateOnly){
    const sourceMedia = j.sourceMedia || currentMedia[3];
    const videoFilePath = (sourceMedia && sourceMedia.subfolder ? sourceMedia.subfolder + "/" : "") + (sourceMedia ? sourceMedia.filename : "") + " [output]";

    // Eliminar todos los nodos de la generación estándar
    Object.keys(g).forEach(id => delete g[id]);

    const rifeState = j.rife || {
      engine: $("rifeEngine")?.value || "rife",
      multiplier: parseInt($("rifeMultiplier")?.value || "2", 10),
      model: $("rifeModel")?.value || "rife_v4.26.safetensors"
    };
    const mult = parseInt(rifeState.multiplier || "2", 10);

    g["100_load_video"] = {
      class_type: "LoadVideo",
      inputs: { file: videoFilePath },
      _meta: { title: "Load Video (Native)" }
    };
    g["101_get_components"] = {
      class_type: "GetVideoComponents",
      inputs: { video: ["100_load_video", 0] },
      _meta: { title: "Get Video Components (Native)" }
    };

    let interpImages = ["101_get_components", 0];
    if(rifeState.engine === "rtx"){
      g["102_rtx_fg"] = {
        class_type: "RTXVideoFrameGeneration",
        inputs: {
          images: interpImages,
          generation_type: "frame rate multiplier",
          "generation_type.multiplier": mult,
          mode: "HIGH",
          automatic_shot_change_detection: true,
          shot_change: false,
          image_encoding: "8-bit RGB"
        },
        _meta: { title: "RTX Video Frame Generation" }
      };
      interpImages = ["102_rtx_fg", 0];
    } else {
      g["102_rife_loader"] = {
        class_type: "FrameInterpolationModelLoader",
        inputs: { model_name: rifeState.model || "rife_v4.26.safetensors" },
        _meta: { title: "Frame Interpolation Model Loader" }
      };
      g["103_rife_interp"] = {
        class_type: "FrameInterpolate",
        inputs: {
          multiplier: mult,
          images: interpImages,
          interp_model: ["102_rife_loader", 0]
        },
        _meta: { title: "Frame Interpolate" }
      };
      interpImages = ["103_rife_interp", 0];
    }

    const prefix = ($("filenamePrefix")?.value || "video/MMH3X2").trim();
    g[N.CREATE_VID_FINAL] = {
      class_type: "CreateVideo",
      inputs: {
        fps: 24 * mult,
        bit_depth: ["101_get_components", 3],
        color_space: ["101_get_components", 4],
        images: interpImages,
        audio: ["101_get_components", 1]
      },
      _meta: { title: "Create Video Final (Interpolated)" }
    };
    g[N.SAVE_VID_FINAL] = {
      class_type: "SaveVideo",
      inputs: {
        filename_prefix: prefix + `_interpolated_${mult}x`,
        format: "auto",
        "format.codec": "auto",
        codec: "auto",
        video: [N.CREATE_VID_FINAL, 0]
      },
      _meta: { title: "Save Video Final (Interpolated)" }
    };
    return g;
  }

  // MODO ON-DEMAND: Refinar rostro del clip final sin re-muestrear los dos segmentos principales
  if(j && j.isFaceRefineOnly){
    const frState = j.faceRefine || getFaceRefineState();
    const frCanvasSize = frState.canvasSize || 512;
    const frSteps = frState.steps || 4;
    const sourceMedia = j.sourceMedia || currentMedia[3];
    const videoFilePath = (sourceMedia && sourceMedia.subfolder ? sourceMedia.subfolder + "/" : "") + (sourceMedia ? sourceMedia.filename : "") + " [output]";

    // Eliminar generación completa de Seg 1 y Seg 2 para ahorrar recursos
    const nodesToDelete = [
      N.IMG2, N.IMG3, N.IMG4,
      N.REF2V_SEG1, N.GUIDER_1, N.SCHEDULER_1, N.SAMPLE_1, N.DECODE_VID_1, N.DECODE_AUD_1, N.CREATE_VID_1, N.SAVE_VID_1,
      N.REF2V_SEG2, N.GUIDER_2, N.SAMPLER_2, N.SCHEDULER_2, N.SAMPLE_2, N.DECODE_VID_2, N.DECODE_AUD_2, N.CREATE_VID_2, N.SAVE_VID_2,
      N.IMAGE_BATCH, N.AUDIO_CONCAT, N.BLEND, N.INJECT_LATENT, N.ADD_GUIDE, N.SEED,
      "12_seg2", "13_seg2", "61", "64", "65", "25", "26", "27", "28", "29", "54", "57", "59",
      "51", "52", "53", "55", "86", "77", "78", "79", "12", "13", "75", "76", "11",
      "99_savetext_prompt2", "84", "85", N.OLLAMA_CONN, N.OLLAMA_CHAT_1, N.OLLAMA_CHAT_2,
      "190_load_audio1", "191_load_audio2", "192_trim_final_audio", "193_trim_audio1", "194_trim_audio2",
      "195_concat_direct_audio", "198_ia_boost_seg1", "198_ia_vol_seg1", "199_ia_trim_seg1",
      "199_ia_boost_seg2", "199_ia_vol_seg2", "199_ia_trim_seg2", "199_ia_boost_final", "199_user_vol_final",
      "199_ia_vol_final", "199_merge_final"
    ];
    nodesToDelete.forEach(id => { delete g[id]; });

    // Carga y demux nativos de ComfyUI (cero dependencias externas)
    g[N.FACE_LOAD_VIDEO] = {
      class_type: "LoadVideo",
      inputs: { file: videoFilePath },
      _meta: { title: "Load Video (Native)" }
    };
    g[N.FACE_COMPONENTS] = {
      class_type: "GetVideoComponents",
      inputs: { video: [N.FACE_LOAD_VIDEO, 0] },
      _meta: { title: "Get Video Components (Native)" }
    };

    const frTarget = frState.target || "face";
    const isCombo = (frTarget === "face_hands");
    const rawSelect = frState.select || "largest_face";
    const isDual = (rawSelect === "dual_faces") || isCombo;

    const elemCfg1 = ELEMENT_REFINE_CONFIG[isCombo ? "face" : frTarget] || ELEMENT_REFINE_CONFIG.face;
    const elemCfg2 = isCombo ? ELEMENT_REFINE_CONFIG.hands : elemCfg1;

    let pass1Select = "largest_face";
    let pass1Index = 0;
    if(rawSelect === "second_face"){
      pass1Select = "largest_face";
      pass1Index = 1;
    } else if(rawSelect === "centre_most" || rawSelect === "left_most" || rawSelect === "right_most"){
      pass1Select = rawSelect;
      pass1Index = 0;
    }

    const pass2Select = "largest_face";
    const pass2Index = isCombo ? 0 : 1;

    const pass2NodeIds = [
      N.FACE_CROP_2, N.FACE_REF2V_2, N.FACE_INJECT_2, N.FACE_PERFRAME_DENOISE_2,
      N.FACE_SCHEDULER_2, N.FACE_GUIDER_2, N.FACE_NOISE_2, N.FACE_SAMPLER_2,
      N.FACE_DECODE_2, N.FACE_STITCH_2
    ];

    // Sub-grafo FaceRefine — Pasada 1
    g[N.FACE_CROP] = {
      class_type: "H3FaceTrackCrop",
      inputs: {
        images: [N.FACE_COMPONENTS, 0],
        detector: elemCfg1.detector,
        confidence: 0.35,
        crop_factor: elemCfg1.cropFactor,
        canvas_width: frCanvasSize,
        canvas_height: frCanvasSize,
        canvas_mode: frCanvasSize >= 768 ? "auto_capped_768" : "auto",
        smooth_window: 21,
        size_smooth_window: 51,
        smooth_method: "gaussian",
        size_mode: "per_frame",
        identity_track: false,
        identity_threshold: 0.28,
        select: pass1Select,
        fallback_detector: "none",
        fallback_head_frac: 0.5,
        select_index: pass1Index,
        identity_model: "insightface",
        cut_detection: "none",
        cut_threshold: 3.0,
        absent_shots: "off",
        X: 0,
        Y: 0,
        frame_index: 0
      },
      _meta: { title: isCombo ? "Face Track Crop" : "Element Track Crop" }
    };

    const baseP = p1 || "";
    const frPrompt1 = baseP ? `${baseP}, ${elemCfg1.prompt}` : elemCfg1.prompt;
    const frPrompt2 = baseP ? `${baseP}, ${elemCfg2.prompt}` : elemCfg2.prompt;
    const frRef2vInputs = {
      clip: [N.CLIP, 0],
      vae: [N.VAE_VID, 0],
      audio_vae: [N.VAE_AUD, 0],
      prompt: frPrompt1,
      width: [N.FACE_CROP, 4],
      height: [N.FACE_CROP, 5],
      length: [N.FACE_CROP, 6],
      ref_image_size: "match",
      "ref_audios.ref_audio_0": [N.FACE_COMPONENTS, 1]
    };
    if(slotHasImg(1) && g[N.IMG1]?.inputs){
      g[N.IMG1].inputs.image = getSlotImgName(1);
      frRef2vInputs["ref_images.ref_image_0"] = [N.IMG1, 0];
    } else {
      if(g[N.IMG1]) delete g[N.IMG1];
    }
    g[N.FACE_REF2V] = {
      class_type: "MiniMaxH3ReferenceToVideo",
      inputs: frRef2vInputs,
      _meta: { title: "Face Conditioning & AV Latent" }
    };

    g[N.FACE_INJECT] = {
      class_type: "H3InjectVideoLatent",
      inputs: {
        av_latent: [N.FACE_REF2V, 1],
        images: [N.FACE_CROP, 0],
        vae: [N.VAE_VID, 0]
      },
      _meta: { title: "Inject Face Video Latent" }
    };

    g[N.FACE_PERFRAME_DENOISE] = {
      class_type: "H3PerFrameDenoise",
      inputs: {
        model: [currentModelNode, 0],
        av_latent: [N.FACE_INJECT, 0],
        transform: [N.FACE_CROP, 1],
        denoise_multiplier_small_face: 1.0,
        denoise_multiplier_large_face: frState.denoise || 0.35,
        scale_mode: "absolute_px",
        face_px_small: 30.0,
        face_px_large: 120.0,
        gamma: 1.0,
        smooth_frames: 9
      },
      _meta: { title: "Per-Frame Face Denoise" }
    };

    g[N.FACE_SCHEDULER] = {
      class_type: "BasicScheduler",
      inputs: {
        model: [N.FACE_PERFRAME_DENOISE, 2],
        scheduler: "simple",
        steps: frSteps,
        denoise: frState.denoise || 0.35
      },
      _meta: { title: "Face Basic Scheduler" }
    };

    g[N.FACE_GUIDER] = {
      class_type: "BasicGuider",
      inputs: {
        model: [N.FACE_PERFRAME_DENOISE, 2],
        conditioning: [N.FACE_REF2V, 0]
      },
      _meta: { title: "Face Guider" }
    };

    g[N.FACE_NOISE] = {
      class_type: "RandomNoise",
      inputs: {
        noise_seed: (j && j.seed) ? j.seed : Math.floor(Math.random() * 100000000)
      },
      _meta: { title: "Face Noise" }
    };

    const frSamplerName = (j ? j.sampler : $("samplerName")?.value) || "res_multistep";
    g[N.FACE_SAMPLER_SELECT] = {
      class_type: "KSamplerSelect",
      inputs: {
        sampler_name: frSamplerName
      },
      _meta: { title: "Face Sampler Select" }
    };

    g[N.FACE_SAMPLER] = {
      class_type: "SamplerCustomAdvanced",
      inputs: {
        noise: [N.FACE_NOISE, 0],
        guider: [N.FACE_GUIDER, 0],
        sampler: [N.FACE_SAMPLER_SELECT, 0],
        sigmas: [N.FACE_SCHEDULER, 0],
        latent_image: [N.FACE_PERFRAME_DENOISE, 0]
      },
      _meta: { title: "Sample Face Latent" }
    };

    g[N.FACE_DECODE] = {
      class_type: "VAEDecode",
      inputs: {
        samples: [N.FACE_SAMPLER, 0],
        vae: [N.VAE_VID, 0]
      },
      _meta: { title: "Decode Face Crops" }
    };

    g[N.FACE_STITCH] = {
      class_type: "H3FaceStitch",
      inputs: {
        base_images: [N.FACE_COMPONENTS, 0],
        refined_crops: [N.FACE_DECODE, 0],
        transform: [N.FACE_CROP, 1],
        paste_region: "face_only",
        mask_dilation: 16,
        feather: frState.feather || 16,
        colour_match: 1.0,
        blend: 1.0,
        undetected_frames: "fade_out",
        feather_scales_with_crop: false
      },
      _meta: { title: "Stitch Face" }
    };

    let faceFinalImages = [N.FACE_STITCH, 0];

    // Sub-grafo FaceRefine — Pasada 2 (Dual / Combo)
    if(isDual){
      g[N.FACE_CROP_2] = {
        class_type: "H3FaceTrackCrop",
        inputs: {
          images: [N.FACE_STITCH, 0],
          detector: elemCfg2.detector,
          confidence: 0.35,
          crop_factor: elemCfg2.cropFactor,
          canvas_width: frCanvasSize,
          canvas_height: frCanvasSize,
          canvas_mode: frCanvasSize >= 768 ? "auto_capped_768" : "auto",
          smooth_window: 21,
          size_smooth_window: 51,
          smooth_method: "gaussian",
          size_mode: "per_frame",
          identity_track: false,
          identity_threshold: 0.28,
          select: pass2Select,
          fallback_detector: "none",
          fallback_head_frac: 0.5,
          select_index: pass2Index,
          identity_model: "insightface",
          cut_detection: "none",
          cut_threshold: 3.0,
          absent_shots: "off",
          X: 0,
          Y: 0,
          frame_index: 0
        },
        _meta: { title: isCombo ? "Hand Track Crop 2" : "Element Track Crop 2" }
      };

      const frRef2vInputs2 = {
        clip: [N.CLIP, 0],
        vae: [N.VAE_VID, 0],
        audio_vae: [N.VAE_AUD, 0],
        prompt: frPrompt2,
        width: [N.FACE_CROP_2, 4],
        height: [N.FACE_CROP_2, 5],
        length: [N.FACE_CROP_2, 6],
        ref_image_size: "match",
        "ref_audios.ref_audio_0": [N.FACE_COMPONENTS, 1]
      };
      if(slotHasImg(1) && g[N.IMG1]?.inputs){
        frRef2vInputs2["ref_images.ref_image_0"] = [N.IMG1, 0];
      }
      g[N.FACE_REF2V_2] = {
        class_type: "MiniMaxH3ReferenceToVideo",
        inputs: frRef2vInputs2,
        _meta: { title: "Face Conditioning 2 & AV Latent" }
      };

      g[N.FACE_INJECT_2] = {
        class_type: "H3InjectVideoLatent",
        inputs: {
          av_latent: [N.FACE_REF2V_2, 1],
          images: [N.FACE_CROP_2, 0],
          vae: [N.VAE_VID, 0]
        },
        _meta: { title: "Inject Face Video Latent 2" }
      };

      g[N.FACE_PERFRAME_DENOISE_2] = {
        class_type: "H3PerFrameDenoise",
        inputs: {
          model: [currentModelNode, 0],
          av_latent: [N.FACE_INJECT_2, 0],
          transform: [N.FACE_CROP_2, 1],
          denoise_multiplier_small_face: 1.0,
          denoise_multiplier_large_face: frState.denoise || 0.35,
          scale_mode: "absolute_px",
          face_px_small: 30.0,
          face_px_large: 120.0,
          gamma: 1.0,
          smooth_frames: 9
        },
        _meta: { title: "Per-Frame Face Denoise 2" }
      };

      g[N.FACE_SCHEDULER_2] = {
        class_type: "BasicScheduler",
        inputs: {
          model: [N.FACE_PERFRAME_DENOISE_2, 2],
          scheduler: "simple",
          steps: frSteps,
          denoise: frState.denoise || 0.35
        },
        _meta: { title: "Face Basic Scheduler 2" }
      };

      g[N.FACE_GUIDER_2] = {
        class_type: "BasicGuider",
        inputs: {
          model: [N.FACE_PERFRAME_DENOISE_2, 2],
          conditioning: [N.FACE_REF2V_2, 0]
        },
        _meta: { title: "Face Guider 2" }
      };

      g[N.FACE_NOISE_2] = {
        class_type: "RandomNoise",
        inputs: {
          noise_seed: ((j && j.seed) ? j.seed + 1 : Math.floor(Math.random() * 100000000))
        },
        _meta: { title: "Face Noise 2" }
      };

      g[N.FACE_SAMPLER_2] = {
        class_type: "SamplerCustomAdvanced",
        inputs: {
          noise: [N.FACE_NOISE_2, 0],
          guider: [N.FACE_GUIDER_2, 0],
          sampler: [N.FACE_SAMPLER_SELECT, 0],
          sigmas: [N.FACE_SCHEDULER_2, 0],
          latent_image: [N.FACE_PERFRAME_DENOISE_2, 0]
        },
        _meta: { title: "Sample Face Latent 2" }
      };

      g[N.FACE_DECODE_2] = {
        class_type: "VAEDecode",
        inputs: {
          samples: [N.FACE_SAMPLER_2, 0],
          vae: [N.VAE_VID, 0]
        },
        _meta: { title: "Decode Face Crops 2" }
      };

      g[N.FACE_STITCH_2] = {
        class_type: "H3FaceStitch",
        inputs: {
          base_images: [N.FACE_STITCH, 0],
          refined_crops: [N.FACE_DECODE_2, 0],
          transform: [N.FACE_CROP_2, 1],
          paste_region: "face_only",
          mask_dilation: 16,
          feather: frState.feather || 16,
          colour_match: 1.0,
          blend: 1.0,
          undetected_frames: "fade_out",
          feather_scales_with_crop: false
        },
        _meta: { title: "Stitch Face 2" }
      };

      faceFinalImages = [N.FACE_STITCH_2, 0];
    } else {
      pass2NodeIds.forEach(id => { delete g[id]; });
    }
    const frPostproc = frState.postproc !== undefined ? frState.postproc : false;
    const rtxOn = frPostproc && ($("rtxToggle") ? $("rtxToggle").checked : false);
    const rifeOn = frPostproc && ($("rifeToggle") ? $("rifeToggle").checked : false);

    if(rtxOn && g[N.RTX]?.inputs){
      g[N.RTX].inputs.images = faceFinalImages;
      faceFinalImages = [N.RTX, 0];
    } else {
      delete g[N.RTX];
    }

    if(rifeOn && g[N.RIFE]?.inputs){
      const mult = parseInt($("rifeMultiplier")?.value || "2", 10);
      if(g[N.RIFE_MULT]?.inputs) g[N.RIFE_MULT].inputs.value = mult;
      const rifeModel = $("rifeModel")?.value || "rife_v4.26.safetensors";
      if(g[N.RIFE_LOADER]?.inputs) g[N.RIFE_LOADER].inputs.model_name = rifeModel;
      g[N.RIFE].inputs.images = faceFinalImages;
      faceFinalImages = [N.RIFE, 0];
    } else {
      delete g[N.RIFE];
      delete g[N.RIFE_LOADER];
      delete g[N.RIFE_MULT];
    }

    const prefix = ($("filenamePrefix")?.value || "video/MiniMax_H3").trim();
    g[N.CREATE_VID_FINAL] = {
      class_type: "CreateVideo",
      inputs: {
        fps: [N.FACE_COMPONENTS, 2],
        bit_depth: [N.FACE_COMPONENTS, 3],
        color_space: [N.FACE_COMPONENTS, 4],
        images: faceFinalImages,
        audio: [N.FACE_COMPONENTS, 1]
      },
      _meta: { title: "Create Video Final (Face Refined)" }
    };
    g[N.SAVE_VID_FINAL] = {
      class_type: "SaveVideo",
      inputs: {
        filename_prefix: prefix + "_facerefined",
        format: "auto",
        "format.codec": "auto",
        codec: "auto",
        video: [N.CREATE_VID_FINAL, 0]
      },
      _meta: { title: "Save Video Final (Face Refined)" }
    };

    return sanitizeGraph(g);
  }

  // Conectar el modelo resultante a Guiders y Schedulers
  if(g[N.GUIDER_1]?.inputs) g[N.GUIDER_1].inputs.model = [currentModelNode, 0];
  if(g[N.SCHEDULER_1]?.inputs) g[N.SCHEDULER_1].inputs.model = [currentModelNode, 0];
  if(g[N.GUIDER_2]?.inputs) g[N.GUIDER_2].inputs.model = [currentModelNode, 0];
  if(g[N.SCHEDULER_2]?.inputs) g[N.SCHEDULER_2].inputs.model = [currentModelNode, 0];

  // 10. Conexión dinámica y limpia de Imágenes de Entrada (Slots 1..4)
  // Limpiar referencias previas de imágenes en ambos segmentos para evitar entradas fantasma
  if(g[N.REF2V_SEG1]?.inputs){
    for(let i = 0; i < 8; i++) delete g[N.REF2V_SEG1].inputs[`ref_images.ref_image_${i}`];
  }
  if(g[N.REF2V_SEG2]?.inputs){
    for(let i = 0; i < 8; i++) delete g[N.REF2V_SEG2].inputs[`ref_images.ref_image_${i}`];
  }

  const usedSlots = new Set();

  // Slot 1 (primer frame de inicio)
  if(slotHasImg(1) && g[N.IMG1]?.inputs){
    g[N.IMG1].inputs.image = getSlotImgName(1);
    if(g[N.REF2V_SEG1]?.inputs) g[N.REF2V_SEG1].inputs["ref_images.ref_image_0"] = [N.IMG1, 0];
    usedSlots.add(1);
  } else {
    if(g[N.REF2V_SEG1]?.inputs && g[N.REF2V_SEG1].inputs["ref_images.ref_image_0"] && g[N.REF2V_SEG1].inputs["ref_images.ref_image_0"][0] === N.IMG1){
      delete g[N.REF2V_SEG1].inputs["ref_images.ref_image_0"];
    }
    if(g[N.IMG1]) delete g[N.IMG1];
  }

  // 10b. Referencias compartidas + tamaño de referencias (match/max)
  const sharedRefs = (j ? (j.sharedRefs !== undefined ? j.sharedRefs : false)
    : !!$("shareRefsToggle")?.checked);
  const refSize = (j ? (j.refImageSize || "match") : ($("refImageSize")?.value || "match"));
  if(g[N.REF2V_SEG1]?.inputs) g[N.REF2V_SEG1].inputs.ref_image_size = refSize;
  if(g[N.REF2V_SEG2]?.inputs) g[N.REF2V_SEG2].inputs.ref_image_size = refSize;

  if(!sharedRefs){
    // Modo estándar / NO compartido:
    // Seg 1 ve: Img1 (ref_image_0), e Img2 (ref_image_1) si se ha subido
    let seg1Idx = slotHasImg(1) ? 1 : 0;
    if(slotHasImg(2)){
      if(g[N.IMG2]?.inputs) g[N.IMG2].inputs.image = getSlotImgName(2);
      if(g[N.REF2V_SEG1]?.inputs) g[N.REF2V_SEG1].inputs[`ref_images.ref_image_${seg1Idx++}`] = [N.IMG2, 0];
      usedSlots.add(2);
    }
    // Seg 2 ve: Last frame de Seg 1 (ref_image_0), e Img3 / Img4 si se han subido
    let seg2Idx = 0;
    if(g[N.REF2V_SEG2]?.inputs){
      g[N.REF2V_SEG2].inputs[`ref_images.ref_image_${seg2Idx++}`] = [N.LAST_FRAME, 0];
    }
    if(slotHasImg(3)){
      if(g[N.IMG3]?.inputs) g[N.IMG3].inputs.image = getSlotImgName(3);
      if(g[N.REF2V_SEG2]?.inputs) g[N.REF2V_SEG2].inputs[`ref_images.ref_image_${seg2Idx++}`] = [N.IMG3, 0];
      usedSlots.add(3);
    }
    if(slotHasImg(4)){
      if(g[N.IMG4]?.inputs) g[N.IMG4].inputs.image = getSlotImgName(4);
      if(g[N.REF2V_SEG2]?.inputs) g[N.REF2V_SEG2].inputs[`ref_images.ref_image_${seg2Idx++}`] = [N.IMG4, 0];
      usedSlots.add(4);
    }
  } else {
    // Modo Compartido:
    // Seg 1 ve: Img1 (0) + todos los slots 2, 3, 4 que tengan imagen subida
    let seg1Idx = slotHasImg(1) ? 1 : 0;
    const nodeMap = { 2: N.IMG2, 3: N.IMG3, 4: N.IMG4 };
    [2, 3, 4].forEach(s => {
      if(slotHasImg(s)){
        const nid = nodeMap[s];
        if(g[nid]?.inputs) g[nid].inputs.image = getSlotImgName(s);
        if(g[N.REF2V_SEG1]?.inputs) g[N.REF2V_SEG1].inputs[`ref_images.ref_image_${seg1Idx++}`] = [nid, 0];
        usedSlots.add(s);
      }
    });
    // Seg 2 ve: Last frame (0) + todos los slots 2, 3, 4 que tengan imagen subida
    let seg2Idx = 0;
    if(g[N.REF2V_SEG2]?.inputs){
      g[N.REF2V_SEG2].inputs[`ref_images.ref_image_${seg2Idx++}`] = [N.LAST_FRAME, 0];
    }
    [2, 3, 4].forEach(s => {
      if(slotHasImg(s)){
        const nid = nodeMap[s];
        if(g[nid]?.inputs) g[nid].inputs.image = getSlotImgName(s);
        if(g[N.REF2V_SEG2]?.inputs) g[N.REF2V_SEG2].inputs[`ref_images.ref_image_${seg2Idx++}`] = [nid, 0];
        usedSlots.add(s);
      }
    });
  }

  // Pruning: eliminar del grafo los nodos LoadImage que no se hayan subido o no se usen
  if(!usedSlots.has(1) && g[N.IMG1]) delete g[N.IMG1];
  if(!usedSlots.has(2) && g[N.IMG2]) delete g[N.IMG2];
  if(!usedSlots.has(3) && g[N.IMG3]) delete g[N.IMG3];
  if(!usedSlots.has(4) && g[N.IMG4]) delete g[N.IMG4];

  // Si Slot 1 no tiene imagen (T2V) o el usuario fuerza un Aspect Ratio específico,
  // asignamos width/height numéricos a los nodos MiniMax H3 y eliminamos los nodos 77 y 78
  // para evitar NodeNotFoundError cuando falta el nodo 10 (LoadImage 1).
  const arSelect = (j ? j.aspectRatio : $("aspectRatioSelect")?.value) || "auto";
  if(!usedSlots.has(1) || arSelect !== "auto"){
    const w = parseInt((j ? j.width : $("width")?.value) || "1152", 10);
    const h = parseInt((j ? j.height : $("height")?.value) || "640", 10);
    if(g[N.REF2V_SEG1]?.inputs){
      g[N.REF2V_SEG1].inputs.width = w;
      g[N.REF2V_SEG1].inputs.height = h;
    }
    if(g[N.REF2V_SEG2]?.inputs){
      g[N.REF2V_SEG2].inputs.width = w;
      g[N.REF2V_SEG2].inputs.height = h;
    }
    if(g[N.MEGAPIXELS]) delete g[N.MEGAPIXELS];
    if(g[N.GET_SIZE]) delete g[N.GET_SIZE];
  }

  // 11. Vídeo de Referencia para Seg 2
  const vUp = vSlot?.uploaded || vSlot;
  if(vUp && vUp.name && g[N.REF2V_SEG2]?.inputs){
    g["195_user_vid"] = {
      class_type: "VHS_LoadVideo",
      inputs: { video: vUp.name, force_rate: 0, force_size: "Disabled", custom_width: 512, custom_height: 512, frame_load_cap: 0, skip_first_frames: 0, select_every_nth: 1 },
      _meta: { title: "Vídeo Ref Usuario" }
    };
    if(g[N.REF2V_SEG2].inputs['ref_videos.ref_video_0']){
      g[N.REF2V_SEG2].inputs['ref_videos.ref_video_0'] = ["195_user_vid", 0];
    }
  } else {
    if(g["195_user_vid"]) delete g["195_user_vid"];
    if(g[N.REF2V_SEG2]?.inputs && g[N.REF2V_SEG2].inputs['ref_videos.ref_video_0'] && g[N.REF2V_SEG2].inputs['ref_videos.ref_video_0'][0] === "195_user_vid"){
      delete g[N.REF2V_SEG2].inputs['ref_videos.ref_video_0'];
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
    if(!slot) return null;
    const up = slot.uploaded || slot;
    if(up && up.name){
      if(up.subfolder) return `${up.subfolder}/${up.name}`;
      return up.name;
    }
    return slot.file ? slot.file.name : null;
  };
  const a1 = audioPath(aSlots[1]);
  const a2 = audioPath(aSlots[2]);
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
    const guideGainDb = parseInt($("audioGuideVolume")?.value ?? "-6", 10);
    const userGainDb = parseInt($("audioUserVolume")?.value ?? "-12", 10);
    if(audioMode === "hybrid"){
      // --- Híbrido: mezcla global solo en el vídeo final ---
      // Los segmentos (22/38) llevan audio IA puro ajustado por el slider.
      // El final (42) mezcla la pista de usuario con el concat IA ya crossfadeado.
      const IA_BOOST_DB = 6;
      if(a1 && g[N.CREATE_VID_1]?.inputs && g[N.DECODE_AUD_1] && g[N.DECODE_AUD_1] in g){
        const seg1Dur = parseFloat(((calcFramesForDuration(dur1) - 1) / 24).toFixed(4));
        const seg1TrimH = (audioCrossfadeOn && cfSec > 0) ? parseFloat((seg1Dur + cfSec).toFixed(4)) : seg1Dur;
        g["198_ia_boost_seg1"] = {
          inputs: { audio: [N.DECODE_AUD_1, 0], volume: IA_BOOST_DB },
          class_type: "AudioAdjustVolume",
          _meta: { title: "Híbrido: boost IA Seg 1 (+6 dB)" }
        };
        g["198_ia_vol_seg1"] = {
          inputs: { audio: ["198_ia_boost_seg1", 0], volume: guideGainDb },
          class_type: "AudioAdjustVolume",
          _meta: { title: `Híbrido: IA Seg 1 a ${guideGainDb} dB` }
        };
        g["199_ia_trim_seg1"] = {
          inputs: { audio: ["198_ia_vol_seg1", 0], start_index: 0.0, duration: seg1TrimH },
          class_type: "TrimAudioDuration",
          _meta: { title: "Híbrido: IA Seg 1 recortada" }
        };
        // El audio de Seg 1 es IA pura (con ajuste de volumen); la mezcla con la pista se hace en el final.
        g[N.CREATE_VID_1].inputs.audio = ["199_ia_trim_seg1", 0];
      }
      if(g[N.CREATE_VID_2]?.inputs && g[N.DECODE_AUD_2] && g[N.DECODE_AUD_2] in g){
        const seg2Dur = parseFloat((calcFramesForDuration(dur2) / 24).toFixed(4));
        g["199_ia_boost_seg2"] = {
          inputs: { audio: [N.DECODE_AUD_2, 0], volume: IA_BOOST_DB },
          class_type: "AudioAdjustVolume",
          _meta: { title: "Híbrido: boost IA Seg 2 (+6 dB)" }
        };
        g["199_ia_vol_seg2"] = {
          inputs: { audio: ["199_ia_boost_seg2", 0], volume: guideGainDb },
          class_type: "AudioAdjustVolume",
          _meta: { title: `Híbrido: IA Seg 2 a ${guideGainDb} dB` }
        };
        g["199_ia_trim_seg2"] = {
          inputs: { audio: ["199_ia_vol_seg2", 0], start_index: 0.0, duration: seg2Dur },
          class_type: "TrimAudioDuration",
          _meta: { title: "Híbrido: IA Seg 2 recortada" }
        };
        g[N.CREATE_VID_2].inputs.audio = ["199_ia_trim_seg2", 0];
      }
      // Final: concat IA (41, ya con crossfade IA) + pista usuario global (192)
      if(g[N.CREATE_VID_FINAL]?.inputs && g[N.AUDIO_CONCAT] && g[N.AUDIO_CONCAT] in g){
        const IA_BOOST_DB = 6;
        g["199_ia_boost_final"] = {
          inputs: { audio: [N.AUDIO_CONCAT, 0], volume: IA_BOOST_DB },
          class_type: "AudioAdjustVolume",
          _meta: { title: "Híbrido: boost IA global (+6 dB)" }
        };
        if(a1 && !a2){
          // La pista global ya está recortada en 192 (ver bloque C abajo).
          // Aplicamos el volumen de usuario antes de mezclar.
          g["199_user_vol_final"] = {
            inputs: { audio: ["192_trim_final_audio", 0], volume: userGainDb },
            class_type: "AudioAdjustVolume",
            _meta: { title: `Híbrido: pista global a ${userGainDb} dB` }
          };
          g["199_ia_vol_final"] = {
            inputs: { audio: ["199_ia_boost_final", 0], volume: guideGainDb },
            class_type: "AudioAdjustVolume",
            _meta: { title: `Híbrido: IA global a ${guideGainDb} dB` }
          };
          g["199_merge_final"] = {
            inputs: { audio1: ["199_user_vol_final", 0], audio2: ["199_ia_vol_final", 0], merge_method: "add" },
            class_type: "AudioMerge",
            _meta: { title: "Híbrido: mezcla IA + pista (Final)" }
          };
          g[N.CREATE_VID_FINAL].inputs.audio = ["199_merge_final", 0];
        }
        // Con audio 2, la pista global de usuario (195_concat_direct_audio) ya
        // cubre todo; mezclamos esa con el concat IA.
        if(a1 && a2){
          g["199_user_vol_final"] = {
            inputs: { audio: ["195_concat_direct_audio", 0], volume: userGainDb },
            class_type: "AudioAdjustVolume",
            _meta: { title: `Híbrido: pista global a ${userGainDb} dB` }
          };
          g["199_ia_vol_final"] = {
            inputs: { audio: ["199_ia_boost_final", 0], volume: guideGainDb },
            class_type: "AudioAdjustVolume",
            _meta: { title: `Híbrido: IA global a ${guideGainDb} dB` }
          };
          g["199_merge_final"] = {
            inputs: { audio1: ["199_user_vol_final", 0], audio2: ["199_ia_vol_final", 0], merge_method: "add" },
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
          const IA_BOOST_DB = 6;
          g["199_ia_boost_final"] = {
            inputs: { audio: [N.AUDIO_CONCAT, 0], volume: IA_BOOST_DB },
            class_type: "AudioAdjustVolume",
            _meta: { title: "Híbrido: boost IA global (+6 dB)" }
          };
          g["199_user_vol_final"] = {
            inputs: { audio: ["192_trim_final_audio", 0], volume: userGainDb },
            class_type: "AudioAdjustVolume",
            _meta: { title: `Híbrido: pista global a ${userGainDb} dB` }
          };
          g["199_ia_vol_final"] = {
            inputs: { audio: ["199_ia_boost_final", 0], volume: guideGainDb },
            class_type: "AudioAdjustVolume",
            _meta: { title: `Híbrido: IA global a ${guideGainDb} dB` }
          };
          g["199_merge_final"] = {
            inputs: { audio1: ["199_user_vol_final", 0], audio2: ["199_ia_vol_final", 0], merge_method: "add" },
            class_type: "AudioMerge",
            _meta: { title: "Híbrido: mezcla IA + pista (Final)" }
          };
          g[N.CREATE_VID_FINAL].inputs.audio = ["199_merge_final", 0];
        }
      }
    }
  }

  // 13. Postprocesado: RTX Video Super Resolution y RIFE
  const rtxOn = (j ? j.rtxToggle : $("rtxToggle")?.checked) ?? true;
  const rifeOn = (j ? j.rifeToggle : $("rifeToggle")?.checked) ?? true;
  const blendOn = (j ? j.blendToggle : $("blendToggle")?.checked) ?? true;

  if(!blendOn && g[N.BLEND]){
    if(g[N.IMAGE_BATCH]?.inputs) g[N.IMAGE_BATCH].inputs.image_2 = ["64", 0];
    delete g[N.BLEND];
  } else if(blendOn && g[N.BLEND]?.inputs){
    const blendStrength = parseFloat((j ? j.blendStrength : $("blendStrength")?.value) ?? "0.35");
    const blendFrames = parseInt((j ? j.blendFrames : $("blendFrames")?.value) ?? "4", 10);
    const blendMode = (j ? j.blendMode : $("blendMode")?.value) || "transition_only";
    g[N.BLEND].inputs.blend_strength = blendStrength;
    g[N.BLEND].inputs.blend_frames = blendFrames;
    g[N.BLEND].inputs.mode = blendMode;
  }

  let finalImagesSource = [N.IMAGE_BATCH, 0];

  // 13a. Refinado facial (ComfyUI-H3-FaceRefine) sobre el vídeo continuo unificado
  const frState = j ? j.faceRefine : getFaceRefineState();
  const faceRefineEnabled = frState ? frState.enabled : false;
  const frCanvasSize = frState?.canvasSize || 512;
  const frSteps = frState?.steps || 4;

  if(faceRefineEnabled){
    const frTarget = frState.target || "face";
    const isCombo = (frTarget === "face_hands");
    const rawSelect = frState.select || "largest_face";
    const isDual = (rawSelect === "dual_faces") || isCombo;

    const elemCfg1 = ELEMENT_REFINE_CONFIG[isCombo ? "face" : frTarget] || ELEMENT_REFINE_CONFIG.face;
    const elemCfg2 = isCombo ? ELEMENT_REFINE_CONFIG.hands : elemCfg1;

    let pass1Select = "largest_face";
    let pass1Index = 0;
    if(rawSelect === "second_face"){
      pass1Select = "largest_face";
      pass1Index = 1;
    } else if(rawSelect === "centre_most" || rawSelect === "left_most" || rawSelect === "right_most"){
      pass1Select = rawSelect;
      pass1Index = 0;
    }

    const pass2Select = "largest_face";
    const pass2Index = isCombo ? 0 : 1;

    const pass2NodeIds = [
      N.FACE_CROP_2, N.FACE_REF2V_2, N.FACE_INJECT_2, N.FACE_PERFRAME_DENOISE_2,
      N.FACE_SCHEDULER_2, N.FACE_GUIDER_2, N.FACE_NOISE_2, N.FACE_SAMPLER_2,
      N.FACE_DECODE_2, N.FACE_STITCH_2
    ];

    // Sub-grafo FaceRefine — Pasada 1
    g[N.FACE_CROP] = {
      class_type: "H3FaceTrackCrop",
      inputs: {
        images: finalImagesSource,
        detector: elemCfg1.detector,
        confidence: 0.35,
        crop_factor: elemCfg1.cropFactor,
        canvas_width: frCanvasSize,
        canvas_height: frCanvasSize,
        canvas_mode: frCanvasSize >= 768 ? "auto_capped_768" : "auto",
        smooth_window: 21,
        size_smooth_window: 51,
        smooth_method: "gaussian",
        size_mode: "per_frame",
        identity_track: false,
        identity_threshold: 0.28,
        select: pass1Select,
        fallback_detector: "none",
        fallback_head_frac: 0.5,
        select_index: pass1Index,
        identity_model: "insightface",
        cut_detection: "none",
        cut_threshold: 3.0,
        absent_shots: "off",
        X: 0,
        Y: 0,
        frame_index: 0
      },
      _meta: { title: isCombo ? "Face Track Crop" : "Element Track Crop" }
    };

    const baseP = p1 || "";
    const frPrompt1 = baseP ? `${baseP}, ${elemCfg1.prompt}` : elemCfg1.prompt;
    const frPrompt2 = baseP ? `${baseP}, ${elemCfg2.prompt}` : elemCfg2.prompt;
    const frRef2vInputs = {
      clip: [N.CLIP, 0],
      vae: [N.VAE_VID, 0],
      audio_vae: [N.VAE_AUD, 0],
      prompt: frPrompt,
      width: [N.FACE_CROP, 4],
      height: [N.FACE_CROP, 5],
      length: [N.FACE_CROP, 6],
      ref_image_size: "match"
    };
    if(slotHasImg(1) && g[N.IMG1]?.inputs?.image){
      frRef2vInputs["ref_images.ref_image_0"] = [N.IMG1, 0];
    }
    g[N.FACE_REF2V] = {
      class_type: "MiniMaxH3ReferenceToVideo",
      inputs: frRef2vInputs,
      _meta: { title: "Face Conditioning & AV Latent" }
    };

    g[N.FACE_INJECT] = {
      class_type: "H3InjectVideoLatent",
      inputs: {
        av_latent: [N.FACE_REF2V, 1],
        images: [N.FACE_CROP, 0],
        vae: [N.VAE_VID, 0]
      },
      _meta: { title: "Inject Face Video Latent" }
    };

    g[N.FACE_PERFRAME_DENOISE] = {
      class_type: "H3PerFrameDenoise",
      inputs: {
        model: [currentModelNode, 0],
        av_latent: [N.FACE_INJECT, 0],
        transform: [N.FACE_CROP, 1],
        denoise_multiplier_small_face: 1.0,
        denoise_multiplier_large_face: frState.denoise || 0.35,
        scale_mode: "absolute_px",
        face_px_small: 30.0,
        face_px_large: 120.0,
        gamma: 1.0,
        smooth_frames: 9
      },
      _meta: { title: "Per-Frame Face Denoise" }
    };

    g[N.FACE_SCHEDULER] = {
      class_type: "BasicScheduler",
      inputs: {
        model: [N.FACE_PERFRAME_DENOISE, 2],
        scheduler: "simple",
        steps: frSteps,
        denoise: frState.denoise || 0.35
      },
      _meta: { title: "Face Basic Scheduler" }
    };

    g[N.FACE_GUIDER] = {
      class_type: "BasicGuider",
      inputs: {
        model: [N.FACE_PERFRAME_DENOISE, 2],
        conditioning: [N.FACE_REF2V, 0]
      },
      _meta: { title: "Face Guider" }
    };

    g[N.FACE_NOISE] = {
      class_type: "RandomNoise",
      inputs: {
        noise_seed: Math.floor(Math.random() * 100000000)
      },
      _meta: { title: "Face Noise" }
    };

    const frSamplerName = (j ? j.sampler : $("samplerName")?.value) || "res_multistep";
    g[N.FACE_SAMPLER_SELECT] = {
      class_type: "KSamplerSelect",
      inputs: {
        sampler_name: frSamplerName
      },
      _meta: { title: "Face Sampler Select" }
    };

    g[N.FACE_SAMPLER] = {
      class_type: "SamplerCustomAdvanced",
      inputs: {
        noise: [N.FACE_NOISE, 0],
        guider: [N.FACE_GUIDER, 0],
        sampler: [N.FACE_SAMPLER_SELECT, 0],
        sigmas: [N.FACE_SCHEDULER, 0],
        latent_image: [N.FACE_PERFRAME_DENOISE, 0]
      },
      _meta: { title: "Sample Face Latent" }
    };

    g[N.FACE_DECODE] = {
      class_type: "VAEDecode",
      inputs: {
        samples: [N.FACE_SAMPLER, 0],
        vae: [N.VAE_VID, 0]
      },
      _meta: { title: "Decode Face Crops" }
    };

    g[N.FACE_STITCH] = {
      class_type: "H3FaceStitch",
      inputs: {
        base_images: finalImagesSource,
        refined_crops: [N.FACE_DECODE, 0],
        transform: [N.FACE_CROP, 1],
        paste_region: "face_only",
        mask_dilation: 16,
        feather: frState.feather || 16,
        colour_match: 1.0,
        blend: 1.0,
        undetected_frames: "fade_out",
        feather_scales_with_crop: false
      },
      _meta: { title: "Stitch Face" }
    };

    finalImagesSource = [N.FACE_STITCH, 0];

    // Sub-grafo FaceRefine — Pasada 2 (Dual / Combo)
    if(isDual){
      g[N.FACE_CROP_2] = {
        class_type: "H3FaceTrackCrop",
        inputs: {
          images: [N.FACE_STITCH, 0],
          detector: elemCfg2.detector,
          confidence: 0.35,
          crop_factor: elemCfg2.cropFactor,
          canvas_width: frCanvasSize,
          canvas_height: frCanvasSize,
          canvas_mode: frCanvasSize >= 768 ? "auto_capped_768" : "auto",
          smooth_window: 21,
          size_smooth_window: 51,
          smooth_method: "gaussian",
          size_mode: "per_frame",
          identity_track: false,
          identity_threshold: 0.28,
          select: pass2Select,
          fallback_detector: "none",
          fallback_head_frac: 0.5,
          select_index: pass2Index,
          identity_model: "insightface",
          cut_detection: "none",
          cut_threshold: 3.0,
          absent_shots: "off",
          X: 0,
          Y: 0,
          frame_index: 0
        },
        _meta: { title: isCombo ? "Hand Track Crop 2" : "Element Track Crop 2" }
      };

      const frRef2vInputs2 = {
        clip: [N.CLIP, 0],
        vae: [N.VAE_VID, 0],
        audio_vae: [N.VAE_AUD, 0],
        prompt: frPrompt2,
        width: [N.FACE_CROP_2, 4],
        height: [N.FACE_CROP_2, 5],
        length: [N.FACE_CROP_2, 6],
        ref_image_size: "match"
      };
      if(slotHasImg(1) && g[N.IMG1]?.inputs?.image){
        frRef2vInputs2["ref_images.ref_image_0"] = [N.IMG1, 0];
      }
      g[N.FACE_REF2V_2] = {
        class_type: "MiniMaxH3ReferenceToVideo",
        inputs: frRef2vInputs2,
        _meta: { title: "Face Conditioning 2 & AV Latent" }
      };

      g[N.FACE_INJECT_2] = {
        class_type: "H3InjectVideoLatent",
        inputs: {
          av_latent: [N.FACE_REF2V_2, 1],
          images: [N.FACE_CROP_2, 0],
          vae: [N.VAE_VID, 0]
        },
        _meta: { title: "Inject Face Video Latent 2" }
      };

      g[N.FACE_PERFRAME_DENOISE_2] = {
        class_type: "H3PerFrameDenoise",
        inputs: {
          model: [currentModelNode, 0],
          av_latent: [N.FACE_INJECT_2, 0],
          transform: [N.FACE_CROP_2, 1],
          denoise_multiplier_small_face: 1.0,
          denoise_multiplier_large_face: frState.denoise || 0.35,
          scale_mode: "absolute_px",
          face_px_small: 30.0,
          face_px_large: 120.0,
          gamma: 1.0,
          smooth_frames: 9
        },
        _meta: { title: "Per-Frame Face Denoise 2" }
      };

      g[N.FACE_SCHEDULER_2] = {
        class_type: "BasicScheduler",
        inputs: {
          model: [N.FACE_PERFRAME_DENOISE_2, 2],
          scheduler: "simple",
          steps: frSteps,
          denoise: frState.denoise || 0.35
        },
        _meta: { title: "Face Basic Scheduler 2" }
      };

      g[N.FACE_GUIDER_2] = {
        class_type: "BasicGuider",
        inputs: {
          model: [N.FACE_PERFRAME_DENOISE_2, 2],
          conditioning: [N.FACE_REF2V_2, 0]
        },
        _meta: { title: "Face Guider 2" }
      };

      g[N.FACE_NOISE_2] = {
        class_type: "RandomNoise",
        inputs: {
          noise_seed: Math.floor(Math.random() * 100000000)
        },
        _meta: { title: "Face Noise 2" }
      };

      g[N.FACE_SAMPLER_2] = {
        class_type: "SamplerCustomAdvanced",
        inputs: {
          noise: [N.FACE_NOISE_2, 0],
          guider: [N.FACE_GUIDER_2, 0],
          sampler: [N.FACE_SAMPLER_SELECT, 0],
          sigmas: [N.FACE_SCHEDULER_2, 0],
          latent_image: [N.FACE_PERFRAME_DENOISE_2, 0]
        },
        _meta: { title: "Sample Face Latent 2" }
      };

      g[N.FACE_DECODE_2] = {
        class_type: "VAEDecode",
        inputs: {
          samples: [N.FACE_SAMPLER_2, 0],
          vae: [N.VAE_VID, 0]
        },
        _meta: { title: "Decode Face Crops 2" }
      };

      g[N.FACE_STITCH_2] = {
        class_type: "H3FaceStitch",
        inputs: {
          base_images: [N.FACE_STITCH, 0],
          refined_crops: [N.FACE_DECODE_2, 0],
          transform: [N.FACE_CROP_2, 1],
          paste_region: "face_only",
          mask_dilation: 16,
          feather: frState.feather || 16,
          colour_match: 1.0,
          blend: 1.0,
          undetected_frames: "fade_out",
          feather_scales_with_crop: false
        },
        _meta: { title: "Stitch Face 2" }
      };

      finalImagesSource = [N.FACE_STITCH_2, 0];
    } else {
      pass2NodeIds.forEach(id => { delete g[id]; });
    }
  } else {
    delete g[N.FACE_CROP];
    delete g[N.FACE_REF2V];
    delete g[N.FACE_INJECT];
    delete g[N.FACE_PERFRAME_DENOISE];
    delete g[N.FACE_SCHEDULER];
    delete g[N.FACE_GUIDER];
    delete g[N.FACE_NOISE];
    delete g[N.FACE_SAMPLER];
    delete g[N.FACE_SAMPLER_SELECT];
    delete g[N.FACE_DECODE];
    delete g[N.FACE_STITCH];
    delete g[N.FACE_LOAD_VIDEO];
    delete g[N.FACE_COMPONENTS];
    pass2NodeIds.forEach(id => { delete g[id]; });
  }

  const rtxQuality = (j ? j.rtxQuality : $("rtxQuality")?.value) || "HIGHBITRATE_ULTRA";
  if(rtxOn && g[N.RTX]?.inputs){
    g[N.RTX].inputs.images = finalImagesSource;
    g[N.RTX].inputs.quality = rtxQuality;
    finalImagesSource = [N.RTX, 0];
  } else {
    delete g[N.RTX];
  }

  const rifeEngine = (j ? j.rifeEngine : $("rifeEngine")?.value) || "rife";
  if(rifeOn){
    const mult = parseInt((j ? j.rifeMultiplier : $("rifeMultiplier")?.value) || "2", 10);
    if(rifeEngine === "rtx"){
      delete g[N.RIFE_LOADER];
      delete g[N.RIFE_MULT];
      g[N.RIFE] = {
        class_type: "RTXVideoFrameGeneration",
        inputs: {
          images: finalImagesSource,
          generation_type: "frame rate multiplier",
          "generation_type.multiplier": mult,
          mode: "HIGH",
          automatic_shot_change_detection: true,
          shot_change: false,
          image_encoding: "8-bit RGB"
        },
        _meta: { title: "RTX Video Frame Generation" }
      };
      finalImagesSource = [N.RIFE, 0];
      if(g[N.CREATE_VID_FINAL]?.inputs) g[N.CREATE_VID_FINAL].inputs.fps = 24 * mult;
    } else if(g[N.RIFE]?.inputs){
      if(g[N.RIFE_MULT]?.inputs) g[N.RIFE_MULT].inputs.value = mult;
      const rifeModel = (j ? j.rifeModel : $("rifeModel")?.value) || "rife_v4.26.safetensors";
      if(g[N.RIFE_LOADER]?.inputs) g[N.RIFE_LOADER].inputs.model_name = rifeModel;
      g[N.RIFE].inputs.images = finalImagesSource;
      finalImagesSource = [N.RIFE, 0];
    }
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
      N.BLEND, N.INJECT_LATENT, N.ADD_GUIDE, N.RTX, N.RIFE, N.RIFE_LOADER, N.RIFE_MULT,
      N.FACE_CROP, N.FACE_REF2V, N.FACE_INJECT, N.FACE_PERFRAME_DENOISE, N.FACE_SCHEDULER,
      N.FACE_GUIDER, N.FACE_NOISE, N.FACE_SAMPLER, N.FACE_SAMPLER_SELECT, N.FACE_DECODE, N.FACE_STITCH,
      N.FACE_LOAD_VIDEO, N.FACE_COMPONENTS,
      N.FACE_CROP_2, N.FACE_REF2V_2, N.FACE_INJECT_2, N.FACE_PERFRAME_DENOISE_2, N.FACE_SCHEDULER_2,
      N.FACE_GUIDER_2, N.FACE_NOISE_2, N.FACE_SAMPLER_2, N.FACE_DECODE_2, N.FACE_STITCH_2
    ];
    nodesToDelete.forEach(id => { delete g[id]; });
    // Nodos auxiliares de audio que sobran en modo solo-Seg1.
    ["197_trim_guide_audio2", "199_user_trim_seg2", "199_ia_vol_seg2", "199_merge_seg2",
     "199_ia_vol_final", "199_merge_final", "194_trim_audio2", "195_concat_direct_audio"]
      .forEach(id => { delete g[id]; });
  } else if(runMode === "seg2_only"){
    const seg1Media = j?.seg1Media || currentMedia[1] || (videoSlot?.uploaded ? { ...videoSlot.uploaded } : null);
    if(!seg1Media || !seg1Media.filename){
      throw new Error("No hay un vídeo de Segmento 1 disponible para continuar. Genera antes el Segmento 1 o cárgalo en el reproductor.");
    }
    const seg1VideoPath = (seg1Media.subfolder ? seg1Media.subfolder + "/" : "") + seg1Media.filename + " [output]";

    g["100_load_seg1_video"] = {
      class_type: "LoadVideo",
      inputs: { file: seg1VideoPath },
      _meta: { title: "Load Seg 1 Video (Native)" }
    };
    g["101_get_seg1_components"] = {
      class_type: "GetVideoComponents",
      inputs: { video: ["100_load_seg1_video", 0] },
      _meta: { title: "Get Seg 1 Components (Native)" }
    };

    const seg1Images = ["101_get_seg1_components", 0];
    const seg1Audio = ["101_get_seg1_components", 1];

    if(g["25"]?.inputs) g["25"].inputs.images = seg1Images;
    if(g["26"]?.inputs) g["26"].inputs.images = seg1Images;
    if(g["61"]?.inputs) g["61"].inputs.images = seg1Images;

    if(g[N.REF2V_SEG2]?.inputs) g[N.REF2V_SEG2].inputs["ref_video_audios.ref_video_audio_0"] = seg1Audio;
    if(g[N.AUDIO_CONCAT]?.inputs) g[N.AUDIO_CONCAT].inputs.audio1 = seg1Audio;
    if(g["65"]?.inputs) g["65"].inputs.audio = seg1Audio;
    if(g["198_ia_boost_seg1"]?.inputs) g["198_ia_boost_seg1"].inputs.audio = seg1Audio;
    if(g["199_ia_trim_seg1"]?.inputs) g["199_ia_trim_seg1"].inputs.audio = seg1Audio;

    const seg1NodesToDelete = [
      N.REF2V_SEG1, N.GUIDER_1, N.SCHEDULER_1, N.SAMPLER_1, N.SAMPLE_1,
      N.DECODE_VID_1, N.DECODE_AUD_1, N.CREATE_VID_1, N.SAVE_VID_1,
      "11", "12", "13"
    ];
    seg1NodesToDelete.forEach(id => { delete g[id]; });
    if(!usedSlots.has(1) && g[N.IMG1]) delete g[N.IMG1];
  }

  return sanitizeGraph(g);
}

// ==========================================
// EJECUCIÓN Y COLAS
// ==========================================
async function queueJob(runMode){
  const p1 = $("prompt")?.value?.trim();
  const p2 = $("prompt2")?.value?.trim();

  let seg1MediaForSeg2 = null;
  if(runMode === "seg2_only"){
    seg1MediaForSeg2 = currentMedia[1];
    if(!seg1MediaForSeg2 || !seg1MediaForSeg2.filename){
      if(videoSlot && videoSlot.uploaded && videoSlot.uploaded.filename){
        seg1MediaForSeg2 = { ...videoSlot.uploaded };
      }
    }
    if(!seg1MediaForSeg2 || !seg1MediaForSeg2.filename){
      log("⚠️ Para usar 'Solo Seg 2 + Final' necesitas tener un Segmento 1 en el reproductor (o un vídeo cargado).", "l-warn");
      return;
    }
    if(!p2 && !p1){
      log("⚠️ Escribe al menos el Prompt 2 para generar el Segmento 2", "l-warn");
      return;
    }
  } else if(!p1){
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
    seg1Media: seg1MediaForSeg2 ? { ...seg1MediaForSeg2 } : null,
    prompt: p1 || "",
    prompt2: p2 || "",
    duration1: parseFloat($("durationSlider1")?.value || "15.0"),
    duration2: parseFloat($("durationSlider2")?.value || "15.0"),
    megapixels: parseFloat($("mpSlider")?.value || "0.70"),
    width: parseInt($("width")?.value || "1152", 10),
    height: parseInt($("height")?.value || "640", 10),
    aspectRatio: $("aspectRatioSelect")?.value || "auto",
    steps: parseInt($("stepsSlider")?.value || "20", 10),
    sampler: $("samplerName")?.value || "res_multistep",
    scheduler: $("schedulerName")?.value || "simple",
    audioMode: $("audioMode")?.value || "none",
    audioGuideVolume: parseInt($("audioGuideVolume")?.value ?? "-6", 10),
    audioUserVolume: parseInt($("audioUserVolume")?.value ?? "-12", 10),
    audioNormalizeToggle: $("audioNormalizeToggle") ? $("audioNormalizeToggle").checked : false,
    sharedRefs: !!$("shareRefsToggle")?.checked,
    refImageSize: $("refImageSize")?.value || "match",
    seedMode,
    seed: baseSeed,
    batchSize,
    attentionBackend: getAttentionBackendState(),
    h3opt: getH3OptState(),
    attentionOptimizer: IS_BLOCKATT ? getAttentionOptimizerState() : null,
    aimdo: IS_BLOCKATT ? getAimdoState() : null,
    h3ShiftVideo: $("h3ShiftVideo")?.value || "12.0",
    h3ShiftAudio: $("h3ShiftAudio")?.value || "3.0",
    spectrum: getSpectrumState(),
    solH3: getSolH3State(),
    faceRefine: getFaceRefineState(),
    blendToggle: $("blendToggle") ? $("blendToggle").checked : true,
    blendStrength: parseFloat($("blendStrength")?.value || "0.35"),
    blendFrames: parseInt($("blendFrames")?.value || "4", 10),
    blendMode: $("blendMode")?.value || "transition_only",
    mediaSlotsSnapshot: {
      1: mediaSlots[1]?.uploaded ? { ...mediaSlots[1].uploaded } : null,
      2: mediaSlots[2]?.uploaded ? { ...mediaSlots[2].uploaded } : null,
      3: mediaSlots[3]?.uploaded ? { ...mediaSlots[3].uploaded } : null,
      4: mediaSlots[4]?.uploaded ? { ...mediaSlots[4].uploaded } : null
    },
    audioSlotsSnapshot: {
      1: audioSlots[1]?.uploaded ? { ...audioSlots[1].uploaded } : null,
      2: audioSlots[2]?.uploaded ? { ...audioSlots[2].uploaded } : null
    },
    videoSlotSnapshot: videoSlot?.uploaded ? { ...videoSlot.uploaded } : null
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
    await ensureSocketConnected();
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
    currentActiveSamplerSlot = (job.runMode === "seg2_only") ? 2 : 1;
    const graph = buildGraph({ ...job, seed: seedUsed });

    // Nueva variante: reset de paneles respetando el modo (en seg2_only se conserva Seg 1)
    resetPreviewPanes(job.runMode);
    updateFinalPromptPanel(graph);

    const frTgt = job.faceRefine?.target;
    const frDesc = frTgt === "hands" ? "Refinado de Manos (HandRefine)" : (frTgt === "face_hands" ? "Refinado Combo (Rostro + Manos)" : (frTgt === "hair" ? "Refinado de Cabello" : (frTgt === "skin" ? "Refinado de Piel" : (frTgt === "body" ? "Refinado de Cuerpo/Persona" : "Refinado Facial (FaceRefine)"))));
    const interpDesc = `Interpolación de Frames (${job.rife?.engine === 'rtx' ? 'RTX Frame Gen' : 'RIFE'} ${job.rife?.multiplier || 2}x)`;
    const modeName = job.isInterpolateOnly ? interpDesc : (job.isFaceRefineOnly ? frDesc : (job.runMode === 'seg1_only' ? 'Solo Seg 1' : (job.runMode === 'seg2_only' ? 'Solo Seg 2 + Final' : 'Vídeo MMH3X2')));
    log(`🚀 Procesando ${modeName} · Var ${varIdx} (seed ${seedUsed})...`);
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

    if(job.isFaceRefineOnly){
      const elFinal = $("timeFinal");
      if(elFinal){ elFinal.textContent = "⏱ 00:00"; elFinal.classList.add("live"); }
      stageTimers.ivFinal = setInterval(() => {
        const elapsed = Date.now() - stageTimers.startPrompt;
        if(elFinal) elFinal.textContent = `⏱ ${fmtMs(elapsed)}`;
      }, 500);
    } else if(job.runMode === "seg2_only"){
      const el1 = $("timeSeg1"), el2 = $("timeSeg2");
      if(el1){ el1.textContent = "✔ Seg 1 previo"; el1.classList.remove("live"); }
      if(el2){ el2.textContent = "⏱ 00:00"; el2.classList.add("live"); }
      stageTimers.startSeg2 = Date.now();
      stageTimers.ivSeg2 = setInterval(() => {
        const elapsed = Date.now() - stageTimers.startSeg2;
        if(el2) el2.textContent = `⏱ ${fmtMs(elapsed)}`;
      }, 500);
    } else {
      const el1 = $("timeSeg1"), el2 = $("timeSeg2");
      if(el1){ el1.textContent = "⏱ 00:00"; el1.classList.add("live"); }
      if(el2){ el2.textContent = ""; el2.classList.remove("live"); }

      stageTimers.ivSeg1 = setInterval(() => {
        const elapsed = Date.now() - stageTimers.startSeg1;
        if(el1) el1.textContent = `⏱ ${fmtMs(elapsed)}`;
      }, 500);
    }

    pendingSeeds[data.prompt_id] = seedUsed;
    promptVariantMap[data.prompt_id] = varIdx;
    currentPromptId = data.prompt_id;
    promptSteps[data.prompt_id] = "1";
    createGeneratingCard(varIdx, seedUsed);
    startTimer(data.prompt_id, "Final");
    pollFallback(data.prompt_id);
  } catch(e){
    log(`❌ No se pudo encolar: ${e.message}`, "l-err");
    // NO drenar la cola ni avanzar el batch aquí: common.js ya hace
    // currentBatchIndex++ + processNextBatch tras onPromptError; arrancar el
    // siguiente job desde aquí duplica la continuación (variantes fantasma).
    const gridErr = $("variantGrid");
    if(gridErr){
      const card = gridErr.querySelector('.variant-card-generating');
      if(card) card.remove();
    }
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
    // Preview de muestreo obsoleto al quedar en reposo (gestiona su propio
    // batch: es el único punto de limpieza del camino de éxito). Limpia los
    // 3 paneles de preview en vivo; los reproductores de resultado no se tocan.
    clearPreview();
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
  syncHistoryTimings();

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
            <span style="font-size:10px;color:var(--muted-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;" title="${escapeHtml(item.filename)}">${escapeHtml(item.filename)}</span>
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
              const [wf, specs] = await Promise.all([
                extractWorkflowFromMP4(rawUrl),
                resolveVideoSpecs(videoEl)
              ]);
              let timing = getVideoTiming(item.filename);
              if(!timing){
                await syncHistoryTimings();
                timing = getVideoTiming(item.filename);
              }
              const metaObj = formatWorkflowToMeta(wf || {}, {
                resolution: specs.resolution,
                aspectRatio: specs.aspectRatio,
                timing: timing || "—"
              });
              if(metaObj){
                card.dataset.meta = JSON.stringify(metaObj);
                showVariantTooltip(card);
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
      div.innerHTML = `<img src="${url}" loading="lazy" referrerpolicy="no-referrer"><div class="info-tag">${escapeHtml(String(ts))} · ${sizeKB}KB</div>`;
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
    let text = $("enhancerOutput")?.value || "";
    text = text.replace(/\n*--- Ollama · [^\n]+ ---/g, "").trim();
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

  function updateSeg2OllamaModelVisibility(){
    const isOllama = $("seg2PromptMode")?.value === "ollama";
    const row = $("rowSeg2OllamaModel");
    if(row) row.style.display = isOllama ? "block" : "none";
  }
  window.updateSeg2OllamaModelVisibility = updateSeg2OllamaModelVisibility;
  if($("seg2PromptMode")){
    $("seg2PromptMode").addEventListener("change", () => {
      updateSeg2OllamaModelVisibility();
      scheduleSaveSettings();
    });
    updateSeg2OllamaModelVisibility();
  }

  if($("aspectRatioSelect")){
    $("aspectRatioSelect").addEventListener("change", () => {
      const img1 = $("previewSlotImg1");
      const hasImg1 = !!(img1 && img1.complete && img1.naturalWidth && img1.style.display !== "none");
      updateCalculatedResolution(hasImg1 ? img1.naturalWidth : 1280, hasImg1 ? img1.naturalHeight : 720);
      scheduleSaveSettings();
    });
  }

  if($("mpSlider")){
    $("mpSlider").addEventListener("input", (e) => {
      $("mpVal").textContent = parseFloat(e.target.value).toFixed(2);
      const img1 = $("previewSlotImg1");
      const hasImg1 = !!(img1 && img1.complete && img1.naturalWidth && img1.style.display !== "none");
      updateCalculatedResolution(hasImg1 ? img1.naturalWidth : 1280, hasImg1 ? img1.naturalHeight : 720);
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
    sel.innerHTML = AVAILABLE_UNETS.map(m => `<option value="${escapeHtml(m)}" ${m === defaultUnet ? 'selected' : ''}>${escapeHtml(m.split("/").pop())}</option>`).join("");
  }
  if(typeof AVAILABLE_CLIPS !== "undefined" && $("clipModel")){
    const sel = $("clipModel");
    const defaultClip = BASE_GRAPH[N.CLIP]?.inputs?.clip_name || "";
    sel.innerHTML = AVAILABLE_CLIPS.map(m => `<option value="${escapeHtml(m)}" ${m === defaultClip ? 'selected' : ''}>${escapeHtml(m.split("/").pop())}</option>`).join("");
  }
  if(typeof AVAILABLE_VAES !== "undefined" && $("vaeModel")){
    const sel = $("vaeModel");
    const defaultVae = BASE_GRAPH[N.VAE_VID]?.inputs?.vae_name || "";
    sel.innerHTML = AVAILABLE_VAES.map(m => `<option value="${escapeHtml(m)}" ${m === defaultVae ? 'selected' : ''}>${escapeHtml(m.split("/").pop())}</option>`).join("");
  }
  if(typeof AVAILABLE_LORAS !== "undefined"){
    ["lora1Select", "lora2Select"].forEach(id => {
      const sel = $(id);
      if(sel){
        sel.innerHTML = '<option value="">(ninguno)</option>' +
          AVAILABLE_LORAS.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l.split("/").pop())}</option>`).join("");
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

  // Restaurar medios guardados en IndexedDB
  restoreSavedMedia().then(hasSavedMedia => {
    if(hasSavedMedia){
      log("💾 Sesión anterior restaurada (ajustes y medios guardados)", "l-ok");
    }
    const img1 = $("previewSlotImg1");
    if(img1 && img1.complete && img1.naturalWidth && img1.style.display !== "none"){
      updateCalculatedResolution(img1.naturalWidth, img1.naturalHeight);
    } else {
      updateCalculatedResolution(1280, 720);
    }
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
      log("⚠️ Cadena de mejora desactivada. Activa 'LLM' para usar el botón.", "l-warn");
      return;
    }
    const model = $("enhancerModel")?.value;
    if(!model){ log("⚠️ Selecciona un modelo de LLM (Ollama / llama.cpp) en el selector", "l-err"); return; }
    const mode = $("enhancerMode")?.value || "text";
    const styleKey = $("enhancerStyle")?.value || "A";
    const data = loadSysPrompts();
    const system = getCurrentSysPrompt(data, mode, styleKey);
    let userPrompt = $("prompt")?.value?.trim() || "";

    if(mode === "text" && styleKey === "D"){
      const p1 = $("prompt")?.value?.trim() || "";
      const p2 = $("prompt2")?.value?.trim() || "";
      if(p1 && p2){
        userPrompt = `PREVIOUS SEGMENT (Seg 1):\n${p1}\n\nNEXT SEGMENT DIRECTION (Seg 2):\n${p2}`;
      } else if(p2){
        userPrompt = p2;
      } else if(p1){
        userPrompt = `PREVIOUS SEGMENT (Seg 1):\n${p1}\n\nDescribe the next action for Segment 2.`;
      }
    }

    if(mode !== "vision" && !userPrompt){ log("⚠️ Escribe un prompt base primero en Prompt 1", "l-warn"); return; }

    const payload = { model, system, prompt: userPrompt || "Describe this image for video generation.", stream: false, options: { num_ctx: 8192 } };

    if(mode === "vision"){
      const sharedRefs = !!$("shareRefsToggle")?.checked;
      const isSeg2Style = (styleKey === "F");
      const allowedSlots = isSeg2Style
        ? (sharedRefs ? [2, 3, 4] : [3, 4])
        : (sharedRefs ? [1, 2, 3, 4] : [1, 2]);

      const availableSlots = [];
      for(const i of allowedSlots){
        if(mediaSlots[i]?.file || mediaSlots[i]?.dataUrl) availableSlots.push(i);
      }
      if(availableSlots.length === 0){
        const targetDesc = isSeg2Style
          ? (sharedRefs ? "Slot 2, 3 o 4" : "Slot 3 o 4 (Segmento 2)")
          : (sharedRefs ? "los slots de entrada (1 a 4)" : "Slot 1 o 2 (Segmento 1)");
        log(`⚠️ Carga al menos una imagen en ${targetDesc} para usar este estilo en modo Visión.`, "l-err");
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

        if(styleKey === "D"){
          // FL2VA: Primer frame y Último frame (requiere 2 imágenes de los slots permitidos)
          const firstSlot = (mediaSlots[1]?.file || mediaSlots[1]?.dataUrl) ? 1 : availableSlots[0];
          const secondSlot = (mediaSlots[2]?.file || mediaSlots[2]?.dataUrl) ? 2 : availableSlots.find(s => s !== firstSlot);
          if(!secondSlot){
            log("⚠️ FL2VA requiere al menos 2 imágenes (apertura y cierre dentro de los slots permitidos).", "l-warn");
            return;
          }
          const firstB64 = await readSlotBase64(firstSlot);
          const lastB64 = await readSlotBase64(secondSlot);
          if(firstB64 && lastB64){
            payload.images = [firstB64, lastB64];
            payload.prompt = userPrompt
              ? `FIRST IMAGE (opening frame, Picture 1): see above. SECOND IMAGE (closing frame, Picture 2): see above. User hint: ${userPrompt}`
              : "FIRST IMAGE (opening frame, Picture 1): see above. SECOND IMAGE (closing frame, Picture 2): see above.";
          }
        } else if(styleKey === "F"){
          // Continuación Seg 2 con imagen (Slot 3 o 4, o 2 si shared)
          const sSlot = (mediaSlots[3]?.file || mediaSlots[3]?.dataUrl) ? 3
            : ((mediaSlots[4]?.file || mediaSlots[4]?.dataUrl) ? 4 : availableSlots[0]);
          const sB64 = await readSlotBase64(sSlot);
          if(sB64){
            payload.images = [sB64];
            const seg1Prompt = $("prompt")?.value?.trim() || "";
            const seg2Hint = $("prompt2")?.value?.trim() || "";
            payload.prompt = seg2Hint
              ? `REFERENCE IMAGE FOR SEGMENT 2: see above. Existing context / Segment 1 action: ${seg1Prompt}. Next segment direction: ${seg2Hint}`
              : (seg1Prompt
                ? `REFERENCE IMAGE FOR SEGMENT 2: see above. Existing context / Segment 1 action: ${seg1Prompt}. Describe the continued action evolving into this scene.`
                : "REFERENCE IMAGE FOR SEGMENT 2: see above. Describe the continued action evolving into this scene.");
          }
        } else if(styleKey === "E" && availableSlots.length > 1){
          // R2VA: multi-imagen (hasta 3 imágenes estrictamente de los slots permitidos)
          for(const idx of availableSlots.slice(0, 3)){
            const b64 = await readSlotBase64(idx);
            if(b64) payload.images.push(b64);
          }
          payload.prompt = userPrompt
            ? `REFERENCE IMAGES (in order, <Picture N>): see above. User hint: ${userPrompt}`
            : "REFERENCE IMAGES (in order, <Picture N>): see above.";
        } else {
          // I2VA / Descriptivo / Cinematográfico (Slot 1 preferente, o primer slot permitido)
          const firstSlot = (mediaSlots[1]?.file || mediaSlots[1]?.dataUrl) ? 1 : availableSlots[0];
          const b64 = await readSlotBase64(firstSlot);
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
    if($("enhancerMetaInfo")) $("enhancerMetaInfo").textContent = "";
    try {
      log(`🧠 Solicitando mejora al LLM (${model}, modo ${mode}, estilo ${styleKey})...`, "l-busy");
      const { text, elapsedMs } = await streamOllamaGenerate(payload, $("enhancerOutput"));
      const timeStr = fmtMs(elapsedMs);
      $("enhancerOutput").value = text;
      if($("enhancerMetaInfo")) $("enhancerMetaInfo").textContent = `${model} · ${mode} · ${styleKey} · ${timeStr}`;
      log(`✅ Prompt mejorado en ${timeStr} (${model}, ${mode}, ${styleKey}). Puedes aplicarlo a Prompt 1 ("Usar como prompt") o a Prompt 2 ("Pegar de Enhancer").`, "l-ok");
    } catch(e){
      log(`❌ Error al mejorar prompt con LLM: ${e.message}`, "l-err");
      $("enhancerOutput").value = "Error: " + e.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "Mejorar prompt";
    }
  });

  // Tras cargar los modelos de Ollama / llama.cpp, restaurar configuración guardada.
  (async () => {
    await loadEnhancerModels();
    const saved = restoreSettings();
    if(saved){
      const s = JSON.parse(localStorage.getItem(MMH3X2_SETTINGS_KEY) || "{}");
      if(s.enhancerModel && $("enhancerModel")){
        const sel = $("enhancerModel");
        const hasModel = Array.from(sel.options).some(o => o.value === s.enhancerModel);
        if(hasModel) sel.value = s.enhancerModel;
        else if(sel.options.length > 1) log(`⚠️ Modelo Ollama guardado (${s.enhancerModel}) no disponible ahora.`, "l-warn");
      }
      if(s.seg2OllamaModel && $("seg2OllamaModel")){
        const sel2 = $("seg2OllamaModel");
        const hasModel2 = Array.from(sel2.options).some(o => o.value === s.seg2OllamaModel);
        if(hasModel2) sel2.value = s.seg2OllamaModel;
      }
    }
    if(typeof updateSeg2OllamaModelVisibility === "function") updateSeg2OllamaModelVisibility();
  })();

  setupEvolveUI();
  updateDurationFrames();
  loadVideoHistory();
  updateQueueUI();
});

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

function setupEvolveUI(){
  makeCollapsible("evolveToggle", "evolveBody");
  $("evolveStrength")?.addEventListener("input", (e) => {
    if($("evolveStrengthVal")) $("evolveStrengthVal").textContent = e.target.value + "%";
  });
  $("btnEvolve")?.addEventListener("click", () => {
    const targetId = $("evolveTarget")?.value || "prompt";
    const targetEl = $(targetId);
    const prompt = (targetEl?.value || "").trim();
    if(!prompt){
      log(`⚠️ Escribe texto en ${targetId === "prompt2" ? "Prompt 2" : "Prompt 1"} primero`, "l-err");
      return;
    }
    const mode = $("evolveMode")?.value || "words";
    const strength = parseInt($("evolveStrength")?.value || "10", 10);
    const count = parseInt($("evolveCount")?.value || "4", 10) || 4;
    const variants = generateEvolved(prompt, mode, strength, count);
    if($("evolveOutput")) $("evolveOutput").value = variants.map((v, i) => `--- Variant ${i + 1} ---\n${v}`).join("\n\n");
    log(`🧬 ${count} variantes generadas para ${targetId === "prompt2" ? "Prompt 2" : "Prompt 1"} (${mode}, ${strength}%)`, "l-ok");
  });
  $("btnEvolveUse")?.addEventListener("click", () => {
    const text = ($("evolveOutput")?.value || "").trim();
    if(!text){ log("⚠️ Genera variantes primero", "l-err"); return; }
    const first = text.split(/--- Variant \d+ ---/)[1]?.trim() || text.split("\n\n")[0]?.trim();
    if(first){
      const targetId = $("evolveTarget")?.value || "prompt";
      const targetEl = $(targetId);
      if(targetEl){
        targetEl.value = first;
        targetEl.dispatchEvent(new Event("input"));
        log(`✏️ ${targetId === "prompt2" ? "Prompt 2" : "Prompt 1"} actualizado con la variante #1`, "l-ok");
      }
    }
  });
}
