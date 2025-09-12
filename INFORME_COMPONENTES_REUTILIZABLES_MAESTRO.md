# Informe de Componentes Reutilizables - Tests de Maestro

Este informe detalla todos los componentes reutilizables organizados por flujo funcional en la suite de tests de Maestro para la aplicación electoral.

## Índice de Componentes

1. [Componentes de Setup](#componentes-de-setup)
2. [Componentes de Autenticación](#componentes-de-autenticación)
3. [Componentes de Guardianes](#componentes-de-guardianes)
4. [Componentes de Registros Electorales](#componentes-de-registros-electorales)
5. [Componentes de Recuperación](#componentes-de-recuperación)
6. [Componentes de Votación](#componentes-de-votación)
7. [Componentes de Testigos](#componentes-de-testigos)

---

## Componentes de Setup

### initialSetup.yaml
**Ubicación:** `/components/setup/initialSetup.yaml`

**Código:**
```yaml
appId: com.tuvotodecide
name: initialSetup
---
- launchApp:
    clearState: false
- extendedWaitUntil:
    visible:
      id: MiVotoLogoImage
    timeout: 25000
- runFlow:
    when:
      visible: 'Open debugger to view warnings.'
    file: skipDebuger.yaml
    env:
      EXTERNAL: 'true'
- runFlow:
    when:
      visible:
        id: connectLoginButton
    file: ../auth/login.yaml
    env:
      PIN: ${MAESTRO_CORRECT_PIN}
- runFlow:
    when:
        true: ${LOGOUT == 'true'}
    file: ../auth/logout.yaml
```

**Funcionalidad:**
- **Propósito:** Componente maestro para inicializar la aplicación en un estado conocido
- **Características principales:**
  - Lanza la aplicación sin limpiar estado (`clearState: false`)
  - Espera hasta 25 segundos a que aparezca el logo principal
  - Maneja condicionalmente el debugger si está visible
  - Realiza login automático si detecta la pantalla de login
  - Ejecuta logout si la variable `LOGOUT` está configurada como 'true'
- **Variables utilizadas:** `MAESTRO_CORRECT_PIN`, `LOGOUT`
- **Dependencias:** `skipDebuger.yaml`, `../auth/login.yaml`, `../auth/logout.yaml`

---

### skipDebuger.yaml
**Ubicación:** `/components/setup/skipDebuger.yaml`

**Código:**
```yaml
appId: com.tuvotodecide
---
- runFlow:
    when:
      true: ${EXTERNAL != 'true'}
    file: ./simpleActions/launchApp.yaml
- extendedWaitUntil:
    visible:
      text: Open debugger to view warnings.
- tapOn:
    point: 90%,91%
- extendedWaitUntil:
    notVisible:
      text: Open debugger to view warnings.
    timeout: 4000
```

**Funcionalidad:**
- **Propósito:** Cerrar automáticamente el modal de debugger de React Native
- **Características principales:**
  - Lanza la app solo si no es una ejecución externa (`EXTERNAL != 'true'`)
  - Espera a que aparezca el mensaje de debugger
  - Hace tap en la esquina inferior derecha (90%,91%) para cerrar
  - Verifica que el debugger se haya cerrado correctamente
- **Variables utilizadas:** `EXTERNAL`
- **Dependencias:** `./simpleActions/launchApp.yaml`

---

### simpleActions/launchApp.yaml
**Ubicación:** `/components/setup/simpleActions/launchApp.yaml`

**Funcionalidad:**
- **Propósito:** Acción simple para lanzar la aplicación
- **Uso:** Componente básico utilizado por otros componentes de setup

---

## Componentes de Autenticación

### login.yaml
**Ubicación:** `/components/auth/login.yaml`

**Código:**
```yaml
appId: com.tuvotodecide
---
- runFlow:
    when:
        notVisible: 
            id: loginUserContentContainer
    file: ./simpleActions/pressLogin.yaml
- tapOn:
    id: textInput
- inputText: ${PIN}
- extendedWaitUntil:
    visible:
      id: homeMiVotoLogoTitle
    timeout: 10000
```

**Funcionalidad:**
- **Propósito:** Realizar proceso completo de login con PIN
- **Características principales:**
  - Verifica si no está en la pantalla de login y navega si es necesario
  - Hace tap en el campo de entrada de texto
  - Introduce el PIN proporcionado como variable
  - Espera hasta 10 segundos a que aparezca la pantalla principal
- **Variables utilizadas:** `PIN`
- **Elementos UI:** `loginUserContentContainer`, `textInput`, `homeMiVotoLogoTitle`
- **Dependencias:** `./simpleActions/pressLogin.yaml`

---

### logout.yaml
**Ubicación:** `/components/auth/logout.yaml`

**Código:**
```yaml
appId: com.tuvotodecide
---
- assertVisible:
    id: logoutButton
- tapOn:
    id: logoutButton
- assertVisible:
    id: homeLogoutModalContent
- tapOn:
    id: homeLogoutModalConfirmText
- assertVisible:
    id: MiVotoLogoImage
```

**Funcionalidad:**
- **Propósito:** Ejecutar proceso completo de logout
- **Características principales:**
  - Verifica que el botón de logout esté visible
  - Hace tap en el botón de logout
  - Confirma que aparece el modal de confirmación
  - Confirma el logout haciendo tap en el texto de confirmación
  - Verifica que regresa a la pantalla de inicio (logo principal)
- **Elementos UI:** `logoutButton`, `homeLogoutModalContent`, `homeLogoutModalConfirmText`, `MiVotoLogoImage`

---

### createPin.yaml
**Ubicación:** `/components/auth/createPin.yaml`

**Funcionalidad:**
- **Propósito:** Crear un nuevo PIN durante procesos de recuperación o configuración inicial
- **Variables esperadas:** `PIN`, `TEST_TYPE`

---

### blockAccount.yaml
**Ubicación:** `/components/auth/blockAccount.yaml`

**Funcionalidad:**
- **Propósito:** Componente para bloquear una cuenta mediante intentos fallidos repetidos
- **Uso:** Utilizado en tests de seguridad y recuperación

---

### updatePinAssert.yaml
**Ubicación:** `/components/auth/updatePinAssert.yaml`

**Funcionalidad:**
- **Propósito:** Verificar que el cambio de PIN se ha ejecutado correctamente
- **Uso:** Validación post-cambio de PIN

---

### simpleActions/pressLogin.yaml
**Ubicación:** `/components/auth/simpleActions/pressLogin.yaml`

**Código:**
```yaml
appId: com.tuvotodecide
---
- tapOn:
    id: connectLoginButton
```

**Funcionalidad:**
- **Propósito:** Acción simple para hacer tap en el botón de login
- **Elementos UI:** `connectLoginButton`
- **Uso:** Componente atómico reutilizable para navegación a login

---

### simpleActions/changePinSubactions.yaml
**Ubicación:** `/components/auth/simpleActions/changePinSubactions.yaml`

**Funcionalidad:**
- **Propósito:** Sub-acciones específicas para el proceso de cambio de PIN
- **Uso:** Componente de apoyo para tests de cambio de PIN

---

### simpleActions/createPinSubactions.yaml
**Ubicación:** `/components/auth/simpleActions/createPinSubactions.yaml`

**Funcionalidad:**
- **Propósito:** Sub-acciones para el proceso de creación de PIN
- **Uso:** Componente de apoyo para setup inicial y recuperación

---

## Componentes de Guardianes

### findGuardian.yaml
**Ubicación:** `/components/guardians/findGuardian.yaml`

**Código:**
```yaml
appId: com.tuvotodecide
---
- tapOn:
    id: guardiansAddButton
- tapOn:
    id: addGuardiansCarnetInput
- inputText: ${GUARDIAN_ID}
- doubleTapOn:
    id: addGuardiansSearchButton
```

**Funcionalidad:**
- **Propósito:** Buscar un guardián por ID de cédula
- **Características principales:**
  - Hace tap en el botón para agregar guardianes
  - Introduce el ID del guardián en el campo de cédula
  - Ejecuta la búsqueda con doble tap en el botón de búsqueda
- **Variables utilizadas:** `GUARDIAN_ID`
- **Elementos UI:** `guardiansAddButton`, `addGuardiansCarnetInput`, `addGuardiansSearchButton`

---

### navigateTo.yaml
**Ubicación:** `/components/guardians/navigateTo.yaml`

**Funcionalidad:**
- **Propósito:** Navegación genérica hacia secciones de guardianes
- **Uso:** Componente de navegación reutilizable

---

### validGuardianId.yaml
**Ubicación:** `/components/guardians/validGuardianId.yaml`

**Funcionalidad:**
- **Propósito:** Manejar escenarios donde se encuentra un guardián válido
- **Uso:** Componente condicional para casos exitosos

---

### wrongGuardianId.yaml
**Ubicación:** `/components/guardians/wrongGuardianId.yaml`

**Funcionalidad:**
- **Propósito:** Manejar escenarios donde el ID del guardián es incorrecto
- **Uso:** Componente para validación de errores

---

### selfGuardianId.yaml
**Ubicación:** `/components/guardians/selfGuardianId.yaml`

**Funcionalidad:**
- **Propósito:** Manejar casos donde el usuario intenta añadirse como guardián
- **Uso:** Validación de casos edge de auto-invitación

---

## Componentes de Registros Electorales

### electoralRecord1.yaml
**Ubicación:** `/components/records/electoralRecord1.yaml`

**Funcionalidad:**
- **Propósito:** Definir datos de un primer registro electoral para pruebas
- **Uso:** Mock data para tests de participación electoral

---

### electoralRecord2.yaml
**Ubicación:** `/components/records/electoralRecord2.yaml`

**Funcionalidad:**
- **Propósito:** Definir datos de un segundo registro electoral para pruebas
- **Uso:** Mock data alternativo para tests de múltiples registros

---

### wrongElectoralRecord.yaml
**Ubicación:** `/components/records/wrongElectoralRecord.yaml`

**Funcionalidad:**
- **Propósito:** Definir datos incorrectos de registro electoral
- **Uso:** Componente para tests de validación y manejo de errores

---

## Componentes de Recuperación

### recoveryQR.yaml
**Ubicación:** `/components/recovery/recoveryQR.yaml`

**Código:**
```yaml
appId: com.tuvotodecide
---
- tapOn:
    id: selectRecuperationQROption
- tapOn:
    id: recoveryQrUploadImage_imageBox
- tapOn: ${PHOTO_NAME}
- runFlow:
    when:
        true: ${TEST_TYPE == 'pass'}
    file: ./simpleActions/pressNext.yaml
- runFlow:
    when:
        true: ${TEST_TYPE == 'pass'}
    file: ../auth/createPin.yaml
    env:
        PIN: ${MAESTRO_CORRECT_PIN}
        TEST_TYPE: 'create'
- runFlow:
    when:
        true: ${TEST_TYPE == 'fail'}
    file: manageBadCases/assertBadQR.yaml
```

**Funcionalidad:**
- **Propósito:** Ejecutar proceso de recuperación mediante código QR
- **Características principales:**
  - Selecciona la opción de recuperación por QR
  - Abre el selector de imágenes
  - Selecciona la imagen especificada por variable
  - Maneja casos exitosos creando nuevo PIN
  - Maneja casos fallidos validando errores
- **Variables utilizadas:** `PHOTO_NAME`, `TEST_TYPE`, `MAESTRO_CORRECT_PIN`
- **Elementos UI:** `selectRecuperationQROption`, `recoveryQrUploadImage_imageBox`
- **Dependencias:** `./simpleActions/pressNext.yaml`, `../auth/createPin.yaml`, `manageBadCases/assertBadQR.yaml`

---

### recoveryGuardian.yaml
**Ubicación:** `/components/recovery/recoveryGuardian.yaml`

**Funcionalidad:**
- **Propósito:** Proceso de recuperación de cuenta mediante guardián
- **Variables esperadas:** Información del guardián de recuperación

---

### changeGuardianAccount.yaml
**Ubicación:** `/components/recovery/changeGuardianAccount.yaml`

**Funcionalidad:**
- **Propósito:** Cambiar la cuenta de guardián asociada
- **Uso:** Gestión avanzada de guardianes

---

### manageBadCases/assertBadQR.yaml
**Ubicación:** `/components/recovery/manageBadCases/assertBadQR.yaml`

**Funcionalidad:**
- **Propósito:** Validar mensajes de error cuando se proporciona un QR inválido
- **Uso:** Componente de validación negativa

---

### manageBadCases/assertBadGuardian.yaml
**Ubicación:** `/components/recovery/manageBadCases/assertBadGuardian.yaml`

**Funcionalidad:**
- **Propósito:** Validar errores en procesos de recuperación con guardián inválido
- **Uso:** Componente de validación de errores

---

### manageGoodCases/validGuardianFlow.yaml
**Ubicación:** `/components/recovery/manageGoodCases/validGuardianFlow.yaml`

**Funcionalidad:**
- **Propósito:** Flujo completo para casos exitosos de recuperación con guardián
- **Uso:** Componente de validación positiva

---

### simpleActions/pressNext.yaml
**Ubicación:** `/components/recovery/simpleActions/pressNext.yaml`

**Funcionalidad:**
- **Propósito:** Acción simple para avanzar en procesos de recuperación
- **Uso:** Componente atómico de navegación

---

## Componentes de Votación

### uploadElectoralRecord.yaml
**Ubicación:** `/components/voting/uploadElectoralRecord.yaml`

**Código:**
```yaml
appId: com.tuvotodecide
---
- tapOn:
    id: participateButtonRegular
- scrollUntilVisible:
    element:
      id: ${ELECTORAL_RECORD_LOCATION}
- tapOn:
    id: ${ELECTORAL_RECORD_LOCATION}
- tapOn:
    id: ${ELECTORAL_RECORD_TABLE}
- runFlow:
    when:
        true: ${TEST_TYPE == 'fail'}
    file: cases/wrongImageRecord.yaml
- runFlow:
    when:
        true: ${TEST_TYPE == 'pass'}
    file: cases/validImageRecord.yaml
- runFlow:
    when:
        true: ${TEST_TYPE == 'correct'}
    file: cases/correctImageRecord.yaml
```

**Funcionalidad:**
- **Propósito:** Proceso completo de carga de registro electoral
- **Características principales:**
  - Inicia el proceso de participación regular
  - Busca y selecciona la ubicación electoral especificada
  - Selecciona la mesa electoral correspondiente
  - Maneja diferentes tipos de test según variable `TEST_TYPE`
  - Ejecuta flujos específicos según el tipo de imagen (fail/pass/correct)
- **Variables utilizadas:** `ELECTORAL_RECORD_LOCATION`, `ELECTORAL_RECORD_TABLE`, `TEST_TYPE`
- **Elementos UI:** `participateButtonRegular`
- **Dependencias:** `cases/wrongImageRecord.yaml`, `cases/validImageRecord.yaml`, `cases/correctImageRecord.yaml`

---

### captureMethod/cameraCapture.yaml
**Ubicación:** `/components/voting/captureMethod/cameraCapture.yaml`

**Funcionalidad:**
- **Propósito:** Captura de imagen mediante cámara del dispositivo
- **Uso:** Componente para tests de captura directa

---

### captureMethod/galleryCapture.yaml
**Ubicación:** `/components/voting/captureMethod/galleryCapture.yaml`

**Funcionalidad:**
- **Propósito:** Selección de imagen desde galería del dispositivo
- **Uso:** Componente para tests de selección de archivos

---

### cases/wrongImageRecord.yaml
**Ubicación:** `/components/voting/cases/wrongImageRecord.yaml`

**Funcionalidad:**
- **Propósito:** Manejar casos donde se sube una imagen incorrecta
- **Uso:** Validación de errores en carga de imágenes

---

### cases/validImageRecord.yaml
**Ubicación:** `/components/voting/cases/validImageRecord.yaml`

**Funcionalidad:**
- **Propósito:** Manejar casos donde se sube una imagen válida pero no perfecta
- **Uso:** Tests de aceptación de imágenes con calidad aceptable

---

### cases/correctImageRecord.yaml
**Ubicación:** `/components/voting/cases/correctImageRecord.yaml`

**Funcionalidad:**
- **Propósito:** Manejar casos donde se sube una imagen perfectamente correcta
- **Uso:** Tests de casos ideales de carga

---

### cases/doesExists.yaml
**Ubicación:** `/components/voting/cases/doesExists.yaml`

**Funcionalidad:**
- **Propósito:** Verificar existencia de elementos específicos
- **Uso:** Componente de validación de estado

---

### cases/doesNotExists.yaml
**Ubicación:** `/components/voting/cases/doesNotExists.yaml`

**Funcionalidad:**
- **Propósito:** Verificar ausencia de elementos específicos
- **Uso:** Componente de validación negativa

---

### finish/assertValidUploading.yaml
**Ubicación:** `/components/voting/finish/assertValidUploading.yaml`

**Funcionalidad:**
- **Propósito:** Verificar que la carga se completó exitosamente
- **Uso:** Validación final de procesos exitosos

---

### finish/assertBadSumatory.yaml
**Ubicación:** `/components/voting/finish/assertBadSumatory.yaml`

**Funcionalidad:**
- **Propósito:** Verificar manejo de errores en sumas incorrectas
- **Uso:** Validación de errores matemáticos

---

### finish/assertRepeatedUploading.yaml
**Ubicación:** `/components/voting/finish/assertRepeatedUploading.yaml`

**Funcionalidad:**
- **Propósito:** Verificar manejo de cargas duplicadas
- **Uso:** Validación de prevención de duplicados

---

## Componentes de Testigos

### uploadRecord.yaml
**Ubicación:** `/components/witness/uploadRecord.yaml`

**Funcionalidad:**
- **Propósito:** Proceso general de carga de registros como testigo
- **Uso:** Flujo base para testigos electorales

---

### uploadCorrectRecord.yaml
**Ubicación:** `/components/witness/uploadCorrectRecord.yaml`

**Funcionalidad:**
- **Propósito:** Carga específica de registros correctos como testigo
- **Uso:** Tests de casos exitosos para testigos

---

## Resumen de Arquitectura de Componentes

### Patrones de Diseño Identificados:

1. **Composición Modular:**
   - Los componentes están organizados jerárquicamente por funcionalidad
   - Separación clara entre acciones simples y flujos complejos
   - Reutilización mediante `runFlow` condicional

2. **Gestión de Variables:**
   - Uso extensivo de variables de entorno (`${VARIABLE_NAME}`)
   - Paso de parámetros entre componentes mediante `env:`
   - Variables de control de flujo (`TEST_TYPE`, `EXTERNAL`, etc.)

3. **Manejo Condicional:**
   - Uso del parámetro `when:` para ejecución condicional
   - Soporte para múltiples escenarios en un solo componente
   - Gestión de casos exitosos y fallidos

4. **Separación de Responsabilidades:**
   - **simpleActions/**: Acciones atómicas reutilizables
   - **cases/**: Lógica específica por escenario
   - **manageBadCases/**: Validación de errores
   - **manageGoodCases/**: Validación de casos exitosos

### Dependencias Principales:
- **Setup** → Inicialización de todos los flujos
- **Auth** → Requerido por la mayoría de funcionalidades
- **Guardians** ↔ **Recovery** → Interdependientes
- **Voting** → Depende de **Auth** y configuración previa

### Elementos UI Más Utilizados:
- `MiVotoLogoImage` - Indicador de pantalla principal
- `connectLoginButton` - Botón de inicio de sesión
- `textInput` - Campo genérico de entrada
- `homeMiVotoLogoTitle` - Confirmación de login exitoso

### Variables de Entorno Críticas:
- `MAESTRO_CORRECT_PIN` - PIN válido para autenticación
- `PHOTO_NAME` / `MAESTRO_WRONG_PHOTO_NAME` - Nombres de imágenes de prueba
- `GUARDIAN_ID` - ID de guardián para pruebas
- `TEST_TYPE` - Control de flujo de ejecución
- `ELECTORAL_RECORD_LOCATION` - Ubicación electoral para tests
- `ELECTORAL_RECORD_TABLE` - Mesa electoral para tests

---

*Fecha de generación: 9 de septiembre de 2025*  
*Versión: 1.0*  
*Total de componentes documentados: 45+*
