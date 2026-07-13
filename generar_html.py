import json
import os

# --- CONFIGURACIÓN ---
JSON_FILE = 'LTXV_DMD_OK.json'
OUTPUT_HTML = 'LTXV_WebUI.html'
LORAS_DIR = '/home/tonetxo/SwarmUI/Models/Lora/ltxv'
MODELS_DIR = '/media/tonetxo/datos/ltxv'
# ---------------------

def get_file_list(directory, ext='.safetensors', fallback=None):
    """Acepta un directorio (str) o una lista de tuplas (directorio, prefijo_relativo).
    El prefijo_relativo se antepone a los nombres de archivo para que ComfyUI
    pueda encontrarlos en su carpeta de checkpoints.
    """
    if isinstance(directory, str):
        entries = [(directory, '')]
    else:
        entries = list(directory)
    files = []
    for d, prefix in entries:
        if not os.path.exists(d):
            continue
        for root, _, file_list in os.walk(d):
            for f in file_list:
                if f.endswith(ext):
                    rel = os.path.relpath(os.path.join(root, f), d)
                    if rel.startswith('..'):
                        rel = f
                    rel = rel.replace('\\', '/')
                    # Quitar subdirectorios intermedios que coincidan con el prefix
                    if prefix and rel.startswith(prefix + '/'):
                        rel = rel[len(prefix) + 1:]
                    full_name = (prefix + '/' + rel) if prefix else rel
                    files.append(full_name)
    files = sorted(set(files))
    return files if files else ([fallback] if fallback else [])

def get_lora_list(directory):
    loras = []
    if not os.path.exists(directory): 
        return ["ltxv/Ltx2.3-Licon-VBVR-I2V-390K-R32.safetensors"]
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.safetensors'):
                rel_path = os.path.relpath(os.path.join(root, file), directory)
                loras.append(rel_path.replace('\\', '/'))
    
    loras.sort()
    return loras if loras else ["No LoRAs found"]

def main():
    if not os.path.exists(JSON_FILE):
        print(f"❌ Error: No se encontró '{JSON_FILE}'")
        return

    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        graph_json = f.read()

    lora_files = get_lora_list(LORAS_DIR)
    lora_js_array = json.dumps(lora_files)
    raw_models = get_file_list([
        ('/media/tonetxo/datos/ltxv', 'ltxv'),
        ('/home/tonetxo/SwarmUI/Models/Stable-Diffusion', ''),
    ], fallback="10Eros_v1.3_fp8mixed_learned.safetensors")
    exclude = ("StableAudio/", "HiDream/", "sam3.1_multiplex_fp16", "lens_turbo_bf16")
    model_files = [m for m in raw_models if not any(m.startswith(x) for x in exclude)]
    model_js_array = json.dumps(model_files)

    html_template = r'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LTXV · Panel Pro</title>
<style>
  :root{--bg:#0a0c0e;--panel:#12161a;--panel-2:#171c21;--border:#242b31;--text:#e7ecef;--muted:#8b96a0;--muted-2:#5b6670;--accent:#57e8c9;--accent-dim:#2a4d47;--warn:#ffb454;--danger:#ff6a6a;--mono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;--sans:-apple-system,"Segoe UI",Inter,Roboto,sans-serif;}
  *{box-sizing:border-box;}body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:14px;line-height:1.45;}
  .wrap{max-width:1400px;margin:0 auto;padding:22px 18px 60px;}
  .head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:18px;flex-wrap:wrap;}
  .head h1{font-family:var(--mono);font-size:15px;letter-spacing:.12em;text-transform:uppercase;margin:0;color:var(--text);font-weight:600;}
  .head h1 span{color:var(--accent);}.head .sub{font-family:var(--mono);font-size:11px;color:var(--muted-2);letter-spacing:.04em;}
  .chain{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10px;color:var(--muted-2);letter-spacing:.08em;text-transform:uppercase;margin:2px 0 22px;flex-wrap:wrap;}
  .chain .node{padding:3px 8px;border:1px solid var(--border);border-radius:3px;background:var(--panel);}
  .chain .node.active{border-color:var(--accent);color:var(--accent);box-shadow:0 0 0 1px var(--accent-dim) inset;}
  .chain .arrow{color:var(--muted-2);}
  .grid{display:grid;grid-template-columns:1fr 1.2fr;gap:20px;}@media(max-width:1000px){.grid{grid-template-columns:1fr;}}
  .panel{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:16px 16px 18px;margin-bottom:16px;}
  .panel h2{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:0 0 14px;display:flex;align-items:center;gap:8px;}
  .panel h2::before{content:"";width:5px;height:5px;background:var(--accent);border-radius:1px;display:inline-block;}
  label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px;}
  .row{margin-bottom:14px;}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  input[type=text],input[type=number],textarea,select{width:100%;background:var(--panel-2);border:1px solid var(--border);color:var(--text);border-radius:5px;padding:8px 9px;font-family:var(--sans);font-size:13px;outline:none;transition:border-color .15s;}
  select{cursor:pointer; appearance:none; background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b96a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat:no-repeat; background-position:right 8px center; background-size:14px;}
  input[type=number]{font-family:var(--mono);}input:focus,textarea:focus,select:focus{border-color:var(--accent);}
  input.ro{opacity:.7;cursor:default;}input.ro:focus{border-color:var(--border);}
  textarea{resize:vertical;min-height:92px;line-height:1.5;}
  .seed-toggle{display:flex;gap:8px;margin-bottom:8px;}
  .seg{flex:1;text-align:center;padding:7px 0;border:1px solid var(--border);border-radius:5px;font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;color:var(--muted);background:var(--panel-2);user-select:none;}
  .seg.on{border-color:var(--accent);color:var(--accent);background:var(--accent-dim);}
  .slider-row{display:flex;align-items:center;gap:10px;}
  input[type=range]{flex:1;-webkit-appearance:none;height:3px;background:var(--border);border-radius:2px;outline:none;}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:var(--accent);cursor:pointer;border:2px solid var(--bg);box-shadow:0 0 0 1px var(--accent);}
  .slider-val{font-family:var(--mono);font-size:12px;color:var(--accent);width:52px;text-align:right;flex-shrink:0;}
  .dropzone{border:1.5px dashed var(--border);border-radius:7px;padding:14px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s;color:var(--muted);font-size:12px;position:relative;overflow:hidden;}
  .dropzone.drag{border-color:var(--accent);background:var(--accent-dim);}
  .dropzone img{max-width:100%;max-height:360px;border-radius:5px;display:block;margin:0 auto;}
  .dropzone .ph{padding:22px 0;font-family:var(--mono);font-size:11px;letter-spacing:.04em;}
  .dropzone input{display:none;}
  .frame-selector{display:flex;gap:8px;margin-top:8px;}
  .frame-selector button{flex:1;min-width:auto;}
  .frame-selector button.active{border-color:var(--accent);color:var(--accent);background:var(--accent-dim);}
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
  
  /* Estructura vidbox corregida */
  .vidbox{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:14px;display:flex;flex-direction:column; position: relative;}
  .vid-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px; gap: 10px;}
  .vid-header h3{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:0;display:flex;align-items:center;gap:8px; flex:1;}
  .vid-actions{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;}
  .vid-action-btn{background:var(--panel-2);border:1px solid var(--border);color:var(--muted);border-radius:4px;padding:4px 7px;font-size:11px;cursor:pointer;transition:color .15s,background .15s;text-decoration:none;display:inline-flex;align-items:center;}
  .vid-action-btn:hover{color:var(--accent);background:var(--accent-dim);border-color:var(--accent);}
  .vid-footer{margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:11px; gap: 10px; flex-wrap:wrap;}
  .time-tag{font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.04em;}
  .time-tag.live{color:var(--warn);}
  .res-tag{font-family:var(--mono);font-size:10.5px;color:var(--muted-2);letter-spacing:.04em;white-space:nowrap;}
  .variant-time{font-family:var(--mono);font-size:10px;color:var(--muted);margin-right:6px;letter-spacing:.04em;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  
  video{width:100%;border-radius:5px;background:#000;display:block;max-height:50vh;}
  .video-wrap{}
  .video-badge{background:rgba(0,0,0,0.75);color:var(--accent);font-family:var(--mono);font-size:11px;padding:4px 8px;border-radius:4px;border:1px solid var(--accent);display:inline-block;margin-bottom:6px;pointer-events:none;}
  .empty{height:140px;display:flex;align-items:center;justify-content:center;color:var(--muted-2);font-family:var(--mono);font-size:11px;border:1px dashed var(--border);border-radius:5px;}
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
  .gallery-item .lq-badge{position:absolute;top:4px;left:4px;background:rgba(255,180,84,.9);color:#1a1200;font-family:var(--mono);font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;z-index:2;letter-spacing:.03em;}
  .panel-head-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
  .panel-head-row h2{margin:0;}
  .btn-mini{padding:5px 9px;font-size:10px;min-width:auto;flex:none;}
  .dz-info{font-family:var(--mono);font-size:10.5px;color:var(--muted);text-align:center;margin-top:8px;letter-spacing:.03em;}
  .prompt-actions{display:flex;gap:8px;margin-top:8px;}
  .prompt-actions button{padding:6px 10px;font-size:10px;min-width:auto;}

  /* Estilos Pantalla Completa */
  /* Asegurar que el contenido persista en fullscreen */
  .vidbox:fullscreen, .vidbox:-webkit-full-screen, .vidbox:-moz-full-screen {
    width: 100vw !important; height: 100vh !important; max-height: none !important;
    background: #000; border: none; border-radius: 0; padding: 0; position: fixed; top: 0; left: 0; z-index: 9999;
  }
  .vidbox:fullscreen video, .vidbox:-webkit-full-screen video, .vidbox:-moz-full-screen video {
    width: 100%; height: 100%; object-fit: contain; max-height: none; border-radius: 0;
  }
  .vidbox:fullscreen .vid-header, .vidbox:fullscreen .vid-footer, .vidbox:fullscreen .empty {
    display: none !important;
  }

  /* Animación para actualización de semilla */
  @keyframes seedFlash {
    0% { background-color: var(--panel-2); border-color: var(--border); }
    50% { background-color: var(--accent-dim); border-color: var(--accent); box-shadow: 0 0 10px var(--accent); }
    100% { background-color: var(--panel-2); border-color: var(--border); }
  }
  .seed-updated { animation: seedFlash 1.5s ease-out; }

  /* Estilos Galería Variantes */
  .variant-gallery { margin-top: 20px; }
  .variant-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .variant-card { background: var(--panel-2); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; cursor: pointer; position: relative; }
  .variant-card video { width: 100%; height: auto; max-height: 240px; object-fit: contain; background: #000; }
  .variant-badge { background: rgba(0,0,0,0.75); color: var(--accent); font-family: var(--mono); font-size: 10px; padding: 3px 6px; border-radius: 4px; border: 1px solid var(--accent); display: inline-block; margin: 4px 6px 0; pointer-events: none; }
  .variant-info { padding: 8px; font-size: 11px; color: var(--muted); font-family: var(--mono); display: flex; justify-content: space-between; align-items: center; gap: 6px; }
  .variant-icons{display:inline-flex;align-items:center;gap:4px;flex-shrink:0;}
  .variant-meta-btn{background:none;border:none;color:var(--muted);cursor:pointer;font-size:11px;line-height:1;padding:0 2px;border-radius:3px;transition:color .15s,background .15s;display:inline-flex;align-items:center;justify-content:center;min-width:12px;}
  .variant-meta-btn:hover{color:var(--accent);background:rgba(87,232,201,.12);}
  .variant-del-btn{background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;line-height:1;padding:0 2px;border-radius:3px;transition:color .15s,background .15s;display:inline-flex;align-items:center;justify-content:center;min-width:14px;}
  .variant-del-btn:hover{color:var(--danger);background:rgba(255,106,106,.12);}
  .variant-seed-display { color: var(--accent); cursor: pointer; user-select: text; display: flex; align-items: center; gap: 6px; }
  .variant-seed-display:hover { color: #fff; }
  .copy-icon { font-size: 12px; opacity: 0.7; transition: opacity 0.2s; }
  .variant-seed-display:hover .copy-icon { opacity: 1; }

  /* Collapsible enhancer panel */
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

  /* Modal for system prompt editor */
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
</style>
</head>
<body>
<div class="wrap">
  <div class="head"><h1>LTXV <span>//</span> panel pro</h1><div class="sub">grafo: LTXV_DMD_OK</div></div>
  <div class="chain" id="chain">
    <div class="node" data-n="img">imagen</div><div class="arrow">→</div><div class="node" data-n="cond">cond</div><div class="arrow">→</div>
    <div class="node" data-n="p1">1er pase</div><div class="arrow">→</div><div class="node" data-n="up">upscale</div><div class="arrow">→</div>
    <div class="node" data-n="p2">2º pase</div><div class="arrow">→</div><div class="node" data-n="out">final</div>
  </div>
  <div class="grid">
    <div class="controls-col">
      <div class="panel"><h2>Servidor</h2><div class="server-row"><input type="text" id="serverUrl" value="" placeholder="http://127.0.0.1:7821" spellcheck="false"><button id="btnTest" class="ghost">Probar</button></div><div class="statusbar"><span class="dot" id="connDot"></span><span id="connText">sin comprobar</span></div><div class="hint" id="serverHint" style="font-size:10.5px;margin-top:4px;"></div></div>
      
      <div class="panel">
        <h2>Biblioteca de Prompts</h2>
        <div class="row"><select id="promptLibSelect"><option value="">-- Seleccionar Prompt Guardado --</option></select></div>
        <div class="prompt-actions"><button id="btnSavePrompt">Guardar Actual</button><button id="btnDeletePrompt" class="ghost">Eliminar</button></div>
      </div>

      <div class="panel"><h2>Imagen entrada</h2><div class="dropzone" id="dropzone"><input type="file" id="fileInput" accept="image/*,video/*"><div class="ph" id="dzPlaceholder">arrastra imagen o vídeo, o clic</div></div><div class="dz-info" id="dzInfo"></div><div class="frame-selector" id="frameSelector" style="display:none;margin-top:8px;"><button class="ghost btn-mini" data-frame="first">1er frame</button><button class="ghost btn-mini" data-frame="last">Último frame</button></div></div>

      <div class="panel">
        <div class="collapsible-header" id="krea2RecentToggle">
          <span class="arrow">▶</span> Imágenes Krea2 recientes
        </div>
        <div class="collapsible-body" id="krea2RecentBody">
          <div class="hint" id="krea2RecentStatus" style="margin-bottom:8px;">Cargando...</div>
          <div class="gallery-grid" id="krea2RecentGrid"></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head-row"><h2>Historial de Imágenes</h2><button id="btnClearGallery" class="ghost btn-mini">Vaciar</button></div>
        <div class="gallery-grid" id="galleryGrid"></div>
      </div>

      <div class="panel"><h2>Prompt</h2><div class="row"><textarea id="prompt" placeholder="Describe la escena..."></textarea></div></div>

      <!-- ENHANCER PANEL -->
      <div class="panel">
        <div class="collapsible-header" id="enhancerToggle">
          <span class="arrow">▶</span> Mejorar prompt con IA
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

      <div class="panel"><h2>Semilla</h2><div class="seed-toggle"><div class="seg on" id="segRandom">Aleatoria</div><div class="seg" id="segFixed">Fija</div></div><input type="number" id="seedVal" value="12345" step="1" disabled></div>
      <div class="panel"><h2>Modelo</h2><div class="row"><select id="modelSelect"></select></div></div>
      <div class="panel"><h2>LoRAs</h2><div id="loraList"></div></div>
      <div class="panel"><h2>Resolución & duración</h2><div class="row slider-row"><label>Megapíxeles</label><input type="range" id="mpSlider" min="0.3" max="2.0" step="0.05" value="0.9"><div class="slider-val" id="mpVal">0.90</div></div><div class="row two-col"><div><label>Ancho</label><input type="number" id="width" value="1280" step="32" min="256" class="ro" readonly></div><div><label>Alto</label><input type="number" id="height" value="736" step="32" min="256" class="ro" readonly></div></div><div class="row"><label>Frames <span class="hint" id="durHint">(600 / 24fps = 25.0s)</span></label><input type="number" id="frames" value="600" step="8" min="8"></div>
      <div class="row"><label>Batch Size (Variantes) <span class="hint">(Genera N semillas distintas)</span></label><input type="number" id="batchSize" value="1" step="1" min="1" max="16"></div></div>
      <div class="panel"><h2>Fidelidad</h2><div class="row slider-row"><input type="range" id="fidelitySlider" min="0" max="2" step="0.05" value="1"><div class="slider-val" id="fidelityVal">1.00</div></div></div>
      <div class="panel"><h2>Movimiento</h2><div class="row slider-row"><input type="range" id="motionSlider" min="0" max="30" step="0.5" value="10"><div class="slider-val" id="motionVal">10.0</div></div></div>
      <div class="panel"><h2>Ejecución</h2><div class="btn-row"><button id="btnFirstPass">Solo 1er pase</button><button id="btnFull" class="primary">Generar completo</button></div><div class="btn-row" style="margin-top:6px"><button id="btnStopVideo" disabled>Parar video</button><button id="btnStopAll" class="danger" disabled>Parar todo</button></div><div class="statusbar"><span class="dot" id="runDot"></span><span id="runText">en reposo</span></div><div class="log" id="log">listo.</div></div>
    </div>
    <div class="results-col">
      <!-- REPRODUCTOR 1ER PASE -->
      <div class="vidbox">
        <div class="vid-header">
          <h3>Vídeo <em style="color:var(--accent)">1er pase</em></h3>
          <div class="vid-actions">
            <button class="vid-action-btn" id="btnDownload1" title="Descargar vídeo" style="display:none;" type="button">⬇ Descargar</button>
            <button class="vid-action-btn" id="btnLoadMeta1" title="Recuperar parámetros del workflow de este vídeo" disabled>📋 Workflow</button>
          </div>
        </div>
        <div class="empty" id="empty1">sin generar</div>
        <span class="video-badge" id="badge1"></span>
        <video id="video1" controls allowfullscreen playsinline style="display:none"></video>
        <div class="vid-footer">
          <span class="time-tag" id="time1"></span>
          <span class="res-tag" id="res1"></span>
        </div>
      </div>

      <!-- REPRODUCTOR FINAL -->
      <div class="vidbox">
        <div class="vid-header">
          <h3>Vídeo <em style="color:var(--accent)">final</em></h3>
          <div class="vid-actions">
            <button class="vid-action-btn" id="btnDownload2" title="Descargar vídeo" style="display:none;" type="button">⬇ Descargar</button>
            <button class="vid-action-btn" id="btnLoadMeta2" title="Recuperar parámetros del workflow de este vídeo" disabled>📋 Workflow</button>
          </div>
        </div>
        <div class="empty" id="empty2">sin generar</div>
        <span class="video-badge" id="badge2"></span>
        <video id="video2" controls allowfullscreen playsinline style="display:none"></video>
        <div class="vid-footer">
          <span class="time-tag" id="time2"></span>
          <span class="res-tag" id="res2"></span>
        </div>
      </div>
      
      <!-- GALERÍA DE VARIANTES -->
      <div class="vidbox variant-gallery" id="variantGalleryBox" style="display:none;">
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

const N = {IMAGE:"917",PROMPT:"536",SEED:"524",WIDTH:"791",HEIGHT:"792",FRAMES:"796",FIDELITY:"797",MOTION:"915",LORA:"853",FINAL_SAVE:"920",PURGE_VRAM:"925",FIRST_SAVE:"923",CHECKPOINT:"646"};
const CLIENT_ID = crypto.randomUUID ? crypto.randomUUID() : "wc-" + Math.random().toString(36).slice(2);
let uploadedImage=null, localFile=null, seedMode="random";
let currentAspectRatio = 16/9; // ratio w/h de la imagen cargada (por defecto 16:9)

function nearest32(v){ return Math.round(v / 32) * 32; }

function recalcResolution(){
  const mp = parseFloat($("mpSlider").value) || 0.9;
  const totalPx = mp * 1_000_000;
  // w = sqrt(totalPx * aspect), h = sqrt(totalPx / aspect)
  let w = nearest32(Math.sqrt(totalPx * currentAspectRatio));
  let h = nearest32(Math.sqrt(totalPx / currentAspectRatio));
  // Ajustar para que w*h se acerque a totalPx (el redondeo a x32 puede desviar)
  // Recalcular h a partir de w para mantener el aspect ratio exacto
  h = nearest32(w / currentAspectRatio);
  // Si h es 0, mínimo 256
  if(h < 256) h = 256;
  if(w < 256) w = 256;
  $("width").value = w;
  $("height").value = h;
  $("mpVal").textContent = mp.toFixed(2);
}
let loras = [{on:true, lora:"", strength:1},{on:false, lora:"", strength:0.15},{on:false, lora:"", strength:0.65}];
let socket = null;
let currentBatchIndex = 0;
let totalBatchSize = 0;
let pendingSeeds = {};      // prompt_id -> semilla realmente usada en ese envío
let handledPrompts = new Set(); // prompt_id ya procesados (evita duplicados WS+polling)
let processingPrompts = new Set(); // prompt_id cuyo history se está consultando ahora
let batchSeedMode = "random"; // modo capturado al lanzar el batch (independiente del toggle en vivo)
let currentPromptId = null;   // prompt_id de la variante que se está ejecutando ahora
let timers = {};               // prompt_id -> { start, iv }
let promptSteps = {};          // prompt_id -> "1" (first-only / step-1) | "2" (step-2)
let currentMedia = {};         // slot -> {filename, subfolder, type} del vídeo cargado en ventana principal
// --- Modo "Generar completo" en 2 pasos ---
// El backend solo emite execution_success al final de TODO el grafo. Si mandamos
// el grafo completo de golpe, el 1er pase y el final aparecen a la vez y con el
// mismo tiempo. Solución: en modo "completo" lanzamos dos prompts secuenciales.
// Paso 1: grafo sin FINAL_SAVE ni PURGE_VRAM (igual que "Solo 1er pase").
//   ComfyUI ejecuta el 1er pase y guarda el resultado en caché.
//   Mostramos vídeo en slot 1 con su tiempo.
// Paso 2: grafo completo. ComfyUI reutiliza el caché del 1er pase y solo ejecuta
//   el 2º pase (upscale + final). Mostramos vídeo en slot 2 con su tiempo.
let generationStep = 0;       // 0 = inactivo; 1 = paso 1; 2 = paso 2
let firstPromptId = null;     // prompt_id del paso 1 (para mostrar su vídeo al acabar)
let finalVariantIndex = null; // índice de la variante original cuando se genera el final desde un 1er pase

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
  // Cierra el cronómetro y devuelve el tiempo total. NO pinta: lo decide el caller
  // en función de qué outputs llegaron (FIRST_SAVE / FINAL_SAVE) para no ensuciar
  // el reproductor final cuando solo se pidió el 1er pase.
  const t = timers[promptId];
  if(!t) return null;
  const total = Date.now() - t.start;
  if(t.iv){ clearInterval(t.iv); t.iv = null; }
  delete timers[promptId];
  return { total, text: `⏱ ${fmtMs(total)}` };
}

function discardTimer(promptId){
  // para errores: limpia el interval y olvida el cronómetro sin pintar nada
  const t = timers[promptId];
  if(!t) return;
  if(t.iv) clearInterval(t.iv);
  delete timers[promptId];
}

// Saca tiempos del history JSON de ComfyUI. Devuelve {t1, t2, total} en ms o null
// si no se puede calcular. Prioriza tiempos por nodo si están disponibles; si no,
// usa execution_start / execution_success para el total.
//
// t1 = tiempo del nodo FIRST_SAVE  (solo si hay eventos executing+executed)
// t2 = tiempo del nodo FINAL_SAVE  (solo si hay eventos executing+executed)
// total = execution_success.timestamp - execution_start.timestamp (si ambos existen)
function extractTimings(entry, N){
  if(!entry || !entry.status) return null;
  const msgs = entry.status.messages || [];
  if(!Array.isArray(msgs) || msgs.length === 0) return null;

  // Total oficial del backend
  let tStart = null, tSuccess = null;
  // Tiempos por nodo: map nodeId -> {start, end}
  const nodeTimes = {};
  for(const m of msgs){
    if(!Array.isArray(m) || m.length < 2) continue;
    const type = m[0];
    const data = m[1] || {};
    if(type === "execution_start" && data.timestamp != null){
      tStart = data.timestamp;
    } else if(type === "execution_success" && data.timestamp != null){
      tSuccess = data.timestamp;
    } else if(type === "executing" && data.node != null && data.timestamp != null){
      // 'executing' marca el inicio de la ejecución del nodo. Algunos nodos vuelven
      // a entrar aquí varias veces; nos quedamos con la primera.
      if(!nodeTimes[data.node]) nodeTimes[data.node] = { start: null, end: null };
      if(nodeTimes[data.node].start == null) nodeTimes[data.node].start = data.timestamp;
    } else if(type === "executed" && data.node != null && data.timestamp != null){
      if(!nodeTimes[data.node]) nodeTimes[data.node] = { start: null, end: null };
      nodeTimes[data.node].end = data.timestamp;
    }
  }

  const total = (tStart != null && tSuccess != null) ? (tSuccess - tStart) : null;
  const t1 = nodeTimes[N.FIRST_SAVE] && nodeTimes[N.FIRST_SAVE].start != null && nodeTimes[N.FIRST_SAVE].end != null
             ? (nodeTimes[N.FIRST_SAVE].end - nodeTimes[N.FIRST_SAVE].start) : null;
  const t2 = nodeTimes[N.FINAL_SAVE] && nodeTimes[N.FINAL_SAVE].start != null && nodeTimes[N.FINAL_SAVE].end != null
             ? (nodeTimes[N.FINAL_SAVE].end - nodeTimes[N.FINAL_SAVE].start) : null;

  if(total == null && t1 == null && t2 == null) return null;
  return { t1, t2, total };
}

function randomSeed(){
  // entero positivo de 32 bits, válido para el sampler
  return Math.floor(Math.random() * 0xFFFFFFFF);
}

// --- AUTO-DETECCIÓN DEL BACKEND EN LAN ---
// Cuando abres la UI desde otro dispositivo (móvil, otro PC) por la IP de la LAN,
// el servidor de la UI (serve.py) hace de proxy hacia el backend en :7821, así que
// el input se deja VACÍO (same-origin) y el fetch va al mismo host:puerto que la
// página. El placeholder muestra la URL de referencia por si se necesita editar.
// Si el usuario ya escribió algo a mano, lo respetamos.
// Migración: si localStorage trae el puerto antiguo (7822), lo descartamos.
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
    const stored = localStorage.getItem("ltxv_serverUrl");
    if(stored){
      const storedPort = (stored.match(/:(\d+)\b/) || [])[1];
      if(storedPort && LEGACY_PORTS.includes(storedPort)){
        localStorage.removeItem("ltxv_serverUrl");
      } else {
        input.value = stored;
        updateServerHint();
        return;
      }
    }
    // Dejar vacío: el proxy de serve.py lo captura
    updateServerHint();
  } catch(e) { /* si falla, queda el placeholder */ }
})();
// Persiste cambios manuales para que se recuerden entre recargas.
$("serverUrl").addEventListener("change", (e) => {
  try { localStorage.setItem("ltxv_serverUrl", e.target.value.trim()); } catch(_){}
  updateServerHint();
});
$("serverUrl").addEventListener("input", updateServerHint);

function server(){ return $("serverUrl").value.replace(/\/+$/,""); }
function log(msg, cls){const el=$("log"),line=document.createElement("div");if(cls)line.className=cls;line.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`;el.appendChild(line);el.scrollTop=el.scrollHeight;}
function setConn(s,t){$("connDot").className="dot"+(s?" "+s:"");$("connText").textContent=t;}
function setRun(s,t){$("runDot").className="dot"+(s?" "+s:"");$("runText").textContent=t;}
function setChainActive(keys){document.querySelectorAll(".chain .node").forEach(n=>n.classList.toggle("active",keys.includes(n.dataset.n)));}

// --- WEBSOCKET SETUP ---
function connectSocket() {
    // evitar abrir un segundo socket mientras el primero aún está conectando
    if(socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
    const url = server().replace('http', 'ws') + '/ws?clientId=' + CLIENT_ID;
    socket = new WebSocket(url);
    socket.onopen = () => { console.log("WebSocket conectado"); setConn("ok", "Conectado (WS)"); };
    socket.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch(e) {
            // El proxy de serve.py rechaza /ws con 426 y texto plano;
            // no es JSON, no podemos procesarlo. Cerramos el socket
            // para que pollFallback tome el relevo.
            console.warn("WS mensaje no-JSON, cerrando:", event.data.slice(0,80));
            socket.close();
            return;
        }
        if(msg.type === 'execution_success') handlePromptDone(msg.data.prompt_id);
        if(msg.type === 'execution_error') {
            const pid = msg.data && msg.data.prompt_id;
            log(`❌ Error en prompt ${pid || ''}: ${JSON.stringify(msg.data && msg.data.exception_message || msg.data)}`, "l-err");
            if(pid){ handledPrompts.add(pid); delete pendingSeeds[pid]; delete promptSteps[pid]; discardTimer(pid); }
            // Si falla el paso 1 del completo, no continuar al paso 2
            if(generationStep === 1) generationStep = 0;
            currentBatchIndex++;
            processNextBatch();
        }
    };
    socket.onerror = (err) => console.error("WS Error", err);
}

// Procesa un prompt_id terminado, venga del WS o del polling de respaldo.
// Idempotente: si ya se ha procesado, no hace nada.
async function handlePromptDone(promptId) {
    if(handledPrompts.has(promptId)) return;
    if(processingPrompts.has(promptId)) return; // ya lo está consultando otro
    processingPrompts.add(promptId);
    let entry;
    try {
        const hr = await fetch(server()+"/history/"+promptId);
        if(!hr.ok) {
            log(`⏳ Esperando resultado (HTTP ${hr.status})...`, "l-ok");
            processingPrompts.delete(promptId);
            return;
        }
        const hist = await hr.json();
        entry = hist[promptId];
    } catch(e) {
        log(`⚠️ Error consultando history: ${e.message}`, "l-err");
        processingPrompts.delete(promptId);
        return;
    }
    if(!entry || !entry.outputs) {
        processingPrompts.delete(promptId);
        return; // aún no ha terminado
    }

    // Si el prompt fue cancelado (Stop All / Stop Video) y ya no está en pendingSeeds,
    // descartamos silenciosamente cualquier execution_success tardío del backend.
    // Esto evita que una generación anterior interrumpida dispare el paso 2 de la actual.
    if(!(promptId in pendingSeeds)){
        handledPrompts.add(promptId);
        processingPrompts.delete(promptId);
        return;
    }

    handledPrompts.add(promptId);
    processingPrompts.delete(promptId);

    // La semilla real la conocemos desde que se encoló (la genera el propio navegador),
    // no hace falta (ni se puede) leerla del historial de ComfyUI.
    const realSeed = (promptId in pendingSeeds) ? pendingSeeds[promptId] : null;
    if(realSeed !== null) {
        updateSeedUI(realSeed);
        log(`🎲 Semilla usada: ${realSeed}`, "l-ok");
    }

    // Cronómetro. Fuente principal: timestamps de status.messages del backend
    // (execution_success.timestamp - execution_start.timestamp). Es la medida
    // oficial del tiempo que tardó la API y no incluye latencia de red ni parseo.
    // Fallback: cronómetro del cliente (startTimer) si el backend no trae los
    // timestamps (versiones muy viejas o builds sin status.messages).
    const timings = extractTimings(entry, N);
    let clientResult = stopTimer(promptId); // limpia el interval y devuelve el fallback

    const tTotal = (timings && timings.total != null) ? fmtMs(timings.total) :
                    (clientResult ? fmtMs(clientResult.total) : null);

    function paint(slot, label, value){
        const el = $("time"+slot);
        if(!el) return;
        if(value == null){
            el.textContent = "";
            el.classList.remove("live");
        } else {
            el.textContent = label ? `⏱ ${label} ${value}` : `⏱ ${value}`;
            el.classList.remove("live");
        }
    }

    // --- Mostrar resultados según el paso (1 = 1er pase, 2 = final) ---
    const step = promptSteps[promptId] || "1";
    const isFirstOnly = (step === "1");  // paso 1 (o "Solo 1er pase")
    const media1 = entry.outputs[N.FIRST_SAVE] ? findMedia(entry.outputs[N.FIRST_SAVE]) : null;
    const media2 = entry.outputs[N.FINAL_SAVE] ? findMedia(entry.outputs[N.FINAL_SAVE]) : null;

    if(isFirstOnly){
        // Solo 1er pase (botón "Solo 1er pase" o paso 1 del completo)
        if(media1){
            showVideo(1, media1, { variantIndex: currentBatchIndex + 1 });
            paint(1, "1er", tTotal || "—");
            addToVariantGallery(media1, realSeed, tTotal || "", 1, currentBatchIndex + 1);
        }
    } else {
        // Paso 2 del completo (o grafo completo sin pasos): el final está listo
        if(media2){
            const finalIdx = finalVariantIndex != null ? (finalVariantIndex + 1) : (currentBatchIndex + 1);
            showVideo(2, media2, { variantIndex: finalIdx });
            paint(2, "final", tTotal || "—");
            addToVariantGallery(media2, realSeed, tTotal || "", 2, finalIdx);
        }
        // Si por casualidad el paso 2 también trae FIRST_SAVE (no debería si lo
        // cacheó), no lo mostramos de nuevo en slot 1.
    }

    delete promptSteps[promptId];

    // --- ¿Continuamos con el paso 2? ---
    if(generationStep === 1 && step === "1" && window.currentBatchMode === false){
        // Acaba el paso 1 del "Generar completo" -> lanzar paso 2
        log(`➡️ Paso 1 completado, iniciando paso 2 (2º pase)...`, "l-ok");
        generationStep = 2;
        // Guardar la semilla del paso 1 para reutilizarla en el paso 2 ANTES de borrarla
        const step1Seed = pendingSeeds[promptId];
        delete pendingSeeds[promptId];
        // Reinyectar la semilla del paso 1 para que runSingleGeneration la reutilice
        pendingSeeds[firstPromptId] = step1Seed;
        // Recordar el índice de la variante original para etiquetar bien el vídeo final
        finalVariantIndex = currentBatchIndex;
        runSingleGeneration(currentBatchIndex);  // MISMO índice, paso 2
        return;  // NO avanzar currentBatchIndex todavía
    }

    // Si llegamos aquí, el proceso ha terminado completamente (1er pase puro o paso 2 completo)
    log(`✅ Variante ${currentBatchIndex + 1}/${totalBatchSize} completada.`, "l-ok");
    delete pendingSeeds[promptId];
    generationStep = 0;
    firstPromptId = null;
    finalVariantIndex = null;
    currentBatchIndex++;
    processNextBatch();
}

// Red de seguridad: si el WS no entrega 'execution_success' (build distinta de ComfyUI,
// reconexión, mensaje perdido...), esto igualmente recupera el resultado por polling.
function pollFallback(promptId) {
    let tries = 0;
    const iv = setInterval(async () => {
        tries++;
        if(handledPrompts.has(promptId) || tries > 180) { clearInterval(iv); return; } // ~12 min máx
        await handlePromptDone(promptId);
        if(handledPrompts.has(promptId)) clearInterval(iv);
    }, 4000);
}

// FUNCIÓN PARA ACTUALIZAR LA SEMILLA EN EL UI
function updateSeedUI(seedValue) {
    $("seedVal").value = seedValue;
    $("seedVal").classList.remove("seed-updated");
    void $("seedVal").offsetWidth;
    $("seedVal").classList.add("seed-updated");
    // Solo cambiamos el toggle a "Fija" fuera de un batch (una sola generación):
    // durante un batch de variantes esto no debe tocar seedMode, o las siguientes
    // variantes perderían la aleatoriedad (ver batchSeedMode).
    if(totalBatchSize <= 1) {
        seedMode = "fixed";
        $("segFixed").classList.add("on");
        $("segRandom").classList.remove("on");
        $("seedVal").disabled = false;
    }
}

// Galería de variantes. `media` debe venir ya resuelto por findMedia() como
// {filename, subfolder, type} — antes se reimplementaba el parseo aquí con
// claves equivocadas (media.images) y casi nunca encontraba el archivo real,
// cayendo siempre en el fallback "video.mp4" (inexistente -> vídeo roto).
function addToVariantGallery(media, seedValue, timeText, slot, variantIndex) {
    if(!media || !media.filename) {
        log("⚠️ No se encontró vídeo de salida para añadir a la galería de variantes.", "l-err");
        return;
    }
    const box = $("variantGalleryBox");
    const grid = $("variantGrid");
    box.style.display = "block";

    const { filename, subfolder, type } = media;
    const ts = Date.now();
    const url = `${server()}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${encodeURIComponent(type)}&t=${ts}`;

    // Determinar qué texto mostrar
    const hasSeed = seedValue !== null && seedValue !== undefined;
    const idx = variantIndex != null ? variantIndex : (currentBatchIndex + 1);
    const slotLabel = slot === 1 ? "1er pase" : (slot === 2 ? "final" : `Var. #${idx}`);
    const displayText = hasSeed ? String(seedValue) : slotLabel;
    const tooltipText = hasSeed ? "Click para copiar semilla" : "Semilla no disponible";
    const timeStr = timeText || "";
    const typeShort = slot === 1 ? "1er" : (slot === 2 ? "final" : "var");

    const card = document.createElement("div");
    card.className = "variant-card";
    card.dataset.filename = filename;
    card.dataset.subfolder = subfolder;
    card.dataset.type = type;
    card.dataset.slot = String(slot);
    card.dataset.variantIndex = String(idx);

    // Usamos un span limpio solo con el texto y el icono
    card.innerHTML = `
        <span class="variant-badge">Var ${idx} · ${typeShort}</span>
        <video src="${url}" type="video/mp4" controls muted preload="metadata" playsinline></video>
        <div class="variant-info">
            <span class="variant-seed-display" title="${tooltipText}">
                <span class="seed-text">${displayText}</span>
                <span class="copy-icon">📋</span>
            </span>
            <span class="variant-time" title="Tiempo de inferencia">⏱ ${timeStr}</span>
            <span class="variant-icons">
                <button class="variant-del-btn" title="Eliminar de la galería" onclick="event.stopPropagation();">×</button>
            </span>
        </div>
    `;

    // Añadir evento de copia SOLO si hay semilla
    if(hasSeed) {
        const seedSpan = card.querySelector('.variant-seed-display');
        seedSpan.addEventListener('click', async (e) => {
            e.stopPropagation(); // Evitar burbujeo
            try {
                await navigator.clipboard.writeText(String(seedValue));
                const originalHTML = seedSpan.innerHTML;
                seedSpan.innerHTML = '<span class="seed-text">¡Copiado!</span> <span class="copy-icon">✅</span>';
                setTimeout(() => {
                    seedSpan.innerHTML = originalHTML;
                }, 1200);
            } catch(err) {
                console.error("Error al copiar:", err);
            }
        });
    }

    const delBtn = card.querySelector(".variant-del-btn");
    delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if(!confirm("¿Eliminar este vídeo del disco y de la galería?")) return;
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
            log("🗑️ Vídeo eliminado del disco: "+fn, "l-ok");
        } catch(err){
            log("❌ No se pudo borrar del disco: "+err.message, "l-err");
            delBtn.disabled = false;
        }
    });

    // Click en la miniatura de variante -> cargar en su ventana (slot 1 o 2)
    card.addEventListener("click", (e) => {
        if(e.target.closest(".variant-seed-display") || e.target.closest(".variant-del-btn")) return;
        const varIndex = parseInt(card.dataset.variantIndex, 10) || (currentBatchIndex + 1);
        // Los vídeos de slot 1 (1er pase) se cargan en el reproductor 1.
        // Los vídeos de slot 2 (final) se cargan en el reproductor 2.
        // Si el usuario quiere convertir un 1er pase en final, debe usar el workflow,
        // no el click de la galería. Aquí respetamos el slot original de la variante.
        showVideo(slot, { filename, subfolder, type }, { variantIndex: varIndex });
        log("▶ Vídeo cargado en ventana "+(slot===1?"1er pase":"final")+": "+filename, "l-ok");
    });

    grid.appendChild(card);
    $("variantCount").textContent = `(${currentBatchIndex + 1})`;
}

// --- EXTRACCIÓN DE WORKFLOW DESDE METADATOS MP4 ---
// ComfyUI guarda el workflow en el JSON "extra" del MP4 con clave "prompt".
// Buscamos la cadena literal "prompt": { y parseamos el JSON con un
// parser de brackets que respeta strings.
async function extractWorkflowFromMP4Buffer(arrayBuffer){
  const bytes = new Uint8Array(arrayBuffer);
  const txt = new TextDecoder("latin1").decode(bytes);
  // Buscar el patrón del workflow: puede ser "prompt": { o directamente {"274": (workflow del MP4)
  let braceIdx = -1;
  const patIdx = txt.indexOf('"prompt": {');
  if(patIdx >= 0){
    braceIdx = txt.indexOf('{', patIdx);
  } else {
    const m = txt.match(/\{"\d+":\s*\{/);
    if(m) braceIdx = m.index;
  }
  if(braceIdx < 0) return null;
  // Parser de brackets que respeta strings y secuencias de escape
  let depth = 0, i = braceIdx, inString = false, escape = false;
  while(i < txt.length){
    const c = txt[i];
    if(inString){
      if(escape){ escape = false; }
      else if(c === '\\'){ escape = true; }
      else if(c === '"'){ inString = false; }
    } else {
      if(c === '"'){ inString = true; }
      else if(c === '{'){ depth++; }
      else if(c === '}'){ depth--; if(depth === 0){ i++; break; } }
    }
    i++;
  }
  if(depth !== 0) return null;
  const jsonStr = txt.substring(braceIdx, i);
  try {
    return JSON.parse(jsonStr);
  } catch(e){
    console.warn("No se pudo parsear workflow del MP4:", e.message);
    return null;
  }
}

async function extractWorkflowFromMP4(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error("HTTP "+r.status);
  return extractWorkflowFromMP4Buffer(await r.arrayBuffer());
}

function processNextBatch() {
    if(currentBatchIndex < totalBatchSize) {
        setTimeout(() => {
            // Al iniciar una nueva variante del batch, resetear el paso
            // "Solo 1er pase" => 0; "Generar completo" => 1 (empezar por paso 1)
            generationStep = window.currentBatchMode ? 0 : 1;
            firstPromptId = null;
            finalVariantIndex = null;
            runSingleGeneration(currentBatchIndex);
        }, 1000);
    } else {
        setRun("ok", "Batch finalizado");
        log("🏁 Todas las variantes han sido procesadas.", "l-ok");
        $("btnFirstPass").disabled=false;
        $("btnFull").disabled=false;
        enableStopButtons(false);
    }
}

// --- GESTIÓN DE PROMPTS ---
function loadPrompts(){
  const saved = JSON.parse(localStorage.getItem('ltxv_prompts') || '{}');
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
  const saved = JSON.parse(localStorage.getItem('ltxv_prompts') || '{}');
  saved[name] = text;
  localStorage.setItem('ltxv_prompts', JSON.stringify(saved));
  loadPrompts();
  log(`Prompt "${name}" guardado.`, "l-ok");
}
function deletePrompt(){
  const select = $("promptLibSelect");
  const name = select.value;
  if(!name) return;
  if(!confirm(`¿Eliminar "${name}"?`)) return;
  const saved = JSON.parse(localStorage.getItem('ltxv_prompts') || '{}');
  delete saved[name];
  localStorage.setItem('ltxv_prompts', JSON.stringify(saved));
  loadPrompts();
}
$("promptLibSelect").addEventListener("change", (e) => {
  const saved = JSON.parse(localStorage.getItem('ltxv_prompts') || '{}');
  if(saved[e.target.value]) $("prompt").value = saved[e.target.value];
});
$("btnSavePrompt").addEventListener("click", savePrompt);
$("btnDeletePrompt").addEventListener("click", deletePrompt);
loadPrompts();

// --- GESTIÓN DE GALERÍA DE IMÁGENES (IndexedDB: miniatura + original a resolución completa) ---
// Antes se guardaba solo la miniatura comprimida (260px) en localStorage y se descartaba
// el original -> al reseleccionar una imagen del historial, se reinyectaba la miniatura
// de baja resolución como si fuera la imagen de entrada. localStorage tiene ~5-10MB de
// cuota, insuficiente para guardar originales, así que usamos IndexedDB (sin ese límite
// práctico) y guardamos AMBAS: 'thumb' (para pintar la miniatura rápido) y 'full' (el
// original intacto, que es lo que se reinyecta al seleccionar).
const GALLERY_DB_NAME = 'ltxv_gallery_db';
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

function updateDzInfo(w, h){
  const el = $("dzInfo");
  if(!el) return;
  el.textContent = (w && h) ? `${w}×${h} · ${aspectRatioStr(w, h)}` : "";
  if(w && h){
    currentAspectRatio = w / h;
    recalcResolution();
  }
}

async function getImageHash(base64Str) {
    try {
        if(!crypto?.subtle?.digest) throw new Error("crypto.subtle no disponible (HTTP)");
        const msgBuffer = new TextEncoder().encode(base64Str.substring(0, 500) + base64Str.length);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    } catch(e) {
        // Fallback: hash simple basado en timestamp + random (suficiente para evitar
        // colisiones en la galería local, donde el hash solo sirve como key de IndexedDB).
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
        // base64Data es el ORIGINAL sin tocar (viene de handleFile); 'thumb' es solo
        // para pintar rápido en el grid, pero se guarda también el original completo.
        const { dataUrl: thumb, width, height } = await resizeImageForStorage(base64Data, 260);
        const hash = await getImageHash(thumb);
        await dbPutImage({ hash, thumb, full: base64Data, width, height, ts: Date.now() });
        await renderGallery();
    } catch (err) {
        console.warn("No se pudo guardar en galería:", err);
        log("⚠️ No se pudo guardar la imagen en el historial: " + err.message, "l-err");
    }
}

// Migra una sola vez las entradas antiguas de localStorage (solo tenían miniatura,
// el original ya se había descartado -> quedan marcadas como 'legacy' y seguirán
// siendo de baja resolución hasta que se vuelvan a arrastrar).
async function migrateLegacyGalleryIfNeeded(){
  const raw = localStorage.getItem('ltxv_gallery');
  if(!raw) return;
  try {
    const old = JSON.parse(raw);
    for(const raw_item of old){
      const item = typeof raw_item === 'string' ? { data: raw_item, hash: null } : raw_item;
      const hash = item.hash || await getImageHash(item.data);
      await dbPutImage({
        hash, thumb: item.data, full: item.data,
        width: item.width || null, height: item.height || null,
        ts: Date.now(), legacy: true
      });
    }
    log(`↪️ Migradas ${old.length} imágenes del historial antiguo (quedan como baja resolución, arrástralas de nuevo para tenerlas a resolución completa).`, "l-ok");
  } catch(e) {
    console.warn("No se pudo migrar el historial antiguo:", e);
  } finally {
    localStorage.removeItem('ltxv_gallery'); // no volver a intentar migrar
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
      // 'full' es el original a resolución completa; solo cae a 'thumb' en entradas legacy sin original.
      const sourceData = item.full || item.thumb;
      fetch(sourceData).then(res => res.blob()).then(blob => {
        const uniqueName = `historial_${Date.now()}.png`;
        const file = new File([blob], uniqueName, {type: blob.type || "image/png"});
        // Pasamos false para indicar que no debe re-guardarse en el historial
        handleFile(file, false);

        document.querySelectorAll(".gallery-item").forEach(i => i.classList.remove("selected"));
        div.classList.add("selected");
      });
    });
    grid.appendChild(div);
  });
}

(async () => {
  await migrateLegacyGalleryIfNeeded();
  await renderGallery();
})();

async function deleteFromGallery(hash){
  try { await dbDeleteImage(hash); } catch(e) { console.warn(e); }
  await renderGallery();
}

async function clearGallery(){
  if(!confirm("¿Vaciar todo el historial de imágenes de entrada? No se puede deshacer.")) return;
  try { await dbClearImages(); } catch(e) { console.warn(e); }
  await renderGallery();
  log("🗑️ Historial de imágenes vaciado.", "l-ok");
}
$("btnClearGallery").addEventListener("click", clearGallery);


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
      div.addEventListener("click", () => loadKrea2ImageAsInput(url, it.filename));
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

// Al cargar la página: si viene ?ref=filename, abrir el panel y cargar esa imagen
(function maybeLoadFromQuery(){
  const qs = new URLSearchParams(window.location.search);
  const ref = qs.get("ref");
  if(!ref) return;
  const filename = decodeURIComponent(ref);
  // Asegurar que el panel está abierto
  const h = $("krea2RecentToggle");
  const b = $("krea2RecentBody");
  if(h && b && !h.classList.contains("open")){
    h.classList.add("open");
    b.classList.add("open");
    const arr = h.querySelector(".arrow"); if(arr) arr.textContent = "▼";
  }
  // Esperar a que el grid cargue y luego hacer click en el item
  loadKrea2Recent().then(() => {
    const grid = $("krea2RecentGrid");
    const items = grid.querySelectorAll(".gallery-item");
    let found = null;
    for(const it of items){
      if(it.querySelector("img")?.src.includes(encodeURIComponent(filename))){
        found = it; break;
      }
    }
    if(found){
      found.click();
    } else {
      log("⚠️ La imagen '"+filename+"' no está en la lista de Krea2 recientes.", "l-err");
    }
  });
})();


// --- GESTIÓN DE LORAS CON MEMORIA ---
function saveLoraState() { localStorage.setItem('ltxv_loras_state', JSON.stringify(loras)); }
function loadLoraState() {
  const saved = localStorage.getItem('ltxv_loras_state');
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
function loadModels(){
  const sel = $("modelSelect");
  if(!sel) return;
  sel.innerHTML = "";
  for(const m of AVAILABLE_MODELS){
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    if(m === "10Eros_v1.3_fp8mixed_learned.safetensors") opt.selected = true;
    sel.appendChild(opt);
  }
}
loadModels();
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

// --- EXTRACCIÓN Y APLICACIÓN DE WORKFLOW DESDE METADATOS PNG/MP4 ---
function extractWorkflowFromImage(url){
  fetch(url).then(r => r.arrayBuffer()).then(buf => {
    const bytes = new Uint8Array(buf);
    if(bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return;
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

function applyWorkflow(workflow, opts={}){
  const applied = [];
  const missing = [];
  const setApplied = (label) => applied.push(label);
  const setMissing = (label) => missing.push(label);

  // Buscar nodos por class_type (más robusto que por ID, que cambia entre workflows)
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

  // Prompt: buscar CLIPTextEncode cuyo text no sea un negative prompt.
  // El negative prompt suele empezar con palabras negativas y ser corto-mediano.
  // El positivo es narrativo y largo.
  const textEncoders = findAllByClass("CLIPTextEncode");
  function isNegativePrompt(t){
    // Empieza con palabras negativas típicas O es corto con muchas negativas
    const startsNeg = /^\s*(blurry|low quality|distorted|ugly|watermark|worst|overexposed|underexposed|grainy|noise|out of focus|deformed|jpeg|nsfw|mutation|cropped)/i.test(t);
    const manyNegWords = (t.match(/\b(blurry|low quality|distorted|ugly|watermark|worst|overexposed|underexposed|grainy|deformed|mutation|artifacts)\b/gi) || []).length >= 3;
    return startsNeg || manyNegWords;
  }
  let promptSet = false;
  for(const {node} of textEncoders){
    const t = (node.inputs && node.inputs.text) || "";
    if(!isNegativePrompt(t) && t.length > 50){
      $("prompt").value = t;
      promptSet = true; break;
    }
  }
  // Si no encontramos, usar el CLIPTextEncode con texto más largo
  if(!promptSet && textEncoders.length){
    let longest = textEncoders[0].node;
    for(const {node} of textEncoders){
      if((node.inputs?.text || "").length > (longest.inputs?.text || "").length) longest = node;
    }
    $("prompt").value = longest.inputs?.text || "";
    promptSet = !!$("prompt").value;
  }
  if(promptSet) setApplied("prompt"); else setMissing("prompt");

  // Modelo: CheckpointLoaderSimple con ckpt_name
  let modelSet = false;
  const checkpoint = findByClass("CheckpointLoaderSimple");
  if(checkpoint && checkpoint.inputs && checkpoint.inputs.ckpt_name){
    const name = checkpoint.inputs.ckpt_name;
    const sel = $("modelSelect");
    if(sel){
      for(const opt of sel.options){
        if(opt.value === name || name.endsWith("/"+opt.value) || opt.value === name.replace("ltxv/","") || opt.value === name.replace("Stable-Diffusion/","")){
          opt.selected = true; modelSet = true; break;
        }
      }
    }
  }
  if(modelSet) setApplied("modelo"); else setMissing("modelo");

  // Resolución, frames, fidelidad y movimiento: leer directamente los mxSlider por título.
  function parseFrameValue(v){
    if(typeof v === "number") return v;
    if(Array.isArray(v)) return null;
    if(typeof v === "string") return parseFloat(v) || null;
    return null;
  }
  function parseMxValue(node){
    if(!node || !node.inputs) return null;
    if(node.inputs.Xi != null) return parseFrameValue(node.inputs.Xi);
    if(node.inputs.Xf != null) return parseFrameValue(node.inputs.Xf);
    if(node.inputs.value != null) return parseFrameValue(node.inputs.value);
    return null;
  }
  function applyAspectRatio(w, h){
    if(!w || !h) return;
    currentAspectRatio = w / h;
    const mp = (w * h) / 1_000_000;
    const clamped = Math.min(Math.max(mp, parseFloat($("mpSlider").min)||0.3), parseFloat($("mpSlider").max)||2.0);
    $("mpSlider").value = clamped.toFixed(2);
    $("mpVal").textContent = $("mpSlider").value;
  }

  const mxSlidersAll = findAllByClass("mxSlider");
  let w = null, h = null, len = null, fid = null, mot = null;
  for(const {node} of mxSlidersAll){
    const title = (node._meta?.title || "").toLowerCase();
    const val = parseMxValue(node);
    if(val == null) continue;
    if(/width/i.test(title) && !/mask|crop/i.test(title)) w = val;
    else if(/height/i.test(title) && !/mask|crop/i.test(title)) h = val;
    else if(/length|frame/i.test(title) && !/rate/i.test(title)) len = val;
    else if(/fidelity|conditioning/i.test(title)) fid = val;
    else if(/motion|preprocess/i.test(title)) mot = val;
  }
  // Fallback a EmptyLTXVLatentVideo solo si no encontramos por título
  if(w == null || h == null){
    const emptyLatent = findByClass("EmptyLTXVLatentVideo");
    if(emptyLatent && emptyLatent.inputs){
      const ew = parseFrameValue(emptyLatent.inputs.width);
      const eh = parseFrameValue(emptyLatent.inputs.height);
      if(ew != null) w = ew;
      if(eh != null) h = eh;
      if(len == null) len = parseFrameValue(emptyLatent.inputs.length);
    }
  }
  if(w != null){ $("width").value = Math.round(w); setApplied("anchura"); } else setMissing("anchura");
  if(h != null){ $("height").value = Math.round(h); setApplied("altura"); } else setMissing("altura");
  if(len != null){ $("frames").value = Math.round(len); setApplied("frames"); } else setMissing("frames");
  if(fid != null){ $("fidelitySlider").value = fid; $("fidelityVal").textContent = parseFloat(fid).toFixed(2); setApplied("fidelidad"); } else setMissing("fidelidad");
  if(mot != null){ $("motionSlider").value = mot; $("motionVal").textContent = parseFloat(mot).toFixed(1); setApplied("movimiento"); } else setMissing("movimiento");
  if(w && h) applyAspectRatio(w, h);
  updateDuration();

  // LoRAs: Power Lora Loader (rgthree)
  const powerLora = findByClass("Power Lora Loader (rgthree)");
  if(powerLora && powerLora.inputs){
    for(let i = 0; i < 3; i++){
      const slot = ["lora_1","lora_2","lora_3"][i];
      const lora = powerLora.inputs[slot];
      if(!lora) continue;
      const loraName = lora.lora || "";
      const strength = lora.strength;
      if(loraName && loraName !== "None"){
        loras[i].lora = loraName.replace(/^ltxv\//, "");
        loras[i].on = lora.on === true;
        loras[i].strength = (strength != null) ? strength : 0;
      } else {
        loras[i].on = false;
      }
    }
    renderLoras();
    saveLoraState();
    setApplied("LoRAs");
  } else {
    setMissing("LoRAs");
  }

  // Semilla
  let seedVal = null;
  const seedNode = findByClass("Seed (rgthree)");
  if(seedNode){
    if(typeof seedNode.inputs?.seed === "number") seedVal = seedNode.inputs.seed;
    else if(seedNode.widgets_values && typeof seedNode.widgets_values[0] === "number") seedVal = seedNode.widgets_values[0];
  }
  if(seedVal == null){
    const randomNoise = findByClass("RandomNoise");
    if(randomNoise && typeof randomNoise.inputs?.noise_seed === "number"){
      seedVal = randomNoise.inputs.noise_seed;
    }
  }
  if(seedVal != null && seedVal >= 0){
    $("seedVal").value = seedVal;
    $("segFixed").classList.add("on");
    $("segRandom").classList.remove("on");
    $("seedVal").disabled = false;
    setApplied("semilla");
  } else {
    setMissing("semilla");
  }

  const appliedMsg = applied.length ? "✅ Usados: " + applied.join(", ") : "";
  const missingMsg = missing.length ? "⚠️ Sin coincidencia: " + missing.join(", ") : "";
  if(opts.silent) return { applied, missing };
  if(appliedMsg) log(appliedMsg, "l-ok");
  if(missingMsg) log(missingMsg, "l-warn");
  if(applied.length) log("📋 Parámetros restaurados desde metadatos.", "l-ok");
  else log("ℹ️ No se encontraron parámetros aplicables en los metadatos.", "l-warn");

  return { applied, missing };
}

// --- RESTO DEL CÓDIGO ---
$("segRandom").addEventListener("click",()=>{seedMode="random";$("segRandom").classList.add("on");$("segFixed").classList.remove("on");$("seedVal").disabled=true;});
$("segFixed").addEventListener("click",()=>{seedMode="fixed";$("segFixed").classList.add("on");$("segRandom").classList.remove("on");$("seedVal").disabled=false;});
$("fidelitySlider").addEventListener("input",(e)=>{$("fidelityVal").textContent=parseFloat(e.target.value).toFixed(2);});
$("motionSlider").addEventListener("input",(e)=>{$("motionVal").textContent=parseFloat(e.target.value).toFixed(1);});
$("mpSlider").addEventListener("input",()=>{recalcResolution();});
$("frames").addEventListener("input",updateDuration);
function updateDuration(){const f=parseInt($("frames").value||"0",10);$("durHint").textContent=`(${f}/24fps=${(f/24).toFixed(1)}s)`;}

const dz=$("dropzone"),fileInput=$("fileInput");
dz.addEventListener("click",()=>fileInput.click());
["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("drag");}));
["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("drag");}));
dz.addEventListener("drop",e=>{if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);});
fileInput.addEventListener("change",e=>{if(e.target.files[0])handleFile(e.target.files[0]);});

// FUNCIÓN DE CARGA DE IMAGEN / VÍDEO CORREGIDA Y ROBUSTA
function handleFile(f, shouldSaveToGallery = true){
  uploadedImage = null;
  localFile = null;

  const isVideo = f.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/i.test(f.name);

  if(isVideo){
    handleVideoFile(f, shouldSaveToGallery);
    return;
  }

  const uniqueName = `temp_${Date.now()}_${f.name}`;
  localFile = new File([f], uniqueName, {type: f.type});

  // Ocultar selector de frames si se cargó imagen
  const frameSel = $("frameSelector");
  if(frameSel) frameSel.style.display = "none";

  const reader = new FileReader();
  reader.onload = (e) => {
    // Solo guardar si es una carga nueva (drag/drop o input), no si es selección de galería
    if (shouldSaveToGallery) {
        addToGallery(e.target.result);
    }

    const ph = dz.querySelector(".ph");
    if(ph) ph.remove();

    let img = dz.querySelector("img");
    if(!img){
      img = document.createElement("img");
      dz.appendChild(img);
    }
    img.onload = () => updateDzInfo(img.naturalWidth, img.naturalHeight);
    img.src = e.target.result;

    log(`🖼️ Imagen cargada: ${f.name}`, "l-ok");
  };
  reader.readAsDataURL(f);
}

let currentVideoFile = null;

// Cargar vídeo: mostrar selector de 1er/último frame y usar el elegido como imagen de entrada
function handleVideoFile(file, shouldSaveToGallery = true){
  currentVideoFile = file;
  const videoUrl = URL.createObjectURL(file);
  const vid = document.createElement("video");
  vid.muted = true;
  vid.playsInline = true;
  vid.crossOrigin = "anonymous";
  vid.preload = "auto";

  // Leer metadatos del vídeo directamente desde el File
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
      } catch(err) { callback(err); }
    }, { once: true });
  }

  function setFrameAsInput(dataUrl, frameLabel){
    fetch(dataUrl).then(r => r.blob()).then(blob => {
      const frameName = `temp_${Date.now()}_${file.name.replace(/\.[^.]+$/, '')}_${frameLabel}.jpg`;
      localFile = new File([blob], frameName, {type: "image/jpeg"});

      const ph = dz.querySelector(".ph");
      if(ph) ph.remove();
      let img = dz.querySelector("img");
      if(!img){ img = document.createElement("img"); dz.appendChild(img); }
      img.onload = () => updateDzInfo(img.naturalWidth, img.naturalHeight);
      img.src = dataUrl;

      if(shouldSaveToGallery) addToGallery(dataUrl);
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
    useFirst(); // por defecto 1er frame
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

async function ensureImageUploaded(){
  if(!localFile) throw new Error("selecciona imagen");
  setRun("busy","subiendo...");
  const fd=new FormData();
  // Usar el nombre original sin el prefijo temporal para que ComfyUI lo guarde limpio
  fd.append("image", localFile, localFile.name.replace(/^temp_\d+_/, '')); 
  fd.append("overwrite","true");
  const r=await fetch(server()+"/upload/image",{method:"POST",body:fd});
  if(!r.ok) throw new Error("fallo subida");
  const data=await r.json();
  uploadedImage={name:data.name, subfolder:data.subfolder||"", type:data.type||"input"};
  log("Imagen subida al servidor: "+uploadedImage.name,"l-ok");
}

function buildGraph(firstPassOnly){
  const g=JSON.parse(JSON.stringify(BASE_GRAPH));
  if(uploadedImage) g[N.IMAGE].inputs.image = uploadedImage.name;
  if($("prompt").value.trim())g[N.PROMPT].inputs.text=$("prompt").value.trim();
  g[N.SEED].inputs.seed=(seedMode==="random")?-1:parseInt($("seedVal").value,10);
  const w=parseInt($("width").value,10),h=parseInt($("height").value,10);
  g[N.WIDTH].inputs.Xi=w;g[N.WIDTH].inputs.Xf=w;g[N.HEIGHT].inputs.Xi=h;g[N.HEIGHT].inputs.Xf=h;
  const frames=parseInt($("frames").value,10);g[N.FRAMES].inputs.Xi=frames;g[N.FRAMES].inputs.Xf=frames;
  g[N.FIDELITY].inputs.Xi=parseFloat($("fidelitySlider").value);g[N.FIDELITY].inputs.Xf=g[N.FIDELITY].inputs.Xi;
  g[N.MOTION].inputs.Xi=parseFloat($("motionSlider").value);g[N.MOTION].inputs.Xf=g[N.MOTION].inputs.Xi;
  g[N.LORA].inputs.lora_1={on:loras[0].on,lora:loras[0].lora,strength:loras[0].strength};
  g[N.LORA].inputs.lora_2={on:loras[1].on,lora:loras[1].lora,strength:loras[1].strength};
  g[N.LORA].inputs.lora_3={on:loras[2].on,lora:loras[2].lora,strength:loras[2].strength};
  if(g[N.CHECKPOINT] && g[N.CHECKPOINT].inputs) g[N.CHECKPOINT].inputs.ckpt_name = $("modelSelect").value;
  if(firstPassOnly){delete g[N.FINAL_SAVE]; delete g[N.PURGE_VRAM];}
  return g;
}

function findMedia(nodeOutput){
  for(const k of["videos","gifs","images"]) if(nodeOutput[k]?.length) return nodeOutput[k][nodeOutput[k].length-1];
  return null;
}

function showVideo(slot, media, options={}){
  if(!media) return;
  const url=`${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder||"")}&type=${encodeURIComponent(media.type||"output")}`;
  const v=$("video"+slot), empty=$("empty"+slot), badge=$("badge"+slot), btn=$("btnLoadMeta"+slot), dl=$("btnDownload"+slot);
  v.src=url; v.style.display="block"; empty.style.display="none";
  if(btn) btn.disabled = false;
  if(dl) dl.style.display="inline-flex";
  currentMedia[slot] = { filename: media.filename, subfolder: media.subfolder||"", type: media.type||"output" };
  // Etiqueta de variante + tipo encima del vídeo
  if(badge){
    const varIndex = options.variantIndex != null ? options.variantIndex : (currentBatchIndex + 1);
    const typeLabel = slot === 1 ? "1er" : "final";
    badge.textContent = `Var ${varIndex} · ${typeLabel}`;
  }
  // Mostrar resolución real del vídeo cuando cargue los metadatos
  const resEl=$("res"+slot);
  if(resEl){
    resEl.textContent="";
    const onMeta=()=>{
      const vw=v.videoWidth||0, vh=v.videoHeight||0;
      if(vw && vh){
        resEl.textContent=`${vw}×${vh} · ${aspectRatioStr(vw,vh)}`;
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

// --- Botones "Recuperar workflow" en los reproductores principales ---
function setupMetaButton(slot){
  const btn = $("btnLoadMeta"+slot);
  if(!btn) return;
  btn.addEventListener("click", async () => {
    const media = currentMedia[slot];
    if(!media) { log("⚠️ No hay vídeo cargado en esta ventana", "l-err"); return; }
    const url = `${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder)}&type=${encodeURIComponent(media.type)}`;
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.textContent = "⏳";
    try {
      const workflow = await extractWorkflowFromMP4(url);
      if(workflow) {
        applyWorkflow(workflow);
        log(`📋 Workflow del slot ${slot} restaurado desde ${media.filename}`, "l-ok");
      } else {
        log("ℹ️ Este vídeo no contiene metadatos de workflow.", "l-info");
      }
    } catch(err){
      log("❌ Error leyendo metadatos del vídeo: "+err.message, "l-err");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  });
}
setupMetaButton(1);
setupMetaButton(2);

// --- Botones "Descargar" en los reproductores principales ---
function setupDownloadButton(slot){
  const btn = $("btnDownload"+slot);
  if(!btn) return;
  btn.addEventListener("click", async () => {
    const media = currentMedia[slot];
    if(!media) { log("⚠️ No hay vídeo cargado en esta ventana", "l-err"); return; }
    const url = `${server()}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder)}&type=${encodeURIComponent(media.type)}`;
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.textContent = "⏳";
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
      log("❌ Error descargando vídeo: "+err.message, "l-err");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  });
}
setupDownloadButton(1);
setupDownloadButton(2);

// FUNCIÓN PANTALLA COMPLETA ROBUSTA
async function runSingleGeneration(index) {
    try {
        // --- Determinar qué grafo enviar según el paso ---
        // generationStep:
        //   0 = modo "Solo 1er pase" (firstPassOnly=true) — solo paso 1, no continúa
        //   1 = paso 1 del "Generar completo" — continúa a paso 2 al acabar
        //   2 = paso 2 del "Generar completo" — grafo completo (2º pase)
        const isStep2 = (generationStep === 2);
        // firstPassOnly=true => grafo sin FINAL_SAVE (paso 1)
        // firstPassOnly=false => grafo completo (paso 2 del completo, o modo "completo" directo)
        const firstPassOnly = isStep2 ? false : true;
        const graph = buildGraph(firstPassOnly);
        // Seed(rgthree) con -1 solo se randomiza en el editor de ComfyUI (JS del nodo);
        // por la API llega tal cual. Generamos aquí la semilla real para cada variante.
        // En el paso 2 del completo, hay que reusar la misma semilla del paso 1.
        let seedUsed;
        if(isStep2 && firstPromptId && pendingSeeds[firstPromptId] != null){
            seedUsed = pendingSeeds[firstPromptId];
        } else {
            seedUsed = (batchSeedMode === "random") ? randomSeed() : parseInt($("seedVal").value, 10);
        }
        graph[N.SEED].inputs.seed = seedUsed;

        const stepLabel = isStep2 ? "paso 2/2 (2º pase)" : (generationStep === 1 ? "paso 1/2 (1er pase)" : `variante ${index + 1}/${totalBatchSize}`);
        log(`🚀 Procesando ${stepLabel} (seed ${seedUsed})...`);
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
        // Registrar el paso de este prompt
        promptSteps[data.prompt_id] = isStep2 ? "2" : "1";
        if(!isStep2 && generationStep === 1){
            // Paso 1 del "completo": guardar el prompt_id para el paso 2
            firstPromptId = data.prompt_id;
        }
        // Cronómetro en el slot correspondiente: paso 1 -> slot 1, paso 2 -> slot 2
        startTimer(data.prompt_id, isStep2 ? 2 : 1);
        pollFallback(data.prompt_id); // respaldo por si el WS no avisa
    } catch(err) {
        // Si el envío falla (p.ej. validación del grafo), no se queda colgado:
        // se registra el fallo y se pasa a la siguiente variante del batch.
        log(`❌ No se pudo encolar: ${err.message}`, "l-err");
        if(generationStep === 1){
            // Fallo en paso 1 del completo: no continuamos al paso 2
            generationStep = 0;
        }
        currentBatchIndex++;
        processNextBatch();
    }
}

async function queueAndWait(firstPassOnly){
  connectSocket();
  await ensureImageUploaded();
  totalBatchSize = parseInt($("batchSize").value || "1", 10);
  currentBatchIndex = 0;
  batchSeedMode = seedMode; // capturado aquí: el toggle en vivo puede cambiar tras cada variante
  window.currentBatchMode = firstPassOnly;
  // Inicializar el estado de pasos del modo "Generar completo"
  // generationStep: 1 = paso 1 en curso (continuará a paso 2); 0 = "Solo 1er pase" (no hay paso 2)
  generationStep = firstPassOnly ? 0 : 1;
  firstPromptId = null;
  setRun("busy", `Iniciando batch de ${totalBatchSize} variantes...`);
  $("btnFirstPass").disabled=true;
  $("btnFull").disabled=true;
  enableStopButtons(true);
  runSingleGeneration(0);
}

async function runGeneration(fp){
  try{ await queueAndWait(fp); }
  catch(err){ setRun("bad","error");log("Error: "+err.message,"l-err"); $("btnFirstPass").disabled=false;$("btnFull").disabled=false; }
}

// --- PROMPT ENHANCER (Ollama) ---
const ENHANCER_DEFAULT_PROMPTS = {
  text: {
    A: { name: "Estilo A (cinematográfico)", prompt: "You are an expert in prompts for LTXV video generation. Transform the user's idea into a detailed cinematic prompt. Include: shot type, lighting, camera movement, atmosphere, colors, and visual style. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt, no explanations or prefaces." },
    B: { name: "Estilo B (narrativo)", prompt: "You are a creative assistant specialized in visual storytelling. Take the user's idea and turn it into an evocative prompt that captures the essence of the scene. Use descriptive, poetic language. Focus on atmosphere, emotions, and the story the image tells. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
  },
  vision: {
    A: { name: "Estilo A (descriptivo)", prompt: "You are an expert at describing images for video generation. Analyze the provided image and generate a detailed prompt describing: composition, subjects, background, lighting, colors, motion, and atmosphere. The prompt must be suitable for a text-to-video model. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
    B: { name: "Estilo B (cinematográfico)", prompt: "You are a digital cinematographer. Look at the image and turn it into a cinematic description. Describe how the camera would move, how lighting would evolve, what action would unfold, and how the scene would change over time. Think in terms of footage, not a still photo. The user may write in any language; you must ALWAYS respond in English with ONLY the enhanced prompt." },
  },
};

function loadSysPrompts(){
  const saved = localStorage.getItem("ltxv_enhancer_sysprompts");
  if(saved){
    try { return JSON.parse(saved); } catch(e) {}
  }
  return JSON.parse(JSON.stringify(ENHANCER_DEFAULT_PROMPTS));
}

function saveSysPrompts(data){
  localStorage.setItem("ltxv_enhancer_sysprompts", JSON.stringify(data));
}

function populateStyleSelect(data, mode){
  const sel = $("enhancerStyle");
  sel.innerHTML = "";
  const styles = data[mode] || {};
  for(const key of Object.keys(styles).sort()){
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = styles[key].name || key;
    sel.appendChild(opt);
  }
}

function getCurrentSysPrompt(data, mode, styleKey){
  const styles = data[mode] || {};
  const entry = styles[styleKey];
  return entry ? entry.prompt : "";
}

// Collapsible toggle
$("enhancerToggle").addEventListener("click", () => {
  const h = $("enhancerToggle");
  const b = $("enhancerBody");
  h.classList.toggle("open");
  b.classList.toggle("open");
  const arrow = h.querySelector(".arrow");
  arrow.textContent = h.classList.contains("open") ? "▼" : "▶";
});

// Poblar modelos desde Ollama
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
      opt.value = m.name;
      opt.textContent = m.name;
      sel.appendChild(opt);
    }
    // Seleccionar por defecto Qwythos-9B si está disponible
    const defaultModel = models.find(m => m.name.includes("Qwythos") || m.name.includes("qwythos"));
    if(defaultModel) sel.value = defaultModel.name;
  } catch(e) {
    sel.innerHTML = '<option value="">Ollama no disponible</option>';
    console.warn("No se pudieron cargar modelos:", e.message);
  }
}

// Recargar estilos al cambiar modo
$("enhancerMode").addEventListener("change", () => {
  const data = loadSysPrompts();
  populateStyleSelect(data, $("enhancerMode").value);
});

// Mejorar prompt
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
  if(mode === "vision" && localFile){
    // Leer la imagen cargada como base64
    try {
      const b64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          const base64 = dataUrl.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(localFile);
      });
      payload.images = [b64];
    } catch(e) {
      log("⚠️ No se pudo leer la imagen: "+e.message, "l-err");
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
    log("✨ Prompt mejorado ("+model+", "+mode+", "+styleKey+")", "l-ok");
  } catch(e) {
    log("❌ Error al mejorar: "+e.message, "l-err");
    $("enhancerOutput").value = "Error: "+e.message;
  } finally {
    $("btnEnhance").disabled = false;
    $("btnEnhance").textContent = "Mejorar prompt";
  }
});

// Guardar en biblioteca
$("btnSaveEnhanced").addEventListener("click", () => {
  const text = $("enhancerOutput").value.trim();
  if(!text){ log("⚠️ No hay resultado que guardar", "l-err"); return; }
  const name = prompt("Nombre para este prompt mejorado:");
  if(!name) return;
  const saved = JSON.parse(localStorage.getItem('ltxv_prompts') || '{}');
  saved[name] = text;
  localStorage.setItem('ltxv_prompts', JSON.stringify(saved));
  loadPrompts();
  log(`Prompt "${name}" guardado desde enhancer.`, "l-ok");
});

// --- Editor de system prompts ---
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
  // Conectar botones de eliminar
  container.querySelectorAll(".spr-del").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      delete sysPromptEditData[mode][key];
      renderSysPromptEditor();
    });
  });
}

// --- MODAL: Editor de system prompts (crear ANTES de los listeners que lo usan) ---
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

// Listeners del modal
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
// Tabs del modal
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
  // Activar pestaña texto (el modal ya existe en el DOM)
  const tabs = document.querySelectorAll(".modal-tab");
  tabs.forEach(t => t.classList.remove("active"));
  const textTab = document.querySelector('.modal-tab[data-tab="text"]');
  if(textTab) textTab.classList.add("active");
  $("sysPromptModal").classList.add("open");
});

// Tabs del modal (se adjuntan después de crear el modal abajo)

// Inicializar enhancer
(async () => {
  await loadEnhancerModels();
  const data = loadSysPrompts();
  populateStyleSelect(data, $("enhancerMode").value);
})();

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
  } catch(e) { /* si falla, igual limpiamos local */ }
  discardTimer(pid);
  delete pendingSeeds[pid];
  delete promptSteps[pid];
  handledPrompts.add(pid);
  // Si se cancela el paso 1 del completo, no continuar al paso 2
  if(generationStep === 1){
    generationStep = 0;
    if(firstPromptId) handledPrompts.add(firstPromptId);
  }
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
  } catch(e) { /* si falla, igual limpiamos local */ }
  // Marcar como "handled" todos los prompts pendientes antes de limpiarlos, así
  // si el backend sigue ejecutando una generación cancelada y luego emite
  // execution_success, handlePromptDone la descarta en lugar de mezclarla
  // con la siguiente generación.
  for(const pid of Object.keys(pendingSeeds)) handledPrompts.add(pid);
  if(currentPromptId) handledPrompts.add(currentPromptId);
  if(firstPromptId) handledPrompts.add(firstPromptId);
  for(const pid of Object.keys(pendingSeeds)) discardTimer(pid);
  pendingSeeds = {};
  promptSteps = {};
  processingPrompts.clear();
  currentPromptId = null;
  firstPromptId = null;
  generationStep = 0;
  currentBatchIndex = totalBatchSize;
  enableStopButtons(false);
  $("btnFirstPass").disabled=false;
  $("btnFull").disabled=false;
  setRun("bad", "Detenido por usuario");
  log("🛑 Generación detenida.", "l-err");
}

$("btnStopVideo").addEventListener("click", stopCurrentVideo);
$("btnStopAll").addEventListener("click", stopAll);

$("btnFirstPass").addEventListener("click",()=>runGeneration(true));
$("btnFull").addEventListener("click",()=>runGeneration(false));
updateDuration();
</script>
</html>
'''

    final_html = html_template.replace("__GRAPH_JSON__", graph_json)
    final_html = final_html.replace("__MODEL_LIST__", model_js_array)
    final_html = final_html.replace("__LORA_LIST__", lora_js_array)

    with open(OUTPUT_HTML, 'w', encoding='utf-8') as f:
        f.write(final_html)
    
    print(f"✅ HTML generado con {len(lora_files)} LoRAs.")

if __name__ == "__main__":
    main()
