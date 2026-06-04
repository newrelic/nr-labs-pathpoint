import { StatusIcon } from '@newrelic/nr-labs-components';

import {
  ALERT_STATUSES,
  WORKLOAD,
  WORKLOAD_STATUS_VALUE_CODES,
} from '../constants';

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

const knownWorkloadStatusValues = Object.values(WORKLOAD_STATUS_VALUE_CODES);

export const workloadStatus = ({
  statusValueCode = WORKLOAD_STATUS_VALUE_CODES.UNKNOWN,
}) => {
  switch (statusValueCode) {
    case WORKLOAD_STATUS_VALUE_CODES.OPERATIONAL: {
      return SUCCESS;
    }
    case WORKLOAD_STATUS_VALUE_CODES.DEGRADED: {
      return WARNING;
    }
    case WORKLOAD_STATUS_VALUE_CODES.DISRUPTED: {
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
  if (!events?.length) return WORKLOAD_STATUS_VALUE_CODES.UNKNOWN;

  let worstInWindow = null;
  let lastKnownCode = null;
  let lastKnownTimestamp = -Infinity;

  for (const { statusValueCode, timestamp } of events) {
    const code = knownWorkloadStatusValues.includes(statusValueCode)
      ? statusValueCode
      : WORKLOAD_STATUS_VALUE_CODES.UNKNOWN;

    if (timestamp >= start && timestamp <= end) {
      if (worstInWindow === null || code > worstInWindow) {
        worstInWindow = code;
      }
      if (worstInWindow === WORKLOAD_STATUS_VALUE_CODES.DISRUPTED) break;
    } else if (timestamp < start && timestamp > lastKnownTimestamp) {
      lastKnownTimestamp = timestamp;
      lastKnownCode = code;
    }
  }

  if (worstInWindow !== null) return worstInWindow;
  if (lastKnownCode !== null) return lastKnownCode;
  return WORKLOAD_STATUS_VALUE_CODES.UNKNOWN;
};
