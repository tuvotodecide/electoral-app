/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native/Libraries/NewAppScreen', () => ({
  Colors: {
    white: '#FFFFFF',
    black: '#000000',
    light: '#F3F3F3',
    dark: '#121212',
    darker: '#0A0A0A',
    lighter: '#FFFFFF',
  },
  Header: () => null,
  DebugInstructions: () => null,
  ReloadInstructions: () => null,
  LearnMoreLinks: () => null,
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
