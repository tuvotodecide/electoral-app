// Mock para el hook useSearchTableLogic
const useSearchTableLogic = jest.fn(() => ({
  colors: {
    primary: '#4F9858',
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    primaryLight: '#E8F5E8',
  },
  searchText: '',
  setSearchText: jest.fn(),
  handleBack: jest.fn(),
  handleNotificationPress: jest.fn(),
  handleHomePress: jest.fn(),
  handleProfilePress: jest.fn(),
  tables: [
    {
      id: '1',
      tableNumber: 'Mesa 1',
      tableCode: '1234',
      numero: 'Mesa 1',
      codigo: '1234',
      name: 'Mesa 1',
      code: '1234',
      _id: '1',
    },
    {
      id: '2',
      tableNumber: 'Mesa 2',
      tableCode: '1235',
      numero: 'Mesa 2',
      codigo: '1235',
      name: 'Mesa 2',
      code: '1235',
      _id: '2',
    },
  ],
  isLoading: false,
}));

export { useSearchTableLogic };