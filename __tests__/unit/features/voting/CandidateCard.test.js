import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';
import CandidateCard from '../../../../src/features/voting/components/CandidateCard';
import {blankVote} from '../../../../src/features/voting/data/params';

jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const MockCText = ({children, ...props}) => <Text {...props}>{children}</Text>;
  return MockCText;
});

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const MockIonicons = ({name}) => <Text>{name}</Text>;
  return MockIonicons;
});

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const MockMaterialCommunityIcons = ({name}) => <Text>{name}</Text>;
  return MockMaterialCommunityIcons;
});

describe('CandidateCard', () => {
  it('VOT-BAL-P0-002 | muestra un referendum como opcion numerada sin apariencia de candidatura', () => {
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

  it('VOT-BAL-P0-002 | mantiene candidatura tradicional con integrante principal y suplente', () => {
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

  it('muestra el voto en blanco con encabezado propio y nombre de opcion', () => {
    const onSelect = jest.fn();
    const screen = render(
      <CandidateCard candidate={blankVote} onSelect={onSelect} />,
    );

    expect(screen.getByText('Sin apoyo a ninguna')).toBeTruthy();
    expect(screen.getByText('Voto en blanco')).toBeTruthy();
    expect(screen.queryByText('BLANK')).toBeNull();
    expect(screen.queryByText('person')).toBeNull();

    fireEvent.press(screen.getByTestId('candidateCard_blank'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
