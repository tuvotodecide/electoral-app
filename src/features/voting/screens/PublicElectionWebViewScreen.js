import React, {useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {WebView} from 'react-native-webview';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import {moderateScale} from '../../../common/constants';

const isPublicElectionPath = value => {
  const path = String(value || '').trim();
  return (
    /^\/votacion\/elecciones\/[^/]+\/publica\/?$/i.test(path) ||
    /^\/elections\/[^/]+\/public\/?$/i.test(path)
  );
};

const isValidPublicElectionUrl = value => {
  try {
    const parsed = new URL(String(value || '').trim());
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      isPublicElectionPath(parsed.pathname)
    );
  } catch {
    return false;
  }
};

const PublicElectionWebViewScreen = () => {
  const route = useRoute();
  const url = String(route?.params?.url || '').trim();
  const isValidUrl = useMemo(() => isValidPublicElectionUrl(url), [url]);
  const [isLoading, setIsLoading] = useState(isValidUrl);
  const [hasError, setHasError] = useState(!isValidUrl);

  return (
    <CSafeAreaView style={styles.container} addTabPadding={false}>
      {hasError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={moderateScale(36)} color="#B91C1C" />
          <CText type="B16" style={styles.errorTitle}>
            No se pudo cargar la elección
          </CText>
          <CText type="R14" style={styles.errorText}>
            Intenta volver y abrir el enlace nuevamente.
          </CText>
        </View>
      ) : (
        <View style={styles.webViewContainer}>
          <WebView
            testID="publicElectionWebView"
            source={{uri: url}}
            style={styles.webView}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
            onHttpError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
          {isLoading ? (
            <View testID="publicElectionWebViewLoading" style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#1F7A36" />
            </View>
          ) : null}
        </View>
      )}
    </CSafeAreaView>
  );
};

export default PublicElectionWebViewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webViewContainer: {
    flex: 1,
    marginHorizontal: moderateScale(10),
    marginBottom: moderateScale(10),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,250,252,0.82)',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(24),
  },
  errorTitle: {
    color: '#0F172A',
    textAlign: 'center',
    marginTop: moderateScale(14),
  },
  errorText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: moderateScale(8),
    lineHeight: moderateScale(20),
  },
});
