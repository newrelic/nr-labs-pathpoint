import { SIGNAL_TYPES, STATUSES } from '../constants';
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

export const signalStatus = (signal) => {
  if (!signal) return STATUSES.UNKNOWN;

  const { type = '' } = signal;

  if (type === SIGNAL_TYPES.SERVICE_LEVEL) {
    const { attainment, target } = signal;
    return serviceLevelStatus({ attainment, target });
  }

  return STATUSES.UNKNOWN;
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
