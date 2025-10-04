#!/bin/bash

# Script para ejecutar todos los tests de onboarding
# Uso: ./run_onboarding_tests.sh [categoria]

set -e

echo "🎯 Ejecutando Tests E2E de Onboarding con Maestro"
echo "=================================================="

# Configuración
MAESTRO_DIR="maestro/onboarding"
APP_ID="com.tuvotodecide"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="test_results/onboarding_$TIMESTAMP"

# Crear directorio de resultados
mkdir -p "$RESULTS_DIR"

# Función para ejecutar test con logging
run_test() {
    local test_file=$1
    local test_name=$(basename "$test_file" .yaml)
    
    echo "📱 Ejecutando: $test_name"
    echo "   Archivo: $test_file"
    
    if maestro test "$test_file" > "$RESULTS_DIR/${test_name}.log" 2>&1; then
        echo "   ✅ PASSED: $test_name"
        echo "PASSED" > "$RESULTS_DIR/${test_name}.result"
    else
        echo "   ❌ FAILED: $test_name"
        echo "   📄 Ver log: $RESULTS_DIR/${test_name}.log"
    fi
    echo ""
}

# Tests organizados por categoría
declare -A test_categories=(
    ["principales"]="
        complete_onboarding_flow.yaml
    "
    ["navegacion"]="
        progress_indicators.yaml
    "
    ["contenido"]="
        visual_elements_interaction.yaml
    "
    ["guardianes"]="
        guardians_complete_tutorial.yaml
    "
    ["avanzado"]="
        device_rotation.yaml
    "
    ["rendimiento"]="
        accessibility_features.yaml
    "
)

# Función para ejecutar categoría de tests
run_category() {
    local category=$1
    echo "🔄 Ejecutando categoría: $category"
    echo "================================"
    
    local tests="${test_categories[$category]}"
    for test in $tests; do
        fi
    done
}

# Determinar qué tests ejecutar
if [[ $# -eq 0 ]]; then
    echo "🚀 Ejecutando TODOS los tests de onboarding..."
    echo ""
    
    # Ejecutar todas las categorías
    for category in "${!test_categories[@]}"; do
        run_category "$category"
    done
    
elif [[ -n "${test_categories[$1]}" ]]; then
    echo "🚀 Ejecutando tests de categoría: $1"
    echo ""
    run_category "$1"
    
else
    echo "❌ Categoría desconocida: $1"
    echo ""
    echo "Categorías disponibles:"
    for category in "${!test_categories[@]}"; do
        echo "  - $category"
    done
    echo ""
    echo "Uso:"
    echo "  $0                    # Ejecutar todos los tests"
    echo "  $0 principales       # Ejecutar tests principales"
    echo "  $0 navegacion        # Ejecutar tests de navegación"
    echo "  $0 contenido         # Ejecutar tests de contenido"
    echo "  $0 guardianes        # Ejecutar tests de guardianes"
    echo "  $0 avanzado          # Ejecutar tests avanzados"
    echo "  $0 rendimiento       # Ejecutar tests de rendimiento"
    exit 1
fi

# Generar reporte
echo "📊 Generando reporte de resultados..."
echo "====================================="

passed=0
failed=0
total=0

echo "# Reporte de Tests de Onboarding - $(date)" > "$RESULTS_DIR/reporte.md"
echo "" >> "$RESULTS_DIR/reporte.md"

for result_file in "$RESULTS_DIR"/*.result; do
    if [[ -f "$result_file" ]]; then
        fi
    fi
done

echo "" >> "$RESULTS_DIR/reporte.md"
echo "## Resumen" >> "$RESULTS_DIR/reporte.md"
echo "- Total: $total tests" >> "$RESULTS_DIR/reporte.md"
echo "- Pasaron: $passed tests" >> "$RESULTS_DIR/reporte.md"
echo "- Fallaron: $failed tests" >> "$RESULTS_DIR/reporte.md"
echo "- Tasa de éxito: $(( passed * 100 / total ))%" >> "$RESULTS_DIR/reporte.md"

echo ""
echo "📈 Resumen Final:"
echo "  Total: $total tests"
echo "  ✅ Pasaron: $passed"
echo "  ❌ Fallaron: $failed"
echo "  📊 Tasa de éxito: $(( passed * 100 / total ))%"
echo ""
echo "📁 Resultados guardados en: $RESULTS_DIR"
echo "📄 Ver reporte completo: $RESULTS_DIR/reporte.md"

# Salir con código de error si hay tests fallidos
if [[ $failed -gt 0 ]]; then
    echo ""
    echo "⚠️  Algunos tests fallaron. Revisar logs para más detalles."
    exit 1
else
    echo ""
    echo "🎉 ¡Todos los tests pasaron exitosamente!"
    exit 0
fi
