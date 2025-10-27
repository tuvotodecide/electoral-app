import React, {useEffect, useState} from 'react';
import {Modal, View, TouchableOpacity, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';

import CText from '../common/CText';
import CButton from '../common/CButton';
import {moderateScale} from '../../common/constants';
import CInput from '../common/CInput';
import { CCopyIcon } from '../common/CCopyIcon';

export default function GuardianActionModal({
  visible,
  guardian,
  onClose,
  onDelete,
  onSave,
}) {
  const colors = useSelector(state => state.theme.theme);
  const [nickname, setNickname] = useState('');
  useEffect(() => {
    setNickname(guardian?.nickname ?? '');
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
          <CInput
            label="Dirección DID"
            editable={false}
            _value={guardian?.guardianDid}
            toGetTextFieldValue={setNickname}
            inputContainerStyle={styles.inputContainer}
            rightAccessory={() => CCopyIcon({copyValue: guardian?.guardianDid})}
          />
          <CInput
            label="Apodo"
            _value={nickname}
            toGetTextFieldValue={setNickname}
            placeHolder="Ingresa un apodo"
            inputContainerStyle={styles.inputContainer}
          />
          <CButton
            title="Guardar cambios"
            type="B16"
            containerStyle={styles.button}
            onPress={() => onSave(nickname.trim())}
            disabled={nickname.trim().length === 0}
          />

          {guardian.status === 'ACCEPTED' && (
            <CButton
              title="Eliminar guardián"
              type="B16"
              containerStyle={[styles.button, styles.deleteButton]}
              onPress={onDelete}
            />
          )}

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
