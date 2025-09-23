// Mock para react-native-safe-area-context
export const SafeAreaView = 'SafeAreaView';

export const useSafeAreaInsets = () => ({ 
  top: 0, 
  bottom: 0, 
  left: 0, 
  right: 0 
});

export const SafeAreaProvider = ({ children }) => children;

export default {
  SafeAreaView,
  useSafeAreaInsets,
  SafeAreaProvider,
};
