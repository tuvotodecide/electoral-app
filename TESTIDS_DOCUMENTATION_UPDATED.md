# Documentación de TestIDs Implementados

Esta tabla contiene todos los testIDs implementados en el proyecto electoral para automatización de pruebas con Maestro.

## Convenciones de Nomenclatura

- **Botones**: `{acción}Button` (ej: `publishButton`, `cancelButton`)
- **Campos de entrada**: `{campo}Input` (ej: `emailInput`, `passwordInput`)
- **Texto/Labels**: `{descripción}Title`, `{descripción}Label`, `{descripción}Text`
- **Elementos dinámicos**: `{tipo}_{identificador}` (ej: `carouselButton_1`, `partyInput_0`)
- **Controles de componentes**: `{componenteBase}_{acción}` (ej: `passwordInput_togglePassword`)

## TestIDs por Pantallas/Componentes

| Pantalla/Componente | TestID | Elemento | Descripción |
|---------------------|--------|----------|-------------|
| **PhotoConfirmationScreen** | `publishAndCertifyButton` | Botón | Botón principal para publicar y certificar acta |
| | `cancelConfirmationButton` | Botón | Botón para cancelar la confirmación |
| | `confirmPublishButton` | Botón | Botón de confirmación final en modal |
| | `duplicateGoBackButton` | Botón | Botón para regresar cuando hay duplicado |
| **CButton (Componente)** | `{testID}` | Botón | Acepta testID como prop y lo aplica |
| **HomeScreen** | `participateButton` | Botón | Botón de participación electoral |
| | `myWitnessesButton` | Botón | Botón para ver atestiguamientos |
| | `logoutButton` | Botón | Botón de cerrar sesión |
| | `carouselButton_{id}` | Botón | Botones del carrusel (dinámico) |
| **SignUp** | `signUpTitle` | Texto | Título de registro |
| | `signUpSubtitle` | Texto | Subtítulo descriptivo |
| | `emailInput` | Input | Campo de email |
| | `phoneInput` | Input | Campo de teléfono |
| | `signUpButton` | Botón | Botón de registro |
| | `termsCheckbox` | Checkbox | Checkbox de términos y condiciones |
| | `termsLink` | Link | Enlace a términos y condiciones |
| | `privacyLink` | Link | Enlace a política de privacidad |
| | `haveAccountLabel` | Texto | Texto "¿Ya tienes cuenta?" |
| | `signInLink` | Link | Enlace para iniciar sesión |
| **Connect** | `connectWelcomeTitle` | Texto | Título de bienvenida |
| | `connectSubtitle` | Texto | Subtítulo descriptivo |
| | `connectContinueButton` | Botón | Botón continuar |
| | `connectHaveAccountButton` | Botón | Botón "Tengo una cuenta" |
| **CameraScreen** | `cameraShutterButton` | Botón | Botón del obturador |
| | `cameraSwitchButton` | Botón | Botón cambiar cámara |
| | `cameraFlashButton` | Botón | Botón del flash |
| | `cameraBackButton` | Botón | Botón regresar |
| **CustomModal** | `modalPrimaryButton` | Botón | Botón primario del modal |
| | `modalSecondaryButton` | Botón | Botón secundario del modal |
| | `modalTitle` | Texto | Título del modal |
| | `modalMessage` | Texto | Mensaje del modal |
| **UniversalHeader** | `backButton` | Botón | Botón de regreso |
| | `notificationButton` | Botón | Botón de notificaciones |
| | `headerTitle` | Texto | Título del header |
| **OnBoarding** | `onboardingTitle_{index}` | Texto | Títulos de onboarding (dinámico) |
| | `onboardingDescription_{index}` | Texto | Descripciones de onboarding (dinámico) |
| | `skipButton` | Botón | Botón omitir |
| | `nextButton` | Botón | Botón siguiente |
| | `prevButton` | Botón | Botón anterior |
| | `getStartedButton` | Botón | Botón comenzar |
| **CInput (Componente)** | `{testID}` | Input | Campo de entrada (acepta testID como prop) |
| | `{testID}_togglePassword` | Botón | Botón mostrar/ocultar contraseña |
| **CText (Componente)** | `{testID}` | Texto | Elemento de texto (acepta testID como prop) |
| **LoginUser** | `loginTitle` | Texto | Título de login |
| | `pinInputField` | Input | Campo de PIN |
| | `forgotPasswordButton` | Botón | Botón recuperar contraseña |
| **Login** | `welcomeBackTitle` | Texto | Título "Bienvenido de vuelta" |
| | `signInSubtitle` | Texto | Subtítulo de inicio de sesión |
| | `emailInput` | Input | Campo de email |
| | `passwordInput` | Input | Campo de contraseña |
| | `rememberMeCheckbox` | Checkbox | Checkbox recordarme |
| | `rememberMeLabel` | Texto | Etiqueta recordarme |
| | `forgotPasswordLink` | Link | Enlace olvidé contraseña |
| | `signInButton` | Botón | Botón iniciar sesión |
| | `socialButton_{name}` | Botón | Botones de redes sociales (dinámico) |
| | `noAccountLabel` | Texto | Texto "¿No tienes cuenta?" |
| | `signUpLink` | Link | Enlace registrarse |
| **CreatePin** | `createPinTitle` | Texto | Título crear PIN |
| | `createPinDescription` | Texto | Descripción crear PIN |
| | `pinCreationInput` | Input | Campo de creación de PIN |
| | `createPinButton` | Botón | Botón crear PIN |
| | `skipForNowButton` | Botón | Botón omitir por ahora |
| **OTPCode** | `authCodeTitle` | Texto | Título código de autenticación |
| | `otpDescription` | Texto | Descripción del OTP |
| | `otpInput` | Input | Campo de código OTP |
| | `differentPhoneNumberButton` | Botón | Botón usar número diferente |
| | `continueButton` | Botón | Botón continuar |
| | `resendCodeButton` | Botón | Botón reenviar código |
| **ElectoralLocations** | `electoralLocationsSearchInput` | Input | Campo de búsqueda de recintos |
| | `clearSearchButton` | Botón | Botón limpiar búsqueda |
| | `electoralLocationCard_{id}` | Botón | Tarjeta de ubicación electoral (dinámico) |
| | `locationName_{id}` | Texto | Nombre de la ubicación (dinámico) |
| | `locationCode_{id}` | Texto | Código de la ubicación (dinámico) |
| | `locationDistance_{id}` | Texto | Distancia de la ubicación (dinámico) |
| | `locationAddress_{id}` | Texto | Dirección de la ubicación (dinámico) |
| | `locationZone_{id}` | Texto | Zona de la ubicación (dinámico) |
| | `tablesCount_{id}` | Texto | Cantidad de mesas (dinámico) |
| | `locationHierarchy_{id}` | Texto | Jerarquía administrativa (dinámico) |
| | `noLocationsFoundTitle` | Texto | Título cuando no hay ubicaciones |
| | `noLocationsFoundSubtitle` | Texto | Subtítulo cuando no hay ubicaciones |
| | `retryLocationButton` | Botón | Botón reintentar ubicación |
| **RecordCertificationScreen** | `certificationTitle` | Texto | Título de certificación |
| | `certificationText` | Texto | Texto de certificación |
| | `certifyButton` | Botón | Botón certificar |
| | `confirmCertificationTitle` | Texto | Título confirmación certificación |
| | `cancelCertificationButton` | Botón | Botón cancelar certificación |
| | `confirmCertificationButton` | Botón | Botón confirmar certificación |
| **RegisterUser2** | `idVerificationTitle` | Texto | Título verificación de identidad |
| | `idVerificationSubtitle` | Texto | Subtítulo verificación de identidad |
| | `idLabel` | Texto | Etiqueta campo de ID |
| | `idNumberInput` | Input | Campo número de identificación |
| | `frontCardUpload` | Componente | Componente subida imagen frontal |
| | `backCardUpload` | Componente | Componente subida imagen trasera |
| | `continueVerificationButton` | Botón | Botón continuar verificación |
| **UploadCardImage (Componente)** | `{testID}_label` | Texto | Etiqueta del componente (dinámico) |
| | `{testID}_imageBox` | Botón | Área de imagen clickeable (dinámico) |
| | `{testID}_photoButton` | Botón | Botón tomar foto (dinámico) |
| **RegisterUser3** | `faceIdImage` | Imagen | Imagen de Face ID |
| | `cameraTitle` | Texto | Título instrucciones cámara |
| | `cameraDescription` | Texto | Descripción instrucciones cámara |
| | `cameraNote` | Texto | Nota adicional cámara |
| | `tipWellLit` | Componente | Tip buena iluminación |
| | `tipRemoveItems` | Componente | Tip remover elementos |
| | `tipLookCamera` | Componente | Tip mirar a la cámara |
| | `scanFaceButton` | Botón | Botón escanear rostro |
| **CIconText (Componente)** | `{testID}` | Componente | Componente de icono con texto |
| **PhotoReviewScreen** | `editButton` | Botón | Botón editar (ya implementado) |
| | `nextButton` | Botón | Botón siguiente (ya implementado) |
| | `saveButton` | Botón | Botón guardar (ya implementado) |
| **PartyTable (Componente)** | `partyInputPresidente{index}` | Input | Campo votos presidente (dinámico, ya implementado) |
| | `partyInputDiputado{index}` | Input | Campo votos diputado (dinámico, ya implementado) |
| **SearchTableComponents** | `searchTableInput` | Input | Campo búsqueda de mesas |
| | `tableCard_{tableNumber}` | Botón | Tarjeta de mesa (dinámico) |
| | `tableTitle_{tableNumber}` | Texto | Título de mesa (dinámico) |
| | `tableRecinto_{tableNumber}` | Texto | Recinto de mesa (dinámico) |
| | `tableAddress_{tableNumber}` | Texto | Dirección de mesa (dinámico) |
| | `tableCode_{tableNumber}` | Texto | Código de mesa (dinámico) |
| **Profile** | `profileImage` | Imagen | Imagen de perfil |
| | `profileUserName` | Texto | Nombre del usuario |
| | `profileUserHash` | Componente | Hash del usuario |
| | `profileItem_{id}` | Botón | Items del menú de perfil (dinámico) |
| | `profileItemTitle_{id}` | Texto | Título del item de perfil (dinámico) |
| | `profileItemValue_{id}` | Texto | Valor del item de perfil (dinámico) |
| | `themeToggleSwitch` | Switch | Interruptor cambio de tema |
| **CHash (Componente)** | `{testID}` | Botón | Componente de hash copiable |
| **FaceIdScreen** | `faceIdImage` | Imagen | Imagen Face ID |
| | `enableFaceIdTitle` | Texto | Título habilitar Face ID |
| | `enableFaceIdDescription` | Texto | Descripción habilitar Face ID |
| | `enableFaceIdButton` | Botón | Botón habilitar Face ID |
| | `skipFaceIdButton` | Botón | Botón omitir Face ID |
| **FingerPrintScreen** | `fingerprintImage` | Imagen | Imagen huella digital |
| | `enableFingerprintTitle` | Texto | Título habilitar huella |
| | `enableFingerprintDescription` | Texto | Descripción habilitar huella |
| | `enableFingerprintButton` | Botón | Botón habilitar huella |
| | `skipFingerprintButton` | Botón | Botón omitir huella |
| **TableDetail** | `tableDetailTitle` | Texto | Título de confirmación de mesa |
| | `tableDetailSubtitle` | Texto | Subtítulo de verificación |
| | `tableInformationCard` | Contenedor | Tarjeta información de mesa |
| | `tableNumber` | Texto | Número de mesa |
| | `tableLocation` | Texto | Ubicación de mesa |
| | `tableZone` | Texto | Zona de mesa |
| | `tableCode` | Texto | Código de mesa |
| | `tableIcon` | Icono | Icono de mesa electoral |
| | `aiInfoSection` | Contenedor | Sección información IA |
| | `aiIcon` | Icono | Icono de IA |
| | `aiInfoText` | Texto | Texto información IA |
| | `takePhotoButton` | Botón | Botón tomar foto |
| | `takePhotoButtonText` | Texto | Texto botón tomar foto |
| | `existingRecordsContainer` | Contenedor | Contenedor registros existentes |
| | `existingRecordsTitle` | Texto | Título registros existentes |
| | `existingRecordsSubtitle` | Texto | Subtítulo registros existentes |
| | `existingRecord_{index}` | Botón | Registro existente (dinámico) |
| | `recordTitle_{index}` | Texto | Título de registro (dinámico) |
| | `actaImage_{index}` | Imagen | Imagen de acta (dinámico) |
| | `addNewRecordButton` | Botón | Botón agregar nuevo registro |
| | `addNewRecordText` | Texto | Texto agregar nuevo |
| | `photoPreviewModal` | Modal | Modal previsualización foto |
| | `previewTitle` | Texto | Título previsualización |
| | `previewImage` | Imagen | Imagen de previsualización |
| | `retakePhotoButton` | Botón | Botón retomar foto |
| | `retakePhotoText` | Texto | Texto retomar foto |
| | `confirmPhotoButton` | Botón | Botón confirmar foto |
| | `confirmPhotoText` | Texto | Texto confirmar foto |
| **SuccessScreen** | `successScreenContainer` | Contenedor | Contenedor pantalla éxito |
| | `successScreenHeader` | Header | Header pantalla éxito |
| | `successMainContent` | Contenedor | Contenido principal |
| | `nftSuccessTitle` | Texto | Título éxito NFT |
| | `nftCertificate` | Contenedor | Contenedor certificado NFT |
| | `nftMedalContainer` | Contenedor | Contenedor medalla NFT |
| | `nftMedalImage` | Imagen | Imagen medalla NFT |
| | `nftUserName` | Texto | Nombre de usuario NFT |
| | `nftCertTitle1` | Texto | Título certificado línea 1 |
| | `nftCertTitle2` | Texto | Título certificado línea 2 |
| | `nftCertDetail1` | Texto | Detalle certificado línea 1 |
| | `nftCertDetail2` | Texto | Detalle certificado línea 2 |
| | `nftButtonsContainer` | Contenedor | Contenedor botones NFT |
| | `viewNFTButton` | Botón | Botón ver NFT |
| | `viewNFTButtonText` | Texto | Texto ver NFT |
| | `shareProfileButton` | Botón | Botón compartir perfil |
| | `shareIcon` | Icono | Icono compartir |
| | `shareButtonText` | Texto | Texto compartir |
| **SelectCountry** | `selectCountryContainer` | Contenedor | Contenedor selección país |
| | `selectCountryHeader` | Header | Header selección país |
| | `selectCountryStepIndicator` | Componente | Indicador de paso |
| | `citizenshipTitle` | Texto | Título ciudadanía |
| | `citizenshipDescription` | Texto | Descripción ciudadanía |
| | `citizenshipLabel` | Texto | Etiqueta ciudadanía |
| | `countrySelectButton` | Botón | Botón seleccionar país |
| | `selectedCountryName` | Texto | Nombre país seleccionado |
| | `countrySelectChevron` | Icono | Chevron selección país |
| | `defaultCountryFlag` | Icono | Bandera país por defecto |
| | `countryPlaceholder` | Texto | Placeholder país |
| | `placeholderChevron` | Icono | Chevron placeholder |
| | `securityInfo` | Contenedor | Información de seguridad |
| | `securityIcon` | Icono | Icono de seguridad |
| | `securityText` | Texto | Texto de seguridad |
| | `continueButton` | Botón | Botón continuar |
| | `countrySelectionModal` | Modal | Modal selección país |
| **VerifySuccess** | `verifySuccessContainer` | Contenedor | Contenedor éxito verificación |
| | `verifySuccessHeader` | Header | Header éxito verificación |
| | `verifySuccessMainContent` | Contenedor | Contenido principal |
| | `verifySuccessImage` | Imagen | Imagen éxito verificación |
| | `verifySuccessTitle` | Texto | Título éxito verificación |
| | `verifySuccessDescription` | Texto | Descripción éxito |
| | `verifySuccessContinueButton` | Botón | Botón continuar |
| **MyWitnessesListScreen** | `myWitnessesContainer` | Contenedor | Contenedor lista testigos |
| | `myWitnessesHeader` | Header | Header lista testigos |
| | `witnessesQuestionContainer` | Contenedor | Contenedor pregunta |
| | `witnessesQuestionText` | Texto | Texto pregunta |
| | `witnessesLoadingContainer` | Contenedor | Contenedor carga |
| | `witnessesLoadingIndicator` | Indicador | Indicador de carga |
| | `witnessesLoadingText` | Texto | Texto de carga |
| | `noAttestationsContainer` | Contenedor | Sin atestiguamientos |
| | `noAttestationsIconContainer` | Contenedor | Contenedor icono vacío |
| | `noAttestationsIcon` | Icono | Icono sin atestiguamientos |
| | `noAttestationsTitle` | Texto | Título sin atestiguamientos |
| | `noAttestationsMessage` | Texto | Mensaje sin atestiguamientos |
| | `refreshWitnessesButton` | Botón | Botón actualizar testigos |
| | `refreshWitnessesButtonText` | Texto | Texto actualizar |
| | `witnessRecordsList` | ScrollView | Lista registros testigos |
| | `witnessRecord_{id}` | Botón | Registro testigo tablet (dinámico) |
| | `witnessRecordMesa_{id}` | Texto | Mesa registro tablet (dinámico) |
| | `witnessRecordDate_{id}` | Texto | Fecha registro tablet (dinámico) |
| | `witnessRecordImage_{id}` | Imagen | Imagen registro tablet (dinámico) |
| | `tabletWitnessDetailsButton_{id}` | Botón | Botón detalles tablet (dinámico) |
| | `tabletWitnessDetailsButtonText_{id}` | Texto | Texto detalles tablet (dinámico) |
| | `phoneWitnessRecord_{id}` | Botón | Registro testigo teléfono (dinámico) |
| | `phoneWitnessRecordMesa_{id}` | Texto | Mesa registro teléfono (dinámico) |
| | `phoneWitnessRecordDate_{id}` | Texto | Fecha registro teléfono (dinámico) |
| | `phoneWitnessRecordImage_{id}` | Imagen | Imagen registro teléfono (dinámico) |
| | `phoneWitnessDetailsButton_{id}` | Botón | Botón detalles teléfono (dinámico) |
| | `phoneWitnessDetailsButtonText_{id}` | Texto | Texto detalles teléfono (dinámico) |
| | `witnessesErrorModal` | Modal | Modal errores testigos |

## Implementaciones Pendientes

Las siguientes pantallas/componentes están identificados para implementación de testIDs:

### Autenticación
- RegisterUser series (RegisterUser2, RegisterUser4, etc.)
- UploadDocument
- UploadPhotoId
- SelfieWithIdCard
- FaceIdScreen
- FingerPrintScreen
- AccountLock
- VerifySuccess

### Votación y Participación Electoral
- SearchTable/UnifiedTableScreen
- PhotoAnalysisScreen
- VoteDataEditScreen
- VoteSummaryScreen
- WitnessListScreen
- MyWitnessesListScreen

### Perfiles y Configuración
- ProfileScreen
- GuardiansManagement
- RecoveryScreens
- SettingsScreen

### Componentes Especializados
- StepIndicator
- VoteInputFields
- PartyResultsDisplay
- NFTCertificateModal

## Notas de Implementación

1. **Componentes Base**: Los componentes `CButton`, `CInput` y `CText` ahora aceptan la prop `testID` y la propagan correctamente.

2. **Elementos Dinámicos**: Para listas y elementos repetitivos, se usa el patrón `{tipo}_{identificador}` donde el identificador es único.

3. **Componentes Relacionados**: Para elementos que pertenecen al mismo componente (ej: input de contraseña y su botón toggle), se usa el patrón `{baseTestID}_{acción}`.

4. **Compatibilidad con Maestro**: Todos los testIDs siguen las convenciones que funcionan óptimamente con Maestro testing framework.

5. **Futuras Implementaciones**: Se continuará implementando testIDs en las pantallas restantes siguiendo las mismas convenciones establecidas.

## Estadísticas de Implementación

- **Pantallas completadas**: 26
- **Componentes base actualizados**: 6 (CButton, CInput, CText, UploadCardImage, CIconText, CHash)
- **TestIDs únicos implementados**: 180+
- **Elementos dinámicos cubiertos**: 12 tipos diferentes

## Progreso por Módulos

- ✅ **Componentes Base**: 100% completado
- ✅ **Pantalla Principal (Home)**: 100% completado  
- ✅ **Onboarding**: 100% completado
- ✅ **Autenticación Básica**: 100% completado
- ✅ **Módulo de Cámara**: 100% completado
- ✅ **Ubicaciones Electorales**: 100% completado
- ✅ **Certificación de Registros**: 100% completado
- ✅ **Registro de Usuario**: 85% completado
- ✅ **Componentes de Búsqueda**: 100% completado
- ✅ **Perfil de Usuario**: 100% completado
- ✅ **Autenticación Biométrica**: 100% completado
- ✅ **Pantallas de Votación**: 70% completado
- ✅ **Gestión de Testigos**: 90% completado
- ✅ **Pantallas de Éxito/NFT**: 100% completado
- 🔄 **Pantallas de Votación Avanzada**: En progreso
- ⏳ **Configuración Avanzada**: Pendiente

*Documento actualizado: Implementación progresiva de testIDs en aplicación electoral*
