#!/bin/bash

# Script mejorado para agregar useNavigationLogger hook a todas las pantallas

echo "🚀 Agregando useNavigationLogger hook a todas las pantallas..."

# Función para extraer el nombre del componente del archivo
get_component_name() {
    local file="$1"
    # Extraer el nombre del archivo sin extensión y path
    basename "$file" .js
}

# Función para agregar hook a un archivo
add_hook_to_file() {
    local file="$1"
    local screen_name="$2"
    
    # Verificar si el archivo existe
    if [ ! -f "$file" ]; then
        echo "❌ No encontrado: $file"
        return 1
    fi
    
    # Verificar si el archivo ya tiene el hook
    if grep -q "useNavigationLogger" "$file"; then
        echo "✓ $file ya tiene el hook"
        return 0
    fi
    
    # Verificar si el archivo exporta una función default
    if ! grep -q "export default function" "$file"; then
        echo "⚠️  $file no parece ser un componente React standard"
        return 1
    fi
    
    # Crear backup
    cp "$file" "$file.backup"
    
    # Buscar la línea donde agregar el import
    # Buscar después de los imports existentes
    local import_line=$(grep -n "^import.*from.*['\"].*['\"];*$" "$file" | tail -1 | cut -d: -f1)
    
    if [ ! -z "$import_line" ]; then
        # Agregar import después del último import
        sed -i "${import_line}a import {useNavigationLogger} from '../../hooks/useNavigationLogger';" "$file" || \
        sed -i "${import_line}a import {useNavigationLogger} from '../../../hooks/useNavigationLogger';" "$file"
    fi
    
    # Buscar donde agregar el hook (después de export default function)
    local function_line=$(grep -n "export default function.*{" "$file" | head -1 | cut -d: -f1)
    
    if [ ! -z "$function_line" ]; then
        # Buscar la primera línea con useState o useSelector para insertar después
        local hook_insert_line=$(sed -n "${function_line},\$p" "$file" | grep -n "useState\|useSelector\|useDispatch" | tail -1 | cut -d: -f1)
        
        if [ ! -z "$hook_insert_line" ]; then
            local actual_line=$((function_line + hook_insert_line))
            sed -i "${actual_line}a \\n  // Hook para logging de navegación\\n  const { logAction, logNavigation } = useNavigationLogger('$screen_name', true);" "$file"
        else
            # Si no hay hooks, insertar después de la línea de función
            sed -i "${function_line}a \\n  // Hook para logging de navegación\\n  const { logAction, logNavigation } = useNavigationLogger('$screen_name', true);" "$file"
        fi
    fi
    
    # Verificar si el hook se agregó correctamente
    if grep -q "useNavigationLogger" "$file"; then
        echo "✅ Hook agregado exitosamente a $file ($screen_name)"
        rm "$file.backup"
        return 0
    else
        echo "❌ Error al agregar hook a $file - restaurando backup"
        mv "$file.backup" "$file"
        return 1
    fi
}

# Buscar todos los archivos .js en src/container
echo "📁 Buscando archivos de pantallas..."

# Lista de archivos a procesar
find /home/saul/Documentos/GitHub/electoral-app/src/container -name "*.js" -type f | while read file; do
    screen_name=$(get_component_name "$file")
    echo "🔄 Procesando: $file -> $screen_name"
    add_hook_to_file "$file" "$screen_name"
done

echo "✨ Proceso completado!"
