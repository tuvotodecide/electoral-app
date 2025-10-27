import {StyleSheet, View, TouchableOpacity} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import Icons from 'react-native-vector-icons/EvilIcons';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import StepIndicator from '../../components/authComponents/StepIndicator';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import CButton from '../../components/common/CButton';
import String from '../../i18n/String';
import {LockIcon, USFlagIcon} from '../../assets/svg';
import SelectCountryModal from '../../components/modal/SelectCountryModal';
import {AuthNav} from '../../navigation/NavigationKey';
import {useNavigationLogger} from '../../hooks/useNavigationLogger';

export default function SelectCountry({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [country, setCountry] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('SelectCountry', true);
  const onPressSelect = () => {
    setIsModalVisible(!isModalVisible);
  };

  const onPressContinue = () => {
    navigation.navigate(AuthNav.SelectReason);
  };
  const selectedCountry = country => {
    setCountry(country);
    setIsModalVisible(!isModalVisible);
  };

  const onPressCloseModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  return (
    <CSafeAreaViewAuth testID="selectCountryContainer">
      <CHeader testID="selectCountryHeader" />
      <StepIndicator testID="selectCountryStepIndicator" step={3} />
      <View style={localStyle.mainContainer}>
        <View>
          <CText testID="citizenshipTitle" type={'B24'}>{String.whatsYourCitizenship}</CText>
          <CText
            testID="citizenshipDescription"
            type={'R14'}
            color={colors.grayScale500}
            style={localStyle.descriptionText}>
            {String.citizenDescription}
          </CText>
          <CText testID="citizenshipLabel" type={'B14'} style={localStyle.citizenText}>
            {String.citizenship}
          </CText>
          <TouchableOpacity testID="countrySelectButton" onPress={onPressSelect}>
            {!!country ? (
              <View
                style={[
                  localStyle.container,
                  {backgroundColor: colors.inputBackground},
                ]}>
                <View style={localStyle.iconAndCountryName}>
                  {country ? country?.svgIcon : null}
                  <CText testID="selectedCountryName" type={'M16'} style={styles.m10}>
                    {country?.countryName}
                  </CText>
                </View>
                <Icons
                  testID="countrySelectChevron"
                  name="chevron-right"
                  size={moderateScale(32)}
                  color={colors.grayScale500}
                  style={styles.mr10}
                />
              </View>
            ) : (
              <View
                style={[
                  localStyle.container,
                  {backgroundColor: colors.inputBackground},
                ]}>
                <View style={localStyle.iconAndCountryName}>
                  <USFlagIcon testID="defaultCountryFlag" />
                  <CText
                    testID="countryPlaceholder"
                    type={'M16'}
                    style={styles.m10}
                    color={colors.grayScale500}>
                    {String.selectCountry}
                  </CText>
                </View>
                <Icons
                  testID="placeholderChevron"
                  color={colors.grayScale500}
                  name="chevron-right"
                  size={moderateScale(32)}
                  style={styles.mr10}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View>
          <View testID="securityInfo" style={localStyle.securityContainer}>
            <LockIcon testID="securityIcon" />
            <CText testID="securityText" type={'R12'} color={colors.grayScale500} style={styles.ml5}>
              {String.securityText}
            </CText>
          </View>
          <CButton
            testID="continueButton"
            title={String.continue}
            type={'B16'}
            onPress={onPressContinue}
          />
        </View>
      </View>
      <SelectCountryModal
        testID="countrySelectionModal"
        visible={isModalVisible}
        selectedCountry={selectedCountry}
        onPressClose={onPressCloseModal}
      />
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    ...styles.flex,
    ...styles.justifyBetween,
  },
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(120),
    width: moderateScale(120),
  },
  descriptionText: {
    width: '80%',
  },

  skipBtn: {
    ...styles.mb20,
    ...styles.mt0,
  },
  citizenText: {
    ...styles.mt15,
  },
  container: {
    borderRadius: moderateScale(12),
    width: '100%',
    height: moderateScale(52),
    ...styles.selfCenter,
    ...styles.mt10,
    ...styles.rowSpaceBetween,
  },
  securityContainer: {
    ...styles.flexRow,
  },
  iconAndCountryName: {
    ...styles.rowCenter,
    ...styles.ml10,
  },
});
