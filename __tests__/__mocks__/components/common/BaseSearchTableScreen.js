import React from 'react';

// Mock para BaseSearchTableScreen
const BaseSearchTableScreen = (props) => {
  const {
    testID,
    tables = [],
    onTablePress,
    locationData,
    searchValue,
    onSearchChange,
    onBack,
    title,
    chooseTableText,
    searchPlaceholder,
    locationText,
    onHomePress,
    onProfilePress,
    onNotificationPress,
    isLoading,
    styles,
    locationIconColor,
    showLocationFirst,
    showNotification,
    ...restProps
  } = props;

  const handleTablePress = (table, index) => {
    if (onTablePress) {
      onTablePress(table, index);
    }
  };

  // Si está cargando, mostrar loading
  if (isLoading) {
    return React.createElement(
      'View',
      { testID: 'unifiedTableScreenLoadingContainer' },
      React.createElement('ActivityIndicator', { testID: 'unifiedTableScreenLoadingIndicator' }),
      React.createElement('Text', { 
        testID: 'unifiedTableScreenLoadingText',
        children: 'Cargando mesas...'
      })
    );
  }

  return React.createElement(
    'View',
    { 
      testID: testID || 'unifiedTableScreenBaseScreen',
      // Pasar todas las props para que los tests puedan accederlas
      tables,
      locationData,
      styles,
      isLoading,
      title,
      chooseTableText,
      searchPlaceholder,
      locationText,
      onBack,
      onNotificationPress,
      onHomePress,
      onProfilePress,
      onTablePress,
      searchValue,
      onSearchChange,
      locationIconColor,
      showLocationFirst,
      showNotification,
      ...restProps
    },
    // Header
    React.createElement(
      'View',
      { testID: 'baseSearchTableScreenHeader' },
      React.createElement('TouchableOpacity', {
        testID: 'baseSearchTableScreenBackButton',
        onPress: onBack,
      }),
      React.createElement('Text', {
        testID: 'baseSearchTableScreenTitle',
        children: title || locationData?.name || 'Escuela Test',
      }),
      React.createElement('TouchableOpacity', {
        testID: 'baseSearchTableScreenNotificationButton',
        onPress: onNotificationPress,
      })
    ),
    // Choose table text
    React.createElement('Text', {
      testID: 'baseSearchTableScreenChooseText',
      children: chooseTableText || 'Por favor, elige una mesa',
    }),
    // Search input
    React.createElement('TextInput', {
      testID: 'baseSearchTableScreenSearchInput',
      placeholder: searchPlaceholder || 'Buscar mesa por número o código...',
      value: searchValue || '',
      onChangeText: onSearchChange,
    }),
    // Location info
    React.createElement(
      'View',
      { testID: 'baseSearchTableScreenLocationInfo' },
      React.createElement('Text', {
        testID: 'baseSearchTableScreenLocationText',
        children: locationText || 'Lista basada en ubicación',
      }),
      React.createElement('Text', {
        testID: 'baseSearchTableScreenLocationName',
        children: locationData?.name || 'Escuela Test',
      }),
      React.createElement('Text', {
        testID: 'baseSearchTableScreenLocationAddress',
        children: locationData?.address || 'Dirección Test 123',
      })
    ),
    // Tables list - En lugar de usar FlatList que no renderiza items en tests, 
    // crear los elementos directamente
    React.createElement(
      'View',
      { testID: 'baseSearchTableScreenTablesList' },
      // Renderizar cada tabla como un elemento individual
      ...(tables || []).map((item, index) =>
        React.createElement(
          'TouchableOpacity',
          {
            key: item?.id?.toString() || index.toString(),
            testID: `baseSearchTableScreenTableItem_${index}`,
            onPress: () => handleTablePress(item, index),
          },
          React.createElement('Text', {
            testID: `baseSearchTableScreenTableItemNumber_${index}`,
            children: item?.numero || item?.tableNumber || item?.number || 'N/A',
          }),
          React.createElement('Text', {
            testID: `baseSearchTableScreenTableItemCode_${index}`,
            children: item?.codigo || item?.tableCode || item?.code || 'N/A',
          })
        )
      )
    ),
    // Bottom navigation
    React.createElement(
      'View',
      { testID: 'baseSearchTableScreenBottomNavigation' },
      React.createElement('TouchableOpacity', {
        testID: 'baseSearchTableScreenHomeButton',
        onPress: onHomePress,
      }),
      React.createElement('TouchableOpacity', {
        testID: 'baseSearchTableScreenProfileButton',
        onPress: onProfilePress,
      })
    )
  );
};

export default BaseSearchTableScreen;