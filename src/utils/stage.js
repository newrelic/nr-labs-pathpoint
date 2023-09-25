import { STAGE_SHAPES_CLASSNAME_ARRAY } from '../constants';
import { signalStatus, statusFromStatuses } from './signal';

export const addSignalStatuses = (stages = [], serviceLevelsData = {}) =>
  stages.map(({ name, levels = [] }) => ({
    name,
    levels: levels.map(({ order, steps = [] }) => ({
      order,
      steps: steps.map(({ title, signals = [] }) => ({
        title,
        signals: signals.map(({ type, guid }) => {
          const { name, attainment, target } = serviceLevelsData[guid];
          return {
            type,
            guid,
            name,
            attainment,
            target,
            status: signalStatus({ type, attainment, target }),
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
  const guidsSet = new Set();
  stages.map(({ levels = [] }) =>
    levels.map(({ steps = [] }) =>
      steps.map(({ signals = [] }) =>
        signals.map(({ guid }) => guidsSet.add(guid))
      )
    )
  );
  return [...guidsSet];
};

export const getStageHeaderShape = (stage = {}, border = '') => {
  const classNames = [
    `has-none${border}`,
    `has-source${border}`,
    `has-target${border}`,
    `has-source-has-target${border}`,
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
