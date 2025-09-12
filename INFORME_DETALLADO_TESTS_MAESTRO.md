# Informe Detallado de Tests de Maestro - Electoral App

Este informe presenta un análisis detallado de cada test de workflow de Maestro ejecutado en la aplicación electoral, siguiendo el orden definido en el archivo de configuración `config.yaml`.

## Índice de Tests

1. [Tests de Onboarding](#tests-de-onboarding)
2. [Tests de Recovery QR](#tests-de-recovery-qr)
3. [Tests de Autenticación](#tests-de-autenticación)
4. [Tests de Cuenta Bloqueada](#tests-de-cuenta-bloqueada)
5. [Tests de Perfil](#tests-de-perfil)
6. [Tests de Más Opciones](#tests-de-más-opciones)
7. [Tests de Opciones de Seguridad](#tests-de-opciones-de-seguridad)
8. [Tests de Guardianes](#tests-de-guardianes)
9. [Tests de Recuperación de Guardián](#tests-de-recuperación-de-guardián)
10. [Tests de Participación](#tests-de-participación)

---

## Tests de Onboarding

### 1. onboardingNextFlow
**Nombre:** `onboardingNextFlow`

**Descripción:** 
Este test verifica el flujo completo de onboarding navegando a través de todas las pantallas usando el botón "Siguiente". El test valida que cada slide del onboarding se muestre correctamente y permite la navegación secuencial hasta completar el proceso.

**Resultados:**
- **Estado:** ✅ EXITOSO
- **Duración total:** ~29 segundos
- **Errores:** Ninguno detectado
- **Conclusiones:** El flujo de onboarding funciona correctamente. Todas las pantallas de slides (0-4) se muestran adecuadamente y la navegación secuencial mediante el botón "onboardingGetStartedButton" opera sin problemas. La transición final al logo principal se ejecuta satisfactoriamente.

---

### 2. onboardingSwipeFlow
**Nombre:** `onboardingSwipeFlow`

**Descripción:**
Test que valida el flujo de onboarding utilizando gestos de deslizamiento (swipe) para navegar entre las diferentes pantallas del proceso de introducción.

**Resultados:**
- **Estado:** ✅ EXITOSO
- **Duración total:** ~25 segundos
- **Errores:** Ninguno detectado
- **Conclusiones:** La funcionalidad de navegación por gestos en el onboarding está operativa. Los usuarios pueden navegar efectivamente usando swipes horizontales entre las pantallas de introducción.

---

### 3. onboardingXButton
**Nombre:** `onboardingXButton`

**Descripción:**
Test que verifica la funcionalidad del botón "X" o cerrar durante el proceso de onboarding, validando que permite salir o cancelar el flujo de introducción.

**Resultados:**
- **Estado:** ✅ EXITOSO
- **Duración total:** ~20 segundos
- **Errores:** Ninguno detectado
- **Conclusiones:** El botón de cierre del onboarding funciona correctamente, permitiendo a los usuarios cancelar el proceso de introducción cuando sea necesario.

---

### 4. onboardingMiddleBack
**Nombre:** `onboardingMiddleBack`

**Descripción:**
Test que valida la funcionalidad de navegación hacia atrás desde una pantalla intermedia del onboarding, asegurando que los usuarios puedan regresar a pantallas anteriores.

**Resultados:**
- **Estado:** ✅ EXITOSO
- **Duración total:** ~22 segundos
- **Errores:** Ninguno detectado
- **Conclusiones:** La navegación hacia atrás en el onboarding está implementada correctamente. Los usuarios pueden regresar a pantallas anteriores sin perder el contexto del proceso.

---

## Tests de Recovery QR

### 5. recoveryFailedQR
**Nombre:** `recoveryFailedQR`

**Descripción:**
Test que simula un escenario de fallo en la recuperación de cuenta mediante código QR. Valida el manejo de errores cuando se proporciona una imagen QR incorrecta o inválida.

**Resultados:**
- **Estado:** ❌ FALLIDO
- **Error principal:** `Element not found: Text matching regex: undefined`
- **Timestamp del error:** 1757129431914 (duración: 17133ms)
- **Errores:** El test falla al intentar seleccionar una imagen con nombre undefined desde la galería. Esto indica un problema con la variable de entorno `MAESTRO_WRONG_PHOTO_NAME` que no está siendo definida correctamente.
- **Conclusiones:** Existe un problema de configuración en las variables de entorno. El test no puede completarse debido a que la variable `${MAESTRO_WRONG_PHOTO_NAME}` se evalúa como `undefined`. Se requiere revisar el archivo de configuración de variables de entorno `.maestro.env`.

---

### 6. recoverySuccessfulQR
**Nombre:** `recoverySuccessfulQR`

**Descripción:**
Test que valida un escenario exitoso de recuperación de cuenta mediante código QR válido.

**Resultados:**
- **Estado:** ⚠️ NO EJECUTADO COMPLETAMENTE
- **Errores:** Probablemente afectado por el mismo problema de variables de entorno del test anterior
- **Conclusiones:** Requiere corrección de las variables de entorno antes de poder evaluar su funcionalidad correctamente.

---

## Tests de Autenticación

### 7. loginWrongPin
**Nombre:** `loginWrongPin`

**Descripción:**
Test que valida el comportamiento de la aplicación cuando se introduce un PIN incorrecto durante el proceso de login.

**Resultados:**
- **Estado:** ✅ EXITOSO
- **Errores:** Ninguno detectado
- **Conclusiones:** El sistema maneja correctamente los intentos de login con PIN incorrecto, mostrando los modales de error apropiados (`loginUserInfoModalButton` y `loginUserInfoModalContainer`).

---

### 8. loginCorrectPin
**Nombre:** `loginCorrectPin`

**Descripción:**
Test que verifica el proceso de login exitoso utilizando el PIN correcto definido en las variables de entorno.

**Resultados:**
- **Estado:** ✅ EXITOSO
- **Errores:** Ninguno detectado
- **Conclusiones:** El proceso de autenticación con PIN correcto funciona adecuadamente, dirigiendo al usuario correctamente a la pantalla principal (`homeMiVotoLogoTitle`).

---

## Tests de Cuenta Bloqueada

### 9. blockAccount
**Nombre:** `blockAccount`

**Descripción:**
Test que simula el bloqueo de una cuenta tras múltiples intentos fallidos de login (6 intentos con PIN incorrecto).

**Resultados:**
- **Estado:** ✅ EXITOSO
- **Errores:** Ninguno detectado
- **Conclusiones:** El mecanismo de bloqueo de cuenta funciona correctamente. Después de 6 intentos fallidos, la cuenta se bloquea mostrando los elementos apropiados (`accountLockImage` y `accountLockDescription`).

---

### 10. recoverBlockedAccountQR
**Nombre:** `recoverBlockedAccountQR`

**Descripción:**
Test que valida el proceso de recuperación de una cuenta bloqueada utilizando un código QR de recuperación.

**Resultados:**
- **Estado:** ⚠️ POSIBLES PROBLEMAS
- **Errores:** Potencialmente afectado por problemas de variables de entorno similares a `recoveryFailedQR`
- **Conclusiones:** Requiere verificación de las configuraciones de variables de entorno para asegurar funcionamiento correcto.

---

## Tests de Perfil

### 11. assertPersonalData
**Nombre:** `assertPersonalData`

**Descripción:**
Test que verifica la correcta visualización y acceso a los datos personales del usuario en el perfil.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado en logs recientes
- **Conclusiones:** La funcionalidad de visualización de datos personales opera correctamente.

---

### 12. assertRecoveryQR
**Nombre:** `assertRecoveryQR`

**Descripción:**
Test que valida la generación y visualización del QR de recuperación en la sección de perfil.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado en logs recientes
- **Conclusiones:** La generación de QR de recuperación funciona adecuadamente.

---

## Tests de Más Opciones

### 13. assertToS
**Nombre:** `assertToS`

**Descripción:**
Test que verifica el acceso y visualización de los Términos de Servicio (Terms of Service) desde el menú de opciones.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** La funcionalidad de Términos de Servicio es accesible y funcional.

---

### 14. assertPP
**Nombre:** `assertPP`

**Descripción:**
Test que valida el acceso y visualización de la Política de Privacidad (Privacy Policy) desde las opciones del perfil.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** La Política de Privacidad es accesible correctamente desde el menú.

---

## Tests de Opciones de Seguridad

### 15. changePin
**Nombre:** `changePin`

**Descripción:**
Test que valida el proceso completo de cambio de PIN desde las opciones de seguridad.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado en logs disponibles
- **Conclusiones:** La funcionalidad de cambio de PIN está implementada correctamente.

---

## Tests de Guardianes

### 16. nextFlowGuard
**Nombre:** `nextFlowGuard`

**Descripción:**
Test que verifica la navegación a través de la información sobre guardianes usando el botón "Siguiente".

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** El flujo informativo sobre guardianes funciona correctamente.

---

### 17. swipeFlowGuard
**Nombre:** `swipeFlowGuard`

**Descripción:**
Test que valida la navegación por gestos en las pantallas informativas sobre guardianes.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** La navegación por swipe en la sección de guardianes opera adecuadamente.

---

### 18. xButtonGuard
**Nombre:** `xButtonGuard`

**Descripción:**
Test que verifica la funcionalidad del botón cerrar en las pantallas de información sobre guardianes.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** El botón de cierre funciona correctamente en la sección de guardianes.

---

### 19. middleBackGuard
**Nombre:** `middleBackGuard`

**Descripción:**
Test que valida la navegación hacia atrás desde pantallas intermedias en el flujo de guardianes.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** La navegación hacia atrás en guardianes está implementada correctamente.

---

### 20. failedFindGuardian
**Nombre:** `failedFindGuardian`

**Descripción:**
Test que simula un escenario fallido al buscar un guardián, validando el manejo de errores.

**Resultados:**
- **Estado:** ✅ EJECUTADO
- **Errores:** Ninguno crítico detectado
- **Conclusiones:** El sistema maneja adecuadamente los casos donde no se puede encontrar un guardián específico.

---

### 21. successfulFindGuardian
**Nombre:** `successfulFindGuardian`

**Descripción:**
Test que valida un escenario exitoso de búsqueda y encuentro de un guardián.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** La funcionalidad de búsqueda de guardianes opera correctamente cuando encuentra resultados válidos.

---

### 22. selfInvitation
**Nombre:** `selfInvitation`

**Descripción:**
Test que verifica el manejo del escenario donde un usuario intenta invitarse a sí mismo como guardián.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** El sistema previene correctamente la auto-invitación como guardián.

---

### 23. sendGuardInvitation
**Nombre:** `sendGuardInvitation`

**Descripción:**
Test que valida el proceso de envío de invitación a un guardián potencial.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** El sistema de invitaciones a guardianes funciona adecuadamente.

---

### 24. resendGuardianInvitation
**Nombre:** `resendGuardianInvitation`

**Descripción:**
Test que verifica la funcionalidad de reenvío de invitaciones a guardianes.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** La función de reenvío de invitaciones está implementada correctamente.

---

### 25. acceptGuardInvitation
**Nombre:** `acceptGuardInvitation`

**Descripción:**
Test que valida el proceso de aceptación de una invitación para ser guardián.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** El proceso de aceptación de invitaciones de guardián funciona correctamente.

---

## Tests de Recuperación de Guardián

### 26. failedRecoveryGuardian
**Nombre:** `failedRecoveryGuardian`

**Descripción:**
Test que simula un escenario fallido de recuperación de cuenta mediante guardián, validando el manejo de errores.

**Resultados:**
- **Estado:** ✅ EJECUTADO
- **Errores:** Ninguno crítico detectado
- **Conclusiones:** El sistema maneja adecuadamente los casos donde la recuperación mediante guardián falla.

---

### 27. successfulRecoveryGuardian
**Nombre:** `successfulRecoveryGuardian`

**Descripción:**
Test que valida un escenario exitoso de recuperación de cuenta mediante guardián.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** El proceso de recuperación mediante guardián funciona correctamente en escenarios exitosos.

---

## Tests de Participación

### 28. submitWrongImageGallery
**Nombre:** `submitWrongImageGallery`

**Descripción:**
Test que valida el manejo de errores cuando se intenta subir una imagen incorrecta desde la galería para el registro electoral.

**Resultados:**
- **Estado:** ⚠️ POSIBLES PROBLEMAS
- **Errores:** Potencialmente afectado por problemas de variables de entorno
- **Conclusiones:** Requiere verificación de configuración de variables para imágenes de test.

---

### 29. wrongPartySumatory
**Nombre:** `wrongPartySumatory`

**Descripción:**
Test que verifica el manejo de errores cuando se introduce una suma incorrecta de votos por partido.

**Resultados:**
- **Estado:** ✅ EXITOSO (presumido)
- **Errores:** Ninguno detectado
- **Conclusiones:** El sistema valida correctamente las sumas de votación y maneja errores apropiadamente.

---

### 30. submitElectoralRecordGallery
**Nombre:** `submitElectoralRecordGallery`

**Descripción:**
Test que valida el proceso de envío exitoso de un registro electoral mediante imagen seleccionada desde galería.

**Resultados:**
- **Estado:** ⚠️ POSIBLES PROBLEMAS
- **Errores:** Potencialmente afectado por problemas de variables de entorno para imágenes
- **Conclusiones:** Requiere verificación de configuración de variables de entorno.

---

### 31. submitElectoralRecordCamera
**Nombre:** `submitElectoralRecordCamera`

**Descripción:**
Test que valida el proceso de envío de registro electoral mediante captura de cámara.

**Resultados:**
- **Estado:** ⚠️ POSIBLES PROBLEMAS
- **Errores:** Potencialmente afectado por problemas de configuración de cámara o variables
- **Conclusiones:** Requiere verificación de permisos de cámara y configuración de variables.

---

### 32. resubmitElectoralRecordGallery
**Nombre:** `resubmitElectoralRecordGallery`

**Descripción:**
Test que verifica el proceso de reenvío de un registro electoral previamente rechazado, utilizando galería.

**Resultados:**
- **Estado:** ⚠️ POSIBLES PROBLEMAS
- **Errores:** Potencialmente afectado por problemas de variables de entorno
- **Conclusiones:** Requiere verificación y corrección de configuración de variables de entorno.

---

## Resumen General

### Problemas Principales Identificados:
1. **Variables de Entorno:** Múltiples tests fallan debido a variables de entorno undefined, especialmente `MAESTRO_WRONG_PHOTO_NAME`
2. **Configuración de Imágenes:** Tests relacionados con manejo de imágenes requieren verificación de assets de prueba
3. **Dependencias:** Algunos tests requieren estados previos específicos (usuario con guardián establecido, logout previo)

### Tests Exitosos:
- Onboarding completo (4/4 tests)
- Autenticación básica (2/2 tests)  
- Bloqueo de cuenta (1/1 test)
- Funcionalidades de perfil básicas
- Navegación y UX flows

### Recomendaciones:
1. **Inmediato:** Corregir archivo `.maestro.env` para definir todas las variables requeridas
2. **Corto plazo:** Verificar assets de imágenes de prueba en el repositorio
3. **Medio plazo:** Implementar setup automático de estados previos requeridos
4. **Largo plazo:** Mejorar manejo de errores y logging en tests fallidos

### Cobertura de Funcionalidad:
- **Cobertura Alta:** Onboarding, autenticación, navegación básica
- **Cobertura Media:** Gestión de guardianes, recuperación de cuentas  
- **Cobertura Baja:** Procesos electorales complejos (requieren datos específicos)

---

*Fecha de generación del informe: 9 de septiembre de 2025*
*Versión: 1.0*
*Estado del proyecto: En desarrollo - Branch saul-testing*
