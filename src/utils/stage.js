import { SIGNAL_TYPES, STAGE_SHAPES_CLASSNAME_ARRAY } from '../constants';
import { signalStatus, statusFromStatuses } from './signal';

export const addSignalStatuses = (stages = [], statuses = {}) =>
  stages.map(({ levels = [], ...stage }) => ({
    ...stage,
    levels: levels.map(({ steps = [], ...level }) => ({
      ...level,
      steps: steps.map(({ signals = [], ...step }) => ({
        ...step,
        signals: signals.map(({ guid, type }) => {
          const { name = '', ...entity } = (statuses[type] || {})[guid] || {};
          const status = signalStatus({ type }, entity);
          return {
            type,
            guid,
            name,
            status,
          };
        }),
      })),
    })),
  }));

export const annotateStageWithStatuses = (stage = {}) => {
  const { levels, levelStatuses } = (stage.levels || []).reduce(
    ({ levels, levelStatuses }, level = {}) => {
      const { steps, stepStatuses } = (level.steps || []).reduce(
        ({ steps, stepStatuses }, step = {}) => {
          const status = statusFromStatuses(
            (step.signals || []).map(({ status }) => ({ status }))
          );
          return {
            steps: [...steps, { ...step, status }],
            stepStatuses: [...stepStatuses, { status }],
          };
        },
        { steps: [], stepStatuses: [] }
      );
      const status = statusFromStatuses(stepStatuses);
      return {
        levels: [...levels, { ...level, steps, status }],
        levelStatuses: [...levelStatuses, { status }],
      };
    },
    { levels: [], levelStatuses: [] }
  );
  const status = statusFromStatuses(levelStatuses);
  return { ...stage, levels, status };
};

export const uniqueSignalGuidsInStages = (stages = []) => {
  const guids = Object.values(SIGNAL_TYPES).reduce(
    (acc, type) => ({ ...acc, [type]: new Set() }),
    {}
  );
  stages.map(({ levels = [] }) =>
    levels.map(({ steps = [] }) =>
      steps.map(({ signals = [] }) =>
        signals.forEach(({ guid, type }) =>
          type in guids ? guids[type].add(guid) : null
        )
      )
    )
  );
  return Object.keys(guids).reduce(
    (acc, type) =>
      guids[type] instanceof Set ? { ...acc, [type]: [...guids[type]] } : acc,
    {}
  );
};

export const getStageHeaderShape = (stage = {}) => {
  const classNames = [
    'has-none',
    'has-source',
    'has-target',
    'has-source has-target',
  ];
  return classNames[
    ((stage.related || {}).source || 0) +
      ((stage.related || {}).target || 0) * 2
  ];
};

export const stageShapeIndexFromData = ({ target, source } = {}) => {
  if (target && source) return 2;
  if (target) return 1;
  if (source) return 3;
  return 0;
};

export const stageShapeDataFromIndex = (index) => {
  const target = index === 1 || index === 2;
  const source = index > 1;
  return { target, source };
};

export const stageHeaderShapeClassName = (related = {}) =>
  STAGE_SHAPES_CLASSNAME_ARRAY[stageShapeIndexFromData(related)];
