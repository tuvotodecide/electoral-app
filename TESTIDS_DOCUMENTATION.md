# TestIDs Implementados - Electoral App

Este documento contiene una tabla con todos los testIDs implementados en la aplicación electoral para facilitar las pruebas automatizadas.

## Tabla de TestIDs

| Archivo | Componente/Pantalla | TestID | Descripción | Acción |
|---------|-------------------|--------|-------------|--------|
| **Autenticación** |
| `src/container/Connect.js` | Connect Screen | `connectInfoButton` | Botón de información/tutorial | Navega a onboarding |
| `src/container/Connect.js` | Connect Screen | `connectRegisterButton` | Botón de registro | Navega a registro |
| `src/container/Connect.js` | Connect Screen | `connectLoginButton` | Botón de inicio de sesión | Navega a login |
| `src/container/Auth/SignUp.js` | SignUp Screen | `signUpButton` | Botón principal de registro | Procesa registro |
| `src/container/Auth/SignUp.js` | SignUp Screen | `rememberMeCheckbox` | Checkbox de términos y condiciones | Toggle acepta términos |
| `src/container/Auth/SignUp.js` | SignUp Screen | `signInLinkButton` | Enlace a inicio de sesión | Navega a login |
| `src/container/Auth/SignUp.js` | SignUp Screen | `socialButton_{nombre}` | Botones de redes sociales | Login con redes |
| **Onboarding** |
| `src/container/OnBoarding.js` | Onboarding Screen | `onboardingSkipButton` | Botón para saltar tutorial | Salta onboarding |
| `src/container/OnBoarding.js` | Onboarding Screen | `onboardingGetStartedButton` | Botón continuar/comenzar | Avanza o termina onboarding |
| **Home** |
| `src/container/TabBar/Home/HomeScreen.js` | Home Screen | `blockchainConsultoraButton` | Banner Blockchain Consultora | Abre web externa |
| `src/container/TabBar/Home/HomeScreen.js` | Home Screen | `carouselButton_{id}` | Botones del carrusel | Varias acciones según item |
| `src/container/TabBar/Home/HomeScreen.js` | Home Screen | `notificationsButtonDisabled` | Botón notificaciones (deshabilitado) | N/A |
| `src/container/TabBar/Home/HomeScreen.js` | Home Screen | `logoutButton` | Botón cerrar sesión | Abre modal logout |
| `src/container/TabBar/Home/HomeScreen.js` | Home Screen | `cancelLogoutButton` | Cancela cerrar sesión | Cierra modal |
| `src/container/TabBar/Home/HomeScreen.js` | Home Screen | `confirmLogoutButton` | Confirma cerrar sesión | Ejecuta logout |
| `src/container/TabBar/Home/HomeScreen.js` | Home Screen | `participateButton` | Botón Participar (tablet) | Navega a participación |
| `src/container/TabBar/Home/HomeScreen.js` | Home Screen | `participateButtonRegular` | Botón Participar (móvil) | Navega a participación |
| `src/container/TabBar/Home/HomeScreen.js` | Home Screen | `announceCountButtonDisabled` | Botón Anunciar Conteo (deshabilitado) | N/A |
| `src/container/TabBar/Home/HomeScreen.js` | Home Screen | `myWitnessesButton` | Botón Mis Atestiguamientos | Navega a atestiguamientos |
| **Votación - Cámara** |
| `src/container/Vote/UploadRecord/CameraScreen.js` | Camera Screen | `cameraShutterButton` | Botón disparador cámara | Toma foto |
| `src/container/Vote/UploadRecord/CameraScreen.js` | Camera Screen | `openGalleryButton` | Botón abrir galería | Abre galería |
| `src/container/Vote/UploadRecord/CameraScreen.js` | Camera Screen | `resetZoomButton` | Botón reset zoom | Resetea zoom imagen |
| `src/container/Vote/UploadRecord/CameraScreen.js` | Camera Screen | `retakePhotoButton` | Botón tomar nueva foto | Retoma foto |
| `src/container/Vote/UploadRecord/CameraScreen.js` | Camera Screen | `analyzePhotoButton` | Botón analizar foto | Procesa análisis AI |
| `src/container/Vote/UploadRecord/CameraScreen.js` | Camera Screen | `modalButton_{texto}` | Botones modales dinámicos | Varias acciones |
| **Votación - Confirmación** |
| `src/container/Vote/UploadRecord/PhotoConfirmationScreen.js` | Photo Confirmation | `publishAndCertifyButton` | Botón principal publicar | Inicia proceso blockchain |
| `src/container/Vote/UploadRecord/PhotoConfirmationScreen.js` | Photo Confirmation | `cancelConfirmationButton` | Cancela confirmación | Cierra modal |
| `src/container/Vote/UploadRecord/PhotoConfirmationScreen.js` | Photo Confirmation | `confirmPublishButton` | Confirma publicación | Ejecuta publicación |
| `src/container/Vote/UploadRecord/PhotoConfirmationScreen.js` | Photo Confirmation | `duplicateGoBackButton` | Volver en duplicado | Retrocede por duplicado |
| **Componentes Comunes** |
| `src/components/common/CButton.js` | Custom Button | `testID` (prop) | TestID personalizable | Configurable por uso |
| `src/components/common/CustomModal.js` | Custom Modal | `customModalSecondaryButton` | Botón secundario modal | Acción secundaria |
| `src/components/common/CustomModal.js` | Custom Modal | `customModalPrimaryButton` | Botón primario modal | Acción principal |
| `src/components/common/UniversalHeader.js` | Universal Header | `headerBackButton` | Botón atrás universal | Navegación hacia atrás |
| `src/components/common/UniversalHeader.js` | Universal Header | `headerNotificationButtonDisabled` | Notificaciones (deshabilitado) | N/A |

## Convenciones de Nomenclatura

### Prefijos por Pantalla
- `onboarding*` - Pantallas de tutorial inicial
- `connect*` - Pantalla de conexión inicial
- `auth*` / `login*` / `signup*` - Pantallas de autenticación
- `home*` - Pantalla principal
- `camera*` - Pantallas de cámara
- `publish*` / `confirm*` - Pantallas de confirmación
- `modal*` - Elementos de modales
- `header*` - Elementos de encabezados

### Sufijos por Tipo de Acción
- `*Button` - Botones principales
- `*ButtonDisabled` - Botones deshabilitados
- `*Link` - Enlaces/botones de navegación
- `*Checkbox` - Checkboxes
- `*Modal` - Elementos modales

### Patrones Dinámicos
- `{prefix}_{identificador}` - Para elementos dinámicos con ID
- `modalButton_{texto}` - Botones modales con texto específico
- `socialButton_{nombre}` - Botones de redes sociales

## Próximos Archivos a Implementar

Los siguientes archivos aún requieren implementación de testIDs:

### Pantallas de Votación
- [ ] `src/container/Vote/WitnessRecord/WhichIsCorrectScreen.js`
- [ ] `src/container/Vote/WitnessRecord/RecordReviewScreen.js`
- [ ] `src/container/Vote/UploadRecord/PhotoReviewScreen.js`
- [ ] `src/container/Vote/UnifiedTableScreen.js`
- [ ] `src/container/Vote/common/ElectoralLocations.js`

### Pantallas de Perfil
- [ ] `src/container/TabBar/Profile/Profile.js`
- [ ] `src/container/TabBar/Profile/Security.js`
- [ ] `src/container/TabBar/Profile/PrivacyPolicies.js`
- [ ] `src/container/TabBar/Profile/RecuperationQR.js`

### Pantallas de Guardianes
- [ ] `src/container/TabBar/Guardians/Guardians.js`
- [ ] `src/container/TabBar/Guardians/AddGuardians.js`
- [ ] `src/container/TabBar/Guardians/GuardiansAdmin.js`

### Pantallas de Recuperación
- [ ] `src/container/TabBar/Recovery/FindMyUser.js`
- [ ] `src/container/TabBar/Recovery/RecoveryQR.js`
- [ ] `src/container/TabBar/Recovery/MyGuardiansStatus.js`

### Componentes Adicionales
- [ ] `src/components/common/ActionButtons.js`
- [ ] `src/components/common/NearbyTablesList.js`
- [ ] `src/components/modal/*` (varios modales)

## Notas de Implementación

1. **Componente CButton**: Se agregó soporte para `testID` como prop, permitiendo personalización en cada uso.

2. **Elementos Dinámicos**: Se utilizan patrones como `{prefix}_{id}` para elementos generados dinámicamente.

3. **Botones Deshabilitados**: Se mantienen testIDs incluso en botones deshabilitados para pruebas de estado.

4. **Modales**: Se implementaron testIDs consistentes para botones primarios y secundarios.

5. **Convención de Nombres**: Se sigue un patrón descriptivo que incluye contexto + acción + tipo.

## Uso en Pruebas

Ejemplo de uso en Maestro:
```yaml
- tapOn:
    id: "publishAndCertifyButton"
- assertVisible:
    id: "confirmPublishButton"
- tapOn:
    id: "confirmPublishButton"
```

## Estado de Completitud

**Archivos Completados**: 10/35+ archivos principales
**TestIDs Implementados**: 35+ elementos
**Cobertura Estimada**: ~30% de la aplicación

---
*Última actualización: 25 de agosto de 2025*
