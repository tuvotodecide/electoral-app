import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../../../common/constants';

const MisAtestiguamientosDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {photoUri, mesaData} = route.params || {};

  // Static data for the party results table
  const partyResults = [
    {id: 'unidad', partido: 'Unidad', presidente: '33', diputado: '29'},
    {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '3', diputado: '1'},
    {id: 'pdc', partido: 'PDC', presidente: '17', diputado: '16'},
    {id: 'morena', partido: 'Morena', presidente: '1', diputado: '0'},
  ];

  // Static data for the vote summary table
  const voteSummaryResults = [
    {id: 'validos', label: 'Válidos', value1: '141', value2: '176'},
    {id: 'blancos', label: 'Blancos', value1: '64', value2: '3'},
    {id: 'nulos', label: 'Nulos', value1: '6', value2: '9'},
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  // Renders a row for each party's results
  const renderPartyResultRow = (party, index) => {
    return (
      <View key={party.id} style={styles.partyTableRow}>
        <CText style={styles.partyNameText}>{party.partido}</CText>
        <View style={styles.partyVoteContainer}>
          <CText style={styles.partyVoteText}>{party.presidente}</CText>
        </View>
        <View style={styles.partyVoteContainer}>
          <CText style={styles.partyVoteText}>{party.diputado}</CText>
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
          <CText style={styles.voteSummaryValue}>{item.value1}</CText>
        </View>
        <View style={styles.voteSummaryValueContainer}>
          <CText style={styles.voteSummaryValue}>{item.value2}</CText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons
            name="keyboard-arrow-left"
            size={moderateScale(36)}
            color={colors.black || '#2F2F2F'}
          />
        </TouchableOpacity>
        <CText style={styles.headerTitle}>Detalle del Atestiguamiento</CText>
        <View style={styles.headerSpacer} />
        <TouchableOpacity style={styles.bellIcon}>
          <Ionicons
            name="notifications-outline"
            size={moderateScale(36)}
            color={colors.text || '#2F2F2F'}
          />
        </TouchableOpacity>
      </View>

      {/* Instruction Text */}
      <View style={styles.instructionsContainer}>
        <CText style={styles.instructionsText}>
          Los votos registrados de la mesa 
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
            <CText style={styles.partyTableHeaderLeft}>Partido</CText>
            <CText style={styles.partyTableHeaderCenter}>PRESIDENTE/A</CText>
            <CText style={styles.partyTableHeaderCenter}>DIPUTADO/A</CText>
          </View>
          {partyResults.map((party, index) =>
            renderPartyResultRow(party, index),
          )}
        </View>

        {/* Vote Summary Table */}
        <View style={styles.voteSummaryTableContainer}>
          <CText style={styles.voteSummaryTableTitle}>Votos</CText>
          {voteSummaryResults.map((item, index) =>
            renderVoteSummaryRow(item, index),
          )}
        </View>

        {/* Only Back Button */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.backActionButton}
            onPress={handleBack}>
            <CText style={styles.backActionButtonText}>Volver</CText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons
            name="home-outline"
            size={moderateScale(24)}
            color={colors.primary || '#459151'}
          />
          <CText style={styles.navText}>Inicio</CText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  backButton: {
    padding: moderateScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(20),
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
    backgroundColor: '#ffffff',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    marginTop: moderateScale(0),
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(16),
    borderRadius: moderateScale(8),
  },
  instructionsText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
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
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: moderateScale(200),
    borderRadius: moderateScale(4),
  },
  cornerBorder: {
    position: 'absolute',
    width: moderateScale(20),
    height: moderateScale(20),
    borderColor: '#2F2F2F',
    borderWidth: 2,
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
    shadowColor: '#000',
  },
  partyTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0F2F7',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
  },
  partyTableHeaderLeft: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'left',
  },
  partyTableHeaderCenter: {
    flex: 1,
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
    borderBottomColor: '#E0E0E0',
  },
  partyNameText: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#2F2F2F',
  },
  partyVoteContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyVoteText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
    width: '100%',
  },
  voteSummaryTableContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(24),
    elevation: 2,
    shadowColor: '#000',
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
    borderBottomColor: '#E0E0E0',
  },
  voteSummaryLabel: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#2F2F2F',
  },
  voteSummaryValueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteSummaryValue: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
    width: '100%',
  },
  actionButtons: {
    marginBottom: moderateScale(32),
  },
  backActionButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  backActionButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#2F2F2F',
  },
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

export default MisAtestiguamientosDetailScreen;
