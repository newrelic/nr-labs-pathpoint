export const ALERT_STATUSES = {
  NOT_ALERTING: 'NOT_ALERTING',
  WARNING: 'WARNING',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
};

export const CONDITION_DOMAIN_TYPE = {
  domain: 'AIOPS',
  type: 'CONDITION',
};

export const POLICY_DOMAIN_TYPE = {
  entityDomain: 'AIOPS',
  entityType: 'POLICY',
};

export const ALERTS_DOMAIN_TYPE_NRQL = `domain = '${CONDITION_DOMAIN_TYPE.domain}' AND type = '${CONDITION_DOMAIN_TYPE.type}'`;

export const POLICY_ID_TAG = 'policyId';
