import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import * as Keychain from 'react-native-keychain';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import {getHeight, moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import {SHA256} from 'crypto-js';
import {useDispatch, useSelector} from 'react-redux';
import images from '../../assets/images';
import {AuthNav} from '../../navigation/NavigationKey';
import StepIndicator from '../../components/authComponents/StepIndicator';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';
import String from '../../i18n/String';
import InfoModal from '../../components/modal/InfoModal';

import {saveDraft, clearDraft, getDraft} from '../../utils/RegisterDraft';
import {createSeedBundle, saveSecrets} from '../../utils/Cifrate';
import {
  getTmpRegister,
  setTmpRegister,
  clearTmpRegister,
  getTmpPin,
  clearTmpPin,
} from '../../utils/TempRegister';
import {
  predictWalletAddress,
  registerStreamAndGuardian,
} from '../../utils/walletRegister';
import {CHAIN} from '@env';
import {setAddresses} from '../../redux/slices/addressSlice';
import {getPredictedGuardian} from '../../utils/getGuardian';
import {didFromEthAddress} from '../../api/did';
import {
  createCredential,
  mapOcrToClaims,
  waitForVC,
} from '../../utils/issuerClient';
import {encryptVCWithPin} from '../../utils/vcCrypto';

export default function RegisterUser10({navigation, route}) {
  const {ocrData, dni, originalPin: pin, useBiometry} = route.params;

  const colors = useSelector(state => state.theme.theme);
  const [loading, setLoading] = useState(true);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [stage, setStage] = useState('init');
  const watchdogRef = useRef(null);
  const dispatch = useDispatch();

  const startedRef = useRef(false);

  useEffect(() => {
    clearTimeout(watchdogRef.current);
    if (stage === 'done') return;
    watchdogRef.current = setTimeout(() => {
      setStage(s => (s !== 'done' ? 'stillWorking' : s));
    }, 30000);
    return () => clearTimeout(watchdogRef.current);
  }, [stage]);

  const withTimeout = useCallback(
    (promise, ms, label) =>
      Promise.race([
        promise,
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error(`${label} timeout (${ms}ms)`)), ms),
        ),
      ]),
    [],
  );

  useEffect(() => {
    (async () => {
      if (route.params?.fromDraft) {
        initRegister();
        return;
      }

      const draft = await getDraft();

      if (draft) {
        navigation.replace(AuthNav.RegisterUser10, {
          ...draft,
          fromDraft: true,
        });
        return;
      }

      initRegister();
    })();
  }, []);

  const initRegister = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      await new Promise(r => requestAnimationFrame(() => r()));
      await new Promise(r => requestAnimationFrame(() => r()));
      try {
        const yieldUI = () => new Promise(r => setTimeout(r, 50));
        setStage('predict');
        await yieldUI();

        await saveDraft({
          step: 'predict',
          dni,
          useBiometry,
        });
        let bundle = await getTmpRegister();
        if (!bundle) {
          let workingPin = pin;
          if (!workingPin) {
            workingPin = await getTmpPin();
          }
          if (!workingPin || `${workingPin}`.length === 0) {
            throw new Error('PIN no disponible para iniciar registro');
          }
          bundle = await createSeedBundle(workingPin);

          if (!bundle.seedHex || bundle.seedHex.length !== 64) {
            throw new Error('seedHex inválido: ' + bundle.seedHex);
          }

          const pinHash = SHA256((workingPin || '').trim()).toString();
          await setTmpRegister({...bundle, pinHash});
          bundle.pinHash = pinHash;

          await clearTmpPin();
        } else if (!bundle.pinHash) {
          if (pin && `${pin}`.length) {
            bundle.pinHash = SHA256(pin.trim()).toString();
            await setTmpRegister({...bundle});
          } else {
            const workingPin = await getTmpPin();
            if (workingPin && `${workingPin}`.length) {
              bundle.pinHash = SHA256(workingPin.trim()).toString();
              await setTmpRegister({...bundle});
              await clearTmpPin();
            } else {
              throw new Error(
                'No hay PIN disponible para finalizar el registro.',
              );
            }
          }
        }

        const privKey = '0x' + bundle.seedHex;
        const walletData = await predictWalletAddress(CHAIN, privKey);

        const {did: subjectDid} = didFromEthAddress(walletData.address);
        setStage('issueVC');
        await yieldUI();
        const claims = mapOcrToClaims(ocrData);
        const {id: credentialId} = await createCredential(subjectDid, claims);
        const vc = await waitForVC(credentialId);
        if (
          vc?.credentialSubject?.id &&
          vc.credentialSubject.id !== subjectDid
        ) {
          throw new Error('El VC devuelto no corresponde al DID del usuario.');
        }

        const vcCipher = await encryptVCWithPin(vc, pin || '');

        const predictedGuardian = await getPredictedGuardian(
          CHAIN,
          walletData.address,
          walletData.salt,
        );

        setStage('guardian');
        await yieldUI();
        const {guardianAddress} = await withTimeout(
          registerStreamAndGuardian(CHAIN, walletData.salt, privKey, dni),
          90000,
          'registerStreamAndGuardian',
        );

        dispatch(
          setAddresses({
            account: walletData.address,
            guardian: guardianAddress,
          }),
        );

        setStage('save');
        await yieldUI();

        await saveSecrets(
          pin || '',
          {
            dni,
            salt: walletData.salt.toString(),
            privKey,
            account: walletData.address,
            guardian: guardianAddress,
            did: subjectDid,
            vcCipher,
          },
          useBiometry,
          bundle,
          bundle.pinHash,
        );

        if (useBiometry) {
          const storedPayload = {
            dni,
            salt: walletData.salt.toString(),
            privKey,
            account: walletData.address,
            guardian: guardianAddress,
            did: subjectDid,
            vcCipher, // importante: así el login con huella no pide pin
          };

          await Keychain.setGenericPassword(
            'bundle',
            JSON.stringify({stored: storedPayload}),
            {
              service: 'walletBundle',
              accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
              accessControl:
                Platform.OS === 'ios'
                  ? Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET
                  : Keychain.ACCESS_CONTROL.BIOMETRY_STRONG,
              securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
            },
          );

          await setBioFlag(true);
        }
        await clearDraft();
        await clearTmpRegister();
        setStage('done');
        setLoading(false);
        navigation.replace(AuthNav.RegisterUser11, {
          account: walletData.address,
        });
      } catch (err) {
        setLoading(false);
        setErrorMessage(
          err?.message || 'Ocurrió un error al registrar tu cuenta.',
        );
        setErrorModalVisible(true);
      }
    })();
    return () => {};
  }, [pin, dni, useBiometry, navigation]);

  const stageMessage = {
    init: String.creatingWallet,
    predict: String.predictSmart,
    fund: String.fundAccount,
    deposit: String.depositGas,
    issueVC: 'Solicitando credencial…',
    guardian: 'Creando guardian…',
    save: String.saveData,
    done: String.doneRegister,
    stillWorking: 'Aún trabajando… Esto puede tardar en tu dispositivo.',
  }[stage];

  return (
    <CSafeAreaViewAuth style={localStyle.root}>
      <StepIndicator step={10} />
      <View style={localStyle.center}>
        <View style={localStyle.mainContainer}>
          <Image
            source={
              colors.dark
                ? images.IdentityCardImage
                : images.IdentityCard_lightImage
            }
            style={localStyle.imageContainer}
          />
          <CText type={'B20'} style={styles.boldText} align={'center'}>
            {stageMessage}
          </CText>
          <CText
            type={'B16'}
            color={getSecondaryTextColor(colors)}
            align={'center'}>
            {String.verifyingIdentityMessage}
          </CText>
          {loading && (
            <ActivityIndicator
              size={60}
              color={colors.grayScale500}
              style={localStyle.marginTop}
            />
          )}
        </View>
      </View>
      <InfoModal
        visible={errorModalVisible}
        title="Registro fallido"
        message={errorMessage}
        buttonText="Reintentar"
        onClose={() => {
          setErrorModalVisible(false);
          if (
            errorMessage?.includes('PIN no disponible') ||
            errorMessage?.includes('No hay PIN disponible')
          ) {
            navigation.replace(AuthNav.RegisterUser8, {
              ocrData,
              useBiometry,
              dni,
            });
          } else {
            navigation.replace(AuthNav.RegisterUser10, {
              ocrData,
              dni,
              originalPin: pin,
              useBiometry,
            });
          }
        }}
      />
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    ...styles.ph20,
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  btnStyle: {
    ...styles.selfCenter,
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
  marginTop: {
    marginTop: moderateScale(20),
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
