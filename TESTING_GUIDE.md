
# Guía de Ejecución de Tests

Esta guía describe cómo ejecutar los tests unitarios y los tests End-to-End (E2E) con Maestro para este proyecto.

## Tests unitarios

### Ejecución de tests

#### Ejecutar todos los tests

Se ejecutan todos los tests unitarios definidos en el directorio `__tests__/`:

```bash
npm test
```

#### Ejecutar tests en modo watch

Ejecuta los tests en modo observación; se re-ejecutan automáticamente al detectar cambios:

```bash
npm test -- --watch
```

#### Ejecutar tests con cobertura

Genera un reporte de cobertura de código:

```bash
npm test -- --coverage
```

#### Ejecutar tests específicos

Ejecutar tests de un directorio específico (útil para aislar flujos):

```bash
npm test -- __tests__/unit/containers/Auth
```

O ejecutar un archivo de test concreto:

```bash
npm test -- Login.test.js
```

### Configuración de Jest

Archivos de configuración principales:

- `jest.config.js`: configuración principal de Jest
- `__tests__/setup/jest.setup.js`: configuración global del entorno de tests
- `__tests__/setup/test-utils.js`: utilidades reutilizables para tests
- `__tests__/setup/mock-data.js`: datos mock predefinidos

### Estructura de directorios de tests

```
__tests__/
├── __mocks__/        # Mocks globales de librerías
├── setup/            # Configuración de entorno de tests
├── unit/             # Tests unitarios
│   ├── components/   # Tests de componentes
│   ├── containers/   # Tests de pantallas
│   ├── services/     # Tests de servicios
│   ├── utils/        # Tests de utilidades
│   ├── redux/        # Tests de Redux
│   └── hooks/        # Tests de hooks personalizados
└── integration/      # Tests de integración
        └── auth-flow/    # Flujo de autenticación
```

## Tests End-to-End con Maestro

Los tests E2E se organizan en el directorio `.maestro/`.

### Estructura de `.maestro/`

```
.maestro/
├── .maestro.env               # Variables de entorno
├── config.yaml                # Configuración de ejecución
├── components/                # Componentes reutilizables
│   ├── auth/
│   ├── guardians/
│   ├── records/
│   ├── recovery/
│   ├── setup/
│   └── voting/
├── workflows/                 # Flujos de tests completos
│   ├── auth/
│   ├── onboarding/
│   ├── participate/
│   ├── profile/
│   ├── recovery/
│   └── witness/
└── test_output_directory/     # Directorio de salida de reportes
```

### Variables de entorno de Maestro

En `.maestro/.maestro.env` se definen variables usadas por los workflows. Algunos ejemplos:

- Variables de imágenes:
    - `MAESTRO_FIRST_USER_PHOTO_NAME`
    - `MAESTRO_SECOND_USER_PHOTO_NAME`
    - `MAESTRO_WRONG_PHOTO_NAME`
    - `MAESTRO_ELECTORAL_RECORD_IMAGE_NAME`
    - `MAESTRO_ELECTORAL_RECORD_DIFFICULT_IMAGE_NAME`

- Variables de configuración:
    - `MAESTRO_WALKTHROUGH` (habilita/deshabilita tutorial)
    - `MAESTRO_DISABLE_ANSI` (deshabilita códigos ANSI)

- Variables de autenticación:
    - `MAESTRO_CORRECT_PIN`
    - `MAESTRO_SECOND_PIN`
    - `PIN` (predeterminado)

- Variables de usuarios:
    - `MAESTRO_PRINCIPAL_ID`
    - `MAESTRO_GUARDIAN_ID`
    - `MAESTRO_SELF_NAME`
    - `MAESTRO_GUARDIAN_NAME`

- Variables de datos electorales:
    - `MAESTRO_ELECTORAL_RECORD_LOCATION`
    - `MAESTRO_ELECTORAL_RECORD_TABLE_1`
    - `MAESTRO_ELECTORAL_RECORD_TABLE_2`

Ejemplo rápido para comprobar variables en la consola (PowerShell / bash):

```bash
echo $MAESTRO_FOO
# > bar
```

Nota: todas las variables de entorno de Maestro deben exportarse (por ejemplo, `export VAR=value` en bash) para su correcta importación dentro de los tests.

### Configuración de ejecución (`config.yaml`)

El archivo `config.yaml` define el orden de ejecución recomendado para los workflows. Ejemplo de orden (resumido):

- Onboarding
    - `onboardingNextFlow`
    - `onboardingSwipeFlow`
    - `onboardingXButton`
    - `onboardingMiddleBack`
- Recuperación por QR
    - `recoveryFailedQR`
    - `recoverySuccessfulQR`
- Autenticación
    - `loginWrongPin`
    - `loginCorrectPin`
- Bloqueo y recuperación de cuenta
    - `blockAccount`
    - `recoverBlockedAccountQR`
    - `resetAndRecoverAccount`
- Perfil
    - `assertPersonalData`
    - `assertRecoveryQR`
- Opciones adicionales
    - `assertToS`
    - `assertPP`
- Opciones de seguridad
    - `changePin`
- Guardianes, recuperación, participación, testigos, etc.

Se recomienda mantener el orden ya que algunos flujos pueden depender del estado dejado por flujos anteriores.

### Directorio de salida

Los reportes y artefactos se configuran para guardarse en:

```
test_output_directory/
```

### Ejecución de tests Maestro

> Importante: la CLI de Maestro no funcionará si existe una instancia de Maestro Studio abierta en el sistema (y viceversa).

Recomendación: ejecutar los tests en un emulador Android sobre un entorno Linux con al menos 16 GB de RAM para obtener tiempos razonables.

#### Ejecutar todos los tests según `config.yaml`

```bash
maestro test .maestro
```

Tiempo aproximado de ejecución de todos los tests: ~1h 15m (varía según máquina/emulador).

#### Ejecutar un flujo específico

```bash
maestro test .maestro/workflows/auth/loginCorrectPin.yaml
```

#### Ejecutar un componente reutilizable

```bash
maestro test .maestro/components/setup/initialSetup.yaml
```

#### Ejecutar con variables de entorno personalizadas

```bash
maestro test .maestro/workflows/auth/loginCorrectPin.yaml -e MAESTRO_CORRECT_PIN=1234
```

#### Ejecutar todos los workflows de una categoría

```bash
maestro test .maestro/workflows/auth
```

#### Generar reporte HTML

```bash
maestro test .maestro --format html --output .maestro/report.html
```

#### Ejecutar en modo continuo (watch)

```bash
maestro test .maestro --continuous
```

### Requisitos previos

- Instalar Maestro CLI:

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

- Tener un emulador Android en ejecución o un dispositivo Android conectado con depuración USB (el emulador es recomendado).

- Tener la aplicación instalada en el dispositivo de prueba:

```bash
npx react-native run-android
```

- Verificar que Maestro detecte el dispositivo:

```bash
maestro test
```

### Componentes reutilizables (ejemplos)

- Setup
    - `initialSetup.yaml`: configuración inicial de la aplicación
    - `skipDebuger.yaml`: omitir el depurador de React Native

- Autenticación
    - `login.yaml`, `logout.yaml`, `createPin.yaml`, `blockAccount.yaml`

- Guardianes
    - `findGuardian.yaml`, `navigateTo.yaml`, `selfGuardianId.yaml`, `validGuardianId.yaml`, `wrongGuardianId.yaml`

- Registros electorales
    - `electoralRecord1.yaml`, `electoralRecord2.yaml`, `wrongElectoralRecord.yaml`

- Recuperación
    - `recoveryQR.yaml`, `recoveryGuardian.yaml`, `changeGuardianAccount.yaml`

- Votación
    - `uploadElectoralRecord.yaml`

- Testigos
    - `certifyRecord.yaml`

### Salida y artefactos

Se generan en `test_output_directory/`:

- Archivos JSON con comandos ejecutados
- Capturas de pantalla en caso de fallos
- Reportes HTML cuando se especifica el formato

### Preparación del entorno

Se recomienda:

- Limpiar datos de la aplicación antes de ejecutar tests completos
- Verificar que las imágenes de prueba existan en la galería
- Confirmar que las variables de entorno estén actualizadas

### Mantenimiento de tests

Se debe:

- Actualizar nombres de elementos cuando cambien en la aplicación
- Revisar timeouts si los tests fallan por lentitud
- Documentar cambios en flujos complejos

### Depuración

Estrategias para depurar tests:

- Ejecutar flujos individuales para aislar problemas
- Revisar capturas de pantalla generadas en fallos
- Utilizar el modo continuo durante el desarrollo de nuevos tests


