# Checklist de Revisión de Codebase

## 1. Corrección básica

- [ ] **Errores de sintaxis** o posibles errores en tiempo de ejecución.
- [ ] **Manejo de estados de error y edge cases** — entradas nulas, vacías, fuera de rango, concurrencia (race conditions, locks), timeouts.
- [ ] **Consistencia de tipos** — especialmente en Python sin type hints, o donde los tipos se asumen silenciosamente.
- [ ] **Gestión de recursos** — ficheros, conexiones, sockets, memoria: que siempre se liberen (context managers, finally, RAII).

## 2. Seguridad

- [ ] **Vulnerabilidades de seguridad** — inyección (SQL, shell, path traversal), deserialización insegura, credenciales hardcodeadas, permisos excesivos.
- [ ] **Validación y sanitización de inputs** — especialmente en APIs, CLI args o cualquier entrada externa.

## 3. Estructura y diseño

- [ ] **Código duplicado** que podría refactorizarse.
- [ ] **Código huérfano** — funciones, variables o importaciones no utilizadas.
- [ ] **Acoplamiento y cohesión** — módulos/clases con demasiadas responsabilidades (SRP), dependencias circulares, God objects.
- [ ] **Inyección de dependencias** — si las dependencias están hardcodeadas en lugar de ser configurables/testables.
- [ ] **Arquitectura** — estructura clara y adecuada para futuras implementaciones y modificaciones.

## 4. Calidad y testabilidad

- [ ] **Cobertura y calidad de tests** — qué queda sin testear, tests frágiles o acoplados a implementación, ausencia de mocks donde procede.
- [ ] **Buenas prácticas y eficiencia** — manejo de errores, complejidad algorítmica.

## 5. Mantenibilidad

- [ ] **Deuda técnica explícita** — TODOs, HACKs, workarounds sin ticket/contexto, código comentado sin razón documentada.
- [ ] **Documentación funcional** — no solo que existan docstrings, sino que sean precisos y no estén desactualizados respecto al código real.
- [ ] **Versionado y compatibilidad** — dependencias con versiones pinneadas o flotantes, APIs deprecated, compatibilidad entre versiones del lenguaje/runtime.
- [ ] **Mejoras de legibilidad** — formato, nombres, comentarios.

## 6. Rendimiento

- [ ] **Cuellos de botella obvios** — queries N+1, operaciones bloqueantes en el hilo principal, allocaciones innecesarias en bucles críticos.
- [ ] **Cacheo y memoización** — computaciones repetidas que podrían evitarse.

## 7. Observabilidad

- [ ] **Logging y trazabilidad** — información suficiente para debuggear en producción sin debugger, niveles de log apropiados, ausencia de prints de debug olvidados.
- [ ] **Métricas y alertas** — si el sistema expone señales suficientes para monitorizar su salud.

---

## Orden de prioridad recomendado

1. 🔴 Seguridad
2. 🔴 Corrección
3. 🟠 Acoplamiento
4. 🟠 Deuda técnica
5. 🟡 Rendimiento
6. 🟡 Observabilidad
