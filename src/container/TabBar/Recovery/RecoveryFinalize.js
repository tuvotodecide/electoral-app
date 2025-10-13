import {useDispatch} from 'react-redux';
import {startSession} from '../../../utils/Session';
import {setSecrets} from '../../../redux/action/walletAction';
import String from '../../../i18n/String';

import {AuthNav} from '../../../navigation/NavigationKey';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GUARDIAN_RECOVERY_DNI, PENDINGRECOVERY} from '../../../common/constants';
import {useEffect} from 'react';
import {ActivityIndicator} from 'react-native-paper';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import {StyleSheet, View} from 'react-native';
import {styles} from '../../../themes';
import {PROVIDER_NAME} from '@env';
import wira from 'wira-sdk';


import {useNavigationLogger} from '../../../hooks/useNavigationLogger';
export default function RecoveryFinalize({route, navigation}) {
  const dispatch = useDispatch();
  const {originalPin, recData} = route.params;
  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('RecoveryFinalize', true);
  useEffect(() => {
    (async () => {
      try {
        const data = JSON.parse(recData);
        await (new wira.RecoveryService()).saveRecoveryDataFromGuardians(data, originalPin, PROVIDER_NAME)
        await AsyncStorage.removeItem(GUARDIAN_RECOVERY_DNI);
        await AsyncStorage.setItem(PENDINGRECOVERY, 'false');
        dispatch(setSecrets(data));
        await startSession(null);
        navigation.navigate(AuthNav.LoginUser);
      } catch (error) {
        //console.log('Recovery finalization error:', error);
        navigation.replace(AuthNav.SelectRecuperation);
      }
    })();
  }, []);

  return (
    <CSafeAreaView>
      <View style={localStyle.mainContainer}>
        <ActivityIndicator size="large" />
        <CText type="B16" style={localStyle.message}>
          {String.finishingRecovery}
        </CText>
      </View>
    </CSafeAreaView>
  );
}
const localStyle = StyleSheet.create({
  headerTextStyle: {
    ...styles.mt10,
  },
  mainContainer: {
    ...styles.flex,
    ...styles.ph20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: 12,
  },
});
