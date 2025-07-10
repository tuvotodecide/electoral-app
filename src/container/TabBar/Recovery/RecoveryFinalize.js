import axios from 'axios';
import {BACKEND} from '@env';

import {useDispatch} from 'react-redux';
import {getDeviceId} from '../../../utils/device-id';
import {startSession} from '../../../utils/Session';
import {setSecrets} from '../../../redux/action/walletAction';
import String from '../../../i18n/String';

import * as Keychain from 'react-native-keychain';
import {AuthNav, StackNav} from '../../../navigation/NavigationKey';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PENDINGRECOVERY} from '../../../common/constants';
import {useEffect} from 'react';
import {ActivityIndicator} from 'react-native-paper';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import {saveSecrets} from '../../../utils/Cifrate';
import { StyleSheet } from 'react-native';
import { styles } from '../../../themes';
export default function RecoveryFinalize({route, navigation}) {
  const dispatch = useDispatch();
  const {originalPin, reqId} = route.params;
  useEffect(() => {
    (async () => {
      const deviceId = await getDeviceId();

      const {data} = await axios.post(
        `${BACKEND}session/recover/guardian`,
        {deviceId, newPin: originalPin},
        {withCredentials: true},
      );
      if (!data.ok) {
        return;
      }
      console.log('y');

      await Keychain.setGenericPassword(
        'bundle',
        JSON.stringify({stored: {payloadQr: data.payload}, jwt: data.token}),
        {service: 'walletBundle'},
      );
      await saveSecrets(originalPin, data.payload, false);
      await AsyncStorage.setItem(PENDINGRECOVERY, 'false');
      dispatch(setSecrets(data.payload));
      await startSession(data.token);
      console.log('fdsak');

      navigation.navigate(AuthNav.LoginUser);
    })();
  }, []);

  return (
    <CSafeAreaView>
      <View style={localStyle.mainContainer}>
        <ActivityIndicator size="large" />
        <CText type="B16">{String.finishingRecovery}</CText>
      </View>
    </CSafeAreaView>
  );
}
const localStyle = StyleSheet.create({
  headerTextStyle: {
    ...styles.mt10,
  },
  mainContainer: {
    ...styles.ph20,
    ...styles.justifyBetween,
    ...styles.flex,
  },
});
