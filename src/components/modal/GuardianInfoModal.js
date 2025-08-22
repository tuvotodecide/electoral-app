import React, {useEffect, useState} from 'react';
import {Modal, View, TouchableOpacity, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';

import CText from '../common/CText';
import CButton from '../common/CButton';
import Icono from '../common/Icono';
import {moderateScale} from '../../common/constants';
import CInput from '../common/CInput';

export default function GuardianInfoActionModal({
  visible,
  guardian,
  onClose,
  onDelete,
  onSave,
}) {
  const colors = useSelector(state => state.theme.theme);
  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [ci, setCi] = useState('');
  useEffect(() => {
    setNickname(guardian?.nickname ?? '');
    setAddress(guardian?.accountAddress ?? '');
    setCi(guardian?.governmentIdentifier ?? '');
  }, [guardian]);

  if (!guardian) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: colors.modalBackground}]}>
        <View
          style={[styles.container, {backgroundColor: colors.backgroundColor}]}>
          <CText type="B18" align="center" style={styles.title}>
            {guardian.publicFullName ?? '(sin nombre)'}
          </CText>
          
          <CInput
            label="Carnet"
            editable={false}
            _value={ci}
            disabled
            toGetTextFieldValue={setNickname}
            placeHolder=""
            inputContainerStyle={styles.inputContainer}
          />
          <CInput
            label="Apodo"
             editable={false}
            _value={nickname}
            toGetTextFieldValue={setNickname}
            placeHolder="Ingresa un apodo"
            inputContainerStyle={styles.inputContainer}
          />
    

         

          <TouchableOpacity onPress={onClose} style={styles.closeArea} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  title: {
    marginBottom: moderateScale(8),
  },
  message: {
    marginBottom: moderateScale(20),
  },
  button: {
    width: '80%',
    marginBottom: moderateScale(12),
  },
  iconButton: {
    padding: moderateScale(8),
    borderRadius: moderateScale(24),
  },
  closeArea: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    width: moderateScale(32),
    height: moderateScale(32),
  },
});
