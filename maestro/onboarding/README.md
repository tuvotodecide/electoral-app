# Tests E2E de Onboarding - Maestro

Esta carpeta contiene tests end-to-end para el sistema de onboarding de la aplicación electoral usando Maestro.

## Estructura de Tests

### Tests Principales

1. **complete_onboarding_tutorial.yaml** - Completar tutorial de onboarding completo
2. **skip_onboarding.yaml** - Saltar tutorial usando botón X
3. **complete_onboarding_flow.yaml** - Flujo completo desde Connect hasta completar onboarding

### Tests de Navegación

4. **navigate_tutorial_screens.yaml** - Navegación entre pantallas del tutorial
5. **swipe_navigation.yaml** - Navegación por gestos de swipe
6. **fast_navigation.yaml** - Navegación rápida sin esperas
7. **progress_indicators.yaml** - Indicadores de progreso del tutorial

### Tests de Contenido

8. **verify_screen_content.yaml** - Verificar contenido de todas las pantallas
9. **visual_elements_interaction.yaml** - Interacciones con elementos visuales

### Tests de Guardianes

10. **guardians_tutorial_access.yaml** - Acceder al tutorial de guardianes desde onboarding
11. **guardians_complete_tutorial.yaml** - Tutorial de guardianes completo

### Tests de Funcionalidad Avanzada

12. **interrupt_resume_tutorial.yaml** - Interrumpir y reanudar tutorial
13. **multiple_access.yaml** - Múltiples accesos al tutorial
14. **dark_mode_tutorial.yaml** - Modo oscuro en onboarding
15. **device_rotation.yaml** - Rotación de pantalla durante tutorial

### Tests de Rendimiento y Accesibilidad

16. **memory_limited_conditions.yaml** - Comportamiento en memoria limitada
17. **accessibility_features.yaml** - Accesibilidad del tutorial

## Casos de Uso Cubiertos

### Flujos Principales
- ✅ Tutorial completo paso a paso
- ✅ Saltar tutorial en cualquier momento
- ✅ Navegación hacia adelante y atrás
- ✅ Indicadores de progreso visual

### Funcionalidad de Guardianes
- ✅ Acceso a tutorial específico de guardianes
- ✅ Contenido educativo sobre sistema de guardianes
- ✅ Integración con flujo principal

### Interacciones Avanzadas
- ✅ Navegación por gestos (swipe)
- ✅ Interrupción y reanudación
- ✅ Múltiples accesos al tutorial
- ✅ Modo oscuro y temas

### Robustez
- ✅ Rotación de dispositivo
- ✅ Condiciones de memoria limitada
- ✅ Accesibilidad y tecnologías asistivas
- ✅ Navegación rápida

### Validaciones
- ✅ Contenido correcto en cada pantalla
- ✅ Estado persistente del onboarding
- ✅ Elementos visuales e interactivos
- ✅ Flujo completo de inicio a fin

## Configuración

### Requisitos
- Maestro CLI instalado
- Dispositivo Android/iOS conectado
- App electoral instalada (`com.tuvotodecide`)

### Variables de Entorno
```bash
export MAESTRO_APP_ID="com.tuvotodecide"
export MAESTRO_TIMEOUT=30000
```

## Ejecución

### Test Individual
```bash
maestro test maestro/onboarding/complete_onboarding_tutorial.yaml
```

### Suite Completa
```bash
./run_onboarding_tests.sh
```

### Por Categorías
```bash
# Tests principales
maestro test maestro/onboarding/complete_onboarding_tutorial.yaml
maestro test maestro/onboarding/skip_onboarding.yaml
maestro test maestro/onboarding/complete_onboarding_flow.yaml

# Tests de navegación
maestro test maestro/onboarding/navigate_tutorial_screens.yaml
maestro test maestro/onboarding/swipe_navigation.yaml
maestro test maestro/onboarding/fast_navigation.yaml

# Tests de guardianes
maestro test maestro/onboarding/guardians_tutorial_access.yaml
maestro test maestro/onboarding/guardians_complete_tutorial.yaml
```

## Notas Técnicas

### Timeouts
- Tests principales: 5-10 segundos
- Tests de navegación: 3-5 segundos
- Tests complejos: 10-30 segundos

### Selectores Usados
- Texto: `"Saber más"`, `"Siguiente"`, `"Empezar"`
- Puntos: `"90%,10%"` (botón cerrar)
- IDs: `".*OnBoardingImage.*"`, `".*tutorial.*"`
- Regex: `".*identidad.*digital.*"`, `".*guard.*cuenta.*"`

### Consideraciones
- Uso extensivo de `optional: true` para robustez
- Esperas configurables entre interacciones
- Navegación por swipe como alternativa
- Verificación de estado post-tutorial

### Datos de Prueba
- App ID: `com.tuvotodecide`
- Textos clave: en español según i18n
- Navegación: 5 pantallas principales
- Botones: "Siguiente", "Empezar", "X" (cerrar)

## Estructura del Tutorial

### OnBoarding Principal (5 pantallas)
1. **Identidad Digital** - Privacidad y control
2. **Votación Segura** - Blockchain y verificabilidad
3. **Guardianes** - Recuperación de cuenta
4. **Participación Democrática** - Comunidad y decisiones
5. **Finalización** - Botón "Empezar"

### OnBoarding Guardianes
- Tutorial específico sobre sistema de guardianes
- Educación sobre invitaciones y recuperación
- Integración con flujo principal

## Troubleshooting

### Problemas Comunes
1. **Botón "Saber más" no encontrado**: Verificar que la app esté en pantalla Connect
2. **Tutorial no avanza**: Verificar timeouts y esperas
3. **Contenido no coincide**: Revisar strings de i18n actuales
4. **Navegación por swipe falla**: Usar botones como alternativa

### Debug
```bash
maestro test --debug maestro/onboarding/debug_current_screen.yaml
```
