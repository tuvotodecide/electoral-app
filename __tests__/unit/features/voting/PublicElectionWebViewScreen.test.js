import React from 'react';
import PublicElectionWebViewScreen from '../../../../src/features/voting/screens/PublicElectionWebViewScreen';
import {renderWithProviders} from '../../../setup/test-utils';

const mockUseRoute = jest.fn();
let consoleLogSpy;
let consoleWarnSpy;
let consoleInfoSpy;

jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockUseRoute(),
  NavigationContainer: ({children}) => children,
}));

jest.mock('react-native-webview', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return {
    WebView: ({source, testID}) => (
      <Text testID={testID}>WebView: {source?.uri}</Text>
    ),
  };
});

jest.mock('../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children}) => <View>{children}</View>;
});

jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({children, ...props}) => <Text {...props}>{children}</Text>;
});

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({name}) => <Text>{name}</Text>;
});

describe('PublicElectionWebViewScreen', () => {
  const renderScreen = params => {
    mockUseRoute.mockReturnValue({params});
    return renderWithProviders(<PublicElectionWebViewScreen />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  it('renderiza la elección pública en WebView interno sin botón custom ni logs', () => {
    const screen = renderScreen({
      title: 'Elección',
      url: 'https://frontend-results.example/votacion/elecciones/event-1/publica',
    });

    expect(screen.getByTestId('publicElectionWebView')).toBeTruthy();
    expect(
      screen.getByText('WebView: https://frontend-results.example/votacion/elecciones/event-1/publica'),
    ).toBeTruthy();
    expect(screen.queryByText('Volver')).toBeNull();
    expect(screen.queryByTestId('publicElectionWebViewBackButton')).toBeNull();
    expect(screen.queryByTestId('publicElectionWebViewErrorBackButton')).toBeNull();
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
  });

  it('muestra error simple si la URL no es una elección pública válida', () => {
    const screen = renderScreen({
      title: 'Elección',
      url: 'https://frontend-results.example/noticias/externa',
    });

    expect(screen.queryByTestId('publicElectionWebView')).toBeNull();
    expect(screen.getByText('No se pudo cargar la elección')).toBeTruthy();
    expect(screen.queryByText('Volver')).toBeNull();
    expect(screen.queryByTestId('publicElectionWebViewErrorBackButton')).toBeNull();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('muestra error simple si no recibe URL', () => {
    const screen = renderScreen({title: 'Elección'});

    expect(screen.queryByTestId('publicElectionWebView')).toBeNull();
    expect(screen.getByText('No se pudo cargar la elección')).toBeTruthy();
    expect(screen.queryByText('Volver')).toBeNull();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
