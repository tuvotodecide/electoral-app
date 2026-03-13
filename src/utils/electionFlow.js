export const MISSING_ELECTION_ID_MESSAGE =
  'No se pudo identificar la eleccion de este atestiguamiento. Vuelve al inicio y entra desde la tarjeta correcta.';

export const normalizeElectionId = value => String(value ?? '').trim();

export const resolveElectionIdFromRecord = record =>
  normalizeElectionId(
    record?.electionId ||
      record?.election_id ||
      record?.rawData?.electionId ||
      record?.rawData?.election_id ||
      record?.raw?.electionId ||
      record?.raw?.election_id ||
      '',
  );

export const resolveElectionId = (...candidates) => {
  for (const candidate of candidates) {
    if (!candidate) continue;

    if (typeof candidate === 'object') {
      const nested = resolveElectionIdFromRecord(candidate);
      if (nested) return nested;
      continue;
    }

    const normalized = normalizeElectionId(candidate);
    if (normalized) return normalized;
  }

  return '';
};
