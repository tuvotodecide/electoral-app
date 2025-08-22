import React from 'react';
import {StyleSheet, View} from 'react-native';
import {moderateScale} from '../../../common/constants';
import {WebView} from 'react-native-webview'; // <-- importante

// custom imports
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import {PRIVACY_URL} from '@env';
import {styles} from '../../../themes';

export default function PrivacyPolicies() {
  return (
    <CSafeAreaView addTabPadding={false}>
      <CHeader title={String.privacyPolicy} />

      <View style={localStyle.webViewContainer}>
        <WebView
          source={{uri: PRIVACY_URL}}
          style={{flex: 1}}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  lineView: {
    width: '100%',
    height: moderateScale(1),
  },
  mainContainer: {
    ...styles.ph20,
    ...styles.mt20,
    flex: 1, // importante para que WebView se expanda
  },
  updateContainer: {
    height: moderateScale(40),
    borderRadius: moderateScale(8),
    ...styles.p10,
    ...styles.mt10,
  },
  webViewContainer: {
    flex: 1,
    overflow: 'hidden',
    marginHorizontal: moderateScale(10),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(10),
    borderRadius: moderateScale(8),
    backgroundColor: '#fff',
  },
});
