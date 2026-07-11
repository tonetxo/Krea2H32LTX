import json
import os

# --- CONFIGURACIÓN ---
JSON_FILE = 'Krea2_OK.json'
OUTPUT_HTML = 'Krea2_WebUI.html'
MODELS_DIR = '/home/tonetxo/SwarmUI/Models/diffusion_models/flux2'
LORAS_DIR = '/home/tonetxo/SwarmUI/Models/Lora/K2'
# ---------------------

def get_file_list(directory, ext='.safetensors', fallback=None):
    files = []
    if not os.path.exists(directory):
        return [fallback] if fallback else []
    for root, _, fnames in os.walk(directory):
        for f in fnames:
            if f.endswith(ext):
                rel = os.path.relpath(os.path.join(root, f), directory)
                files.append(rel.replace('\\', '/'))
    files.sort()
    return files if files else ([fallback] if fallback else [])

def main():
    if not os.path.exists(JSON_FILE):
        print(f"❌ Error: No se encontró '{JSON_FILE}'")
        return

    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        graph_json = f.read()

    model_files = get_file_list(MODELS_DIR, fallback="flux2/krea2_turbo_convrot_int4_fast.safetensors")
    lora_files = get_file_list(LORAS_DIR, fallback="K2/realism_engine_krea2_v2.safetensors")
    model_js_array = json.dumps(model_files)
    lora_js_array = json.dumps(lora_files)

    html_template = r'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Krea2 · Panel Pro</title>
<style>
  :root{--bg:#0a0c0e;--panel:#12161a;--panel-2:#171c21;--border:#242b31;--text:#e7ecef;--muted:#8b96a0;--muted-2:#5b6670;--accent:#57e8c9;--accent-dim:#2a4d47;--warn:#ffb454;--danger:#ff6a6a;--mono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;--sans:-apple-system,"Segoe UI",Inter,Roboto,sans-serif;}
  *{box-sizing:border-box;}body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:14px;line-height:1.45;}
  .wrap{max-width:1400px;margin:0 auto;padding:22px 18px 60px;}
  .head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:18px;flex-wrap:wrap;}
  .head h1{font-family:var(--mono);font-size:15px;letter-spacing:.12em;text-transform:uppercase;margin:0;color:var(--text);font-weight:600;}
  .head h1 span{color:var(--accent);}.head .sub{font-family:var(--mono);font-size:11px;color:var(--muted-2);letter-spacing:.04em;}
  .grid{display:grid;grid-template-columns:1fr 1.2fr;gap:20px;}@media(max-width:1000px){.grid{grid-template-columns:1fr;}}
  .panel{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:16px 16px 18px;margin-bottom:16px;}
  .panel h2{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:0 0 14px;display:flex;align-items:center;gap:8px;}
  .panel h2::before{content:"";width:5px;height:5px;background:var(--accent);border-radius:1px;display:inline-block;}
  label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px;}
  .row{margin-bottom:14px;}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  input[type=text],input[type=number],textarea,select{width:100%;background:var(--panel-2);border:1px solid var(--border);color:var(--text);border-radius:5px;padding:8px 9px;font-family:var(--sans);font-size:13px;outline:none;transition:border-color .15s;}
  select{cursor:pointer; appearance:none; background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b96a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat:no-repeat; background-position:right 8px center; background-size:14px;}
  input[type=number]{font-family:var(--mono);}input:focus,textarea:focus,select:focus{border-color:var(--accent);}
  textarea{resize:vertical;min-height:92px;line-height:1.5;}
  .seed-toggle{display:flex;gap:8px;margin-bottom:8px;}
  .seg{flex:1;text-align:center;padding:7px 0;border:1px solid var(--border);border-radius:5px;font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;color:var(--muted);background:var(--panel-2);user-select:none;}
  .seg.on{border-color:var(--accent);color:var(--accent);background:var(--accent-dim);}
  .slider-row{display:flex;align-items:center;gap:10px;}
  input[type=range]{flex:1;-webkit-appearance:none;height:3px;background:var(--border);border-radius:2px;outline:none;}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:var(--accent);cursor:pointer;border:2px solid var(--bg);box-shadow:0 0 0 1px var(--accent);}
  .slider-val{font-family:var(--mono);font-size:12px;color:var(--accent);width:52px;text-align:right;flex-shrink:0;}
  .lora{border:1px solid var(--border);border-radius:6px;padding:10px 11px;margin-bottom:8px;background:var(--panel-2);}
  .lora.off{opacity:.5;}
  .lora-top{display:flex;align-items:center;gap:9px;margin-bottom:8px;}
  .switch{width:30px;height:17px;background:var(--border);border-radius:20px;position:relative;cursor:pointer;flex-shrink:0;transition:background .15s;}
  .switch.on{background:var(--accent-dim);border:1px solid var(--accent);}
  .switch i{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--muted-2);transition:left .15s,background .15s;}
  .switch.on i{left:15px;background:var(--accent);}
  .btn-row{display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;}
  button{font-family:var(--mono);font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;border-radius:6px;border:1px solid var(--border);background:var(--panel-2);color:var(--text);padding:11px 16px;cursor:pointer;transition:all .15s;flex:1;min-width:150px;}
  button.primary{background:var(--accent);border-color:var(--accent);color:#08110f;font-weight:700;}
  button.danger{background:var(--danger);border-color:var(--danger);color:#fff;font-weight:700;}
  button:hover{filter:brightness(1.08);}button:disabled{opacity:.4;cursor:not-allowed;}
  .statusbar{display:flex;align-items:center;gap:9px;font-family:var(--mono);font-size:11.5px;color:var(--muted);margin:10px 2px 0;min-height:16px;}
  .dot{width:7px;height:7px;border-radius:50%;background:var(--muted-2);flex-shrink:0;}
  .dot.ok{background:var(--accent);box-shadow:0 0 6px var(--accent);}.dot.bad{background:var(--danger);}.dot.busy{background:var(--warn);animation:pulse 1s infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
  .server-row{display:flex;gap:8px;}.server-row input{flex:1;}
  .results-col{display:flex;flex-direction:column;gap:16px;position:sticky;top:20px;}
  .imgbox{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:14px;flex:1;display:flex;flex-direction:column;}
  .img-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
  .img-header h3{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:0;display:flex;align-items:center;gap:8px;}
  .img-header-actions{display:flex;gap:4px;}
  .img-header-actions button{font-family:var(--mono);font-size:9px;letter-spacing:.06em;text-transform:uppercase;border-radius:4px;border:1px solid var(--border);background:var(--panel-2);color:var(--muted);padding:4px 8px;cursor:pointer;min-width:auto;flex:none;transition:all .15s;}
  .img-header-actions button:hover{color:var(--text);border-color:var(--accent);}
  .img-wrap{position:relative;overflow:hidden;cursor:grab;border-radius:5px;background:#000;min-height:200px;max-height:60vh;}
  .img-wrap:active{cursor:grabbing;}
  .img-wrap img{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none;pointer-events:none;transform-origin:0 0;}
  .img-wrap:fullscreen, .img-wrap:-webkit-full-screen{width:100vw!important;height:100vh!important;max-height:none!important;background:#000;border-radius:0;display:flex;align-items:center;justify-content:center;padding:0;}
  .img-wrap:fullscreen img, .img-wrap:-webkit-full-screen img{width:auto;height:auto;max-width:100vw;max-height:100vh;object-fit:contain;}
  .img-footer{margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:11px;min-height:24px;}
  .time-tag{font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.04em;}
  .time-tag.live{color:var(--warn);}
  .variant-time{font-family:var(--mono);font-size:10px;color:var(--muted);margin-right:6px;letter-spacing:.04em;}
  img.output{width:100%;border-radius:5px;background:#000;display:block;flex-grow:1;max-height:60vh;object-fit:contain;}
  .empty{height:200px;display:flex;align-items:center;justify-content:center;color:var(--muted-2);font-family:var(--mono);font-size:11px;border:1px dashed var(--border);border-radius:5px;}
  .log{font-family:var(--mono);font-size:11px;color:var(--muted-2);background:#050607;border:1px solid var(--border);border-radius:6px;padding:9px 11px;max-height:110px;overflow-y:auto;margin-top:12px;white-space:pre-wrap;}
  .hint{font-size:11px;color:var(--muted-2);margin-top:5px;font-family:var(--mono);}
  .gallery-grid{display:grid;grid-template-columns:repeat(auto-fill, minmax(150px, 1fr));gap:10px;}
  .gallery-item{border:1px solid var(--border);border-radius:5px;overflow:hidden;cursor:pointer;position:relative;background:var(--panel-2);}
  .gallery-item img{width:100%;height:auto;display:block;transition:transform .2s;}
  .gallery-item:hover img{transform:scale(1.04);}
  .gallery-item.selected{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-dim);}
  .gallery-item .info-tag{position:absolute;left:0;right:0;bottom:0;padding:4px 6px;background:linear-gradient(transparent, rgba(0,0,0,.88));font-family:var(--mono);font-size:10px;color:var(--text);letter-spacing:.02em;pointer-events:none;}
  .gallery-item .del-btn{position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:4px;background:rgba(0,0,0,.65);color:#fff;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;cursor:pointer;opacity:0;transition:opacity .15s, background .15s;z-index:2;}
  .gallery-item:hover .del-btn{opacity:1;}
  .gallery-item .del-btn:hover{background:var(--danger);border-color:var(--danger);}
  .panel-head-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
  .panel-head-row h2{margin:0;}
  .btn-mini{padding:5px 9px;font-size:10px;min-width:auto;flex:none;}
  .prompt-actions{display:flex;gap:8px;margin-top:8px;}
  .prompt-actions button{padding:6px 10px;font-size:10px;min-width:auto;}
  .variant-gallery{margin-top:20px;}
  .variant-grid{display:grid;grid-template-columns:repeat(auto-fill, minmax(200px,1fr));gap:12px;}
  .variant-card{background:var(--panel-2);border:1px solid var(--border);border-radius:6px;overflow:hidden;}
  .variant-card img{width:100%;height:auto;max-height:240px;object-fit:contain;background:#000;display:block;}
  .variant-info{padding:8px;font-size:11px;color:var(--muted);font-family:var(--mono);display:flex;justify-content:space-between;align-items:center;}
  .variant-seed-display{color:var(--accent);cursor:pointer;user-select:text;display:flex;align-items:center;gap:6px;}
  .variant-seed-display:hover{color:#fff;}
  .copy-icon{font-size:12px;opacity:.7;transition:opacity .2s;}
  .variant-seed-display:hover .copy-icon{opacity:1;}
  .collapsible-header{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;padding:4px 0;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);}
  .collapsible-header:hover{color:var(--text);}
  .collapsible-header .arrow{font-size:9px;transition:transform .2s;}
  .collapsible-header.open .arrow{transform:rotate(90deg);}
  .collapsible-body{overflow:hidden;max-height:0;transition:max-height .3s ease;}
  .collapsible-body.open{max-height:800px;}
  .enhancer-row{margin-bottom:10px;}
  .enhancer-row label{font-size:11px;color:var(--muted-2);margin-bottom:3px;}
  .enhancer-row select{width:100%;}
  .enhancer-output{width:100%;background:var(--panel-2);border:1px solid var(--border);color:var(--text);border-radius:5px;padding:8px 9px;font-family:var(--sans);font-size:13px;outline:none;resize:vertical;min-height:60px;line-height:1.5;}
  .enhancer-output:focus{border-color:var(--accent);}
  .enhancer-actions{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;}
  .enhancer-actions button{flex:1;min-width:120px;}
  .modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:100;display:none;align-items:center;justify-content:center;}
  .modal-overlay.open{display:flex;}
  .modal-content{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:20px;max-width:700px;width:90%;max-height:80vh;overflow-y:auto;}
  .modal-content h2{font-family:var(--mono);font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:0 0 14px;}
  .modal-tabs{display:flex;gap:4px;margin-bottom:14px;}
  .modal-tab{padding:6px 14px;border:1px solid var(--border);border-radius:4px;cursor:pointer;font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);background:var(--panel-2);}
  .modal-tab.active{border-color:var(--accent);color:var(--accent);background:var(--accent-dim);}
  .sysprompt-row{border:1px solid var(--border);border-radius:5px;padding:10px;margin-bottom:8px;background:var(--panel-2);}
  .sysprompt-row .spr-top{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
  .sysprompt-row .spr-name{flex:1;font-family:var(--mono);font-size:11px;color:var(--muted);}
  .sysprompt-row .spr-del{background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;padding:2px 6px;border-radius:3px;min-width:auto;flex:0;}
  .sysprompt-row .spr-del:hover{background:var(--danger);color:#fff;}
  .sysprompt-row textarea{width:100%;background:var(--panel);border:1px solid var(--border);color:var(--text);border-radius:4px;padding:6px 8px;font-family:var(--sans);font-size:12px;outline:none;resize:vertical;min-height:50px;line-height:1.4;}
  .sysprompt-row textarea:focus{border-color:var(--accent);}
  .modal-actions{display:flex;gap:10px;margin-top:14px;justify-content:flex-end;}
  .modal-actions button{min-width:100px;flex:0;}
  @keyframes seedFlash{0%{background-color:var(--panel-2);border-color:var(--border);}50%{background-color:var(--accent-dim);border-color:var(--accent);box-shadow:0 0 10px var(--accent);}100%{background-color:var(--panel-2);border-color:var(--border);}}
  .seed-updated{animation:seedFlash 1.5s ease-out;}
  .dropzone{border:1.5px dashed var(--border);border-radius:7px;padding:10px;background:var(--panel-2);transition:border-color .15s,background .15s;}
  .dropzone.drag{border-color:var(--accent);background:var(--accent-dim);}
  .dropzone img{max-width:100%;max-height:360px;border-radius:5px;display:block;margin:0 auto;}
  .dropzone input{display:none;}
  .ref-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
  .enhancer-caption-row{margin-top:8px;}
  .enhancer-caption-row button{flex:1;min-width:120px;}
</style>
</head>
<body>
<div class="wrap">
  <div class="head"><h1>Krea2 <span>//</span> panel pro</h1><div class="sub">grafo: Krea2_OK</div></div>
  <div class="grid">
    <div class="controls-col">
      <div class="panel"><h2>Servidor</h2><div class="server-row"><input type="text" id="serverUrl" value="" placeholder="http://127.0.0.1:7821" spellcheck="false"><button id="btnTest" class="ghost">Probar</button></div><div class="statusbar"><span class="dot" id="connDot"></span><span id="connText">sin comprobar</span></div><div class="hint" id="serverHint" style="font-size:10.5px;margin-top:4px;"></div></div>

      <div class="panel">
        <h2>Biblioteca de Prompts</h2>
        <div class="row"><select id="promptLibSelect"><option value="">-- Seleccionar Prompt Guardado --</option></select></div>
        <div class="prompt-actions"><button id="btnSavePrompt">Guardar Actual</button><button id="btnDeletePrompt" class="ghost">Eliminar</button></div>
      </div>

      <div class="panel"><h2>Prompt</h2><div class="row"><textarea id="prompt" placeholder="Describe la escena..."></textarea></div></div>

      <!-- ENHANCER PANEL -->
      <div class="panel">
        <div class="collapsible-header" id="enhancerToggle">
          <span class="arrow">▶</span> Mejorar prompt con IA / Caption
        </div>
        <div class="collapsible-body" id="enhancerBody">
          <div class="enhancer-row">
            <label>Modelo</label>
            <select id="enhancerModel"><option value="">Cargando modelos...</option></select>
          </div>
          <div class="enhancer-row">
            <label>Modo</label>
            <select id="enhancerMode"><option value="text">Texto</option><option value="vision">Visión</option></select>
          </div>
          <div class="enhancer-row">
            <label>Estilo</label>
            <select id="enhancerStyle"></select>
          </div>
          <div class="enhancer-row">
            <button id="btnEnhance" class="primary" style="width:100%">Mejorar prompt</button>
          </div>
          <div class="enhancer-row">
            <textarea class="enhancer-output" id="enhancerOutput" readonly placeholder="El resultado aparecerá aquí..."></textarea>
          </div>
          <div class="enhancer-actions">
            <button id="btnSaveEnhanced">Guardar en biblioteca</button>
            <button id="btnEditSysPrompts" class="ghost">Editar system prompts...</button>
          </div>
        </div>
      </div>

      <div class="panel"><h2>Modelo</h2><div class="row"><select id="modelSelect"></select></div></div>

      <div class="panel"><h2>Resolución</h2><div class="row slider-row"><label>Megapíxeles</label><input type="range" id="mpSlider" min="0.1" max="4.0" step="0.1" value="1.0"><div class="slider-val" id="mpVal">1.00</div></div><div class="row"><label>Aspect Ratio</label><select id="aspectRatio"><option value="1:1 (Square)">1:1 (Square)</option><option value="2:3 (Portrait Photo)">2:3 (Portrait Photo)</option><option value="3:2 (Photo)">3:2 (Photo)</option><option value="3:4 (Portrait Standard)">3:4 (Portrait Standard)</option><option value="4:3 (Standard)">4:3 (Standard)</option><option value="9:16 (Portrait Widescreen)">9:16 (Portrait Widescreen)</option><option value="16:9 (Widescreen)" selected>16:9 (Widescreen)</option><option value="21:9 (Ultrawide)">21:9 (Ultrawide)</option></select></div></div>

      <div class="panel"><h2>Krea2 Enhancer</h2>
        <div class="row"><label>Projector Delta — Preset</label><select id="projectorPreset"><option value="none" selected>none</option><option value="FB2">FB2</option><option value="FB3">FB3</option><option value="FEDOR">FEDOR</option><option value="SKC3VO">SKC3VO</option></select></div>
        <div class="row slider-row"><label>Projector Delta — Strength</label><input type="range" id="projectorStrength" min="0" max="2" step="0.05" value="1"><div class="slider-val" id="projectorStrengthVal">1.00</div></div>
        <div class="row" style="display:flex;align-items:center;gap:16px;flex-wrap:nowrap;"><label style="margin:0;flex-shrink:0;font-size:11px;">T-Enhancer</label><div class="switch" id="enhancerEnabled"><i></i></div><span id="enhancerEnabledLabel" style="font-family:var(--mono);font-size:11px;color:var(--muted-2);flex-shrink:0;">desactivado</span></div>
        <div class="row slider-row"><label>T-Enhancer — Strength</label><input type="range" id="enhancerStrength" min="0" max="2" step="0.05" value="0.5"><div class="slider-val" id="enhancerStrengthVal">0.50</div></div>
      </div>

      <div class="panel"><h2>RBG Smart Seed Variance</h2>
        <div class="row"><label>Variance Preset</label><select id="variancePreset"><option value="❌ Disabled" selected>❌ Disabled</option><option value="🌱 Subtle">🌱 Subtle</option><option value="🌿 Balanced">🌿 Balanced</option><option value="🪴 Creative">🪴 Creative</option><option value="🌳 Bold">🌳 Bold</option><option value="🌴 Wild">🌴 Wild</option><option value="⚙️ Custom">⚙️ Custom</option></select></div>
        <div class="row"><label>Protect Mode</label><select id="protectMode"><option value="🚫 None">🚫 None</option><option value="First Quarter">First Quarter</option><option value="First Half">First Half</option><option value="Last Quarter">Last Quarter</option><option value="Last Half" selected>Last Half</option><option value="⚙️ Custom Regions">⚙️ Custom Regions</option><option value="🎲 Random Regions">🎲 Random Regions</option></select></div>
        <div class="row"><label>Semilla</label><div class="seed-toggle"><div class="seg on" id="segVarianceRandom">Aleatoria</div><div class="seg" id="segVarianceFixed">Fija</div></div><input type="number" id="varianceSeed" value="315489554057974" step="1" disabled></div>
      </div>

      <div class="panel"><h2>LoRAs</h2><div id="loraList"></div></div>

      <div class="panel"><h2>Sampler</h2>
        <div class="row slider-row"><label>Eta</label><input type="range" id="etaSlider" min="0" max="2" step="0.01" value="0.5"><div class="slider-val" id="etaVal">0.50</div></div>
        <div class="row"><label>Steps</label><input type="number" id="steps" value="8" step="1" min="1" max="10000"></div>
        <div class="row"><label>Semilla</label><div class="seed-toggle"><div class="seg on" id="segSamplerRandom">Aleatoria</div><div class="seg" id="segSamplerFixed">Fija</div></div><input type="number" id="samplerSeed" value="1062442950133633" step="1" disabled></div>
        <div class="row"><label>Batch Size (Variantes) <span class="hint">(Genera N semillas distintas)</span></label><input type="number" id="batchSize" value="1" step="1" min="1" max="16"></div></div>

      <div class="panel"><h2>Ejecución</h2><div class="btn-row"><button id="btnGenerate" class="primary">Generar</button></div><div class="btn-row" style="margin-top:6px"><button id="btnStopVideo" disabled>Parar imagen</button><button id="btnStopAll" class="danger" disabled>Parar todo</button></div><div class="statusbar"><span class="dot" id="runDot"></span><span id="runText">en reposo</span></div><div class="log" id="log">listo.</div></div>
    </div>
    <div class="results-col">
      <!-- REPRODUCTOR IMAGEN FINAL -->
      <div class="imgbox">
        <div class="img-header">
          <h3>Imagen <em style="color:var(--accent)">final</em></h3>
          <div class="img-header-actions">
            <button id="btnResetZoom" title="Tamaño original">⊡</button>
            <button id="btnFullscreenImg" title="Pantalla completa">⛶</button>
          </div>
        </div>
        <div class="empty" id="empty1">sin generar</div>
        <div class="img-wrap" id="imgWrap">
          <img class="output" id="outputImg" style="display:none">
        </div>
        <div class="img-footer">
          <span class="time-tag" id="time1"></span>
          <span class="hint" id="imgInfo" style="font-size:10.5px;font-family:var(--mono);color:var(--muted-2);"></span>
          <a class="dl" id="dl1" style="display:none" download onclick="event.stopPropagation();">⬇ Descargar</a>
        </div>
      </div>

      <!-- IMAGEN DE REFERENCIA (dropzone) -->
      <div class="imgbox">
        <div class="img-header">
          <h3>Imagen <em style="color:var(--accent)">de referencia</em></h3>
        </div>
        <div class="dropzone" id="refDropzone" style="padding:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <input type="file" id="refFileInput" accept="image/*">
          <div class="seg" id="btnBrowseRef" style="flex:0;padding:5px 12px;font-size:10px;cursor:pointer;user-select:none;">Navegar...</div>
          <div class="ph" id="refPlaceholder" style="flex:1;min-width:120px;font-size:10.5px;color:var(--muted-2);padding:0;text-align:left;">arrastra imagen o clic en Navegar</div>
          <img id="refImg" style="display:none;max-width:100%;max-height:300px;border-radius:5px;margin:0 auto;">
        </div>
        <div class="dz-info" id="refInfo" style="font-family:var(--mono);font-size:10.5px;color:var(--muted);text-align:center;margin-top:6px;"></div>
        <div class="ref-actions" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <button id="btnCaption" class="ghost" style="flex:1;min-width:140px;">Caption (imagen referencia)</button>
        </div>
      </div>

      <!-- GALERÍA DE VARIANTES -->
      <div class="imgbox variant-gallery" id="variantGalleryBox" style="display:none;">
        <h3>Galería de Variantes <span id="variantCount" style="color:var(--accent)"></span></h3>
        <div class="variant-grid" id="variantGrid"></div>
      </div>
    </div>
  </div>
</div>

<script>
const BASE_GRAPH = __GRAPH_JSON__;
const AVAILABLE_MODELS = __MODEL_LIST__;
const AVAILABLE_LORAS = __LORA_LIST__;

const N = {UNET:"1",CLIP:"13",PROMPT:"57",CLIP_ENCODE:"6",NEG:"8",EMPTY_LATENT:"10",PROJECTOR:"35",ENHANCER:"39",LORA1:"40",LORA2:"60",LORA3:"68",VAE:"42",VAE_DECODE:"43",SAMPLER:"45",PURGE:"55",RES_SELECTOR:"69",SEED_VARIANCE:"70",PREVIEW:"5"};
const CLIENT_ID = crypto.randomUUID ? crypto.randomUUID() : "wc-" + Math.random().toString(36).slice(2);
let socket = null;
let currentBatchIndex = 0;
let totalBatchSize = 0;
let pendingSeeds = {};
let handledPrompts = new Set();
let processingPrompts = new Set();
let batchSeedMode = "random";
let currentPromptId = null;
let timers = {};
let loras = [{on:true, lora:"", strength:0.4},{on:false, lora:"", strength:0.5},{on:false, lora:"", strength:0.4}];

function fmtMs(ms){
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function startTimer(promptId, slot){
  if(timers[promptId]) return;
  const t = { start: Date.now(), iv: null };
  const el = $("time"+slot);
  t.iv = setInterval(() => {
    if(!timers[promptId]) return;
    const live = `⏱ ${fmtMs(Date.now() - t.start)}`;
    el.textContent = live;
    el.classList.add("live");
  }, 500);
  timers[promptId] = t;
}

function stopTimer(promptId){
  const t = timers[promptId];
  if(!t) return null;
  const total = Date.now() - t.start;
  if(t.iv){ clearInterval(t.iv); t.iv = null; }
  delete timers[promptId];
  return { total, text: `⏱ ${fmtMs(total)}` };
}

function discardTimer(promptId){
  const t = timers[promptId];
  if(!t) return;
  if(t.iv) clearInterval(t.iv);
  delete timers[promptId];
}

function extractTimings(entry, N){
  if(!entry || !entry.status) return null;
  const msgs = entry.status.messages || [];
  if(!Array.isArray(msgs) || msgs.length === 0) return null;
  let tStart = null, tSuccess = null;
  const nodeTimes = {};
  for(const m of msgs){
    if(!Array.isArray(m) || m.length < 2) continue;
    const type = m[0];
    const data = m[1] || {};
    if(type === "execution_start" && data.timestamp != null) tStart = data.timestamp;
    else if(type === "execution_success" && data.timestamp != null) tSuccess = data.timestamp;
    else if(type === "executing" && data.node != null && data.timestamp != null){
      if(!nodeTimes[data.node]) nodeTimes[data.node] = { start: null, end: null };
      if(nodeTimes[data.node].start == null) nodeTimes[data.node].start = data.timestamp;
    } else if(type === "executed" && data.node != null && data.timestamp != null){
      if(!nodeTimes[data.node]) nodeTimes[data.node] = { start: null, end: null };
      nodeTimes[data.node].end = data.timestamp;
    }
  }
  const total = (tStart != null && tSuccess != null) ? (tSuccess - tStart) : null;
  const t1 = nodeTimes[N.PREVIEW] && nodeTimes[N.PREVIEW].start != null && nodeTimes[N.PREVIEW].end != null
             ? (nodeTimes[N.PREVIEW].end - nodeTimes[N.PREVIEW].start) : null;
  const t2 = nodeTimes[N.VAE_DECODE] && nodeTimes[N.VAE_DECODE].start != null && nodeTimes[N.VAE_DECODE].end != null
             ? (nodeTimes[N.VAE_DECODE].end - nodeTimes[N.VAE_DECODE].start) : null;
  if(total == null && t1 == null && t2 == null) return null;
  return { t1, t2, total };
}

function randomSeed(){
  return Math.floor(Math.random() * 0xFFFFFFFF);
}

// --- AUTO-DETECCIÓN DEL BACKEND EN LAN ---
const DEFAULT_BACKEND_PORT = "7821";
const LEGACY_PORTS = ["7822"];
const $ = (id) => document.getElementById(id);
function updateServerHint(){
  const hint = $("serverHint");
  if(!hint) return;
  const v = ($("serverUrl")?.value || "").trim();
  if(v){
    hint.textContent = `URL efectiva: ${v}`;
  } else {
    const host = (window.location.hostname || "").trim();
    if(host && !/^(127\.|localhost$|::1$)/i.test(host)){
      hint.textContent = "proxy activo (same-origin)";
    } else {
      hint.textContent = "";
    }
  }
}
(function autoPickServerUrl(){
  try {
    const input = $("serverUrl");
    if(!input) return;
    const stored = localStorage.getItem("krea2_serverUrl");
    if(stored){
      const storedPort = (stored.match(/:(\d+)\b/) || [])[1];
      if(storedPort && LEGACY_PORTS.includes(storedPort)){
        localStorage.removeItem("krea2_serverUrl");
      } else {
        input.value = stored;
        updateServerHint();
        return;
      }
    }
    updateServerHint();
  } catch(e) {}
})();
$("serverUrl").addEventListener("change", (e) => {
  try { localStorage.setItem("krea2_serverUrl", e.target.value.trim()); } catch(_){}
  updateServerHint();
});
$("serverUrl").addEventListener("input", updateServerHint);

function server(){ return $("serverUrl").value.replace(/\/+$/,""); }
function log(msg, cls){const el=$("log"),line=document.createElement("div");if(cls)line.className=cls;line.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`;el.appendChild(line);el.scrollTop=el.scrollHeight;}
function setConn(s,t){$("connDot").className="dot"+(s?" "+s:"");$("connText").textContent=t;}
function setRun(s,t){$("runDot").className="dot"+(s?" "+s:"");$("runText").textContent=t;}

// --- WEBSOCKET SETUP ---
function connectSocket() {
    if(socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
    const url = server().replace('http', 'ws') + '/ws?clientId=' + CLIENT_ID;
    socket = new WebSocket(url);
    socket.onopen = () => { console.log("WebSocket conectado"); setConn("ok", "Conectado (WS)"); };
    socket.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch(e) {
            console.warn("WS mensaje no-JSON, cerrando:", event.data.slice(0,80));
            socket.close();
            return;
        }
        if(msg.type === 'execution_success') handlePromptDone(msg.data.prompt_id);
        if(msg.type === 'execution_error') {
            const pid = msg.data && msg.data.prompt_id;
            log(`❌ Error en prompt ${pid || ''}: ${JSON.stringify(msg.data && msg.data.exception_message || msg.data)}`, "l-err");
            if(pid){ handledPrompts.add(pid); delete pendingSeeds[pid]; discardTimer(pid); }
            currentBatchIndex++;
            processNextBatch();
        }
    };
    socket.onerror = (err) => console.error("WS Error", err);
}

// --- HANDLE PROMPT DONE ---
async function handlePromptDone(promptId) {
    if(handledPrompts.has(promptId)) return;
    if(processingPrompts.has(promptId)) return;
    processingPrompts.add(promptId);
    let entry;
    try {
        const hr = await fetch(server()+"/history/"+promptId);
        if(!hr.ok) { processingPrompts.delete(promptId); return; }
        const hist = await hr.json();
        entry = hist[promptId];
    } catch(e) { processingPrompts.delete(promptId); return; }
    if(!entry || !entry.outputs) { processingPrompts.delete(promptId); return; }

    handledPrompts.add(promptId);
    processingPrompts.delete(promptId);

    const realSeed = (promptId in pendingSeeds) ? pendingSeeds[promptId] : null;
    if(realSeed !== null) {
        log(`🎲 Semilla usada: ${realSeed}`, "l-ok");
    }

    const timings = extractTimings(entry, N);
    let clientResult = stopTimer(promptId);
    const tTotal = (timings && timings.total != null) ? fmtMs(timings.total) :
                   (clientResult ? fmtMs(clientResult.total) : null);
    const timeText = tTotal || "";

    // Mostrar imagen final (nodo 5 = PreviewImage, o 43 = VAE_DECODE)
    const outNode = entry.outputs[N.PREVIEW] || entry.outputs[N.VAE_DECODE];
    if(outNode) {
        const media = findMedia(outNode);
        showImage(media);
    }

    // Añadir a galería de variantes
    const media = outNode ? findMedia(outNode) : null;
    addToVariantGallery(media, realSeed, timeText);

    log(`✅ Variante ${currentBatchIndex + 1}/${totalBatchSize} completada.`, "l-ok");
    delete pendingSeeds[promptId];
    currentBatchIndex++;
    processNextBatch();
}

function pollFallback(promptId) {
    let tries = 0;
    const iv = setInterval(async () => {
        tries++;
        if(handledPrompts.has(promptId) || tries > 180) { clearInterval(iv); return; }
        await handlePromptDone(promptId);
        if(handledPrompts.has(promptId)) clearInterval(iv);
    }, 4000);
}

function findMedia(nodeOutput){
  for(const k of["videos","gifs","images"]) if(nodeOutput[k]?.length) return nodeOutput[k][nodeOutput[k].length-1];
  return null;
}

function showImage(media){
  if(!media) return;
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
  resetZoom();
}

// --- ZOOM / PAN / FULLSCREEN ---
let zoomLevel = 1, zoomPanX = 0, zoomPanY = 0, zoomDragging = false, zoomStartX, zoomStartY, zoomStartPanX, zoomStartPanY;

function resetZoom(){
  zoomLevel = 1; zoomPanX = 0; zoomPanY = 0;
  $("outputImg").style.transform = "";
}

function applyZoom(){
  $("outputImg").style.transform = `translate(${zoomPanX}px,${zoomPanY}px) scale(${zoomLevel})`;
}

(function(){
  const wrap = $("imgWrap");
  if(!wrap) return;
  const img = $("outputImg");

  wrap.addEventListener("wheel", (e) => {
    if(img.style.display === "none") return;
    e.preventDefault();
    const wrapRect = wrap.getBoundingClientRect();
    const mx = e.clientX - wrapRect.left;
    const my = e.clientY - wrapRect.top;
    const old = zoomLevel;
    zoomLevel *= (e.deltaY < 0) ? 1.12 : 0.88;
    zoomLevel = Math.max(1, Math.min(20, zoomLevel));
    const ratio = zoomLevel / old;
    zoomPanX = mx - (mx - zoomPanX) * ratio;
    zoomPanY = my - (my - zoomPanY) * ratio;
    applyZoom();
  });

  wrap.addEventListener("mousedown", (e) => {
    if(img.style.display === "none" || zoomLevel <= 1) return;
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
})();

$("btnResetZoom").addEventListener("click", resetZoom);
$("btnFullscreenImg").addEventListener("click", () => {
  const wrap = $("imgWrap");
  if(!document.fullscreenElement){
    if(wrap.requestFullscreen) wrap.requestFullscreen();
    else if(wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
  } else {
    if(document.exitFullscreen) document.exitFullscreen();
    else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
});
document.addEventListener("fullscreenchange", () => {
  if(!document.fullscreenElement) resetZoom();
});
document.addEventListener("webkitfullscreenchange", () => {
  if(!document.webkitFullscreenElement) resetZoom();
});

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
    const displayText = hasSeed ? String(seedValue) : `Var. #${currentBatchIndex + 1}`;
    const tooltipText = hasSeed ? "Click para copiar semilla" : "Semilla no disponible";
    const timeStr = timeText || "";

    const card = document.createElement("div");
    card.className = "variant-card";
    card.innerHTML = `
        <img src="${url}">
        <div class="variant-info">
            <span class="variant-seed-display" title="${tooltipText}">
                <span class="seed-text">${displayText}</span>
                <span class="copy-icon">📋</span>
            </span>
            <span class="variant-time" title="Tiempo de inferencia">⏱ ${timeStr}</span>
            <a href="${url}" download style="color:var(--accent)" onclick="event.stopPropagation();">⬇</a>
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

    grid.appendChild(card);
    $("variantCount").textContent = `(${currentBatchIndex + 1})`;

    // Click en la miniatura de variante -> cargar como referencia
    card.addEventListener("click", (e) => {
      if(e.target.closest(".variant-seed-display") || e.target.closest("a")) return;
      loadRefImage(url);
    });
}

function loadRefImage(url){
  const img = $("refImg"), ph = $("refPlaceholder"), info = $("refInfo");
  img.src = url;
  img.style.display = "block";
  ph.style.display = "none";
  img.onload = () => {
    const w = img.naturalWidth, h = img.naturalHeight;
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
  // Intentar extraer workflow de los metadatos de la imagen
  extractWorkflowFromImage(url);
}

// --- EXTRACCIÓN DE WORKFLOW DESDE METADATOS PNG ---
// ComfyUI guarda el workflow completo en el chunk tEXt "prompt" del PNG.
function extractWorkflowFromImage(url){
  fetch(url).then(r => r.arrayBuffer()).then(buf => {
    const bytes = new Uint8Array(buf);
    const text = new TextDecoder("latin1").decode(bytes);
    // Buscar el chunk tEXt con keyword "prompt"
    const idx = text.indexOf("prompt\0");
    if(idx === -1) return;
    const chunkStart = text.lastIndexOf("tEXt", idx);
    if(chunkStart === -1) return;
    const dataStart = chunkStart + 8;
    const dataEnd = text.indexOf("\0", dataStart);
    if(dataEnd === -1) return;
    const jsonStart = dataEnd + 1;
    const nextChunk = text.indexOf("tEXt", jsonStart);
    const iend = text.indexOf("IEND", jsonStart);
    const jsonEnd = (nextChunk !== -1 && nextChunk < iend) ? nextChunk - 4 : (iend !== -1 ? iend - 4 : text.length);
    if(jsonEnd <= jsonStart) return;
    const raw = text.slice(jsonStart, jsonEnd);
    try {
      const workflow = JSON.parse(raw);
      applyWorkflow(workflow);
    } catch(e) {
      console.warn("No se pudo parsear workflow de metadatos:", e.message);
    }
  }).catch(e => console.warn("No se pudo leer metadatos:", e.message));
}

function applyWorkflow(workflow){
  // Mapear nodos del workflow a los controles de la UI
  const N = {UNET:"1",CLIP:"13",PROMPT:"57",CLIP_ENCODE:"6",NEG:"8",EMPTY_LATENT:"10",PROJECTOR:"35",ENHANCER:"39",LORA1:"40",LORA2:"60",LORA3:"68",VAE:"42",VAE_DECODE:"43",SAMPLER:"45",PURGE:"55",RES_SELECTOR:"69",SEED_VARIANCE:"70",PREVIEW:"5"};
  const g = workflow;

  // Prompt
  if(g[N.PROMPT]) $("prompt").value = g[N.PROMPT].inputs.string || "";

  // Modelo
  if(g[N.UNET]){
    const name = g[N.UNET].inputs.unet_name || "";
    const sel = $("modelSelect");
    for(const opt of sel.options){
      if(opt.value === name || name.endsWith("/"+opt.value) || opt.value === name.replace("flux2/","")){
        opt.selected = true; break;
      }
    }
  }

  // Resolution
  if(g[N.RES_SELECTOR]){
    const ar = g[N.RES_SELECTOR].inputs.aspect_ratio;
    if(ar) $("aspectRatio").value = ar;
    const mp = g[N.RES_SELECTOR].inputs.megapixels;
    if(mp != null){
      $("mpSlider").value = Math.min(Math.max(mp, 0.1), 4.0);
      $("mpVal").textContent = parseFloat($("mpSlider").value).toFixed(2);
    }
  }

  // Projector Delta
  if(g[N.PROJECTOR]){
    if(g[N.PROJECTOR].inputs.preset) $("projectorPreset").value = g[N.PROJECTOR].inputs.preset;
    if(g[N.PROJECTOR].inputs.strength != null){
      $("projectorStrength").value = g[N.PROJECTOR].inputs.strength;
      $("projectorStrengthVal").textContent = parseFloat(g[N.PROJECTOR].inputs.strength).toFixed(2);
    }
  }

  // T-Enhancer
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
  }

  // RBG Smart Seed Variance
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

  // LoRAs
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

  // Sampler
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

// --- REFERENCE IMAGE DROPZONE ---
(function(){
  const dz = $("refDropzone"), input = $("refFileInput"), btn = $("btnBrowseRef");
  if(!dz) return;
  btn.addEventListener("click", (e) => { e.stopPropagation(); input.click(); });
  // Prevenir que el navegador abra el archivo al soltarlo fuera
  document.addEventListener("dragover", e => e.preventDefault());
  document.addEventListener("drop", e => e.preventDefault());
  // Eventos en el dropzone
  dz.addEventListener("dragenter", e => { e.preventDefault(); dz.classList.add("drag"); });
  dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("drag"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("drag"));
  dz.addEventListener("drop", e => {
    e.preventDefault();
    e.stopPropagation();
    dz.classList.remove("drag");
    const files = e.dataTransfer?.files;
    if(files && files.length > 0) handleRefFile(files[0]);
  });
  input.addEventListener("change", e => { if(e.target.files[0]) handleRefFile(e.target.files[0]); });
})();

function handleRefFile(f){
  const reader = new FileReader();
  reader.onload = (e) => {
    loadRefImage(e.target.result);
  };
  reader.readAsDataURL(f);
}

function processNextBatch() {
    if(currentBatchIndex < totalBatchSize) {
        setTimeout(() => runSingleGeneration(currentBatchIndex), 1000);
    } else {
        setRun("ok", "Batch finalizado");
        log("🏁 Todas las variantes han sido procesadas.", "l-ok");
        $("btnGenerate").disabled=false;
        enableStopButtons(false);
    }
}

// --- GESTIÓN DE PROMPTS ---
function loadPrompts(){
  const saved = JSON.parse(localStorage.getItem('krea2_prompts') || '{}');
  const select = $("promptLibSelect");
  select.innerHTML = '<option value="">-- Seleccionar Prompt Guardado --</option>';
  Object.keys(saved).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key; opt.textContent = key;
    select.appendChild(opt);
  });
}
function savePrompt(){
  const name = prompt("Nombre para este prompt:");
  if(!name) return;
  const text = $("prompt").value;
  const saved = JSON.parse(localStorage.getItem('krea2_prompts') || '{}');
  saved[name] = text;
  localStorage.setItem('krea2_prompts', JSON.stringify(saved));
  loadPrompts();
  log(`Prompt "${name}" guardado.`, "l-ok");
}
function deletePrompt(){
  const select = $("promptLibSelect");
  const name = select.value;
  if(!name) return;
  if(!confirm(`¿Eliminar "${name}"?`)) return;
  const saved = JSON.parse(localStorage.getItem('krea2_prompts') || '{}');
  delete saved[name];
  localStorage.setItem('krea2_prompts', JSON.stringify(saved));
  loadPrompts();
}
$("promptLibSelect").addEventListener("change", (e) => {
  const saved = JSON.parse(localStorage.getItem('krea2_prompts') || '{}');
  if(saved[e.target.value]) $("prompt").value = saved[e.target.value];
});
$("btnSavePrompt").addEventListener("click", savePrompt);
$("btnDeletePrompt").addEventListener("click", deletePrompt);
loadPrompts();

// --- MODELOS ---
function loadModels(){
  const sel = $("modelSelect");
  sel.innerHTML = "";
  for(const m of AVAILABLE_MODELS){
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    if(m === "krea2_turbo_convrot_int4_fast.safetensors") opt.selected = true;
    sel.appendChild(opt);
  }
}
loadModels();

// --- LORAS ---
function saveLoraState() { localStorage.setItem('krea2_loras_state', JSON.stringify(loras)); }
function loadLoraState() {
  const saved = localStorage.getItem('krea2_loras_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 3) {
        parsed.forEach((l, i) => {
          if (AVAILABLE_LORAS.includes(l.lora) || l.lora === "") loras[i] = l;
        });
      }
    } catch (e) { console.error("Error cargando estado LoRA", e); }
  }
}
function renderLoras(){
  const wrap=$("loraList"); wrap.innerHTML="";
  loras.forEach((l,i)=>{
    const box=document.createElement("div");
    box.className="lora"+(l.on?"":" off");
    let optionsHtml = '<option value="">-- Ninguno --</option>';
    AVAILABLE_LORAS.forEach(path => {
      const selected = path === l.lora ? 'selected' : '';
      const displayName = path.split('/').pop();
      optionsHtml += `<option value="${path}" ${selected} title="${path}">${displayName}</option>`;
    });
    box.innerHTML=`<div class="lora-top"><div class="switch ${l.on?'on':''}" data-i="${i}"><i></i></div><div class="lname">LoRA ${i+1}</div></div>
    <div class="row" style="margin-bottom:8px;"><select data-field="lora" data-i="${i}">${optionsHtml}</select></div>
    <div class="slider-row"><input type="range" min="0" max="2" step="0.05" value="${l.strength}" data-field="strength" data-i="${i}"><div class="slider-val" data-val="${i}">${Number(l.strength).toFixed(2)}</div></div>`;
    wrap.appendChild(box);
  });
  wrap.querySelectorAll(".switch").forEach(sw=>sw.addEventListener("click",()=>{loras[+sw.dataset.i].on=!loras[+sw.dataset.i].on;renderLoras();saveLoraState();}));
  wrap.querySelectorAll('select[data-field="lora"]').forEach(sel=>sel.addEventListener("change",()=>{loras[+sel.dataset.i].lora=sel.value;saveLoraState();}));
  wrap.querySelectorAll('input[data-field="strength"]').forEach(inp=>inp.addEventListener("input",()=>{const i=+inp.dataset.i;loras[i].strength=parseFloat(inp.value);wrap.querySelector(`[data-val="${i}"]`).textContent=loras[i].strength.toFixed(2);saveLoraState();}));
}
loadLoraState(); renderLoras();

// --- RESOLUCIÓN ---
$("mpSlider").addEventListener("input",()=>{$("mpVal").textContent=parseFloat($("mpSlider").value).toFixed(2);});

// --- KREA2 ENHANCER ---
$("projectorStrength").addEventListener("input",()=>{$("projectorStrengthVal").textContent=parseFloat($("projectorStrength").value).toFixed(2);});
$("enhancerStrength").addEventListener("input",()=>{$("enhancerStrengthVal").textContent=parseFloat($("enhancerStrength").value).toFixed(2);});
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

        log(`🚀 Procesando variante ${index + 1}/${totalBatchSize} (seed ${seedUsed})...`);
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

// --- BOTONES DE PARAR ---
function enableStopButtons(v){ $("btnStopVideo").disabled = !v; $("btnStopAll").disabled = !v; }

async function stopCurrentVideo(){
  if(!currentPromptId) return;
  const pid = currentPromptId;
  currentPromptId = null;
  try {
    await fetch(server()+"/queue", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"cancel", prompt_id:pid})
    });
  } catch(e) {}
  discardTimer(pid);
  delete pendingSeeds[pid];
  handledPrompts.add(pid);
  log("⏹ Video actual detenido.", "l-err");
  currentBatchIndex++;
  processNextBatch();
}

async function stopAll(){
  try {
    await fetch(server()+"/queue", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"cancel_all"})
    });
  } catch(e) {}
  for(const pid of Object.keys(pendingSeeds)) discardTimer(pid);
  pendingSeeds = {};
  handledPrompts.clear();
  processingPrompts.clear();
  currentPromptId = null;
  currentBatchIndex = totalBatchSize;
  enableStopButtons(false);
  $("btnGenerate").disabled=false;
  setRun("bad", "Detenido por usuario");
  log("🛑 Generación detenida.", "l-err");
}

$("btnGenerate").addEventListener("click", runGeneration);
$("btnStopVideo").addEventListener("click", stopCurrentVideo);
$("btnStopAll").addEventListener("click", stopAll);

// --- ENHANCER OLLAMA ---
const ENHANCER_DEFAULT_PROMPTS = {
  text: {
    A: { name: "Estilo A (photorealistic)", prompt: "You are an expert in prompts for Krea2/Flux2 image generation. Transform the user's idea into a detailed photorealistic prompt. Include: subject, lighting, colors, texture, composition, and atmosphere. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt, no explanations or prefaces." },
    B: { name: "Estilo B (artistic)", prompt: "You are a creative assistant specialized in artistic image prompts. Take the user's idea and turn it into an evocative, artistic prompt. Use descriptive, poetic language. Focus on style, mood, and visual impact. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
  },
  vision: {
    A: { name: "Estilo A (descriptive)", prompt: "You are an expert at describing images for image generation. Analyze the provided image and generate a detailed prompt describing: composition, subjects, background, lighting, colors, and style. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
    B: { name: "Estilo B (stylized)", prompt: "You are a digital artist. Look at the image and turn it into a stylized artistic description. Focus on the artistic style, color palette, and emotional impact. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
    C: { name: "Estilo C (literal caption)", prompt: "You are an image captioning specialist. Describe the provided image factually and concisely in 1-3 sentences. No artistic interpretation, no camera instructions, no stylistic flourishes. Just what is visible: main subjects, setting, lighting, and notable details. The user may write in any language; you must ALWAYS respond in English with ONLY the caption, no explanations or preambles." },
  },
};

function loadSysPrompts(){
  const saved = localStorage.getItem("krea2_enhancer_sysprompts");
  if(saved){ try { return JSON.parse(saved); } catch(e) {} }
  return JSON.parse(JSON.stringify(ENHANCER_DEFAULT_PROMPTS));
}
function saveSysPrompts(data){ localStorage.setItem("krea2_enhancer_sysprompts", JSON.stringify(data)); }
function populateStyleSelect(data, mode){
  const sel = $("enhancerStyle");
  sel.innerHTML = "";
  const styles = data[mode] || {};
  for(const key of Object.keys(styles).sort()){
    const opt = document.createElement("option");
    opt.value = key; opt.textContent = styles[key].name || key;
    sel.appendChild(opt);
  }
}
function getCurrentSysPrompt(data, mode, styleKey){
  const styles = data[mode] || {};
  const entry = styles[styleKey];
  return entry ? entry.prompt : "";
}

$("enhancerToggle").addEventListener("click", () => {
  const h = $("enhancerToggle");
  const b = $("enhancerBody");
  h.classList.toggle("open");
  b.classList.toggle("open");
  const arrow = h.querySelector(".arrow");
  arrow.textContent = h.classList.contains("open") ? "▼" : "▶";
});

async function loadEnhancerModels(){
  const sel = $("enhancerModel");
  try {
    const r = await fetch("/api/tags");
    if(!r.ok) throw new Error("HTTP "+r.status);
    const data = await r.json();
    const models = data.models || [];
    sel.innerHTML = '<option value="">-- Seleccionar modelo --</option>';
    for(const m of models){
      const opt = document.createElement("option");
      opt.value = m.name; opt.textContent = m.name;
      sel.appendChild(opt);
    }
    const defaultModel = models.find(m => m.name.includes("Qwythos") || m.name.includes("qwythos"));
    if(defaultModel) sel.value = defaultModel.name;
  } catch(e) {
    sel.innerHTML = '<option value="">Ollama no disponible</option>';
    console.warn("No se pudieron cargar modelos:", e.message);
  }
}

$("enhancerMode").addEventListener("change", () => {
  const data = loadSysPrompts();
  populateStyleSelect(data, $("enhancerMode").value);
});

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
    const r = await fetch("/api/generate", {
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
    const b64 = await imageToResizedBase64(refImgEl.src, 1280);
    const r = await fetch("/api/generate", {
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

$("btnSaveEnhanced").addEventListener("click", () => {
  const text = $("enhancerOutput").value.trim();
  if(!text){ log("⚠️ No hay resultado que guardar", "l-err"); return; }
  const name = prompt("Nombre para este prompt mejorado:");
  if(!name) return;
  const saved = JSON.parse(localStorage.getItem('krea2_prompts') || '{}');
  saved[name] = text;
  localStorage.setItem('krea2_prompts', JSON.stringify(saved));
  loadPrompts();
  log(`Prompt "${name}" guardado desde enhancer.`, "l-ok");
});

// --- MODAL SYSTEM PROMPTS ---
let sysPromptEditData = null;
let sysPromptEditMode = "text";

function renderSysPromptEditor(){
  const container = $("sysPromptEditor");
  if(!container) return;
  const data = sysPromptEditData;
  const mode = sysPromptEditMode;
  const styles = data[mode] || {};
  const keys = Object.keys(styles).sort();
  container.innerHTML = "";
  for(const key of keys){
    const entry = styles[key];
    const isDefault = (key === "A" || key === "B") && ENHANCER_DEFAULT_PROMPTS[mode] && ENHANCER_DEFAULT_PROMPTS[mode][key];
    const row = document.createElement("div");
    row.className = "sysprompt-row";
    row.innerHTML = `
      <div class="spr-top">
        <span class="spr-name">${key}</span>
        <input type="text" class="spr-name-input" value="${entry.name}" style="flex:1;background:var(--panel);border:1px solid var(--border);color:var(--text);border-radius:4px;padding:4px 6px;font-family:var(--mono);font-size:11px;">
        ${isDefault ? "" : '<button class="spr-del" data-key="'+key+'">×</button>'}
      </div>
      <textarea data-key="${key}">${entry.prompt}</textarea>
    `;
    container.appendChild(row);
  }
  container.querySelectorAll(".spr-del").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      delete sysPromptEditData[mode][key];
      renderSysPromptEditor();
    });
  });
}

const sysPromptModal = document.createElement("div");
sysPromptModal.className = "modal-overlay";
sysPromptModal.id = "sysPromptModal";
sysPromptModal.innerHTML = '<div class="modal-content">' +
  '<h2>Editar System Prompts</h2>' +
  '<div class="modal-tabs" id="sysPromptTabs">' +
    '<div class="modal-tab active" data-tab="text">Texto</div>' +
    '<div class="modal-tab" data-tab="vision">Visión</div>' +
  '</div>' +
  '<div id="sysPromptEditor"></div>' +
  '<div class="modal-actions">' +
    '<button id="btnAddSysPrompt" class="ghost">+ Añadir estilo</button>' +
    '<button id="btnSaveSysPrompts" class="primary">Guardar</button>' +
    '<button id="btnCancelSysPrompts" class="ghost">Cancelar</button>' +
  '</div>' +
'</div>';
document.body.appendChild(sysPromptModal);

$("btnAddSysPrompt").addEventListener("click", () => {
  const mode = sysPromptEditMode;
  if(!sysPromptEditData[mode]) sysPromptEditData[mode] = {};
  const keys = Object.keys(sysPromptEditData[mode]);
  let nextKey = "C";
  for(let i = 67; i < 91; i++){
    const k = String.fromCharCode(i);
    if(!keys.includes(k)){ nextKey = k; break; }
  }
  sysPromptEditData[mode][nextKey] = { name: "Nuevo estilo", prompt: "" };
  renderSysPromptEditor();
});
$("btnSaveSysPrompts").addEventListener("click", () => {
  const container = $("sysPromptEditor");
  container.querySelectorAll(".sysprompt-row").forEach(row => {
    const key = row.querySelector("textarea").dataset.key;
    const name = row.querySelector(".spr-name-input").value;
    const prompt = row.querySelector("textarea").value;
    if(sysPromptEditData[sysPromptEditMode] && sysPromptEditData[sysPromptEditMode][key]){
      sysPromptEditData[sysPromptEditMode][key].name = name;
      sysPromptEditData[sysPromptEditMode][key].prompt = prompt;
    }
  });
  saveSysPrompts(sysPromptEditData);
  populateStyleSelect(sysPromptEditData, $("enhancerMode").value);
  $("sysPromptModal").classList.remove("open");
  log("✅ System prompts guardados.", "l-ok");
});
$("btnCancelSysPrompts").addEventListener("click", () => {
  $("sysPromptModal").classList.remove("open");
});
document.querySelectorAll(".modal-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".modal-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    sysPromptEditMode = tab.dataset.tab;
    renderSysPromptEditor();
  });
});

$("btnEditSysPrompts").addEventListener("click", () => {
  sysPromptEditData = loadSysPrompts();
  sysPromptEditMode = "text";
  renderSysPromptEditor();
  const tabs = document.querySelectorAll(".modal-tab");
  tabs.forEach(t => t.classList.remove("active"));
  const textTab = document.querySelector('.modal-tab[data-tab="text"]');
  if(textTab) textTab.classList.add("active");
  $("sysPromptModal").classList.add("open");
});

// --- INICIALIZAR ---
(async () => {
  await loadEnhancerModels();
  const data = loadSysPrompts();
  populateStyleSelect(data, $("enhancerMode").value);
})();

$("btnTest").addEventListener("click", async ()=>{
    setConn("busy","comprobando...");
    try{
        const r=await fetch(server()+"/system_stats");
        if(!r.ok) throw new Error("HTTP "+r.status);
        await r.json();
        setConn("ok","conectado");
        connectSocket();
        log("Conexión OK","l-ok");
    }catch(err){setConn("bad","sin conexión");log("Error: "+err.message,"l-err");}
});
</script>
</body>
</html>
'''

    final_html = html_template.replace("__GRAPH_JSON__", graph_json)
    final_html = final_html.replace("__MODEL_LIST__", model_js_array)
    final_html = final_html.replace("__LORA_LIST__", lora_js_array)

    with open(OUTPUT_HTML, 'w', encoding='utf-8') as f:
        f.write(final_html)

    print(f"✅ HTML generado con {len(model_files)} modelos y {len(lora_files)} LoRAs.")

if __name__ == "__main__":
    main()
