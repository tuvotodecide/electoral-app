import { BACKEND_RESULT } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';


const KEY_CONTEXT = dni =>
  `@selected-election-context:v1:${String(dni || 'unknown')}`;
const KEY_CONTEXT_SCOPED = dni =>
  `@selected-election-context-scoped:v1:${String(dni || 'unknown')}`;

export const MUNICIPAL_EXPECTED_BLOCKS = Object.freeze([
  {blockId: 'ALCALDE', label: 'ALCALDE', order: 1},
  {blockId: 'CONCEJAL', label: 'CONCEJAL', order: 2},
]);
export const DEPARTAMENTAL_EXPECTED_BLOCKS = Object.freeze([
  {blockId: 'GOBERNADOR', label: 'GOBERNADOR', order: 1},
  {
    blockId: 'ASAMBLEISTA_TERRITORIO',
    label: 'ASAMBLEÍSTA POR TERRITORIO',
    order: 2,
  },
]);

export const normalizeElectionTypeParam = value => {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (raw === 'alcalde' || raw === 'municipal' || raw === 'mayor') {
    return 'municipal';
  }
  if (raw === 'gobernador' || raw === 'departamental' || raw === 'governor') {
    return 'departamental';
  }
  if (raw === 'presidential' || raw === 'presidencial') return 'presidential';
  return raw;
};

export const isMunicipalElection = value =>
  normalizeElectionTypeParam(value) === 'municipal';
export const isDepartmentalElection = value =>
  normalizeElectionTypeParam(value) === 'departamental';
export const hasSecondaryBlockElection = value => {
  const normalized = normalizeElectionTypeParam(value);
  return normalized === 'municipal' || normalized === 'departamental';
};

const hasMeaningfulValue = value =>
  value !== undefined && value !== null && String(value).trim() !== '';

const hasNonZeroMeaningfulValue = value => {
  if (!hasMeaningfulValue(value)) return false;
  const normalized = String(value).trim();
  const parsed = Number(normalized);
  if (!Number.isNaN(parsed)) {
    return parsed !== 0;
  }
  return true;
};

export const hasSecondaryVoteData = ({
  partyResults = [],
  voteSummaryResults = [],
  voteSummary = null,
} = {}) => {
  const partyRows = Array.isArray(partyResults) ? partyResults : [];
  const summaryRows = Array.isArray(voteSummaryResults) ? voteSummaryResults : [];
  const summaryObject = voteSummary && typeof voteSummary === 'object' ? voteSummary : null;

  if (partyRows.some(row => hasNonZeroMeaningfulValue(row?.diputado))) {
    return true;
  }

  if (summaryRows.some(row => hasNonZeroMeaningfulValue(row?.value2))) {
    return true;
  }

  if (
    summaryObject &&
    [
      summaryObject?.depValidVotes,
      summaryObject?.depBlankVotes,
      summaryObject?.depNullVotes,
      summaryObject?.depTotalVotes,
      summaryObject?.secondaryValidVotes,
      summaryObject?.secondaryBlankVotes,
      summaryObject?.secondaryNullVotes,
      summaryObject?.secondaryTotalVotes,
    ].some(hasNonZeroMeaningfulValue)
  ) {
    return true;
  }

  return false;
};

export const getContextOfficeLabels = contextOrElectionType => {
  const electionType = normalizeElectionTypeParam(
    contextOrElectionType?.electionType || contextOrElectionType,
  );
  if (isMunicipalElection(electionType)) {
    return {
      primary: 'ALCALDE',
      secondary: 'CONCEJAL',
    };
  }
  if (isDepartmentalElection(electionType)) {
    return {
      primary: 'GOBERNADOR',
      secondary: 'ASAMBLEÍSTA POR TERRITORIO',
    };
  }
  return {
    primary: 'PRESIDENTE/A',
    secondary: 'DIPUTADO/A',
  };
};

export const resolveTerritoryFromLocation = location => {
  const electoralSeat = location?.electoralSeat || {};
  const municipality = electoralSeat?.municipality || location?.municipality || {};
  const province = municipality?.province || {};
  const department = province?.department || location?.department || {};

  return {
    type: municipality?._id || municipality?.id ? 'municipality' : 'unknown',
    departmentId: String(department?._id || department?.id || '').trim() || null,
    departmentName: String(department?.name || '').trim() || null,
    municipalityId:
      String(municipality?._id || municipality?.id || '').trim() || null,
    municipalityName: String(municipality?.name || '').trim() || null,
    locationId: String(location?._id || location?.id || '').trim() || null,
    locationName: String(location?.name || '').trim() || null,
  };
};

const normalizeParty = (party, index) => {
  const partyId = String(
    party?.partyId || party?.id || party?.shortName || party?.fullName || '',
  ).trim();
  return {
    partyId: partyId || `party-${index + 1}`,
    shortName: String(
      party?.shortName || partyId || party?.fullName || `PARTIDO ${index + 1}`,
    ).trim(),
    fullName: String(party?.fullName || partyId || '').trim() || null,
    ballotNumber:
      party?.ballotNumber === null || party?.ballotNumber === undefined
        ? null
        : String(party.ballotNumber),
    color: String(party?.color || '').trim() || null,
    allianceName: String(party?.allianceName || '').trim() || null,
  };
};

const dedupeParties = parties => {
  const seen = new Set();
  return (Array.isArray(parties) ? parties : []).filter(party => {
    const key = String(
      party?.partyId || party?.shortName || party?.fullName || '',
    )
      .trim()
      .toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const buildSelectedElectionContext = ({
  contractId = null,
  electionId = null,
  electionName = null,
  electionType = null,
  territory = {},
  allowedParties = [],
  source = 'backend',
} = {}) => {
  const normalizedType = normalizeElectionTypeParam(electionType);
  const expectedBlocks = isMunicipalElection(normalizedType)
    ? MUNICIPAL_EXPECTED_BLOCKS
    : isDepartmentalElection(normalizedType)
    ? DEPARTAMENTAL_EXPECTED_BLOCKS
    : [];

  return {
    contractId: String(contractId || '').trim() || null,
    electionId: String(electionId || '').trim() || null,
    electionName: String(electionName || '').trim() || null,
    electionType: normalizedType || null,
    territory: {
      type: territory?.type || null,
      departmentId: territory?.departmentId || null,
      departmentName: territory?.departmentName || null,
      municipalityId: territory?.municipalityId || null,
      municipalityName: territory?.municipalityName || null,
      locationId: territory?.locationId || null,
      locationName: territory?.locationName || null,
    },
    expectedBlocks,
    allowedParties: (Array.isArray(allowedParties) ? allowedParties : []).map(
      normalizeParty,
    ),
    cachedAt: Date.now(),
    source,
  };
};

const getContextScopeKey = contextOrScope => {
  const normalizedType = normalizeElectionTypeParam(
    contextOrScope?.electionType || contextOrScope?.type,
  );
  const electionId = String(contextOrScope?.electionId || '').trim();
  if (!electionId) return null;

  if (isMunicipalElection(normalizedType)) {
    const municipalityId = String(
      contextOrScope?.territory?.municipalityId ||
        contextOrScope?.municipalityId ||
        '',
    ).trim();
    return `municipal:${electionId}:municipality:${municipalityId || 'global'}`;
  }

  if (isDepartmentalElection(normalizedType)) {
    const departmentId = String(
      contextOrScope?.territory?.departmentId ||
        contextOrScope?.departmentId ||
        '',
    ).trim();
    return `departamental:${electionId}:department:${departmentId || 'global'}`;
  }

  return `presidential:${electionId}`;
};

const getScopedFallbackKeys = scope => {
  const scopeKey = getContextScopeKey(scope);
  if (!scopeKey) return [];

  const normalizedType = normalizeElectionTypeParam(
    scope?.electionType || scope?.type,
  );
  const electionId = String(scope?.electionId || '').trim();

  if (isMunicipalElection(normalizedType)) {
    return [
      scopeKey,
      `municipal:${electionId}:municipality:global`,
    ];
  }

  if (isDepartmentalElection(normalizedType)) {
    return [
      scopeKey,
      `departamental:${electionId}:department:global`,
    ];
  }

  return [scopeKey];
};

export async function saveSelectedElectionContext(dni, context) {
  try {
    const normalizedContext = buildSelectedElectionContext(context || {});
    const rawLatest = await AsyncStorage.getItem(KEY_CONTEXT(dni));
    const latest = rawLatest ? JSON.parse(rawLatest) : null;
    const shouldPreserveAllowedParties =
      Array.isArray(normalizedContext?.allowedParties) &&
      normalizedContext.allowedParties.length === 0 &&
      Array.isArray(latest?.allowedParties) &&
      latest.allowedParties.length > 0 &&
      String(latest?.electionId || '').trim() ===
        String(normalizedContext?.electionId || '').trim() &&
      normalizeElectionTypeParam(latest?.electionType) ===
        normalizeElectionTypeParam(normalizedContext?.electionType);
    const finalContext = shouldPreserveAllowedParties
      ? buildSelectedElectionContext({
          ...normalizedContext,
          allowedParties: latest.allowedParties,
          source: normalizedContext?.source || latest?.source || 'cache',
        })
      : normalizedContext;
    await AsyncStorage.setItem(
      KEY_CONTEXT(dni),
      JSON.stringify(finalContext),
    );

    const scopeKey = getContextScopeKey(finalContext);
    if (!scopeKey) return;

    const rawScoped = await AsyncStorage.getItem(KEY_CONTEXT_SCOPED(dni));
    const scopedCache = rawScoped ? JSON.parse(rawScoped) : {};
    const scopedExisting = scopedCache[scopeKey];
    const shouldPreserveScopedAllowedParties =
      Array.isArray(finalContext?.allowedParties) &&
      finalContext.allowedParties.length === 0 &&
      Array.isArray(scopedExisting?.allowedParties) &&
      scopedExisting.allowedParties.length > 0 &&
      String(scopedExisting?.electionId || '').trim() ===
        String(finalContext?.electionId || '').trim() &&
      normalizeElectionTypeParam(scopedExisting?.electionType) ===
        normalizeElectionTypeParam(finalContext?.electionType);
    scopedCache[scopeKey] = shouldPreserveScopedAllowedParties
      ? buildSelectedElectionContext({
          ...finalContext,
          allowedParties: scopedExisting.allowedParties,
          source: finalContext?.source || scopedExisting?.source || 'cache',
        })
      : finalContext;
    await AsyncStorage.setItem(
      KEY_CONTEXT_SCOPED(dni),
      JSON.stringify(scopedCache),
    );
  } catch (error) {
    console.error('[ELECTION-CONTEXT] save error', {dni, error});
  }
}

export async function getSelectedElectionContext(dni, scope = null) {
  try {
    if (scope) {
      const rawScoped = await AsyncStorage.getItem(KEY_CONTEXT_SCOPED(dni));
      const scopedCache = rawScoped ? JSON.parse(rawScoped) : {};
      const fallbackKeys = getScopedFallbackKeys(scope);
      for (const key of fallbackKeys) {
        if (scopedCache?.[key]) {
          return scopedCache[key];
        }
      }
    }

    const raw = await AsyncStorage.getItem(KEY_CONTEXT(dni));
    const latest = raw ? JSON.parse(raw) : null;
    if (!scope || !latest) return latest;

    const scopeElectionId = String(scope?.electionId || '').trim();
    const scopeElectionType = normalizeElectionTypeParam(scope?.electionType);
    const latestElectionId = String(latest?.electionId || '').trim();
    const latestElectionType = normalizeElectionTypeParam(latest?.electionType);

    if (
      scopeElectionId &&
      latestElectionId === scopeElectionId &&
      (!scopeElectionType || latestElectionType === scopeElectionType)
    ) {
      return latest;
    }

    return null;
  } catch (error) {
    console.error('[ELECTION-CONTEXT] get error', {dni, error});
    return null;
  }
}

export async function fetchElectionPartiesForTerritory(context = {}) {
  const electionId = String(context?.electionId || '').trim();
  if (!electionId) return [];

  const normalizedType = normalizeElectionTypeParam(context?.electionType);
  const params = {};
  if (
    context?.territory?.departmentId &&
    (isDepartmentalElection(normalizedType) ||
      !context?.territory?.municipalityId)
  ) {
    params.departmentId = context.territory.departmentId;
  }
  if (
    context?.territory?.municipalityId &&
    isMunicipalElection(normalizedType)
  ) {
    params.municipalityId = context.territory.municipalityId;
  }

  const {data} = await axios.get(
    `${BACKEND_RESULT}/political/election-parties/by-territory/${encodeURIComponent(
      electionId,
    )}`,
    {
      timeout: 10000,
      params,
    },
  );

  if (!Array.isArray(data)) {
    throw new Error('INVALID_ELECTION_PARTIES_PAYLOAD');
  }

  const normalized = dedupeParties(data.map(normalizeParty));
  return normalized;
}

export async function enrichSelectedElectionContext(context = {}) {
  if (!hasSecondaryBlockElection(context?.electionType)) {
    return context;
  }

  try {
    const allowedParties = await fetchElectionPartiesForTerritory(context);
    const built = buildSelectedElectionContext({
      ...context,
      allowedParties,
      source: 'backend',
    });

    return built;
  } catch (error) {
    console.warn('[ELECTION-CONTEXT] party fetch failed', error?.message);
    const built = buildSelectedElectionContext({
      ...context,
      allowedParties: context?.allowedParties || [],
      source: context?.source || 'cache',
    });

    return built;
  }
}

export async function enrichMunicipalElectionContext(context = {}) {
  return enrichSelectedElectionContext(context);
}
