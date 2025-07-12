import React, {useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import BaseRecordReviewScreen from '../../../components/common/BaseRecordReviewScreen';
import {moderateScale} from '../../../common/constants';
import String from '../../../i18n/String';

const PhotoReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {photoUri, mesaData} = route.params || {};

  // State for editable fields
  const [isEditing, setIsEditing] = useState(false);

  // State for the new party results table
  const [partyResults, setPartyResults] = useState([
    {id: 'unidad', partido: String.partyUnit, presidente: '33', diputado: '29'},
    {
      id: 'mas-ipsp',
      partido: String.partyMasIpsp,
      presidente: '3',
      diputado: '1',
    },
    {id: 'pdc', partido: String.partyPdc, presidente: '17', diputado: '16'},
    {id: 'morena', partido: String.partyMorena, presidente: '1', diputado: '0'},
  ]);

  // New state for the vote summary table (Votos, Blancos, Nulos)
  const [voteSummaryResults, setVoteSummaryResults] = useState([
    {id: 'validos', label: String.validVotes, value1: '141', value2: '176'},
    {id: 'blancos', label: String.blankVotes, value1: '64', value2: '3'},
    {id: 'nulos', label: String.nullVotes, value1: '6', value2: '9'},
  ]);

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
    navigation.navigate('PhotoConfirmationScreen', {
      photoUri,
      mesaData,
      partyResults,
      voteSummaryResults,
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
    <BaseRecordReviewScreen
      colors={colors}
      headerTitle={String.acta}
      instructionsText={String.reviewPhotoPlease}
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
      mesaData={mesaData}
    />
  );
};

export default PhotoReviewScreen;
