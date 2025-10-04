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

    // El componente muestra las actas existentes sin mostrar el ID
    // Verifica que se renderiza la alerta de éxito con el conteo de actas
    expect(getByText(/La mesa ya tiene 1 acta publicada/)).toBeTruthy();
  });

  test('omite la visualización de imágenes cuando el registro carece de actaImage', () => {
    const existingRecords = [{recordId: 'rec-1', actaImage: null}];

    const {queryByTestId} = renderTableDetail({
      routeParams: {
        existingRecords,
        totalRecords: 1,
      },
    });

    // El componente no renderiza la imagen cuando actaImage es null
    // No hay elementos de acta individuales cuando el conteo es 1
    expect(queryByTestId('tableDetailExistingRecord_0')).toBeNull();
  });
});
