import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import UniversalHeader from '../../../components/common/UniversalHeader';
import CustomModal from '../../../components/common/CustomModal';
import String from '../../../i18n/String';
import {StackNav} from '../../../navigation/NavigationKey';
import {useNavigationLogger} from '../../../hooks/useNavigationLogger';
import {fetchActasByMesa} from '../../../data/mockMesas';

const {width: screenWidth} = Dimensions.get('window');

const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) {
    return small;
  }
  if (isTablet) {
    return large;
  }
  return medium;
};

const PLACEHOLDER_IMAGE =
  'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg';

const resolveUriFromActa = (acta, fallbackUri) => {
  if (!acta) {
    return fallbackUri || PLACEHOLDER_IMAGE;
  }

  const candidates = [
    acta.uri,
    acta.photoUri,
    acta.photoURL,
    acta.photoUrl,
    acta.photo?.uri,
    acta.photo?.url,
    acta.imageUrl,
    acta.imageURL,
    acta.image_uri,
    acta.image,
    acta.actaImage,
    fallbackUri,
    PLACEHOLDER_IMAGE,
  ];

  return candidates.find(
    value => typeof value === 'string' && value.trim().length > 0,
  );
};

const normalizeActaImage = (acta, index, fallbackUri) => {
  const uri = resolveUriFromActa(acta, fallbackUri);

  const idCandidates = [
    acta?.id,
    acta?.recordId,
    acta?.actaId,
    acta?._id,
    acta?.uuid,
    acta?.code,
    acta?.tableId,
    uri ? `${uri}-${index}` : `acta-${index}`,
  ];

  const id = idCandidates.find(
    value => value !== undefined && value !== null && String(value).length > 0,
  );

  return {
    id: `${id}`,
    uri,
    recordId: acta?.recordId ?? acta?.id ?? acta?.actaId ?? null,
    partyResults:
      acta?.partyResults ||
      acta?.partyResult ||
      acta?.results ||
      acta?.parties ||
      [],
    voteSummaryResults:
      acta?.voteSummaryResults || acta?.voteSummary || acta?.summary || {},
    mesaInfo: acta?.mesaInfo || acta?.tableData || null,
    raw: acta,
  };
};

const normalizeActaList = (actas, fallbackUri) => {
  if (!Array.isArray(actas)) {
    return [];
  }

  const seenIds = new Set();

  return actas
    .map((item, index) => normalizeActaImage(item, index, fallbackUri))
    .filter(item => {
      if (!item.uri) {
        return false;
      }
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
};

const parseNumeric = value => {
  if (value === undefined || value === null) {
    return 0;
  }
  const number = Number(value);
  return Number.isNaN(number) ? value : number;
};

const transformVoteSummary = (summary, fallbackArray) => {
  if (Array.isArray(summary) && summary.length > 0) {
    return summary;
  }

  const source = summary && typeof summary === 'object' ? summary : {};

  if (
    source.presValidVotes !== undefined ||
    source.depValidVotes !== undefined ||
    source.presBlankVotes !== undefined ||
    source.depBlankVotes !== undefined ||
    source.presNullVotes !== undefined ||
    source.depNullVotes !== undefined ||
    source.presTotalVotes !== undefined ||
    source.depTotalVotes !== undefined
  ) {
    return [
      {
        label: 'Válidos',
        value1: parseNumeric(source.presValidVotes),
        value2: parseNumeric(source.depValidVotes),
      },
      {
        label: 'Blancos',
        value1: parseNumeric(source.presBlankVotes),
        value2: parseNumeric(source.depBlankVotes),
      },
      {
        label: 'Nulos',
        value1: parseNumeric(source.presNullVotes),
        value2: parseNumeric(source.depNullVotes),
      },
      {
        label: 'Total',
        value1: parseNumeric(source.presTotalVotes),
        value2: parseNumeric(source.depTotalVotes),
      },
    ];
  }

  if (Array.isArray(fallbackArray) && fallbackArray.length > 0) {
    return fallbackArray;
  }

  return [];
};

const WhichIsCorrectScreen = ({navigation, route}) => {
  const colors = useSelector(state => state.theme.theme);
  const params = route?.params || {};

  const {
    tableData: routeTableData,
    mesa,
    mesaData,
    existingRecords = [],
    existingActas = [],
    actaImages: actaImagesParam = [],
    preloadedActaImages: preloadedParam = [],
    photoUri: routePhotoUri,
    partyResults: routePartyResults = [],
    voteSummaryResults: routeVoteSummaryResults = [],
    isFromUnifiedFlow = false,
    fromTableDetail = false,
    isFromAPI = false,
    mesaInfo: routeMesaInfo,
    totalRecords = 0,
    locationData,
    originalTable,
  } = params;

  const fallbackUri = routePhotoUri || PLACEHOLDER_IMAGE;

  const incomingActas = useMemo(() => {
    if (Array.isArray(actaImagesParam) && actaImagesParam.length > 0) {
      return actaImagesParam;
    }
    if (Array.isArray(existingRecords) && existingRecords.length > 0) {
      return existingRecords;
    }
    if (Array.isArray(existingActas) && existingActas.length > 0) {
      return existingActas;
    }
    if (Array.isArray(preloadedParam) && preloadedParam.length > 0) {
      return preloadedParam;
    }
    return [];
  }, [actaImagesParam, existingActas, existingRecords, preloadedParam]);

  const normalizedInitialActas = useMemo(
    () => normalizeActaList(incomingActas, fallbackUri),
    [incomingActas, fallbackUri],
  );

  const [actaImages, setActaImages] = useState(normalizedInitialActas);
  const [preloadedActaImages] = useState(normalizedInitialActas);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [confirmedCorrectActa, setConfirmedCorrectActa] = useState(null);
  const [showConfirmationView, setShowConfirmationView] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.accept,
  });
  const [isLoadingActas, setIsLoadingActas] = useState(
    normalizedInitialActas.length === 0,
  );
  const [globalPartyResults, setGlobalPartyResults] = useState(
    routePartyResults,
  );
  const [globalVoteSummaryResults, setGlobalVoteSummaryResults] = useState(
    routeVoteSummaryResults,
  );

  const mesaInfo = useMemo(
    () => routeMesaInfo || mesaData || mesa || routeTableData || {},
    [mesaData, mesa, routeMesaInfo, routeTableData],
  );

  const allowAddNewActa = useMemo(
    () =>
      Boolean(
        isFromUnifiedFlow ||
          fromTableDetail ||
          isFromAPI ||
          (Array.isArray(existingRecords) && existingRecords.length > 0) ||
          (Array.isArray(existingActas) && existingActas.length > 0),
      ),
    [
      existingActas,
      existingRecords,
      fromTableDetail,
      isFromAPI,
      isFromUnifiedFlow,
    ],
  );

  const {logAction, logNavigation} = useNavigationLogger(
    'WhichIsCorrectScreen',
    true,
  );

  const showModal = useCallback(
    (type, title, message, buttonText = String.accept) => {
      setModalConfig({type, title, message, buttonText});
      setModalVisible(true);
      logAction('which_correct_modal_show', {type, title});
    },
    [logAction],
  );

  const closeModal = useCallback(() => {
    setModalVisible(false);
    logAction('which_correct_modal_close');
  }, [logAction]);

  const loadActasByMesa = useCallback(async () => {
    const mesaIdentifier =
      mesaInfo?.id ||
      mesaInfo?.tableId ||
      mesaInfo?.tableNumber ||
      mesaInfo?.numero ||
      mesaInfo?.number;

    if (!mesaIdentifier) {
      setIsLoadingActas(false);
      return;
    }

    setIsLoadingActas(true);

    try {
      let numericId = mesaIdentifier;
      if (typeof mesaIdentifier === 'string') {
        const match = mesaIdentifier.match(/\d+/);
        if (match) {
          numericId = parseInt(match[0], 10);
        }
      }

      const response = await fetchActasByMesa(numericId);

      if (response?.success && Array.isArray(response?.data?.images)) {
        const normalized = normalizeActaList(
          response.data.images,
          fallbackUri,
        );
        setActaImages(normalized);
        setGlobalPartyResults(response.data.partyResults || []);
        setGlobalVoteSummaryResults(response.data.voteSummaryResults || []);
        logAction('which_correct_load_actas_success', {
          actaCount: normalized.length,
        });
      } else if (normalizedInitialActas.length === 0) {
        logAction('which_correct_load_actas_empty', {
          mesaIdentifier,
        });
        showModal('error', String.error, String.couldNotLoadActas);
      }
    } catch (error) {
      logAction('which_correct_load_actas_error', {
        message: error?.message,
      });
      if (normalizedInitialActas.length === 0) {
        showModal('error', String.error, String.errorLoadingActas);
      }
    } finally {
      setIsLoadingActas(false);
    }
  }, [
    fallbackUri,
    logAction,
    mesaInfo,
    normalizedInitialActas.length,
    showModal,
  ]);

  useEffect(() => {
    if (normalizedInitialActas.length === 0 || isFromUnifiedFlow || isFromAPI) {
      loadActasByMesa();
    } else {
      setIsLoadingActas(false);
    }
  }, [isFromAPI, isFromUnifiedFlow, loadActasByMesa, normalizedInitialActas.length]);

  useEffect(() => {
    logNavigation('which_correct_view', {
      actaCount: actaImages.length,
      allowAddNewActa,
      fromUnifiedFlow: isFromUnifiedFlow,
      fromTableDetail,
      fromApi: isFromAPI,
      totalRecords,
    });
  }, [
    actaImages.length,
    allowAddNewActa,
    fromTableDetail,
    isFromAPI,
    isFromUnifiedFlow,
    logNavigation,
    totalRecords,
  ]);

  useEffect(() => {
    if (
      selectedImageId &&
      !actaImages.some(image => image.id === selectedImageId)
    ) {
      setSelectedImageId(null);
    }
  }, [actaImages, selectedImageId]);

  const handleImagePress = useCallback(
    imageId => {
      setSelectedImageId(imageId);
      setShowConfirmationView(false);
      setConfirmedCorrectActa(null);
      logAction('which_correct_select_acta', {actaId: imageId});
    },
    [logAction],
  );

  const handleCorrectActaSelected = useCallback(
    actaId => {
      setConfirmedCorrectActa(actaId);
      setShowConfirmationView(true);
      logAction('which_correct_confirm', {actaId});
    },
    [logAction],
  );

  const handleUploadNewActa = useCallback(() => {
    const basePayload = {
      tableData: mesaInfo,
      mesa: mesaInfo,
      mesaData: mesaInfo,
      existingRecords: actaImages,
      existingActas: actaImages,
      totalRecords: actaImages.length,
      locationData,
      originalTable,
    };

    if (isFromUnifiedFlow && !fromTableDetail && !isFromAPI) {
      logNavigation('which_correct_add_new_via_table_detail', {
        actaCount: actaImages.length,
      });
      try {
        navigation.navigate(StackNav.TableDetail, basePayload);
      } catch {
        navigation.navigate('TableDetail', basePayload);
      }
      return;
    }

    logNavigation('which_correct_add_new_acta', {
      actaCount: actaImages.length,
      fromApi: isFromAPI,
    });

    const cameraPayload = {
      ...basePayload,
      existingActas: actaImages,
      isAddingToExisting: actaImages.length > 0,
    };

    try {
      navigation.navigate(StackNav.CameraScreen, cameraPayload);
    } catch {
      navigation.navigate('CameraScreen', cameraPayload);
    }
  }, [
    actaImages,
    fromTableDetail,
    isFromAPI,
    isFromUnifiedFlow,
    locationData,
    logNavigation,
    mesaInfo,
    navigation,
    originalTable,
  ]);

  const handleDatosNoCorrectos = useCallback(() => {
    if (allowAddNewActa) {
      handleUploadNewActa();
      return;
    }
    logAction('which_correct_report_incorrect');
    showModal('info', String.information, String.dataReportedAsIncorrect);
  }, [allowAddNewActa, handleUploadNewActa, logAction, showModal]);

  const handleViewMoreDetails = useCallback(
    imageIdParam => {
      const targetId = imageIdParam || selectedImageId;

      if (!targetId) {
        showModal(
          'warning',
          String.selectionRequired,
          String.pleaseSelectImageFirst,
        );
        return;
      }

      if (imageIdParam && imageIdParam !== selectedImageId) {
        setSelectedImageId(imageIdParam);
      }

      const selectedImage = actaImages.find(img => img.id === targetId);

      if (!selectedImage) {
        showModal('error', String.error, String.couldNotLoadActas);
        return;
      }

      const voteSummary = transformVoteSummary(
        selectedImage.voteSummaryResults,
        globalVoteSummaryResults,
      );
      const partyResults =
        (Array.isArray(selectedImage.partyResults) &&
        selectedImage.partyResults.length > 0
          ? selectedImage.partyResults
          : globalPartyResults) || [];

      logNavigation('which_correct_view_details', {
        actaId: targetId,
        voteSummaryLength: voteSummary.length,
      });

      const payload = {
        selectedActa: selectedImage,
        tableData: mesaInfo,
        partyResults,
        voteSummaryResults: voteSummary,
        allActas: actaImages,
        onCorrectActaSelected: handleCorrectActaSelected,
        onUploadNewActa: handleUploadNewActa,
      };

      try {
        navigation.navigate(StackNav.ActaDetailScreen, payload);
      } catch {
        navigation.navigate('ActaDetailScreen', payload);
      }
    },
    [
      actaImages,
      globalPartyResults,
      globalVoteSummaryResults,
      handleCorrectActaSelected,
      handleUploadNewActa,
      logNavigation,
      mesaInfo,
      navigation,
      selectedImageId,
      showModal,
    ],
  );

  const handleContinueWithSelectedActa = useCallback(() => {
    const actaId = confirmedCorrectActa || selectedImageId;

    if (!actaId) {
      showModal(
        'warning',
        String.selectionRequired,
        String.pleaseSelectImageFirst,
      );
      return;
    }

    const selectedImage = actaImages.find(img => img.id === actaId);

    if (!selectedImage) {
      showModal('error', String.error, String.couldNotLoadActas);
      return;
    }

    const voteSummary = transformVoteSummary(
      selectedImage.voteSummaryResults,
      globalVoteSummaryResults,
    );
    const partyResults =
      (Array.isArray(selectedImage.partyResults) &&
      selectedImage.partyResults.length > 0
        ? selectedImage.partyResults
        : globalPartyResults) || [];

    logAction('which_correct_continue', {
      actaId,
      hasPartyResults: partyResults.length > 0,
      voteSummaryLength: voteSummary.length,
    });

    const payload = {
      recordId: selectedImage.recordId,
      photoUri: selectedImage.uri,
      tableData: mesaInfo,
      mesaInfo,
      partyResults,
      voteSummaryResults: voteSummary,
    };

    try {
      navigation.navigate(StackNav.RecordReviewScreen, payload);
    } catch {
      navigation.navigate('RecordReviewScreen', payload);
    }

    setShowConfirmationView(false);
    setConfirmedCorrectActa(null);
  }, [
    actaImages,
    confirmedCorrectActa,
    globalPartyResults,
    globalVoteSummaryResults,
    logAction,
    mesaInfo,
    navigation,
    selectedImageId,
    showModal,
  ]);

  const handleChangeOpinion = useCallback(() => {
    setConfirmedCorrectActa(null);
    setShowConfirmationView(false);
    logAction('which_correct_change_opinion');
  }, [logAction]);

  const handleBack = useCallback(() => {
    if (showConfirmationView) {
      setShowConfirmationView(false);
      setConfirmedCorrectActa(null);
      logAction('which_correct_back_from_confirmation');
      return;
    }
    navigation.goBack();
  }, [logAction, navigation, showConfirmationView]);

  const IPFSImageComponent = ({image, testID}) => {
    const [isLoadingImage, setIsLoadingImage] = useState(true);
    const [hasError, setHasError] = useState(false);

    const uri = useMemo(
      () => resolveUriFromActa(image, fallbackUri),
      [image],
    );

    useEffect(() => {
      setHasError(false);
      setIsLoadingImage(true);
    }, [uri]);

    if (!uri || hasError) {
      return (
        <View
          testID={testID ? `${testID}_error` : undefined}
          style={[styles.imageDisplay, styles.imageError]}>
          <MaterialIcons
            name="broken-image"
            size={isTablet ? 60 : 48}
            color="#999"
          />
          <CText style={styles.imageErrorText}>
            Error cargando imagen
          </CText>
          <CText style={styles.imageErrorSubtext}>
            Verifica tu conexión a internet
          </CText>
        </View>
      );
    }

    return (
      <View>
        <Image
          testID={testID}
          source={{uri}}
          style={[styles.imageDisplay, isLoadingImage && styles.imageLoading]}
          resizeMode="contain"
          onLoadStart={() => {
            setIsLoadingImage(true);
            setHasError(false);
          }}
          onLoad={() => setIsLoadingImage(false)}
          onError={() => {
            setHasError(true);
            setIsLoadingImage(false);
          }}
        />
        {isLoadingImage && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator
              size="small"
              color={colors.primary || '#4F9858'}
            />
            <CText style={styles.loadingIndicatorText}>
              Cargando imagen...
            </CText>
          </View>
        )}
      </View>
    );
  };

  return (
    <CSafeAreaView
      testID="whichIsCorrectContainer"
      style={styles.container}
      addTabPadding={false}>
      <UniversalHeader
        testID="whichIsCorrectHeader"
        colors={colors}
        onBack={handleBack}
        title={`${String.table} ${
          mesaInfo?.tableNumber ||
          mesaInfo?.numero ||
          mesaInfo?.number ||
          'N/A'
        }`}
        showNotification={true}
      />

      {showConfirmationView ? (
        <>
          <View
            testID="whichIsCorrectQuestionContainer"
            style={styles.questionContainer}>
            <CText
              testID="whichIsCorrectQuestionText"
              style={styles.questionText}>
              {String.whichIsCorrect}
            </CText>
          </View>

          <ScrollView
            testID="whichIsCorrectConfirmationImageList"
            style={styles.imageList}
            showsVerticalScrollIndicator={false}>
            {actaImages.map((image, index) => {
              const isCorrect = image.id === confirmedCorrectActa;

              return (
                <View
                  key={`confirmation-${image.id}`}
                  testID={`whichIsCorrectConfirmationImageContainer_${index}`}
                  style={styles.confirmationImageContainer}>
                  <View
                    testID={`whichIsCorrectImageCard_${index}`}
                    style={[
                      styles.imageCard,
                      isCorrect
                        ? styles.imageCardCorrect
                        : styles.imageCardIncorrect,
                    ]}>
                    <IPFSImageComponent
                      testID={`whichIsCorrectImage_${index}`}
                      image={image}
                    />

                    <View
                      testID={`whichIsCorrectStatusIcon_${index}`}
                      style={[
                        styles.statusIcon,
                        isCorrect ? styles.correctIcon : styles.incorrectIcon,
                      ]}>
                      <MaterialIcons
                        testID={`whichIsCorrectStatusIconSvg_${index}`}
                        name={isCorrect ? 'check-circle' : 'cancel'}
                        size={24}
                        color="#FFFFFF"
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View
            testID="whichIsCorrectConfirmationButtonsContainer"
            style={styles.confirmationButtonsContainer}>
            <TouchableOpacity
              testID="whichIsCorrectContinueButton"
              style={[
                styles.continueButton,
                {backgroundColor: colors.primary || '#4F9858'},
              ]}
              onPress={handleContinueWithSelectedActa}
              activeOpacity={0.8}>
              <CText
                testID="whichIsCorrectContinueButtonText"
                style={styles.continueButtonText}>
                {String.continueButton}
              </CText>
            </TouchableOpacity>

            <TouchableOpacity
              testID="whichIsCorrectChangeOpinionButton"
              style={[
                styles.changeOpinionButton,
                {borderColor: colors.textSecondary || '#4F9858'},
              ]}
              onPress={handleChangeOpinion}
              activeOpacity={0.8}>
              <CText
                testID="whichIsCorrectChangeOpinionButtonText"
                style={[
                  styles.changeOpinionButtonText,
                  {color: colors.textSecondary || '#4F9858'},
                ]}>
                Cambiar de opinión
              </CText>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View
            testID="whichIsCorrectQuestionContainer"
            style={styles.questionContainer}>
            <CText
              testID="whichIsCorrect_questionText"
              style={styles.questionText}>
              {String.whichIsCorrect}
            </CText>
            {isFromAPI && actaImages.length > 0 && (
              <View
                testID="whichIsCorrect_apiInfoContainer"
                style={styles.apiInfoContainer}>
                <CText
                  testID="whichIsCorrect_apiInfoText"
                  style={styles.apiInfoText}>
                  Se encontraron {actaImages.length} acta
                  {actaImages.length > 1 ? 's' : ''} atestiguada
                  {actaImages.length > 1 ? 's' : ''} para esta mesa
                </CText>
              </View>
            )}
          </View>

          {isLoadingActas ? (
            <View
              testID="whichIsCorrect_loadingContainer"
              style={styles.loadingContainer}>
              <ActivityIndicator
                testID="whichIsCorrect_loadingIndicator"
                size="large"
                color={colors.primary || '#4F9858'}
              />
              <CText
                testID="whichIsCorrect_loadingText"
                style={styles.loadingText}>
                {String.loadingActas}
              </CText>
            </View>
          ) : actaImages.length === 0 ? (
            <View
              testID="whichIsCorrect_noImagesContainer"
              style={styles.loadingContainer}>
              <CText
                testID="whichIsCorrect_noImagesText"
                style={styles.noImagesText}>
                No se encontraron imágenes para mostrar
              </CText>
              <CText
                testID="whichIsCorrect_debugText"
                style={styles.debugText}>
                Debug: isFromAPI={String(isFromAPI)}, preloadedLength=
                {preloadedActaImages?.length || 0}
              </CText>
            </View>
          ) : (
            <ScrollView
              testID="whichIsCorrect_imageList"
              style={styles.imageList}
              showsVerticalScrollIndicator={false}>
              {isTablet
                ? (() => {
                    const pairs = [];
                    for (let i = 0; i < actaImages.length; i += 2) {
                      pairs.push(actaImages.slice(i, i + 2));
                    }
                    return pairs.map((pair, pairIndex) => (
                      <View
                        key={pairIndex}
                        testID={`whichIsCorrect_tabletRow_${pairIndex}`}
                        style={styles.tabletRow}>
                        {pair.map((image, imageIndex) => {
                          const globalIndex = pairIndex * 2 + imageIndex;
                          const isSelected = selectedImageId === image.id;
                          return (
                            <View
                              key={image.id}
                              testID={`whichIsCorrect_tabletColumn_${globalIndex}`}
                              style={styles.tabletColumn}>
                              <TouchableOpacity
                                testID={`whichIsCorrect_imageCard_${globalIndex}`}
                                style={[
                                  styles.imageCard,
                                  isSelected && styles.imageCardSelected,
                                ]}
                                onPress={() => handleImagePress(image.id)}>
                                <IPFSImageComponent
                                  testID={`whichIsCorrect_IPFSImage_${globalIndex}`}
                                  image={image}
                                />
                                {isSelected && (
                                  <>
                                    <View
                                      testID={`whichIsCorrect_topLeftCorner_${globalIndex}`}
                                      style={[
                                        styles.cornerBorder,
                                        styles.topLeftCorner,
                                      ]}
                                    />
                                    <View
                                      testID={`whichIsCorrect_topRightCorner_${globalIndex}`}
                                      style={[
                                        styles.cornerBorder,
                                        styles.topRightCorner,
                                      ]}
                                    />
                                    <View
                                      testID={`whichIsCorrect_bottomLeftCorner_${globalIndex}`}
                                      style={[
                                        styles.cornerBorder,
                                        styles.bottomLeftCorner,
                                      ]}
                                    />
                                    <View
                                      testID={`whichIsCorrect_bottomRightCorner_${globalIndex}`}
                                      style={[
                                        styles.cornerBorder,
                                        styles.bottomRightCorner,
                                      ]}
                                    />
                                  </>
                                )}
                              </TouchableOpacity>
                              {isSelected && (
                                <TouchableOpacity
                                  testID={`whichIsCorrect_detailsButton_${globalIndex}`}
                                  style={styles.detailsButton}
                                  onPress={() => handleViewMoreDetails(image.id)}>
                                  <CText
                                    testID={`whichIsCorrect_detailsButtonText_${globalIndex}`}
                                    style={styles.detailsButtonText}>
                                    {String.seeMoreDetails}
                                  </CText>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}
                        {pair.length === 1 && (
                          <View
                            testID={`whichIsCorrect_emptyTabletColumn_${pairIndex}`}
                            style={styles.tabletColumn}
                          />
                        )}
                      </View>
                    ));
                  })()
                : actaImages.map((image, index) => {
                    const isSelected = selectedImageId === image.id;
                    return (
                      <React.Fragment key={image.id}>
                        <TouchableOpacity
                          testID={`whichIsCorrect_phoneImageCard_${index}`}
                          style={[
                            styles.imageCard,
                            isSelected && styles.imageCardSelected,
                          ]}
                          onPress={() => handleImagePress(image.id)}>
                          <IPFSImageComponent
                            testID={`whichIsCorrect_phoneIPFSImage_${index}`}
                            image={image}
                          />
                          {isSelected && (
                            <>
                              <View
                                testID={`whichIsCorrect_phoneTopLeftCorner_${index}`}
                                style={[styles.cornerBorder, styles.topLeftCorner]}
                              />
                              <View
                                testID={`whichIsCorrect_phoneTopRightCorner_${index}`}
                                style={[styles.cornerBorder, styles.topRightCorner]}
                              />
                              <View
                                testID={`whichIsCorrect_phoneBottomLeftCorner_${index}`}
                                style={[styles.cornerBorder, styles.bottomLeftCorner]}
                              />
                              <View
                                testID={`whichIsCorrect_phoneBottomRightCorner_${index}`}
                                style={[styles.cornerBorder, styles.bottomRightCorner]}
                              />
                            </>
                          )}
                        </TouchableOpacity>
                        {isSelected && (
                          <TouchableOpacity
                            testID={`whichIsCorrect_phoneDetailsButton_${index}`}
                            style={styles.detailsButton}
                            onPress={() => handleViewMoreDetails(image.id)}>
                            <CText
                              testID={`whichIsCorrect_phoneDetailsButtonText_${index}`}
                              style={styles.detailsButtonText}>
                              {String.seeMoreDetails}
                            </CText>
                          </TouchableOpacity>
                        )}
                      </React.Fragment>
                    );
                  })}
            </ScrollView>
          )}

          <TouchableOpacity
            testID="whichIsCorrect_datosNoCorrectosButton"
            style={[
              styles.datosNoCorrectosButton,
              allowAddNewActa && styles.addNewActaButton,
            ]}
            onPress={handleDatosNoCorrectos}>
            <CText
              testID="addNewRecordText"
              style={[
                styles.datosNoCorrectosButtonText,
                allowAddNewActa && styles.addNewActaButtonText,
              ]}>
              {allowAddNewActa ? 'Agregar Nueva Acta' : String.dataNotCorrect}
            </CText>
          </TouchableOpacity>
        </>
      )}

      <CustomModal
        testID="whichIsCorrectModal"
        visible={modalVisible}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttonText={modalConfig.buttonText}
      />
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  questionContainer: {
    padding: getResponsiveSize(12, 16, 20),
    backgroundColor: '#FFFFFF',
    marginHorizontal: getResponsiveSize(8, 12, 16),
    marginTop: getResponsiveSize(8, 12, 16),
    borderRadius: getResponsiveSize(6, 8, 10),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionText: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '600',
    textAlign: 'center',
    color: '#2F2F2F',
  },
  apiInfoContainer: {
    marginTop: getResponsiveSize(8, 10, 12),
    paddingTop: getResponsiveSize(8, 10, 12),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  apiInfoText: {
    fontSize: getResponsiveSize(13, 14, 15),
    textAlign: 'center',
    color: '#4F9858',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(20, 30, 40),
  },
  loadingText: {
    marginTop: getResponsiveSize(12, 15, 18),
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#666',
    textAlign: 'center',
  },
  noImagesText: {
    fontSize: getResponsiveSize(16, 18, 20),
    color: '#999',
    textAlign: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  debugText: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#666',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  imageList: {
    flex: 1,
    padding: getResponsiveSize(8, 12, 16),
  },
  tabletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSize(8, 12, 16),
  },
  tabletColumn: {
    flex: 0.48,
  },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(6, 8, 10),
    padding: getResponsiveSize(6, 8, 12),
    marginBottom: getResponsiveSize(8, 12, 16),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  imageCardSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  imageCardCorrect: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  imageCardIncorrect: {
    borderWidth: 2,
    borderColor: '#F44336',
  },
  imageDisplay: {
    width: '100%',
    height: getResponsiveSize(120, 150, 200),
    borderRadius: getResponsiveSize(3, 4, 6),
  },
  cornerBorder: {
    position: 'absolute',
    width: getResponsiveSize(16, 20, 24),
    height: getResponsiveSize(16, 20, 24),
    borderColor: '#2F2F2F',
    borderWidth: 2,
  },
  topLeftCorner: {
    top: getResponsiveSize(6, 8, 12),
    left: getResponsiveSize(6, 8, 12),
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightCorner: {
    top: getResponsiveSize(6, 8, 12),
    right: getResponsiveSize(6, 8, 12),
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    bottom: getResponsiveSize(6, 8, 12),
    left: getResponsiveSize(6, 8, 12),
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    bottom: getResponsiveSize(6, 8, 12),
    right: getResponsiveSize(6, 8, 12),
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  statusIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  correctIcon: {
    backgroundColor: '#4CAF50',
  },
  incorrectIcon: {
    backgroundColor: '#F44336',
  },
  confirmationImageContainer: {
    marginBottom: 16,
  },
  confirmationButtonsContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  changeOpinionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  changeOpinionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailsButton: {
    backgroundColor: '#459151',
    paddingVertical: getResponsiveSize(10, 12, 16),
    borderRadius: getResponsiveSize(6, 8, 10),
    alignItems: 'center',
    marginTop: getResponsiveSize(-6, -8, -10),
    marginBottom: getResponsiveSize(8, 12, 16),
    marginHorizontal: isTablet ? 0 : getResponsiveSize(12, 16, 20),
  },
  detailsButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#fff',
  },
  datosNoCorrectosButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: getResponsiveSize(12, 14, 18),
    borderRadius: getResponsiveSize(6, 8, 10),
    alignItems: 'center',
    marginTop: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(20, 24, 32),
    marginHorizontal: getResponsiveSize(12, 16, 20),
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  datosNoCorrectosButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#D32F2F',
  },
  addNewActaButton: {
    borderColor: '#4F9858',
    backgroundColor: '#F8F9FA',
  },
  addNewActaButtonText: {
    color: '#4F9858',
  },
  imageError: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getResponsiveSize(3, 4, 6),
  },
  imageErrorText: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#999',
    marginTop: getResponsiveSize(4, 6, 8),
    textAlign: 'center',
  },
  imageErrorSubtext: {
    fontSize: getResponsiveSize(10, 12, 14),
    color: '#ccc',
    marginTop: getResponsiveSize(2, 4, 6),
    textAlign: 'center',
  },
  loadingIndicatorText: {
    fontSize: getResponsiveSize(10, 12, 14),
    color: '#666',
    marginTop: getResponsiveSize(4, 6, 8),
    textAlign: 'center',
  },
  imageLoading: {
    opacity: 0.5,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: getResponsiveSize(3, 4, 6),
  },
});

export default WhichIsCorrectScreen;
