#!/bin/bash

# Script para corregir errores de sintaxis en archivos con useNavigationLogger mal posicionado

echo "🔧 Detectando y corrigiendo errores de sintaxis en hooks..."

# Función para corregir un archivo específico
fix_syntax_error() {
    local file="$1"
    
    echo "🔍 Revisando: $file"
    
    # Verificar si el archivo tiene errores de sintaxis relacionados con el hook
    if node -c "$file" 2>&1 | grep -q "Unexpected token"; then
        echo "❌ Error encontrado en $file - corrigiendo..."
        
        # Crear backup
        cp "$file" "$file.backup"
        
        # Buscar y eliminar líneas problemáticas con el hook mal posicionado
        # Patrón: líneas que empiezan con "n  // Hook para logging" o similares
        sed -i '/^n  \/\/ Hook para logging/d' "$file"
        sed -i '/^  const { logAction, logNavigation } = useNavigationLogger.*true);$/d' "$file"
        
        # Buscar la función export default y agregar el hook correctamente
        local function_line=$(grep -n "export default function" "$file" | head -1 | cut -d: -f1)
        
        if [ ! -z "$function_line" ]; then
            # Buscar dónde insertar el hook (después de useState, useSelector, etc.)
            local insert_line=$(sed -n "${function_line},\$p" "$file" | grep -n "useState\|useSelector\|useDispatch" | tail -1 | cut -d: -f1)
            
            if [ ! -z "$insert_line" ]; then
                local actual_line=$((function_line + insert_line))
                # Extraer el nombre del componente
                local component_name=$(basename "$file" .js)
                
                # Insertar el hook correctamente
                sed -i "${actual_line}a \\n  // Hook para logging de navegación\\n  const { logAction, logNavigation } = useNavigationLogger('$component_name', true);" "$file"
            fi
        fi
        
        # Verificar si se corrigió
        if node -c "$file" 2>/dev/null; then
            echo "✅ Corregido: $file"
            rm "$file.backup"
        else
            echo "❌ No se pudo corregir automáticamente: $file - restaurando backup"
            mv "$file.backup" "$file"
        fi
    else
        echo "✅ Sin errores: $file"
    fi
}

# Buscar archivos con el hook y verificar sintaxis
find /home/saul/Documentos/GitHub/electoral-app/src/container -name "*.js" -type f -exec grep -l "useNavigationLogger" {} \; | while read file; do
    fix_syntax_error "$file"
done

echo "✅ Proceso completado!"
