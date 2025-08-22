import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  account: null,      
  guardian: null,     
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    setAddresses: (
      state,
      action
    ) => {
      state.account  = action.payload.account;
      state.guardian = action.payload.guardian;  
    },
    clearAddresses: state => {
      state.account  = null;
      state.guardian = null;
    },
  },
});

export const { setAddresses, clearAddresses } = addressSlice.actions;
export default addressSlice.reducer;
