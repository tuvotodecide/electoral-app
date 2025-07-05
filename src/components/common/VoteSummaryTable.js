import React from 'react';
import {View, StyleSheet, TextInput} from 'react-native';
import CText from './CText';
import {moderateScale} from '../../common/constants';

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

const styles = StyleSheet.create({
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
});

export default VoteSummaryTable;
