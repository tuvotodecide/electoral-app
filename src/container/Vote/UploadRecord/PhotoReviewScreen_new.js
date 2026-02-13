import React, {useMemo, useState} from 'react';
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import BaseRecordReviewScreen from '../../../components/common/BaseRecordReviewScreen';
import {moderateScale} from '../../../common/constants';
import Strings from '../../../i18n/String';
import {validateBallotLocally} from '../../../utils/ballotValidation';
import InfoModal from '../../../components/modal/InfoModal';
import {StackNav} from '../../../navigation/NavigationKey';
import {normalizeUri} from '../../../utils/normalizedUri';
import CText from '../../../components/common/CText';
import Ionicons from 'react-native-vector-icons/Ionicons';

const normalizeComparableObservation = text =>
  String(text ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();

const isObservationFromText = text => {
  const normalized = normalizeComparableObservation(text);
  if (!normalized) return false;
  return normalized !== 'correyvale';
};

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
    mode: incomingMode,
    actaCount,
    electionId
  } = route.params || {};
  const mode =
    incomingMode ?? (isViewOnly && existingRecord ? 'attest' : 'upload');
  const initialObservationText = String(
    route.params?.observationText ??
      mappedData?.observationText ??
      aiAnalysis?.observations?.text ??
      existingRecord?.observationText ??
      '',
  ).trim();
  const initialObservationByText = isObservationFromText(initialObservationText);
  const initialHasObservation =
    typeof route.params?.hasObservation === 'boolean'
      ? route.params.hasObservation
      : typeof mappedData?.isObserved === 'boolean'
      ? mappedData.isObserved
      : typeof aiAnalysis?.observations?.is_observed === 'boolean'
      ? aiAnalysis.observations.is_observed
      : typeof existingRecord?.hasObservation === 'boolean'
      ? existingRecord.hasObservation
      : initialObservationByText;
  const effectivePhotoUri = useMemo(() => {
    const fromRecord =
      existingRecord?.actaImage ||
      existingRecord?.image ||
      existingRecord?.photo ||
      existingRecord?.imageUrl;
    return normalizeUri(photoUri || fromRecord);
  }, [photoUri, existingRecord]);
  // State for editable fields
  const isEditing = !isViewOnly;
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
  // State for the party results table
  const [partyResults, setPartyResults] = useState(getInitialPartyResults());

  // State for the vote summary table (Votos, Blancos, Nulos)
  const [voteSummaryResults, setVoteSummaryResults] = useState(
    getInitialVoteSummary(),
  );
  const [hasObservation, setHasObservation] = useState(initialHasObservation);
  const [observationText, setObservationText] = useState(initialObservationText);

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

  // // Handler for editing votes
  // const handleEdit = () => {
  //   setIsEditing(true);
  // };

  // // Handler for saving changes
  // const handleSave = () => {
  //   setIsEditing(false);
  //   setInfoModalData({
  //     visible: true,
  //     title: Strings.saved,
  //     message: Strings.changesSavedSuccessfully,
  //   });
  // };

  // Handler for navigating to the next screen
  const handleNext = () => {
    const mesaInfo = getMesaInfo();

    // 1) Asegurarnos de trabajar con arrays
    const partiesArray = Array.isArray(partyResults) ? partyResults : [];
    const summaryArray = Array.isArray(voteSummaryResults)
      ? voteSummaryResults
      : [];

    // 2) Validar que no haya campos vacíos antes de normalizar
    if (!isViewOnly) {
      const hasEmptyParty = partiesArray.some(p => (p.presidente ?? '') === '');
      const hasEmptySummary = summaryArray.some(v => (v.value1 ?? '') === '');

      if (hasEmptyParty || hasEmptySummary) {
        setInfoModalData({
          visible: true,
          title: 'Campos incompletos',
          message:
            'Completa todos los campos de votos de los partidos y del resumen antes de continuar.',
        });
        return; // NO avanzar
      }
    }

    const normalizedObservationText = String(observationText ?? '').trim();
    if (!isViewOnly && hasObservation && !normalizedObservationText) {
      setInfoModalData({
        visible: true,
        title: 'Observacion requerida',
        message:
          'Si marcas "Acta con observacion", debes escribir el texto de la observacion.',
      });
      return;
    }

    const normalizedPartyResults = partyResults.map(p => ({
      ...p,
      presidente: p.presidente === '' ? '0' : p.presidente,
    }));
    const cleanedPartyResults = normalizedPartyResults.map(p => ({
      id:
        p.id ??
        p.partyId ??
        (p.partido ? String(p.partido).trim().toLowerCase() : undefined),
      partido: p.partido ?? p.party ?? p.name ?? p.sigla ?? p.partyId ?? p.id,
      presidente: p.presidente,
    }));
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

    navigation.navigate('PhotoConfirmationScreen', {
      photoUri: effectivePhotoUri,
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
      existingRecord,
      mode,
      electionId,
      hasObservation,
      observationText: hasObservation ? normalizedObservationText : '',
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
    : [
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
      ];

  const observationSection = isViewOnly ? null : (
    <View style={styles.observationContainer}>
      <TouchableOpacity
        style={styles.observationToggle}
        onPress={() => setHasObservation(prev => !prev)}
        activeOpacity={0.85}>
        <View
          style={[
            styles.observationCheckbox,
            hasObservation && {backgroundColor: colors.primary},
          ]}>
          {hasObservation ? (
            <Ionicons name="checkmark" size={16} color="#fff" />
          ) : (
            <Ionicons name="square-outline" size={16} color="#8A8A8A" />
          )}
        </View>
        <CText style={styles.observationToggleLabel}>Acta con observacion</CText>
      </TouchableOpacity>

      {hasObservation ? (
        <TextInput
          value={observationText}
          onChangeText={setObservationText}
          placeholder="Escribe la observacion del acta"
          placeholderTextColor="#8A8A8A"
          multiline
          style={[
            styles.observationInput,
            {borderColor: colors.primary || '#459151'},
          ]}
        />
      ) : null}
    </View>
  );

  return (
    <>
      <BaseRecordReviewScreen
        colors={colors}
        headerTitle={`${Strings.table} ${tableData.numero}`}
        instructionsText={
          offline
            ? 'Completa los datos por favor'
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
        extraContent={observationSection}
      />
      <InfoModal {...infoModalData} onClose={closeInfoModal} />
    </>
  );
};

const styles = StyleSheet.create({
  observationContainer: {
    marginTop: moderateScale(10),
    marginBottom: moderateScale(8),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    backgroundColor: '#FFFFFF',
  },
  observationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  observationCheckbox: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7C7C7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  observationToggleLabel: {
    marginLeft: moderateScale(8),
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#2F2F2F',
  },
  observationInput: {
    marginTop: moderateScale(10),
    minHeight: moderateScale(72),
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    textAlignVertical: 'top',
    fontSize: moderateScale(13),
    color: '#1F1F1F',
    backgroundColor: '#FFFFFF',
  },
});

export default PhotoReviewScreen;
