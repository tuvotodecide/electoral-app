// src/container/TabBar/Recovery/RecuperationQR.js
import React, {useState} from 'react';
import {
  View,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';

import {openSettings} from 'react-native-permissions';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import CText from '../../../components/common/CText';
import CAlert from '../../../components/common/CAlert';
import CButton from '../../../components/common/CButton';
import Icono from '../../../components/common/Icono';
import String from '../../../i18n/String';
import {styles} from '../../../themes';

import {useSelector} from 'react-redux';
import wira from 'wira-sdk';

const recoveryService = new wira.RecoveryService();

export default function RecuperationQR() {
  const [saving, setSaving] = useState(false);
  const userData = useSelector(state => state.wallet.payload);
  const colors = useSelector(state => state.theme.theme);

  const initSaveQr = async () => {
    if (saving) return;

    setSaving(true);
    try {
      saveData();
    } catch (err) {
      Alert.alert('Error', errorMessage, [
        {text: 'OK', style: 'default'},
        {text: 'Abrir configuración', onPress: () => openSettings()},
      ]);
    } 
  };

  const saveData = async () => {
    try {
      const {savedOn, path, fileName} = await recoveryService.backupDataOnDevice({
        dni: userData.dni,
        salt: userData.salt,
        privKey: userData.privKey,
        account: userData.account,
        guardian: userData.guardian,
        did: userData.did,
      });

      if (savedOn === 'downloads') {
        Alert.alert(
          String.backed,
          String.backedOnDownloads + fileName,
          [
            { text: 'OK', style: 'default' },
            {
              text: String.openDownloads,
              onPress: () => {
                Linking.openURL(
                  'content://com.android.externalstorage.documents/root/primary:Download'
                ).catch(() => openSettings());
              },
            },
          ]
        );
      } else {
        Alert.alert(
          String.backed,
          String.backedOnAppDir + path,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      let errorMessage = String.backupSaveError;
      if (err.message.includes('Storage permission not granted')) {
        errorMessage = String.permissionDeniedMessage;
      } else if (err.message.includes('ENOENT')) {
        errorMessage = String.badDirectoryMessage;
      }

      Alert.alert('Error', errorMessage, [
        {text: 'OK', style: 'default'},
        {text: String.openSettings, onPress: () => openSettings()},
      ]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <CSafeAreaView testID="recuperationFileContainer" addTabPadding={false}>
      <CHeader testID="recuperationFileHeader" title={String.dataBackup} />

      <KeyBoardAvoidWrapper testID="recuperationFileKeyboardWrapper" contentContainerStyle={styles.ph20}>
        <View style={{ backgroundColor: colors.stepBackgroundColor, ...local.backupBox }}>
          <Icono testID="recuperationFileBackupIcon" name="card-account-details-outline" size={80} color={colors.primary} />
          <CText testID="recuperationFileDescription" type="B16" align="center" marginTop={20}>
            {String.backupFileDescription}
          </CText>
        </View>
      </KeyBoardAvoidWrapper>

      <View testID="recuperationFileFooter" style={styles.ph20}>
        <CAlert testID="recuperationFileWarning" status="warning" message={String.backupFileWarning} />
        <CButton
          testID="recuperationFileSaveButton"
          title={saving ? String.downloadingBackup : String.downloadBackup}
          onPress={initSaveQr}
          disabled={saving}
          frontIcon={
            saving ? (
              <ActivityIndicator testID="recuperationFileSaveLoading" size={20} color="#fff" />
            ) : (
              <Icono testID="recuperationFileSaveIcon" name="download-outline" size={20} color="#fff" />
            )
          }
          containerStyle={{marginVertical: 20}}
        />
      </View>
    </CSafeAreaView>
  );
}

const local = StyleSheet.create({
  backupBox: {
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center'
  }
});
