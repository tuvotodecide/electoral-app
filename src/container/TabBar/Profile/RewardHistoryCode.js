import {StyleSheet, View, ToastAndroid} from 'react-native';
import React from 'react';

// custom imports
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../themes';
import CText from '../../../components/common/CText';
import CAlert from '../../../components/common/CAlert';
import CButton from '../../../components/common/CButton';
import Icono from '../../../components/common/Icono';
import {getSecondaryTextColor} from '../../../utils/ThemeUtils';
import {useSelector} from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';
import String from '../../../i18n/String';

export default function RewardCode() {
  const colors = useSelector(state => state.theme.theme);

  const handleCopy = code => {
    const mensaje = `${String.shareMessage}\n\n${code}`;
    Clipboard.setString(mensaje);
    ToastAndroid.show(String.codeCopied, ToastAndroid.SHORT);
  };

  return (
    <CSafeAreaView>
      <CHeader title={String.generateInviteCode} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <CText
          type="B16"
          align="center"
          marginTop={20}
          color={getSecondaryTextColor(colors)}>
          {String.shareCodeInstruction}
        </CText>

        <CText type="B60" align="center" marginTop={40} style={localStyle.code}>
          ASCXEW
        </CText>
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomTextContainer}>
        <CAlert status="info" message={String.codeValidityInfo} />

        <CButton
          title={` ${String.share}`}
          onPress={() => handleCopy('ASCXEW')}
          type="B16"
          containerStyle={localStyle.btnStyle}
          frontIcon={<Icono size={20} name="share-outline" color="#fff" />}
        />
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
  },
  code: {
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
    fontSize: 50,
  },
  btnStyle: {
    marginTop: 8,
  },
});
