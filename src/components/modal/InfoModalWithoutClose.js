import React from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';

import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import CText from '../common/CText';
import CButton from '../common/CButton';

export default function InfoModalWithoutClose({
  visible,
  title,
  message,
  buttonText = 'OK',
  onClose,
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
          <CText type="M16" align="center">
            {message}
          </CText>
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
  button: {
    width: '60%',
    marginTop: moderateScale(10),
  },
});
