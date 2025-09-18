#!/bin/bash

# Script para agregar useNavigationLogger hook a todas las pantallas

# Función para agregar import y hook a un archivo
add_hook_to_file() {
    local file="$1"
    local screen_name="$2"
    
    # Verificar si el archivo ya tiene el import
    if grep -q "useNavigationLogger" "$file"; then
        echo "✓ $file ya tiene el hook"
        return
    fi
    
    # Verificar si el archivo exporta una función default
    if ! grep -q "export default function" "$file"; then
        echo "⚠ $file no parece ser un componente React standard"
        return
    fi
    
    # Agregar import
    sed -i "/import.*from.*react-navigation/a import {useNavigationLogger} from '../../hooks/useNavigationLogger';" "$file"
    
    # Agregar hook después de los useState
    sed -i "/useState.*BlurredStyle.*);/a \\n  // Hook para logging de navegación\\n  const { logAction, logNavigation } = useNavigationLogger('$screen_name', true);" "$file"
    
    echo "✓ Agregado hook a $file ($screen_name)"
}

# Lista de archivos principales de Auth
auth_files=(
    "src/container/Auth/RegisterUser1.js:RegisterUser1"
    "src/container/Auth/RegisterUser2.js:RegisterUser2"
    "src/container/Auth/RegisterUser3.js:RegisterUser3"
    "src/container/Auth/RegisterUser4.js:RegisterUser4"
    "src/container/Auth/RegisterUser5.js:RegisterUser5"
    "src/container/Auth/RegisterUser6.js:RegisterUser6"
    "src/container/Auth/RegisterUser7.js:RegisterUser7"
    "src/container/Auth/RegisterUser8Pin.js:RegisterUser8Pin"
    "src/container/Auth/RegisterUser9Pin.js:RegisterUser9Pin"
    "src/container/Auth/RegisterUser10.js:RegisterUser10"
    "src/container/Auth/RegisterUser11.js:RegisterUser11"
    "src/container/Auth/OTPCode.js:OTPCode"
    "src/container/Auth/UploadDocument.js:UploadDocument"
    "src/container/Auth/UploadPhotoId.js:UploadPhotoId"
    "src/container/Auth/SelfieWithIdCard.js:SelfieWithIdCard"
    "src/container/Auth/VerifySuccess.js:VerifySuccess"
    "src/container/Auth/FaceIdScreen.js:FaceIdScreen"
    "src/container/Auth/FingerPrintScreen.js:FingerPrintScreen"
    "src/container/Auth/SelectCountry.js:SelectCountry"
    "src/container/Auth/SignUpWithMobileNumber.js:SignUpWithMobileNumber"
)

# Procesar archivos de Auth
echo "Procesando archivos de Auth..."
for item in "${auth_files[@]}"; do
    IFS=':' read -r file screen_name <<< "$item"
    if [ -f "$file" ]; then
        add_hook_to_file "$file" "$screen_name"
    else
        echo "❌ No encontrado: $file"
    fi
done

echo "Proceso completado."
