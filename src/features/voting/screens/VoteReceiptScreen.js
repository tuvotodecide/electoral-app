/**
 * Vote Receipt Screen (Comprobante)
 *
 * Muestra el comprobante del voto registrado con:
 * - Icono de éxito
 * - Título "Voto registrado exitosamente"
 * - Detalle de la elección
 * - Sección desplegable "Detalle de mi selección"
 * - Información de transacción/blockchain
 * - Botón "Ver mi NFT"
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import { moderateScale, getHeight } from '../../../common/constants';
import { UI_STRINGS, MOCK_PARTICIPATIONS } from '../data/mockData';

const { width: screenWidth } = Dimensions.get('window');

const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const VoteReceiptScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

  // Get participation data from route params or use mock
  const participationId = route?.params?.participationId;
  const participation = MOCK_PARTICIPATIONS.find(p => p.id === participationId) || MOCK_PARTICIPATIONS[0];

  const toggleDetail = () => {
    setIsDetailExpanded(!isDetailExpanded);
  };

  const handleViewNFT = () => {
    // Navigate to NFT screen or show NFT modal
    // For now, just log
    console.log('View NFT:', participation.nftId);
  };

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader title={UI_STRINGS.receiptHeader} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={moderateScale(56)} color="#41A44D" />
          </View>
        </View>

        {/* Success Title */}
        <CText type="B22" style={styles.successTitle}>
          {UI_STRINGS.voteRegisteredSuccess}
        </CText>

        {/* Card with details */}
        <View style={styles.card}>
          {/* Election Title */}
          <CText type="B16" style={styles.electionTitle}>
            {participation.electionTitle}
          </CText>

          {/* Date and Time */}
          <View style={styles.detailRow}>
            <CText type="R14" style={styles.detailLabel}>
              {UI_STRINGS.dateTime}
            </CText>
            <CText type="M14" style={styles.detailValue}>
              {participation.fullDate}
            </CText>
          </View>

          {/* Selection Detail - Expandable */}
          <TouchableOpacity
            style={styles.expandableHeader}
            onPress={toggleDetail}
            activeOpacity={0.7}
          >
            <CText type="M14" style={styles.expandableTitle}>
              {UI_STRINGS.selectionDetail}
            </CText>
            <Ionicons
              name={isDetailExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#374151"
            />
          </TouchableOpacity>

          {/* Expanded Selection Detail */}
          {isDetailExpanded && participation.candidateSelected && (
            <View style={styles.expandedContent}>
              <View style={styles.selectionDetailRow}>
                <CText type="R12" style={styles.selectionLabel}>
                  {UI_STRINGS.party}
                </CText>
                <CText type="M14" style={styles.selectionValue}>
                  {participation.candidateSelected.partyName}
                </CText>
              </View>
              <View style={styles.selectionDetailRow}>
                <CText type="R12" style={styles.selectionLabel}>
                  {UI_STRINGS.president}
                </CText>
                <CText type="M14" style={styles.selectionValue}>
                  {participation.candidateSelected.presidentName}
                </CText>
              </View>
              {participation.candidateSelected.viceName && (
                <View style={styles.selectionDetailRow}>
                  <CText type="R12" style={styles.selectionLabel}>
                    {UI_STRINGS.vicePresident}
                  </CText>
                  <CText type="M14" style={styles.selectionValue}>
                    {participation.candidateSelected.viceName}
                  </CText>
                </View>
              )}
            </View>
          )}

          {/* Organization */}
          <View style={styles.detailRow}>
            <CText type="R14" style={styles.detailLabel}>
              {UI_STRINGS.organization}
            </CText>
            <CText type="M14" style={styles.detailValue}>
              {participation.organization}
            </CText>
          </View>

          {/* Transaction ID */}
          {participation.transactionId && (
            <View style={styles.detailRow}>
              <CText type="R14" style={styles.detailLabel}>
                {UI_STRINGS.transactionId}
              </CText>
              <CText type="M14" style={styles.detailValueMono}>
                {participation.transactionId}
              </CText>
            </View>
          )}

          {/* Blockchain Hash */}
          {participation.blockchainHash && (
            <View style={styles.detailRow}>
              <CText type="R14" style={styles.detailLabel}>
                {UI_STRINGS.blockchainHash}
              </CText>
              <CText type="M14" style={styles.detailValueMono}>
                {participation.blockchainHash}
              </CText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      {participation.nftId && (
        <View style={styles.bottomContainer}>
          <CButton
            title={UI_STRINGS.viewMyNft}
            type="B16"
            onPress={handleViewNFT}
            containerStyle={styles.nftButton}
            sinMargen
            testID="viewNftButton"
          />
        </View>
      )}
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(20, 24, 28),
    paddingBottom: getResponsiveSize(100, 110, 120),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  iconCircle: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    color: '#1F2937',
    fontSize: getResponsiveSize(20, 22, 26),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: getResponsiveSize(16, 20, 24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  electionTitle: {
    color: '#1F2937',
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(10, 12, 14),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: getResponsiveSize(13, 14, 15),
  },
  detailValue: {
    color: '#1F2937',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '500',
  },
  detailValueMono: {
    color: '#9CA3AF',
    fontSize: getResponsiveSize(12, 13, 14),
    fontFamily: 'monospace',
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expandableTitle: {
    color: '#374151',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '500',
  },
  expandedContent: {
    backgroundColor: '#F9FAFB',
    borderRadius: moderateScale(8),
    padding: getResponsiveSize(12, 14, 16),
    marginVertical: getResponsiveSize(8, 10, 12),
  },
  selectionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(4, 6, 8),
  },
  selectionLabel: {
    color: '#9CA3AF',
    fontSize: getResponsiveSize(11, 12, 13),
  },
  selectionValue: {
    color: '#374151',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(12, 14, 16),
    paddingBottom: getResponsiveSize(24, 28, 32),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nftButton: {
    height: getHeight(52),
    borderRadius: moderateScale(12),
  },
});

export default VoteReceiptScreen;
