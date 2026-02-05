import * as Clipboard from 'expo-clipboard';
import { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { moderateScale } from '../../common/constants';
import { getSecondaryTextColor } from '../../utils/ThemeUtils';
import CText from './CText';
import Icono from './Icono';

export default function CHash({
  title,
  text,
  icon = null,
  containerStyle,
  textStyle,
  textColor,
  testID,
}) {
  const colors = useSelector(state => state.theme.theme);
  const [copied, setCopied] = useState(false);

  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = () => {
    setCopied(true);
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setCopied(false);
        });
      }, 2000);
    });
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(title);
    showToast();
  };

  return (
    <>
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.7}
        onPress={handleCopy}
        style={[localStyle.wrapper, containerStyle]}>
        <View style={localStyle.centerContent}>
          <CText
            type="B18"
            color={textColor ?? getSecondaryTextColor(colors)}
            style={[localStyle.text, textStyle]}>
            {text}
          </CText>
          <Icono
            name="content-copy"
            size={18}
            color={textColor ?? getSecondaryTextColor(colors)}
            style={localStyle.copyIcon}
          />
        </View>
      </TouchableOpacity>

      {copied && (
        <Animated.View
          style={[
            localStyle.toast,
            {
              backgroundColor: colors.primary,
              opacity: toastOpacity,
            },
          ]}>
          <Icono name="check" size={16} color={colors.white} />
          <Text style={[localStyle.toastText, {color: colors.white}]}>
            Hash copiado
          </Text>
        </Animated.View>
      )}
    </>
  );
}

const localStyle = StyleSheet.create({
  wrapper: {
    marginVertical: moderateScale(2),
    alignItems: 'center',
  },
  centerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    textAlign: 'center',
  },
  copyIcon: {
    marginLeft: 4,
  },
  toast: {
    marginTop: 8, // Separación con el botón
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5.0,
    zIndex: 9999,
    maxWidth: '90%',
  },
  toastText: {
    marginLeft: 8,
    fontSize: 14,
  },
});
