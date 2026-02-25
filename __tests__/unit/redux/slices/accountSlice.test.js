import reducer, { setBalance } from '../../../../src/redux/slices/accountSlice';

describe('accountSlice', () => {
  const initialState = {
    balance: '0',
    tokenBalances: [],
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: undefined })).toEqual(initialState);
  });

  it('should handle setBalance', () => {
    const payload = {
      totalBalance: '1234.56',
      tokenBalances: [{ token: 'ABC', amount: '100' }],
    };
    const expectedState = {
      balance: '1234.56',
      tokenBalances: [{ token: 'ABC', amount: '100' }],
    };
    expect(reducer(initialState, setBalance(payload))).toEqual(expectedState);
  });

  it('should not change state for an unknown action', () => {
    const currentState = {
      balance: '500',
      tokenBalances: [{ token: 'XYZ', amount: '50' }],
    };
    expect(reducer(currentState, { type: 'unknown/action' })).toEqual(currentState);
  });
});
