import React from 'react';
import {render, act, fireEvent} from '@testing-library/react-native';
import PhotoReviewScreen from '../../../../src/container/Vote/UploadRecord/PhotoReviewScreen';

jest.mock(
  'react-redux',
  () => jest.requireActual('../../../__mocks__/react-redux'),
  {virtual: true},
);
jest.mock(
  '@react-navigation/native',
  () => jest.requireActual('../../../__mocks__/@react-navigation/native'),
  {virtual: true},
);

jest.mock(
  '../../../../src/components/common/BaseRecordReviewScreen',
  () => require('../../../__mocks__/components/common/BaseRecordReviewScreen').default,
);

jest.mock(
  '../../../../src/components/common/CustomModal',
  () => require('../../../__mocks__/components/common/CustomModal').default,
);

jest.mock(
  '../../../../src/i18n/String',
  () => require('../../../__mocks__/String').default,
);

const {setupPhotoReviewBaseMocks} = require('./testUtils');

describe('PhotoReviewScreen - Estados y Props', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupPhotoReviewBaseMocks();
  });

  test('debe permitir actualizar resultados de partidos', () => {
    const {getByTestId} = render(<PhotoReviewScreen />);

    const baseScreen = getByTestId('photoReviewScreenBase');

    act(() => {
      baseScreen.props.onPartyUpdate('unidad', 'presidente', '40');
    });

    const updated = getByTestId('photoReviewScreenBase');
    const updatedParty = updated.props.partyResults.find(
      item => item.id === 'unidad',
    );
    expect(updatedParty.presidente).toBe('40');
  });

  test('debe permitir actualizar resumen de votos', () => {
    const {getByTestId} = render(<PhotoReviewScreen />);

    const baseScreen = getByTestId('photoReviewScreenBase');

    act(() => {
      baseScreen.props.onVoteSummaryUpdate('validos', 'value1', '250');
    });

    const updated = getByTestId('photoReviewScreenBase');
    const updatedSummary = updated.props.voteSummaryResults.find(
      item => item.id === 'validos',
    );
    expect(updatedSummary.value1).toBe('250');
  });

  test('debe activar modo edición al presionar el botón Editar', () => {
    const {getByTestId} = render(<PhotoReviewScreen />);

    const editButton = getByTestId('photoReviewScreenBaseActionButton_0');

    act(() => {
      fireEvent.press(editButton);
    });

    const updated = getByTestId('photoReviewScreenBase');
    expect(updated.props.isEditing).toBe(true);
    expect(updated.props.actionButtons).toHaveLength(1);
    expect(updated.props.actionButtons[0].text).toBe('Guardar');
  });
});
