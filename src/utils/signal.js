import { SIGNAL_TYPES, STATUSES } from '../constants';
import { alertStatus } from './alerts';
import { entityStatus } from './entities';
import { serviceLevelStatus } from './service-levels';

const statusesOrder = [
  STATUSES.UNKNOWN,
  STATUSES.CRITICAL,
  STATUSES.WARNING,
  STATUSES.SUCCESS,
];

const statusesOrderIndexLookup = statusesOrder.reduce(
  (acc, status, index) => ({
    ...acc,
    [status]: index,
  }),
  {}
);

export const signalStatus = (signal, entity) => {
  if (!signal?.type) return STATUSES.UNKNOWN;

  switch (signal.type) {
    case SIGNAL_TYPES.ENTITY: {
      return entityStatus(entity);
    }
    case SIGNAL_TYPES.ALERT: {
      return alertStatus(entity);
    }
    case SIGNAL_TYPES.SERVICE_LEVEL: {
      const { attainment, target } = signal;
      return serviceLevelStatus({ attainment, target });
    }
    default: {
      return STATUSES.UNKNOWN;
    }
  }
};

export const statusFromStatuses = (statusesArray = []) => {
  const valuesArray = statusesArray.reduce(
    (acc, { status } = STATUSES.UNKNOWN) =>
      status !== STATUSES.UNKNOWN
        ? [...acc, statusesOrderIndexLookup[status]]
        : acc,
    []
  );
  const leastStatusValue = valuesArray.length ? Math.min(...valuesArray) : 0;
  return statusesOrder[leastStatusValue];
};

export const capitalize = (word) => {
  if (!word) return '';
  const lower = word.toLowerCase();
  return word.charAt(0).toUpperCase() + lower.slice(1);
};

export const getIncidentDuration = (openTime, durationSeconds = 0) => {
  if (!openTime) return '';
  const incidentDuration = durationSeconds || (Date.now() - openTime) / 1000;
  return incidentDuration < 60
    ? `lestt then 1 m`
    : incidentDuration < 3600
    ? `${Number(incidentDuration / 60).toFixed()} m`
    : incidentDuration < 86400
    ? `${Number(incidentDuration / 3600).toFixed()} h ${Number(
        (incidentDuration % 3600) / 60
      ).toFixed()} m`
    : `${Number(incidentDuration / 86400).toFixed()} d ${Number(
        (incidentDuration % 86400) / 3600
      ).toFixed()} h ${Number((incidentDuration % 3600) / 60).toFixed()} m`;
};

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat('default', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const formatTimestamp = (timestamp) =>
  TIMESTAMP_FORMATTER.format(new Date(timestamp));

export const getGoldenMetricName = (query, pattern) => {
  let re = new RegExp(`${pattern}`, 'i');
  const result = re.exec(query);
  if (result) {
    re = /'/i;
    return query
      .slice(result.index + result[0].length)
      .substring(
        0,
        re.exec(query.slice(result.index + result[0].length)).index
      );
  } else {
    return '';
  }
};
