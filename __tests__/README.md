# Estructura de Tests - Aplicación Electoral

Este directorio contiene toda la infraestructura y tests unitarios para la aplicación electoral React Native.

##  Estructura de Directorios

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

## Cómo Usar

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

## Convenciones

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

## Configuración Técnica

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


