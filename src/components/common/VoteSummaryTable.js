import React from 'react';
import { View, StyleSheet, TextInput, Dimensions } from 'react-native';
import CText from './CText';
import { moderateScale } from '../../common/constants';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375; // Increased from 350

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

// Vote Summary Row Component
export const VoteSummaryRow = ({ item, isEditing, onUpdate }) => (
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
        key={index}
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
    borderRadius: getResponsiveSize(4, 8, 10),
    marginBottom: getResponsiveSize(8, 24, 32),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: getResponsiveSize(4, 12, 16),
  },
  voteSummaryTableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: getResponsiveSize(2, 8, 12),
    paddingHorizontal: getResponsiveSize(6, 16, 20),
  },
  voteSummaryTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(6, 16, 20),
    paddingVertical: getResponsiveSize(4, 12, 16),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  voteSummaryLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2F2F2F',
  },
  voteSummaryValueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteSummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
    width: '100%',
  },
  voteSummaryInput: {
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

export default VoteSummaryTable;
