// Mock para data/mockMesas
const mockMesas = {
  fetchMesas: jest.fn(),
  fetchActasByMesa: jest.fn(),
  mockMesasData: [
    {
      id: 1,
      numero: 'Mesa 1',
      codigo: '1234',
      colegio: 'Colegio Test',
      provincia: 'Provincia Test',
      recinto: 'Recinto Test',
      locationId: 'test-location-1',
      tableNumber: 'Mesa 1',
      tableCode: '1234',
      name: 'Mesa 1',
      code: '1234',
    },
    {
      id: 2,
      numero: 'Mesa 2',
      codigo: '1235',
      colegio: 'Colegio Test',
      provincia: 'Provincia Test',
      recinto: 'Recinto Test',
      locationId: 'test-location-1',
      tableNumber: 'Mesa 2',
      tableCode: '1235',
      name: 'Mesa 2',
      code: '1235',
    },
  ],
  mockActasData: {
    1: {
      images: [
        {
          id: '1',
          uri: 'https://test.com/image1.jpg',
        },
      ],
      partyResults: [],
      voteSummaryResults: [],
    },
  },
};

module.exports = mockMesas;