#!/bin/bash

# Script para ejecutar todos los tests de autenticación en Maestro
# Uso: ./run_auth_comprehensive_tests.sh [device_id]

echo "🚀 Iniciando tests comprehensivos de autenticación..."

# Configuración
DEVICE_ID=${1:-""}
RESULTS_DIR="maestro/results/auth_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Lista de tests de autenticación
AUTH_TESTS=(
    "maestro/auth/onboarding_flow.yaml"
    "maestro/auth/login_successful.yaml"
    "maestro/auth/login_failed_pin.yaml"
    "maestro/auth/pin_validation_edge_cases.yaml"
    "maestro/auth/change_pin_comprehensive.yaml"
    "maestro/auth/biometric_comprehensive.yaml"
    "maestro/auth/account_lockout.yaml"
    "maestro/auth/guardian_recovery_flow.yaml"
    "maestro/auth/qr_backup.yaml"
    "maestro/auth/navigation_comprehensive.yaml"
    "maestro/auth/network_error_handling.yaml"
    "maestro/auth/security_validations.yaml"
    "maestro/auth/session_persistence.yaml"
    "maestro/auth/complete_auth_flow.yaml"
)

# Función para ejecutar un test individual
run_test() {
    local test_file=$1
    local test_name=$(basename "$test_file" .yaml)
    
    echo "📱 Ejecutando: $test_name"
    
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
total=${#AUTH_TESTS[@]}

echo "📋 Ejecutando $total tests de autenticación..."
echo "📂 Resultados se guardarán en: $RESULTS_DIR"
echo ""

for test in "${AUTH_TESTS[@]}"; do
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

# Generar reporte HTML simple
cat > "$RESULTS_DIR/report.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Reporte de Tests de Autenticación</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { background: #e8f5e8; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .failed { background: #ffe8e8; }
        .test-item { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .passed { border-left-color: #4CAF50; }
        .failed-test { border-left-color: #f44336; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 Reporte de Tests de Autenticación</h1>
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
    
    <h2>📝 Detalles de Tests</h2>
EOF

# Agregar detalles de cada test al reporte
for test in "${AUTH_TESTS[@]}"; do
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
