// Mock para react-redux
const Provider = ({children}) => children;

const useSelector = jest.fn(selector => {
  const mockState = {
    theme: {
      theme: {
        background: '#FFFFFF',
        text: '#000000',
        textSecondary: '#666666',
        primary: '#4F9858',
        primaryLight: '#E8F5E8',
      },
    },
  };
  return selector(mockState);
});

const useDispatch = () => jest.fn();

const connect = () => component => component;

module.exports = {
  __esModule: true,
  Provider,
  useSelector,
  useDispatch,
  connect,
  default: {
    Provider,
    useSelector,
    useDispatch,
    connect,
  },
};
