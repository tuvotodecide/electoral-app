/**
 * Tests for PrivacyPolicies screen
 * Tests de pantalla de políticas de privacidad
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock Ionicons as proper component
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const MockIcon = ({name, size, color, style, testID}) => {
    return React.createElement('Text', {
      testID: testID || `icon-${name}`,
      style: [{fontSize: size, color}, style],
      children: name,
    });
  };
  return MockIcon;
});

jest.mock('react-native-webview', () => ({
  WebView: ({source, testID}) => {
    const React = require('react');
    const {View, Text} = require('react-native');
    return React.createElement(View, {testID: testID || 'webview'},
      React.createElement(Text, null, `WebView: ${source?.uri}`)
    );
  },
}));

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
    canGoBack: () => true,
    navigate: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

describe('PrivacyPolicies screen', () => {
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
      const PrivacyPolicies = require('../../../../../src/container/TabBar/Profile/PrivacyPolicies').default;
      const {UNSAFE_root} = renderWithProvider(<PrivacyPolicies />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el header con título', () => {
      const PrivacyPolicies = require('../../../../../src/container/TabBar/Profile/PrivacyPolicies').default;
      const {getByTestId} = renderWithProvider(<PrivacyPolicies />);

      expect(getByTestId('privacyPoliciesHeader')).toBeTruthy();
    });
  });

  describe('WebView', () => {
    it('carga la URL de políticas de privacidad', () => {
      const PrivacyPolicies = require('../../../../../src/container/TabBar/Profile/PrivacyPolicies').default;
      const {getByTestId} = renderWithProvider(<PrivacyPolicies />);

      expect(getByTestId('webview')).toBeTruthy();
    });
  });
});
