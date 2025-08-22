// Colores de la aplicación
const LightColor = {
  light: 'light',
  dark: false,
  backgroundColor: '#E9EFF1', // Modificado: Fondo gris-azulado de la imagen
  textColor: '#2F2F2F', // Modificado: Texto oscuro principal de la imagen
  stepBackgroundColor: '#FFFFFF', // Modificado: Fondo de tarjeta blanco de la imagen
  grayScale400: '#868686', // Modificado: Texto secundario gris de la imagen
  inputBg: '#FFFFFF', // Modificado: Fondo de input blanco para coincidir con las tarjetas
  grayScale200: '#E0E0E0', // Modificado: Borde gris claro
  iconColor: '#32B974', // Modificado: Verde principal de los iconos en la imagen
  bColor: '#E0E0E0', // Modificado: Color de borde principal
  inputBackground: '#FFFFFF', // Modificado: Fondo de input blanco
  grayScale600: '#555555', // Modificado: Un gris más oscuro para consistencia
  bgColor: '#E9EFF1', // Modificado: Coincide con el fondo general
  transparent: 'rgba(233, 239, 241, 0.8)', // Modificado: Transparencia basada en el nuevo fondo
};

const DarkColor = {
  dark: 'dark',
  light: false,
  backgroundColor: '#1A202C', // Mantenido: Fondo oscuro
  stepBackgroundColor: '#2D3748', // Mantenido: Fondo de tarjeta oscuro
  textColor: '#F5F8FA', // Mantenido: Texto claro para modo oscuro
  inputBg: '#2D3748', // Mantenido: Fondo de input oscuro
  iconColor: '#32B974', // Modificado: Los iconos mantienen el verde para acento
  grayScale800: '#4A5568', // Mantenido
  bColor: '#4A5568', // Modificado: Color de borde para modo oscuro
  inputBackground: '#2D3748', // Mantenido
  grayScale50: '#A0AEC0', // Mantenido
  bgColor: '#1A202C', // Modificado: Coincide con el fondo general oscuro
  transparent: 'rgba(26, 32, 44, 0.8)', // Mantenido
};

export const commonColor = {
  alertColor: '#E82C81', // Mantenido
  white: '#FFFFFF', // Mantenido
  primary: '#459151', // Verde principal y de marca. Es un tono balanceado, ideal para logos y elementos estáticos.
  primary2: '#D4E9D8', // Un verde muy pálido, casi un tinte. Perfecto para fondos de alertas de éxito o para resaltar filas en tablas.
  gradient1: '#5DC774', // El inicio del gradiente del botón. Un tono más claro y brillante que da un efecto sutil de luz.
  gradient2: '#3DAA54', // El fondo principal y final del gradiente del botón. Es el verde más vibrante y llamativo, ideal para la llamada a la acción.
  primaryTransparent: 'rgba(50, 185, 116, 0.24)', // Modificado: Transparencia del nuevo color primario
  green: '#32B974', // Modificado: Verde principal
  greenDarker: '#238C58', // Modificado: Un verde más oscuro para contraste
  textColor1: '#868686', // Modificado: Texto secundario/gris
  inputBg: '#FFFFFF', // Modificado: Fondo de input blanco
  placeHolderColor: '#B0B0B0', // Modificado: Gris para placeholders
  borderColor: '#E0E0E0', // Modificado: Borde gris claro
  grayScale60: '#F8F9FA', // Modificado: Un gris muy claro
  primary50: '#EAF8F1', // Modificado: Un tinte muy claro del nuevo verde primario
  grayScale700: '#404040', // Mantenido
  iconBackgroundColor: '#FFFFFF', // Modificado: Fondo de icono blanco
  grayScale200: '#E0E0E0', // Modificado: Borde gris claro
  modalBackground: 'rgba(0,0,0,0.6)', // Modificado: Superposición de modal más oscura para contraste
  grayScale100: '#F1F5F9', // Modificado: Otro gris claro
  grayScale500: '#6B7280', // Modificado: Gris medio
  grayScale400: '#868686', // Modificado: Texto secundario gris
  gradientBackground: 'rgba(255,255,255,0.2)', // Mantenido
  blue: '#0153FF', // Mantenido
  black: '#0F172A', // Mantenido
  grayScale600: '#555555', // Modificado: Un gris más oscuro
  primary4: '#D83031', // Modificado: Rojo del logo "Mi Voto"
  green1: '#EAF8F1', // Modificado: Verde muy claro (tinte del primario)
  activeColor: '#32B974', // Modificado: Verde para estados activos
  pendingColor: '#ee9322', // Mantenido
  rejectedColor: '#c92929', // Mantenido
  yellowStripe: '#FBC401', // Modificado: Amarillo del logo "Mi Voto"

  // Colores adicionales para las nuevas pantallas
  success: '#32B974', // Verde de éxito
  warning: '#FBC401', // Amarillo de advertencia
  background: '#F8F9FA', // Fondo general claro
  text: {
    primary: '#2F2F2F',
    secondary: '#868686',
  },
  gray: {
    light: '#E0E0E0',
    ultraLight: '#F8F9FA',
  },
};

export const colors = {
  light: {
    ...LightColor,
    ...commonColor,
  },
  dark: {
    ...DarkColor,
    ...commonColor,
  },
};

export const applyAlpha = (hex, alpha = 1) => {
  let c = hex.replace('#', '');

  if (c.length === 3) {
    c = c
      .split('')
      .map(char => char + char)
      .join('');
  }

  if (c.length !== 6) {
    return hex;
  }

  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
