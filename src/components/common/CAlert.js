import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import CText from './CText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const iconMap = {
  success: 'check-circle-outline',
  error: 'close-circle-outline',
  warning: 'alert-circle-outline',
  info: 'information-outline',
};

const baseColors = {
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
};

const lightBackground = {
  success: '#e6f9ed',
  error: '#fdecea',
  warning: '#fff8e1',
  info: '#e7f3fe',
};

const darkBackground = {
  success: 'rgba(76, 175, 80, 0.1)',
  error: 'rgba(244, 67, 54, 0.1)',
  warning: 'rgba(255, 152, 0, 0.1)',
  info: 'rgba(33, 150, 243, 0.1)',
};

// Colores de texto en modo claro (más oscuros para contraste)
const darkTextColor = {
  success: '#1b5e20',
  error: '#b71c1c',
  warning: '#e65100',
  info: '#1565c0',
};

export default function CAlert({testID, status = 'info', message = ''}) {
  const theme = useSelector(state => state.theme.theme);
  const isDark = theme.dark;

  const mainColor = baseColors[status] || baseColors.info;
  const bgColor = isDark
    ? darkBackground[status] || darkBackground.info
    : lightBackground[status] || lightBackground.info;

  const textColor = isDark
    ? mainColor
    : darkTextColor[status] || darkTextColor.info;

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderColor: mainColor,
        },
      ]}>
      <Icon
        testID={testID ? `${testID}Icon` : undefined}
        name={iconMap[status]}
        size={24}
        color={mainColor}
        style={styles.icon}
      />
      <CText testID={testID ? `${testID}Text` : undefined} type="R14" color={textColor} style={styles.text}>
        {message}
      </CText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  icon: {
    alignSelf: 'flex-start',
    marginRight: 10,
  },
  text: {
    flex: 1,
  },
});
