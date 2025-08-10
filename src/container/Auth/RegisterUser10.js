import {ActivityIndicator, Image, StyleSheet, View} from 'react-native';
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
import {createSeedBundle, saveSecrets, signWithKey} from '../../utils/Cifrate';
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
import {useKycRegisterQuery} from '../../data/kyc';
import {Wallet} from 'ethers';
import {setAddresses} from '../../redux/slices/addressSlice';
import {getPredictedGuardian} from '../../utils/getGuardian';
import {getBioFlag} from '../../utils/BioFlag';
import {startSession} from '../../utils/Session';

export default function RegisterUser10({navigation, route}) {
  const {vc, offerUrl, dni, originalPin: pin, useBiometry} = route.params;


  const colors = useSelector(state => state.theme.theme);
  const [loading, setLoading] = useState(true);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [stage, setStage] = useState('init');
  const watchdogRef = useRef(null);
  const dispatch = useDispatch();
  const {mutateAsync: registerStore} = useKycRegisterQuery();
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
          vc,
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

        setStage('store');
        await yieldUI();
        const sig = await signWithKey(privKey, vc.id);
        const authSig = {
          sig,
          signedMessage: vc.id,
          derivedVia: 'ethers.signMessage',
          address: new Wallet(privKey).address,
        };

        const predictedGuardian = await getPredictedGuardian(
          CHAIN,
          walletData.address,
          walletData.salt,
        );

        const {publicStreamId: streamId, jwt} = await withTimeout(
          registerStore({
            vc,
            authSig,
            accountAddress: walletData.address,
            guardianAddress: predictedGuardian,
            salt: walletData.salt.toString(),
            privKey,
          }),
          30000,
          'registerStore',
        );
        if (typeof jwt == 'string' && jwt.length) await startSession(jwt);
        await saveDraft({
          step: 'store',
          walletData,
          dni,
          vc,
          streamId,
        });
        setStage('guardian');
        await yieldUI();
        const {guardianAddress} = await withTimeout(
          registerStreamAndGuardian(
            CHAIN,
            walletData.salt,
            privKey,
            dni,
            streamId,
          ),
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
            streamId,
            dni,
            salt: walletData.salt.toString(),
            privKey,
            account: walletData.address,
            guardian: guardianAddress,
            did: vc.credentialSubject.id,
          },
          useBiometry,
          bundle,
          bundle.pinHash,
        );

        if (await getBioFlag()) {
          const storedPayload = {
            streamId,
            salt: walletData.salt.toString(),
            privKey,
            account: walletData.address,
            guardian: guardianAddress,
          };
          await Keychain.setGenericPassword(
            'bundle',
            JSON.stringify({
              stored: storedPayload,
              jwt,
            }),
            {
              service: 'walletBundle',
              accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
              accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            },
          );
        }
        await clearDraft();
        await clearTmpRegister();
        setStage('done');
        setLoading(false);
        navigation.replace(AuthNav.RegisterUser11, {
          offerUrl,
          account: walletData.address,
        });
      } catch (err) {
        console.log(err);
        setLoading(false);
        setErrorMessage(
          err?.message || 'Ocurrió un error al registrar tu cuenta.',
        );
        setErrorModalVisible(true);
      }
    })();
    return () => {}; 
  }, [pin, dni, vc, useBiometry, registerStore, navigation]);

  const stageMessage = {
    init: String.creatingWallet,
    predict: String.predictSmart,
    fund: String.fundAccount,
    deposit: String.depositGas,
    store: String.storeVC,
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
              vc,
              offerUrl,
              useBiometry,
              dni,
            });
          } else {
            navigation.replace(AuthNav.RegisterUser10, {
              vc,
              offerUrl,
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
