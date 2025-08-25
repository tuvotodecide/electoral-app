# Tests E2E de Guardianes - Maestro

Este directorio contiene tests End-to-End para todos los flujos relacionados con la gestión de guardianes en la aplicación electoral usando Maestro.

## Estructura de Tests

### Tests Básicos de Gestión

1. **`access_guardians_management.yaml`** - Acceso exitoso a la gestión de guardianes
   - Verifica navegación a la sección de guardianes
   - Confirma elementos básicos de la interfaz

2. **`add_guardian.yaml`** - Flujo completo de agregar nuevo guardián
   - Prueba búsqueda de personas por CI
   - Maneja casos de persona no encontrada
   - Verifica envío de invitación

3. **`remove_guardian.yaml`** - Eliminar guardián existente
   - Accede a opciones de guardián
   - Confirma eliminación
   - Verifica cambio de estado

### Tests de Estados y Administración

4. **`guardian_status.yaml`** - Verificación de estados de guardianes
   - Verifica estados: Activo, Pendiente, Rechazado, Removido
   - Confirma información de cada guardián
   - Prueba visualización de apodos/nicknames

5. **`guardian_admin.yaml`** - Acceso a administración de guardianes (Mis Protegidos)
   - Navega a sección "Mis Protegidos"
   - Verifica invitaciones pendientes
   - Revisa solicitudes de recuperación

6. **`accept_invitation.yaml`** - Aceptar invitación de guardián
   - Acepta invitación desde "Mis Protegidos"
   - Confirma acción y verifica resultado
   - Valida cambio de estado

7. **`reject_invitation.yaml`** - Rechazar invitación de guardián
   - Rechaza invitación desde "Mis Protegidos"
   - Confirma rechazo y verifica resultado

### Tests de Recuperación

8. **`approve_recovery.yaml`** - Aprobar solicitud de recuperación como guardián
   - Aprueba solicitud de recuperación
   - Maneja confirmación de aprobación
   - Verifica proceso en blockchain

9. **`reject_recovery.yaml`** - Rechazar solicitud de recuperación como guardián
   - Rechaza solicitud de recuperación
   - Confirma rechazo y verifica estado

### Tests de Configuración y Personalización

10. **`edit_guardian_nickname.yaml`** - Editar apodo/nickname de guardián
    - Edita información personalizada de guardián
    - Verifica guardado de cambios

11. **`guardian_configuration.yaml`** - Configuración de requisitos mínimos
    - Configura número mínimo de aprobaciones
    - Ajusta configuración de seguridad

12. **`guardian_info.yaml`** - Información educativa sobre guardianes
    - Accede a información sobre qué son los guardianes
    - Navega por contenido educativo

### Tests Avanzados

13. **`complete_guardian_flow.yaml`** - Flujo completo integrado
    - Combina múltiples funcionalidades
    - Prueba navegación completa entre secciones
    - Verifica coherencia del sistema

14. **`guardian_search_errors.yaml`** - Manejo de errores en búsqueda
    - Prueba validación de formato de CI
    - Maneja errores de conexión
    - Verifica mensajes de error apropiados

15. **`guardian_notifications.yaml`** - Estados de notificaciones y alertas
    - Verifica notificaciones de guardianes
    - Prueba alertas de seguridad
    - Confirma banners informativos

## Configuración de Ambiente

### Prerequisitos
- App instalada con `appId: com.tuvotodecide`
- Usuario con PIN `1234` configurado
- Al menos un guardián configurado para tests completos
- Conectividad de red para operaciones de búsqueda

### Datos de Prueba
```javascript
// CIs de prueba
validCI: "12345678"
invalidCI: "99999999"
malformedCI: "123abc@#"
shortCI: "123"

// Estados de guardián
states: ["Activo", "Pendiente", "Rechazado", "Removido"]

// Apodos de ejemplo
nicknames: ["Mamá", "Hermano", "Mi Hermano", "Papá"]
```

## Ejecución de Tests

### Tests Individuales
```bash
# Test básico de acceso
maestro test guardians/access_guardians_management.yaml

# Test de agregar guardián
maestro test guardians/add_guardian.yaml

# Test completo
maestro test guardians/complete_guardian_flow.yaml
```

### Suite Completa
```bash
# Todos los tests de guardianes
maestro test guardians/

# Con reporte detallado
maestro test guardians/ --format junit --output guardian-results.xml
```

## Patrones de Testing Utilizados

### Elementos de UI Específicos de Guardianes
- `"Tus Guardianes"` - Pantalla principal de guardianes
- `"Agregar guardián"` - Botón para agregar nuevo guardián
- `"Mis Protegidos"` - Sección de administración
- `"Aceptar"` / `"Rechazar"` - Botones de acción
- `"Activo"` / `"Pendiente"` / `"Rechazado"` - Estados

### Estrategias de Navegación
- Uso de `scrollUntilVisible` para "Mis Protegidos"
- Navegación por índices para múltiples guardianes
- Manejo de modales de confirmación

### Validaciones Específicas
- Verificación de estados de guardián
- Confirmación de envío de invitaciones
- Validación de formato de CI
- Verificación de procesos de blockchain

### Manejo de Asincronía
- `extendedWaitUntil` para operaciones de red (10-20 segundos)
- Timeouts específicos para búsquedas de CI
- Espera de confirmaciones de blockchain

## Casos de Uso Principales

### 1. Gestión Básica de Guardianes
- Ver lista de guardianes actuales
- Agregar nuevos guardianes por CI
- Eliminar guardianes existentes
- Editar información de guardianes

### 2. Administración como Guardián
- Recibir invitaciones para ser guardián
- Aceptar/rechazar invitaciones
- Aprobar/rechazar solicitudes de recuperación
- Gestionar múltiples personas protegidas

### 3. Configuración de Seguridad
- Configurar número mínimo de aprobaciones
- Ajustar requisitos de recuperación
- Personalizar configuración de transacciones

### 4. Educación y Soporte
- Acceder a información sobre guardianes
- Entender el proceso de recuperación
- Conocer mejores prácticas de seguridad

## Limitaciones y Consideraciones

### Dependencias de Red
- Tests de búsqueda requieren conectividad
- Operaciones de blockchain pueden tardar
- Notificaciones dependen de servicios externos

### Estados de Datos
- Tests asumen cierta configuración inicial
- Algunos flujos requieren guardianes preexistentes
- Estados pueden variar según el entorno

### Mantenimiento
- Actualizar CIs de prueba según disponibilidad
- Verificar timeouts según rendimiento de red
- Ajustar selectores si cambia la UI

## Troubleshooting

### Errores Comunes
1. **"Persona no encontrada"** - CI no existe en sistema
2. **Timeouts** - Red lenta o servicio no disponible
3. **Estados inconsistentes** - Datos de prueba desactualizados

### Soluciones
- Verificar conectividad antes de ejecutar tests
- Usar CIs válidos conocidos
- Limpiar estado de app entre tests si es necesario
