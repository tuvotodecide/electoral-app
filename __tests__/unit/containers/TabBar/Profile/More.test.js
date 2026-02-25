/**
 * Tests for More screen (Profile settings)
 * Tests de pantalla de más opciones
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock dependencies
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-vector-icons/Entypo', () => 'Icons');
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
  return function MockLogOutModal({visible, onPressCancel, onPressLogOut, testID}) {
    const {View, TouchableOpacity, Text} = require('react-native');
    if (!visible) return null;
    return (
      <View testID={testID}>
        <TouchableOpacity testID="logoutCancelBtn" onPress={onPressCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="logoutConfirmBtn" onPress={onPressLogOut}>
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  };
});
jest.mock('../../../../../src/utils/auth', () => ({
  logOut: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: () => true,
  }),
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
      const {getByTestId} = renderWithProvider(
        <More navigation={{navigate: mockNavigate}} />
      );

      expect(getByTestId('moreContainer')).toBeTruthy();
    });

    it('renderiza el ScrollView', () => {
      const More = require('../../../../../src/container/TabBar/Profile/More').default;
      const {getByTestId} = renderWithProvider(
        <More navigation={{navigate: mockNavigate}} />
      );

      expect(getByTestId('moreScrollView')).toBeTruthy();
    });

    it('renderiza el contenedor principal', () => {
      const More = require('../../../../../src/container/TabBar/Profile/More').default;
      const {getByTestId} = renderWithProvider(
        <More navigation={{navigate: mockNavigate}} />
      );

      expect(getByTestId('moreMainContainer')).toBeTruthy();
    });

    it('renderiza la lista de menu', () => {
      const More = require('../../../../../src/container/TabBar/Profile/More').default;
      const {getByTestId} = renderWithProvider(
        <More navigation={{navigate: mockNavigate}} />
      );

      expect(getByTestId('moreMenuList')).toBeTruthy();
    });
  });

  describe('Secciones', () => {
    it('renderiza headers de sección', () => {
      const More = require('../../../../../src/container/TabBar/Profile/More').default;
      const {getByTestId} = renderWithProvider(
        <More navigation={{navigate: mockNavigate}} />
      );

      expect(getByTestId('moreSectionHeader_General')).toBeTruthy();
    });
  });
});
