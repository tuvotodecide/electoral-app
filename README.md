# TU VOTO DECIDE - Expo App

> Aplicación móvil desarrollada con Expo (React Native) para votación electoral.

---

## ✅ Requisitos Previos

### Software requerido

| Herramienta       | Versión recomendada      |
|-------------------|--------------------------|
| **Node.js**       | ≥ 18.x                   |
| **npm** o `yarn`  | npm ≥ 8.x (o yarn ≥ 1.22)|
| **Expo CLI**      | Última versión           |
| **Git**           | Última versión           |

### Para desarrollo nativo (builds locales)

| Herramienta       | Android                  |
|-------------------|--------------------------|
| **JDK**           | JDK 17                   |
| **Android Studio**| Última versión           |

### Verificar instalación

```bash
node -v
npm -v
git --version
```

### Variables de entorno (Android)

- `JAVA_HOME` → ruta del JDK 17
- `ANDROID_HOME` → ruta del SDK de Android
- `$ANDROID_HOME/platform-tools` → debe estar en tu PATH

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd electoral-app-expo
```

### 2. Crear archivo .env

```bash
cp .env.example .env
```

Edita el archivo `.env` con las variables necesarias para tu entorno.

### 3. Instalar dependencias

```bash
npm install
```

---

## 📱 Ejecución

### Development Build

Para funcionalidades nativas (cámara, notificaciones, etc.), necesitas un development build:

```bash
# Crear build de desarrollo para Android
npx expo run:android

```

### Comandos disponibles

| Comando             | Descripción                              |
|---------------------|------------------------------------------|
| `npm start`         | Inicia el servidor de desarrollo Expo    |
| `npm run android`   | Ejecuta en Android (build nativo)        |
| `npm run lint`      | Ejecuta el linter                        |

---

## 🔧 Configuración Android

### Configuración de Firebase y keystore

En la raíz del proyecto, crea la carpeta native-files, y añade el keystore y el archivo JSON de Firebase

```
native-files
│
└───keystore
│   │   identity-release.keystore
|
|   google-services.json
```

Añade las credenciales del keystore en el archivo credentials.json en la raíz del proyecto
```json
{
  "android": {
    "keystore": {
      "keystorePath": "android/app/keystore/identity-release.keystore",
      "keystorePassword": "my-password",
      "keyAlias": "my-key-alias",
      "keyPassword": "my-keypassword"
    }
  }
}
```


### Generar folder android

```bash
npx expo prebuild --clean --platform android
```

### Limpiar build de Android

```bash
cd android
./gradlew clean
cd ..
```

## 📦 Builds de Producción

### Usando EAS Build

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Iniciar sesión en Expo
eas login

# Build para Android
eas build --platform android
```

### Build local

```bash
# Android AAB
cd android && ./gradlew bundleRelease

```

---

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm test -- --watch
```

---

## 📝 Notas adicionales

- La app usa **Expo SDK 54** con la nueva arquitectura habilitada.
- Para funcionalidades nativas como cámara, biometría o notificaciones push, se requiere un **development build**.
- Consulta `TESTING_GUIDE.md` para más información sobre testing.

---

## 🔗 Enlaces útiles

- [Documentación de Expo](https://docs.expo.dev/)
- [Expo SDK 54](https://docs.expo.dev/versions/latest/)
- [EAS Build](https://docs.expo.dev/build/introduction/)