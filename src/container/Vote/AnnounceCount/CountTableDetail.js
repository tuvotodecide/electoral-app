import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import UniversalHeader from '../../../components/common/UniversalHeader';
import String from '../../../i18n/String';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;
const isLandscape = screenWidth > screenHeight;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

// Mock data for demo, in your app it will come from navigation
const mockMesa = {
  numero: 'Mesa 1234',
  codigo: '2352',
  colegio: 'Colegio Gregorio Reynolds',
  provincia: 'Provincia Murillo - La Paz',
  recinto: 'Colegio 23 de marzo',
};

export default function CountTableDetail({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  const mesa = route?.params?.mesa || mockMesa;
  const [modalVisible, setModalVisible] = React.useState(false);

  const handleAnnounceCount = () => {
    setModalVisible(true);
  };

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleConfirmCount = () => {
    setLoading(true);

    // Simulate loading time
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);

      // Wait a few seconds then close modal and navigate to home
      setTimeout(() => {
        setModalVisible(false);
        setSuccess(false);
        navigation.popToTop();
      }, 1500);
    }, 1500);
  };

  const handleCancelCount = () => {
    setModalVisible(false);
  };

  return (
    <CSafeAreaView style={stylesx.container}>
      {/* HEADER */}
      <UniversalHeader
        colors={colors}
        onBack={() => navigation.goBack()}
        title={String.tableInformation}
        showNotification={false}
      />

      {/* CONTENT */}
      <View style={stylesx.scrollableContent}>
        {/* For tablet landscape, use two-column layout */}
        {isTablet && isLandscape ? (
          <View style={stylesx.tabletLandscapeContainer}>
            {/* Left Column: Table Data */}
            <View style={stylesx.leftColumn}>
              <View style={stylesx.card}>
                <View style={stylesx.cardContent}>
                  <View style={stylesx.cardTextContainer}>
                    <CText style={stylesx.mesaTitle}>{mesa.numero}</CText>
                    <CText style={stylesx.label}>
                      {String.venue} {mesa.recinto}
                    </CText>
                    <CText style={stylesx.label}>{mesa.colegio}</CText>
                    <CText style={stylesx.label}>{mesa.provincia}</CText>
                    <CText style={stylesx.label}>
                      {String.tableCode} {mesa.codigo}
                    </CText>
                  </View>
                  <MaterialIcons
                    name="how-to-vote"
                    size={getResponsiveSize(50, 60, 70)}
                    color={colors.textColor}
                    style={stylesx.cardIcon}
                  />
                </View>
              </View>
            </View>

            {/* Right Column: Action Button */}
            <View style={stylesx.rightColumn}>
              <TouchableOpacity
                style={stylesx.takePhotoBtn}
                activeOpacity={0.85}
                onPress={handleAnnounceCount}>
                <CText style={stylesx.takePhotoBtnText}>
                  {String.announceCountButton}
                </CText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Regular Layout: Phones and Tablet Portrait */
          <>
            <View style={stylesx.card}>
              <View style={stylesx.cardContent}>
                <View style={stylesx.cardTextContainer}>
                  <CText style={stylesx.mesaTitle}>{mesa.numero}</CText>
                  <CText style={stylesx.label}>
                    {String.venue} {mesa.recinto}
                  </CText>
                  <CText style={stylesx.label}>{mesa.colegio}</CText>
                  <CText style={stylesx.label}>{mesa.provincia}</CText>
                  <CText style={stylesx.label}>
                    {String.tableCode} {mesa.codigo}
                  </CText>
                </View>
                <MaterialIcons
                  name="how-to-vote"
                  size={getResponsiveSize(50, 60, 70)}
                  color={colors.textColor}
                  style={stylesx.cardIcon}
                />
              </View>
            </View>

            <TouchableOpacity
              style={stylesx.takePhotoBtn}
              activeOpacity={0.85}
              onPress={handleAnnounceCount}>
              <CText style={stylesx.takePhotoBtnText}>
                {String.announceCountButton}
              </CText>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* MODAL DE CONFIRMACIÓN */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={stylesx.modalOverlay}>
          <View style={stylesx.modalContent}>
            {loading ? (
              <View style={stylesx.modalHeader}>
                <ActivityIndicator
                  size="large"
                  color="#4F9858"
                  style={{marginBottom: getResponsiveSize(16, 20, 24)}}
                />
                <CText style={stylesx.modalTitle}>{String.processing}</CText>
                <CText style={stylesx.modalSubtitle}>
                  {String.announcingTableCount.replace(
                    '{tableName}',
                    mesa.numero,
                  )}
                </CText>
              </View>
            ) : success ? (
              <View style={stylesx.modalHeader}>
                <Ionicons
                  name="checkmark-circle"
                  size={getResponsiveSize(50, 60, 70)}
                  color="#4F9858"
                  style={stylesx.modalIcon}
                />
                <CText style={stylesx.modalTitle}>
                  {String.countAnnounced}
                </CText>
                <CText style={stylesx.modalSubtitle}>
                  {String.countAnnouncedSuccess}
                </CText>
              </View>
            ) : (
              <>
                <View style={stylesx.modalHeader}>
                  <Ionicons
                    name="checkmark-circle"
                    size={getResponsiveSize(50, 60, 70)}
                    color="#4F9858"
                    style={stylesx.modalIcon}
                  />
                  <CText style={stylesx.modalTitle}>{String.areYouSure}</CText>
                  <CText style={stylesx.modalSubtitle}>
                    {String.wishToAnnounceCount.replace(
                      '{tableName}',
                      mesa.numero,
                    )}
                  </CText>
                </View>

                <View style={stylesx.modalButtons}>
                  <TouchableOpacity
                    style={stylesx.cancelButton}
                    onPress={handleCancelCount}>
                    <CText style={stylesx.cancelButtonText}>
                      {String.cancel}
                    </CText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={stylesx.confirmButton}
                    onPress={handleConfirmCount}>
                    <CText style={stylesx.confirmButtonText}>
                      {String.confirm}
                    </CText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </CSafeAreaView>
  );
}

// RESPONSIVE STYLES
const stylesx = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollableContent: {
    flex: 1,
    paddingBottom: getResponsiveSize(15, 25, 30),
  },
  // Tablet Landscape Layout
  tabletLandscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: getResponsiveSize(20, 24, 32),
    paddingVertical: getResponsiveSize(20, 24, 32),
  },
  leftColumn: {
    flex: 0.65,
    paddingRight: getResponsiveSize(16, 20, 24),
  },
  rightColumn: {
    flex: 0.35,
    paddingLeft: getResponsiveSize(16, 20, 24),
    justifyContent: 'center',
  },
  bigBold: {
    fontSize: getResponsiveSize(16, 18, 22),
    fontWeight: 'bold',
    marginLeft: getResponsiveSize(16, 19, 24),
    marginBottom: getResponsiveSize(2, 4, 6),
    color: '#222',
  },
  subtitle: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#8B9399',
    marginLeft: getResponsiveSize(16, 19, 24),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(10, 12, 14),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(18, 23, 28),
    padding: getResponsiveSize(16, 18, 22),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: getResponsiveSize(20, 25, 30),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTextContainer: {
    flex: 1,
    marginRight: getResponsiveSize(12, 14, 18),
  },
  cardIcon: {
    marginTop: getResponsiveSize(8, 12, 16),
    alignSelf: 'flex-start',
  },
  mesaTitle: {
    fontSize: getResponsiveSize(16, 17, 20),
    fontWeight: 'bold',
    marginBottom: getResponsiveSize(4, 6, 8),
    color: '#111',
  },
  label: {
    fontSize: getResponsiveSize(13, 14, 16),
    color: '#222',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  infoAI: {
    backgroundColor: '#DDF4FA',
    borderRadius: getResponsiveSize(8, 10, 12),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(10, 12, 14),
    paddingHorizontal: getResponsiveSize(12, 14, 18),
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  iaText: {
    fontSize: getResponsiveSize(13, 15, 17),
    color: '#226678',
    fontWeight: '500',
  },
  takePhotoBtn: {
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(6, 8, 12),
    backgroundColor: '#4F9858',
    borderRadius: getResponsiveSize(10, 12, 14),
    justifyContent: 'center',
    alignItems: 'center',
    height: getResponsiveSize(48, 50, 56),
  },
  takePhotoBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: getResponsiveSize(16, 17, 19),
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(16, 20, 24),
    marginHorizontal: getResponsiveSize(24, 30, 40),
    paddingVertical: getResponsiveSize(24, 30, 36),
    paddingHorizontal: getResponsiveSize(18, 20, 28),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    maxWidth: isTablet ? 400 : undefined,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: getResponsiveSize(24, 30, 36),
  },
  modalIcon: {
    marginBottom: getResponsiveSize(12, 15, 18),
  },
  modalTitle: {
    fontSize: getResponsiveSize(20, 22, 26),
    fontWeight: 'bold',
    color: '#222',
    marginBottom: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#666',
    textAlign: 'center',
    lineHeight: getResponsiveSize(20, 22, 26),
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: getResponsiveSize(12, 15, 18),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: getResponsiveSize(10, 12, 14),
    paddingVertical: getResponsiveSize(14, 15, 18),
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4F9858',
    borderRadius: getResponsiveSize(10, 12, 14),
    paddingVertical: getResponsiveSize(14, 15, 18),
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#fff',
  },
});
