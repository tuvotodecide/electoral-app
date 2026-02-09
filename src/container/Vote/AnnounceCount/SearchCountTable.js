import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Dimensions } from 'react-native';
import BaseSearchTableScreen from '../../../components/common/BaseSearchTableScreen';
import CustomModal from '../../../components/common/CustomModal';
import CText from '../../../components/common/CText';
import { useSearchTableLogic } from '../../../hooks/useSearchTableLogic';
import { createSearchTableStyles } from '../../../styles/searchTableStyles';
import { fetchMesasConteo } from '../../../data/mockMesas';
import { StackNav } from '../../../navigation/NavigationKey';
import String from '../../../i18n/String';
import axios from 'axios';
import { BACKEND_RESULT, BACKEND_SECRET } from '@env';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const SearchCountTable = ({ navigation, route }) => {
  const [mesas, setMesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationData, setLocationData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.acceptButton,
  });
  const { electionId, electionType } = route.params || {};
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [sending, setSending] = useState(false);
  const {
    colors,
    searchText,
    setSearchText,
    handleBack,
    handleTablePress: originalHandleTablePress,
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  } = useSearchTableLogic(StackNav.CountTableDetail);

  // Custom handleTablePress abrir modal "Anunciar conteo"
  const handleTablePress = table => {
    // Process the table data to include location information
    const processedMesa = {
      // Table identification
      numero:
        table.tableNumber ||
        table.numero ||
        table.number ||
        table.name ||
        table.id ||
        'N/A',
      codigo:
        table.tableCode || table.codigo || table.code || table.id || 'N/A',
      tableId: table._id || table.id,
      tableCode: table.tableCode || table.codigo || table.code,
      // Location information from locationData or table itself
      recinto:
        locationData?.name ||
        table.recinto ||
        table.venue ||
        table.precinctName ||
        'N/A',
      colegio:
        locationData?.name ||
        table.colegio ||
        table.venue ||
        table.precinctName ||
        'N/A',
      provincia:
        locationData?.address ||
        table.direccion ||
        table.address ||
        table.provincia ||
        'N/A',

      // Additional location details if available
      zona: locationData?.zone || table.zona || table.zone || 'N/A',
      distrito:
        locationData?.district || table.distrito || table.district || 'N/A',

      // Original table data for reference
      originalTableData: table,
      locationData: locationData,
    };

    setSelectedMesa(processedMesa);
    setConfirmVisible(true);
  };

  // Llamada al backend para que publique al tópico del recinto
  const sendAnnounceCount = async () => {
    const locationId =
      route?.params?.locationId ||
      locationData?._id ||
      locationData?.locationId;

    if (!selectedMesa || !locationId) {
      setConfirmVisible(false);
      setModalConfig({
        type: 'error',
        title: String.errorTitle || 'Error',
        message: 'Faltan datos de recinto o mesa.',
        buttonText: String.acceptButton || 'Aceptar',
      });
      setModalVisible(true);
      return;
    }

    const tableCode =
      selectedMesa.codigo ||
      selectedMesa.tableCode ||
      selectedMesa.originalTableData?.tableCode;

    if (!tableCode) {
      setConfirmVisible(false);
      setModalConfig({
        type: 'error',
        title: String.errorTitle || 'Error',
        message: 'No se encontró el código de la mesa.',
        buttonText: String.acceptButton || 'Aceptar',
      });
      setModalVisible(true);
      return;
    }

    try {
      setSending(true);

      await axios.post(
        `${BACKEND_RESULT}/api/v1/announcements/count`,
        {
          locationId,
          locationCode: locationData?.code,
          tableId: (
            selectedMesa.tableId ?? selectedMesa.originalTableData?._id
          )?.toString(),
          tableCode: (
            selectedMesa.codigo ??
            selectedMesa.tableCode ??
            selectedMesa.originalTableData?.tableCode
          )?.toString(),
          title: 'Conteo anunciado',
          body: `${locationData?.name || 'Recinto'} · Mesa ${selectedMesa.numero
            }`,
        },
        {
          headers: {
            'Content-Type': 'application/json',

          },
          timeout: 30000,
        },
      );

      setConfirmVisible(false);
      setModalConfig({
        type: 'success',
        title: 'Enviado',
        message: 'Se anunció el conteo para la mesa seleccionada.',
        buttonText: String.acceptButton || 'Aceptar',
      });
      setModalVisible(true);
    } catch (e) {
      setConfirmVisible(false);
      setModalConfig({
        type: 'error',
        title: String.errorTitle || 'Error',
        message:
          e?.response?.data?.message ||
          'No se pudo enviar la notificación de conteo.',
        buttonText: String.acceptButton || 'Aceptar',
      });
      setModalVisible(true);
    } finally {
      setSending(false);
    }
  };

  const styles = createSearchTableStyles();

  // Load tables when component mounts
  useEffect(() => {
    setIsLoading(true);

    const loc = route?.params?.locationData || {};
    const id = route?.params?.locationId;

    setLocationData({
      _id: id,
      name: loc.name,
      address: loc.address,
      code: loc.code,
      zone: loc.zone,
      district: loc.district,
    });

    const initial = Array.isArray(loc.tables) ? loc.tables : [];
    setMesas(initial);

    setIsLoading(false);
  }, [route?.params?.locationId]);

  const showModal = (
    type,
    title,
    message,
    buttonText = String.acceptButton,
  ) => {
    setModalConfig({ type, title, message, buttonText });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  // Show loading indicator while tables are loading
  if (isLoading) {
    return (
      <View
        testID="searchCountTableLoadingContainer"
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FAFAFA',
        }}>
        <ActivityIndicator
          testID="searchCountTableLoadingIndicator"
          size={isTablet ? 'large' : 'large'}
          color={colors.primary || '#4F9858'}
        />
        <CText
          testID="searchCountTableLoadingText"
          style={{
            marginTop: getResponsiveSize(12, 15, 18),
            fontSize: getResponsiveSize(14, 16, 18),
            color: '#666',
            textAlign: 'center',
            paddingHorizontal: getResponsiveSize(20, 30, 40),
          }}>
          {String.loadingCountTables}
        </CText>
      </View>
    );
  }

  return (
    <>
      <BaseSearchTableScreen
        testID="searchCountTableBaseScreen"
        // Header props
        colors={colors}
        onBack={handleBack}
        enableAutoVerification={false}
        title={String.searchTableForCount}
        showNotification={true}
        onNotificationPress={handleNotificationPress}
        // Choose table text props
        chooseTableText={String.chooseTablePlease}
        // Search input props
        searchPlaceholder={String.searchTablePlaceholder}
        searchValue={searchText}
        onSearchChange={setSearchText}
        // Location info props
        locationText={String.listBasedOnLocation}
        locationIconColor="#0C5460"
        locationData={locationData}
        // Table list props
        tables={mesas}
        onTablePress={handleTablePress}
        // Navigation props
        onHomePress={handleHomePress}
        onProfilePress={handleProfilePress}
        // Layout props
        showLocationFirst={true} // Location bar appears before search input
        // Styles
        styles={styles}
        electionId={electionId}
      />

      {/* Custom Modal */}
      <CustomModal
        testID="searchCountTableModal"
        visible={modalVisible}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttonText={modalConfig.buttonText}
      />

      {/* Confirmación de Anunciar conteo */}
      <CustomModal
        visible={confirmVisible}
        onClose={() => !sending && setConfirmVisible(false)}
        type="success"
        title="¿Anunciar conteo?"
        message={
          selectedMesa
            ? `Recinto: ${locationData?.name}\nMesa: ${selectedMesa.numero}\nCódigo: ${selectedMesa.codigo}`
            : ''
        }
        secondaryButtonText={String.cancel || 'Cancelar'}
        onSecondaryPress={() => !sending && setConfirmVisible(false)}
        buttonText={sending ? 'Enviando…' : 'Confirmar'}
        onButtonPress={() => !sending && sendAnnounceCount()}
      />
    </>
  );
};

export default SearchCountTable;
