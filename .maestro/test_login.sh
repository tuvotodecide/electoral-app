#!/bin/bash

# Script simplificado para ejecutar el test de login
# Carga automáticamente las variables de entorno y ejecuta loginCorrectPin.yaml

cd "$(dirname "$0")"

# Cargar variables de entorno desde .maestro.env
set -a
source .maestro.env
set +a

echo "🔐 Ejecutando test de login con PIN correcto..."

maestro test \
    --env PIN="$MAESTRO_CORRECT_PIN" \
    --env MAESTRO_WALKTHROUGH="$MAESTRO_WALKTHROUGH" \
    workflows/auth/loginCorrectPin.yaml
