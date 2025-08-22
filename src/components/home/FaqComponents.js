import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import {useSelector} from 'react-redux';
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import CText from '../common/CText';

const FaqComponent = ({title, description = ''}) => {
  const colors = useSelector(state => state.theme.theme);
  const [isDescShow, setIsDescShow] = useState(false);

  const onPressShow = () => setIsDescShow(!isDescShow);

  return (
    <TouchableOpacity
      style={[localStyle.helperContainer]}
      onPress={onPressShow}>
      <View style={localStyle.helperInnerContainer}>
        {isDescShow ? (
          <Ionicons
            name={'chevron-down-outline'}
            size={moderateScale(16)}
            color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            style={styles.mr10}
          />
        ) : (
          <Ionicons
            name={'chevron-forward-outline'}
            size={moderateScale(16)}
            color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            style={styles.mr10}
          />
        )}
        <CText
          type={'M14'}
          color={colors.primary}
          style={(styles.ph20, styles.flex)}>
          {title}
        </CText>
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
      {!!isDescShow && (
        <View style={localStyle.textContainer}>
          <CText
            type={'R12'}
            color={colors.grayScale500}
            style={[localStyle.helperDescription]}>
            {description}
          </CText>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default FaqComponent;

const localStyle = StyleSheet.create({
  helperContainer: {
    ...styles.pv10,
  },
  helperInnerContainer: {
    ...styles.rowCenter,
  },
  helperDescription: {
    ...styles.mt15,
  },
  textContainer: {
    ...styles.mt10,
  },
  lineView: {
    width: '100%',
    height: moderateScale(1),
    ...styles.mt15,
  },
});
