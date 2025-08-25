import React from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import BaseRecordReviewScreen from '../../../components/common/BaseRecordReviewScreen';
import String from '../../../i18n/String';

const MyWitnessesDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {
    photoUri, 
    mesaData, 
    partyResults: apiPartyResults, 
    voteSummaryResults: apiVoteSummaryResults,
    attestationData
  } = route.params || {};


  // Usar los datos reales del API que vienen desde MyWitnessesListScreen
  const partyResults = apiPartyResults || [];
  const voteSummaryResults = apiVoteSummaryResults || [];

  const handleBack = () => {
    navigation.goBack();
  };

  const actionButtons = [
    {
      text: String.goBack,
      onPress: handleBack,
      testID: 'goBackButton',
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

  // Crear título dinámico con información de la mesa usando datos reales
  const headerTitle = attestationData
    ? `Mesa ${attestationData.tableNumber} - ${attestationData.fecha}`
    : mesaData
    ? `${mesaData.mesa || `Mesa ${mesaData.tableNumber}`} - ${mesaData.fecha}`
    : String.witnessDetail;

  // Crear instrucciones usando datos reales
  const instructionsText = attestationData
    ? `Resultados atestiguados para Mesa ${attestationData.tableNumber}`
    : mesaData
    ? `Resultados atestiguados para ${mesaData.mesa || `Mesa ${mesaData.tableNumber}`}`
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
