
import { SET_SECRETS, CLEAR_WALLET } from '../types';

const INITIAL_STATE = {
  payload: null,
};

export default function walletReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SET_SECRETS:
      return { ...state, payload: action.payload };
    case CLEAR_WALLET:
      return { ...state, payload: null };
    default:
      return state;
  }
}
