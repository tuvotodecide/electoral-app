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
import {CHAIN} from '@env';
import axios from 'axios';
import {
  guardianHashFrom,
  inviteGuardianOnChain,
} from '../../../api/guardianOnChain';
import {getSecrets} from '../../../utils/Cifrate';

export default function AddGuardians({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const {mutate: findPublicDni, isLoading} = useKycFindPublicQuery();
  const {
    mutateAsync: sendInvitation,
    isLoading: loading,
    error,
  } = useGuardiansInviteQuery();
  const [carnet, setCarnet] = useState('');

  const [dni, setDni] = useState('');
  const [nick, setNick] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [msg, setMsg] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const isWhitespaceOnly = nick.length > 0 && nick.trim().length === 0;
  const onPressNext = () => {};
  const onPressSearch = () => {
    setMsg('');
    findPublicDni(
      {identifier: carnet.trim()},
      {
        onSuccess: data => {
          if (!data.ok) {
            setMsg(data.message || 'Persona no encontrada');
            return;
          }

          setCandidate({
            did: data.did,
            fullName: data.fullName,
            accountAddress: data.accountAddress,
            guardianAddress: data.guardianAddress,
          });
        },
        onError: err => setMsg(err?.response?.data?.error ?? err.message),
      },
    );
  };
  const onPressInvitation = async () => {
    if (!candidate) return;

    const {payloadQr} = await getSecrets();

    setMsg('');
    const invitateAddress = guardianHashFrom(candidate.accountAddress);
    const ownerPk = payloadQr.privKey;
    const guardianCt = payloadQr.guardian;

    try {
      // await inviteGuardianOnChain(CHAIN, ownerPk, payloadQr.account, guardianCt, invitateAddress);
      const data = await sendInvitation({
        guardianId: candidate.did,
        nickname: nick,
      });
      setModalMessage(
        `Invitación enviada. ${
          candidate.fullName || '(sin nombre)'
        } debe aprobarla en las siguientes 24 horas desde su cuenta.`,
      );
      setModalVisible(true);
      setCandidate(null);
      setNick('');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : err.message;
      setMsg(message);
    }
  };

  return (
    <CSafeAreaView>
      <CHeader title={String.addGuardian} />
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
        {msg !== '' && <CAlert status="error" message={msg} />}
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomTextContainer}>
        <CAlert status="info" message={String.guardianNotificationTitle} />
        <CButton
          title={String.sendInvitation}
          disabled={loading || !candidate || isWhitespaceOnly}
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
