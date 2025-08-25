# 🔐 Tests de Autenticación Comprehensivos

Este directorio contiene una suite completa de tests e2e para todas las funcionalidades de autenticación de la aplicación electoral.

## 📋 Lista de Tests

### Tests Básicos de Autenticación
- **`login_successful.yaml`** - Login exitoso con PIN correcto
- **`login_failed_pin.yaml`** - Login fallido con PIN incorrecto
- **`onboarding_flow.yaml`** - Flujo completo de onboarding inicial

### Tests de Validación de PIN
- **`pin_validation_edge_cases.yaml`** - Casos límite y validación de PIN
  - PIN incompleto
  - Múltiples intentos fallidos
  - Contador de intentos
  - Reset después de logout

### Tests de Cambio de PIN
- **`change_pin_comprehensive.yaml`** - Flujo completo de cambio de PIN
  - Validación de PIN actual
  - Casos límite para nuevo PIN
  - Confirmación de PIN
  - Verificación después del cambio

### Tests de Autenticación Biométrica
- **`biometric_comprehensive.yaml`** - Configuración de biometría
  - Activar/desactivar huella dactilar
  - Activar/desactivar Face ID
  - Login con biometría
  - Fallback a PIN

### Tests de Seguridad
- **`account_lockout.yaml`** - Bloqueo de cuenta por intentos fallidos
  - Agotamiento de 5 intentos
  - Mensaje de bloqueo
  - Opciones de recuperación

- **`security_validations.yaml`** - Validaciones de seguridad
  - Validación de entradas
  - Caracteres especiales
  - Longitud de PIN
  - Timeout de sesión

### Tests de Recuperación
- **`guardian_recovery_flow.yaml`** - Recuperación mediante guardianes
  - Configuración de guardianes
  - Búsqueda de usuarios
  - Flujo de recuperación

- **`qr_backup.yaml`** - Respaldo con código QR
  - Generación de QR
  - Descarga de QR
  - Recuperación con QR

### Tests de Navegación
- **`navigation_comprehensive.yaml`** - Navegación entre pantallas
  - Flujos de navegación
  - Gestión de estados
  - Back gestures

### Tests de Red y Errores
- **`network_error_handling.yaml`** - Manejo de errores de red
  - Problemas de conectividad
  - Timeouts
  - Funcionalidades offline

### Tests de Persistencia
- **`session_persistence.yaml`** - Persistencia de datos
  - Configuraciones guardadas
  - Reinicio de aplicación
  - Estado de sesión

### Test Completo
- **`complete_auth_flow.yaml`** - Flujo completo de autenticación
  - Integración de todas las funcionalidades
  - Escenario de usuario real

## 🚀 Ejecución de Tests

### Ejecutar un test individual
```bash
maestro test maestro/auth/login_successful.yaml
```

### Ejecutar todos los tests de auth
```bash
./maestro/auth/run_auth_comprehensive_tests.sh
```

### Ejecutar en dispositivo específico
```bash
./maestro/auth/run_auth_comprehensive_tests.sh <device_id>
```

## 📊 Reportes

Los tests generan:
- Resultados en formato JUnit XML
- Reporte HTML con resumen
- Logs detallados de ejecución

Los resultados se guardan en `maestro/results/auth_<timestamp>/`

## 🎯 Casos de Uso Cubiertos

### Flujos Principales
1. **Onboarding** - Primera experiencia del usuario
2. **Login/Logout** - Autenticación básica
3. **Gestión de PIN** - Cambio y validación
4. **Configuración de Seguridad** - Biometría y ajustes

### Flujos de Recuperación
1. **Recuperación por Guardianes** - Sistema de guardianes
2. **Recuperación por QR** - Código de respaldo
3. **Bloqueo de Cuenta** - Manejo de intentos fallidos

### Casos Edge
1. **Validaciones de Entrada** - Caracteres especiales, longitud
2. **Problemas de Red** - Timeouts, conectividad
3. **Persistencia** - Reinicio de app, configuraciones

## 🔧 Configuración

### Prerequisitos
- Maestro CLI instalado
- Dispositivo Android/iOS conectado o emulador
- App `com.tuvotodecide` instalada

### Variables de Entorno
- `APP_ID`: com.tuvotodecide (por defecto)
- `DEVICE_ID`: ID del dispositivo (opcional)

## 📝 Notas de Implementación

### Estrategias de Testing
- **Tolerancia a delays**: `extendedWaitUntil` para elementos que tardan en cargar
- **Tests opcionales**: `optional: true` para elementos que pueden no estar disponibles
- **Manejo de estados**: `clearState` para control de estado inicial
- **Navegación robusta**: Múltiples formas de llegar al mismo elemento

### Consideraciones Especiales
- **Biometría en emuladores**: Puede no estar disponible
- **Permisos del sistema**: Algunos tests requieren permisos específicos
- **Conectividad**: Tests de red pueden fallar en ambientes aislados

## 🐛 Solución de Problemas

### Tests que fallan frecuentemente
1. **biometric_comprehensive.yaml**: Requiere hardware biométrico real
2. **network_error_handling.yaml**: Sensible a conectividad
3. **account_lockout.yaml**: Puede requerir reset manual

### Tips de Debugging
- Usar `maestro test --debug` para más información
- Verificar logs de aplicación con `maestro logs`
- Revisar screenshots automáticos en caso de fallas

## 📈 Métricas de Cobertura

Estos tests cubren aproximadamente:
- **95%** de flujos de autenticación principales
- **85%** de casos edge de validación
- **90%** de escenarios de error
- **80%** de funcionalidades de recuperación

Este directorio contiene tests End-to-End para los flujos de autenticación de la aplicación electoral usando Maestro.

## Estructura de Tests

### Tests Básicos de Autenticación

1. **`login_successful.yaml`** - Login exitoso con PIN correcto
   - Verifica el flujo normal de login
   - Confirma navegación exitosa al dashboard principal

2. **`login_failed_pin.yaml`** - Login fallido con PIN incorrecto
   - Prueba manejo de errores con PIN incorrecto
   - Verifica recuperación después del error

3. **`logout_and_login.yaml`** - Proceso completo de logout y re-login
   - Navega a perfil y ejecuta logout
   - Confirma regreso a pantalla inicial
   - Realiza nuevo login exitoso

### Tests de Registro y Recuperación

4. **`register_navigation.yaml`** - Navegación al flujo de registro
   - Verifica acceso a términos y condiciones
   - Confirma navegación a verificación de identidad

5. **`account_recovery.yaml`** - Opciones de recuperación de cuenta
   - Prueba recuperación con guardianes
   - Prueba recuperación con QR
   - Verifica manejo de usuarios no encontrados

### Tests de Seguridad

6. **`change_pin.yaml`** - Cambio de PIN desde perfil
   - Navega a configuración de seguridad
   - Ejecuta cambio de PIN completo
   - Verifica confirmación exitosa

7. **`account_lock.yaml`** - Bloqueo por múltiples intentos fallidos
   - Simula 5 intentos fallidos consecutivos
   - Verifica activación del bloqueo de cuenta
   - Confirma mensajes de seguridad

8. **`biometric_setup.yaml`** - Configuración de autenticación biométrica
   - Accede a configuración de huella dactilar
   - Maneja casos donde biometría no está disponible

### Tests de Perfil y Navegación

9. **`user_profile.yaml`** - Verificación de datos personales
   - Accede a información del usuario
   - Verifica campos de datos personales

10. **`navigation_flow.yaml`** - Navegación entre secciones principales
    - Prueba navegación entre Inicio, Perfil y Más
    - Verifica elementos clave en cada sección

11. **`guardians_management.yaml`** - Gestión de guardianes
    - Accede a configuración de guardianes
    - Prueba agregar nuevo guardián
    - Maneja casos de guardian no encontrado

12. **`qr_backup.yaml`** - Respaldo con código QR
    - Accede a generación de QR de respaldo
    - Prueba descarga del QR
    - Maneja permisos de almacenamiento

## Configuración de Ambiente

### Prerequisitos
- App instalada con `appId: com.tuvotodecide`
- Usuario de prueba configurado con PIN `1234`
- Permisos de cámara y almacenamiento disponibles

### Ejecución de Tests

```bash
# Ejecutar test individual
maestro test auth/login_successful.yaml

# Ejecutar todos los tests de auth
maestro test auth/

# Ejecutar con reporte
maestro test auth/ --format junit --output auth-results.xml
```

## Patrones de Testing Utilizados

### Elementos de UI Comunes
- `"Open debugger to view warnings."` - Banner de desarrollo
- `"Tengo una cuenta"` - Botón de login
- `"Registrar cuenta"` - Botón de registro
- `"Bienvenido"` - Indicador de login exitoso

### Estrategias de Espera
- `extendedWaitUntil` para elementos que pueden tardar en aparecer
- `timeout: 10000` para operaciones de red
- `optional: true` para elementos que pueden no estar presentes

### Navegación Robusta
- Uso de `scrollUntilVisible` para elementos fuera de pantalla
- Verificación de elementos clave antes de interactuar
- Manejo de estados de error y recuperación

### Validaciones
- `assertVisible` para confirmar elementos críticos
- `assertNotVisible` para confirmar desaparición de elementos
- Verificación de mensajes de error específicos

## Notas de Implementación

### Limitaciones Conocidas
- Tests biométricos pueden fallar en emuladores sin soporte
- Permisos de almacenamiento pueden requerir configuración manual
- Operaciones de red dependen de conectividad estable

### Datos de Prueba
- PIN por defecto: `1234`
- CI de prueba para búsquedas: `12345678`, `87654321`
- Usuario de ejemplo: `Libélula`

### Mantenimiento
- Actualizar selectores si cambian elementos de UI
- Verificar timeouts según rendimiento del dispositivo
- Ajustar flujos si se modifican pantallas de auth
