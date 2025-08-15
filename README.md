# Guía de Instalación y Ejecución - React Native en Windows

> Esta guía asume que ya tienes Node.js, JDK 17, Android Studio y Git instalados y configurados correctamente.

---

## ✅ Requisitos Previos (verifica con los siguientes comandos)


node -v
npm -v
java -version
git --version

Asegúrate también de tener configuradas correctamente las variables de entorno:

- JAVA_HOME → ruta del JDK 17
- ANDROID_HOME → ruta del SDK de Android
- %ANDROID_HOME%\platform-tools → debe estar en tu Path

---

## 🚀 Pasos de Instalación y Ejecución

### 1. Clonar el repositorio
cd C:\proyectos
Clonar el repositorio Actual


---

### 2. Crear archivo .env


type nul > .env

Luego edítalo manualmente con las variables necesarias (usa .env.example si existe).

---

### 3. Instalar dependencias


npm install

---

### 4. Configurar local.properties


cd android
type nul > local.properties

Edita el archivo y añade (ajusta la ruta a la de tu SDK):

sdk.dir = C\\:\\Users\\TuUsuario\\AppData\\Local\\Android\\sdk

Luego vuelve a la raíz del proyecto:

cd ..

---

### 5. Limpiar build de Android


cd android


gradlew.bat clean  o ./gradlew clean
cd ..

---

### 6. Iniciar Metro Bundler (nueva terminal)


npx react-native start --reset-cache

> Deja esta terminal abierta.

---

### 7. Ejecutar app en Android (otra terminal)


npx react-native run-android

Si ves el error "Unable to load script", ejecuta:

adb reverse tcp:8081 tcp:8081

---

## 🧪 Notas adicionales

- Usa Android Studio para iniciar tu emulador, o conecta tu dispositivo con _depuración USB_.
- Puedes recargar la app presionando R dos veces o Ctrl+M.



---

# Compatibilidad iOS - React Native

Pasos para adaptar y ejecutar este proyecto en dispositivos iOS.

---

### Requisitos

- **macOS**: Recomendado macOS 12 (Monterey) o superior.
- **Chip**: Compatible con Intel o Apple Silicon (M1/M2).

###  Software

| Herramienta       | Versión recomendada      |
|-------------------|--------------------------|
| **Node.js**       | ≥ 18.x                   |
| **npm** o `yarn`  | npm ≥ 8.x (o yarn ≥ 1.22)|
| **Xcode**         | ≥ 14.x                   |
| **CocoaPods**     | ≥ 1.12.1                 |

### 1. Revisar dependencias compatibles
Abrir `package.json` y asegúrate de que todas las librerías utilizadas sean compatibles con iOS. Si alguna solo funciona en Android, busca alternativas o verifica documentación oficial.
Se revisó que las posibles dependencias que podrían tener problemas son:

- react-native-quick-crypto
- react-native-keychain
- react-native-image-picker
- react-native-image-crop-picker
- react-native-vision-camera

Pero se verificó que no son necesarios cambios en los archivos donde se usan.

### 2. Agregar permisos a `Info.plist`
Edita el archivo:

```xml
ios/[NOMBRE DE LA APP]/Info.plist
```
Agrega los permisos requeridos, por ejemplo:
```xml
<key>NSCameraUsageDescription</key>
<string>Esta app necesita acceso a la cámara para tomar fotos.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Permite seleccionar imágenes desde la galería.</string>
```

### 3. Verificar si es necesario ajustar codigo por plataformas
```js
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // Código específico para iOS
}
```
O agregar equivalencias de estilos, por ejemplo 

| Elevation (Android) | `shadowOffset`            | `shadowOpacity` | `shadowRadius` |
|---------------------|---------------------------|------------------|-----------------|
| 0                   | `{ width: 0, height: 0 }` | `0`              | `0`             |
| 1                   | `{ width: 0, height: 1 }` | `0.18`           | `1.0`           |
| 3                   | `{ width: 0, height: 2 }` | `0.2`            | `2.0`           |
| 4                   | `{ width: 0, height: 2 }` | `0.22`           | `2.62`          |
| 5                   | `{ width: 0, height: 3 }` | `0.25`           | `3.0`           |
| 6                   | `{ width: 0, height: 3 }` | `0.26`           | `3.5`           |
| 10                  | `{ width: 0, height: 5 }` | `0.3`            | `5.0`           |
| 14                  | `{ width: 0, height: 6 }` | `0.34`           | `6.5`           |

### 4. Ejecutar en iOS

Instalar pods (la primera vez):
 ```bash
cd ios
pod install
cd ..
```

### 5. Iniciar el Metro Bundler

```bash
npx react-native start
```

### 6. Ejecutar la app en un simulador iOS

 Correr los siguientes comando:
 ```bash
npx react-native run-ios
```