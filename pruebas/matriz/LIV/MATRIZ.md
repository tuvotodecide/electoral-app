# Matriz de pruebas — Módulo LIV (Frontend, electoral-app)

## Casos

| ID | Escenario | HU | Verifica | Resultado esperado | Prioridad |
|---|---|---|---|---|---|
| LIV-01 | Crear sesión devuelve código de sesión, código de un solo uso, secuencia y tiempo máximo | HU-01 | Frontend | Al pedir la verificación, la app obtiene del servidor la sesión (código de sesión, código de un solo uso, secuencia y tiempo máximo) y abre la cámara; si la respuesta viene incompleta, no avanza y muestra «Algo salió mal» | P0 |
| LIV-02 | La secuencia incluye siempre un gesto y no repite movimientos | HU-01 | Frontend | La app solo acepta secuencias con movimientos conocidos (izquierda, derecha, arriba, boca, ojos); ante un movimiento desconocido descarta la sesión | P1 |
| LIV-05 | El código de un solo uso no se puede reutilizar | HU-01 | Frontend | Si el servidor responde 409, la app informa «Esta verificación ya se envió. Empieza una nueva.» | P0 |
| LIV-07 | Evidencia sobre una sesión vencida | HU-01 | Frontend | Si la sesión venció (410 del servidor o tiempo agotado en el teléfono), la app no sigue capturando y muestra «Se acabó el tiempo. Empieza de nuevo.» con opción de reintentar | P0 |
| LIV-09 | deviceId inválido al crear la sesión | HU-01 | Frontend | La app genera un identificador de dispositivo hexadecimal de 32 caracteres, lo guarda en almacenamiento seguro y reutiliza el mismo en cada sesión | P1 |
| LIV-12 | Cantidad de fotos y posición de reto inválidas | HU-03 | Frontend | La app envía la foto de referencia más 3 fotos por cada reto de la sesión, cada una con su posición de reto, sin exceder las que el servidor admite | P1 |
| LIV-21 | Todas las comprobaciones pasan | HU-06 | Frontend | Con «accepted», la app entrega al registro la selfie verificada y el resultado firmado; la captura se inicia una sola vez | P0 |
| LIV-22 | Alguna comprobación falla | HU-06 | Frontend | Con «rejected», la app muestra el motivo en lenguaje claro (más de una persona, no de frente, sin movimiento, sin señal), no entrega selfie y permite reintentar | P0 |
| LIV-23 | El servicio de detección no responde | HU-06 | Frontend | Ante error de red o del servidor, la app avisa («Sin conexión…» o «Algo salió mal…») y nunca da la verificación por buena | P0 |
| LIV-26 | Bloqueo al llegar al límite de intentos | HU-06 | Frontend | Si el servidor responde 429 con espera, la app muestra cuánto esperar («Espera N segundos/minutos») y no abre la cámara | P0 |
| LIV-29 | Fin del tiempo de espera | HU-06 | Frontend | Si la pantalla se cierra durante la captura, la app deja de capturar y no envía evidencia ni notifica resultados | P2 |
| LIV-31 | Reintento idéntico por respuesta perdida | HU-06 | Frontend | Ante un corte o espera larga al enviar, la app reenvía el mismo cuerpo hasta 2 veces, avisa «Conexión lenta, reintentando…» y, si no se recupera, informa sin conexión | P1 |
| LIV-39 | Resultado aceptado incluye selfie y huella | HU-12 | Frontend | La app solo da por aceptado un resultado que trae selfie y resultado firmado; un «accepted» sin ellos se descarta como error | P0 |
| LIV-40 | Resultado rechazado no incluye selfie | HU-12 | Frontend | Un rechazo no trae selfie ni resultado firmado y la app no los usa | P0 |
| LIV-47 | Exigencia de la prueba de vida en /registry/analyze | HU-12 | Frontend | Al analizar el carnet, la app envía la selfie verificada y el resultado firmado; sin prueba de vida no envía resultado firmado | P0 |
| LIV-48 | Límite de tasa por IP en los endpoints públicos | HU-06 | Frontend | Ante un 429 sin tiempo de espera, la app muestra «Demasiados intentos seguidos. Espera un momento.»; sin permiso de cámara no pide sesión | P1 |

## Pruebas

| IT | Caso | Nivel | Tipo | Origen | Archivo | Resultado | Fecha | Evidencia |
|---|---|---|---|---|---|---|---|---|
| LIV-01 - Crear sesión devuelve código de sesión, código de un solo uso, secuencia y tiempo máximo · respuesta incompleta | LIV-01 | UNITARIA | Negativa | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-01 - Crear sesión devuelve código de sesión, código de un solo uso, secuencia y tiempo máximo · sesión válida | LIV-01 | UNITARIA | Positiva | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-02 - La secuencia incluye siempre un gesto y no repite movimientos · movimiento desconocido | LIV-02 | UNITARIA | Seguridad | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-05 - El código de un solo uso no se puede reutilizar · 409 indica usada | LIV-05 | UNITARIA | Negativa | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-07 - Evidencia sobre una sesión vencida · 410 indica vencida | LIV-07 | UNITARIA | Negativa | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-07 - Evidencia sobre una sesión vencida · avisa y permite reintentar | LIV-07 | UNITARIA | Negativa | Plan | __tests__/unit/components/liveness/LivenessSelfieStep.test.js | PENDIENTE |  |  |
| LIV-07 - Evidencia sobre una sesión vencida · no captura ni envía si la sesión ya venció | LIV-07 | UNITARIA | Borde | Plan | __tests__/unit/components/liveness/LivenessCapture.test.js | PENDIENTE |  |  |
| LIV-09 - deviceId inválido al crear la sesión · reutiliza el deviceId guardado | LIV-09 | UNITARIA | Positiva | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-09 - deviceId inválido al crear la sesión · se genera y guarda un deviceId hexadecimal | LIV-09 | UNITARIA | Positiva | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-12 - Cantidad de fotos y posición de reto inválidas · envía referencia y 3 fotos por reto con su posición | LIV-12 | UNITARIA | Positiva | Plan | __tests__/unit/components/liveness/LivenessCapture.test.js | PENDIENTE |  |  |
| LIV-21 - Todas las comprobaciones pasan · entrega la selfie verificada y el resultado firmado | LIV-21 | UNITARIA | Positiva | Plan | __tests__/unit/components/liveness/LivenessSelfieStep.test.js | PENDIENTE |  |  |
| LIV-21 - Todas las comprobaciones pasan · inicia la captura una sola vez aunque la cámara avise dos veces | LIV-21 | UNITARIA | Borde | Plan | __tests__/unit/components/liveness/LivenessCapture.test.js | PENDIENTE |  |  |
| LIV-22 - Alguna comprobación falla · cada motivo de rechazo tiene un mensaje propio | LIV-22 | UNITARIA | Negativa | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-22 - Alguna comprobación falla · muestra el motivo y no entrega selfie | LIV-22 | UNITARIA | Negativa | Plan | __tests__/unit/components/liveness/LivenessSelfieStep.test.js | PENDIENTE |  |  |
| LIV-23 - El servicio de detección no responde · error 500 se informa como servidor | LIV-23 | UNITARIA | Negativa | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-23 - El servicio de detección no responde · error al enviar se informa a la pantalla | LIV-23 | UNITARIA | Positiva | Plan | __tests__/unit/components/liveness/LivenessCapture.test.js | PENDIENTE |  |  |
| LIV-23 - El servicio de detección no responde · error desconocido se trata como servidor | LIV-23 | UNITARIA | Negativa | Plan | __tests__/unit/components/liveness/LivenessCapture.test.js | PENDIENTE |  |  |
| LIV-23 - El servicio de detección no responde · sin conexión | LIV-23 | UNITARIA | Negativa | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-26 - Bloqueo al llegar al límite de intentos · 429 con espera indica bloqueado | LIV-26 | UNITARIA | Negativa | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-26 - Bloqueo al llegar al límite de intentos · espera corta se muestra en segundos | LIV-26 | UNITARIA | Borde | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-26 - Bloqueo al llegar al límite de intentos · muestra la espera y no abre la cámara | LIV-26 | UNITARIA | Negativa | Plan | __tests__/unit/components/liveness/LivenessSelfieStep.test.js | PENDIENTE |  |  |
| LIV-29 - Fin del tiempo de espera · al desmontar no se llama a los callbacks | LIV-29 | UNITARIA | Borde | Plan | __tests__/unit/components/liveness/LivenessCapture.test.js | PENDIENTE |  |  |
| LIV-31 - Reintento idéntico por respuesta perdida · reenvía el mismo cuerpo tras un corte | LIV-31 | UNITARIA | Positiva | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-31 - Reintento idéntico por respuesta perdida · tras agotar los reintentos informa sin conexión | LIV-31 | UNITARIA | Negativa | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-39 - Resultado aceptado incluye selfie y huella · aceptado sin resultado firmado se descarta | LIV-39 | UNITARIA | Seguridad | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-39 - Resultado aceptado incluye selfie y huella · devuelve selfie y resultado firmado | LIV-39 | UNITARIA | Positiva | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-40 - Resultado rechazado no incluye selfie · rechazo sin selfie ni resultado firmado | LIV-40 | UNITARIA | Seguridad | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-47 - Exigencia de la prueba de vida en /registry/analyze · envía la selfie verificada y el resultado firmado | LIV-47 | UNITARIA | Positiva | Plan | __tests__/unit/containers/Auth/RegisterUser5.test.js | PENDIENTE |  |  |
| LIV-47 - Exigencia de la prueba de vida en /registry/analyze · sin prueba de vida no envía resultado firmado | LIV-47 | UNITARIA | Negativa | Plan | __tests__/unit/containers/Auth/RegisterUser5.test.js | PENDIENTE |  |  |
| LIV-48 - Límite de tasa por IP en los endpoints públicos · 429 sin espera indica límite | LIV-48 | UNITARIA | Negativa | Plan | __tests__/unit/api/liveness.test.js | PENDIENTE |  |  |
| LIV-48 - Límite de tasa por IP en los endpoints públicos · sin permiso de cámara no pide sesión | LIV-48 | UNITARIA | Negativa | Plan | __tests__/unit/components/liveness/LivenessSelfieStep.test.js | PENDIENTE |  |  |
