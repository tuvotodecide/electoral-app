import React from 'react';
import {ActivityIndicator, Modal, ScrollView, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';

import {moderateScale} from '../../common/constants';
import CText from '../common/CText';
import CButton from '../common/CButton';
import Icono from '../common/Icono';

export default function LoadingModal({
  visible,
  message,
  isLoading,
  success,
  buttonText = 'Continue',
  onClose,
  secondBtn,
  onSecondPress,
}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[base.overlay, {backgroundColor: colors.modalBackground}]}>
        <View
          style={[base.container, {backgroundColor: colors.backgroundColor}]}>
          <ScrollView
            style={base.scroll}
            contentContainerStyle={{alignItems: 'center'}}
            showsVerticalScrollIndicator={true}>
            {isLoading ?
              <ActivityIndicator size='large' style={base.icon} />
              : success ?
                <Icono name='check-circle' style={base.icon} color={colors.success} size={moderateScale(40)} />
              : <Icono name='account-alert' style={base.icon} color={colors.rejectedColor} size={moderateScale(40)} />
            }
            <CText type="M16" align="center">
              {message}
            </CText>
          </ScrollView>
          <CButton
            title={buttonText}
            disabled={isLoading}
            type="M16"
            containerStyle={base.button}
            onPress={onClose}
          />
          {secondBtn &&
            <CButton
              title={secondBtn}
              type="M16"
              containerStyle={[base.button, {backgroundColor: colors.grayScale200}]}
              textStyle={{color: colors.textColor}}
              onPress={onSecondPress}
            />
          }
        </View>
      </View>
    </Modal>
  );
}

const base = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    alignItems: 'center',
  },
  scroll: {
    maxHeight: moderateScale(200),
    marginBottom: moderateScale(10),
  },
  icon: {
    marginBottom: moderateScale(20),
  },
  button: {
    width: '60%',
    marginTop: moderateScale(10),
  },
});
