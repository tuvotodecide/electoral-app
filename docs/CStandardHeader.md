# CStandardHeader - Componente Header Estandarizado

## Ubicación

`src/components/common/CStandardHeader.js`

## Descripción

Componente reutilizable que implementa el formato estándar de header usado en toda la aplicación.

## Props

| Prop              | Tipo      | Requerido | Default               | Descripción                                        |
| ----------------- | --------- | --------- | --------------------- | -------------------------------------------------- |
| `title`           | string    | ✅        | -                     | Título que se muestra en el header                 |
| `onPressBack`     | function  | ❌        | `navigation.goBack()` | Función personalizada para el botón de regreso     |
| `rightIcon`       | ReactNode | ❌        | `undefined`           | Componente/icono que se muestra en el lado derecho |
| `titleStyle`      | object    | ❌        | `{}`                  | Estilos personalizados para el título              |
| `containerStyle`  | object    | ❌        | `{}`                  | Estilos personalizados para el contenedor          |
| `backButtonStyle` | object    | ❌        | `{}`                  | Estilos personalizados para el botón de regreso    |
| `hideBackButton`  | boolean   | ❌        | `false`               | Oculta el botón de regreso                         |

## Uso Básico

```jsx
import CStandardHeader from '../../../components/common/CStandardHeader';

// Uso más simple
<CStandardHeader title="Mi Pantalla" />;
```

## Ejemplos de Uso

### 1. Header básico

```jsx
<CStandardHeader title="Buscar mesa" />
```

### 2. Header con acción personalizada de regreso

```jsx
<CStandardHeader
  title="Mi Pantalla"
  onPressBack={() => {
    // Lógica personalizada antes de regresar
    Alert.alert('¿Estás seguro?', 'Los cambios se perderán', [
      {text: 'Cancelar'},
      {text: 'Salir', onPress: () => navigation.goBack()},
    ]);
  }}
/>
```

### 3. Header con icono derecho

```jsx
<CStandardHeader
  title="Configuraciones"
  rightIcon={
    <TouchableOpacity onPress={handleSave}>
      <Ionicons name="checkmark" size={24} color={colors.primary} />
    </TouchableOpacity>
  }
/>
```

### 4. Header sin botón de regreso

```jsx
<CStandardHeader title="Pantalla Principal" hideBackButton={true} />
```

### 5. Header con estilos personalizados

```jsx
<CStandardHeader
  title="Mi Pantalla"
  titleStyle={{fontSize: 18, color: '#FF6B6B'}}
  containerStyle={{backgroundColor: '#F8F9FA', paddingVertical: 25}}
/>
```

## Migración desde headers manuales

### Antes:

```jsx
<View style={localStyle.header}>
  <TouchableOpacity
    onPress={() => navigation.goBack()}
    style={localStyle.backButton}>
    <Ionicons
      name="arrow-back"
      size={moderateScale(24)}
      color={colors.textColor}
    />
  </TouchableOpacity>
  <CText style={localStyle.headerTitle} color={colors.textColor}>
    Mi Título
  </CText>
  <View style={{width: moderateScale(24)}} />
</View>
```

### Después:

```jsx
<CStandardHeader title="Mi Título" />
```

## Beneficios

1. **Consistencia**: Garantiza que todos los headers se vean igual
2. **Mantenimiento**: Un solo lugar para actualizar el diseño de headers
3. **Código más limpio**: Menos líneas de código repetitivo
4. **Flexibilidad**: Props para personalizar cuando sea necesario
5. **Integración automática**: Usa Redux theme automáticamente

## Estilos por defecto

- **Padding horizontal**: 20px
- **Padding vertical**: 18px
- **Icono**: `arrow-back` con `moderateScale(24)`
- **Título**: Centrado, font-size 22, font-weight bold
- **Colores**: Integrado con Redux theme (`colors.textColor`)
