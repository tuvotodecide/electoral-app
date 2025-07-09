import React from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import BaseRecordReviewScreen from '../../../components/common/BaseRecordReviewScreen';
import String from '../../../i18n/String';

const MyWitnessesDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {photoUri, mesaData} = route.params || {};

  // Usar los datos específicos del atestiguamiento seleccionado
  const partyResults = mesaData?.partyResults || [
    {id: 'unidad', partido: String.partyUnit, presidente: '33', diputado: '29'},
    {
      id: 'mas-ipsp',
      partido: String.partyMasIpsp,
      presidente: '3',
      diputado: '1',
    },
    {id: 'pdc', partido: String.partyPdc, presidente: '17', diputado: '16'},
    {id: 'morena', partido: String.partyMorena, presidente: '1', diputado: '0'},
  ];

  // Usar los datos específicos del resumen de votos del atestiguamiento
  const voteSummaryResults = mesaData?.voteSummaryResults || [
    {id: 'validos', label: String.validVotes, value1: '141', value2: '176'},
    {id: 'blancos', label: String.blankVotes, value1: '64', value2: '3'},
    {id: 'nulos', label: String.nullVotes, value1: '6', value2: '9'},
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  const actionButtons = [
    {
      text: String.goBack,
      onPress: handleBack,
      style: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
      },
      textStyle: {
        color: '#2F2F2F',
      },
    },
  ];

  const customInstructionsStyle = {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 0,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  };

  // Crear título dinámico con información de la mesa
  const headerTitle = mesaData
    ? `${mesaData.mesa} - ${mesaData.fecha}`
    : String.witnessDetail;
  const instructionsText = mesaData
    ? String.attestedResults
        .replace('{tableName}', mesaData.mesa)
        .replace('{precinctName}', mesaData.recinto)
    : String.registeredVotes;

  return (
    <BaseRecordReviewScreen
      colors={colors}
      headerTitle={headerTitle}
      instructionsText={instructionsText}
      instructionsStyle={customInstructionsStyle}
      photoUri={photoUri}
      partyResults={partyResults}
      voteSummaryResults={voteSummaryResults}
      actionButtons={actionButtons}
      onBack={handleBack}
    />
  );
};

export default MyWitnessesDetailScreen;
