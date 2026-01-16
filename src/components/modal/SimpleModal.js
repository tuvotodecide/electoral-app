
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import CText from '../common/CText';
import CButton from '../common/CButton';
import { styles } from '../../themes';
import { moderateScale } from '../../common/constants';


export default function SimpleModal({ visible, message, closeBtn, onClose }) {
  const colors = useSelector((state) => state.theme.theme);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[localStyles.overlay, { backgroundColor: colors.modalBackground }]}>
        <View style={[localStyles.container, { backgroundColor: colors.backgroundColor }]}>
          {message}

          <CButton
            title={closeBtn ?? "Cerrar"}
            testID="simpleModalCloseBtn"
            type="M16"
            containerStyle={localStyles.button}
            onPress={onClose}
          />
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
  button: {
    width: '60%',
    marginTop: moderateScale(10),
  },
});
