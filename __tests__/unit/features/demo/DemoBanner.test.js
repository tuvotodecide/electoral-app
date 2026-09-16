import React from 'react';
import {act} from '@testing-library/react-native';

import DemoBanner from '../../../../src/features/demo/DemoBanner';
import {
  __resetDemoSessionForTests,
  endDemoSession,
  startDemoSession,
} from '../../../../src/features/demo/demoSession';
import String from '../../../../src/i18n/String';
import {renderWithProviders} from '../../../setup/test-utils';

describe('DemoBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetDemoSessionForTests();
  });

  it('no renderiza nada fuera del modo demostración', () => {
    const {queryByTestId} = renderWithProviders(<DemoBanner />);

    expect(queryByTestId('demoModeBanner')).toBeNull();
  });

  it('renderiza el aviso con el modo demostración activo', async () => {
    await startDemoSession();
    const {getByTestId, getByText} = renderWithProviders(<DemoBanner />);

    expect(getByTestId('demoModeBanner')).toBeTruthy();
    expect(getByText(String.demoModeBanner)).toBeTruthy();
  });

  it('aparece y desaparece al cambiar el estado sin volver a montar', async () => {
    const {queryByTestId} = renderWithProviders(<DemoBanner />);
    expect(queryByTestId('demoModeBanner')).toBeNull();

    await act(async () => {
      await startDemoSession();
    });
    expect(queryByTestId('demoModeBanner')).toBeTruthy();

    await act(async () => {
      await endDemoSession();
    });
    expect(queryByTestId('demoModeBanner')).toBeNull();
  });
});
