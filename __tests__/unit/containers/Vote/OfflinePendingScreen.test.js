import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import OfflinePendingScreen from '../../../../src/container/Vote/common/OfflinePendingScreen';
import {StackNav, TabNav} from '../../../../src/navigation/NavigationKey';

const mockResetAction = jest.fn(payload => ({type: 'RESET', payload}));

jest.mock('@react-navigation/native', () => ({
  CommonActions: {
    reset: (...args) => mockResetAction(...args),
  },
}));

jest.mock(
  '../../../../src/components/common/CSafeAreaView',
  () => require('../../../__mocks__/components/common/CSafeAreaView'),
);
jest.mock(
  '../../../../src/components/common/CText',
  () => require('../../../__mocks__/components/common/CText'),
);
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return ({name}) => React.createElement('Text', {testID: `icon-${name}`}, name);
});

describe('OfflinePendingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra mensaje offline y botón de retorno', () => {
    const navigation = {dispatch: jest.fn()};
    const {getByText} = render(<OfflinePendingScreen navigation={navigation} />);

    expect(getByText('No tienes conexión a Internet.')).toBeTruthy();
    expect(getByText('Volver al inicio')).toBeTruthy();
  });

  test('al presionar volver al inicio hace reset de navegación a Home', () => {
    const navigation = {dispatch: jest.fn()};
    const {getByText} = render(<OfflinePendingScreen navigation={navigation} />);

    fireEvent.press(getByText('Volver al inicio'));

    expect(mockResetAction).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: StackNav.TabNavigation,
          params: {
            screen: TabNav.HomeScreen,
            params: {screen: 'HomeMain'},
          },
        },
      ],
    });
    expect(navigation.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({type: 'RESET'}),
    );
  });
});
