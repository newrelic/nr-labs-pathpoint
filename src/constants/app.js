export const COMPONENTS = {
  FLOW: 'flow',
  STAGE: 'stage',
  LEVEL: 'level',
  STEP: 'step',
  SIGNAL: 'signal',
};

export const REFRESH_INTERVALS = [
  { value: 60000, label: '1 minute' },
  { value: 300000, label: '5 minutes' },
  { value: 600000, label: '10 minutes' },
  { value: 900000, label: '15 minutes' },
  { value: 1800000, label: '30 minutes' },
];

export const MAX_ENTITIES_IN_STEP = 25;

export const MAX_PARAMS_IN_QUERY = 25;

export const MAX_ENTITIES_IN_FLOW = 200;
