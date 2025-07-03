import {Modal, StyleSheet, View} from 'react-native';
import React from 'react';

// custom import
import {useSelector} from 'react-redux';
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import {DownloadIcon} from '../../assets/svg';
import CText from '../common/CText';
import String from '../../i18n/String';
import CButton from '../common/CButton';

export default function DownloadPortfolioPreview(props) {
  const colors = useSelector(state => state.theme.theme);
  let {visible, onPressCancel, onPressDownload} = props;
  return (
    <Modal animationType="slide" visible={visible} transparent={true}>
      <View
        style={[
          localStyle.modalMainContainer,
          {
            backgroundColor: colors.transparent,
          },
        ]}>
        <View
          style={[
            localStyle.modalContainer,
            {
              backgroundColor: colors.backgroundColor,
            },
          ]}>
          <View
            style={[
              localStyle.iconBg,
              {
                backgroundColor: colors.inputBackground,
              },
            ]}>
            <DownloadIcon />
          </View>
          <CText type={'B18'}>{String.downloadReports}</CText>
          <CText
            type={'R14'}
            color={colors.grayScale500}
            style={localStyle.reportText}>
            {String.downloadReportText}
          </CText>
          <View style={localStyle.btnContainer}>
            <CButton
              title={String.cancel}
              type={'B16'}
              bgColor={colors.inputBackground}
              color={colors.primary}
              containerStyle={localStyle.btn}
              onPress={onPressCancel}
            />
            <CButton
              title={String.download}
              type={'B16'}
              containerStyle={localStyle.btn}
              onPress={onPressDownload}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const localStyle = StyleSheet.create({
  modalMainContainer: {
    ...styles.flex,
    ...styles.justifyEnd,
  },
  modalContainer: {
    borderRadius: moderateScale(16),
    width: '90%',
    ...styles.pv20,
    ...styles.ph10,
    ...styles.selfCenter,
    ...styles.center,
    ...styles.mb40,
  },
  iconBg: {
    height: moderateScale(56),
    width: moderateScale(56),
    borderRadius: moderateScale(28),
    ...styles.center,
    ...styles.mv20,
  },
  btnContainer: {
    ...styles.flexRow,
  },
  btn: {
    width: '45%',
    ...styles.mr10,
  },
  reportText: {
    ...styles.mt10,
    width: '70%',
  },
});
