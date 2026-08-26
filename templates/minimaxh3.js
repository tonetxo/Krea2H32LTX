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
    ATTN_BACKEND:"147", NOISE:"129", DURATION:"132", MATH:"131",
    SCHEDULER:"124", SAMPLER_SELECT:"123", REF2V:"136", GUIDER:"126",
    SAMPLER:"125", DECODE_VIDEO:"122", DECODE_AUDIO:"121",
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
const BITDEPTH_KEY = "minimaxh3_bit_depth";
const MODE_KEY = "minimaxh3_mode";
const SPECTRUM_KEY = "minimaxh3_spectrum";
const H3OPT_KEY = "minimaxh3_h3opt";
const SIGMASHIFT_KEY = "minimaxh3_sigma_shift";
let currentMode = "i2v"; // "i2v" | "flf2v"
window.currentBatchMode = false;
let jobQueue = [];
let activeJob = null;
let promptVariantMap = {};
const displayedGalleryFiles = new Set();
const displayedSlots = {};

// --- H3 OPTIMIZATIONS (Sparse Attention & Memory Optimization) ---
const H3OPT_DEFAULTS = { sparseEnabled: true, videoBudget: 0.30, memOptEnabled: true };
function loadH3Opt(){
  try { return Object.assign({}, H3OPT_DEFAULTS, JSON.parse(localStorage.getItem(H3OPT_KEY) || "{}")); }
  catch(_) { return {...H3OPT_DEFAULTS}; }
}
function saveH3Opt(state){
  try { localStorage.setItem(H3OPT_KEY, JSON.stringify(state)); } catch(_){}
}
function getH3OptState(){
  return {
    sparseEnabled: $("segSparseOn")?.classList.contains("on") ?? true,
    videoBudget: parseFloat($("h3VideoBudget")?.value || "0.30"),
    memOptEnabled: $("segMemOptOn")?.classList.contains("on") ?? true,
  };
}
function setH3OptUI(state){
  const sOn = $("segSparseOn"), sOff = $("segSparseOff");
  if(state.sparseEnabled){ sOn?.classList.add("on"); sOff?.classList.remove("on"); }
  else { sOff?.classList.add("on"); sOn?.classList.remove("on"); }
  if($("h3VideoBudget")){
    $("h3VideoBudget").value = state.videoBudget;
    const pct = Math.round(state.videoBudget * 100);
    if($("h3VideoBudgetVal")) $("h3VideoBudgetVal").textContent = `${pct}%`;
  }
  const mOn = $("segMemOptOn"), mOff = $("segMemOptOff");
  if(state.memOptEnabled){ mOn?.classList.add("on"); mOff?.classList.remove("on"); }
  else { mOff?.classList.add("on"); mOn?.classList.remove("on"); }
}
const _h3OptState = loadH3Opt();
setH3OptUI(_h3OptState);
$("segSparseOn")?.addEventListener("click", () => { const s = getH3OptState(); s.sparseEnabled = true; setH3OptUI(s); saveH3Opt(s); });
$("segSparseOff")?.addEventListener("click", () => { const s = getH3OptState(); s.sparseEnabled = false; setH3OptUI(s); saveH3Opt(s); });
$("h3VideoBudget")?.addEventListener("input", (e) => {
  const val = parseFloat(e.target.value);
  const pct = Math.round(val * 100);
  if($("h3VideoBudgetVal")) $("h3VideoBudgetVal").textContent = `${pct}%`;
  const s = getH3OptState(); s.videoBudget = val; saveH3Opt(s);
});
$("segMemOptOn")?.addEventListener("click", () => { const s = getH3OptState(); s.memOptEnabled = true; setH3OptUI(s); saveH3Opt(s); });
$("segMemOptOff")?.addEventListener("click", () => { const s = getH3OptState(); s.memOptEnabled = false; setH3OptUI(s); saveH3Opt(s); });

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
  const s = getSigmaShiftState(); s.shiftVideo = val; saveSigmaShift(s);
});
$("sigmaShiftAudio")?.addEventListener("input", (e) => {
  const val = parseFloat(e.target.value);
  if($("sigmaShiftAudioVal")) $("sigmaShiftAudioVal").textContent = val.toFixed(1);
  const s = getSigmaShiftState(); s.shiftAudio = val; saveSigmaShift(s);
});

// --- SPECTRUM (MiniMax H3) ---
const SPECTRUM_DEFAULTS = { enabled: true, blend: 0.5, flex: 0.75, warmup: 5, historyStorage: "system_ram" };
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
  if($("spectrumHistoryStorage")) $("spectrumHistoryStorage").value = s.historyStorage;
}
function getSpectrumState(){
  return {
    enabled: $("segSpectrumOn")?.classList.contains("on") ?? true,
    blend: parseFloat($("spectrumBlend")?.value ?? "0.5"),
    flex: parseFloat($("spectrumFlex")?.value ?? "0.75"),
    warmup: parseInt($("spectrumWarmup")?.value ?? "5", 10),
    historyStorage: $("spectrumHistoryStorage")?.value || "system_ram",
  };
}
const _spectrumState = loadSpectrum();
setSpectrumUI(_spectrumState);
$("segSpectrumOn")?.addEventListener("click", () => { const s = getSpectrumState(); s.enabled = true; setSpectrumUI(s); saveSpectrum(s); });
$("segSpectrumOff")?.addEventListener("click", () => { const s = getSpectrumState(); s.enabled = false; setSpectrumUI(s); saveSpectrum(s); });
$("spectrumBlend")?.addEventListener("input", (e) => { $("spectrumBlendVal").textContent = parseFloat(e.target.value).toFixed(2); const s = getSpectrumState(); s.blend = parseFloat(e.target.value); saveSpectrum(s); });
$("spectrumFlex")?.addEventListener("input", (e) => { $("spectrumFlexVal").textContent = parseFloat(e.target.value).toFixed(2); const s = getSpectrumState(); s.flex = parseFloat(e.target.value); saveSpectrum(s); });
$("spectrumWarmup")?.addEventListener("input", (e) => { $("spectrumWarmupVal").textContent = e.target.value; const s = getSpectrumState(); s.warmup = parseInt(e.target.value, 10); saveSpectrum(s); });
$("spectrumHistoryStorage")?.addEventListener("change", (e) => { const s = getSpectrumState(); s.historyStorage = e.target.value; saveSpectrum(s); });

// --- MODO i2v / flf2v ---
function setModeUI(mode){
  currentMode = mode;
  const i2v = $("segI2V"), flf = $("segFLF2V");
  const lastPanel = $("lastFramePanel");
  const hint = $("modeHint");
  if(mode === "flf2v"){
    flf?.classList.add("on"); i2v?.classList.remove("on");
    if(lastPanel) lastPanel.style.display = "";
    if(hint) hint.textContent = "1er frame + último frame → vídeo.";
  } else {
    i2v?.classList.add("on"); flf?.classList.remove("on");
    if(lastPanel) lastPanel.style.display = "none";
    if(hint) hint.textContent = "Imagen de inicio → vídeo.";
  }
  try { localStorage.setItem(MODE_KEY, mode); } catch(_){}
}
function loadMode(){
  try { return localStorage.getItem(MODE_KEY) || "i2v"; } catch(_){ return "i2v"; }
}
setModeUI(loadMode());
$("segI2V")?.addEventListener("click", () => setModeUI("i2v"));
$("segFLF2V")?.addEventListener("click", () => setModeUI("flf2v"));

// --- ASPECT RATIO MODE (Auto vs Forzar 16:9) ---
const AR_MODE_KEY = "minimaxh3_ar_mode";
let arMode = "auto"; // "auto" | "16:9"
let imageNativeAspectRatio = 16 / 9;

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
  return `<video src="${url}" crossorigin="anonymous" controls muted preload="metadata" playsinline></video>`;
};
CONFIG.variantMeta = function(){
  const s = getSpectrumState();
  const h = getH3OptState();
  const ss = getSigmaShiftState();
  const w = parseInt($("width")?.value || "1120", 10);
  const he = parseInt($("height")?.value || "640", 10);
  const activeLoras = loras.filter(l => l.on && l.lora).map(l => `${l.lora.split('/').pop()} (${Number(l.strength).toFixed(2)})`);
  const rows = [
    ["UNet", $("unetSelect")?.value || ""],
    ["CLIP", $("clipSelect")?.value || ""],
    ["LoRAs", activeLoras.length ? activeLoras.join(", ") : "ninguna"],
    ["H3 Sparse Attn", h.sparseEnabled ? `on (${Math.round(h.videoBudget * 100)}% budget)` : "off"],
    ["H3 Mem Opt", h.memOptEnabled ? "on (Auto)" : "off"],
    ["Sigma Shift", `Vídeo ${ss.shiftVideo.toFixed(1)} / Audio ${ss.shiftAudio.toFixed(1)}`],
    ["Spectrum", s.enabled ? `on · bw ${s.blend.toFixed(2)} · fw ${s.flex.toFixed(2)} · wu ${s.warmup} · ${s.historyStorage}` : "off"],
    ["Sampler", $("samplerName")?.value || "res_multistep"],
    ["Scheduler", $("schedulerName")?.value || "simple"],
    ["Steps", $("stepsSlider")?.value || "20"],
    ["Resolución Base", `${w}×${he}`],
    ["Resolución Vídeo", `${w*2}×${he*2} (RTX 2x)`],
    ["Aspect Ratio", arMode === "16:9" ? "Forzar 16:9" : "Auto (Imagen)"],
    ["Duración", `${$("duration")?.value || ""}s`],
    ["Modo", currentMode],
  ];
  return { title: "Parámetros MiniMaxH3", rows, loras: activeLoras };
};
CONFIG.onSeedUpdate = updateSeedUI;
CONFIG.onNodeExecuted = function(data){
  // Un solo save node; no hay lógica de pasos. Mostramos en cuanto llega.
  if(!data || !data.node || !data.prompt_id) return;
  const pid = data.prompt_id;
  if(!(pid in pendingSeeds)) return;
  if(data.node === N.SAVE && data.output){
    const media = CONFIG.findMedia(data.output);
    if(media){
      if(!displayedSlots[pid]) displayedSlots[pid] = new Set();
      const isLive = !displayedSlots[pid].has(1);
      let elapsedStr = "";
      if(isLive){
        displayedSlots[pid].add(1);
        const t = timers[pid];
        if(t){
          const elapsed = Date.now() - t.start;
          elapsedStr = fmtMs(elapsed);
          const el1 = $("time1");
          if(el1){ el1.textContent = `⏱ ${elapsedStr}`; el1.classList.remove("live"); }
        }
        log(`✅ Vídeo listo.`, "l-ok");
      }
      displayVariantMedia(media, 1, pid, elapsedStr, { allowShow: isLive });
    }
  }
};

CONFIG.onProgress = function(value, max, prompt_id, node){
  const b = $("previewStep1");
  const t = $("previewStepText1");
  if(b && t){
    const pct = Math.round((value / max) * 100);
    t.textContent = `Paso ${value}/${max} · ${pct}%`;
    b.style.display = "inline-flex";
  }
  if(prompt_id && promptVariantMap[prompt_id]){
    const varIdx = promptVariantMap[prompt_id];
    const cardBadge = document.querySelector(`.variant-card[data-variant-index="${varIdx}"] .variant-progress-badge`);
    if(cardBadge){
      const pct = Math.round((value / max) * 100);
      cardBadge.textContent = `${value}/${max} (${pct}%)`;
      cardBadge.style.display = "block";
    }
  }
};

CONFIG.onPreview = function(url, meta){
  const p = $("previewImg1"), e = $("empty1"), v = $("video1"), w = $("previewWrap1");
  if(p && e){
    p.src = url;
    if(w) w.style.display = "block";
    p.style.display = "block";
    e.style.display = "none";
    if(v && (!displayedSlots[currentPromptId] || !displayedSlots[currentPromptId].has(1))){
      v.style.display = "none";
    }
  }
  if(currentPromptId && promptVariantMap[currentPromptId]){
    const varIdx = promptVariantMap[currentPromptId];
    const cardImg = document.querySelector(`.variant-card[data-variant-index="${varIdx}"] .variant-live-thumb`);
    if(cardImg){
      cardImg.src = url;
      cardImg.style.opacity = "1";
    }
  }
};

CONFIG.onClearPreview = function(){
  const p1 = $("previewImg1"), w = $("previewWrap1"), b = $("previewStep1");
  if(p1){ p1.style.display = "none"; p1.removeAttribute("src"); }
  if(w) w.style.display = "none";
  if(b) b.style.display = "none";
};

CONFIG.onPromptError = function(pid){
  delete pendingSeeds[pid];
  delete promptVariantMap[pid];
  delete displayedSlots[pid];
  finishCurrentJob();
};
CONFIG.startNextVariant = function(index){
  runSingleGeneration(index);
};
CONFIG.onBatchComplete = function(){
  if(jobQueue.length === 0 && !activeJob){
    $("btnGenerate").disabled=false;
    enableStopButtons(false);
  }
};
CONFIG.onStopCurrent = function(pid){
  delete pendingSeeds[pid];
  delete promptVariantMap[pid];
  delete displayedSlots[pid];
  finishCurrentJob();
};
CONFIG.onStopAll = function(){
  for(const pid of Object.keys(pendingSeeds)) handledPrompts.add(pid);
  if(currentPromptId) handledPrompts.add(currentPromptId);
  for(const pid of Object.keys(pendingSeeds)) discardTimer(pid);
  pendingSeeds = {};
  promptVariantMap = {};
  displayedGalleryFiles.clear();
  for(const k of Object.keys(displayedSlots)) delete displayedSlots[k];
  processingPrompts.clear();
  currentPromptId = null;
  jobQueue = [];
  updateQueueUI();
  activeJob = null;
  enableStopButtons(false);
  $("btnGenerate").disabled=false;
};

// --- displayResult: un solo save node ---
CONFIG.displayResult = async function(entry, realSeed, tTotal, promptId, timings){
  const media = entry.outputs[N.SAVE] ? CONFIG.findMedia(entry.outputs[N.SAVE]) : null;
  const t1 = timings && timings.t1;

  if(!displayedSlots[promptId]) displayedSlots[promptId] = new Set();
  const already = displayedSlots[promptId].has(1);

  if(media){
    if(!already){
      displayedSlots[promptId].add(1);
      displayVariantMedia(media, 1, promptId, t1 || tTotal || "", { allowShow: true });
    } else if(t1 || tTotal){
      displayVariantMedia(media, 1, promptId, t1 || tTotal || "", { allowShow: false });
    }
    const el = $("time1");
    if(el){ el.textContent = `⏱ ${t1 || tTotal || "—"}`; el.classList.remove("live"); }
  }

  delete pendingSeeds[promptId];
  delete promptVariantMap[promptId];
  delete displayedSlots[promptId];
  handledPrompts.add(promptId);

  currentBatchIndex++;
  if(activeJob) activeJob.currentVariantIndex = null;
  if(currentBatchIndex < totalBatchSize){
    log(`➡️ Iniciando flujo ${currentBatchIndex + 1}/${totalBatchSize} del job...`, "l-ok");
    await runSingleGeneration(currentBatchIndex);
  } else {
    log(`🏁 Job completado (${totalBatchSize} flujo(s)).`, "l-ok");
    finishCurrentJob();
  }
  return true;
};

function displayVariantMedia(media, slot, promptId, timeText, { allowShow = true } = {}){
  if(!media || !media.filename) return;
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
  const finalW = w * 2;
  const finalH = h * 2;
  if($("resFinalHint")) $("resFinalHint").textContent = `Vídeo final: ${finalW}×${finalH} px tras RTX 2x`;
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

function snapshotJob(){
  return {
    prompt: $("prompt").value,
    seedMode,
    seedValue: parseInt($("seedVal").value || "12345", 10),
    width: parseInt($("width").value, 10),
    height: parseInt($("height").value, 10),
    duration: parseFloat($("duration").value || "10"),
    mp: $("mpSlider").value,
    unet: $("unetSelect")?.value,
    clip: $("clipSelect")?.value,
    samplerName: $("samplerName")?.value,
    schedulerName: $("schedulerName")?.value,
    steps: $("stepsSlider")?.value,
    bitDepth: getBitDepth(),
    mode: currentMode,
    spectrum: getSpectrumState(),
    batchSize: parseInt($("batchSize")?.value || "1", 10),
    uploadedFirstImage: uploadedFirstImage ? {...uploadedFirstImage} : null,
    uploadedLastImage: uploadedLastImage ? {...uploadedLastImage} : null,
    localFirstFile: localFirstFile,
    localLastFile: localLastFile,
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
  $("duration").value = job.duration;
  $("mpSlider").value = job.mp;
  $("mpVal").textContent = parseFloat(job.mp).toFixed(2);
  if($("unetSelect") && job.unet) $("unetSelect").value = job.unet;
  if($("clipSelect") && job.clip) $("clipSelect").value = job.clip;
  if($("samplerName") && job.samplerName) $("samplerName").value = job.samplerName;
  if($("schedulerName") && job.schedulerName) $("schedulerName").value = job.schedulerName;
  if($("stepsSlider") && job.steps){ $("stepsSlider").value = job.steps; $("stepsVal").textContent = job.steps; }
  setBitDepthUI(job.bitDepth);
  saveBitDepth(job.bitDepth);
  if(job.spectrum){ setSpectrumUI(job.spectrum); saveSpectrum(job.spectrum); }
  setModeUI(job.mode || "i2v");
  $("batchSize").value = job.batchSize;
  uploadedFirstImage = job.uploadedFirstImage;
  uploadedLastImage = job.uploadedLastImage;
  localFirstFile = job.localFirstFile;
  localLastFile = job.localLastFile;
  currentAspectRatio = job.aspectRatio || (job.width / job.height) || 16/9;
  if(localFirstFile){
    const reader = new FileReader();
    reader.onload = (e) => showInputImage(e.target.result);
    reader.readAsDataURL(localFirstFile);
  }
  if(localLastFile && currentMode === "flf2v"){
    const reader = new FileReader();
    reader.onload = (e) => showLastFrameImage(e.target.result);
    reader.readAsDataURL(localLastFile);
  }
  updateDurationHints();
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
      div.innerHTML = `<img src="${url}" loading="lazy" referrerpolicy="no-referrer"><div class="info-tag">${tsTxt} · ${sizeKB}KB</div>`;
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

  // Modo i2v/flf2v: si el nodo tiene last_frame referencia a LoadImage y no es
  // igual a first_frame, es flf2v.
  let modeSet = false;
  if(i2vNode && i2vNode.inputs){
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

  // H3 Optimizations (Sparse Attention & Memory Optimization)
  const sparseNode = findByClass("H3SparseAttention") || findByClass("H3SparseAttentionAdvanced");
  const memOptNode = findByClass("H3MemoryOptimization");
  const h3State = loadH3Opt();
  let h3Changed = false;

  if(sparseNode && sparseNode.inputs){
    h3State.sparseEnabled = true;
    if(typeof sparseNode.inputs.video_budget === "number"){
      h3State.videoBudget = sparseNode.inputs.video_budget;
    }
    h3Changed = true;
    setApplied(`h3 sparse (${Math.round(h3State.videoBudget * 100)}%)`);
  } else if(sparseNode === null){
    setMissing("h3 sparse attention");
  }

  if(memOptNode){
    h3State.memOptEnabled = true;
    h3Changed = true;
    setApplied("h3 memory opt");
  } else if(memOptNode === null){
    setMissing("h3 memory opt");
  }

  if(h3Changed){
    setH3OptUI(h3State);
    saveH3Opt(h3State);
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
      warmup: typeof spectrumNode.inputs.warmup_steps === "number" ? spectrumNode.inputs.warmup_steps : 5,
      historyStorage: spectrumNode.inputs.history_storage || "system_ram",
    };
    setSpectrumUI(s);
    saveSpectrum(s);
    setApplied("spectrum");
  } else if(spectrumNode === null){
    // Sin nodo Spectrum en el workflow: no tocar el estado guardado.
    setMissing("spectrum");
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
  if(!info) return;
  function gcd(a,b){ return b ? gcd(b, a % b) : a; }
  const d = gcd(w, h) || 1;
  info.textContent = `${w}×${h} · ${w/d}:${h/d}`;
  if(w && h && infoEl === $("dzInfo")){
    imageNativeAspectRatio = w / h;
    recalcResolution();
  }
}

$("segRandom").addEventListener("click",()=>{seedMode="random";$("segRandom").classList.add("on");$("segFixed").classList.remove("on");$("seedVal").disabled=true;});
$("segFixed").addEventListener("click",()=>{seedMode="fixed";$("segFixed").classList.add("on");$("segRandom").classList.remove("on");$("seedVal").disabled=false;});
$("stepsSlider")?.addEventListener("input",(e)=>{$("stepsVal").textContent=e.target.value;});
$("mpSlider").addEventListener("input",()=>{recalcResolution();});
$("duration").addEventListener("input",updateDurationHints);

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
  const fb = "Ligazón para diffusion_models/minimaxh3/minimax_h3_fl2va_pruned_int8_convrot.safetensors";
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
  if(e.target.closest("#btnResetZoomInput") || e.target.closest("#btnFullscreenInput")) return;
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
  if(e.target.closest("#btnResetZoomLast") || e.target.closest("#btnFullscreenLast")) return;
  if(lastFrameZoom.wasPan && lastFrameZoom.wasPan()) return;
  lfFileInput.click();
});
["dragenter","dragover"].forEach(ev=>$("lastFrameWrap")?.addEventListener(ev,e=>{e.preventDefault();lfDz?.classList.add("drag");}));
["dragleave","drop"].forEach(ev=>$("lastFrameWrap")?.addEventListener(ev,e=>{e.preventDefault();lfDz?.classList.remove("drag");}));
$("lastFrameWrap")?.addEventListener("drop",e=>{if(e.dataTransfer.files[0])handleLastFrameFile(e.dataTransfer.files[0]);});

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
    log(`🖼️ Imagen cargada: ${f.name}`, "l-ok");
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
    log(`🖼️ Último frame cargado: ${f.name}`, "l-ok");
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
      } catch(err){ callback(err); }
    }, { once: true });
  }

  function setFrameAsInput(dataUrl, frameLabel){
    fetch(dataUrl).then(r => r.blob()).then(blob => {
      const frameName = `temp_${Date.now()}_${file.name.replace(/\.[^.]+$/, '')}_${frameLabel}.jpg`;
      localFirstFile = new File([blob], frameName, {type: "image/jpeg"});
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

async function ensureImagesUploaded(){
  if(!localFirstFile) throw new Error("selecciona imagen de inicio");
  setRun("busy","subiendo...");
  // Imagen de inicio
  const fd1 = new FormData();
  fd1.append("image", localFirstFile, localFirstFile.name.replace(/^temp_\d+_/, ''));
  fd1.append("overwrite","true");
  const r1 = await fetch(server()+"/upload/image",{method:"POST",body:fd1});
  if(!r1.ok) throw new Error("fallo subida imagen inicio");
  const d1 = await r1.json();
  uploadedFirstImage = {name:d1.name, subfolder:d1.subfolder||"", type:d1.type||"input"};
  log("Imagen de inicio subida: "+uploadedFirstImage.name,"l-ok");

  // Último frame (solo flf2v)
  if(currentMode === "flf2v" && localLastFile){
    const fd2 = new FormData();
    fd2.append("image", localLastFile, localLastFile.name.replace(/^temp_last_\d+_/, ''));
    fd2.append("overwrite","true");
    const r2 = await fetch(server()+"/upload/image",{method:"POST",body:fd2});
    if(!r2.ok) throw new Error("fallo subida último frame");
    const d2 = await r2.json();
    uploadedLastImage = {name:d2.name, subfolder:d2.subfolder||"", type:d2.type||"input"};
    log("Último frame subido: "+uploadedLastImage.name,"l-ok");
  } else {
    uploadedLastImage = null;
  }
}

function buildGraph(){
  const g = JSON.parse(JSON.stringify(BASE_GRAPH));

  // Prompt
  const pVal = $("prompt").value.trim();
  if(pVal){
    if(g[N.PROMPT_TEXT] && g[N.PROMPT_TEXT].inputs) g[N.PROMPT_TEXT].inputs.value = pVal;
    if(g[N.REF2V] && g[N.REF2V].inputs) g[N.REF2V].inputs.prompt = pVal;
  }

  // Seed (RandomNoise node 129)
  g[N.NOISE].inputs.noise_seed = (seedMode === "random") ? -1 : parseInt($("seedVal").value, 10);

  // Resolution & Megapixels
  const w = parseInt($("width").value || "1120", 10);
  const h = parseInt($("height").value || "640", 10);
  if(g[N.RES_SELECTOR] && g[N.RES_SELECTOR].inputs){
    g[N.RES_SELECTOR].inputs.megapixels = parseFloat($("mpSlider").value || "0.7");
    g[N.RES_SELECTOR].inputs.aspect_ratio = (arMode === "16:9") ? "16:9 (Widescreen)" : "16:9 (Widescreen)";
  }
  if(g[N.REF2V] && g[N.REF2V].inputs){
    g[N.REF2V].inputs.width = w;
    g[N.REF2V].inputs.height = h;
  }

  // Duración (segundos) → nodo PrimitiveFloat 132
  g[N.DURATION].inputs.value = parseFloat($("duration").value || "10");

  // UNet & CLIP
  if(g[N.UNET] && g[N.UNET].inputs) g[N.UNET].inputs.unet_name = $("unetSelect").value;
  if(g[N.CLIP] && g[N.CLIP].inputs) g[N.CLIP].inputs.clip_name = $("clipSelect").value;

  // Imagen de referencia (LoadImage node 137)
  if(uploadedFirstImage && g[N.IMAGE_FIRST]){
    g[N.IMAGE_FIRST].inputs.image = uploadedFirstImage.name;
    if(g[N.REF2V] && g[N.REF2V].inputs){
      g[N.REF2V].inputs["ref_images.ref_image_0"] = [N.IMAGE_FIRST, 0];
    }
  }

  // Pipeline de Modelo:
  // UNET (127) -> SparseAttn (158) -> SigmaShift (159) -> MemOpt (164) -> Spectrum (162) -> AttnBackend (147) -> LoRAs -> Scheduler (124) & Guider (126)
  let currentModelNode = N.UNET;

  // 1. Sparse Attention
  const h3opt = getH3OptState();
  if(h3opt.sparseEnabled && g[N.SPARSE_ATTN]){
    g[N.SPARSE_ATTN].inputs.model = [currentModelNode, 0];
    g[N.SPARSE_ATTN].inputs.video_budget = h3opt.videoBudget;
    g[N.SPARSE_ATTN].inputs.denser_early_late_steps = false;
    currentModelNode = N.SPARSE_ATTN;
  } else if(!h3opt.sparseEnabled && g[N.SPARSE_ATTN]){
    delete g[N.SPARSE_ATTN];
  }

  // 2. Sigma Shift (MiniMaxH3SigmaShift)
  if(g[N.SIGMA_SHIFT]){
    const ss = getSigmaShiftState();
    g[N.SIGMA_SHIFT].inputs.model = [currentModelNode, 0];
    g[N.SIGMA_SHIFT].inputs.shift_video = ss.shiftVideo;
    g[N.SIGMA_SHIFT].inputs.shift_audio = ss.shiftAudio;
    currentModelNode = N.SIGMA_SHIFT;
  }

  // 3. Memory Optimization
  if(h3opt.memOptEnabled && g[N.MEM_OPT]){
    g[N.MEM_OPT].inputs.model = [currentModelNode, 0];
    g[N.MEM_OPT].inputs.qkv_streaming_mode = "Auto";
    g[N.MEM_OPT].inputs.precision_mode = "Auto";
    currentModelNode = N.MEM_OPT;
  } else if(!h3opt.memOptEnabled && g[N.MEM_OPT]){
    delete g[N.MEM_OPT];
  }

  // 4. Spectrum
  if(g[N.SPECTRUM] && g[N.SPECTRUM].inputs){
    const s = getSpectrumState();
    g[N.SPECTRUM].inputs.model = [currentModelNode, 0];
    g[N.SPECTRUM].inputs.enabled = s.enabled;
    g[N.SPECTRUM].inputs.blend_weight = s.blend;
    g[N.SPECTRUM].inputs.flex_window = s.flex;
    g[N.SPECTRUM].inputs.warmup_steps = s.warmup;
    g[N.SPECTRUM].inputs.history_storage = s.historyStorage;
    currentModelNode = N.SPECTRUM;
  }

  // 5. Model Attention Backend
  if(g[N.ATTN_BACKEND]){
    g[N.ATTN_BACKEND].inputs.model = [currentModelNode, 0];
    g[N.ATTN_BACKEND].inputs.attention = "comfy kitchen attention";
    currentModelNode = N.ATTN_BACKEND;
  }

  // 6. Model Preview Override con taeh3 (Live Animated Video Preview)
  const prevMethod = getPreviewMethod();
  const hasTaeH3 = (typeof AVAILABLE_VAES !== "undefined" && AVAILABLE_VAES.some(v => v.toLowerCase().includes("taeh3")));
  if(prevMethod !== "none"){
    const previewOverrideKey = "170";
    g[previewOverrideKey] = {
      class_type: "ModelPreviewOverrideKJ",
      inputs: {
        model: [currentModelNode, 0],
        max_resolution: 768,
        jpeg_quality: 80,
        suppress_default_preview: true,
        preview_frames: 16,
        preview_fps: 12,
        tiny_vae: hasTaeH3 ? "taeh3.safetensors" : "none"
      },
      _meta: { title: "Model Preview Override (taeh3 Animated)" }
    };
    currentModelNode = previewOverrideKey;
  }

  // Limpiar nodos de switch estáticos no necesarios de la plantilla
  delete g["141"]; delete g["142"]; delete g["143"]; delete g["144"]; delete g["146"];
  delete g["156"]; delete g["157"]; delete g["160"];

  // 7. Proceso de LoRAs dinámico
  for(let i = 0; i < loras.length; i++){
    const loraObj = loras[i];
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

  // 7. Scheduler y Guider conectados a currentModelNode
  if(g[N.SCHEDULER] && g[N.SCHEDULER].inputs){
    g[N.SCHEDULER].inputs.model = [currentModelNode, 0];
    g[N.SCHEDULER].inputs.scheduler = $("schedulerName").value;
    g[N.SCHEDULER].inputs.steps = parseInt($("stepsSlider").value || "20", 10);
  }
  if(g[N.GUIDER] && g[N.GUIDER].inputs){
    g[N.GUIDER].inputs.model = [currentModelNode, 0];
    if(g[N.REF2V]) g[N.GUIDER].inputs.conditioning = [N.REF2V, 0];
  }

  // 8. Sampler
  if(g[N.SAMPLER_SELECT] && g[N.SAMPLER_SELECT].inputs){
    g[N.SAMPLER_SELECT].inputs.sampler_name = $("samplerName").value;
  }

  // 9. Bit depth en CreateVideo
  const bitDepth = getBitDepth();
  if(g[N.CREATE_VIDEO] && g[N.CREATE_VIDEO].inputs){
    g[N.CREATE_VIDEO].inputs.bit_depth = bitDepth;
  }

  return g;
}

function showVideo(slot, media, options={}){
  if(!media) return;
  const url=`${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder||"")}&type=${encodeURIComponent(media.type||"output")}#t=0.1`;
  const v=$("video"+slot), empty=$("empty"+slot), badge=$("badge"+slot), btn=$("btnLoadMeta"+slot), dl=$("btnDownload"+slot), sf=$("btnSaveFrame"+slot);
  const prev=$("previewImg"+slot), wrap=$("previewWrap"+slot), step=$("previewStep"+slot);
  if(prev) prev.style.display="none";
  if(wrap) wrap.style.display="none";
  if(step) step.style.display="none";
  v.crossOrigin = "anonymous";
  v.src = url;
  v.style.display = "block";
  empty.style.display = "none";
  if(options.autoplay !== false) v.play().catch(err => console.log("Autoplay blocked:", err));
  if(btn) btn.disabled = false;
  if(dl) dl.style.display="inline-flex";
  if(sf) sf.style.display="inline-flex";
  currentMedia[slot] = { filename: media.filename, subfolder: media.subfolder||"", type: media.type||"output" };
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
        applyWorkflow(workflow);
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
          <span class="variant-badge">Var ${varIdx} · procesando...</span>
          <span class="variant-progress-badge" style="display:none;"></span>
          <div class="thumb-wrap" style="position:relative;background:#000;min-height:120px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:4px 4px 0 0;">
            <img class="variant-live-thumb" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" style="display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;opacity:0.4;transition:opacity 0.2s;">
          </div>
          <div class="variant-info">
            <span class="variant-seed-display" title="Semilla">
              <span class="seed-text">${seedUsed}</span>
            </span>
            <span class="variant-time" title="Estado">⏳ En curso...</span>
          </div>
        `;
        grid.appendChild(card);
        const remaining = grid.querySelectorAll(".variant-card").length;
        $("variantCount").textContent = `(${remaining})`;
    }
}

function addToVariantGallery(media, seedValue, timeText, slot, variantIndex) {
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

    const typeShort = "final";
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
        showVideo(1, { filename: card.dataset.filename, subfolder: card.dataset.subfolder, type: card.dataset.type }, { variantIndex: varIndex });
        log("▶ Vídeo cargado: "+card.dataset.filename, "l-ok");
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
const THUMB_CACHE_PREFIX = "minimaxh3_thumb_";
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
        makeCardDraggable(card);

        card.addEventListener("click", () => {
          const media = { filename: item.filename, subfolder: item.subfolder || "", type: item.type || "output" };
          const baseName = item.filename.replace(/\.[^.]+$/, "");
          requestAnimationFrame(() => showVideo(1, media, { badge: baseName, autoplay: false }));
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
        const graph = buildGraph();
        const jobSeedMode = activeJob ? activeJob.seedMode : seedMode;
        const jobSeedValue = activeJob ? activeJob.seedValue : parseInt($("seedVal").value || "12345", 10);
        const seedUsed = (jobSeedMode === "random") ? randomSeed() : jobSeedValue;
        graph[N.NOISE].inputs.noise_seed = seedUsed;

        if(activeJob && activeJob.currentVariantIndex == null){
          variantCounter++;
          activeJob.currentVariantIndex = variantCounter;
        }
        const varIndex = activeJob?.currentVariantIndex || (variantCounter + 1);

        log(`🚀 Procesando Var ${varIndex} (seed ${seedUsed})...`);
        const r = await fetch(server()+"/prompt",{
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            prompt:graph,
            client_id:CLIENT_ID,
            extra_data: { preview_method: (getPreviewMethod() === "none" ? "none" : "latent2rgb") }
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
        createOrUpdatePlaceholderVariantCard(varIndex, seedUsed);
        startTimer(data.prompt_id, 1);
        pollFallback(data.prompt_id);
    } catch(err) {
        log(`❌ No se pudo encolar: ${err.message || err}`, "l-err");
        finishCurrentJob();
    }
}

async function startJob(job){
  activeJob = job;
  restoreJob(job);
  connectSocket();
  await ensureImagesUploaded();
  totalBatchSize = job.batchSize || 1;
  currentBatchIndex = 0;
  batchSeedMode = job.seedMode === "random" ? "random" : "fixed";
  window.currentBatchMode = false;
  job.currentVariantIndex = null;
  $("time1").textContent = "";
  $("time1").classList.remove("live");
  setRun("busy", `Job en cola · ${job.batchSize} flujo(s)...`);
  $("btnGenerate").disabled=true;
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
    $("btnGenerate").disabled=false;
    enableStopButtons(false);
  }
}

async function enqueueGeneration(){
  const job = snapshotJob();
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
    log("⚠️ Cadena de mejora desactivada. Activa 'Ollama' para usar el botón.", "l-warn");
    return;
  }
  const model = $("enhancerModel").value;
  if(!model){ log("⚠️ Selecciona un modelo de Ollama", "l-err"); return; }
  const mode = $("enhancerMode").value;
  const styleKey = $("enhancerStyle").value;
  const data = loadSysPrompts();
  const system = getCurrentSysPrompt(data, mode, styleKey);
  const userPrompt = $("prompt").value.trim();
  if(mode !== "vision" && !userPrompt){ log("⚠️ Escribe un prompt primero", "l-err"); return; }

  const payload = { model, system, prompt: userPrompt || "Describe this image.", stream: false, options: { num_ctx: 8192 } };
  if(mode === "vision"){
    if(!localFirstFile){ log("⚠️ No hay imagen de entrada para modo visión", "l-err"); return; }
    try {
      // FL2VA (estilo D) y el antiguo flf2v (estilo C): si hay último frame,
      // enviamos ambas imágenes a Ollama en orden [first, last].
      // I2VA (estilo C ahora): una sola imagen (first frame).
      const wantsTwoFrames = (styleKey === "D" || styleKey === "C");
      if(wantsTwoFrames && localLastFile){
        const b64First = await resizeFileToBase64(localFirstFile, 1280);
        const b64Last = await resizeFileToBase64(localLastFile, 1280);
        payload.images = [b64First, b64Last];
        payload.prompt = userPrompt
          ? `FIRST IMAGE (opening frame, Picture 1): see above. SECOND IMAGE (closing frame, Picture 2): see above. User hint: ${userPrompt}`
          : "FIRST IMAGE (opening frame, Picture 1): see above. SECOND IMAGE (closing frame, Picture 2): see above.";
      } else {
        const b64 = await resizeFileToBase64(localFirstFile, 1280);
        payload.images = [b64];
      }
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
    if(chainMode === "ollama"){
      $("prompt").value = text;
      log("✏️ Prompt actualizado desde Ollama.", "l-ok");
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