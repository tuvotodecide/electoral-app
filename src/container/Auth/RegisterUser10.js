import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  InteractionManager,
} from 'react-native';
import React, {useEffect, useState} from 'react';
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

import {saveDraft, clearDraft} from '../../utils/RegisterDraft';
import {createSeedBundle, saveSecrets, signWithKey} from '../../utils/Cifrate';
import {
  approveGasToPaymaster,
  depositToEntryPoint,
  fundSmartAccount,
  predictWalletAddress,
  registerStreamAndGuardian,
} from '../../utils/walletRegister';
import {BACKEND, CHAIN, GAS_KEY} from '@env';
import {createPublicClient, http} from 'viem';
import {walletConfig} from '../../utils/constants';
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

  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     navigation.navigate(AuthNav.RegisterUser6);
  //   }, 5000);

  //   return () => clearTimeout(timeout);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  async function waitTx({chainKey, hash, setStage, label}) {
    setStage(label);
    const client = createPublicClient({
      chain: walletConfig[chainKey].chain,
      transport: http(),
    });

    const rcpt = await client.waitForTransactionReceipt({
      hash,
      confirmations: 1,
      pollingInterval: 3_000,
    });

    if (rcpt.status !== 'success') {
      throw new Error('La transacción fue revertida');
    }
    return rcpt;
  }

  useEffect(() => {
    const yieldUI = () => new Promise(r => setTimeout(r, 50));

    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        setStage('predict');
        await yieldUI();
        const bundle = await createSeedBundle(pin);

        if (!bundle.seedHex || bundle.seedHex.length !== 64) {
          throw new Error('seedHex inválido: ' + bundle.seedHex);
        }
        const privKey = '0x' + bundle.seedHex;
        const walletData = await predictWalletAddress(CHAIN, privKey);
        await saveDraft({step: 'fund', privKey, walletData, pin, dni, vc});
        const fundHash = await fundSmartAccount(
          CHAIN,
          walletData.address,
          GAS_KEY,
          '0.006',
        );
        await waitTx({
          chainKey: CHAIN,
          hash: fundHash,
          setStage,
          label: 'fund',
        });

        const depHash = await depositToEntryPoint(
          CHAIN,
          GAS_KEY,
          walletData.address,
          '0.006',
        );
        await waitTx({
          chainKey: CHAIN,
          hash: depHash,
          setStage,
          label: 'deposit',
        });
        await saveDraft({step: 'deposit', privKey, walletData, pin, dni, vc});
        setStage('store');
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
        const {guardianAddress} = await registerStreamAndGuardian(
          CHAIN,
          walletData.salt,
          privKey,
          dni,
          streamId,
        );
        console.log(guardianAddress);

        dispatch(
          setAddresses({
            account: walletData.address,
            guardian: guardianAddress,
          }),
        );

        await approveGasToPaymaster(walletData.address, privKey);

        setStage('save');

        await saveSecrets(
          pin.trim(),
          {
            streamId,
            dni,
            salt: walletData.salt.toString(),
            privKey,
            account: walletData.address,
            did: vc.credentialSubject.id,
          },
          useBiometry,
        );

        if (await getBioFlag()) {
          await Keychain.setGenericPassword(
            'bundle',
            JSON.stringify({
              streamId,
              dni,
              salt: walletData.salt.toString(),
              privKey,
              account: walletData.address,
              guardian: guardianAddress,
              jwt,
            }),
            {
              service: 'walletBundle',
              accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
              accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            },
          );
        }

        setStage('done');
        setLoading(false);
        await clearDraft();
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
  }, []);

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
    <CSafeAreaView>
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
