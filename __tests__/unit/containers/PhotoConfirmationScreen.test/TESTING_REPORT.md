# Informe de pruebas – `PhotoConfirmationScreen`

## Resumen rápido
- ✅ Las 4 suites unitarias específicas de `PhotoConfirmationScreen` finalizaron sin errores.
- 🧪 Se ejercitaron 9 casos cubriendo renderizado, estados/props, interacciones online/offline y gestión de fallos.
- ⏱️ Se controlaron efectos asíncronos con temporizadores falsos y `flushPromises` para validar la automatización del flujo de publicación.

## Ejecución
- **Comando:** `npm test -- PhotoConfirmationScreen`
- **Resultado:** 4 suites / 9 tests aprobados (0 fallos, 0 omitidos).
- **Duración aproximada:** ~2.5 s en entorno local.

## Casos cubiertos
| Archivo | Caso | Objetivo | Resultado |
| --- | --- | --- | --- |
| `PhotoConfirmationScreen.Renderize.test.js` | Render principal | Corroborar cabecera, CTA "Publicar y certificar" y mensaje contextual al testigo | ✅ |
|  | Fallback de número de mesa | Confirma que se usan valores alternos si `tableData` no lo provee | ✅ |
| `PhotoConfirmationScreen.StatesNprops.test.js` | Validación local fallida | Muestra `InfoModal` con errores devueltos por `validateBallotLocally` | ✅ |
|  | Duplicado detectado | Expone modal de duplicado al recibir `exists: true` | ✅ |
|  | Confirmación sin duplicado | Abre modal de certificación y mantiene datos del testigo | ✅ |
| `PhotoConfirmationScreen.ErrorManagement.test.js` | Fallo en subida a IPFS | Propaga error genérico y mensaje original en `InfoModal` | ✅ |
|  | Error 404 backend | Mapea mensaje específico a partir de `axios.post` para `validate-ballot-data` | ✅ |
| `PhotoConfirmationScreen.UserInteractions.test.js` | Modo offline | Persiste imagen local, encola publicación y navega a `OfflinePendingScreen` | ✅ |
|  | Flujo online completo | Ejecuta subida a IPFS, validación backend y operaciones sobre oracle / cola blockchain | ✅ |

## Mocks / Fixtures destacados
- `@env` se reemplaza en cada suite para definir `BACKEND_RESULT`, `BACKEND_SECRET` y `CHAIN`, evitando dependencias de variables reales.
- Servicios clave (`pinataService`, `executeOperation`, `oracleReads`, `oracleCalls`, `offlineQueue`, `persistLocalImage`, `validateBallotLocally`, `NetInfo`) cuentan con mocks controlados desde `testUtils.js`.
- `InfoModal`, componentes comunes (`CSafeAreaView`, `CText`, `UniversalHeader`) y vectores (`react-native-vector-icons`) usan implementaciones ligeras para simplificar la renderización.
- Se usan `jest.useFakeTimers()` + helpers (`runAutoVerification`, `flushPromises`) para coordinar efectos temporizados (`verifyAndUpload`).

## Observaciones y siguientes pasos
- Las pruebas sostienen los dos caminos principales (offline/online); si se añade lógica adicional (por ejemplo, progresos del paso a paso) puede requerirse ampliar `runAutoVerification`.
- Actualmente el test "online" valida las invocaciones críticas (IPFS, backend, oracle). Si se desea comprobar la navegación final a `SuccessScreen`, será necesario exponer mejor las dependencias del componente (por ejemplo, desacoplando el uso de `@env`).
- No se registraron advertencias de `act` ni timers colgantes tras las ejecuciones.
