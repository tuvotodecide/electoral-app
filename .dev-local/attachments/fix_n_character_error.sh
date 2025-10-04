#!/bin/bash

# Script para corregir el problema de la 'n' suelta en archivos con hooks
echo "🔧 Corrigiendo archivos con 'n' suelta en hooks..."

# Buscar todos los archivos con el patrón problemático
files=$(find /home/saul/Documentos/GitHub/electoral-app/src/container -name "*.js" -type f -exec grep -l "^n  \/\/ Hook para logging" {} \;)

if [ -z "$files" ]; then
    echo "✅ No se encontraron archivos con el problema de 'n' suelta"
    exit 0
fi

echo "📁 Archivos a corregir:"
echo "$files" | wc -l
echo ""

# Contador para estadísticas
fixed_count=0
error_count=0

# Procesar cada archivo
while IFS= read -r file; do
    if [ -f "$file" ]; then
        echo "🔄 Procesando: $(basename "$file")"
        
        # Crear backup
        cp "$file" "$file.backup.$(date +%s)"
        
        # Corregir el problema: remover la 'n' suelta antes del comentario del hook
        sed -i 's/^n  \/\/ Hook para logging/  \/\/ Hook para logging/' "$file"
        
        # Verificar sintaxis
        if node -c "$file" 2>/dev/null; then
            echo "✅ Corregido: $(basename "$file")"
            ((fixed_count++))
        else
            echo "❌ Error en: $(basename "$file")"
            # Restaurar backup si hay error
            mv "$file.backup.$(date +%s)" "$file" 2>/dev/null || true
            ((error_count++))
        fi
    fi
done <<< "$files"

echo ""
echo "📊 Resumen:"
echo "✅ Archivos corregidos: $fixed_count"
echo "❌ Archivos con errores: $error_count"

if [ $error_count -eq 0 ]; then
    echo ""
    echo "🎉 ¡Todos los archivos corregidos exitosamente!"
    
    # Limpiar backups antiguos
    find /home/saul/Documentos/GitHub/electoral-app/src/container -name "*.js.backup.*" -mtime +1 -delete 2>/dev/null || true
else
    echo ""
    echo "⚠️  Algunos archivos requieren corrección manual"
fi
