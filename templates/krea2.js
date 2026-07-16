// krea2.js — Krea2-specific JavaScript.
// Injected AFTER common.js. CONFIG must be defined before initCommon().

const CONFIG = {
  PROMPTS_KEY: 'krea2_prompts',
  LORA_STATE_KEY: 'krea2_loras_state',
  ENHANCER_SYSKEY: 'krea2_enhancer_sysprompts',
  SERVERURL_KEY: 'krea2_serverUrl',
  DEFAULT_BACKEND_PORT: "7821",
  UI_TYPE: "krea2",
  DEFAULT_MODEL: "krea2_turbo_convrot_int4_fast.safetensors",
  N: {UNET:"1",CLIP:"13",PROMPT:"57",CLIP_ENCODE:"6",NEG:"8",EMPTY_LATENT:"10",PROJECTOR:"35",ENHANCER:"39",LORA1:"40",LORA2:"60",LORA3:"68",VAE:"42",VAE_DECODE:"43",SAMPLER:"45",PURGE:"55",RES_SELECTOR:"69",SEED_VARIANCE:"70",PREVIEW:"5",SAVE:"100"},
  loras: [{on:true, lora:"", strength:0.4},{on:false, lora:"", strength:0.5},{on:false, lora:"", strength:0.4}],
  ENHANCER_DEFAULT_PROMPTS: {
    text: {
      A: { name: "Estilo A (photorealistic)", prompt: "You are an expert in prompts for Krea2/Flux2 image generation. Transform the user's idea into a detailed photorealistic prompt. Include: subject, lighting, colors, texture, composition, and atmosphere. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt, no explanations or prefaces." },
      B: { name: "Estilo B (artistic)", prompt: "You are a creative assistant specialized in artistic image prompts. Take the user's idea and turn it into an evocative, artistic prompt. Use descriptive, poetic language. Focus on style, mood, and visual impact. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
    },
    vision: {
      A: { name: "Estilo A (descriptive)", prompt: "You are an expert at describing images for image generation. Analyze the provided image and generate a detailed prompt describing: composition, subjects, background, lighting, colors, and style. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
      B: { name: "Estilo B (stylized)", prompt: "You are a digital artist. Look at the image and turn it into a stylized artistic description. Focus on the artistic style, color palette, and emotional impact. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
      C: { name: "Estilo C (literal caption)", prompt: "You are an image captioning specialist. Describe the provided image factually and concisely in 1-3 sentences. No artistic interpretation, no camera instructions, no stylistic flourishes. Just what is visible: main subjects, setting, lighting, and notable details. The user may write in any language; you must ALWAYS respond in English with ONLY the caption, no explanations or preambles." },
    },
  },
};

const N = CONFIG.N;
initCommon();

let currentOutputMedia = null;
let currentRefVariantIndex = -1;

// --- CALLBACKS FOR common.js ---
CONFIG.findMedia = function(nodeOutput){
  for(const k of["videos","gifs","images"]) if(nodeOutput[k]?.length) return nodeOutput[k][nodeOutput[k].length-1];
  return null;
};
CONFIG.showMedia = function(slot, media, options){ showImage(media); };
CONFIG.addToVariantGallery = addToVariantGallery;
CONFIG.onSeedUpdate = function(realSeed){ /* Krea2 logs only; no seed UI toggle */ };
CONFIG.onPromptError = function(pid){};
CONFIG.startNextVariant = function(index){ runSingleGeneration(index); };
CONFIG.onBatchComplete = function(){
  $("btnGenerate").disabled=false;
  enableStopButtons(false);
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
  enableStopButtons(false);
  $("btnGenerate").disabled=false;
};

// --- Krea2 displayResult callback ---
CONFIG.displayResult = async function(entry, realSeed, tTotal, promptId){
  const timeText = tTotal || "";
  const outNode = entry.outputs[N.SAVE] || entry.outputs[N.PREVIEW] || entry.outputs[N.VAE_DECODE];
  if(outNode) {
    const media = CONFIG.findMedia(outNode);
    showImage(media);
    addToVariantGallery(media, realSeed, timeText);
  }
  // Let common.js handle: delete pendingSeeds, variantCounter++, currentBatchIndex++, processNextBatch()
  return false;
};

// --- SHOW IMAGE ---
function showImage(media){
  if(!media) return;
  currentOutputMedia = media;
  const url=`${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder||"")}&type=${encodeURIComponent(media.type||"output")}`;
  const img=$("outputImg"), empty=$("empty1"), dl=$("dl1");
  img.src=url; img.style.display="block"; empty.style.display="none";
  dl.href=url; dl.style.display="inline";
  img.onload = () => {
    const w = img.naturalWidth, h = img.naturalHeight;
    if(w && h){
      function gcd(a,b){ return b ? gcd(b, a % b) : a; }
      const d = gcd(w, h) || 1;
      $("imgInfo").textContent = `${w}×${h} · ${w/d}:${h/d}`;
    }
  };
  outputZoom.resetZoom();
}

// --- ZOOM / PAN / FULLSCREEN ---
function getImageVisibleRect(img){
  const rect = img.getBoundingClientRect();
  const natW = img.naturalWidth || rect.width;
  const natH = img.naturalHeight || rect.height;
  if(!natW || !natH) return rect;
  const scale = Math.min(rect.width / natW, rect.height / natH);
  const visW = natW * scale;
  const visH = natH * scale;
  return {
    left: rect.left + (rect.width - visW) / 2,
    top: rect.top + (rect.height - visH) / 2,
    width: visW,
    height: visH,
    right: rect.left + (rect.width + visW) / 2,
    bottom: rect.top + (rect.height + visH) / 2
  };
}

function setupZoomPan(wrapId, imgId, resetBtnId, fullscreenBtnId){
  let zoomLevel = 1, zoomPanX = 0, zoomPanY = 0, zoomDragging = false, zoomStartX, zoomStartY, zoomStartPanX, zoomStartPanY;
  const wrap = $(wrapId);
  if(!wrap) return { resetZoom: ()=>{}, isFullscreen: ()=>false };

  function getImg(){ return $(imgId); }

  function resetZoom(){
    zoomLevel = 1; zoomPanX = 0; zoomPanY = 0;
    const img = getImg();
    if(img){
      img.style.transform = "none";
      void img.offsetWidth;
    }
    wrap.style.cursor = "grab";
  }

  function applyZoom(){
    const img = getImg();
    if(img) img.style.transform = `translate(${zoomPanX}px,${zoomPanY}px) scale(${zoomLevel})`;
  }

  wrap.addEventListener("wheel", (e) => {
    const img = getImg();
    if(!img || img.style.display === "none") return;
    e.preventDefault();
    const visRect = getImageVisibleRect(img);
    if(e.clientX < visRect.left || e.clientX > visRect.right || e.clientY < visRect.top || e.clientY > visRect.bottom) return;
    const mx = e.clientX - visRect.left;
    const my = e.clientY - visRect.top;
    const cx = visRect.width / 2;
    const cy = visRect.height / 2;
    const old = zoomLevel;
    zoomLevel *= (e.deltaY < 0) ? 1.12 : 0.88;
    zoomLevel = Math.max(1, Math.min(20, zoomLevel));
    const ratio = zoomLevel / old;
    zoomPanX += (mx - cx) * (1 - ratio);
    zoomPanY += (my - cy) * (1 - ratio);
    applyZoom();
  });

  wrap.addEventListener("mousedown", (e) => {
    const img = getImg();
    if(!img || img.style.display === "none" || zoomLevel <= 1) return;
    e.preventDefault();
    zoomDragging = true;
    zoomStartX = e.clientX; zoomStartY = e.clientY;
    zoomStartPanX = zoomPanX; zoomStartPanY = zoomPanY;
    wrap.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if(!zoomDragging) return;
    e.preventDefault();
    zoomPanX = zoomStartPanX + (e.clientX - zoomStartX);
    zoomPanY = zoomStartPanY + (e.clientY - zoomStartY);
    applyZoom();
  });

  window.addEventListener("mouseup", () => {
    if(!zoomDragging) return;
    zoomDragging = false;
    wrap.style.cursor = "grab";
  });

  if(resetBtnId){
    const btn = $(resetBtnId);
    if(btn) btn.addEventListener("click", resetZoom);
  }

  function enterFs(){
    const img = getImg();
    wrap.dataset.fsPrev = wrap.style.cssText || "";
    wrap.style.cssText = "position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;max-height:none!important;margin:0!important;padding:0!important;background:#000;border-radius:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;";
    if(img){
      img.dataset.fsPrev = img.style.cssText || "";
      img.style.cssText = "display:block!important;width:100vw!important;height:100vh!important;max-width:100vw!important;max-height:100vh!important;object-fit:contain!important;transform:none!important;transform-origin:center center!important;";
    }
  }
  function exitFs(){
    const img = getImg();
    if(wrap.dataset.fsPrev !== undefined){ wrap.style.cssText = wrap.dataset.fsPrev; delete wrap.dataset.fsPrev; }
    else { wrap.style.cssText = ""; }
    if(img){
      if(img.dataset.fsPrev !== undefined){ img.style.cssText = img.dataset.fsPrev; delete img.dataset.fsPrev; }
      else { img.style.cssText = ""; }
      applyZoom();
    }
    // Ensure display is block if it was before fullscreen
    if(wrap.style.display === "") wrap.style.display = "block";
  }

  function isFullscreen(){ return !!(document.fullscreenElement || document.webkitFullscreenElement); }

  if(fullscreenBtnId){
    const btn = $(fullscreenBtnId);
    if(btn){
      btn.addEventListener("click", () => {
        if(!document.fullscreenElement && !document.webkitFullscreenElement){
          if(wrap.requestFullscreen) wrap.requestFullscreen();
          else if(wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
        } else {
          if(document.exitFullscreen) document.exitFullscreen();
          else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
      });
    }
  }

  wrap.addEventListener("fullscreenchange", () => {
    if(document.fullscreenElement || document.webkitFullscreenElement) enterFs();
    else exitFs();
  });
  wrap.addEventListener("webkitfullscreenchange", () => {
    if(document.fullscreenElement || document.webkitFullscreenElement) enterFs();
    else exitFs();
  });

  function getState(){ return { zoomLevel, zoomPanX, zoomPanY }; }

  return { resetZoom, getState, isFullscreen };
}

const outputZoom = setupZoomPan("imgWrap", "outputImg", "btnResetZoom", "btnFullscreenImg");
const refZoom = setupZoomPan("refWrap", "refImg", "btnResetZoomRef", "btnFullscreenRef");

// Navegación de la imagen de referencia en pantalla completa con flechas
function navigateRefVariant(dir){
  const grid = $("variantGrid");
  if(!grid) return;
  const cards = Array.from(grid.querySelectorAll(".variant-card"));
  if(!cards.length) return;
  if(currentRefVariantIndex < 0) currentRefVariantIndex = 0;
  let newIdx = currentRefVariantIndex + dir;
  if(newIdx < 0) newIdx = cards.length - 1;
  if(newIdx >= cards.length) newIdx = 0;
  currentRefVariantIndex = newIdx;
  const card = cards[newIdx];
  const url = `${server()}/view?filename=${encodeURIComponent(card.dataset.filename)}&subfolder=${encodeURIComponent(card.dataset.subfolder)}&type=${encodeURIComponent(card.dataset.type)}`;
  loadRefImage(url);
  currentOutputMedia = { filename: card.dataset.filename, subfolder: card.dataset.subfolder, type: card.dataset.type };
}

document.addEventListener("keydown", (e) => {
  if(!refZoom.isFullscreen()) return;
  if(e.key === "ArrowLeft"){ e.preventDefault(); navigateRefVariant(-1); }
  if(e.key === "ArrowRight"){ e.preventDefault(); navigateRefVariant(1); }
});

$("btnSendLtxv").addEventListener("click", () => {
  if(!currentOutputMedia || !currentOutputMedia.filename){
    log("⚠️ Primero genera una imagen para poder enviarla a LTXV.", "l-err");
    return;
  }
  const filename = currentOutputMedia.filename;
  const ref = encodeURIComponent(filename);
  const here = window.location;
  const targetHost = here.hostname;
  const targetPort = "8000";
  const url = `${here.protocol}//${targetHost}:${targetPort}/LTXV_WebUI.html?ref=${ref}`;
  const win = window.open(url, "_blank");
  if(!win) log("⚠️ El navegador bloqueó la nueva pestaña. Permite popups y reintenta.", "l-err");
  else log("↗️ Abriendo LTXV con la imagen: "+filename, "l-ok");
});

let _fsResetTimer = null;
// Global fullscreen handler removed — setupZoomPan handles enter/exit per wrap.

// --- VARIANT GALLERY (Krea2 image version with IndexedDB) ---
function addToVariantGallery(media, seedValue, timeText) {
    if(!media || !media.filename) {
        log("⚠️ No se encontró imagen de salida para añadir a la galería de variantes.", "l-err");
        return;
    }
    const box = $("variantGalleryBox");
    const grid = $("variantGrid");
    box.style.display = "block";

    const { filename, subfolder, type } = media;
    const ts = Date.now();
    const url = `${server()}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${encodeURIComponent(type)}&t=${ts}`;

    const hasSeed = seedValue !== null && seedValue !== undefined;
    const displayText = hasSeed ? String(seedValue) : `Var. #${variantCounter + 1}`;
    const tooltipText = hasSeed ? "Click para copiar semilla" : "Semilla no disponible";
    const timeStr = timeText || "";

    const card = document.createElement("div");
    card.className = "variant-card";
    card.dataset.filename = filename;
    card.dataset.subfolder = subfolder;
    card.dataset.type = type;
    card.innerHTML = `
        <img src="${url}">
        <div class="variant-info">
            <span class="variant-seed-display" title="${tooltipText}">
                <span class="seed-text">${displayText}</span>
                <span class="copy-icon">📋</span>
            </span>
            <span class="variant-time" title="Tiempo de inferencia">⏱ ${timeStr}</span>
            <span class="variant-icons">
                <a href="${url}" download style="color:var(--accent);text-decoration:none" onclick="event.stopPropagation();">⬇</a>
                <button class="variant-del-btn" title="Eliminar de la galería" onclick="event.stopPropagation();">×</button>
            </span>
        </div>
    `;

    if(hasSeed) {
        const seedSpan = card.querySelector('.variant-seed-display');
        seedSpan.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                await navigator.clipboard.writeText(String(seedValue));
                const originalHTML = seedSpan.innerHTML;
                seedSpan.innerHTML = '<span class="seed-text">¡Copiado!</span> <span class="copy-icon">✅</span>';
                setTimeout(() => { seedSpan.innerHTML = originalHTML; }, 1200);
            } catch(err) { console.error("Error al copiar:", err); }
        });
    }

    const delBtn = card.querySelector(".variant-del-btn");
    delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if(!confirm("¿Eliminar esta variante del disco y de la galería?")) return;
        const fn = card.dataset.filename;
        const sf = card.dataset.subfolder;
        const tp = card.dataset.type;
        delBtn.disabled = true;
        try {
            const r = await fetch("/api/file_delete", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({filename: fn, subfolder: sf, type: tp}),
            });
            if(!r.ok){
                const t = await r.text().catch(()=>"");
                throw new Error("HTTP "+r.status+" "+(t||"").slice(0,200));
            }
            const j = await r.json();
            if(!j.ok && !j.deleted) throw new Error("Respuesta inesperada del backend");
            card.remove();
            const remaining = grid.querySelectorAll(".variant-card").length;
            $("variantCount").textContent = `(${remaining})`;
            if(remaining === 0) box.style.display = "none";
            log("🗑️ Variante eliminada del disco: "+fn, "l-ok");
        } catch(err){
            log("❌ No se pudo borrar del disco: "+err.message, "l-err");
            delBtn.disabled = false;
        }
    });

    card.addEventListener("click", (e) => {
      if(e.target.closest(".variant-seed-display") || e.target.closest("a") || e.target.closest(".variant-del-btn")) return;
      loadRefImage(url);
      fetch(url).then(r => r.blob()).then(blob => {
        const reader = new FileReader();
        reader.onload = (ev) => addToGallery(ev.target.result);
        reader.readAsDataURL(blob);
      });
      currentOutputMedia = { filename, subfolder, type };
      currentRefVariantIndex = Array.from(grid.children).indexOf(card);
    });

    grid.appendChild(card);
    $("variantCount").textContent = `(${variantCounter + 1})`;
}

// --- REFERENCE IMAGE ---
function loadRefImage(url){
  const img = $("refImg"), wrap = $("refWrap"), ph = $("refPlaceholder"), dz = $("refDropzone"), info = $("refInfo");
  const newImg = document.createElement("img");
  newImg.id = "refImg";
  newImg.style.cssText = "display:block;max-width:100%;max-height:100%;width:auto;height:auto;user-select:none;-webkit-user-drag:none;pointer-events:none;transform-origin:center center;";
  img.parentNode.replaceChild(newImg, img);
  refZoom.resetZoom();
  newImg.src = url;
  newImg.style.display = "block";
  wrap.style.display = "block";
  ph.style.display = "none";
  dz.style.display = "flex";
  dz.style.padding = "4px 8px";
  dz.style.minHeight = "auto";
  dz.querySelector(".ph").textContent = "arrastra otra imagen para reemplazar";
  newImg.onload = () => {
    const w = newImg.naturalWidth, h = newImg.naturalHeight;
    if(w && h){
      function gcd(a,b){ return b ? gcd(b, a % b) : a; }
      const d = gcd(w, h) || 1;
      info.textContent = `${w}×${h} · ${w/d}:${h/d}`;
      const ar = w / h;
      const mp = (w * h) / 1_000_000;
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
      $("aspectRatio").value = best;
      const mpSlider = $("mpSlider");
      mpSlider.value = Math.min(Math.max(mp, parseFloat(mpSlider.min)), parseFloat(mpSlider.max));
      mpSlider.value = Math.round(parseFloat(mpSlider.value) * 10) / 10;
      $("mpVal").textContent = parseFloat(mpSlider.value).toFixed(2);
    }
  };
  extractWorkflowFromImage(url);
}

// --- EXTRACCIÓN DE WORKFLOW DESDE METADATOS PNG / SWARMUI ---
function extractWorkflowFromImage(url){
  fetch(url).then(r => r.arrayBuffer()).then(buf => {
    const bytes = new Uint8Array(buf);
    if(bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return;
    let pos = 8;
    let workflowRaw = null;
    let swarmRaw = null;
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
        }
        if(keyword === "sui_image_params" || keyword === "parameters"){
          swarmRaw = new TextDecoder("utf-8").decode(bytes.slice(nullPos + 1, dataStart + len));
        }
        if(workflowRaw && swarmRaw) break;
      }
      if(type === "IEND") break;
      pos = pos + 12 + len;
    }
    if(swarmRaw){
      let swarm;
      try { swarm = JSON.parse(swarmRaw); } catch(e){ console.warn("No se pudo parsear metadatos SwarmUI:", e.message); }
      if(swarm){
        applySwarmParams(swarm);
        return;
      }
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

function applySwarmParams(swarm){
  const p = swarm.sui_image_params || swarm;
  const applied = [];
  const missing = [];

  if(p.prompt){
    $("prompt").value = p.prompt;
    applied.push("prompt");
  } else { missing.push("prompt"); }

  if(p.seed != null && p.seed >= 0){
    $("samplerSeed").value = p.seed;
    $("segSamplerFixed").classList.add("on");
    $("segSamplerRandom").classList.remove("on");
    $("samplerSeed").disabled = false;
    applied.push("semilla");
  } else { missing.push("semilla"); }

  if(p.width != null && p.height != null){
    const w = +p.width, h = +p.height;
    const mpSlider = $("mpSlider");
    const mp = Math.min(Math.max((w*h)/1_000_000, parseFloat(mpSlider.min)), parseFloat(mpSlider.max));
    mpSlider.value = Math.round(mp * 10) / 10;
    $("mpVal").textContent = parseFloat(mpSlider.value).toFixed(2);
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
    $("aspectRatio").value = best;
    applied.push("resolución");
  } else { missing.push("resolución"); }

  if(p.model){
    const sel = $("modelSelect");
    let found = false;
    for(const opt of sel.options){
      if(opt.value === p.model || p.model.endsWith("/"+opt.value) || opt.value === p.model.replace("flux2/","")){
        opt.selected = true; found = true; break;
      }
    }
    if(found) applied.push("modelo"); else missing.push("modelo");
  } else { missing.push("modelo"); }

  if(Array.isArray(p.loras) && p.loras.length){
    const weights = Array.isArray(p.loraweights) ? p.loraweights : [];
    for(let i = 0; i < 3; i++){
      if(i < p.loras.length){
        const ln = p.loras[i];
        const lw = parseFloat(weights[i] != null ? weights[i] : 1);
        loras[i].lora = ln.replace(/^K2\//, "").replace(/^.*\//, "");
        loras[i].on = true;
        loras[i].strength = isNaN(lw) ? 1 : lw;
      } else {
        loras[i].on = false;
      }
    }
    renderLoras();
    saveLoraState();
    applied.push("LoRAs");
  } else { missing.push("LoRAs"); }

  const appliedMsg = applied.length ? "✅ Usados: " + applied.join(", ") : "";
  const missingMsg = missing.length ? "⚠️ Sin coincidencia: " + missing.join(", ") : "";
  if(appliedMsg) log(appliedMsg, "l-ok");
  if(missingMsg) log(missingMsg, "l-warn");
  if(applied.length) log("📋 Parámetros SwarmUI restaurados desde metadatos.", "l-ok");
  else log("ℹ️ No se encontraron parámetros SwarmUI aplicables.", "l-warn");
}

function applyWorkflow(workflow){
  const N = CONFIG.N;
  const g = workflow;

  if(g[N.PROMPT]) $("prompt").value = g[N.PROMPT].inputs.string || "";

  if(g[N.UNET]){
    const name = g[N.UNET].inputs.unet_name || "";
    const sel = $("modelSelect");
    for(const opt of sel.options){
      if(opt.value === name || name.endsWith("/"+opt.value) || opt.value === name.replace("flux2/","")){
        opt.selected = true; break;
      }
    }
  }

  if(g[N.RES_SELECTOR]){
    const ar = g[N.RES_SELECTOR].inputs.aspect_ratio;
    if(ar) $("aspectRatio").value = ar;
    const mp = g[N.RES_SELECTOR].inputs.megapixels;
    if(mp != null){
      $("mpSlider").value = Math.min(Math.max(mp, 0.1), 4.0);
      $("mpVal").textContent = parseFloat($("mpSlider").value).toFixed(2);
    }
  }

  if(g[N.PROJECTOR]){
    if(g[N.PROJECTOR].inputs.preset) $("projectorPreset").value = g[N.PROJECTOR].inputs.preset;
    if(g[N.PROJECTOR].inputs.strength != null){
      $("projectorStrength").value = g[N.PROJECTOR].inputs.strength;
      $("projectorStrengthVal").textContent = parseFloat(g[N.PROJECTOR].inputs.strength).toFixed(2);
    }
  }

  if(g[N.ENHANCER]){
    const enabled = g[N.ENHANCER].inputs.enabled;
    const sw = $("enhancerEnabled");
    sw.classList.toggle("on", !!enabled);
    $("enhancerEnabledLabel").textContent = enabled ? "activado" : "desactivado";
    $("enhancerEnabledLabel").style.color = enabled ? "var(--accent)" : "var(--muted-2)";
    if(g[N.ENHANCER].inputs.strength != null){
      $("enhancerStrength").value = g[N.ENHANCER].inputs.strength;
      $("enhancerStrengthVal").textContent = parseFloat(g[N.ENHANCER].inputs.strength).toFixed(2);
    }
    if(g[N.ENHANCER].inputs.text_scale != null){
      $("enhancerTextScale").value = g[N.ENHANCER].inputs.text_scale;
      $("enhancerTextScaleVal").textContent = parseFloat(g[N.ENHANCER].inputs.text_scale).toFixed(2);
    }
    if(g[N.ENHANCER].inputs.strength != null && g[N.ENHANCER].inputs.text_scale != null){
      const linked = parseFloat(g[N.ENHANCER].inputs.strength) === parseFloat(g[N.ENHANCER].inputs.text_scale);
      $("enhancerLinkTextScale").checked = linked;
      $("textScaleRow").style.display = linked ? "none" : "";
    }
  }

  if(g[N.SEED_VARIANCE]){
    if(g[N.SEED_VARIANCE].inputs.variance_preset) $("variancePreset").value = g[N.SEED_VARIANCE].inputs.variance_preset;
    if(g[N.SEED_VARIANCE].inputs.protect_mode) $("protectMode").value = g[N.SEED_VARIANCE].inputs.protect_mode;
    const seed = g[N.SEED_VARIANCE].inputs.seed;
    if(seed != null && seed >= 0){
      $("varianceSeed").value = seed;
      $("segVarianceFixed").classList.add("on");
      $("segVarianceRandom").classList.remove("on");
      $("varianceSeed").disabled = false;
    }
  }

  for(let i = 0; i < 3; i++){
    const nodeId = [N.LORA1, N.LORA2, N.LORA3][i];
    const node = g[nodeId];
    if(!node) continue;
    const loraName = node.inputs.lora_name || "";
    const strength = node.inputs.strength_model;
    if(loraName && loraName !== "None"){
      loras[i].lora = loraName.replace("K2/", "");
      loras[i].on = (strength != null && strength > 0);
      loras[i].strength = (strength != null) ? strength : 0;
    }
  }
  renderLoras();
  saveLoraState();

  if(g[N.SAMPLER]){
    if(g[N.SAMPLER].inputs.eta != null){
      $("etaSlider").value = g[N.SAMPLER].inputs.eta;
      $("etaVal").textContent = parseFloat(g[N.SAMPLER].inputs.eta).toFixed(2);
    }
    if(g[N.SAMPLER].inputs.steps != null) $("steps").value = g[N.SAMPLER].inputs.steps;
    const seed = g[N.SAMPLER].inputs.seed;
    if(seed != null && seed >= 0){
      $("samplerSeed").value = seed;
      $("segSamplerFixed").classList.add("on");
      $("segSamplerRandom").classList.remove("on");
      $("samplerSeed").disabled = false;
    }
  }

  log("📋 Parámetros restaurados desde metadatos de la imagen.", "l-ok");
}

// --- INDEXEDDB GALLERY ---
const GALLERY_DB_NAME = 'krea2_gallery_db';
const GALLERY_STORE = 'images';

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

function aspectRatioStr(w, h){
  function gcd(a, b){ return b ? gcd(b, a % b) : a; }
  const d = gcd(w, h) || 1;
  return `${w / d}:${h / d}`;
}

async function getImageHash(base64Str) {
    try {
        if(!crypto?.subtle?.digest) throw new Error("crypto.subtle no disponible (HTTP)");
        const msgBuffer = new TextEncoder().encode(base64Str.substring(0, 500) + base64Str.length);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    } catch(e) {
        return "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
}

function resizeImageForStorage(base64Str, maxWidth = 260) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve({
                dataUrl: canvas.toDataURL('image/jpeg', 0.78),
                width: img.width,
                height: img.height
            });
        };
        img.src = base64Str;
    });
}

async function addToGallery(base64Data) {
    try {
        const { dataUrl: thumb, width, height } = await resizeImageForStorage(base64Data, 260);
        const hash = await getImageHash(thumb);
        await dbPutImage({ hash, thumb, full: base64Data, width, height, ts: Date.now() });
        await renderGallery();
    } catch (err) {
        console.warn("No se pudo guardar en galería:", err);
        log("⚠️ No se pudo guardar la imagen en el historial: " + err.message, "l-err");
    }
}

async function renderGallery(){
  const grid = $("galleryGrid");
  let history = [];
  try { history = await dbGetAllImages(); }
  catch(e) { console.warn("No se pudo leer el historial de imágenes:", e); }

  history.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  grid.innerHTML = "";

  if(history.length === 0){
    grid.innerHTML = `<div class="hint" style="grid-column:1/-1;">sin imágenes guardadas</div>`;
    return;
  }

  history.forEach((item) => {
    const div = document.createElement("div");
    div.className = "gallery-item";

    const hasRes = !!(item.width && item.height);
    const infoHtml = hasRes
      ? `<div class="info-tag">${item.width}×${item.height} · ${aspectRatioStr(item.width, item.height)}</div>`
      : "";
    const lqBadge = item.legacy
      ? `<div class="lq-badge" title="Guardada antes de la actualización: solo hay disponible en baja resolución">LQ</div>`
      : "";

    div.innerHTML = `<button class="del-btn" title="Eliminar del historial">×</button>${lqBadge}<img src="${item.thumb}">${infoHtml}`;

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
    grid.appendChild(div);
  });
}

(async () => {
  await renderGallery();
})();

async function deleteFromGallery(hash){
  try { await dbDeleteImage(hash); } catch(e) { console.warn(e); }
  await renderGallery();
}

async function clearGallery(){
  if(!confirm("¿Vaciar todo el historial de imágenes? No se puede deshacer.")) return;
  try { await dbClearImages(); } catch(e) { console.warn(e); }
  await renderGallery();
  log("🗑️ Historial de imágenes vaciado.", "l-ok");
}
$("btnClearGallery").addEventListener("click", clearGallery);

$("galleryToggle").addEventListener("click", () => {
  const h = $("galleryToggle");
  const b = $("galleryBody");
  h.classList.toggle("open");
  b.classList.toggle("open");
  const arrow = h.querySelector(".arrow");
  arrow.textContent = h.classList.contains("open") ? "▼" : "▶";
});

// --- REFERENCE IMAGE DROPZONE ---
(function(){
  const dz = $("refDropzone"), input = $("refFileInput"), btn = $("btnBrowseRef"), wrap = $("refWrap");
  if(!dz) return;
  btn.addEventListener("click", (e) => { e.stopPropagation(); input.click(); });
  document.addEventListener("dragover", e => e.preventDefault());
  document.addEventListener("drop", e => e.preventDefault());
  function onDragEnter(e){ e.preventDefault(); dz.classList.add("drag"); }
  function onDragOver(e){ e.preventDefault(); dz.classList.add("drag"); }
  function onDragLeave(){ dz.classList.remove("drag"); }
  function onDrop(e){
    e.preventDefault();
    e.stopPropagation();
    dz.classList.remove("drag");
    const files = e.dataTransfer?.files;
    if(files && files.length > 0) handleRefFile(files[0]);
  }
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
})();

function handleRefFile(f){
  const reader = new FileReader();
  reader.onload = (e) => {
    addToGallery(e.target.result);
    loadRefImage(e.target.result);
  };
  reader.readAsDataURL(f);
}

// --- RESOLUCIÓN ---
$("mpSlider").addEventListener("input",()=>{$("mpVal").textContent=parseFloat($("mpSlider").value).toFixed(2);});

// --- KREA2 ENHANCER ---
$("projectorStrength").addEventListener("input",()=>{$("projectorStrengthVal").textContent=parseFloat($("projectorStrength").value).toFixed(2);});

function syncEnhancerLink(fromSlider){
  const linked = $("enhancerLinkTextScale").checked;
  if(!linked) return;
  if(fromSlider === "strength"){
    $("enhancerTextScale").value = $("enhancerStrength").value;
    $("enhancerTextScaleVal").textContent = parseFloat($("enhancerTextScale").value).toFixed(2);
  } else {
    $("enhancerStrength").value = $("enhancerTextScale").value;
    $("enhancerStrengthVal").textContent = parseFloat($("enhancerStrength").value).toFixed(2);
  }
}
$("enhancerStrength").addEventListener("input",()=>{
  $("enhancerStrengthVal").textContent=parseFloat($("enhancerStrength").value).toFixed(2);
  syncEnhancerLink("strength");
});
$("enhancerTextScale").addEventListener("input",()=>{
  $("enhancerTextScaleVal").textContent=parseFloat($("enhancerTextScale").value).toFixed(2);
  syncEnhancerLink("textscale");
});
$("enhancerLinkTextScale").addEventListener("change",()=>{
  const linked = $("enhancerLinkTextScale").checked;
  $("textScaleRow").style.display = linked ? "none" : "";
  if(linked){
    $("enhancerTextScale").value = $("enhancerStrength").value;
    $("enhancerTextScaleVal").textContent = parseFloat($("enhancerStrength").value).toFixed(2);
  }
  try { localStorage.setItem("krea2_enhancer_link_text_scale", linked ? "1" : "0"); } catch(_){}
});
try {
  const saved = localStorage.getItem("krea2_enhancer_link_text_scale");
  if(saved === "0"){
    $("enhancerLinkTextScale").checked = false;
    $("textScaleRow").style.display = "";
  }
} catch(_){}
(function(){
  const sw=$("enhancerEnabled");
  sw.addEventListener("click",()=>{
    sw.classList.toggle("on");
    $("enhancerEnabledLabel").textContent=sw.classList.contains("on")?"activado":"desactivado";
    $("enhancerEnabledLabel").style.color=sw.classList.contains("on")?"var(--accent)":"var(--muted-2)";
  });
})();

// --- SEMILLAS ---
$("segVarianceRandom").addEventListener("click",()=>{$("segVarianceRandom").classList.add("on");$("segVarianceFixed").classList.remove("on");$("varianceSeed").disabled=true;});
$("segVarianceFixed").addEventListener("click",()=>{$("segVarianceFixed").classList.add("on");$("segVarianceRandom").classList.remove("on");$("varianceSeed").disabled=false;});
$("segSamplerRandom").addEventListener("click",()=>{$("segSamplerRandom").classList.add("on");$("segSamplerFixed").classList.remove("on");$("samplerSeed").disabled=true;});
$("segSamplerFixed").addEventListener("click",()=>{$("segSamplerFixed").classList.add("on");$("segSamplerRandom").classList.remove("on");$("samplerSeed").disabled=false;});

// --- ETA ---
$("etaSlider").addEventListener("input",()=>{$("etaVal").textContent=parseFloat($("etaSlider").value).toFixed(2);});

// --- BUILD GRAPH ---
function buildGraph(){
  const g=JSON.parse(JSON.stringify(BASE_GRAPH));
  g[N.UNET].inputs.unet_name = "flux2/" + $("modelSelect").value;
  g[N.PROMPT].inputs.string = $("prompt").value.trim();
  g[N.RES_SELECTOR].inputs.megapixels = parseFloat($("mpSlider").value);
  g[N.RES_SELECTOR].inputs.aspect_ratio = $("aspectRatio").value;
  g[N.PROJECTOR].inputs.preset = $("projectorPreset").value;
  g[N.PROJECTOR].inputs.strength = parseFloat($("projectorStrength").value);
  g[N.ENHANCER].inputs.enabled = $("enhancerEnabled").classList.contains("on");
  g[N.ENHANCER].inputs.strength = parseFloat($("enhancerStrength").value);
  g[N.ENHANCER].inputs.text_scale = parseFloat($("enhancerTextScale").value);
  g[N.SEED_VARIANCE].inputs.variance_preset = $("variancePreset").value;
  g[N.SEED_VARIANCE].inputs.protect_mode = $("protectMode").value;
  g[N.SEED_VARIANCE].inputs.seed = $("segVarianceRandom").classList.contains("on") ? -1 : parseInt($("varianceSeed").value, 10);
  g[N.LORA1].inputs.lora_name = (loras[0].on && loras[0].lora) ? "K2/"+loras[0].lora : g[N.LORA1].inputs.lora_name; g[N.LORA1].inputs.strength_model = loras[0].on ? loras[0].strength : 0;
  g[N.LORA2].inputs.lora_name = (loras[1].on && loras[1].lora) ? "K2/"+loras[1].lora : g[N.LORA2].inputs.lora_name; g[N.LORA2].inputs.strength_model = loras[1].on ? loras[1].strength : 0;
  g[N.LORA3].inputs.lora_name = (loras[2].on && loras[2].lora) ? "K2/"+loras[2].lora : g[N.LORA3].inputs.lora_name; g[N.LORA3].inputs.strength_model = loras[2].on ? loras[2].strength : 0;
  g[N.SAMPLER].inputs.eta = parseFloat($("etaSlider").value);
  g[N.SAMPLER].inputs.steps = parseInt($("steps").value, 10);
  g[N.SAMPLER].inputs.seed = $("segSamplerRandom").classList.contains("on") ? -1 : parseInt($("samplerSeed").value, 10);
  return g;
}

// --- GENERACIÓN ---
async function runSingleGeneration(index) {
    try {
        const graph = buildGraph();
        const seedUsed = (batchSeedMode === "random") ? randomSeed() : parseInt($("samplerSeed").value, 10);
        graph[N.SAMPLER].inputs.seed = seedUsed;

        log(`🚀 Procesando variante ${variantCounter + 1} (batch ${index + 1}/${totalBatchSize}) (seed ${seedUsed})...`);
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
        startTimer(data.prompt_id, 1);
        pollFallback(data.prompt_id);
    } catch(err) {
        log(`❌ No se pudo encolar la variante ${index + 1}: ${err.message}`, "l-err");
        currentBatchIndex++;
        processNextBatch();
    }
}

async function queueAndWait(){
  connectSocket();
  totalBatchSize = parseInt($("batchSize")?.value || "1", 10);
  currentBatchIndex = 0;
  batchSeedMode = "random";
  setRun("busy", `Iniciando batch de ${totalBatchSize} variantes...`);
  $("btnGenerate").disabled=true;
  enableStopButtons(true);
  runSingleGeneration(0);
}

async function runGeneration(){
  try{ await queueAndWait(); }
  catch(err){ setRun("bad","error");log("Error: "+err.message,"l-err"); $("btnGenerate").disabled=false; }
}

$("btnGenerate").addEventListener("click", runGeneration);

// --- ENHANCER HELPERS (Krea2-specific) ---
async function fetchWithRetry(url, options, attempts=3){
  let lastErr = null;
  for(let i=0; i<attempts; i++){
    try {
      const r = await fetch(url, options);
      if(r.status >= 500 || r.status === 0){
        lastErr = new Error("HTTP "+r.status);
      } else {
        return r;
      }
    } catch(e){
      lastErr = e;
    }
    if(i < attempts-1) await new Promise(r => setTimeout(r, 1000 * (i+1)));
  }
  throw lastErr || new Error("fetch failed");
}

async function imageToResizedBase64(srcUrl, maxSide){
  const resp = await fetch(srcUrl);
  const blob = await resp.blob();
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return c.toDataURL("image/jpeg", 0.85).split(",")[1];
}

async function getVisibleRegionBase64(srcUrl, wrapId, maxSide){
  const wrap = $(wrapId);
  const img = wrap ? wrap.querySelector("img") : null;
  if(!wrap || !img) return imageToResizedBase64(srcUrl, maxSide);
  const transform = getComputedStyle(img).transform;
  let scale = 1, tx = 0, ty = 0;
  if(transform && transform !== "none"){
    const m = new DOMMatrix(transform);
    scale = m.a;
    tx = m.m41;
    ty = m.m42;
  }
  const resp = await fetch(srcUrl);
  const blob = await resp.blob();
  const bitmap = await createImageBitmap(blob);
  const natW = bitmap.width;
  const natH = bitmap.height;
  const wrapRect = wrap.getBoundingClientRect();
  const imgRect = img.getBoundingClientRect();
  const renderedW = imgRect.width / scale;
  const renderedH = imgRect.height / scale;
  const baseScaleX = natW / renderedW;
  const baseScaleY = natH / renderedH;
  const viewportX = -tx;
  const viewportY = -ty;
  const sx = viewportX / scale;
  const sy = viewportY / scale;
  const sw = wrapRect.width / scale;
  const sh = wrapRect.height / scale;
  let sxNat = sx * baseScaleX;
  let syNat = sy * baseScaleY;
  let swNat = sw * baseScaleX;
  let shNat = sh * baseScaleY;
  sxNat = Math.max(0, Math.min(natW, sxNat));
  syNat = Math.max(0, Math.min(natH, syNat));
  swNat = Math.max(0, Math.min(natW - sxNat, swNat));
  shNat = Math.max(0, Math.min(natH - syNat, shNat));
  const outScale = Math.min(1, maxSide / Math.max(swNat, shNat));
  const outW = Math.max(1, Math.round(swNat * outScale));
  const outH = Math.max(1, Math.round(shNat * outScale));
  const c = document.createElement("canvas");
  c.width = outW; c.height = outH;
  c.getContext("2d").drawImage(bitmap, sxNat, syNat, swNat, shNat, 0, 0, outW, outH);
  bitmap.close();
  return c.toDataURL("image/jpeg", 0.85).split(",")[1];
}

// --- ENHANCER (Krea2 btnEnhance uses fetchWithRetry) ---
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

  $("btnEnhance").disabled = true;
  $("btnEnhance").textContent = "Mejorando...";
  $("enhancerOutput").value = "";
  try {
    const r = await fetchWithRetry("/api/generate", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });
    if(!r.ok){ const t = await r.text().catch(()=>""); throw new Error("HTTP "+r.status+" "+t.slice(0,200)); }
    const result = await r.json();
    $("enhancerOutput").value = (result.response || "").trim();
    log("✨ Prompt mejorado ("+model+", "+mode+", "+styleKey+")", "l-ok");
  } catch(e) {
    log("❌ Error al mejorar: "+e.message, "l-err");
    $("enhancerOutput").value = "Error: "+e.message;
  } finally {
    $("btnEnhance").disabled = false;
    $("btnEnhance").textContent = "Mejorar prompt";
  }
});

// --- CAPTION (Krea2-specific) ---
$("btnCaption").addEventListener("click", async () => {
  const model = $("enhancerModel").value;
  if(!model){ log("⚠️ Selecciona un modelo de Ollama", "l-err"); return; }
  const refImgEl = $("refImg");
  if(!refImgEl || !refImgEl.src || refImgEl.src === window.location.href){
    log("⚠️ Primero carga una imagen de referencia", "l-err"); return;
  }
  const mode = $("enhancerMode").value;
  const styleKey = $("enhancerStyle").value;
  const data = loadSysPrompts();
  const system = getCurrentSysPrompt(data, mode, styleKey);

  $("btnCaption").disabled = true;
  $("btnCaption").textContent = "Analizando imagen...";
  $("enhancerOutput").value = "";
  try {
    const b64 = await getVisibleRegionBase64(refImgEl.src, "refWrap", 1280);
    const r = await fetchWithRetry("/api/generate", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        model, system, prompt: "Describe this image.", images: [b64], stream: false,
        options: { num_ctx: 8192, temperature: 0.4 }
      }),
    });
    if(!r.ok){ const t = await r.text().catch(()=>""); throw new Error("HTTP "+r.status+" "+t.slice(0,300)); }
    const result = await r.json();
    let text = (result.response || "").trim();
    if(!text){
      const err = result.error || "(sin error declarado)";
      log("⚠️ Respuesta vacía. Keys: "+Object.keys(result).join(",")+" err="+err, "l-err");
      $("enhancerOutput").value = "El modelo no devolvió texto. Error: "+err+"\n\nRespuesta cruda: "+JSON.stringify(result).slice(0,500);
    } else {
      const think = text.match(/<think>([\s\S]*?)<\/think>/i);
      if(think) text = text.replace(/<think>[\s\S]*?<\/think>/i, "").trim();
      $("enhancerOutput").value = text;
      log("🖼️ Caption generado ("+model+", "+mode+"/"+styleKey+", "+text.length+" chars).", "l-ok");
    }
  } catch(e) {
    log("❌ Error en caption: "+e.message, "l-err");
    $("enhancerOutput").value = "Error: "+e.message;
  } finally {
    $("btnCaption").disabled = false;
    $("btnCaption").textContent = "Caption (imagen referencia)";
  }
});

$("btnSendRefLtxv").addEventListener("click", () => {
  const refImgEl = $("refImg");
  if(!refImgEl || !refImgEl.src || refImgEl.src === window.location.href){
    log("⚠️ Primero carga una imagen de referencia.", "l-err");
    return;
  }
  const src = refImgEl.src;
  const m = src.match(/[?&]filename=([^&]+)/);
  if(m){
    const filename = decodeURIComponent(m[1]);
    const ref = encodeURIComponent(filename);
    const here = window.location;
    const targetHost = here.hostname;
    const targetPort = "8000";
    const url = `${here.protocol}//${targetHost}:${targetPort}/LTXV_WebUI.html?ref=${ref}`;
    const win = window.open(url, "_blank");
    if(!win) log("⚠️ El navegador bloqueó la nueva pestaña. Permite popups y reintenta.", "l-err");
    else log("↗️ Abriendo LTXV con la imagen: "+filename, "l-ok");
  } else {
    log("⚠️ La imagen de referencia no está en disco (es data:URL). Guárdala primero o usa la galería de variantes.", "l-err");
  }
});

$("btnLoadMeta").addEventListener("click", async () => {
  const refImgEl = $("refImg");
  if(!refImgEl || !refImgEl.src || refImgEl.src === window.location.href){
    log("⚠️ Primero carga una imagen de referencia", "l-err"); return;
  }
  $("btnLoadMeta").disabled = true;
  $("btnLoadMeta").textContent = "Leyendo metadatos...";
  try {
    const r = await fetch(refImgEl.src);
    const buf = await r.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if(bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50){
      log("ℹ️ No es un PNG válido, no puede contener metadatos Krea2.", "l-info");
      return;
    }
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
    if(workflowRaw == null){
      log("ℹ️ Esta imagen no contiene metadatos de workflow Krea2.", "l-info");
      return;
    }
    let workflow;
    try {
      workflow = JSON.parse(workflowRaw);
    } catch(e1){
      const first = workflowRaw.indexOf("{");
      const last = workflowRaw.lastIndexOf("}");
      if(first !== -1 && last > first){
        try {
          workflow = JSON.parse(workflowRaw.slice(first, last + 1));
          log("⚠️ Metadatos tenían basura tras el JSON; se recortó.", "l-warn");
        } catch(e2){
          throw new Error("JSON inválido tras recortar: "+e2.message);
        }
      } else {
        throw e1;
      }
    }
    applyWorkflow(workflow);
    log("📋 Metadatos cargados: prompt, semilla, modelo, LoRAs y demás parámetros actualizados.", "l-ok");
  } catch(e) {
    log("❌ Error leyendo metadatos: "+e.message, "l-err");
  } finally {
    $("btnLoadMeta").disabled = false;
    $("btnLoadMeta").textContent = "Cargar metadatos";
  }
});