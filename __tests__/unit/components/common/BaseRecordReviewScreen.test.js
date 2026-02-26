import React from 'react';
import {Text} from 'react-native';
import {fireEvent} from '@testing-library/react-native';
import BaseRecordReviewScreen from '../../../../src/components/common/BaseRecordReviewScreen';
import {renderWithProviders} from '../../../setup/test-utils';

describe('BaseRecordReviewScreen', () => {
  beforeEach(() => {
    const {Image} = require('react-native');
    Image.getSize = jest.fn((uri, success) => success(1200, 800));
  });

  it('renderiza y permite mostrar foto', () => {
    const PhotoStub = ({testID}) => (
      <Text testID={testID}>Foto</Text>
    );
    const {getByTestId, queryByTestId} = renderWithProviders(
      <BaseRecordReviewScreen
        headerTitle="RevisiÃ³n"
        instructionsText="Instrucciones"
        photoUri="file://photo.jpg"
        partyResults={[{id: 'A', presidente: 1, diputado: 2}]}
        voteSummaryResults={[{id: 'validos', label: 'VÃ¡lidos', value1: 1}]}
        actionButtons={[{text: 'Guardar', onPress: jest.fn()}]}
        showTableInfo={true}
        tableData={{tableNumber: '1', recinto: 'Recinto'}}
        highlightPhotoToggle={true}
        PhotoComponent={PhotoStub}
      />,
    );

    expect(getByTestId('baseRecordReviewScreenTableTitleText')).toBeTruthy();
    expect(queryByTestId('baseRecordReviewScreenPhotoContainer')).toBeNull();

    fireEvent.press(getByTestId('baseRecordReviewScreenPhotoToggleCard'));
    expect(getByTestId('baseRecordReviewScreenPhotoContainer')).toBeTruthy();
  });

  it('muestra instrucciones y tabla info cuando highlightPhotoToggle es false', () => {
    const {getByLabelText, getByTestId, getByText} = renderWithProviders(
      <BaseRecordReviewScreen
        headerTitle="RevisiÃ³n"
        instructionsText="Sigue las instrucciones"
        photoUri="file://photo.jpg"
        partyResults={[{id: 'A', presidente: 1}]}
        voteSummaryResults={[{id: 'validos', label: 'VÃ¡lidos', value1: 1}]}
        actionButtons={[{text: 'Guardar', onPress: jest.fn()}]}
        showTableInfo={true}
        tableData={{tableNumber: '10', recinto: 'Colegio'}}
        highlightPhotoToggle={false}
      />,
    );

    expect(getByText('Sigue las instrucciones')).toBeTruthy();
    expect(getByTestId('baseRecordReviewScreenTableTitleText')).toBeTruthy();

    fireEvent.press(getByLabelText('Mostrar foto'));
    expect(getByTestId('baseRecordReviewScreenPhotoContainer')).toBeTruthy();
  });

  it('usa mesaData cuando showMesaInfo es true', () => {
    const {getByText} = renderWithProviders(
      <BaseRecordReviewScreen
        headerTitle="RevisiÃ³n"
        instructionsText="Texto"
        photoUri="file://photo.jpg"
        partyResults={[]}
        voteSummaryResults={[]}
        showMesaInfo={true}
        mesaData={{numero: '5', recinto: 'Recinto'}}
      />,
    );
    expect(getByText('Mesa 5')).toBeTruthy();
  });
});
