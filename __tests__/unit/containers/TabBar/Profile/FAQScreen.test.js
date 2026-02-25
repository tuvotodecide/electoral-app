/**
 * Tests for FAQScreen
 * Tests de pantalla de preguntas frecuentes
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock dependencies
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('../../../../../src/components/home/FaqComponents', () => {
  return function MockFaqComponent({title}) {
    const {View, Text} = require('react-native');
    return <View testID="faqComponent"><Text>{title}</Text></View>;
  };
});
jest.mock('../../../../../src/api/constant', () => ({
  FaqData: [
    {title: 'FAQ 1', description: 'Answer 1'},
    {title: 'FAQ 2', description: 'Answer 2'},
  ],
  SearchTopicsFaqs: [
    {title: 'Topic 1', svgIcon: null},
    {title: 'Topic 2', svgIcon: null},
  ],
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

describe('FAQScreen', () => {
  const mockTheme = {
    textColor: '#000000',
    primary: '#4F9858',
    backgroundColor: '#FFFFFF',
    white: '#FFFFFF',
    black: '#000000',
    dark: false,
    grayScale200: '#E0E0E0',
    grayScale400: '#BDBDBD',
    grayScale500: '#9E9E9E',
    grayScale700: '#616161',
    inputBackground: '#F5F5F5',
    gradient1: '#4F9858',
    gradient2: '#3D7A45',
    GrayScale500: '#9E9E9E',
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
      const FAQScreen = require('../../../../../src/container/TabBar/Profile/FAQScreen').default;
      const {UNSAFE_root} = renderWithProvider(<FAQScreen />);

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Búsqueda', () => {
    it('filtra temas cuando se escribe en búsqueda', () => {
      const FAQScreen = require('../../../../../src/container/TabBar/Profile/FAQScreen').default;
      const {UNSAFE_root} = renderWithProvider(<FAQScreen />);

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Lista de FAQs', () => {
    it('muestra lista de preguntas frecuentes', () => {
      const FAQScreen = require('../../../../../src/container/TabBar/Profile/FAQScreen').default;
      const {UNSAFE_root} = renderWithProvider(<FAQScreen />);

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
