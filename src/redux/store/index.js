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

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['wallet','auth'],      // persiste sólo esas slices
  transforms: [resetAuthOnRehydrate],
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
