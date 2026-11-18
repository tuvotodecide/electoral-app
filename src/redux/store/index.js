// src/redux/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform,
         FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import rootReducer from '../reducer';  // ahora es combineReducers()

// En un arranque en frío siempre se pide el PIN (Splash -> Connect -> LoginUser),
// así que isAuthenticated no debe sobrevivir a que se cierre la app: si no, el
// handler de notificaciones abre pantallas protegidas antes de pedir el PIN.
// Se aplica al rehidratar para cubrir también el estado ya guardado.
export const resetAuthOnRehydrate = createTransform(
  inboundState => inboundState,
  outboundState => ({ ...outboundState, isAuthenticated: false }),
  { whitelist: ['auth'] },
);

// `wallet` (DID, dirección y la credencial de identidad) no se persiste: está
// cifrado en el vault del SDK y LoginUser lo vuelve a cargar tras el PIN o la
// biometría. Versiones anteriores lo guardaban en AsyncStorage en claro (con la
// clave privada): se descarta al rehidratar y la siguiente escritura lo borra.
export const dropPersistedWallet = async state => {
  if (!state || !('wallet' in state)) {
    return state;
  }
  const { wallet: _wallet, ...rest } = state;
  return rest;
};

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'],      // persiste sólo esas slices
  transforms: [resetAuthOnRehydrate],
  migrate: dropPersistedWallet,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      // ignora las acciones de redux-persist
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }),
});

export const persistor = persistStore(store);
export default store;
