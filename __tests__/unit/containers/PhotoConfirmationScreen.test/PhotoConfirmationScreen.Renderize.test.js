import './jestMocks';

import {
  renderPhotoConfirmation,
  buildRouteParams,
  String,
  resetMocks,
} from './testUtils';

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://test-backend.com',
  BACKEND_SECRET: 'test-secret',
  CHAIN: 'test-chain',
}));

describe('PhotoConfirmationScreen - Renderizado', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('muestra certificado preliminar y acción principal de avance', () => {
    const {getByText, getByTestId} = renderPhotoConfirmation();

    expect(getByTestId('photoConfirmationContainer')).toBeTruthy();
    expect(getByText('Este será tu certificado de participación')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('MESA 1234')).toBeTruthy();
    expect(getByTestId('photoConfirmationPublishButton')).toBeTruthy();
    expect(getByText('Siguiente')).toBeTruthy();
  });

  test('utiliza alternativas del número de mesa cuando tableData no lo provee', () => {
    const params = buildRouteParams({
      tableData: {
        tableNumber: undefined,
        numero: undefined,
        number: undefined,
      },
      mesaData: {
        tableNumber: '4321',
      },
    });

    const {getByText} = renderPhotoConfirmation({params});

    expect(getByText('MESA 4321')).toBeTruthy();
  });
});
