import React, {useMemo, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import BaseRecordReviewScreen from '../../../components/common/BaseRecordReviewScreen';
import {moderateScale} from '../../../common/constants';
import Strings from '../../../i18n/String';
import {validateBallotLocally} from '../../../utils/ballotValidation';
import InfoModal from '../../../components/modal/InfoModal';
import {StackNav} from '../../../navigation/NavigationKey';
import {normalizeUri} from '../../../utils/normalizedUri';

const PhotoReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {
    photoUri,
    tableData,
    mesaData,
    aiAnalysis,
    mappedData,
    offline,
    existingRecord,
    isViewOnly,

    fromWhichIsCorrect,

    actaCount,
  } = route.params || {};
  console.log('[PHOTO-REVIEW] 📦 Params recibidos:', {
    photoUri,
    tableData,
    mesaData,
    aiAnalysis,
    mappedData,
    offline,
    existingRecord,
    isViewOnly,
    fromWhichIsCorrect,
    actaCount,
  });
  const effectivePhotoUri = useMemo(() => {
    const fromRecord =
      existingRecord?.actaImage ||
      existingRecord?.image ||
      existingRecord?.photo ||
      existingRecord?.imageUrl;
    return normalizeUri(photoUri || fromRecord);
  }, [photoUri, existingRecord]);
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
    if (existingRecord?.partyResults) return existingRecord.partyResults;
    if (mappedData?.partyResults) {
      return mappedData.partyResults;
    }
    const seed = offline ? '' : '0';

    return [
      {id: 'libre', partido: 'LIBRE', presidente: seed, diputado: seed},
      {id: 'pdc', partido: 'PDC', presidente: seed, diputado: seed},
    ];
  };

  const getInitialVoteSummary = () => {
    const seed = offline ? '' : '0';
    const toArray = src => [
      {
        id: 'validos',
        label: Strings.validVotes,
        value1: String(src.presValidVotes ?? src.validVotes ?? seed),
        value2: '0',
      },
      {
        id: 'blancos',
        label: Strings.blankVotes,
        value1: String(src.presBlankVotes ?? src.blankVotes ?? seed),
        value2: '0',
      },
      {
        id: 'nulos',
        label: Strings.nullVotes,
        value1: String(src.presNullVotes ?? src.nullVotes ?? seed),
        value2: '0',
      },
    ];

    const fromExisting = existingRecord?.voteSummaryResults;
    if (Array.isArray(fromExisting)) return fromExisting;
    if (fromExisting && typeof fromExisting === 'object')
      return toArray(fromExisting);

    const fromMapped = mappedData?.voteSummaryResults;
    if (Array.isArray(fromMapped)) return fromMapped;
    if (fromMapped && typeof fromMapped === 'object')
      return toArray(fromMapped);

    return [
      {id: 'validos', label: Strings.validVotes, value1: seed, value2: '0'},
      {id: 'blancos', label: Strings.blankVotes, value1: seed, value2: '0'},
      {id: 'nulos', label: Strings.nullVotes, value1: seed, value2: '0'},
    ];
  };
    console.log('es', effectivePhotoUri);
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
      title: Strings.saved,
      message: Strings.changesSavedSuccessfully,
    });
  };

  // Handler for navigating to the next screen
  const handleNext = () => {
    const mesaInfo = getMesaInfo();

    const normalizedPartyResults = partyResults.map(p => ({
      ...p,
      presidente: p.presidente === '' ? '0' : p.presidente,
    }));
    const cleanedPartyResults = normalizedPartyResults.map(
      ({id, partido, presidente}) => ({
        id,
        partido,
        presidente,
      }),
    );

    const normalizedVoteSummaryResults = voteSummaryResults.map(v => ({
      ...v,
      value1: v.value1 === '' ? '0' : v.value1,
    }));

    if (!isViewOnly) {
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
    }
    // console.log('[MESA-INFO]', mesaInfo);


    navigation.navigate('PhotoConfirmationScreen', {
      photoUri:effectivePhotoUri,
      tableData: mesaInfo,
      mesaData: mesaInfo,
      partyResults: cleanedPartyResults,
      voteSummaryResults: normalizedVoteSummaryResults.map(
        ({id, label, value1}) => ({
          id,
          label,
          value1,
        }),
      ),
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
  const goToCamera = () => {
    const mesaInfo = getMesaInfo();
    navigation.navigate(StackNav.CameraScreen, {
      tableData: mesaInfo,
      mesaData: mesaInfo,
      mesa: mesaInfo,
    });
  };

  const actionButtons = isViewOnly
    ? [
        {
          text: 'Están correctos',
          onPress: handleNext,
          style: {backgroundColor: colors.primary},
          textStyle: {color: '#fff'},
        },
        {
          text:
            fromWhichIsCorrect && (actaCount ?? 0) > 1
              ? 'Regresar'
              : 'Subir acta',
          onPress:
            fromWhichIsCorrect && (actaCount ?? 0) > 1
              ? () => navigation.goBack()
              : goToCamera,
          style: {backgroundColor: '#DC2626'}, // rojo
          textStyle: {color: '#fff'},
        },
      ]
    : !isEditing
    ? [
        {
          text: Strings.edit,
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
          text: Strings.next,
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
          text: Strings.save,
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
        headerTitle={`${Strings.table} ${tableData.numero}`}
        instructionsText={
          offline
            ? 'Completar los datos por favor'
            : aiAnalysis
            ? 'Revise los votos de la pizarra'
            : Strings.reviewPhotoPlease
        }
        instructionsStyle={{
          fontSize: moderateScale(20),
          fontWeight: '800',
          color: colors.text || '#000000',
        }}
        photoUri={effectivePhotoUri}
        partyResults={partyResults}
        voteSummaryResults={voteSummaryResults}
        isEditing={isEditing}
        onPartyUpdate={updatePartyResult}
        onVoteSummaryUpdate={updateVoteSummaryResult}
        actionButtons={actionButtons}
        onBack={handleBack}
        showTableInfo={true}
        tableData={getMesaInfo()}
        emptyDisplayWhenReadOnly={offline ? '' : '0'}
        showDeputy={false}
        twoColumns={false}
      />
      <InfoModal {...infoModalData} onClose={closeInfoModal} />
    </>
  );
};

export default PhotoReviewScreen;
