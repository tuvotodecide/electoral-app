# Sistema de Logging de Navegación

Sistema implementado para trackear y debuggear la navegación en la app React Native.

## ✅ Características Implementadas

### 1. Logging Automático Global
- Detecta automáticamente cambios de pantalla
- Muestra el path completo del stack de navegación
- Loggea parámetros de navegación (configurable)

### 2. Hook Personalizado `useNavigationLogger`
```javascript
import { useNavigationLogger } from '../../hooks/useNavigationLogger';

export default function MyScreen({navigation}) {
  const { logAction, logNavigation } = useNavigationLogger('MyScreen', true);
  
  const handleButtonPress = () => {
    logAction('Button Pressed', 'Login button');
    logNavigation('NextScreen');
    navigation.navigate('NextScreen');
  };
}
```

### 3. Overlay Visual de Debug (Opcional)
Muestra la pantalla actual visualmente en la app durante desarrollo.

### 4. Configuración Centralizada
Archivo: `src/config/navigationLogConfig.js`

## 🚀 Cómo Usar

### Logs Automáticos
Ya funcionan automáticamente. En tu consola de Metro verás:
```
🚀 [NAVIGATION] Pantalla actual: CreatePin
📍 [STACK] Stack path: Auth -> CreatePin
📱 [SCREEN] CreatePin
```

### En Componentes Específicos
```javascript
import { useNavigationLogger } from '../../hooks/useNavigationLogger';

export default function MiPantalla({navigation}) {
  // Básico
  const { logAction, logNavigation } = useNavigationLogger();
  
  // Con logging de parámetros
  const { logAction, logNavigation } = useNavigationLogger('MiPantalla', true);
  
  const manejarAccion = () => {
    logAction('Usuario hizo algo', 'datos adicionales');
    logNavigation('SiguientePantalla');
    navigation.navigate('SiguientePantalla');
  };
}
```

### Para Solo Logging Básico
```javascript
import { useScreenLogger } from '../../hooks/useNavigationLogger';

export default function MiPantalla() {
  useScreenLogger('MiPantalla');
  // Solo loggea cuando la pantalla se activa
}
```

## ⚙️ Configuración

### Habilitar/Deshabilitar Features
Edita `src/config/navigationLogConfig.js`:

```javascript
export const NavigationLogConfig = {
  enabled: __DEV__, // true/false
  
  logs: {
    stateChanges: true,     // Cambios de pantalla
    componentMount: true,   // Mount/unmount componentes  
    userActions: true,      // Acciones del usuario
    routeParams: false,     // Parámetros (puede ser verbose)
    stackPath: true,        // Path del stack completo
  },
  
  visual: {
    showOverlay: false,     // Overlay en pantalla
    overlayPosition: 'top-right', // Posición
  }
};
```

### Habilitar Overlay Visual
```javascript
// En navigationLogConfig.js
visual: {
  showOverlay: true,
  overlayPosition: 'top-right', // top-left, top-right, bottom-left, bottom-right
}
```

### Cambiar Configuración en Runtime
```javascript
import { updateLogConfig } from '../config/navigationLogConfig';

// Deshabilitar logs temporalmente
updateLogConfig({ enabled: false });

// Solo logs de navegación
updateLogConfig({ 
  logs: { 
    stateChanges: true, 
    componentMount: false, 
    userActions: false 
  } 
});
```

## 📱 Identificar Pantalla Actual

### Método 1: Ver Logs en Metro Console
```bash
# En tu terminal donde corre Metro verás:
📱 [SCREEN] CreatePin
📱 [SCREEN] Login  
📱 [SCREEN] UploadDocument
```

### Método 2: Habilitar Overlay Visual
```javascript
// navigationLogConfig.js
visual: { showOverlay: true }
```

### Método 3: Usar ADB (Android)
```bash
adb shell uiautomator dump /sdcard/window_dump.xml
adb pull /sdcard/window_dump.xml .
grep -i 'createPinContainer' window_dump.xml
```

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:
- `src/hooks/useNavigationLogger.js` - Hook principal
- `src/config/navigationLogConfig.js` - Configuración
- `src/components/common/NavigationDebugOverlay.js` - Overlay visual

### Archivos Modificados:
- `src/navigation/index.js` - Logging automático
- `src/container/Auth/CreatePin.js` - Ejemplo de uso

## 🔍 Ejemplos de Output

```
🚀 [NAVIGATION] Pantalla actual: Login
📍 [STACK] Stack path: Auth -> Login
🎯 [MOUNT] Login - Componente montado
⚡ [ACTION] Login - Email Changed Length: 8
🧭 [NAVIGATE] Login -> CreatePin
📱 [SCREEN] CreatePin
🗑️ [UNMOUNT] Login - Componente desmontado
🎯 [MOUNT] CreatePin - Componente montado
⚡ [ACTION] CreatePin - OTP Changed Length: 3
```

## 🛠️ Próximos Pasos

1. **Agregar el hook a más pantallas**: Copia el patrón de CreatePin.js
2. **Personalizar prefijos**: Modifica `prefixes` en el config
3. **Integrar con analytics**: Usa los logs para enviar eventos a servicios como Firebase
4. **Filtros**: Agrega filtros por tipo de pantalla o módulo
