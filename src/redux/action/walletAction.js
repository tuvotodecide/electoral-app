import { clearAddresses } from '../slices/addressSlice';
import {setReceiveBs} from '../slices/receiveBsSlice';
import {setReceiveToken} from '../slices/receiveTokenSlice';
// src/redux/action/walletAction.js
import {SET_SECRETS, CLEAR_WALLET} from '../types';

export const setReceiveBsData = data => dispatch => {
  try {
    dispatch(setReceiveBs(data));
  } catch (error) {
    console.error(error);
  }
};

export const setReceiveTokenData = data => dispatch => {
  try {
    dispatch(setReceiveToken(data));
  } catch (error) {
    console.error(error);
  }
};

export function setSecrets(payload) {
  return {type: SET_SECRETS, payload};
}

export function clearWallet() {
  return dispatch => {
    dispatch({type: CLEAR_WALLET});
    dispatch(clearAddresses()); 
  };
}
