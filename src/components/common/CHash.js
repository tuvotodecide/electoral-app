import React, {useState, useRef} from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Animated} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {useSelector} from 'react-redux';
import CText from './CText';
import {moderateScale} from '../../common/constants';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';
import Icono from './Icono';

export default function CHash({
  title,
  text,
  icon = null,
  containerStyle,
  textStyle,
  textColor,
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

  const handleCopy = () => {
    Clipboard.setString(text);
    showToast();
  };

  return (
    <>
      <TouchableOpacity
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
    zIndex: 9999,
    maxWidth: '90%',
  },
  toastText: {
    marginLeft: 8,
    fontSize: 14,
  },
});
