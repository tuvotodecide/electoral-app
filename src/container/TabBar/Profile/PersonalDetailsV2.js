import {
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import CountryPicker, {
  FlagButton,
  DARK_THEME,
  DEFAULT_THEME,
} from 'react-native-country-picker-modal';
import ImagePicker from 'react-native-image-crop-picker';

//custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {useSelector} from 'react-redux';
import CInput from '../../../components/common/CInput';
import {validName, validateEmail} from '../../../utils/Validation';
import {styles} from '../../../themes';
import {getHeight, moderateScale} from '../../../common/constants';
import images from '../../../assets/images';
import CText from '../../../components/common/CText';
import {EditColordIcon, EditIcon} from '../../../assets/svg';
import {TabNav} from '../../../navigation/NavigationKey';
import CButton from '../../../components/common/CButton';
import EditProfilePictureModal from '../../../components/modal/EditProfilePictureModal';

export default function PersonalDetails({navigation, route}) {
  const title = route?.params?.title;
  const colors = useSelector(state => state.theme.theme);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailInputStyle, setEmailInputStyle] = useState(BlurredStyle);
  const [nameInputStyle, setNameInputStyle] = useState(BlurredStyle);
  const [number, setNumber] = useState('');
  const [numberInputStyle, setNumberInputStyle] = useState(BlurredStyle);
  const [callingCodeLib, setCallingCodeLib] = useState('+91');
  const [visiblePiker, setVisiblePiker] = useState(false);
  const [countryCodeLib, setCountryCodeLib] = useState('IN');
  const [selectImage, setSelectImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSelect, setIsSelect] = useState(false);

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);

  const BlurredStyle = {
    borderColor: colors.inputBackground,
  };
  const FocusedStyle = {
    borderColor: colors.primary,
  };
  const onFocusEmail = () => {
    onFocusInput(setEmailInputStyle);
  };
  const onBlurEmail = () => {
    onBlurInput(setEmailInputStyle);
  };
  const onFocusName = () => {
    onFocusInput(setNameInputStyle);
  };
  const onBlurName = () => {
    onBlurInput(setNameInputStyle);
  };
  const onFocusNumber = () => {
    onFocusInput(setNumberInputStyle);
  };
  const onBlurNumber = () => {
    onBlurInput(setNumberInputStyle);
  };
  const onChangeName = text => {
    const {msg} = validName(text);
    setName(text);
    setNameError(msg);
    return false;
  };
  const onChangedEmail = val => {
    const {msg} = validateEmail(val.trim());
    setEmail(val.trim());
    setEmailError(msg);
  };

  const onSelectCountry = country => {
    setCountryCodeLib(country.cca2);
    setCallingCodeLib('+' + country.callingCode[1]);
    closeCountryPicker();
  };

  const openCountryPicker = () => setVisiblePiker(true);
  const closeCountryPicker = () => setVisiblePiker(false);
  const onChangedPhoneNo = text => setNumber(text);

  const onPressCamera = () => {
    ImagePicker.openCamera({
      mediaType: 'photo',
      includeBase64: true,
    }).then(image => {
      setSelectImage(image.path);
      setIsModalVisible(false);
    });
  };

  const onPressGallery = () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      includeBase64: true,
    }).then(images => {
      setSelectImage(images.path);
      setIsModalVisible(false);
    });
  };

  const onPressEditIconInEditDetails = () => {
    setIsModalVisible(!isModalVisible);
  };

  const deleteProfileImage = () => {
    setSelectImage(null);
    setIsModalVisible(false);
  };
  const onPressSelect = () => {
    setIsSelect(!isSelect);
  };

  const RightIcon = () => {
    return (
      <TouchableOpacity color={colors.primary} onPress={onPressSelect}>
        {isSelect === false ? <EditColordIcon /> : null}
      </TouchableOpacity>
    );
  };

  const onPressSaveChanges = () => {
    navigation.navigate(TabNav.Profile);
  };

  return (
    <CSafeAreaView>
      <CHeader
        title={String.personalData}
        rightIcon={title ? null : <RightIcon />}
      />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        {isSelect === true ? (
          <ImageBackground
            source={selectImage ? {uri: selectImage} : images.ProfileImage}
            imageStyle={{borderRadius: moderateScale(100)}}
            style={localStyle.userImage}>
            <TouchableOpacity
              onPress={onPressEditIconInEditDetails}
              style={[
                localStyle.editProfileIconStyle,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.backgroundColor,
                },
              ]}>
              <EditIcon width={12} height={12} />
            </TouchableOpacity>
          </ImageBackground>
        ) : (
          <Image source={images.ProfileImage} style={localStyle.userImage} />
        )}

        <CInput
          placeholder={String.fullName}
          label={String.fullName}
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
        <CText
          style={localStyle.labelText}
          type={'R16'}
          color={colors.grayScale400}>
          {String.mobileNumber}
        </CText>
        <View style={localStyle.mobileNumberContainer}>
          <TouchableOpacity
            onPress={openCountryPicker}
            style={[
              localStyle.countryPickerStyle,
              {
                backgroundColor: colors.inputBackground,
              },
            ]}>
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
            inputContainerStyle={[localStyle.inputBoxStyle, numberInputStyle]}
            _onFocus={onFocusNumber}
            onBlur={onBlurNumber}
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
        <CInput
          label={String.email}
          placeholder={String.email}
          _value={email}
          keyBoardType={'email-address'}
          _errorText={emailError}
          maxLength={30}
          autoCapitalize={'none'}
          toGetTextFieldValue={onChangedEmail}
          inputContainerStyle={emailInputStyle}
          _onFocus={onFocusEmail}
          onBlur={onBlurEmail}
        />
      </KeyBoardAvoidWrapper>
      {isSelect === true ? (
        <CButton
          title={String.saveChange}
          type={'B16'}
          containerStyle={localStyle.changesBtn}
          onPress={onPressSaveChanges}
        />
      ) : null}
      <EditProfilePictureModal
        visible={isModalVisible}
        onPressCamera={onPressCamera}
        onPressGallery={onPressGallery}
        onPressDeletePhoto={deleteProfileImage}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
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
  userImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    ...styles.selfCenter,
    ...styles.mt40,
  },
  labelText: {
    textAlign: 'left',
    opacity: 0.9,
    ...styles.mt15,
  },
  editProfileIconStyle: {
    height: moderateScale(24),
    width: moderateScale(24),
    position: 'absolute',
    borderWidth: moderateScale(3),
    borderRadius: moderateScale(12),
    left: moderateScale(75),
    top: moderateScale(75),
    ...styles.center,
  },
  changesBtn: {
    ...styles.selfCenter,
    width: '90%',
  },
});
