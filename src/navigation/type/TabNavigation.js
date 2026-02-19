import React, {useEffect, useRef} from 'react';
import {useSelector} from 'react-redux';
import {
  AppState,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getFocusedRouteNameFromRoute, useNavigation} from '@react-navigation/native';
import {StackNav, TabNav} from '../NavigationKey';
import {TabRoute} from '../NavigationRoute';
import CText from '../../components/common/CText';
import String from '../../i18n/String';
import Icono from '../../components/common/Icono';
import {isSessionValid, refreshSession} from '../../utils/Session';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};
function useKeepAlive() {
  const navigation = useNavigation();
  const appStateRef = useRef(AppState.currentState);
  const redirectingRef = useRef(false);
  useEffect(() => {
    const redirectToAuth = () => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      navigation.reset({
        index: 0,
        routes: [{name: StackNav.AuthNavigation}],
      });
    };

    const validateOrRedirect = async () => {
      const valid = await isSessionValid();
      if (!valid) {
        redirectToAuth();
      }
      return valid;
    };

    const renew = async () => {
      try {
        await refreshSession();
      } catch {}
    };
    const sub = AppState.addEventListener('change', async nextState => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active') {
        const valid = await validateOrRedirect();
        if (valid) await renew();
        return;
      }

      if (
        prevState === 'active' &&
        (nextState === 'background' || nextState === 'inactive')
      ) {
        // Keep full TTL when app is minimized.
        await renew();
      }
    });
    const id = setInterval(async () => {
      if (appStateRef.current !== 'active') return;
      await renew();
      await validateOrRedirect();
    }, 300_000); // 300_000 ms = 5 minutos
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, [navigation]);
}

function CustomTabBar({state, descriptors, navigation, colors}) {
  const insets = useSafeAreaInsets();

  // Verificar si estamos en una pantalla donde debemos ocultar el tab bar
  const currentRoute = state.routes[state.index];
  const routeName = getFocusedRouteNameFromRoute(currentRoute) ?? '';
  const hideTabBarScreens = [
    'CameraScreen',
    'CameraPermissionTest',
    'SuccessScreen',
  ];


  // Si estamos en una pantalla que debe ocultar el tab bar, no renderizar nada
  if (hideTabBarScreens.includes(routeName)) {
    return null;
  }

  return (
    <View
      testID="tabBarContainer"
      style={[
        stylesx.tabBarContainer,
        {
          backgroundColor: '#fff',
          shadowColor: '#000',
          height: getResponsiveSize(66, 72, 78) + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}>
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
        const iconName = options.tabBarIconName;
        // NO color primario ni destacado
        // const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            testID={`tabButton_${route.name}`}
            accessibilityRole="button"
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={stylesx.tabButton}>
            <Icono
              testID={`tabIcon_${route.name}`}
              name={iconName}
              color="#222" // SIEMPRE NEGRO, NO cambia por selección
              size={getResponsiveSize(28, 33, 38)}
              style={{marginBottom: getResponsiveSize(0, 1, 2)}}
            />
            <CText testID={`tabLabel_${route.name}`} style={stylesx.tabLabel} numberOfLines={1}>
              {label}
            </CText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabNavigation() {
  useKeepAlive();
  const colors = useSelector(state => state.theme.theme);
  const Tab = createBottomTabNavigator();

  return (
    <Tab.Navigator
      testID="mainTabNavigator"
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <CustomTabBar {...props} colors={colors} />}>
      <Tab.Screen
        name={TabNav.HomeScreen}
        component={TabRoute.HomeScreen}
        options={{
          tabBarLabel: String.home,
          tabBarIconName: 'home-outline',
        }}
      />
      <Tab.Screen
        name={TabNav.Profile}
        component={TabRoute.Profile}
        options={{
          tabBarLabel: String.profile,
          tabBarIconName: 'account-circle-outline',
        }}
      />
    </Tab.Navigator>
  );
}

const stylesx = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',

    backgroundColor: '#fff',
    borderTopLeftRadius: getResponsiveSize(24, 28, 32),
    borderTopRightRadius: getResponsiveSize(24, 28, 32),
    borderTopWidth: 0,

    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 14,
    zIndex: 1000, // Asegurar que esté por encima del contenido
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(4, 6, 8),
  },
  tabLabel: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#222',
    fontWeight: '400',
    marginTop: getResponsiveSize(1, 2, 3),
    letterSpacing: 0.1,
  },
});
