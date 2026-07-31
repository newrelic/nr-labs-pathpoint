import { NerdGraphMutation } from 'nr1';

import {
  SIGNAL_TYPES,
  STEP_STATUS_OPTIONS,
  STEP_STATUS_UNITS,
} from '../constants';
import { CREATE_PATHPOINT_MUTATION } from '../queries/export';

const DEFAULT_REFRESH_INTERVAL = 'FIVE_MINUTES';

const REFRESH_INTERVAL_ENUM = {
  60: 'ONE_MINUTE',
  300: 'FIVE_MINUTES',
  600: 'TEN_MINUTES',
  900: 'FIFTEEN_MINUTES',
  1800: 'THIRTY_MINUTES',
  // current version stores refreshInterval in ms (see REFRESH_INTERVALS in constants/app.js)
  60000: 'ONE_MINUTE',
  300000: 'FIVE_MINUTES',
  600000: 'TEN_MINUTES',
  900000: 'FIFTEEN_MINUTES',
  1800000: 'THIRTY_MINUTES',
};

const REFRESH_INTERVAL_ENUM_VALUES = new Set(
  Object.values(REFRESH_INTERVAL_ENUM)
);

const toRefreshIntervalEnum = (value) => {
  if (typeof value === 'string' && REFRESH_INTERVAL_ENUM_VALUES.has(value))
    return value;
  const n = Number(value);
  if (!isNaN(n) && n > 0)
    return REFRESH_INTERVAL_ENUM[n] ?? DEFAULT_REFRESH_INTERVAL;
  return DEFAULT_REFRESH_INTERVAL;
};

const AGGREGATION_MAP = {
  count: 'COUNT',
  average: 'AVERAGE',
  avg: 'AVERAGE',
  sum: 'SUM',
  max: 'MAX',
  min: 'MIN',
  uniquecount: 'UNIQUE_COUNT',
  latest: 'LATEST',
};

const parseNrqlToQuery = (nrql = '') => {
  const fromMatch = nrql.match(/\bFROM\s+(\w+)/i);
  const from = fromMatch?.[1] ?? 'Transaction';

  const whereMatch = nrql.match(
    /\bWHERE\s+(.*?)(?:\bSINCE\b|\bUNTIL\b|\bLIMIT\b|\bFACET\b|\bTIMESERIES\b|$)/i
  );
  const where = whereMatch?.[1]?.trim() || undefined;

  const selectMatch = nrql.match(/\bSELECT\s+(\w+)\s*\(\s*([^)]*)\s*\)/i);
  if (!selectMatch) {
    return {
      select: { aggregationType: 'COUNT' },
      from,
      ...(where && { where }),
    };
  }

  const funcName = selectMatch[1].toLowerCase();
  const attr = selectMatch[2].trim();
  const aggregationType = AGGREGATION_MAP[funcName] ?? 'COUNT';
  const select = { aggregationType };
  if (attr && attr !== '*') select.attribute = attr;

  return { select, from, ...(where && { where }) };
};

const transformKpi = (kpi = {}) => {
  // already in new PathPoint format
  if (kpi.query?.select?.aggregationType) {
    return {
      name: kpi.name ?? 'KPI',
      category: kpi.category ?? '',
      accountId: Number(kpi.accountId ?? kpi.accountIds?.[0] ?? 0),
      description: kpi.description ?? '',
      query: kpi.query,
    };
  }
  // this app's format: { nrqlQuery, accountIds[], name, ... } (see sanitizeKpis)
  return {
    name: kpi.name ?? 'KPI',
    category: kpi.category ?? '',
    accountId: Number(kpi.accountId ?? kpi.accountIds?.[0] ?? 0),
    description: kpi.description ?? '',
    query: parseNrqlToQuery(kpi.nrqlQuery ?? ''),
  };
};

const transformSignal = (s = {}) => ({
  guid: s.guid,
  name: s.name ?? s.title ?? '',
  type: (s.type ?? 'ENTITY').toUpperCase(),
  // this app uses `included` (opt-in); new format uses `isExcluded` (opt-out)
  isExcluded:
    s.isExcluded !== undefined
      ? Boolean(s.isExcluded)
      : s.included !== undefined
      ? !s.included
      : false,
});

const STEP_HEALTH_ROLLUP_MAP = {
  [STEP_STATUS_OPTIONS.BEST]: 'BEST_STATUS_WINS',
  [STEP_STATUS_OPTIONS.WORST]: 'WORST_STATUS_WINS',
};

// schema.graphqls: enum ThresholdType { FIXED, PERCENTAGE } - no COUNT variant,
// so a count-based threshold has no exact equivalent; FIXED is the closest fit.
const THRESHOLD_TYPE_MAP = {
  [STEP_STATUS_UNITS.PERCENT]: 'PERCENTAGE',
  [STEP_STATUS_UNITS.COUNT]: 'FIXED',
};

const toStepConfig = (step = {}) => {
  // new format: config already has the right shape
  if (step.config?.healthRollup) return step.config;

  // this app's format: config.status.option / config.status.weight
  const option = step.config?.status?.option;
  const weight = step.config?.status?.weight;
  if (!option && !weight) return undefined;

  const config = {};
  if (option) config.healthRollup = STEP_HEALTH_ROLLUP_MAP[option];
  if (weight?.unit)
    config.thresholdType = THRESHOLD_TYPE_MAP[weight.unit] ?? 'FIXED';
  const parsed =
    weight?.value !== undefined && weight.value !== ''
      ? parseInt(weight.value, 10)
      : NaN;
  if (!isNaN(parsed)) config.thresholdValue = parsed;

  return Object.keys(config).length > 0 ? config : undefined;
};

const transformEntitySearchQuery = (step = {}) => {
  // this app only ever allows one query per step
  const [query] = step.queries ?? [];
  if (!query) return undefined;

  // SignalQueryInput has no `type` - it's implicitly an entity search filter,
  // so an `alert`-type query has no equivalent here.
  // TODO: confirm with the new-version team whether alert-type step queries
  // are supported at all - signals were reportedly dropped for alert type too.
  if (query.type !== SIGNAL_TYPES.ENTITY) return undefined;

  return {
    query: query.query,
    isExcluded:
      query.isExcluded !== undefined
        ? Boolean(query.isExcluded)
        : query.included !== undefined
        ? !query.included
        : false,
  };
};

const transformStep = (step = {}) => {
  const config = toStepConfig(step);
  const entitySearchQuery = transformEntitySearchQuery(step);
  return {
    name: step.name ?? step.title ?? 'Step',
    isExcluded: step.isExcluded ?? step.excluded ?? false,
    link: step.link ?? null,
    signals: (step.signals ?? []).map(transformSignal),
    ...(config && { config }),
    ...(entitySearchQuery && { entitySearchQuery }),
  };
};

const transformLevel = (level = {}) => ({
  steps: (level.steps ?? []).map(transformStep),
});

const transformStage = (stage = {}) => ({
  name: stage.name ?? 'Stage',
  stageKpis: stage.stageKpis ?? [],
  healthRollup: stage.healthRollup ?? 'AUTOMATIC_ROLL_UP',
  link: stage.link ?? '',
  related: {
    target: stage.related?.target ?? false,
    source: stage.related?.source ?? false,
  },
  levels: (stage.levels ?? []).map(transformLevel),
});

export const transformForExport = (doc = {}) => {
  const data = doc.input ?? doc;
  return {
    name: data.name,
    refreshInterval: toRefreshIntervalEnum(data.refreshInterval),
    kpis: (data.kpis ?? []).map(transformKpi),
    stages: (data.stages ?? []).map(transformStage),
  };
};

export const migrateFlow = async (accountId, input) => {
  try {
    const { data, error } = await NerdGraphMutation.mutate({
      mutation: CREATE_PATHPOINT_MUTATION,
      variables: { input, accountId },
      unsafeExperimentalNamespaces: ['PathPoint'],
    });

    console.log('migrateFlow data', data);
    console.log('migrateFlow error', error);

    if (error) return { success: false, error };

    const created = data?.pathPointCreate;
    if (!created?.guid)
      return { success: false, error: 'pathPointCreate returned no guid' };

    return { success: true, guid: created.guid, name: created.name };
  } catch (error) {
    console.log('migrateFlow error', error);
    return { success: false, error };
  }
};
