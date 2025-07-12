import theme from './theme';
import account from '../slices/accountSlice';
// import receiveBs from '../slices/receiveBsSlice';
// import receiveToken from '../slices/receiveTokenSlice';
import address from '../slices/addressSlice';
import auth from '../slices/authSlice';
import wallet from './wallet';

const rootReducer = {
  theme,
  account,
  // receiveBs,
  // receiveToken,
  wallet,
  address,
  auth,
};

export default rootReducer;
