// Mock para @reduxjs/toolkit
export const configureStore = jest.fn((config) => {
  const mockStore = {
    getState: jest.fn(() => config.preloadedState || {}),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  };
  return mockStore;
});

export const createSlice = jest.fn();
export const createAsyncThunk = jest.fn();
export const createReducer = jest.fn();
export const createAction = jest.fn();

export default {
  configureStore,
  createSlice,
  createAsyncThunk,
  createReducer,
  createAction,
};
