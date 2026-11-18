# TU VOTO DECIDE - Expo App

> Aplicación móvil desarrollada con Expo (React Native) para votación electoral.

---

## ✅ Requisitos Previos

### Software requerido

| Herramienta       | Versión recomendada      |
|-------------------|--------------------------|
| **Node.js**       | ≥ 18.x                   |
| **pnpm**          | ≥ 9.x                    |
| **npm**           | El que trae Node.js      |
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
pnpm -v
npm -v
git --version
```

### Variables de entorno (Android)

- `JAVA_HOME` → ruta del JDK 17
- `ANDROID_HOME` → ruta del SDK de Android
- `$ANDROID_HOME/platform-tools` → debe estar en tu PATH

---

## 🚀 Instalación

### 1. Clonar la app y el SDK de Privado ID en la misma carpeta

La app usa `@privado-id/expo-sdk` desde la carpeta vecina `privado-sdk-expo`
(`"link:../privado-sdk-expo"` en `package.json`; Metro la vigila en `metro.config.js`).

```bash
mkdir privado-id && cd privado-id

git clone https://github.com/tuvotodecide/electoral-app.git electoral-app
git clone git@gitlab.com:proyectos-propios-blockchain-consultora/billetera-con-aa/privado-sdk-expo.git privado-sdk-expo
```

Estructura esperada:

```text
privado-id/
├── electoral-app/
└── privado-sdk-expo/
```

### 2. Compilar el SDK

La app importa la compilación (`dist/`), así que hay que volver a compilar después de cada cambio en el SDK:

```bash
cd privado-sdk-expo
npm install
npm run build
cd ..
```

### 3. Preparar y ejecutar la app Expo

Primero, configura variables de entorno de la app:

```bash
cd electoral-app
cp .env.example .env
```

Edita el archivo `.env` con las variables necesarias para tu entorno.

Instala las dependencias:

```bash
pnpm install
```

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

Genera el proyecto Android nativo:

```bash
pnpm expo prebuild --clean --platform android
```

Ejecuta la app en Android:

```bash
pnpm run android
```

Opcionalmente, inicia Metro de forma manual en otra terminal:

```bash
pnpm start
```
---

### Comandos disponibles

| Comando             | Descripción                              |
|---------------------|------------------------------------------|
| `pnpm start`        | Inicia el servidor de desarrollo Expo    |
| `pnpm run android`  | Ejecuta en Android (build nativo)        |
| `pnpm run lint`     | Ejecuta el linter                        |


### Limpiar build de Android

```bash
cd android
./gradlew clean
cd ..
```

## 📦 Builds de Producción

### Build local

```bash
# Android AAB
cd android && ./gradlew bundleRelease

```

---

## 🧪 Testing

```bash
# Ejecutar tests
pnpm test

# Ejecutar tests en modo watch
pnpm test -- --watch
```

---

## 📝 Notas adicionales

- La app usa **Expo SDK 54** con la nueva arquitectura habilitada.
- La app usa funcionalidades nativas como cámara, biometría y notificaciones, se requiere un **development build**.
- Consulta `TESTING_GUIDE.md` para más información sobre testing.

---

## 🔗 Enlaces útiles

- [Documentación de Expo](https://docs.expo.dev/)
- [Expo SDK 54](https://docs.expo.dev/versions/latest/)
- [EAS Build](https://docs.expo.dev/build/introduction/)