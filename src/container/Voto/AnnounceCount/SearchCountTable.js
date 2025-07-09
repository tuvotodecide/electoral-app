import React, {useState, useEffect} from 'react';
import {ActivityIndicator, View} from 'react-native';
import BaseSearchTableScreen from '../../../components/common/BaseSearchTableScreen';
import CustomModal from '../../../components/common/CustomModal';
import CText from '../../../components/common/CText';
import {useSearchTableLogic} from '../../../hooks/useSearchTableLogic';
import {createSearchTableStyles} from '../../../styles/searchTableStyles';
import {fetchMesasConteo} from '../../../data/mockMesas';
import {StackNav} from '../../../navigation/NavigationKey';
import String from '../../../i18n/String';

const SearchCountTable = () => {
  const [mesas, setMesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.acceptButton,
  });

  const {
    colors,
    searchText,
    setSearchText,
    handleBack,
    handleTablePress,
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  } = useSearchTableLogic(StackNav.CountTableDetail);

  const styles = createSearchTableStyles();

  // Load tables when component mounts
  useEffect(() => {
    loadTables();
  }, []);

  const showModal = (
    type,
    title,
    message,
    buttonText = String.acceptButton,
  ) => {
    setModalConfig({type, title, message, buttonText});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const loadTables = async () => {
    try {
      setIsLoading(true);
      console.log('SearchCountTable: Loading count tables...');
      const response = await fetchMesasConteo();

      if (response.success) {
        console.log(
          'SearchCountTable: Count tables loaded successfully:',
          response.data.length,
        );
        setMesas(response.data);
      } else {
        console.error('SearchCountTable: Failed to load count tables');
        showModal('error', String.errorTitle, String.couldNotLoadCountTables);
      }
    } catch (error) {
      console.error('SearchCountTable: Error loading count tables:', error);
      showModal('error', String.errorTitle, String.errorLoadingCountTables);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading indicator while tables are loading
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FAFAFA',
        }}>
        <ActivityIndicator size="large" color={colors.primary || '#4F9858'} />
        <CText
          style={{
            marginTop: 15,
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
          }}>
          {String.loadingCountTables}
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

export default SearchCountTable;
