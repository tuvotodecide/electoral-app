# Tests de Maestro - App Electoral

Esta carpeta contiene tests automatizados E2E organizados por flujos de la aplicación electoral usando Maestro.

## 🚀 Suites de Tests Disponibles

### ✅ **Onboarding** (17 tests) - [maestro/onboarding/](./onboarding/)
Suite completa para tutorial de introducción y primera experiencia
- Tutorial completo paso a paso
- Saltar tutorial y navegación por gestos
- Tutorial específico de guardianes
- Modo oscuro, rotación de dispositivo, accesibilidad

### ✅ **Authentication** (15 tests) - [maestro/auth/](./auth/) 
Suite completa para autenticación y seguridad
- Login exitoso y fallido con PIN
- Recuperación de cuenta y bloqueos
- Biometría y persistencia de sesión
- Múltiples dispositivos y seguridad

### ✅ **Guardians** (18 tests) - [maestro/guardians/](./guardians/)
Suite completa para sistema de guardianes/tutores
- Agregar y remover guardianes
- Invitaciones y aprobaciones
- Recuperación asistida por guardianes
- Notificaciones y estados

### ✅ **Voting** (15 tests) - [maestro/voting/](./voting/)
Suite completa para votación y participación electoral
- Subida de actas con IA/OCR
- Atestiguamiento de actas existentes
- Búsqueda de mesas electorales
- Validación de datos y certificación NFT

### ✅ **Recovery** (4 tests) - [maestro/recovery/](./recovery/)
Suite completa para recuperación de cuentas perdidas
- Recuperación con guardianes/tutores
- Recuperación con código QR de respaldo
- Búsqueda y validación de usuarios
- Acceso a opciones de recuperación

### � **Profile** - [maestro/profile/](./profile/)
Suite de gestión de perfil de usuario (En desarrollo)
- Configuración de datos personales
- Ajustes de seguridad y privacidad
- Historial de participación electoral
- Preferencias de la aplicación

### � **Actas** - [maestro/actas/](./actas/)
Suite de gestión administrativa de actas (En desarrollo)
- Gestión y administración de actas
- Reportes y estadísticas electorales
- Auditoría y verificación de datos
- Workflows administrativos

## Estructura de Carpetas

```
maestro/
├── onboarding/          # ✅ 17 tests - Tutorial e introducción
├── auth/               # ✅ 15 tests - Autenticación y login  
├── guardians/          # ✅ 18 tests - Sistema de guardianes
├── voting/             # ✅ 15 tests - Votación y participación electoral
├── recovery/           # ✅ 4 tests - Recuperación de cuentas
├── profile/            # � Tests de perfil y configuración (En desarrollo)
├── actas/              # � Tests de gestión de actas (En desarrollo)
└── maestro_config.yaml # Configuración global
```

## 🎯 Ejecución Rápida

### Scripts de Ejecución por Suite
```bash
# Ejecutar suite completa de onboarding
./run_onboarding_tests.sh

# Ejecutar suite completa de auth
./run_auth_tests.sh  

# Ejecutar suite completa de guardians
./run_guardians_tests.sh

# Ejecutar suite completa de voting
./run_voting_tests.sh

# Ejecutar todos los tests comprehensivos
./run_all_comprehensive_tests.sh
```

### Por Categorías
```bash
# Onboarding
./run_onboarding_tests.sh principales    # Tests principales
./run_onboarding_tests.sh navegacion     # Navegación
./run_onboarding_tests.sh guardianes     # Tutorial guardianes

# Authentication  
./run_auth_tests.sh core                 # Login/logout básico
./run_auth_tests.sh recovery             # Recuperación
./run_auth_tests.sh security             # Biometría y seguridad

# Guardians
./run_guardians_tests.sh management      # Gestión básica  
./run_guardians_tests.sh invitations     # Invitaciones
./run_guardians_tests.sh recovery        # Recuperación asistida

# Voting
./run_voting_tests.sh upload             # Subida de actas
./run_voting_tests.sh witness            # Atestiguamiento
./run_voting_tests.sh search             # Búsqueda de mesas

# Recovery
maestro test maestro/recovery/            # Todos los tests de recuperación
```

## 📊 Cobertura de Tests

| Suite | Tests | Casos de Uso | Estado |
|-------|-------|--------------|---------|
| **Onboarding** | 17 | Tutorial, navegación, guardianes | ✅ Completo |
| **Auth** | 15 | Login, logout, biometría, recuperación | ✅ Completo |
| **Guardians** | 18 | CRUD, invitaciones, recuperación | ✅ Completo |
| **Voting** | 15 | Subida actas, atestiguamiento, IA/OCR | ✅ Completo |
| **Recovery** | 4 | Recuperación guardianes, QR, búsqueda | ✅ Completo |
| **Profile** | - | Configuración de perfil | � En desarrollo |
| **Actas** | - | Gestión administrativa | � En desarrollo |

## 🛠 Configuración Global

### Variables de Entorno
```bash
export MAESTRO_APP_ID="com.tuvotodecide"
export MAESTRO_TIMEOUT=30000
export TEST_PIN="1234"
```

### Datos de Prueba
- **PIN de prueba**: `1234`
- **CI de prueba**: `12345678`
- **App ID**: `com.tuvotodecide`

## Flujos de Test

### 1. Onboarding
- `complete_onboarding.yaml` - Completa el flujo de introducción
- `skip_onboarding.yaml` - Saltar introducción
- `saber_mas.yaml` - Navegación por información adicional

### 2. Autenticación
- `login_existing_user.yaml` - Login con usuario existente
- `access_login_screen.yaml` - Acceso a pantalla de login
- `login_invalid_credentials.yaml` - Login con credenciales incorrectas

### 3. Registro
- `start_registration_step1.yaml` - Inicio del proceso de registro
- `complete_registration_flow.yaml` - Flujo completo de registro
- `terms_validation.yaml` - Validación de términos y condiciones

### 4. Recuperación
- `qr_recovery.yaml` - Recuperación usando código QR
- `access_recovery_options.yaml` - Acceso a opciones de recuperación
- `guardian_recovery.yaml` - Recuperación usando tutores
- `find_user.yaml` - Búsqueda de usuario

### 5. Votación
- `access_electoral_participation.yaml` - Acceso a participación electoral
- `search_electoral_table.yaml` - Búsqueda de mesa electoral
- `upload_acta_photo.yaml` - Subir foto de acta
- `witness_actas.yaml` - Atestiguar actas existentes
- `upload_correct_acta.yaml` - Subir acta correcta

### 6. Perfil
- `access_profile.yaml` - Acceso al perfil
- `change_pin.yaml` - Cambiar PIN de seguridad
- `configure_notifications.yaml` - Configurar notificaciones
- `help_center.yaml` - Centro de ayuda

### 7. Tutores/Guardians
- `access_guardians_management.yaml` - Gestión de tutores
- `add_guardian.yaml` - Agregar nuevo tutor
- `guardian_status.yaml` - Ver estado de tutores
- `remove_guardian.yaml` - Eliminar tutor

## Cómo Ejecutar los Tests

### Ejecutar todos los tests de un flujo:
```bash
maestro test maestro/onboarding/
maestro test maestro/auth/
maestro test maestro/voting/
```

### Ejecutar un test específico:
```bash
maestro test maestro/onboarding/complete_onboarding.yaml
maestro test maestro/auth/login_existing_user.yaml
```

### Ejecutar todos los tests:
```bash
maestro test maestro/
```

## Variables de Entorno

Los tests utilizan las siguientes variables (definidas en `maestro_config.yaml`):
- `TEST_USER_EMAIL` - Email de usuario de prueba
- `TEST_USER_PIN` - PIN de usuario de prueba (por defecto: "1234")
- `TEST_GUARDIAN_EMAIL` - Email de tutor de prueba
- `TEST_MESA_NUMBER` - Número de mesa electoral de prueba

## Notas Importantes

1. **Estado de la App**: Algunos tests requieren `clearState: true` para reiniciar la app completamente
2. **Debug Mode**: Todos los tests incluyen manejo del debugger de React Native con:
   ```yaml
   - tapOn: "Open debugger to view warnings."
   - assertNotVisible: "Open debugger to view warnings."
   ```
3. **Autenticación**: Los tests que acceden a HomeScreen y funcionalidades internas requieren login con PIN "1234"
4. **Dependencias**: Algunos tests asumen que el usuario ya está registrado y logueado
5. **Datos de Prueba**: Los tests utilizan datos ficticios definidos en las variables de entorno
6. **Orden de Ejecución**: Los tests de registro deben ejecutarse antes que los de login para nuevos usuarios

## Mantenimiento

- Actualizar selectores cuando cambien los elementos de la UI
- Agregar nuevos tests cuando se implementen nuevas funcionalidades
- Revisar y actualizar datos de prueba regularmente
- Verificar que los flujos siguen siendo válidos después de cambios en la app
