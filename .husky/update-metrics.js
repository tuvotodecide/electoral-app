const fs = require('fs');

const metricsPath = process.argv[2];
const elapsedSecs = Number(process.argv[3]);
const exitCode = Number(process.argv[4]);
const lintWarningsRaw = process.argv[5] ?? '';
const totalTestsRaw = process.argv[6] ?? '';
const coverageRowsRaw = process.argv[7] ?? '';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const now = new Date();

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const parseDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const utcStartOfDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const parseCount = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const parseCoverageRows = (rows) => {
  const result = {};

  if (!rows || typeof rows !== 'string') {
    return result;
  }

  for (const line of rows.split('\n')) {
    if (!line) {
      continue;
    }

    const [metric, pctRaw, coveredRaw, totalRaw] = line.split('|');
    if (!metric) {
      continue;
    }

    const pct = Number.parseFloat(String(pctRaw));
    const covered = Number.parseInt(String(coveredRaw), 10);
    const total = Number.parseInt(String(totalRaw), 10);

    result[metric] = {
      percent: Number.isFinite(pct) ? pct : null,
      covered: Number.isFinite(covered) ? covered : null,
      total: Number.isFinite(total) ? total : null,
    };
  }

  return result;
};

let metrics = {};
if (fs.existsSync(metricsPath)) {
  try {
    metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
  } catch (_error) {
    metrics = {};
  }
}

if (!isObject(metrics)) {
  metrics = {};
}

metrics.lastRunningTimeSecs = Number.isFinite(elapsedSecs) && elapsedSecs >= 0 ? elapsedSecs : 0;

const integrations = isObject(metrics.integrations) ? metrics.integrations : {};

let countedFrom = parseDate(integrations.countedFrom);
let countedTo = parseDate(integrations.countedTo);

if (!countedFrom || !countedTo || countedTo <= countedFrom) {
  countedFrom = utcStartOfDay(now);
  countedTo = new Date(countedFrom.getTime() + WEEK_MS);
  integrations.integrationsCount = 0;
}

while (now >= countedTo) {
  countedFrom = new Date(countedFrom.getTime() + WEEK_MS);
  countedTo = new Date(countedTo.getTime() + WEEK_MS);
  integrations.integrationsCount = 0;
}

const parsedCount = Number.parseInt(String(integrations.integrationsCount ?? 0), 10);
integrations.integrationsCount = Number.isFinite(parsedCount) && parsedCount >= 0 ? parsedCount : 0;

if (exitCode === 0) {
  integrations.integrationsCount += 1;
}

integrations.countedFrom = countedFrom.toISOString();
integrations.countedTo = countedTo.toISOString();

metrics.integrations = integrations;

metrics.preCommitSummary = {
  lintWarningCount: parseCount(lintWarningsRaw),
  totalTests: parseCount(totalTestsRaw),
  status: exitCode === 0 ? 'SUCCESS' : 'FAILED',
};

metrics.coverageTable = parseCoverageRows(coverageRowsRaw);

fs.writeFileSync(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`);
