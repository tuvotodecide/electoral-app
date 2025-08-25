#!/bin/bash

# Script para ejecutar todos los tests de autenticación con Maestro
# Uso: ./run_auth_tests.sh [device_id]

echo "🚀 Iniciando tests E2E de Autenticación para Electoral App"
echo "=================================================="

# Configuración
DEVICE_ID=${1:-""}
AUTH_DIR="maestro/auth"
RESULTS_DIR="test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Crear directorio de resultados
mkdir -p $RESULTS_DIR

# Lista de tests a ejecutar en orden
TESTS=(
    "login_successful.yaml"
    "login_failed_pin.yaml"
    "logout_and_login.yaml"
    "register_navigation.yaml"
    "account_recovery.yaml"
    "change_pin.yaml"
    "account_lock.yaml"
    "biometric_setup.yaml"
    "user_profile.yaml"
    "navigation_flow.yaml"
    "guardians_management.yaml"
    "qr_backup.yaml"
    "complete_auth_flow.yaml"
)

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0
TOTAL=${#TESTS[@]}

echo -e "${BLUE}📱 Dispositivo:${NC} ${DEVICE_ID:-"Auto-detectado"}"
echo -e "${BLUE}📂 Directorio:${NC} $AUTH_DIR"
echo -e "${BLUE}📊 Total tests:${NC} $TOTAL"
echo ""

# Función para ejecutar un test individual
run_test() {
    local test_file=$1
    local test_name=$(basename "$test_file" .yaml)
    
    echo -e "${YELLOW}🧪 Ejecutando:${NC} $test_name"
    
    # Comando base
    local cmd="maestro test $AUTH_DIR/$test_file"
    
    # Agregar device_id si se especificó
    if [ ! -z "$DEVICE_ID" ]; then
        cmd="$cmd --device-id $DEVICE_ID"
    fi
    
    # Agregar output para resultado
    local result_file="$RESULTS_DIR/${test_name}_${TIMESTAMP}.xml"
    cmd="$cmd --format junit --output $result_file"
    
    # Ejecutar test
    if eval $cmd > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED:${NC} $test_name"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED:${NC} $test_name"
        ((FAILED++))
        
        # Guardar logs de error
        echo "Error en $test_name - $(date)" >> "$RESULTS_DIR/errors_${TIMESTAMP}.log"
    fi
    
    echo ""
}

# Verificar que maestro está instalado
if ! command -v maestro &> /dev/null; then
    echo -e "${RED}❌ Error:${NC} Maestro no está instalado"
    echo "Instala Maestro siguiendo: https://docs.maestro.dev/getting-started/installing-maestro"
    exit 1
fi

# Verificar que el directorio de tests existe
if [ ! -d "$AUTH_DIR" ]; then
    echo -e "${RED}❌ Error:${NC} Directorio $AUTH_DIR no encontrado"
    exit 1
fi

# Ejecutar tests
echo -e "${BLUE}🏃 Ejecutando tests...${NC}"
echo ""

for test in "${TESTS[@]}"; do
    if [ -f "$AUTH_DIR/$test" ]; then
        run_test "$test"
    else
        echo -e "${RED}⚠️  Warning:${NC} Test $test no encontrado"
    fi
done

# Resumen final
echo "=================================================="
echo -e "${BLUE}📊 RESUMEN DE EJECUCIÓN${NC}"
echo "=================================================="
echo -e "${GREEN}✅ Tests exitosos:${NC} $PASSED"
echo -e "${RED}❌ Tests fallidos:${NC} $FAILED"
echo -e "${BLUE}📈 Total ejecutados:${NC} $((PASSED + FAILED))"

# Calcular porcentaje de éxito
if [ $((PASSED + FAILED)) -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED * 100) / (PASSED + FAILED) ))
    echo -e "${BLUE}🎯 Tasa de éxito:${NC} ${SUCCESS_RATE}%"
fi

echo ""
echo -e "${BLUE}📁 Resultados guardados en:${NC} $RESULTS_DIR"

# Exit code basado en resultados
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Todos los tests pasaron exitosamente!${NC}"
    exit 0
else
    echo -e "${RED}💥 Algunos tests fallaron. Revisa los logs para más detalles.${NC}"
    exit 1
fi
