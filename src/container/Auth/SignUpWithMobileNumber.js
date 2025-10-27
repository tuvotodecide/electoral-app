import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import CountryPicker, {
  FlagButton,
  DARK_THEME,
  DEFAULT_THEME,
} from 'react-native-country-picker-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../themes';
import {getHeight, moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import String from '../../i18n/String';
import CInput from '../../components/common/CInput';
import CButton from '../../components/common/CButton';
import {AuthNav} from '../../navigation/NavigationKey';

export default function SignUpWithMobileNumber({route, navigation}) {
  const title = route?.params?.title;
  const colors = useSelector(state => state.theme.theme);
  const [number, setNumber] = useState('');
  const [numberInputStyle, setNumberInputStyle] = useState(BlurredStyle);
  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('SignUpWithMobileNumber', true);
  const [callingCodeLib, setCallingCodeLib] = useState('+91');
  const [visiblePiker, setVisiblePiker] = useState(false);
  const [countryCodeLib, setCountryCodeLib] = useState('IN');

  const openCountryPicker = () => setVisiblePiker(true);
  const closeCountryPicker = () => setVisiblePiker(false);

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);

  const onSelectCountry = country => {
    setCountryCodeLib(country.cca2);
    setCallingCodeLib('+' + country.callingCode[1]);
    closeCountryPicker();
  };

  const BlurredStyle = {
    borderColor: colors.inputBackground,
  };
  const FocusedStyle = {
    borderColor: colors.primary,
  };

  const onFocusNumber = () => {
    onFocusInput(setNumberInputStyle);
  };
  const onBlurNumber = () => {
    onBlurInput(setNumberInputStyle);
  };

  const onChangedPhoneNo = text => setNumber(text);

  const RightIcon = () => {
    return (
      <TouchableOpacity
        style={[
          localStyle.closeIcon,
          {
            backgroundColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}
        testID="signUpMobileNumberClearButton">
        <Ionicons
          name={'close'}
          size={moderateScale(17)}
          color={colors.grayScale400}
        />
      </TouchableOpacity>
    );
  };

  const onPressContinue = () => {
    navigation.navigate(AuthNav.OTPCode, {title: title});
  };
  return (
    <CSafeAreaViewAuth testID="signUpWithMobileNumberContainer">
      <CHeader testID="signUpWithMobileNumberHeader" />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1} testID="signUpWithMobileNumberKeyboardWrapper">
        <View style={localStyle.mainContainer} testID="signUpWithMobileNumberMainContainer">
          <View testID="signUpWithMobileNumberContentContainer">
            <CText type={'B24'} testID="signUpWithMobileNumberTitle">{String.almostDone}</CText>
            <CText type={'R14'} color={colors.grayScale500} testID="signUpWithMobileNumberDescription">
              {String.enterPhoneNumberText}
            </CText>
            <View style={localStyle.mobileNumberContainer} testID="signUpWithMobileNumberInputContainer">
              <TouchableOpacity
                onPress={openCountryPicker}
                style={[
                  localStyle.countryPickerStyle,
                  {
                    backgroundColor: colors.inputBackground,
                  },
                ]}
                testID="signUpWithMobileNumberCountryPicker">
                <FlagButton
                  value={callingCodeLib}
                  onOpen={openCountryPicker}
                  withEmoji={true}
                  countryCode={countryCodeLib}
                  withCallingCodeButton={true}
                  containerButtonStyle={localStyle.countryPickerButton}
                />
              </TouchableOpacity>
              <CInput
                placeholder={String.mobileNumber}
                _value={number}
                keyBoardType={'number-pad'}
                autoCapitalize={'none'}
                maxLength={10}
                toGetTextFieldValue={onChangedPhoneNo}
                inputContainerStyle={[
                  localStyle.inputBoxStyle,
                  numberInputStyle,
                ]}
                _onFocus={onFocusNumber}
                onBlur={onBlurNumber}
                rightAccessory={() => <RightIcon />}
                testID="signUpWithMobileNumberInput"
              />
            </View>

            <CountryPicker
              countryCode={'IN'}
              withFilter={true}
              visible={visiblePiker}
              withFlag={true}
              withFlagButton={true}
              withCallingCode={true}
              withAlphaFilter={true}
              onSelect={country => onSelectCountry(country)}
              withCountryNameButton={true}
              onClose={closeCountryPicker}
              useTheme={colors.dark ? colors.white : colors.black}
              renderFlagButton={() => {
                return null;
              }}
              theme={colors.dark ? DARK_THEME : DEFAULT_THEME}
            />
          </View>
          <CButton
            type={'B16'}
            title={String.continue}
            onPress={onPressContinue}
            containerStyle={localStyle.btnStyle}
            testID="signUpWithMobileNumberContinueButton"
          />
        </View>
      </KeyBoardAvoidWrapper>
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    top: moderateScale(25),
    ...styles.justifyBetween,
    ...styles.flex,
  },
  inputBoxStyle: {
    width: '80%',
  },
  countryPickerButton: {
    ...styles.ml5,
  },
  mobileNumberContainer: {
    ...styles.flexRow,
  },
  countryPickerStyle: {
    ...styles.rowSpaceBetween,
    borderRadius: moderateScale(12),
    height: getHeight(52),
    ...styles.mt15,
    width: moderateScale(89),
  },
  btnStyle: {
    ...styles.mb30,
  },
  closeIcon: {
    height: moderateScale(20),
    width: moderateScale(20),
    borderRadius: moderateScale(10),
    ...styles.center,
  },
});
