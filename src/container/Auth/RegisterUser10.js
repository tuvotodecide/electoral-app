import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import {getHeight, moderateScale} from '../../common/constants';
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
import {CHAIN} from '@env';
import {setAddresses} from '../../redux/slices/addressSlice';
import {
  normalizeOcrForUI,
} from '../../utils/issuerClient';
import wira from 'wira-sdk';
import {BACKEND_IDENTITY, BUNDLER, SPONSORSHIP_POLICY, CRED_TYPE, CRED_EXP_DAYS, PROVIDER_NAME} from '@env';

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
          ocrData: draft.ocrData ?? route.params?.ocrData ?? null,
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
          originalPin: pin,
          ocrData: normalizeOcrForUI(ocrData),
        });

        const registerer = new wira.Registerer(
          BACKEND_IDENTITY,
          BUNDLER,
        );

        await registerer.createVC(
          CHAIN,
          ocrData,
          CRED_TYPE,
          CRED_EXP_DAYS
        );

        setStage('guardian');
        await yieldUI();
        const {guardianAddress} = await withTimeout(
          registerer.createWallet(dni),
          90000,
          'registerStreamAndGuardian',
        );

        dispatch(
          setAddresses({
            account: registerer.walletData.address,
            guardian: guardianAddress,
          }),
        );

        setStage('save');
        await yieldUI();
        await registerer.storeOnDevice(PROVIDER_NAME, pin, useBiometry);
        if(useBiometry) {
          await wira.Biometric.setBioFlag(true);
        }

        const response = await registerer.storeDataOnServer();
        if (!response.ok) {
          throw new Error(
            `Error al registrar tu cuenta.`,
          );
        }
        
        await clearDraft();
        setStage('done');
        setLoading(false);
        navigation.replace(AuthNav.RegisterUser11, {
          account: registerer.walletData.address,
        });
      } catch (err) {
        console.error(err);
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
