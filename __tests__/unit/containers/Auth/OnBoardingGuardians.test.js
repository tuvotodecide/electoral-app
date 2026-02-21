import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {configurarMocksFlujoInicial} from './helpers/initialAuthFlow.shared';
import OnBoardingGuardians from '../../../../src/container/OnBoardingGuardians';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('OnBoardingGuardians', () => {
  beforeEach(() => {
    configurarMocksFlujoInicial();
  });

  it('al omitir regresa con goBack', () => {
    const localNavigation = {...mockNavigation, goBack: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <OnBoardingGuardians navigation={localNavigation} />,
    );

    fireEvent.press(getByTestId('onboardingGuardiansSkipButton'));

    expect(localNavigation.goBack).toHaveBeenCalled();
  });
});
