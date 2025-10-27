# Estructura de Tests - Aplicación Electoral

Este directorio contiene toda la infraestructura y tests unitarios para la aplicación electoral React Native.

## 📁 Estructura de Directorios

```
__tests__/
├── __mocks__/                          # Mocks globales reutilizables
│   ├── @react-native-async-storage/    # Mock AsyncStorage
│   ├── @react-native-firebase/         # Mock Firebase services
│   ├── react-native-biometrics.js      # Mock autenticación biométrica
│   ├── react-native-keychain.js        # Mock almacenamiento seguro
│   └── navigation.js                   # Mock navegación
│
├── setup/                              # Configuración de pruebas
│   ├── jest.setup.js                   # Setup global de Jest
│   ├── test-utils.js                   # Utilidades de testing
│   └── mock-data.js                    # Datos mock reutilizables
│
├── unit/                               # Pruebas unitarias organizadas
│   ├── components/                     # Tests de componentes UI
│   ├── containers/                     # Tests de pantallas/screens
│   ├── services/                       # Tests de servicios
│   ├── utils/                          # Tests de utilidades
│   ├── redux/                          # Tests de Redux
│   ├── hooks/                          # Tests de custom hooks
│   └── navigation/                     # Tests de navegación
│
└── integration/                        # Pruebas de integración
    ├── auth-flow/                      # Flujo de autenticación
    ├── voting-flow/                    # Flujo de votación
    └── guardian-flow/                  # Flujo de guardianes
```

## 🚀 Cómo Usar

### Ejecutar Todos los Tests
```bash
npm test
```

### Ejecutar Tests en Modo Watch
```bash
npm test -- --watch
```

### Ejecutar Tests con Coverage
```bash
npm test -- --coverage
```

### Ejecutar Tests Específicos
```bash
# Solo tests de autenticación
npm test -- __tests__/unit/containers/Auth

# Solo un archivo específico
npm test -- Login.test.js
```

## 📋 Plan de Implementación (4-5 Semanas)

### Semana 1: Autenticación Core ✅
- [x] Setup inicial y configuración
- [x] Mocks básicos implementados
- [ ] Login.test.js (Priority 1)
- [ ] CreatePin.test.js (Priority 1)
- [ ] authSlice.test.js (Priority 1)
- [ ] auth.utils.test.js (Priority 1)

### Semana 2: Votación Core
- [ ] ElectoralLocationsScreen.test.js
- [ ] UnifiedTableScreen.test.js
- [ ] CameraScreen.test.js
- [ ] WitnessRecord.test.js

### Semana 3: Backend + Estado
- [ ] FirebaseNotificationService.test.js
- [ ] account.api.test.js
- [ ] Redux slices completos
- [ ] Custom hooks

### Semana 4: Guardianes + Perfil
- [ ] Guardians.test.js
- [ ] Profile.test.js
- [ ] Recovery flow
- [ ] Navigation tests

### Semana 5: Integración (Opcional)
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Coverage analysis

## 🛠️ Convenciones

### Naming
- Archivos de test: `ComponentName.test.js`
- Mocks: `__mocks__/library-name.js`
- Utilities: `camelCase.js`

### Estructura de Tests
```javascript
describe('ComponentName', () => {
  describe('when user is authenticated', () => {
    test('should render correctly', () => {
      // Test implementation
    });
  });
  
  describe('when user is not authenticated', () => {
    test('should redirect to login', () => {
      // Test implementation
    });
  });
});
```

### Mocking Guidelines
- Usar mocks ligeros y específicos
- Evitar mocks innecesarios
- Documentar dependencias mockeadas
- Mantener mocks actualizados

## 📊 Métricas Objetivo

- **Cobertura global:** 70%+
- **Flujos críticos:** 85%+
- **Tiempo de ejecución:** < 3 minutos
- **Tests estables:** 95%+ pasan consistentemente

## 🔧 Configuración Técnica

### Jest Config (jest.config.js)
- Preset: `react-native`
- Environment: `jsdom`
- Coverage thresholds configurados
- Transform ignore patterns optimizados

### Dependencies
- `@testing-library/react-native`
- `redux-mock-store`
- `msw` (para mocking de APIs)
- `jest-environment-jsdom`

## 📚 Recursos

- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Redux Testing Guide](https://redux.js.org/usage/writing-tests)
- [React Navigation Testing](https://reactnavigation.org/docs/testing/)

## ⚠️ Notas Importantes

1. **Los mocks están configurados globalmente** en `jest.setup.js`
2. **Los tests placeholder** deben ser reemplazados según el plan semanal
3. **La estructura está preparada** para scaling futuro
4. **Coverage reports** se generan en `coverage/` 
5. **Tests de integración** requieren configuración adicional

## 🤝 Contribución

1. Seguir la estructura de directorios existente
2. Usar las utilidades en `test-utils.js`
3. Mantener cobertura por encima del umbral
4. Documentar tests complejos
5. Actualizar mocks cuando sea necesario
