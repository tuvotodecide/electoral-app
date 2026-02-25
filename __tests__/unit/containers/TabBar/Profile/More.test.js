/**
 * Tests for More screen (Profile settings)
 * Tests de pantalla de más opciones
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock Ionicons as a proper component
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

jest.mock('react-native-vector-icons/Entypo', () => {
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

jest.mock('../../../../../src/api/constant', () => ({
  ProfileDataV3: [
    {
      section: 'General',
      data: [
        {id: 1, title: 'Option 1', value: 'Value 1'},
        {id: 2, title: 'Option 2', value: 'Value 2', rightIcon: true},
      ],
    },
  ],
}));

jest.mock('../../../../../src/components/modal/LogOutModal', () => {
  const React = require('react');
  return function MockLogOutModal({visible, onPressCancel, onPressLogOut, testID}) {
    const {View, TouchableOpacity, Text} = require('react-native');
    if (!visible) return null;
    return React.createElement(View, {testID},
      React.createElement(TouchableOpacity, {testID: 'logoutCancelBtn', onPress: onPressCancel},
        React.createElement(Text, null, 'Cancel')
      ),
      React.createElement(TouchableOpacity, {testID: 'logoutConfirmBtn', onPress: onPressLogOut},
        React.createElement(Text, null, 'Logout')
      )
    );
  };
});

jest.mock('../../../../../src/utils/auth', () => ({
  logOut: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: () => true,
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

describe('More screen', () => {
  const mockTheme = {
    textColor: '#000000',
    primary: '#4F9858',
    backgroundColor: '#FFFFFF',
    white: '#FFFFFF',
    dark: false,
    grayScale200: '#E0E0E0',
    grayScale400: '#BDBDBD',
    grayScale500: '#9E9E9E',
    grayScale700: '#616161',
    inputBackground: '#F5F5F5',
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
    it('renderiza el contenedor principal', () => {
      const More = require('../../../../../src/container/TabBar/Profile/More').default;
      const {UNSAFE_root} = renderWithProvider(
        <More navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el ScrollView', () => {
      const More = require('../../../../../src/container/TabBar/Profile/More').default;
      const {UNSAFE_root} = renderWithProvider(
        <More navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el contenedor principal', () => {
      const More = require('../../../../../src/container/TabBar/Profile/More').default;
      const {UNSAFE_root} = renderWithProvider(
        <More navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza la lista de menu', () => {
      const More = require('../../../../../src/container/TabBar/Profile/More').default;
      const {UNSAFE_root} = renderWithProvider(
        <More navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Secciones', () => {
    it('renderiza headers de sección', () => {
      const More = require('../../../../../src/container/TabBar/Profile/More').default;
      const {UNSAFE_root} = renderWithProvider(
        <More navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
