import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigationState } from '@react-navigation/native';

/**
 * Componente de overlay para mostrar la ruta actual en pantalla
 * Útil para desarrollo y debugging
 * Solo se muestra en modo __DEV__
 */
export default function NavigationDebugOverlay({ 
  position = 'top-right', 
  backgroundColor = 'rgba(0, 0, 0, 0.7)',
  textColor = '#fff',
  fontSize = 12 
}) {
  const routes = useNavigationState(state => state?.routes);
  const index = useNavigationState(state => state?.index);
  const currentRoute = routes?.[index];
  
  // Solo mostrar en desarrollo
  if (!__DEV__ || !currentRoute) {
    return null;
  }

  const positionStyles = {
    'top-left': { top: 50, left: 10 },
    'top-right': { top: 50, right: 10 },
    'bottom-left': { bottom: 50, left: 10 },
    'bottom-right': { bottom: 50, right: 10 },
  };

  return (
    <View style={[
      styles.overlay, 
      positionStyles[position],
      { backgroundColor }
    ]}>
      <Text style={[styles.text, { color: textColor, fontSize }]}>
        📱 {currentRoute.name}
      </Text>
      {currentRoute.params && Object.keys(currentRoute.params).length > 0 && (
        <Text style={[styles.params, { color: textColor, fontSize: fontSize - 1 }]}>
          {Object.keys(currentRoute.params).length} param(s)
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    zIndex: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  params: {
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 2,
  },
});
