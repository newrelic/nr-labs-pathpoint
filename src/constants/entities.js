export const WORKLOAD = {
  DOMAIN: 'NR1',
  TYPE: 'WORKLOAD',
};

export const SKIP_ENTITY_TYPES_NRQL =
  "domain NOT IN ('AIOPS', 'PROTO', 'REF', 'VIZ')";

export const WORKLOAD_STATUS_VALUE_CODES = {
  DISRUPTED: 3,
  DEGRADED: 2,
  OPERATIONAL: 0,
  UNKNOWN: -99,
};
