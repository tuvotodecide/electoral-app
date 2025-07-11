// import React, {useEffect, useRef, useState} from 'react';
// import {
//   Image,
//   StyleSheet,
//   View,
//   ActivityIndicator,
//   Dimensions,
// } from 'react-native';
// import {useDispatch, useSelector} from 'react-redux';
// import OTPInputView from '@twotalltotems/react-native-otp-input';
// import Keychain from 'react-native-keychain';
// // Custom imports
// import CSafeAreaView from '../../components/common/CSafeAreaView';
// import CHeader from '../../components/common/CHeader';
// import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
// import CText from '../../components/common/CText';
// import {styles} from '../../themes';
// import {JWT_KEY, moderateScale} from '../../common/constants';
// import typography from '../../themes/typography';
// import {StackNav} from '../../navigation/NavigationKey';
// import images from '../../assets/images';

// import String from '../../i18n/String';
// import {checkPin, getSecrets} from '../../utils/Cifrate';
// import {clearWallet, setSecrets} from '../../redux/action/walletAction';
// import {clearSession, startSession} from '../../utils/Session';
// import InfoModal from '../../components/modal/InfoModal';
// import {incAttempts, isLocked, resetAttempts} from '../../utils/PinAttempts';
// import {buildSiweAuthSig} from '../../utils/siweRn';
// import {BACKEND} from '@env';
// import axios from 'axios';
// import {setAddresses} from '../../redux/slices/addressSlice';
// import {
//   clearAuth,
//   setAuthenticated,
//   setPendingNav,
// } from '../../redux/slices/authSlice';
// import store from '../../redux/store';
// import {navigate} from '../../navigation/RootNavigation';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {biometricLogin, biometryAvailability} from '../../utils/Biometry';
// import {getBioFlag} from '../../utils/BioFlag';

// export default function LoginUser({navigation}) {
//   const colors = useSelector(state => state.theme.theme);
//   const [otp, setOtp] = useState('');
//   const dispatch = useDispatch();
//   const [attempts, setAttempts] = useState(0);
//   const bioUnlocked = useRef(false);
//   const [showError, setShowError] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [modal, setModal] = useState({visible: false, msg: ''});

//   const otpRef = useRef(null);

//   const toastError = msg => setModal({visible: true, msg});

//   async function unlock(payload, jwt) {
//     dispatch(setSecrets(payload));

//     dispatch(
//       setAddresses({
//         account: payload.account,
//         guardian: payload.guardian ?? null,
//       }),
//     );
//     dispatch(setAuthenticated(true));

//     await resetAttempts();
//     await startSession(jwt);
//     const pending = store.getState().auth.pendingNav;

//     if (pending) {
//       navigate(pending.name, pending.params);
//       dispatch(setPendingNav(null));
//     } else {
//       navigation.reset({index: 0, routes: [{name: StackNav.TabNavigation}]});
//     }
//   }

//   async function verifyPin(code) {
//     if (!(await checkPin(code))) return false;
//     const stored = await getSecrets();
//     if (!stored) return false;
//     console.log(stored);

//     const {streamId, privKey} = stored.payloadQr;

//     const load = await axios.post(
//       `${BACKEND}kyc/load`,
//       {streamId},
//       {withCredentials: true},
//     );
//     if (!load.data.ok) throw new Error(load.data.error);

//     const {dataHash} = load.data.data;

//     const authSig = await buildSiweAuthSig(privKey, dataHash);

//     const dec = await axios.post(
//       `${BACKEND}kyc/decrypt`,
//       {streamId, authSig},
//       {withCredentials: true},
//     );
//     if (!dec.data.ok) throw new Error(dec.data.error);

//     const {vc, jwt} = dec.data;

//     await unlock({...stored.payloadQr, vc}, jwt);
//     return true;
//   }

//   const onCodeFilled = async code => {
//     if (code.length !== 4) return;

//     if (await isLocked()) {
//       setModal({
//         visible: true,
//         msg:
//           'Has agotado tus 5 intentos.\n' +
//           'Recupera tu cuenta con tus guardianes.',
//       });
//       return;
//     }

//     setLoading(true);
//     const ok = await verifyPin(code.trim());
//     setLoading(false);

//     if (!ok) {
//       const n = await incAttempts();
//       setOtp('');
//       setModal({
//         visible: true,
//         msg:
//           n >= 5
//             ? 'Has agotado tus 5 intentos.\nRecupera tu cuenta con tus guardianes.'
//             : `PIN incorrecto.\nTe quedan ${5 - n} intentos.`,
//       });
//       if (n >= 5) {
//         await clearSession();
//         dispatch(clearWallet());
//         dispatch(clearAuth());
//       }
//     }
//   };

//   useEffect(() => {
//     (async () => {
//       if (await isLocked()) {
//         setModal({
//           visible: true,
//           msg:
//             'Has agotado tus 5 intentos.\n' +
//             'Recupera tu cuenta con tus guardianes.',
//         });
//       }
//     })();
//     const t = setTimeout(() => otpRef.current?.focusField(0), 350);
//     return () => clearTimeout(t);
//   }, []);

//   useEffect(() => {
//     (async () => {
//       console.log('[Login] comprobando biomet. habilitada…');
//       const enabled = await getBioFlag();
//       if (!enabled) {
//         console.log('[Login] flag desactivado');
//         return;
//       }

//       const {available, biometryType} = await biometryAvailability();
//       console.log('[Login] HW disponible?', available, biometryType);
//       if (!available || !biometryType) return;

//       const ok = await biometricLogin(
//         biometryType === 'FaceID'
//           ? 'Escanea tu rostro'
//           : 'Escanea tu huella dactilar',
//       );
//       console.log('[Login] resultado biometría →', ok);
//       if (!ok) return;

//       bioUnlocked.current = true;
//       setLoading(true);
//       try {
//         const creds = await Keychain.getGenericPassword({
//           service: 'walletBundle',
//         });
//         console.log('[Login] bundle leído?', !!creds);
//         if (!creds) {
//           setLoading(false);
//           return;
//         }

//         const {stored, jwt} = JSON.parse(creds.password);
//         console.log(
//           '[Login] stored dentro del bundle?',
//           !!stored,
//           'jwt?',
//           !!jwt,
//         );

//         await unlock(stored.payloadQr ?? stored, jwt);
//         // → si unlock navega, no necesitamos setLoading(false) aquí
//       } catch (err) {

//         setLoading(false);
//       }
//     })();
//   }, []);

//   return (
//     <CSafeAreaView>
//       <View
//         style={[localStyle.ovalBackground, {backgroundColor: colors.primary}]}
//       />

//       <CHeader color={colors.white} />
//       <View style={localStyle.imageContainer}>
//         <Image source={images.logoImg} style={localStyle.imageStyle} />
//       </View>
//       <KeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
//         <View style={localStyle.mainContainer}>
//           <View>
//             <CText
//               type={'B24'}
//               style={localStyle.headerTextStyle}
//               align={'center'}>
//               {String.login}
//             </CText>

//             <OTPInputView
//               pinCount={4}
//               style={localStyle.otpInputViewStyle}
//               code={otp}
//               onCodeChanged={setOtp}
//               onCodeFilled={onCodeFilled}
//               secureTextEntry={true}
//               editable
//               keyboardAppearance={'dark'}
//               placeholderTextColor={colors.textColor}
//               autoFocusOnLoad={false}
//               ref={otpRef}
//               codeInputFieldStyle={[
//                 localStyle.underlineStyleBase,
//                 {
//                   backgroundColor: colors.inputBackground,
//                   color: colors.textColor,
//                   borderColor: colors.grayScale500,
//                 },
//               ]}
//               codeInputHighlightStyle={{borderColor: colors.primary}}
//             />
//           </View>
//         </View>
//       </KeyBoardAvoidWrapper>

//       {loading && (
//         <View style={localStyle.loadingOverlay}>
//           <ActivityIndicator size="large" color={colors.white} />
//           <CText type="B16" color={colors.white} style={styles.mt10}>
//             {String.loading}
//           </CText>
//         </View>
//       )}
//       <InfoModal
//         visible={modal.visible}
//         title={String.walletAccess}
//         message={modal.msg}
//         buttonText={String.understand}
//         onClose={() => setModal({visible: false, msg: ''})}
//       />
//     </CSafeAreaView>
//   );
// }

// const {width, height} = Dimensions.get('window');

// const localStyle = StyleSheet.create({
//   headerTextStyle: {
//     ...styles.mt10,
//     ...styles.mb10,
//   },
//   mainContainer: {
//     ...styles.ph20,
//     ...styles.justifyBetween,
//     ...styles.flex,
//   },
//   otpInputViewStyle: {
//     ...styles.selfCenter,
//     height: '20%',
//     ...styles.mt30,
//   },
//   underlineStyleBase: {
//     width: moderateScale(50),
//     height: moderateScale(50),
//     borderWidth: moderateScale(1),
//     borderRadius: moderateScale(10),
//     ...typography.fontWeights.Bold,
//     ...typography.fontSizes.f26,
//     ...styles.mh5,
//   },
//   imageContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: moderateScale(20),
//   },
//   imageStyle: {
//     width: 100,
//     height: 100,
//     resizeMode: 'contain',
//   },
//   loadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     width,
//     height,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 100,
//   },
//   ovalBackground: {
//     position: 'absolute',
//     top: -height * 0.45,
//     left: -width * 0.25,
//     width: width * 1.5,
//     height: height * 0.6,
//     borderRadius: height,
//     zIndex: 0,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 6,
//   },
// });
import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  StyleSheet,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import Keychain from 'react-native-keychain';
// Custom imports
import CSafeAreaView from '../../components/common/CSafeAreaView';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import {JWT_KEY, moderateScale} from '../../common/constants';
import typography from '../../themes/typography';
import {AuthNav, StackNav} from '../../navigation/NavigationKey';
import images from '../../assets/images';

import String from '../../i18n/String';
import {checkPin, getSecrets} from '../../utils/Cifrate';
import {clearWallet, setSecrets} from '../../redux/action/walletAction';
import {clearSession, startSession} from '../../utils/Session';
import InfoModal from '../../components/modal/InfoModal';
import {incAttempts, isLocked, resetAttempts} from '../../utils/PinAttempts';
import {buildSiweAuthSig} from '../../utils/siweRn';
import {BACKEND} from '@env';
import axios from 'axios';
import {setAddresses} from '../../redux/slices/addressSlice';
import {
  clearAuth,
  setAuthenticated,
  setPendingNav,
} from '../../redux/slices/authSlice';
import store from '../../redux/store';
import {navigate} from '../../navigation/RootNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {biometricLogin, biometryAvailability} from '../../utils/Biometry';
import {getBioFlag} from '../../utils/BioFlag';
import CButton from '../../components/common/CButton';
import {commonColor} from '../../themes/colors';

export default function LoginUser({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');
  const [locked, setLocked] = useState(null);
  const dispatch = useDispatch();
  const bioUnlocked = useRef(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({visible: false, msg: ''});

  const otpRef = useRef(null);

  const toastError = msg => setModal({visible: true, msg});

  async function unlock(payload, jwt) {
    dispatch(setSecrets(payload));

    dispatch(
      setAddresses({
        account: payload.account,
        guardian: payload.guardian ?? null,
      }),
    );
    dispatch(setAuthenticated(true));

    await resetAttempts();
    await startSession(jwt);
    const pending = store.getState().auth.pendingNav;

    if (pending) {
      navigate(pending.name, pending.params);
      dispatch(setPendingNav(null));
    } else {
      navigation.reset({index: 0, routes: [{name: StackNav.TabNavigation}]});
    }
  }

  const onPressLoginUser1 = () => {
    navigation.navigate(AuthNav.SelectRecuperation);
  };

  async function verifyPin(code) {
    if (!(await checkPin(code))) return false;
    const stored = await getSecrets();
    if (!stored) return false;

    const {streamId, privKey} = stored.payloadQr;

    const load = await axios.post(
      `${BACKEND}kyc/load`,
      {streamId},
      {withCredentials: true},
    );
    if (!load.data.ok) throw new Error(load.data.error);

    const {dataHash} = load.data.data;

    const authSig = await buildSiweAuthSig(privKey, dataHash);

    const dec = await axios.post(
      `${BACKEND}kyc/decrypt`,
      {streamId, authSig},
      {withCredentials: true},
    );
    if (!dec.data.ok) throw new Error(dec.data.error);

    const {vc, jwt} = dec.data;

    await unlock({...stored.payloadQr, vc}, jwt);
    return true;
  }

  const onCodeFilled = async code => {
    if (code.length !== 4) return;

    if (await isLocked()) {
      setModal({
        visible: true,
        msg:
          'Has agotado tus 5 intentos.\n' +
          'Recupera tu cuenta con tus guardianes.',
      });
      return;
    }

    setLoading(true);
    const ok = await verifyPin(code.trim());
    setLoading(false);

    if (!ok) {
      const n = await incAttempts();
      setOtp('');
      setModal({
        visible: true,
        msg:
          n >= 5
            ? 'Has agotado tus 5 intentos.\nRecupera tu cuenta con tus guardianes.'
            : `PIN incorrecto.\nTe quedan ${5 - n} intentos.`,
      });
      if (n >= 5) {
        await clearSession();
        dispatch(clearWallet());
        dispatch(clearAuth());
      }
    }
  };

  useEffect(() => {
    (async () => {
      const blocked = await isLocked();
      setLocked(blocked);
      if (blocked) {
        navigation.replace(AuthNav.AccountLock);
      }
    })();
  }, []);

  useEffect(() => {
    if (locked === false) {
      const t = setTimeout(() => otpRef.current?.focusField(0), 350);
      return () => clearTimeout(t);
    }
  }, [locked]);

  useEffect(() => {
    (async () => {
      const enabled = await getBioFlag();
      if (!enabled) {
        return;
      }

      const {available, biometryType} = await biometryAvailability();

      if (!available || !biometryType) return;

      const ok = await biometricLogin(
        biometryType === 'FaceID'
          ? 'Escanea tu rostro'
          : 'Escanea tu huella dactilar',
      );

      if (!ok) return;

      bioUnlocked.current = true;
      setLoading(true);
      try {
        const creds = await Keychain.getGenericPassword({
          service: 'walletBundle',
        });

        if (!creds) {
          setLoading(false);
          return;
        }

        const {stored, jwt} = JSON.parse(creds.password);

        await unlock(stored.payloadQr ?? stored, jwt);
      } catch (err) {
        setLoading(false);
      }
    })();
  }, []);

  if (locked === null) {
    return (
      <View style={localStyle.loadingOverlay}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  return (
    <CSafeAreaView>
      <View
        style={[localStyle.ovalBackground, {backgroundColor: colors.primary}]}
      />

      <CHeader color={colors.white} />
      <View style={localStyle.imageContainer}>
        <Image source={images.logoImg} style={localStyle.imageStyle} />
      </View>
      <KeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={localStyle.mainContainer}>
          <View>
            <CText
              type={'B24'}
              style={localStyle.headerTextStyle}
              align={'center'}>
              {String.login}
            </CText>

            <OTPInputView
              pinCount={4}
              style={localStyle.otpInputViewStyle}
              code={otp}
              onCodeChanged={setOtp}
              onCodeFilled={onCodeFilled}
              secureTextEntry={true}
              editable={!locked}
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocusOnLoad={false}
              ref={otpRef}
              codeInputFieldStyle={[
                localStyle.underlineStyleBase,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textColor,
                  borderColor: colors.grayScale500,
                },
              ]}
              codeInputHighlightStyle={{borderColor: colors.primary}}
            />
          </View>
        </View>
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomButtons}>
        <CButton
          onPress={onPressLoginUser1}
          title={String.connectBtnForgot}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          color={colors.white}
          bgColor={commonColor.gradient2}
        />
      </View>
      {loading && (
        <View style={localStyle.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
          <CText type="B16" color={colors.white} style={styles.mt10}>
            {String.loading}
          </CText>
        </View>
      )}
      <InfoModal
        visible={modal.visible}
        title={String.walletAccess}
        message={modal.msg}
        buttonText={String.understand}
        onClose={() => setModal({visible: false, msg: ''})}
      />
    </CSafeAreaView>
  );
}

const {width, height} = Dimensions.get('window');

const localStyle = StyleSheet.create({
  bottomButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(16),
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTextStyle: {
    ...styles.mt10,
    ...styles.mb10,
  },
  mainContainer: {
    ...styles.ph20,
    ...styles.justifyBetween,
    ...styles.flex,
  },
  otpInputViewStyle: {
    ...styles.selfCenter,
    height: '20%',
    ...styles.mt30,
  },
  underlineStyleBase: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(10),
    ...typography.fontWeights.Bold,
    ...typography.fontSizes.f26,
    ...styles.mh5,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(20),
  },
  imageStyle: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  ovalBackground: {
    position: 'absolute',
    top: -height * 0.45,
    left: -width * 0.25,
    width: width * 1.5,
    height: height * 0.6,
    borderRadius: height,
    zIndex: 0,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.26,
    shadowRadius: 3.5,
  },
});
