export const STEP_STATUS_OPTIONS = {
  BEST: 'best',
  WORST: 'worst',
};

export const STEP_STATUS_UNITS = {
  PERCENT: 'percent',
  COUNT: 'count',
};

export const DEFAULT_STEP_CONFIG = {
  status: {
    option: 'worst',
    weight: {
      unit: 'percent',
      value: '',
    },
  },
};
