import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  account: null,
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    setAddresses: (
      state,
      action
    ) => {
      state.account = action.payload.account;
    },
    clearAddresses: state => {
      state.account = null;
    },
  },
});

export const { setAddresses, clearAddresses } = addressSlice.actions;
export default addressSlice.reducer;
