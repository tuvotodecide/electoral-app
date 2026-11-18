import reducer, { setAddresses, clearAddresses } from '../../../../src/redux/slices/addressSlice';

describe('addressSlice', () => {
  const initialState = {
    account: null,
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: undefined })).toEqual(initialState);
  });

  it('should handle setAddresses', () => {
    const payload = {
      account: '0x1234...account',
    };
    const expectedState = {
      account: '0x1234...account',
    };
    expect(reducer(initialState, setAddresses(payload))).toEqual(expectedState);
  });

  it('should handle clearAddresses', () => {
    const currentState = {
      account: '0x1234...account',
    };
    expect(reducer(currentState, clearAddresses())).toEqual(initialState);
  });

  it('should not change state for an unknown action', () => {
    const currentState = {
      account: '0xabcd',
    };
    expect(reducer(currentState, { type: 'unknown/action' })).toEqual(currentState);
  });
});
