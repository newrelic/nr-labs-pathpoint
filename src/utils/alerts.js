import { StatusIcon } from '@newrelic/nr-labs-components';

import { latestStatusForAlertConditions, queriesGQL } from '../queries';
import { ALERT_STATUSES, MAX_PARAMS_IN_QUERY } from '../constants';

const {
  STATUSES: { UNKNOWN, CRITICAL, WARNING, SUCCESS },
} = StatusIcon;

export const alertStatus = ({ enabled, inferredPriority } = {}) => {
  if (!enabled) return UNKNOWN;
  switch (inferredPriority) {
    case ALERT_STATUSES.NOT_ALERTING: {
      return SUCCESS;
    }
    case ALERT_STATUSES.WARNING: {
      return WARNING;
    }
    case ALERT_STATUSES.HIGH: {
      return WARNING;
    }
    case ALERT_STATUSES.CRITICAL: {
      return CRITICAL;
    }
    default: {
      return SUCCESS;
    }
  }
};

export const batchAlertConditionsByAccount = (acc, cur) => {
  const [acctId, , , condId] = atob(cur)?.split('|') || [];
  if (!acctId || !condId) return acc;

  const accountBatches = acc.filter((a) => a.acctId === acctId);
  if (!accountBatches.length) {
    acc.push({
      acctId,
      condIds: [condId],
    });
  } else {
    const lastAcctBatch = accountBatches[accountBatches.length - 1];
    if (lastAcctBatch.condIds.length < 25) {
      lastAcctBatch.condIds.push(condId);
    } else {
      acc.push({
        acctId,
        condIds: [condId],
      });
    }
  }
  return acc;
};

const arrayToBlocks = (array = [], blockSize = MAX_PARAMS_IN_QUERY) => {
  const ret = [];
  for (let i = 0; i < array.length; i += blockSize) {
    ret.push(array.slice(i, i + blockSize));
  }
  return ret;
};

export const batchedIncidentIdsFromIssuesQuery = (issuesBlocks) => {
  const uniqueIncidentIds = issuesBlocks?.reduce(
    (acc, { value: { acctId, issues = [] } = {} }) => {
      if (!(acctId in acc)) acc[acctId] = new Set();
      issues.forEach(({ incidentIds = [] }) =>
        incidentIds.forEach((ii) => acc[acctId].add(ii))
      );
      return acc;
    },
    {}
  );

  return Object.keys(uniqueIncidentIds).reduce(
    (acc, acctId) => [
      ...acc,
      ...arrayToBlocks([...uniqueIncidentIds[acctId]]).map((incidentIds) => ({
        acctId,
        incidentIds,
      })),
    ],
    []
  );
};

const calculatePriority = (
  { priority: incidentPriority, closedAt } = {},
  prevPriority = ALERT_STATUSES.NOT_ALERTING
) => {
  if (!incidentPriority) return prevPriority;
  const priority = closedAt ? ALERT_STATUSES.NOT_ALERTING : incidentPriority;
  if (
    priority === ALERT_STATUSES.CRITICAL ||
    prevPriority === ALERT_STATUSES.CRITICAL
  )
    return ALERT_STATUSES.CRITICAL;
  if (
    priority === ALERT_STATUSES.HIGH ||
    priority === ALERT_STATUSES.WARNING ||
    prevPriority === ALERT_STATUSES.HIGH ||
    prevPriority === ALERT_STATUSES.WARNING
  )
    return ALERT_STATUSES.WARNING;
  return ALERT_STATUSES.NOT_ALERTING;
};

export const incidentsFromIncidentsBlocks = (
  acc,
  { value: { acctId, incidents = [] } = {} }
) => {
  if (!(acctId in acc)) acc[acctId] = {};
  incidents.forEach((incident) => {
    const condId = incident.conditionFamilyId;
    if (!condId) return;
    acc[acctId][condId] = {
      inferredPriority: calculatePriority(
        incident,
        acc[acctId][condId]?.inferredPriority
      ),
      incidents: acc[acctId][condId]?.incidents
        ? [...acc[acctId][condId].incidents, incident]
        : [incident],
    };
  });
  return acc;
};

export const alertsStatusesObjFromData = (data = {}, { start, end }) =>
  Object.keys(data).reduce((acc, key) => {
    const { incidents: incids = [], ...alertData } = data[key] || {};
    const incidents = incids.filter(
      ({ closedAt, createdAt }) =>
        (!closedAt || start < closedAt) && createdAt < end
    );
    const inferredPriority = (incidents || []).reduce(
      (p, { priority, closedAt }) =>
        calculatePriority(
          { priority, closedAt: closedAt > end ? null : closedAt },
          p
        ),
      ALERT_STATUSES.NOT_ALERTING
    );
    return {
      ...acc,
      [key]: {
        ...alertData,
        incidents,
        inferredPriority,
      },
    };
  }, {});

export const alertConditionsStatusGQL = (alerts = {}) => {
  const queries = Object.keys(alerts).map((acctId) => ({
    accounts: acctId,
    alias: `q${acctId}`,
    query: latestStatusForAlertConditions(Object.keys(alerts[acctId])),
  }));

  return queries.length ? queriesGQL(queries) : null;
};

export const alertsStatusFromQueryResults = (alerts = {}, queryResult = {}) => {
  const statuses = Object.keys(alerts).reduce((acc, acctId) => {
    const { [`q${acctId}`]: { results: acctIncidents = [] } = {} } =
      queryResult;
    acctIncidents.forEach((incident) => {
      const condition = acc[alerts[acctId][incident.conditionId]];
      if (
        !condition ||
        (condition.priority !== CRITICAL &&
          condition.priority !== incident.priority)
      ) {
        return (acc[alerts[acctId][incident.conditionId]] = incident);
      }
    });
    return acc;
  }, {});

  return statuses;
};

export const alertStatusesObject = (conditionsLookup, incidentsLookup) =>
  Object.keys(conditionsLookup).reduce(
    (accts, acctId) => ({
      ...accts,
      ...Object.keys(conditionsLookup[acctId]).reduce(
        (conds, condId) => ({
          ...conds,
          [conditionsLookup[acctId][condId].entityGuid]: {
            ...conditionsLookup[acctId][condId],
            ...incidentsLookup?.[acctId]?.[condId],
          },
        }),
        accts
      ),
    }),
    {}
  );
