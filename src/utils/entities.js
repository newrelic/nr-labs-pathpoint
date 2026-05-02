import { StatusIcon } from '@newrelic/nr-labs-components';

import { ALERT_STATUSES, WORKLOAD } from '../constants';

const {
  STATUSES: { UNKNOWN, CRITICAL, WARNING, SUCCESS },
} = StatusIcon;

const alertSeverities = [
  ALERT_STATUSES.NOT_ALERTING,
  ALERT_STATUSES.WARNING,
  ALERT_STATUSES.CRITICAL,
];

export const entityStatus = ({ alertSeverity } = {}) => {
  switch (alertSeverity) {
    case 'NOT_ALERTING': {
      return SUCCESS;
    }
    case 'WARNING': {
      return WARNING;
    }
    case 'CRITICAL': {
      return CRITICAL;
    }
    default: {
      return UNKNOWN;
    }
  }
};

export const workloadStatus = ({ statusValueCode = -1 }) => {
  switch (statusValueCode) {
    case 0: {
      return SUCCESS;
    }
    case 2: {
      return WARNING;
    }
    case 3: {
      return CRITICAL;
    }
    default: {
      return UNKNOWN;
    }
  }
};

export const isWorkload = ({ domain, type } = {}) =>
  domain === WORKLOAD.DOMAIN && type === WORKLOAD.TYPE;

export const guidsToArray = (guids = {}, maxArrayLen = 10) =>
  Object.keys(guids).reduce((acc, type) => {
    const typeGuids = guids[type];
    if (!typeGuids || !typeGuids.length) return acc;
    return [
      ...acc,
      ...Array.from(
        { length: Math.ceil(typeGuids.length / maxArrayLen) },
        (_, i) => {
          const startIdx = i * maxArrayLen;
          return typeGuids.slice(startIdx, startIdx + maxArrayLen);
        }
      ),
    ];
  }, []);

const statusFromViolations = (violations = []) =>
  alertSeverities[
    violations.reduce((acc, { alertSeverity }) => {
      const statusIndex =
        alertSeverities.findIndex((severity) => severity === alertSeverity) ||
        0;
      return Math.max(acc, statusIndex);
    }, 0)
  ];

export const entitiesDetailsFromQueryResults = (res = {}) =>
  Object.keys(res).reduce((acc, cur) => {
    const signalsArray = res[cur];
    if (!Array.isArray(signalsArray)) return acc;
    signalsArray.forEach(
      (entity) =>
        (acc[entity.guid] = {
          ...entity,
          alertSeverity:
            entity.alertSeverity ||
            statusFromViolations(entity.alertViolations),
        })
    );
    return acc;
  }, {});

export const getWorstWorkloadStatusValue = (events = [], { start, end }) => {
  let worstRank = -99;
  for (const { statusValueCode, timestamp } of events) {
    if (timestamp >= start && timestamp <= end) {
      const rank = [-99, 0, 2, 3].includes(statusValueCode)
        ? statusValueCode
        : -99;
      if (worstRank === -99 || rank > worstRank) {
        worstRank = rank;
      }
      if (worstRank === 3) break;
    }
  }
  return worstRank;
};
