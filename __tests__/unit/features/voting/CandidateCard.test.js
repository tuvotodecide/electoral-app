import React from 'react';
import {render} from '@testing-library/react-native';
import CandidateCard from '../../../../src/features/voting/components/CandidateCard';

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

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({name}) => <Text>{name}</Text>;
});

describe('CandidateCard', () => {
  it('muestra un referendum como opcion numerada sin apariencia de candidatura', () => {
    const screen = render(
      <CandidateCard
        candidate={{
          id: 'ref-1',
          partyName: 'Sí',
          presidentName: 'Sí',
          partyColor: '#0F766E',
          isReferendum: true,
        }}
        displayIndex={0}
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByText('Opción 1')).toBeTruthy();
    expect(screen.getByText('Opción')).toBeTruthy();
    expect(screen.getByText('Sí')).toBeTruthy();
    expect(screen.queryByText(/Presidente/i)).toBeNull();
    expect(screen.queryByText(/Vicepresidente/i)).toBeNull();
    expect(screen.queryByText('person')).toBeNull();
  });

  it('mantiene la presentacion normal para una candidatura tradicional', () => {
    const screen = render(
      <CandidateCard
        candidate={{
          id: 'cand-1',
          partyName: 'Lista Azul',
          presidentName: 'Ana Perez',
          viceName: 'Luis Rojas',
          partyColor: '#1E40AF',
        }}
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByText('Lista Azul')).toBeTruthy();
    expect(screen.getByText('Presidente')).toBeTruthy();
    expect(screen.getByText('Ana Perez')).toBeTruthy();
    expect(screen.getByText('Vicepresidente')).toBeTruthy();
    expect(screen.getByText('Luis Rojas')).toBeTruthy();
  });
});
