import { createSlice } from "@reduxjs/toolkit";
import {TOKEN_NETWORK, TOKEN_ADDRESS, TOKEN_SYMBOL, TOKEN_LOGO} from '@env';

export const receiveTokenSlice = createSlice({
	name: 'receiveToken',
	initialState: {
		network: TOKEN_NETWORK,
		tokenAddress: TOKEN_ADDRESS,
		tokenSymbol: TOKEN_SYMBOL,
		tokenLogo: TOKEN_LOGO,
		amount: '0',
		reference: '',
		validUntil: '',
	},
	reducers: {
		setReceiveToken: (state, action) => {
			state.network = action.payload.network;
			state.tokenAddress = action.payload.tokenAddress;
			state.tokenSymbol = action.payload.tokenSymbol;
			state.tokenLogo = action.payload.tokenLogo;
			state.amount = action.payload.amount;
			state.reference = action.payload.reference;
			state.validUntil = action.payload.validUntil;
		}
	}
});

export const {setReceiveToken} = receiveTokenSlice.actions;
export default receiveTokenSlice.reducer;