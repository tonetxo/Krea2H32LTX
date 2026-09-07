# Recompilar `spas_sage_attn` para RTX 5070 Ti (SM120)

> **Aviso:** esto es una guía, no una garantía. Recompilar extensiones CUDA puede fallar si el código fuente no está preparado para SM120. Haz una copia de seguridad del entorno o de `/home/tonetxo/SpargeAttn` antes de empezar.

## Contexto

- GPU: NVIDIA GeForce RTX 5070 Ti → arquitectura **SM120**.
- `spas_sage_attn` editable está en `/home/tonetxo/SpargeAttn`.
- El `setup.py` original solo declara arquitecturas hasta SM9.0, por lo que Sparse Sage falla en tu GPU.
- Para que `H3SparseAttentionAdvanced` con `backend: "Sparse Sage"` funcione, hace falta compilar `spas_sage_attn` para SM120.

## Pre-requisitos

1. Estar dentro del venv de ComfyUI:

```bash
cd /home/tonetxo/SwarmUI/dlbackend/ComfyUI
source venv/bin/activate
```

2. Tener CUDA Toolkit 12.8 o superior con `nvcc` en el PATH:

```bash
nvcc -V
```

3. Tener `torch` con soporte CUDA 12.x (cu128/cu132):

```bash
python -c "import torch; print(torch.__version__); print(torch.version.cuda)"
```

## Paso 1: Hacer una copia de seguridad

```bash
cd /home/tonetxo/SpargeAttn
cp setup.py setup.py.bak.$(date +%Y%m%d_%H%M%S)
cp -r csrc csrc.bak.$(date +%Y%m%d_%H%M%S)
```

## Paso 2: Añadir SM120 a `setup.py`

Edita `/home/tonetxo/SpargeAttn/setup.py` y cambia la línea:

```python
SUPPORTED_ARCHS = {"8.0", "8.6", "8.7", "8.9", "9.0"}
```

por:

```python
SUPPORTED_ARCHS = {"8.0", "8.6", "8.7", "8.9", "9.0", "12.0"}
```

> Nota: SM120 se escribe como `"12.0"` en este formato `major.minor`.

## Paso 3: Añadir la lógica de compilación para SM120

Busca la sección donde se añaden las `gencode`. Después de:

```python
if num == '90':
    num = '90a'
    HAS_SM90 = True
    CXX_FLAGS += ["-DHAS_SM90"]
if num == '80' or num == '86' or num == '87':
    SAGE2PP_ENABLED = False
```

añade un bloque similar para SM120:

```python
if num == '120':
    HAS_SM120 = True
    CXX_FLAGS += ["-DHAS_SM120"]
```

Y en la zona de `sources`, después de:

```python
if HAS_SM90:
    sources += ["csrc/qattn/qk_int_sv_f8_cuda_sm90.cu", ]
    sources += get_instantiations("csrc/qattn/instantiations_sm90")
```

añade:

```python
if HAS_SM120:
    # Si existe un kernel SM120 específico, úsalo. Si no, reutiliza el SM90 como fallback experimental.
    sources += ["csrc/qattn/qk_int_sv_f8_cuda_sm90.cu"]
    sources += get_instantiations("csrc/qattn/instantiations_sm90")
```

> **Importante:** esto asume que el kernel SM90 puede servir como fallback en SM120. Si no compila o da errores de runtime, haría falta un kernel nativo SM120, lo cual requiere modificar los templates CUDA de SpargeAttn (fuera del alcance de esta guía).

## Paso 4: Forzar el target de arquitectura

Como PyTorch no siempre detecta SM120 automáticamente, fuerza la variable de entorno:

```bash
export TORCH_CUDA_ARCH_LIST="12.0"
# o, para compatibilidad PTX:
export TORCH_CUDA_ARCH_LIST="12.0+PTX"
```

## Paso 5: Desinstalar la versión actual y reconstruir

```bash
cd /home/tonetxo/SpargeAttn
pip uninstall spas_sage_attn -y

# Limpia builds anteriores
rm -rf build dist *.egg-info
find . -name "*.so" -delete
find . -name "*.o" -delete
find . -type d -name "__pycache__" -exec rm -rf {} +

# Recompila en modo editable
python setup.py develop
```

O, si prefieres pip editable:

```bash
pip install -e .
```

## Paso 6: Verificar

```bash
python -c "
import spas_sage_attn
print('spas_sage_attn import OK')
print(spas_sage_attn.__file__)
"
```

Y prueba `Sparse Sage` desde la WebUI de MiniMaxH3.

## Si falla la compilación

Posibles causas y soluciones:

| Síntoma | Solución |
|---------|----------|
| `arch=compute_120,code=sm_120` no soportado por NVCC | Necesitas CUDA 12.8+. SM120 requiere CUDA ≥ 12.8. |
| Errores PTX / asm en kernels SM90 | El kernel SM90 no es compatible con SM120. Necesitarías crear un kernel SM120 nativo o usar el modo PTX. |
| `undefined symbol` al importar | Limpia y recompila con `TORCH_CUDA_ARCH_LIST` correcto. |
| Runtime: `SparseSageError` | El kernel cargó pero no hay implementación para tu arquitectura. |

## Alternativa si la recompilación falla

Si no consigues compilar para SM120, en la WebUI puedes seguir usando:

- `Kitchen INT8` (recomendado, funciona ahora).
- `BF16 Triton`.
- `FP8 FlexAttention`.

Estos backends ya fueron probados y funcionan en tu RTX 5070 Ti.

## Nota final

Esta guía no modifica automáticamente `setup.py`. Debes editarlo a mano o con un script. Si quieres, puedo generar un parche (`diff`) listo para aplicar sobre tu `setup.py` actual.
