/**
 * Tests for TermsAndCondition screen
 * Tests de pantalla de términos y condiciones
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock dependencies
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-webview', () => ({
  WebView: ({source, testID}) => {
    const {View, Text} = require('react-native');
    return (
      <View testID={testID || 'webview'}>
        <Text>WebView: {source?.uri}</Text>
      </View>
    );
  },
}));

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    canGoBack: () => true,
  }),
}));

describe('TermsAndCondition screen', () => {
  const mockTheme = {
    textColor: '#000000',
    primary: '#4F9858',
    backgroundColor: '#FFFFFF',
  };

  const createStore = () => {
    return configureStore({
      reducer: {
        theme: (state = {theme: mockTheme}) => state,
      },
    });
  };

  const renderWithProvider = (component) => {
    const store = createStore();
    return render(
      <Provider store={store}>{component}</Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza sin errores', () => {
      const TermsAndCondition = require('../../../../../src/container/TabBar/Profile/TermsAndCondition').default;
      const {UNSAFE_root} = renderWithProvider(<TermsAndCondition />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el header con título', () => {
      const TermsAndCondition = require('../../../../../src/container/TabBar/Profile/TermsAndCondition').default;
      const {getByTestId} = renderWithProvider(<TermsAndCondition />);

      expect(getByTestId('termsConditionsHeader')).toBeTruthy();
    });
  });

  describe('WebView', () => {
    it('carga la URL de términos y condiciones', () => {
      const TermsAndCondition = require('../../../../../src/container/TabBar/Profile/TermsAndCondition').default;
      const {getByTestId} = renderWithProvider(<TermsAndCondition />);

      expect(getByTestId('webview')).toBeTruthy();
    });
  });
});
