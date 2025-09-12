import React, {useState, useEffect} from 'react';
import {ActivityIndicator, View, Dimensions} from 'react-native';
import axios from 'axios';
import BaseSearchTableScreen from '../../components/common/BaseSearchTableScreen';
import CustomModal from '../../components/common/CustomModal';
import CText from '../../components/common/CText';
import {useSearchTableLogic} from '../../hooks/useSearchTableLogic';
import {createSearchTableStyles} from '../../styles/searchTableStyles';
import {fetchMesas} from '../../data/mockMesas';
import {StackNav} from '../../navigation/NavigationKey';
import String from '../../i18n/String';
import {BACKEND_RESULT, BACKEND_SECRET} from '@env';
import BaseSearchTableScreenUser from '../../components/common/BaseSearchTableScreenUser';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const UnifiedTableScreenUser = ({navigation, route}) => {
  const [mesas, setMesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationData, setLocationData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.accept,
    onButtonPress: null,
    secondaryButtonText: null,
    onSecondaryPress: null,
  });
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [saving, setSaving] = useState(false);

  const {
    colors,
    searchText,
    setSearchText,
    handleBack,
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  } = useSearchTableLogic();

  const styles = createSearchTableStyles();
  const dni = route?.params?.dni;

  useEffect(() => {
    if (route?.params) {
      setIsLoading(true);
      setLocationData({
        locationId: route?.params?.locationId,
        name: route?.params?.locationData.name,
        address: route?.params?.locationData.address,
        code: route?.params?.locationData.code,
      });
      setMesas(route?.params?.locationData.tables);
      setIsLoading(false);
    } else {
      loadTables();
    }
  }, [route?.params?.locationId]);

  const loadTables = async () => {
    try {
      setIsLoading(true);

      const response = await fetchMesas();

      if (response.success) {
        setMesas(response.data);
      } else {
        showModal('error', String.error, String.couldNotLoadTables);
      }
    } catch (error) {
      showModal('error', String.error, String.errorLoadingTables);
    } finally {
      setIsLoading(false);
    }
  };

  const showModal = (
    type,
    title,
    message,
    buttonText = String.accept,
    onButtonPress = null,
    secondaryButtonText = null,
    onSecondaryPress = null,
  ) => {
    setModalConfig({
      type,
      title,
      message,
      buttonText,
      onButtonPress,
      secondaryButtonText,
      onSecondaryPress,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const saveSelectedMesa = async mesa => {
    if (!dni) {
      showModal('error', String.error, 'DNI no disponible.');
      return;
    }
    if (!locationData?.locationId) {
      showModal('error', String.error, 'Recinto no disponible.');
      return;
    }
    const payload = {
      locationId: locationData.locationId,
      ...(mesa.id && mesa.id !== 'N/A' ? {tableId: mesa.id} : {}),
      ...(mesa.codigo && mesa.codigo !== 'N/A' ? {tableCode: mesa.codigo} : {}),
    };
    try {
      setSaving(true);
      await axios.patch(
        `${BACKEND_RESULT}/api/v1/users/${dni}/vote-place`,
        payload,
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': BACKEND_SECRET,
          },
        },
      );
      showModal(
        'success',
        'Guardado',
        'Tu lugar de votación fue guardado correctamente.',
        String.accept,
        () => {
          setModalVisible(false);
          handleHomePress();
        },
      );
    } catch (error) {
      const msg =
        (error?.response?.data?.message &&
          (Array.isArray(error.response.data.message)
            ? error.response.data.message.join('\n')
            : error.response.data.message)) ||
        'No se pudo guardar tu lugar de votación.';
      showModal('error', String.error, msg);
    } finally {
      setSaving(false);
    }
  };

  // Check if table has actas and navigate to appropriate screen
  const handleTablePress = async mesa => {
    // Process the table data to include location information
    const processedMesa = {
      id: mesa.id || mesa._id || 'N/A',
      numero:
        mesa.tableNumber ||
        mesa.numero ||
        mesa.number ||
        mesa.name ||
        mesa.id ||
        'N/A',
      codigo: mesa.tableCode || mesa.codigo || mesa.code || mesa.id || 'N/A',
      recinto:
        locationData?.name ||
        mesa.recinto ||
        mesa.venue ||
        mesa.precinctName ||
        'N/A',
      colegio:
        locationData?.name ||
        mesa.colegio ||
        mesa.venue ||
        mesa.precinctName ||
        'N/A',
      provincia:
        locationData?.address ||
        mesa.direccion ||
        mesa.address ||
        mesa.provincia ||
        'N/A',
      zona: locationData?.zone || mesa.zona || mesa.zone || 'N/A',
      distrito:
        locationData?.district || mesa.distrito || mesa.district || 'N/A',
      originalTableData: mesa,
      locationData: locationData,
    };
    setSelectedMesa(processedMesa);

    showModal(
      'success',
      '¿Confirmar?',
      `Te llegarán notificaciones del conteo para el recinto`,
      'Confirmar',
      () => saveSelectedMesa(processedMesa),
      String.cancel || 'Cancelar',
      () => setModalVisible(false),
    );
  };

  // Show loading indicator while tables are being loaded
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FAFAFA',
        }}>
        <ActivityIndicator
          size={isTablet ? 'large' : 'large'}
          color={colors.primary || '#4F9858'}
        />
        <CText
          style={{
            marginTop: getResponsiveSize(12, 15, 18),
            fontSize: getResponsiveSize(14, 16, 18),
            color: '#666',
            textAlign: 'center',
            paddingHorizontal: getResponsiveSize(20, 30, 40),
          }}>
          {String.loadingTables}
        </CText>
      </View>
    );
  }

  return (
    <>
      <BaseSearchTableScreenUser
        // Header props
        colors={colors}
        onBack={handleBack}
        title={locationData?.name || String.searchTable}
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
        enableAutoVerification={false}
        // Navigation props
        onHomePress={handleHomePress}
        onProfilePress={handleProfilePress}
        // Layout props
        showLocationFirst={false} // Search input appears before location bar
        // Styles
        styles={styles}
      />

      {/* Custom Modal */}
      <CustomModal
        visible={modalVisible}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttonText={modalConfig.buttonText}
        onButtonPress={modalConfig.onButtonPress}
        secondaryButtonText={modalConfig.secondaryButtonText}
        onSecondaryPress={modalConfig.onSecondaryPress}
      />

      {saving && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.35)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 20,
              alignItems: 'center',
              minWidth: 150,
            }}>
            <ActivityIndicator
              size="large"
              color={colors?.primary || '#4F9858'}
            />
            <CText
              style={{
                marginTop: 12,
                fontSize: 14,
                color: '#666',
                textAlign: 'center',
              }}>
              Guardando…
            </CText>
          </View>
        </View>
      )}
    </>
  );
};

export default UnifiedTableScreenUser;
