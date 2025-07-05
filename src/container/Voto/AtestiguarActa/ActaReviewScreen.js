import React from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import BaseActaReviewScreen from '../../../components/common/BaseActaReviewScreen';

const ActaReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {photoUri, mesaData} = route.params || {};

  // Static data for the party results table
  const partyResults = [
    {id: 'unidad', partido: 'Unidad', presidente: '33', diputado: '29'},
    {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '3', diputado: '1'},
    {id: 'pdc', partido: 'PDC', presidente: '17', diputado: '16'},
    {id: 'morena', partido: 'Morena', presidente: '1', diputado: '0'},
  ];

  // Static data for the vote summary table
  const voteSummaryResults = [
    {id: 'validos', label: 'Válidos', value1: '141', value2: '176'},
    {id: 'blancos', label: 'Blancos', value1: '64', value2: '3'},
    {id: 'nulos', label: 'Nulos', value1: '6', value2: '9'},
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDatosCorrectos = () => {
    navigation.navigate('ActaCertificationScreen', {
      photoUri,
      mesaData,
      partyResults,
      voteSummaryResults,
    });
  };

  const actionButtons = [
    {
      text: 'Volver',
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
    {
      text: 'Datos Correctos',
      onPress: handleDatosCorrectos,
      style: {
        backgroundColor: '#459151',
      },
      textStyle: {
        color: '#fff',
      },
    },
  ];

  return (
    <BaseActaReviewScreen
      colors={colors}
      headerTitle={`Mesa ${mesaData?.numero || 'N/A'}`}
      instructionsText="Revise los datos del acta"
      photoUri={photoUri}
      partyResults={partyResults}
      voteSummaryResults={voteSummaryResults}
      actionButtons={actionButtons}
      onBack={handleBack}
    />
  );
};

export default ActaReviewScreen;
