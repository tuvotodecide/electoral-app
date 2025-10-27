// Mock para @reduxjs/toolkit que mantiene comportamientos mínimos
const actualToolkit = jest.requireActual('@reduxjs/toolkit');

export const configureStore = jest.fn((config) => {
  const mockStore = {
    getState: jest.fn(() => config?.preloadedState || {}),
    dispatch: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    replaceReducer: jest.fn(),
  };
  return mockStore;
});

export const createSlice = jest.fn((options) => actualToolkit.createSlice(options));
export const createAsyncThunk = jest.fn((...args) => actualToolkit.createAsyncThunk(...args));
export const createReducer = jest.fn((...args) => actualToolkit.createReducer(...args));
export const createAction = jest.fn((...args) => actualToolkit.createAction(...args));

export default {
  ...actualToolkit,
  configureStore,
  createSlice,
  createAsyncThunk,
  createReducer,
  createAction,
};
