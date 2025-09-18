#!/bin/bash

# Script para corregir paths incorrectos del hook useNavigationLogger

echo "🔧 Corrigiendo paths del import useNavigationLogger..."

# Función para corregir el path según la profundidad del archivo
fix_import_path() {
    local file="$1"
    
    # Verificar si el archivo tiene el import incorrecto
    if ! grep -q "useNavigationLogger" "$file"; then
        return 0
    fi
    
    # Calcular la profundidad relativa desde src/container
    local container_path="/home/saul/Documentos/GitHub/electoral-app/src/container"
    local relative_path="${file#$container_path/}"
    local depth=$(echo "$relative_path" | tr -cd '/' | wc -c)
    
    # Determinar el path correcto según la profundidad
    local correct_path=""
    case $depth in
        0) correct_path="../hooks/useNavigationLogger" ;;
        1) correct_path="../../hooks/useNavigationLogger" ;;
        2) correct_path="../../../hooks/useNavigationLogger" ;;
        3) correct_path="../../../../hooks/useNavigationLogger" ;;
        *) correct_path="../../../hooks/useNavigationLogger" ;; # fallback
    esac
    
    echo "📁 $file (depth: $depth) -> $correct_path"
    
    # Corregir todos los posibles paths incorrectos
    sed -i "s|from '[^']*hooks/useNavigationLogger'|from '$correct_path'|g" "$file"
    sed -i 's|from "[^"]*hooks/useNavigationLogger"|from "'$correct_path'"|g' "$file"
}

# Buscar todos los archivos que tienen el import
find /home/saul/Documentos/GitHub/electoral-app/src/container -name "*.js" -type f -exec grep -l "useNavigationLogger" {} \; | while read file; do
    fix_import_path "$file"
done

echo "✅ Paths corregidos!"
