import React from 'react';
import {Modal, ScrollView, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';

import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import CText from '../common/CText';
import CButton from '../common/CButton';

export default function InfoModal({
  visible,
  title,
  message,
  buttonText = 'OK',
  onClose,
  testID = 'infoModal',
}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <Modal testID={testID} visible={visible} animationType="fade" transparent>
      <View testID={`${testID}Overlay`} style={[base.overlay, {backgroundColor: colors.modalBackground}]}>
        <View
          testID={`${testID}Container`}
          style={[base.container, {backgroundColor: colors.backgroundColor}]}>
          {title && (
            <CText testID={`${testID}Title`} type="B18" align="center" style={styles.mb20}>
              {title}
            </CText>
          )}
          <ScrollView
            testID={`${testID}ScrollView`}
            style={base.scroll}
            contentContainerStyle={{alignItems: 'center'}}
            showsVerticalScrollIndicator={true}>
            <CText testID={`${testID}Message`} type="M16" align="center">
              {message}
            </CText>
          </ScrollView>
          <CButton
            testID={`${testID}Button`}
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
  },
  scroll: {
    maxHeight: moderateScale(200),
    marginBottom: moderateScale(10),
  },
  button: {
    width: '60%',
    marginTop: moderateScale(10),
  },
});
