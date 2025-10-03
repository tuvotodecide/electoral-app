import React from 'react';
import {Modal, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSelector} from 'react-redux';

import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import CText from '../common/CText';
import CButton from '../common/CButton';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function InfoModal({
  visible,
  title,
  message,
  buttonText = 'OK',
  closeCornerBtn = false,
  onClose,
  onCloseCorner,
}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[base.overlay, {backgroundColor: colors.modalBackground}]}>
        <View
          style={[base.container, {backgroundColor: colors.backgroundColor}]}>
          {title && (
            <CText type="B18" align="center" style={styles.mb20}>
              {title}
            </CText>
          )}
          <ScrollView
            style={base.scroll}
            contentContainerStyle={{alignItems: 'center'}}
            showsVerticalScrollIndicator={true}>
            <CText type="M16" align="center">
              {message}
            </CText>
          </ScrollView>
          {closeCornerBtn && 
            <TouchableOpacity style={base.closeButton} onPress={onCloseCorner}>
              <Ionicons name="close" size={24} color={colors.textColor} />
            </TouchableOpacity>
          }
          <CButton
            title={buttonText}
            type="M16"
            containerStyle={base.button}
            onPress={onClose}
          />
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
    position: 'relative',
  },
  scroll: {
    maxHeight: moderateScale(200),
    marginBottom: moderateScale(10),
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
