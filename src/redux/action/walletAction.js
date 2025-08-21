import {clearAddresses} from '../slices/addressSlice';
// import {setReceiveBs} from '../slices/receiveBsSlice';
// import {setReceiveToken} from '../slices/receiveTokenSlice';
// src/redux/action/walletAction.js
import {SET_SECRETS, CLEAR_WALLET} from '../types';



export function setSecrets(payload) {
  return {type: SET_SECRETS, payload};
}

export function clearWallet() {
  return dispatch => {
    dispatch({type: CLEAR_WALLET});
    dispatch(clearAddresses());
  };
}
