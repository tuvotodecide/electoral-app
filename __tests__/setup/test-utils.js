/**
 * Test Utilities
 * Funciones helper y utilidades reutilizables para tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';

// Import your actual reducers here
// import authSlice from '../../src/redux/slices/authSlice';

/**
 * Creates a mock Redux store for testing
 */
export function createMockStore(initialState = {}) {
  // Default theme state to prevent errors
  const defaultTheme = {
    theme: {
      primary: '#459151',
      grayScale50: '#F8F9FA',
      grayScale500: '#6B7280',
      colorText: '#2F2F2F',
      textColor: '#2F2F2F',
      inputBackground: '#FFFFFF',
      primary50: '#EAF8F1',
      dark: false,
    }
  };

  // Merge default state with provided initial state
  const mergedInitialState = {
    auth: { isAuthenticated: false },
    user: { profile: null },
    voting: { currentVote: null },
    wallet: { payload: {} },
    theme: defaultTheme,
    ...initialState
  };

  return configureStore({
    reducer: {
      // auth: authSlice,
      // Add your actual reducers here
      auth: (state = { isAuthenticated: false }, action) => state,
      user: (state = { profile: null }, action) => state,
      voting: (state = { currentVote: null }, action) => state,
      wallet: (state = { payload: {} }, action) => state,
      theme: (state = defaultTheme, action) => state,
    },
    preloadedState: mergedInitialState,
  });
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui,
  {
    initialState = {},
    store = createMockStore(initialState),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </Provider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Custom render function with only Redux provider
 */
export function renderWithRedux(
  ui,
  {
    initialState = {},
    store = createMockStore(initialState),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Custom render function with only Navigation provider
 */
export function renderWithNavigation(ui, renderOptions = {}) {
  function Wrapper({ children }) {
    return <NavigationContainer>{children}</NavigationContainer>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock navigation prop
 */
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
};

/**
 * Mock route prop
 */
export const mockRoute = {
  key: 'test-key',
  name: 'TestScreen',
  params: {},
};

/**
 * Creates a mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    phone: '+1234567890',
    name: 'Test User',
    isVerified: true,
    pin: '1234',
    biometricEnabled: false,
    ...overrides,
  };
}

/**
 * Creates a mock voting table object
 */
export function createMockVotingTable(overrides = {}) {
  return {
    id: 'table-123',
    number: '001',
    location: 'Test Location',
    address: '123 Test Street',
    district: 'Test District',
    voters: 100,
    ...overrides,
  };
}

/**
 * Creates a mock guardian object
 */
export function createMockGuardian(overrides = {}) {
  return {
    id: 'guardian-123',
    name: 'Test Guardian',
    email: 'guardian@example.com',
    phone: '+1234567890',
    status: 'active',
    ...overrides,
  };
}

/**
 * Creates a mock electoral record
 */
export function createMockElectoralRecord(overrides = {}) {
  return {
    id: 'record-123',
    tableId: 'table-123',
    timestamp: '2025-09-10T10:00:00Z',
    photos: [],
    witnesses: [],
    status: 'pending',
    ...overrides,
  };
}

/**
 * Wait for async operations in tests
 */
export function waitFor(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock API response
 */
export function createMockApiResponse(data, success = true) {
  return {
    data,
    success,
    status: success ? 200 : 400,
    message: success ? 'Success' : 'Error',
  };
}

/**
 * Mock Firebase auth user
 */
export function createMockFirebaseUser(overrides = {}) {
  return {
    uid: 'firebase-uid-123',
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
    photoURL: null,
    phoneNumber: '+1234567890',
    ...overrides,
  };
}

/**
 * Mock AsyncStorage for tests
 */
export const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
};

/**
 * Common test assertions
 */
export const assertions = {
  toBeVisible: (element) => expect(element).toBeTruthy(),
  toBeDisabled: (element) => expect(element).toBeDisabled(),
  toHaveText: (element, text) => expect(element).toHaveTextContent(text),
};

// Re-export everything from React Native Testing Library
export * from '@testing-library/react-native';
