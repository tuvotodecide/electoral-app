import {StyleSheet, View, Image} from 'react-native';
import React, {useEffect} from 'react';
import BootSplash from 'react-native-bootsplash';
import {useDispatch, useSelector} from 'react-redux';

// custom import
import CSafeAreaView from '../components/common/CSafeAreaView';
import {styles} from '../themes';
import CText from '../components/common/CText';
import String from '../i18n/String';
import {StackNav} from '../navigation/NavigationKey';
import {initialStorageValueGet} from '../utils/AsyncStorage';
import {changeThemeAction} from '../redux/action/themeAction';
import {colors} from '../themes/colors';
import images from '../assets/images';
import {moderateScale} from '../common/constants';
import {isSessionValid} from '../utils/Session';
import {TEST_CONFIG, testLog} from '../config/testConfig';
import {setupTestInterceptors} from '../config/testNetworkConfig';
import {enableTestMode} from '../config/testMode';

export default function AuthTest({navigation}) {
  const color = useSelector(state => state.theme.theme);
  const dispatch = useDispatch();

  useEffect(() => {
    const asyncProcess = async () => {
      try {
        // ========== CONFIGURAR MODO TEST ==========
        testLog('Iniciando modo test...');
        enableTestMode(); // Activar flag global de test
        setupTestInterceptors(); // Bloquear llamadas de red

        let asyncData = await initialStorageValueGet();
        let {themeColor, onBoardingValue} = asyncData;

        if (asyncData) {
          // Configurar tema
          if (themeColor) {
            if (themeColor === 'light') {
              dispatch(changeThemeAction(colors.light));
            } else {
              dispatch(changeThemeAction(colors.dark));
            }
          } else {
            // Si no hay tema guardado, usar light por defecto
            dispatch(changeThemeAction(colors.light));
          }

          // ========== SIMULACIÓN COMPLETA DEL FLUJO ORIGINAL ==========
          testLog('Iniciando simulación del flujo completo...');

          // Simular isSessionValid() - Puedes cambiar esto para probar diferentes escenarios
          testLog('Verificando sesión...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay de verificación

          // CONFIGURACIÓN: Cambia estos valores para probar diferentes flujos
          const simulateValidSession = false; // true = sesión válida, false = sin sesión
          const simulateOnboardingCompleted = true; // true = onboarding hecho, false = primera vez

          const alive = simulateValidSession;
          testLog('Sesión válida encontrada:', alive);

          if (alive) {
            testLog('Usuario ya autenticado (sesión válida)');
            testLog('Usuario simulado: test@wira.app');
            testLog('Navegando directamente a TabNavigation...');
            await new Promise(resolve => setTimeout(resolve, 500)); // Pequeño delay
            navigation.replace(StackNav.TabNavigation);
          } else {
            // Si no hay sesión válida, verificar onboarding
            testLog('No hay sesión válida, verificando onboarding...');
            if (onBoardingValue || simulateOnboardingCompleted) {
              testLog(
                'Onboarding completado, navegando a AuthNavigationTest para login simulado...',
              );
              // Usar AuthNavigationTest en lugar de AuthNavigation
              await new Promise(resolve => setTimeout(resolve, 500));
              navigation.replace('AuthNavigationTest');
            } else {
              testLog('Primera vez, navegando a OnBoarding...');
              await new Promise(resolve => setTimeout(resolve, 500));
              navigation.replace(StackNav.OnBoarding);
            }
          }
          return;

          // ========== CÓDIGO ORIGINAL (COMENTADO) ==========
          // Descomenta este bloque y comenta la simulación de arriba para usar el flujo real
          /*
          const alive = await isSessionValid();
          if (alive) {
            navigation.replace(StackNav.TabNavigation);
          } else if (onBoardingValue) {
            navigation.replace(StackNav.AuthNavigation);
          } else {
            navigation.replace(StackNav.OnBoarding);
          }
          */
        }
      } catch (e) {
        testLog('Error en proceso de auth:', e);
        // En caso de error, ir a autenticación real
        navigation.replace(StackNav.AuthNavigation);
      }
    };

    const init = async () => {
      await asyncProcess();
    };

    init().finally(async () => {
      await BootSplash.hide({fade: true});
    });
  }, [dispatch, navigation]);

  return (
    <CSafeAreaView
      style={{
        backgroundColor: color.backgroundColor,
        ...styles.center,
        ...styles.flexRow,
      }}>
      <View style={localStyle.imageContainer}>
        <Image source={images.logoImg} style={localStyle.imageStyle} />
      </View>
      <CText type={'B30'} style={localStyle.textStyle}>
        {String.wira}
      </CText>

      {/* Indicador de modo de prueba */}
      {TEST_CONFIG.SHOW_TEST_INDICATORS && (
        <View style={localStyle.testIndicator}>
          <CText type={'R12'} style={localStyle.testText}>
            Modo Test - Sesión Simulada
          </CText>
        </View>
      )}
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  textStyle: {
    ...styles.ml15,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(30),
    marginBottom: moderateScale(30),
  },
  imageStyle: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  testIndicator: {
    position: 'absolute',
    bottom: moderateScale(50),
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  testText: {
    color: '#F57C00',
    textAlign: 'center',
  },
});
