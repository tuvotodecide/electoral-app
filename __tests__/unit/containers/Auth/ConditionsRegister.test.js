import React from 'react';
import ConditionsRegister from '../../../../src/container/register/ConditionsRegister';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('ConditionsRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza las secciones legales principales', () => {
    const {getByTestId} = renderWithProviders(
      <ConditionsRegister navigation={mockNavigation} />,
    );

    expect(getByTestId('conditionsRegisterContainer')).toBeTruthy();
    expect(getByTestId('conditionsRegisterHeader')).toBeTruthy();
    expect(getByTestId('conditionsRegisterTitle')).toBeTruthy();
    expect(getByTestId('conditionsRegisterLastUpdate')).toBeTruthy();

    [1, 2, 3, 4, 5].forEach(index => {
      expect(getByTestId(`conditionsRegisterSection${index}_container`)).toBeTruthy();
      expect(getByTestId(`conditionsRegisterSection${index}_title`)).toBeTruthy();
      expect(getByTestId(`conditionsRegisterSection${index}_subtitle`)).toBeTruthy();
    });
  });
});
