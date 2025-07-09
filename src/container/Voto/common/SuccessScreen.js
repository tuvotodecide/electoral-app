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

      {/* Main Content - Different layouts for tablet landscape vs regular */}
      {isTablet && isLandscape ? (
        /* Tablet Landscape Layout */
        <View style={styles.tabletLandscapeContainer}>
          {/* Left Side: Icon and Title */}
          <View style={styles.tabletLeftSide}>
            <View style={styles.iconCircleSuccess}>
              <Ionicons
                name="checkmark"
                size={getResponsiveSize(40, 48, 60)}
                color="#459151"
              />
            </View>
            <CText style={styles.successTitle}>{config.title}</CText>
          </View>

          {/* Right Side: Content and Actions */}
          <View style={styles.tabletRightSide}>
            <CText style={styles.successSubtitle}>{config.subtitle}</CText>

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

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}>
              <CText style={styles.continueButtonText}>
                {config.buttonText}
              </CText>
            </TouchableOpacity>

            {showAutoNavigation && timeLeft > 0 && (
              <CText style={styles.autoNavigationText}>
                {String.autoNavigating
                  .replace('{timeLeft}', timeLeft)
                  .replace('{s}', timeLeft !== 1 ? 's' : '')}
              </CText>
            )}
          </View>
        </View>
      ) : (
        /* Regular Layout: Phones and Tablet Portrait */
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconCircleSuccess}>
            <Ionicons
              name="checkmark"
              size={getResponsiveSize(40, 48, 60)}
              color="#459151"
            />
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
      )}
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Regular Layout: Phones and Tablet Portrait
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSize(16, 24, 32),
  },
  // Tablet Landscape Layout
  tabletLandscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: getResponsiveSize(20, 30, 40),
    paddingVertical: getResponsiveSize(20, 30, 40),
  },
  tabletLeftSide: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: getResponsiveSize(20, 30, 40),
  },
  tabletRightSide: {
    flex: 0.6,
    justifyContent: 'center',
    paddingLeft: getResponsiveSize(20, 30, 40),
  },
  iconCircleSuccess: {
    backgroundColor: '#e8f5e9',
    width: getResponsiveSize(80, 100, 120),
    height: getResponsiveSize(80, 100, 120),
    borderRadius: getResponsiveSize(40, 50, 60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveSize(16, 24, 32),
  },
  successTitle: {
    fontSize: getResponsiveSize(20, 24, 28),
    fontWeight: '700',
    color: '#459151',
    textAlign: 'center',
    marginBottom: getResponsiveSize(12, 16, 20),
    lineHeight: getResponsiveSize(26, 30, 34),
    ...(isTablet &&
      isLandscape && {
        // In tablet landscape, title can be larger
        fontSize: getResponsiveSize(24, 28, 32),
        lineHeight: getResponsiveSize(30, 34, 38),
      }),
  },
  successSubtitle: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: getResponsiveSize(24, 32, 40),
    lineHeight: getResponsiveSize(18, 22, 26),
    ...(isTablet &&
      isLandscape && {
        // In tablet landscape, align left instead of center
        textAlign: 'left',
      }),
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(12, 16, 20),
    minHeight: getResponsiveSize(40, 60, 80),
    ...(isTablet &&
      isLandscape && {
        // In tablet landscape, align left
        justifyContent: 'flex-start',
      }),
  },
  initiativeText: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#868686',
    marginBottom: getResponsiveSize(24, 32, 40),
    textAlign: 'center',
    ...(isTablet &&
      isLandscape && {
        // In tablet landscape, align left
        textAlign: 'left',
      }),
  },
  continueButton: {
    backgroundColor: '#459151',
    paddingVertical: getResponsiveSize(12, 16, 20),
    paddingHorizontal: getResponsiveSize(32, 48, 64),
    borderRadius: getResponsiveSize(6, 8, 10),
    marginBottom: getResponsiveSize(12, 16, 20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignSelf: 'center',
    ...(isTablet &&
      isLandscape && {
        // In tablet landscape, align left
        alignSelf: 'flex-start',
      }),
  },
  continueButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  autoNavigationText: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
    ...(isTablet &&
      isLandscape && {
        // In tablet landscape, align left
        textAlign: 'left',
      }),
  },
});

export default SuccessScreen;
