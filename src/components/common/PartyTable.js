import React from 'react';
import {View, StyleSheet, TextInput, Dimensions} from 'react-native';
import CText from './CText';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

export const PartyTableRow = ({
  party,
  isEditing,
  onUpdate,
  rowIndex,
  emptyDisplayWhenReadOnly = '0',
}) => (
  <View testID={`partyTableRow_${rowIndex}`} style={styles.partyTableRow}>
    <CText
      testID={`partyNameText_${rowIndex}`}
      style={styles.partyNameText}>
      {party.id || party.partyId}
    </CText>
    <View
      testID={`partyVotePresidenteContainer_${rowIndex}`}
      style={styles.partyVoteContainer}>
      {isEditing ? (
        <TextInput
          style={styles.partyVoteInput}
          value={String(party.presidente ?? '')}
          onChangeText={value =>
            onUpdate(
              party.id,
              'presidente',
              value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''),
            )
          }
          keyboardType="numeric"
          placeholder="0"
          testID={`partyInputPresidente_${rowIndex}`}
        />
      ) : (
        <CText
          testID={`partyVotePresidenteText_${rowIndex}`}
          style={styles.partyVoteText}>
          {party.presidente === '' || party.presidente == null
            ? emptyDisplayWhenReadOnly
            : String(party.presidente)}
        </CText>
      )}
    </View>
    <View
      testID={`partyVoteDiputadoContainer_${rowIndex}`}
      style={styles.partyVoteContainer}>
      {isEditing ? (
        <TextInput
          style={styles.partyVoteInput}
          value={String(party.diputado ?? '')}
          onChangeText={value =>
            onUpdate(
              party.id,
              'diputado',
              value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''),
            )
          }
          keyboardType="numeric"
          placeholder="0"
          testID={`partyInputDiputado_${rowIndex}`}
        />
      ) : (
        <CText
          testID={`partyVoteDiputadoText_${rowIndex}`}
          style={styles.partyVoteText}>
          {party.diputado === '' || party.diputado == null
            ? emptyDisplayWhenReadOnly
            : String(party.diputado)}
        </CText>
      )}
    </View>
  </View>
);

export const PartyTable = ({
  partyResults = [],
  isEditing = false,
  onUpdate,
  emptyDisplayWhenReadOnly = '0',
}) => (
  <View testID="partyTableContainer" style={styles.partyTableContainer}>
    <View testID="partyTableHeader" style={styles.partyTableHeader}>
      <CText
        testID="partyTableHeaderPartido"
        style={styles.partyTableHeaderLeft}>
        Partido
      </CText>
      <CText
        testID="partyTableHeaderPresidente"
        style={styles.partyTableHeaderCenter}>
        PRESIDENTE/A
      </CText>
      <CText
        testID="partyTableHeaderDiputado"
        style={styles.partyTableHeaderCenter}>
        DIPUTADO/A
      </CText>
    </View>

    {(Array.isArray(partyResults) ? partyResults : []).map((party, index) => (
      <PartyTableRow
        key={party.id || index}
        party={{
          ...party,
          presidente: party.presidente,
          diputado: party.diputado,
        }}
        isEditing={isEditing}
        onUpdate={onUpdate}
        rowIndex={index}
        emptyDisplayWhenReadOnly={emptyDisplayWhenReadOnly}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  partyTableContainer: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(4, 8, 10),
    marginBottom: getResponsiveSize(6, 16, 20),
    elevation: 2,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowColor: '#000',
  },
  partyTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0F2F7',
    paddingHorizontal: getResponsiveSize(6, 16, 20),
    paddingVertical: getResponsiveSize(4, 12, 16),
    borderTopLeftRadius: getResponsiveSize(4, 8, 10),
    borderTopRightRadius: getResponsiveSize(4, 8, 10),
  },
  partyTableHeaderLeft: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'left',
  },
  partyTableHeaderCenter: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
  },
  partyTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(6, 16, 20),
    paddingVertical: getResponsiveSize(4, 12, 16),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  partyNameText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2F2F2F',
  },
  partyVoteContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyVoteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
    width: '100%',
  },
  partyVoteInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F2F2F',
    borderWidth: 1,
    borderColor: '#459151',
    borderRadius: getResponsiveSize(3, 4, 6),
    padding: getResponsiveSize(4, 8, 12),
    textAlign: 'center',
    minWidth: getResponsiveSize(40, 50, 60),
    width: '100%',
  },
});

export default PartyTable;
