import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {
  getTableNumber,
  sortTables,
  SearchInput,
  TableCard,
} from '../../../../src/components/common/SearchTableComponents';
import {renderWithProviders} from '../../../setup/test-utils';

const styles = {
  chooseTableContainer: {},
  chooseTableText: {},
  locationInfoBar: {},
  locationIcon: {},
  locationInfoText: {},
  searchIcon: {},
  clearButton: {},
  tableCard: {},
  tableCardTitle: {},
  tableCardDetail: {},
};

describe('SearchTableComponents', () => {
  it('getTableNumber y sortTables funcionan', () => {
    expect(getTableNumber({tableNumber: '12'})).toBe(12);
    const sorted = sortTables([{tableNumber: 1}, {tableNumber: 3}], 'desc');
    expect(sorted[0].tableNumber).toBe(3);
  });

  it('SearchInput muestra clear y limpia', () => {
    const onClear = jest.fn();
    const {getByTestId} = renderWithProviders(
      <SearchInput
        testID="searchInput"
        value="abc"
        onChangeText={jest.fn()}
        onClear={onClear}
        styles={styles}
      />,
    );
    fireEvent.press(getByTestId('searchInputClearButton'));
    expect(onClear).toHaveBeenCalled();
  });

  it('TableCard renderiza y dispara onPress', () => {
    const onPress = jest.fn();
    const {getByTestId} = renderWithProviders(
      <TableCard
        testID="tableCard"
        table={{tableNumber: '1', tableCode: 'A-1'}}
        onPress={onPress}
        styles={styles}
        locationData={{locationId: 'loc-1'}}
        searchQuery="Mesa"
      />,
    );
    fireEvent.press(getByTestId('tableCard'));
    expect(onPress).toHaveBeenCalled();
  });
});
