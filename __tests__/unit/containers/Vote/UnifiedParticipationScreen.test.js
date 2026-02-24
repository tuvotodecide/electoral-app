import React from 'react';
import {render, act} from '@testing-library/react-native';
import UnifiedParticipationScreen from '../../../../src/container/Vote/common/UnifiedParticipationScreen';
import {StackNav} from '../../../../src/navigation/NavigationKey';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(selector =>
    selector({
      theme: {
        theme: {
          white: '#FFFFFF',
          background: '#FAFAFA',
          text: '#111111',
        },
      },
    }),
  ),
}));

jest.mock(
  '../../../../src/components/common/CSafeAreaView',
  () => require('../../../__mocks__/components/common/CSafeAreaView'),
);
jest.mock(
  '../../../../src/components/common/CText',
  () => require('../../../__mocks__/components/common/CText'),
);
jest.mock('../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({title, onBack}) =>
    React.createElement(
      View,
      {testID: 'unifiedParticipationHeader'},
      React.createElement(Text, {testID: 'unifiedParticipationHeaderTitle'}, title),
      React.createElement(
        TouchableOpacity,
        {testID: 'unifiedParticipationHeaderBack', onPress: onBack},
        React.createElement(Text, null, 'back'),
      ),
    );
});

describe('UnifiedParticipationScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('renderiza estado de redirección', () => {
    const navigation = {
      replace: jest.fn(),
      goBack: jest.fn(),
    };
    const route = {
      params: {
        locationId: 'loc-1',
        locationData: {name: 'Recinto Norte'},
      },
    };

    const {getByText, getByTestId} = render(
      <UnifiedParticipationScreen navigation={navigation} route={route} />,
    );

    expect(getByTestId('unifiedParticipationHeaderTitle').props.children).toBe(
      'Recinto Norte',
    );
    expect(getByText('Redirigiendo')).toBeTruthy();
    expect(getByText('Por favor espera un momento')).toBeTruthy();
  });

  test('redirige a TableDetail con tableData cuando viene en params', () => {
    const navigation = {
      replace: jest.fn(),
      goBack: jest.fn(),
    };
    const tableData = {tableNumber: '123', codigo: 'C-123'};
    const route = {
      params: {
        locationId: 'loc-2',
        locationData: {name: 'Recinto Central'},
        tableData,
        fromCache: true,
        offline: true,
        electionId: 'e-1',
        electionType: 'general',
      },
    };

    render(<UnifiedParticipationScreen navigation={navigation} route={route} />);

    act(() => {
      jest.advanceTimersByTime(110);
    });

    expect(navigation.replace).toHaveBeenCalledWith(
      StackNav.TableDetail,
      expect.objectContaining({
        tableData,
        mesa: tableData,
        isFromUnifiedFlow: true,
        fromCache: true,
        offline: true,
        electionId: 'e-1',
        electionType: 'general',
      }),
    );
  });

  test('redirige a TableDetail sin tableData cuando no llega mesa preseleccionada', () => {
    const navigation = {
      replace: jest.fn(),
      goBack: jest.fn(),
    };
    const route = {
      params: {
        locationId: 'loc-3',
        locationData: {name: 'Recinto Sur'},
        fromCache: false,
        offline: false,
      },
    };

    render(<UnifiedParticipationScreen navigation={navigation} route={route} />);

    act(() => {
      jest.advanceTimersByTime(110);
    });

    expect(navigation.replace).toHaveBeenCalledWith(
      StackNav.TableDetail,
      expect.objectContaining({
        locationId: 'loc-3',
        isFromUnifiedFlow: true,
      }),
    );
  });
});
