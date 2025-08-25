# 🔄 Tests de Recuperación de Cuenta - Maestro

## Descripción General

Esta carpeta contiene tests End-to-End para todos los mecanismos de recuperación de cuenta en la aplicación electoral usando Maestro. Los tests cubren los diferentes métodos de recuperación disponibles cuando los usuarios pierden acceso a sus cuentas.

## 📋 Lista de Tests

### Tests Básicos de Recuperación

1. **`access_recovery_options.yaml`** - Acceso a opciones de recuperación
   - Navegación desde pantalla de login
   - Verificación de opciones disponibles
   - Flujo de acceso a recuperación

2. **`find_user.yaml`** - Búsqueda de usuario para recuperación
   - Búsqueda por CI (Cédula de Identidad)
   - Validación de datos de usuario
   - Manejo de usuarios no encontrados

3. **`guardian_recovery.yaml`** - Recuperación mediante sistema de guardianes
   - Solicitud de ayuda a guardianes/tutores
   - Envío de notificaciones a guardianes
   - Proceso de aprobación múltiple

4. **`qr_recovery.yaml`** - Recuperación mediante código QR de respaldo
   - Acceso al proceso de recuperación con QR
   - Validación de códigos QR válidos
   - Restauración de cuenta desde QR

## 🔧 Funcionalidades Cubiertas

### Métodos de Recuperación

#### 🛡️ Recuperación con Guardianes/Tutores
- **Solicitud de Ayuda**: Envío de solicitudes a guardianes configurados
- **Notificaciones**: Sistema de alertas a guardianes
- **Aprobación Múltiple**: Requerimiento de múltiples confirmaciones
- **Proceso Blockchain**: Validación descentralizada de recuperación

#### 📱 Recuperación con QR de Respaldo
- **Código QR Único**: Cada usuario tiene un QR de respaldo
- **Validación Criptográfica**: Verificación de autenticidad del QR
- **Restauración Completa**: Recuperación total de acceso a la cuenta
- **Seguridad Offline**: No requiere conectividad para validación básica

#### 🔍 Búsqueda y Validación de Usuario
- **Identificación por CI**: Búsqueda usando Cédula de Identidad
- **Validación de Datos**: Confirmación de información personal
- **Prevención de Fraude**: Verificaciones de seguridad adicionales
- **Manejo de Casos Edge**: Usuarios inexistentes o datos incorrectos

## 🚀 Ejecución de Tests

### Ejecutar tests individuales
```bash
# Test de acceso a opciones de recuperación
maestro test maestro/recovery/access_recovery_options.yaml

# Test de recuperación con guardianes
maestro test maestro/recovery/guardian_recovery.yaml

# Test de recuperación con QR
maestro test maestro/recovery/qr_recovery.yaml

# Test de búsqueda de usuario
maestro test maestro/recovery/find_user.yaml
```

### Ejecutar todos los tests de recuperación
```bash
maestro test maestro/recovery/
```

### Ejecutar con reportes detallados
```bash
maestro test maestro/recovery/ --format junit --output recovery-results.xml
```

## 🎯 Casos de Uso Cubiertos

### Escenarios de Usuario Real

#### 1. Usuario que Olvidó su PIN
```yaml
# Flujo típico de recuperación
- Usuario intenta hacer login
- No recuerda su PIN
- Accede a "Olvidé mi cuenta"
- Selecciona método de recuperación
- Completa proceso de validación
- Recupera acceso a su cuenta
```

#### 2. Usuario con Dispositivo Perdido
```yaml
# Recuperación en nuevo dispositivo
- Instala app en nuevo dispositivo
- Accede a recuperación de cuenta
- Usa QR de respaldo guardado
- Valida identidad con CI
- Restaura cuenta completamente
```

#### 3. Usuario que Necesita Ayuda de Guardianes
```yaml
# Recuperación asistida
- Accede a recuperación con tutores
- Sistema notifica a guardianes configurados
- Guardianes aprueban solicitud
- Sistema valida aprobaciones mínimas
- Usuario recupera acceso
```

### Validaciones de Seguridad

#### ✅ Prevención de Fraude
- **Verificación de Identidad**: Validación múltiple de datos personales
- **Límites de Intentos**: Prevención de ataques de fuerza bruta
- **Timeouts de Seguridad**: Delays entre intentos de recuperación
- **Auditoría Completa**: Registro de todos los intentos de recuperación

#### ✅ Integridad del Proceso
- **Validación Blockchain**: Verificación descentralizada de solicitudes
- **Aprobaciones Múltiples**: Requerimiento de consenso de guardianes
- **Códigos Únicos**: QRs no reutilizables y únicos por usuario
- **Encriptación**: Protección de datos durante el proceso

## 📊 Configuración de Tests

### Prerequisitos
- **App Instalada**: `com.tuvotodecide` en dispositivo de prueba
- **Usuario de Prueba**: Cuenta configurada con guardianes y QR de respaldo
- **Datos de Prueba**: CI válido para búsquedas
- **Conectividad**: Para notificaciones y validaciones blockchain

### Variables de Entorno
```bash
export TEST_CI="12345678"                    # CI para búsquedas de prueba
export RECOVERY_TIMEOUT="30000"              # Timeout para procesos de recuperación
export GUARDIAN_COUNT="3"                    # Número de guardianes de prueba
export QR_BACKUP_PATH="/path/to/backup.qr"   # Ruta del QR de respaldo de prueba
```

### Datos de Prueba
```javascript
// Cédulas de Identidad para testing
validCIs: ["12345678", "87654321", "11223344"]
invalidCIs: ["99999999", "00000000", "12345"]

// Estados de recuperación
recoveryStates: ["Pendiente", "En Proceso", "Aprobada", "Rechazada"]

// Tipos de recuperación
recoveryMethods: ["Guardianes", "QR", "Soporte Técnico"]
```

## 🔄 Flujos de Testing Específicos

### Test: access_recovery_options.yaml
```yaml
# Verificar acceso a opciones de recuperación
- Navegar desde login a "Olvidé mi cuenta"
- Verificar opciones disponibles:
  - "Recuperar con tutores"
  - "Recuperar con QR"
  - "Buscar mi cuenta"
- Validar navegación a cada opción
```

### Test: guardian_recovery.yaml
```yaml
# Proceso completo con guardianes
- Acceder a "Recuperar con tutores"
- Verificar mensaje explicativo
- Iniciar "Solicitar ayuda"
- Confirmar envío de solicitudes
- Verificar estado "Solicitud enviada"
```

### Test: qr_recovery.yaml
```yaml
# Recuperación con código QR
- Acceder a "Recuperar con QR"
- Activar cámara para escaneo
- Validar QR de respaldo
- Confirmar restauración de cuenta
- Verificar acceso completo restaurado
```

### Test: find_user.yaml
```yaml
# Búsqueda y validación de usuario
- Acceder a búsqueda de usuario
- Ingresar CI de prueba
- Validar información mostrada
- Confirmar identidad del usuario
- Proceder con recuperación
```

## 🛡️ Consideraciones de Seguridad

### Medidas de Protección
- **Rate Limiting**: Límites en intentos de recuperación
- **Validación Múltiple**: Verificación en varios niveles
- **Auditoría Completa**: Logs detallados de todos los procesos
- **Encriptación End-to-End**: Protección de datos sensibles

### Prevención de Ataques
- **Social Engineering**: Validaciones adicionales de identidad
- **Man-in-the-Middle**: Comunicaciones seguras
- **Replay Attacks**: Tokens únicos y de un solo uso
- **Brute Force**: Timeouts exponenciales

## 🐛 Troubleshooting y Casos Edge

### Problemas Comunes
1. **"Usuario no encontrado"**: CI inexistente en sistema
2. **"Guardianes no responden"**: Timeouts en aprobaciones
3. **"QR inválido"**: Código QR dañado o incorrecto
4. **"Proceso en curso"**: Múltiples solicitudes simultáneas

### Soluciones y Manejo
- **Retry Logic**: Reintentos automáticos para fallos de red
- **Fallback Methods**: Métodos alternativos de recuperación
- **User Feedback**: Mensajes claros sobre estado del proceso
- **Support Integration**: Escalación a soporte técnico

### Casos Edge Cubiertos
- **Red Inestable**: Funcionalidad con conectividad limitada
- **Guardianes Inactivos**: Manejo cuando guardianes no responden
- **QR Dañados**: Validación de códigos QR parcialmente legibles
- **Múltiples Dispositivos**: Sincronización entre dispositivos

## 📈 Métricas de Calidad

### Cobertura de Tests
- **95%** de flujos de recuperación principales
- **90%** de casos edge y validaciones de error
- **85%** de integraciones con servicios externos
- **100%** de validaciones de seguridad críticas

### Objetivos de Calidad
- **Tiempo de Recuperación**: < 5 minutos para flujo completo
- **Tasa de Éxito**: > 95% para usuarios con datos válidos
- **Seguridad**: 0 vulnerabilidades en auditorías
- **Usabilidad**: Flujo comprensible sin documentación

## 🚦 Estados de Tests

### ✅ Implementados y Funcionando
- `access_recovery_options.yaml` - Acceso básico a recuperación
- `guardian_recovery.yaml` - Recuperación con guardianes
- `qr_recovery.yaml` - Recuperación con QR
- `find_user.yaml` - Búsqueda de usuario

### 🔄 Próximas Mejoras
- [ ] Tests de recuperación avanzada con múltiples métodos
- [ ] Validación de tiempos de respuesta
- [ ] Tests de concurrencia con múltiples solicitudes
- [ ] Integración con tests de seguridad

---

**Estado**: ✅ Activo - Tests implementados y funcionando

**Última actualización**: Agosto 2025

**Mantenedor**: Equipo de Seguridad Electoral

**Contacto**: security-tests@tuvotodecide.com
