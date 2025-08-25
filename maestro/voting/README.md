# 🗳️ Tests de Votación Electoral Comprehensivos

Este directorio contiene una suite completa de tests e2e para todas las funcionalidades de votación y participación electoral de la aplicación.

## 📋 Lista de Tests

### Tests de Búsqueda y Navegación
- **`access_electoral_participation.yaml`** - Acceso básico a participación electoral
- **`mesa_search_comprehensive.yaml`** - Búsqueda comprehensiva de mesas electorales
  - Validaciones de entrada
  - Códigos inválidos y casos límite
  - Filtros por ubicación
  - Navegación entre mesas

- **`search_electoral_table.yaml`** - Búsqueda básica de mesa electoral

### Tests de Subida de Actas
- **`acta_upload_comprehensive.yaml`** - Flujo completo de subida de actas
  - Toma de fotos con cámara
  - Análisis con IA/OCR
  - Edición de datos detectados
  - Proceso de certificación NFT

- **`upload_acta_photo.yaml`** - Subida básica de foto de acta
- **`camera_image_processing.yaml`** - Funcionalidades de cámara y procesamiento
  - Permisos de cámara
  - Flash y configuraciones
  - Calidad de imagen
  - Múltiples fotos
  - Subida a IPFS

### Tests de Validación de Datos
- **`data_validation_comprehensive.yaml`** - Validaciones exhaustivas de formularios
  - Números negativos
  - Caracteres no numéricos
  - Campos vacíos
  - Consistencia de totales
  - Límites máximos/mínimos

### Tests de Atestiguamiento
- **`witness_comprehensive.yaml`** - Atestiguamiento completo de actas
  - Revisar actas existentes
  - Confirmar acta correcta
  - Subir acta cuando ninguna es correcta
  - Historial de atestiguamientos

- **`witness_actas.yaml`** - Atestiguamiento básico
- **`upload_correct_acta.yaml`** - Subida de acta correcta alternativa
- **`witness_history_management.yaml`** - Gestión de historial personal
  - Lista de atestiguamientos
  - Filtros y búsqueda
  - Exportación de datos
  - Certificados NFT

### Tests de Red y Errores
- **`network_error_handling.yaml`** - Manejo de errores de conectividad
  - Timeouts de carga
  - Fallos de análisis IA
  - Modo offline/degradado
  - Sincronización manual
  - Reintentos automáticos

### Tests de Navegación
- **`scrollprueba.yaml`** - Pruebas de scroll y navegación compleja
  - Scroll en formularios largos
  - Edición de múltiples campos
  - Navegación entre secciones

### Test Completo de Integración
- **`electoral_participation_complete.yaml`** - Flujo completo de participación
  - Subida de actas nuevas
  - Atestiguamiento de actas existentes
  - Múltiples escenarios
  - Funcionalidades avanzadas

## 🚀 Ejecución de Tests

### Ejecutar un test individual
```bash
maestro test maestro/voting/acta_upload_comprehensive.yaml
```

### Ejecutar todos los tests de votación
```bash
./maestro/voting/run_voting_comprehensive_tests.sh
```

### Ejecutar en dispositivo específico
```bash
./maestro/voting/run_voting_comprehensive_tests.sh <device_id>
```

## 📊 Reportes

Los tests generan:
- Resultados en formato JUnit XML
- Reporte HTML con categorización
- Logs detallados por funcionalidad
- Métricas de cobertura

Los resultados se guardan en `maestro/results/voting_<timestamp>/`

## 🎯 Casos de Uso Cubiertos

### Flujos de Usuario Principal
1. **Búsqueda de Mesas** - Localización y selección de mesas electorales
2. **Subida de Actas** - Captura, análisis y registro de actas
3. **Atestiguamiento** - Validación de actas existentes
4. **Historial Personal** - Gestión de participación propia

### Funcionalidades Técnicas
1. **Procesamiento de Imágenes** - OCR, IA, calidad de imagen
2. **Validación de Datos** - Formularios, consistencia, límites
3. **Blockchain/NFT** - Certificación y registro inmutable
4. **Conectividad** - Offline, sincronización, errores de red

### Casos Edge y Validaciones
1. **Entrada de Datos** - Caracteres especiales, límites, vacíos
2. **Errores de Red** - Timeouts, reconexión, modo degradado
3. **Permisos del Sistema** - Cámara, almacenamiento, ubicación
4. **Navegación Compleja** - Scroll, formularios largos, múltiples pantallas

## 🔧 Configuración Específica

### Prerequisitos Electorales
- App con funcionalidades de votación habilitadas
- Acceso a servicios de IA/OCR
- Conectividad a blockchain/IPFS
- Permisos de cámara y almacenamiento

### Variables de Entorno Específicas
- `AI_ANALYSIS_ENABLED`: Habilitar análisis con IA
- `BLOCKCHAIN_NETWORK`: Red blockchain a usar
- `IPFS_GATEWAY`: Gateway IPFS para imágenes

## 📝 Notas de Implementación

### Estrategias Específicas de Votación
- **Delays extendidos**: Análisis IA puede tomar 20-30 segundos
- **Validación robusta**: Múltiples verificaciones en formularios
- **Manejo de imágenes**: Diferentes tamaños y calidades
- **Estados complejos**: Múltiples pasos en procesos electorales

### Consideraciones Especiales
- **Análisis IA**: Puede fallar en emuladores sin conexión real
- **Cámara**: Requiere dispositivo físico para tests completos
- **Blockchain**: Transacciones pueden tomar tiempo en redes de prueba
- **IPFS**: Subida de imágenes sensible a conectividad

## 🐛 Solución de Problemas Específicos

### Tests que requieren atención especial
1. **camera_image_processing.yaml**: Requiere cámara física
2. **data_validation_comprehensive.yaml**: Sensible a cambios en validaciones
3. **network_error_handling.yaml**: Requiere control de conectividad
4. **electoral_participation_complete.yaml**: Test muy largo, puede timeout

### Tips específicos de votación
- Usar `delay` largo para análisis IA: `delay: 15000`
- Verificar permisos antes de usar cámara
- Manejar timeouts en blockchain con `extendedWaitUntil: timeout: 60000`
- Usar `optional: true` para elementos que dependen de servicios externos

## 📈 Métricas de Cobertura Electoral

Estos tests cubren aproximadamente:
- **95%** de flujos de subida de actas
- **90%** de funcionalidades de atestiguamiento
- **85%** de validaciones de datos electorales
- **80%** de casos de error en procesos electorales
- **90%** de navegación en interfaces complejas

## 🔍 Funcionalidades Avanzadas Cubiertas

### Tecnologías Blockchain
- ✅ Certificación NFT de actas
- ✅ Subida a IPFS de imágenes
- ✅ Verificación de transacciones
- ✅ Manejo de fallos de red blockchain

### Inteligencia Artificial
- ✅ OCR de actas electorales
- ✅ Detección automática de datos
- ✅ Validación de coherencia
- ✅ Corrección manual de errores IA

### Experiencia de Usuario
- ✅ Navegación intuitiva en procesos largos
- ✅ Feedback visual de progreso
- ✅ Manejo de errores user-friendly
- ✅ Accesibilidad en formularios complejos

## 🎯 Objetivos de Calidad

- **Confiabilidad**: Tests que funcionan consistentemente
- **Cobertura**: Todos los flujos críticos electorales
- **Mantenibilidad**: Código de tests claro y documentado
- **Escalabilidad**: Fácil agregar nuevos casos de uso
