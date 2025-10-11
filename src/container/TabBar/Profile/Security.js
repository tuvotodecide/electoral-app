import {
  Alert,
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
import {moderateScale} from '../../../common/constants';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import {SecuryData} from '../../../api/constant';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {useSelector} from 'react-redux';

import Ionicons from 'react-native-vector-icons/Ionicons';
import Icons from 'react-native-vector-icons/Entypo';
import wira from 'wira-sdk';


export default function Security({navigation}) {
  const color = useSelector(state => state.theme.theme);
  const userData = useSelector(state => state.wallet.payload);

  const [bioEnabled, setBioEnabled] = useState(false);
  useEffect(() => {
    (async () => setBioEnabled(await wira.Biometric.getBioFlag()))();
  }, []);

  const toggleBio = async val => {
    try {
      await wira.toggleBiometricAuth(userData, val);
      await wira.Biometric.setBioFlag(val);
      setBioEnabled(val);
    } catch (err) {
      if(err.message === 'Biometric authentication is not available'){
        Alert.alert(
          'Biometría no disponible',
          'Actívala en Ajustes del sistema',
        );
      } else if (err.message === 'User data is required to enable biometric authentication'){
        Alert.alert(
          'Sin datos',
          'Crea tu cuenta/PIN antes de activar la biometría',
        );
      } else if (err.message === 'User cancelled biometric change'){
        await wira.Biometric.setBioFlag(false);
        setBioEnabled(false);
      } else {
        Alert.alert('Error', err?.message || 'No se pudo cambiar la biometría');
      }
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
          style={[
            localStyle.renderItemContainer,
            {borderColor: color.dark ? color.grayScale700 : color.grayScale200},
          ]}>
          <View style={styles.rowCenter}>
            <Icons
              name="fingerprint"
              size={moderateScale(20)}
              color={color.primary}
            />
            <CText style={styles.ml10} type="B12">
              {item.title}
            </CText>
          </View>
          <Switch
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
        <View style={styles.rowCenter}>
          <View
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
                name={item.icon}
                size={moderateScale(20)}
                color={color.dark ? color.grayScale500 : color.grayScale400}
              />
            ) : (
              <View>{color.dark ? item.darkIcon : item.lightIcon}</View>
            )}
          </View>
          <View style={styles.ml10}>
            <CText type={'B12'}>{item.title}</CText>
            <CText type={'R10'} color={color.grayScale500}>
              {item.value}
            </CText>
          </View>
        </View>

        <Ionicons
          name={'chevron-forward-outline'}
          size={moderateScale(24)}
          color={color.dark ? color.grayScale500 : color.grayScale400}
          style={styles.mr10}
        />
      </TouchableOpacity>
    );
  };

  return (
    <CSafeAreaView>
      <CHeader title={String.settings} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <SectionList
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
