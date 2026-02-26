import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import TabNavigation from '../../src/navigation/type/TabNavigation';
import {renderWithProviders} from '../setup/test-utils';

jest.mock('../../src/utils/Session', () => ({
  isSessionValid: jest.fn(async () => true),
  refreshSession: jest.fn(async () => true),
}));

jest.mock('../../src/navigation/NavigationRoute', () => ({
  TabRoute: {
    HomeScreen: () => null,
    Profile: () => null,
  },
}));

describe('TabNavigation', () => {
  it('renderiza tabs y permite navegar', () => {
    const {getByTestId} = renderWithProviders(
      <NavigationContainer>
        <TabNavigation />
      </NavigationContainer>,
    );

    expect(getByTestId('tabBarContainer')).toBeTruthy();
    fireEvent.press(getByTestId('tabButton_HomeScreen'));
    fireEvent.press(getByTestId('tabButton_Profile'));
  });
});
