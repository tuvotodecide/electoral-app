import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';

import {moderateScale} from '../../common/constants';
import {TabNav} from '../NavigationKey';
import {TabRoute} from '../NavigationRoute';
import CText from '../../components/common/CText';
import String from '../../i18n/String';
import Icono from '../../components/common/Icono';

function useKeepAlive() {
  const dispatch = useDispatch();
  useEffect(() => {}, []);
}

function CustomTabBar({state, descriptors, navigation, colors}) {
  const insets = useSafeAreaInsets();

  // Verificar si estamos en una pantalla donde debemos ocultar el tab bar
  const currentRoute = state.routes[state.index];
  const routeName = getFocusedRouteNameFromRoute(currentRoute) ?? '';
  const hideTabBarScreens = ['CameraScreen', 'CameraPermissionTest'];

  console.log(
    'TabBar - Current route:',
    routeName,
    'Should hide:',
    hideTabBarScreens.includes(routeName),
  );

  // Si estamos en una pantalla que debe ocultar el tab bar, no renderizar nada
  if (hideTabBarScreens.includes(routeName)) {
    return null;
  }

  return (
    <View
      style={[
        stylesx.tabBarContainer,
        {
          backgroundColor: '#fff',
          shadowColor: '#000',
          height: 72 + insets.bottom,
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
            accessibilityRole="button"
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={stylesx.tabButton}>
            <Icono
              name={iconName}
              color="#222" // SIEMPRE NEGRO, NO cambia por selección
              size={33}
              style={{marginBottom: 1}}
            />
            <CText style={stylesx.tabLabel} numberOfLines={1}>
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',

    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 16,
    color: '#222',
    fontWeight: '400',
    marginTop: 2,
    letterSpacing: 0.1,
  },
});
