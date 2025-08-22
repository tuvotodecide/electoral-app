import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import Icons from 'react-native-vector-icons/Ionicons';
import ActionSheet from 'react-native-actions-sheet';

// custom import
import {styles} from '../../themes';
import CText from '../common/CText';
import String from '../../i18n/String';
import {moderateScale} from '../../common/constants';
import {FilterStatusData, FilterTypeData} from '../../api/constant';
import CButton from '../common/CButton';
import CInput from '../common/CInput';
import KeyBoardAvoidWrapper from '../common/KeyBoardAvoidWrapper';
import {Erethrun_White} from '../../assets/svg';

export default function CollectionFilter(props) {
  const {SheetRef, onPressClose, onPressApply} = props;
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [selectPriceChip, setSelectPriceChip] = useState('');
  const [minValueInputStyle, setMinValueInputStyle] = useState(BlurredStyle);
  const [maxValueInputStyle, setMaxValueInputStyle] = useState(BlurredStyle);
  const [selectPriceChipInputStyle, setSelectPriceChipInputStyle] =
    useState(BlurredStyle);

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);

  const BlurredStyle = {
    borderColor: colors.inputBackground,
  };
  const FocusedStyle = {
    borderColor: colors.primary,
  };
  const onFocusPriceChip = () => {
    onFocusInput(setSelectPriceChipInputStyle);
  };
  const onBlurPriceChip = () => {
    onBlurInput(setSelectPriceChipInputStyle);
  };
  const onFocusMinValue = () => {
    onFocusInput(setMinValueInputStyle);
  };
  const onBlurMinValue = () => {
    onBlurInput(setMinValueInputStyle);
  };
  const onFocusMaxValue = () => {
    onFocusInput(setMaxValueInputStyle);
  };
  const onBlurMaxValue = () => {
    onBlurInput(setMaxValueInputStyle);
  };
  const onPressCategory = item => {
    setIsSelect(item);
  };

  const onChangeMinValue = text => {
    setMinValue(text);
  };
  const onChangeMaxValue = text => {
    setMaxValue(text);
  };
  const onChangeSelectPrice = text => {
    setSelectPriceChip(text);
  };

  const LeftIcon = () => {
    return (
      <TouchableOpacity
        style={[localStyle.iconStyle, {backgroundColor: colors.primary}]}>
        <Erethrun_White />
      </TouchableOpacity>
    );
  };
  const RightIcon = () => {
    return (
      <TouchableOpacity>
        <Icons
          name={'chevron-down-outline'}
          size={moderateScale(22)}
          color={colors.grayScale500}
        />
      </TouchableOpacity>
    );
  };
  const RenderData = ({item, index}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressCategory(item)}
        style={[
          localStyle.itemContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor:
              isSelect === item ? colors.primary : colors.inputBackground,
          },
        ]}>
        <CText
          type={'M14'}
          align={'center'}
          color={isSelect === item ? colors.primary : colors.grayScale400}
          style={styles.mh15}>
          {item.name}
        </CText>
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
      containerStyle={[
        localStyle.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <KeyBoardAvoidWrapper containerStyle={[styles.flex0, styles.mb30]}>
        <View style={localStyle.headerFilter}>
          <CText type={'B16'}>{String.filter}</CText>
          <TouchableOpacity onPress={onPressClose}>
            <Icons
              name={'close'}
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
        <CText type={'B16'} style={localStyle.headerText} numberOfLines={1}>
          {String.status}
        </CText>
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          {FilterStatusData.map((item, index) => {
            return <RenderData item={item} />;
          })}
        </View>
        <CText type={'B16'} style={localStyle.headerText} numberOfLines={1}>
          {String.type}
        </CText>
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          {FilterTypeData.map((item, index) => {
            return <RenderData item={item} />;
          })}
        </View>
        <CText type={'B14'}>{String.priceRange}</CText>
        <CInput
          placeholder={String.eth}
          _value={selectPriceChip}
          keyBoardType={'default'}
          maxLength={10}
          autoCapitalize={'none'}
          toGetTextFieldValue={onChangeSelectPrice}
          inputContainerStyle={selectPriceChipInputStyle}
          _onFocus={onFocusPriceChip}
          onBlur={onBlurPriceChip}
          placeholderTextColor={colors.textColor}
          insideLeftIcon={() => <LeftIcon />}
          rightAccessory={() => <RightIcon />}
        />

        <View style={styles.rowCenter}>
          <CInput
            placeholder={String.min}
            _value={minValue}
            keyBoardType={'default'}
            maxLength={10}
            autoCapitalize={'none'}
            toGetTextFieldValue={onChangeMinValue}
            inputContainerStyle={[localStyle.inputBox, minValueInputStyle]}
            _onFocus={onFocusMinValue}
            onBlur={onBlurMinValue}
          />
          <CText color={colors.grayScale500} style={styles.m10}>
ç            {String.to}
          </CText>
          <CInput
            placeholder={String.max}
            _value={maxValue}
            keyBoardType={'default'}
            maxLength={10}
            autoCapitalize={'none'}
            toGetTextFieldValue={onChangeMaxValue}
            inputContainerStyle={[localStyle.inputBox, maxValueInputStyle]}
            _onFocus={onFocusMaxValue}
            onBlur={onBlurMaxValue}
          />
        </View>
        <CButton title={String.apply} type={'B16'} onPress={onPressApply} />
      </KeyBoardAvoidWrapper>
    </ActionSheet>
  );
}

const localStyle = StyleSheet.create({
  actionSheetContainer: {
    ...styles.ph20,
  },
  headerFilter: {
    ...styles.rowSpaceBetween,
  },
  lineView: {
    width: '100%',
    height: moderateScale(2),
    ...styles.mv15,
  },
  itemContainer: {
    ...styles.center,
    borderRadius: moderateScale(10),
    height: moderateScale(40),
    ...styles.mr10,
    ...styles.mv10,
    borderWidth: moderateScale(1),
  },
  headerText: {
    ...styles.mt30,
  },
  inputBox: {
    width: moderateScale(142),
    ...styles.selfCenter,
  },
  iconStyle: {
    height: moderateScale(20),
    width: moderateScale(20),
    borderRadius: moderateScale(10),
    ...styles.center,
  },
});
