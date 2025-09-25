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

import {BACKEND_RESULT} from '@env';

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
  //apiEndpoint = "http://192.168.1.16:3000/api/v1/mesa", // Base API endpoint

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

  const [internalSearch, setInternalSearch] = React.useState('');
  const actualSearchValue =
    searchValue !== undefined ? searchValue : internalSearch;
  const actualOnSearchChange = onSearchChange || setInternalSearch;
  const [searchText, setSearchText] = React.useState('');

  const getSearchFields = table => {
    const tableNumber = (
      table.tableNumber?.toString() ||
      table.numero?.toString() ||
      table.number?.toString() ||
      ''
    )
      .toLowerCase()
      .trim();

    const tableCode = (
      table.tableCode?.toString() ||
      table.codigo?.toString() ||
      table.code?.toString() ||
      ''
    )
      .toLowerCase()
      .trim();

    const recinto = (
      locationData?.name ||
      table.recinto ||
      table.venue ||
      table.precinctName ||
      ''
    )
      .toLowerCase()
      .trim();

    const direccion = (
      locationData?.address ||
      table.direccion ||
      table.address ||
      table.provincia ||
      ''
    )
      .toLowerCase()
      .trim();

    return {tableNumber, tableCode, recinto, direccion};
  };

  // Función para obtener el recinto de una mesa
  const getRecintoForTable = table => {
    return (
      locationData?.name ||
      table.recinto ||
      table.venue ||
      table.precinctName ||
      ''
    );
  };

  // Filtrar mesas basado en el texto de búsqueda
  const filteredTables = finalTables.filter(table => {
    if (!searchText.trim()) return true;

    const searchLower = searchText.toLowerCase().trim();
    const {tableNumber, tableCode, recinto, direccion} = getSearchFields(table);

    // Buscar en todos los campos relevantes
    return (
      tableNumber.includes(searchLower) ||
      tableCode.includes(searchLower) ||
      recinto.includes(searchLower) ||
      direccion.includes(searchLower) ||
      `mesa ${tableNumber}`.includes(searchLower) // Para buscar "mesa 1"
    );
  });

  const showModal = (type, title, message, buttonText = String.accept) => {
    setModalConfig({type, title, message, buttonText});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleTablePress = async mesa => {
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
      locationId: locationData?.locationId || 'N/A',
    };

    // Get table code for API call
    const tableCode = mesa.tableCode || mesa.codigo || mesa.code;
    if (!tableCode) {

      showModal(
        'error',
        String.error,
        'No se pudo encontrar el código de la mesa',
      );
      return;
    }

    try {
      // Show loading
      setIsVerifying(true);

      // Check if mesa has existing attestations
      const response = await axios.get(
        `${BACKEND_RESULT}/api/v1/ballots/by-table/${tableCode}`,
        {timeout: 15000}, // 10 segundos timeout
      );

      let records = [];
      if (Array.isArray(response.data)) {
        records = response.data;
      } else if (response.data && Array.isArray(response.data.registros)) {
        records = response.data.registros;
      } else if (response.data) {
        records = [response.data];
      }

      if (records.length > 0) {
        const actaImages = records.map(record => {
          const imageCid = record.image?.replace('ipfs://', '') || '';
          const imageUrl = `https://ipfs.io/ipfs/${imageCid}`;

          // Extraer datos de partidos presidenciales
          const presidentialParties = record.votes?.parties?.partyVotes || [];
          // Extraer datos de partidos para diputados
          const deputyParties = record.votes?.deputies?.partyVotes || [];

          // Combinar ambos tipos de votos
          const combinedPartyResults = presidentialParties.map(presParty => {
            const deputyParty = deputyParties.find(
              d => d.partyId === presParty.partyId,
            ) || {votes: 0};
            return {
              partyId: presParty.partyId,
              presidente: presParty.votes,
              diputado: deputyParty.votes,
            };
          });

          // Extraer resumen de votos para presidente
          const presVoteSummary = record.votes?.parties || {};
          // Extraer resumen de votos para diputados
          const depVoteSummary = record.votes?.deputies || {};

          return {
            id: record._id,
            uri: imageUrl,
            recordId: record.recordId,
            tableCode: record.tableCode,
            tableNumber: record.tableNumber,
            partyResults: combinedPartyResults,
            voteSummaryResults: {
              // Presidente
              presValidVotes: presVoteSummary.validVotes || 0,
              presBlankVotes: presVoteSummary.blankVotes || 0,
              presNullVotes: presVoteSummary.nullVotes || 0,
              presTotalVotes: presVoteSummary.totalVotes || 0,
              // Diputados
              depValidVotes: depVoteSummary.validVotes || 0,
              depBlankVotes: depVoteSummary.blankVotes || 0,
              depNullVotes: depVoteSummary.nullVotes || 0,
              depTotalVotes: depVoteSummary.totalVotes || 0,
            },
            rawData: record,
          };
        });

        navigation.navigate(StackNav.WhichIsCorrectScreen, {
          tableData: enrichedMesa,
          actaImages: actaImages,
          existingRecords: records,
          mesaInfo: records[0],
          totalRecords: records.length,
          isFromAPI: true,
        });
      } else {
        // No hay registros, ir a TableDetail

        navigation.navigate(StackNav.TableDetail, {
          tableData: enrichedMesa,
          mesa: enrichedMesa,
          mesaData: enrichedMesa,
          isFromUnifiedFlow: true,
        });
      }
    } catch (error) {
      // Check if it's a 404 or mesa not found error
      if (error.response && error.response.status === 404) {
        // Mesa not found, go to table detail first to show mesa information
        navigation.navigate(StackNav.TableDetail, {
          tableData: enrichedMesa,
          mesa: enrichedMesa,
          mesaData: enrichedMesa,
          isFromUnifiedFlow: true,
        });
      } else if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        // Handle specific error messages from API
        const errorData = error.response.data;

        if (errorData.message.includes('no encontrada')) {
          // Mesa not found, go to table detail first to show mesa information
          navigation.navigate(StackNav.TableDetail, {
            tableData: enrichedMesa,
            mesa: enrichedMesa,
            mesaData: enrichedMesa,
            isFromUnifiedFlow: true,
          });
        } else {
          // Other API error
          showModal(
            'error',
            String.error,
            errorData.message || 'Error al verificar la mesa',
          );
        }
      } else {
        // Network or other error
        showModal(
          'error',
          String.error,
          'Error de conexión al verificar la mesa',
        );
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

    return (
      <View style={containerStyle}>
        <SearchInput
          placeholder={searchPlaceholder || 'Buscar mesa, código o recinto...'}
          value={searchText}
          onChangeText={setSearchText}
          onClear={() => setSearchText('')}
          styles={styles}
        />
        <LocationInfoBar
          text={locationText}
          iconColor={locationIconColor}
          styles={styles}
        />
      </View>
    );
  };

  const renderTablesList = () => {
    if (!filteredTables || filteredTables.length === 0) {
      // Mostrar mensaje cuando no hay resultados
      return (
        <View style={[styles.noResultsContainer, {padding: 20}]}>
          <CText style={[styles.noResultsText, {fontSize: 16, color: '#666'}]}>
            {searchText.trim()
              ? 'No se encontraron mesas que coincidan con la búsqueda'
              : 'No hay mesas disponibles'}
          </CText>
        </View>
      );
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
          {filteredTables.map((table, index) => {
            const searchFields = getSearchFields(table);

            return (
              <View
                key={
                  table.id || table._id || table.codigo || table.code || index
                }
                style={{
                  paddingHorizontal: layout.paddingHorizontal,
                  marginBottom: layout.marginBottom,
                }}>
                <TableCard
                  table={table}
                  onPress={handleTablePress}
                  locationData={locationData}
                  searchQuery={searchText} // Pasar el texto de búsqueda
                  styles={{
                    tableCard: styles.tableCard || styles.mesaCard,
                    tableCardTitle:
                      styles.tableCardTitle || styles.mesaCardTitle,
                    tableCardDetail:
                      styles.tableCardDetail || styles.mesaCardDetail,
                  }}
                />
              </View>
            );
          })}
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
        <View
          style={
            styles.loadingOverlay || {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }
          }>
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
