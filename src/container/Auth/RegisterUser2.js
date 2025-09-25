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
import {useKycFindQuery} from '../../data/kyc';
import {DEMO_SECRETS, REVIEW_DNI} from '../../config/review';
import {setSecrets} from '../../redux/action/walletAction';
import debounce from 'lodash.debounce';

export default function RegisterUser2({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [idNumber, setIdNumber] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hasRedirectedRef = useRef(false);

  const {mutate: findDni, isLoading} = useKycFindQuery();
  const dispatch = useDispatch();
  const isFormValid = () => {
    return idNumber.trim() !== '' && frontImage && backImage;
  };

  const closeModal = () => setModalVisible(false);

  useEffect(() => {
    const trimmed = idNumber.trim();
    if (!hasRedirectedRef.current && trimmed == REVIEW_DNI) {
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
      console.log(idNumber);

      if (idNumber.trim() === REVIEW_DNI) {
        dispatch(setSecrets(DEMO_SECRETS));
        navigation.reset({
          index: 0,
          routes: [{name: StackNav.TabNavigation}],
        });
        return;
      }
      if (!isFormValid()) return;

      findDni(
        {identifier: idNumber.trim()},
        {
          onMutate: () => {
            setSubmitting(true);
            setModalVisible(false);
          },
          onSuccess: response => {
            setSubmitting(false);

            if (response.ok) {
              setModalVisible(true);
            } else {
              navigation.navigate(AuthNav.RegisterUser3, {
                dni: idNumber.trim(),
                frontImage,
                backImage,
              });
            }
          },
          onError: err => {
            setSubmitting(false);
            const msg =
              err?.response?.data?.message || err.message || String.unknowerror;
            Alert.alert(String.errorCi, msg);
          },
          onSettled: () => setSubmitting(false),
        },
      );
    }, 500),

    [idNumber, frontImage, backImage],
  );

  return (
    <CSafeAreaViewAuth>
      <StepIndicator step={2} />
      <CHeader />
      <KeyBoardAvoidWrapper
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(10)},
        ]}>
        <View style={localStyle.mainContainer}>
          <CText type={'B20'} style={styles.boldText} align={'center'}>
            {String.idVerificationTitle}
          </CText>

          <CText type={'B16'} align={'center'}>
            {String.idVerificationSubtitle}
          </CText>

          <CText type="B14" style={styles.mt10}>
            {String.idLabel}
          </CText>
          <TextInput
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
            label={String.frontLabel}
            image={frontImage}
            setImage={setFrontImage}
          />

          <UploadCardImage
            label={String.backLabel}
            image={backImage}
            setImage={setBackImage}
          />
        </View>
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomTextContainer}>
        <CButton
          disabled={!isFormValid() || isLoading || submitting}
          title={isLoading ? String.checking : String.continueButton}
          onPress={handleCheckAndNext}
          type="B16"
          containerStyle={localStyle.btnStyle}
        />
      </View>
      <DniExistsModal visible={isModalVisible} onClose={closeModal} />
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
