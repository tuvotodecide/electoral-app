import React, {useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import BaseRecordReviewScreen from '../../../components/common/BaseRecordReviewScreen';
import {moderateScale} from '../../../common/constants';
import String from '../../../i18n/String';
import {validateBallotLocally} from '../../../utils/ballotValidation';
import InfoModal from '../../../components/modal/InfoModal';

const PhotoReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {photoUri, tableData, mesaData, aiAnalysis, mappedData, offline} =
    route.params || {};

  // State for editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [infoModalData, setInfoModalData] = useState({
    visible: false,
    title: '',
    message: '',
  });
  const closeInfoModal = () =>
    setInfoModalData({visible: false, title: '', message: ''});

  // Datos iniciales - usar datos de IA si están disponibles, sino usar valores por defecto
  const getInitialPartyResults = () => {
    if (mappedData?.partyResults) {
      return mappedData.partyResults;
    }
    const seed = offline ? '' : '0';

    return [
      {id: 'ap', partido: 'AP', presidente: seed, diputado: seed},
      {id: 'lyp-adn', partido: 'LYP-ADN', presidente: seed, diputado: seed},
      {id: 'apbsumate', partido: 'APBSUMATE', presidente: seed, diputado: seed},
      {id: 'libre', partido: 'LIBRE', presidente: seed, diputado: seed},
      {id: 'fp', partido: 'FP', presidente: seed, diputado: seed},
      {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: seed, diputado: seed},
      {id: 'morena', partido: 'MORENA', presidente: seed, diputado: seed},
      {id: 'unidad', partido: 'UNIDAD', presidente: seed, diputado: seed},
      {id: 'pdc', partido: 'PDC', presidente: seed, diputado: seed},
    ];
  };

  const getInitialVoteSummary = () => {
    if (mappedData?.voteSummaryResults) {
      return mappedData.voteSummaryResults;
    }
    const seed = offline ? '' : '0';
    return [
      {id: 'validos', label: String.validVotes, value1: seed, value2: seed},
      {id: 'blancos', label: String.blankVotes, value1: seed, value2: seed},
      {id: 'nulos', label: String.nullVotes, value1: seed, value2: seed},
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
    setInfoModalData({
      visible: true,
      title: String.saved,
      message: String.changesSavedSuccessfully,
    });
  };

  // Handler for navigating to the next screen
  const handleNext = () => {
    const mesaInfo = getMesaInfo();

    const normalizedPartyResults = partyResults.map(p => ({
      ...p,
      presidente: p.presidente === '' ? '0' : p.presidente,
      diputado: p.diputado === '' ? '0' : p.diputado,
    }));

    const normalizedVoteSummaryResults = voteSummaryResults.map(v => ({
      ...v,
      value1: v.value1 === '' ? '0' : v.value1,
      value2: v.value2 === '' ? '0' : v.value2,
    }));

    const check = validateBallotLocally(
      normalizedPartyResults,
      normalizedVoteSummaryResults,
    );
    if (!check.ok) {
      setInfoModalData({
        visible: true,
        title: 'Datos inconsistentes',
        message: check.errors.join('\n'),
      });
      return; // NO avanzar
    }

    navigation.navigate('PhotoConfirmationScreen', {
      photoUri,
      tableData: mesaInfo,
      mesaData: mesaInfo,
      partyResults: normalizedPartyResults,
      voteSummaryResults: normalizedVoteSummaryResults,
      aiAnalysis,
      offline,
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
        party.id === partyId ? {...party, [field]: value} : party,
      ),
    );
  };

  // Function to update vote summary results
  const updateVoteSummaryResult = (id, field, value) => {
    setVoteSummaryResults(prev =>
      prev.map(item => (item.id === id ? {...item, [field]: value} : item)),
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
    <>
      <BaseRecordReviewScreen
        colors={colors}
        headerTitle={`${String.table} ${tableData.numero}`}
        instructionsText={
          offline
            ? 'Completar los datos por favor'
            : aiAnalysis
            ? 'Revise los votos de la pizarra'
            : String.reviewPhotoPlease
        }
        instructionsStyle={{
          fontSize: moderateScale(20),
          fontWeight: '800',
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
        emptyDisplayWhenReadOnly={offline ? '' : '0'}
      />
      <InfoModal {...infoModalData} onClose={closeInfoModal} />
    </>
  );
};

export default PhotoReviewScreen;
