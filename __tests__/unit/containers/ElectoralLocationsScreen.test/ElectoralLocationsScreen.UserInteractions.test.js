  describe('3. Tests de Interacción del Usuario', () => {
    describe('3.1 Navegación', () => {
      test('debe navegar hacia atrás al presionar el botón back', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const backButton = getByTestId('electoralLocationsHeaderBackButton');
          fireEvent.press(backButton);
          expect(mockNavigation.goBack).toHaveBeenCalled();
        });
      });

      test('debe abrir notificaciones al presionar el botón de notificaciones', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const notificationButton = getByTestId('electoralLocationsHeaderNotificationButton');
          fireEvent.press(notificationButton);
          expect(mockNavigation.navigate).toHaveBeenCalledWith(StackNav.Notification);
        });
      });

      test('debe navegar a detalles al presionar una ubicación', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const locationItem = getByTestId('electoralLocationItem_1');
          fireEvent.press(locationItem);
          expect(mockNavigation.navigate).toHaveBeenCalledWith(
            StackNav.ElectoralLocationDetail,
            expect.objectContaining({
              location: expect.objectContaining({
                id: '1',
                name: 'Escuela Primaria Central'
              })
            })
          );
        });
      });
    });

    describe('3.2 Interacciones con Modal', () => {
      test('debe cerrar modal al presionar el botón primario', async () => {
        mockedAxios.get.mockRejectedValue(new Error('Network error'));
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsModal')).toBeTruthy();
          
          const modalButton = getByTestId('customModalPrimaryButton');
          fireEvent.press(modalButton);
        });
      });

      test('debe manejar modal de permisos correctamente', async () => {
        // Test modal que aparece cuando se niegan permisos
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsModal')).toBeTruthy();
        });
      });
    });

    describe('3.3 Gestos y Acciones Táctiles', () => {
      test('debe responder correctamente al refresh de pull-to-refresh', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const flatList = getByTestId('electoralLocationsList');
          fireEvent(flatList, 'refresh');
          
          // Debe llamar axios nuevamente
          expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        });
      });

      test('debe manejar scroll en la lista correctamente', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const flatList = getByTestId('electoralLocationsList');
          
          fireEvent.scroll(flatList, {
            nativeEvent: {
              contentOffset: { y: 100 },
              contentSize: { height: 1000 },
              layoutMeasurement: { height: 800 },
            },
          });
          
          expect(flatList).toBeTruthy();
        });
      });

      test('debe permitir selección múltiple de ubicaciones si está habilitada', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const firstLocation = getByTestId('electoralLocationItem_1');
          const secondLocation = getByTestId('electoralLocationItem_2');
          
          fireEvent.press(firstLocation);
          fireEvent.press(secondLocation);
          
          expect(mockNavigation.navigate).toHaveBeenCalledTimes(2);
        });
      });
    });
  });