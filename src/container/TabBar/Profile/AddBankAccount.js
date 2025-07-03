import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {useSelector} from 'react-redux';
import {
  validName,
  validateCardNumber,
  validateCvv,
} from '../../../utils/Validation';
import CInput from '../../../components/common/CInput';
import {styles} from '../../../themes';
import {getWidth, moderateScale} from '../../../common/constants';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import {StackNav} from '../../../navigation/NavigationKey';

export default function AddBankAccount({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  const [name, setName] = useState('');
  const [nameInputStyle, setNameInputStyle] = useState(BlurredStyle);
  const [nameError, setNameError] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [isSelect, setIsSelect] = useState('');
  const [cvv, setCvv] = useState('');
  const [cvvError, setCvvError] = useState('');
  const [cvvInputStyle, setCvvInputStyle] = useState(BlurredStyle);
  const [cardNumber, setCardNumber] = useState('');
  const [cardNumberInputStyle, setCardNumberInputStyle] =
    useState(BlurredStyle);
  const [cardNumberError, setCardNumberError] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [postalCodeError, setPostalCodeError] = useState('');

  const [postalCodeInputStyle, setPostalCodeInputStyle] =
    useState(BlurredStyle);
  const [rememberMe, setRememberMe] = useState(false);

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
  const onFocusPostalCode = () => {
    onFocusInput(setPostalCodeInputStyle);
  };
  const onBlurPostalCode = () => {
    onBlurInput(setPostalCodeInputStyle);
  };

  const onChangePostalCode = text => {
    setPostalCode(text);
    if (text.length === 0) {
      setPostalCodeError(String.thisFieldIsMandatory);
    } else {
      setPostalCode(text);
      setPostalCodeError('');
    }
  };

  const onPressRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  const onPressAddCard = () => {
    navigation.navigate(StackNav.BankAccount);
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.linkYourBank} />
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
            placeholder={'123'}
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
          placeholder={'XXXX XXXX XXXX XXXX'}
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
        <CInput
          placeholder={String.enterYourPostalCode}
          label={String.postalCode}
          _value={postalCode}
          keyboardType="number-pad"
          _errorText={postalCodeError}
          maxLength={16}
          autoCapitalize={'none'}
          toGetTextFieldValue={onChangePostalCode}
          inputContainerStyle={postalCodeInputStyle}
          _onFocus={onFocusPostalCode}
          onBlur={onBlurPostalCode}
        />
        <View style={localStyle.bottomTextContainer}>
          <TouchableOpacity onPress={onPressRememberMe}>
            <Ionicons
              name={!!rememberMe ? 'checkbox' : 'square-outline'}
              color={!!rememberMe ? colors.primary : colors.grayScale500}
              size={moderateScale(18)}
            />
          </TouchableOpacity>
          <View style={localStyle.termsText}>
            <CText type={'R12'}>{String.byAddingNewCardYouAgreeToThe}</CText>
            <TouchableOpacity>
              <CText type={'R12'} color={colors.primary}>
                {String.creditDebitCardTerms}
              </CText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyBoardAvoidWrapper>
      <CButton
        title={String.addCard}
        type={'B16'}
        containerStyle={localStyle.addCardBtn}
        onPress={onPressAddCard}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
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
  bottomTextContainer: {
    ...styles.flexRow,
    ...styles.mt10,
  },
  termsText: {
    ...styles.ml10,
  },
  addCardBtn: {
    width: '90%',
    ...styles.selfCenter,
  },
});
