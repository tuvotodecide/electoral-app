import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';

//custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../themes';
import {
  getHeight,
  GUARDIAN_RECOVERY_DNI,
  moderateScale,
  PENDING_OWNER_ACCOUNT,
  PENDING_OWNER_GUARDIAN_CT,
  PENDINGRECOVERY,
} from '../../../common/constants';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import Icono from '../../../components/common/Icono';
import String from '../../../i18n/String';
import {useSelector} from 'react-redux';

import CAlert from '../../../components/common/CAlert';
import CInput from '../../../components/common/CInput';
import {useKycFindPublicQuery} from '../../../data/kyc';
import {
  useGuardiansRecoveryRequestQuery,
  useHasGuardiansQuery,
} from '../../../data/guardians';
import {ActivityIndicator} from 'react-native-paper';
import InfoModalWithoutClose from '../../../components/modal/InfoModalWithoutClose';
import {AuthNav, StackNav} from '../../../navigation/NavigationKey';
import AsyncStorage from '@react-native-async-storage/async-storage';
import wira from 'wira-sdk';
import {useNavigationLogger} from '../../../hooks/useNavigationLogger';

export default function FindMyUser({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [carnet, setCarnet] = useState('');
  const {mutate: findPublicDni, isLoading} = useKycFindPublicQuery();

  const [candidate, setCandidate] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('FindMyUser', true);
  const {
    has,
    loading: loadingHas,
    refetch: checkHas,
  } = useHasGuardiansQuery(carnet, false);

  const {mutate: sendRequest, isLoading: loading} =
    useGuardiansRecoveryRequestQuery();

  const onToggleConfirm = () => {
    if (!candidate) return;
    if (loadingHas) return;
    if (!has) {
      setErrorMsg('Este carnet no tiene guardianes asignados');
      return;
    }
    setConfirmed(c => !c);
  };

  const onPressSearch = () => {
    setErrorMsg(null);
    setCandidate(null);
    setConfirmed(false);

    findPublicDni(
      {identifier: carnet.trim()},
      {
        onSuccess: async data => {
          if (!data.ok) {
            setErrorMsg('Persona no encontrada');
            return;
          }
          setCandidate({
            did: data.did,
            fullName: data.fullName,
            accountAddress: data.accountAddress,
            guardianAddress: data.guardianAddress,
          });
          await AsyncStorage.setItem('PENDING_DID', data.did);
          checkHas();
        },
      },
    );
  };
  const onPressInvitation = async () => {
    if (!candidate) {
      return;
    }
    const deviceId = await wira.DeviceId.getDeviceId();

    sendRequest(
      {targetDid: candidate.did, deviceId},
      {
        onSuccess: async data => {
          try {
            await AsyncStorage.setItem(PENDINGRECOVERY, 'true');
            await AsyncStorage.setItem(PENDING_OWNER_ACCOUNT, candidate.accountAddress);
            await AsyncStorage.setItem(GUARDIAN_RECOVERY_DNI, carnet.trim());

            if(candidate.guardianAddress) {
              await AsyncStorage.setItem(
                PENDING_OWNER_GUARDIAN_CT,
                candidate.guardianAddress,
              );
            }

            setModalMessage(`${String.messagetorecovery}`);
            setModalVisible(true);

            setCandidate(null);
            
            navigation.replace(StackNav.AuthNavigation, {
              screen: AuthNav.MyGuardiansStatus,
              params: {dni: carnet.trim()},
            });
          } catch (error) {
            console.error('Error storing data', error);
          }
          
        },
      },
    );
  };

  return (
    <CSafeAreaView testID="findMyUserContainer">
      <CHeader title={String.recoveryAccountWithGuardians} testID="findMyUserHeader" />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20} testID="findMyUserKeyboardWrapper">
        <CText type="R14" style={localStyle.fieldLabel} testID="findMyUserIdLabel">
          {String.idPlaceholder}
        </CText>
        <View style={localStyle.searchContainer} testID="findMyUserSearchContainer">
          <View style={localStyle.inputWrapper} testID="findMyUserInputWrapper">
            <CInput
              label={null}
              _value={carnet}
              toGetTextFieldValue={setCarnet}
              placeHolder="Ingresa tu carnet"
              keyBoardType="numeric"
              inputContainerStyle={localStyle.inputContainer}
              inputBoxStyle={localStyle.inputBox}
              testID="findMyUserIdInput"
            />
          </View>

          <TouchableOpacity
            onPress={onPressSearch}
            disabled={isLoading || !carnet.trim()}
            style={[
              localStyle.searchButton,
              {backgroundColor: colors.primary},
            ]}
            testID="findMyUserSearchButton">
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Icono name="search-web" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        {errorMsg && <CAlert status="error" message={errorMsg} testID="findMyUserErrorAlert" />}
        {candidate && (
          <>
            <CText type="R14" style={localStyle.fieldLabel} testID="findMyUserNameLabel">
              {String.guardianName}
            </CText>
            <View style={localStyle.inputWrapper} testID="findMyUserNameWrapper">
              <CInput
                editable={false}
                _value={candidate.fullName || '(sin nombre)'}
                testID="findMyUserNameInput"
              />
            </View>
          </>
        )}
      </KeyBoardAvoidWrapper>
      {candidate && (
        <View style={localStyle.confirmContainer} testID="findMyUserConfirmContainer">
          <TouchableOpacity
            style={localStyle.confirmRow}
            onPress={onToggleConfirm}
            disabled={loadingHas || !candidate}
            testID="findMyUserConfirmButton">
            <Icono
              name={confirmed ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={20}
              color={colors.primaryColor}
            />
            <CText style={localStyle.confirmText} testID="findMyUserConfirmText">
              {String.confirmDataCorrect}
            </CText>
          </TouchableOpacity>
        </View>
      )}
      <View style={localStyle.bottomTextContainer} testID="findMyUserBottomContainer">
        <CButton
          title={String.sendRecovery}
          disabled={loading || !candidate || !confirmed}
          onPress={onPressInvitation}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          frontIcon={<Icono size={20} name="send" color={'#fff'} />}
          testID="findMyUserSendButton"
        />
      </View>
      <InfoModalWithoutClose
        visible={modalVisible}
        title="¡Invitación!"
        message={modalMessage}
        onClose={() => setModalVisible(false)}
        testID="findMyUserInfoModal"
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
  confirmContainer: {
    ...styles.ph20,
    marginTop: moderateScale(16),
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmText: {
    marginLeft: moderateScale(8),
    fontSize: moderateScale(16),
  },
});
