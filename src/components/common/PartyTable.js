import React from 'react';
import {View, StyleSheet, TextInput} from 'react-native';
import CText from './CText';
import {moderateScale} from '../../common/constants';

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

const styles = StyleSheet.create({
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
});

export default PartyTable;
