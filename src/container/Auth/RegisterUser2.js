import {StyleSheet, View, TextInput, Alert} from 'react-native';
import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

// Custom imports
import CSafeAreaView from '../../components/common/CSafeAreaView';
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
import {startSession} from '../../utils/Session';

export default function RegisterUser2({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [idNumber, setIdNumber] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {mutate: findDni} = useKycFindQuery();
  const dispatch = useDispatch();
  const isFormValid = () => {
    return idNumber.trim() !== '' && frontImage && backImage;
  };

  const closeModal = () => setModalVisible(false);

  const handleCheckAndNext = () => {
    if (idNumber.trim() === REVIEW_DNI) {
      dispatch(setSecrets(DEMO_SECRETS));

      startSession().then(() =>
        navigation.reset({
          index: 0,
          routes: [{name: StackNav.TabNavigation}],
        }),
      );

      return;
    }
    if (!isFormValid()) return;

    findDni(
      {identifier: idNumber.trim()},
      {
        onMutate: () => setSubmitting(true),
        onSuccess: data => {
          if (data.ok) {
            setModalVisible(true);
          } else {
            navigation.navigate(AuthNav.RegisterUser3, {
              dni: idNumber.trim(),
              frontImage,
              backImage,
            });
          }
        },
        onError: error => {
          const msg =
            error?.response?.data?.message ||
            error.message ||
            String.unknowerror;
          Alert.alert(String.errorCi, msg);
        },
        onSettled: () => setSubmitting(false),
      },
    );
  };

  return (
    <CSafeAreaView>
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
          disabled={!isFormValid() || submitting}
          title={submitting ? String.checking : String.continueButton}
          onPress={handleCheckAndNext}
          type="B16"
          containerStyle={localStyle.btnStyle}
        />
      </View>
      <DniExistsModal visible={isModalVisible} onClose={closeModal} />
    </CSafeAreaView>
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
