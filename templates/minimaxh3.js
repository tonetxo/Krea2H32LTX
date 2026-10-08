// minimaxh3.js — MiniMaxH3-specific JavaScript.
// Injected AFTER common.js. CONFIG must be defined before initCommon().

const CONFIG = {
  PROMPTS_KEY: 'minimaxh3_prompts',
  LORA_STATE_KEY: 'minimaxh3_loras_state',
  ENHANCER_SYSKEY: 'minimaxh3_enhancer_sysprompts',
  SERVERURL_KEY: 'minimaxh3_serverUrl',
  DEFAULT_BACKEND_PORT: "7821",
  UI_TYPE: "minimaxh3",
  DEFAULT_MODEL: "",
  DEFAULT_VAE: "Checkpoint",
  N: {
    IMAGE_FIRST:"137", IMAGE_LAST:"137", AUDIO_FIRST:"151", AUDIO_VOL:"161",
    PROMPT_TEXT:"138", RES_SELECTOR:"115",
    UNET:"127", CLIP:"128", VAE_VIDEO:"119", VAE_AUDIO:"120",
    LORA1:"145", LORA2:"145_2",
    SPARSE_ATTN:"158", SIGMA_SHIFT:"159", MEM_OPT:"164", SPECTRUM:"162",
    ATTN_BACKEND:"147", BLOCK_SPARSE:"190", AIMDO:"191",
    SOL_H3:"166",
    NOISE:"129", DURATION:"132", MATH:"131",
    SCHEDULER:"124", SAMPLER_SELECT:"123", REF2V:"136", GUIDER:"126",
    SAMPLER:"125", LATENT_UPSCALE:"165", DECODE_VIDEO:"122", DECODE_AUDIO:"121",
    DECODE_VIDEO_1:"420", DECODE_AUDIO_1:"421", CREATE_VIDEO_1:"422", FIRST_SAVE:"423",
    AV_SPLIT:"400", AV_CONCAT:"401", UNET2:"402", ATTN2:"403", LORA_TURBO2:"404",
    SIGMA_SHIFT2:"405", PREVIEW2:"406", SIGMAS2:"407", GUIDER2:"408", SAMPLER2:"409",
    MEM_OPT2:"411", SPARSE_ATTN2:"412", AIMDO2:"413", SOL_H3_2:"414",
    RIFE_LOADER:"180", RIFE_INTERP:"181",
    FACE_CROP:"301", FACE_REF2V:"302", FACE_INJECT:"303", FACE_PERFRAME_DENOISE:"305",
    FACE_SCHEDULER:"306", FACE_GUIDER:"307", FACE_NOISE:"308", FACE_SAMPLER:"309",
    FACE_DECODE:"310", FACE_STITCH:"311", FACE_LOAD_VIDEO:"312", FACE_COMPONENTS:"313",
    RTX_SR:"148", CREATE_VIDEO:"130", SAVE:"92",
  },
  loras: [
    { on: false, lora: "", strength: 1.0 },
    { on: false, lora: "", strength: 1.0 },
  ],
  ENHANCER_DEFAULT_PROMPTS: {
    text: {
      A: { name: "Estilo A (cinematográfico)", prompt: "You are an expert in prompts for MiniMaxH3 video generation. Transform the user's idea into a detailed cinematic prompt. Include: shot type, lighting, camera movement, atmosphere, colors, and visual style. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt, no explanations or prefaces." },
      B: { name: "Estilo B (narrativo)", prompt: "You are a creative assistant specialized in visual storytelling. Take the user's idea and turn it into an evocative prompt that captures the essence of the scene. Use descriptive, poetic language. Focus on atmosphere, emotions, and the story the image tells. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
      C: { name: "T2VA (guía oficial)", prompt: `You are an expert prompt writer for the MiniMax H3 video model (text-to-video-audio, T2VA). Rewrite the user's idea into a single MiniMax H3 final prompt following the official format strictly.

RULES:
1. The final prompt has NO image-alignment instruction (it is T2VA, no reference image). Begin directly with the three core fields.
2. Use exactly this structure, preserving the field labels verbatim:

integrated_multimodal_description: [Shot 1] <style and initial composition>. <camera motion + amplitude + speed as natural English actions>. <subject appearance, IDs, actions, dialogue, diegetic sound>. [Shot 2] At 00:SS.SSS, the camera cuts to <new information>. ...

overall_soundscape: <1-4 sentences: ambient sound, physical action sounds, non-verbal human sounds across the full video>. Do NOT repeat dialogue or diegetic music here. Use N/A only if the user requests complete silence.

non_diegetic_music: <1-3 sentences: instrumentation, tempo, rhythm, dynamic changes only>. Use N/A if there is no non-diegetic music.

3. At the start of [Shot 1] state the overall style (Cinematic, live-action, 2D-animated, 3D CG, claymation, watercolor, vintage film, etc.) and the initial composition.
4. Do NOT add a timestamp to [Shot 1]. Later shots use sequential numbers and a strictly increasing cut time within the video duration, introduced with "the camera cuts to", "the shot cuts to", "the shot transitions to", "the shot changes to", or "the shot switches to". Use cross-dissolve/fade/wipe only if the user explicitly asks.
5. Camera motion: combine motion type (Zoom In/Out, Push In/Pull Out, Pan Left/Right, Truck Left/Right, Tilt Up/Down, Pedestal Up/Down, Arc Shot, Tracking Shot, Static Shot, Shake Slightly/Strongly, POV, Roll Clockwise/Counterclockwise) + amplitude (with small/large amplitude) + speed (at slow/fast speed). Write it as a natural English action within the shot, not as stacked labels. Omit amplitude/speed when medium/normal.
6. Speakers: assign stable IDs like (S1), (S2); compound IDs like (S1,S2) for joint speech. A speaker keeps the same ID across shots; non-vocal characters get no ID. On first appearance give enough context (age, gender, on/off-screen, pitch, timbre, rate, accent). Put identity, action and delivery OUTSIDE <d>; inside <d> include only [Language] and the verbatim user-provided words — never translate or rewrite.
7. Voiceover uses the exact phrase "says in an off-screen voiceover" and immediately after every voiceover <d> block states the on-screen character's lips remain closed.
8. When dialogue or lyrics cross a cut, use <scenetrans> at the connecting points and state the audio continues (continues seamlessly across the cut / carries over from the previous shot / remains audible across the transition). Use <cutoff> when speech is truncated by the end of the video.
9. On-screen text (banners, signs, labels, subtitles, neon) goes in English double quotes, verbatim, no translation.
10. Every detail must correspond to something visible or audible. Do not invent details that contradict the user's intent, but you may add scene/character/action/sound details that stay consistent with it.

The user may write in any language; you must ALWAYS respond in English with ONLY the final MiniMax H3 prompt, no explanations or prefaces.` },
    },
    vision: {
      A: { name: "Estilo A (descriptivo)", prompt: "You are an expert at describing images for video generation. Analyze the provided image and generate a detailed prompt describing: composition, subjects, background, lighting, colors, motion, and atmosphere. The prompt must be suitable for a text-to-video model. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
      B: { name: "Estilo B (cinematográfico)", prompt: "You are a digital cinematographer. Look at the image and turn it into a cinematic description. Describe how the camera would move, how lighting would evolve, what action would unfold, and how the scene would change over time. Think in terms of footage, not a still photo. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
      C: { name: "I2VA (guía oficial)", prompt: `You are an expert prompt writer for the MiniMax H3 video model (image-to-video-audio, I2VA). You are given ONE reference image: it is the exact first frame of the target video at 0.00 seconds and belongs to [Shot 1]. Optionally the user provides a text hint. Rewrite the user's idea into a single MiniMax H3 final prompt following the official format strictly.

RULES:
1. The final prompt MUST start with this exact instruction line (no leading blank line, nothing before it):
For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.
2. Leave exactly ONE blank line after that instruction, then the three core fields with these exact labels:

integrated_multimodal_description: [Shot 1] <derive overall style from the image>. <establish the subjects, composition, clothing, colors, key objects and spatial relationships exactly as in <Picture 1>>. <first-frame anchor → action onset → continuous development → result or reaction>. <camera motion as natural English: motion type + amplitude + speed>. <speaker IDs (S1)... with identity outside <d> and [Language] + verbatim words inside <d>>. [Shot 2] At 00:SS.SSS, the camera cuts to ... etc.

overall_soundscape: <1-4 sentences: ambient + physical-action + non-verbal human sounds across the full video; no dialogue/diegetic music here; N/A only if user requests silence>.

non_diegetic_music: <1-3 sentences: instrumentation, tempo, rhythm, dynamics only; N/A if none>.

3. Derive the overall style (Cinematic, live-action, 2D-animated, 3D CG, claymation, watercolor, vintage film...) from the reference image. At [Shot 1] state that style and the initial composition matching <Picture 1>.
4. <Picture 1> is the actual first frame: character identity, clothing, colors, key objects and spatial relationships MUST stay consistent. Recommended structure: first-frame anchor → action onset → continuous development → result or reaction.
5. Camera motion: motion type (Zoom In/Out, Push In/Pull Out, Pan Left/Right, Truck Left/Right, Tilt Up/Down, Pedestal Up/Down, Arc Shot, Tracking Shot, Static Shot, Shake Slightly/Strongly, POV, Roll Clockwise/Counterclockwise) + amplitude (with small/large amplitude) + speed (at slow/fast speed). Write it as a natural English action; omit amplitude/speed when medium/normal.
6. Do NOT add a timestamp to [Shot 1]. Later shots: sequential numbers, strictly increasing cut time within the video duration, introduced with "the camera cuts to" / "the shot cuts to" / "the shot transitions to" / "the shot changes to" / "the shot switches to". Cross-dissolve/fade/wipe only if the user explicitly asks.
7. Speakers: stable IDs (S1), (S2); compound (S1,S2) for joint speech; same ID across shots; non-vocal characters get no ID. On first appearance give context (age, gender, on/off-screen, pitch, timbre, rate, accent). Identity/action/delivery OUTSIDE <d>; inside <d> only [Language] + verbatim user words — never translate or rewrite.
8. Voiceover: exact phrase "says in an off-screen voiceover"; immediately after every voiceover <d> block state the on-screen character's lips remain closed.
9. Dialogue/lyrics crossing a cut: <scenetrans> at connecting points + state audio continues. <cutoff> when truncated by the end.
10. On-screen text (banners, signs, labels, subtitles, neon): English double quotes, verbatim, no translation.
11. If the user provided a text hint, treat it as guidance about the intended motion/action and incorporate it.

The user may write in any language; you must ALWAYS respond in English with ONLY the final MiniMax H3 prompt, no explanations or prefaces.` },
      D: { name: "FL2VA (guía oficial)", prompt: `You are an expert prompt writer for the MiniMax H3 video model (first-last-frame-to-video-audio, FL2VA). You are given TWO reference images: the FIRST image is the opening frame (Picture 1, 0.00 seconds, [Shot 1]) and the SECOND image is the closing frame (Picture 2, end of the video, final [Shot N]). Optionally the user provides a text hint. Rewrite the user's idea into a single MiniMax H3 final prompt following the official format strictly.

RULES:
1. The final prompt MUST start with this exact instruction line (replace S.SS with the effective video duration to two decimals):
How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot N) aligns with the S.SS-second mark of the target video.
2. Leave exactly ONE blank line after that instruction, then the three core fields with these exact labels:

integrated_multimodal_description: [Shot 1] <derive overall style from the images>. <first-frame state matching Picture 1: subjects, poses, composition, lighting, colors, key objects>. <observable intermediate changes: how the subject moves, poses change, objects are manipulated, composition/lighting evolve>. <progressively narrowing differences>. <last-frame state matching Picture 2 at the end of the shot>. <camera motion as natural English: motion type + amplitude + speed>. <speaker IDs... identity outside <d>, [Language] + verbatim words inside <d>>.

overall_soundscape: <1-4 sentences: ambient + physical-action + non-verbal human sounds across the full video; no dialogue/diegetic music here; N/A only if user requests silence>.

non_diegetic_music: <1-3 sentences: instrumentation, tempo, rhythm, dynamics only; N/A if none>.

3. FL2VA favors a SINGLE shot so the model can interpolate continuously from the first frame to the last frame. Use multiple shots only when the user explicitly specifies them. The last frame must be reached by the final [Shot N] at the end of the video.
4. The body should NOT repeat two static image descriptions; it supplies the MOTION PATH that connects them. Recommended structure: first-frame state → observable intermediate changes → progressively narrowing differences → last-frame state.
5. Derive the overall style (Cinematic, live-action, 2D-animated, 3D CG, claymation, watercolor, vintage film...) from the reference images. At [Shot 1] state that style and the initial composition matching Picture 1.
6. Character identity, clothing, colors, key objects and spatial relationships MUST stay consistent between both frames.
7. Camera motion: motion type (Zoom In/Out, Push In/Pull Out, Pan Left/Right, Truck Left/Right, Tilt Up/Down, Pedestal Up/Down, Arc Shot, Tracking Shot, Static Shot, Shake Slightly/Strongly, POV, Roll Clockwise/Counterclockwise) + amplitude (with small/large amplitude) + speed (at slow/fast speed). Write it as a natural English action; omit amplitude/speed when medium/normal.
8. Do NOT add a timestamp to [Shot 1]. Later shots (only if explicitly requested): sequential numbers, strictly increasing cut time within the video duration, introduced with "the camera cuts to" / "the shot cuts to" / "the shot transitions to" / "the shot changes to" / "the shot switches to".
9. Speakers: stable IDs (S1), (S2); compound (S1,S2) for joint speech; same ID across shots; non-vocal characters get no ID. On first appearance give context (age, gender, on/off-screen, pitch, timbre, rate, accent). Identity/action/delivery OUTSIDE <d>; inside <d> only [Language] + verbatim user words — never translate or rewrite.
10. Voiceover: exact phrase "says in an off-screen voiceover"; immediately after every voiceover <d> block state the on-screen character's lips remain closed.
11. Dialogue/lyrics crossing a cut: <scenetrans> at connecting points + state audio continues. <cutoff> when truncated by the end.
12. On-screen text (banners, signs, labels, subtitles, neon): English double quotes, verbatim, no translation.
13. If the user provided a text hint, treat it as guidance about the intended motion/path and incorporate it.

The user may write in any language; you must ALWAYS respond in English with ONLY the final MiniMax H3 prompt, no explanations or prefaces.` },
      E: { name: "R2VA (referencia completa)", prompt: `You are an expert prompt writer for the MiniMax H3 video model in FULL-REFERENCE mode. You are given reference images (<Picture N>), reference videos (<Video N>) and reference audio (<Audio N>) in order. Rewrite the user's idea into a single MiniMax H3 final prompt using the full-reference format.

RULES:
1. Output exactly SIX sections, in order: subject_definitions, summary, retention_analysis, detailed_description, overall_soundscape, non_diegetic_music.
2. Use these reference labels consistently: <Subject N> (reusable visible content), <Picture N> (a concrete target frame/keyframe anchor), <Video N> (whole-video structure/edit/continuation source), <Audio N> (audio signal copied or referenced). Keep the same meaning everywhere.
3. subject_definitions: one line per referenced item, stating its label, role, and key features to follow.
4. summary: one short English paragraph prefixed with a task-type tag chosen from [keyframe completion], [reference generation], [video editing], [video continuation], [audio reuse], [audio reference]; combine with " + " when several apply.
5. retention_analysis: one line per label with a relationship marker: fully_preserved, partially_preserved, attribute_transfer, weak_reference (visible); fully_copy, partially_copy, reference, weak_reference (audio).
6. detailed_description: the main body, 350-500 English words, shot by shot in playback order with [Shot 1] (no timestamp) then [Shot N] At MM:SS.mmm. Write camera motion as natural English (motion type + amplitude + speed). Give vocal sources stable (S1),(S2) IDs; write dialogue as <d>[Language] ...</d> verbatim. Insert <Subject N>/<Picture N>/<Video N>/<Audio N> at their first appearance and where they apply. Use <scenetrans>/<cutoff> for dialogue across cuts. State the overall style in one or two English sentences before [Shot 1].
7. overall_soundscape: 1-4 sentences of ambient/physical/non-verbal sound; cite <Audio N> copy/reference relationship when it matches that layer.
8. non_diegetic_music: 1-3 sentences on instrumentation, tempo, dynamics; N/A if none.

The user may write in any language; you must ALWAYS respond in English with ONLY the final MiniMax H3 full-reference prompt, no explanations or prefaces.` },
      F: { name: "L2VA (solo último frame / convergencia final)", prompt: `You are an expert prompt writer for the MiniMax H3 video model generating a video that concludes at a target LAST FRAME (reverse-temporal inference / ending convergence). You are given ONE reference image: it is the exact CLOSING frame of the target video at the end of the timeline (Picture 1, aligns with the final second of the video). Optionally the user provides a text hint. Rewrite the user's idea into a single MiniMax H3 final prompt following the official format strictly.

RULES:
1. The final prompt MUST start with this exact instruction line (replace S.SS with the video duration, e.g. 12.00):
For the target video, at S.SS seconds into the target video, <Picture 1> is fully referenced.

2. Leave exactly ONE blank line after that instruction, then the three core fields with these exact labels:

integrated_multimodal_description: [Shot 1] <derive overall style from the reference image>. <establish an engaging, logical opening scene and setting prior to the final frame>. <describe the continuous chronological action, movement, subject trajectory, lighting evolution, and camera motion that logically leads up to the final composition>. <the action, poses, objects, and framing progressively converge until smoothly freezing/settling exactly into the state depicted in <Picture 1> at the final moment>. <camera motion as natural English: motion type + amplitude + speed>. <speaker IDs if applicable>.

overall_soundscape: <1-4 sentences: ambient background, physical action sounds, and non-verbal foley across the full duration leading up to the final moment; no dialogue/diegetic music here; N/A only if silence is requested>.

non_diegetic_music: <1-3 sentences: instrumentation, tempo, rhythm, and dynamic build-up leading to the climax/resolution at the final frame; N/A if none>.

3. The prompt describes CHRONOLOGICAL progression from the starting moment (00s) up to the final frame (closing moment). It does NOT describe events in reverse time; instead, it imagines the earlier events and trajectory that naturally culminated in the provided closing photograph.
4. Derive the overall visual style (Cinematic, live-action, 2D-animated, 3D CG, vintage film, etc.) from the reference image.
5. All visual attributes of the subject, clothing, environment, lighting, and key objects must seamlessly match and conclude in <Picture 1>.
6. If the user provided a text hint, treat it as guidance about the backstory, action, or camera trajectory leading up to the final frame.

The user may write in any language; you must ALWAYS respond in English with ONLY the final MiniMax H3 prompt, no explanations or prefaces.` },
    },
  },
};

const N = CONFIG.N;
initCommon();

let uploadedFirstImage=null, uploadedLastImage=null;
let localFirstFile=null, localLastFile=null;
let seedMode="random";
let currentAspectRatio = 16/9;
let currentMedia = {};
let currentMediaSeed = {};
// prompt_id que produjo el resultado mostrado en cada reproductor. Sirve para
// el guard de onPreview: solo se ignoran frames tardíos si el reproductor ya
// muestra el resultado del MISMO prompt en curso. Anclar al prompt_id (y no al
// índice de variante) evita la colisión entre jobs, que reinician variantCounter.
const currentMediaPrompt = {};
const BITDEPTH_KEY = "minimaxh3_bit_depth";
const MODE_KEY = "minimaxh3_mode";
const SPECTRUM_KEY = "minimaxh3_spectrum";
const H3OPT_KEY = "minimaxh3_h3opt";
const SIGMASHIFT_KEY = "minimaxh3_sigma_shift";
// Persistencia de sesión (ajustes + medios en IndexedDB)
const MINIMAXH3_SETTINGS_KEY = "minimaxh3_ui_settings_v1";
const MINIMAXH3_DB_NAME = "minimaxh3_media_db";
const MINIMAXH3_STORE_NAME = "slots";
let currentMode = "i2v"; // "i2v" | "flf2v" | "r2v"
let arMode = "auto"; // "auto" | "16:9"
let imageNativeAspectRatio = 16 / 9;
let rawInputImageWidth = 0;
let rawInputImageHeight = 0;
window.currentBatchMode = false;
let jobQueue = [];
let activeJob = null;
// Indica subida/preprocesado de refs en curso: durante ese tramo el backend
// puede estar vacío (ffmpeg) y la auto-recuperación NO debe dispararse.
let jobH3UploadInProgress = false;
let promptVariantMap = {};
const displayedGalleryFiles = new Set();
const displayedSlots = {};

// --- ATTENTION OPTIMIZATIONS (backend + sparse optimizer) ---
const ATTENTION_BACKEND_KEY = "minimaxh3_attention_backend";
const ATTENTION_OPTIMIZER_KEY = "minimaxh3_attention_optimizer";
const AIMDO_KEY = "minimaxh3_aimdo";
const BLOCK_SPARSE_KEY = "minimaxh3_block_sparse";

const ATTENTION_BACKEND_DEFAULTS = { backend: "comfy kitchen attention" };
const ATTENTION_OPTIMIZER_DEFAULTS = { mode: "none" };
const H3OPT_DEFAULTS = { sparseBackend: "auto", videoBudget: 0.30, denserEarlyLate: true, memOptEnabled: true };
const AIMDO_DEFAULTS = { residency: "0 blocks" };
  // Valores legibles en UI -> valores internos de ComfyUI BlockSparseAttention
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
  const BLOCK_SPARSE_DEFAULTS = { selection: "Sol-Attn (adaptive tau)", tau: 1.3, startPercent: 0.2, endPercent: 1.0, keepPercent: 20 };


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
  const none = $("segAttnNone"), h3 = $("segAttnH3"), bs = $("segAttnBlockSparse");
  if(h3?.classList.contains("on")) return { mode: "h3-optimizations" };
  if(bs?.classList.contains("on")) return { mode: "block-sparse" };
  return { mode: "none" };
}
function setAttentionOptimizerUI(mode){
  const none = $("segAttnNone"), h3 = $("segAttnH3"), bs = $("segAttnBlockSparse");
  none?.classList.toggle("on", mode === "none");
  h3?.classList.toggle("on", mode === "h3-optimizations");
  bs?.classList.toggle("on", mode === "block-sparse");
  const h3Panel = $("h3OptPanel"), bsPanel = $("blockSparsePanel");
  if(h3Panel) h3Panel.style.display = mode === "h3-optimizations" ? "" : "none";
  if(bsPanel) bsPanel.style.display = mode === "block-sparse" ? "" : "none";
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
    keepPercent: parseFloat($("vsaKeepPercent")?.value ?? "20"),
  };
}
function setBlockSparseUI(s){
  if($("blockSparseSelection")) $("blockSparseSelection").value = s.selection;
  if($("blockSparseTau")){ $("blockSparseTau").value = s.tau; $("blockSparseTauVal").textContent = parseFloat(s.tau).toFixed(2); }
  if($("blockSparseStart")){ $("blockSparseStart").value = s.startPercent; $("blockSparseStartVal").textContent = parseFloat(s.startPercent).toFixed(2); }
  if($("blockSparseEnd")){ $("blockSparseEnd").value = s.endPercent; $("blockSparseEndVal").textContent = parseFloat(s.endPercent).toFixed(2); }
  if($("vsaKeepPercent") && s.keepPercent != null){
    $("vsaKeepPercent").value = s.keepPercent;
    $("vsaKeepPercentVal").textContent = parseFloat(s.keepPercent).toFixed(1);
  }
  updateBlockSparseModeRows();
}
// Visibilidad de filas del panel según el modo VSA (nodo dedicado) vs Sol-Attn/SLA (combo):
// VSA solo usa keep_percent; tau/start/end son del DynamicCombo.
function updateBlockSparseModeRows(){
  const mode = BLOCK_SPARSE_MODES[$("blockSparseSelection")?.value] || "sol-attn";
  const isVsa = (mode === "vsa");
  if($("vsaKeepRow")) $("vsaKeepRow").style.display = isVsa ? "" : "none";
  if($("vsaTauRow")) $("vsaTauRow").style.display = isVsa ? "none" : "";
  if($("blockSparseStartRow")) $("blockSparseStartRow").style.display = isVsa ? "none" : "";
  if($("blockSparseEndRow")) $("blockSparseEndRow").style.display = isVsa ? "none" : "";
}

const _attentionBackendState = loadAttentionBackend();
const _attentionOptimizerState = loadAttentionOptimizer();
const _h3OptState = loadH3Opt();
const _aimdoState = loadAimdo();
const _blockSparseState = loadBlockSparse();
setAttentionBackendUI(_attentionBackendState);
setAttentionOptimizerUI(_attentionOptimizerState.mode);
setH3OptUI(_h3OptState);
setAimdoUI(_aimdoState);
setBlockSparseUI(_blockSparseState);

$("attentionBackend")?.addEventListener("change", () => { saveAttentionBackend(getAttentionBackendState()); scheduleSaveH3Settings(); });
$("unetSelect")?.addEventListener("change", () => scheduleSaveH3Settings());
$("clipSelect")?.addEventListener("change", () => scheduleSaveH3Settings());
$("vaeSelect")?.addEventListener("change", () => scheduleSaveH3Settings());
$("samplerName")?.addEventListener("change", () => scheduleSaveH3Settings());
$("schedulerName")?.addEventListener("change", () => scheduleSaveH3Settings());
$("filenamePrefix")?.addEventListener("input", () => scheduleSaveH3Settings());
$("refImageSize")?.addEventListener("change", () => scheduleSaveH3Settings());
$("batchSize")?.addEventListener("input", () => scheduleSaveH3Settings());
$("duration")?.addEventListener("input", () => { updateDurationHints(); scheduleSaveH3Settings(); });
$("frames")?.addEventListener("input", () => scheduleSaveH3Settings());
$("mpSlider")?.addEventListener("input", (e) => { if($("mpVal")) $("mpVal").textContent = parseFloat(e.target.value).toFixed(2); scheduleSaveH3Settings(); });
$("stepsSlider")?.addEventListener("input", (e) => { if($("stepsVal")) $("stepsVal").textContent = e.target.value; scheduleSaveH3Settings(); });
$("segRandom")?.addEventListener("click", () => { seedMode = "random"; $("seedVal").disabled = true; scheduleSaveH3Settings(); });
$("segFixed")?.addEventListener("click", () => { seedMode = "fixed"; $("seedVal").disabled = false; scheduleSaveH3Settings(); });
$("seedVal")?.addEventListener("input", () => scheduleSaveH3Settings());
$("segArAuto")?.addEventListener("click", () => { arMode = "auto"; saveArMode(arMode); scheduleSaveH3Settings(); recalcResolution(); });
$("segAr169")?.addEventListener("click", () => { arMode = "16:9"; saveArMode(arMode); scheduleSaveH3Settings(); recalcResolution(); });
$("prompt")?.addEventListener("input", () => scheduleSaveH3Settings());
$("segAttnNone")?.addEventListener("click", () => { setAttentionOptimizerUI("none"); saveAttentionOptimizer({mode:"none"}); scheduleSaveH3Settings(); });
$("segAttnH3")?.addEventListener("click", () => { setAttentionOptimizerUI("h3-optimizations"); saveAttentionOptimizer({mode:"h3-optimizations"}); scheduleSaveH3Settings(); });
$("segAttnBlockSparse")?.addEventListener("click", () => {
  setAttentionOptimizerUI("block-sparse");
  saveAttentionOptimizer({mode:"block-sparse"});
  if(typeof getSolH3State === "function" && getSolH3State().enabled){
    const s = getSolH3State();
    s.enabled = false;
    setSolH3UI(s);
    saveSolH3(s);
    if(typeof log === "function") log("ℹ️ Block Sparse activado: Sol-H3 desactivado automáticamente para evitar colisión de atención", "l-info");
  }
  scheduleSaveH3Settings();
});
$("h3SparseBackend")?.addEventListener("change", () => { saveH3Opt(getH3OptState()); scheduleSaveH3Settings(); });
$("h3VideoBudget")?.addEventListener("input", (e) => {
  const val = parseFloat(e.target.value);
  const pct = Math.round(val * 100);
  if($("h3VideoBudgetVal")) $("h3VideoBudgetVal").textContent = `${pct}%`;
  saveH3Opt(getH3OptState()); scheduleSaveH3Settings();
});
$("segDenserOn")?.addEventListener("click", () => { const s = getH3OptState(); s.denserEarlyLate = true; setH3OptUI(s); saveH3Opt(s); scheduleSaveH3Settings(); });
$("segDenserOff")?.addEventListener("click", () => { const s = getH3OptState(); s.denserEarlyLate = false; setH3OptUI(s); saveH3Opt(s); scheduleSaveH3Settings(); });
$("segMemOptOn")?.addEventListener("click", () => { const s = getH3OptState(); s.memOptEnabled = true; setH3OptUI(s); saveH3Opt(s); scheduleSaveH3Settings(); });
$("segMemOptOff")?.addEventListener("click", () => { const s = getH3OptState(); s.memOptEnabled = false; setH3OptUI(s); saveH3Opt(s); scheduleSaveH3Settings(); });
$("aimdoResidency")?.addEventListener("change", () => { saveAimdo(getAimdoState()); scheduleSaveH3Settings(); });
$("blockSparseSelection")?.addEventListener("change", () => { saveBlockSparse(getBlockSparseState()); updateBlockSparseModeRows(); scheduleSaveH3Settings(); });
$("vsaKeepPercent")?.addEventListener("input", (e) => { $("vsaKeepPercentVal").textContent = parseFloat(e.target.value).toFixed(1); saveBlockSparse(getBlockSparseState()); scheduleSaveH3Settings(); });
$("blockSparseTau")?.addEventListener("input", (e) => { $("blockSparseTauVal").textContent = parseFloat(e.target.value).toFixed(2); saveBlockSparse(getBlockSparseState()); scheduleSaveH3Settings(); });
$("blockSparseStart")?.addEventListener("input", (e) => { $("blockSparseStartVal").textContent = parseFloat(e.target.value).toFixed(2); saveBlockSparse(getBlockSparseState()); scheduleSaveH3Settings(); });
$("blockSparseEnd")?.addEventListener("input", (e) => { $("blockSparseEndVal").textContent = parseFloat(e.target.value).toFixed(2); saveBlockSparse(getBlockSparseState()); scheduleSaveH3Settings(); });

// --- PERSISTENCIA IndexedDB (medios) ---
function openMiniMaxH3MediaDB(){
  return new Promise((resolve, reject) => {
    if(!window.indexedDB){ reject(new Error("IndexedDB no disponible")); return; }
    const req = indexedDB.open(MINIMAXH3_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains(MINIMAXH3_STORE_NAME)){
        db.createObjectStore(MINIMAXH3_STORE_NAME, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbSaveMedia(key, data){
  try {
    const db = await openMiniMaxH3MediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MINIMAXH3_STORE_NAME, "readwrite");
      tx.objectStore(MINIMAXH3_STORE_NAME).put({ key, ...data });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch(e){ console.warn("Error guardando medio en IndexedDB:", e); }
}
async function dbDeleteMedia(key){
  try {
    const db = await openMiniMaxH3MediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MINIMAXH3_STORE_NAME, "readwrite");
      tx.objectStore(MINIMAXH3_STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch(e){ console.warn("Error borrando medio en IndexedDB:", e); }
}
async function dbGetAllMedia(){
  try {
    const db = await openMiniMaxH3MediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MINIMAXH3_STORE_NAME, "readonly");
      const req = tx.objectStore(MINIMAXH3_STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch(e){ console.warn("Error leyendo IndexedDB:", e); return []; }
}

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
$("segBitDepth8")?.addEventListener("click", () => { setBitDepthUI(8); saveBitDepth(8); scheduleSaveH3Settings(); });
$("segBitDepth10")?.addEventListener("click", () => { setBitDepthUI(10); saveBitDepth(10); scheduleSaveH3Settings(); });

// --- PERSISTENCIA DE SESIÓN (ajustes en localStorage, medios en IndexedDB) ---
let h3SaveTimer = null;
function scheduleSaveH3Settings(){
  clearTimeout(h3SaveTimer);
  h3SaveTimer = setTimeout(saveH3Settings, 350);
}
function saveH3Settings(){
  const s = {
    prompt: $("prompt")?.value || "",
    seedMode,
    seedValue: seedMode === "random" ? -1 : parseInt($("seedVal")?.value || "12345", 10),
    width: $("width")?.value || "1152",
    height: $("height")?.value || "640",
    duration: $("duration")?.value || "10",
    mp: $("mpSlider")?.value || "0.7",
    frames: $("frames")?.value || "243",
    unet: $("unetSelect")?.value || "",
    clip: $("clipSelect")?.value || "",
    vae: $("vaeSelect")?.value || "",
    samplerName: $("samplerName")?.value || "res_multistep",
    schedulerName: $("schedulerName")?.value || "simple",
    steps: $("stepsSlider")?.value || "20",
    bitDepth: getBitDepth(),
    filenamePrefix: $("filenamePrefix")?.value || "video/MiniMax_H3",
    mode: currentMode,
    refImageSize: $("refImageSize")?.value || "match",
    h3opt: getH3OptState(),
    sigmaShift: getSigmaShiftState(),
    spectrum: getSpectrumState(),
    latentUpscale: getLatentUpscaleState(),
    rife: getRifeState(),
    rtx: getRtxState(),
    attentionBackend: getAttentionBackendState(),
    attentionOptimizer: getAttentionOptimizerState(),
    aimdo: getAimdoState(),
    blockSparse: getBlockSparseState(),
    loras: JSON.parse(JSON.stringify(loras)),
    batchSize: parseInt($("batchSize")?.value || "1", 10),
    aspectRatio: currentAspectRatio,
    arMode,
  };
  try { localStorage.setItem(MINIMAXH3_SETTINGS_KEY, JSON.stringify(s)); }
  catch(e){ console.warn("Error guardando ajustes MiniMaxH3:", e); }
}
function restoreH3Settings(){
  const raw = localStorage.getItem(MINIMAXH3_SETTINGS_KEY);
  if(!raw) return false;
  try {
    const s = JSON.parse(raw);
    if(!s || typeof s !== "object") return false;
    if(s.prompt !== undefined && $("prompt")) $("prompt").value = s.prompt;
    if(s.seedMode){ seedMode = s.seedMode; if(seedMode === "random"){ $("segRandom")?.classList.add("on"); $("segFixed")?.classList.remove("on"); $("seedVal").disabled = true; } else { $("segFixed")?.classList.add("on"); $("segRandom")?.classList.remove("on"); $("seedVal").disabled = false; } }
    if(s.seedValue !== undefined && s.seedValue >= 0 && $("seedVal")) $("seedVal").value = s.seedValue;
    if(s.width !== undefined && $("width")) $("width").value = s.width;
    if(s.height !== undefined && $("height")) $("height").value = s.height;
    if(s.duration !== undefined && $("duration")){ $("duration").value = s.duration; updateDurationHints(); }
    if(s.mp !== undefined && $("mpSlider")){ $("mpSlider").value = s.mp; if($("mpVal")) $("mpVal").textContent = parseFloat(s.mp).toFixed(2); }
    if(s.frames !== undefined && $("frames")) $("frames").value = s.frames;
    if(s.unet && $("unetSelect")) $("unetSelect").value = s.unet;
    if(s.clip && $("clipSelect")) $("clipSelect").value = s.clip;
    if(s.vae && $("vaeSelect")) $("vaeSelect").value = s.vae;
    if(s.samplerName && $("samplerName")) $("samplerName").value = s.samplerName;
    if(s.schedulerName && $("schedulerName")) $("schedulerName").value = s.schedulerName;
    if(s.steps !== undefined && $("stepsSlider")){ $("stepsSlider").value = s.steps; $("stepsVal").textContent = s.steps; }
    if(s.bitDepth !== undefined) setBitDepthUI(s.bitDepth);
    if(s.filenamePrefix !== undefined && $("filenamePrefix")) $("filenamePrefix").value = s.filenamePrefix;
    if(s.h3opt){ setH3OptUI(s.h3opt); saveH3Opt(s.h3opt); }
    if(s.sigmaShift){ setSigmaShiftUI(s.sigmaShift); saveSigmaShift(s.sigmaShift); }
    if(s.spectrum){ setSpectrumUI(s.spectrum); saveSpectrum(s.spectrum); }
    if(s.latentUpscale){ setLatentUpscaleUI(s.latentUpscale); saveLatentUpscale(s.latentUpscale); }
    if(s.rife){ setRifeUI(s.rife); saveRife(s.rife); }
    if(s.rtx){ setRtxUI(s.rtx); saveRtx(s.rtx); }
    if(s.attentionBackend){ setAttentionBackendUI(s.attentionBackend); saveAttentionBackend(s.attentionBackend); }
    if(s.attentionOptimizer){ setAttentionOptimizerUI(s.attentionOptimizer.mode); saveAttentionOptimizer(s.attentionOptimizer); }
    if(s.aimdo){ setAimdoUI(s.aimdo); saveAimdo(s.aimdo); }
    if(s.blockSparse){ setBlockSparseUI(s.blockSparse); saveBlockSparse(s.blockSparse); }
    if(s.mode){ setModeUI(s.mode); }
    if(s.refImageSize && $("refImageSize")) $("refImageSize").value = s.refImageSize;
    if(s.batchSize !== undefined && $("batchSize")) $("batchSize").value = s.batchSize;
    if(s.arMode){ arMode = s.arMode; saveArMode(arMode); }
    if(s.aspectRatio) currentAspectRatio = s.aspectRatio;
    if(Array.isArray(s.loras) && s.loras.length){
      s.loras.forEach((l, i) => {
        if(i < loras.length && l) loras[i] = l;
      });
      renderLoras();
      saveLoraState();
    }
    return true;
  } catch(e){ console.warn("Error restaurando ajustes MiniMaxH3:", e); return false; }
}

// --- SIGMA SHIFT (MiniMax H3) ---
const SIGMASHIFT_DEFAULTS = { shiftVideo: 8.0, shiftAudio: 3.0 };
function loadSigmaShift(){
  try { return Object.assign({}, SIGMASHIFT_DEFAULTS, JSON.parse(localStorage.getItem(SIGMASHIFT_KEY) || "{}")); }
  catch(_) { return {...SIGMASHIFT_DEFAULTS}; }
}
function saveSigmaShift(s){ try { localStorage.setItem(SIGMASHIFT_KEY, JSON.stringify(s)); } catch(_){} }
function setSigmaShiftUI(s){
  if($("sigmaShiftVideo")){
    $("sigmaShiftVideo").value = s.shiftVideo;
    if($("sigmaShiftVideoVal")) $("sigmaShiftVideoVal").textContent = parseFloat(s.shiftVideo).toFixed(1);
  }
  if($("sigmaShiftAudio")){
    $("sigmaShiftAudio").value = s.shiftAudio;
    if($("sigmaShiftAudioVal")) $("sigmaShiftAudioVal").textContent = parseFloat(s.shiftAudio).toFixed(1);
  }
}
function getSigmaShiftState(){
  return {
    shiftVideo: parseFloat($("sigmaShiftVideo")?.value ?? "8.0"),
    shiftAudio: parseFloat($("sigmaShiftAudio")?.value ?? "3.0"),
  };
}
const _sigmaShiftState = loadSigmaShift();
setSigmaShiftUI(_sigmaShiftState);
$("sigmaShiftVideo")?.addEventListener("input", (e) => {
  const val = parseFloat(e.target.value);
  if($("sigmaShiftVideoVal")) $("sigmaShiftVideoVal").textContent = val.toFixed(1);
  const s = getSigmaShiftState(); s.shiftVideo = val; saveSigmaShift(s); scheduleSaveH3Settings();
});
$("sigmaShiftAudio")?.addEventListener("input", (e) => {
  const val = parseFloat(e.target.value);
  if($("sigmaShiftAudioVal")) $("sigmaShiftAudioVal").textContent = val.toFixed(1);
  const s = getSigmaShiftState(); s.shiftAudio = val; saveSigmaShift(s); scheduleSaveH3Settings();
});

// --- SPECTRUM (MiniMax H3) ---
const SPECTRUM_DEFAULTS = { enabled: true, blend: 0.5, flex: 0.75, warmup: 1, bootstrapFirstForecast: true, historyStorage: "vram" };
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
    historyStorage: $("spectrumHistoryStorage")?.value || "vram",
  };
}
const _spectrumState = loadSpectrum();
setSpectrumUI(_spectrumState);
$("segSpectrumOn")?.addEventListener("click", () => { const s = getSpectrumState(); s.enabled = true; setSpectrumUI(s); saveSpectrum(s); scheduleSaveH3Settings(); });
$("segSpectrumOff")?.addEventListener("click", () => { const s = getSpectrumState(); s.enabled = false; setSpectrumUI(s); saveSpectrum(s); scheduleSaveH3Settings(); });
$("spectrumBlend")?.addEventListener("input", (e) => { $("spectrumBlendVal").textContent = parseFloat(e.target.value).toFixed(2); const s = getSpectrumState(); s.blend = parseFloat(e.target.value); saveSpectrum(s); scheduleSaveH3Settings(); });
$("spectrumFlex")?.addEventListener("input", (e) => { $("spectrumFlexVal").textContent = parseFloat(e.target.value).toFixed(2); const s = getSpectrumState(); s.flex = parseFloat(e.target.value); saveSpectrum(s); scheduleSaveH3Settings(); });
$("spectrumWarmup")?.addEventListener("input", (e) => { $("spectrumWarmupVal").textContent = e.target.value; const s = getSpectrumState(); s.warmup = parseInt(e.target.value, 10); saveSpectrum(s); scheduleSaveH3Settings(); });
$("segBootstrapOn")?.addEventListener("click", () => { const s = getSpectrumState(); s.bootstrapFirstForecast = true; setSpectrumUI(s); saveSpectrum(s); scheduleSaveH3Settings(); });
$("segBootstrapOff")?.addEventListener("click", () => { const s = getSpectrumState(); s.bootstrapFirstForecast = false; setSpectrumUI(s); saveSpectrum(s); scheduleSaveH3Settings(); });
$("spectrumHistoryStorage")?.addEventListener("change", (e) => { const s = getSpectrumState(); s.historyStorage = e.target.value; saveSpectrum(s); scheduleSaveH3Settings(); });

// --- SOL-H3 ATTENTION (SM120 Blackwell) ---
const SOL_H3_KEY = "minimaxh3_sol_h3_state";
const SOL_H3_DEFAULTS = { enabled: false, exact_fusion: true, dense_evaluations: 1, dense_layers: 2, tau: 1.0 };
function loadSolH3(){
  try { return Object.assign({}, SOL_H3_DEFAULTS, JSON.parse(localStorage.getItem(SOL_H3_KEY) || "{}")); }
  catch(_) { return {...SOL_H3_DEFAULTS}; }
}
function saveSolH3(s){ try { localStorage.setItem(SOL_H3_KEY, JSON.stringify(s)); } catch(_){} }
function getSolH3State(){
  return {
    enabled: $("segSolH3On")?.classList.contains("on") ?? false,
    exact_fusion: $("segSolExactOn")?.classList.contains("on") ?? true,
    dense_evaluations: parseInt($("solDenseEvalSlider")?.value || "1", 10),
    dense_layers: parseInt($("solDenseLayersSlider")?.value || "2", 10),
    tau: parseFloat($("solTauSlider")?.value || "1.0")
  };
}
function setSolH3UI(s){
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
$("segSolH3On")?.addEventListener("click", () => {
  const s = getSolH3State();
  s.enabled = true;
  setSolH3UI(s);
  saveSolH3(s);
  if(typeof getAttentionOptimizerState === "function" && getAttentionOptimizerState().mode === "block-sparse"){
    setAttentionOptimizerUI("none");
    saveAttentionOptimizer({ mode: "none" });
    if(typeof log === "function") log("ℹ️ Sol-H3 activado: Block Sparse desactivado automáticamente para evitar colisión de atención", "l-info");
  }
  scheduleSaveH3Settings();
});
$("segSolH3Off")?.addEventListener("click", () => {
  const s = getSolH3State();
  s.enabled = false;
  setSolH3UI(s);
  saveSolH3(s);
  scheduleSaveH3Settings();
});
$("segSolExactOn")?.addEventListener("click", () => {
  const s = getSolH3State();
  s.exact_fusion = true;
  setSolH3UI(s);
  saveSolH3(s);
  scheduleSaveH3Settings();
});
$("segSolExactOff")?.addEventListener("click", () => {
  const s = getSolH3State();
  s.exact_fusion = false;
  setSolH3UI(s);
  saveSolH3(s);
  scheduleSaveH3Settings();
});
$("solDenseEvalSlider")?.addEventListener("input", (e) => {
  const de = parseInt(e.target.value, 10) || 0;
  if($("solDenseEvalVal")) $("solDenseEvalVal").textContent = de;
  if($("solDenseEvalHint")) $("solDenseEvalHint").textContent = (de === 0) ? "(0 = turbo, posible inestabilidad)" : `(${de} = estable)`;
  const s = getSolH3State();
  s.dense_evaluations = de;
  saveSolH3(s);
  scheduleSaveH3Settings();
});
$("solDenseLayersSlider")?.addEventListener("input", (e) => {
  const dl = parseInt(e.target.value, 10) || 0;
  if($("solDenseLayersVal")) $("solDenseLayersVal").textContent = dl;
  const s = getSolH3State();
  s.dense_layers = dl;
  saveSolH3(s);
  scheduleSaveH3Settings();
});
$("solTauSlider")?.addEventListener("input", (e) => {
  const tau = parseFloat(e.target.value) || 1.0;
  if($("solTauVal")) $("solTauVal").textContent = tau.toFixed(1);
  const s = getSolH3State();
  s.tau = tau;
  saveSolH3(s);
  scheduleSaveH3Settings();
});

// --- LATENT UPSCALER 3D (MiniMax H3) ---
const LATENT_UPSCALE_KEY = "minimaxh3_latent_upscale_state";
const LATENT_UPSCALE_DEFAULTS = {
  enabled: false,
  scale: 1.5,
  pass2: true,
  pass2Unet: "", // "" = "mismo que pase 1"
  pass2Lora: "h3/taomate_h3_3step_comfy.safetensors",
  pass2LoraStrength: 1.0,
  pass2Denoise: 0.60
};

function loadLatentUpscale(){
  try { return Object.assign({}, LATENT_UPSCALE_DEFAULTS, JSON.parse(localStorage.getItem(LATENT_UPSCALE_KEY) || "{}")); }
  catch(_) { return {...LATENT_UPSCALE_DEFAULTS}; }
}
function saveLatentUpscale(s){ try { localStorage.setItem(LATENT_UPSCALE_KEY, JSON.stringify(s)); } catch(_){} }
function getLatentUpscaleState(){
  return {
    enabled: $("segLatentUpscaleOn")?.classList.contains("on") ?? false,
    scale: parseFloat($("latentScaleSlider")?.value || "1.5"),
    pass2: $("segLatentPass2On")?.classList.contains("on") ?? true,
    pass2Unet: $("latentPass2Unet")?.value || "",
    pass2Lora: $("latentPass2Lora")?.value || "",
    pass2LoraStrength: parseFloat($("latentPass2LoraStrength")?.value || "1.0"),
    pass2Denoise: parseFloat($("latentPass2Denoise")?.value || "0.60")
  };
}
function checkLatentPass2Warnings(){
  const warn = $("latentPass2Warn");
  if(!warn) return;
  const unetVal = $("latentPass2Unet")?.value || $("unetSelect")?.value || "";
  const loraVal = $("latentPass2Lora")?.value || "";
  const isTurboUnet = /turbo|fasth3|8step|4step/i.test(unetVal);
  const isTurboLora = /turbo|step|acc|lightx2v|fast/i.test(loraVal);
  if(isTurboUnet && isTurboLora && loraVal !== ""){
    warn.textContent = "⚠️ El UNet ya es una variante destilada/Turbo y además tienes Turbo LoRA seleccionada. Si la imagen sale quemada o sobrecontrastada, desactiva la LoRA o usa modelo base.";
    warn.style.display = "";
  } else {
    warn.style.display = "none";
  }
}
function setLatentUpscaleUI(s){
  const on = $("segLatentUpscaleOn"), off = $("segLatentUpscaleOff");
  const panel = $("latentUpscaleControls");
  if(s.enabled){
    on?.classList.add("on"); off?.classList.remove("on");
    if(panel) panel.style.display = "";
  } else {
    off?.classList.add("on"); on?.classList.remove("on");
    if(panel) panel.style.display = "none";
  }
  if($("latentScaleSlider")){
    const sc = parseFloat(s.scale != null ? s.scale : 1.5);
    $("latentScaleSlider").value = sc;
    if($("latentScaleVal")) $("latentScaleVal").textContent = sc.toFixed(2) + "x";
    if($("latentScaleHint")) $("latentScaleHint").textContent = `(${sc.toFixed(2)}x)`;
  }

  // Pase 2
  const p2On = $("segLatentPass2On"), p2Off = $("segLatentPass2Off");
  const p2Controls = $("latentPass2Controls");
  const pass2Active = s.pass2 !== false;
  if(pass2Active){
    p2On?.classList.add("on"); p2Off?.classList.remove("on");
    if(p2Controls) p2Controls.style.display = "";
  } else {
    p2Off?.classList.add("on"); p2On?.classList.remove("on");
    if(p2Controls) p2Controls.style.display = "none";
  }
  if($("latentPass2Unet") && s.pass2Unet !== undefined){
    $("latentPass2Unet").value = s.pass2Unet;
  }
  if($("latentPass2Lora") && s.pass2Lora !== undefined){
    $("latentPass2Lora").value = s.pass2Lora;
  }
  if($("latentPass2LoraStrength")){
    const st = parseFloat(s.pass2LoraStrength != null ? s.pass2LoraStrength : 1.0);
    $("latentPass2LoraStrength").value = st;
    if($("latentPass2LoraStrengthVal")) $("latentPass2LoraStrengthVal").textContent = st.toFixed(2);
  }
  if($("latentPass2Denoise")){
    const d = parseFloat(s.pass2Denoise != null ? s.pass2Denoise : 0.60);
    $("latentPass2Denoise").value = d;
    if($("latentPass2DenoiseVal")) $("latentPass2DenoiseVal").textContent = d.toFixed(2);
  }
  checkLatentPass2Warnings();
}
const _latentUpscaleState = loadLatentUpscale();
setLatentUpscaleUI(_latentUpscaleState);
$("segLatentUpscaleOn")?.addEventListener("click", () => {
  const s = getLatentUpscaleState();
  s.enabled = true;
  setLatentUpscaleUI(s);
  saveLatentUpscale(s);
  scheduleSaveH3Settings();
  if(typeof recalcResolution === "function") recalcResolution();
});
$("segLatentUpscaleOff")?.addEventListener("click", () => {
  const s = getLatentUpscaleState();
  s.enabled = false;
  setLatentUpscaleUI(s);
  saveLatentUpscale(s);
  scheduleSaveH3Settings();
  if(typeof recalcResolution === "function") recalcResolution();
});
$("latentScaleSlider")?.addEventListener("input", (e) => {
  const sc = parseFloat(e.target.value) || 1.5;
  if($("latentScaleVal")) $("latentScaleVal").textContent = sc.toFixed(2) + "x";
  if($("latentScaleHint")) $("latentScaleHint").textContent = `(${sc.toFixed(2)}x)`;
  const s = getLatentUpscaleState();
  s.scale = sc;
  saveLatentUpscale(s);
  if(typeof recalcResolution === "function") recalcResolution();
  scheduleSaveH3Settings();
});
$("segLatentPass2On")?.addEventListener("click", () => {
  const s = getLatentUpscaleState();
  s.pass2 = true;
  setLatentUpscaleUI(s);
  saveLatentUpscale(s);
  scheduleSaveH3Settings();
});
$("segLatentPass2Off")?.addEventListener("click", () => {
  const s = getLatentUpscaleState();
  s.pass2 = false;
  setLatentUpscaleUI(s);
  saveLatentUpscale(s);
  scheduleSaveH3Settings();
});
$("latentPass2Unet")?.addEventListener("change", () => {
  const s = getLatentUpscaleState();
  saveLatentUpscale(s);
  checkLatentPass2Warnings();
  scheduleSaveH3Settings();
});
$("latentPass2Lora")?.addEventListener("change", () => {
  const s = getLatentUpscaleState();
  saveLatentUpscale(s);
  checkLatentPass2Warnings();
  scheduleSaveH3Settings();
});
$("latentPass2LoraStrength")?.addEventListener("input", (e) => {
  const st = parseFloat(e.target.value) || 1.0;
  if($("latentPass2LoraStrengthVal")) $("latentPass2LoraStrengthVal").textContent = st.toFixed(2);
  const s = getLatentUpscaleState();
  s.pass2LoraStrength = st;
  saveLatentUpscale(s);
  scheduleSaveH3Settings();
});
$("latentPass2Denoise")?.addEventListener("input", (e) => {
  const d = parseFloat(e.target.value) || 0.60;
  if($("latentPass2DenoiseVal")) $("latentPass2DenoiseVal").textContent = d.toFixed(2);
  const s = getLatentUpscaleState();
  s.pass2Denoise = d;
  saveLatentUpscale(s);
  scheduleSaveH3Settings();
});

// --- FRAME INTERPOLATION (RIFE / RTX FRAME GEN) ---
const RIFE_KEY = "minimaxh3_rife_state";
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
  if($("rifeModel") && r.model) $("rifeModel").value = r.model;
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
const _rifeState = loadRife();
setRifeUI(_rifeState);
$("segRifeOn")?.addEventListener("click", () => { const r = getRifeState(); r.enabled = true; setRifeUI(r); saveRife(r); scheduleSaveH3Settings(); });
$("segRifeOff")?.addEventListener("click", () => { const r = getRifeState(); r.enabled = false; setRifeUI(r); saveRife(r); scheduleSaveH3Settings(); });
$("rifeEngine")?.addEventListener("change", (e) => {
  const engine = e.target.value;
  toggleRifeEngineUI(engine);
  const r = getRifeState(); r.engine = engine; saveRife(r); scheduleSaveH3Settings();
});
$("rifeMultiplier")?.addEventListener("change", (e) => {
  const mult = parseInt(e.target.value, 10);
  if($("rifeFpsHint")) $("rifeFpsHint").textContent = `(24fps → ${24 * mult}fps)`;
  const r = getRifeState(); r.multiplier = mult; saveRife(r); scheduleSaveH3Settings();
});
$("rifeModel")?.addEventListener("change", (e) => { const r = getRifeState(); r.model = e.target.value; saveRife(r); scheduleSaveH3Settings(); });

// --- RTX VIDEO SUPER RESOLUTION (2x) ---
const RTX_KEY = "minimaxh3_rtx_state";
const RTX_DEFAULTS = { enabled: true, quality: "HIGHBITRATE_ULTRA" };
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
}
function getRtxState(){
  return {
    enabled: $("segRtxOn")?.classList.contains("on") ?? true,
    quality: $("rtxQuality")?.value || "ULTRA"
  };
}
const _rtxState = loadRtx();
setRtxUI(_rtxState);
$("segRtxOn")?.addEventListener("click", () => {
  const r = getRtxState();
  r.enabled = true;
  setRtxUI(r);
  saveRtx(r);
  scheduleSaveH3Settings();
  if(typeof recalcResolution === "function") recalcResolution();
});
$("segRtxOff")?.addEventListener("click", () => {
  const r = getRtxState();
  r.enabled = false;
  setRtxUI(r);
  saveRtx(r);
  scheduleSaveH3Settings();
  if(typeof recalcResolution === "function") recalcResolution();
});
$("rtxQuality")?.addEventListener("change", () => {
  const r = getRtxState();
  saveRtx(r);
  scheduleSaveH3Settings();
});

// --- FACE REFINE (ComfyUI-H3-FaceRefine) ---
const FACEREFINE_KEY = "minimaxh3_facerefine_state";
const FACEREFINE_DEFAULTS = {
  enabled: false,
  denoise: 0.35,
  feather: 16,
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
    denoise: parseFloat($("faceRefineDenoiseSlider")?.value || "0.35"),
    feather: parseInt($("faceRefineFeatherSlider")?.value || "16", 10),
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
}
const _faceRefineState = loadFaceRefine();
setFaceRefineUI(_faceRefineState);
$("segFaceRefineOn")?.addEventListener("click", () => {
  const s = getFaceRefineState();
  s.enabled = true;
  setFaceRefineUI(s);
  saveFaceRefine(s);
  scheduleSaveH3Settings();
});
$("segFaceRefineOff")?.addEventListener("click", () => {
  const s = getFaceRefineState();
  s.enabled = false;
  setFaceRefineUI(s);
  saveFaceRefine(s);
  scheduleSaveH3Settings();
});
$("faceRefineDenoiseSlider")?.addEventListener("input", (e) => {
  const d = parseFloat(e.target.value) || 0.35;
  if($("faceRefineDenoiseVal")) $("faceRefineDenoiseVal").textContent = d.toFixed(2);
  if($("faceRefineDenoiseHint")) $("faceRefineDenoiseHint").textContent = `(${d.toFixed(2)})`;
  const s = getFaceRefineState();
  s.denoise = d;
  saveFaceRefine(s);
  scheduleSaveH3Settings();
});
$("faceRefineFeatherSlider")?.addEventListener("input", (e) => {
  const f = parseInt(e.target.value, 10) || 16;
  if($("faceRefineFeatherVal")) $("faceRefineFeatherVal").textContent = f + " px";
  if($("faceRefineFeatherHint")) $("faceRefineFeatherHint").textContent = `(${f} px)`;
  const s = getFaceRefineState();
  s.feather = f;
  saveFaceRefine(s);
  scheduleSaveH3Settings();
});
$("faceRefineSelectMode")?.addEventListener("change", (e) => {
  const s = getFaceRefineState();
  s.select = e.target.value;
  saveFaceRefine(s);
  scheduleSaveH3Settings();
});

// --- MODO i2v / flf2v / r2v ---
function setModeUI(mode){
  currentMode = mode;
  const i2v = $("segI2V"), flf = $("segFLF2V"), r2v = $("segR2V");
  const lastPanel = $("lastFramePanel");
  const r2vPanel = $("r2vPanel");
  const startPanel = $("startImagePanel");
  const hint = $("modeHint");
  i2v?.classList.remove("on"); flf?.classList.remove("on"); r2v?.classList.remove("on");
  if(mode === "flf2v"){
    flf?.classList.add("on");
    if(lastPanel) lastPanel.style.display = "";
    if(r2vPanel) r2vPanel.style.display = "none";
    if(startPanel) startPanel.style.display = "";
    if(hint) hint.textContent = "1er frame + último frame → vídeo.";
  } else if(mode === "r2v"){
    r2v?.classList.add("on");
    if(lastPanel) lastPanel.style.display = "none";
    if(r2vPanel) r2vPanel.style.display = "";
    if(startPanel) startPanel.style.display = "none";
    if(hint) hint.textContent = "Referencias (imágenes/vídeos/audios) → vídeo.";
  } else {
    i2v?.classList.add("on");
    if(lastPanel) lastPanel.style.display = "none";
    if(r2vPanel) r2vPanel.style.display = "none";
    if(startPanel) startPanel.style.display = "";
    if(hint) hint.textContent = "Imagen de inicio → vídeo.";
  }
  if(mode !== "r2v"){
    const firstImg = $("inputImg");
    if(firstImg && firstImg.naturalWidth && firstImg.naturalHeight && firstImg.style.display !== "none"){
      rawInputImageWidth = firstImg.naturalWidth;
      rawInputImageHeight = firstImg.naturalHeight;
      imageNativeAspectRatio = firstImg.naturalWidth / firstImg.naturalHeight;
      if(arMode !== "16:9") setArModeUI("auto");
      else recalcResolution();
    }
  }
  try { localStorage.setItem(MODE_KEY, mode); } catch(_){}
  scheduleSaveH3Settings();
}
function loadMode(){
  try { return localStorage.getItem(MODE_KEY) || "i2v"; } catch(_){ return "i2v"; }
}
// El modo se restaura desde restoreH3Settings() si hay sesión guardada.
// Si no hay sesión, aplicamos el modo por defecto guardado en MODE_KEY.
if(!localStorage.getItem(MINIMAXH3_SETTINGS_KEY)){
  setModeUI(loadMode());
}
$("segI2V")?.addEventListener("click", () => { setModeUI("i2v"); scheduleSaveH3Settings(); });
$("segFLF2V")?.addEventListener("click", () => { setModeUI("flf2v"); scheduleSaveH3Settings(); });
$("segR2V")?.addEventListener("click", () => { setModeUI("r2v"); scheduleSaveH3Settings(); });

// --- MODO R2V: REFERENCIAS ---
const R2V_MAX_IMAGES = 6;
const R2V_MAX_VIDEOS = 3;
const R2V_MAX_AUDIOS = 3;
let refImages = [];          // [{local, uploaded, idx}] reordenables (6)
let refVideos = [];          // [{local, uploaded, useAudio, settings}] (3)
let refAudios = [];          // [{local, uploaded, volume}] (3)

function refImageState(i){ return { local: null, uploaded: null, idx: i }; }
function refVideoState(i){ return { file: null, local: null, uploaded: null, audioUploaded: null, useAudio: false, volume: 1.0, settings: { scale: 1, arLock: true, trimStart: "", trimEnd: "", skip: 1 }, idx: i }; }
function refAudioState(i){ return { local: null, uploaded: null, volume: 1.0, idx: i }; }

for(let i = 0; i < R2V_MAX_IMAGES; i++) refImages.push(refImageState(i));
for(let i = 0; i < R2V_MAX_VIDEOS; i++) refVideos.push(refVideoState(i));
for(let i = 0; i < R2V_MAX_AUDIOS; i++) refAudios.push(refAudioState(i));

renderR2V();

// --- RENDER de la malla de imágenes de referencia ---
function updateR2VAspectFromFirstRef(){
  // En modo r2v, el aspect ratio se deriva de la primera imagen de referencia disponible.
  if(currentMode !== "r2v") return;
  const first = refImages.find(r => r.local);
  if(!first || !first.local) return;
  const img = new Image();
  img.onload = () => {
    rawInputImageWidth = img.naturalWidth;
    rawInputImageHeight = img.naturalHeight;
    imageNativeAspectRatio = img.naturalWidth / img.naturalHeight;
    if(arMode !== "16:9"){
      // Mantenemos auto pero recalculamos resolución con el nuevo aspecto nativo.
      recalcResolution();
      updateArLabel(rawInputImageWidth, rawInputImageHeight);
    } else {
      updateArLabel(rawInputImageWidth, rawInputImageHeight);
    }
  };
  img.src = first.local;
}

function renderRefImages(){
  const grid = $("refImgGrid");
  if(!grid) return;
  grid.innerHTML = "";
  refImages.forEach((ref, i) => {
    const slot = document.createElement("div");
    slot.className = "ref-slot";
    slot.dataset.refIdx = i;
    slot.draggable = true;
    const del = document.createElement("button");
    del.className = "ref-del";
    del.textContent = "×";
    del.title = "Quitar imagen";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      ref.local = null; ref.uploaded = null;
      dbDeleteMedia(`refImg_${i}`).catch(()=>{});
      renderRefImages();
      updateR2VAspectFromFirstRef();
    });
    const idx = document.createElement("span");
    idx.className = "ref-idx";
    idx.textContent = `P${i+1}`;
    slot.appendChild(del);
    slot.appendChild(idx);
    if(ref.local){
      const img = document.createElement("img");
      img.src = ref.local;
      img.alt = `Ref ${i+1}`;
      slot.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "ph";
      ph.textContent = "imagen " + (i+1) + " o arrastra";
      slot.appendChild(ph);
    }
    slot.addEventListener("click", () => {
      const inp = $("r2vImgInput");
      if(inp){ inp.dataset.target = i; inp.click(); }
    });
    // drag&drop para reordenar
    slot.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", String(i));
      slot.classList.add("dragging");
    });
    slot.addEventListener("dragend", () => slot.classList.remove("dragging"));
    slot.addEventListener("dragover", (e) => { e.preventDefault(); slot.classList.add("drag"); });
    slot.addEventListener("dragleave", () => slot.classList.remove("drag"));
    slot.addEventListener("drop", (e) => {
      e.preventDefault(); e.stopPropagation();
      slot.classList.remove("drag");
      // Archivo arrastrado del SO
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if(file && file.type.startsWith("image/")){
        const reader = new FileReader();
        reader.onload = (ev) => {
          refImages[i].local = ev.target.result;
          refImages[i].uploaded = null;
          dbSaveMedia(`refImg_${i}`, { kind: "dataUrl", name: file.name || "", data: ev.target.result });
          renderRefImages();
          updateR2VAspectFromFirstRef();
          log(`🖼️ Imagen de referencia ${i+1}: ${file.name}`, "l-ok");
        };
        reader.readAsDataURL(file);
        return;
      }
      // Imagen arrastrada desde "Krea2 recientes" u otra UI (URL/dataset, sin File).
      const custom = e.dataTransfer.getData(LTXV_MEDIA_MIME);
      const plain = e.dataTransfer.getData("text/plain");
      if(custom || (plain && plain !== String(i))){
        let media = null;
        if(custom){ try { media = JSON.parse(custom); } catch(_){ media = null; } }
        // Descargar la imagen del backend y asignarla al slot.
        const url = (media && !String(media.filename||"").startsWith("data:"))
          ? mediaViewUrl(media, { anchor: "" })
          : (plain && plain.startsWith("http")) ? plain : null;
        if(url){
          fetch(url).then(async r => {
            if(!r.ok) throw new Error("HTTP "+r.status);
            const blob = await r.blob();
            const filename = (media && media.filename) || url.split("/").pop().split("?")[0] || "krea2.png";
            const reader = new FileReader();
            reader.onload = (ev) => {
              refImages[i].local = ev.target.result;
              refImages[i].uploaded = null;
              dbSaveMedia(`refImg_${i}`, { kind: "dataUrl", name: filename, data: ev.target.result });
              renderRefImages();
              updateR2VAspectFromFirstRef();
              log(`🖼️ Imagen de referencia ${i+1} (Krea2): ${filename}`, "l-ok");
            };
            reader.readAsDataURL(blob);
          }).catch(err => log(`❌ No se pudo cargar la imagen arrastrada: ${err.message}`, "l-err"));
          return;
        }
        // dataURL embebido (historial IndexedDB de Krea2)
        if(media && media._dataUrl && media._dataUrl.startsWith("data:")){
          refImages[i].local = media._dataUrl;
          refImages[i].uploaded = null;
          dbSaveMedia(`refImg_${i}`, { kind: "dataUrl", name: media.filename || "", data: media._dataUrl });
          renderRefImages();
          updateR2VAspectFromFirstRef();
          log(`🖼️ Imagen de referencia ${i+1} (Krea2)`, "l-ok");
          return;
        }
      }
      // Reordenar entre slots (text/plain = índice del slot origen)
      const from = parseInt(plain, 10);
      if(!isNaN(from) && from !== i && plain === String(from)){
        const tmp = refImages[from]; refImages[from] = refImages[i]; refImages[i] = tmp;
        renderRefImages();
        updateR2VAspectFromFirstRef();
      }
    });
    grid.appendChild(slot);
  });
  const countEl = $("r2vImagesCount");
  if(countEl){
    const active = refImages.filter(r => r.local).length;
    countEl.textContent = active ? `(${active}/6)` : "";
  }
}

// --- input único para imágenes r2v ---
const r2vImgInput = document.createElement("input");
r2vImgInput.type = "file";
r2vImgInput.accept = "image/*";
r2vImgInput.style.display = "none";
r2vImgInput.id = "r2vImgInput";
document.body.appendChild(r2vImgInput);
r2vImgInput.addEventListener("change", () => {
  const f = r2vImgInput.files && r2vImgInput.files[0];
  const target = parseInt(r2vImgInput.dataset.target || "0", 10);
  if(!f) return;
  if(!refImages[target]) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      refImages[target].local = e.target.result;
      refImages[target].uploaded = null;
      dbSaveMedia(`refImg_${target}`, { kind: "dataUrl", name: f.name || "", data: e.target.result });
      renderRefImages();
      updateR2VAspectFromFirstRef();
      log(`🖼️ Imagen de referencia ${target+1}: ${f.name}`, "l-ok");
    };
    reader.readAsDataURL(f);
  });

// --- RENDER de vídeos de referencia ---
function renderRefVideos(){
  const wrap = $("refVideoList");
  if(!wrap) return;
  wrap.innerHTML = "";
  refVideos.forEach((ref, i) => {
    const card = document.createElement("div");
    card.className = "ref-video-card";
    const prev = document.createElement("div");
    prev.className = "ref-video-preview";
    prev.innerHTML = ref.local
      ? `<video src="${ref.local}" muted loop playsinline></video>`
      : `<div class="ph">vídeo ${i+1} — arrastra o clic</div>`;
    prev.addEventListener("click", () => {
      const inp = $("r2vVideoInput" + i);
      if(inp) inp.click();
    });
    ["dragenter","dragover"].forEach(ev => prev.addEventListener(ev, e => { e.preventDefault(); prev.classList.add("drag"); }));
    ["dragleave","drop"].forEach(ev => prev.addEventListener(ev, e => { e.preventDefault(); prev.classList.remove("drag"); }));
    prev.addEventListener("drop", (e) => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if(f && f.type.startsWith("video/")){
        if(ref.local) URL.revokeObjectURL(ref.local);
        ref.file = f; ref.local = URL.createObjectURL(f);
        ref.uploaded = null; ref.audioUploaded = null;
        dbSaveMedia(`refVid_${i}`, { kind: "file", name: f.name || "", type: f.type || "video/mp4" }).catch(()=>{});
        renderRefVideos();
        log(`🎬 Vídeo de referencia ${i+1}: ${f.name}`, "l-ok");
      }
    });
    const del = document.createElement("button");
    del.className = "ref-del";
    del.textContent = "×";
    del.title = "Quitar vídeo";
    del.style.display = "block";
    del.style.position = "absolute";
    del.style.top = "2px"; del.style.right = "2px";
    prev.appendChild(del);
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      if(ref.local) URL.revokeObjectURL(ref.local);
      ref.file = null; ref.local = null; ref.uploaded = null; ref.audioUploaded = null;
      ref.settings = refVideoState(i).settings;
      dbDeleteMedia(`refVid_${i}`).catch(()=>{});
      renderRefVideos();
    });

    // controles de preprocesado
    const ctrl = document.createElement("div");
    ctrl.className = "ref-video-controls";
    ctrl.innerHTML = `
      <div class="preset-row"><label>Escala</label>
        <select class="r2v-scale">
          <option value="1" ${ref.settings.scale===1?"selected":""}>1x (original)</option>
          <option value="0.5" ${ref.settings.scale===0.5?"selected":""}>0.5x</option>
          <option value="0.25" ${ref.settings.scale===0.25?"selected":""}>0.25x</option>
        </select>
        <label style="min-width:auto;">A/R lock</label>
        <input type="checkbox" class="r2v-ar" ${ref.settings.arLock?"checked":""}>
      </div>
      <div class="preset-row"><label>Trim inicio (s)</label><input type="number" class="r2v-trims" min="0" step="0.1" value="${ref.settings.trimStart}" placeholder="0"></div>
      <div class="preset-row"><label>Trim fin (s)</label><input type="number" class="r2v-trime" min="0" step="0.1" value="${ref.settings.trimEnd}" placeholder="dur"></div>
      <div class="preset-row"><label>Skip frames</label>
        <select class="r2v-skip">
          <option value="1" ${ref.settings.skip===1?"selected":""}>1 (ninguno)</option>
          <option value="2" ${ref.settings.skip===2?"selected":""}>2</option>
          <option value="4" ${ref.settings.skip===4?"selected":""}>4</option>
        </select>
      </div>
      <div class="preset-row"><label>Volumen audio</label><input type="number" class="r2v-vol" min="0" step="0.1" value="${ref.volume}"></div>
      <div class="preset-row"><label>Usar su audio</label><input type="checkbox" class="r2v-useaudio" ${ref.useAudio?"checked":""}></div>
      <div class="preset-row"><button class="ghost mini-btn r2v-apply">Preparar vídeo</button><span class="ref-status"></span></div>
    `;
    // recoger settings en el botón
    ctrl.querySelector(".r2v-apply").addEventListener("click", () => {
      ref.settings.scale = parseFloat(ctrl.querySelector(".r2v-scale").value) || 1;
      ref.settings.arLock = ctrl.querySelector(".r2v-ar").checked;
      ref.settings.trimStart = ctrl.querySelector(".r2v-trims").value;
      ref.settings.trimEnd = ctrl.querySelector(".r2v-trime").value;
      ref.settings.skip = parseInt(ctrl.querySelector(".r2v-skip").value, 10) || 1;
      ref.volume = parseFloat(ctrl.querySelector(".r2v-vol").value) || 1.0;
      ref.useAudio = ctrl.querySelector(".r2v-useaudio").checked;
      prepareRefVideo(i);
    });
    const volInp = ctrl.querySelector(".r2v-vol");
    volInp.addEventListener("input", () => { ref.volume = parseFloat(volInp.value) || 1.0; });
    const uaInp = ctrl.querySelector(".r2v-useaudio");
    uaInp.addEventListener("change", () => { ref.useAudio = uaInp.checked; });

    card.appendChild(prev);
    card.appendChild(ctrl);
    wrap.appendChild(card);

    // input file para este vídeo
    if(!$("r2vVideoInput" + i)){
      const inp = document.createElement("input");
      inp.type = "file"; inp.id = "r2vVideoInput" + i; inp.accept = "video/*";
      inp.style.display = "none";
      document.body.appendChild(inp);
      inp.addEventListener("change", () => {
        const f = inp.files && inp.files[0];
        if(!f) return;
        if(ref.local) URL.revokeObjectURL(ref.local);
        ref.file = f;
        ref.local = URL.createObjectURL(f);
        ref.uploaded = null; ref.audioUploaded = null;
        dbSaveMedia(`refVid_${i}`, { kind: "file", name: f.name || "", type: f.type || "video/mp4" }).catch(()=>{});
        renderRefVideos();
        log(`🎬 Vídeo de referencia ${i+1}: ${f.name}`, "l-ok");
      });
    }
  });
  const countEl = $("r2vVideosCount");
  if(countEl){
    const active = refVideos.filter(r => r.local).length;
    countEl.textContent = active ? `(${active}/3)` : "";
  }
}

// --- RENDER de audios de referencia ---
function renderRefAudios(){
  const grid = $("refAudioGrid");
  if(!grid) return;
  grid.innerHTML = "";
  refAudios.forEach((ref, i) => {
    const slot = document.createElement("div");
    slot.className = "ref-slot";
    const del = document.createElement("button");
    del.className = "ref-del"; del.textContent = "×";
    del.title = "Quitar audio";
    del.addEventListener("click", (e) => { e.stopPropagation(); ref.local=null; ref.uploaded=null; dbDeleteMedia(`refAud_${i}`).catch(()=>{}); renderRefAudios(); });
    const idx = document.createElement("span"); idx.className="ref-idx"; idx.textContent = `A${i+1}`;
    const ph = document.createElement("div");
    ph.className = "ph"; ph.textContent = ref.local ? (ref.local.name || "audio") : "audio " + (i+1);
    const volRow = document.createElement("div");
    volRow.style.cssText = "display:flex;align-items:center;gap:4px;padding:4px;font-size:9px;color:var(--muted);";
    volRow.innerHTML = `<span>vol</span>`;
    const volInp = document.createElement("input");
    volInp.type = "number"; volInp.min = "0"; volInp.step = "0.1"; volInp.value = ref.volume;
    volInp.style.cssText = "width:44px;font-size:10px;";
    volInp.addEventListener("input", () => { ref.volume = parseFloat(volInp.value) || 1.0; });
    volRow.appendChild(volInp);
    slot.appendChild(del); slot.appendChild(idx); slot.appendChild(ph); slot.appendChild(volRow);
    slot.addEventListener("click", () => {
      const inp = $("r2vAudioInput" + i);
      if(inp) inp.click();
    });
    ["dragenter","dragover"].forEach(ev => slot.addEventListener(ev, e => { e.preventDefault(); slot.classList.add("drag"); }));
    ["dragleave","drop"].forEach(ev => slot.addEventListener(ev, e => { e.preventDefault(); slot.classList.remove("drag"); }));
    slot.addEventListener("drop", (e) => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if(f && f.type.startsWith("audio/")){
        ref.local = f; ref.uploaded = null;
        dbSaveMedia(`refAud_${i}`, { kind: "file", name: f.name || "", type: f.type || "audio/mpeg" }).catch(()=>{});
        renderRefAudios();
        log(`🎵 Audio de referencia ${i+1}: ${f.name}`, "l-ok");
      }
    });
    grid.appendChild(slot);
    if(!$("r2vAudioInput" + i)){
      const inp = document.createElement("input");
      inp.type = "file"; inp.id = "r2vAudioInput" + i; inp.accept = "audio/*";
      inp.style.display = "none";
      document.body.appendChild(inp);
      inp.addEventListener("change", () => {
        const f = inp.files && inp.files[0];
        if(!f) return;
        ref.local = f; ref.uploaded = null;
        dbSaveMedia(`refAud_${i}`, { kind: "file", name: f.name || "", type: f.type || "audio/mpeg" }).catch(()=>{});
        renderRefAudios();
        log(`🎵 Audio de referencia ${i+1}: ${f.name}`, "l-ok");
      });
    }
  });
  const countEl = $("r2vAudiosCount");
  if(countEl){
    const active = refAudios.filter(r => r.local).length;
    countEl.textContent = active ? `(${active}/3)` : "";
  }
}

function renderR2V(){
  renderRefImages();
  renderRefVideos();
  renderRefAudios();
}

// --- PREPARAR vídeo de referencia (ffmpeg backend) ---
async function prepareRefVideo(i){
  const ref = refVideos[i];
  const statusEl = document.querySelectorAll(".ref-video-card")[i]?.querySelector(".ref-status");
  if(!ref || !ref.file){
    if(statusEl) statusEl.textContent = "Sin vídeo";
    return;
  }
  if(statusEl) statusEl.textContent = "Preparando...";
  const fd = new FormData();
  fd.append("image", ref.file, ref.file.name || ("ref_video_"+i+".mp4"));
  fd.append("scale", String(ref.settings.scale));
  fd.append("ar_lock", ref.settings.arLock ? "true" : "false");
  fd.append("trim_start", ref.settings.trimStart || "");
  fd.append("trim_end", ref.settings.trimEnd || "");
  fd.append("skip_frames", String(ref.settings.skip));
  fd.append("use_audio", ref.useAudio ? "true" : "false");
  fd.append("volume", String(ref.volume));
  try {
    const r = await fetch("/api/video_preprocess", { method: "POST", body: fd, signal: AbortSignal.timeout(600000) });
    if(!r.ok){ const t = await r.text().catch(()=>""); throw new Error("HTTP "+r.status+" "+t.slice(0,150)); }
    const d = await r.json();
    ref.uploaded = d.video || null;
    ref.audioUploaded = d.audio || null;
    if(statusEl) statusEl.textContent = ref.uploaded ? "✅ " + ref.uploaded.name : "⚠️ sin resultado";
    log(`🎬 Vídeo de referencia ${i+1} preparado: ${ref.uploaded ? ref.uploaded.name : "—"}${ref.audioUploaded ? " (+audio)" : ""}`, "l-ok");
  } catch(err){
    if(statusEl) statusEl.textContent = "❌ " + (err.message || err);
    log("❌ Error preparando vídeo ref: "+err.message, "l-err");
  }
}

// --- ASPECT RATIO MODE (Auto vs Forzar 16:9) ---
const AR_MODE_KEY = "minimaxh3_ar_mode";

function updateArLabel(w, h){
  const auto = $("segArAuto");
  const hint = $("arDetectHint");
  const currentRatio = (w && h) ? getFriendlyRatio(w, h) : getFriendlyRatio(16, 9);
  if(auto){
    auto.textContent = (w && h) ? `Auto (${currentRatio})` : "Auto (Imagen)";
  }
  if(hint){
    hint.textContent = (arMode === "16:9") ? `(Forzado 16:9 · Original: ${currentRatio})` : `(${currentRatio}${w && h ? ` · ${w}×${h}` : ''})`;
  }
}

function loadArMode(){
  try { return localStorage.getItem(AR_MODE_KEY) || "auto"; } catch(_){ return "auto"; }
}
function saveArMode(m){
  try { localStorage.setItem(AR_MODE_KEY, m); } catch(_){}
}
function setArModeUI(mode){
  arMode = mode;
  const auto = $("segArAuto"), f169 = $("segAr169");
  if(mode === "16:9"){
    f169?.classList.add("on"); auto?.classList.remove("on");
  } else {
    auto?.classList.add("on"); f169?.classList.remove("on");
    const firstImg = $("inputImg");
    if(firstImg && firstImg.naturalWidth && firstImg.naturalHeight && firstImg.style.display !== "none"){
      rawInputImageWidth = firstImg.naturalWidth;
      rawInputImageHeight = firstImg.naturalHeight;
      imageNativeAspectRatio = firstImg.naturalWidth / firstImg.naturalHeight;
    }
  }
  recalcResolution();
  saveArMode(mode);
}
setArModeUI(loadArMode());
$("segArAuto")?.addEventListener("click", () => setArModeUI("auto"));
$("segAr169")?.addEventListener("click", () => setArModeUI("16:9"));

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
CONFIG.variantMeta = function(seedValue, timeText){
  const s = getSpectrumState();
  const r = getRifeState();
  const lu = getLatentUpscaleState();
  const w = parseInt($("width")?.value || "1120", 10);
  const he = parseInt($("height")?.value || "640", 10);
  const unet = ($("unetSelect")?.value || BASE_GRAPH?.[N.UNET]?.inputs?.unet_name || "").split('/').pop() || "";
  const clip = ($("clipSelect")?.value || BASE_GRAPH?.[N.CLIP]?.inputs?.clip_name || "").split('/').pop() || "";
  const vae = ($("vaeSelect")?.value || BASE_GRAPH?.[N.VAE_VIDEO]?.inputs?.vae_name || "").split('/').pop() || "";
  const activeLoras = loras.filter(l => l.on && l.lora).map(l => `${l.lora.split('/').pop()} (${Number(l.strength).toFixed(2)})`);

  const realSeed = (seedValue !== null && seedValue !== undefined && seedValue !== "") 
    ? String(seedValue) 
    : (seedMode === "random" ? "Aleatoria" : ($("seedVal")?.value || "—"));
  const realTime = (timeText && String(timeText).trim()) ? String(timeText).trim() : ($("time1")?.textContent?.replace("⏱", "")?.trim() || "—");

  const rows = [
    ["Tiempo gen.", realTime],
    ["Semilla", realSeed],
    ["Modelo", unet],
    ["CLIP", clip],
    ["VAE Vídeo", vae],
    ["LoRAs", activeLoras.length ? activeLoras.join(", ") : "ninguna"],
    ["Sampler", $("samplerName")?.value || "res_multistep"],
    ["Scheduler", $("schedulerName")?.value || "simple"],
    ["Steps", $("stepsSlider")?.value || "20"],
    ["Resolución Base", `${w}×${he}`],
    ["A/R", getFriendlyRatio(w, he)],
  ];

  if(lu.enabled){
    rows.push(["Latent Upscale", `${lu.scale.toFixed(2)}x${lu.pass2 ? ` (Pase 2 denoise ${lu.pass2Denoise || 0.60})` : ''}`]);
  }
  const rtx = getRtxState ? getRtxState() : null;
  if(rtx && rtx.enabled){
    rows.push(["Resolución Vídeo", `${w*2}×${he*2} (RTX 2x ${rtx.quality})`]);
  }

  rows.push(["Aspect Ratio", arMode === "16:9" ? "Forzar 16:9" : "Auto (Imagen)"]);
  rows.push(["Duración", `${$("duration")?.value || ""}s`]);
  rows.push(["Modo", currentMode]);

  if(s.enabled){
    rows.push(["Spectrum", `on · bw ${s.blend.toFixed(2)} · fw ${s.flex.toFixed(2)}`]);
  }
  if(r.enabled){
    const label = (r.engine === "rtx") ? "RTX Frame Gen" : "RIFE";
    rows.push([label, `${r.multiplier}x (${24*r.multiplier} fps)`]);
  }

  return { title: "Parámetros MiniMaxH3", rows, loras: activeLoras };
};
CONFIG.onSeedUpdate = updateSeedUI;
CONFIG.onNodeExecuted = function(data){
  if(!data || !data.node || !data.prompt_id) return;
  const pid = data.prompt_id;
  if(!(pid in pendingSeeds)) return;

  // FIRST_SAVE (nodo 423): El 1er pase está listo. Lo mostramos y guardamos en la galería.
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
        }
        log(`✅ 1er pase listo (guardado en variantes; procesando 2º pase de refinado)...`, "l-ok");
      }
      displayVariantMedia(media, 1, pid, firstElapsedStr, { allowShow: isFirstLive, badgePrefix: "1er pase" });
    }
  }

  // SAVE (nodo 92): Vídeo final (pase 2 tras upscale o pase único sin upscale).
  if(data.node === N.SAVE && data.output){
    const media = CONFIG.findMedia(data.output);
    if(media){
      if(!displayedSlots[pid]) displayedSlots[pid] = new Set();
      const isFinalLive = !displayedSlots[pid].has(2);
      let elapsedStr = "";
      if(isFinalLive){
        displayedSlots[pid].add(2);
        const t = timers[pid];
        if(t){
          const elapsed = Date.now() - t.start;
          elapsedStr = fmtMs(elapsed);
          const el1 = $("time1");
          if(el1){ el1.textContent = `⏱ ${elapsedStr}`; el1.classList.remove("live"); }
        }
        log(`✅ Vídeo final listo.`, "l-ok");
      }
      const hadFirstPass = displayedSlots[pid] && displayedSlots[pid].has(1);
      const slotNum = hadFirstPass ? 2 : 1;
      displayVariantMedia(media, slotNum, pid, elapsedStr, { allowShow: true, badgePrefix: hadFirstPass ? "final" : null });
      if(isFinalLive){
        // Resultado cargado en el reproductor: fuera el preview congelado.
        const pv1 = $("previewVideo1"), p1 = $("previewImg1");
        const w1 = $("previewWrap1"), b1 = $("previewStep1"), e1 = $("empty1");
        if(p1){ p1.style.display = "none"; p1.removeAttribute("src"); }
        if(pv1){ pv1.pause(); pv1.style.display = "none"; pv1.removeAttribute("src"); pv1.load(); }
        if(w1) w1.style.display = "none";
        if(b1) b1.style.display = "none";
        if(e1) e1.style.display = "";
      }
    }
  }
};

CONFIG.onProgress = function(value, max, prompt_id, node){
  const b = $("previewStep1");
  const t = $("previewStepText1");
  const w = $("previewWrap1");
  const e = $("empty1");
  if(b && t){
    const pct = Math.round((value / max) * 100);
    t.textContent = `Paso ${value}/${max} · ${pct}%`;
    if(w) w.style.display = "block";
    if(e) e.style.display = "none";
    b.style.display = "inline-flex";
  }
  const pid = prompt_id || currentPromptId;
  if(pid && promptVariantMap[pid]){
    const varIdx = promptVariantMap[pid];
    const cardBadge = document.querySelector(`.variant-card[data-variant-index="${varIdx}"] .variant-progress-badge`);
    if(cardBadge){
      const pct = Math.round((value / max) * 100);
      cardBadge.textContent = `${value}/${max} (${pct}%)`;
      cardBadge.style.display = "block";
    }
  }
};

CONFIG.onPreview = function(url, meta){
  const p = $("previewImg1"), pv = $("previewVideo1"), e = $("empty1"), v = $("video1"), w = $("previewWrap1");
  if(!p && !pv) return;
  // Frames tardíos de un pase ya completado solo se ignoran si el reproductor
  // muestra el resultado del MISMO prompt en curso; con el resultado de un
  // prompt anterior el preview debe salir. Se ancla al prompt_id (único por
  // prompt) y no al índice de variante: variantCounter se resetea a 0 en cada
  // job, así que la 1ª variante de cada job comparte índice y un guard por
  // índice mataba TODOS los previews desde el 2º job en adelante.
  const showsThisPrompt = v && v.src && v.style.display === "block"
    && currentMediaPrompt[1] != null && currentMediaPrompt[1] === currentPromptId;
  if(showsThisPrompt) return;
  if(displayedSlots[currentPromptId] && displayedSlots[currentPromptId].has(1) && !v?.src) return;
  const isVideoUrl = typeof url === "string" && (url.startsWith("data:video/mp4") || url.startsWith("data:video/webm"));
  const target = isVideoUrl && pv ? pv : p;
  const other  = isVideoUrl ? p : pv;
  target.src = url;
  if(w) w.style.display = "block";
  target.style.display = "block";
  if(other) other.style.display = "none";
  e.style.display = "none";
  if(v && (!displayedSlots[currentPromptId] || !displayedSlots[currentPromptId].has(1))){
    v.style.display = "none";
  }
  if(isVideoUrl && pv.autoplay !== true){ pv.autoplay = true; pv.muted = true; pv.loop = true; }
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
  const p1 = $("previewImg1"), pv1 = $("previewVideo1"), w = $("previewWrap1"), b = $("previewStep1");
  if(p1){ p1.style.display = "none"; p1.removeAttribute("src"); }
  if(pv1){ pv1.pause(); pv1.style.display = "none"; pv1.removeAttribute("src"); pv1.load(); }
  if(w) w.style.display = "none";
  if(b) b.style.display = "none";
};

CONFIG.onPromptError = function(pid){
  // No avanzar la cola aquí: common.js ya hace currentBatchIndex++ +
  // processNextBatch tras este callback; llamar a finishCurrentJob() desde
  // aquí arranca el siguiente job mientras processNextBatch dispara una
  // variante del job ANTIGUO (race de batch/variantCounter).
  delete promptVariantMap[pid];
  delete displayedSlots[pid];
  const grid = $("variantGrid");
  if(grid){
    const card = grid.querySelector('.variant-card-generating');
    if(card) card.remove();
  }
};
CONFIG.startNextVariant = async function(index){
  // common.js pide la siguiente variante del batch activo
  if(!activeJob) return;
  activeJob.currentVariantIndex = null;
  await runSingleGeneration(index);
};
CONFIG.onBatchComplete = function(){
  // common.js ha terminado todas las variantes del batch activo
  if(activeJob) activeJob.currentVariantIndex = null;
  finishCurrentJob();
};
CONFIG.onStopCurrent = function(pid){
  delete pendingSeeds[pid];
  delete promptVariantMap[pid];
  delete displayedSlots[pid];
};
CONFIG.onStopAll = function(){
  if(currentPromptId) handledPrompts.add(currentPromptId);
  promptVariantMap = {};
  for(const k of Object.keys(displayedSlots)) delete displayedSlots[k];
  currentPromptId = null;
  jobQueue = [];
  activeJob = null;
  updateQueueUI();
  enableStopButtons(false);
  $("btnGenerate").disabled=false;
  // Reset del batch para evitar que processNextBatch resucite variantes tras stop.
  currentBatchIndex = 0;
  totalBatchSize = 1;
  batchSeedMode = "random";
};

// --- displayResult: soporte para 1er pase y vídeo final ---
CONFIG.displayResult = async function(entry, realSeed, tTotal, promptId, timings){
  const media1 = entry.outputs[N.FIRST_SAVE] ? CONFIG.findMedia(entry.outputs[N.FIRST_SAVE]) : null;
  const media2 = entry.outputs[N.SAVE] ? CONFIG.findMedia(entry.outputs[N.SAVE]) : null;
  const t1 = timings && timings.t1;
  const t2 = timings && timings.t2;

  if(!displayedSlots[promptId]) displayedSlots[promptId] = new Set();

  if(media1){
    const already1 = displayedSlots[promptId].has(1);
    if(!already1){
      displayedSlots[promptId].add(1);
      displayVariantMedia(media1, 1, promptId, t1 || "", { allowShow: !media2, badgePrefix: "1er pase" });
    } else if(t1){
      displayVariantMedia(media1, 1, promptId, t1, { allowShow: false, badgePrefix: "1er pase" });
    }
  }

  if(media2){
    const hadFirst = !!media1 || displayedSlots[promptId].has(1);
    const slot2 = hadFirst ? 2 : 1;
    const already2 = displayedSlots[promptId].has(slot2);
    if(!already2){
      displayedSlots[promptId].add(slot2);
      displayVariantMedia(media2, slot2, promptId, t2 || tTotal || "", { allowShow: true, badgePrefix: hadFirst ? "final" : null });
    } else if(t2 || tTotal){
      displayVariantMedia(media2, slot2, promptId, t2 || tTotal, { allowShow: false, badgePrefix: hadFirst ? "final" : null });
    }
    const el = $("time1");
    if(el){ el.textContent = `⏱ ${t2 || tTotal || "—"}`; el.classList.remove("live"); }
  }

  delete pendingSeeds[promptId];
  delete promptVariantMap[promptId];
  delete displayedSlots[promptId];
  handledPrompts.add(promptId);

  // No tocar currentBatchIndex ni llamar a runSingleGeneration aquí.
  // false indica a common.js que debe avanzar el batch (processNextBatch).
  return false;
};

function displayVariantMedia(media, slot, promptId, timeText, { allowShow = true, badgePrefix = null } = {}){
  if(!media || !media.filename) return;
  if(timeText) saveVideoTiming(media.filename, timeText);
  const varIndex = promptVariantMap[promptId] != null
    ? promptVariantMap[promptId]
    : (activeJob?.currentVariantIndex != null ? activeJob.currentVariantIndex : (variantCounter + 1));
  const key = `${media.filename}|${media.subfolder || ""}|${slot}`;
  const isNewGallery = !displayedGalleryFiles.has(key);
  const typeShort = badgePrefix || (slot === 1 ? (activeJob?.latentUpscale?.enabled ? "1er pase" : "final") : "final");

  if(allowShow){
    const badgeText = activeJob?.isFaceRefineOnly
      ? "FaceRefined"
      : (activeJob?.faceRefine?.enabled ? `Var ${varIndex} · FaceRefined` : `Var ${varIndex} · ${typeShort}`);
    const seedVal = pendingSeeds[promptId] ?? null;
    showVideo(1, media, { variantIndex: varIndex, badge: badgeText, promptId, seed: seedVal });
  }
  if(isNewGallery){
    displayedGalleryFiles.add(key);
    addToVariantGallery(media, pendingSeeds[promptId] ?? null, timeText || "", slot, varIndex, typeShort);
  } else if(timeText){
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

// --- RESOLUCIÓN ---
function nearest32(v){ return Math.round(v / 32) * 32; }

function recalcResolution(){
  const mp = parseFloat($("mpSlider").value) || 0.7;
  const totalPx = mp * 1024 * 1024;
  const targetAspect = (arMode === "16:9") ? (16 / 9) : (imageNativeAspectRatio || (16 / 9));
  currentAspectRatio = targetAspect;
  let w = nearest32(Math.sqrt(totalPx * targetAspect));
  let h = nearest32(Math.sqrt(totalPx / targetAspect));
  if(h < 256) h = 256;
  if(w < 256) w = 256;
  $("width").value = w;
  $("height").value = h;
  $("mpVal").textContent = mp.toFixed(2);

  const latentState = (typeof getLatentUpscaleState === "function") ? getLatentUpscaleState() : { enabled: false, scale: 1.5 };
  const latentScale = latentState.enabled ? latentState.scale : 1.0;
  const latentW = latentState.enabled ? nearest32(w * latentScale) : w;
  const latentH = latentState.enabled ? nearest32(h * latentScale) : h;

  if($("latentResHint")){
    if(latentState.enabled){
      $("latentResHint").textContent = `Latent: ${w}×${h} → ~${latentW}×${latentH} px (${latentScale.toFixed(2)}x)`;
    } else {
      $("latentResHint").textContent = `Latent nativo: ${w}×${h} px (sin escalado)`;
    }
  }

  const rtxState = (typeof getRtxState === "function") ? getRtxState() : { enabled: true, quality: "ULTRA" };
  const rtxMultiplier = rtxState.enabled ? 2 : 1;
  const finalW = latentW * rtxMultiplier;
  const finalH = latentH * rtxMultiplier;
  const currentRatioName = getFriendlyRatio(w, h);
  if($("resFinalHint")){
    if(latentState.enabled && rtxState.enabled){
      $("resFinalHint").textContent = `Vídeo final: ${finalW}×${finalH} px (${currentRatioName}) tras Latent ${latentScale.toFixed(2)}x + RTX 2x`;
    } else if(latentState.enabled && !rtxState.enabled){
      $("resFinalHint").textContent = `Vídeo final: ${finalW}×${finalH} px (${currentRatioName}) tras Latent ${latentScale.toFixed(2)}x (sin RTX)`;
    } else if(!latentState.enabled && rtxState.enabled){
      $("resFinalHint").textContent = `Vídeo final: ${finalW}×${finalH} px (${currentRatioName}) tras RTX 2x`;
    } else {
      $("resFinalHint").textContent = `Vídeo final: ${finalW}×${finalH} px (${currentRatioName}) nativo (sin escalados)`;
    }
  }
  updateArLabel(rawInputImageWidth, rawInputImageHeight);
}

let queueIdleCount = 0;
function updateQueueUI(){
  const count = jobQueue.length;
  const clearBtn = $("btnClearQueue");
  if(clearBtn) clearBtn.disabled = (count === 0 && !activeJob);

  // Auto-recuperación si activeJob quedó huérfano con ComfyUI en reposo
  // (mismo mecanismo que mmh3x2: un fetch colgado sin timeout o un POST
  // perdido dejaba la cola entera atascada detrás de un job fantasma).
  // Se suspende durante subidas/preprocesado: ahí el backend puede estar
  // vacío legítimamente durante minutos (ffmpeg).
  if(activeJob && !jobH3UploadInProgress && typeof serverQueueState !== "undefined" && serverQueueState.running === 0 && serverQueueState.pending === 0){
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
        updateQueueUI();
        log(`⏭️ Iniciando tarea en cola (${jobQueue.length} restantes)...`, "l-info");
        startJob(nextJob);
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
      webuiDetail.textContent = `▶ Job #${activeJob.id} · Var ${currentBatchIndex + 1}/${totalBatchSize} (${activeJob.mode || "i2v"})`;
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
      const modeLabel = job.mode || "i2v";
      row.innerHTML = `
        <div class="queue-item-left" title="${pText}">
          <span class="queue-item-id">#${job.id}</span>
          <span class="queue-item-desc">${pShort} · ${job.batchSize || 1} var(s) · ${modeLabel}</span>
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
function snapshotJob(){
  return {
    id: ++jobCounter,
    prompt: $("prompt").value,
    seedMode,
    seedValue: parseInt($("seedVal").value || "12345", 10),
    width: parseInt($("width").value, 10),
    height: parseInt($("height").value, 10),
    duration: parseFloat($("duration").value || "10"),
    mp: $("mpSlider").value,
    unet: $("unetSelect")?.value,
    clip: $("clipSelect")?.value,
    vae: $("vaeSelect")?.value,
    samplerName: $("samplerName")?.value,
    schedulerName: $("schedulerName")?.value,
    steps: $("stepsSlider")?.value,
    bitDepth: getBitDepth(),
    filenamePrefix: $("filenamePrefix")?.value,
    mode: currentMode,
    refImageSize: $("refImageSize")?.value || "match",
    h3opt: getH3OptState(),
    sigmaShift: getSigmaShiftState(),
    spectrum: getSpectrumState(),
    solH3: getSolH3State(),
    latentUpscale: getLatentUpscaleState(),
    rife: getRifeState(),
    rtx: getRtxState(),
    faceRefine: getFaceRefineState(),
    attentionBackend: getAttentionBackendState(),
    attentionOptimizer: getAttentionOptimizerState(),
    aimdo: getAimdoState(),
    blockSparse: getBlockSparseState(),
    loras: JSON.parse(JSON.stringify(loras)),
    batchSize: parseInt($("batchSize")?.value || "1", 10),
    uploadedFirstImage: uploadedFirstImage ? {...uploadedFirstImage} : null,
    uploadedLastImage: uploadedLastImage ? {...uploadedLastImage} : null,
    localFirstFile: localFirstFile,
    localLastFile: localLastFile,
    refImages: refImages.map(r => ({ local: r.local, uploaded: r.uploaded ? {...r.uploaded} : null })),
    refVideos: refVideos.map(r => ({ file: r.file, local: r.local, uploaded: r.uploaded ? {...r.uploaded} : null, audioUploaded: r.audioUploaded ? {...r.audioUploaded} : null, useAudio: r.useAudio, volume: r.volume, settings: {...r.settings} })),
    refAudios: refAudios.map(r => ({ local: r.local, uploaded: r.uploaded ? {...r.uploaded} : null, volume: r.volume })),
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
    scheduleSaveH3Settings();
}

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

// --- APLICAR WORKFLOW DESDE METADATOS MP4 ---
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

  // Helper: descargar un archivo de ComfyUI input/output y devolverlo como File(data URL)
  async function fetchComfyFile(path, fallbackName, typeHint){
    if(!path) return null;
    try {
      const url = `${server()}/view?filename=${encodeURIComponent(path)}&subfolder=&type=input`;
      const r = await fetch(url);
      if(!r.ok) throw new Error("HTTP "+r.status);
      const blob = await r.blob();
      const name = path.replace(/^.*\//, "");
      const type = blob.type || typeHint || "application/octet-stream";
      return { blob, name, type };
    } catch(e){
      console.warn("No se pudo descargar", path, e.message);
      return null;
    }
  }

  function blobToDataUrl(blob){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Prompt: MiniMaxH3ReferenceToVideo / MiniMaxH3ImageToVideo / PrimitiveStringMultiline
  const ref2vNode = findByClass("MiniMaxH3ReferenceToVideo");
  const i2vNode = findByClass("MiniMaxH3ImageToVideo");
  const strNode = findByClass("PrimitiveStringMultiline");
  let promptFound = false;
  if(strNode && strNode.inputs && typeof strNode.inputs.value === "string" && strNode.inputs.value.trim()){
    $("prompt").value = strNode.inputs.value.trim();
    promptFound = true;
  } else if(ref2vNode && ref2vNode.inputs && typeof ref2vNode.inputs.prompt === "string" && ref2vNode.inputs.prompt.trim()){
    $("prompt").value = ref2vNode.inputs.prompt.trim();
    promptFound = true;
  } else if(i2vNode && i2vNode.inputs && typeof i2vNode.inputs.prompt === "string" && i2vNode.inputs.prompt.trim()){
    $("prompt").value = i2vNode.inputs.prompt.trim();
    promptFound = true;
  }
  if(promptFound) setApplied("prompt"); else setMissing("prompt");

  // Modo i2v/flf2v/r2v
  let modeSet = false;
  if(ref2vNode && ref2vNode.inputs){
    const hasVideo = ref2vNode.inputs["ref_videos.ref_video_0"] || ref2vNode.inputs["ref_videos.ref_video_1"] || ref2vNode.inputs["ref_videos.ref_video_2"];
    const hasAudio = ref2vNode.inputs["ref_audios.ref_audio_0"] || ref2vNode.inputs["ref_audios.ref_audio_1"] || ref2vNode.inputs["ref_audios.ref_audio_2"];
    const hasVideoAudio = ref2vNode.inputs["ref_video_audios.ref_video_audio_0"];
    const imgCount = [ref2vNode.inputs["ref_images.ref_image_0"], ref2vNode.inputs["ref_images.ref_image_1"], ref2vNode.inputs["ref_images.ref_image_2"], ref2vNode.inputs["ref_images.ref_image_3"], ref2vNode.inputs["ref_images.ref_image_4"], ref2vNode.inputs["ref_images.ref_image_5"]].filter(Boolean).length;
    if(hasVideo || hasAudio || hasVideoAudio || imgCount > 1){
      setModeUI("r2v");
      modeSet = true;
    }
  }
  if(i2vNode && i2vNode.inputs && !modeSet){
    const ff = i2vNode.inputs.first_frame;
    const lf = i2vNode.inputs.last_frame;
    if(Array.isArray(lf) && Array.isArray(ff) && lf[0] !== ff[0]){
      setModeUI("flf2v");
      modeSet = true;
    } else {
      setModeUI("i2v");
      modeSet = true;
    }
  }
  if(modeSet) setApplied("modo"); else setMissing("modo");

  // --- Recuperar imágenes / vídeos / audios del workflow ---
  const mediaPromises = [];

  // 1. Imagen de inicio / último frame (LoadImage del grafo)
  const allLoadImages = findAllByClass("LoadImage");
  const firstFrameImg = allLoadImages.find(n => n.node._meta?.title?.toLowerCase().includes("first frame")) || allLoadImages[0];
  const lastFrameImg = allLoadImages.find(n => n.node._meta?.title?.toLowerCase().includes("last frame"));
  const otherImages = allLoadImages.filter(n => n !== firstFrameImg && n !== lastFrameImg);

  if(firstFrameImg?.node?.inputs?.image){
    const p = fetchComfyFile(firstFrameImg.node.inputs.image).then(async file => {
      if(!file) return;
      const dataUrl = await blobToDataUrl(file.blob);
      const uniqueName = `temp_${Date.now()}_${file.name}`;
      localFirstFile = new File([file.blob], uniqueName, {type: file.type});
      uploadedFirstImage = null;
      showInputImage(dataUrl);
      setApplied("imagen de inicio");
    }).catch(e => { console.warn("first frame fetch", e); });
    mediaPromises.push(p);
  }
  if(lastFrameImg?.node?.inputs?.image){
    const p = fetchComfyFile(lastFrameImg.node.inputs.image).then(async file => {
      if(!file) return;
      const dataUrl = await blobToDataUrl(file.blob);
      const uniqueName = `temp_last_${Date.now()}_${file.name}`;
      localLastFile = new File([file.blob], uniqueName, {type: file.type});
      uploadedLastImage = null;
      showLastFrameImage(dataUrl);
      setApplied("último frame");
    }).catch(e => { console.warn("last frame fetch", e); });
    mediaPromises.push(p);
  }

  // 2. Referencias R2V desde MiniMaxH3ReferenceToVideo
  if(ref2vNode && ref2vNode.inputs){
    // Imágenes de referencia
    for(let i = 0; i < R2V_MAX_IMAGES; i++){
      const link = ref2vNode.inputs[`ref_images.ref_image_${i}`];
      if(!link) continue;
      const nodeId = String(link[0]);
      const srcNode = workflow[nodeId];
      if(!srcNode || srcNode.class_type !== "LoadImage" || !srcNode.inputs?.image) continue;
      const p = fetchComfyFile(srcNode.inputs.image).then(async file => {
        if(!file) return;
        const dataUrl = await blobToDataUrl(file.blob);
        refImages[i].local = dataUrl;
        refImages[i].uploaded = null;
        setApplied(`ref imagen ${i+1}`);
      }).catch(e => console.warn("ref img", e));
      mediaPromises.push(p);
    }
    // Vídeos de referencia + sus audios
    for(let i = 0; i < R2V_MAX_VIDEOS; i++){
      const vLink = ref2vNode.inputs[`ref_videos.ref_video_${i}`];
      const vaLink = ref2vNode.inputs[`ref_video_audios.ref_video_audio_${i}`];
      if(vLink){
        const nodeId = String(vLink[0]);
        const srcNode = workflow[nodeId];
        if(srcNode && srcNode.class_type === "LoadVideo" && srcNode.inputs?.file){
          const p = fetchComfyFile(srcNode.inputs.file).then(async file => {
            if(!file) return;
            const dataUrl = await blobToDataUrl(file.blob);
            refVideos[i].file = new File([file.blob], file.name, {type: file.type});
            refVideos[i].local = dataUrl;
            refVideos[i].uploaded = null;
            setApplied(`ref vídeo ${i+1}`);
          }).catch(e => console.warn("ref video", e));
          mediaPromises.push(p);
        }
      }
      if(vaLink){
        const nodeId = String(vaLink[0]);
        const srcNode = workflow[nodeId];
        if(srcNode && srcNode.class_type === "LoadAudio" && srcNode.inputs?.audio){
          const p = fetchComfyFile(srcNode.inputs.audio).then(async file => {
            if(!file) return;
            refVideos[i].audioUploaded = null;
            refVideos[i].audioLocal = new File([file.blob], file.name, {type: file.type});
            setApplied(`ref audio vídeo ${i+1}`);
          }).catch(e => console.warn("ref video audio", e));
          mediaPromises.push(p);
        }
      }
    }
    // Audios independientes
    for(let i = 0; i < R2V_MAX_AUDIOS; i++){
      const link = ref2vNode.inputs[`ref_audios.ref_audio_${i}`];
      if(!link) continue;
      const nodeId = String(link[0]);
      const srcNode = workflow[nodeId];
      if(!srcNode || srcNode.class_type !== "LoadAudio" || !srcNode.inputs?.audio) continue;
      const p = fetchComfyFile(srcNode.inputs.audio).then(async file => {
        if(!file) return;
        refAudios[i].local = new File([file.blob], file.name, {type: file.type});
        refAudios[i].uploaded = null;
        setApplied(`ref audio ${i+1}`);
      }).catch(e => console.warn("ref audio", e));
      mediaPromises.push(p);
    }
  }

  // 3. Esperar a que las descargas terminen antes de renderizar referencias
  if(mediaPromises.length > 0){
    try { await Promise.all(mediaPromises); } catch(_){}
    renderR2V();
  }

  // UNet
  let unetSet = false;
  const unetLoader = findByClass("UNETLoader");
  if(unetLoader && unetLoader.inputs && unetLoader.inputs.unet_name){
    const name = unetLoader.inputs.unet_name;
    const sel = $("unetSelect");
    if(sel){
      for(const opt of sel.options){
        if(opt.value === name || name.endsWith("/"+opt.value) || opt.value === name){
          opt.selected = true; unetSet = true; break;
        }
      }
    }
  }
  if(unetSet) setApplied("UNet"); else setMissing("UNet");

  // CLIP
  let clipSet = false;
  const clipLoader = findByClass("CLIPLoader");
  if(clipLoader && clipLoader.inputs && clipLoader.inputs.clip_name){
    const name = clipLoader.inputs.clip_name;
    const sel = $("clipSelect");
    if(sel){
      for(const opt of sel.options){
        if(opt.value === name || name.endsWith("/"+opt.value)){
          opt.selected = true; clipSet = true; break;
        }
      }
    }
  }
  if(clipSet) setApplied("CLIP"); else setMissing("CLIP");

  // VAE Vídeo
  let vaeSet = false;
  const vaeNode = (workflow && workflow[N.VAE_VIDEO]) || findByClass("VAELoader");
  if(vaeNode && vaeNode.inputs && vaeNode.inputs.vae_name){
    const name = vaeNode.inputs.vae_name;
    const sel = $("vaeSelect");
    if(sel){
      for(const opt of sel.options){
        if(opt.value === name || name.endsWith("/"+opt.value) || opt.value.endsWith(name)){
          opt.selected = true; vaeSet = true; break;
        }
      }
    }
  }
  if(vaeSet) setApplied("VAE Vídeo"); else setMissing("VAE Vídeo");

  // LoRAs
  const loraNodesFound = findAllByClass("LoraLoaderModelOnly").concat(findAllByClass("LoraLoader"));
  if(loraNodesFound.length > 0){
    for(let i = 0; i < 2; i++){
      if(i < loraNodesFound.length && loraNodesFound[i].node && loraNodesFound[i].node.inputs){
        const inp = loraNodesFound[i].node.inputs;
        const loraName = inp.lora_name || "";
        const str = (typeof inp.strength_model === "number") ? inp.strength_model : ((typeof inp.strength === "number") ? inp.strength : 1.0);
        if(loraName && loraName !== "None"){
          loras[i].lora = loraName;
          loras[i].on = true;
          loras[i].strength = str;
        } else {
          loras[i].on = false;
        }
      } else {
        loras[i].on = false;
      }
    }
    renderLoras();
    saveLoraState();
    setApplied("LoRAs");
  } else {
    for(let i = 0; i < 2; i++) loras[i].on = false;
    renderLoras();
    saveLoraState();
    setMissing("LoRAs");
  }

  // Attention backend (ModelAttentionBackend)
  const attnBackendNode = findByClass("ModelAttentionBackend");
  if(attnBackendNode && attnBackendNode.inputs && attnBackendNode.inputs.attention){
    const backend = attnBackendNode.inputs.attention;
    setAttentionBackendUI({ backend });
    saveAttentionBackend({ backend });
    setApplied("backend de atención (" + backend + ")");
  } else {
    setMissing("backend de atención");
  }

  // Attention optimizer: H3-Optimizations vs Block Sparse (mutually exclusive)
  const sparseNode = findByClass("H3SparseAttention") || findByClass("H3SparseAttentionAdvanced");
  const memOptNode = findByClass("H3MemoryOptimization");
  const aimdoNode = findByClass("H3AIMDOResidencyLimiter");
  const vsaNode = findByClass("H3VSAAttention");
  const blockSparseNode = findByClass("BlockSparseAttention");

  if(vsaNode){
    // Checkpoint VSA-trained (FastH3): nodo dedicado H3VSAAttention.
    setAttentionOptimizerUI("block-sparse");
    saveAttentionOptimizer({ mode: "block-sparse" });
    const bs = { ...BLOCK_SPARSE_DEFAULTS, selection: "VSA (FastVideo)" };
    if(typeof vsaNode.inputs?.keep_percent === "number") bs.keepPercent = vsaNode.inputs.keep_percent;
    setBlockSparseUI(bs);
    saveBlockSparse(bs);
    setApplied(`VSA FastH3 (keep ${bs.keepPercent}%)`);
  } else if(blockSparseNode){
    setAttentionOptimizerUI("block-sparse");
    saveAttentionOptimizer({ mode: "block-sparse" });
    const bs = { ...BLOCK_SPARSE_DEFAULTS };
    const sel = blockSparseNode.inputs && blockSparseNode.inputs.selection;
    // Nuevo formato ComfyUI: selection es un objeto {selection: "sol-attn", tau?: number, keep_percent?: number}
    if(sel && typeof sel === "object" && !Array.isArray(sel) && sel.selection){
      bs.selection = mapBlockSparseSelection(sel.selection);
      if(sel.tau != null) bs.tau = sel.tau;
      // keep_percent es un parámetro distinto de tau: no lo pisa con 1.3.
      if(sel.keep_percent != null) bs.keepPercent = sel.keep_percent;
    } else if(sel && Array.isArray(sel) && sel.length >= 2){
      // Formato antiguo (por compatibilidad)
      bs.selection = mapBlockSparseSelection(sel[0]) || bs.selection;
      const sub = sel[1] || {};
      if(typeof sub.tau === "number") bs.tau = sub.tau;
      if(typeof sub.keep_percent === "number") bs.keepPercent = sub.keep_percent;
    } else if(sel && typeof sel === "string"){
      bs.selection = mapBlockSparseSelection(sel) || bs.selection;
      if(typeof blockSparseNode.inputs["selection.tau"] === "number") bs.tau = blockSparseNode.inputs["selection.tau"];
    }
    if(blockSparseNode.inputs){
      if(typeof blockSparseNode.inputs.start_percent === "number") bs.startPercent = blockSparseNode.inputs.start_percent;
      if(typeof blockSparseNode.inputs.end_percent === "number") bs.endPercent = blockSparseNode.inputs.end_percent;
    }
    setBlockSparseUI(bs);
    saveBlockSparse(bs);
    setApplied("block sparse attention");
  } else if(sparseNode || memOptNode || aimdoNode){
    setAttentionOptimizerUI("h3-optimizations");
    saveAttentionOptimizer({ mode: "h3-optimizations" });
    const h3State = loadH3Opt();
    if(sparseNode && sparseNode.inputs){
      if(typeof sparseNode.inputs.video_budget === "number") h3State.videoBudget = sparseNode.inputs.video_budget;
      if(typeof sparseNode.inputs.denser_early_late_steps === "boolean") h3State.denserEarlyLate = sparseNode.inputs.denser_early_late_steps;
      if(sparseNode.class_type === "H3SparseAttentionAdvanced" && typeof sparseNode.inputs.backend === "string") h3State.sparseBackend = sparseNode.inputs.backend;
      else if(sparseNode.class_type === "H3SparseAttention") h3State.sparseBackend = "auto";
      setApplied(`h3 sparse (${Math.round(h3State.videoBudget * 100)}%)`);
    }
    if(memOptNode){
      h3State.memOptEnabled = true;
      setApplied("h3 memory opt");
    }
    setH3OptUI(h3State);
    saveH3Opt(h3State);
    if(aimdoNode && aimdoNode.inputs && aimdoNode.inputs.residency){
      const aimdoState = { residency: aimdoNode.inputs.residency };
      setAimdoUI(aimdoState);
      saveAimdo(aimdoState);
      setApplied("aimdo residency");
    }
  } else {
    setAttentionOptimizerUI("none");
    saveAttentionOptimizer({ mode: "none" });
    setMissing("optimizador sparse");
  }

  // Sigma Shift
  const sigmaNode = findByClass("MiniMaxH3SigmaShift");
  if(sigmaNode && sigmaNode.inputs){
    const sv = typeof sigmaNode.inputs.shift_video === "number" ? sigmaNode.inputs.shift_video : 8.0;
    const sa = typeof sigmaNode.inputs.shift_audio === "number" ? sigmaNode.inputs.shift_audio : 3.0;
    const ss = { shiftVideo: sv, shiftAudio: sa };
    setSigmaShiftUI(ss);
    saveSigmaShift(ss);
    setApplied(`sigma shift (${sv}v / ${sa}a)`);
  } else if(sigmaNode === null){
    setMissing("sigma shift");
  }

  // Spectrum
  const spectrumNode = findByClass("SpectrumApplyMiniMaxH3");
  if(spectrumNode && spectrumNode.inputs){
    const s = {
      enabled: spectrumNode.inputs.enabled !== false,
      blend: typeof spectrumNode.inputs.blend_weight === "number" ? spectrumNode.inputs.blend_weight : 0.5,
      flex: typeof spectrumNode.inputs.flex_window === "number" ? spectrumNode.inputs.flex_window : 0.75,
      warmup: typeof spectrumNode.inputs.warmup_steps === "number" ? spectrumNode.inputs.warmup_steps : 1,
      bootstrapFirstForecast: spectrumNode.inputs.bootstrap_first_forecast !== false,
      historyStorage: spectrumNode.inputs.history_storage || "vram",
    };
    setSpectrumUI(s);
    saveSpectrum(s);
    setApplied("spectrum");
  } else if(spectrumNode === null){
    // Sin nodo Spectrum en el workflow: no tocar el estado guardado.
    setMissing("spectrum");
  }

  // Sol-H3 (SM120 Blackwell)
  const solNode = findByClass("SolH3Experimental");
  if(solNode && solNode.inputs){
    const s = {
      enabled: true,
      exact_fusion: solNode.inputs.exact_fusion !== false,
      dense_evaluations: typeof solNode.inputs.dense_evaluations === "number" ? solNode.inputs.dense_evaluations : 1,
      dense_layers: typeof solNode.inputs.dense_layers === "number" ? solNode.inputs.dense_layers : 2,
      tau: typeof solNode.inputs.tau === "number" ? solNode.inputs.tau : 1.0,
    };
    setSolH3UI(s);
    saveSolH3(s);
    setApplied(`Sol-H3 SM120 (${s.dense_evaluations} eval densa, tau=${s.tau})`);
  } else if(solNode === null){
    const s = { ...SOL_H3_DEFAULTS, enabled: false };
    setSolH3UI(s);
    saveSolH3(s);
    setMissing("Sol-H3");
  }

  // Sampler
  const samplerSel = findByClass("KSamplerSelect");
  if(samplerSel && samplerSel.inputs && samplerSel.inputs.sampler_name){
    $("samplerName").value = samplerSel.inputs.sampler_name;
    setApplied("sampler");
  } else { setMissing("sampler"); }

  // Scheduler
  const sched = findByClass("BasicScheduler");
  if(sched && sched.inputs){
    if(sched.inputs.scheduler){
      $("schedulerName").value = sched.inputs.scheduler;
      setApplied("scheduler");
    }
    if(typeof sched.inputs.steps === "number"){
      $("stepsSlider").value = sched.inputs.steps;
      $("stepsVal").textContent = sched.inputs.steps;
      setApplied("steps");
    }
  } else { setMissing("scheduler/steps"); }

  // Megapixels
  const imgScale = findByClass("ImageScaleToTotalPixels");
  if(imgScale && imgScale.inputs && typeof imgScale.inputs.megapixels === "number"){
    const mp = imgScale.inputs.megapixels;
    $("mpSlider").value = mp;
    $("mpVal").textContent = mp.toFixed(2);
    setApplied("megapixels");
  } else { setMissing("megapixels"); }

  // Duración
  const loadImages = findAllByClass("LoadImage");
  if(loadImages.length){
    // Tomar dimensiones de la primera LoadImage para aspect ratio
    // (no disponible en metadatos; skip)
  }
  const durNode = findByClass("PrimitiveFloat");
  if(durNode && typeof durNode.inputs?.value === "number"){
    $("duration").value = durNode.inputs.value;
    setApplied("duración");
  } else { setMissing("duración"); }

  // Seed
  let seedVal = null;
  const randomNoise = findByClass("RandomNoise");
  if(randomNoise && typeof randomNoise.inputs?.noise_seed === "number"){
    seedVal = randomNoise.inputs.noise_seed;
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

  // Latent Upscaler 3D
  const latentUpNode = findByClass("MinimaxH3LatentUpscaler3D");
  if(latentUpNode && latentUpNode.inputs){
    let sc = 1.5;
    if(typeof latentUpNode.inputs.scale === "number") sc = latentUpNode.inputs.scale;
    else if(typeof latentUpNode.inputs["mode.scale"] === "number") sc = latentUpNode.inputs["mode.scale"];
    else if(latentUpNode.inputs.mode && typeof latentUpNode.inputs.mode === "object" && typeof latentUpNode.inputs.mode.scale === "number") sc = latentUpNode.inputs.mode.scale;

    // Detectar si el workflow incluye el segundo pase de muestreo (nodo 409 o SamplerCustomAdvanced adicional)
    const hasSampler2 = !!wfNodes[N.SAMPLER2] || !!findByTitle("Sampler Pase 2 (Refinado Hires-Fix)");
    const sigmas2Node = wfNodes[N.SIGMAS2] || findByTitle("Scheduler Pase 2 (Denoise)") || findByTitle("Manual Sigmas Pase 2");
    const unet2Node = wfNodes[N.UNET2] || findByTitle("UNet Loader Pase 2");
    const turbo2Node = wfNodes[N.LORA_TURBO2] || findByTitle("Turbo LoRA Pase 2");

    let p2Denoise = 0.60;
    if(sigmas2Node && sigmas2Node.inputs && typeof sigmas2Node.inputs.denoise === "number"){
      p2Denoise = sigmas2Node.inputs.denoise;
    }
    let p2Unet = "";
    if(unet2Node && unet2Node.inputs && unet2Node.inputs.unet_name){
      p2Unet = unet2Node.inputs.unet_name;
    }
    let p2Lora = "";
    let p2LoraStrength = 1.0;
    if(turbo2Node && turbo2Node.inputs){
      p2Lora = turbo2Node.inputs.lora_name || "";
      if(typeof turbo2Node.inputs.strength_model === "number") p2LoraStrength = turbo2Node.inputs.strength_model;
    }

    const lu = {
      enabled: true,
      scale: sc,
      pass2: hasSampler2,
      pass2Unet: p2Unet,
      pass2Lora: p2Lora,
      pass2LoraStrength: p2LoraStrength,
      pass2Denoise: p2Denoise
    };
    setLatentUpscaleUI(lu);
    saveLatentUpscale(lu);
    setApplied(`latent upscaler 3D (${sc.toFixed(2)}x${hasSampler2 ? " + pase 2 refinado" : ""})`);
  } else if(latentUpNode === null){
    const lu = { ...LATENT_UPSCALE_DEFAULTS, enabled: false, scale: 1.5 };
    setLatentUpscaleUI(lu);
    saveLatentUpscale(lu);
  }

  // Refinado facial (H3 FaceRefine)
  const faceCropNode = findByClass("H3FaceTrackCrop");
  const faceStitchNode = findByClass("H3FaceStitch");
  const faceDenoiseNode = findByClass("H3PerFrameDenoise");
  if(faceCropNode || faceStitchNode){
    const d = (faceDenoiseNode && faceDenoiseNode.inputs && typeof faceDenoiseNode.inputs.denoise_multiplier_large_face === "number")
      ? faceDenoiseNode.inputs.denoise_multiplier_large_face
      : 0.35;
    const f = (faceStitchNode && faceStitchNode.inputs && typeof faceStitchNode.inputs.feather === "number")
      ? faceStitchNode.inputs.feather
      : 16;
    const sel = (faceCropNode && faceCropNode.inputs && faceCropNode.inputs.select) || "largest_face";
    const fr = { enabled: true, denoise: d, feather: f, select: sel };
    setFaceRefineUI(fr);
    saveFaceRefine(fr);
    setApplied(`refinado facial (denoise ${d.toFixed(2)}, feather ${f}px)`);
  }

  // Interpolación de frames (RIFE / RTX Video Frame Generation)
  const rtxFgNode = findByClass("RTXVideoFrameGeneration");
  const rifeNode = findByClass("FrameInterpolate");
  if(rtxFgNode && rtxFgNode.inputs){
    const mult = (typeof rtxFgNode.inputs["generation_type.multiplier"] === "number")
      ? rtxFgNode.inputs["generation_type.multiplier"]
      : (typeof rtxFgNode.inputs.multiplier === "number" ? rtxFgNode.inputs.multiplier : 2);
    const r = { enabled: true, engine: "rtx", multiplier: mult, model: "rife_v4.26.safetensors" };
    setRifeUI(r);
    saveRife(r);
    setApplied(`interpolación de frames (RTX Frame Gen ${mult}x)`);
  } else if(rifeNode && rifeNode.inputs){
    const mult = typeof rifeNode.inputs.multiplier === "number" ? rifeNode.inputs.multiplier : 2;
    const loaderNode = findByClass("FrameInterpolationModelLoader");
    const m = (loaderNode && loaderNode.inputs && loaderNode.inputs.model_name) ? loaderNode.inputs.model_name : "rife_v4.26.safetensors";
    const r = { enabled: true, engine: "rife", multiplier: mult, model: m };
    setRifeUI(r);
    saveRife(r);
    setApplied(`interpolación de frames (RIFE ${mult}x, ${m})`);
  } else if(rtxFgNode === null && rifeNode === null){
    const r = { ...RIFE_DEFAULTS, enabled: false };
    setRifeUI(r);
    saveRife(r);
  }

  // RTX Video Super Resolution
  const rtxNode = findByClass("RTXVideoSuperResolution");
  if(rtxNode && rtxNode.inputs){
    const q = rtxNode.inputs.quality || "ULTRA";
    const rtx = { enabled: true, quality: q };
    setRtxUI(rtx);
    saveRtx(rtx);
    setApplied(`RTX Super Resolution (calidad ${q})`);
  } else if(rtxNode === null){
    const rtx = { enabled: false, quality: "ULTRA" };
    setRtxUI(rtx);
    saveRtx(rtx);
  }

  updateDurationHints();

  if(opts.silent) return { applied, missing };
  const appliedMsg = applied.length ? "✅ Usados: " + applied.join(", ") : "";
  const missingMsg = missing.length ? "⚠️ Sin coincidencia: " + missing.join(", ") : "";
  if(appliedMsg) log(appliedMsg, "l-ok");
  if(missingMsg) log(missingMsg, "l-warn");
  if(applied.length) log("📋 Parámetros restaurados desde metadatos.", "l-ok");
  else log("ℹ️ No se encontraron parámetros aplicables en los metadatos.", "l-warn");

  return { applied, missing };
}

// --- DROPZONE / FILE HANDLING (imagen de inicio) ---
function updateDzInfo(w, h, infoEl){
  const info = infoEl || $("dzInfo");
  if(info && w && h){
    const ratioStr = getFriendlyRatio(w, h);
    info.textContent = `${w}×${h} · ${ratioStr}`;
  }
  const isFirst = (!infoEl || infoEl === $("dzInfo"));
  const firstImg = $("inputImg");
  const hasFirst = !!(firstImg && firstImg.naturalWidth && firstImg.naturalHeight && firstImg.style.display !== "none");
  if(w && h && (isFirst || !hasFirst)){
    rawInputImageWidth = w;
    rawInputImageHeight = h;
    imageNativeAspectRatio = w / h;
    if(arMode !== "16:9"){
      setArModeUI("auto");
    } else {
      recalcResolution();
    }
  }
}

$("segRandom").addEventListener("click",()=>{seedMode="random";$("segRandom").classList.add("on");$("segFixed").classList.remove("on");$("seedVal").disabled=true;});
$("segFixed").addEventListener("click",()=>{seedMode="fixed";$("segFixed").classList.add("on");$("segRandom").classList.remove("on");$("seedVal").disabled=false;});
$("stepsSlider")?.addEventListener("input",(e)=>{$("stepsVal").textContent=e.target.value;});
$("mpSlider").addEventListener("input",()=>{recalcResolution();});
$("duration").addEventListener("input",updateDurationHints);

// El prefijo se guarda/lee como parte de la sesión v1.
$("filenamePrefix")?.addEventListener("input", () => { scheduleSaveH3Settings(); });

function alignFrameCount(n){
  let f = Math.max(5, Math.round(n));
  while(f % 17 !== 5){
    f++;
  }
  return f;
}

function updateDurationHints(){
  const dur = parseFloat($("duration").value || "0");
  const rawFrames = Math.max(5, Math.round(dur * 24));
  const adjusted = alignFrameCount(rawFrames);
  const effectiveSec = (adjusted / 24).toFixed(2);
  $("durHint").textContent = `(${dur}s)`;
  $("framesHint").textContent = `(${adjusted} / 24fps = ${effectiveSec}s)`;
  $("frames").value = adjusted;
}

// --- SELECTORES UNet / CLIP ---
function loadUnets(){
  const sel = $("unetSelect");
  if(!sel) return;
  sel.innerHTML = "";
  for(const u of (typeof AVAILABLE_UNETS !== "undefined" ? AVAILABLE_UNETS : [])){
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = u;
    sel.appendChild(opt);
  }
  const available = typeof AVAILABLE_UNETS !== "undefined" ? AVAILABLE_UNETS : [];
  const fb = available.find(u => u.includes("convrot")) || available.find(u => u.includes("minimax")) || available[0] || "minimaxh3/minimax_h3_fl2va_pruned_int8_convrot.safetensors";
  if(Array.from(sel.options).some(o => o.value === fb)) sel.value = fb;
}
loadUnets();

function loadClips(){
  const sel = $("clipSelect");
  if(!sel) return;
  sel.innerHTML = "";
  for(const c of (typeof AVAILABLE_CLIPS !== "undefined" ? AVAILABLE_CLIPS : [])){
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  }
  const fb = "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors";
  if(Array.from(sel.options).some(o => o.value === fb)) sel.value = fb;
}
loadClips();

function loadVaes(){
  const sel = $("vaeSelect");
  if(!sel) return;
  sel.innerHTML = "";
  for(const v of (typeof AVAILABLE_VAES !== "undefined" ? AVAILABLE_VAES : [])){
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  }
  const defaultVae = BASE_GRAPH[N.VAE_VIDEO]?.inputs?.vae_name || (typeof AVAILABLE_VAES !== "undefined" ? AVAILABLE_VAES[0] : "") || "";
  if(defaultVae && Array.from(sel.options).some(o => o.value === defaultVae)) sel.value = defaultVae;
}
loadVaes();

function setDefaultSelectors(){
  const availableU = typeof AVAILABLE_UNETS !== "undefined" ? AVAILABLE_UNETS : [];
  const fbU = availableU.find(u => u.includes("convrot")) || availableU.find(u => u.includes("minimax")) || availableU[0] || "";
  const fbC = "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors";
  const availableV = typeof AVAILABLE_VAES !== "undefined" ? AVAILABLE_VAES : [];
  const fbV = BASE_GRAPH[N.VAE_VIDEO]?.inputs?.vae_name || availableV[0] || "";
  const unetSel = $("unetSelect");
  const clipSel = $("clipSelect");
  const vaeSel = $("vaeSelect");
  if(unetSel && (!unetSel.value || unetSel.value === "") && fbU) unetSel.value = fbU;
  if(clipSel && clipSel.value !== fbC && Array.from(clipSel.options).some(o => o.value === fbC)) clipSel.value = fbC;
  if(vaeSel && (!vaeSel.value || vaeSel.value === "") && fbV) vaeSel.value = fbV;
}

function loadInterpModels(){
  const sel = $("rifeModel");
  if(!sel) return;
  const models = (typeof AVAILABLE_INTERP_MODELS !== "undefined" && AVAILABLE_INTERP_MODELS.length)
    ? AVAILABLE_INTERP_MODELS
    : [
      "rife_v4.26.safetensors",
      "rife_v4.26_heavy.safetensors",
      "rife_v4.25.safetensors",
      "rife_v4.25_lite.safetensors",
      "rife_v4.25_heavy.safetensors",
      "film_net_fp16.safetensors"
    ];
  sel.innerHTML = "";
  for(const m of models){
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    sel.appendChild(opt);
  }
  const fb = "rife_v4.26.safetensors";
  if(Array.from(sel.options).some(o => o.value === fb)) sel.value = fb;
}
loadInterpModels();

function loadLatentPass2Selectors(){
  const unetSel = $("latentPass2Unet");
  if(unetSel){
    unetSel.innerHTML = "";
    const sameOpt = document.createElement("option");
    sameOpt.value = "";
    sameOpt.textContent = "— Mismo que Pase 1 (Recomendado, 0 VRAM extra) —";
    unetSel.appendChild(sameOpt);
    for(const u of (typeof AVAILABLE_UNETS !== "undefined" ? AVAILABLE_UNETS : [])){
      const opt = document.createElement("option");
      opt.value = u;
      opt.textContent = u;
      unetSel.appendChild(opt);
    }
    if(_latentUpscaleState.pass2Unet !== undefined){
      unetSel.value = _latentUpscaleState.pass2Unet;
    }
  }

  const loraSel = $("latentPass2Lora");
  if(loraSel){
    loraSel.innerHTML = "";
    const noneOpt = document.createElement("option");
    noneOpt.value = "";
    noneOpt.textContent = "— Ninguna (Muestreo nativo del modelo) —";
    loraSel.appendChild(noneOpt);

    const lorasList = (typeof AVAILABLE_LORAS !== "undefined" ? AVAILABLE_LORAS : []);
    for(const l of lorasList){
      const opt = document.createElement("option");
      opt.value = l;
      opt.textContent = l.split("/").pop();
      opt.title = l;
      loraSel.appendChild(opt);
    }
    // Default: taomate_h3_3step_comfy.safetensors
    const preferredLora = lorasList.find(l => /taomate_h3_3step_comfy/i.test(l))
      || lorasList.find(l => /taomate.*3step/i.test(l))
      || lorasList.find(l => /3step|turbo/i.test(l))
      || "";
    const savedLora = _latentUpscaleState.pass2Lora;
    const matchOption = Array.from(loraSel.options).find(o => o.value === savedLora || (savedLora && (o.value.endsWith(savedLora) || savedLora.endsWith(o.value))));
    if(matchOption){
      loraSel.value = matchOption.value;
    } else if(preferredLora){
      loraSel.value = preferredLora;
    }
  }
  checkLatentPass2Warnings();
}
loadLatentPass2Selectors();

// Zoom/pan/fullscreen para imagen de entrada
const inputZoom = setupZoomPan("inputWrap", "inputImg", "btnResetZoomInput", "btnFullscreenInput");
const lastFrameZoom = setupZoomPan("lastFrameWrap", "lastFrameImg", "btnResetZoomLast", "btnFullscreenLast");

// Navegación cíclica por imágenes Krea2 recientes
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

// Click en el wrap de la imagen de entrada -> abrir file dialog
$("inputWrap").addEventListener("click", (e) => {
  if(inputZoom.isFullscreen()) return;
  if(e.target.closest("#btnResetZoomInput") || e.target.closest("#btnFullscreenInput") || e.target.closest("#btnClearInput")) return;
  if(inputZoom.wasPan && inputZoom.wasPan()) return;
  $("fileInput").click();
});
["dragenter","dragover"].forEach(ev=>$("inputWrap").addEventListener(ev,e=>{e.preventDefault();$("dropzone").classList.add("drag");}));
["dragleave","drop"].forEach(ev=>$("inputWrap").addEventListener(ev,e=>{e.preventDefault();$("dropzone").classList.remove("drag");}));
$("inputWrap").addEventListener("drop",e=>{if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);});

const dz=$("dropzone"),fileInput=$("fileInput");
dz.addEventListener("click",()=>fileInput.click());
["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("drag");}));
["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("drag");}));
dz.addEventListener("drop",e=>{if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);});
fileInput.addEventListener("change",e=>{if(e.target.files[0])handleFile(e.target.files[0]);});

// --- ÚLTIMO FRAME (flf2v) ---
const lfDz=$("lastFrameDropzone"),lfFileInput=$("lastFrameFileInput");
lfDz?.addEventListener("click",()=>lfFileInput.click());
["dragenter","dragover"].forEach(ev=>lfDz?.addEventListener(ev,e=>{e.preventDefault();lfDz.classList.add("drag");}));
["dragleave","drop"].forEach(ev=>lfDz?.addEventListener(ev,e=>{e.preventDefault();lfDz.classList.remove("drag");}));
lfDz?.addEventListener("drop",e=>{if(e.dataTransfer.files[0])handleLastFrameFile(e.dataTransfer.files[0]);});
lfFileInput?.addEventListener("change",e=>{if(e.target.files[0])handleLastFrameFile(e.target.files[0]);});
$("lastFrameWrap")?.addEventListener("click", (e) => {
  if(lastFrameZoom.isFullscreen()) return;
  if(e.target.closest("#btnResetZoomLast") || e.target.closest("#btnFullscreenLast") || e.target.closest("#btnClearLast")) return;
  if(lastFrameZoom.wasPan && lastFrameZoom.wasPan()) return;
  lfFileInput.click();
});
["dragenter","dragover"].forEach(ev=>$("lastFrameWrap")?.addEventListener(ev,e=>{e.preventDefault();lfDz?.classList.add("drag");}));
["dragleave","drop"].forEach(ev=>$("lastFrameWrap")?.addEventListener(ev,e=>{e.preventDefault();lfDz?.classList.remove("drag");}));
$("lastFrameWrap")?.addEventListener("drop",e=>{if(e.dataTransfer.files[0])handleLastFrameFile(e.dataTransfer.files[0]);});

function clearFirstFrame(){
  uploadedFirstImage = null;
  localFirstFile = null;
  dbDeleteMedia("firstImage").catch(()=>{});
  dbDeleteMedia("firstVideo").catch(()=>{});
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

  const lastImg = $("lastFrameImg");
  if(lastImg && lastImg.naturalWidth && lastImg.naturalHeight && lastImg.style.display !== "none"){
    updateDzInfo(lastImg.naturalWidth, lastImg.naturalHeight, $("lastFrameDzInfo"));
  } else {
    rawInputImageWidth = 0;
    rawInputImageHeight = 0;
    imageNativeAspectRatio = 16 / 9;
    updateArLabel(0, 0);
    recalcResolution();
  }
  log("Imagen de inicio eliminada.", "l-info");
}

function clearLastFrame(){
  uploadedLastImage = null;
  localLastFile = null;
  dbDeleteMedia("lastImage").catch(()=>{});
  const wrap = $("lastFrameWrap"), img = $("lastFrameImg"), actions = $("lastFrameActions");
  if(img){ img.src = ""; img.style.display = "none"; }
  if(wrap) wrap.style.visibility = "hidden";
  if(actions) actions.style.display = "none";
  const dz = $("lastFrameDropzone");
  if(dz) dz.style.display = "";
  const dzInfo = $("lastFrameDzInfo");
  if(dzInfo) dzInfo.textContent = "";
  const fileInp = $("lastFrameFileInput");
  if(fileInp) fileInp.value = "";
  if(lastFrameZoom) lastFrameZoom.resetZoom();

  const firstImg = $("inputImg");
  if(firstImg && firstImg.naturalWidth && firstImg.naturalHeight && firstImg.style.display !== "none"){
    updateDzInfo(firstImg.naturalWidth, firstImg.naturalHeight, $("dzInfo"));
  } else {
    rawInputImageWidth = 0;
    rawInputImageHeight = 0;
    imageNativeAspectRatio = 16 / 9;
    updateArLabel(0, 0);
    recalcResolution();
  }
  log("Ultimo frame eliminado.", "l-info");
}

$("btnClearInput")?.addEventListener("click", clearFirstFrame);
$("btnClearLast")?.addEventListener("click", clearLastFrame);

function handleFile(f, shouldSaveToGallery = true){
  uploadedFirstImage = null;
  localFirstFile = null;

  const isVideo = f.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/i.test(f.name);

  if(isVideo){
    $("dropzone").style.display = "";
    $("inputWrap").style.visibility = "hidden";
    $("imgInputActions").style.display = "none";
    handleVideoFile(f, shouldSaveToGallery);
    return;
  }

  const uniqueName = `temp_${Date.now()}_${f.name}`;
  localFirstFile = new File([f], uniqueName, {type: f.type});

  const frameSel = $("frameSelector");
  if(frameSel) frameSel.style.display = "none";

  const reader = new FileReader();
  reader.onload = (e) => {
    showInputImage(e.target.result);
    dbSaveMedia("firstImage", { kind: "file", name: f.name || "", type: f.type || "image/png", data: e.target.result }).catch(()=>{});
    log(`Imagen cargada: ${f.name}`, "l-ok");
  };
  reader.readAsDataURL(f);
}

function handleLastFrameFile(f){
  uploadedLastImage = null;
  localLastFile = null;
  const uniqueName = `temp_last_${Date.now()}_${f.name}`;
  localLastFile = new File([f], uniqueName, {type: f.type});
  const reader = new FileReader();
  reader.onload = (e) => {
    showLastFrameImage(e.target.result);
    dbSaveMedia("lastImage", { kind: "file", name: f.name || "", type: f.type || "image/png", data: e.target.result }).catch(()=>{});
    log(`Ultimo frame cargado: ${f.name}`, "l-ok");
  };
  reader.readAsDataURL(f);
}

function showInputImage(src){
  const wrap = $("inputWrap"), img = $("inputImg"), actions = $("imgInputActions");
  if(!wrap || !img) return;
  img.onload = () => {
    updateDzInfo(img.naturalWidth, img.naturalHeight, $("dzInfo"));
    inputZoom.resetZoom();
  };
  img.src = src;
  img.style.display = "block";
  wrap.style.visibility = "visible";
  actions.style.display = "flex";
  $("dropzone").style.display = "none";
}

function showLastFrameImage(src){
  const wrap = $("lastFrameWrap"), img = $("lastFrameImg"), actions = $("lastFrameActions");
  if(!wrap || !img) return;
  img.onload = () => {
    updateDzInfo(img.naturalWidth, img.naturalHeight, $("lastFrameDzInfo"));
    lastFrameZoom.resetZoom();
  };
  img.src = src;
  img.style.display = "block";
  wrap.style.visibility = "visible";
  actions.style.display = "flex";
  $("lastFrameDropzone").style.display = "none";
}


function handleVideoFile(file, shouldSaveToGallery = true){
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
      } catch(err){ callback(err); }
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
      } catch(err){ callback(err); }
    }
    vid.addEventListener("seeked", onSeeked, { once: true });
  }

  function setFrameAsInput(dataUrl, frameLabel){
    fetch(dataUrl).then(r => r.blob()).then(async blob => {
      const frameName = `temp_${Date.now()}_${file.name.replace(/\.[^.]+$/, '')}_${frameLabel}.jpg`;
      localFirstFile = new File([blob], frameName, {type: "image/jpeg"});
      showInputImage(dataUrl);
      dbSaveMedia("firstImage", { kind: "file", name: frameName, type: "image/jpeg", data: dataUrl }).catch(()=>{});
      log(`🎬 Vídeo cargado: ${file.name} (${frameLabel} frame como imagen de entrada)`, "l-ok");
      const workflow = await metaPromise;
      if(workflow){
        log(`📋 Workflow encontrado en ${file.name}`, "l-ok");
        await applyWorkflow(workflow);
      } else {
        log(`ℹ️ ${file.name} no contiene metadatos de workflow.`, "l-warn");
      }
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

// Convierte un local (data URL o File/Blob) a File y lo sube a /upload/image.
async function _uploadOneHot(_kind, local, name){
  let file;
  if(typeof local === "string" && local.startsWith("data:")){
    const r = await fetch(local);
    const blob = await r.blob();
    const ext = /image\/(png|jpeg|jpg|webp)/.exec(local.split(",")[0].slice(5))?.[1] || "png";
    const extMap = {jpeg:"jpg", jpg:"jpg"};
    file = new File([blob], name || ("ref_"+Date.now()+"."+(extMap[ext]||ext)), {type: blob.type || "image/png"});
  } else if(local instanceof Blob){
    file = new File([local], name || (local.name || "ref.png"), {type: local.type || "image/png"});
  } else {
    throw new Error("referencia inválida");
  }
  const fd = new FormData();
  fd.append("image", file, file.name.replace(/^temp_\d+_/, '').replace(/^temp_last_\d+_/, ''));
  fd.append("overwrite","true");
  const r = await fetch(server()+"/upload/image",{method:"POST",body:fd,signal:AbortSignal.timeout(300000)});
  if(!r.ok) throw new Error("fallo subida "+file.name);
  const d = await r.json();
  return {name:d.name, subfolder:d.subfolder||"", type:d.type||"input"};
}

async function ensureJobImagesUploaded(job){
  if(job.isFaceRefineOnly) return;
  if(job.mode === "r2v"){
    const rImages = job.refImages || refImages;
    for(let i=0; i<rImages.length; i++){
      const ref = rImages[i];
      if(ref.local && !ref.uploaded){
        try{
          ref.uploaded = await _uploadOneHot("image", ref.local, "ref_img_"+(i+1)+".png");
        } catch(e){ throw new Error("Fallo subida ref "+(i+1)+": "+e.message); }
      }
    }
    const rVideos = job.refVideos || refVideos;
    for(let i=0; i<rVideos.length; i++){
      const ref = rVideos[i];
      if(ref.file && !ref.uploaded){
        try{
          // Contrato de serve.py:_do_video_preprocess: campo "image" + scale/
          // ar_lock/trim_start/trim_end/skip_frames (el campo "video"/fps/
          // scale_res no existe en el backend y daba HTTP 400).
          const s = ref.settings || {};
          const fd = new FormData();
          fd.append("image", ref.file, ref.file.name || ("ref_video_"+i+".mp4"));
          fd.append("scale", String(s.scale != null ? s.scale : 1));
          fd.append("ar_lock", s.arLock ? "true" : "false");
          fd.append("trim_start", s.trimStart || "");
          fd.append("trim_end", s.trimEnd || "");
          fd.append("skip_frames", String(s.skip != null ? s.skip : 1));
          fd.append("use_audio", ref.useAudio !== false ? "true" : "false");
          fd.append("volume", String(ref.volume != null ? ref.volume : 1.0));
          const r = await fetch("/api/video_preprocess",{method:"POST",body:fd,signal:AbortSignal.timeout(600000)});
          if(!r.ok){ const t = await r.text().catch(()=> ""); throw new Error("HTTP "+r.status+" "+t.slice(0,150)); }
          const d = await r.json();
          ref.uploaded = d.video || null;
          ref.audioUploaded = d.audio || null;
          if(!ref.uploaded && !ref.audioUploaded) throw new Error(d.error || "sin resultado");
        } catch(e){ throw new Error("Fallo prep vídeo ref "+(i+1)+": "+e.message); }
      }
    }
    const rAudios = job.refAudios || refAudios;
    for(let i=0; i<rAudios.length; i++){
      const ref = rAudios[i];
      if(ref.local && !ref.uploaded){
        try{
          // Siempre vía ffmpeg: recorta el audio a la duración del clip
          // (mitigación OOM de la VAE de audio) y aplica volumen si != 1.
          if(true){
            const fd = new FormData();
            fd.append("image", ref.local, ref.local.name || ("ref_audio_"+(i+1)));
            const dur = parseFloat($("duration")?.value || "0");
            if(dur > 0) fd.append("trim_end", String(dur));
            if(ref.volume !== 1.0){
              fd.append("volume", String(ref.volume));
            }
            fd.append("use_audio","true");
            const r = await fetch("/api/video_preprocess",{method:"POST",body:fd,signal:AbortSignal.timeout(600000)});
            if(!r.ok) throw new Error("Fallo ffmpeg audio");
            const d = await r.json();
            ref.uploaded = d.audio || null;
            if(ref.uploaded && dur > 0){
              log(`🎵 Audio ref ${i+1} recortado a ${dur.toFixed(1)}s`, "l-ok");
            }
          } else {
            ref.uploaded = await _uploadOneHot("image", ref.local, ref.local.name || ("ref_audio_"+(i+1)));
          }
        } catch(e){ throw new Error("Fallo subida audio ref "+(i+1)+": "+e.message); }
      }
    }
    log("Referencias del job listas.","l-ok");
    return;
  }

  // Imagen de inicio (i2v / flf2v)
  if(!job.uploadedFirstImage){
    const f1 = job.localFirstFile || localFirstFile;
    if(f1){
      const fd1 = new FormData();
      fd1.append("image", f1, f1.name.replace(/^temp_\d+_/, ''));
      fd1.append("overwrite","true");
      const r1 = await fetch(server()+"/upload/image",{method:"POST",body:fd1,signal:AbortSignal.timeout(300000)});
      if(!r1.ok) throw new Error("Fallo al subir imagen de inicio");
      const d1 = await r1.json();
      job.uploadedFirstImage = {name:d1.name, subfolder:d1.subfolder||"", type:d1.type||"input"};
      uploadedFirstImage = {...job.uploadedFirstImage};
      log("Imagen de inicio subida: "+job.uploadedFirstImage.name,"l-ok");
    } else if(uploadedFirstImage && !job.localFirstFile){
      job.uploadedFirstImage = {...uploadedFirstImage};
    } else if(job.mode !== "flf2v" || (!job.localLastFile && !localLastFile && !job.uploadedLastImage && !uploadedLastImage)){
      throw new Error("No hay imagen de inicio seleccionada. Arrastra una imagen a la zona de inicio.");
    }
  }

  // Último frame (solo flf2v)
  if(job.mode === "flf2v" && !job.uploadedLastImage){
    const f2 = job.localLastFile || localLastFile;
    if(f2){
      const fd2 = new FormData();
      fd2.append("image", f2, f2.name.replace(/^temp_last_\d+_/, ''));
      fd2.append("overwrite","true");
      const r2 = await fetch(server()+"/upload/image",{method:"POST",body:fd2,signal:AbortSignal.timeout(300000)});
      if(!r2.ok) throw new Error("Fallo al subir último frame");
      const d2 = await r2.json();
      job.uploadedLastImage = {name:d2.name, subfolder:d2.subfolder||"", type:d2.type||"input"};
      uploadedLastImage = {...job.uploadedLastImage};
      log("Último frame subido: "+job.uploadedLastImage.name,"l-ok");
    } else if(uploadedLastImage && !job.localLastFile){
      job.uploadedLastImage = {...uploadedLastImage};
    }
  }

  if(job.mode !== "r2v" && !job.uploadedFirstImage && !job.uploadedLastImage){
    throw new Error("Selecciona una imagen de inicio o un último frame.");
  }
}

function buildGraph(job){
  const j = job || activeJob || null;
  const g = JSON.parse(JSON.stringify(BASE_GRAPH));

  // Prompt
  const pVal = ((j ? j.prompt : $("prompt").value) || "").trim();
  if(pVal){
    if(g[N.PROMPT_TEXT] && g[N.PROMPT_TEXT].inputs) g[N.PROMPT_TEXT].inputs.value = pVal;
    if(g[N.REF2V] && g[N.REF2V].inputs) g[N.REF2V].inputs.prompt = pVal;
  }

  // Seed (RandomNoise node 129)
  // Para seed fijo, usamos el seed del job activo o el valor actual del input.
  const sMode = j ? j.seedMode : seedMode;
  const sVal = j ? j.seedValue : parseInt($("seedVal")?.value || "12345", 10);
  g[N.NOISE].inputs.noise_seed = (sMode === "random") ? -1 : sVal;

  // Resolution & Megapixels
  const w = parseInt((j ? j.width : $("width").value) || "1120", 10);
  const h = parseInt((j ? j.height : $("height").value) || "640", 10);
  if(g[N.RES_SELECTOR] && g[N.RES_SELECTOR].inputs){
    g[N.RES_SELECTOR].inputs.megapixels = parseFloat((j ? j.mp : $("mpSlider").value) || "0.7");
    g[N.RES_SELECTOR].inputs.aspect_ratio = "16:9 (Widescreen)";
  }
  if(g[N.REF2V] && g[N.REF2V].inputs){
    g[N.REF2V].inputs.width = w;
    g[N.REF2V].inputs.height = h;
  }

  // Duración (segundos) → nodo PrimitiveFloat 132
  g[N.DURATION].inputs.value = parseFloat((j ? j.duration : $("duration").value) || "10");

  // UNet, CLIP & VAE Video
  const unetVal = (j ? j.unet : $("unetSelect")?.value) || "";
  const clipVal = (j ? j.clip : $("clipSelect")?.value) || "";
  const vaeVal = (j ? j.vae : $("vaeSelect")?.value) || "";
  if(g[N.UNET] && g[N.UNET].inputs && unetVal) g[N.UNET].inputs.unet_name = unetVal;
  if(g[N.CLIP] && g[N.CLIP].inputs && clipVal) g[N.CLIP].inputs.clip_name = clipVal;
  if(g[N.VAE_VIDEO] && g[N.VAE_VIDEO].inputs && vaeVal) g[N.VAE_VIDEO].inputs.vae_name = vaeVal;

  const modeVal = j ? j.mode : currentMode;
  if(modeVal === "r2v"){
    // MODO R2V: construir referencias sobre el nodo MiniMaxH3ReferenceToVideo (136)
    const r2v = g[N.REF2V];
    const rImages = j ? j.refImages : refImages;
    const rVideos = j ? j.refVideos : refVideos;
    const rAudios = j ? j.refAudios : refAudios;
    if(r2v && r2v.inputs){
      // Tamaño de referencias (match = rápido; max = máxima identidad, más lento)
      r2v.inputs.ref_image_size = (j ? (j.refImageSize || "match") : ($("refImageSize")?.value || "match"));
      // Limpiar refs previas del grafo base
      for(let i = 0; i < 9; i++){
        delete r2v.inputs["ref_images.ref_image_"+i];
      }
      for(let i = 0; i < 3; i++){
        delete r2v.inputs["ref_videos.ref_video_"+i];
        delete r2v.inputs["ref_video_audios.ref_video_audio_"+i];
        delete r2v.inputs["ref_audios.ref_audio_"+i];
      }
      // Imágenes de referencia (nodo 137 reutilizado para la 1ª; 200-205 para el resto)
      const imgKeys = ["200","201","202","203","204","205"];
      const usedImgKeys = new Set();
      rImages.forEach((ref, i) => {
        if(ref.uploaded){
          const key = (i === 0) ? "137" : imgKeys[i-1];
          g[key] = { class_type: "LoadImage", inputs: { image: (ref.uploaded.subfolder ? ref.uploaded.subfolder+"/" : "") + ref.uploaded.name }, _meta: { title: "Ref Image "+(i+1) } };
          r2v.inputs["ref_images.ref_image_"+i] = [key, 0];
          usedImgKeys.add(key);
        }
      });
      // Si no hay imagen de referencia, eliminar el LoadImage por defecto del grafo base
      if(!usedImgKeys.has("137") && g["137"]) delete g["137"];
      // Vídeos de referencia + sus audios
      for(let i = 0; i < rVideos.length; i++){
        const v = rVideos[i];
        if(v.uploaded){
          const vidKey = "21"+i;
          g[vidKey] = { class_type: "LoadVideo", inputs: { file: (v.uploaded.subfolder ? v.uploaded.subfolder+"/" : "") + v.uploaded.name }, _meta: { title: "Ref Video "+(i+1) } };
          r2v.inputs["ref_videos.ref_video_"+i] = [vidKey, 0];
          if(v.audioUploaded){
            const audKey = "22" + i;
            g[audKey] = { class_type: "LoadAudio", inputs: { audio: (v.audioUploaded.subfolder ? v.audioUploaded.subfolder+"/" : "") + v.audioUploaded.name }, _meta: { title: "Ref Video Audio "+(i+1) } };
            r2v.inputs["ref_video_audios.ref_video_audio_"+i] = [audKey, 0];
          }
        }
      }
      // Audios independientes
      for(let i = 0; i < rAudios.length; i++){
        const a = rAudios[i];
        if(a.uploaded){
          const audKey = "23" + i;
          g[audKey] = { class_type: "LoadAudio", inputs: { audio: (a.uploaded.subfolder ? a.uploaded.subfolder+"/" : "") + a.uploaded.name }, _meta: { title: "Ref Audio "+(i+1) } };
          r2v.inputs["ref_audios.ref_audio_"+i] = [audKey, 0];
        }
      }
    }
  } else {
    // MODO i2v / flf2v
    const firstImg = j ? j.uploadedFirstImage : uploadedFirstImage;
    const lastImg = (modeVal === "flf2v") ? (j ? j.uploadedLastImage : uploadedLastImage) : null;
    const r2v = g[N.REF2V];

    if(r2v && r2v.inputs){
      // Limpiar referencias previas
      for(let i = 0; i < 9; i++) delete r2v.inputs["ref_images.ref_image_"+i];
      delete r2v.inputs["ref_video_audios.ref_video_audio_0"];
      delete r2v.inputs["ref_videos.ref_video_0"];
      delete r2v.inputs["ref_audios.ref_audio_0"];

      if(firstImg && lastImg){
        // Caso 1: Ambos frames (FLF2V: first_frame -> Picture 1 / ref_0, last_frame -> Picture 2 / ref_1)
        if(g[N.IMAGE_FIRST]){
          g[N.IMAGE_FIRST].inputs.image = (firstImg.subfolder ? firstImg.subfolder+"/" : "") + firstImg.name;
          r2v.inputs["ref_images.ref_image_0"] = [N.IMAGE_FIRST, 0];
        }
        g["200"] = {
          class_type: "LoadImage",
          inputs: { image: (lastImg.subfolder ? lastImg.subfolder+"/" : "") + lastImg.name },
          _meta: { title: "Last Frame (Picture 2)" }
        };
        r2v.inputs["ref_images.ref_image_1"] = ["200", 0];
      } else if(firstImg){
        // Caso 2: Solo imagen de inicio (I2V)
        if(g[N.IMAGE_FIRST]){
          g[N.IMAGE_FIRST].inputs.image = (firstImg.subfolder ? firstImg.subfolder+"/" : "") + firstImg.name;
          r2v.inputs["ref_images.ref_image_0"] = [N.IMAGE_FIRST, 0];
        }
      } else if(lastImg){
        // Caso 3: Solo imagen final (L2VA)
        if(g[N.IMAGE_FIRST]){
          g[N.IMAGE_FIRST].inputs.image = (lastImg.subfolder ? lastImg.subfolder+"/" : "") + lastImg.name;
          r2v.inputs["ref_images.ref_image_0"] = [N.IMAGE_FIRST, 0];
        }
      }
    }
  }

  let currentModelNode = N.UNET;

  // 1. Backend denso de atención (ModelAttentionBackend).
  // Debe ir inmediatamente después del UNET base para que los optimizadores sparse (Sol-Attn / BlockSparse)
  // y Spectrum puedan envolver la atención sin que sus closures/overrides sean pisados downstream.
  const backendState = j ? j.attentionBackend : getAttentionBackendState();
  if(g[N.ATTN_BACKEND]){
    g[N.ATTN_BACKEND].inputs.model = [currentModelNode, 0];
    g[N.ATTN_BACKEND].inputs.attention = backendState.backend;
    currentModelNode = N.ATTN_BACKEND;
  }

  // 2. Optimizador sparse (exclusivo mutuo). Se aplica ANTES de SigmaShift/Spectrum.
  const optimizerState = j ? j.attentionOptimizer : getAttentionOptimizerState();
  const h3opt = j ? j.h3opt : getH3OptState();
  const aimdo = j ? j.aimdo : getAimdoState();

  // Limpiar nodos de optimizadores que no vamos a usar
  if(optimizerState.mode !== "h3-optimizations"){
    if(g[N.MEM_OPT]) delete g[N.MEM_OPT];
    if(g[N.SPARSE_ATTN]) delete g[N.SPARSE_ATTN];
    if(g[N.AIMDO]) delete g[N.AIMDO];
  }
  if(optimizerState.mode !== "block-sparse"){
    if(g[N.BLOCK_SPARSE]) delete g[N.BLOCK_SPARSE];
  }

  if(optimizerState.mode === "h3-optimizations"){
    if(h3opt.memOptEnabled){
      g[N.MEM_OPT] = {
        class_type: "H3MemoryOptimization",
        inputs: {
          model: [currentModelNode, 0],
          fused_qkv: "auto",
          mlp_memory: "auto",
          chunk_rows: 4096,
          preserve_precision: true,
          precision_mode: "Auto",
          qkv_streaming_mode: "Auto",
          embedding_memory_mode: "Auto",
          kitchen_v_memory_mode: "Standard"
        },
        _meta: { title: "H3 Memory Optimization" }
      };
      currentModelNode = N.MEM_OPT;
    }

    if(h3opt.sparseBackend && h3opt.sparseBackend !== "auto"){
      g[N.SPARSE_ATTN] = {
        class_type: "H3SparseAttentionAdvanced",
        inputs: {
          model: [currentModelNode, 0],
          video_budget: (typeof h3opt.videoBudget === "number") ? h3opt.videoBudget : 0.3,
          early_steps: h3opt.denserEarlyLate ? 8 : 0,
          early_kv: 0.6833,
          late_steps: 0,
          late_kv: 0.6833,
          backend: h3opt.sparseBackend,
          early_schedule: "Ramp",
          video_token_order: "1x8x8"
        },
        _meta: { title: "H3 Sparse Attention Advanced" }
      };
    } else {
      g[N.SPARSE_ATTN] = {
        class_type: "H3SparseAttention",
        inputs: {
          model: [currentModelNode, 0],
          video_budget: h3opt.videoBudget,
          denser_early_late_steps: h3opt.denserEarlyLate
        },
        _meta: { title: "H3 Sparse Attention" }
      };
    }
    currentModelNode = N.SPARSE_ATTN;

    if(aimdo.residency !== "stock"){
      g[N.AIMDO] = {
        class_type: "H3AIMDOResidencyLimiter",
        inputs: {
          model: [currentModelNode, 0],
          residency: aimdo.residency
        },
        _meta: { title: "H3 AIMDO Residency Limiter" }
      };
      currentModelNode = N.AIMDO;
    }

  } else if(optimizerState.mode === "block-sparse"){
    const solH3Check = j ? j.solH3 : getSolH3State();
    if(solH3Check && solH3Check.enabled){
      delete g[N.BLOCK_SPARSE];
      if(typeof log === "function") log("⚠️ Sol-H3 activo: omitiendo Block Sparse para priorizar kernel nativo SM120 y evitar conflicto de atención", "l-warn");
    } else {
      const bs = j ? j.blockSparse : getBlockSparseState();
      const mode = BLOCK_SPARSE_MODES[bs.selection] || "sol-attn";
      const isSolAttn = mode === "sol-attn";
      const isVsa = mode === "vsa";
      if(isVsa){
        // Checkpoint VSA-trained (FastH3): el pack exige el nodo dedicado, que
        // reproduce el patrón learnado (tiling 4x4x4, top-k, coarse branch).
        // El combo BlockSparse/vsa usa otro operating point y no es la ruta.
        const keep = (typeof bs.keepPercent === "number" && bs.keepPercent > 0) ? bs.keepPercent : 20;
        g[N.BLOCK_SPARSE] = {
          class_type: "H3VSAAttention",
          inputs: {
            model: [currentModelNode, 0],
            keep_percent: keep,
            dense_first_steps: 0,
            dense_layers: "",
            backend: "Auto",
            memory_mode: "Standard",
            verbose: false
          },
          _meta: { title: "H3 VSA Attention (FastH3)" }
        };
        currentModelNode = N.BLOCK_SPARSE;
        log(`⚡ VSA (FastH3): keep_percent ${keep}% (${keep === 20 ? "valor entrenado FastH3 8-Step V2" : keep === 10 ? "valor entrenado Preview v1" : "no trained value, revisa el operando"})`);
      } else {
        // Formato plano V3: la key del DynamicCombo es el modo interno; los sub-inputs se envían con punto.
        const blockSparseInputs = {
          model: [currentModelNode, 0],
          selection: mode,
          start_percent: bs.startPercent,
          end_percent: bs.endPercent,
          dense_blocks: "",
          min_tokens: 12288,
          extra_tokens: 256,
          sink_conditioning: "exact_kv_and_rows",
          verbose: false
        };
        if(isSolAttn) blockSparseInputs["selection.tau"] = bs.tau ?? 1.3;
        else blockSparseInputs["selection.keep_percent"] = 10.0;
        g[N.BLOCK_SPARSE] = {
          class_type: "BlockSparseAttention",
          inputs: blockSparseInputs,
          _meta: { title: "Block Sparse Attention" }
        };
        currentModelNode = N.BLOCK_SPARSE;
      }

      // En flf2v, AIMDO entra en conflicto con BlockSparseAttention + 2 frames
      if(currentMode === "flf2v" && aimdo.residency !== "stock"){
        log("⚠️ flf2v + Block Sparse: AIMDO desactivado automáticamente para evitar aimdo memory compile error", "l-warn");
      }
    }
  }

  // 2b. AIMDO: solo insertar si no hay conflicto con Block Sparse en flf2v
  if(optimizerState.mode === "block-sparse" && currentMode === "flf2v"){
    // omitir AIMDO en flf2v+BlockSparse
  } else if(aimdo.residency !== "stock"){
    // Ya se insertó arriba en modo h3-optimizations; este bloque cubre fallback
    if(optimizerState.mode !== "h3-optimizations"){
      g[N.AIMDO] = {
        class_type: "H3AIMDOResidencyLimiter",
        inputs: {
          model: [currentModelNode, 0],
          residency: aimdo.residency
        },
        _meta: { title: "H3 AIMDO Residency Limiter" }
      };
      currentModelNode = N.AIMDO;
    }
  }

  // 3. Sigma Shift (MiniMaxH3SigmaShift)
  if(g[N.SIGMA_SHIFT]){
    const ss = j ? j.sigmaShift : getSigmaShiftState();
    g[N.SIGMA_SHIFT].inputs.model = [currentModelNode, 0];
    g[N.SIGMA_SHIFT].inputs.shift_video = ss.shiftVideo;
    g[N.SIGMA_SHIFT].inputs.shift_audio = ss.shiftAudio;
    currentModelNode = N.SIGMA_SHIFT;
  }

  // 4. Spectrum
  if(g[N.SPECTRUM] && g[N.SPECTRUM].inputs){
    const s = j ? j.spectrum : getSpectrumState();
    g[N.SPECTRUM].inputs.model = [currentModelNode, 0];
    g[N.SPECTRUM].inputs.enabled = s.enabled;
    g[N.SPECTRUM].inputs.blend_weight = s.blend;
    g[N.SPECTRUM].inputs.flex_window = s.flex;
    g[N.SPECTRUM].inputs.warmup_steps = s.warmup;
    g[N.SPECTRUM].inputs.bootstrap_first_forecast = s.bootstrapFirstForecast !== false;
    g[N.SPECTRUM].inputs.history_storage = s.historyStorage || "vram";
    g[N.SPECTRUM].inputs.offline_smoothing_replay = false;
    g[N.SPECTRUM].inputs.debug = false; // true = logs FORECAST/ACTUAL por consola backend (debug, no default)
    currentModelNode = N.SPECTRUM;
  }

  // 6. Model Preview Override (preview animado, sin taeh3).
  // tiny_vae="none" fuerza el fallback `_decode_video_frames_l2rgb` de KJNodes:
  // lee los latent_rgb_factors de MiniMaxH3Video, decodifica 16 frames del latente
  // y los anima via WS. NO usar "taesd" como preview_method (crashea con taeh3:
  // first_stage_model=None). Con suppress_default_preview=true evitamos doble preview.
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

  // Limpiar nodos de switch estáticos no necesarios de la plantilla
  delete g["141"]; delete g["142"]; delete g["143"]; delete g["144"]; delete g["146"];
  delete g["156"]; delete g["157"]; delete g["160"];

  // 7. Proceso de LoRAs dinámico
  const jobLoras = j ? j.loras : loras;
  for(let i = 0; i < jobLoras.length; i++){
    const loraObj = jobLoras[i];
    const name = loraObj ? loraObj.lora : "";
    let resolvedName = name;
    let exists = false;
    if(name && typeof AVAILABLE_LORAS !== "undefined"){
      const targetBase = name.replace(/^.*\//, "").toLowerCase();
      const matched = AVAILABLE_LORAS.find(al => al.replace(/^.*\//, "").toLowerCase() === targetBase || al === name);
      if(matched){ resolvedName = matched; exists = true; }
    }
    const shouldBypass = !loraObj || !loraObj.on || !exists || !resolvedName;
    if(shouldBypass){
      if(i === 0) delete g[N.LORA1];
    } else {
      const nodeKey = (i === 0) ? N.LORA1 : "145_2";
      g[nodeKey] = {
        class_type: "LoraLoaderModelOnly",
        inputs: {
          model: [currentModelNode, 0],
          lora_name: resolvedName,
          strength_model: (typeof loraObj.strength === "number") ? loraObj.strength : 1.0
        },
        _meta: { title: `Load LoRA ${i+1}` }
      };
      currentModelNode = nodeKey;
    }
  }

  // 6c. Sol-H3 SOL Attention (Experimental) — kernel CuTe SM120 para Blackwell
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

  // MODO ON-DEMAND: Refinar rostro del clip actual sin re-muestrear el vídeo principal
  if(j && j.isFaceRefineOnly){
    const frState = j.faceRefine || getFaceRefineState();
    const sourceMedia = j.sourceMedia || currentMedia[1];
    const videoFilePath = (sourceMedia && sourceMedia.subfolder ? sourceMedia.subfolder + "/" : "") + (sourceMedia ? sourceMedia.filename : "") + " [output]";

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

    // Sub-grafo FaceRefine
    g[N.FACE_CROP] = {
      class_type: "H3FaceTrackCrop",
      inputs: {
        images: [N.FACE_COMPONENTS, 0],
        detector: "face_yolov8m.pt",
        confidence: 0.35,
        crop_factor: 3.0,
        canvas_width: 768,
        canvas_height: 768,
        canvas_mode: "auto_capped_768",
        smooth_window: 21,
        size_smooth_window: 51,
        smooth_method: "gaussian",
        size_mode: "per_frame",
        identity_track: false,
        identity_threshold: 0.28,
        select: frState.select || "largest_face",
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

    const frPrompt = pVal || "cinematic face, natural expression, ultra high detail, sharp focus, 8k";
    const frRef2vInputs = {
      clip: [N.CLIP, 0],
      vae: [N.VAE_VIDEO, 0],
      audio_vae: [N.VAE_AUDIO, 0],
      prompt: frPrompt,
      width: [N.FACE_CROP, 4],
      height: [N.FACE_CROP, 5],
      length: [N.FACE_CROP, 6],
      ref_image_size: "match",
      "ref_audios.ref_audio_0": [N.FACE_COMPONENTS, 1]
    };
    if(g[N.IMAGE_FIRST]){
      frRef2vInputs["ref_images.ref_image_0"] = [N.IMAGE_FIRST, 0];
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
        vae: [N.VAE_VIDEO, 0]
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
        steps: 8,
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

    g[N.FACE_SAMPLER] = {
      class_type: "SamplerCustomAdvanced",
      inputs: {
        noise: [N.FACE_NOISE, 0],
        guider: [N.FACE_GUIDER, 0],
        sampler: [N.SAMPLER_SELECT, 0],
        sigmas: [N.FACE_SCHEDULER, 0],
        latent_image: [N.FACE_PERFRAME_DENOISE, 0]
      },
      _meta: { title: "Sample Face Latent" }
    };

    g[N.FACE_DECODE] = {
      class_type: "VAEDecode",
      inputs: {
        samples: [N.FACE_SAMPLER, 0],
        vae: [N.VAE_VIDEO, 0]
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

    // Reempaquetar vídeo final nativo
    g[N.CREATE_VIDEO] = {
      class_type: "CreateVideo",
      inputs: {
        fps: 24,
        bit_depth: 8,
        color_space: "sRGB",
        images: [N.FACE_STITCH, 0],
        audio: [N.FACE_COMPONENTS, 1]
      },
      _meta: { title: "Create Video (Native)" }
    };
    g[N.SAVE] = {
      class_type: "SaveVideo",
      inputs: {
        filename_prefix: "video/MiniMax_H3_FaceRefined",
        format: "auto",
        "format.codec": "auto",
        codec: "auto",
        video: [N.CREATE_VIDEO, 0]
      },
      _meta: { title: "Save Video (Native)" }
    };

    // Descartar nodos del flujo de generación base
    delete g[N.SAMPLER];
    delete g[N.SCHEDULER];
    delete g[N.GUIDER];
    delete g[N.NOISE];
    delete g[N.DURATION];
    delete g[N.MATH];
    delete g[N.RES_SELECTOR];
    delete g[N.REF2V];
    delete g[N.LATENT_UPSCALE];
    delete g[N.AV_SPLIT];
    delete g[N.AV_CONCAT];
    delete g[N.UNET2];
    delete g[N.ATTN2];
    delete g[N.LORA_TURBO2];
    delete g[N.SIGMA_SHIFT2];
    delete g[N.PREVIEW2];
    delete g[N.SIGMAS2];
    delete g[N.GUIDER2];
    delete g[N.SAMPLER2];
    delete g[N.MEM_OPT2];
    delete g[N.SPARSE_ATTN2];
    delete g[N.AIMDO2];
    delete g[N.SOL_H3_2];
    delete g[N.DECODE_VIDEO_1];
    delete g[N.DECODE_AUDIO_1];
    delete g[N.CREATE_VIDEO_1];
    delete g[N.FIRST_SAVE];
    delete g[N.DECODE_VIDEO];
    delete g[N.DECODE_AUDIO];
    delete g[N.AUDIO_FIRST];
    delete g[N.AUDIO_VOL];
    delete g[N.RTX_SR];
    delete g[N.RIFE_LOADER];
    delete g[N.RIFE_INTERP];

    return g;
  }

  // 7. Scheduler y Guider conectados a currentModelNode
  if(g[N.SCHEDULER] && g[N.SCHEDULER].inputs){
    g[N.SCHEDULER].inputs.model = [currentModelNode, 0];
    g[N.SCHEDULER].inputs.scheduler = (j ? j.schedulerName : $("schedulerName").value);
    g[N.SCHEDULER].inputs.steps = parseInt((j ? j.steps : $("stepsSlider").value) || "20", 10);
  }
  if(g[N.GUIDER] && g[N.GUIDER].inputs){
    g[N.GUIDER].inputs.model = [currentModelNode, 0];
    if(g[N.REF2V]) g[N.GUIDER].inputs.conditioning = [N.REF2V, 0];
  }

  // 8. Sampler
  if(g[N.SAMPLER_SELECT] && g[N.SAMPLER_SELECT].inputs){
    g[N.SAMPLER_SELECT].inputs.sampler_name = (j ? j.samplerName : $("samplerName").value);
  }

  // 9. Bit depth en CreateVideo
  const bitDepth = j ? j.bitDepth : getBitDepth();
  if(g[N.CREATE_VIDEO] && g[N.CREATE_VIDEO].inputs){
    g[N.CREATE_VIDEO].inputs.bit_depth = bitDepth;
  }

  const prefix = (j ? j.filenamePrefix : $("filenamePrefix")?.value)?.trim() || "video/MiniMax_H3";
  if(g[N.SAVE] && g[N.SAVE].inputs){
    g[N.SAVE].inputs.filename_prefix = prefix;
  }

  // 9b. Latent Upscaler 3D (MiniMax H3) — con soporte de 2º Sampler de refinado (Hires-Fix)
  const latentState = j ? j.latentUpscale : getLatentUpscaleState();
  const latentUpscaleEnabled = latentState ? latentState.enabled : false;
  const latentScale = latentState ? parseFloat(latentState.scale || "1.5") : 1.5;
  const pass2Enabled = latentUpscaleEnabled && (latentState.pass2 !== false);

  if(latentUpscaleEnabled){
    // 1. Nodo Latent Upscaler 3D
    g[N.LATENT_UPSCALE] = {
      inputs: {
        latent: pass2Enabled ? [N.AV_SPLIT, 0] : [N.SAMPLER, 0],
        model_name: "minimax_h3_latent_upscaler_3d_conv_v1_bf16.safetensors",
        mode: "scale by multiplier",
        "mode.scale": latentScale,
        scale: latentScale,
        align: 32,
        enable_temporal_chunking: true,
        force_unload: true,
        device: "cuda",
        precision: "bf16"
      },
      class_type: "MinimaxH3LatentUpscaler3D",
      _meta: {
        title: "MiniMax H3 Latent Upscaler (3D)"
      }
    };

    if(pass2Enabled){
      // 2. LTXVSeparateAVLatent: separar vídeo y audio del latente nested de Sampler 1 (samples slot 0)
      g[N.AV_SPLIT] = {
        class_type: "LTXVSeparateAVLatent",
        inputs: {
          av_latent: [N.SAMPLER, 0]
        },
        _meta: { title: "Separate AV Latent (Pass 1)" }
      };

      // 3. LTXVConcatAVLatent: juntar vídeo escalado con audio original del pase 1
      g[N.AV_CONCAT] = {
        class_type: "LTXVConcatAVLatent",
        inputs: {
          video_latent: [N.LATENT_UPSCALE, 0],
          audio_latent: [N.AV_SPLIT, 1]
        },
        _meta: { title: "Concat Upscaled AV Latent" }
      };

      // 4. Cadena de Modelo del Pase 2:
      // Construir modelo base para el pase 2 (mismo UNet o modelo dedicado)
      const p2Unet = latentState.pass2Unet || "";
      let model2Node = currentModelNode;

      if(p2Unet && p2Unet.trim() !== ""){
        // Modelo dedicado para el pase 2
        g[N.UNET2] = {
          class_type: "UNETLoader",
          inputs: {
            unet_name: p2Unet.trim(),
            weight_dtype: "default"
          },
          _meta: { title: "UNet Loader Pase 2" }
        };
        model2Node = N.UNET2;

        // Atención densa para el UNet 2
        g[N.ATTN2] = {
          class_type: "ModelAttentionBackend",
          inputs: {
            model: [model2Node, 0],
            attention: backendState.backend || "comfy kitchen attention"
          },
          _meta: { title: "Attention Backend Pase 2" }
        };
        model2Node = N.ATTN2;
      } else {
        delete g[N.UNET2];
        delete g[N.ATTN2];
      }

      // Si hay Turbo LoRA para el pase 2 (o el modelo pase 2 es nuevo),
      // debemos partir del UNet base limpio (o UNET2) para no apilar la Turbo LoRA del pase 1
      const p2Lora = (latentState.pass2Lora || "").trim();
      const p2Strength = (typeof latentState.pass2LoraStrength === "number") ? latentState.pass2LoraStrength : 1.0;

      if(p2Lora){
        // Si no se creó UNET2 específico, creamos una rama desde UNET1 limpio con atención
        if(!g[N.UNET2]){
          g[N.ATTN2] = {
            class_type: "ModelAttentionBackend",
            inputs: {
              model: [N.UNET, 0],
              attention: backendState.backend || "comfy kitchen attention"
            },
            _meta: { title: "Attention Backend Pase 2" }
          };
          model2Node = N.ATTN2;
        }

        // Optimizaciones de memoria y atención para Pase 2 (crucial para evitar OOM a resolución escalada)
        if(optimizerState.mode === "h3-optimizations"){
          if(h3opt.memOptEnabled){
            g[N.MEM_OPT2] = {
              class_type: "H3MemoryOptimization",
              inputs: {
                model: [model2Node, 0],
                fused_qkv: "auto",
                mlp_memory: "auto",
                chunk_rows: 4096,
                preserve_precision: true,
                precision_mode: "Auto",
                qkv_streaming_mode: "Auto",
                embedding_memory_mode: "Auto",
                kitchen_v_memory_mode: "Standard"
              },
              _meta: { title: "H3 Memory Optimization Pase 2" }
            };
            model2Node = N.MEM_OPT2;
          } else {
            delete g[N.MEM_OPT2];
          }

          if(h3opt.sparseBackend && h3opt.sparseBackend !== "auto"){
            g[N.SPARSE_ATTN2] = {
              class_type: "H3SparseAttentionAdvanced",
              inputs: {
                model: [model2Node, 0],
                video_budget: (typeof h3opt.videoBudget === "number") ? h3opt.videoBudget : 0.3,
                early_steps: 0,
                early_kv: 0.6833,
                late_steps: 0,
                late_kv: 0.6833,
                backend: h3opt.sparseBackend,
                early_schedule: "Ramp",
                video_token_order: "1x8x8"
              },
              _meta: { title: "H3 Sparse Attention Advanced Pase 2" }
            };
          } else {
            g[N.SPARSE_ATTN2] = {
              class_type: "H3SparseAttention",
              inputs: {
                model: [model2Node, 0],
                video_budget: h3opt.videoBudget,
                denser_early_late_steps: false
              },
              _meta: { title: "H3 Sparse Attention Pase 2" }
            };
          }
          model2Node = N.SPARSE_ATTN2;

          if(aimdo.residency !== "stock"){
            g[N.AIMDO2] = {
              class_type: "H3AIMDOResidencyLimiter",
              inputs: {
                model: [model2Node, 0],
                residency: aimdo.residency
              },
              _meta: { title: "H3 AIMDO Residency Limiter Pase 2" }
            };
            model2Node = N.AIMDO2;
          } else {
            delete g[N.AIMDO2];
          }

        } else {
          delete g[N.MEM_OPT2];
          delete g[N.SPARSE_ATTN2];
          delete g[N.AIMDO2];
        }

        // Cargar Turbo LoRA (ej. taomate 3step)
        g[N.LORA_TURBO2] = {
          class_type: "LoraLoaderModelOnly",
          inputs: {
            model: [model2Node, 0],
            lora_name: p2Lora,
            strength_model: p2Strength
          },
          _meta: { title: "Turbo LoRA Pase 2" }
        };
        model2Node = N.LORA_TURBO2;

        // Inheritar LoRAs de estilo del usuario (excluyendo destilaciones turbo)
        for(let li = 0; li < jobLoras.length; li++){
          const lObj = jobLoras[li];
          if(lObj && lObj.on && lObj.lora){
            const isTurbo = /turbo|step|acc|lightx2v|fast|hyperflow/i.test(lObj.lora);
            if(!isTurbo){
              const styleKey = "404_style_" + li;
              g[styleKey] = {
                class_type: "LoraLoaderModelOnly",
                inputs: {
                  model: [model2Node, 0],
                  lora_name: lObj.lora,
                  strength_model: (typeof lObj.strength === "number") ? lObj.strength : 1.0
                },
                _meta: { title: `Style LoRA Pase 2 (${li+1})` }
              };
              model2Node = styleKey;
            }
          }
        }

        // Sol-H3 en pase 2 si está activo
        const solH3State = j ? j.solH3 : getSolH3State();
        if(solH3State && solH3State.enabled){
          g[N.SOL_H3_2] = {
            class_type: "SolH3Experimental",
            inputs: {
              model: [model2Node, 0],
              exact_fusion: solH3State.exact_fusion !== false,
              tau: (typeof solH3State.tau === "number") ? solH3State.tau : 1.0,
              dense_evaluations: 1,
              dense_layers: 2
            },
            _meta: { title: "Sol-H3 SOL Attention Pase 2" }
          };
          model2Node = N.SOL_H3_2;
        } else {
          delete g[N.SOL_H3_2];
        }

        // SigmaShift para la cadena del pase 2
        if(g[N.SIGMA_SHIFT]){
          const ss = j ? j.sigmaShift : getSigmaShiftState();
          g[N.SIGMA_SHIFT2] = {
            class_type: "MiniMaxH3SigmaShift",
            inputs: {
              model: [model2Node, 0],
              shift_video: ss.shiftVideo,
              shift_audio: ss.shiftAudio
            },
            _meta: { title: "Sigma Shift Pase 2" }
          };
          model2Node = N.SIGMA_SHIFT2;
        } else {
          delete g[N.SIGMA_SHIFT2];
        }

      } else {
        delete g[N.LORA_TURBO2];
        delete g[N.SIGMA_SHIFT2];
        delete g[N.MEM_OPT2];
        delete g[N.SPARSE_ATTN2];
        delete g[N.AIMDO2];
        delete g[N.SOL_H3_2];
      }

      // 5. BasicGuider para el pase 2: reutiliza condicionamiento de ReferenceToVideo
      g[N.GUIDER2] = {
        class_type: "BasicGuider",
        inputs: {
          model: [model2Node, 0],
          conditioning: [N.REF2V, 0]
        },
        _meta: { title: "Guider Pase 2" }
      };

      // 6. BasicScheduler para el pase 2 con control Denoise nativo (3 pasos exactos)
      const p2Denoise = (latentState && typeof latentState.pass2Denoise === "number")
        ? Math.min(1.0, Math.max(0.05, latentState.pass2Denoise))
        : 0.60;
      g[N.SIGMAS2] = {
        class_type: "BasicScheduler",
        inputs: {
          model: [model2Node, 0],
          scheduler: "simple",
          steps: 3,
          denoise: p2Denoise
        },
        _meta: { title: "Scheduler Pase 2 (Denoise)" }
      };

      // 7. SamplerCustomAdvanced (Pase 2)
      g[N.SAMPLER2] = {
        class_type: "SamplerCustomAdvanced",
        inputs: {
          noise: [N.NOISE, 0],
          guider: [N.GUIDER2, 0],
          sampler: [N.SAMPLER_SELECT, 0],
          sigmas: [N.SIGMAS2, 0],
          latent_image: [N.AV_CONCAT, 0]
        },
        _meta: { title: "Sampler Pase 2 (Refinado Hires-Fix)" }
      };

      // 8. Salidas directas hacia decoders (Pase 2)
      if(g[N.DECODE_VIDEO] && g[N.DECODE_VIDEO].inputs){
        g[N.DECODE_VIDEO].inputs.samples = [N.SAMPLER2, 0];
      }
      if(g[N.DECODE_AUDIO] && g[N.DECODE_AUDIO].inputs){
        g[N.DECODE_AUDIO].inputs.samples = [N.SAMPLER2, 0];
      }

      // 8b. Decodificación y guardado del 1er pase (resolución base) en la galería
      g[N.DECODE_VIDEO_1] = {
        class_type: "VAEDecode",
        inputs: {
          samples: [N.SAMPLER, 0],
          vae: [N.VAE_VIDEO, 0]
        },
        _meta: { title: "VAE Decode Video (Pass 1)" }
      };
      g[N.DECODE_AUDIO_1] = {
        class_type: "VAEDecodeAudio",
        inputs: {
          samples: [N.SAMPLER, 0],
          vae: [N.VAE_AUDIO, 0]
        },
        _meta: { title: "VAE Decode Audio (Pass 1)" }
      };
      g[N.CREATE_VIDEO_1] = {
        class_type: "CreateVideo",
        inputs: {
          fps: 24,
          bit_depth: bitDepth,
          color_space: "sRGB",
          images: [N.DECODE_VIDEO_1, 0],
          audio: [N.DECODE_AUDIO_1, 0]
        },
        _meta: { title: "Create Video Pass 1" }
      };
      g[N.FIRST_SAVE] = {
        class_type: "SaveVideo",
        inputs: {
          filename_prefix: prefix + "_pass1",
          format: "auto",
          "format.codec": "auto",
          codec: "auto",
          video: [N.CREATE_VIDEO_1, 0]
        },
        _meta: { title: "Save Video Pass 1" }
      };

    } else {
      // Latent upscale sin 2º pase (decodificación directa de latente interpolado)
      delete g[N.DECODE_VIDEO_1];
      delete g[N.DECODE_AUDIO_1];
      delete g[N.CREATE_VIDEO_1];
      delete g[N.FIRST_SAVE];
      delete g[N.AV_SPLIT];
      delete g[N.AV_CONCAT];
      delete g[N.UNET2];
      delete g[N.ATTN2];
      delete g[N.LORA_TURBO2];
      delete g[N.SIGMA_SHIFT2];
      delete g[N.PREVIEW2];
      delete g[N.SIGMAS2];
      delete g[N.GUIDER2];
      delete g[N.SAMPLER2];
      delete g[N.MEM_OPT2];
      delete g[N.SPARSE_ATTN2];
      delete g[N.AIMDO2];
      delete g[N.SOL_H3_2];

      if(g[N.DECODE_VIDEO] && g[N.DECODE_VIDEO].inputs){
        g[N.DECODE_VIDEO].inputs.samples = [N.LATENT_UPSCALE, 0];
      }
      if(g[N.DECODE_AUDIO] && g[N.DECODE_AUDIO].inputs){
        g[N.DECODE_AUDIO].inputs.samples = [N.SAMPLER, 0];
      }
    }

  } else {
    // Latent upscale desactivado por completo
    delete g[N.DECODE_VIDEO_1];
    delete g[N.DECODE_AUDIO_1];
    delete g[N.CREATE_VIDEO_1];
    delete g[N.FIRST_SAVE];
    delete g[N.LATENT_UPSCALE];
    delete g[N.AV_SPLIT];
    delete g[N.AV_CONCAT];
    delete g[N.UNET2];
    delete g[N.ATTN2];
    delete g[N.LORA_TURBO2];
    delete g[N.SIGMA_SHIFT2];
    delete g[N.PREVIEW2];
    delete g[N.SIGMAS2];
    delete g[N.GUIDER2];
    delete g[N.SAMPLER2];
    delete g[N.MEM_OPT2];
    delete g[N.SPARSE_ATTN2];
    delete g[N.AIMDO2];
    delete g[N.SOL_H3_2];

    if(g[N.DECODE_VIDEO] && g[N.DECODE_VIDEO].inputs){
      g[N.DECODE_VIDEO].inputs.samples = [N.SAMPLER, 0];
    }
    if(g[N.DECODE_AUDIO] && g[N.DECODE_AUDIO].inputs){
      g[N.DECODE_AUDIO].inputs.samples = [N.SAMPLER, 0];
    }
  }

  // 10. Refinado facial (H3 FaceRefine) — intercalado tras DECODE_VIDEO y antes de RIFE / RTX_SR
  const frState = j ? j.faceRefine : getFaceRefineState();
  const faceRefineEnabled = frState ? frState.enabled : false;
  let currentVideoImages = [N.DECODE_VIDEO, 0];

  if(faceRefineEnabled){
    g[N.FACE_CROP] = {
      class_type: "H3FaceTrackCrop",
      inputs: {
        images: [N.DECODE_VIDEO, 0],
        detector: "face_yolov8m.pt",
        confidence: 0.35,
        crop_factor: 3.0,
        canvas_width: 768,
        canvas_height: 768,
        canvas_mode: "auto_capped_768",
        smooth_window: 21,
        size_smooth_window: 51,
        smooth_method: "gaussian",
        size_mode: "per_frame",
        identity_track: false,
        identity_threshold: 0.28,
        select: frState.select || "largest_face",
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

    const frPrompt = pVal || "cinematic face, natural expression, ultra high detail, sharp focus, 8k";
    const frRef2vInputs = {
      clip: [N.CLIP, 0],
      vae: [N.VAE_VIDEO, 0],
      audio_vae: [N.VAE_AUDIO, 0],
      prompt: frPrompt,
      width: [N.FACE_CROP, 4],
      height: [N.FACE_CROP, 5],
      length: [N.FACE_CROP, 6],
      ref_image_size: "match"
    };
    if(g[N.IMAGE_FIRST]){
      frRef2vInputs["ref_images.ref_image_0"] = [N.IMAGE_FIRST, 0];
    }
    if(g[N.AUDIO_VOL]){
      frRef2vInputs["ref_audios.ref_audio_0"] = [N.AUDIO_VOL, 0];
    } else if(g[N.AUDIO_FIRST]){
      frRef2vInputs["ref_audios.ref_audio_0"] = [N.AUDIO_FIRST, 0];
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
        vae: [N.VAE_VIDEO, 0]
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
        steps: 8,
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

    const sMode = j ? j.seedMode : seedMode;
    const sVal = j ? j.seedValue : parseInt($("seedVal")?.value || "12345", 10);
    g[N.FACE_NOISE] = {
      class_type: "RandomNoise",
      inputs: {
        noise_seed: (sMode === "random") ? Math.floor(Math.random() * 100000000) : sVal
      },
      _meta: { title: "Face Noise" }
    };

    g[N.FACE_SAMPLER] = {
      class_type: "SamplerCustomAdvanced",
      inputs: {
        noise: [N.FACE_NOISE, 0],
        guider: [N.FACE_GUIDER, 0],
        sampler: [N.SAMPLER_SELECT, 0],
        sigmas: [N.FACE_SCHEDULER, 0],
        latent_image: [N.FACE_PERFRAME_DENOISE, 0]
      },
      _meta: { title: "Sample Face Latent" }
    };

    g[N.FACE_DECODE] = {
      class_type: "VAEDecode",
      inputs: {
        samples: [N.FACE_SAMPLER, 0],
        vae: [N.VAE_VIDEO, 0]
      },
      _meta: { title: "Decode Face Crops" }
    };

    g[N.FACE_STITCH] = {
      class_type: "H3FaceStitch",
      inputs: {
        base_images: [N.DECODE_VIDEO, 0],
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

    currentVideoImages = [N.FACE_STITCH, 0];
  } else {
    delete g[N.FACE_CROP];
    delete g[N.FACE_REF2V];
    delete g[N.FACE_INJECT];
    delete g[N.FACE_PERFRAME_DENOISE];
    delete g[N.FACE_SCHEDULER];
    delete g[N.FACE_GUIDER];
    delete g[N.FACE_NOISE];
    delete g[N.FACE_SAMPLER];
    delete g[N.FACE_DECODE];
    delete g[N.FACE_STITCH];
  }

  // 11. Frame Interpolation (RIFE / RTX Frame Gen) — se conecta después de FaceRefine y ANTES de RTXVideoSuperResolution
  const rifeState = j ? j.rife : getRifeState();
  const rifeEnabled = rifeState ? rifeState.enabled : true;
  const rifeMultiplier = rifeState ? parseInt(rifeState.multiplier || "2", 10) : 2;
  const rifeModel = rifeState ? (rifeState.model || "rife_v4.26.safetensors") : "rife_v4.26.safetensors";
  const rifeEngine = rifeState ? (rifeState.engine || "rife") : "rife";

  if(rifeEnabled){
    if(rifeEngine === "rtx"){
      delete g[N.RIFE_LOADER];
      g[N.RIFE_INTERP] = {
        inputs: {
          images: currentVideoImages,
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
          images: currentVideoImages,
          interp_model: [N.RIFE_LOADER, 0]
        },
        class_type: "FrameInterpolate",
        _meta: {
          title: "Frame Interpolate"
        }
      };
    }
    currentVideoImages = [N.RIFE_INTERP, 0];
    if(g[N.CREATE_VIDEO] && g[N.CREATE_VIDEO].inputs){
      g[N.CREATE_VIDEO].inputs.fps = 24 * rifeMultiplier;
    }
  } else {
    delete g[N.RIFE_LOADER];
    delete g[N.RIFE_INTERP];
    if(g[N.CREATE_VIDEO] && g[N.CREATE_VIDEO].inputs){
      g[N.CREATE_VIDEO].inputs.fps = 24;
    }
  }

  // 12. RTX Video Super Resolution (2x) — opcional tras RIFE/FaceRefine
  const rtxState = j ? j.rtx : getRtxState();
  const rtxEnabled = rtxState ? rtxState.enabled : true;
  const rtxQuality = rtxState ? (rtxState.quality || "ULTRA") : "ULTRA";

  if(rtxEnabled){
    g[N.RTX_SR] = {
      class_type: "RTXVideoSuperResolution",
      inputs: {
        resize_type: "scale by multiplier",
        "resize_type.scale": 2,
        quality: rtxQuality,
        images: currentVideoImages
      },
      _meta: {
        title: "RTX Video Super Resolution"
      }
    };
    if(g[N.CREATE_VIDEO] && g[N.CREATE_VIDEO].inputs){
      g[N.CREATE_VIDEO].inputs.images = [N.RTX_SR, 0];
    }
  } else {
    delete g[N.RTX_SR];
    if(g[N.CREATE_VIDEO] && g[N.CREATE_VIDEO].inputs){
      g[N.CREATE_VIDEO].inputs.images = currentVideoImages;
    }
  }

  return g;
}

function showVideo(slot, media, options={}){
  if(!media) return;
  const url=`${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder||"")}&type=${encodeURIComponent(media.type||"output")}#t=0.1`;
  const v=$("video"+slot), empty=$("empty"+slot), badge=$("badge"+slot), btn=$("btnLoadMeta"+slot), dl=$("btnDownload"+slot), sf=$("btnSaveFrame"+slot);
  const frBtn = $("btnFaceRefine"+slot);
  const upBtn = $("btnUpscale"+slot);
  const prev=$("previewImg"+slot), wrap=$("previewWrap"+slot), step=$("previewStep"+slot);
  if(prev) prev.style.display="none";
  if(wrap) wrap.style.display="none";
  if(step) step.style.display="none";
  v.crossOrigin = "anonymous";
  v.src = url;
  v.style.display = "block";
  empty.style.display = "none";
  if(options.autoplay !== false) v.play().catch(err => console.debug("Autoplay bloqueado:", err));
  if(btn) btn.disabled = false;
  if(dl) dl.style.display="inline-flex";
  if(sf) sf.style.display="inline-flex";
  if(frBtn) frBtn.style.display="inline-flex";
  if(upBtn) upBtn.style.display="inline-flex";
  currentMedia[slot] = { filename: media.filename, subfolder: media.subfolder||"", type: media.type||"output" };
  if(options.seed != null){
    currentMediaSeed[slot] = options.seed;
  }
  // Prompt que produjo el resultado mostrado: el guard de onPreview solo debe
  // ignorar frames tardíos cuando el reproductor muestra el resultado del MISMO
  // prompt en curso (si muestra uno anterior, el preview sí tiene que salir).
  // options.promptId === undefined => carga interna (displayVariantMedia) y
  // se usa el prompt en curso; promptId: null explícito => carga manual desde
  // el historial/galería, que no debe silenciar el preview de ningún prompt.
  const shownPrompt = (options.promptId !== undefined) ? options.promptId
    : (currentPromptId || null);
  currentMediaPrompt[slot] = shownPrompt;
  if(badge){
    if(options.badge != null){
      badge.textContent = options.badge;
    } else if(options.variantIndex != null){
      badge.textContent = `Var ${options.variantIndex}`;
    } else {
      badge.textContent = "final";
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

// --- Botón "Recuperar workflow" ---
const btnLoadMeta1 = $("btnLoadMeta1");
if(btnLoadMeta1){
  btnLoadMeta1.addEventListener("click", async () => {
    const media = currentMedia[1];
    if(!media){ log("⚠️ No hay vídeo cargado", "l-err"); return; }
    const url = `${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder)}&type=${encodeURIComponent(media.type)}`;
    btnLoadMeta1.disabled = true;
    const originalHTML = btnLoadMeta1.innerHTML;
    btnLoadMeta1.textContent = "⏳";
    try {
      const workflow = await extractWorkflowFromMP4(url);
      if(workflow){
        await applyWorkflow(workflow);
        log(`📋 Workflow restaurado desde ${media.filename}`, "l-ok");
      } else {
        log("ℹ️ Este vídeo no contiene metadatos de workflow.", "l-info");
      }
    } catch(err){
      log("❌ Error leyendo metadatos: "+err.message, "l-err");
    } finally {
      btnLoadMeta1.disabled = false;
      btnLoadMeta1.innerHTML = originalHTML;
    }
  });
}

// --- Botón "Descargar" ---
const btnDownload1 = $("btnDownload1");
if(btnDownload1){
  btnDownload1.addEventListener("click", async () => {
    const media = currentMedia[1];
    if(!media){ log("⚠️ No hay vídeo cargado", "l-err"); return; }
    const url = `${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder)}&type=${encodeURIComponent(media.type)}`;
    btnDownload1.disabled = true;
    const originalHTML = btnDownload1.innerHTML;
    btnDownload1.textContent = "⏳";
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
      log("❌ Error descargando: "+err.message, "l-err");
    } finally {
      btnDownload1.disabled = false;
      btnDownload1.innerHTML = originalHTML;
    }
  });
}

// --- Extraer frame ---
const FRAME_STEP = 1 / 24;

function nudgeFrame(delta){
  const v = $("video1");
  if(!v || !v.src || v.style.display === "none") return;
  const dur = v.duration || 0;
  if(!dur || !isFinite(dur)) return;
  v.pause();
  const t = Math.min(Math.max(0, (v.currentTime || 0) + delta * FRAME_STEP), dur);
  v.currentTime = t;
}

function captureFrameFromPlayer(){
  const v = $("video1");
  if(!v || !v.src || v.style.display === "none"){ log("⚠️ No hay vídeo cargado", "l-err"); return; }
  const btnSaveFrame1 = $("btnSaveFrame1");
  btnSaveFrame1.disabled = true;
  const originalHTML = btnSaveFrame1.innerHTML;
  btnSaveFrame1.textContent = "⏳";
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
        let resolved = false;
        const onSeeked = () => { v.removeEventListener("seeked", onSeeked); v.removeEventListener("error", onError); if(!resolved){ resolved = true; resolve(); } };
        const onError = () => { v.removeEventListener("seeked", onSeeked); v.removeEventListener("error", onError); if(!resolved){ resolved = true; reject(new Error("error durante seek")); } };
        const onTimeout = () => { v.removeEventListener("seeked", onSeeked); v.removeEventListener("error", onError); if(!resolved){ resolved = true; reject(new Error("timeout durante seek")); } };
        const timer = setTimeout(onTimeout, 5000);
        const settle = (fn) => { clearTimeout(timer); fn(); };
        v.removeEventListener("seeked", onSeeked);
        v.removeEventListener("error", onError);
        const onSeekedT = () => { settle(onSeeked); };
        const onErrorT = () => { settle(onError); };
        v.addEventListener("seeked", onSeekedT, { once: true });
        v.addEventListener("error", onErrorT, { once: true });
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
      const baseName = (currentMedia[1]?.filename || "video").replace(/\.[^.]+$/, "");
      showInputImage(dataUrl);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
      const frameFile = new File([blob], `${baseName}_frame_${targetTime.toFixed(2)}s.jpg`, { type: "image/jpeg" });
      localFirstFile = frameFile;
      uploadedFirstImage = null;
      log(`📸 Frame extraído a imagen de entrada: ${frameFile.name} (${canvas.width}×${canvas.height}) @ ${targetTime.toFixed(2)}s`, "l-ok");
    } catch(err){
      log("❌ Error guardando frame: "+err.message, "l-err");
    } finally {
      btnSaveFrame1.disabled = false;
      btnSaveFrame1.innerHTML = originalHTML;
    }
  })();
}

const btnSaveFrame1 = $("btnSaveFrame1");
if(btnSaveFrame1){
  btnSaveFrame1.addEventListener("click", captureFrameFromPlayer);
}

// --- Refinar rostro del clip actual (On-Demand) ---
async function enqueueFaceRefineCurrent(){
  const media = currentMedia[1];
  if(!media || !media.filename){
    log("No hay ningún vídeo en el reproductor para refinar.", "l-warn");
    return;
  }
  const job = snapshotJob();
  job.id = ++jobCounter;
  job.isFaceRefineOnly = true;
  job.sourceMedia = { ...media };
  job.batchSize = 1;
  log(`Añadido refinado facial para ${media.filename} a la cola.`, "l-info");
  if(activeJob){
    jobQueue.push(job);
    updateQueueUI();
  } else {
    await startJob(job);
  }
}

const btnFaceRefine1 = $("btnFaceRefine1");
if(btnFaceRefine1){
  btnFaceRefine1.addEventListener("click", enqueueFaceRefineCurrent);
}

// --- Upscale Latente (2º Pase) On-Demand ---
async function enqueueLatentUpscaleForVariant(card, seedValue){
  let seed = seedValue;
  if((seed == null || isNaN(seed)) && card && card.dataset && card.dataset.seed){
    seed = parseInt(card.dataset.seed, 10);
  }
  if((seed == null || isNaN(seed)) && currentMediaSeed[1] != null){
    seed = currentMediaSeed[1];
  }
  if(seed == null || isNaN(seed)){
    seed = parseInt($("seedVal")?.value || "12345", 10);
  }

  // Si Latent Upscale estaba desactivado en la interfaz, lo encendemos visualmente
  const luToggle = $("latentUpscaleToggle");
  if(luToggle && !luToggle.checked){
    luToggle.checked = true;
    if(typeof updateLatentUpscaleUI === "function") updateLatentUpscaleUI();
  }

  const job = snapshotJob();
  job.id = ++jobCounter;
  job.seedMode = "fixed";
  job.seedValue = seed;
  job.batchSize = 1;
  job.latentUpscale = {
    ...getLatentUpscaleState(),
    enabled: true,
    pass2: true
  };
  job.isLatentUpscaleRun = true;

  log(`🚀 Encolando Latent Upscale (2º pase) para la variante (semilla ${seed})...`, "l-ok");
  if(activeJob){
    jobQueue.push(job);
    updateQueueUI();
  } else {
    await startJob(job);
  }
}

const btnUpscale1 = $("btnUpscale1");
if(btnUpscale1){
  btnUpscale1.addEventListener("click", () => {
    enqueueLatentUpscaleForVariant(null, currentMediaSeed[1]);
  });
}

const vidbox1 = document.querySelector("#video1")?.closest(".vidbox");
if(vidbox1){
  vidbox1.addEventListener("keydown", (e) => {
    if(!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && ["ArrowLeft", "ArrowRight"].includes(e.key)){
      e.preventDefault();
      nudgeFrame(e.key === "ArrowRight" ? 1 : -1);
    } else if(e.key === "f" || e.key === "F"){
      captureFrameFromPlayer();
    }
  });
  vidbox1.setAttribute("tabindex", "0");
}

// --- VARIANT GALLERY ---
function createOrUpdatePlaceholderVariantCard(varIdx, seedUsed){
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
          <span class="variant-badge">Var ${parseInt(varIdx, 10) || 0} · procesando...</span>
          <span class="variant-progress-badge" style="display:none;"></span>
          <div class="thumb-wrap" style="position:relative;background:#000;min-height:120px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:4px 4px 0 0;">
            <img class="variant-live-thumb" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" style="display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;opacity:0.4;transition:opacity 0.2s;">
          </div>
          <div class="variant-info">
            <span class="variant-seed-display" title="Semilla">
              <span class="seed-text">${escapeHtml(String(seedUsed))}</span>
            </span>
            <span class="variant-time" title="Estado">⏳ En curso...</span>
          </div>
        `;
        grid.appendChild(card);
        const remaining = grid.querySelectorAll(".variant-card").length;
        $("variantCount").textContent = `(${remaining})`;
    }
}

function addToVariantGallery(media, seedValue, timeText, slot, variantIndex, typeShort = "final") {
    if(!media || !media.filename) {
        log("⚠️ No se encontró vídeo de salida para añadir a la galería de variantes.", "l-err");
        return;
    }
    const box = $("variantGalleryBox");
    const grid = $("variantGrid");
    box.style.display = "block";

    // Si existía tarjeta placeholder para esta variante, eliminarla antes de insertar la tarjeta interactiva final
    const existingPlaceholder = grid.querySelector(`.variant-card[data-variant-index="${variantIndex}"]`);
    if(existingPlaceholder) existingPlaceholder.remove();

    const meta = CONFIG.variantMeta ? CONFIG.variantMeta(seedValue, timeText) : null;
    const card = buildVariantCard(grid, box, media, seedValue, timeText, variantIndex, slot, typeShort, meta);

    const hasSeed = seedValue !== null && seedValue !== undefined;
    if(hasSeed) {
        card.dataset.seed = String(seedValue);
        const seedSpan = card.querySelector('.variant-seed-display');
        seedSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            copySeedToClipboard(seedSpan, seedValue);
        });
    }

    // Botón de Upscale rápido en la tarjeta de variante
    const iconsSpan = card.querySelector(".variant-icons");
    if(iconsSpan){
        const upBtn = document.createElement("button");
        upBtn.className = "variant-upscale-btn";
        upBtn.title = "Upscale Latente (2º pase) para esta variante";
        upBtn.innerHTML = "🔍";
        upBtn.onclick = (e) => {
            e.stopPropagation();
            enqueueLatentUpscaleForVariant(card, seedValue);
        };
        iconsSpan.insertBefore(upBtn, iconsSpan.firstChild);
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
        if(e.target.closest(".variant-seed-display") || e.target.closest(".variant-del-btn") || e.target.closest(".variant-upscale-btn")) return;
        const varIndex = parseInt(card.dataset.variantIndex, 10) || (currentBatchIndex + 1);
        const cardSeed = (seedValue !== null && seedValue !== undefined) ? seedValue : (card.dataset.seed ? parseInt(card.dataset.seed, 10) : null);
        showVideo(1, { filename: card.dataset.filename, subfolder: card.dataset.subfolder, type: card.dataset.type }, { variantIndex: varIndex, promptId: null, seed: cardSeed });
        log("▶ Vídeo cargado: "+card.dataset.filename, "l-ok");
    });

    // El contador refleja el número real de tarjetas en la galería, no variantCounter.
    const remaining = grid.querySelectorAll(".variant-card").length;
    $("variantCount").textContent = `(${remaining})`;
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
    const r = await fetch("/api/minimaxh3_list");
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
        card.innerHTML = `
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
              function findClip(w){
                for(const k of Object.keys(w)){
                  const n = w[k];
                  if(!n || !n.inputs) continue;
                  if(n.inputs.clip_name) return String(n.inputs.clip_name).split("/").pop();
                }
                return "";
              }
              const p = wf ? (wf["6"]?.inputs?.text || wf["50"]?.inputs?.value || "") : "";
              const modelName = wf ? findModel(wf) : "";
              const clipName = wf ? findClip(wf) : "";
              const rows = [];
              if(specs.resolution && specs.resolution !== "—") rows.push(["Resolución", specs.resolution]);
              if(specs.aspectRatio && specs.aspectRatio !== "—") rows.push(["A/R", specs.aspectRatio]);
              if(timing) rows.push(["Tiempo gen.", timing]);
              if(modelName) rows.push(["Modelo", modelName]);
              if(clipName) rows.push(["CLIP", clipName]);
              rows.push(
                ["Prompt", p ? (p.length > 80 ? p.slice(0, 77) + "..." : p) : "(vacío)"],
                ["Sampler", wf?.["123"]?.inputs?.sampler_name || "—"],
                ["Scheduler", wf?.["124"]?.inputs?.scheduler || "—"],
                ["Pasos", wf?.["124"]?.inputs?.steps || "—"],
                ["Seed", wf?.["15"]?.inputs?.noise_seed ?? "—"]
              );
              const loras = [];
              if(wf){
                for(const k of Object.keys(wf)){
                  if(wf[k]?.inputs?.lora_name){
                    loras.push(`${String(wf[k].inputs.lora_name).split("/").pop()} (${wf[k].inputs.strength_model || 1})`);
                  }
                }
              }
              if(loras.length) rows.push(["LoRAs", loras.join(", ")]);
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
          requestAnimationFrame(() => showVideo(1, media, { badge: baseName, autoplay: false, promptId: null }));
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
        const graph = buildGraph(activeJob);
        const jobSeedMode = activeJob ? activeJob.seedMode : seedMode;
        const jobSeedValue = activeJob ? activeJob.seedValue : parseInt($("seedVal").value || "12345", 10);
        const seedUsed = (jobSeedMode === "random") ? randomSeed() : (jobSeedMode === "evolve" ? activeJob.seedValue + index : jobSeedValue);
        if(graph[N.NOISE] && graph[N.NOISE].inputs) graph[N.NOISE].inputs.noise_seed = seedUsed;
        if(graph[N.FACE_NOISE] && graph[N.FACE_NOISE].inputs) graph[N.FACE_NOISE].inputs.noise_seed = seedUsed;

        // Reservamos un índice de variante global al inicio de cada flujo nuevo.
        if(activeJob && activeJob.currentVariantIndex == null){
          variantCounter++;
          activeJob.currentVariantIndex = variantCounter;
        }
        const varIndex = activeJob?.currentVariantIndex || (variantCounter + 1);

        if(activeJob && activeJob.isFaceRefineOnly){
          log(`Refinando rostro de ${activeJob.sourceMedia?.filename || "clip actual"}...`);
        } else {
          const spec = activeJob?.spectrum || getSpectrumState();
          const specInfo = spec.enabled ? `⚡ Spectrum ON [blend ${spec.blend.toFixed(2)}, flex ${spec.flex.toFixed(2)}, ${spec.historyStorage || 'vram'}]` : 'Spectrum OFF';
          log(`Procesando Var ${varIndex} (seed ${seedUsed}) · ${specInfo}...`);
        }
        // Previene el disparo de la auto-recuperación mientras el POST está en vuelo.
        jobH3UploadInProgress = true;
        const r = await fetch(server()+"/prompt",{
          method:"POST", headers:{"Content-Type":"application/json"},
          // Timeout: sin él, una conexión colgada deja activeJob vivo para siempre
          // y la cola entera atascada detrás ("pendientes" fantasma).
          signal: AbortSignal.timeout(60000),
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
        }).finally(() => { jobH3UploadInProgress = false; });
        // Durante el POST el backend va vacío: suspender la auto-recuperación
        // hasta que el prompt esté encolado (o el fetch muera por timeout).
        if(!r.ok){
            const t = await r.text().catch(()=> "");
            throw new Error("HTTP "+r.status+" "+t.slice(0,300));
        }
        const data = await r.json();
        if(data.error) throw new Error(JSON.stringify(data.error));

        pendingSeeds[data.prompt_id] = seedUsed;
        promptVariantMap[data.prompt_id] = varIndex;
        currentPromptId = data.prompt_id;
        createOrUpdatePlaceholderVariantCard(varIndex, seedUsed);
        startTimer(data.prompt_id, 1);
        pollFallback(data.prompt_id);
    } catch(err) {
        const isTimeout = (err && (err.name === "TimeoutError" || err.name === "AbortError"));
        log(`❌ No se pudo encolar${isTimeout ? " (timeout: el backend no respondió en 60s)" : ""}: ${err.message || err}`, "l-err");
        finishCurrentJob();
    }
}

async function startJob(job){
  activeJob = job;
  updateQueueUI();
  try {
    await ensureSocketConnected();
    jobH3UploadInProgress = true;
    try {
      await ensureJobImagesUploaded(job);
    } finally {
      jobH3UploadInProgress = false;
    }
    totalBatchSize = job.batchSize || 1;
    currentBatchIndex = 0;
    variantCounter = 0;
    batchSeedMode = job.seedMode === "random" ? "random" : "fixed";
    window.currentBatchMode = false;
    job.currentVariantIndex = null;
    $("time1").textContent = "";
    $("time1").classList.remove("live");
    setRun("busy", job.isFaceRefineOnly ? `Refinando rostro de ${job.sourceMedia?.filename || "clip"}...` : `Job #${job.id} en proceso · ${job.batchSize} variante(s)...`);
    enableStopButtons(true);
    await runSingleGeneration(0);
  } catch(err) {
    log(`Error al iniciar Job #${job.id}: ${err.message || err}`, "l-err");
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
    // Preview de muestreo obsoleto al quedar en reposo (final de job, error o stop).
    clearPreview();
    log("🏁 Cola vacía. Todos los jobs completados.", "l-ok");
    enableStopButtons(false);
    updateQueueUI();
  }
}

async function enqueueGeneration(){
  // Mitigación OOM: liberar VRAM del backend antes de encolar (no interrumpe
  // jobs en curso; aplica cuando el worker itere).
  try { fetch(server()+"/free", { method:"POST", headers:{"Content-Type":"application/json"}, body:"{\"unload_models\":true}" }).catch(()=>{}); } catch(_){}
  const job = snapshotJob();
  if(activeJob){
    jobQueue.push(job);
    updateQueueUI();
    log(`📥 Job #${job.id} añadido a la cola (${jobQueue.length} en espera). Puedes seguir cambiando parámetros libremente.`, "l-info");
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

$("btnGenerate").addEventListener("click",()=>enqueueGeneration());

// --- ENHANCER (solo Ollama; sin LTX2) ---
(function initMinimaxH3EnhancerUI(){
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
  const ltx2Labels = document.querySelectorAll(".enhancer-row label");
  for(const lbl of ltx2Labels){
    if(lbl.textContent.includes("LTX2")){
      const row = lbl.closest(".enhancer-row");
      if(row) row.style.display = "none";
    }
  }
})();

$("btnEnhance").addEventListener("click", async () => {
  const chainMode = $("enhancerChainMode").value;
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

  const payload = { model, system, prompt: userPrompt || "Describe this image.", stream: false, options: { num_ctx: 8192 } };
    if(mode === "vision"){
    // Modo r2v: enviamos hasta 6 imágenes de referencia
    if(currentMode === "r2v"){
      const imgs = refImages.filter(r => r.local).slice(0, 6).map(r => r.local);
      if(imgs.length === 0){
        log("⚠️ Añade al menos 1 imagen de referencia para el enhancer R2VA", "l-err");
        return;
      }
      try {
        payload.images = [];
        for(const src of imgs){
          try {
            payload.images.push(await refImageToResizedBase64(src, 768));
          } catch(e){
            log(`⚠️ No se pudo leer la imagen de referencia: ${e.message || e}`, "l-err");
          }
        }
        if(payload.images.length === 0){
          log("⚠️ Ninguna imagen de referencia se pudo procesar.", "l-err");
          return;
        }
        payload.prompt = userPrompt
          ? `REFERENCE IMAGES (up to 6, in order, <Picture N>): see above. User hint: ${userPrompt}`
          : "REFERENCE IMAGES (up to 6, in order, <Picture N>): see above.";
      } catch(e){
        log("⚠️ No se pudieron leer las imágenes de referencia: "+(e.message || e), "l-err");
        return;
      }
    } else {
      if(styleKey === "F"){
        const targetFile = localLastFile || localFirstFile;
        if(!targetFile){ log("Selecciona la imagen final (ultimo frame) para el modo L2VA", "l-err"); return; }
        try {
          const b64 = await resizeFileToBase64(targetFile, 768);
          payload.images = [b64];
          payload.prompt = userPrompt
            ? `TARGET CLOSING IMAGE (final frame, Picture 1): see above. User hint / backstory: ${userPrompt}`
            : "TARGET CLOSING IMAGE (final frame, Picture 1): see above. Generate the chronological events leading to this final frame.";
        } catch(e) {
          log("No se pudo leer la imagen de destino: "+(e.message || e), "l-err");
          return;
        }
      } else {
        if(!localFirstFile){ log("No hay imagen de entrada para modo vision", "l-err"); return; }
        try {
          const wantsTwoFrames = (styleKey === "D");
          if(wantsTwoFrames && localLastFile){
            const b64First = await resizeFileToBase64(localFirstFile, 768);
            const b64Last = await resizeFileToBase64(localLastFile, 768);
            payload.images = [b64First, b64Last];
            payload.prompt = userPrompt
              ? `FIRST IMAGE (opening frame, Picture 1): see above. SECOND IMAGE (closing frame, Picture 2): see above. User hint: ${userPrompt}`
              : "FIRST IMAGE (opening frame, Picture 1): see above. SECOND IMAGE (closing frame, Picture 2): see above.";
          } else {
            const b64 = await resizeFileToBase64(localFirstFile, 768);
            payload.images = [b64];
          }
        } catch(e) {
          log("No se pudo leer la imagen: "+(e.message || e), "l-err");
          return;
        }
      }
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

// Helper robusto para convertir cualquier referencia de imagen (dataURL, File, Blob) a base64 JPEG redimensionado.
async function refImageToResizedBase64(src, maxSide = 768){
  let file;
  if(typeof src === "string"){
    if(src.startsWith("data:")){
      const r = await fetch(src);
      const blob = await r.blob();
      file = new File([blob], "ref.png", {type: blob.type || "image/png"});
    } else {
      // URL remota (no debería ocurrir con las referencias locales)
      const r = await fetch(src);
      const blob = await r.blob();
      file = new File([blob], "ref.png", {type: blob.type || "image/png"});
    }
  } else if(src instanceof File || src instanceof Blob){
    file = (src instanceof File) ? src : new File([src], "ref.png", {type: src.type || "image/png"});
  } else {
    throw new Error("Formato de referencia no soportado");
  }
  try {
    return await resizeFileToBase64(file, maxSide);
  } catch(e){
    // Fallback: intentar convertir cualquier blob a PNG vía canvas
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement("canvas");
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    return c.toDataURL("image/jpeg", 0.85).split(",")[1];
  }
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
makeCollapsible("r2vImagesToggle", "r2vImagesBody");
makeCollapsible("r2vVideosToggle", "r2vVideosBody");
makeCollapsible("r2vAudiosToggle", "r2vAudiosBody");
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

// --- DRAG HACIA FUERA ---
makeDragSource($("video1"), () => currentMedia[1] || null);

// Imagen de entrada: arrastrable hacia Krea2 u otra pestaña.
$("inputWrap")?.addEventListener("dragstart", (e) => {
  if(!localFirstFile){ e.preventDefault(); return; }
  const url = $("inputImg").src;
  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData("text/uri-list", url);
  e.dataTransfer.setData("text/plain", url);
  const isVideo = /\.(mp4|webm|mov|mkv|avi)$/i.test(localFirstFile.name);
  const mime = isVideo ? "video/mp4" : (localFirstFile.type || "image/png");
  if(!url.startsWith("data:")){
    e.dataTransfer.setData("DownloadURL", `${mime}:${localFirstFile.name}:${url}`);
  }
  e.dataTransfer.setData(LTXV_MEDIA_MIME, JSON.stringify({
    filename: localFirstFile.name,
    subfolder: "",
    type: "input",
    _dataUrl: url.startsWith("data:") ? url : undefined,
  }));
});

// Dropzone: aceptar drag desde Krea2 o historial.
enableInterUIDrop($("dropzone"), (file, filename) => handleFile(file, true));
enableInterUIDrop($("inputWrap"), (file, filename) => handleFile(file, true));
enableInterUIDrop($("lastFrameDropzone"), (file, filename) => handleLastFrameFile(file));
enableInterUIDrop($("lastFrameWrap"), (file, filename) => handleLastFrameFile(file));

// --- INIT ---
updateDurationHints();
updateQueueUI();
if(!$("enhancerChainMode").value) $("enhancerChainMode").value = "ollama";

async function restoreMiniMaxH3MediaFromDB(){
  const entries = await dbGetAllMedia();
  const sortedEntries = entries.filter(e => e && e.key).sort((a, b) => {
    if(a.key === "firstImage") return 1;
    if(b.key === "firstImage") return -1;
    return 0;
  });
  for(const e of sortedEntries){
    if(!e || !e.key) continue;
    try {
      if(e.key === "firstImage" && e.data){
        const b = dataUrlToBlob(e.data);
        localFirstFile = new File([b], e.name || "restored_first.png", { type: e.type || b.type || "image/png" });
        showInputImage(e.data);
      } else if(e.key === "lastImage" && e.data){
        const b = dataUrlToBlob(e.data);
        localLastFile = new File([b], e.name || "restored_last.png", { type: e.type || b.type || "image/png" });
        showLastFrameImage(e.data);
      } else if(e.key.startsWith("refImg_") && e.data){
        const idx = parseInt(e.key.replace("refImg_",""),10);
        if(refImages[idx]){ refImages[idx].local = e.data; refImages[idx].uploaded = null; }
      }
      // refVid_/refAud_: no se persisten blobs de vídeo/audio (grandes); solo
      // metadatos, por lo que NO son restaurables entre sesiones.
    } catch(err){ console.warn("Error restaurando medio", e.key, err); }
  }
  renderR2V();
}
function dataUrlToBlob(dataUrl){
  const parts = dataUrl.split(",");
  const header = parts[0] || "";
  const base64 = parts[1] || "";
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr.buffer], { type: mime });
}

(async function initMinimaxH3(){
  try {
    const hadSettings = restoreH3Settings();
    if(!hadSettings){
      setModeUI(loadMode());
    } else {
      // Después de restaurar ajustes, aseguramos selectores por defecto si no hay sesión previa.
      setDefaultSelectors();
    }
    await restoreMiniMaxH3MediaFromDB();
    updateDurationHints();
    updateQueueUI();
  } catch(e){ console.warn("Init MiniMaxH3:", e); }
})();