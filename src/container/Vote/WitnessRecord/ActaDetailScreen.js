import React, {useState, useMemo} from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import BaseRecordReviewScreen from '../../../components/common/BaseRecordReviewScreen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import String from '../../../i18n/String';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const ActaDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  console.log(route);
  
  const colors = useSelector(state => state.theme.theme);

  const {
    selectedActa,
    tableData,
    partyResults: rawPartyResults = [],
    voteSummaryResults: rawVoteSummaryResults = {},
    allActas,
    onCorrectActaSelected,
    onUploadNewActa,
  } = route.params || {};

  const partyResultsTransformed = useMemo(() => {
    try {
      return rawPartyResults.map(party => ({
        id: party.partyId,
        party: party.partyId,
        presidente: party.presidente || 0,
        diputado: party.diputado || 0,
      }));
    } catch (error) {
      return [];
    }
  }, [rawPartyResults]);

  const voteSummaryTransformed = useMemo(() => {
    try {
      return [
        {
          label: 'Válidos',
          value1: rawVoteSummaryResults.presValidVotes || 0, // Presidente
          value2: rawVoteSummaryResults.depValidVotes || 0, // Diputados
        },
        {
          label: 'Blancos',
          value1: rawVoteSummaryResults.presBlankVotes || 0, // Presidente
          value2: rawVoteSummaryResults.depBlankVotes || 0, // Diputados
        },
        {
          label: 'Nulos',
          value1: rawVoteSummaryResults.presNullVotes || 0, // Presidente
          value2: rawVoteSummaryResults.depNullVotes || 0, // Diputados
        },
        {
          label: 'Total',
          value1: rawVoteSummaryResults.presTotalVotes || 0, // Presidente
          value2: rawVoteSummaryResults.depTotalVotes || 0, // Diputados
        },
      ];
    } catch (error) {
  
      return [];
    }
  }, [rawVoteSummaryResults]);

  // Component for handling IPFS images
  const IPFSImageComponent = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleImageError = error => {

      setHasError(true);
      setIsLoading(false);
    };

    const handleImageLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    if (hasError) {
      return (
        <View style={styles.imageError}>
          <MaterialIcons name="broken-image" size={60} color="#999" />
          <CText style={styles.imageErrorText}>Error cargando imagen</CText>
          <CText style={styles.imageErrorSubtext}>
            Verifica tu conexión a internet
          </CText>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image
          source={{uri: selectedActa?.uri}}
          style={[styles.actaImage, isLoading && styles.imageLoading]}
          resizeMode="contain"
          onLoadStart={handleLoadStart}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {isLoading && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator
              size="large"
              color={colors.primary || '#4F9858'}
            />
            <CText style={styles.loadingIndicatorText}>
              Cargando imagen...
            </CText>
          </View>
        )}
      </View>
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleThisIsCorrect = () => {
    if (onCorrectActaSelected) {
      onCorrectActaSelected(selectedActa?.id);
    }
    navigation.goBack();
  };

  const handleUploadCorrectActa = () => {
    if (onUploadNewActa) {
      onUploadNewActa();
    }
  };

  const handleChange = () => {
    navigation.goBack();
  };

  // Action buttons for BaseRecordReviewScreen
  const actionButtons = [
    {
      text: String.itsData,
      onPress: handleThisIsCorrect,
      style: {
        backgroundColor: colors.primary || '#4F9858',
      },
      textStyle: {
        color: '#FFFFFF',
      },
      icon: 'check-circle',
    },
    {
      text: 'Subir acta',
      onPress: handleUploadCorrectActa,
      style: {
        backgroundColor: colors.secondary || '#ff0000ff',
      },
      textStyle: {
        color: '#FFFFFF',
      },
      icon: 'camera-alt',
    },
  ];

  // Add change button only if there are multiple actas
  if (allActas && allActas.length > 1) {
    actionButtons.push({
      text: 'Cambiar',
      onPress: handleChange,
      style: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.textSecondary || '#666',
      },
      textStyle: {
        color: colors.textSecondary || '#666',
      },
      icon: 'swap-horiz',
    });
  }

  // Header title
  const headerTitle = `${String.table} ${
    tableData?.tableNumber || tableData?.numero || tableData?.number || 'N/A'
  }`;

  // Instructions text
  const instructionsText = `Revise la foto del acta`;

  // Custom photo component that uses our IPFS handler
  const PhotoComponent = () => <IPFSImageComponent />;

  return (
    <BaseRecordReviewScreen
      colors={colors}
      headerTitle={headerTitle}
      instructionsText={instructionsText}
      photoUri={selectedActa?.uri} // This will be overridden by our custom component
      PhotoComponent={PhotoComponent} // Pass our custom photo component
      partyResults={partyResultsTransformed || []}
      voteSummaryResults={voteSummaryTransformed || []}
      actionButtons={actionButtons}
      onBack={handleBack}
      showTableInfo={true}
      tableData={tableData}
    />
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    position: 'relative',
  },
  actaImage: {
    width: '100%',
    height: getResponsiveSize(200, 250, 300),
    borderRadius: 8,
  },
  imageError: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    height: getResponsiveSize(200, 250, 300),
    borderRadius: 8,
  },
  imageErrorText: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#999',
    marginTop: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
    fontWeight: '500',
  },
  imageErrorSubtext: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#ccc',
    marginTop: getResponsiveSize(4, 6, 8),
    textAlign: 'center',
  },
  imageLoading: {
    opacity: 0.5,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingIndicatorText: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#666',
    marginTop: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ActaDetailScreen;
