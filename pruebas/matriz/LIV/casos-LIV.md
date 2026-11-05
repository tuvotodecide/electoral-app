# Casos de prueba — Módulo LIV (Frontend, electoral-app)

Los IDs coinciden con los de `matriz-backend/casos-LIV.md`. Aquí solo están los casos que la app demuestra en la interfaz o en su cliente.

- **LIV-01** — Crear sesión devuelve código de sesión, código de un solo uso, secuencia y tiempo máximo
- **LIV-02** — La secuencia incluye siempre un gesto y no repite movimientos
- **LIV-05** — El código de un solo uso no se puede reutilizar
- **LIV-07** — Evidencia sobre una sesión vencida
- **LIV-09** — deviceId inválido al crear la sesión
- **LIV-12** — Cantidad de fotos y posición de reto inválidas
- **LIV-21** — Todas las comprobaciones pasan
- **LIV-22** — Alguna comprobación falla
- **LIV-23** — El servicio de detección no responde
- **LIV-26** — Bloqueo al llegar al límite de intentos
- **LIV-29** — Fin del tiempo de espera
- **LIV-31** — Reintento idéntico por respuesta perdida
- **LIV-39** — Resultado aceptado incluye selfie y huella
- **LIV-40** — Resultado rechazado no incluye selfie
- **LIV-47** — Exigencia de la prueba de vida en /registry/analyze
- **LIV-48** — Límite de tasa por IP en los endpoints públicos
