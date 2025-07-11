import React from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';

import {styles} from '../../themes';

/**
 * Versión sin padding inferior y solo respetando el área superior.
 *
 * Props extra:
 *  • edges        → por defecto ['top']  (solo notch / barra de estado)
 *  • style        → estilos adicionales
 */
export default function CSafeAreaViewAuth({
  children,
  edges = ['top'],
  style,
  ...rest
}) {
  const colors = useSelector(state => state.theme.theme);
  const insets = useSafeAreaInsets(); // 👉 por si necesitas algo puntual

  return (
    <SafeAreaView
      edges={edges}
      {...rest}
      style={[localStyle(colors).root, style]}>
      {children}
    </SafeAreaView>
  );
}

const localStyle = colors =>
  StyleSheet.create({
    root: {
      ...styles.flex,
      backgroundColor: colors.backgroundColor,
      /* 🔥 nada de paddingBottom; el área inferior se ignora */
    },
  });
