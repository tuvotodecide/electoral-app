import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksFlujoInicial} from './helpers/initialAuthFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import OnBoarding from '../../../../src/container/OnBoarding';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import {setOnBoarding} from '../../../../src/utils/AsyncStorage';

describe('OnBoarding', () => {
  beforeEach(() => {
    configurarMocksFlujoInicial();
  });

  it('al omitir navega al flujo de autenticación en Connect', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<OnBoarding navigation={localNavigation} />);

    fireEvent.press(getByTestId('onboardingSkipButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(StackNav.AuthNavigation, {
      screen: AuthNav.Connect,
    });
  });

  it('en la última diapositiva guarda onboarding y resetea a Connect', async () => {
    const localNavigation = {...mockNavigation, reset: jest.fn()};
    const {getByTestId} = renderWithProviders(<OnBoarding navigation={localNavigation} />);

    fireEvent(getByTestId('onboardingFlatList'), 'onViewableItemsChanged', {
      viewableItems: [{index: 4}],
    });

    fireEvent.press(getByTestId('onboardingGetStartedButton'));

    await waitFor(() => {
      expect(setOnBoarding).toHaveBeenCalledWith(true);
      expect(localNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [
          {
            name: StackNav.AuthNavigation,
            params: {screen: AuthNav.Connect},
          },
        ],
      });
    });
  });
});
