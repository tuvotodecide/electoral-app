import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  InteractionManager,
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import Keychain from 'react-native-keychain';

// custom import
import CSafeAreaView from '../../components/common/CSafeAreaView';
import {getHeight, JWT_KEY, moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
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
  predictWalletAddress,
  registerStreamAndGuardian,
} from '../../utils/walletRegister';
import {CHAIN} from '@env';
import {useKycRegisterQuery} from '../../data/kyc';
import {Wallet} from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {setAddresses} from '../../redux/slices/addressSlice';
import {getPredictedGuardian} from '../../utils/getGuardian';
import {getBioFlag} from '../../utils/BioFlag';

export default function RegisterUser10({navigation, route}) {
  const {vc, offerUrl, dni, originalPin: pin, useBiometry} = route.params;

  const colors = useSelector(state => state.theme.theme);
  const [loading, setLoading] = useState(true);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [stage, setStage] = useState('init');
  const dispatch = useDispatch();
  const {mutateAsync: registerStore} = useKycRegisterQuery();
  const startedRef = useRef(false);
  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     navigation.navigate(AuthNav.RegisterUser6);
  //   }, 5000);

  //   return () => clearTimeout(timeout);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
    (async () => {
      // Si ya vengo usando un draft, simplemente continúo
      if (route.params?.fromDraft) {
        initRegister();
        return;
      }

      const draft = await getDraft();

      if (draft) {
        // Me reemplazo a mí mismo con los datos y la marca
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

    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const yieldUI = () => new Promise(r => setTimeout(r, 50));
        setStage('predict');
        await yieldUI();

        await saveDraft({
          step: 'predict',
          pin,
          dni,
          vc,
          originalPin: pin,
          useBiometry,
        });
        const bundle = await createSeedBundle(pin);

        if (!bundle.seedHex || bundle.seedHex.length !== 64) {
          throw new Error('seedHex inválido: ' + bundle.seedHex);
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

        const {publicStreamId: streamId, jwt} = await registerStore({
          vc,
          authSig,
          accountAddress: walletData.address,
          guardianAddress: predictedGuardian,
          salt: walletData.salt.toString(),
          privKey,
        });
        if (jwt) await AsyncStorage.setItem(JWT_KEY, jwt);
        await saveDraft({
          step: 'store',
          privKey,
          walletData,
          pin,
          dni,
          vc,
          streamId,
        });
        setStage('guardian');
        await yieldUI();
        const {guardianAddress} = await registerStreamAndGuardian(
          CHAIN,
          walletData.salt,
          privKey,
          dni,
          streamId,
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
          pin,
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
        );

        // await saveIdentity(
        //   {
        //     streamId,
        //     dni,
        //     salt: walletData.salt.toString(),
        //     privKey,
        //     account: walletData.address,
        //     did: vc.credentialSubject.id,
        //   },
        //   pin.trim(),
        //   useBiometry,
        // );
        const storedPayload = {
          streamId,
          dni,
          salt: walletData.salt.toString(),
          privKey,
          account: walletData.address,
          guardian: guardianAddress,
        };
        if (await getBioFlag()) {
          await Keychain.setGenericPassword(
            'bundle',
            JSON.stringify({stored: storedPayload, jwt}),
            {
              service: 'walletBundle',
              accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
              accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            },
          );
        }
        await clearDraft();
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
    });
    return () => task?.cancel();
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
  }[stage];

  return (
    <CSafeAreaView style={localStyle.root}>
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
        title="Verificación fallida"
        message={errorMessage}
        buttonText="Reintentar"
        onClose={() => {
          setErrorModalVisible(false);
          navigation.navigate(AuthNav.RegisterUser10, {
            vc,
            offerUrl,
            dni,
            originalPin: pin,
            useBiometry,
          });
        }}
      />
    </CSafeAreaView>
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
