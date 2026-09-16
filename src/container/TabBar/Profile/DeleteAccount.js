import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

// custom import
import wira from 'wira-sdk';
import { moderateScale } from '../../../common/constants';
import CButton from '../../../components/common/CButton';
import CHeader from '../../../components/common/CHeader';
import CInput from '../../../components/common/CInput';
import CLoaderOverlay from '../../../components/common/CLoaderOverlay';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import Icono from '../../../components/common/Icono';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import InfoModal from '../../../components/modal/InfoModal';
import { captureError } from '../../../config/sentry';
import DemoBanner from '../../../features/demo/DemoBanner';
import { isDemoPin } from '../../../features/demo/demoConfig';
import { exitDemoSession } from '../../../features/demo/demoLifecycle';
import { useIsDemoActive } from '../../../features/demo/demoSession';
import String from '../../../i18n/String';
import { StackNav } from '../../../navigation/NavigationKey';
import { styles } from '../../../themes';
import typography from '../../../themes/typography';
import { clearAppLocalData, requestAccountDeletion } from '../../../utils/deleteAccount';
import { getSecondaryTextColor } from '../../../utils/ThemeUtils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DANGER_COLOR = '#D83031';

export default function DeleteAccount({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const isDemo = useIsDemoActive();
  const otpRef = useRef(null);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [pin, setPin] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const trimmedEmail = email.trim();
  const isEmailValid = EMAIL_REGEX.test(trimmedEmail);
  const canDelete = isEmailValid && pin.length === 4 && !deleting;

  const resetPin = () => {
    otpRef.current?.clear();
    setPin('');
  };

  const onDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    let step = 'checkPin';
    try {
      // La demo no tiene billetera wira ni cuenta en la nube: se valida el PIN
      // de demostración y se usa el mismo "Salir del modo demostración" de
      // Profile, que borra los datos de ejemplo y lleva al inicio.
      if (isDemo) {
        if (!isDemoPin(pin)) {
          resetPin();
          setErrorMsg(String.deleteAccountWrongPin);
          return;
        }
        step = 'exitDemo';
        await exitDemoSession(navigation);
        return;
      }

      if (!(await wira.checkPin(pin))) {
        resetPin();
        setErrorMsg(String.deleteAccountWrongPin);
        return;
      }

      step = 'signIn';
      const {did, dni, privKey} = await wira.signIn(pin);

      step = 'requestDelete';
      await requestAccountDeletion({dni, email: trimmedEmail});

      step = 'clearAppData';
      await clearAppLocalData();

      step = 'deleteWiraData';
      await wira.deleteAllData(did, privKey);

      setSuccess(true);
    } catch (error) {
      captureError(error, {
        flow: 'DeleteAccount',
        step,
        critical: true,
      });
      resetPin();
      const baseMsg =
        step === 'requestDelete'
          ? String.deleteAccountRequestError
          : String.deleteAccountError;
      setErrorMsg(error?.message ? `${baseMsg}\n${error.message}` : baseMsg);
    } finally {
      setDeleting(false);
    }
  };

  const onGoHome = () => {
    setSuccess(false);
    navigation.reset({
      index: 0,
      routes: [{name: StackNav.AuthNavigation}],
    });
  };

  return (
    <CSafeAreaView testID="deleteAccountContainer">
      <CHeader testID="deleteAccountHeader" title={String.deleteAccountTitle} />
      <KeyBoardAvoidWrapper
        testID="deleteAccountKeyboardWrapper"
        contentContainerStyle={localStyle.mainContainer}>
        <DemoBanner testID="deleteAccountDemoBanner" />
        <View testID="deleteAccountIconContainer" style={localStyle.iconContainer}>
          <Icono name="account-remove" size={moderateScale(80)} color={DANGER_COLOR} />
        </View>
        <CText
          testID="deleteAccountDescription"
          type={'R14'}
          align={'center'}
          style={styles.mb20}>
          {String.deleteAccountDescription}
        </CText>
        <CText
          testID="deleteAccountTimeframe"
          type={'B14'}
          align={'center'}
          color={getSecondaryTextColor(colors)}>
          {String.deleteAccountTimeframe}
        </CText>

        <CInput
          testID="deleteAccountEmailInput"
          label={String.deleteAccountEmailLabel}
          placeHolder={String.deleteAccountEmailPlaceholder}
          _value={email}
          toGetTextFieldValue={setEmail}
          keyBoardType="email-address"
          autoCapitalize="none"
          _onBlur={() => setEmailTouched(true)}
          _errorText={
            emailTouched && !isEmailValid ? String.deleteAccountEmailInvalid : ''
          }
          _editable={!deleting}
        />
        <CText
          testID="deleteAccountEmailHelp"
          type={'R12'}
          color={getSecondaryTextColor(colors)}>
          {String.deleteAccountEmailHelp}
        </CText>

        <CText
          testID="deleteAccountPinLabel"
          type={'B16'}
          align={'center'}
          style={styles.mt30}>
          {String.deleteAccountPinLabel}
        </CText>
        <OTPTextInput
          testID="deleteAccountPinInput"
          ref={otpRef}
          inputCount={4}
          containerStyle={localStyle.otpInputViewStyle}
          handleTextChange={setPin}
          secureTextEntry={true}
          editable={!deleting}
          keyboardAppearance={'dark'}
          placeholderTextColor={colors.textColor}
          textInputStyle={[
            localStyle.underlineStyleBase,
            {
              backgroundColor: colors.inputBackground,
              color: colors.textColor,
              borderColor: colors.grayScale500,
            },
          ]}
          tintColor={colors.primary}
          offTintColor={colors.grayScale500}
        />

        <View testID="deleteAccountButtons" style={localStyle.buttons}>
          <CButton
            testID="deleteAccountSubmitButton"
            title={String.deleteAccountSubmit}
            type={'B16'}
            onPress={onDelete}
            disabled={!canDelete}
            bgColor={DANGER_COLOR}
            color={colors.white}
          />
          <CButton
            testID="deleteAccountCancelButton"
            title={String.cancel}
            type={'B16'}
            variant="outlined"
            onPress={() => navigation.goBack()}
            disabled={deleting}
          />
        </View>
      </KeyBoardAvoidWrapper>
      {deleting ? <CLoaderOverlay message={String.deleteAccountDeleting} /> : null}
      <InfoModal
        testID="deleteAccountErrorModal"
        visible={!!errorMsg}
        title={String.error}
        message={errorMsg}
        onClose={() => setErrorMsg('')}
      />
      <InfoModal
        testID="deleteAccountSuccessModal"
        visible={success}
        title={String.deleteAccountSuccessTitle}
        message={String.deleteAccountSuccessMessage}
        buttonText={String.deleteAccountGoHome}
        onClose={onGoHome}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    ...styles.flexGrow1,
  },
  iconContainer: {
    alignItems: 'center',
    ...styles.mv10,
  },
  otpInputViewStyle: {
    ...styles.selfCenter,
    ...styles.mt15,
  },
  underlineStyleBase: {
    width: moderateScale(50),
    height: moderateScale(55),
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(10),
    ...typography.fontWeights.Bold,
    ...typography.fontSizes.f26,
    ...styles.mh5,
  },
  buttons: {
    ...styles.mt30,
    ...styles.mb20,
  },
});
