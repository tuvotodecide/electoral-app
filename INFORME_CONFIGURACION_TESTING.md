# Informe: Configuración y Testing de Aplicación React Native Electoral

## Resumen Ejecutivo

Este informe documenta el proceso de configuración y testing de la aplicación electoral desarrollada en React Native, incluyendo los desafíos encontrados durante la implementación del backend local, configuración de guardianes, y las soluciones aplicadas para resolver problemas de conectividad y compilación.

## Estructura del Proyecto

La aplicación `appelectoral` (versión 1.0.4) está estructurada como una aplicación React Native 0.79.3 con las siguientes características principales:

```
electoral-app/
├── src/
│   ├── container/TabBar/Recovery/RecoveryQR.js
│   ├── navigation/NavigationRoute.js
│   ├── api/envConstants.js
│   └── ...
├── android/
│   ├── app/build.gradle
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       └── res/xml/network_security_config.xml
├── .env
├── package.json
└── ...
```

## Configuración de Entorno

### Variables de Entorno Principales

El archivo `.env` contiene la configuración esencial del proyecto:

```properties
BACKEND=http://192.168.0.12:3001/
BACKEND_BLOCKCHAIN=https://backocr.tuvotodecide.com
BACKEND_RESULT=https://dbackresultados.tuvotodecide.com
CHAIN=arbitrum-sepolia
FIREBASE_PROJECT_ID=wallet-aa
```

### Configuración de Red para Android

Para permitir la comunicación con backends locales, se configuró el archivo `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">192.168.0.12</domain>
        <domain includeSubdomains="true">192.168.1.16</domain>
        <domain includeSubdomains="true">192.168.1.212</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
    <!-- Configuración adicional para dominios de backend -->
</network-security-config>
```

## Proceso de Implementación y Problemas Encontrados

### 1. Implementación Inicial Fallida

**Problema**: La implementación inicial no funcionaba correctamente con el sistema de guardianes.

**Estado**: Se identificó que el flujo de guardianes requería cambios en el backend y configuración adicional.

### 2. Configuración del Backend Local

#### Problema con URL Localhost
**Problema Inicial**: Se intentó usar `localhost` en la configuración, pero las aplicaciones móviles no pueden acceder a localhost del host.

**Solución Implementada**:
```properties
# Cambio de:
BACKEND=http://localhost:3001/
# A:
BACKEND=http://192.168.0.12:3001/
```

#### Configuración de Seguridad de Red
Se agregó configuración XML para permitir tráfico no encriptado a IPs locales:

```xml
<domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">192.168.0.12</domain>
</domain-config>
```

### 3. Problemas de Compilación Android

#### Error de Keystore Release
**Problema**: El proyecto requería un archivo de keystore para release que no estaba disponible.

**Solución en `android/app/build.gradle`**:
```gradle
buildTypes {
    release {
        // signingConfig signingConfigs.shared // Desactivado para evitar error de keystore
        shrinkResources false
        minifyEnabled false
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

#### Configuración de Debug Keystore
```gradle
signingConfigs {
    debug {
        storeFile file("$rootDir/app/debug.keystore")
        storePassword "android"
        keyAlias "androiddebugkey"
        keyPassword "android"
    }
}
```

### 4. Errores de Tipado en RecoveryQR

**Problema**: Errores de TypeScript en el componente `RecoveryQR.js`.

**Archivos Afectados**:
- `src/container/TabBar/Recovery/RecoveryQR.js`
- `src/navigation/NavigationRoute.js`

**Inconsistencias encontradas**:
```javascript
// En NavigationRoute.js - inconsistencia en el path
import RecoveryQr from '../container/TabBar/Recovery/RecoveryQR'; // Archivo real: RecoveryQR.js

// En NavigationRouteClean.js - path correcto
import RecoveryQr from '../container/TabBar/Recovery/RecoveryQr';
```

### 5. Problemas de Conectividad Backend

#### Configuración de URLs de Backend
Se experimentaron problemas con diferentes configuraciones de backend:

```properties
# Configuraciones probadas:
BACKEND_RESULT=https://yo-custodio-backend.onrender.com  # Comentado
BACKEND_RESULT=https://dbackresultados.tuvotodecide.com  # En uso
```

#### Validaciones de Debug Agregadas
Se implementaron validaciones adicionales para debug en el proceso de testing.

### 6. Gestión de Docker y Contenedores

**Problemas Experimentados**:
- Los volúmenes de Docker no se eliminaron correctamente
- Desconfiguración de contenedores requirió reinicio completo
- Pérdida de configuración de guardianes tras restart

**Proceso de Solución**:
1. Eliminación completa de contenedores
2. Reinicio de servicios Docker
3. Reconfiguración completa del backend

### 7. Configuración de Git y Control de Versiones

#### Problemas de Credenciales
**Problema**: Git no reconocía las credenciales configuradas.

**Solución**:
```bash
# Reconfiguración via terminal (más confiable que UI)
git config --global user.name "username"
git config --global user.email "email@example.com"
```

#### Gestión de Rama de Testing
**Estrategia Implementada**:
- Creación de rama `saul-testing-local`
- Solicitud de acceso al repositorio para evitar pérdida de cambios
- Pull de cambios desde `main` antes de continuar desarrollo

## Configuración de Testing y Desarrollo

### Scripts de Package.json
```json
{
  "scripts": {
    "android": "react-native run-android --active-arch-only",
    "start": "react-native start",
    "test": "jest"
  }
}
```

### Proceso de Compilación
**Tiempo promedio de compilación**: 10-15 minutos por ciclo
**Comando de limpieza requerido**: Limpieza de proyecto entre modificaciones

### Configuración Multi-Dispositivo
Para testing de guardianes se requiere:
1. Dispositivo/emulador principal
2. Dispositivo/emulador secundario para testing de guardianes
3. Instalación del proyecto en PC adicional para emulación

## Dependencias Críticas

### Principales Librerías
```json
{
  "react-native": "0.79.3",
  "ethers": "^6.14.4",
  "@react-native-firebase/app": "^22.4.0",
  "react-native-config": "^1.5.5"
}
```

### Configuración Firebase
```properties
FIREBASE_PROJECT_ID=wallet-aa
FIREBASE_MESSAGING_SENDER_ID=89837410757
```

## Lecciones Aprendidas y Recomendaciones

### 1. Configuración de Red
- **Nunca usar localhost** para backend en desarrollo móvil
- **Configurar network_security_config.xml** antes de testing con backend local
- **Documentar IPs locales** utilizadas en configuración

### 2. Gestión de Builds
- **Mantener keystore de debug** siempre disponible
- **Planificar tiempo suficiente** para ciclos de compilación (15+ minutos)
- **Limpiar proyecto** entre cambios significativos

### 3. Control de Versiones
- **Configurar Git vía terminal** cuando la UI falla
- **Crear ramas de testing** para cambios experimentales
- **Hacer pull frecuente** de cambios del repositorio principal

### 4. Docker y Backend
- **Documentar configuración de contenedores**
- **Backup de volúmenes críticos** antes de cambios
- **Script de setup automatizado** para reconfiguración rápida

### 5. Testing Multi-Dispositivo
- **Preparar múltiples emuladores** antes del testing
- **Configurar red local compartida** para comunicación entre dispositivos
- **Documentar proceso de setup** en múltiples PCs

## Conclusiones

El proceso de configuración reveló la complejidad inherente en el desarrollo de aplicaciones blockchain móviles, especialmente en:

1. **Conectividad de red**: Configuración específica para comunicación con backends locales
2. **Gestión de keystores**: Importancia de mantener configuración de debug funcional
3. **Sincronización de equipo**: Necesidad de coordinación en cambios de backend y frontend
4. **Testing distribuido**: Complejidad de testing de funcionalidades que requieren múltiples dispositivos

La aplicación ahora está configurada correctamente para desarrollo y testing, con un proceso documentado para replicar el setup en futuros entornos de desarrollo.

---

**Fecha de creación**: 15 de agosto de 2025  
**Rama de trabajo**: `saul-testing-local`  
**Estado**: ✅ Configuración funcional para desarrollo y testing
