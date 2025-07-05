import React, {useState} from 'react';
import {Alert, StyleSheet} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import BaseActaReviewScreen from '../../../components/common/BaseActaReviewScreen';
import {moderateScale} from '../../../common/constants';

const PhotoReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {photoUri, mesaData} = route.params || {};

  // State for editable fields
  const [isEditing, setIsEditing] = useState(false);

  // State for the new party results table
  const [partyResults, setPartyResults] = useState([
    {id: 'unidad', partido: 'Unidad', presidente: '33', diputado: '29'},
    {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '3', diputado: '1'},
    {id: 'pdc', partido: 'PDC', presidente: '17', diputado: '16'},
    {id: 'morena', partido: 'Morena', presidente: '1', diputado: '0'},
  ]);

  // New state for the vote summary table (Votos, Blancos, Nulos)
  const [voteSummaryResults, setVoteSummaryResults] = useState([
    {id: 'validos', label: 'Válidos', value1: '141', value2: '176'},
    {id: 'blancos', label: 'Blancos', value1: '64', value2: '3'},
    {id: 'nulos', label: 'Nulos', value1: '6', value2: '9'},
  ]);

  // Handler for editing votes
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Handler for saving changes
  const handleSave = () => {
    setIsEditing(false);
    Alert.alert('Guardado', 'Los cambios han sido guardados correctamente.');
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
          text: 'Editar',
          onPress: handleEdit,
          style: {
            backgroundColor: '#fff',
            borderColor: colors.primary || '#459151',
            borderWidth: moderateScale(1),
            flex: 1,
            marginRight: moderateScale(8),
          },
          textStyle: {
            color: colors.primary || '#459151',
          },
        },
        {
          text: 'Siguiente',
          onPress: handleNext,
          style: {
            backgroundColor: colors.primary || '#459151',
            flex: 1,
            marginLeft: moderateScale(8),
          },
          textStyle: {
            color: '#fff',
          },
        },
      ]
    : [
        {
          text: 'Guardar',
          onPress: handleSave,
          style: {
            backgroundColor: colors.primary || '#459151',
          },
          textStyle: {
            color: '#fff',
          },
        },
      ];

  return (
    <BaseActaReviewScreen
      colors={colors}
      headerTitle="Acta"
      instructionsText="Revise la foto por favor"
      instructionsStyle={styles.instructionsStyle}
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

const styles = StyleSheet.create({
  instructionsStyle: {
    fontSize: moderateScale(18),
    fontWeight: '500',
    color: '#000000',
  },
});

export default PhotoReviewScreen;
