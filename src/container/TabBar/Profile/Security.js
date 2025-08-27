import {
  Alert,
  Platform,
  SectionList,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import React, {useState, useEffect} from 'react';

// custom imports
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../themes';
import {JWT_KEY, moderateScale} from '../../../common/constants';
import CText from '../../../components/common/CText';
import {StackNav} from '../../../navigation/NavigationKey';
import String from '../../../i18n/String';
import {SecuryData} from '../../../api/constant';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {useSelector} from 'react-redux';

import Ionicons from 'react-native-vector-icons/Ionicons';
import Icons from 'react-native-vector-icons/Entypo';
import {biometryAvailability} from '../../../utils/Biometry';
import {getBioFlag, setBioFlag, BIO_KEY} from '../../../utils/BioFlag';
import * as Keychain from 'react-native-keychain';
import {getSecrets} from '../../../utils/Cifrate';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getJwt} from '../../../utils/Session';

export default function Security({navigation}) {
  const color = useSelector(state => state.theme.theme);
  const [bioEnabled, setBioEnabled] = useState(false);
  useEffect(() => {
    (async () => setBioEnabled(await getBioFlag()))();
  }, []);

  const toggleBio = async val => {
    try {
      if (val) {
        const {available} = await biometryAvailability();
        if (!available) {
          Alert.alert(
            'Biometría no disponible',
            'Actívala en Ajustes del sistema',
          );
          return;
        }

        const secrets = await getSecrets();

        const jwt = await getJwt();
        if (!secrets || !jwt) {
          Alert.alert(
            'Sin datos',
            'Crea tu cuenta/PIN antes de activar la biometría',
          );
          return;
        }

        const storedPayload = secrets.payloadQr;
        await Keychain.setGenericPassword(
          'walletBundle',
          JSON.stringify({stored: storedPayload, jwt}),
          {
            service: 'walletBundle',
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            accessControl:
              Platform.OS === 'ios'
                ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE
                : Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
          },
        );
      } else {
        await Keychain.resetGenericPassword({service: 'walletBundle'});

        const secrets = await getSecrets();
        if (secrets) {
          await Keychain.setGenericPassword(
            'finline.wallet.vc',
            JSON.stringify(secrets.payloadQr),
            {
              service: 'finline.wallet.vc',
              accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            },
          );
        }
      }

      await setBioFlag(val);
      setBioEnabled(val);
    } catch (err) {
      if (isUserCancellation(err)) {
        await setBioFlag(false);
        setBioEnabled(false);
        return;
      }
      Alert.alert('Error', err?.message || 'No se pudo cambiar la biometría');
    }
  };

  const onPressItem = item => {
    if (!!item.route) {
      navigation.navigate(item.route, {item: item});
    }
  };

  const RenderItem = ({item, index}) => {
    if (item.rightIcon === 'switch') {
      return (
        <View
          testID={`securitySwitchItem_${item.id || index}`}
          style={[
            localStyle.renderItemContainer,
            {borderColor: color.dark ? color.grayScale700 : color.grayScale200},
          ]}>
          <View testID="securityBiometricLabelContainer" style={styles.rowCenter}>
            <Icons
              testID="securityBiometricIcon"
              name="fingerprint"
              size={moderateScale(20)}
              color={color.primary}
            />
            <CText testID="securityBiometricLabel" style={styles.ml10} type="B12">
              {item.title}
            </CText>
          </View>
          <Switch
            testID="securityBiometricSwitch"
            value={bioEnabled}
            onValueChange={toggleBio}
            trackColor={{
              false: color.grayScale300,
              true: color.primary,
            }}
            thumbColor={color.white}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        testID={`securityMenuItem_${item.id || index}`}
        disabled={item === String.darkMode}
        key={index}
        activeOpacity={item.rightIcon ? 1 : 0.5}
        onPress={() => onPressItem(item)}
        style={[
          localStyle.renderItemContainer,
          {
            borderColor: color.dark ? color.grayScale700 : color.grayScale200,
          },
        ]}>
        <View testID={`securityMenuItemContent_${item.id || index}`} style={styles.rowCenter}>
          <View
            testID={`securityMenuItemIconBackground_${item.id || index}`}
            style={[
              localStyle.iconBackground,
              {
                backgroundColor:
                  item?.id === 5 || item?.id === 6
                    ? color.primary
                    : color.inputBackground,
              },
            ]}>
            {item.icon ? (
              <Icons
                testID={`securityMenuItemIcon_${item.id || index}`}
                name={item.icon}
                size={moderateScale(20)}
                color={color.dark ? color.grayScale500 : color.grayScale400}
              />
            ) : (
              <View testID={`securityMenuItemCustomIcon_${item.id || index}`}>{color.dark ? item.darkIcon : item.lightIcon}</View>
            )}
          </View>
          <View testID={`securityMenuItemTextContainer_${item.id || index}`} style={styles.ml10}>
            <CText testID={`securityMenuItemTitle_${item.id || index}`} type={'B12'}>{item.title}</CText>
            <CText testID={`securityMenuItemValue_${item.id || index}`} type={'R10'} color={color.grayScale500}>
              {item.value}
            </CText>
          </View>
        </View>

        <Ionicons
          testID={`securityMenuItemArrow_${item.id || index}`}
          name={'chevron-forward-outline'}
          size={moderateScale(24)}
          color={color.dark ? color.grayScale500 : color.grayScale400}
          style={styles.mr10}
        />
      </TouchableOpacity>
    );
  };

  return (
    <CSafeAreaView testID="securityContainer">
      <CHeader testID="securityHeader" title={String.settings} />
      <KeyBoardAvoidWrapper testID="securityKeyboardWrapper" contentContainerStyle={styles.ph20}>
        <SectionList
          testID="securitySectionList"
          sections={SecuryData}
          keyExtractor={(item, index) => item + index}
          renderItem={RenderItem}
          extraData={bioEnabled}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(200),
    width: moderateScale(200),
  },
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
  },
  btnStyle: {
    marginTop: 8,
  },
  renderItemContainer: {
    height: moderateScale(72),
    borderRadius: moderateScale(12),
    ...styles.rowSpaceBetween,
    ...styles.mv10,
    ...styles.ph10,
    borderWidth: moderateScale(1),
  },
});
