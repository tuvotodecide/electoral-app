#!/bin/bash

# Script para grabar todos los flujos de Maestro en orden secuencial
# Basado en la configuración de flowsOrder en config.yaml

echo "🎬 Iniciando grabación de todos los flujos en orden secuencial..."
echo ""

# Crear directorio para videos si no existe
mkdir -p recordings

# Lista de flujos en el orden especificado en config.yaml
FLOWS=(
    # onBoarding
    "workflows/onboarding/nextFlow.yaml"
    "workflows/onboarding/swipeFlow.yaml"
    "workflows/onboarding/xButton.yaml"
    "workflows/onboarding/middleBack.yaml"
    # recoveryQR
    "workflows/recovery/failedRecoveryQR.yaml"
    "workflows/recovery/successfulRecoveryQR.yaml"
    # auth
    "workflows/auth/loginWrongPin.yaml"
    "workflows/auth/loginCorrectPin.yaml"
    # blockAccount -reset
    "workflows/recovery/blockedAccount/recoverBlockedAccountQR.yaml"
    # profile
    "workflows/profile/assertPersonalData.yaml"
    "workflows/profile/assertRecoveryQR.yaml"
    # moreOptions
    "workflows/profile/moreOptions/assertToS.yaml"
    "workflows/profile/moreOptions/assertPP.yaml"
    # securityOptions
    "workflows/profile/moreOptions/securitySettings/changePin.yaml"
    # guardians
    "workflows/profile/guardians/navigateTo.yaml"
    # whatAreGuardians
    "workflows/profile/guardians/whatAreGuardians/nextFlowGuard.yaml"
    "workflows/profile/guardians/whatAreGuardians/swipeFlowGuard.yaml"
    "workflows/profile/guardians/whatAreGuardians/xButtonGuard.yaml"
    "workflows/profile/guardians/whatAreGuardians/middleBackGuard.yaml"
    # addGuardian
    "workflows/profile/guardians/invitations/failedFindGuardian.yaml"
    "workflows/profile/guardians/invitations/successfulFindGuardian.yaml"
    "workflows/profile/guardians/invitations/selfInvitation.yaml"
    "workflows/profile/guardians/invitations/sendGuardInvitation.yaml"
    "workflows/profile/guardians/invitations/resendGuardianInvitation.yaml"
    "workflows/profile/guardians/invitations/acceptGuardInvitation.yaml"
    # RecoveryGuardian
    "workflows/recovery/failedRecoveryGuardian.yaml"
    "workflows/recovery/successfulRecoveryGuardian.yaml"
    # Participate
    "workflows/participate/submitWrongImageGallery.yaml"
    "workflows/participate/wrongPartySumatory.yaml"
    "workflows/participate/submitElectoralRecordCamera.yaml"
    "workflows/participate/submitElectoralRecordGallery.yaml"
    "workflows/participate/resubmitElectoralRecordGallery.yaml"
)

# Función para grabar un flujo
record_flow() {
    local flow="$1"
    local flow_name=$(basename "$flow" .yaml)
    local category=$(dirname "$flow" | sed 's/workflows\///')
    
    echo "📹 Grabando: $flow"
    echo "   Categoría: $category"
    echo "   Archivo: recordings/${category}_${flow_name}.mp4"
    
    # Verificar si el archivo existe
    if [[ ! -f "$flow" ]]; then
        echo "⚠️  Archivo no encontrado: $flow"
        echo ""
        return
    fi
    
    # Grabar el flujo
    if maestro record --config ./config.yaml --local "$flow"; then
        echo "✅ Grabación exitosa: $flow"
        
        # Mover el video a la carpeta recordings con nombre descriptivo
        if [[ -f "recording.mp4" ]]; then
            mv "recording.mp4" "recordings/${category//\//_}_${flow_name}.mp4"
            echo "   📁 Video guardado en: recordings/${category//\//_}_${flow_name}.mp4"
        fi
    else
        echo "❌ Error al grabar: $flow"
    fi
    
    echo ""
    sleep 2  # Pausa entre grabaciones
}

# Contador
total=${#FLOWS[@]}
current=1

echo "📊 Total de flujos a grabar: $total"
echo ""

# Grabar cada flujo
for flow in "${FLOWS[@]}"; do
    echo "[$current/$total] ===================="
    record_flow "$flow"
    ((current++))
done

echo "🎉 ¡Grabación de todos los flujos completada!"
echo "📁 Los videos están guardados en la carpeta: recordings/"
