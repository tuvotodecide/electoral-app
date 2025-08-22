import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import ActionSheet from 'react-native-actions-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CText from '../common/CText';
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import {useSelector} from 'react-redux';
import String from '../../i18n/String';
import {NotificationSortData} from '../../api/constant';
import CButton from '../common/CButton';

export default function NotificationSort(props) {
  const {SheetRef, onPressClose, onPressDone} = props;
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState(String.allStatus);

  const selectCategory = item => {
    setIsSelect(item.title);
  };

  const NotificationReadCategory = ({item, index}) => {
    return (
      <TouchableOpacity
        onPress={() => selectCategory(item)}
        style={[
          localStyle.notificationReadType,
          {
            borderColor:
              isSelect === item.title
                ? colors.primary
                : colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            backgroundColor:
              isSelect === item.title
                ? colors.dark
                  ? colors.inputBackground
                  : colors.grayScale60
                : colors.backgroundColor,
          },
        ]}>
        <CText
          type={'B14'}
          color={isSelect === item.title ? colors.primary : colors.textColor}
          style={styles.ml10}>
          {item.title}
        </CText>

        <Ionicons
          name={
            isSelect === item?.title ? 'radio-button-on' : 'radio-button-off'
          }
          size={moderateScale(22)}
          color={
            isSelect === item?.title
              ? colors.primary
              : colors.dark
              ? colors.grayScale700
              : colors.grayScale200
          }
        />
      </TouchableOpacity>
    );
  };

  return (
    <ActionSheet
      gestureEnabled={true}
      ref={SheetRef}
      indicatorStyle={[
        styles.mt10,
        {
          backgroundColor: colors.dark
            ? colors.grayScale700
            : colors.grayScale200,
        },
      ]}
      defaultOverlayOpacity={0.5}
      containerStyle={{backgroundColor: colors.backgroundColor}}>
      <View style={localStyle.headerContainer}>
        <CText type={'B16'}>{String.sort}</CText>
        <TouchableOpacity onPress={onPressClose}>
          <Ionicons
            name="close"
            size={moderateScale(24)}
            color={colors.grayScale500}
          />
        </TouchableOpacity>
      </View>
      <View
        style={[
          localStyle.lineView,
          {
            backgroundColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}
      />
      <View style={localStyle.readTypeContainer}>
        {NotificationSortData.map((item, index) => {
          return <NotificationReadCategory item={item} />;
        })}
        <CButton title={String.done} type={'B16'} onPress={onPressDone} />
      </View>
    </ActionSheet>
  );
}

const localStyle = StyleSheet.create({
  headerContainer: {
    ...styles.mt10,
    ...styles.rowSpaceBetween,
    ...styles.ph20,
  },
  lineView: {
    width: '100%',
    height: moderateScale(2),
    ...styles.mt20,
    ...styles.mb20,
  },
  notificationReadType: {
    height: moderateScale(64),
    ...styles.mv10,
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.center,
    ...styles.rowSpaceBetween,
    ...styles.ph10,
  },
  readTypeContainer: {
    ...styles.ph20,
  },
});
