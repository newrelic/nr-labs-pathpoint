import {
  MAX_ENTITIES_IN_STEP,
  SIGNAL_TYPES,
  STAGE_SHAPES_CLASSNAME_ARRAY,
  UI_CONTENT,
} from '../constants';
import { uuid } from './crypto';
import {
  signalStatus,
  statusFromStatuses,
  calculateStepStatus,
} from './signal';

export const sanitizeStages = (stages = [], shouldExcludeSignals) =>
  stages.map(({ levels = [], name = 'New Stage', related = {} }) => ({
    id: uuid(),
    name,
    related,
    levels: levels.map(({ steps = [] }) => ({
      id: uuid(),
      steps: steps.map(({ signals = [], title }) => ({
        id: uuid(),
        title,
        signals: shouldExcludeSignals
          ? []
          : signals.map(({ guid, name: signalName, type }) => ({
              type,
              guid,
              name: signalName,
            })),
      })),
    })),
  }));

const addGuidToObjectTree = (obj, stageId, levelId, stepId, guid) => ({
  ...obj,
  [stageId]: {
    ...obj[stageId],
    [levelId]: {
      ...obj[stageId]?.[levelId],
      [stepId]: {
        ...obj[stageId]?.[levelId]?.[stepId],
        [guid]: null,
      },
    },
  },
});

const incrementCountForStep = (obj, stageId, levelId, stepId) => ({
  ...obj,
  [stageId]: {
    ...obj[stageId],
    [levelId]: {
      ...obj[stageId]?.[levelId],
      [stepId]: (obj[stageId]?.[levelId]?.[stepId] || 0) + 1,
    },
  },
});

export const addSignalStatuses = (stages = [], statuses = {}) => {
  let signalsWithNoStatus = {};
  let signalsWithNoAccess = {};
  let entitiesInStepCount = {};
  const noAccessGuids =
    Object.keys(statuses[SIGNAL_TYPES.NO_ACCESS] || {}) || [];
  const signalsWithStatuses = stages.map(({ levels = [], ...stage }) => ({
    ...stage,
    levels: levels.map(({ steps = [], ...level }) => ({
      ...level,
      steps: steps.map(({ signals = [], ...step }) => ({
        ...step,
        signals: signals.reduce(
          (signalsAcc, { guid, name, type, included }) => {
            const isEntity = type === SIGNAL_TYPES.ENTITY;
            if (isEntity)
              entitiesInStepCount = incrementCountForStep(
                entitiesInStepCount,
                stage.id,
                level.id,
                step.id
              );
            const entity = statuses[type]?.[guid] || {};
            if (noAccessGuids.includes(guid)) {
              signalsWithNoAccess = addGuidToObjectTree(
                signalsWithNoAccess,
                stage.id,
                level.id,
                step.id,
                guid
              );
              return signalsAcc;
            }
            if (isEntity) {
              if (!entity || !Object.keys(entity).length) {
                signalsWithNoStatus = addGuidToObjectTree(
                  signalsWithNoStatus,
                  stage.id,
                  level.id,
                  step.id,
                  guid
                );
                return signalsAcc;
              }
              if (
                entitiesInStepCount[stage.id][level.id][step.id] >
                MAX_ENTITIES_IN_STEP
              ) {
                return signalsAcc;
              }
            }
            const status = signalStatus({ type }, entity);
            return [
              ...signalsAcc,
              {
                type,
                guid,
                name: name || entity.name || UI_CONTENT.SIGNAL.DEFAULT_NAME,
                status,
                included,
              },
            ];
          },
          []
        ),
      })),
    })),
  }));
  return {
    entitiesInStepCount,
    signalsWithNoAccess,
    signalsWithNoStatus,
    signalsWithStatuses,
  };
};

export const annotateStageWithStatuses = (stage = {}) => {
  const { levels, levelStatuses } = (stage.levels || []).reduce(
    ({ levels, levelStatuses }, level = {}) => {
      const { steps, stepStatuses } = (level.steps || []).reduce(
        ({ steps, stepStatuses }, step = {}) => {
          const status = calculateStepStatus(step);
          return {
            steps: [...steps, { ...step, status }],
            stepStatuses: step.excluded
              ? stepStatuses
              : [...stepStatuses, { status }],
          };
        },
        { steps: [], stepStatuses: [] }
      );
      const allStepsExcluded = level.steps.every((step) => step.excluded);
      const status = allStepsExcluded
        ? 'success'
        : statusFromStatuses(stepStatuses);
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

export const stagesSignalGuidsSetsByType = (stages = [], accounts = []) => {
  const guids = Object.values(SIGNAL_TYPES).reduce(
    (acc, type) => ({ ...acc, [type]: new Set() }),
    {}
  );
  stages.forEach(({ levels = [] }) =>
    levels.forEach(({ steps = [] }) =>
      steps.forEach(({ signals = [] }) =>
        signals.forEach(({ guid, type }) => {
          const [acctId] = atob(guid)?.split('|') || [];
          if (!acctId || !accounts.length) return;
          if (accounts.some(({ id }) => id === Number(acctId))) {
            if (type in guids) guids[type].add(guid);
          } else {
            guids[SIGNAL_TYPES.NO_ACCESS].add(guid);
          }
        })
      )
    )
  );
  return Object.keys(guids).reduce(
    (acc, type) =>
      guids[type] instanceof Set ? { ...acc, [type]: guids[type] } : acc,
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
