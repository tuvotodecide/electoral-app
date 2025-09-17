import React from 'react';
import {
  ScrollView,
  View,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
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
import Ionicons from 'react-native-vector-icons/Ionicons';
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
const getTableNumber = table => {
  const raw =
    table.tableNumber ??
    table.numero ??
    table.number ??
    table.name ??
    table.id ??
    '0';
  const n = parseInt(String(raw).replace(/\D+/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
};

const sortTables = (arr = [], order = 'desc') => {
  const copy = [...arr];
  copy.sort((a, b) => {
    const an = getTableNumber(a);
    const bn = getTableNumber(b);
    return order === 'asc' ? an - bn : bn - an;
  });
  return copy;
};

// --- Dropdown simple: "Ascendente / Descendente"
const SortDropdown = ({
  value = 'desc',
  onChange,
  labelAsc = 'Ascendente',
  labelDesc = 'Descendente',
}) => {
  const [open, setOpen] = React.useState(false);
  const currentLabel = value === 'asc' ? labelAsc : labelDesc;

  return (
    <View style={{marginHorizontal: getResponsiveSize(12, 16, 20)}}>
      <TouchableOpacity
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.8}
        style={styles1.dropdownMenu}>
        <Ionicons
          name="swap-vertical"
          size={18}
          color="#4F9858"
          style={{marginRight: 8}}
        />
        <CText
          style={{
            fontSize: getResponsiveSize(13, 15, 16),
            color: '#333',
            fontWeight: '700',
          }}>
          {currentLabel}
        </CText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#888"
          style={{marginLeft: 8}}
        />
      </TouchableOpacity>

      {open && (
        <View style={styles1.iconText}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              onChange?.('asc');
              setOpen(false);
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Ionicons
              name="arrow-up"
              size={16}
              color="#4F9858"
              style={{marginRight: 8}}
            />
            <CText
              style={{
                color: value === 'asc' ? '#4F9858' : '#333',
                fontWeight: value === 'asc' ? '800' : '500',
              }}>
              {labelAsc}
            </CText>
          </TouchableOpacity>

          <View style={{height: 1, backgroundColor: '#F1F1F1'}} />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              onChange?.('desc');
              setOpen(false);
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Ionicons
              name="arrow-down"
              size={16}
              color="#4F9858"
              style={{marginRight: 8}}
            />
            <CText
              style={{
                color: value === 'desc' ? '#4F9858' : '#333',
                fontWeight: value === 'desc' ? '800' : '500',
              }}>
              {labelDesc}
            </CText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
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
  const [sortOrder, setSortOrder] = React.useState('asc');

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
  const sortedTables = React.useMemo(
    () => sortTables(filteredTables, sortOrder),
    [filteredTables, sortOrder],
  );

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
      marginTop: 0,
      marginBottom: getResponsiveSize(6, 8, 10),
    };

    return (
      <View testID="baseSearchTableScreenSearchContainer" style={containerStyle}>
        <SearchInput
          testID="baseSearchTableScreenSearchInput"
          placeholder={searchPlaceholder || 'Buscar mesa, código o recinto...'}
          value={searchText}
          onChangeText={setSearchText}
          onClear={() => setSearchText('')}
          styles={styles}
        />
        <LocationInfoBar
          testID="baseSearchTableScreenLocationBar"
          text={locationText}
          iconColor={locationIconColor}
          styles={styles}
        />
        <SortDropdown
          value={sortOrder}
          onChange={setSortOrder}
          labelAsc="Ascendente"
          labelDesc="Descendente"
        />
      </View>
    );
  };

  const CenteredTitleHeader = ({
    colors,
    onBack,
    title,
    showNotification = true,
    onNotificationPress,
    styles,
  }) => {
    const sidePadding = getResponsiveSize(56, 64, 72);

    return (
      <View style={{position: 'relative'}}>
        <SearchTableHeader
          colors={colors}
          onBack={onBack}
          title=""
          showNotification={showNotification}
          onNotificationPress={onNotificationPress}
          styles={styles}
        />

        {/* Overlay centrado */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: sidePadding,
            right: sidePadding,
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <CText
            style={[
              {
                fontWeight: '700',
                color: '#2F2F2F',
                fontSize: getResponsiveSize(16, 20, 26),
              },
              styles?.headerTitle,
            ]}
            numberOfLines={1}>
            {title}
          </CText>
        </View>
      </View>
    );
  };

  const renderTablesList = () => {
    if (!filteredTables || filteredTables.length === 0) {
      // Mostrar mensaje cuando no hay resultados
      return (
        <View style={{flex: 1}}>
          <View testID="baseSearchTableScreenNoResultsContainer" style={[styles.noResultsContainer, styles1.noResultsContainer, {padding: 20}]}>
            <CText testID="baseSearchTableScreenNoResultsText" style={[styles.noResultsText, styles1.noResultsText, {fontSize: 16, color: '#666'}]}>
              {searchText.trim()
                ? 'No se encontraron mesas que coincidan con la búsqueda'
                : 'No hay mesas disponibles'}
            </CText>
          </View>
        </View>
      );
    }

    const layout = getCardLayout();

    if (layout.cardsPerRow === 1) {
      // Single column layout for phones
      return (
        <ScrollView
          testID="baseSearchTableScreenScrollView"
          style={styles.tableList || styles.mesaList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: getResponsiveSize(20, 30, 40),
          }}>
          {sortedTables.map((table, index) => {
            const searchFields = getSearchFields(table);

            return (
              <View
                testID={`baseSearchTableScreenTableItem_${index}`}
                key={
                  table.id || table._id || table.codigo || table.code || index
                }
                style={{
                  paddingHorizontal: layout.paddingHorizontal,
                  marginBottom: layout.marginBottom,
                }}>
                <TableCard
                  testID={`baseSearchTableScreenTableCard_${index}`}
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
      for (let i = 0; i < sortedTables.length; i += layout.cardsPerRow) {
        groups.push(sortedTables.slice(i, i + layout.cardsPerRow));
      }

      return (
        <ScrollView
          testID="baseSearchTableScreenTabletScrollView"
          style={styles.tableList || styles.mesaList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: getResponsiveSize(20, 30, 40),
          }}>
          {groups.map((group, index) => (
            <View
              testID={`baseSearchTableScreenTabletRow_${index}`}
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
                  testID={`baseSearchTableScreenTabletTableItem_${index}_${tableIndex}`}
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
                    testID={`baseSearchTableScreenTabletTableCard_${index}_${tableIndex}`}
                    table={table}
                    onPress={handleTablePress}
                    locationData={locationData}
                    searchQuery={searchText}
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
    <CSafeAreaView testID="baseSearchTableScreenContainer" style={styles.container}>
      <CenteredTitleHeader
        colors={colors}
        onBack={onBack}
        title={title}
        showNotification={showNotification}
        onNotificationPress={onNotificationPress}
        styles={styles}
      />
      {/*
      <View
        testID="baseSearchTableScreenChooseTextContainer"
        style={{
          paddingHorizontal: getResponsiveSize(12, 16, 20),
          marginVertical: getResponsiveSize(8, 12, 16),
        }}>
        <ChooseTableText testID="baseSearchTableScreenChooseText" text={finalChooseText} styles={styles} />
      </View>
         */}

      {renderSearchAndLocation()}

      {renderTablesList()}

      {/* Loading overlay when verifying mesa */}
      {isVerifying && (
        <View
          testID="baseSearchTableScreenLoadingOverlay"
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
            testID="baseSearchTableScreenLoadingContent"
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 20,
              alignItems: 'center',
              minWidth: 150,
            }}>
            <ActivityIndicator
              testID="baseSearchTableScreenLoadingIndicator"
              size="large"
              color={colors?.primary || '#4F9858'}
            />
            <CText
              testID="baseSearchTableScreenLoadingText"
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
        testID="baseSearchTableScreenModal"
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
const styles1 = {
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    minHeight: getResponsiveSize(240, 280, 320),
  },

  noResultsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: getResponsiveSize(14, 16, 18),
  },

  dropdownMenu: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    height: getResponsiveSize(36, 40, 42),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    marginTop: getResponsiveSize(6, 8, 10),
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  iconText: {
    marginTop: 6,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
    width: getResponsiveSize(190, 210, 220),
  },
};

// Legacy export for backward compatibility
export const BaseSearchMesaScreen = BaseSearchTableScreen;
export default BaseSearchTableScreen;
