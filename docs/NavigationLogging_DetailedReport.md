# Informe detallado: Implementación de logging de navegación

Fecha: 17 de septiembre de 2025

## Resumen ejecutivo

Se implementó un sistema de logging de navegación en la aplicación React Native con las siguientes capacidades:

- Registro automático en consola (Metro) cuando cambia la pantalla activa.
- Extracción del path completo del stack de navegación.
- Logging condicional de parámetros de ruta y acciones de usuario.
- Hook reutilizable para registrar eventos y navegación desde componentes.
- Overlay visual opcional para mostrar la pantalla actual en la UI (solo en desarrollo).
- Configuración centralizada para activar/desactivar tipos de logs y visualización.

El objetivo es facilitar el debug de navegación, el rastreo de flujo de usuarios y la instrumentación para analytics.

---

## Archivos creados y modificados

Se crearon y modificaron los siguientes archivos en el repositorio:

Nuevos archivos:

- `src/config/navigationLogConfig.js` — Configuración central y utilidades de logging.
- `src/hooks/useNavigationLogger.js` — Hook para logging en componentes y helpers (logAction, logNavigation).
- `src/components/common/NavigationDebugOverlay.js` — Overlay de depuración visual (opcional).
- `docs/NavigationLogging.md` — Guia rápida de uso.
- `docs/NavigationLogging_DetailedReport.md` — Este informe.

Archivos modificados:

- `src/navigation/index.js` — Se agregó `onStateChange` en `NavigationContainer`, funciones auxiliares (`getRouteInfo`, `getStackPath`) y el uso de la configuración y el overlay.
- `src/container/Auth/CreatePin.js` — Ejemplo de uso del hook `useNavigationLogger` aplicado en la pantalla CreatePin.

---

## Estructura y conceptos implementados

1. Configuración central `navigationLogConfig.js`:

- Se definió un objeto `NavigationLogConfig` que controla:
  - `enabled`: permite activar/desactivar el sistema globalmente (por defecto `__DEV__`).
  - `logs`: banderas para tipos de logs (`stateChanges`, `componentMount`, `userActions`, `routeParams`, `stackPath`).
  - `visual`: control del overlay (`showOverlay`, `overlayPosition`).
  - `prefixes`: prefijos emoji/texto para cada tipo de log.

- Se exportó la función `navLog(type, message, data?)` para realizar logs respetando la configuración.

Snippet (resumen):

```javascript
export const NavigationLogConfig = {
  enabled: __DEV__,
  logs: { stateChanges: true, componentMount: true, userActions: true, routeParams: false, stackPath: true },
  visual: { showOverlay: false, overlayPosition: 'top-right' },
  prefixes: {...}
};

export const navLog = (type, message, data = null) => {
  if (!NavigationLogConfig.enabled || !NavigationLogConfig.logs[type]) return;
  const prefix = NavigationLogConfig.prefixes[type] || '[LOG]';
  console.log(prefix, message, data || '');
};
```

2. NavigationContainer: logging automático (`src/navigation/index.js`)

- Se utilizó el `navigationRef` (definido en `src/navigation/RootNavigation.js`) para poder consultar la ruta actual fuera de los componentes.
- Se agregó `onStateChange` al `NavigationContainer` para invocar `onNavigationStateChange` cada vez que cambie el estado de navegación.
- `getRouteInfo()` y `getStackPath(state)` fueron implementadas para obtener nombre de ruta, params y path completo.
- `onNavigationStateChange()` utiliza `navLog` para emitir logs configurados.

Fragmento central:

```javascript
const getRouteInfo = () => {
  if (navigationRef.isReady()) {
    const state = navigationRef.getRootState();
    const route = navigationRef.getCurrentRoute();
    return { routeName: route?.name || 'Unknown', routeParams: route?.params || {}, stackInfo: getStackPath(state) };
  }
  return { routeName: 'Not Ready', routeParams: {}, stackInfo: [] };
};

const onNavigationStateChange = () => {
  if (!NavigationLogConfig.enabled) return;
  const routeInfo = getRouteInfo();
  navLog('stateChanges', `Pantalla actual: ${routeInfo.routeName}`);
  if (NavigationLogConfig.logs.stackPath) navLog('stack', `Stack path: ${routeInfo.stackInfo.join(' -> ')}`);
  if (NavigationLogConfig.logs.routeParams && Object.keys(routeInfo.routeParams).length > 0) navLog('params', `Parámetros: ${routeInfo.routeName}`, routeInfo.routeParams);
  navLog('screen', routeInfo.routeName);
};

<NavigationContainer ref={navigationRef} onStateChange={onNavigationStateChange}> ... </NavigationContainer>
```

3. Hook `useNavigationLogger` (`src/hooks/useNavigationLogger.js`)

- Hook que devuelve `logAction`, `logNavigation`, y expone `route` y `navigation`.
- Registra mount/unmount del componente si está permitido por la configuración.
- `logAction` y `logNavigation` usan `navLog` y respetan `NavigationLogConfig`.

Snippet:

```javascript
export const useNavigationLogger = (screenName = null, logParams = false, logMount = true) => {
  const navigation = useNavigation();
  const route = useRoute();
  const currentScreenName = screenName || route.name;
  useEffect(() => {
    if (logMount && NavigationLogConfig.logs.componentMount) navLog('mount', `${currentScreenName} - Componente montado`);
    return () => { if (NavigationLogConfig.logs.componentMount) navLog('unmount', `${currentScreenName} - Componente desmontado`); };
  }, []);
  const logAction = (action, data = null) => { if (NavigationLogConfig.logs.userActions) navLog('action', `${currentScreenName} - ${action}`, data); };
  const logNavigation = (targetScreen, params = null) => { if (NavigationLogConfig.logs.userActions) navLog('navigate', `${currentScreenName} -> ${targetScreen}`, params); };
  return { currentScreenName, logAction, logNavigation, route, navigation };
};
```

4. Overlay visual (`src/components/common/NavigationDebugOverlay.js`)

- Componente que usa `useNavigationState` para mostrar la ruta actual en pantalla.
- Renderizado condicionado por `NavigationLogConfig.visual.showOverlay`.
- Diseñado para usarse en desarrollo; no se muestra cuando `__DEV__` es false.

Snippet:

```javascript
export default function NavigationDebugOverlay({ position = 'top-right' }) {
  const routes = useNavigationState(state => state?.routes);
  const index = useNavigationState(state => state?.index);
  const currentRoute = routes?.[index];
  if (!__DEV__ || !currentRoute) return null;
  return (<View style={[styles.overlay, positionStyles[position]]}><Text>📱 {currentRoute.name}</Text></View>);
}
```

---

## Cómo probar y verificar

1. Correr la app en modo desarrollo y abrir la consola de Metro:

```bash
npx react-native run-android
# o
npx react-native run-ios
```

- Al navegar entre pantallas se observarán logs similares a:

```
🚀 [NAVIGATION] Pantalla actual: Login
📍 [STACK] Stack path: AuthStack -> Login
📱 [SCREEN] Login
🎯 [MOUNT] Login - Componente montado
⚡ [ACTION] Login - Email Changed
```

2. Habilitar overlay visual (opcional):

- En `src/config/navigationLogConfig.js` poner `visual.showOverlay: true`.
- El overlay mostrará la pantalla actual en la esquina indicada.

3. Ver testIDs desde Android (complementario):

```bash
adb shell uiautomator dump /sdcard/window_dump.xml
adb pull /sdcard/window_dump.xml .
grep -i 'createPinContainer' window_dump.xml
```

---

## Consideraciones técnicas y limitaciones

- La extracción del path del stack se realiza recursivamente desde `state` y asume la estructura típica de React Navigation (routes + index + nested state). Si se usan estructuras no estándar puede requerir adaptación.
- El logging de parámetros (`route.params`) puede exponer información sensible; se recomienda mantener `routeParams: false` en producción.
- `NavigationLogConfig.enabled` está por defecto ligado a `__DEV__` para evitar ruido en producción. Se puede cambiar en runtime con `updateLogConfig`.
- Para integrarlo con sistemas de analytics, se puede reemplazar `navLog` para enviar eventos a Firebase/Amplitude en vez de `console.log`.

---

## Próximos pasos recomendados

1. Añadir el uso del hook `useNavigationLogger` en pantallas críticas (login, onboarding, voting flow).
2. Integrar con analytics: mapear eventos de navegación relevantes a eventos remotos.
3. Añadir pruebas unitarias para `getStackPath` y `getRouteInfo` (funciones puras) para asegurar estabilidad.
4. Añadir un filtro por módulos o pantallas para reducir el volumen de logs.

---

## Registro de cambios (resumen)

- `src/config/navigationLogConfig.js` — Archivo agregado.
- `src/hooks/useNavigationLogger.js` — Archivo agregado.
- `src/components/common/NavigationDebugOverlay.js` — Archivo agregado.
- `src/navigation/index.js` — Modificado para integrar logging.
- `src/container/Auth/CreatePin.js` — Modificado para usar el hook.
- `docs/NavigationLogging.md` — Guia rápida añadida.
- `docs/NavigationLogging_DetailedReport.md` — Informe generado.

---

Fin del informe.
