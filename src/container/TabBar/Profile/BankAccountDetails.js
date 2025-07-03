import {
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// custom import
import {useSelector} from 'react-redux';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import images from '../../../assets/images';
import {
  deviceWidth,
  getHeight,
  getWidth,
  moderateScale,
} from '../../../common/constants';
import {styles} from '../../../themes';
import CText from '../../../components/common/CText';
import {
  validName,
  validateCardNumber,
  validateCvv,
} from '../../../utils/Validation';
import CInput from '../../../components/common/CInput';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import CButton from '../../../components/common/CButton';

export default function BankAccountDetails({route}) {
  let item = route?.params?.item;

  const colors = useSelector(state => state.theme.theme);
  const [name, setName] = useState(item.userName);
  const [nameInputStyle, setNameInputStyle] = useState(BlurredStyle);
  const [nameError, setNameError] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(item.expiryDate);
  const [isSelect, setIsSelect] = useState('');
  const [cvv, setCvv] = useState('');
  const [cvvError, setCvvError] = useState('');
  const [cvvInputStyle, setCvvInputStyle] = useState(BlurredStyle);
  const [cardNumber, setCardNumber] = useState('');
  const [cardNumberInputStyle, setCardNumberInputStyle] =
    useState(BlurredStyle);
  const [cardNumberError, setCardNumberError] = useState('');

  const BlurredStyle = {
    borderColor: colors.inputBackground,
  };
  const FocusedStyle = {
    borderColor: colors.primary,
  };

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);

  const onFocusName = () => {
    onFocusInput(setNameInputStyle);
  };
  const onBlurName = () => {
    onBlurInput(setNameInputStyle);
  };

  const onChangeName = text => {
    const {msg} = validName(text);
    setName(text);
    setNameError(msg);
    return false;
  };

  const showDatePicker = () => {
    setIsSelect(!isSelect);
    setDatePickerVisibility(true);
  };
  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = date => {
    var expiryDate = date.toISOString().split('T')[0];
    const month = expiryDate.split('-')[1];
    const year = expiryDate.split('-')[0];
    setSelectedDate(month + '/' + year);
    hideDatePicker();
  };
  const onChangeCvv = text => {
    const {msg} = validateCvv(text);
    setCvv(text);
    setCvvError(msg);
    return false;
  };

  const onFocusCvv = () => {
    onFocusInput(setCvvInputStyle);
  };
  const onBlurCvv = () => {
    onBlurInput(setCvvInputStyle);
  };
  const onFocusCardNumber = () => {
    onFocusInput(setCardNumberInputStyle);
  };
  const onBlurCardNumber = () => {
    onBlurInput(setCardNumberInputStyle);
  };

  const onChangeCardNumber = text => {
    const {msg} = validateCardNumber(text);
    setCardNumber(text);
    setCardNumberError(msg);
    return false;
  };

  const BankCardImage = () => {
    return (
      <ImageBackground
        source={images.DebitCardImage}
        style={localStyle.cardImage}>
        <View style={localStyle.imageInnerContainer}>
          <View style={localStyle.titleAndIcon}>
            <CText type={'R14'} color={colors.white} style={styles.mr5}>
              {item.title}
            </CText>
            {item.svgIcon}
          </View>
          <CText type={'B12'} style={localStyle.valueText} color={colors.white}>
            {item.value}
          </CText>
          <View style={localStyle.imageBtmContainer}>
            <View>
              <CText type={'R12'} color={colors.primary2}>
                {String.name}
              </CText>
              <CText type={'B12'} color={colors.white}>
                {item.userName}
              </CText>
            </View>
            <View>
              <CText type={'R12'} color={colors.primary2}>
                {String.expDate}
              </CText>
              <CText type={'B12'} color={colors.white}>
                {item.expiryDate}
              </CText>
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  };

  return (
    <CSafeAreaView>
      <CHeader title={String.bankAccount} />
      <BankCardImage />
      <KeyBoardAvoidWrapper containerStyle={localStyle.mainContainer}>
        <CInput
          placeholder={String.name}
          label={String.nameOnCard}
          _value={name}
          keyBoardType={'default'}
          _errorText={nameError}
          maxLength={30}
          autoCapitalize={'none'}
          toGetTextFieldValue={onChangeName}
          inputContainerStyle={nameInputStyle}
          _onFocus={onFocusName}
          onBlur={onBlurName}
        />
        <View style={localStyle.expiryAndCvvContainer}>
          <View>
            <CText
              type={'R16'}
              color={colors.grayScale400}
              style={localStyle.labelContainer}>
              {String.expiration}
            </CText>
            <TouchableOpacity
              style={[
                localStyle.datePikerStyle,
                {
                  backgroundColor: colors.inputBackground,
                },
              ]}
              onPress={showDatePicker}>
              <View style={localStyle.innerContainerStyle}>
                <CText
                  type={'M16'}
                  color={selectedDate ? colors.textColor : colors.grayScale400}
                  style={styles.ml5}>
                  {selectedDate ? selectedDate : String.expiryDateFormat}
                </CText>
                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="date"
                  onCancel={hideDatePicker}
                  onConfirm={handleConfirm}
                  date={new Date()}
                  minimumDate={new Date()}
                />
              </View>
            </TouchableOpacity>
          </View>
          <CInput
            label={String.cvv}
            _value={cvv}
            placeholder={String.cvv}
            keyboardType="number-pad"
            maxLength={3}
            autoCapitalize={'none'}
            _errorText={cvvError}
            secureTextEntry={true}
            labelStyle={{marginLeft: 0}}
            toGetTextFieldValue={onChangeCvv}
            inputContainerStyle={[localStyle.cvvInput, cvvInputStyle]}
            _onFocus={onFocusCvv}
            onBlur={onBlurCvv}
          />
        </View>
        <CInput
          placeholder={String.cardNumber}
          label={String.cardNumber}
          _value={cardNumber}
          keyboardType="number-pad"
          _errorText={cardNumberError}
          maxLength={16}
          autoCapitalize={'none'}
          toGetTextFieldValue={onChangeCardNumber}
          inputContainerStyle={cardNumberInputStyle}
          _onFocus={onFocusCardNumber}
          onBlur={onBlurCardNumber}
        />
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  cardImage: {
    width: deviceWidth - moderateScale(40),
    height: getHeight(195),
    ...styles.selfCenter,
  },
  imageInnerContainer: {
    ...styles.p20,
  },
  titleAndIcon: {
    ...styles.flexRow,
    ...styles.itemsCenter,
  },
  valueText: {
    ...styles.mv40,
  },
  imageBtmContainer: {
    ...styles.rowSpaceBetween,
  },
  mainContainer: {
    ...styles.ph20,
    ...styles.mt20,
  },
  expiryAndCvvContainer: {
    ...styles.rowCenter,
    ...styles.justifyBetween,
  },
  datePikerStyle: {
    width: getWidth(155),
    ...styles.selfCenter,
    borderRadius: moderateScale(12),
    height: moderateScale(52),
    ...styles.mt5,
  },
  innerContainerStyle: {
    ...styles.rowSpaceBetween,
    ...styles.flex,
    ...styles.ph10,
  },
  cvvInput: {
    width: getWidth(155),
  },
  labelContainer: {
    ...styles.mt10,
    ...styles.mb5,
  },
});
