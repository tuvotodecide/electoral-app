import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {BACKEND_RESULT} from '@env';

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

export const hasSecondaryVoteData = ({
  partyResults = [],
  voteSummaryResults = [],
  voteSummary = null,
} = {}) => {
  const partyRows = Array.isArray(partyResults) ? partyResults : [];
  const summaryRows = Array.isArray(voteSummaryResults) ? voteSummaryResults : [];
  const summaryObject = voteSummary && typeof voteSummary === 'object' ? voteSummary : null;

  if (partyRows.some(row => hasMeaningfulValue(row?.diputado))) {
    return true;
  }

  if (summaryRows.some(row => hasMeaningfulValue(row?.value2))) {
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
    ].some(hasMeaningfulValue)
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
    await AsyncStorage.setItem(
      KEY_CONTEXT(dni),
      JSON.stringify(normalizedContext),
    );

    const scopeKey = getContextScopeKey(normalizedContext);
    if (!scopeKey) return;

    const rawScoped = await AsyncStorage.getItem(KEY_CONTEXT_SCOPED(dni));
    const scopedCache = rawScoped ? JSON.parse(rawScoped) : {};
    scopedCache[scopeKey] = normalizedContext;
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

  const normalized = (Array.isArray(data) ? data : []).map(normalizeParty);


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
