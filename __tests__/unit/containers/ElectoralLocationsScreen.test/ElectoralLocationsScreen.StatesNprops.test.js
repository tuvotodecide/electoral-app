
  describe('2. Tests de Estados y Props', () => {
    describe('2.1 Estado Inicial', () => {
      test('debe tener estado inicial correcto', () => {
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const { getByTestId } = renderComponent();
        
        // Debe estar en estado de carga inicialmente
        expect(getByTestId('electoralLocationsLoadingIndicator')).toBeTruthy();
      });

      test('debe validar store de Redux disponible', () => {
        const { getByTestId } = renderComponent();
        
        // Debe renderizar sin errores con store mock
        expect(getByTestId('electoralLocationsLoadingContainer')).toBeTruthy();
      });
    });

    describe('2.2 Cambios de Estado', () => {
      test('debe transicionar de loading a datos correctamente', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByTestId, queryByTestId } = renderComponent();
        
        // Inicialmente debe mostrar loading
        expect(getByTestId('electoralLocationsLoadingIndicator')).toBeTruthy();
        
        // Después de cargar debe mostrar la lista
        await waitFor(() => {
          expect(queryByTestId('electoralLocationsLoadingIndicator')).toBeNull();
          expect(getByTestId('electoralLocationsList')).toBeTruthy();
        });
      });

      test('debe transicionar de loading a estado vacío', async () => {
        mockedAxios.get.mockResolvedValue({
          data: []
        });
        
        const { getByTestId, queryByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(queryByTestId('electoralLocationsLoadingIndicator')).toBeNull();
          expect(getByTestId('electoralLocationsEmptyContainer')).toBeTruthy();
        });
      });

      test('debe transicionar de loading a modal de error', async () => {
        mockedAxios.get.mockRejectedValue(new Error('Network error'));
        
        const { getByTestId, queryByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(queryByTestId('electoralLocationsLoadingIndicator')).toBeNull();
          expect(getByTestId('electoralLocationsModal')).toBeTruthy();
        });
      });

      test('debe mantener consistencia en re-renders', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByTestId, rerender } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsList')).toBeTruthy();
        });
        
        // Re-render no debe cambiar el estado
        rerender(
          <Provider store={mockStore}>
            <ElectoralLocationsScreen />
          </Provider>
        );
        
        expect(getByTestId('electoralLocationsList')).toBeTruthy();
      });
    });
  });
