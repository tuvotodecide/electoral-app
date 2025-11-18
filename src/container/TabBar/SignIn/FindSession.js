import { useState } from "react";
import { useSelector } from "react-redux";
import wira from "wira-sdk";
import {BACKEND_IDENTITY, PROVIDER_NAME} from '@env';
import CSafeAreaView from "../../../components/common/CSafeAreaView";
import CHeader from "../../../components/common/CHeader";
import String from '../../../i18n/String';
import KeyBoardAvoidWrapper from "../../../components/common/KeyBoardAvoidWrapper";
import { styles } from "../../../themes";
import { StyleSheet } from "react-native";
import { moderateScale } from "../../../common/constants";
import CInput from "../../../components/common/CInput";
import CAlert from "../../../components/common/CAlert";
import CText from "../../../components/common/CText";
import CButton from "../../../components/common/CButton";

const sharedSession = new wira.SharedSession(
  BACKEND_IDENTITY,
  PROVIDER_NAME
);

export default function FindSession() {
  const colors = useSelector(state => state.theme.theme);
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const findApps = async () => {
    setLoading(true);
    try {
      const apps = await sharedSession.checkRegisteredOnThisDevice(dni);
      await sharedSession.openFirstAppFound(apps);
    } catch (error) {
      if(
        error.message?.includes('Device not found') ||
        error.message?.includes('No supported app found')
      ) {
        setErrorMsg(String.deviceNotFound);
      } else {
        setErrorMsg(error.message || String.deviceGetError);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <CSafeAreaView>
      <CHeader title={String.signInWithWira} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <CText type="R14" style={localStyle.fieldLabel}>
          {String.idPlaceholder}
        </CText>
        <CInput
          label={null}
          _value={dni}
          toGetTextFieldValue={setDni}
          placeHolder={String.enterDni}
          keyBoardType="numeric"
        />
        {errorMsg && <CAlert status="error" message={errorMsg} />}
      </KeyBoardAvoidWrapper>
      <CButton
        title={String.continueButton}
        disabled={loading || dni.trim().length === 0}
        onPress={findApps}
        type={'B16'}
        containerStyle={localStyle.btnStyle}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  fieldLabel: {
    marginTop: moderateScale(20),
    fontWeight: 'bold',
  },
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
  },
})