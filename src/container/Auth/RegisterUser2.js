import {StyleSheet, View, TextInput, Alert} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

// Custom imports
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import CButton from '../../components/common/CButton';
import {AuthNav, StackNav} from '../../navigation/NavigationKey';
import StepIndicator from '../../components/authComponents/StepIndicator';
import UploadCardImage from '../../components/common/UploadCardImage';
import String from '../../i18n/String';
import DniExistsModal from '../../components/modal/DniExistsModal';
import {DEMO_SECRETS, REVIEW_DNI} from '../../config/review';
import {setSecrets} from '../../redux/action/walletAction';
import debounce from 'lodash.debounce';
import wira from 'wira-sdk';
import {BACKEND_IDENTITY} from '@env';
import {useNavigationLogger} from '../../hooks/useNavigationLogger';

export default function RegisterUser2({navigation, route}) {
  const {logAction, logNavigation} = useNavigationLogger('RegisterUser2', true);
  const isRecovery = !!route?.params?.isRecovery;
  const colors = useSelector(state => state.theme.theme);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [idNumber, setIdNumber] = useState('');
  const [isModalVisible, setModalVisible] = useState({
    visible: false,
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const hasRedirectedRef = useRef(false);

  const dispatch = useDispatch();
  const isFormValid = () => idNumber.trim() !== '' && frontImage && backImage;

  const closeModal = () => setModalVisible({visible: false, message: ''});

  useEffect(() => {
    const trimmed = idNumber.trim();
    if (!hasRedirectedRef.current && trimmed === REVIEW_DNI) {
      hasRedirectedRef.current = true;
      dispatch(setSecrets(DEMO_SECRETS));
      navigation.reset({
        index: 0,
        routes: [{name: StackNav.TabNavigation}],
      });
    }
  }, [idNumber, dispatch, navigation]);

  const handleCheckAndNext = useCallback(
    debounce(() => {
      logAction('submit_attempt', {
        isRecovery,
        hasFrontImage: !!frontImage,
        hasBackImage: !!backImage,
      });

      const trimmedId = idNumber.trim();
      if (trimmedId === REVIEW_DNI) {
        dispatch(setSecrets(DEMO_SECRETS));
        navigation.reset({
          index: 0,
          routes: [{name: StackNav.TabNavigation}],
        });
        return;
      }

      if (!isFormValid()) {
        return;
      }

      setSubmitting(true);
      setModalVisible({visible: false, message: ''});

      const api = new wira.RegistryApi(BACKEND_IDENTITY);
      api
        .registryCheckByDni(trimmedId)
        .then(({exists}) => {
          setSubmitting(false);

          if (exists && !isRecovery) {
            setModalVisible({
              visible: true,
              message: String.DniExists,
            });
            logAction('dni_exists_modal_shown', {isRecovery});
            return;
          }

          if (!exists && isRecovery) {
            setModalVisible({
              visible: true,
              message: String.DniNotFound,
            });
            logAction('dni_not_found_modal_shown', {isRecovery});
            return;
          }

          navigation.navigate(AuthNav.RegisterUser3, {
            dni: trimmedId,
            frontImage,
            backImage,
            isRecovery,
          });
          logNavigation('go_to_register_step_3', {
            dni: trimmedId,
            isRecovery,
          });
        })
        .catch(err => {
          setSubmitting(false);
          const msg =
            err?.response?.data?.message || err.message || String.unknowerror;
          logAction('dni_check_error', {
            message: msg,
            name: err?.name,
          });
          Alert.alert(String.errorCi, msg);
        });
    }, 500),
    [
      idNumber,
      frontImage,
      backImage,
      dispatch,
      navigation,
      logAction,
      logNavigation,
      isRecovery,
    ],
  );

  return (
    <CSafeAreaViewAuth testID="registerUser2Container">
      <StepIndicator testID="registerUser2StepIndicator" step={2} />
      <CHeader testID="registerUser2Header" />
      <KeyBoardAvoidWrapper
        testID="registerUser2KeyboardWrapper"
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(10)},
        ]}>
        <View style={localStyle.mainContainer}>
          <CText
            testID="idVerificationTitle"
            type={'B20'}
            style={styles.boldText}
            align={'center'}>
            {String.idVerificationTitle}
          </CText>

          <CText
            testID="idVerificationSubtitle"
            type={'B16'}
            align={'center'}>
            {isRecovery ? String.toRecovery : String.toContinue}
            {String.idVerificationSubtitle}
          </CText>

          <CText
            testID="idLabel"
            type="B14"
            style={styles.mt10}>
            {String.idLabel}
          </CText>
          <TextInput
            testID="idNumberInput"
            value={idNumber}
            onChangeText={setIdNumber}
            onEndEditing={handleCheckAndNext}
            placeholder={String.idPlaceholder}
            placeholderTextColor={colors.grayScale500}
            style={[
              localStyle.input,
              {
                borderColor: colors.grayScale300,
                color: colors.textColor,
                backgroundColor: colors.inputBackground,
              },
            ]}
          />

          <UploadCardImage
            testID="frontCardUpload"
            label={String.frontLabel}
            image={frontImage}
            setImage={setFrontImage}
          />

          <UploadCardImage
            testID="backCardUpload"
            label={String.backLabel}
            image={backImage}
            setImage={setBackImage}
          />
        </View>
      </KeyBoardAvoidWrapper>
      <View
        testID="registerUser2BottomContainer"
        style={localStyle.bottomTextContainer}>
        <CButton
          testID="continueVerificationButton"
          disabled={!isFormValid() || submitting}
          title={submitting ? String.checking : String.continueButton}
          onPress={handleCheckAndNext}
          type="B16"
          containerStyle={localStyle.btnStyle}
        />
      </View>
      <DniExistsModal
        testID="registerUser2DniExistsModal"
        visible={isModalVisible.visible}
        message={isModalVisible.message}
        onClose={closeModal}
      />
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    gap: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: moderateScale(10),
    fontSize: 16,
  },
  btnStyle: {
    ...styles.selfCenter,
  },
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
  },
});
