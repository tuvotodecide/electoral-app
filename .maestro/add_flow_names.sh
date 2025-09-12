#!/bin/bash

# Script para añadir nombres únicos a todos los flujos de Maestro
# Esto es necesario para la ejecución secuencial usando flowsOrder

echo "Agregando nombres únicos a los flujos de Maestro..."

# Función para añadir nombre a un archivo si no lo tiene
add_name_to_flow() {
    local file="$1"
    local name="$2"
    
    # Verificar si el archivo ya tiene un campo 'name'
    if grep -q "^name:" "$file"; then
        echo "✓ $file ya tiene nombre"
        return
    fi
    
    # Añadir el campo name después de appId
    sed -i "/^appId:/a name: $name" "$file"
    echo "✓ Añadido nombre '$name' a $file"
}

# Procesamiento de flujos por categoría

# 1. OnBoarding flows
add_name_to_flow "workflows/onboarding/swipeFlow.yaml" "onboardingSwipeFlow"
add_name_to_flow "workflows/onboarding/xButton.yaml" "onboardingXButton" 
add_name_to_flow "workflows/onboarding/middleBack.yaml" "onboardingMiddleBack"

# 2. Recovery flows
add_name_to_flow "workflows/recovery/failedRecoveryQR.yaml" "recoveryFailedQR"
add_name_to_flow "workflows/recovery/successfulRecoveryQR.yaml" "recoverySuccessfulQR"
add_name_to_flow "workflows/recovery/blockedAccount/recoverBlockedAccountQR.yaml" "recoverBlockedAccountQR"
add_name_to_flow "workflows/recovery/failedRecoveryGuardian.yaml" "recoveryFailedGuardian"
add_name_to_flow "workflows/recovery/successfulRecoveryGuardian.yaml" "recoverySuccessfulGuardian"

# 3. Auth flows
add_name_to_flow "workflows/auth/loginCorrectPin.yaml" "loginCorrectPin"

# 4. Profile flows
add_name_to_flow "workflows/profile/assertPersonalData.yaml" "assertPersonalData"
add_name_to_flow "workflows/profile/assertRecoveryQR.yaml" "assertRecoveryQR"

# 5. More Options flows
add_name_to_flow "workflows/profile/moreOptions/assertToS.yaml" "assertToS"
add_name_to_flow "workflows/profile/moreOptions/assertPP.yaml" "assertPP"

# 6. Security Settings flows
add_name_to_flow "workflows/profile/moreOptions/securitySettings/changePin.yaml" "changePin"

# 7. Guardians flows
add_name_to_flow "workflows/profile/guardians/navigateTo.yaml" "navigateToGuardians"

# 8. What Are Guardians flows
add_name_to_flow "workflows/profile/guardians/whatAreGuardians/nextFlowGuard.yaml" "nextFlowGuard"
add_name_to_flow "workflows/profile/guardians/whatAreGuardians/swipeFlowGuard.yaml" "swipeFlowGuard"
add_name_to_flow "workflows/profile/guardians/whatAreGuardians/xButtonGuard.yaml" "xButtonGuard"
add_name_to_flow "workflows/profile/guardians/whatAreGuardians/middleBackGuard.yaml" "middleBackGuard"

# 9. Guardian Invitations flows
add_name_to_flow "workflows/profile/guardians/invitations/failedFindGuardian.yaml" "failedFindGuardian"
add_name_to_flow "workflows/profile/guardians/invitations/successfulFindGuardian.yaml" "successfulFindGuardian"
add_name_to_flow "workflows/profile/guardians/invitations/selfInvitation.yaml" "selfInvitation"
add_name_to_flow "workflows/profile/guardians/invitations/sendGuardInvitation.yaml" "sendGuardInvitation"
add_name_to_flow "workflows/profile/guardians/invitations/resendGuardianInvitation.yaml" "resendGuardianInvitation"
add_name_to_flow "workflows/profile/guardians/invitations/acceptGuardInvitation.yaml" "acceptGuardInvitation"

# 10. Participate flows
add_name_to_flow "workflows/participate/submitWrongImageGallery.yaml" "submitWrongImageGallery"
add_name_to_flow "workflows/participate/wrongPartySumatory.yaml" "wrongPartySumatory"
add_name_to_flow "workflows/participate/submitElectoralRecordCamera.yaml" "submitElectoralRecordCamera"
add_name_to_flow "workflows/participate/submitElectoralRecordGallery.yaml" "submitElectoralRecordGallery"
add_name_to_flow "workflows/participate/resubmitElectoralRecordGallery.yaml" "resubmitElectoralRecordGallery"

echo "✅ Proceso completado. Todos los flujos ahora tienen nombres únicos."
echo ""
echo "Ahora puedes ejecutar tus tests con orden secuencial usando:"
echo "maestro test --config ./config.yaml workflows/"
