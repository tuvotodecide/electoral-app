import React from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import BaseActaReviewScreen from '../../../components/common/BaseActaReviewScreen';
import String from '../../../i18n/String';

const ActaReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {
    photoUri,
    mesaData,
    partyResults: routePartyResults,
    voteSummaryResults: routeVoteSummaryResults,
  } = route.params || {};

  console.log('ActaReviewScreen - Received params:', route.params);

  // Use dynamic data if available, otherwise fallback to static data
  const partyResults = routePartyResults || [
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

  // Use dynamic data if available, otherwise fallback to static data
  const voteSummaryResults = routeVoteSummaryResults || [
    {id: 'validos', label: String.validVotes, value1: '141', value2: '176'},
    {id: 'blancos', label: String.blankVotes, value1: '64', value2: '3'},
    {id: 'nulos', label: String.nullVotes, value1: '6', value2: '9'},
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
    {
      text: String.correctData,
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
      headerTitle={`${String.table} ${mesaData?.numero || 'N/A'}`}
      instructionsText={String.reviewActaData}
      photoUri={photoUri}
      partyResults={partyResults}
      voteSummaryResults={voteSummaryResults}
      actionButtons={actionButtons}
      onBack={handleBack}
    />
  );
};

export default ActaReviewScreen;
