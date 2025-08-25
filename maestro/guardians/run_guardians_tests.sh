#!/bin/bash

# Script para ejecutar todos los tests de guardianes con Maestro
# Uso: ./run_guardians_tests.sh [device_id]

echo "👥 Iniciando tests E2E de Guardianes para Electoral App"
echo "===================================================="

# Configuración
DEVICE_ID=${1:-""}
GUARDIANS_DIR="maestro/guardians"
RESULTS_DIR="test-results/guardians"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Crear directorio de resultados
mkdir -p $RESULTS_DIR

# Lista de tests organizados por categoría
BASIC_TESTS=(
    "access_guardians_management.yaml"
    "add_guardian.yaml"
    "remove_guardian.yaml"
)

ADMIN_TESTS=(
    "guardian_status.yaml"
    "guardian_admin.yaml"
    "accept_invitation.yaml"
    "reject_invitation.yaml"
)

RECOVERY_TESTS=(
    "approve_recovery.yaml"
    "reject_recovery.yaml"
)

CONFIG_TESTS=(
    "edit_guardian_nickname.yaml"
    "guardian_configuration.yaml"
    "guardian_info.yaml"
)

ADVANCED_TESTS=(
    "guardian_search_errors.yaml"
    "guardian_notifications.yaml"
    "complete_guardian_flow.yaml"
)

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0
SKIPPED=0

echo -e "${BLUE}📱 Dispositivo:${NC} ${DEVICE_ID:-"Auto-detectado"}"
echo -e "${BLUE}📂 Directorio:${NC} $GUARDIANS_DIR"
echo ""

# Función para ejecutar un test individual
run_test() {
    local test_file=$1
    local test_name=$(basename "$test_file" .yaml)
    local category=$2
    
    echo -e "${YELLOW}🧪 [$category] Ejecutando:${NC} $test_name"
    
    # Verificar que el archivo existe
    if [ ! -f "$GUARDIANS_DIR/$test_file" ]; then
        echo -e "${PURPLE}⏭️  SKIPPED:${NC} $test_name (archivo no encontrado)"
        ((SKIPPED++))
        return
    fi
    
    # Comando base
    local cmd="maestro test $GUARDIANS_DIR/$test_file"
    
    # Agregar device_id si se especificó
    if [ ! -z "$DEVICE_ID" ]; then
        cmd="$cmd --device-id $DEVICE_ID"
    fi
    
    # Agregar output para resultado
    local result_file="$RESULTS_DIR/${category}_${test_name}_${TIMESTAMP}.xml"
    cmd="$cmd --format junit --output $result_file"
    
    # Ejecutar test con timeout
    if timeout 300 eval $cmd > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED:${NC} $test_name"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED:${NC} $test_name"
        ((FAILED++))
        
        # Guardar logs de error
        echo "Error en $test_name [$category] - $(date)" >> "$RESULTS_DIR/errors_${TIMESTAMP}.log"
    fi
    
    echo ""
}

# Función para ejecutar una categoría de tests
run_category() {
    local category_name=$1
    local category_icon=$2
    shift 2
    local tests=("$@")
    
    echo -e "${CYAN}${category_icon} === CATEGORÍA: $category_name ===${NC}"
    echo ""
    
    for test in "${tests[@]}"; do
        run_test "$test" "$category_name"
    done
    
    echo ""
}

# Verificar que maestro está instalado
if ! command -v maestro &> /dev/null; then
    echo -e "${RED}❌ Error:${NC} Maestro no está instalado"
    echo "Instala Maestro siguiendo: https://docs.maestro.dev/getting-started/installing-maestro"
    exit 1
fi

# Verificar que el directorio de tests existe
if [ ! -d "$GUARDIANS_DIR" ]; then
    echo -e "${RED}❌ Error:${NC} Directorio $GUARDIANS_DIR no encontrado"
    exit 1
fi

# Ejecutar tests por categorías
echo -e "${BLUE}🏃 Ejecutando tests de guardianes...${NC}"
echo ""

run_category "BASIC" "🔧" "${BASIC_TESTS[@]}"
run_category "ADMIN" "👨‍💼" "${ADMIN_TESTS[@]}"
run_category "RECOVERY" "🔄" "${RECOVERY_TESTS[@]}"
run_category "CONFIG" "⚙️" "${CONFIG_TESTS[@]}"
run_category "ADVANCED" "🚀" "${ADVANCED_TESTS[@]}"

# Calcular totales
TOTAL=$((PASSED + FAILED + SKIPPED))

# Resumen final
echo "===================================================="
echo -e "${BLUE}📊 RESUMEN DE EJECUCIÓN - GUARDIANES${NC}"
echo "===================================================="
echo -e "${GREEN}✅ Tests exitosos:${NC} $PASSED"
echo -e "${RED}❌ Tests fallidos:${NC} $FAILED"
echo -e "${PURPLE}⏭️  Tests omitidos:${NC} $SKIPPED"
echo -e "${BLUE}📈 Total ejecutados:${NC} $TOTAL"

# Calcular porcentaje de éxito
if [ $((PASSED + FAILED)) -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED * 100) / (PASSED + FAILED) ))
    echo -e "${BLUE}🎯 Tasa de éxito:${NC} ${SUCCESS_RATE}%"
fi

echo ""

# Resumen por categorías
echo -e "${CYAN}📋 RESUMEN POR CATEGORÍAS:${NC}"
echo "• Tests básicos: ${#BASIC_TESTS[@]} tests"
echo "• Tests de administración: ${#ADMIN_TESTS[@]} tests"
echo "• Tests de recuperación: ${#RECOVERY_TESTS[@]} tests"
echo "• Tests de configuración: ${#CONFIG_TESTS[@]} tests"
echo "• Tests avanzados: ${#ADVANCED_TESTS[@]} tests"

echo ""
echo -e "${BLUE}📁 Resultados guardados en:${NC} $RESULTS_DIR"

# Mostrar archivos de log si hay errores
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}📋 Log de errores:${NC} $RESULTS_DIR/errors_${TIMESTAMP}.log"
fi

# Exit code basado en resultados
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Todos los tests de guardianes pasaron exitosamente!${NC}"
    exit 0
else
    echo -e "${RED}💥 Algunos tests fallaron. Revisa los logs para más detalles.${NC}"
    
    # Sugerencias de troubleshooting
    echo ""
    echo -e "${YELLOW}💡 SUGERENCIAS:${NC}"
    echo "• Verifica que tengas guardianes configurados"
    echo "• Confirma conectividad de red estable"
    echo "• Revisa que los CIs de prueba sean válidos"
    echo "• Ejecuta tests individuales para debug específico"
    
    exit 1
fi
