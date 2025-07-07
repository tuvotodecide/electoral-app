import React from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import BaseActaReviewScreen from '../../../components/common/BaseActaReviewScreen';

const MisAtestiguamientosDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {photoUri, mesaData} = route.params || {};

  // Usar los datos específicos del atestiguamiento seleccionado
  const partyResults = mesaData?.partyResults || [
    {id: 'unidad', partido: 'Unidad', presidente: '33', diputado: '29'},
    {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '3', diputado: '1'},
    {id: 'pdc', partido: 'PDC', presidente: '17', diputado: '16'},
    {id: 'morena', partido: 'Morena', presidente: '1', diputado: '0'},
  ];

  // Usar los datos específicos del resumen de votos del atestiguamiento
  const voteSummaryResults = mesaData?.voteSummaryResults || [
    {id: 'validos', label: 'Válidos', value1: '141', value2: '176'},
    {id: 'blancos', label: 'Blancos', value1: '64', value2: '3'},
    {id: 'nulos', label: 'Nulos', value1: '6', value2: '9'},
  ];

  const handleBack = () => {
    navigation.goBack();
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
    : 'Detalle del Atestiguamiento';
  const instructionsText = mesaData
    ? `Resultados atestiguados de ${mesaData.mesa} - ${mesaData.recinto}`
    : 'Los votos registrados de la mesa';

  return (
    <BaseActaReviewScreen
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

export default MisAtestiguamientosDetailScreen;
