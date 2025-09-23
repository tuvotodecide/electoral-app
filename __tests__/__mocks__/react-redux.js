// Mock para react-redux
export const Provider = ({ children }) => children;

export const useSelector = jest.fn((selector) => {
  // Mock por defecto para el tema
  const mockState = {
    theme: {
      theme: {
        background: '#FFFFFF',
        text: '#000000',
        textSecondary: '#666666',
        primary: '#4F9858',
        primaryLight: '#E8F5E8',
      }
    }
  };
  return selector(mockState);
});

export const useDispatch = () => jest.fn();

export const connect = () => (component) => component;

export default {
  Provider,
  useSelector,
  useDispatch,
  connect,
};
