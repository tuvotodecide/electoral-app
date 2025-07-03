import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';

//custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../themes';
import {getHeight, moderateScale} from '../../../common/constants';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import Icono from '../../../components/common/Icono';
import String from '../../../i18n/String';
import {useSelector} from 'react-redux';

import CAlert from '../../../components/common/CAlert';
import CInput from '../../../components/common/CInput';
import {useKycFindPublicQuery} from '../../../data/kyc';
import {useGuardiansInviteQuery} from '../../../data/guardians';
import {Short_Black, Short_White} from '../../../assets/svg';
import {ActivityIndicator} from 'react-native-paper';
import InfoModal from '../../../components/modal/InfoModal';

export default function AddGuardians({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const {mutate: findPublicDni, isLoading} = useKycFindPublicQuery();
  const {mutate: sendInvitation, isLoading: loading} =
    useGuardiansInviteQuery();
  const [carnet, setCarnet] = useState('');

  const [dni, setDni] = useState('');
  const [nick, setNick] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [msg, setMsg] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const onPressNext = () => {
    console.log('hola');
  };
  const onPressSearch = () => {
    setMsg('');
    findPublicDni(
      {identifier: carnet.trim()},
      {
        onSuccess: data => {
          setCandidate({did: data.did, fullName: data.fullName});
        },
        onError: err => setMsg(err?.response?.data?.error ?? err.message),
      },
    );
  };
  const onPressInvitation = () => {
    if (!candidate) return;
    setMsg('');
    sendInvitation(
      {guardianId: candidate.did, nickname: nick || null},
      {
        onSuccess: data => {
          setModalMessage(
            `Invitación enviada. ${
              candidate.fullName || '(sin nombre)'
            } debe aprobarla en las siguientes 24 horas desde su cuenta.`,
          );
          setModalVisible(true);

          setCandidate(null);
          setDni('');
          setNick('');
        },
        onError: err => setMsg(err?.response?.data?.error ?? err.message),
      },
    );
  };
  const RightIcon = () => {
    return (
      <TouchableOpacity>
        {colors.dark ? <Short_White /> : <Short_Black />}
      </TouchableOpacity>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.addGuardian} rightIcon={<RightIcon />} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <CText type={'B16'} align={'center'} marginTop={15}>
          {String.addGuardianSubtitle}{' '}
          <CText type="B16" style={{fontWeight: 'bold'}}>
            {String.addGuardianSubtitleSpan}
          </CText>
        </CText>
        <CText type="R14" style={localStyle.fieldLabel}>
          {String.carnet}
        </CText>
        <View style={localStyle.searchContainer}>
          <View style={localStyle.inputWrapper}>
            <CInput
              label={null}
              _value={carnet}
              toGetTextFieldValue={setCarnet}
              placeHolder="Ingresa tu carnet"
              keyBoardType="numeric"
              inputContainerStyle={localStyle.inputContainer}
              inputBoxStyle={localStyle.inputBox}
            />
          </View>

          <TouchableOpacity
            onPress={onPressSearch}
            disabled={isLoading}
            style={[
              localStyle.searchButton,
              {backgroundColor: colors.primary},
            ]}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Icono name="search-web" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        {candidate && (
          <>
            <CText type="R14" style={localStyle.fieldLabel}>
              {String.guardianName}
            </CText>
            <View style={localStyle.inputWrapper}>
              <CInput
                editable={false}
                _value={candidate.fullName || '(sin nombre)'}
              />
            </View>

            <CText type="R14" style={localStyle.fieldLabel}>
              {String.nickname}
            </CText>
            <View style={localStyle.inputWrapper}>
              <CInput
                _value={nick}
                toGetTextFieldValue={setNick}
                placeHolder={String.nickname}
              />
            </View>
          </>
        )}
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomTextContainer}>
        <CAlert status="info" message={String.guardianNotificationTitle} />
        <CButton
          title={String.sendInvitation}
          disabled={loading || !candidate}
          onPress={onPressInvitation}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          frontIcon={<Icono size={20} name="send" color={'#fff'} />}
        />
      </View>
      <InfoModal
        visible={modalVisible}
        title="¡Invitación enviada!"
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    marginTop: 50,
    gap: 5,
    marginBottom: 10,
    justifyContent: 'center',
    width: '100%',
    height: getHeight(300),
    alignItems: 'center',
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
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(300),
    width: moderateScale(300),
  },
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
  },
  fieldLabel: {
    marginTop: moderateScale(20),
    fontWeight: 'bold',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  inputWrapper: {
    flex: 0.8,
    marginRight: moderateScale(8),
  },
  inputContainer: {
    borderRadius: moderateScale(8),
    height: getHeight(52),
  },
  inputBox: {
    borderRadius: moderateScale(8),
    height: getHeight(52),
  },
  searchButton: {
    flex: 0.2,
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
    marginTop: moderateScale(16),
  },
  btnStyle: {
    width: '100%',
  },
});
