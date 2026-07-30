import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import TabNavigation from '../../../src/navigation/type/TabNavigation';
import {renderWithProviders} from '../../setup/test-utils';

jest.mock('../../../src/utils/Session', () => ({
  isSessionValid: jest.fn(async () => true),
  refreshSession: jest.fn(async () => true),
}));

jest.mock('../../../src/navigation/NavigationRoute', () => ({
  TabRoute: (() => {
    const React = require('react');
    const {Text} = require('react-native');
    return {
      HomeScreen: () => React.createElement(Text, null, 'Inicio Screen'),
      Participations: () => React.createElement(Text, null, 'Mis participaciones'),
      Profile: () => React.createElement(Text, null, 'Perfil Screen'),
    };
  })(),
}));

const flattenStyle = style => {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.filter(Boolean).map(flattenStyle));
  }

  if (style && typeof style === 'object') {
    const indexedStyles = Object.keys(style)
      .filter(key => /^\d+$/.test(key))
      .map(key => flattenStyle(style[key]));
    const ownStyle = Object.keys(style)
      .filter(key => !/^\d+$/.test(key) && style[key] !== undefined)
      .reduce((acc, key) => ({...acc, [key]: style[key]}), {});

    return Object.assign({}, ...indexedStyles, ownStyle);
  }

  return {};
};

describe('TabNavigation', () => {
  it('renderiza Inicio, Participaciones y Perfil sin duplicar tabs', async () => {
    const {getAllByText, getByTestId, getByText, queryByText} = renderWithProviders(
      <NavigationContainer>
        <TabNavigation />
      </NavigationContainer>,
    );

    expect(getByTestId('tabBarContainer')).toBeTruthy();
    expect(getByText('Inicio')).toBeTruthy();
    expect(getByText('Participaciones')).toBeTruthy();
    expect(getByText('Perfil')).toBeTruthy();
    expect(getAllByText('Participaciones')).toHaveLength(1);
    expect(queryByText('Mis participaciones')).toBeNull();
    expect(getByTestId('tabIcon_Participations')).toBeTruthy();

    fireEvent.press(getByTestId('tabButton_HomeScreen'));
    fireEvent.press(getByTestId('tabButton_Participations'));
    fireEvent.press(getByTestId('tabButton_Profile'));
  });

  it('marca visualmente el tab activo con verde y deja los inactivos neutros', async () => {
    const {getByTestId} = renderWithProviders(
      <NavigationContainer>
        <TabNavigation />
      </NavigationContainer>,
    );

    expect(flattenStyle(getByTestId('tabIcon_HomeScreen').props.style)).toEqual(
      expect.objectContaining({color: '#459151'}),
    );
    expect(flattenStyle(getByTestId('tabLabel_HomeScreen').props.style)).toEqual(
      expect.objectContaining({color: '#459151', fontWeight: '700'}),
    );
    expect(flattenStyle(getByTestId('tabIcon_Participations').props.style)).toEqual(
      expect.objectContaining({color: '#6B7280'}),
    );
    expect(flattenStyle(getByTestId('tabLabel_Participations').props.style)).toEqual(
      expect.objectContaining({color: '#6B7280', fontWeight: '500'}),
    );
    expect(getByTestId('tabButton_HomeScreen').props.accessibilityState).toEqual({
      selected: true,
    });
  });
});
