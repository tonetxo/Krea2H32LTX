// ltxh3.js — LTXH3: pipeline híbrido LTX-2.5 ⇄ MiniMax H3 (base + refinado latente 2x).
// Injected AFTER common.js. CONFIG must be defined before initCommon().
//
// Dos grafos embebidos (BASE_GRAPH = LTX→H3, BASE_GRAPH_H3_LTX = H3→LTX). Cada
// dirección tiene su mapa de nodos en DIRS; los ajustes de modelo (UNet, CLIP,
// VAEs, LoRAs) viajan con su familia y los de muestreo dependen del papel del
// modelo en esa dirección (pase 1 = base, pase 2 = refinado).

const CONFIG = {
  PROMPTS_KEY: 'ltxh3_prompts',
  LORA_STATE_KEY: 'ltxh3_common_loras',
  ENHANCER_SYSKEY: 'ltxh3_enhancer_sysprompts',
  SERVERURL_KEY: 'ltxh3_serverUrl',
  PREVIEW_METHOD_KEY: 'ltxh3_preview_method',
  DEFAULT_BACKEND_PORT: "7821",
  UI_TYPE: "ltxh3",
  DEFAULT_MODEL: "",
  // Ids fijos de las salidas (buildGraph renombra el SaveVideo del grafo base).
  N: { FIRST_SAVE: "p1_save", FINAL_SAVE: "final_save" },
  // Las LoRAs de esta UI van por familia (ver state.models); el bloque común no se usa.
  loras: [],
  ENHANCER_DEFAULT_PROMPTS: {
    text: {
      A: { name: "Idea → escena (breve)", prompt: "You help a user describe a short video scene for an audio-video model. Rewrite the user's idea as 2-4 vivid sentences: subjects, setting, the main action in chronological order, camera feel and the sounds of the scene. Keep it in the user's language. Output ONLY the rewritten idea." },
    },
    vision: {
      A: { name: "Imagen → idea de escena", prompt: "Look at the image: it will be the first frame of a short video. Describe in 2-4 sentences what is visible and propose a natural continuation: the main action, camera movement and the sounds of the scene. Keep it in the user's language. Output ONLY the description." },
    },
  },
};

const N = CONFIG.N;
initCommon();

// --- MAPAS DE NODOS POR DIRECCIÓN ---
// Deben coincidir con LTXH3_LTX_to_H3.json / LTXH3_H3_to_LTX.json.
const DIRS = {
  ltx_h3: {
    graph: BASE_GRAPH,
    p1: "ltx", p2: "h3",
    ltx: { UNET: "1", LORAS: ["2", "3"], LORA_SINK: ["13", "model"], CLIP: "4", VAE_V: "5", VAE_A: "6",
           POS: "7", NEG: "8", GUIDER: "13", SAMPLER_SEL: "14", SIGMAS: "15", NOISE: "16", SAMPLER: "17",
           IMG_LATENT: ["12", "video_latent"] },
    h3:  { UNET: "28", LORAS: ["29"], LORA_SINK: ["30", "model"], SHIFT: "30", SPARSE: "42", SPARSE_SINK: ["33", "model"],
           CLIP: "31", VAE_V: "21", VAE_A: "22", COND: "32", GUIDER: "33", SAMPLER_SEL: "34", SIGMAS: "35", NOISE: "36", SAMPLER: "37" },
    UPS_LOADER: "26", UPS: "27", P1_DEC_V: "19", P1_DEC_A: "20", DEC_V: "38", CREATE: "40", SAVE: "41",
    LLM_FIRST: "51", LLM_SECOND: "52",
  },
  h3_ltx: {
    graph: BASE_GRAPH_H3_LTX,
    p1: "h3", p2: "ltx",
    h3:  { UNET: "1", LORAS: ["2"], LORA_SINK: ["3", "model"], SHIFT: "3", SPARSE: "4", SPARSE_SINK: ["9", "model"],
           CLIP: "5", VAE_V: "6", VAE_A: "7", COND: "8", GUIDER: "9", SAMPLER_SEL: "10", SIGMAS: "11", NOISE: "12", SAMPLER: "13" },
    ltx: { UNET: "23", LORAS: ["24", "25"], LORA_SINK: ["30", "model"], CLIP: "26", VAE_V: "16", VAE_A: "17",
           POS: "27", NEG: "28", GUIDER: "30", SAMPLER_SEL: "31", SIGMAS: "32", NOISE: "33", SAMPLER: "34",
           IMG_LATENT: ["22", "video_latent"] },
    UPS_LOADER: "19", UPS: "20", P1_DEC_V: "14", P1_DEC_A: "15", DEC_V: "36", CREATE: "38", SAVE: "39",
    LLM_FIRST: "52", LLM_SECOND: "51",
  },
};
// Comunes a ambos grafos.
const NC = { IDEA: "48", CONN: "49", OPTS: "50", LLM_H3: "51", LLM_LTX: "52", PREV_H3: "53", PREV_LTX: "54", FRAMES: "55" };
const MODEL_LABEL = { ltx: "LTX-2.5", h3: "MiniMax H3" };
const FPS = 24;
const roleOf = (dir, model) => DIRS[dir].p1 === model ? "p1" : "p2";

// --- LISTAS DE MODELOS POR FAMILIA ---
const isH3Name = n => /minimax|fasth3|(^|\/)h3[\/_-]/i.test(n);
const isLtxName = n => /ltx/i.test(n) && !isH3Name(n);
function familyList(list, model, extra){
  const out = (list || []).filter(n => (model === "h3" ? isH3Name(n) : isLtxName(n)) && (!extra || extra(n)));
  return out.length ? out : (list || []);
}
const MODEL_LISTS = {
  unet:  m => familyList(AVAILABLE_UNETS, m),
  // Encoders y upscalers no siempre llevan la familia en el nombre (p.ej. gemma-3 sin "ltx").
  clip:  m => (AVAILABLE_CLIPS || []).filter(n => m === "h3" ? /qwen3vl/i.test(n) : /gemma/i.test(n)),
  vaeV:  m => familyList(AVAILABLE_VAES, m, n => /video/i.test(n) || (m === "ltx" && !/audio/i.test(n))),
  vaeA:  m => familyList(AVAILABLE_VAES, m, n => /audio/i.test(n)),
  lora:  m => familyList(AVAILABLE_LORAS, m),
  upscaler: m => (AVAILABLE_LATENT_UPSCALERS || []).filter(n => m === "h3" ? isH3Name(n) : /ltx/i.test(n) && /spatial/i.test(n)),
};

// keep_percent VSA con el que se entrenó cada checkpoint FastH3; null = no es FastH3.
function fastH3TrainedKeep(unetName){
  const u = (unetName || "").toLowerCase();
  if(!u.includes("fasth3")) return null;
  if(u.includes("omniref") || u.includes("preview")) return 10;
  return 20;
}

// --- ESTADO POR DEFECTO (leído de los grafos) ---
function samplingFromGraph(dir, model){
  const d = DIRS[dir], m = d[model], g = d.graph;
  const sigmas = g[m.SIGMAS]?.inputs?.sigmas || "";
  const steps = Math.max(1, sigmas.split(",").length - 1);
  const s = {
    sampler: g[m.SAMPLER_SEL]?.inputs?.sampler_name || "euler",
    mode: "manual",
    sigmas,
    scheduler: model === "ltx" ? "ltxv" : "simple",
    steps,
    denoise: parseFloat(sigmas.split(",")[0]) || 1.0,
  };
  if(model === "h3"){
    const sp = g[m.SPARSE]?.inputs || {};
    s.sparse = {
      mode: sp.selection || "sol-attn",
      tau: sp["selection.tau"] ?? 1.3,
      keep: sp["selection.keep_percent"] ?? 10,
      vsaKeep: 20,
      budget: 0.30,
      start: sp.start_percent ?? 0.0,
      end: sp.end_percent ?? 1.0,
      minTokens: sp.min_tokens ?? 12288,
    };
  }
  return s;
}
function modelsFromGraph(dir, model){
  const m = DIRS[dir][model], g = DIRS[dir].graph;
  return {
    unet: g[m.UNET].inputs.unet_name,
    clip: g[m.CLIP].inputs.clip_name,
    vaeV: g[m.VAE_V].inputs.vae_name,
    vaeA: g[m.VAE_A].inputs.vae_name,
    loras: m.LORAS.map(id => ({ on: true, lora: g[id].inputs.lora_name, strength: g[id].inputs.strength_model })),
  };
}
function defaultState(){
  const g = BASE_GRAPH;
  const opts = g[NC.OPTS].inputs;
  return {
    dir: "ltx_h3",
    idea: "",
    width: g["10"].inputs.width, height: g["10"].inputs.height,
    frames: g[NC.FRAMES].inputs.value, batch: 1,
    seedMode: "random", seed: g["16"].inputs.noise_seed,
    promptMode: "ollama",
    llm: { model: "", url: "", temp: opts.temperature, ctx: opts.num_ctx, keepAlive: g[NC.CONN].inputs.keep_alive },
    sp: { ltx: "graph", h3: "graph" },
    promptLtx: "", promptH3: "",
    negLtx: g["8"].inputs.text,
    models: { ltx: modelsFromGraph("ltx_h3", "ltx"), h3: modelsFromGraph("ltx_h3", "h3") },
    sampling: {
      ltx: { p1: samplingFromGraph("ltx_h3", "ltx"), p2: samplingFromGraph("h3_ltx", "ltx") },
      h3:  { p1: samplingFromGraph("h3_ltx", "h3"),  p2: samplingFromGraph("ltx_h3", "h3") },
    },
    upscaler: {
      ltx_h3: g[DIRS.ltx_h3.UPS_LOADER].inputs.model_name,
      h3_ltx: BASE_GRAPH_H3_LTX[DIRS.h3_ltx.UPS_LOADER].inputs.model_name,
    },
    savePass1: false, pass1Only: false,
    i2v: { strength: 1.0, fitRes: true, llmImage: true },
    rife: { enabled: false, engine: "rtx", multiplier: 2, model: "rife_v4.26.safetensors" },
    rtx: { enabled: false, quality: "HIGHBITRATE_ULTRA", scale: 2 },
    prefix: "video/LTXH3",
  };
}

// Fusión profunda: conserva claves nuevas de los defaults si el estado guardado es antiguo.
function mergeState(base, saved){
  if(!saved || typeof saved !== "object" || Array.isArray(saved)) return base;
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for(const [k, v] of Object.entries(saved)){
    if(v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])){
      out[k] = mergeState(base[k], v);
    } else if(v !== undefined){
      out[k] = v;
    }
  }
  return out;
}

const STATE_KEY = "ltxh3_ui_state_v1";
let state = (() => {
  try { return mergeState(defaultState(), JSON.parse(localStorage.getItem(STATE_KEY) || "null")); }
  catch(_){ return defaultState(); }
})();
let _saveTimer = null;
function saveState(){
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    state.idea = $("prompt").value;
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch(_){}
  }, 300);
}

// --- SYSTEM PROMPTS DEL LLM (por familia; por defecto los del grafo + I2V) ---
const SP_DEFAULTS = {
  ltx: {
    graph: { name: "T2V (grafo)", prompt: BASE_GRAPH[NC.LLM_LTX].inputs.system },
    i2v: { name: "I2V (primer frame dado)", prompt: `You are an expert Video Prompt Engineer and Cinematographer for the LTX-2.5 Audio-Video model (Image-to-Video mode).
You receive the starting reference image and the user's instructions (in Spanish or English).
Write a single, cohesive, dense paragraph in English that directs the temporal evolution of the scene starting from the provided image.

Follow these strict rules for LTX-2.5:
1. Start by briefly anchoring the shot type, visual style, lighting, and the subjects visible in the reference frame (their appearance, wardrobe/materials, and spatial positions).
2. Describe the chronological physical action and motion clearly: who moves, which body parts or mechanical parts move, how they interact, and the resulting environmental physics (sparks, steam, water jets, smoke, lighting shifts).
3. Specify camera behavior in natural cinematographic language (e.g., static shot with subtle handheld tremor, slow dolly in, smooth pan).
4. Include rich diegetic audio and foley cues at the end of the paragraph (ambient sounds, mechanical clanks, fire crackling, water hissing, footsteps, alarms, or voice tone and quoted dialogue if requested) so LTX-2.5 synthesizes synchronized audio.
5. Output ONLY a single paragraph in plain English. Do NOT include titles, bullet points, section headers, timestamps, markdown, or introductory remarks.` },
  },
  h3: {
    graph: { name: "T2VA (grafo)", prompt: BASE_GRAPH[NC.LLM_H3].inputs.system },
    i2v: { name: "I2VA (primer frame dado)", prompt: `You are an expert video prompt director for MiniMax H3 Image-to-Video with Audio (I2VA).
You receive the reference first-frame image (<Picture 1>) and the user's scene instructions (which may be in Spanish or English).
Translate and expand the user's instructions into a production-ready English prompt strictly following the official MiniMax H3 I2VA format.

Your output MUST follow this exact structure and section order, with no markdown fences, no commentary, and no extra text:

For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.

integrated_multimodal_description: [Shot 1] <Visual style, e.g. 3D CG, cinematic / Live-action, cinematic>, <shot framing> frames the scene from <Picture 1>, preserving <describe the key subjects, colors, materials, positions, and environment visible in the image>. <Camera movement using official grammar: e.g. The camera holds a static shot / The camera pushes in with small amplitude at slow speed> as <describe the chronological physical actions, body part movements, interactions, and environmental reactions requested by the user>.

overall_soundscape: <1 to 3 English sentences summarizing continuous ambient sound, physical foley, impacts, water/fire/mechanical/movement sounds across the video>.

non_diegetic_music: <1 to 2 English sentences describing background score instrumentation, tempo, and dynamics, or N/A if only natural diegetic sound fits>.

RULES:
- Always write the descriptive sections in English.
- Ground every visual detail in the attached image (<Picture 1>) and the user's instructions.
- Describe concrete, observable physical movements; never use abstract psychological fillers.
- Output ONLY the final prompt text starting with "For the target video...".` },
  },
};
const SP_KEY = "ltxh3_sysprompts_v1";
function loadSpStore(){
  try { const s = JSON.parse(localStorage.getItem(SP_KEY) || "{}"); return { ltx: s.ltx || {}, h3: s.h3 || {} }; }
  catch(_){ return { ltx: {}, h3: {} }; }
}
let spStore = loadSpStore();
function saveSpStore(){ try { localStorage.setItem(SP_KEY, JSON.stringify(spStore)); } catch(_){} }
function spAll(model){ return { ...SP_DEFAULTS[model], ...spStore[model] }; }
function spText(model, key){ return (spAll(model)[key] || SP_DEFAULTS[model].graph).prompt; }
const SP_IDS = { ltx: ["spLtxSelect", "spLtxText"], h3: ["spH3Select", "spH3Text"] };

function renderSp(model){
  const [selId, txtId] = SP_IDS[model];
  const all = spAll(model);
  if(!all[state.sp[model]]) state.sp[model] = "graph";
  const sel = $(selId);
  sel.innerHTML = "";
  for(const [k, v] of Object.entries(all)){
    const o = document.createElement("option");
    o.value = k;
    o.textContent = v.name + (SP_DEFAULTS[model][k] ? (spStore[model][k] ? " (editado)" : "") : " ✎");
    sel.appendChild(o);
  }
  sel.value = state.sp[model];
  $(txtId).value = spText(model, state.sp[model]);
}
let _spTimer = null;
for(const model of ["ltx", "h3"]){
  const [selId, txtId] = SP_IDS[model];
  $(selId).addEventListener("change", () => { state.sp[model] = $(selId).value; renderSp(model); saveState(); });
  $(txtId).addEventListener("input", () => {
    clearTimeout(_spTimer);
    _spTimer = setTimeout(() => {
      const key = state.sp[model];
      const cur = spAll(model)[key];
      spStore[model][key] = { name: cur.name, prompt: $(txtId).value };
      saveSpStore();
      // Solo cambia la etiqueta "(editado)", no el texto.
      const opt = $(selId).querySelector(`option[value="${CSS.escape(key)}"]`);
      if(opt && SP_DEFAULTS[model][key]) opt.textContent = cur.name + " (editado)";
    }, 400);
  });
}
document.querySelectorAll("[data-sp-action]").forEach(btn => btn.addEventListener("click", () => {
  const model = btn.dataset.model, action = btn.dataset.spAction, key = state.sp[model];
  if(action === "new"){
    const name = prompt(`Nombre del nuevo estilo (${MODEL_LABEL[model]}):`, spAll(model)[key].name + " (copia)");
    if(!name) return;
    const newKey = "u" + Date.now().toString(36);
    spStore[model][newKey] = { name, prompt: $(SP_IDS[model][1]).value };
    state.sp[model] = newKey;
    log(`✅ Estilo "${name}" creado para ${MODEL_LABEL[model]}.`, "l-ok");
  } else if(action === "reset"){
    if(!SP_DEFAULTS[model][key]){ log("ℹ️ Los estilos propios no tienen texto por defecto.", "l-info"); return; }
    delete spStore[model][key];
    log(`↺ Estilo "${SP_DEFAULTS[model][key].name}" restaurado.`, "l-ok");
  } else if(action === "delete"){
    if(SP_DEFAULTS[model][key]){ log("ℹ️ Los estilos por defecto no se borran (usa ↺ para restaurarlos).", "l-info"); return; }
    if(!confirm(`¿Eliminar el estilo "${spAll(model)[key].name}"?`)) return;
    delete spStore[model][key];
    state.sp[model] = "graph";
  }
  saveSpStore(); renderSp(model); saveState();
}));

// --- SAMPLERS / SCHEDULERS (del backend; lista corta de respaldo) ---
let SAMPLERS = ["euler", "euler_ancestral", "res_multistep", "res_2s", "dpmpp_2m", "dpmpp_sde", "lcm"];
let SCHEDULERS = ["simple", "normal", "beta", "karras", "exponential", "sgm_uniform", "linear_quadratic", "kl_optimal"];
async function loadSamplerLists(){
  try {
    const [rs, rb] = await Promise.all([
      fetchComfyBackend("/object_info/KSamplerSelect"),
      fetchComfyBackend("/object_info/BasicScheduler"),
    ]);
    const ss = rs?.ok ? (await rs.json())?.KSamplerSelect?.input?.required?.sampler_name?.[0] : null;
    const bs = rb?.ok ? (await rb.json())?.BasicScheduler?.input?.required?.scheduler : null;
    if(Array.isArray(ss) && ss.length) SAMPLERS = ss;
    const schedList = Array.isArray(bs?.[0]) ? bs[0] : bs?.[1]?.options;
    if(Array.isArray(schedList) && schedList.length) SCHEDULERS = schedList;
    renderSampling("ltx"); renderSampling("h3");
  } catch(e){ console.warn("No se pudieron leer samplers/schedulers:", e); }
}

// --- UI: SELECTORES DE MODELO ---
function fillSelect(sel, list, value){
  sel.innerHTML = "";
  const items = list.slice();
  if(value && !items.includes(value)) items.unshift(value);
  for(const n of items){
    const o = document.createElement("option");
    o.value = n; o.textContent = n.split("/").pop(); o.title = n;
    if(value && !list.includes(value) && n === value) o.textContent += " (no encontrado)";
    sel.appendChild(o);
  }
  sel.value = value || items[0] || "";
}
const MODEL_FIELDS = { unet: "Unet", clip: "Clip", vaeV: "VaeV", vaeA: "VaeA" };
function renderModels(model){
  for(const [field, suffix] of Object.entries(MODEL_FIELDS)){
    fillSelect($(model + suffix), MODEL_LISTS[field](model), state.models[model][field]);
  }
  renderLoraList(model);
}
for(const model of ["ltx", "h3"]){
  for(const [field, suffix] of Object.entries(MODEL_FIELDS)){
    $(model + suffix).addEventListener("change", (e) => {
      state.models[model][field] = e.target.value;
      if(model === "h3" && field === "unet") applyFastH3Rule();
      saveState();
    });
  }
}

function renderLoraList(model){
  const wrap = $(model + "Loras");
  const list = MODEL_LISTS.lora(model);
  const loras = state.models[model].loras;
  wrap.innerHTML = "";
  if(!loras.length) wrap.innerHTML = `<div class="hint" style="font-size:10px;">Sin LoRAs.</div>`;
  loras.forEach((l, i) => {
    const box = document.createElement("div");
    box.className = "lora" + (l.on ? "" : " off");
    const opts = (list.includes(l.lora) || !l.lora ? list : [l.lora, ...list])
      .map(p => `<option value="${escapeHtml(p)}" ${p === l.lora ? "selected" : ""} title="${escapeHtml(p)}">${escapeHtml(p.split("/").pop())}${list.includes(p) ? "" : " (no encontrado)"}</option>`).join("");
    box.innerHTML = `<div class="lora-top"><div class="switch ${l.on ? "on" : ""}"><i></i></div><div class="lname">LoRA ${i + 1}</div><button class="ghost btn-mini lora-del" title="Quitar">✕</button></div>
      <div class="row" style="margin-bottom:8px;"><select>${opts}</select></div>
      <div class="slider-row"><input type="range" min="-2" max="2" step="0.05" value="${l.strength}"><div class="slider-val">${Number(l.strength).toFixed(2)}</div></div>`;
    box.querySelector(".switch").addEventListener("click", () => { l.on = !l.on; renderLoraList(model); saveState(); });
    box.querySelector(".lora-del").addEventListener("click", () => { loras.splice(i, 1); renderLoraList(model); saveState(); });
    box.querySelector("select").addEventListener("change", (e) => { l.lora = e.target.value; saveState(); });
    const rng = box.querySelector('input[type="range"]');
    rng.addEventListener("input", () => { l.strength = parseFloat(rng.value); box.querySelector(".slider-val").textContent = l.strength.toFixed(2); saveState(); });
    wrap.appendChild(box);
  });
}
document.querySelectorAll("[data-lora-add]").forEach(btn => btn.addEventListener("click", () => {
  const model = btn.dataset.loraAdd;
  state.models[model].loras.push({ on: true, lora: MODEL_LISTS.lora(model)[0] || "", strength: 1.0 });
  renderLoraList(model); saveState();
}));

// --- UI: MUESTREO (por familia y papel) ---
function renderSampling(model){
  const wrap = document.querySelector(`.sampling-block[data-model="${model}"]`);
  const role = roleOf(state.dir, model);
  const s = state.sampling[model][role];
  const schedOpts = (model === "ltx" ? ["ltxv", ...SCHEDULERS] : SCHEDULERS)
    .map(n => `<option value="${n}" ${n === s.scheduler ? "selected" : ""}>${n === "ltxv" ? "ltxv (LTXVScheduler)" : n}</option>`).join("");
  const samplerOpts = (SAMPLERS.includes(s.sampler) ? SAMPLERS : [s.sampler, ...SAMPLERS])
    .map(n => `<option value="${n}" ${n === s.sampler ? "selected" : ""}>${n}</option>`).join("");
  const nSig = Math.max(0, s.sigmas.split(",").filter(x => x.trim()).length - 1);
  wrap.innerHTML = `
    <div class="row"><label>Sampler <span class="hint">(${role === "p1" ? "pase 1 · base" : "pase 2 · refinado"})</span></label><select data-f="sampler">${samplerOpts}</select></div>
    <div class="seed-toggle"><div class="seg ${s.mode === "manual" ? "on" : ""}" data-mode="manual">Sigmas manuales</div><div class="seg ${s.mode === "scheduler" ? "on" : ""}" data-mode="scheduler">Scheduler + steps</div></div>
    <div data-show="manual" style="${s.mode === "manual" ? "" : "display:none"}">
      <div class="row"><label>Sigmas <span class="hint" data-f="sigHint">(${nSig} pasos)</span> <button class="ghost btn-mini" data-act="resetSig" title="Restaurar las sigmas del workflow">↺</button></label><textarea class="sigmas-text" data-f="sigmas" spellcheck="false">${escapeHtml(s.sigmas)}</textarea></div>
    </div>
    <div data-show="scheduler" style="${s.mode === "scheduler" ? "" : "display:none"}">
      <div class="two-col"><div class="row"><label>Scheduler</label><select data-f="scheduler">${schedOpts}</select></div><div class="row"><label>Steps</label><input type="number" data-f="steps" min="1" max="200" step="1" value="${s.steps}"></div></div>
      <div class="row slider-row"><label>Denoise</label><input type="range" data-f="denoise" min="0.05" max="1" step="0.01" value="${s.denoise}"><div class="slider-val" data-f="denoiseVal">${Number(s.denoise).toFixed(2)}</div></div>
    </div>`;
  wrap.querySelector('[data-f="sampler"]').addEventListener("change", e => { s.sampler = e.target.value; saveState(); });
  wrap.querySelectorAll("[data-mode]").forEach(seg => seg.addEventListener("click", () => { s.mode = seg.dataset.mode; renderSampling(model); saveState(); }));
  const sig = wrap.querySelector('[data-f="sigmas"]');
  sig.addEventListener("input", () => {
    s.sigmas = sig.value;
    wrap.querySelector('[data-f="sigHint"]').textContent = `(${Math.max(0, s.sigmas.split(",").filter(x => x.trim()).length - 1)} pasos)`;
    saveState();
  });
  wrap.querySelector('[data-act="resetSig"]').addEventListener("click", (e) => {
    e.preventDefault();
    const dir = Object.keys(DIRS).find(d => roleOf(d, model) === role);
    s.sigmas = samplingFromGraph(dir, model).sigmas;
    renderSampling(model); saveState();
  });
  wrap.querySelector('[data-f="scheduler"]').addEventListener("change", e => { s.scheduler = e.target.value; saveState(); });
  wrap.querySelector('[data-f="steps"]').addEventListener("change", e => { s.steps = Math.max(1, parseInt(e.target.value, 10) || 1); saveState(); });
  const dn = wrap.querySelector('[data-f="denoise"]');
  dn.addEventListener("input", () => { s.denoise = parseFloat(dn.value); wrap.querySelector('[data-f="denoiseVal"]').textContent = s.denoise.toFixed(2); saveState(); });
  if(model === "h3") renderSparse();
}

// --- UI: SPARSE (H3, por papel) ---
function h3Sparse(){ return state.sampling.h3[roleOf(state.dir, "h3")].sparse; }
function sliderRow(label, f, min, max, step, val, fmt){
  return `<div class="row slider-row"><label>${label}</label><input type="range" data-sp="${f}" min="${min}" max="${max}" step="${step}" value="${val}"><div class="slider-val" data-spv="${f}">${fmt(val)}</div></div>`;
}
function renderSparse(){
  const sp = h3Sparse();
  $("h3Sparse").value = sp.mode;
  const f2 = v => Number(v).toFixed(2), pct = v => `${Number(v).toFixed(1)}%`;
  let html = "";
  if(sp.mode === "sol-attn" || sp.mode === "sla"){
    html += sp.mode === "sol-attn" ? sliderRow("Tau (más alto = más disperso)", "tau", 0, 4, 0.05, sp.tau, f2) : sliderRow("keep_percent", "keep", 0.5, 95, 0.5, sp.keep, pct);
    html += sliderRow("Inicio (start_percent)", "start", 0, 1, 0.01, sp.start, f2);
    html += sliderRow("Fin (end_percent)", "end", 0, 1, 0.01, sp.end, f2);
    html += `<div class="row"><label>min_tokens <span class="hint">(por debajo, atención densa)</span></label><input type="number" data-sp="minTokens" min="0" step="512" value="${sp.minTokens}"></div>`;
  } else if(sp.mode === "vsa"){
    html += sliderRow("keep_percent VSA", "vsaKeep", 1, 100, 0.5, sp.vsaKeep, pct);
  } else if(sp.mode === "h3sparse"){
    html += sliderRow("video_budget", "budget", 0.01, 1, 0.01, sp.budget, f2);
  }
  $("sparseParams").innerHTML = html;
  $("sparseParams").querySelectorAll("[data-sp]").forEach(inp => inp.addEventListener("input", () => {
    const f = inp.dataset.sp;
    sp[f] = f === "minTokens" ? (parseInt(inp.value, 10) || 0) : parseFloat(inp.value);
    const v = $("sparseParams").querySelector(`[data-spv="${f}"]`);
    if(v) v.textContent = (f === "keep" || f === "vsaKeep") ? pct(sp[f]) : f2(sp[f]);
    saveState();
  }));
  const keep = fastH3TrainedKeep(state.models.h3.unet);
  $("sparseHint").textContent = keep != null
    ? `Checkpoint FastH3: entrenado con VSA al ${keep}% (otros modos degradan el resultado).`
    : (sp.mode === "vsa" ? "VSA solo tiene sentido con checkpoints FastH3." : "");
}
$("h3Sparse").addEventListener("change", (e) => { h3Sparse().mode = e.target.value; renderSparse(); saveState(); });
// FastH3 se entrenó con VSA: al elegirlo se fija VSA con su keep_percent en ambos papeles.
function applyFastH3Rule(){
  const keep = fastH3TrainedKeep(state.models.h3.unet);
  if(keep != null){
    for(const role of ["p1", "p2"]){
      state.sampling.h3[role].sparse.mode = "vsa";
      state.sampling.h3[role].sparse.vsaKeep = keep;
    }
    log(`ℹ️ Checkpoint FastH3: atención fijada en VSA con keep_percent ${keep}% (valor entrenado).`, "l-info");
  }
  renderSparse();
}

// --- UI: DIRECCIÓN ---
function renderDirection(){
  const d = DIRS[state.dir];
  $("segDirL2H").classList.toggle("on", state.dir === "ltx_h3");
  $("segDirH2L").classList.toggle("on", state.dir === "h3_ltx");
  $("roleLtx").textContent = roleOf(state.dir, "ltx") === "p1" ? "pase 1 · base" : "pase 2 · refinado";
  $("roleH3").textContent = roleOf(state.dir, "h3") === "p1" ? "pase 1 · base" : "pase 2 · refinado";
  $("chainP1").textContent = `${MODEL_LABEL[d.p1]} · pase 1`;
  $("chainP2").textContent = `${MODEL_LABEL[d.p2]} · refinado`;
  $("dirHint").textContent = `${MODEL_LABEL[d.p1]} genera la base; ${MODEL_LABEL[d.p2]} la refina a 2x (upscaler latente ${d.p2 === "h3" ? "H3 3D conv" : "LTX espacial"}).`;
  // Paneles en el orden del pipeline.
  const col = $("panelLtx").parentNode;
  if(d.p1 === "h3") col.insertBefore($("panelH3"), $("panelLtx"));
  else col.insertBefore($("panelLtx"), $("panelH3"));
  $("upscalerLabel").textContent = `Upscaler (${MODEL_LABEL[d.p2]})`;
  fillSelect($("latentUpscaler"), MODEL_LISTS.upscaler(d.p2), state.upscaler[state.dir]);
  renderSampling("ltx"); renderSampling("h3");
  updateResHint();
}
function setDirection(dir){
  if(dir === state.dir) return;
  state.dir = dir;
  renderDirection();
  saveState();
  log(`⇄ Dirección: ${MODEL_LABEL[DIRS[dir].p1]} → ${MODEL_LABEL[DIRS[dir].p2]}.`, "l-ok");
}
$("segDirL2H").addEventListener("click", () => setDirection("ltx_h3"));
$("segDirH2L").addEventListener("click", () => setDirection("h3_ltx"));
$("btnSwapDir").addEventListener("click", () => setDirection(state.dir === "ltx_h3" ? "h3_ltx" : "ltx_h3"));
$("latentUpscaler").addEventListener("change", e => { state.upscaler[state.dir] = e.target.value; saveState(); });

// --- UI: RESOLUCIÓN, FRAMES, SEMILLA ---
const nearest32 = v => Math.max(256, Math.round(v / 32) * 32);
function isLtxFrames(n){ return n >= 9 && (n - 1) % 8 === 0; }
function isH3Frames(n){ return n >= 5 && (n - 5) % 17 === 0; }
function updateResHint(){
  const w = state.width, h = state.height;
  let final = `${w * 2}×${h * 2}`;
  if(state.rtx.enabled && !/^(DENOISE|DEBLUR)_/.test(state.rtx.quality)){
    final += ` → RTX ${state.rtx.scale}x ≈ ${Math.round(w * 2 * state.rtx.scale)}×${Math.round(h * 2 * state.rtx.scale)}`;
  }
  $("resHint").textContent = state.pass1Only
    ? `Solo pase 1: ${w}×${h} px (${getFriendlyRatio(w, h)})`
    : `Pase 1: ${w}×${h} · refinado: ${final} px (${getFriendlyRatio(w, h)})`;
  const f = state.frames, fps = state.rife.enabled ? FPS * state.rife.multiplier : FPS;
  const notes = [];
  if(!isLtxFrames(f)) notes.push("⚠️ LTX necesita 8n+1");
  if(!isH3Frames(f)) notes.push("H3 lo ajusta a 17k+5 (válidos para ambos: 73, 209, 345)");
  $("framesHint").textContent = `${(f / FPS).toFixed(2)} s a ${FPS} fps${state.rife.enabled ? ` · ${fps} fps tras interpolar` : ""}${notes.length ? " · " + notes.join(" · ") : ""}`;
}
function setRes(w, h){
  state.width = nearest32(w); state.height = nearest32(h);
  $("width").value = state.width; $("height").value = state.height;
  updateResHint(); saveState();
}
$("width").addEventListener("change", () => setRes(parseInt($("width").value, 10) || 768, state.height));
$("height").addEventListener("change", () => setRes(state.width, parseInt($("height").value, 10) || 448));
document.querySelectorAll("#resPresets [data-w]").forEach(b => b.addEventListener("click", () => setRes(+b.dataset.w, +b.dataset.h)));
$("frames").addEventListener("change", () => {
  let f = Math.max(9, parseInt($("frames").value, 10) || 73);
  if(!isLtxFrames(f)){ f = Math.round((f - 1) / 8) * 8 + 1; log(`ℹ️ Fotogramas ajustados a ${f} (LTX necesita 8n+1).`, "l-info"); }
  state.frames = f; $("frames").value = f; updateResHint(); saveState();
});
$("batchSize").addEventListener("change", () => { state.batch = Math.max(1, parseInt($("batchSize").value, 10) || 1); saveState(); });
function setSeedMode(mode){
  state.seedMode = mode;
  $("segRandom").classList.toggle("on", mode === "random");
  $("segFixed").classList.toggle("on", mode === "fixed");
  $("seedVal").disabled = mode === "random";
  saveState();
}
$("segRandom").addEventListener("click", () => setSeedMode("random"));
$("segFixed").addEventListener("click", () => setSeedMode("fixed"));
$("seedVal").addEventListener("change", () => { state.seed = parseInt($("seedVal").value, 10) || 0; saveState(); });

// --- UI: PROMPTS Y LLM ---
function setPromptMode(mode){
  state.promptMode = mode;
  $("segPromptOllama").classList.toggle("on", mode === "ollama");
  $("segPromptManual").classList.toggle("on", mode === "manual");
  $("llmControls").style.display = mode === "ollama" ? "" : "none";
  document.querySelectorAll(".sysprompt-block").forEach(b => b.style.display = mode === "ollama" ? "" : "none");
  const hint = mode === "ollama" ? "(lo rellena Ollama al generar)" : "(se envía tal cual)";
  $("promptLtxHint").textContent = hint; $("promptH3Hint").textContent = hint;
  saveState();
}
$("segPromptOllama").addEventListener("click", () => setPromptMode("ollama"));
$("segPromptManual").addEventListener("click", () => setPromptMode("manual"));
for(const [id, key] of [["promptLtx", "promptLtx"], ["promptH3", "promptH3"], ["negLtx", "negLtx"]]){
  $(id).addEventListener("input", () => { state[key] = $(id).value; saveState(); });
}
$("prompt").addEventListener("input", saveState);
$("llmModel").addEventListener("change", () => { state.llm.model = $("llmModel").value; saveState(); });
$("llmUrl").addEventListener("change", () => { state.llm.url = $("llmUrl").value.trim(); saveState(); });
$("llmTemp").addEventListener("input", () => { state.llm.temp = parseFloat($("llmTemp").value); $("llmTempVal").textContent = state.llm.temp.toFixed(2); saveState(); });
$("llmCtx").addEventListener("change", () => { state.llm.ctx = parseInt($("llmCtx").value, 10) || 8192; saveState(); });
$("llmKeepAlive").addEventListener("change", () => { state.llm.keepAlive = parseInt($("llmKeepAlive").value, 10) || 0; saveState(); });

// Modelos de Ollama y llama.cpp vistos a través del proxy de serve.py.
async function loadLlmModels(){
  const sel = $("llmModel");
  const get = async (url, pick) => {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(3500) }); return r.ok ? pick(await r.json()) : []; }
    catch(_){ return []; }
  };
  const [cpp, oll] = await Promise.all([
    get("/llamacpp/v1/models", d => (d.data || []).map(m => m.id || m.name)),
    get("/api/tags", d => (d.models || []).map(m => m.name)),
  ]);
  sel.innerHTML = '<option value="">-- Seleccionar modelo --</option>';
  for(const [label, prefix, names] of [["llama.cpp", "llamacpp", cpp], ["Ollama", "ollama", oll]]){
    if(!names.length) continue;
    const grp = document.createElement("optgroup");
    grp.label = label;
    for(const n of names){ const o = document.createElement("option"); o.value = `${prefix}:${n}`; o.textContent = n; grp.appendChild(o); }
    sel.appendChild(grp);
  }
  const saved = state.llm.model;
  if(saved && !sel.querySelector(`option[value="${CSS.escape(saved)}"]`)){
    const o = document.createElement("option"); o.value = saved; o.textContent = saved.replace(/^[a-z]+:/, "") + " (no disponible ahora)"; sel.appendChild(o);
  }
  sel.value = saved || (sel.querySelector("optgroup option")?.value || "");
  state.llm.model = sel.value;
}
// URL que usará el nodo OllamaConnectivityV2 (vista desde ComfyUI).
function llmTarget(llm){
  const [kind, ...rest] = (llm.model || "").split(":");
  const model = rest.join(":");
  const url = llm.url || (kind === "ollama" ? LLM_OLLAMA_URL : LLM_LLAMACPP_URL);
  return { url, model: model || llm.model };
}

// --- UI: POST (INTERPOLACIÓN / RTX) ---
function renderPost(){
  $("segRifeOn").classList.toggle("on", state.rife.enabled);
  $("segRifeOff").classList.toggle("on", !state.rife.enabled);
  $("rifeControls").style.display = state.rife.enabled ? "block" : "none";
  $("rifeEngine").value = state.rife.engine;
  $("rifeMultiplier").value = String(state.rife.multiplier);
  $("rifeModelRow").style.display = state.rife.engine === "rife" ? "" : "none";
  fillSelect($("rifeModel"), AVAILABLE_INTERP_MODELS, state.rife.model);
  $("segRtxOn").classList.toggle("on", state.rtx.enabled);
  $("segRtxOff").classList.toggle("on", !state.rtx.enabled);
  $("rtxControls").style.display = state.rtx.enabled ? "block" : "none";
  $("rtxQuality").value = state.rtx.quality;
  $("rtxScale").value = String(state.rtx.scale);
  updateResHint();
}
const postSet = (fn) => () => { fn(); renderPost(); saveState(); };
$("segRifeOn").addEventListener("click", postSet(() => state.rife.enabled = true));
$("segRifeOff").addEventListener("click", postSet(() => state.rife.enabled = false));
$("segRtxOn").addEventListener("click", postSet(() => state.rtx.enabled = true));
$("segRtxOff").addEventListener("click", postSet(() => state.rtx.enabled = false));
$("rifeEngine").addEventListener("change", postSet(() => state.rife.engine = $("rifeEngine").value));
$("rifeMultiplier").addEventListener("change", postSet(() => state.rife.multiplier = parseInt($("rifeMultiplier").value, 10)));
$("rifeModel").addEventListener("change", postSet(() => state.rife.model = $("rifeModel").value));
$("rtxQuality").addEventListener("change", postSet(() => state.rtx.quality = $("rtxQuality").value));
$("rtxScale").addEventListener("change", postSet(() => state.rtx.scale = parseFloat($("rtxScale").value)));
$("savePass1").addEventListener("change", () => { state.savePass1 = $("savePass1").checked; saveState(); });
$("pass1Only").addEventListener("change", () => { state.pass1Only = $("pass1Only").checked; updateResHint(); saveState(); });
$("filenamePrefix").addEventListener("change", () => { state.prefix = $("filenamePrefix").value.trim() || "video/LTXH3"; saveState(); });

// --- IMAGEN DE INICIO (I2V) ---
// { file, dataUrl, w, h, uploaded: {name, subfolder, type} | null }
let inputImage = null;
function handleImageFile(file, opts = {}){
  if(!file || !/^image\//.test(file.type || "image/png")){ log("⚠️ Solo se admiten imágenes como inicio.", "l-warn"); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      inputImage = { file, dataUrl: reader.result, w: img.naturalWidth, h: img.naturalHeight, uploaded: null };
      showInputImage();
      if(opts.restored) return;
      storeInputImage(file);
      syncSpWithImage(true);
      if(state.i2v.fitRes){
        const area = state.width * state.height, ar = img.naturalWidth / img.naturalHeight;
        setRes(Math.sqrt(area * ar), Math.sqrt(area / ar));
        log(`📐 Resolución ajustada a la imagen: ${state.width}×${state.height}.`, "l-info");
      }
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
function showInputImage(){
  const has = !!inputImage;
  $("inputWrap").style.display = has ? "flex" : "none";
  $("imgInputActions").style.display = has ? "flex" : "none";
  $("i2vControls").style.display = has ? "block" : "none";
  $("dzPlaceholder").textContent = has ? "cambiar imagen (arrastra o clic)" : "arrastra una imagen o clic (vacío = texto a vídeo)";
  $("dzInfo").textContent = has ? `${inputImage.file.name || "imagen"} · ${inputImage.w}×${inputImage.h} (${getFriendlyRatio(inputImage.w, inputImage.h)})` : "";
  if(has) $("inputImg").src = inputImage.dataUrl; else $("inputImg").removeAttribute("src");
}
$("dropzone").addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", (e) => { if(e.target.files[0]) handleImageFile(e.target.files[0]); e.target.value = ""; });
$("dropzone").addEventListener("dragover", (e) => { e.preventDefault(); $("dropzone").classList.add("drag"); });
$("dropzone").addEventListener("dragleave", () => $("dropzone").classList.remove("drag"));
$("dropzone").addEventListener("drop", (e) => {
  $("dropzone").classList.remove("drag");
  if(e.dataTransfer.files && e.dataTransfer.files.length){ e.preventDefault(); handleImageFile(e.dataTransfer.files[0]); }
});
enableInterUIDrop($("dropzone"), (file) => handleImageFile(file));
$("btnClearInput").addEventListener("click", () => { inputImage = null; showInputImage(); storeInputImage(null); syncSpWithImage(false); log("Imagen de inicio quitada: texto a vídeo.", "l-ok"); });
// Con imagen, los estilos T2V por defecto pasan a su variante I2V (y al revés); los propios no se tocan.
function syncSpWithImage(hasImage){
  const [from, to] = hasImage ? ["graph", "i2v"] : ["i2v", "graph"];
  const changed = ["ltx", "h3"].filter(m => state.sp[m] === from);
  changed.forEach(m => { state.sp[m] = to; renderSp(m); });
  if(changed.length){ saveState(); log(`ℹ️ System prompts en modo ${hasImage ? "I2V" : "T2V"} (${changed.map(m => MODEL_LABEL[m]).join(", ")}).`, "l-info"); }
}
$("i2vStrength").addEventListener("input", () => { state.i2v.strength = parseFloat($("i2vStrength").value); $("i2vStrengthVal").textContent = state.i2v.strength.toFixed(2); saveState(); });
$("i2vFitRes").addEventListener("change", () => { state.i2v.fitRes = $("i2vFitRes").checked; saveState(); });
$("i2vToLlm").addEventListener("change", () => { state.i2v.llmImage = $("i2vToLlm").checked; saveState(); });

// La imagen de inicio sobrevive a recargas (IndexedDB: puede pesar varios MB).
function inputImageDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ltxh3_media", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("media");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function storeInputImage(file){
  try {
    const db = await inputImageDB();
    const tx = db.transaction("media", "readwrite");
    if(file) tx.objectStore("media").put(file, "inputImage"); else tx.objectStore("media").delete("inputImage");
  } catch(e){ console.warn("No se pudo guardar la imagen de inicio:", e); }
}
async function restoreInputImage(){
  if(new URLSearchParams(window.location.search).get("ref")) return;
  try {
    const db = await inputImageDB();
    const req = db.transaction("media").objectStore("media").get("inputImage");
    req.onsuccess = () => { if(req.result && !inputImage) handleImageFile(req.result, { restored: true }); };
  } catch(e){ console.warn("No se pudo recuperar la imagen de inicio:", e); }
}

async function uploadInputImage(img){
  if(img.uploaded) return img.uploaded;
  const ext = (img.file.type || "image/png").split("/")[1].replace("jpeg", "jpg");
  const name = `ltxh3_${Date.now()}.${ext}`;
  const fd = new FormData();
  fd.append("image", img.file, name);
  fd.append("overwrite", "true");
  const r = await fetch(server() + "/upload/image", { method: "POST", body: fd, signal: AbortSignal.timeout(120000) });
  if(!r.ok) throw new Error("fallo subiendo la imagen de inicio (HTTP " + r.status + ")");
  const d = await r.json();
  img.uploaded = { name: (d.subfolder ? d.subfolder + "/" : "") + d.name };
  return img.uploaded;
}

// Abierta desde otra WebUI con ?ref=<subcarpeta/archivo> de output: imagen de inicio.
(async function loadRefFromUrl(){
  const ref = new URLSearchParams(window.location.search).get("ref");
  if(!ref) return;
  const parts = ref.split("/");
  const media = { filename: parts.pop(), subfolder: parts.join("/"), type: "output" };
  try {
    const r = await fetch(mediaViewUrl(media));
    if(!r.ok) throw new Error("HTTP " + r.status);
    const blob = await r.blob();
    handleImageFile(new File([blob], media.filename, { type: blob.type || "image/png" }));
    log(`🖼️ Imagen recibida: ${media.filename}`, "l-ok");
  } catch(e){ log("⚠️ No se pudo cargar la imagen enviada: " + e.message, "l-warn"); }
})();

// --- CONSTRUCCIÓN DEL GRAFO ---
// Conserva solo los nodos alcanzables desde las salidas: así lo que se desactiva
// (Ollama en modo manual, el refinado en "solo pase 1"...) no se ejecuta.
function pruneGraph(g, outputs){
  const keep = new Set();
  const stack = outputs.filter(id => g[id]);
  while(stack.length){
    const id = stack.pop();
    if(keep.has(id)) continue;
    keep.add(id);
    for(const v of Object.values(g[id].inputs || {})){
      if(Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && g[v[0]]) stack.push(v[0]);
    }
  }
  for(const id of Object.keys(g)) if(!keep.has(id)) delete g[id];
}

function applyModels(g, m, models){
  g[m.UNET].inputs.unet_name = models.unet;
  g[m.CLIP].inputs.clip_name = models.clip;
  g[m.VAE_V].inputs.vae_name = models.vaeV;
  g[m.VAE_A].inputs.vae_name = models.vaeA;
  // Cadena de LoRAs reconstruida: UNet -> LoRA activas -> consumidor original.
  m.LORAS.forEach(id => delete g[id]);
  let ref = [m.UNET, 0];
  models.loras.filter(l => l.on && l.lora).forEach((l, i) => {
    const id = `${m.UNET}_lora${i + 1}`;
    g[id] = { class_type: "LoraLoaderModelOnly", inputs: { model: ref, lora_name: l.lora, strength_model: l.strength }, _meta: { title: `LoRA ${i + 1}` } };
    ref = [id, 0];
  });
  g[m.LORA_SINK[0]].inputs[m.LORA_SINK[1]] = ref;
}

function applySparse(g, m, sp){
  const base = [m.SHIFT, 0];
  const sink = g[m.SPARSE_SINK[0]].inputs;
  if(sp.mode === "none"){ delete g[m.SPARSE]; sink[m.SPARSE_SINK[1]] = base; return; }
  const prev = g[m.SPARSE]?.inputs || {};
  if(sp.mode === "sol-attn" || sp.mode === "sla"){
    g[m.SPARSE] = { class_type: "BlockSparseAttention", inputs: {
      model: base, selection: sp.mode,
      ...(sp.mode === "sol-attn" ? { "selection.tau": sp.tau } : { "selection.keep_percent": sp.keep }),
      start_percent: sp.start, end_percent: sp.end, dense_blocks: prev.dense_blocks ?? "",
      min_tokens: sp.minTokens, extra_tokens: prev.extra_tokens ?? 256,
      sink_conditioning: prev.sink_conditioning || "exact_kv_and_rows", verbose: false,
    }, _meta: { title: `Block Sparse (${sp.mode})` } };
  } else if(sp.mode === "vsa"){
    g[m.SPARSE] = { class_type: "H3VSAAttention", inputs: {
      model: base, keep_percent: sp.vsaKeep, dense_first_steps: 0, dense_layers: "",
      backend: "Auto", memory_mode: "Standard", verbose: false,
    }, _meta: { title: `H3 VSA (${sp.vsaKeep}%)` } };
  } else if(sp.mode === "h3sparse"){
    g[m.SPARSE] = { class_type: "H3SparseAttention", inputs: { model: base, video_budget: sp.budget, denser_early_late_steps: true }, _meta: { title: "H3 Sparse Attention" } };
  }
  sink[m.SPARSE_SINK[1]] = [m.SPARSE, 0];
}

function applySampling(g, m, model, s){
  g[m.SAMPLER_SEL].inputs.sampler_name = s.sampler;
  if(s.mode === "manual"){
    g[m.SIGMAS] = { class_type: "ManualSigmas", inputs: { sigmas: s.sigmas }, _meta: { title: "Sigmas manuales" } };
    return;
  }
  const modelRef = g[m.GUIDER].inputs.model;  // modelo final (LoRAs / sparse ya aplicados)
  const denoise = Math.min(1, Math.max(0.01, s.denoise));
  if(model === "ltx" && s.scheduler === "ltxv"){
    const full = `${m.SIGMAS}_full`;
    g[full] = { class_type: "LTXVScheduler", inputs: { steps: s.steps, max_shift: 2.05, base_shift: 0.95, stretch: true, terminal: 0.1 }, _meta: { title: "LTXV Scheduler" } };
    if(denoise >= 1){
      delete g[m.SIGMAS];
      g[m.SAMPLER].inputs.sigmas = [full, 0];
    } else {
      g[m.SIGMAS] = { class_type: "SplitSigmasDenoise", inputs: { sigmas: [full, 0], denoise }, _meta: { title: `Sigmas denoise ${denoise}` } };
      g[m.SAMPLER].inputs.sigmas = [m.SIGMAS, 1];
    }
    return;
  }
  g[m.SIGMAS] = { class_type: "BasicScheduler", inputs: { model: modelRef, scheduler: s.scheduler, steps: s.steps, denoise }, _meta: { title: `${s.scheduler} · ${s.steps} pasos` } };
}

// Post-proceso común: interpolación (RTX Frame Gen / RIFE) y luego RTX VSR.
function appendPost(g, images, rife, rtx, prefixId){
  let ref = images;
  if(rife && rife.enabled){
    if(rife.engine === "rtx"){
      g[`${prefixId}_interp`] = { class_type: "RTXVideoFrameGeneration", inputs: {
        images: ref, generation_type: "frame rate multiplier", "generation_type.multiplier": rife.multiplier,
        mode: "HIGH", automatic_shot_change_detection: true, shot_change: false, image_encoding: "8-bit RGB",
      }, _meta: { title: `RTX Frame Gen ${rife.multiplier}x` } };
    } else {
      g[`${prefixId}_interp_loader`] = { class_type: "FrameInterpolationModelLoader", inputs: { model_name: rife.model }, _meta: { title: "Frame Interpolation Model" } };
      g[`${prefixId}_interp`] = { class_type: "FrameInterpolate", inputs: { images: ref, interp_model: [`${prefixId}_interp_loader`, 0], multiplier: rife.multiplier }, _meta: { title: `Interpolar ${rife.multiplier}x` } };
    }
    ref = [`${prefixId}_interp`, 0];
  }
  if(rtx && rtx.enabled){
    const sameRes = /^(DENOISE|DEBLUR)_/.test(rtx.quality);
    g[`${prefixId}_rtx`] = { class_type: "RTXVideoSuperResolution", inputs: {
      images: ref, resize_type: "scale by multiplier", "resize_type.scale": sameRes ? 1.0 : rtx.scale,
      quality: rtx.quality, strength: 1.0, image_encoding: "8-bit RGB",
    }, _meta: { title: sameRes ? `RTX ${rtx.quality}` : `RTX VSR ${rtx.scale}x` } };
    ref = [`${prefixId}_rtx`, 0];
  }
  return ref;
}

function saveNode(prefix, videoRef, title){
  return { class_type: "SaveVideo", inputs: { filename_prefix: prefix, format: "auto", "format.codec": "auto", codec: "auto", video: videoRef }, _meta: { title } };
}

function buildGraph(job){
  if(job.onDemand) return buildOnDemandGraph(job);
  const d = DIRS[job.dir];
  const g = JSON.parse(JSON.stringify(d.graph));
  const L = d.ltx, H = d.h3, p1 = d.p1, p2 = d.p2;
  const W = job.width, Hh = job.height;
  const pass1Only = job.pass1Only;

  applyModels(g, L, job.models.ltx);
  applyModels(g, H, job.models.h3);
  applySparse(g, H, job.sampling.h3[roleOf(job.dir, "h3")].sparse);
  for(const model of ["ltx", "h3"]) applySampling(g, d[model], model, job.sampling[model][roleOf(job.dir, model)]);

  g[NC.FRAMES].inputs.value = job.frames;
  if(job.dir === "ltx_h3"){
    Object.assign(g["10"].inputs, { width: W, height: Hh });
    Object.assign(g[d.UPS].inputs, { width: W * 2, height: Hh * 2 });
    Object.assign(g["32"].inputs, { width: W * 2, height: Hh * 2 });
  } else {
    Object.assign(g["8"].inputs, { width: W, height: Hh });
  }
  g[d.UPS_LOADER].inputs.model_name = job.upscaler;
  g[d[p1].NOISE].inputs.noise_seed = job.seed;
  g[d[p2].NOISE].inputs.noise_seed = job.seed + 1;
  g[L.NEG].inputs.text = job.negLtx;

  // Prompts: Ollama dentro del grafo, o textos manuales directos a cada encoder.
  const outputs = [];
  if(job.promptMode === "manual"){
    g[L.POS].inputs.text = job.promptLtx;
    g[H.COND].inputs.prompt = job.promptH3;
  } else {
    const t = llmTarget(job.llm);
    g[NC.IDEA].inputs.value = job.idea;
    Object.assign(g[NC.CONN].inputs, { url: t.url, model: t.model, keep_alive: job.llm.keepAlive });
    Object.assign(g[NC.OPTS].inputs, { temperature: job.llm.temp, num_ctx: job.llm.ctx });
    g[NC.LLM_LTX].inputs.system = job.spLtx;
    g[NC.LLM_H3].inputs.system = job.spH3;
    const p1Gen = p1 === "ltx" ? NC.LLM_LTX : NC.LLM_H3;
    if(pass1Only && p1Gen === d.LLM_SECOND){
      // Solo pase 1: el generador del pase 1 se conecta directo (sin depender del otro).
      Object.assign(g[p1Gen].inputs, { connectivity: [NC.CONN, 0], options: [NC.OPTS, 0] });
      delete g[p1Gen].inputs.meta;
    }
    outputs.push(p1 === "ltx" ? NC.PREV_LTX : NC.PREV_H3);
    if(!pass1Only) outputs.push(p2 === "ltx" ? NC.PREV_LTX : NC.PREV_H3);
  }

  // I2V: H3 la recibe como first_frame; LTX la ancla en su latente de vídeo.
  if(job.image){
    g.img_load = { class_type: "LoadImage", inputs: { image: job.image }, _meta: { title: "Imagen de inicio" } };
    // Mismo encuadre (crop center) que LTX; MiniMaxH3ImageToVideo solo estira al lienzo.
    const h3Scale = roleOf(job.dir, "h3") === "p1" ? 1 : 2;
    g.img_h3_scale = { class_type: "ImageScale", inputs: { image: ["img_load", 0], upscale_method: "lanczos", width: W * h3Scale, height: Hh * h3Scale, crop: "center" }, _meta: { title: "Imagen → resolución H3" } };
    g[H.COND].inputs.first_frame = ["img_h3_scale", 0];
    const scale = roleOf(job.dir, "ltx") === "p1" ? 1 : 2;
    g.img_ltx_scale = { class_type: "ImageScale", inputs: { image: ["img_load", 0], upscale_method: "lanczos", width: W * scale, height: Hh * scale, crop: "center" }, _meta: { title: "Imagen → resolución LTX" } };
    g.img_ltx_pre = { class_type: "LTXVPreprocess", inputs: { image: ["img_ltx_scale", 0], img_compression: 33 }, _meta: { title: "LTXV Preprocess" } };
    const [sinkId, sinkField] = L.IMG_LATENT;
    g.img_ltx_inplace = { class_type: "LTXVImgToVideoInplace", inputs: {
      vae: [L.VAE_V, 0], image: ["img_ltx_pre", 0], latent: g[sinkId].inputs[sinkField], strength: job.i2vStrength, bypass: false,
    }, _meta: { title: "LTXV Img → Video (inplace)" } };
    g[sinkId].inputs[sinkField] = ["img_ltx_inplace", 0];
    if(job.promptMode !== "manual" && job.i2vToLlm){
      g.img_llm = { class_type: "ImageScale", inputs: { image: ["img_load", 0], upscale_method: "lanczos", width: W, height: Hh, crop: "center" }, _meta: { title: "Imagen para el LLM" } };
      g[NC.LLM_LTX].inputs.images = ["img_llm", 0];
      g[NC.LLM_H3].inputs.images = ["img_llm", 0];
    }
  }

  // Salidas: vídeo del pase 1 (opcional / único) y vídeo final con post-proceso.
  const tag = job.dir === "ltx_h3" ? "L2H" : "H2L";
  const prefix = `${job.prefix}_${tag}`;
  if(job.savePass1 || pass1Only){
    g.p1_create = { class_type: "CreateVideo", inputs: { images: [d.P1_DEC_V, 0], audio: [d.P1_DEC_A, 0], fps: FPS }, _meta: { title: "Vídeo pase 1" } };
    g[N.FIRST_SAVE] = saveNode(`${prefix}_p1`, ["p1_create", 0], "Guardar pase 1");
    outputs.push(N.FIRST_SAVE);
  }
  if(!pass1Only){
    g[d.CREATE].inputs.images = appendPost(g, [d.DEC_V, 0], job.rife, job.rtx, "post");
    g[d.CREATE].inputs.fps = job.rife.enabled ? FPS * job.rife.multiplier : FPS;
    g[N.FINAL_SAVE] = saveNode(prefix, [d.CREATE, 0], "Guardar vídeo final");
    outputs.push(N.FINAL_SAVE);
  }
  delete g[d.SAVE];
  // Estado de la UI dentro de los metadatos del vídeo (restauración exacta).
  const last = g[N.FINAL_SAVE] || g[N.FIRST_SAVE];
  // Con la semilla realmente usada (en aleatoria cambia por variante).
  last._meta.ltxh3_state = { ...job.uiState, seed: job.seed, seedMode: "fixed" };

  pruneGraph(g, outputs);
  return g;
}

// Post-proceso de un clip ya generado (botones ⚡ / 🔍 del reproductor).
function buildOnDemandGraph(job){
  const src = job.sourceMedia;
  const g = {
    od_load: { class_type: "LoadVideo", inputs: { file: (src.subfolder ? src.subfolder + "/" : "") + src.filename + " [output]" }, _meta: { title: "Clip de origen" } },
    od_comp: { class_type: "GetVideoComponents", inputs: { video: ["od_load", 0] }, _meta: { title: "Componentes" } },
  };
  const images = appendPost(g, ["od_comp", 0], job.onDemand === "interp" ? job.rife : null, job.onDemand === "rtx" ? job.rtx : null, "od");
  let fps = ["od_comp", 2];
  if(job.onDemand === "interp"){
    // fps de origen × multiplicador (un clip ya interpolado no es de 24 fps).
    g.od_fps = { class_type: "ComfyMathExpression", inputs: { expression: `a * ${job.rife.multiplier}`, "values.a": ["od_comp", 2] }, _meta: { title: `FPS x${job.rife.multiplier}` } };
    fps = ["od_fps", 0];
  }
  g.od_create = { class_type: "CreateVideo", inputs: { images, audio: ["od_comp", 1], fps }, _meta: { title: "Crear vídeo" } };
  const base = src.filename.replace(/_\d+_?\.[^.]+$/, "").replace(/\.[^.]+$/, "");
  const suffix = job.onDemand === "interp" ? `_interp${job.rife.multiplier}x` : (/^(DENOISE|DEBLUR)_/.test(job.rtx.quality) ? `_${job.rtx.quality.toLowerCase()}` : `_rtx${job.rtx.scale}x`);
  g[N.FINAL_SAVE] = saveNode(`${src.subfolder || "video"}/${base}${suffix}`, ["od_create", 0], "Guardar clip post-procesado");
  return g;
}

// --- RESTAURACIÓN DESDE METADATOS ---
function applyUiState(s){
  state = mergeState(defaultState(), s);
  $("prompt").value = state.idea || "";
  renderAll();
  saveState();
}
// Vídeos sin estado propio (p.ej. los workflows originales lanzados en ComfyUI):
// se leen los valores principales con los mapas de nodos.
function stateFromGraph(wf){
  const dir = wf["10"]?.class_type === "EmptyLTXVLatentVideo" ? "ltx_h3"
    : (wf["8"]?.class_type === "MiniMaxH3ImageToVideo" ? "h3_ltx" : null);
  if(!dir) return null;
  const d = DIRS[dir], s = JSON.parse(JSON.stringify(state));
  s.dir = dir;
  const str = v => typeof v === "string" ? v : null;
  for(const model of ["ltx", "h3"]){
    const m = d[model];
    const mm = s.models[model];
    mm.unet = str(wf[m.UNET]?.inputs?.unet_name) || mm.unet;
    mm.clip = str(wf[m.CLIP]?.inputs?.clip_name) || mm.clip;
    mm.vaeV = str(wf[m.VAE_V]?.inputs?.vae_name) || mm.vaeV;
    mm.vaeA = str(wf[m.VAE_A]?.inputs?.vae_name) || mm.vaeA;
    const loras = Object.values(wf).filter(n => n?.class_type === "LoraLoaderModelOnly" && (model === "h3" ? isH3Name(n.inputs.lora_name || "") : !isH3Name(n.inputs.lora_name || "")));
    if(loras.length) mm.loras = loras.map(n => ({ on: true, lora: n.inputs.lora_name, strength: n.inputs.strength_model }));
    const smp = s.sampling[model][roleOf(dir, model)];
    if(str(wf[m.SAMPLER_SEL]?.inputs?.sampler_name)) smp.sampler = wf[m.SAMPLER_SEL].inputs.sampler_name;
    if(str(wf[m.SIGMAS]?.inputs?.sigmas)){ smp.mode = "manual"; smp.sigmas = wf[m.SIGMAS].inputs.sigmas; }
  }
  const latent = dir === "ltx_h3" ? wf["10"] : wf["8"];
  if(latent?.inputs){ s.width = latent.inputs.width; s.height = latent.inputs.height; }
  if(typeof wf[NC.FRAMES]?.inputs?.value === "number") s.frames = wf[NC.FRAMES].inputs.value;
  if(typeof wf[NC.IDEA]?.inputs?.value === "string"){ s.idea = wf[NC.IDEA].inputs.value; s.promptMode = "ollama"; }
  const seed = wf[d[d.p1].NOISE]?.inputs?.noise_seed;
  if(typeof seed === "number"){ s.seed = seed; s.seedMode = "fixed"; }
  return s;
}
async function applyWorkflow(wf){
  const own = Object.values(wf).find(n => n && n._meta && n._meta.ltxh3_state);
  if(own){ applyUiState(own._meta.ltxh3_state); return true; }
  const s = stateFromGraph(wf);
  if(s){ applyUiState(s); log("ℹ️ Vídeo sin estado LTXH3: restaurados modelos, LoRAs, sigmas, resolución, frames, seed e idea.", "l-info"); return true; }
  log("⚠️ Este vídeo no es de un workflow LTX⇄H3.", "l-warn");
  return false;
}

// Mismo criterio que el resto de UIs: el JSON "prompt" incrustado en el MP4. Se
// decodifica por bloques hasta cerrar el objeto (sin convertir el vídeo entero a texto).
async function extractWorkflowFromMP4(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error("HTTP " + r.status);
  const bytes = new Uint8Array(await r.arrayBuffer());
  const marker = new TextEncoder().encode('"prompt": {');
  let start = -1;
  outer: for(let i = 0; i <= bytes.length - marker.length; i++){
    for(let j = 0; j < marker.length; j++) if(bytes[i + j] !== marker[j]) continue outer;
    start = i + marker.length - 1; break;
  }
  // SaveVideo guarda el grafo como valor de la etiqueta MP4 "prompt": {"<id>": {...
  if(start < 0){
    const isDigit = b => b >= 0x30 && b <= 0x39, isWs = b => b === 0x20 || b === 0x09 || b === 0x0A || b === 0x0D;
    for(let i = 0; i < bytes.length - 4 && start < 0; i++){
      if(bytes[i] !== 0x7B || bytes[i + 1] !== 0x22) continue;
      let j = i + 2;
      while(j < bytes.length && isDigit(bytes[j])) j++;
      if(j === i + 2 || bytes[j] !== 0x22) continue;
      let k = j + 1;
      while(k < bytes.length && isWs(bytes[k])) k++;
      if(bytes[k] !== 0x3A) continue;
      k++;
      while(k < bytes.length && isWs(bytes[k])) k++;
      if(bytes[k] === 0x7B) start = i;
    }
  }
  if(start < 0) return null;
  const decoder = new TextDecoder("utf-8");
  let collected = "", depth = 0, inStr = false, esc = false;
  for(let pos = start; pos < bytes.length; pos += 1 << 20){
    const piece = decoder.decode(bytes.subarray(pos, Math.min(pos + (1 << 20), bytes.length)), { stream: true });
    for(let i = 0; i < piece.length; i++){
      const c = piece[i];
      if(inStr){ if(esc) esc = false; else if(c === "\\") esc = true; else if(c === '"') inStr = false; continue; }
      if(c === '"') inStr = true;
      else if(c === "{") depth++;
      else if(c === "}" && --depth === 0){
        try { return JSON.parse(collected + piece.slice(0, i + 1)); }
        catch(e){ console.warn("Workflow MP4 ilegible:", e.message); return null; }
      }
    }
    collected += piece;
  }
  return null;
}

// --- RENDER GENERAL ---
function renderAll(){
  $("width").value = state.width; $("height").value = state.height;
  $("frames").value = state.frames; $("batchSize").value = state.batch;
  $("seedVal").value = state.seed; setSeedMode(state.seedMode);
  $("promptLtx").value = state.promptLtx; $("promptH3").value = state.promptH3; $("negLtx").value = state.negLtx;
  $("llmUrl").value = state.llm.url; $("llmTemp").value = state.llm.temp; $("llmTempVal").textContent = Number(state.llm.temp).toFixed(2);
  $("llmCtx").value = state.llm.ctx; $("llmKeepAlive").value = state.llm.keepAlive;
  if(state.llm.model){
    if(!$("llmModel").querySelector(`option[value="${CSS.escape(state.llm.model)}"]`)){
      const o = document.createElement("option"); o.value = state.llm.model; o.textContent = state.llm.model.replace(/^[a-z]+:/, ""); $("llmModel").appendChild(o);
    }
    $("llmModel").value = state.llm.model;
  }
  setPromptMode(state.promptMode);
  renderSp("ltx"); renderSp("h3");
  renderModels("ltx"); renderModels("h3");
  $("i2vStrength").value = state.i2v.strength; $("i2vStrengthVal").textContent = Number(state.i2v.strength).toFixed(2);
  $("i2vFitRes").checked = state.i2v.fitRes; $("i2vToLlm").checked = state.i2v.llmImage;
  $("savePass1").checked = state.savePass1; $("pass1Only").checked = state.pass1Only;
  $("filenamePrefix").value = state.prefix;
  renderPost();
  renderDirection();
}

// --- COLA DE TRABAJOS ---
let jobQueue = [];
let activeJob = null;
let jobCounter = 0;
let uploadInProgress = false;
const promptVariantMap = {};   // prompt_id -> índice de variante
const displayedFiles = new Set();
const currentMedia = {};

function snapshotJob(){
  const s = JSON.parse(JSON.stringify(state));
  s.idea = $("prompt").value;
  return {
    id: ++jobCounter,
    ...s,
    spLtx: spText("ltx", s.sp.ltx),
    spH3: spText("h3", s.sp.h3),
    upscaler: s.upscaler[s.dir],
    inputImage,
    i2vStrength: s.i2v.strength,
    i2vToLlm: s.i2v.llmImage,
    batchSize: s.batch,
    uiState: s,
  };
}
function validateJob(job){
  if(job.onDemand) return true;
  // Sin "<Picture 1>" en el texto, H3 trata el pase como texto a vídeo e ignora el primer frame.
  if(job.inputImage && job.promptMode === "manual" && !job.promptH3.includes("<Picture 1>")){
    log("⚠️ Hay imagen de inicio pero el prompt de H3 no menciona <Picture 1>: H3 la ignorará. Empieza con \"For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.\"", "l-warn");
  }
  if(job.promptMode === "ollama"){
    if(!job.idea.trim()){ log("⚠️ Escribe la idea en el panel Prompt.", "l-err"); return false; }
    if(!job.llm.model){ log("⚠️ Elige un modelo LLM (o pasa a prompts manuales).", "l-err"); return false; }
  } else {
    const needH3 = !job.pass1Only || DIRS[job.dir].p1 === "h3";
    const needLtx = !job.pass1Only || DIRS[job.dir].p1 === "ltx";
    if((needLtx && !job.promptLtx.trim()) || (needH3 && !job.promptH3.trim())){
      log("⚠️ Modo manual: rellena los prompts de LTX-2.5 y MiniMax H3.", "l-err"); return false;
    }
  }
  return true;
}

function updateQueueUI(){
  const count = jobQueue.length;
  $("btnClearQueue").disabled = (count === 0 && !activeJob);
  const activeRemaining = activeJob ? Math.max(1, totalBatchSize - currentBatchIndex) : 0;
  const queued = jobQueue.reduce((a, j) => a + (j.batchSize || 1), 0);
  const total = activeRemaining + queued + (serverQueueState.pending || 0);
  $("queueTotalNum").textContent = total;
  $("queueTotalBadge").classList.toggle("active", total > 0);
  $("queueItemsTitle").textContent = `Ver trabajos en cola (${count})`;
  $("queueItemsAccordion").style.display = count > 0 ? "block" : "none";
  const list = $("queueItemsList");
  list.innerHTML = "";
  jobQueue.forEach((job, idx) => {
    const row = document.createElement("div");
    row.className = "queue-item-row";
    const desc = job.onDemand ? `${job.onDemand} · ${job.sourceMedia.filename}` : `${job.dir === "ltx_h3" ? "LTX→H3" : "H3→LTX"} · ${(job.idea || job.promptLtx || "").slice(0, 30)}`;
    row.innerHTML = `<div class="queue-item-left" title="${escapeHtml(desc)}"><span class="queue-item-id">#${job.id}</span><span class="queue-item-desc">${escapeHtml(desc)} · ${job.batchSize || 1} var</span></div><span class="queue-item-del" title="Quitar de la cola">×</span>`;
    row.querySelector(".queue-item-del").addEventListener("click", () => { jobQueue.splice(idx, 1); updateQueueUI(); log(`🗑️ Job #${job.id} quitado de la cola.`, "l-ok"); });
    list.appendChild(row);
  });
}
$("queueItemsToggle").addEventListener("click", () => $("queueItemsAccordion").classList.toggle("open"));
$("btnClearQueue").addEventListener("click", () => { const n = jobQueue.length; jobQueue = []; updateQueueUI(); log(`🗑️ Cola vaciada (${n} jobs).`, "l-ok"); });

async function enqueueJob(job){
  if(!validateJob(job)) return;
  if(activeJob){
    jobQueue.push(job);
    updateQueueUI();
    log(`📥 Job #${job.id} en cola (${jobQueue.length} en espera).`, "l-info");
  } else {
    await startJob(job);
  }
}
async function startJob(job){
  activeJob = job;
  updateQueueUI();
  try {
    await ensureSocketConnected();
    if(job.inputImage){
      uploadInProgress = true;
      try { job.image = (await uploadInputImage(job.inputImage)).name; }
      finally { uploadInProgress = false; }
    }
    totalBatchSize = job.batchSize || 1;
    currentBatchIndex = 0;
    batchSeedMode = job.seedMode === "random" ? "random" : "fixed";
    $("time1").textContent = "";
    setRun("busy", job.onDemand ? `Post-proceso de ${job.sourceMedia.filename}...` : `Job #${job.id} · ${totalBatchSize} variante(s)...`);
    enableStopButtons(true);
    await runSingleGeneration(0);
  } catch(err){
    log(`❌ Error al iniciar el job #${job.id}: ${err.message || err}`, "l-err");
    setRun("bad", "Error");
    finishCurrentJob();
  }
}
function finishCurrentJob(){
  activeJob = null;
  if(jobQueue.length){
    const next = jobQueue.shift();
    updateQueueUI();
    startJob(next);
  } else {
    setRun("ok", "en reposo");
    clearPreview();
    enableStopButtons(false);
    updateQueueUI();
  }
}
async function runSingleGeneration(index){
  if(!activeJob) return;
  const job = activeJob;
  try {
    const seed = job.seedMode === "random" ? randomSeed() : job.seed + index;
    const graph = buildGraph({ ...job, seed });
    variantCounter++;
    const varIndex = variantCounter;
    log(job.onDemand ? `Encolando ${job.onDemand === "interp" ? "interpolación" : "RTX VSR"} de ${job.sourceMedia.filename}...`
      : `Var ${varIndex} · ${job.dir === "ltx_h3" ? "LTX→H3" : "H3→LTX"} · seed ${seed} · ${job.width}×${job.height} · ${job.frames}f${job.pass1Only ? " · solo pase 1" : ""}...`);
    uploadInProgress = true;
    const r = await fetch(server() + "/prompt", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(60000),
      body: JSON.stringify({ prompt: graph, client_id: CLIENT_ID, extra_data: { extra_pnginfo: { workflow: graph }, preview_method: getPreviewMethod() === "none" ? "none" : "latent2rgb" } }),
    }).finally(() => { uploadInProgress = false; });
    if(!r.ok){ const t = await r.text().catch(() => ""); throw new Error("HTTP " + r.status + " " + t.slice(0, 400)); }
    const data = await r.json();
    if(data.error) throw new Error(JSON.stringify(data.error));
    pendingSeeds[data.prompt_id] = seed;
    promptVariantMap[data.prompt_id] = varIndex;
    currentPromptId = data.prompt_id;
    startTimer(data.prompt_id, 1);
    pollFallback(data.prompt_id);
  } catch(err){
    const timeout = err && (err.name === "TimeoutError" || err.name === "AbortError");
    log(`❌ No se pudo encolar${timeout ? " (timeout del backend)" : ""}: ${err.message || err}`, "l-err");
    finishCurrentJob();
  }
}
$("btnGenerate").addEventListener("click", () => enqueueJob(snapshotJob()));

function enqueueOnDemand(kind){
  const media = currentMedia[1];
  if(!media){ log("⚠️ No hay vídeo en el reproductor.", "l-warn"); return; }
  enqueueJob({
    id: ++jobCounter, onDemand: kind, sourceMedia: { ...media }, batchSize: 1, seedMode: "fixed", seed: 0,
    rife: { ...state.rife, enabled: true }, rtx: { ...state.rtx, enabled: true },
  });
}
$("btnInterpolate1").addEventListener("click", () => enqueueOnDemand("interp"));
$("btnRtxUpscale1").addEventListener("click", () => enqueueOnDemand("rtx"));

// --- CALLBACKS PARA common.js ---
CONFIG.findMedia = function(out){
  for(const k of ["videos", "gifs", "images"]) if(out && out[k]?.length) return out[k][out[k].length - 1];
  return null;
};
CONFIG.renderVariantMedia = (card, url) => `<video src="${escapeHtml(url)}" crossorigin="anonymous" controls muted preload="metadata" playsinline></video>`;
CONFIG.onSeedUpdate = function(seed){
  if(totalBatchSize <= 1){ state.seed = seed; $("seedVal").value = seed; saveState(); }
};
// Etapa del pipeline según el nodo en ejecución (resalta la cadena superior).
CONFIG.onNodeExecuting = function(data){
  const node = data && data.node;
  document.querySelectorAll("#chain .node").forEach(n => n.classList.remove("active"));
  if(!node || !activeJob || activeJob.onDemand) return;
  const d = DIRS[activeJob.dir];
  const stage = ["48", "49", "50", "51", "52", "53", "54"].includes(node) ? "llm"
    : node === d[d.p1].SAMPLER ? "p1"
    : node === d.UPS_LOADER || node === d.UPS ? "bridge"
    : node === d[d.p2].SAMPLER ? "p2"
    : (node === N.FINAL_SAVE || node.startsWith("post_")) ? "out" : null;
  if(stage) document.querySelector(`#chain .node[data-n="${stage}"]`)?.classList.add("active");
};
CONFIG.onNodeExecuted = function(data){
  if(!data || !data.output || !(data.prompt_id in pendingSeeds)) return;
  const text = data.output.text && data.output.text[0];
  if(text && data.node === NC.PREV_LTX){ $("promptLtx").value = text; state.promptLtx = text; saveState(); log("📝 Prompt LTX-2.5 generado.", "l-ok"); }
  if(text && data.node === NC.PREV_H3){ $("promptH3").value = text; state.promptH3 = text; saveState(); log("📝 Prompt MiniMax H3 generado.", "l-ok"); }
  if(data.node === N.FIRST_SAVE || data.node === N.FINAL_SAVE){
    const media = CONFIG.findMedia(data.output);
    if(media) showResult(media, data.prompt_id, data.node === N.FIRST_SAVE ? "pase 1" : "final");
  }
};
CONFIG.displayResult = async function(entry, realSeed, tTotal, promptId, timings){
  const out1 = entry.outputs[N.FIRST_SAVE], out2 = entry.outputs[N.FINAL_SAVE];
  const m1 = out1 ? CONFIG.findMedia(out1) : null, m2 = out2 ? CONFIG.findMedia(out2) : null;
  if(!m1 && !m2) return { foundOutput: false };
  if(m1) showResult(m1, promptId, "pase 1", timings?.t1 || tTotal);
  if(m2) showResult(m2, promptId, "final", tTotal);
  const el = $("time1");
  if(el){ el.textContent = `⏱ ${tTotal || "—"}`; el.classList.remove("live"); }
  delete promptVariantMap[promptId];
  return false;
};
CONFIG.onProgress = function(value, max){
  const pct = Math.round((value / max) * 100);
  $("previewStepText1").textContent = `Paso ${value}/${max} · ${pct}%`;
  $("previewStep1").style.display = "inline-flex";
  $("previewWrap1").style.display = "block";
  $("empty1").style.display = "none";
};
CONFIG.onPreview = function(url){
  const isVideo = typeof url === "string" && /^data:video\//.test(url);
  const target = isVideo ? $("previewVideo1") : $("previewImg1");
  const other = isVideo ? $("previewImg1") : $("previewVideo1");
  target.src = url; target.style.display = "block"; other.style.display = "none";
  $("previewWrap1").style.display = "block";
  $("empty1").style.display = "none";
  $("video1").style.display = "none";
};
CONFIG.onClearPreview = function(){
  const p = $("previewImg1"), pv = $("previewVideo1");
  p.style.display = "none"; p.removeAttribute("src");
  pv.pause(); pv.style.display = "none"; pv.removeAttribute("src");
  $("previewWrap1").style.display = "none"; $("previewStep1").style.display = "none";
  document.querySelectorAll("#chain .node").forEach(n => n.classList.remove("active"));
  if(!currentMedia[1]) $("empty1").style.display = "";
};
CONFIG.onPromptError = function(pid){ delete promptVariantMap[pid]; };
CONFIG.startNextVariant = async function(index){ if(activeJob) await runSingleGeneration(index); };
CONFIG.onBatchComplete = function(){ finishCurrentJob(); };
CONFIG.onStopCurrent = function(pid){ delete pendingSeeds[pid]; delete promptVariantMap[pid]; };
CONFIG.onStopAll = function(){
  if(currentPromptId) handledPrompts.add(currentPromptId);
  currentPromptId = null;
  jobQueue = []; activeJob = null;
  currentBatchIndex = 0; totalBatchSize = 1;
  updateQueueUI(); enableStopButtons(false);
};
CONFIG.variantMeta = function(seed, timeText, job){
  if(!job || job.onDemand) return null;
  const rows = [
    ["Dirección", job.dir === "ltx_h3" ? "LTX → H3" : "H3 → LTX"],
    ["Base", `${job.width}×${job.height} · ${job.frames}f`],
    ["LTX UNet", (job.models.ltx.unet || "").split("/").pop()],
    ["H3 UNet", (job.models.h3.unet || "").split("/").pop()],
    ["Sparse H3", job.sampling.h3[roleOf(job.dir, "h3")].sparse.mode],
    ["Seed", String(seed ?? "—")],
  ];
  if(timeText) rows.push(["Tiempo", timeText]);
  if(job.image) rows.push(["I2V", job.image]);
  const loras = [...job.models.ltx.loras, ...job.models.h3.loras].filter(l => l.on && l.lora).map(l => `${l.lora.split("/").pop()} (${l.strength})`);
  return { title: "Parámetros LTXH3", rows, loras };
};

// --- RESULTADOS: REPRODUCTOR Y GALERÍA ---
function showResult(media, promptId, stage, timeText){
  const key = `${media.subfolder || ""}/${media.filename}`;
  const varIndex = promptVariantMap[promptId] ?? variantCounter;
  if(timeText) saveVideoTiming(media.filename, timeText);
  if(displayedFiles.has(key)) return;
  displayedFiles.add(key);
  const seed = pendingSeeds[promptId] ?? null;
  showVideo(media, { badge: activeJob?.onDemand ? stage : `Var ${varIndex} · ${stage}`, stage });
  addToVariantGallery(media, seed, timeText || "", varIndex, stage, activeJob);
  log(`✅ Vídeo ${stage} listo: ${media.filename}`, "l-ok");
}

function showVideo(media, options = {}){
  const v = $("video1");
  v.src = `${mediaViewUrl(media)}#t=0.1`;
  v.style.display = "block";
  $("empty1").style.display = "none";
  $("previewWrap1").style.display = "none";
  if(options.autoplay !== false) v.play().catch(() => {});
  currentMedia[1] = { filename: media.filename, subfolder: media.subfolder || "", type: media.type || "output" };
  $("badge1").textContent = options.badge || "";
  $("vidStage").textContent = options.stage || "final";
  for(const id of ["btnDownload1", "btnSaveFrame1", "btnInterpolate1", "btnRtxUpscale1"]) $(id).style.display = "inline-flex";
  $("btnLoadMeta1").disabled = false;
  $("res1").textContent = "";
  v.addEventListener("loadedmetadata", () => {
    if(v.videoWidth) $("res1").textContent = `${v.videoWidth}×${v.videoHeight} · ${getFriendlyRatio(v.videoWidth, v.videoHeight)}`;
  }, { once: true });
}

function addToVariantGallery(media, seed, timeText, varIndex, stage, job){
  const box = $("variantGalleryBox"), grid = $("variantGrid");
  box.style.display = "block";
  const card = buildVariantCard(grid, box, media, seed, timeText, varIndex, null, stage, CONFIG.variantMeta(seed, timeText, job));
  if(seed != null){
    const seedSpan = card.querySelector(".variant-seed-display");
    seedSpan.addEventListener("click", (e) => { e.stopPropagation(); copySeedToClipboard(seedSpan, seed); });
  }
  const updateCount = () => {
    const n = grid.querySelectorAll(".variant-card").length;
    $("variantCount").textContent = `(${n})`;
    if(!n) box.style.display = "none";
  };
  const delBtn = card.querySelector(".variant-del-btn");
  delBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    deleteMediaFile(card, delBtn, media, grid, box, "Vídeo", updateCount, updateCount);
  });
  card.addEventListener("click", (e) => {
    if(e.target.closest("video") || e.target.closest("button") || e.target.closest(".variant-seed-display")) return;
    showVideo(media, { badge: `Var ${varIndex} · ${stage}`, stage });
  });
  updateCount();
}

// --- BOTONES DEL REPRODUCTOR ---
const currentViewUrl = () => currentMedia[1] ? mediaViewUrl(currentMedia[1]) : null;
$("btnLoadMeta1").addEventListener("click", async () => {
  const url = currentViewUrl();
  if(!url) return;
  const btn = $("btnLoadMeta1");
  btn.disabled = true;
  try {
    const wf = await extractWorkflowFromMP4(url);
    if(!wf){ log("ℹ️ Este vídeo no contiene metadatos de workflow.", "l-info"); return; }
    if(await applyWorkflow(wf)) log(`📋 Parámetros restaurados desde ${currentMedia[1].filename}`, "l-ok");
  } catch(e){ log("❌ Error leyendo metadatos: " + e.message, "l-err"); }
  finally { btn.disabled = false; }
});
$("btnDownload1").addEventListener("click", async () => {
  const url = currentViewUrl();
  if(!url) return;
  try {
    const r = await fetch(url);
    if(!r.ok) throw new Error("HTTP " + r.status);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await r.blob());
    a.download = currentMedia[1].filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  } catch(e){ log("❌ Error descargando: " + e.message, "l-err"); }
});
$("btnSaveFrame1").addEventListener("click", () => {
  const v = $("video1");
  if(!v.videoWidth){ log("⚠️ El vídeo aún no está cargado.", "l-warn"); return; }
  const c = document.createElement("canvas");
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext("2d").drawImage(v, 0, 0);
  c.toBlob(blob => {
    if(!blob){ log("❌ No se pudo capturar el frame.", "l-err"); return; }
    handleImageFile(new File([blob], `frame_${Math.round(v.currentTime * FPS)}.png`, { type: "image/png" }));
    log(`📸 Frame ${v.currentTime.toFixed(2)} s como imagen de inicio.`, "l-ok");
  }, "image/png");
});

// --- HISTORIAL ---
makeCollapsible("videoHistoryToggle", "videoHistoryBody", () => loadVideoHistory());
$("btnRefreshVideoHistory").addEventListener("click", (e) => { e.stopPropagation(); loadVideoHistory(); });
async function loadVideoHistory(){
  const status = $("videoHistoryStatus"), grid = $("videoHistoryGrid");
  status.textContent = "Cargando...";
  grid.innerHTML = "";
  syncHistoryTimings();
  try {
    const r = await fetch("/api/ltxh3_list");
    if(!r.ok) throw new Error("HTTP " + r.status);
    const items = (await r.json()).items || [];
    if(!items.length){ status.textContent = "No hay vídeos LTXH3 en el historial."; return; }
    let visible = Math.min(30, items.length);
    const render = () => {
      grid.innerHTML = "";
      for(const item of items.slice(0, visible)){
        const card = document.createElement("div");
        card.className = "variant-card";
        card.dataset.filename = item.filename; card.dataset.subfolder = item.subfolder; card.dataset.type = item.type;
        const date = new Date(item.mtime * 1000).toLocaleString("es-ES", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        const timing = getVideoTiming(item.filename);
        card.innerHTML = `<video src="${mediaViewUrl(item, { anchor: "#t=0.001" })}" crossorigin="anonymous" controls muted preload="metadata" playsinline></video>
          <div class="variant-info"><span style="font-size:10px;color:var(--muted-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;" title="${escapeHtml(item.filename)}">${escapeHtml(item.filename)}</span>
          <span class="variant-icons"><button class="variant-meta-btn" data-action="workflow" title="Restaurar parámetros">📋</button><button class="variant-del-btn" data-action="delete" title="Eliminar">×</button></span></div>
          <div style="padding:2px 8px 6px;font-size:9px;color:var(--muted-2);font-family:var(--mono);">${date}${timing ? " · ⏱ " + escapeHtml(timing) : ""}</div>`;
        makeCardDraggable(card);
        card.addEventListener("click", (e) => {
          if(e.target.closest("video") || e.target.closest("button")) return;
          showVideo(item, { badge: item.filename.replace(/\.[^.]+$/, ""), autoplay: false, stage: "historial" });
        });
        card.querySelector('[data-action="workflow"]').addEventListener("click", async (e) => {
          e.stopPropagation();
          try {
            const wf = await extractWorkflowFromMP4(mediaViewUrl(item));
            if(wf && await applyWorkflow(wf)) log(`📋 Parámetros restaurados desde ${item.filename}`, "l-ok");
            else if(!wf) log(`ℹ️ ${item.filename} no contiene metadatos.`, "l-warn");
          } catch(err){ log("❌ Error leyendo workflow: " + err.message, "l-err"); }
        });
        const del = card.querySelector('[data-action="delete"]');
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          const upd = (g) => { const n = g.querySelectorAll(".variant-card").length; status.textContent = n ? `${n} vídeos.` : "No hay vídeos LTXH3 en el historial."; };
          deleteMediaFile(card, del, item, grid, null, "Vídeo", upd, upd);
        });
        grid.appendChild(card);
      }
      if(visible < items.length){
        const more = document.createElement("button");
        more.className = "ghost"; more.style.cssText = "grid-column:1/-1;justify-self:center;margin:6px 0;";
        more.textContent = `Cargar más (${items.length - visible} restantes)`;
        more.addEventListener("click", (e) => { e.stopPropagation(); visible = Math.min(visible + 30, items.length); render(); });
        grid.appendChild(more);
      }
      status.textContent = `${items.length} vídeos (${Math.min(visible, items.length)} mostrados).`;
    };
    render();
  } catch(err){ status.textContent = "Error: " + err.message; }
}

// --- ARRANQUE ---
$("prompt").value = state.idea || "";
renderAll();
restoreInputImage();
loadSamplerLists();
loadLlmModels().then(() => saveState());
setInterval(updateQueueUI, 3000);
