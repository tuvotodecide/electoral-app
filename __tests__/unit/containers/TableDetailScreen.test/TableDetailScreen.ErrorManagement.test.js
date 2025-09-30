import './jestMocks';

import {renderTableDetail} from './testUtils';

describe('TableDetailScreen - Manejo de Errores y Casos Límite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra "N/A" cuando el registro no provee recordId', () => {
    const existingRecords = [
      {recordId: undefined},
    ];

    const {getByText} = renderTableDetail({
      routeParams: {
        existingRecords,
        totalRecords: 1,
      },
    });

    expect(getByText(/ID: N\/A/)).toBeTruthy();
  });

  test('omite la visualización de imágenes cuando el registro carece de actaImage', () => {
    const existingRecords = [{recordId: 'rec-1', actaImage: null}];

    const {queryByText} = renderTableDetail({
      routeParams: {
        existingRecords,
        totalRecords: 1,
      },
    });

    expect(queryByText('Ver Acta')).toBeNull();
  });
});
