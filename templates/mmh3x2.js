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
    PURGE: "87"
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
initCommon();

// Estado de imágenes y vídeo
let mediaSlots = {
  1: { file: null, dataUrl: null, uploaded: null, name: "" },
  2: { file: null, dataUrl: null, uploaded: null, name: "" },
  3: { file: null, dataUrl: null, uploaded: null, name: "" },
  4: { file: null, dataUrl: null, uploaded: null, name: "" }
};
let videoSlot = { file: null, dataUrl: null, uploaded: null, name: "" };

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
  updateCalculatedResolution(img1?.naturalWidth || 1280, img1?.naturalHeight || 720);
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

  const rows = [
    ["Prompt Seg 1", p1 ? (p1.length > 80 ? p1.slice(0, 77) + "..." : p1) : "(vacío)"],
    ["Prompt Seg 2", p2 ? (p2.length > 80 ? p2.slice(0, 77) + "..." : p2) : `[${seg2Mode}]`],
    ["Modo Seg 2", seg2Mode === "guided" ? "Guía Ollama (continuación)" : "Prompt Directo"],
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
    ["RIFE", `${rMode}x`]
  ];

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

  // Si Seg 1 ya terminó y tiene vídeo cargado, no pisarlo
  if(slot === "Seg1" && v && v.src && v.style.display === "block"){
    return;
  }

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
    recalcResolution();
  }

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

  // 10. Toggles postprocesado y RIFE
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
    if(video.src !== videoUrl){
      video.src = videoUrl;
      video.load();
    }
    video.style.display = "block";
    if(options.autoplay !== false){
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
  let needUpload = 0;
  for(let i = 1; i <= 4; i++){
    const slot = mediaSlots[i];
    if((slot.file || slot.dataUrl) && !slot.uploaded) needUpload++;
  }
  if(videoSlot.file && !videoSlot.uploaded) needUpload++;

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
    [N.OLLAMA_CONN, "52", N.OLLAMA_CHAT_1, "54", N.OLLAMA_CHAT_2, "86"].forEach(id => { delete g[id]; });
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
    duration1: parseFloat($("durationSlider1")?.value || $("durationSlider")?.value || "15.0"),
    duration2: parseFloat($("durationSlider2")?.value || "15.0"),
    megapixels: parseFloat($("mpSlider")?.value || "0.70"),
    steps: parseInt($("stepsSlider")?.value || "20", 10),
    sampler: $("samplerName")?.value || "res_multistep",
    scheduler: $("schedulerName")?.value || "simple",
    seedMode,
    seed: baseSeed,
    batchSize
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
        if(body){
          body.classList.toggle("open");
          if(id === "videoHistoryToggle" && body.classList.contains("open")){
            loadVideoHistory();
          }
        }
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
      await streamOllamaGenerate(payload, $("enhancerOutput"));
      log(`✅ Prompt mejorado listo en el panel. Puedes aplicarlo a Prompt 1 ("Usar como prompt") o a Prompt 2 ("Pegar de Enhancer").`, "l-ok");
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
