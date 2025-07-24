import { StatusIcon } from '@newrelic/nr-labs-components';

export const { STATUSES } = StatusIcon;

export const UNHEALTHY_STATUSES = [
  STATUSES.CRITICAL,
  STATUSES.WARNING,
];

export const OK_STATUSES = [
  STATUSES.SUCCESS,
  STATUSES.UNKNOWN,
];
