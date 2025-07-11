import React, {useState, useEffect} from 'react';
import {ActivityIndicator, View, Dimensions} from 'react-native';
import BaseSearchTableScreen from '../../../components/common/BaseSearchTableScreen';
import CustomModal from '../../../components/common/CustomModal';
import CText from '../../../components/common/CText';
import {useSearchTableLogic} from '../../../hooks/useSearchTableLogic';
import {createSearchTableStyles} from '../../../styles/searchTableStyles';
import {fetchMesas} from '../../../data/mockMesas';
import {StackNav} from '../../../navigation/NavigationKey';
import String from '../../../i18n/String';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const WitnessRecordScreen = () => {
  const [mesas, setMesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.accept,
  });

  const {
    colors,
    searchText,
    setSearchText,
    handleBack,
    handleTablePress: baseTablePress,
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  } = useSearchTableLogic(StackNav.WhichIsCorrectScreen);

  const styles = createSearchTableStyles();

  // Load tables when component mounts
  useEffect(() => {
    loadTables();
  }, []);

  const showModal = (type, title, message, buttonText = String.accept) => {
    setModalConfig({type, title, message, buttonText});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const loadTables = async () => {
    try {
      setIsLoading(true);
      console.log('WitnessRecord: Loading tables...');
      const response = await fetchMesas();

      if (response.success) {
        console.log(
          'WitnessRecord: Tables loaded successfully:',
          response.data.length,
        );
        setMesas(response.data);
      } else {
        console.error('WitnessRecord: Failed to load tables');
        showModal('error', String.error, String.couldNotLoadTables);
      }
    } catch (error) {
      console.error('WitnessRecord: Error loading tables:', error);
      showModal('error', String.error, String.errorLoadingTables);
    } finally {
      setIsLoading(false);
    }
  };

  // Override handleTablePress for WitnessRecord specific behavior
  const handleTablePress = mesa => {
    console.log('WitnessRecord - handleTablePress called with mesa:', mesa);
    console.log(
      'WitnessRecord - StackNav.WhichIsCorrectScreen:',
      StackNav.WhichIsCorrectScreen,
    );

    try {
      // Use baseTablePress from hook but with correct parameters for WitnessRecord
      const mesaWithPhoto = {
        tableData: mesa,
        photoUri:
          'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      };
      console.log(
        'WitnessRecord - Calling baseTablePress with:',
        mesaWithPhoto,
      );
      baseTablePress(mesaWithPhoto);
      console.log('WitnessRecord - baseTablePress call successful');
    } catch (error) {
      console.error('WitnessRecord - Navigation error:', error);
    }
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
      <BaseSearchTableScreen
        // Header props
        colors={colors}
        onBack={handleBack}
        title={String.searchTable}
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
        // Table list props
        tables={mesas}
        onTablePress={handleTablePress}
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
      />
    </>
  );
};

export default WitnessRecordScreen;
