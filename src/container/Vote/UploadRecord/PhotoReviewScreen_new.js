import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import BaseRecordReviewScreen from '../../../components/common/BaseRecordReviewScreen';
import { moderateScale } from '../../../common/constants';
import String from '../../../i18n/String';

const PhotoReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const { photoUri, tableData, mesaData, aiAnalysis, mappedData } = route.params || {};

  // State for editable fields
  const [isEditing, setIsEditing] = useState(false);

  // Datos iniciales - usar datos de IA si están disponibles, sino usar valores por defecto
  const getInitialPartyResults = () => {
    if (mappedData?.partyResults) {
      return mappedData.partyResults;
    }

    return [
      { id: 'ap', partido: 'AP', presidente: '0', diputado: '0' },
      { id: 'lyp-adn', partido: 'LYP-ADN', presidente: '0', diputado: '0' },
      { id: 'apbsumate', partido: 'APBSUMATE', presidente: '0', diputado: '0' },
      { id: 'libre', partido: 'LIBRE', presidente: '0', diputado: '0' },
      { id: 'fp', partido: 'FP', presidente: '0', diputado: '0' },
      { id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '0', diputado: '0' },
      { id: 'morena', partido: 'MORENA', presidente: '0', diputado: '0' },
      { id: 'unidad', partido: 'UNIDAD', presidente: '0', diputado: '0' },
      { id: 'pdc', partido: 'PDC', presidente: '0', diputado: '0' },
    ];
  };

  const getInitialVoteSummary = () => {
    if (mappedData?.voteSummaryResults) {
      return mappedData.voteSummaryResults;
    }

    return [
      { id: 'validos', label: String.validVotes, value1: '0', value2: '0' },
      { id: 'blancos', label: String.blankVotes, value1: '0', value2: '0' },
      { id: 'nulos', label: String.nullVotes, value1: '0', value2: '0' },
    ];
  };

  // State for the party results table
  const [partyResults, setPartyResults] = useState(getInitialPartyResults());

  // State for the vote summary table (Votos, Blancos, Nulos)
  const [voteSummaryResults, setVoteSummaryResults] = useState(
    getInitialVoteSummary(),
  );

  // Mostrar información de la mesa analizadas
  const getMesaInfo = () => {
    if (aiAnalysis) {
      return {
        number: aiAnalysis.table_number,
        code: aiAnalysis.table_code,
        time: aiAnalysis.time,
        ...tableData,
      };
    }
    return tableData;
  };

  // Handler for editing votes
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Handler for saving changes
  const handleSave = () => {
    setIsEditing(false);
    Alert.alert(String.saved, String.changesSavedSuccessfully);
  };

  // Handler for navigating to the next screen
  const handleNext = () => {
    const mesaInfo = getMesaInfo();

    navigation.navigate('PhotoConfirmationScreen', {
      photoUri,
      tableData: mesaInfo,
      mesaData: mesaInfo,
      partyResults,
      voteSummaryResults,
      aiAnalysis,
    });
  };

  // Handler for going back
  const handleBack = () => {
    navigation.goBack();
  };

  // Function to update party results
  const updatePartyResult = (partyId, field, value) => {
    setPartyResults(prev =>
      prev.map(party =>
        party.id === partyId ? { ...party, [field]: value } : party,
      ),
    );
  };

  // Function to update vote summary results
  const updateVoteSummaryResult = (id, field, value) => {
    setVoteSummaryResults(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  // Action buttons for PhotoReviewScreen
  const actionButtons = !isEditing
    ? [
      {
        text: String.edit,
        onPress: handleEdit,
        style: {
          backgroundColor: '#fff',
          borderColor: colors.primary,
          borderWidth: moderateScale(1),
        },
        textStyle: {
          color: colors.primary,
        },
      },
      {
        text: String.next,
        onPress: handleNext,
        style: {
          backgroundColor: colors.primary,
        },
        textStyle: {
          color: '#fff',
        },
      },
    ]
    : [
      {
        text: String.save,
        onPress: handleSave,
        style: {
          backgroundColor: colors.primary,
        },
        textStyle: {
          color: '#fff',
        },
      },
    ];

  return (
    <BaseRecordReviewScreen
      colors={colors}
      headerTitle={String.acta}
      instructionsText={
        aiAnalysis
          ? 'Acta analizada automáticamente. Revise y edite los datos si es necesario.'
          : String.reviewPhotoPlease
      }
      instructionsStyle={{
        fontSize: moderateScale(18),
        fontWeight: '500',
        color: colors.text || '#000000',
      }}
      photoUri={photoUri}
      partyResults={partyResults}
      voteSummaryResults={voteSummaryResults}
      isEditing={isEditing}
      onPartyUpdate={updatePartyResult}
      onVoteSummaryUpdate={updateVoteSummaryResult}
      actionButtons={actionButtons}
      onBack={handleBack}
      showMesaInfo={true}
      mesaData={getMesaInfo()}
    />
  );
};

export default PhotoReviewScreen;
