#!/bin/bash

# Script para corregir las rutas de archivos de Maestro de forma precisa

echo "Corrigiendo rutas de archivos de Maestro de forma sistemática..."

cd /home/saul/Documentos/GitHub/electoral-app/.maestro

# Desde workflows/ a components/ (1 nivel arriba)
find workflows -maxdepth 1 -name "*.yaml" -type f -exec sed -i 's|file: recoveryQR\.yaml|file: ../components/recovery/recoveryQR.yaml|g' {} \;
find workflows -maxdepth 1 -name "*.yaml" -type f -exec sed -i 's|file: recoveryGuardian\.yaml|file: ../components/recovery/recoveryGuardian.yaml|g' {} \;

# Desde workflows/subdirectory/ a components/ (2 niveles arriba)
find workflows -mindepth 2 -maxdepth 2 -name "*.yaml" -type f -exec sed -i 's|file: recoveryQR\.yaml|file: ../../components/recovery/recoveryQR.yaml|g' {} \;
find workflows -mindepth 2 -maxdepth 2 -name "*.yaml" -type f -exec sed -i 's|file: recoveryGuardian\.yaml|file: ../../components/recovery/recoveryGuardian.yaml|g' {} \;
find workflows -mindepth 2 -maxdepth 2 -name "*.yaml" -type f -exec sed -i 's|file: uploadElectoralRecord\.yaml|file: ../../components/voting/uploadElectoralRecord.yaml|g' {} \;
find workflows -mindepth 2 -maxdepth 2 -name "*.yaml" -type f -exec sed -i 's|file: navigateTo\.yaml|file: ../navigateTo.yaml|g' {} \;

# Desde workflows/sub/sub/ a components/ (3 niveles arriba)
find workflows -mindepth 3 -maxdepth 3 -name "*.yaml" -type f -exec sed -i 's|file: navigateTo\.yaml|file: ../../navigateTo.yaml|g' {} \;
find workflows -mindepth 3 -maxdepth 3 -name "*.yaml" -type f -exec sed -i 's|file: createPin\.yaml|file: ../../../../components/auth/createPin.yaml|g' {} \;
find workflows -mindepth 3 -maxdepth 3 -name "*.yaml" -type f -exec sed -i 's|file: initialSetup\.yaml|file: ../../../initialSetup.yaml|g' {} \;

# Desde workflows/sub/sub/sub/ a components/ (4 niveles arriba)
find workflows -mindepth 4 -maxdepth 4 -name "*.yaml" -type f -exec sed -i 's|file: navigateTo\.yaml|file: ../../../navigateTo.yaml|g' {} \;

# Corregir rutas que quedaron mal por el script anterior
find workflows -name "*.yaml" -type f -exec sed -i 's|file: ../../../../components/recovery/recoveryQR\.yaml|file: ../../components/recovery/recoveryQR.yaml|g' {} \;
find workflows -name "*.yaml" -type f -exec sed -i 's|file: ../../../../components/guardians/findGuardian\.yaml|file: ../../components/guardians/findGuardian.yaml|g' {} \;

# Para archivos en invitations/ que necesitan acceder a guardians
find workflows/profile/guardians/invitations -name "*.yaml" -type f -exec sed -i 's|file: \.\./components/guardians/findGuardian\.yaml|file: ../../../../components/guardians/findGuardian.yaml|g' {} \;
find workflows/profile/guardians/invitations -name "*.yaml" -type f -exec sed -i 's|file: \.\./components/recovery/recoveryQR\.yaml|file: ../../../../components/recovery/recoveryQR.yaml|g' {} \;

echo "Correcciones completadas con precisión."
