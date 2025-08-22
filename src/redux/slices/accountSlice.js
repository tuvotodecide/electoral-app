import { createSlice } from "@reduxjs/toolkit";

export const accountSlice = createSlice({
	name: 'account',
	initialState: {
		balance: '0',
		tokenBalances: [],
	},
	reducers: {
		setBalance: (state, action) => {
			state.balance = action.payload.totalBalance;
			state.tokenBalances = action.payload.tokenBalances;
		}
	}
});

export const {setAccount, setBalance} = accountSlice.actions;
export default accountSlice.reducer;