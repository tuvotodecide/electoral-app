import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

//custom import
import { useSelector } from 'react-redux';
import { getHeight, moderateScale } from '../../../common/constants';
import CButton from '../../../components/common/CButton';
import CHeader from '../../../components/common/CHeader';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import Icono from '../../../components/common/Icono';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import String from '../../../i18n/String';
import { styles } from '../../../themes';

import axios from 'axios';
import { ActivityIndicator } from 'react-native-paper';
import CAlert from '../../../components/common/CAlert';
import CInput from '../../../components/common/CInput';
import InfoModal from '../../../components/modal/InfoModal';
import { useGuardiansInviteQuery } from '../../../data/guardians';
import { useKycFindPublicQuery } from '../../../data/kyc';


export default function AddGuardians() {
  const colors = useSelector(state => state.theme.theme);
  const {mutate: findPublicDni, isLoading} = useKycFindPublicQuery();
  const {
    mutateAsync: sendInvitation,
    isLoading: loading,
  } = useGuardiansInviteQuery();
  const [carnet, setCarnet] = useState('');
  const payloadQr = useSelector(state => state.wallet.payload);

  const [nick, setNick] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [msg, setMsg] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const isWhitespaceOnly = nick.length > 0 && nick.trim().length === 0;

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
            fullName: data.displayNamePublic,
            accountAddress: data.accountAddress,
            guardianAddress: data.guardianAddress,
          });
        },
        onError: err => {
          const message = err?.response?.data?.error ?? err.message;
          if (message.includes('Network Error')) {
            setMsg(String.networkError);
          } else {
            setMsg(message);
          }
        },
      },
    );
  };
  const onPressInvitation = async () => {
    if (!candidate) return;
    setMsg('');

    try {
      const data = await sendInvitation({
        inviterDid: payloadQr.did,
        guardianDid: candidate.did,
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
    <CSafeAreaView testID="addGuardiansContainer" addTabPadding={false}>
      <CHeader testID="addGuardiansHeader" title={String.addGuardian} />
      <KeyBoardAvoidWrapper testID="addGuardiansKeyboardWrapper" contentContainerStyle={styles.ph20}>
        <CText testID="addGuardiansTitle" type={'B16'} align={'center'} marginTop={15}>
          {String.addGuardianSubtitle}{' '}
          <CText testID="addGuardiansTitleSpan" type="B16" style={{fontWeight: 'bold'}}>
            {String.addGuardianSubtitleSpan}
          </CText>
        </CText>
        <CText testID="addGuardiansCarnetLabel" type="R14" style={localStyle.fieldLabel}>
          {String.carnet}
        </CText>
        <View testID="addGuardiansSearchContainer" style={localStyle.searchContainer}>
          <View testID="addGuardiansInputWrapper" style={localStyle.inputWrapper}>
            <CInput
              testID="addGuardiansCarnetInput"
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
            testID="addGuardiansSearchButton"
            onPress={onPressSearch}
            disabled={isLoading}
            style={[
              localStyle.searchButton,
              {backgroundColor: colors.primary},
            ]}>
            {isLoading ? (
              <ActivityIndicator testID="addGuardiansSearchLoading" color="#fff" />
            ) : (
              <Icono testID="addGuardiansSearchIcon" name="search-web" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        {candidate && (
          <>
            <CText testID="addGuardiansNameLabel" type="R14" style={localStyle.fieldLabel}>
              {String.guardianName}
            </CText>
            <View testID="addGuardiansNameWrapper" style={localStyle.inputWrapper}>
              <CInput
                testID="addGuardiansNameInput"
                editable={false}
                _value={candidate.fullName || '(sin nombre)'}
              />
            </View>

            <CText testID="addGuardiansNicknameLabel" type="R14" style={localStyle.fieldLabel}>
              {String.nickname}
            </CText>
            <View testID="addGuardiansNicknameWrapper" style={localStyle.inputWrapper}>
              <CInput
                testID="addGuardiansNicknameInput"
                _value={nick}
                toGetTextFieldValue={setNick}
                placeHolder={String.nickname}
              />
            </View>
          </>
        )}
        {msg !== '' && (
          <CAlert 
            testID="addGuardiansErrorAlert" 
            status="error" 
            message={msg} 
          />
        )}
      </KeyBoardAvoidWrapper>
      <View testID="addGuardiansBottomContainer" style={localStyle.bottomTextContainer}>
        <CAlert testID="addGuardiansInfoAlert" status="info" message={String.guardianNotificationTitle} />
        <CButton
          testID="addGuardiansSendButton"
          title={String.sendInvitation}
          disabled={loading || !candidate || isWhitespaceOnly}
          onPress={onPressInvitation}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          frontIcon={<Icono size={20} name="send" color={'#fff'} />}
        />
      </View>
      <InfoModal
        testID="addGuardiansSuccessModal"
        visible={modalVisible}
        title="¡Invitación enviada!"
        message={modalMessage}
        onClose={() => {
          setModalVisible(false);
        }}
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
