import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false, // Bypass autenticación para desarrollo
  pendingNav: null,
  pendingNotificationNavigation: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated(state, action) {
      state.isAuthenticated = action.payload;
    },
    setPendingNav(state, action) {
      state.pendingNav = action.payload;
    },
    setPendingNotificationNavigation(state, action) {
      state.pendingNotificationNavigation = action.payload;
    },
    clearPendingNotificationNavigation(state) {
      state.pendingNotificationNavigation = null;
    },
    clearAuth(state) {
      state.isAuthenticated = false;
      state.pendingNav = null;
      state.pendingNotificationNavigation = null;
    },
  },
});

export const {
  setAuthenticated,
  setPendingNav,
  setPendingNotificationNavigation,
  clearPendingNotificationNavigation,
  clearAuth,
} = authSlice.actions;
export default authSlice.reducer;
