# Sistema de Autenticación de Test - Billetera Wira

Este sistema permite simular completamente el flujo de autenticación de la aplicación para desarrollo y testing, sin necesidad de configuración real de backend o registro de usuarios.

## 🎯 ¿Qué incluye?

### Pantallas de Test Creadas

- **`AuthTest.js`** - Pantalla de splash que simula la verificación de sesión
- **`AuthNavigationTest.js`** - Navegación de autenticación simplificada (solo ConnectTest → LoginUserTest)
- **`ConnectTest.js`** - Pantalla de conexión que redirige automáticamente al login
- **`LoginUserTest.js`** - Pantalla de login con PIN que simula el flujo real

### Configuración Centralizada

- **`testConfig.js`** - Archivo de configuración centralizado para customizar el comportamiento

## 🚀 Cómo usar

### 1. Activar/Desactivar Modo Test

En `src/container/Splash.js`, el modo test está activado por defecto:

```javascript
// ========== MODO DE DESARROLLO - USANDO AuthTest ==========
console.log('Splash: Usando AuthTest para desarrollo');
navigation.replace('AuthTest'); // Navegar a AuthTest
return;
```

Para usar el flujo real, comenta la sección de arriba y descomenta:

```javascript
// ========== CÓDIGO ORIGINAL (COMENTADO) ==========
const alive = await isSessionValid();
if (alive) navigation.replace(StackNav.TabNavigation);
// ... resto del flujo real
```

### 2. Configurar PINs de Test

En `src/config/testConfig.js`:

```javascript
export const TEST_CONFIG = {
  // PIN principal para desarrollo
  DEFAULT_TEST_PIN: '1234',

  // PINs válidos adicionales
  VALID_TEST_PINS: ['1234', '0000', '1111', '2580'],

  // ... más configuraciones
};
```

### 3. Personalizar Usuario Mock

```javascript
MOCK_USER: {
  account: '0x1234567890abcdef1234567890abcdef12345678',
  guardian: '0xabcdef1234567890abcdef1234567890abcdef12',
  payloadQr: {
    // ... datos de la wallet
  },
  vc: {
    credentialSubject: {
      id: 'did:test:user123',
      name: 'Usuario Test',
      email: 'test@wira.app',
      cedula: '12345678',
      telefono: '+591 70000000',
      direccion: 'La Paz, Bolivia',
      // ... más datos del usuario
    }
  }
}
```

## 🔧 Configuraciones Disponibles

### Comportamiento del Flujo

```javascript
AUTO_NAVIGATE_DELAY: 1000,        // Delay en ConnectTest antes de ir al login
SIMULATE_LOADING_DELAY: 500,      // Delay para simular verificación de PIN
MAX_PIN_ATTEMPTS: 5,               // Máximo número de intentos de PIN
```

### Flags Visuales

```javascript
SHOW_TEST_INDICATORS: true,        // Mostrar indicadores de "Modo Test"
ENABLE_TEST_LOGS: true,           // Habilitar logs de depuración
```

## 🎮 Flujo de Test

1. **Splash** → **AuthTest** (simula verificación de sesión)
2. **AuthTest** → **AuthNavigationTest** (si no hay sesión válida)
3. **AuthNavigationTest** → **ConnectTest** (pantalla inicial)
4. **ConnectTest** → **LoginUserTest** (automático después de 1 segundo)
5. **LoginUserTest** → **TabNavigation** (después de PIN correcto)

### Logout en Modo Test

- El logout desde Profile navega de vuelta a `AuthTest`
- Mantiene la consistencia del flujo de test
- Evita errores de red al desloguearse

## 📱 Experiencia de Usuario

### ConnectTest

- Se muestra por 1 segundo con el logo y mensaje "Modo Test"
- Redirige automáticamente al login
- Incluye botón manual por si necesitas control

### LoginUserTest

- Idéntico al login real visualmente
- Acepta PINs: `1234`, `0000`, `1111`, `2580`
- Muestra indicador con PINs válidos
- Simula intentos fallidos y bloqueo después de 5 intentos
- Carga automáticamente datos de usuario mock

## 🔍 Datos Precargados

Después del login exitoso, la app tendrá:

- **Usuario autenticado** con credenciales mock
- **Wallet** con direcciones de account y guardian
- **Sesión válida** almacenada
- **Redux store** poblado con datos de test

## 🛠️ Desarrollo

### Agregar nuevos PINs

```javascript
VALID_TEST_PINS: ['1234', '0000', '1111', '2580', '9999'], // Agregar aquí
```

### Cambiar usuario mock

```javascript
MOCK_USER: {
  // Modificar los datos según necesites
  vc: {
    credentialSubject: {
      name: 'Nuevo Usuario Test',
      email: 'nuevo@test.com',
      // ...
    }
  }
}
```

### Personalizar delays

```javascript
AUTO_NAVIGATE_DELAY: 2000,        // Más tiempo en ConnectTest
SIMULATE_LOADING_DELAY: 1000,     // Más tiempo de loading en PIN
```

## �️ Protección Contra Errores de Red

El sistema incluye protección automática contra errores de red en modo test:

### Interceptores de Red

- **Bloqueo automático**: Todas las llamadas HTTP se interceptan y bloquean
- **Respuestas mock**: Se devuelven respuestas simuladas en lugar de errores
- **Logs de depuración**: Se registra cada llamada bloqueada para debugging

### Flag Global de Test Mode

```javascript
import {isTestMode, shouldMakeNetworkCall} from '../config/testMode';

// Verificar antes de hacer llamadas de red
if (shouldMakeNetworkCall()) {
  const response = await axios.post(url, data);
} else {
  // En modo test, no hacer la llamada
  console.log('Network call blocked in test mode');
}
```

## �🐛 Debugging

Logs de test aparecen con prefijo `[TEST]`:

```
[TEST] Verificando PIN: 1234
[TEST] PIN correcto, cargando datos de usuario...
[TEST] Login exitoso, navegando a TabNavigation...
```

Para desactivar logs:

```javascript
ENABLE_TEST_LOGS: false,
```

## 📝 Notas Importantes

1. **Preservación del código original**: Todo el código real está comentado, no eliminado
2. **Fácil alternación**: Cambiar entre modo test y real es una línea en `Splash.js`
3. **Experiencia idéntica**: El flujo de test es visualmente idéntico al real
4. **Datos realistas**: El usuario mock incluye datos representativos
5. **Sin dependencias**: No requiere backend ni configuración adicional

## 🔄 Cambiar Entre Modo Test y Real - Guía Detallada

### 📍 Ubicaciones Exactas de los Cambios

#### 1. **Archivo Principal: `src/container/Splash.js`**

**🔧 Para ACTIVAR modo test** (líneas ~40-42):

```javascript
// ========== MODO DE DESARROLLO - USANDO AuthTest ==========
// AuthTest simula todo el flujo de auth pero con usuario automático
console.log('Splash: Usando AuthTest para desarrollo');
navigation.replace('AuthTest'); // Navegar a AuthTest
return;
```

**🔧 Para ACTIVAR modo real** (líneas ~44-50):

```javascript
// ========== CÓDIGO ORIGINAL (COMENTADO) ==========
// Descomenta este bloque y comenta AuthTest para usar el flujo real
/*
const alive = await isSessionValid();
if (alive) navigation.replace(StackNav.TabNavigation);
else if (onBoardingValue) navigation.replace(StackNav.AuthNavigation);
else navigation.replace(StackNav.OnBoarding);
*/
```

**✅ INSTRUCCIONES:**

- **Para modo TEST**: Deja descomentado el bloque "MODO DE DESARROLLO"
- **Para modo REAL**: Comenta el bloque "MODO DE DESARROLLO" y descomenta el "CÓDIGO ORIGINAL"

---

#### 2. **Logout: `src/container/TabBar/Profile/Profile.js`**

**🔧 Configuración actual** (líneas ~70-85):

```javascript
const onPressLOut = async () => {
  try {
    setIsModalVisible(false);
    setTimeout(() => {
      // CONFIGURACIÓN PARA DESARROLLO:
      // - AuthTest: Mantiene el flujo de test activo
      // - StackNav.AuthNavigation: Flujo real de autenticación
      // Cambiar entre estos según necesites

      navigation.reset({
        index: 0,
        routes: [{name: 'AuthTest'}], // MODO TEST: Usar AuthTest para desarrollo
        // routes: [{name: StackNav.AuthNavigation}], // MODO REAL: Descomentar para producción
      });
    }, 500);
    return true;
  } catch (exception) {
    return false;
  }
};
```

**✅ INSTRUCCIONES:**

- **Para modo TEST**: Usar `routes: [{name: 'AuthTest'}]`
- **Para modo REAL**: Usar `routes: [{name: StackNav.AuthNavigation}]`

---

#### 3. **Archivos que DEBES ELIMINAR para volver al modo original:**

```bash
# Archivos de configuración de test (ELIMINAR para modo real)
src/config/testConfig.js
src/config/testNetworkConfig.js
src/config/testMode.js

# Pantallas de test (ELIMINAR para modo real)
src/container/AuthTest.js
src/container/ConnectTest.js
src/container/Auth/LoginUserTest.js
src/navigation/type/AuthNavigationTest.js

# Script de utilidad (OPCIONAL eliminar)
scripts/toggle-auth-mode.js

# Documentación (OPCIONAL eliminar)
SISTEMA_TEST_AUTH.md
```

---

#### 4. **Limpieza en `src/navigation/NavigationRoute.js`**

**🔧 Importaciones a ELIMINAR** (líneas ~22-24):

```javascript
// Pantallas de Test - ELIMINAR ESTAS LÍNEAS PARA MODO REAL
import ConnectTest from '../container/ConnectTest';
import LoginUserTest from '../container/Auth/LoginUserTest';
```

**🔧 Exportaciones a ELIMINAR** (líneas ~160-165):

```javascript
export const StackRoute = {
  Splash,
  AuthTest, // ELIMINAR esta línea
  AuthNavigation,
  TabNavigation,

  // Rutas de Test - Solo componentes de pantalla - ELIMINAR TODO ESTE BLOQUE
  ConnectTest,
  LoginUserTest,
  // AuthNavigationTest es un navegador, no va aquí
```

**✅ RESULTADO FINAL para modo real:**

```javascript
export const StackRoute = {
  Splash,
  AuthNavigation,
  TabNavigation,
  // ... resto de rutas normales
```

---

#### 5. **Limpieza en `src/navigation/type/StackNavigation.js`**

**🔧 Importación a ELIMINAR** (línea ~6):

```javascript
import AuthNavigationTest from './AuthNavigationTest'; // ELIMINAR esta línea
```

**🔧 Screens a ELIMINAR** (líneas ~17-22):

```javascript
<Stack.Screen name="AuthTest" component={StackRoute.AuthTest} /> // ELIMINAR

{/* Rutas de Test - ELIMINAR TODO ESTE BLOQUE */}
<Stack.Screen name="AuthNavigationTest" component={AuthNavigationTest} />
<Stack.Screen name="ConnectTest" component={StackRoute.ConnectTest} />
<Stack.Screen name="LoginUserTest" component={StackRoute.LoginUserTest} />
```

---

### 🚀 Proceso Rápido de Conversión

#### ➡️ **De TEST a REAL (Modo Producción):**

1. **Cambiar Splash.js:**

   ```javascript
   // Comentar estas líneas:
   // navigation.replace('AuthTest');

   // Descomentar estas líneas:
   const alive = await isSessionValid();
   if (alive) navigation.replace(StackNav.TabNavigation);
   else if (onBoardingValue) navigation.replace(StackNav.AuthNavigation);
   else navigation.replace(StackNav.OnBoarding);
   ```

2. **Cambiar Profile.js logout:**

   ```javascript
   routes: [{name: StackNav.AuthNavigation}]; // En lugar de 'AuthTest'
   ```

3. **Eliminar archivos de test:**

   ```bash
   rm -rf src/config/test*
   rm -rf src/container/AuthTest.js
   rm -rf src/container/ConnectTest.js
   rm -rf src/container/Auth/LoginUserTest.js
   rm -rf src/navigation/type/AuthNavigationTest.js
   ```

4. **Limpiar imports en NavigationRoute.js y StackNavigation.js**

---

#### ⬅️ **De REAL a TEST (Modo Desarrollo):**

1. **Cambiar Splash.js:**

   ```javascript
   navigation.replace('AuthTest'); // Descomentar

   // Comentar el flujo real:
   /*
   const alive = await isSessionValid();
   if (alive) navigation.replace(StackNav.TabNavigation);
   else if (onBoardingValue) navigation.replace(StackNav.AuthNavigation);
   else navigation.replace(StackNav.OnBoarding);
   */
   ```

2. **Cambiar Profile.js logout:**

   ```javascript
   routes: [{name: 'AuthTest'}]; // En lugar de StackNav.AuthNavigation
   ```

3. **Asegurar que todos los archivos de test existan** (como están ahora)

---

### 🛠️ Script Automático

Puedes usar el script que creé para cambiar rápidamente:

```bash
# Activar modo test
node scripts/toggle-auth-mode.js test

# Activar modo real
node scripts/toggle-auth-mode.js real

# Ver estado actual
node scripts/toggle-auth-mode.js status
```

¡Listo! Ahora tienes una guía completa de dónde está cada cambio. 🎉
