#!/bin/bash

# Script maestro para ejecutar todos los tests comprehensivos de la aplicación
# Uso: ./run_all_comprehensive_tests.sh [device_id] [suite]

echo "🚀 Iniciando suite completa de tests e2e..."

# Configuración
DEVICE_ID=${1:-""}
SUITE=${2:-"all"}  # all, auth, voting
RESULTS_DIR="maestro/results/complete_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [device_id] [suite]"
    echo ""
    echo "Parámetros:"
    echo "  device_id    ID del dispositivo (opcional)"
    echo "  suite        Suite a ejecutar: all, auth, voting (default: all)"
    echo ""
    echo "Ejemplos:"
    echo "  $0                           # Ejecutar todos los tests"
    echo "  $0 emulator-5554            # Ejecutar en dispositivo específico"
    echo "  $0 \"\" auth                # Solo tests de autenticación"
    echo "  $0 emulator-5554 voting     # Solo tests de votación en dispositivo específico"
}

# Verificar si se solicita ayuda
if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Contadores globales
total_passed=0
total_failed=0
total_tests=0

# Función para ejecutar una suite de tests
run_suite() {
    local suite_name=$1
    local script_path=$2
    
    echo ""
    echo "🎯 Ejecutando suite: $suite_name"
    echo "=================================================="
    
    if [ ! -f "$script_path" ]; then
        echo "❌ Error: Script no encontrado: $script_path"
        return 1
    fi
    
    # Hacer el script ejecutable si no lo es
    chmod +x "$script_path"
    
    # Ejecutar el script y capturar la salida
    if [ -n "$DEVICE_ID" ]; then
        $script_path "$DEVICE_ID"
    else
        $script_path
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ Suite $suite_name: COMPLETADA EXITOSAMENTE"
    else
        echo "❌ Suite $suite_name: FALLÓ (código: $exit_code)"
    fi
    
    return $exit_code
}

# Función para generar reporte consolidado
generate_consolidated_report() {
    echo "📊 Generando reporte consolidado..."
    
    # Crear directorio de reportes consolidados
    CONSOLIDATED_DIR="$RESULTS_DIR/consolidated"
    mkdir -p "$CONSOLIDATED_DIR"
    
    # Combinar resultados XML si existen
    if ls maestro/results/auth_*/auth_*_result.xml 1> /dev/null 2>&1; then
        echo "Copiando resultados de autenticación..."
        cp maestro/results/auth_*/auth_*_result.xml "$CONSOLIDATED_DIR/" 2>/dev/null || true
    fi
    
    if ls maestro/results/voting_*/voting_*_result.xml 1> /dev/null 2>&1; then
        echo "Copiando resultados de votación..."
        cp maestro/results/voting_*/voting_*_result.xml "$CONSOLIDATED_DIR/" 2>/dev/null || true
    fi
    
    # Generar reporte HTML consolidado
    cat > "$RESULTS_DIR/consolidated_report.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Reporte Consolidado - Tests E2E Aplicación Electoral</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f5f5f5;
        }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            border-radius: 8px; 
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .summary-card { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #28a745; 
        }
        .summary-card.failed { border-left-color: #dc3545; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #28a745; }
        .summary-card.failed .number { color: #dc3545; }
        .suite-section { margin: 30px 0; }
        .suite-header { 
            background: #e9ecef; 
            padding: 15px 20px; 
            border-radius: 8px; 
            border-left: 4px solid #007bff;
            margin-bottom: 15px;
        }
        .test-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 15px; 
        }
        .test-item { 
            background: white; 
            border: 1px solid #dee2e6; 
            border-radius: 6px; 
            padding: 15px; 
            border-left: 4px solid #28a745;
        }
        .test-item.failed { border-left-color: #dc3545; }
        .test-name { font-weight: bold; color: #333; margin-bottom: 5px; }
        .test-description { color: #6c757d; font-size: 0.9em; }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #dee2e6; 
            color: #6c757d; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗳️ Reporte Consolidado E2E</h1>
            <p>Aplicación Electoral - Tests Comprehensivos</p>
            <p>Fecha: $(date '+%d/%m/%Y %H:%M:%S')</p>
            <p>Dispositivo: ${DEVICE_ID:-"Por defecto"}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total de Tests</h3>
                <div class="number">$total_tests</div>
            </div>
            <div class="summary-card">
                <h3>Tests Exitosos</h3>
                <div class="number">$total_passed</div>
            </div>
            <div class="summary-card $([ $total_failed -gt 0 ] && echo "failed")">
                <h3>Tests Fallidos</h3>
                <div class="number">$total_failed</div>
            </div>
            <div class="summary-card">
                <h3>Porcentaje de Éxito</h3>
                <div class="number">$([ $total_tests -gt 0 ] && echo $((total_passed * 100 / total_tests)) || echo 0)%</div>
            </div>
        </div>
        
        <div class="suite-section">
            <div class="suite-header">
                <h2>🔐 Suite de Autenticación</h2>
                <p>Tests de login, seguridad, biometría, guardianes, PIN y recuperación</p>
            </div>
            <div class="test-grid">
                <div class="test-item">
                    <div class="test-name">Login y Validación de PIN</div>
                    <div class="test-description">Tests de login exitoso, fallos, casos límite y validaciones</div>
                </div>
                <div class="test-item">
                    <div class="test-name">Cambio y Gestión de PIN</div>
                    <div class="test-description">Flujos de cambio de PIN con validaciones comprehensivas</div>
                </div>
                <div class="test-item">
                    <div class="test-name">Autenticación Biométrica</div>
                    <div class="test-description">Configuración de huella dactilar y Face ID</div>
                </div>
                <div class="test-item">
                    <div class="test-name">Seguridad y Bloqueos</div>
                    <div class="test-description">Bloqueo por intentos fallidos y validaciones de seguridad</div>
                </div>
                <div class="test-item">
                    <div class="test-name">Recuperación de Cuenta</div>
                    <div class="test-description">Recuperación por guardianes y códigos QR</div>
                </div>
                <div class="test-item">
                    <div class="test-name">Navegación y Estados</div>
                    <div class="test-description">Navegación compleja y persistencia de sesión</div>
                </div>
            </div>
        </div>
        
        <div class="suite-section">
            <div class="suite-header">
                <h2>🗳️ Suite de Votación Electoral</h2>
                <p>Tests de subida de actas, atestiguamiento, validación de datos y certificación NFT</p>
            </div>
            <div class="test-grid">
                <div class="test-item">
                    <div class="test-name">Búsqueda de Mesas</div>
                    <div class="test-description">Búsqueda y filtrado de mesas electorales con validaciones</div>
                </div>
                <div class="test-item">
                    <div class="test-name">Subida de Actas</div>
                    <div class="test-description">Captura de fotos, análisis IA y subida de actas electorales</div>
                </div>
                <div class="test-item">
                    <div class="test-name">Procesamiento de Imágenes</div>
                    <div class="test-description">Funcionalidades de cámara, OCR y calidad de imagen</div>
                </div>
                <div class="test-item">
                    <div class="test-name">Validación de Datos</div>
                    <div class="test-description">Validaciones exhaustivas de formularios electorales</div>
                </div>
                <div class="test-item">
                    <div class="test-name">Atestiguamiento</div>
                    <div class="test-description">Atestiguamiento de actas existentes y gestión de historial</div>
                </div>
                <div class="test-item">
                    <div class="test-name">Conectividad y Errores</div>
                    <div class="test-description">Manejo de errores de red y modo offline</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Generado automáticamente por la suite de tests E2E</p>
            <p>Para más detalles, consulta los reportes individuales de cada suite</p>
        </div>
    </div>
</body>
</html>
EOF

    echo "✅ Reporte consolidado generado: $RESULTS_DIR/consolidated_report.html"
}

# Banner de inicio
echo "🗳️ SUITE COMPLETA DE TESTS E2E - APLICACIÓN ELECTORAL"
echo "======================================================"
echo "📱 Dispositivo: ${DEVICE_ID:-"Por defecto"}"
echo "🎯 Suite seleccionada: $SUITE"
echo "📂 Resultados en: $RESULTS_DIR"
echo ""

# Ejecutar suites según la selección
case $SUITE in
    "auth")
        echo "🔐 Ejecutando únicamente tests de autenticación..."
        run_suite "Autenticación" "maestro/auth/run_auth_comprehensive_tests.sh"
        ;;
    "voting")
        echo "🗳️ Ejecutando únicamente tests de votación..."
        run_suite "Votación Electoral" "maestro/voting/run_voting_comprehensive_tests.sh"
        ;;
    "all"|*)
        echo "🚀 Ejecutando suite completa..."
        
        # Ejecutar tests de autenticación
        run_suite "Autenticación" "maestro/auth/run_auth_comprehensive_tests.sh"
        auth_result=$?
        
        # Ejecutar tests de votación
        run_suite "Votación Electoral" "maestro/voting/run_voting_comprehensive_tests.sh"
        voting_result=$?
        
        # Calcular resultados totales
        if [ $auth_result -eq 0 ] && [ $voting_result -eq 0 ]; then
            echo ""
            echo "🎉 TODAS LAS SUITES COMPLETADAS EXITOSAMENTE!"
            final_result=0
        else
            echo ""
            echo "⚠️ ALGUNAS SUITES FALLARON:"
            [ $auth_result -ne 0 ] && echo "   ❌ Suite de Autenticación"
            [ $voting_result -ne 0 ] && echo "   ❌ Suite de Votación Electoral"
            final_result=1
        fi
        ;;
esac

# Generar reporte consolidado
generate_consolidated_report

# Resumen final
echo ""
echo "📊 RESUMEN FINAL:"
echo "========================================"
echo "🕒 Tiempo de ejecución: $(date)"
echo "📱 Dispositivo utilizado: ${DEVICE_ID:-"Por defecto"}"
echo "🎯 Suite ejecutada: $SUITE"
echo "📂 Resultados guardados en: $RESULTS_DIR"
echo "📄 Reporte consolidado: $RESULTS_DIR/consolidated_report.html"
echo "========================================"

# Mostrar enlaces rápidos a reportes
echo ""
echo "📋 REPORTES DISPONIBLES:"
if [ "$SUITE" == "all" ] || [ "$SUITE" == "auth" ]; then
    echo "   🔐 Autenticación: maestro/results/auth_*/report.html"
fi
if [ "$SUITE" == "all" ] || [ "$SUITE" == "voting" ]; then
    echo "   🗳️ Votación: maestro/results/voting_*/report.html"
fi
echo "   📊 Consolidado: $RESULTS_DIR/consolidated_report.html"

echo ""
if [ "${final_result:-0}" -eq 0 ]; then
    echo "🎉 ¡Ejecución completada exitosamente!"
    exit 0
else
    echo "⚠️ La ejecución completó con errores. Revisa los reportes para más detalles."
    exit 1
fi
