#!/bin/bash

# Script de validación de rutas para archivos Maestro
# Valida que todas las referencias de archivos en workflows y componentes existan

MAESTRO_DIR=".maestro"
ERRORS=0
WARNINGS=0

echo "🔍 Validando integridad de rutas en suite Maestro..."
echo "================================================="

# Función para validar un archivo
validate_file() {
    local file=$1
    local base_dir=$2
    
    echo "📁 Validando: $file"
    
    # Buscar referencias a otros archivos
    while IFS= read -r line; do
        if [[ $line =~ file:[[:space:]]*([^[:space:]]+\.yaml) ]]; then
            referenced_file="${BASH_REMATCH[1]}"
            
            # Construir ruta completa
            if [[ $referenced_file == /* ]]; then
                # Ruta absoluta desde raíz
                full_path="$MAESTRO_DIR/$referenced_file"
            elif [[ $referenced_file == ../* ]]; then
                # Ruta relativa hacia arriba
                full_path="$(dirname "$file")/$referenced_file"
            elif [[ $referenced_file == components/* ]] || [[ $referenced_file == workflows/* ]]; then
                # Ruta desde raíz maestro
                full_path="$MAESTRO_DIR/$referenced_file"
            else
                # Ruta relativa desde directorio actual
                full_path="$(dirname "$file")/$referenced_file"
            fi
            
            # Normalizar la ruta
            full_path=$(realpath -m "$full_path")
            
            if [[ -f "$full_path" ]]; then
                echo "  ✅ $referenced_file -> $full_path"
            else
                echo "  ❌ FALTA: $referenced_file -> $full_path"
                ERRORS=$((ERRORS + 1))
            fi
        fi
    done < "$file"
}

# Validar todos los archivos YAML
echo "🔍 Buscando archivos YAML en $MAESTRO_DIR..."

find "$MAESTRO_DIR" -name "*.yaml" -type f | while read -r yaml_file; do
    validate_file "$yaml_file" "$MAESTRO_DIR"
    echo ""
done

# Validar config.yaml específicamente
echo "🔧 Validando config.yaml..."
if [[ -f "$MAESTRO_DIR/config.yaml" ]]; then
    while IFS= read -r line; do
        if [[ $line =~ -[[:space:]]*([^[:space:]#]+) ]]; then
            flow_name="${BASH_REMATCH[1]}"
            flow_file="$MAESTRO_DIR/$flow_name.yaml"
            
            if [[ -f "$flow_file" ]]; then
                echo "  ✅ Flow: $flow_name"
            else
                echo "  ❌ FALTA FLOW: $flow_name -> $flow_file"
                ERRORS=$((ERRORS + 1))
            fi
        fi
    done < "$MAESTRO_DIR/config.yaml"
else
    echo "  ❌ config.yaml no encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "================================================="
echo "📊 RESUMEN DE VALIDACIÓN"
echo "================================================="

if [[ $ERRORS -eq 0 ]]; then
    echo "✅ ÉXITO: Todas las rutas son válidas"
    echo "🎯 Sistema listo para testing"
    exit 0
else
    echo "❌ ERRORES ENCONTRADOS: $ERRORS"
    echo "⚠️  ADVERTENCIAS: $WARNINGS"
    echo ""
    echo "🔧 Acciones recomendadas:"
    echo "1. Verificar archivos faltantes"
    echo "2. Corregir rutas incorrectas"
    echo "3. Actualizar referencias obsoletas"
    exit 1
fi
