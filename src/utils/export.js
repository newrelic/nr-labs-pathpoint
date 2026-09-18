import { NerdGraphMutation, NerdGraphQuery } from 'nr1';

import {
  SIGNAL_TYPES,
  STEP_STATUS_OPTIONS,
  STEP_STATUS_UNITS,
} from '../constants';
import { CREATE_PATHPOINT_MUTATION, flowEntityQuery } from '../queries/export';

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

// the new metric-based Pathpoint only supports a single aggregation over one
// event type - `SELECT <agg>(<attr>?) FROM <event> [WHERE ...]`. AGGREGATION_MAP
// keys are exactly the aggregation functions we can represent.
const SUPPORTED_AGGREGATIONS = new Set(Object.keys(AGGREGATION_MAP));

const isKpiSupported = (kpi = {}) => {
  // already in new PathPoint format - transfers as-is
  if (kpi.query?.select?.aggregationType) return true;

  const nrql = (kpi.nrqlQuery ?? '').replace(/\s+/g, ' ').trim();
  if (!nrql) return false;

  // query of a query (subquery) or multiple SELECT clauses
  if (/\bFROM\s*\(/i.test(nrql)) return false;
  if ((nrql.match(/\bSELECT\b/gi) || []).length > 1) return false;

  // FACET has no equivalent in the metric-based query model
  if (/\bFACET\b/i.test(nrql)) return false;

  // isolate the projection between SELECT and FROM
  const projection = nrql.match(/\bSELECT\s+(.+?)\s+\bFROM\b/i)?.[1]?.trim();
  if (!projection) return false;

  // compound / multiple aggregations (e.g. `count(*), average(duration)`)
  if (projection.includes(',')) return false;

  // the single aggregation function must be one we support
  const fn = projection.match(/^(\w+)\s*\(/)?.[1]?.toLowerCase();
  if (!fn || !SUPPORTED_AGGREGATIONS.has(fn)) return false;

  return true;
};

// names of the top-level KPIs that can't be represented in the new
// metric-based Pathpoint and so won't transfer during migration
export const getUnsupportedKpis = (doc = {}) => {
  const data = doc.input ?? doc;
  return (data.kpis ?? [])
    .filter((kpi) => !isKpiSupported(kpi))
    .map((kpi) => kpi.name ?? 'KPI');
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

// GraphQL enum values are unquoted identifiers; the transforms above already
// produce enum fields as SCREAMING_SNAKE_CASE strings, so treat those as enums.
const isEnumLikeString = (str) => /^[A-Z][A-Z0-9_]*$/.test(str);

const toGraphQLLiteral = (value, depth = 0) => {
  const pad = '  '.repeat(depth);
  const childPad = '  '.repeat(depth + 1);

  if (value === null || value === undefined) return 'null';

  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const items = value.map(
      (item) => `${childPad}${toGraphQLLiteral(item, depth + 1)}`
    );
    return `[\n${items.join('\n')}\n${pad}]`;
  }

  if (typeof value === 'string')
    return isEnumLikeString(value) ? value : JSON.stringify(value);

  if (typeof value !== 'object') return JSON.stringify(value);

  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  if (!entries.length) return '{}';
  const fields = entries.map(
    ([key, v]) => `${childPad}${key}: ${toGraphQLLiteral(v, depth + 1)}`
  );
  return `{\n${fields.join('\n')}\n${pad}}`;
};

export const buildMigrationQuery = (input, accountId) => `mutation {
  pathPointCreate(
    pathpoint: ${toGraphQLLiteral(input, 1)}
    scope: { id: ${JSON.stringify(accountId)}, type: ACCOUNT }
  ) {
    name
    guid
    id
  }
}`;

// HCL string literals need their own escaping: backslashes/quotes/newlines
// as usual, plus `${` and `%{`, which HCL treats as template interpolation
// markers even inside an otherwise-plain string.
const tfString = (value) =>
  `"${String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\$\{/g, '$${')
    .replace(/%\{/g, '%%{')}"`;

const tfIdentifier = (value) => {
  const slug = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const withFallback = slug || 'flow';
  // resource labels can't start with a digit
  return /^[0-9]/.test(withFallback) ? `flow_${withFallback}` : withFallback;
};

const indent = (lines, depth = 1) =>
  lines.map((line) => (line ? `${'  '.repeat(depth)}${line}` : ''));

const withBlankLineBefore = (blocks) =>
  blocks.flatMap((block) => ['', ...block]);

const buildSelectBody = (select = {}) => {
  const lines = [`aggregation_type = ${tfString(select.aggregationType)}`];
  if (select.attribute) lines.push(`attribute = ${tfString(select.attribute)}`);
  if (select.alias) lines.push(`alias = ${tfString(select.alias)}`);
  if (select.threshold !== undefined)
    lines.push(`threshold = ${Number(select.threshold)}`);
  return lines;
};

const buildTimeWindowBody = (timeWindow = {}) => {
  if (timeWindow.customRange)
    return [`custom_range = ${tfString(timeWindow.customRange)}`];
  if (!timeWindow.relativeRange) return [];

  const inner = [`since = ${tfString(timeWindow.relativeRange.since)}`];
  if (timeWindow.relativeRange.compareAgainst)
    inner.push(
      `compare_against = ${tfString(timeWindow.relativeRange.compareAgainst)}`
    );
  return ['relative_range {', ...indent(inner), '}'];
};

const buildQueryBody = (query = {}) => {
  const lines = [`from = ${tfString(query.from)}`];
  if (query.where) lines.push(`where = ${tfString(query.where)}`);

  const select = ['select {', ...indent(buildSelectBody(query.select)), '}'];
  const blocks = [select];

  const timeWindowBody = query.timeWindow
    ? buildTimeWindowBody(query.timeWindow)
    : [];
  if (timeWindowBody.length)
    blocks.push(['time_window {', ...indent(timeWindowBody), '}']);

  return [...lines, ...withBlankLineBefore(blocks)];
};

const buildKpiBody = (kpi = {}) => {
  const lines = [`name = ${tfString(kpi.name)}`];
  if (kpi.description) lines.push(`description = ${tfString(kpi.description)}`);
  if (kpi.category) lines.push(`category = ${tfString(kpi.category)}`);
  if (kpi.accountId) lines.push(`account_id = ${Number(kpi.accountId)}`);

  return [...lines, '', 'query {', ...indent(buildQueryBody(kpi.query)), '}'];
};

const buildStepBody = (step = {}) => {
  const lines = [`name = ${tfString(step.name)}`];
  if (step.isExcluded) lines.push(`is_excluded = true`);
  if (step.link) lines.push(`link = ${tfString(step.link)}`);
  if (step.scopedAccounts?.length)
    lines.push(
      `scoped_accounts = [${step.scopedAccounts.map(Number).join(', ')}]`
    );

  const blocks = [];

  if (step.config) {
    const inner = [];
    if (step.config.healthRollup)
      inner.push(`health_rollup = ${tfString(step.config.healthRollup)}`);
    if (step.config.thresholdType)
      inner.push(`threshold_type = ${tfString(step.config.thresholdType)}`);
    if (step.config.thresholdValue !== undefined)
      inner.push(`threshold_value = ${Number(step.config.thresholdValue)}`);
    blocks.push(['config {', ...indent(inner), '}']);
  }

  if (step.entitySearchQuery) {
    const inner = [`query = ${tfString(step.entitySearchQuery.query)}`];
    if (step.entitySearchQuery.isExcluded) inner.push('is_excluded = true');
    blocks.push(['entity_search_query {', ...indent(inner), '}']);
  }

  (step.signals ?? []).forEach((signal) => {
    const inner = [`guid = ${tfString(signal.guid)}`];
    if (signal.name) inner.push(`name = ${tfString(signal.name)}`);
    if (signal.type) inner.push(`type = ${tfString(signal.type)}`);
    if (signal.isExcluded) inner.push('is_excluded = true');
    blocks.push(['signals {', ...indent(inner), '}']);
  });

  return [...lines, ...withBlankLineBefore(blocks)];
};

const buildLevelBody = (level = {}) =>
  withBlankLineBefore(
    (level.steps ?? []).map((step) => [
      'steps {',
      ...indent(buildStepBody(step)),
      '}',
    ])
  ).slice(1); // drop the leading blank line before the first step

const buildStageBody = (stage = {}) => {
  const lines = [`name = ${tfString(stage.name)}`];
  if (stage.healthRollup && stage.healthRollup !== 'AUTOMATIC_ROLL_UP')
    lines.push(`health_rollup = ${tfString(stage.healthRollup)}`);
  if (stage.isExcluded) lines.push(`is_excluded = true`);
  if (stage.link) lines.push(`link = ${tfString(stage.link)}`);

  const blocks = [];

  if (stage.related?.source || stage.related?.target) {
    const inner = [];
    if (stage.related.source) inner.push('source = true');
    if (stage.related.target) inner.push('target = true');
    blocks.push(['related {', ...indent(inner), '}']);
  }

  (stage.stageKpis ?? [])
    .map(transformKpi)
    .forEach((kpi) =>
      blocks.push(['stage_kpis {', ...indent(buildKpiBody(kpi)), '}'])
    );

  (stage.levels ?? []).forEach((level) =>
    blocks.push(['levels {', ...indent(buildLevelBody(level)), '}'])
  );

  return [...lines, ...withBlankLineBefore(blocks)];
};

export const buildTerraformConfig = (input = {}, accountId) => {
  const resourceLabel = tfIdentifier(input.name);

  const lines = [];
  if (accountId) lines.push(`account_id       = ${Number(accountId)}`);
  lines.push(`name             = ${tfString(input.name)}`);
  if (input.refreshInterval)
    lines.push(`refresh_interval = ${tfString(input.refreshInterval)}`);

  const blocks = (input.kpis ?? []).map((kpi) => [
    'kpis {',
    ...indent(buildKpiBody(kpi)),
    '}',
  ]);
  (input.stages ?? []).forEach((stage) =>
    blocks.push(['stages {', ...indent(buildStageBody(stage)), '}'])
  );

  const body = [...lines, ...withBlankLineBefore(blocks)];

  return [
    `resource "newrelic_pathpoint_flow" "${resourceLabel}" {`,
    ...indent(body),
    '}',
  ].join('\n');
};

export const findFlowEntity = async (accountId, guid) => {
  const { data, error } = await NerdGraphQuery.query({
    query: flowEntityQuery(accountId, guid),
  });

  if (error) return null;

  const [entity] = data?.actor?.entitySearch?.results?.entities ?? [];
  return entity ?? null;
};

export const migrateFlow = async (accountId, input) => {
  try {
    const { data, error } = await NerdGraphMutation.mutate({
      mutation: CREATE_PATHPOINT_MUTATION,
      variables: { input, accountId },
      unsafeExperimentalNamespaces: ['PathPoint'],
    });

    if (error) return { success: false, error };

    const created = data?.pathPointCreate;
    if (!created?.guid)
      return { success: false, error: 'pathPointCreate returned no guid' };

    return { success: true, guid: created.guid, name: created.name };
  } catch (error) {
    return { success: false, error };
  }
};
