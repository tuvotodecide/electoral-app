#!/bin/bash

# Script para ejecutar tests de Maestro con variables de entorno
# Uso: ./run_test_with_env.sh <archivo_test.yaml>

# Cargar variables de entorno desde .maestro.env
set -a  # automatically export all variables
source .maestro.env
set +a  # turn off automatic export

# Verificar que se proporcionó un archivo de test
if [ -z "$1" ]; then
    echo "Uso: $0 <archivo_test.yaml>"
    echo "Ejemplo: $0 workflows/auth/loginCorrectPin.yaml"
    exit 1
fi

echo "🚀 Ejecutando test de Maestro con variables de entorno..."
echo "📁 Archivo de test: $1"
echo "🔑 PIN: $MAESTRO_CORRECT_PIN"

# Ejecutar el test con las variables de entorno
maestro test \
    --env PIN="$MAESTRO_CORRECT_PIN" \
    --env MAESTRO_FIRST_USER_PHOTO_NAME="$MAESTRO_FIRST_USER_PHOTO_NAME" \
    --env MAESTRO_SECOND_USER_PHOTO_NAME="$MAESTRO_SECOND_USER_PHOTO_NAME" \
    --env MAESTRO_WRONG_PHOTO_NAME="$MAESTRO_WRONG_PHOTO_NAME" \
    --env MAESTRO_WALKTHROUGH="$MAESTRO_WALKTHROUGH" \
    --env MAESTRO_PRINCIPAL_ID="$MAESTRO_PRINCIPAL_ID" \
    --env MAESTRO_GUARDIAN_ID="$MAESTRO_GUARDIAN_ID" \
    --env MAESTRO_SELF_NAME="$MAESTRO_SELF_NAME" \
    --env MAESTRO_GUARDIAN_NAME="$MAESTRO_GUARDIAN_NAME" \
    --env MAESTRO_ELECTORAL_RECORD_LOCATION="$MAESTRO_ELECTORAL_RECORD_LOCATION" \
    --env MAESTRO_ELECTORAL_RECORD_TABLE_1="$MAESTRO_ELECTORAL_RECORD_TABLE_1" \
    --env MAESTRO_ELECTORAL_RECORD_TABLE_2="$MAESTRO_ELECTORAL_RECORD_TABLE_2" \
    --env MAESTRO_ELECTORAL_RECORD_IMAGE_NAME="$MAESTRO_ELECTORAL_RECORD_IMAGE_NAME" \
    --env MAESTRO_ELECTORAL_RECORD_DIFFICULT_IMAGE_NAME="$MAESTRO_ELECTORAL_RECORD_DIFFICULT_IMAGE_NAME" \
    "$1"
