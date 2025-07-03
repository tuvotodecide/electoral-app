import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {JWT_KEY} from '../common/constants';
import {StackNav} from '../navigation/NavigationKey';
import store from '../redux/store';
import {clearWallet} from '../redux/action/walletAction';
import {clearAuth} from '../redux/slices/authSlice';
import {clearSession} from './Session';
import * as Keychain from 'react-native-keychain';
import {setBioFlag} from './BioFlag';

export async function logOut(navigation) {
  console.log('[logout] empezando…');
  await AsyncStorage.removeItem(JWT_KEY);

  delete axios.defaults.headers.common.Authorization;

  console.log('[logout] bundle biométrico borrado');

  store.dispatch(clearAuth());
  store.dispatch(clearWallet());
  await clearSession();

  navigation.reset({
    index: 0,
    routes: [{name: StackNav.AuthNavigation}],
  });
}
