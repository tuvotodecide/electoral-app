import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearAttestationAvailabilityCache,
  getAttestationAvailabilityCache,
  getEndOfLocalDayTimestamp,
  isAttestationAvailabilityCacheExpired,
  saveAttestationAvailabilityCache,
} from '../../../src/utils/attestationAvailabilityCache';

describe('attestationAvailabilityCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calcula el fin del dia local para la expiracion del cache', () => {
    const ts = new Date(2026, 0, 12, 9, 15, 0, 0).getTime();
    const endOfDay = getEndOfLocalDayTimestamp(ts);
    const expected = new Date(2026, 0, 12, 23, 59, 59, 999).getTime();

    expect(endOfDay).toBe(expected);
  });

  it('mantiene cache vigente dentro del mismo dia local', async () => {
    const savedAt = new Date(2026, 0, 12, 9, 15, 0, 0).getTime();
    jest.spyOn(Date, 'now').mockReturnValue(savedAt + 60 * 60 * 1000);
    AsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        savedAt,
        expiresAt: getEndOfLocalDayTimestamp(savedAt),
        availableElections: [{electionId: 'municipal-1'}],
      }),
    );

    const result = await getAttestationAvailabilityCache('123');

    expect(result).toMatchObject({
      savedAt,
      availableElections: [{electionId: 'municipal-1'}],
    });
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    Date.now.mockRestore();
  });

  it('invalida el cache al dia siguiente aunque siga offline', async () => {
    const savedAt = new Date(2026, 0, 12, 20, 0, 0, 0).getTime();
    const expiredAt = new Date(2026, 0, 12, 23, 59, 59, 999).getTime();

    AsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        savedAt,
        expiresAt: expiredAt,
        availableElections: [{electionId: 'municipal-1'}],
      }),
    );

    jest.spyOn(Date, 'now').mockReturnValueOnce(new Date(2026, 0, 13, 7, 0, 0, 0).getTime());
    const result = await getAttestationAvailabilityCache('123');

    expect(result).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      '@attestation-availability:v1:123',
    );
    Date.now.mockRestore();
  });

  it('guarda metadata minima para reutilizar offline solo hasta fin del dia', async () => {
    const fixedNow = new Date(2026, 0, 12, 10, 30, 0, 0).getTime();
    jest.spyOn(Date, 'now').mockReturnValueOnce(fixedNow);

    await saveAttestationAvailabilityCache('123', {
      nearestLocation: {id: 'loc-1'},
      availableElections: [{electionId: 'municipal-1'}],
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@attestation-availability:v1:123',
      JSON.stringify({
        savedAt: fixedNow,
        expiresAt: getEndOfLocalDayTimestamp(fixedNow),
        nearestLocation: {id: 'loc-1'},
        availableElections: [{electionId: 'municipal-1'}],
      }),
    );
    Date.now.mockRestore();
  });

  it('convive con invalidacion manual por reconexion o limpieza explicita', async () => {
    await clearAttestationAvailabilityCache('123');

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      '@attestation-availability:v1:123',
    );
  });

  it('detecta expiracion usando savedAt antiguo aunque el payload no tenga expiresAt', () => {
    const savedAt = new Date(2026, 0, 12, 8, 0, 0, 0).getTime();
    const nextDay = new Date(2026, 0, 13, 8, 0, 0, 0).getTime();

    expect(
      isAttestationAvailabilityCacheExpired(
        {
          savedAt,
          availableElections: [{electionId: 'municipal-1'}],
        },
        nextDay,
      ),
    ).toBe(true);
  });
});
