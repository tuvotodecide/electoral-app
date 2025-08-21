import React, {useState} from 'react';
import {Modal, View, TouchableOpacity, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';

import CText from '../common/CText';
import CButton from '../common/CButton';
import CInput from '../common/CInput';
import {moderateScale} from '../../common/constants';
import String from '../../i18n/String';
import Icono from '../common/Icono';

export default function GuardianOptionsModal({
  visible,
  onClose,
  onSaveFirst = () => {}, // fallback para evitar crashes
  onSaveSecond = () => {},
}) {
  const colors = useSelector(state => state.theme.theme);
  const [firstValue, setFirstValue] = useState('');
  const [secondValue, setSecondValue] = useState('');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View
        style={[
          localStyles.overlay,
          {backgroundColor: colors.modalBackground},
        ]}>
        <View
          style={[
            localStyles.container,
            {backgroundColor: colors.backgroundColor},
          ]}>
          <TouchableOpacity onPress={onClose} style={localStyles.closeButton}>
            <Icono
              name="close"
              size={moderateScale(24)}
              color={colors.grayScale500}
            />
          </TouchableOpacity>
          <CText type="B18" align="center" style={localStyles.title}>
            {String.configGuardian}
          </CText>

          <CInput
            label={String.configGuardianSubtitle1}
            keyboardType="numeric"
            _value={firstValue}
            toGetTextFieldValue={setFirstValue}
            placeholder="Ingresa un número"
            inputContainerStyle={localStyles.inputContainer}
          />
          <CButton
            title={String.save}
            type="B16"
            containerStyle={localStyles.button}
            onPress={() => onSaveFirst(firstValue)}
            disabled={firstValue.trim().length === 0}
          />

          {/* Segundo input numérico */}
          <CInput
            label={String.configGuardianSubtitle2}
            keyboardType="numeric"
            _value={secondValue}
            toGetTextFieldValue={setSecondValue}
            placeholder="Ingresa un número"
            inputContainerStyle={localStyles.inputContainer}
          />
          <CButton
            title={String.save}
            type="B16"
            containerStyle={[localStyles.button, localStyles.secondButton]}
            onPress={() => onSaveSecond(secondValue)}
            disabled={secondValue.trim().length === 0}
          />

          {/* Área para cerrar */}
          <TouchableOpacity onPress={onClose} style={localStyles.closeArea} />
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
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
  title: {},
  inputContainer: {
    width: '100%',
    marginBottom: moderateScale(5),
  },
  button: {
    width: '80%',
    marginBottom: moderateScale(10),
  },
  secondButton: {
    marginBottom: moderateScale(8),
  },
  closeArea: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    width: moderateScale(32),
    height: moderateScale(32),
  },
  closeButton: {
    position: 'absolute',
    top: moderateScale(12),
    right: moderateScale(12),
    zIndex: 10,
  },
});
