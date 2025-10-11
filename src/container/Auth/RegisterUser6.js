import {StyleSheet, View} from 'react-native';
import React, {useState} from 'react';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {getHeight, moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import CButton from '../../components/common/CButton';
import {AuthNav} from '../../navigation/NavigationKey';
import Icono from '../../components/common/Icono';
import {useSelector} from 'react-redux';
import CEtiqueta from '../../components/common/CEtiqueta';
import {TouchableOpacity} from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import StepIndicator from '../../components/authComponents/StepIndicator';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';
import String from '../../i18n/String';
import {useNavigationLogger} from '../../hooks/useNavigationLogger';

export default function RegisterUser6({navigation, route}) {
  const {dni, ocrData} = route.params;
  const colors = useSelector(state => state.theme.theme);
  const [check, setCheck] = useState(false);

  // Hook para logging de navegación
  const {logAction, logNavigation} = useNavigationLogger(
    'RegisterUser6',
    true,
  );
  const onPressNext = () => {
    logAction('ConfirmDataNext', {checked: check});
    const params = {ocrData, dni};
    logNavigation(AuthNav.RegisterUser7, params);
    navigation.navigate(AuthNav.RegisterUser7, params);
  };
  const onPressReturn = () => {
    logAction('ReturnToVerify');
    logNavigation(AuthNav.RegisterUser2);
    navigation.reset({
      index: 0,
      routes: [
        {
          name: AuthNav.RegisterUser2,
        },
      ],
    });
  };
  const onPressRememberMe = () => {
    const nextValue = !check;
    logAction('ToggleConfirmData', {nextValue});
    setCheck(nextValue);
  };
  const onPressBack = () => {
    logNavigation(AuthNav.RegisterUser4);
    navigation.navigate(AuthNav.RegisterUser4);
  };
  const {fullName, governmentIdentifier, dateOfBirth} = ocrData;

  const fmtDate = epoch => {
    if (typeof epoch !== 'number' || !Number.isFinite(epoch)) return '-';
    const d = new Date(epoch * 1000);
    return `${d.getUTCDate().toString().padStart(2, '0')}/${(
      d.getUTCMonth() + 1
    )
      .toString()
      .padStart(2, '0')}/${d.getUTCFullYear()}`;
  };

  return (
    <CSafeAreaViewAuth testID="registerUser6Container">
  <StepIndicator step={6} testID="registerUser6StepIndicator" />
  <CHeader onPressBack={onPressBack} testID="registerUser6Header" />
      <KeyBoardAvoidWrapper
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(10)},
        ]}
        testID="registerUser6KeyboardWrapper">
        <View style={localStyle.mainContainer} testID="registerUser6MainContainer">
          <CText type={'B20'} style={styles.boldText} align={'center'} testID="registerUser6TitleText">
            {String.titleConfirmData}
          </CText>

          <CText type={'B16'} color={getSecondaryTextColor(colors)} testID="registerUser6DescriptionText">
            {String.descriptionConfirmData}
          </CText>
        </View>
        <CEtiqueta
          icon={<Icono name="account" color={getSecondaryTextColor(colors)} />}
          title={String.labelFullName}
          text={fullName}
          testID="registerUser6FullNameField"
        />
        <CEtiqueta
          icon={
            <Icono
              name="card-account-details"
              color={getSecondaryTextColor(colors)}
            />
          }
          title={String.labelDocumentId}
          text={governmentIdentifier}
          testID="registerUser6DocumentIdField"
        />
        <CEtiqueta
          icon={<Icono name="calendar" color={getSecondaryTextColor(colors)} />}
          title={String.labelBirthDate}
          text={fmtDate(dateOfBirth)}
          testID="registerUser6BirthDateField"
        />
        {/* <CEtiqueta
          icon={<Icono name="flag" color={getSecondaryTextColor(colors)} />}
           title={String.labelDocumentExpiration}
          text={fmtDate(documentExpirationDate)}
        /> */}

        {/* <CEtiqueta
          icon={<Icono name="flag" color={getSecondaryTextColor(colors)} />}
          title={String.labelNationality}
          text={data.nacionalidad}
        /> */}
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomTextContainer} testID="registerUser6BottomContainer">
        <View style={localStyle.rowWithGap} testID="registerUser6CheckboxRow">
          <TouchableOpacity onPress={onPressRememberMe} testID="registerUser6CheckboxButton">
            <Ionicons
              name={check ? 'checkbox' : 'square-outline'}
              color={check ? colors.primary : colors.grayScale50}
              size={moderateScale(24)}
            />
          </TouchableOpacity>
          <CText type={'B16'} color={colors.colorText} style={localStyle.item} testID="registerUser6CheckboxText">
            {String.confirmCheckText}
          </CText>
        </View>
        <View testID="registerUser6ButtonsContainer">
          <CButton
            title={String.confirmButton}
            disabled={!check}
            onPress={onPressNext}
            type={'B18'}
            containerStyle={localStyle.btnStyle}
            testID="registerUser6ConfirmButton"
          />
          <CButton
            title={String.returntoVerify}
            bgColor={colors.primary4}
            onPress={onPressReturn}
            type={'B18'}
            containerStyle={localStyle.btnStyle1}
            testID="registerUser6ReturnButton"
          />
        </View>
      </View>
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    gap: 5,
    marginBottom: 10,
  },
  btnStyle: {
    ...styles.selfCenter,
  },
  btnStyle1: {
    ...styles.selfCenter,
    marginTop: 1,
  },
  divider: {
    ...styles.rowCenter,
    ...styles.mt20,
  },
  orContainer: {
    height: getHeight(1),
    width: '20%',
  },
  socialBtn: {
    ...styles.center,
    height: getHeight(45),
    width: '46%',
    borderRadius: moderateScale(16),
    borderWidth: moderateScale(1),
    ...styles.mh10,
    ...styles.mt20,
  },
  socialBtnContainer: {
    ...styles.flexRow,
  },
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
  },
  loginText: {
    marginTop: moderateScale(2),
  },
  rowWithGap: {
    flexDirection: 'row',
    columnGap: 10,
  },
  item: {
    width: '95%',
  },
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(180),
    width: moderateScale(180),
  },
  margin: {
    marginBottom: '20px',
  },
});
