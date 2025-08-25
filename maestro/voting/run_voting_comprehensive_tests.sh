#!/bin/bash

# Script para ejecutar todos los tests de votación/electoral en Maestro
# Uso: ./run_voting_comprehensive_tests.sh [device_id]

echo "🗳️  Iniciando tests comprehensivos de votación electoral..."

# Configuración
DEVICE_ID=${1:-""}
RESULTS_DIR="maestro/results/voting_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Lista de tests de votación
VOTING_TESTS=(
    "maestro/voting/access_electoral_participation.yaml"
    "maestro/voting/mesa_search_comprehensive.yaml"
    "maestro/voting/acta_upload_comprehensive.yaml"
    "maestro/voting/witness_comprehensive.yaml"
    "maestro/voting/data_validation_comprehensive.yaml"
    "maestro/voting/camera_image_processing.yaml"
    "maestro/voting/network_error_handling.yaml"
    "maestro/voting/witness_history_management.yaml"
    "maestro/voting/electoral_participation_complete.yaml"
    "maestro/voting/search_electoral_table.yaml"
    "maestro/voting/upload_acta_photo.yaml"
    "maestro/voting/upload_correct_acta.yaml"
    "maestro/voting/witness_actas.yaml"
    "maestro/voting/scrollprueba.yaml"
)

# Función para ejecutar un test individual
run_test() {
    local test_file=$1
    local test_name=$(basename "$test_file" .yaml)
    
    echo "🗳️  Ejecutando: $test_name"
    
    if [ -n "$DEVICE_ID" ]; then
        maestro test "$test_file" --device-id "$DEVICE_ID" --format junit --output "$RESULTS_DIR/${test_name}_result.xml"
    else
        maestro test "$test_file" --format junit --output "$RESULTS_DIR/${test_name}_result.xml"
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ $test_name: PASÓ"
    else
        echo "❌ $test_name: FALLÓ (código: $exit_code)"
    fi
    
    return $exit_code
}

# Ejecutar todos los tests
passed=0
failed=0
total=${#VOTING_TESTS[@]}

echo "📋 Ejecutando $total tests de votación electoral..."
echo "📂 Resultados se guardarán en: $RESULTS_DIR"
echo ""

for test in "${VOTING_TESTS[@]}"; do
    if run_test "$test"; then
        ((passed++))
    else
        ((failed++))
    fi
    echo ""
done

# Resumen final
echo "📊 RESUMEN DE RESULTADOS:"
echo "========================================"
echo "Total de tests:     $total"
echo "Tests exitosos:     $passed"
echo "Tests fallidos:     $failed"
echo "Porcentaje éxito:   $((passed * 100 / total))%"
echo "========================================"

# Generar reporte HTML
cat > "$RESULTS_DIR/report.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Reporte de Tests de Votación Electoral</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f8ff; padding: 20px; border-radius: 5px; border-left: 4px solid #2196F3; }
        .summary { background: #e8f5e8; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .failed { background: #ffe8e8; }
        .test-item { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .passed { border-left-color: #4CAF50; }
        .failed-test { border-left-color: #f44336; }
        .category { background: #f9f9f9; padding: 10px; margin: 15px 0; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🗳️ Reporte de Tests de Votación Electoral</h1>
        <p>Fecha: $(date)</p>
        <p>Dispositivo: ${DEVICE_ID:-"Por defecto"}</p>
    </div>
    
    <div class="summary $([ $failed -gt 0 ] && echo "failed")">
        <h2>📊 Resumen</h2>
        <ul>
            <li>Total de tests: $total</li>
            <li>Tests exitosos: $passed</li>
            <li>Tests fallidos: $failed</li>
            <li>Porcentaje de éxito: $((passed * 100 / total))%</li>
        </ul>
    </div>
    
    <h2>📝 Categorías de Tests</h2>
    
    <div class="category">
        <h3>🔍 Búsqueda y Navegación</h3>
        <ul>
            <li>access_electoral_participation - Acceso a participación electoral</li>
            <li>mesa_search_comprehensive - Búsqueda comprehensiva de mesas</li>
            <li>search_electoral_table - Búsqueda básica de mesa electoral</li>
        </ul>
    </div>
    
    <div class="category">
        <h3>📸 Subida de Actas</h3>
        <ul>
            <li>acta_upload_comprehensive - Subida comprehensiva de actas</li>
            <li>upload_acta_photo - Subida básica de foto de acta</li>
            <li>camera_image_processing - Procesamiento de cámara e imágenes</li>
            <li>data_validation_comprehensive - Validación de datos de actas</li>
        </ul>
    </div>
    
    <div class="category">
        <h3>👁️ Atestiguamiento</h3>
        <ul>
            <li>witness_comprehensive - Atestiguamiento comprehensivo</li>
            <li>witness_actas - Atestiguamiento básico de actas</li>
            <li>upload_correct_acta - Subida de acta correcta</li>
            <li>witness_history_management - Gestión de historial</li>
        </ul>
    </div>
    
    <div class="category">
        <h3>🌐 Funcionalidades Técnicas</h3>
        <ul>
            <li>network_error_handling - Manejo de errores de red</li>
            <li>scrollprueba - Pruebas de scroll y navegación</li>
        </ul>
    </div>
    
    <div class="category">
        <h3>🎯 Integración Completa</h3>
        <ul>
            <li>electoral_participation_complete - Participación electoral completa</li>
        </ul>
    </div>
    
    <h2>📋 Detalles de Tests</h2>
EOF

# Agregar detalles de cada test al reporte
for test in "${VOTING_TESTS[@]}"; do
    test_name=$(basename "$test" .yaml)
    if [ -f "$RESULTS_DIR/${test_name}_result.xml" ]; then
        cat >> "$RESULTS_DIR/report.html" << EOF
    <div class="test-item passed">
        <strong>✅ $test_name</strong>
        <p>Archivo: $test</p>
    </div>
EOF
    else
        cat >> "$RESULTS_DIR/report.html" << EOF
    <div class="test-item failed-test">
        <strong>❌ $test_name</strong>
        <p>Archivo: $test</p>
        <p>Error: No se generó archivo de resultado</p>
    </div>
EOF
    fi
done

cat >> "$RESULTS_DIR/report.html" << EOF
    
    <div style="margin-top: 30px; padding: 15px; background: #f0f0f0; border-radius: 5px;">
        <h3>🔍 Cobertura de Funcionalidades</h3>
        <ul>
            <li>✅ Búsqueda y filtrado de mesas electorales</li>
            <li>✅ Toma de fotos y procesamiento de actas</li>
            <li>✅ Análisis con IA y OCR de documentos</li>
            <li>✅ Validación de datos electorales</li>
            <li>✅ Atestiguamiento de actas existentes</li>
            <li>✅ Subida de actas correctas</li>
            <li>✅ Gestión de historial personal</li>
            <li>✅ Manejo de errores de conectividad</li>
            <li>✅ Certificación NFT y blockchain</li>
            <li>✅ Navegación y UX en flujos complejos</li>
        </ul>
    </div>
</body>
</html>
EOF

echo ""
echo "📄 Reporte HTML generado: $RESULTS_DIR/report.html"

# Salir con código de error si hay tests fallidos
if [ $failed -gt 0 ]; then
    echo "⚠️  Algunos tests fallaron. Revisa los resultados."
    exit 1
else
    echo "🎉 Todos los tests pasaron exitosamente!"
    exit 0
fi
