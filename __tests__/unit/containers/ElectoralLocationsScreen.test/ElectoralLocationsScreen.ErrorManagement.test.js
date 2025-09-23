  describe('4. Tests de Manejo de Errores', () => {
    describe('4.1 Errores de Red', () => {
      test('debe manejar error de conexión de red', async () => {
        mockedAxios.get.mockRejectedValue(new Error('Network Error'));
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsModal')).toBeTruthy();
        });
      });

      test('debe manejar timeout de solicitud', async () => {
        mockedAxios.get.mockRejectedValue(new Error('timeout of 5000ms exceeded'));
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsModal')).toBeTruthy();
        });
      });

      test('debe manejar error de servidor 500', async () => {
        mockedAxios.get.mockRejectedValue({
          response: { status: 500, data: 'Internal Server Error' }
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsModal')).toBeTruthy();
        });
      });

      test('debe manejar error 404 - recurso no encontrado', async () => {
        mockedAxios.get.mockRejectedValue({
          response: { status: 404, data: 'Not Found' }
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsModal')).toBeTruthy();
        });
      });
    });

    describe('4.2 Errores de Datos', () => {
      test('debe manejar respuesta con datos corruptos', async () => {
        mockedAxios.get.mockResolvedValue({
          data: { invalid: 'structure' }
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsEmptyContainer')).toBeTruthy();
        });
      });

      test('debe manejar respuesta null', async () => {
        mockedAxios.get.mockResolvedValue({
          data: null
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsModal')).toBeTruthy();
        });
      });

      test('debe manejar respuesta undefined', async () => {
        mockedAxios.get.mockResolvedValue({
          data: undefined
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsModal')).toBeTruthy();
        });
      });
    });

    describe('4.3 Errores de Permisos', () => {
      test('debe manejar permisos denegados permanentemente', async () => {
        PermissionsAndroid.request.mockResolvedValue(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsModal')).toBeTruthy();
        });
      });

      test('debe manejar error en la solicitud de permisos', async () => {
        PermissionsAndroid.request.mockRejectedValue(new Error('Permission Error'));
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsModal')).toBeTruthy();
        });
      });
    });
  });