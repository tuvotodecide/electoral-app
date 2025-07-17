// src/redux/reducer/index.js
import { combineReducers } from 'redux';
import themeReducer   from './theme';
import accountReducer from '../slices/accountSlice';
import addressReducer from '../slices/addressSlice';
import authReducer    from '../slices/authSlice';
import walletReducer  from './wallet';

const rootReducer = combineReducers({
  theme:   themeReducer,
  account: accountReducer,
  address: addressReducer,
  auth:    authReducer,
  wallet:  walletReducer,
});

export default rootReducer;
