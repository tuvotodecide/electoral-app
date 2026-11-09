import {
  Alert,
  Platform,
  SectionList,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import React, {useState, useEffect} from 'react';

// custom imports
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import {SecuryData} from '../../../api/constant';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {useSelector} from 'react-redux';

import { Ionicons, Entypo } from '@expo/vector-icons';
import { VaultError } from '@privado-id/expo-sdk';

import { captureError } from '../../../config/sentry';
import { getPrivadoVault } from '../../../services/privado/privadoSession';
import { VaultUnlockCancelledError } from '../../../services/privado/vaultUnlock';
import {
  authenticateWithBiometrics,
  getBiometryStatus,
} from '../../../services/biometrics';

const showBiometryUnavailable = () =>
  Alert.alert('Biometría no disponible', 'Actívala en Ajustes del sistema');

/**
 * Activa la biometría del vault: guarda la clave del vault tras la biometría
 * (`vault.enableBiometrics()`, que pide desbloquear el vault si está
 * bloqueado). En Android ese guardado ya muestra el aviso biométrico del
 * sistema; en iOS no, así que allí se confirma antes con la huella o el rostro.
 * Desactivarla solo borra ese acceso: el PIN sigue funcionando.
 */
async function enableVaultBiometrics(vault) {
  const {hasHardware, enrolled, biometryType} = await getBiometryStatus();
  if (!hasHardware || !enrolled || !(await vault.canUseBiometrics())) {
    showBiometryUnavailable();
    return false;
  }
  if (Platform.OS === 'android') {
    await vault.enableBiometrics();
    return true;
  }
  const confirmation = await authenticateWithBiometrics(
    biometryType === 'face' ? 'Escanea tu rostro' : 'Escanea tu huella dactilar',
  );
  if (!confirmation.ok) {
    if (!confirmation.cancelled) {
      Alert.alert(
        'Biometría',
        'La autenticación falló. Inténtalo de nuevo.',
      );
    }
    return false;
  }
  await vault.enableBiometrics();
  return true;
}

export default function Security({navigation}) {
  const color = useSelector(state => state.theme.theme);

  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const vault = await getPrivadoVault();
        setBioEnabled(await vault.isBiometricsEnabled());
      } catch (err) {
        captureError(err, {flow: 'Security', step: 'readBioFlag', critical: false});
      }
    })();
  }, []);

  const toggleBio = async val => {
    if (bioBusy) return;
    setBioBusy(true);
    try {
      const vault = await getPrivadoVault();
      if (val) {
        setBioEnabled(await enableVaultBiometrics(vault));
      } else {
        await vault.disableBiometrics();
        setBioEnabled(false);
      }
    } catch (err) {
      const code = err?.code;
      if (err instanceof VaultError && code === 'BIOMETRICS_UNAVAILABLE') {
        showBiometryUnavailable();
      } else if (err instanceof VaultError && code === 'VAULT_NOT_CREATED') {
        Alert.alert(
          'Sin datos',
          'Crea tu cuenta/PIN antes de activar la biometría',
        );
      } else if (
        err instanceof VaultUnlockCancelledError ||
        (err instanceof VaultError && code === 'BIOMETRICS_CANCELLED')
      ) {
        // El usuario cerró el desbloqueo o el aviso biométrico: no cambia nada.
      } else {
        captureError(err, {
          flow: 'Security',
          step: 'toggleBio',
          critical: true,
          code,
        });
        Alert.alert('Error', err?.message || 'No se pudo cambiar la biometría');
      }
      setBioEnabled(await getPrivadoVault()
        .then(vault => vault.isBiometricsEnabled())
        .catch(() => false));
    } finally {
      setBioBusy(false);
    }
  };

  const onPressItem = item => {
    if (!!item.route) {
      navigation.navigate(item.route, {item: item});
    }
  };

  const RenderItem = ({item, index}) => {
    if (item.rightIcon === 'switch') {
      return (
        <View
          testID={`securitySwitchItem_${item.id || index}`}
          style={[
            localStyle.renderItemContainer,
            {borderColor: color.dark ? color.grayScale700 : color.grayScale200},
          ]}>
          <View testID="securityBiometricLabelContainer" style={styles.rowCenter}>
            <Entypo
              testID="securityBiometricIcon"
              name="fingerprint"
              size={moderateScale(20)}
              color={color.primary}
            />
            <CText testID="securityBiometricLabel" style={styles.ml10} type="B12">
              {item.title}
            </CText>
          </View>
          <Switch
            testID="securityBiometricSwitch"
            value={bioEnabled}
            disabled={bioBusy}
            onValueChange={toggleBio}
            trackColor={{
              false: color.grayScale300,
              true: color.primary,
            }}
            thumbColor={color.white}
            style={localStyle.switch}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        testID={`securityMenuItem_${item.id || index}`}
        disabled={item === String.darkMode}
        key={index}
        activeOpacity={item.rightIcon ? 1 : 0.5}
        onPress={() => onPressItem(item)}
        style={[
          localStyle.renderItemContainer,
          {
            borderColor: color.dark ? color.grayScale700 : color.grayScale200,
          },
        ]}>
        <View testID={`securityMenuItemContent_${item.id || index}`} style={styles.rowCenter}>
          <View
            testID={`securityMenuItemIconBackground_${item.id || index}`}
            style={[
              localStyle.iconBackground,
              {
                backgroundColor:
                  item?.id === 5 || item?.id === 6
                    ? color.primary
                    : color.inputBackground,
              },
            ]}>
            {item.icon ? (
              <Entypo
                testID={`securityMenuItemIcon_${item.id || index}`}
                name={item.icon}
                size={moderateScale(20)}
                color={color.dark ? color.grayScale500 : color.grayScale400}
              />
            ) : (
              <View testID={`securityMenuItemCustomIcon_${item.id || index}`}>{color.dark ? item.darkIcon : item.lightIcon}</View>
            )}
          </View>
          <View testID={`securityMenuItemTextContainer_${item.id || index}`} style={styles.ml10}>
            <CText testID={`securityMenuItemTitle_${item.id || index}`} type={'B12'}>{item.title}</CText>
            <CText testID={`securityMenuItemValue_${item.id || index}`} type={'R10'} color={color.grayScale500}>
              {item.value}
            </CText>
          </View>
        </View>

        <Ionicons
          testID={`securityMenuItemArrow_${item.id || index}`}
          name={'chevron-forward-outline'}
          size={moderateScale(24)}
          color={color.dark ? color.grayScale500 : color.grayScale400}
          style={styles.mr10}
        />
      </TouchableOpacity>
    );
  };

  return (
    <CSafeAreaView testID="securityContainer">
      <CHeader testID="securityHeader" title={String.settings} />
      <KeyBoardAvoidWrapper testID="securityKeyboardWrapper" contentContainerStyle={styles.ph20}>
        <SectionList
          testID="securitySectionList"
          sections={SecuryData}
          keyExtractor={(item, index) => item + index}
          renderItem={RenderItem}
          extraData={bioEnabled}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(200),
    width: moderateScale(200),
  },
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
  },
  btnStyle: {
    marginTop: 8,
  },
  renderItemContainer: {
    height: moderateScale(72),
    borderRadius: moderateScale(12),
    ...styles.rowSpaceBetween,
    ...styles.mv10,
    ...styles.ph10,
    borderWidth: moderateScale(1),
  },
  switch: {
    alignSelf: 'center'
  }
});
