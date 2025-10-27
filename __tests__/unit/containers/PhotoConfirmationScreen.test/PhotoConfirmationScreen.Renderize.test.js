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

  test('muestra la cabecera, el saludo al testigo y la confirmación principal', () => {
  const {getByText, getAllByText} = renderPhotoConfirmation();

    expect(getByText('Mesa 1234')).toBeTruthy();
    expect(getByText(String.infoReadyToLoad)).toBeTruthy();
  expect(getAllByText(String.publishAndCertify)[0]).toBeTruthy();
    expect(
      getByText(
        'Confirma que el acta de la mesa 1234 en Colegio Central es correcta.',
      ),
    ).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
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

    expect(getByText('Mesa 4321')).toBeTruthy();
  });
});
