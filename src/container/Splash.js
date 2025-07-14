import {StyleSheet, View, Image} from 'react-native';
import React, {useEffect} from 'react';
import BootSplash from 'react-native-bootsplash';
import {useDispatch, useSelector} from 'react-redux';

// custom import
import CSafeAreaView from '../components/common/CSafeAreaView';
import {styles} from '../themes';
import CText from '../components/common/CText';
import String from '../i18n/String';
import {AuthNav, StackNav} from '../navigation/NavigationKey';
import {initialStorageValueGet} from '../utils/AsyncStorage';
import {changeThemeAction} from '../redux/action/themeAction';
import {colors} from '../themes/colors';
import images from '../assets/images';
import {moderateScale, PENDINGRECOVERY} from '../common/constants';
import {isSessionValid} from '../utils/Session';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {getDraft} from '../utils/RegisterDraft';

export default function Splash({navigation}) {
  const color = useSelector(state => state.theme.theme);
  const wallet = useSelector(s => s.wallet.payload);
  const account = useSelector(state => state.account);
  const userData = useSelector(state => state.wallet.payload);

  const dispatch = useDispatch();

  useEffect(() => {
    const asyncProcess = async () => {
      try {
        let asyncData = await initialStorageValueGet();
        let {themeColor, onBoardingValue} = asyncData;
        const draft = await getDraft();
        if (draft) {
          navigation.replace(StackNav.AuthNavigation, {
            screen: AuthNav.RegisterUser10,
            params: draft,
          });
          return;
        }
        if (!!asyncData) {
          if (!!themeColor) {
            if (themeColor === 'light') {
              dispatch(changeThemeAction(colors.light));
            } else {
              dispatch(changeThemeAction(colors.dark));
            }
          } else {
            // Si no hay tema guardado, usar light por defecto
            dispatch(changeThemeAction(colors.light));
          }
          const pending = await AsyncStorage.getItem(PENDINGRECOVERY);

          if (pending === 'true') {
            console.log(pending);
            navigation.navigate(StackNav.AuthNavigation, {
              screen: AuthNav.MyGuardiansStatus,
            });
            return;
          }
          // const alive = await isSessionValid();

          // if (alive) navigation.replace(StackNav.TabNavigation);
          // else navigation.replace(StackNav.AuthNavigation);

          const alive = await isSessionValid();
          if (alive) navigation.replace(StackNav.TabNavigation);
          else
            navigation.replace(StackNav.AuthNavigation, {
              screen: AuthNav.LoginUser, 
            });
        }
      } catch (e) {
        console.log('error ', e);
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
});
