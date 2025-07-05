import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import CText from './CText';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../../common/constants';

// Header Component
export const ActaHeader = ({onBack, title, colors}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <MaterialIcons
        name="keyboard-arrow-left"
        size={moderateScale(36)}
        color={colors.black || '#2F2F2F'}
      />
    </TouchableOpacity>
    <CText style={styles.headerTitle}>{title}</CText>
    <View style={styles.headerSpacer} />
    <TouchableOpacity style={styles.bellIcon}>
      <Ionicons
        name="notifications-outline"
        size={moderateScale(36)}
        color={colors.text || '#2F2F2F'}
      />
    </TouchableOpacity>
  </View>
);

// Instructions Component
export const InstructionsContainer = ({text, style}) => (
  <View style={[styles.instructionsContainer, style]}>
    <CText style={styles.instructionsText}>{text}</CText>
  </View>
);

// Photo Container Component
export const PhotoContainer = ({photoUri}) => (
  <View style={styles.photoContainer}>
    <Image source={{uri: photoUri}} style={styles.photo} resizeMode="contain" />
    <View style={[styles.cornerBorder, styles.topLeftCorner]} />
    <View style={[styles.cornerBorder, styles.topRightCorner]} />
    <View style={[styles.cornerBorder, styles.bottomLeftCorner]} />
    <View style={[styles.cornerBorder, styles.bottomRightCorner]} />
  </View>
);

// Party Table Row Component
export const PartyTableRow = ({party, isEditing, onUpdate}) => (
  <View style={styles.partyTableRow}>
    <CText style={styles.partyNameText}>{party.partido}</CText>
    <View style={styles.partyVoteContainer}>
      {isEditing ? (
        <TextInput
          style={styles.partyVoteInput}
          value={party.presidente}
          onChangeText={value => onUpdate(party.id, 'presidente', value)}
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
          onChangeText={value => onUpdate(party.id, 'diputado', value)}
          keyboardType="numeric"
        />
      ) : (
        <CText style={styles.partyVoteText}>{party.diputado}</CText>
      )}
    </View>
  </View>
);

// Party Table Component
export const PartyTable = ({partyResults, isEditing = false, onUpdate}) => (
  <View style={styles.partyTableContainer}>
    <View style={styles.partyTableHeader}>
      <CText style={styles.partyTableHeaderLeft}>Partido</CText>
      <CText style={styles.partyTableHeaderCenter}>PRESIDENTE/A</CText>
      <CText style={styles.partyTableHeaderCenter}>DIPUTADO/A</CText>
    </View>
    {partyResults.map((party, index) => (
      <PartyTableRow
        key={party.id}
        party={party}
        isEditing={isEditing}
        onUpdate={onUpdate}
      />
    ))}
  </View>
);

// Vote Summary Row Component
export const VoteSummaryRow = ({item, isEditing, onUpdate}) => (
  <View style={styles.voteSummaryTableRow}>
    <CText style={styles.voteSummaryLabel}>{item.label}</CText>
    <View style={styles.voteSummaryValueContainer}>
      {isEditing ? (
        <TextInput
          style={styles.voteSummaryInput}
          value={item.value1}
          onChangeText={value => onUpdate(item.id, 'value1', value)}
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
          onChangeText={value => onUpdate(item.id, 'value2', value)}
          keyboardType="numeric"
        />
      ) : (
        <CText style={styles.voteSummaryValue}>{item.value2}</CText>
      )}
    </View>
  </View>
);

// Vote Summary Table Component
export const VoteSummaryTable = ({
  voteSummaryResults,
  isEditing = false,
  onUpdate,
}) => (
  <View style={styles.voteSummaryTableContainer}>
    <CText style={styles.voteSummaryTableTitle}>Votos</CText>
    {voteSummaryResults.map((item, index) => (
      <VoteSummaryRow
        key={item.id}
        item={item}
        isEditing={isEditing}
        onUpdate={onUpdate}
      />
    ))}
  </View>
);

// Action Buttons Component
export const ActionButtons = ({buttons, style}) => (
  <View style={[styles.actionButtons, style]}>
    {buttons.map((button, index) => (
      <TouchableOpacity
        key={index}
        style={[styles.actionButton, button.style]}
        onPress={button.onPress}>
        <CText style={[styles.actionButtonText, button.textStyle]}>
          {button.text}
        </CText>
      </TouchableOpacity>
    ))}
  </View>
);

// Bottom Navigation Component
export const BottomNavigation = ({colors}) => (
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
);

const styles = StyleSheet.create({
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
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(12),
  },
  instructionsText: {
    fontSize: moderateScale(16),
    color: '#2F2F2F',
    fontWeight: '500',
    textAlign: 'center',
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
  partyVoteInput: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#2F2F2F',
    borderWidth: 1,
    borderColor: '#459151',
    borderRadius: moderateScale(4),
    padding: moderateScale(8),
    textAlign: 'center',
    minWidth: moderateScale(50),
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
  voteSummaryInput: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#2F2F2F',
    borderWidth: 1,
    borderColor: '#459151',
    borderRadius: moderateScale(4),
    padding: moderateScale(8),
    textAlign: 'center',
    minWidth: moderateScale(50),
    width: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(32),
    gap: moderateScale(12),
  },
  actionButton: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
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
