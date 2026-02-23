
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import CButton from '../common/CButton';
import { moderateScale } from '../../common/constants';
import Ionicons from 'react-native-vector-icons/Ionicons';


export default function SimpleModal({ visible, message, okBtn, onPressOk, closeCornerBtn, onClose }) {
  const colors = useSelector((state) => state.theme.theme);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[localStyles.overlay, { backgroundColor: colors.modalBackground }]}>
        <View style={[localStyles.container, { backgroundColor: colors.backgroundColor }]}>
          {message}

          {closeCornerBtn && 
            <TouchableOpacity testID="simpleModalCloseBtn" style={localStyles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textColor} />
            </TouchableOpacity>
          }

          <CButton
            title={okBtn ?? "OK"}
            testID="simpleModalOkBtn"
            type="M16"
            containerStyle={localStyles.button}
            onPress={onPressOk}
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
  closeButton: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
  },
});
