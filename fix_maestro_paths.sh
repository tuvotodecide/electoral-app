#!/bin/bash

# Script para corregir las rutas de los archivos de Maestro

echo "Corrigiendo rutas de archivos en Maestro workflows..."

cd /home/saul/Documentos/GitHub/electoral-app/.maestro/workflows

# Corregir referencias a archivos de componentes desde diferentes niveles
find . -name "*.yaml" -type f -exec sed -i 's|file: recoveryQR\.yaml|file: ../components/recovery/recoveryQR.yaml|g' {} \;
find . -name "*.yaml" -type f -exec sed -i 's|file: recoveryGuardian\.yaml|file: ../components/recovery/recoveryGuardian.yaml|g' {} \;
find . -name "*.yaml" -type f -exec sed -i 's|file: login\.yaml|file: ../../components/auth/login.yaml|g' {} \;
find . -name "*.yaml" -type f -exec sed -i 's|file: uploadElectoralRecord\.yaml|file: ../components/voting/uploadElectoralRecord.yaml|g' {} \;
find . -name "*.yaml" -type f -exec sed -i 's|file: createPin\.yaml|file: ../../../components/auth/createPin.yaml|g' {} \;

# Corregir referencias a workflows desde subdirectorios
find . -name "*.yaml" -type f -exec sed -i 's|file: workflows/initialSetup\.yaml|file: ../initialSetup.yaml|g' {} \;
find . -name "*.yaml" -type f -exec sed -i 's|file: initialSetup\.yaml|file: ../../initialSetup.yaml|g' {} \;
find . -name "*.yaml" -type f -exec sed -i 's|file: navigateTo\.yaml|file: ../navigateTo.yaml|g' {} \;

# Corregir rutas específicas problemáticas
find . -name "*.yaml" -type f -exec sed -i 's|file: \.\./components/guardians/findGuardian\.yaml|file: ../../../../components/guardians/findGuardian.yaml|g' {} \;
find . -name "*.yaml" -type f -exec sed -i 's|file: \.\./components/recovery/recoveryQR\.yaml|file: ../../../../components/recovery/recoveryQR.yaml|g' {} \;

echo "Correcciones completadas."
