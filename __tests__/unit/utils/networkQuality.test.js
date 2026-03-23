import {
  isStateEffectivelyOnline,
  isEffectivelyOnline,
  NET_POLICIES,
} from '../../../src/utils/networkQuality';

describe('networkQuality', () => {
  it('retorna false si no hay conexiÃ³n', () => {
    expect(isStateEffectivelyOnline({isConnected: false})).toBe(false);
  });

  it('retorna true en wifi con buena seÃ±al', () => {
    const state = {
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {strength: 80},
    };
    expect(isStateEffectivelyOnline(state, NET_POLICIES.balanced)).toBe(true);
  });

  it('retorna false en celular con generaciÃ³n baja', () => {
    const state = {
      isConnected: true,
      isInternetReachable: true,
      type: 'cellular',
      details: {cellularGeneration: '2g'},
    };
    expect(isStateEffectivelyOnline(state, {minCellGen: '4g'})).toBe(false);
  });

  it('isEffectivelyOnline usa NetInfo.fetch', async () => {
    const NetInfo = {
      fetch: jest.fn(() =>
        Promise.resolve({isConnected: true, isInternetReachable: true}),
      ),
    };
    const ok = await isEffectivelyOnline(NetInfo, NET_POLICIES.tolerant);
    expect(ok).toBe(true);
    expect(NetInfo.fetch).toHaveBeenCalled();
  });
});
