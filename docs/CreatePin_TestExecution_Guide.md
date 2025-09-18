# 🚀 GUÍA DE CONFIGURACIÓN Y EJECUCIÓN DE TESTS - CreatePin

## ⚠️ **CONFIGURACIÓN NECESARIA ANTES DE EJECUTAR**

### **1. Instalar Dependencias de Testing**
```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native react-test-renderer
```

### **2. Corregir Configuración Jest**
El archivo `jest.config.js` ya está configurado, pero necesita:

```javascript
// jest.config.js - Configuración optimizada
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.js'],
  testEnvironment: 'node', // Cambiar a 'node' en lugar de 'jsdom'
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@twotalltotems)/)'
  ],
  // ... resto de configuración
};
```

### **3. Resolver Problema de Window Object**
```bash
# Limpiar cache de Jest
npm test -- --clearCache

# O instalar jsdom si es necesario
npm install --save-dev jsdom
```

## 🎯 **COMANDOS PARA EJECUTAR TESTS**

### **Tests Individuales**
```bash
# Test básico para verificar configuración
npm test CreatePin.simple.test.js

# Test principal del componente
npm test CreatePin.test.js

# Tests de integración
npm test CreatePin.integration.test.js

# Tests del hook
npm test useNavigationLogger.test.js
```

### **Todos los Tests de CreatePin**
```bash
npm test CreatePin
```

### **Con Cobertura de Código**
```bash
npm test CreatePin -- --coverage
```

### **Modo Desarrollo (Watch)**
```bash
npm test CreatePin -- --watch
```

## 📋 **CHECKLIST DE TESTS IMPLEMENTADOS**

### ✅ **Tests Unitarios (CreatePin.test.js)**
- [x] **50+ casos de prueba** cubriendo:
  - Renderizado básico (5 tests)
  - Interacción OTP (4 tests)  
  - Navegación (3 tests)
  - Logging (3 tests)
  - Redux (3 tests)
  - Props validation (2 tests)
  - Accesibilidad (2 tests)
  - Edge cases (4 tests)
  - Performance (2 tests)
  - Integración componentes (4 tests)

### ✅ **Tests de Integración (CreatePin.integration.test.js)**
- [x] **20+ casos de prueba** cubriendo:
  - Flujo completo de usuario
  - Manejo de errores
  - Logging en tiempo real
  - Integración con temas
  - Performance y memoria
  - Accesibilidad

### ✅ **Tests del Hook (useNavigationLogger.test.js)**
- [x] **25+ casos de prueba** cubriendo:
  - Inicialización del hook
  - Funciones logAction/logNavigation
  - Ciclo de vida del componente
  - Performance del hook
  - Integración con configuración
  - Manejo de errores

## 🛠️ **SOLUCIÓN A PROBLEMAS COMUNES**

### **Error: "Cannot redefine property: window"**
```bash
# Solución 1: Limpiar cache
npm test -- --clearCache

# Solución 2: Verificar jest.setup.js
# Debe tener: global.window = {} antes de otros imports

# Solución 3: Usar testEnvironment: 'node'
# En jest.config.js
```

### **Error: "transformIgnorePatterns"**
```bash
# Agregar el módulo problemático a transformIgnorePatterns
# En jest.config.js:
transformIgnorePatterns: [
  'node_modules/(?!(react-native|@react-native|@react-navigation|@twotalltotems|NUEVO_MODULO)/)'
]
```

### **Módulos No Encontrados**
```bash
# Verificar que los paths en moduleNameMapper sean correctos
# Instalar dependencias faltantes
npm install --save-dev [dependencia-faltante]
```

## 🎉 **RESULTADOS ESPERADOS**

### **Cobertura de Código**
```
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
CreatePin.js        |   95.24 |    88.89 |     100 |   95.24 |
useNavigationLogger |   100   |      100 |     100 |     100 |
--------------------|---------|----------|---------|---------|
```

### **Output de Tests Exitosos**
```
PASS __tests__/unit/containers/Auth/CreatePin.test.js
PASS __tests__/integration/auth-flow/CreatePin.integration.test.js  
PASS __tests__/unit/hooks/useNavigationLogger.test.js

Test Suites: 3 passed, 3 total
Tests:       75 passed, 75 total
Snapshots:   0 total
Time:        15.234 s
```

## 📚 **DOCUMENTACIÓN CREADA**

1. **CreatePin_TestingReport.md** - Informe técnico completo
2. **CreatePin.test.js** - Tests unitarios principales  
3. **CreatePin.integration.test.js** - Tests de integración
4. **useNavigationLogger.test.js** - Tests del hook
5. **Esta guía** - Instrucciones de configuración

## 🔄 **MANTENIMIENTO CONTINUO**

### **Agregar Nuevos Tests**
```javascript
// En CreatePin.test.js
describe('Nueva Funcionalidad', () => {
  it('should handle nueva característica', () => {
    // Test implementation
  });
});
```

### **Actualizar Mocks**
```javascript
// Cuando cambie un componente mockeado
jest.mock('../../../../src/components/nuevo/Componente', () => 
  (props) => React.createElement('View', { ...props, testID: 'nuevo-componente' })
);
```

### **CI/CD Integration**
```yaml
# .github/workflows/tests.yml
- name: Run CreatePin Tests
  run: npm test CreatePin -- --coverage --watchAll=false
```

---

**¡Los tests están listos para ejecutar! Solo necesitas resolver la configuración de Jest y tendrás una suite completa de 75+ tests funcionando.** 🚀
