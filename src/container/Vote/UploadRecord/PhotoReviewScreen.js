import React, {useState} from 'react';
import {StyleSheet} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import BaseRecordReviewScreen from '../../../components/common/BaseRecordReviewScreen';
import String from '../../../i18n/String';
import CustomModal from '../../../components/common/CustomModal';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKey';

const PhotoReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {photoUri, tableData} = route.params || {};

  // State for editable fields
  const [isEditing, setIsEditing] = useState(false);

  // Estados para el modal
  const [modalVisible, setModalVisible] = useState(false);

  // State for the new party results table
  const [partyResults, setPartyResults] = useState([
    {id: 'unidad', partido: String.unidad, presidente: '33', diputado: '29'},
    {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '3', diputado: '1'},
    {id: 'pdc', partido: String.pdc, presidente: '17', diputado: '16'},
    {id: 'morena', partido: String.morena, presidente: '1', diputado: '0'},
  ]);

  // New state for the vote summary table (Votos, Blancos, Nulos)
  const [voteSummaryResults, setVoteSummaryResults] = useState([
    {id: 'validos', label: String.valid, value1: '141', value2: '176'},
    {id: 'blancos', label: String.blank, value1: '64', value2: '3'},
    {id: 'nulos', label: String.null, value1: '6', value2: '9'},
  ]);

  // Handler for editing votes
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Handler for saving changes
  const handleSave = () => {
    setIsEditing(false);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  // Handler for navigating to the next screen
  const handleNext = () => {

    navigation.navigate(StackNav.PhotoConfirmationScreen, {
      photoUri,
      tableData,
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
          testID: 'photoReviewEditButton',
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
          text: String.next,
          onPress: handleNext,
          testID: 'photoReviewNextButton',
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
          text: String.save,
          onPress: handleSave,
          testID: 'photoReviewSaveButton',
          style: {
            backgroundColor: colors.primary || '#459151',
          },
          textStyle: {
            color: '#fff',
          },
        },
      ];

  return (
    <>
      <BaseRecordReviewScreen
        testID="photoReviewScreenBase"
        colors={colors}
        headerTitle={`${String.table} ${
          tableData?.tableNumber ||
          tableData?.numero ||
          tableData?.number ||
          'N/A'
        }`}
        instructionsText={String.reviewPhotoPlease}
        instructionsStyle={styles.instructionsStyle}
        photoUri={photoUri}
        partyResults={partyResults}
        voteSummaryResults={voteSummaryResults}
        isEditing={isEditing}
        onPartyUpdate={updatePartyResult}
        onVoteSummaryUpdate={updateVoteSummaryResult}
        actionButtons={actionButtons}
        onBack={handleBack}
        showTableInfo={true}
        tableData={tableData}
      />

      <CustomModal
        testID="photoReviewSuccessModal"
        visible={modalVisible}
        onClose={closeModal}
        type="success"
        title={String.saved}
        message={String.changesSavedSuccessfully}
        buttonText={String.accept}
      />
    </>
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
