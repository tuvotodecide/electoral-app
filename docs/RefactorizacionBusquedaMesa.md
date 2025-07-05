# Refactorización de Pantallas de Búsqueda de Mesa

## Descripción

Se ha refactorizado las pantallas `BuscarMesaConteo` y `AtestiguarActa` para eliminar el código duplicado y seguir las mejores prácticas de desarrollo React Native.

## Arquitectura

### Componentes Reutilizables

- **`SearchMesaComponents.js`**: Componentes UI modulares (Header, SearchInput, LocationInfoBar, MesaCard, etc.)
- **`BaseSearchMesaScreen.js`**: Pantalla base que compone todos los componentes
- **`useSearchMesaLogic.js`**: Hook personalizado para manejar la lógica común
- **`searchMesaStyles.js`**: Estilos compartidos
- **`mockMesas.js`**: Datos de ejemplo compartidos

### Estructura de Archivos

```
src/
├── components/common/
│   ├── SearchMesaComponents.js
│   └── BaseSearchMesaScreen.js
├── hooks/
│   └── useSearchMesaLogic.js
├── styles/
│   └── searchMesaStyles.js
├── data/
│   └── mockMesas.js
└── container/Voto/
    ├── AnunciarConteo/
    │   └── BuscarMesaConteo.js (refactorizado)
    └── AtestiguarActa/
        └── AtestiguarActa.js (refactorizado)
```

## Beneficios

### ✅ Eliminación de Código Duplicado

- Antes: ~600 líneas duplicadas entre ambas pantallas
- Después: ~60 líneas por pantalla, componentes compartidos

### ✅ Mantenibilidad

- Cambios en UI se realizan una sola vez en los componentes base
- Fácil agregar nuevas pantallas similares
- Separación clara de responsabilidades

### ✅ Reutilización

- Componentes pueden usarse en otras pantallas
- Hook puede extenderse para nueva funcionalidad
- Estilos consistentes en toda la app

### ✅ Buenas Prácticas

- **Single Responsibility Principle**: Cada componente tiene una responsabilidad específica
- **DRY (Don't Repeat Yourself)**: Sin código duplicado
- **Composition over Inheritance**: Composición de componentes pequeños
- **Custom Hooks**: Lógica reutilizable separada de UI
- **Consistent Styling**: Estilos centralizados

## Diferencias entre Pantallas

### BuscarMesaConteo

```javascript
showLocationFirst={true} // Location bar ANTES del search input
searchPlaceholder="Código de mesa"
navigationTarget={StackNav.DetalleMesaConteo}
```

### AtestiguarActa

```javascript
showLocationFirst={false} // Search input ANTES de location bar
searchPlaceholder="Buscar mesa"
navigationTarget={StackNav.CualEsCorrectaScreen}
// Agrega photoUri a mesa data
```

## Extensibilidad

Para crear una nueva pantalla similar:

```javascript
import BaseSearchMesaScreen from '../../../components/common/BaseSearchMesaScreen';
import {useSearchMesaLogic} from '../../../hooks/useSearchMesaLogic';
import {createSearchMesaStyles} from '../../../styles/searchMesaStyles';

const NuevaPantalla = () => {
  const logic = useSearchMesaLogic('StackNav.DestinationScreen');
  const styles = createSearchMesaStyles();

  return (
    <BaseSearchMesaScreen
      {...logic}
      searchPlaceholder="Placeholder personalizado"
      showLocationFirst={true}
      styles={styles}
    />
  );
};
```

## Próximos Pasos

- Implementar funcionalidad de búsqueda real
- Agregar filtros avanzados
- Implementar paginación para listas grandes
- Agregar tests unitarios para componentes
