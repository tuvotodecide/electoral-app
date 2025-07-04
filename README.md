# Guía de Instalación y Ejecución - React Native en Windows

> Esta guía asume que ya tienes Node.js, JDK 17, Android Studio y Git instalados y configurados correctamente.

---

## ✅ Requisitos Previos (verifica con los siguientes comandos)

bash
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

bash
cd C:\proyectos
git clone https://gitlab.com/proyectos-propios-blockchain-consultora/billetera-con-aa/billetera.git
cd billetera

---

### 2. Crear archivo .env

bash
type nul > .env

Luego edítalo manualmente con las variables necesarias (usa .env.example si existe).

---

### 3. Instalar dependencias

bash
npm install

---

### 4. Configurar local.properties

bash
cd android
type nul > local.properties

Edita el archivo y añade (ajusta la ruta a la de tu SDK):

sdk.dir = C\\:\\Users\\TuUsuario\\AppData\\Local\\Android\\sdk

Luego vuelve a la raíz del proyecto:

bash
cd ..

---

### 5. Limpiar build de Android

bash
cd android
gradlew.bat clean
cd ..

---

### 6. Iniciar Metro Bundler (nueva terminal)

bash
npx react-native start --reset-cache

> Deja esta terminal abierta.

---

### 7. Ejecutar app en Android (otra terminal)

bash
npx react-native run-android

Si ves el error "Unable to load script", ejecuta:

bash
adb reverse tcp:8081 tcp:8081

---

## 🧪 Notas Finales

- Usa Android Studio para iniciar tu emulador, o conecta tu dispositivo con _depuración USB_.
- Puedes recargar la app presionando R dos veces o Ctrl+M.
