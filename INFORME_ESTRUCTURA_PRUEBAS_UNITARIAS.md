# Informe de Estructura de Pruebas Unitarias - Aplicación Electoral React Native

## Introducción

Este informe detalla la implementación de pruebas unitarias exhaustivas para la aplicación electoral React Native siguiendo las mejores prácticas de Jest y React Native Testing Library. La estrategia está diseñada para garantizar la calidad del código, la estabilidad de la aplicación y facilitar el mantenimiento futuro.

## 📁 Estructura Propuesta de Directorios para Tests

```
__tests__/
├── __mocks__/                          # Mocks globales
│   ├── @react-native-async-storage/    # Mock AsyncStorage
│   ├── @react-native-firebase/         # Mock Firebase
│   ├── react-native-keychain/          # Mock Keychain
│   ├── react-native-biometrics/        # Mock Biometrics
│   ├── react-native-vector-icons/      # Mock Icons
│   └── navigation.js                   # Mock Navigation
│
├── setup/                              # Configuración de pruebas
│   ├── jest.setup.js                   # Setup global de Jest
│   ├── test-utils.js                   # Utilidades de testing
│   └── mock-data.js                    # Datos mock reutilizables
│
├── unit/                               # Pruebas unitarias
│   ├── components/                     # Tests de componentes UI
│   │   ├── authComponents/
│   │   ├── common/
│   │   ├── home/
│   │   ├── modal/
│   │   └── QR/
│   │
│   ├── containers/                     # Tests de contenedores/screens
│   │   ├── Auth/
│   │   ├── Vote/
│   │   ├── TabBar/
│   │   └── register/
│   │
│   ├── services/                       # Tests de servicios
│   │   ├── FirebaseNotificationService.test.js
│   │   └── api/
│   │
│   ├── utils/                          # Tests de utilidades
│   │   ├── auth.test.js
│   │   ├── validation.test.js
│   │   ├── account.test.js
│   │   └── biometry.test.js
│   │
│   ├── redux/                          # Tests de Redux
│   │   ├── slices/
│   │   ├── actions/
│   │   └── reducers/
│   │
│   ├── hooks/                          # Tests de custom hooks
│   │   ├── useFirebaseUserSetup.test.js
│   │   ├── useNetworkRequest.test.js
│   │   └── useSearchTableLogic.test.js
│   │
│   └── navigation/                     # Tests de navegación
│       ├── index.test.js
│       └── RootNavigation.test.js
│
├── integration/                        # Pruebas de integración
│   ├── auth-flow/
│   ├── voting-flow/
│   ├── guardian-flow/
│   └── recovery-flow/
│
└── e2e/                               # Pruebas end-to-end (Maestro)
    ├── auth/
    ├── voting/
    └── profile/
```

## 🧪 Lista de Tests por Categorías y Flujos

### 1. **Flujo de Autenticación**

#### 1.1 Componentes de Autenticación
- `Login.test.js` - Pantalla de login principal
- `SignUp.test.js` - Registro de usuario
- `OTPCode.test.js` - Verificación por código OTP
- `CreatePin.test.js` - Creación de PIN
- `FaceIdScreen.test.js` - Configuración Face ID
- `FingerPrintScreen.test.js` - Configuración huella dactilar
- `SelectCountry.test.js` - Selección de país
- `UploadDocument.test.js` - Subida de documentos
- `SelfieWithIdCard.test.js` - Selfie con documento

#### 1.2 Registro de Usuarios (11 pantallas)
- `RegisterUser1.test.js` - Datos básicos
- `RegisterUser2.test.js` - Información personal
- `RegisterUser3.test.js` - Documento de identidad
- `RegisterUser4.test.js` - Verificación documento
- `RegisterUser5.test.js` - Datos de contacto
- `RegisterUser6.test.js` - Dirección
- `RegisterUser7.test.js` - Información electoral
- `RegisterUser8Pin.test.js` - Creación PIN
- `RegisterUser9Pin.test.js` - Confirmación PIN
- `RegisterUser10.test.js` - Configuración biométrica
- `RegisterUser11.test.js` - Finalización registro

#### 1.3 Utilidades de Autenticación
- `auth.utils.test.js` - Funciones de validación auth
- `biometry.utils.test.js` - Gestión biométrica
- `validation.utils.test.js` - Validaciones de formularios

### 2. **Flujo de Votación**

#### 2.1 Pantallas de Votación
- `ElectoralLocationsScreen.test.js` - Ubicaciones electorales
- `UnifiedTableScreen.test.js` - Pantalla unificada de mesas
- `SearchTable.test.js` - Búsqueda de mesa electoral
- `TableDetail.test.js` - Detalles de mesa
- `CameraScreen.test.js` - Captura de fotografías
- `PhotoReviewScreen.test.js` - Revisión de fotos
- `PhotoConfirmationScreen.test.js` - Confirmación de fotos

#### 2.2 Testigos y Registros
- `WitnessRecord.test.js` - Atestiguar acta
- `MyWitnessesListScreen.test.js` - Lista de testimonios
- `MyWitnessesDetailScreen.test.js` - Detalle de testimonio
- `RecordReviewScreen.test.js` - Revisión de acta
- `RecordCertificationScreen.test.js` - Certificación de acta

#### 2.3 Anuncio de Conteo
- `AnnounceCount.test.js` - Anuncio de conteo
- `SearchCountTable.test.js` - Búsqueda mesa conteo
- `CountTableDetail.test.js` - Detalle mesa conteo

### 3. **Flujo de Perfil y Configuración**

#### 3.1 Pantallas de Perfil
- `Profile.test.js` - Perfil principal
- `PersonalDetails.test.js` - Detalles personales
- `SelectLanguage.test.js` - Selección idioma
- `PushNotification.test.js` - Configuración notificaciones
- `HelpCenter.test.js` - Centro de ayuda
- `FAQScreen.test.js` - Preguntas frecuentes
- `PrivacyPolicies.test.js` - Políticas de privacidad

#### 3.2 Cambio de PIN
- `ChangePinVerify.test.js` - Verificación PIN actual
- `ChangePinNew.test.js` - Nuevo PIN
- `ChangePinNewConfirm.test.js` - Confirmación nuevo PIN

#### 3.3 Configuración de Seguridad
- `Security.test.js` - Pantalla de seguridad
- `BiometricSettings.test.js` - Configuración biométrica

### 4. **Flujo de Guardianes**

#### 4.1 Gestión de Guardianes
- `Guardians.test.js` - Lista de guardianes
- `GuardiansAdmin.test.js` - Administración guardianes
- `AddGuardians.test.js` - Agregar guardianes
- `MyGuardiansStatus.test.js` - Estado de guardianes

#### 4.2 Recuperación de Cuenta
- `FindMyUser.test.js` - Búsqueda de usuario
- `RecoveryUser1Pin.test.js` - Recuperación PIN 1
- `RecoveryUser2Pin.test.js` - Recuperación PIN 2
- `RecoveryFinalize.test.js` - Finalización recuperación

### 5. **Servicios y APIs**

#### 5.1 Servicios Core
- `FirebaseNotificationService.test.js` - Notificaciones Firebase
- `account.api.test.js` - API de cuentas
- `oracle.api.test.js` - API Oracle
- `guardianOnChain.api.test.js` - Guardianes blockchain

#### 5.2 Utilidades
- `AsyncStorage.utils.test.js` - Gestión almacenamiento
- `networkUtils.test.js` - Utilidades de red
- `encryption.utils.test.js` - Cifrado y seguridad

### 6. **Redux y Estado Global**

#### 6.1 Slices
- `authSlice.test.js` - Estado de autenticación
- `userSlice.test.js` - Estado del usuario
- `votingSlice.test.js` - Estado de votación
- `guardiansSlice.test.js` - Estado de guardianes

#### 6.2 Actions y Reducers
- `authActions.test.js` - Acciones de autenticación
- `userActions.test.js` - Acciones de usuario
- `asyncActions.test.js` - Acciones asíncronas

### 7. **Hooks Personalizados**

- `useFirebaseUserSetup.test.js` - Setup usuario Firebase
- `useNetworkRequest.test.js` - Peticiones de red
- `useSearchTableLogic.test.js` - Lógica búsqueda mesas
- `useBiometricAuth.test.js` - Autenticación biométrica

### 8. **Navegación**

- `RootNavigation.test.js` - Navegación raíz
- `AuthNavigation.test.js` - Navegación autenticación
- `TabNavigation.test.js` - Navegación tabs
- `StackNavigation.test.js` - Navegación stack

## 📅 Planificación Semanal Acelerada (4-5 Semanas)

### **Semana 1: Configuración Base + Autenticación Core**
**Objetivo:** Establecer fundamentos y flujos críticos de autenticación

**Tests CRÍTICOS a implementar:**
- ✅ Setup inicial de Jest y configuración completa
- ✅ Mocks básicos (AsyncStorage, Navigation, Firebase, Biometrics)
- 🔥 **Priority 1:** `Login.test.js`, `CreatePin.test.js`, `authSlice.test.js`
- 🔥 **Priority 1:** `RegisterUser1.test.js`, `RegisterUser8Pin.test.js`, `RegisterUser11.test.js`
- 🔥 **Priority 1:** `auth.utils.test.js`, `validation.utils.test.js`
- ⚡ **Si hay tiempo:** `FaceIdScreen.test.js`, `biometry.utils.test.js`

**Tests OPCIONALES (si sobra tiempo):**
- `SignUp.test.js`, `OTPCode.test.js`, `SelectCountry.test.js`

**Deliverables:**
- ✅ Configuración completa de testing (80% cobertura target)
- ✅ Flujo de login y registro básico funcional
- ✅ Documentación de setup y convenciones

**Tiempo estimado:** 35-40 horas

---

### **Semana 2: Votación Core + Captura de Actas**
**Objetivo:** Implementar el corazón funcional de la aplicación electoral

**Tests CRÍTICOS a implementar:**
- 🔥 **Priority 1:** `ElectoralLocationsScreen.test.js`, `UnifiedTableScreen.test.js`
- 🔥 **Priority 1:** `SearchTable.test.js`, `useSearchTableLogic.test.js`
- 🔥 **Priority 1:** `CameraScreen.test.js`, `PhotoReviewScreen.test.js`
- 🔥 **Priority 1:** `WitnessRecord.test.js`, `RecordReviewScreen.test.js`
- ⚡ **Priority 2:** `TableDetail.test.js`, `PhotoConfirmationScreen.test.js`

**Tests OPCIONALES:**
- `MyWitnessesListScreen.test.js`, `RecordCertificationScreen.test.js`
- Tests de permisos de cámara avanzados

**Deliverables:**
- ✅ Flujo completo de votación funcional
- ✅ Sistema de captura y testimonio de actas
- ✅ Tests de búsqueda de mesas electorales

**Tiempo estimado:** 40-45 horas

---

### **Semana 3: Servicios Backend + Estado Global + Seguridad**
**Objetivo:** Asegurar la robustez del backend y manejo de estado

**Tests CRÍTICOS a implementar:**
- 🔥 **Priority 1:** `FirebaseNotificationService.test.js`
- 🔥 **Priority 1:** `account.api.test.js`, `oracle.api.test.js`
- 🔥 **Priority 1:** `userSlice.test.js`, `votingSlice.test.js`
- 🔥 **Priority 1:** `useFirebaseUserSetup.test.js`, `useNetworkRequest.test.js`
- ⚡ **Priority 2:** `Security.test.js`, `ChangePinVerify.test.js`
- ⚡ **Priority 2:** `networkUtils.test.js`, `AsyncStorage.utils.test.js`

**Tests OPCIONALES:**
- `guardianOnChain.api.test.js`, `encryption.utils.test.js`
- Tests avanzados de Redux actions

**Deliverables:**
- ✅ APIs y servicios completamente testeados
- ✅ Estado global robusto con Redux
- ✅ Hooks personalizados funcionando
- ✅ Base de seguridad establecida

**Tiempo estimado:** 40-45 horas

---

### **Semana 4: Guardianes + Perfil + Navegación**
**Objetivo:** Completar funcionalidades secundarias críticas

**Tests CRÍTICOS a implementar:**
- 🔥 **Priority 1:** `Guardians.test.js`, `AddGuardians.test.js`
- 🔥 **Priority 1:** `MyGuardiansStatus.test.js`, `RecoveryFinalize.test.js`
- 🔥 **Priority 1:** `Profile.test.js`, `PersonalDetails.test.js`
- ⚡ **Priority 2:** `RootNavigation.test.js`, `TabNavigation.test.js`
- ⚡ **Priority 2:** `FindMyUser.test.js`, `guardiansSlice.test.js`

**Tests OPCIONALES:**
- `GuardiansAdmin.test.js`, `RecoveryUser1Pin.test.js`
- `SelectLanguage.test.js`, `PushNotification.test.js`

**Deliverables:**
- ✅ Sistema completo de guardianes y recuperación
- ✅ Gestión básica de perfil
- ✅ Navegación principal testeada

**Tiempo estimado:** 35-40 horas

---

### **Semana 5: Integración + Optimización + Conteo (OPCIONAL)**
**Objetivo:** Refinamiento, integración y funcionalidades adicionales

**Tests CRÍTICOS a implementar:**
- 🔥 **Priority 1:** Tests de integración entre módulos principales
- 🔥 **Priority 1:** Análisis y optimización de cobertura (objetivo: 75%+)
- 🔥 **Priority 1:** Performance tests y cleanup
- ⚡ **Priority 2:** `AnnounceCount.test.js`, `CountTableDetail.test.js`
- ⚡ **Priority 2:** Tests E2E básicos con Maestro

**Tests OPCIONALES:**
- `SearchCountTable.test.js`
- `HelpCenter.test.js`, `FAQScreen.test.js`
- Documentación completa

**Deliverables:**
- ✅ Suite de tests integrada y optimizada
- ✅ Cobertura mínima del 75% alcanzada
- ✅ Performance optimizado (< 3 min ejecución completa)
- ⚡ Funcionalidades de conteo (si es requerido)

**Tiempo estimado:** 30-35 horas

---

## 🎯 **Estrategia de Priorización Acelerada**

### **Criterios de Prioridad:**
1. **🔥 Priority 1 - CRÍTICO:** Flujos principales que afectan funcionalidad core
2. **⚡ Priority 2 - IMPORTANTE:** Funcionalidades secundarias necesarias
3. **📋 Priority 3 - OPCIONAL:** Nice-to-have, implementar solo si sobra tiempo

### **Flujos Principales Cubiertos (75%+ del valor):**
- ✅ **Autenticación:** Login, PIN, registro básico
- ✅ **Votación:** Búsqueda mesas, captura actas, testimonio
- ✅ **Backend:** APIs, Firebase, estado global
- ✅ **Seguridad:** Guardianes, recuperación, perfil básico

### **Funcionalidades Opcionales (25% restante):**
- Registro completo (11 pantallas)
- Conteo electoral detallado
- Configuraciones avanzadas de perfil
- Help center y FAQ

### **Métricas de Éxito Ajustadas (4-5 semanas):**
- **Cobertura mínima:** 70-75% (vs 80% original)
- **Flujos críticos:** 90%+ cobertura
- **Tiempo de ejecución:** < 3 minutos
- **Tests funcionando:** 95%+ pasan en CI/CD

### **Estrategias de Optimización:**
1. **Paralelización:** Múltiples tests simultaneos donde sea posible
2. **Templates:** Crear templates reutilizables para tests similares
3. **Mocking inteligente:** Mocks compartidos entre múltiples tests
4. **Focus testing:** Solo tests críticos la primera iteración
5. **Continuous feedback:** Review diario de progreso

### **Plan de Contingencia:**
- **Si se atrasa Semana 1:** Reducir tests opcionales, focus en Priority 1
- **Si se atrasa Semana 2:** Posponer conteo electoral para después
- **Si se atrasa Semana 3:** Simplificar tests de Redux, focus en APIs críticas  
- **Si se atrasa Semana 4:** Combinar con Semana 5, omitir navegación avanzada

## 🛠️ Configuración Técnica Recomendada

### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-vector-icons)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/assets/**',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,jsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}'
  ]
};
```

### Dependencias Adicionales Requeridas
```json
{
  "@testing-library/react-native": "^12.4.2",
  "@testing-library/jest-native": "^5.4.3",
  "react-test-renderer": "19.0.0",
  "jest-environment-node": "^29.6.3"
}
```

## 📊 Métricas de Éxito

### Cobertura Objetivo
- **Líneas de código:** ≥ 80%
- **Funciones:** ≥ 85%
- **Branches:** ≥ 75%
- **Statements:** ≥ 80%

### KPIs de Calidad
- **Tiempo de ejecución:** < 5 minutos para suite completa
- **Tests fallidos:** 0% en CI/CD
- **Flaky tests:** < 2%
- **Mantenibilidad:** Tests actualizados en cada PR

## 🔧 Herramientas y Librerías

### Testing Stack
- **Jest:** Framework principal de testing
- **React Native Testing Library:** Testing de componentes
- **Redux Mock Store:** Testing de Redux
- **MSW (Mock Service Worker):** Mocking de APIs
- **React Navigation Testing:** Testing de navegación

### Utilidades
- **@testing-library/jest-native:** Matchers adicionales
- **jest-environment-jsdom:** Entorno DOM para tests
- **babel-jest:** Transpilación de código

## 📝 Consideraciones Especiales para Plan Acelerado

### Mocking Estratégico (Configuración Semana 1)
1. **Firebase:** Mock completo para evitar dependencias externas
2. **AsyncStorage:** Mock para testing de persistencia
3. **Biometría:** Mock para testing sin hardware
4. **Cámara:** Mock para testing de captura
5. **Navegación:** Mock para testing de flujos
6. **APIs:** Mock con MSW para respuestas consistentes

### Performance Optimizada
- **Tests paralelos:** Habilitados por defecto (jest --maxWorkers=50%)
- **Caché inteligente:** Transformaciones y mocks cacheados
- **Imports optimizados:** Solo importar lo necesario
- **Cleanup automático:** Entre tests para evitar memory leaks
- **Test sharding:** Dividir suites grandes para ejecución más rápida

### Estrategias de Aceleración
1. **Templates reutilizables:** Crear plantillas para tests similares
2. **Shared test utilities:** Funciones helper compartidas
3. **Snapshot testing:** Para componentes con UI estable
4. **Focused testing:** Solo ejecutar tests relevantes durante desarrollo
5. **Mock factories:** Generadores automáticos de datos de prueba

### Mantenimiento Eficiente
- **Tests auto-actualizables:** Con snapshots y utilidades dinámicas
- **Convenciones estrictas:** Naming y estructura consistente
- **Documentación inline:** JSDoc en tests complejos
- **Git hooks:** Tests automáticos en pre-commit
- **CI/CD integration:** Feedback inmediato en PRs

## � Próximos Pasos Inmediatos

### **Antes de Comenzar:**
1. **Validar alcance:** Confirmar prioridades con stakeholders
2. **Preparar entorno:** Instalar dependencias y configurar IDE
3. **Definir daily standups:** Seguimiento diario de progreso
4. **Crear templates:** Plantillas base para tests recurrentes

### **Semana 1 - Día 1:**
1. ✅ **Configurar Jest y Testing Library** (2-3 horas)
2. ✅ **Crear estructura base de directorios** (1 hora)
3. ✅ **Implementar mocks principales** (3-4 horas)
4. ✅ **Primer test funcional:** `Login.test.js` (2 horas)

### **Daily Goals (cada día 6-8 horas):**
- **2-3 tests principales** completados y funcionando
- **1 mock o utility** nueva implementada
- **Review y refactor** de tests del día anterior
- **Update cobertura** y métricas de progreso

### **Weekly Reviews:**
- **Viernes cada semana:** Análisis de cobertura alcanzada
- **Demo funcional:** Mostrar tests ejecutándose
- **Adjustment planning:** Ajustar próxima semana según progreso
- **Risk assessment:** Identificar blockers potenciales

## 🎯 **Criterios de Éxito del Plan Acelerado**

### **Métricas Mínimas Aceptables:**
- ✅ **Cobertura global:** 70%+ (vs 80% del plan original)
- ✅ **Flujos críticos:** 85%+ (autenticación, votación, APIs)
- ✅ **Tiempo ejecución:** < 3 minutos suite completa
- ✅ **Estabilidad:** 95%+ tests pasan consistentemente
- ✅ **CI/CD:** Pipeline funcionando sin fallos

### **Entregables Garantizados:**
1. **Tests de autenticación completos** - Login, PIN, registro básico
2. **Tests de votación funcionales** - Búsqueda mesas, captura, testimonio  
3. **Tests de backend robustos** - APIs, Firebase, estado global
4. **Tests de seguridad básicos** - Guardianes, recuperación
5. **Infraestructura de testing** - Mocks, utils, CI/CD

### **Nice-to-Have (si el tiempo lo permite):**
- Registro completo (11 pantallas)
- Funcionalidades de conteo electoral
- Tests E2E avanzados
- Documentación exhaustiva
- Performance tests detallados

## ⚠️ **Gestión de Riesgos**

### **Riesgos Identificados y Mitigación:**

1. **🔴 Complejidad de mocking Firebase/Biometrics**
   - *Mitigación:* Usar librerías probadas, implementar mocks simples primero

2. **🟡 Tiempo subestimado para tests de integración**
   - *Mitigación:* Priorizar tests unitarios, integración básica solo

3. **🟡 Dependencias entre componentes complejas**
   - *Mitigación:* Tests aislados con mocks pesados, evitar dependencias reales

4. **🟢 Falta de experiencia con Testing Library**
   - *Mitigación:* Comenzar con tests simples, documentar patrones exitosos

### **Plan de Escalación:**
- **Blocker crítico:** Escalate inmediatamente, buscar alternativas
- **Retraso 1-2 días:** Reducir tests opcionales, focus en críticos
- **Retraso 1 semana:** Re-scope plan, extender a 6 semanas si necesario

Este plan acelerado mantiene la calidad mientras se adapta a restricciones de tiempo, priorizando el máximo valor en el mínimo tiempo posible.
