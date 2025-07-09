import React, {useEffect, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Dimensions} from 'react-native';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../../../common/constants';
import {StackNav, TabNav} from '../../../navigation/NavigationKey';
import UniversalHeader from '../../../components/common/UniversalHeader';

const {width: screenWidth} = Dimensions.get('window');

const SuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);

  // State for time countdown
  const [timeLeft, setTimeLeft] = useState(0);

  // Parameters that define success type and behavior
  const {
    successType = 'publish', // 'publish' or 'certify'
    mesaData: tableData, // Note: Property names within tableData remain in Spanish (numero, recinto, ubicacion) for compatibility
    autoNavigateDelay = 3000, // Time before automatically navigating
    showAutoNavigation = true,
  } = route.params || {};

  console.log('SuccessScreen - Received params:', {
    successType,
    tableData,
    autoNavigateDelay,
    showAutoNavigation,
  });

  // Configuration based on success type
  const getSuccessConfig = () => {
    switch (successType) {
      case 'publish':
        return {
          title: String.documentPublishedSuccessTitle,
          subtitle: String.documentPublishedSuccessSubtitle
            .replace('{tableNumber}', tableData?.numero || 'N/A')
            .replace(
              '{location}',
              tableData?.recinto ||
                tableData?.ubicacion ||
                String.locationNotAvailable,
            ),
          buttonText: String.backToHome,
          showInitiativeText: true,
        };
      case 'certify':
        return {
          title: String.documentCertifiedSuccessTitle,
          subtitle: String.documentCertifiedSuccessSubtitle
            .replace('{tableNumber}', tableData?.numero || 'N/A')
            .replace(
              '{location}',
              tableData?.recinto ||
                tableData?.ubicacion ||
                String.locationNotAvailable,
            ),
          buttonText: String.backToHome,
          showInitiativeText: false,
        };
      default:
        return {
          title: String.operationSuccessTitle,
          subtitle: String.operationSuccessSubtitle,
          buttonText: String.backToHome,
          showInitiativeText: false,
        };
    }
  };

  const config = getSuccessConfig();

  const handleBack = () => {
    console.log('SuccessScreen - handleBack called');
    // Try multiple navigation methods
    try {
      // Method 1: PopToTop (most direct)
      navigation.popToTop();
    } catch (error) {
      console.error('PopToTop failed, trying reset:', error);
      try {
        // Method 2: Reset complete stack
        navigation.reset({
          index: 0,
          routes: [{name: StackNav.TabNavigation}],
        });
      } catch (error2) {
        console.error('Reset failed, trying navigate:', error2);
        // Method 3: Simple navigate
        navigation.navigate(StackNav.TabNavigation);
      }
    }
  };

  const handleContinue = () => {
    console.log('SuccessScreen - handleContinue called');
    // Try multiple navigation methods
    try {
      // Method 1: PopToTop (most direct)
      navigation.popToTop();
    } catch (error) {
      console.error('PopToTop failed, trying reset:', error);
      try {
        // Method 2: Reset complete stack
        navigation.reset({
          index: 0,
          routes: [{name: StackNav.TabNavigation}],
        });
      } catch (error2) {
        console.error('Reset failed, trying navigate:', error2);
        // Method 3: Simple navigate
        navigation.navigate(StackNav.TabNavigation);
      }
    }
  };

  // Optional automatic navigation with counter
  useEffect(() => {
    console.log('SuccessScreen - useEffect started with:', {
      showAutoNavigation,
      autoNavigateDelay,
    });
    if (showAutoNavigation && autoNavigateDelay > 0) {
      // Initialize the counter
      const initialTime = Math.ceil(autoNavigateDelay / 1000);
      console.log('SuccessScreen - Setting initial time:', initialTime);
      setTimeLeft(initialTime);

      // Counter that updates every second
      const countdown = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          console.log('SuccessScreen - Countdown:', newTime);
          // Only update the counter without side effects
          return newTime > 0 ? newTime : 0;
        });
      }, 1000);

      return () => {
        clearInterval(countdown);
      };
    }
  }, [showAutoNavigation, autoNavigateDelay]);

  // Separate effect to handle navigation when the counter reaches zero
  useEffect(() => {
    // If the counter has reached 0 and automatic navigation is enabled
    if (timeLeft === 0 && showAutoNavigation && autoNavigateDelay > 0) {
      console.log('SuccessScreen - Time up, navigating to home');
      // Use a setTimeout to ensure we don't execute navigation during render
      const navigateTimer = setTimeout(() => {
        handleContinue();
      }, 100);

      return () => clearTimeout(navigateTimer);
    }
  }, [timeLeft, showAutoNavigation, autoNavigateDelay]);

  return (
    <CSafeAreaView style={styles.container}>
      {/* Header */}
      <UniversalHeader
        colors={colors}
        onBack={handleBack}
        title={String.confirmation}
        showNotification={false}
      />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconCircleSuccess}>
          <Ionicons name="checkmark" size={moderateScale(48)} color="#459151" />
        </View>

        {/* Success Title */}
        <CText style={styles.successTitle}>{config.title}</CText>

        {/* Success Subtitle */}
        <CText style={styles.successSubtitle}>{config.subtitle}</CText>

        {/* Logo Container (placeholder for logos if needed) */}
        {config.showInitiativeText && (
          <>
            <View style={styles.logoContainer}>
              {/* Here you can add logos if needed */}
            </View>
            <CText style={styles.initiativeText}>
              {String.voluntaryInitiative}
            </CText>
          </>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}>
          <CText style={styles.continueButtonText}>{config.buttonText}</CText>
        </TouchableOpacity>

        {/* Auto navigation indicator */}
        {showAutoNavigation && timeLeft > 0 && (
          <CText style={styles.autoNavigationText}>
            {String.autoNavigating
              .replace('{timeLeft}', timeLeft)
              .replace('{s}', timeLeft !== 1 ? 's' : '')}
          </CText>
        )}
      </View>
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(32),
  },
  iconCircleSuccess: {
    backgroundColor: '#e8f5e9',
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(24),
  },
  successTitle: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#459151',
    textAlign: 'center',
    marginBottom: moderateScale(16),
    lineHeight: moderateScale(30),
  },
  successSubtitle: {
    fontSize: moderateScale(16),
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: moderateScale(32),
    lineHeight: moderateScale(22),
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(16),
    marginBottom: moderateScale(16),
    minHeight: moderateScale(60), // Reserved space for logos
  },
  initiativeText: {
    fontSize: moderateScale(14),
    color: '#868686',
    marginBottom: moderateScale(32),
  },
  continueButton: {
    backgroundColor: '#459151',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(48),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  continueButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#fff',
  },
  autoNavigationText: {
    fontSize: moderateScale(14),
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

export default SuccessScreen;
