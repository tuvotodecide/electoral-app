import React from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import BaseRecordReviewScreen from '../../../components/common/BaseRecordReviewScreen';
import String from '../../../i18n/String';
import {StackNav} from '../../../navigation/NavigationKey';

const MyWitnessesDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {
    photoUri,
    mesaData,
    partyResults: apiPartyResults,
    voteSummaryResults: apiVoteSummaryResults,
    attestationData,
    certificateUrl: routeCertificateUrl,
  } = route.params || {};

  // Usar los datos reales del API que vienen desde MyWitnessesListScreen
  const partyResults = apiPartyResults || [];
  const voteSummaryResults = apiVoteSummaryResults || [];
  const certificateUrl =
    routeCertificateUrl || attestationData?.certificateUrl || null;
  const handleBack = () => {
    navigation.goBack();
  };

  const handleViewCertificate = () => {
    if (!certificateUrl) return;

    // Mismo formato que usan las notificaciones (screen: 'SuccessScreen')
    navigation.navigate(StackNav.SuccessScreen, {
      certificateData: {
        imageUrl: certificateUrl,
      },
      nftData: {
        nftUrl: certificateUrl,
      },
    });
  };

  const actionButtons = [
    ...(certificateUrl
      ? [
          {
            text: 'Ver certificado',
            onPress: handleViewCertificate,
            testID: 'viewCertificateButton',
            style: {
              backgroundColor: colors.primary || '#459151',
              borderWidth: 0,
            },
            textStyle: {
              color: '#fff',
            },
          },
        ]
      : []),
    {
      text: String.goBack,
      onPress: handleBack,
      testID: 'myWitnessesDetailGoBackButton',
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
    ? `Resultados atestiguados para ${
        mesaData.mesa || `Mesa ${mesaData.tableNumber}`
      }`
    : String.registeredVotes;

  return (
    <BaseRecordReviewScreen
      testID="myWitnessesDetailBaseScreen"
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
