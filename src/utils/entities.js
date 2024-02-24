import { StatusIcon } from '@newrelic/nr-labs-components';

const {
  STATUSES: { UNKNOWN, CRITICAL, WARNING, SUCCESS },
} = StatusIcon;

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

export const entitiesDetailsFromQueryResults = (res = {}) =>
  Object.keys(res).reduce((acc, cur) => {
    const signalsArray = res[cur];
    if (!Array.isArray(signalsArray)) return acc;
    signalsArray.forEach(
      ({ guid, name }) => (acc[guid] = { name, stepRefs: [] })
    );
    return acc;
  }, {});

export const updateSignalsWithStepsRefs = (stages = [], entitiesDetails) => {
  stages.forEach((stage) =>
    stage.levels.forEach((level) =>
      level.steps.forEach((step) =>
        step.signals.forEach((signal) => {
          if (entitiesDetails[signal.guid] && step.id)
            entitiesDetails[signal.guid].stepRefs.push(step.id);
        })
      )
    )
  );
  return entitiesDetails;
};
