import React from 'react';
import {ScrollView, View, Dimensions, ActivityIndicator} from 'react-native';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import CSafeAreaView from './CSafeAreaView';
import CustomModal from './CustomModal';
import CText from './CText';
import {StackNav} from '../../navigation/NavigationKey';
import String from '../../i18n/String';
import {
  SearchTableHeader,
  ChooseTableText,
  LocationInfoBar,
  SearchInput,
  TableCard,
  // Legacy support
  SearchMesaHeader,
  ChooseMesaText,
  MesaCard,
} from './SearchTableComponents';

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

const getCardLayout = () => {
  if (isTablet) {
    // Tablets: Different layouts for landscape vs portrait
    if (isLandscape) {
      // Landscape: 3 cards per row for better space usage
      return {
        cardsPerRow: 3,
        cardFlex: 0.31,
        paddingHorizontal: getResponsiveSize(16, 20, 24),
        marginBottom: getResponsiveSize(8, 12, 16),
      };
    } else {
      // Portrait: 2 cards per row
      return {
        cardsPerRow: 2,
        cardFlex: 0.48,
        paddingHorizontal: getResponsiveSize(12, 16, 20),
        marginBottom: getResponsiveSize(8, 10, 12),
      };
    }
  } else {
    // Phones: Single column
    return {
      cardsPerRow: 1,
      cardFlex: 1,
      paddingHorizontal: getResponsiveSize(12, 16, 20),
      marginBottom: getResponsiveSize(6, 8, 10),
    };
  }
};

const BaseSearchTableScreen = ({
  // Header props
  colors,
  onBack,
  title,
  showNotification = true,
  onNotificationPress,

  // Choose table text props
  chooseTableText,
  chooseMesaText, // Legacy support

  // Search input props
  searchPlaceholder,
  searchValue,
  onSearchChange,

  // Location info props
  locationText,
  locationIconColor,
  locationData, // Added to pass electoral location data

  // Table list props
  tables,
  mesas, // Legacy support
  onTablePress,
  onMesaPress, // Legacy support

  // Layout props
  showLocationFirst = false, // Control order of location bar and search input

  // Auto-verification props
  enableAutoVerification = true, // Enable automatic API verification
  apiEndpoint = "http://192.168.1.16:3000/api/v1/mesa", // Base API endpoint

  // Styles
  styles,
}) => {
  const navigation = useNavigation();
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalConfig, setModalConfig] = React.useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.accept,
  });

  // Support legacy props
  const finalTables = tables || mesas || [];
  const finalOnPress = onTablePress || onMesaPress;
  const finalChooseText = chooseTableText || chooseMesaText;

  const showModal = (type, title, message, buttonText = String.accept) => {
    setModalConfig({type, title, message, buttonText});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleTablePress = async (mesa) => {
    if (!enableAutoVerification) {
      // Use original handler if auto-verification is disabled
      if (finalOnPress) {
        finalOnPress(mesa);
      }
      return;
    }

    // Enrich mesa data with location information
    const enrichedMesa = {
      ...mesa,
      // Add location data for proper display
      recinto: locationData?.name || mesa.recinto || 'N/A',
      direccion: locationData?.address || mesa.direccion || 'N/A',
      codigo: mesa.tableCode || mesa.codigo || mesa.code || 'N/A',
      // Ensure tableNumber is present
      tableNumber: mesa.tableNumber || mesa.numero || mesa.number || 'N/A',
      // Keep original fields for backwards compatibility
      numero: mesa.tableNumber || mesa.numero || mesa.number || 'N/A',
      // Add zone from location data
      zone: locationData?.zone || mesa.zone || 'N/A',
      // Add other location-specific data
      name: locationData?.name || mesa.name || 'N/A',
      address: locationData?.address || mesa.address || 'N/A',
      district: locationData?.district || mesa.district || 'N/A',
    };

    // Get table code for API call
    const tableCode = mesa.tableCode || mesa.codigo || mesa.code;
    
    if (!tableCode) {
      console.error('BaseSearchTableScreen - No table code found for mesa:', mesa);
      showModal('error', String.error, 'No se pudo encontrar el código de la mesa');
      return;
    }

    try {
      // Show loading
      setIsVerifying(true);
      
      console.log('BaseSearchTableScreen - Checking mesa results for code:', tableCode);
      
      // Check if mesa has existing attestations
      const response = await axios.get(`${apiEndpoint}/${tableCode}/results`);
      
      console.log('BaseSearchTableScreen - Mesa results response:', response.data);
      
      if (response.data && response.data.registros && response.data.registros.length > 0) {
        // Mesa has existing attestations - go directly to WhichIsCorrectScreen
        console.log('BaseSearchTableScreen - Mesa has existing attestations:', response.data.registros.length);
        
        // Convert API data to format expected by WhichIsCorrectScreen
        const actaImages = response.data.registros.map((record, index) => {
          console.log(`BaseSearchTableScreen - Mapping record ${index}:`, {
            recordId: record.recordId,
            actaImage: record.actaImage,
            hasImage: !!record.actaImage
          });
          
          return {
            id: record.recordId || `record-${index}`,
            uri: record.actaImage, // Use the image URL directly from API
            recordId: record.recordId,
            tableCode: record.tableCode,
            tableNumber: record.tableNumber,
            partyResults: record.partyResults,
            voteSummaryResults: record.voteSummaryResults,
          };
        });

        console.log('BaseSearchTableScreen - Final actaImages array:', actaImages);

        navigation.navigate(StackNav.WhichIsCorrectScreen, {
          tableData: enrichedMesa,
          actaImages: actaImages,
          existingRecords: response.data.registros,
          mesaInfo: response.data.mesa,
          totalRecords: response.data.totalRecords,
          isFromAPI: true
        });
      } else {
        // No attestations found, go to table detail first to show mesa information
        console.log('BaseSearchTableScreen - No attestations found, redirecting to table detail');
        
        navigation.navigate(StackNav.TableDetail, {
          tableData: enrichedMesa,
          mesa: enrichedMesa,
          mesaData: enrichedMesa,
          isFromUnifiedFlow: true
        });
      }
      
    } catch (error) {
      console.log('BaseSearchTableScreen - Mesa check completed, determining next step:', error.message || error);
      
      // Check if it's a 404 or mesa not found error
      if (error.response && error.response.status === 404) {
        console.log('BaseSearchTableScreen - Mesa not found, redirecting to table detail');
        
        // Mesa not found, go to table detail first to show mesa information
        navigation.navigate(StackNav.TableDetail, {
          tableData: enrichedMesa,
          mesa: enrichedMesa,
          mesaData: enrichedMesa,
          isFromUnifiedFlow: true
        });
      } else if (error.response && error.response.data && error.response.data.message) {
        // Handle specific error messages from API
        const errorData = error.response.data;
        
        if (errorData.message.includes('no encontrada')) {
          console.log('BaseSearchTableScreen - Mesa not found in API, redirecting to table detail');
          
          // Mesa not found, go to table detail first to show mesa information
          navigation.navigate(StackNav.TableDetail, {
            tableData: enrichedMesa,
            mesa: enrichedMesa,
            mesaData: enrichedMesa,
            isFromUnifiedFlow: true
          });
        } else {
          // Other API error
          showModal('error', String.error, errorData.message || 'Error al verificar la mesa');
        }
      } else {
        // Network or other error
        showModal('error', String.error, 'Error de conexión al verificar la mesa');
      }
    } finally {
      setIsVerifying(false);
    }
  };
  const renderSearchAndLocation = () => {
    const containerStyle = {
      paddingHorizontal: getResponsiveSize(12, 16, 20),
      marginVertical: getResponsiveSize(8, 12, 16),
    };

    if (showLocationFirst) {
      return (
        <View style={containerStyle}>
          <LocationInfoBar
            text={locationText}
            iconColor={locationIconColor}
            styles={styles}
          />
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onChangeText={onSearchChange}
            styles={styles}
          />
        </View>
      );
    } else {
      return (
        <View style={containerStyle}>
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onChangeText={onSearchChange}
            styles={styles}
          />
          <LocationInfoBar
            text={locationText}
            iconColor={locationIconColor}
            styles={styles}
          />
        </View>
      );
    }
  };

  const renderTablesList = () => {
    if (!finalTables || finalTables.length === 0) {
      return null;
    }

    const layout = getCardLayout();

    if (layout.cardsPerRow === 1) {
      // Single column layout for phones
      return (
        <ScrollView
          style={styles.tableList || styles.mesaList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: getResponsiveSize(20, 30, 40),
          }}>
          {finalTables.map((table, index) => (
            <View
              key={table.id || table._id || table.codigo || table.code || index}
              style={{
                paddingHorizontal: layout.paddingHorizontal,
                marginBottom: layout.marginBottom,
              }}>
              <TableCard
                table={table}
                onPress={handleTablePress}
                locationData={locationData}
                styles={{
                  tableCard: styles.tableCard || styles.mesaCard,
                  tableCardTitle: styles.tableCardTitle || styles.mesaCardTitle,
                  tableCardDetail:
                    styles.tableCardDetail || styles.mesaCardDetail,
                }}
              />
            </View>
          ))}
        </ScrollView>
      );
    } else {
      // Multi-column layout for tablets
      const groups = [];
      for (let i = 0; i < finalTables.length; i += layout.cardsPerRow) {
        groups.push(finalTables.slice(i, i + layout.cardsPerRow));
      }

      return (
        <ScrollView
          style={styles.tableList || styles.mesaList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: getResponsiveSize(20, 30, 40),
          }}>
          {groups.map((group, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: layout.paddingHorizontal,
                marginBottom: layout.marginBottom,
                gap: getResponsiveSize(8, 12, 16),
              }}>
              {group.map((table, tableIndex) => (
                <View
                  key={
                    table.id ||
                    table._id ||
                    table.codigo ||
                    table.code ||
                    tableIndex
                  }
                  style={{
                    flex: layout.cardFlex,
                  }}>
                  <TableCard
                    table={table}
                    onPress={handleTablePress}
                    locationData={locationData}
                    styles={{
                      tableCard: styles.tableCard || styles.mesaCard,
                      tableCardTitle:
                        styles.tableCardTitle || styles.mesaCardTitle,
                      tableCardDetail:
                        styles.tableCardDetail || styles.mesaCardDetail,
                    }}
                  />
                </View>
              ))}
              {/* Fill empty spaces for incomplete rows */}
              {Array.from({length: layout.cardsPerRow - group.length}).map(
                (_, emptyIndex) => (
                  <View
                    key={`empty-${emptyIndex}`}
                    style={{flex: layout.cardFlex}}
                  />
                ),
              )}
            </View>
          ))}
        </ScrollView>
      );
    }
  };

  return (
    <CSafeAreaView style={styles.container}>
      <SearchTableHeader
        colors={colors}
        onBack={onBack}
        title={title}
        showNotification={showNotification}
        onNotificationPress={onNotificationPress}
        styles={styles}
      />

      <View
        style={{
          paddingHorizontal: getResponsiveSize(12, 16, 20),
          marginVertical: getResponsiveSize(8, 12, 16),
        }}>
        <ChooseTableText text={finalChooseText} styles={styles} />
      </View>

      {renderSearchAndLocation()}

      {renderTablesList()}

      {/* Loading overlay when verifying mesa */}
      {isVerifying && (
        <View style={styles.loadingOverlay || {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20,
            alignItems: 'center',
            minWidth: 150,
          }}>
            <ActivityIndicator size="large" color={colors?.primary || '#4F9858'} />
            <CText style={{
              marginTop: 12,
              fontSize: 14,
              color: '#666',
              textAlign: 'center',
            }}>
              Verificando mesa...
            </CText>
          </View>
        </View>
      )}

      {/* Custom Modal */}
      <CustomModal
        visible={modalVisible}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttonText={modalConfig.buttonText}
      />
    </CSafeAreaView>
  );
};

// Legacy export for backward compatibility
export const BaseSearchMesaScreen = BaseSearchTableScreen;
export default BaseSearchTableScreen;
