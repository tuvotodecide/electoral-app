#!/bin/bash

# Script simple para grabar un flujo específico
# Uso: ./record_single_flow.sh <path/to/flow.yaml>

if [ $# -eq 0 ]; then
    echo "Uso: $0 <ruta_al_flujo.yaml>"
    echo ""
    echo "Ejemplos:"
    echo "  $0 workflows/auth/loginCorrectPin.yaml"
    echo "  $0 workflows/onboarding/nextFlow.yaml"
    exit 1
fi

FLOW="$1"
FLOW_NAME=$(basename "$FLOW" .yaml)
CATEGORY=$(dirname "$FLOW" | sed 's/workflows\///' | sed 's/\//_/g')

echo "🎬 Grabando flujo: $FLOW"
echo "📁 Nombre del video: ${CATEGORY}_${FLOW_NAME}.mp4"
echo ""

# Verificar si el archivo existe
if [[ ! -f "$FLOW" ]]; then
    echo "❌ Error: Archivo no encontrado: $FLOW"
    exit 1
fi

# Crear directorio recordings si no existe
mkdir -p recordings

# Grabar el flujo
if maestro record --config ./config.yaml --local "$FLOW"; then
    echo ""
    echo "✅ Grabación exitosa!"
    
    # Mover el video con nombre descriptivo
    if [[ -f "recording.mp4" ]]; then
        mv "recording.mp4" "recordings/${CATEGORY}_${FLOW_NAME}.mp4"
        echo "📹 Video guardado en: recordings/${CATEGORY}_${FLOW_NAME}.mp4"
    fi
else
    echo ""
    echo "❌ Error al grabar el flujo"
    exit 1
fi
