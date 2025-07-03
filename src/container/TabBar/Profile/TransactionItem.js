import {StyleSheet, View} from 'react-native';
import React from 'react';

//custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../themes';
import {getHeight, moderateScale} from '../../../common/constants';
import CButton from '../../../components/common/CButton';
import Icono from '../../../components/common/Icono';
import {PermissionsAndroid, Platform, ToastAndroid, Alert} from 'react-native';
import {useSelector} from 'react-redux';
import CTagText from '../../../components/common/CTagText';
import Clipboard from '@react-native-clipboard/clipboard';
import String from '../../../i18n/String';

export default function TransactionItem() {
  const colors = useSelector(state => state.theme.theme);

  const onPressNext = async () => {
    try {
      let granted = true;

      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          );
        } else {
          granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          );
        }

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permiso denegado',
            'No se puede guardar el comprobante.',
          );
          return;
        }
      }

      ToastAndroid.show('QR guardado en Descargas 📁', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error guardando QR:', error);
      Alert.alert('Error', 'No se pudo guardar el QR.');
    }
  };

  const handleCopy = text => {
    Clipboard.setString(text);
    ToastAndroid.show('Texto copiado al portapapeles 📋', ToastAndroid.SHORT);
  };

  const data = [
    {
      icon: 'history',
      title: String.detalleDireccionOrigen,
      subtitle: '1x3243vrev...dsd',
      showCopyIcon: true,
    },
    {
      icon: 'history',
      title: String.detalleDireccionDestino,
      subtitle: '1x3243vrev...dsd',
      showCopyIcon: true,
    },
    {
      icon: 'swap-horizontal',
      title: String.detalleTipoTransaccion,
      subtitle: 'Enviado',
      showCopyIcon: false,
    },
    {
      icon: 'currency-usd',
      title: String.detalleMonedaDigital,
      subtitle: 'USDT',
      showCopyIcon: false,
    },
    {
      icon: 'cash',
      title: String.detalleMonto,
      subtitle: '1243,3',
      showCopyIcon: false,
    },
    {
      icon: 'calendar-clock',
      title: String.detalleFechaHora,
      subtitle: '6 de mayo de 2025 a las 14:34',
      showCopyIcon: false,
    },
    {
      icon: 'gas-cylinder',
      title: String.detalleComisionGas,
      subtitle: '0.13 USDT',
      showCopyIcon: false,
    },
  ];

  return (
    <CSafeAreaView>
      <CHeader title={String.headerTitleTransaction} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        {data.map((item, index) => (
          <CTagText
            key={index}
            iconLeft={<Icono name={item.icon} color={colors.primary} />}
            title={item.title}
            subtitle={item.subtitle}
            iconRight={
              item.showCopyIcon ? (
                <Icono name="content-copy" color={colors.textColor} />
              ) : null
            }
            onPressRightIcon={
              item.showCopyIcon ? () => handleCopy(item.subtitle) : undefined
            }
          />
        ))}
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomTextContainer}>
        <CButton
          title={String.downloadButtonTitle}
          onPress={onPressNext}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          frontIcon={<Icono size={20} name="download-outline" color={'#fff'} />}
        />
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    marginTop: 50,
    gap: 5,
    marginBottom: 10,
    justifyContent: 'center',
    width: '100%',
    height: getHeight(300),
    alignItems: 'center',
  },
  inputBoxStyle: {
    width: '80%',
  },
  countryPickerButton: {
    ...styles.ml5,
  },
  mobileNumberContainer: {
    ...styles.flexRow,
  },
  countryPickerStyle: {
    ...styles.rowSpaceBetween,
    borderRadius: moderateScale(12),
    height: getHeight(52),
    ...styles.mt15,
    width: moderateScale(89),
  },
  userImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    ...styles.selfCenter,
    ...styles.mt40,
  },
  labelText: {
    textAlign: 'left',
    opacity: 0.9,
    ...styles.mt15,
  },
  editProfileIconStyle: {
    height: moderateScale(24),
    width: moderateScale(24),
    position: 'absolute',
    borderWidth: moderateScale(3),
    borderRadius: moderateScale(12),
    left: moderateScale(75),
    top: moderateScale(75),
    ...styles.center,
  },
  changesBtn: {
    ...styles.selfCenter,
    width: '90%',
  },
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(300),
    width: moderateScale(300),
  },
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
  },
});
