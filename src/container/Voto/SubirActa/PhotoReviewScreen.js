import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText'; // Assuming this path is correct for your project
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Import MaterialIcons
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons for the bell icon
import {moderateScale} from '../../../common/constants'; // Assuming this path is correct for your project

const {width: screenWidth} = Dimensions.get('window');

const PhotoReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme); // Assuming colors are managed by Redux
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

  // Renders a row for each party's results
  const renderPartyResultRow = (party, index) => {
    return (
      <View key={party.id} style={styles.partyTableRow}>
        <CText style={styles.partyNameText}>{party.partido}</CText>
        <View style={styles.partyVoteContainer}>
          {isEditing ? (
            <TextInput
              style={styles.partyVoteInput}
              value={party.presidente}
              onChangeText={value =>
                updatePartyResult(party.id, 'presidente', value)
              }
              keyboardType="numeric"
            />
          ) : (
            <CText style={styles.partyVoteText}>{party.presidente}</CText>
          )}
        </View>
        <View style={styles.partyVoteContainer}>
          {isEditing ? (
            <TextInput
              style={styles.partyVoteInput}
              value={party.diputado}
              onChangeText={value =>
                updatePartyResult(party.id, 'diputado', value)
              }
              keyboardType="numeric"
            />
          ) : (
            <CText style={styles.partyVoteText}>{party.diputado}</CText>
          )}
        </View>
      </View>
    );
  };

  // Renders a row for each vote summary item
  const renderVoteSummaryRow = (item, index) => {
    return (
      <View key={item.id} style={styles.voteSummaryTableRow}>
        <CText style={styles.voteSummaryLabel}>{item.label}</CText>
        <View style={styles.voteSummaryValueContainer}>
          {isEditing ? (
            <TextInput
              style={styles.voteSummaryInput}
              value={item.value1}
              onChangeText={value =>
                updateVoteSummaryResult(item.id, 'value1', value)
              }
              keyboardType="numeric"
            />
          ) : (
            <CText style={styles.voteSummaryValue}>{item.value1}</CText>
          )}
        </View>
        <View style={styles.voteSummaryValueContainer}>
          {isEditing ? (
            <TextInput
              style={styles.voteSummaryInput}
              value={item.value2}
              onChangeText={value =>
                updateVoteSummaryResult(item.id, 'value2', value)
              }
              keyboardType="numeric"
            />
          ) : (
            <CText style={styles.voteSummaryValue}>{item.value2}</CText>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: '#FFFFFF'}]}>
      {' '}
      {/* Fondo de toda la vista blanco */}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons
            name="keyboard-arrow-left"
            size={moderateScale(36)}
            color={colors.black || '#2F2F2F'}
          />
        </TouchableOpacity>
        <CText
          style={{
            ...styles.headerTitle,
            fontWeight: 'bold',
            fontSize: moderateScale(25),
            borderBottomWidth: 0,
            backgroundColor: 'transparent',
            paddingVertical: 0,
            marginBottom: 0,
            color: colors.text || '#2F2F2F',
          }}>
          Mesa {mesaData?.numero || 'N/A'}
        </CText>
        {/* Spacer to push the bell icon to the right */}
        <View style={styles.headerSpacer} />
        {/* Bell Icon */}
        <TouchableOpacity style={styles.bellIcon}>
          <Ionicons
            name="notifications-outline"
            size={moderateScale(36)}
            color={colors.text || '#2F2F2F'}
          />
        </TouchableOpacity>
      </View>
      {/* Instruction Text below Header */}
      <View
        style={{
          backgroundColor: '#FFFFFF', // Fondo blanco para esta sección
          paddingHorizontal: moderateScale(16),
          paddingBottom: moderateScale(12),
          marginTop: moderateScale(0),
          borderBottomWidth: 0, // Eliminado borde inferior
          borderBottomColor: 'transparent', // Asegurado color de borde transparente
        }}>
        <CText
          style={{
            ...styles.instructionsText,
            fontSize: moderateScale(18),
            fontWeight: '500',
            color: colors.text || '#000000',
            paddingBottom: 0,
            borderBottomWidth: 0,
            borderBottomColor: 'transparent',
            backgroundColor: 'transparent',
          }}>
          Revise la foto por favor
        </CText>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo of the Act */}
        <View style={styles.photoContainer}>
          <Image
            source={{uri: photoUri}}
            style={styles.photo}
            resizeMode="contain"
          />
          {/* Corner borders for the image */}
          <View style={[styles.cornerBorder, styles.topLeftCorner]} />
          <View style={[styles.cornerBorder, styles.topRightCorner]} />
          <View style={[styles.cornerBorder, styles.bottomLeftCorner]} />
          <View style={[styles.cornerBorder, styles.bottomRightCorner]} />
        </View>

        {/* Party Results Table */}
        <View style={styles.partyTableContainer}>
          <View style={styles.partyTableHeader}>
            <CText
              style={[
                styles.partyTableHeaderText,
                {
                  flex: 1,
                  textAlign: 'left',
                  paddingLeft: 0,
                  marginLeft: 0,
                  fontSize: 14,
                },
              ]}>
              Partido
            </CText>
            <CText style={[styles.partyTableHeaderText, {flex: 1}]}>
              PRESIDENTE/A
            </CText>
            <CText style={[styles.partyTableHeaderText, {flex: 1}]}>
              DIPUTADO/A
            </CText>
          </View>
          {partyResults.map((party, index) =>
            renderPartyResultRow(party, index),
          )}
        </View>

        {/* New Vote Summary Table */}
        <View style={styles.voteSummaryTableContainer}>
          <CText style={styles.voteSummaryTableTitle}>Votos</CText>
          {voteSummaryResults.map((item, index) =>
            renderVoteSummaryRow(item, index),
          )}
        </View>

        {/* Acciones Section Title */}
        <CText style={styles.accionesTitle}>Acciones</CText>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isEditing ? (
            <>
              {/* Edit Button */}
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <CText style={styles.editButtonText}>Editar</CText>
              </TouchableOpacity>
              {/* Next Button */}
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <CText style={styles.nextButtonText}>Siguiente</CText>
              </TouchableOpacity>
            </>
          ) : (
            // Save Button when editing
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <CText style={styles.saveButtonText}>Guardar</CText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}>
          <Ionicons
            name="home-outline"
            size={moderateScale(24)}
            color={colors.primary || '#459151'}
          />
          <CText style={styles.navText}>Inicio</CText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}>
          <Ionicons
            name="person-outline"
            size={moderateScale(24)}
            color={colors.text || '#868686'}
          />
          <CText style={styles.navText}>Perfil</CText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EFF1', // Original background color, but overridden inline for white
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#fff',
    borderBottomWidth: 0, // Eliminado el borde inferior del header
    borderBottomColor: 'transparent', // Asegurado color de borde transparente
  },
  backButton: {
    padding: moderateScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#2F2F2F',
    marginLeft: moderateScale(8),
  },
  headerSpacer: {
    flex: 1,
  },
  bellIcon: {
    padding: moderateScale(8),
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(12),
    // Los bordes fueron eliminados directamente en el estilo inline del componente
  },
  instructionsText: {
    fontSize: moderateScale(14),
    color: '#868686',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
  },
  mesaInfoContainer: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginVertical: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  mesaTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: moderateScale(4),
  },
  mesaSubtitle: {
    fontSize: moderateScale(14),
    color: '#868686',
  },
  photoContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(8),
    marginBottom: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative', // Needed for absolute positioning of corner borders
  },
  photo: {
    width: '100%',
    height: moderateScale(200),
    borderRadius: moderateScale(4),
    // Removed borderWidth and borderColor here, replaced by corner borders
  },
  // Styles for the corner borders
  cornerBorder: {
    position: 'absolute',
    width: moderateScale(20), // Length of the corner lines
    height: moderateScale(20), // Length of the corner lines
    borderColor: '#2F2F2F', // Color of the corner lines
    borderWidth: 2, // Thickness of the corner lines
  },
  topLeftCorner: {
    top: moderateScale(8),
    left: moderateScale(8),
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightCorner: {
    top: moderateScale(8),
    right: moderateScale(8),
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    bottom: moderateScale(8),
    left: moderateScale(8),
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    bottom: moderateScale(8),
    right: moderateScale(8),
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  partyTableContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(16),
    elevation: 2,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowColor: 'white',
  },
  partyTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0F2F7', // Light blue from image
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
    borderBottomLeftRadius: moderateScale(8), // Added for rounded corners on all sides
    borderBottomRightRadius: moderateScale(8), // Added for rounded corners on all sides
  },
  partyTableHeaderText: {
    // flex: 1, // Adjusted inline
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
  },
  partyTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'white', // Made lines more visible
  },
  partyNameText: {
    flex: 1, // Adjusted flex to match header
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#2F2F2F',
  },
  partyVoteContainer: {
    flex: 1, // Adjusted flex to match header
    alignItems: 'center', // Centered alignment for numbers
    justifyContent: 'center', // Ensure content is truly centered
  },
  partyVoteText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: 'White', // Changed to white for better contrast
    textAlign: 'center', // Centered text
    width: '100%',
  },
  partyVoteInput: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#2F2F2F',
    borderWidth: 1,
    borderColor: '#459151',
    borderRadius: moderateScale(4),
    padding: moderateScale(8),
    textAlign: 'center', // Centered text input
    minWidth: moderateScale(50),
    width: '100%',
  },
  voteSummaryTableContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(24),
    elevation: 2,
    shadowColor: 'white',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: moderateScale(12),
  },
  voteSummaryTableTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: moderateScale(8),
    paddingHorizontal: moderateScale(16),
  },
  voteSummaryTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'white',
  },
  voteSummaryLabel: {
    flex: 1, // Adjusted flex for alignment
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#2F2F2F',
  },
  voteSummaryValueContainer: {
    flex: 1, // Adjusted flex for alignment
    alignItems: 'center', // Centered alignment for numbers
    justifyContent: 'center', // Ensure content is truly centered
  },
  voteSummaryValue: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: 'White', // Changed to white for better contrast
    textAlign: 'center', // Centered text
    width: '100%',
  },
  voteSummaryInput: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#2F2F2F',
    borderWidth: 1,
    borderColor: '#459151',
    borderRadius: moderateScale(4),
    padding: moderateScale(8),
    textAlign: 'center', // Centered text input
    minWidth: moderateScale(50),
    width: '100%',
  },
  accionesTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: moderateScale(16),
    paddingHorizontal: moderateScale(16),
  },
  actionButtons: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: moderateScale(32),
  },
  editButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(12),
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#2F2F2F',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#459151',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#32B974',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#fff',
  },
  // --- Bottom Navigation (Inicio/Perfil) ---
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: moderateScale(10),
  },
  navItem: {
    alignItems: 'center',
    padding: moderateScale(8),
  },
  navText: {
    fontSize: moderateScale(12),
    color: '#868686',
    marginTop: moderateScale(4),
  },
});

export default PhotoReviewScreen;
