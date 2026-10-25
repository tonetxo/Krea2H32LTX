"""POST /ltxweb/offload_vram — libera la VRAM conservando los modelos en RAM.

`/free {"unload_models": true}` llama a `unload_all_models()`, que con
DynamicVRAM hace `detach()` → `partially_unload_ram()`: tira también los pins
de RAM y la siguiente carga vuelve a leer los safetensors (mmap → disco si la
page cache ya los soltó). Aquí solo se vacía la residencia en VRAM.

Es una ruta y no un nodo a propósito: ejecutar cualquier prompt deja los
loaders del workflow anterior como generación vieja y la caché RAM_PRESSURE los
expulsa (`ram_inactive` ≈ toda la RAM), con lo que el modelo se libera igual.
Solo actúa con la cola vacía para no competir con el worker.
"""

import logging

from aiohttp import web

import comfy.model_management as mm
from server import PromptServer

log = logging.getLogger("LTXWebOffloadVRAM")


@PromptServer.instance.routes.post("/ltxweb/offload_vram")
async def offload_vram(request):
    if PromptServer.instance.prompt_queue.get_tasks_remaining() > 0:
        return web.json_response({"error": "cola ocupada"}, status=409)
    freed = 0
    legacy = []
    for m in mm.current_loaded_models:
        if m.model is None:
            continue
        if m.model.is_dynamic():
            freed += m.model.partially_unload(m.model.offload_device, 1e30)
        else:
            legacy.append(m)
    # ModelPatcher clásico: detach mueve los pesos a offload_device (RAM).
    for m in legacy:
        m.model_unload()
        mm.current_loaded_models.remove(m)
    mm.soft_empty_cache()
    log.info("VRAM liberada: %.2f GB dinámicos, %d modelos clásicos a RAM", freed / (1024 ** 3), len(legacy))
    return web.json_response({"freed_gb": round(freed / (1024 ** 3), 2), "legacy": len(legacy)})
