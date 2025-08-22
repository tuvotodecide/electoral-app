import {StyleSheet, View} from 'react-native';
import React from 'react';
import ActionSheet from 'react-native-actions-sheet';

// custom import
import CButton from '../common/CButton';
import String from '../../i18n/String';
import {useSelector} from 'react-redux';
import {styles} from '../../themes';

export default function TakePictureModal(props) {
  const colors = useSelector(state => state.theme.theme);
  const {SheetRef} = props;

  const onPressTakePicture = () => {
    SheetRef?.current?.hide();
  };

  const onPressRetakePicture = () => {
    SheetRef?.current?.hide();
  };
  return (
    <ActionSheet
      gestureEnabled={true}
      ref={SheetRef}
      containerStyle={[
        localStyle.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <View>
        <CButton
          title={String.takePicture}
          type={'B16'}
          onPress={onPressTakePicture}
        />
        <CButton
          title={String.retakePicture}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          bgColor={colors.dark ? colors.inputBackground : colors.primary50}
          color={colors.primary}
          onPress={onPressRetakePicture}
        />
      </View>
    </ActionSheet>
  );
}

const localStyle = StyleSheet.create({
  actionSheetContainer: {
    ...styles.ph20,
  },
  btnStyle: {
    ...styles.mb30,
    ...styles.mt0,
  },
});
