import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import UniversalHeader from '../../../components/common/UniversalHeader';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import String from '../../../i18n/String';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const ActaDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  
  const {
    selectedActa,
    tableData,
    partyResults,
    voteSummaryResults,
    allActas,
    onCorrectActaSelected,
    onUploadNewActa,
  } = route.params || {};

  console.log('ActaDetailScreen - Received params:', route.params);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleThisIsCorrect = () => {
    console.log('ActaDetailScreen - This is correct pressed for acta:', selectedActa.id);
    if (onCorrectActaSelected) {
      onCorrectActaSelected(selectedActa.id);
    }
    navigation.goBack();
  };

  const handleUploadCorrectActa = () => {
    console.log('ActaDetailScreen - Upload correct acta pressed');
    if (onUploadNewActa) {
      onUploadNewActa();
    }
  };

  const handleChange = () => {
    console.log('ActaDetailScreen - Change pressed');
    navigation.goBack();
  };

  const renderPartyResult = (party, index) => (
    <View key={party.id || index} style={styles.partyRow}>
      <CText style={[styles.partyName, {color: colors.text}]}>
        {party.partido}
      </CText>
      <View style={styles.votesContainer}>
        <View style={styles.voteColumn}>
          <CText style={[styles.voteNumber, {color: colors.primary}]}>
            {party.presidente}
          </CText>
        </View>
        <View style={styles.voteColumn}>
          <CText style={[styles.voteNumber, {color: colors.primary}]}>
            {party.diputado}
          </CText>
        </View>
      </View>
    </View>
  );

  const renderVoteSummary = (summary, index) => (
    <View key={summary.id || index} style={styles.summaryRow}>
      <CText style={[styles.summaryLabel, {color: colors.text}]}>
        {summary.label}
      </CText>
      <View style={styles.summaryValues}>
        <CText style={[styles.summaryValue, {color: colors.primary}]}>
          {summary.value1}
        </CText>
        <CText style={[styles.summaryValue, {color: colors.primary}]}>
          {summary.value2}
        </CText>
      </View>
    </View>
  );

  return (
    <CSafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <UniversalHeader
        colors={colors}
        onBack={handleBack}
        title={`${String.table} ${
          tableData?.tableNumber ||
          tableData?.numero ||
          tableData?.number ||
          'N/A'
        }`}
        showNotification={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Acta Image */}
        <View style={[styles.imageContainer, {backgroundColor: colors.cardBackground || '#FFFFFF'}]}>
          <Image
            source={{uri: selectedActa.uri}}
            style={styles.actaImage}
            resizeMode="contain"
          />
        </View>

        {/* Table Information */}
        <View style={[styles.infoCard, {backgroundColor: colors.cardBackground || '#FFFFFF'}]}>
          <CText style={[styles.sectionTitle, {color: colors.text}]}>
            {String.tableInformation}
          </CText>
          <View style={styles.infoRow}>
            <CText style={[styles.infoLabel, {color: colors.textSecondary}]}>
              {String.table}:
            </CText>
            <CText style={[styles.infoValue, {color: colors.text}]}>
              {tableData?.numero || 'N/A'}
            </CText>
          </View>
          <View style={styles.infoRow}>
            <CText style={[styles.infoLabel, {color: colors.textSecondary}]}>
              {String.precinct}:
            </CText>
            <CText style={[styles.infoValue, {color: colors.text}]}>
              {tableData?.recinto || 'N/A'}
            </CText>
          </View>
        </View>

        {/* Party Results */}
        {partyResults && partyResults.length > 0 && (
          <View style={[styles.resultsCard, {backgroundColor: colors.cardBackground || '#FFFFFF'}]}>
            <CText style={[styles.sectionTitle, {color: colors.text}]}>
              {String.registeredVotes}
            </CText>
            <View style={styles.tableHeader}>
              <CText style={[styles.headerText, {color: colors.text}]}>Partido</CText>
              <View style={styles.votesHeader}>
                <CText style={[styles.headerText, {color: colors.text}]}>Pres.</CText>
                <CText style={[styles.headerText, {color: colors.text}]}>Dip.</CText>
              </View>
            </View>
            {partyResults.map(renderPartyResult)}
          </View>
        )}

        {/* Vote Summary */}
        {voteSummaryResults && voteSummaryResults.length > 0 && (
          <View style={[styles.resultsCard, {backgroundColor: colors.cardBackground || '#FFFFFF'}]}>
            <View style={styles.tableHeader}>
              <CText style={[styles.headerText, {color: colors.text}]}>Resumen</CText>
              <View style={styles.votesHeader}>
                <CText style={[styles.headerText, {color: colors.text}]}>Pres.</CText>
                <CText style={[styles.headerText, {color: colors.text}]}>Dip.</CText>
              </View>
            </View>
            {voteSummaryResults.map(renderVoteSummary)}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.buttonContainer, {backgroundColor: colors.background}]}>
        <TouchableOpacity
          style={[styles.correctButton, {backgroundColor: colors.primary || '#4F9858'}]}
          onPress={handleThisIsCorrect}
          activeOpacity={0.8}>
          <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
          <CText style={styles.correctButtonText}>
            {String.correctData}
          </CText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadButton, {backgroundColor: colors.secondary || '#2196F3'}]}
          onPress={handleUploadCorrectActa}
          activeOpacity={0.8}>
          <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
          <CText style={styles.uploadButtonText}>
            Subir foto de acta correcta
          </CText>
        </TouchableOpacity>

        {/* Show Change button only if there are multiple actas */}
        {allActas && allActas.length > 1 && (
          <TouchableOpacity
            style={[styles.changeButton, {borderColor: colors.textSecondary}]}
            onPress={handleChange}
            activeOpacity={0.8}>
            <MaterialIcons name="swap-horiz" size={20} color={colors.textSecondary} />
            <CText style={[styles.changeButtonText, {color: colors.textSecondary}]}>
              Cambiar
            </CText>
          </TouchableOpacity>
        )}
      </View>
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actaImage: {
    width: '100%',
    height: getResponsiveSize(200, 250, 300),
    borderRadius: 8,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  votesHeader: {
    flexDirection: 'row',
    width: 80,
    justifyContent: 'space-between',
  },
  partyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  votesContainer: {
    flexDirection: 'row',
    width: 80,
    justifyContent: 'space-between',
  },
  voteColumn: {
    alignItems: 'center',
    width: 35,
  },
  voteNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  summaryValues: {
    flexDirection: 'row',
    width: 80,
    justifyContent: 'space-between',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    width: 35,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  correctButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  correctButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ActaDetailScreen;
