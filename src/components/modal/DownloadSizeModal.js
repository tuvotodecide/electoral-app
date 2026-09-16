import {Modal, StyleSheet, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// custom import
import {moderateScale} from '../../common/constants';
import CText from '../common/CText';
import String from '../../i18n/String';
import CButton from '../common/CButton';
import {styles} from '../../themes';

export default function DownloadSizeModal({visible, sizeMB, onPressOk, onPressExit}) {
  const colors = useSelector(state => state.theme.theme);

  const message =
    typeof sizeMB === 'number' && sizeMB > 0
      ? String.downloadPromptMessage.replace('{size}', sizeMB.toFixed(1))
      : String.downloadPromptMessageUnknownSize;

  return (
    <Modal testID="downloadSizeModal" visible={visible} animationType="slide" transparent={true}>
      <View
        testID="downloadSizeModalOverlay"
        style={[
          localStyle.mainViewStyle,
          {backgroundColor: colors.modalBackground},
        ]}>
        <View
          testID="downloadSizeModalContainer"
          style={[
            localStyle.modalContainer,
            {backgroundColor: colors.backgroundColor},
          ]}>
          <CText testID="downloadSizeModalTitle" type={'B18'} align={'center'}>
            {String.downloadPromptTitle}
          </CText>
          <CText
            testID="downloadSizeModalMessage"
            type={'R14'}
            align={'center'}
            style={localStyle.messageStyle}>
            {message}
          </CText>

          <CButton
            testID="downloadSizeModalOkButton"
            title={String.accept}
            type={'M16'}
            containerStyle={localStyle.btnStyle}
            onPress={onPressOk}
            sinMargen
          />
        </View>
      </View>
    </Modal>
  );
}

const localStyle = StyleSheet.create({
  mainViewStyle: {
    ...styles.flex,
    ...styles.center,
  },
  modalContainer: {
    width: '80%',
    borderRadius: moderateScale(16),
    ...styles.ph20,
    ...styles.pv30,
  },
  messageStyle: {
    ...styles.mt10,
    ...styles.mb20,
  },
  btnStyle: {
    ...styles.selfCenter,
    width: '70%',
    ...styles.mt10,
  },
});
