import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {PartyTable} from '../../../../src/components/common/PartyTable';
import {VoteSummaryTable} from '../../../../src/components/common/VoteSummaryTable';
import {renderWithProviders} from '../../../setup/test-utils';

describe('Record review tables', () => {
  it('PartyTable renderiza filas y edita', () => {
    const onUpdate = jest.fn();
    const {getByTestId} = renderWithProviders(
      <PartyTable
        partyResults={[{id: 'A', presidente: '1', diputado: '2'}]}
        isEditing={true}
        onUpdate={onUpdate}
      />,
    );
    fireEvent.changeText(getByTestId('partyInputPresidente_0'), '3');
    expect(onUpdate).toHaveBeenCalledWith('A', 'presidente', '3');
  });

  it('VoteSummaryTable renderiza y edita', () => {
    const onUpdate = jest.fn();
    const {getByTestId} = renderWithProviders(
      <VoteSummaryTable
        testID="summary"
        voteSummaryResults={[{id: 'validos', label: 'VÃ¡lidos', value1: '1'}]}
        isEditing={true}
        onUpdate={onUpdate}
      />,
    );
    fireEvent.changeText(getByTestId('summaryRow_0Input'), '4');
    expect(onUpdate).toHaveBeenCalledWith('validos', 'value1', '4');
  });
});
