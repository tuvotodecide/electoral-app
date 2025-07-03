import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false, // Bypass autenticación para desarrollo
  pendingNav: null,
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
    clearAuth(state) {
      state.isAuthenticated = false;
      state.pendingNav = null;
    },
  },
});

export const {setAuthenticated, setPendingNav, clearAuth} = authSlice.actions;
export default authSlice.reducer;
