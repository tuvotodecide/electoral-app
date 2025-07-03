import { createSlice } from "@reduxjs/toolkit";

export const receiveBsSlice = createSlice({
	name: 'receiveBs',
	initialState: {
		amount: '0',
		reference: '',
		validUntil: '',
	},
	reducers: {
		setReceiveBs: (state, action) => {
			state.amount = action.payload.amount;
			state.reference = action.payload.reference;
			state.validUntil = action.payload.validUntil;
		}
	}
});

export const {setReceiveBs} = receiveBsSlice.actions;
export default receiveBsSlice.reducer;