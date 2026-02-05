import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

// Custom imports
import { BACKEND_IDENTITY } from '@env';
import debounce from 'lodash.debounce';
import wira from 'wira-sdk';
import { moderateScale } from '../../common/constants';
import StepIndicator from '../../components/authComponents/StepIndicator';
import CButton from '../../components/common/CButton';
import CHeader from '../../components/common/CHeader';
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CText from '../../components/common/CText';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import UploadCardImage from '../../components/common/UploadCardImage';
import { DEMO_SECRETS, REVIEW_DNI } from '../../config/review';
import String from '../../i18n/String';
import { AuthNav, StackNav } from '../../navigation/NavigationKey';
import { setSecrets } from '../../redux/action/walletAction';
import { styles } from '../../themes';

import SimpleModal from '../../components/modal/SimpleModal';

export default function RegisterUser2({navigation, route}) {
  const isRecovery = !!route?.params?.isRecovery;
  const colors = useSelector(state => state.theme.theme);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [idNumber, setIdNumber] = useState('');
  const [isModalVisible, setModalVisible] = useState({
    visible: false,
    message: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const hasRedirectedRef = useRef(false);

  const dispatch = useDispatch();
  const isFormValid = () => idNumber.trim() !== '' && frontImage && backImage;

  const closeModal = () => {
    setModalVisible({visible: false, message: null});
    if(isRecovery) {
      navigation.reset({
        index: 1,
        routes: [
          {
            name: AuthNav.Connect,
          },
          {
            name: AuthNav.RegisterUser1,
          },
        ],
      });
    }
  };

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

      const trimmedId = idNumber.trim();
      if (trimmedId === REVIEW_DNI) {
        dispatch(setSecrets(DEMO_SECRETS));
        navigation.reset({
          index: 0,
          routes: [{name: StackNav.TabNavigation}],
        });
        return;
      }

      if (trimmedId === '') {
        return;
      }

      setSubmitting(true);
      setModalVisible({visible: false, message: null});

      const api = new wira.RegistryApi(BACKEND_IDENTITY);
      api
        .registryCheckByDni(trimmedId)
        .then(({exists}) => {
          setSubmitting(false);

          if (exists && !isRecovery) {
            setModalVisible({
              visible: true,
              message: <CText type="B18" align="center" style={styles.mb20}>
                {String.DniExists}
              </CText>,
            });
            return;
          }

          if (!exists && isRecovery) {
            setModalVisible({
              visible: true,
              message: <View style={{display: 'flex', alignItems: 'center'}}>
                <CText type="B18" align="center">
                  {String.DniNotFound1}
                </CText>
                <CText type="B18" align="center" style={{fontWeight: 'bold'}}>
                  {trimmedId}
                </CText>
                <CText type="B18" align="center" style={styles.mb20}>
                  {String.DniNotFound2}
                </CText>
              </View>
            });
            return;
          }

          if(!isFormValid()) {
            return;
          }

          navigation.navigate(AuthNav.RegisterUser3, {
            dni: trimmedId,
            frontImage,
            backImage,
            isRecovery,
          });
        })
        .catch(err => {
          setSubmitting(false);
          const msg =
            err?.response?.data?.message || err.message || String.error;

          if (msg.includes('Network Error')) {
            Alert.alert(String.error, String.networkError);
          } else {
            Alert.alert(String.error, msg);
          }
        });
    }, 500),
    [
      idNumber,
      frontImage,
      backImage,
      dispatch,
      navigation,
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
      <SimpleModal
        testID="registerUser2DniExistsModal"
        visible={isModalVisible.visible}
        message={isModalVisible.message}
        closeBtn={isRecovery ? String.register : String.ok}
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
