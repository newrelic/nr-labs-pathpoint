import { useCallback, useEffect, useRef, useState } from 'react';

import { NerdGraphQuery } from 'nr1';

import useDebugLogger from '../use-debug-logger';
import {
  addSignalStatuses,
  alertsStatusesObjFromData,
  annotateStageWithStatuses,
  batchAlertConditionsByAccount,
  batchedIncidentIdsFromIssuesQuery,
  entitiesDetailsFromQueryResults,
  fifteenMinutesAgo,
  getWorstWorkloadStatusValue,
  guidsToArray,
  incidentsFromIncidentsBlocks,
  isWorkload,
  signalDetailsObject,
  signalStatus,
  statusFromStatuses,
  threeDaysAgo,
  validRefreshInterval,
} from '../../utils';
import {
  conditionsDetailsQuery,
  incidentsSearchQuery,
  issuesForConditionsQuery,
  statusesFromGuidsArray,
  workloadsStatusesQuery,
} from '../../queries';
import {
  ALERT_STATUSES,
  ALERTS_DOMAIN_TYPE_NRQL,
  MAX_ENTITIES_IN_FLOW,
  MAX_ENTITIES_IN_STEP,
  MAX_PARAMS_IN_QUERY,
  SIGNAL_TYPES,
  SKIP_ENTITY_TYPES_NRQL,
  UI_CONTENT,
} from '../../constants';

const EMPTY_DYNAMIC_SIGNALS = {
  [SIGNAL_TYPES.ALERT]: {},
  [SIGNAL_TYPES.ENTITY]: {},
};

const COUNTS_BY_TYPE_DEFAULT = {
  [SIGNAL_TYPES.ALERT]: 0,
  [SIGNAL_TYPES.ENTITY]: 0,
};

const MAX_DYNAMIC_QUERIES_IN_BATCH = 10;

const keyFromTimeWindow = ({ start, end }) =>
  start && end ? `${start}:${end}` : null;

const chunkArray = (array, size) => {
  const chunked = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
};

const generateDynamicQueriesList = (stages) => {
  return stages.reduce((acc, { id: stageId, levels }) => {
    levels?.map(({ id: levelId, steps }) =>
      steps?.map(({ id: stepId, queries }) =>
        queries?.map(({ query, type, ...qry }) => {
          const name = `q${acc.length + 1}`;
          acc.push({ ...qry, name, type, query, stageId, levelId, stepId });
        })
      )
    );
    return acc;
  }, []);
};

const batchFetchDynamicQueries = async (queriesList) => {
  if (!queriesList.length) return { actor: {}, errors: [] };

  const batches = chunkArray(queriesList, MAX_DYNAMIC_QUERIES_IN_BATCH);
  const errors = [];
  const actor = {};

  const responses = await Promise.all(
    batches.map(async (batch) => {
      let batchGraphql = '';
      batch.forEach(({ name, type, query }) => {
        let prefix = '';
        if (type === SIGNAL_TYPES.ENTITY)
          prefix = `${SKIP_ENTITY_TYPES_NRQL} AND `;
        if (type === SIGNAL_TYPES.ALERT)
          prefix = `${ALERTS_DOMAIN_TYPE_NRQL} AND `;

        batchGraphql += `
          ${name}: entitySearch(query: "${prefix}${query}") {
            count
            results { entities { guid name } }
          }`;
      });

      return NerdGraphQuery.query({ query: `{ actor { ${batchGraphql} } }` });
    })
  );

  responses.forEach(({ data, error }) => {
    if (data?.actor) Object.assign(actor, data.actor);
    if (error) errors.push(error.message || error.toString());
  });

  return { actor, errors };
};

const signalsFromDynamicQueries = (actorData, queriesList) => {
  return queriesList.reduce(
    (acc, { included, name, type, stepId, id: queryId }) => {
      const { [name]: { results: { entities = [] } = {} } = {} } = actorData;
      return entities.length
        ? {
            ...acc,
            [type]: {
              ...acc[type],
              [stepId]: entities.map(({ name, guid }) => ({
                guid,
                name,
                type,
                queryId,
                included,
              })),
            },
          }
        : acc;
    },
    EMPTY_DYNAMIC_SIGNALS
  );
};

const skippedSignalsArray = (skippedSignals, stagesArr) => {
  const skippedSignalsArr = [];
  if (!skippedSignals) return skippedSignalsArr;

  Object.entries(skippedSignals).forEach(([stageId, levels]) => {
    const stage = stagesArr.find((s) => s.id === stageId);
    const stageName = stage ? stage.name : stageId;
    Object.entries(levels).forEach(([levelId, steps]) => {
      const levelIdx = stage?.levels
        ? stage.levels.findIndex((l) => l.id === levelId)
        : -1;
      const levelLabel = levelIdx > -1 ? levelIdx + 1 : '-';
      Object.entries(steps).forEach(([stepId, guids]) => {
        const step = stage?.levels?.[levelIdx]?.steps?.find(
          (s) => s.id === stepId
        );
        const stepTitle = step ? step.title : stepId;
        Object.entries(guids).forEach(([guid, details]) => {
          skippedSignalsArr.push({
            stage: stageName,
            level: levelLabel,
            step: stepTitle,
            name: details.name,
            reason: details.reason,
            counter: details.count,
            type: details.type,
            guid: guid,
          });
        });
      });
    });
  });
  return skippedSignalsArr;
};

const useSignalsManager = ({
  stages,
  mode,
  accounts,
  debugMode,
  refreshInterval,
  setIsLoading,
  setStagesData,
  setSignalsDetails,
  setClassifications,
}) => {
  const [guids, setGuids] = useState({});
  const [statuses, setStatuses] = useState({});
  const [currentPlaybackTimeWindow, setCurrentPlaybackTimeWindow] =
    useState(null);
  const [dqLoading, setDqLoading] = useState(false);
  const [dqError, setDqError] = useState(null);

  const { debugLogJson, debugString, debugTable } = useDebugLogger({
    allowDebug: debugMode,
  });

  const guidsRef = useRef(guids);
  const noAccessGuidsSetRef = useRef(new Set());
  const signalsMarkedToSkip = useRef({});
  const dynamicQueries = useRef([]);
  const dynamicSignalsByStep = useRef(EMPTY_DYNAMIC_SIGNALS);
  const isFetchingStatuses = useRef(false);
  const pollingTimeoutId = useRef();
  const shouldPollRef = useRef(true);
  const shouldResumeFetchStatuses = useRef(false);

  const timeBandDataCache = useRef(new Map());
  const timeWindowAlertsCache = useRef(new Map());
  const playbackTimeWindow = useRef(null);
  const prevPreloadArgs = useRef(null);

  useEffect(() => {
    return () => clearTimeout(pollingTimeoutId.current);
  }, []);

  const signalsInStages = useCallback(async (curStages, curAccounts) => {
    const queriesList = generateDynamicQueriesList(curStages);
    dynamicQueries.current = queriesList;

    let dynamicSignals = EMPTY_DYNAMIC_SIGNALS;

    if (queriesList.length > 0) {
      const { actor, errors } = await batchFetchDynamicQueries(queriesList);

      if (errors.length) {
        console.error('Errors fetching dynamic signals:', errors);
        if (Object.keys(actor).length === 0) setDqError(errors[0]);
      }

      dynamicSignals = signalsFromDynamicQueries(actor, queriesList);
    }
    dynamicSignalsByStep.current = dynamicSignals;

    const updateStagesWithDynamic = (stg) => ({
      ...stg,
      levels: stg.levels.map((lvl) => ({
        ...lvl,
        steps: lvl.steps.map((stp) => {
          const signalWithQueryIncluded = (sig) => ({
            ...sig,
            included:
              (stp.queries || []).find(({ id }) => id === sig.queryId)
                ?.included ?? true,
          });
          return {
            ...stp,
            signals: [
              ...stp.signals,
              ...(dynamicSignals?.[SIGNAL_TYPES.ENTITY]?.[stp.id] || []).map(
                signalWithQueryIncluded
              ),
              ...(dynamicSignals?.[SIGNAL_TYPES.ALERT]?.[stp.id] || []).map(
                signalWithQueryIncluded
              ),
            ],
          };
        }),
      })),
    });
    const stagesWithDynamicSignals = curStages.map(updateStagesWithDynamic);

    const {
      guids: gs,
      noAccessGuidsSet,
      markSignalsToSkip,
    } = stagesSignalGuidsSetsByType(stagesWithDynamicSignals, curAccounts);

    noAccessGuidsSetRef.current = noAccessGuidsSet;
    signalsMarkedToSkip.current = markSignalsToSkip;
    guidsRef.current = gs;

    return { guids: gs, stagesWithDynamicSignals };
  }, []);

  useEffect(() => {
    if (!stages?.length || !accounts?.length) return;
    const init = async () => {
      setDqLoading(true);
      try {
        const { guids: gs } = await signalsInStages(stages, accounts);
        setGuids(gs);
      } catch (e) {
        console.error('Error initializing flow:', e);
        setDqError(e);
      } finally {
        setDqLoading(false);
      }
    };

    init();
  }, [stages, accounts, signalsInStages]);

  useEffect(() => {
    setIsLoading(dqLoading);
  }, [dqLoading, setIsLoading]);

  useEffect(() => {
    guidsRef.current = guids;
    if (Object.keys(guids).length) {
      runFetch();
    }
  }, [guids, runFetch]);

  useEffect(() => {
    const stagesWithDynamicSignals = stages.map(updateStagesWithDynamic);
    const {
      signalsWithNoAccess,
      signalsWithNoStatus,
      tooManySignalInStep,
      dynamicQuerySignals,
      signalsWithStatuses,
    } = addSignalStatusesAndClassify(
      stagesWithDynamicSignals,
      statuses,
      noAccessGuidsSetRef.current,
      signalsMarkedToSkip.current
    );

    const skippedSignalsTable = skippedSignalsArray(
      tooManySignalInStep,
      stagesWithDynamicSignals
    );
    if (skippedSignalsTable.length) {
      debugTable(skippedSignalsTable, 'Skipped signals');
    }

    setStagesData(() => ({
      stages: signalsWithStatuses.map(annotateStageWithStatuses),
    }));
    setClassifications((cls = {}) => ({
      ...cls,
      signalsWithNoAccess,
      signalsWithNoStatus,
      tooManySignalInStep,
      dynamicQuerySignals,
    }));
    const sigDetails = signalDetailsObject(statuses);
    if (sigDetails) setSignalsDetails(sigDetails);
  }, [
    stages,
    statuses,
    mode,
    updateStagesWithDynamic,
    setStagesData,
    setClassifications,
    setSignalsDetails,
    debugTable,
  ]);

  useEffect(() => {
    if (!dqError) return;
    console.error('Error fetching dynamic signals', dqError);
  }, [dqError]);

  const updateStagesWithDynamic = useCallback(
    (stg) => ({
      ...stg,
      levels: stg.levels.map((lvl) => ({
        ...lvl,
        steps: lvl.steps.map((stp) => {
          const signalWithQueryIncluded = (sig) => ({
            ...sig,
            included:
              (stp.queries || []).find(({ id }) => id === sig.queryId)
                ?.included ?? true,
          });
          return {
            ...stp,
            signals: [
              ...stp.signals,
              ...(
                dynamicSignalsByStep.current?.[SIGNAL_TYPES.ENTITY]?.[stp.id] ||
                []
              ).map(signalWithQueryIncluded),
              ...(
                dynamicSignalsByStep.current?.[SIGNAL_TYPES.ALERT]?.[stp.id] ||
                []
              ).map(signalWithQueryIncluded),
            ],
          };
        }),
      })),
    }),
    []
  );

  const fetchEntitiesStatus = useCallback(
    async (entitiesGuids, timeWindow, isForCache) => {
      setIsLoading?.(true);
      const entitiesGuidsArray = guidsToArray(
        { entitiesGuids },
        MAX_PARAMS_IN_QUERY
      );
      const query = statusesFromGuidsArray(entitiesGuidsArray, timeWindow);
      debugString(query, 'Entities query');
      const { data: { actor = {} } = {}, error } = await NerdGraphQuery.query({
        query,
      });
      setIsLoading?.(false);
      if (error) {
        console.error('Error fetching entities:', error.message);
        return;
      }
      const entitiesStatusesObj = entitiesDetailsFromQueryResults(actor);

      if (isForCache) return entitiesStatusesObj;
      setStatuses((s) => ({
        ...s,
        [SIGNAL_TYPES.ENTITY]: entitiesStatusesObj,
      }));
    },
    [debugString, setIsLoading]
  );

  const fetchAlertsStatus = useCallback(
    async (alertsGuids, timeWindow, isForCache) => {
      setIsLoading?.(true);

      const batchedConditions = alertsGuids.reduce(
        batchAlertConditionsByAccount,
        []
      );
      debugLogJson(batchedConditions, 'Batched conditions');

      const conditionsResponses = await Promise.allSettled(
        batchedConditions?.map(async ({ acctId, condIds }, bIdx) => {
          debugLogJson(condIds, `Alerts batch ${bIdx + 1}`);
          const query = conditionsDetailsQuery(acctId, condIds);
          const {
            data: { actor: { account: { alerts } = {} } = {} } = {},
            error,
          } = await NerdGraphQuery.query({ query });
          if (error)
            console.error('Error fetching conditions details:', error.message);
          return { acctId, alerts };
        })
      );
      const issuesBlocks = await Promise.allSettled(
        batchedConditions?.map(async ({ acctId, condIds }) => {
          let query = issuesForConditionsQuery(acctId, condIds, timeWindow);
          const {
            data: {
              actor: {
                account: { aiIssues: { issues: { issues } = {} } = {} } = {},
              } = {},
            } = {},
            error,
          } = await NerdGraphQuery.query({ query });
          if (error) console.error('Error fetching issues:', error.message);
          return { acctId, issues };
        })
      );
      const batchedIncidentIds =
        batchedIncidentIdsFromIssuesQuery(issuesBlocks);

      const incidentsBlocks = await Promise.allSettled(
        batchedIncidentIds?.map(async ({ acctId, incidentIds }, iIdx) => {
          debugLogJson(incidentIds, `Incidents ${iIdx + 1}`);
          const query = incidentsSearchQuery(acctId, incidentIds, timeWindow);
          const {
            data: {
              actor: {
                account: {
                  aiIssues: { incidents: { incidents } = {} } = {},
                } = {},
              } = {},
            } = {},
            error,
          } = await NerdGraphQuery.query({ query });
          if (error) console.error('Error fetching incidents:', error.message);
          return { acctId, incidents };
        })
      );
      const acctCondIncidents = incidentsBlocks?.reduce(
        incidentsFromIncidentsBlocks,
        {}
      );

      const alertsStatusesObj = conditionsResponses.reduce(
        (acc, { value: { acctId, alerts = {} } = {} } = {}) => {
          Object.keys(alerts).forEach((key) => {
            const {
              id: conditionId,
              entityGuid,
              enabled,
              name,
            } = alerts[key] || {};
            if (entityGuid) {
              const {
                inferredPriority = ALERT_STATUSES.NOT_ALERTING,
                incidents = [],
              } = acctCondIncidents?.[acctId]?.[conditionId] || {};
              acc = {
                ...acc,
                [entityGuid]: {
                  conditionId,
                  name,
                  entityGuid,
                  enabled,
                  inferredPriority,
                  incidents,
                },
              };
            }
          });
          return acc;
        },
        {}
      );

      setIsLoading?.(false);
      if (isForCache) return alertsStatusesObj;
      setStatuses((s) => ({
        ...s,
        [SIGNAL_TYPES.ALERT]: alertsStatusesObj,
      }));
    },
    [debugLogJson, setIsLoading]
  );

  const fetchStatuses = useCallback(
    async (guidsArr = {}, timeWindow) => {
      const {
        [SIGNAL_TYPES.ENTITY]: entitiesSet = new Set(),
        [SIGNAL_TYPES.ALERT]: alertsSet = new Set(),
      } = guidsArr;
      const entitiesGuids = [...entitiesSet];
      const alertsGuids = [...alertsSet];

      debugString(
        `Starting fetch. Entities: ${entitiesGuids.length}, Alerts: ${alertsGuids.length}`,
        'Fetching statuses'
      );

      const fetchers = [];

      if (entitiesGuids.length) {
        fetchers.push(() => fetchEntitiesStatus(entitiesGuids, timeWindow));
      }

      if (alertsGuids.length) {
        fetchers.push(() => fetchAlertsStatus(alertsGuids, timeWindow));
      }

      if (fetchers.length) {
        await Promise.all(fetchers.map((fetcher) => fetcher()));
      }
    },
    [fetchEntitiesStatus, fetchAlertsStatus, debugString]
  );

  const runFetch = useCallback(async () => {
    if (isFetchingStatuses.current) {
      shouldResumeFetchStatuses.current = true;
      return;
    }

    isFetchingStatuses.current = true;
    clearTimeout(pollingTimeoutId.current);

    try {
      await fetchStatuses(guidsRef.current);
    } finally {
      isFetchingStatuses.current = false;

      if (shouldResumeFetchStatuses.current) {
        shouldResumeFetchStatuses.current = false;
        runFetch();
      } else if (shouldPollRef.current) {
        const timeout = validRefreshInterval(refreshInterval);
        if (timeout) {
          pollingTimeoutId.current = setTimeout(() => {
            runFetch();
          }, timeout);
        }
      }
    }
  }, [fetchStatuses, refreshInterval]);

  const refresh = useCallback(() => {
    runFetch();
  }, [runFetch]);

  const preload = useCallback(
    async (timeBands = [], callback, overwriteCache = false) => {
      shouldPollRef.current = false;
      clearTimeout(pollingTimeoutId.current);

      prevPreloadArgs.current = { timeBands, callback };

      const timeWindow = {
        start: threeDaysAgo(timeBands?.[0]?.start),
        end: timeBands?.[timeBands.length - 1]?.end,
      };

      setIsLoading?.(true);

      let currentGuids = guidsRef.current;
      if (
        dynamicQueries.current.length > 0 ||
        !Object.keys(currentGuids).length
      ) {
        try {
          const result = await signalsInStages(stages, accounts);
          currentGuids = result.guids;
        } catch (err) {
          console.error('Error preloading playback', err);
        }
      }

      const { [SIGNAL_TYPES.ALERT]: alertsGuids = new Set() } =
        guidsRef.current || {};
      const alertsGuidsArray = [...alertsGuids];

      const key = keyFromTimeWindow(timeWindow);
      const timeWindowCachedAlerts = timeWindowAlertsCache.current.get(key);
      let timeBandsDataArray;

      if (overwriteCache || !timeWindowCachedAlerts) {
        const alertsData = alertsGuidsArray.length
          ? await fetchAlertsStatus(alertsGuidsArray, timeWindow, true)
          : {};
        timeBandsDataArray = timeBands.map((tw) => ({
          key: keyFromTimeWindow(tw),
          alertsStatusesObj: alertsStatusesObjFromData(alertsData, tw),
        }));
        timeWindowAlertsCache.current.set(key, timeBandsDataArray);
      } else {
        timeBandsDataArray = timeWindowCachedAlerts;
      }

      const { [SIGNAL_TYPES.ENTITY]: entitiesGuids = new Set() } =
        guidsRef.current || {};
      const entitiesGuidsArray = [...entitiesGuids];

      const workloads = entitiesGuidsArray?.reduce((acc, cur) => {
        const [acctId, domain, type] = atob(cur)?.split('|') || [];
        return acctId && isWorkload({ domain, type })
          ? {
              ...acc,
              [acctId]: [...(acc[acctId] || []), cur],
            }
          : acc;
      }, {});

      let workloadsStatuses = {};
      if (Object.keys(workloads)?.length) {
        const { data: { actor: w = {} } = {}, error } =
          await NerdGraphQuery.query({
            query: workloadsStatusesQuery(workloads, {
              start: fifteenMinutesAgo(timeBands?.[0]?.start),
              end: timeBands?.[timeBands.length - 1]?.end,
            }),
          });
        if (!error && w) {
          workloadsStatuses = Object.keys(w)?.reduce((acc, key) => {
            if (key === '__typename') return acc;
            const r = w[key].results || [];
            return {
              ...acc,
              ...r.reduce(
                (acc2, { statusValueCode, timestamp, workloadGuid }) => ({
                  ...acc2,
                  [workloadGuid]: [
                    ...(acc2[workloadGuid] || []),
                    { statusValueCode, timestamp },
                  ],
                }),
                {}
              ),
            };
          }, {});
        }
      }

      const updatedStages = stages.map(updateStagesWithDynamic);

      timeBands.forEach(async (tw, idx) => {
        const { key: bandKey, alertsStatusesObj } =
          timeBandsDataArray[idx] || {};
        const timeWindowCachedData = timeBandDataCache.current.get(bandKey);

        if (overwriteCache || !timeWindowCachedData) {
          let entitiesStatusesObj = entitiesGuidsArray.length
            ? await fetchEntitiesStatus(entitiesGuidsArray, tw, true)
            : {};

          entitiesStatusesObj = Object.keys(entitiesStatusesObj)?.reduce(
            (acc, cur) => {
              const e = entitiesStatusesObj[cur];
              if (isWorkload(e))
                return {
                  ...acc,
                  [cur]: {
                    ...e,
                    statusValueCode: getWorstWorkloadStatusValue(
                      workloadsStatuses[e.guid],
                      tw
                    ),
                  },
                };
              return { ...acc, [cur]: e };
            },
            {}
          );

          const timeWindowStatuses = {
            [SIGNAL_TYPES.ENTITY]: entitiesStatusesObj,
            [SIGNAL_TYPES.ALERT]: alertsStatusesObj,
          };
          timeBandDataCache.current.set(bandKey, timeWindowStatuses);

          const { signalsWithStatuses } = addSignalStatuses(
            updatedStages,
            timeWindowStatuses
          );
          callback?.(
            idx,
            statusFromStatuses(
              signalsWithStatuses.map(annotateStageWithStatuses)
            )
          );
        } else {
          const { signalsWithStatuses } = addSignalStatuses(
            updatedStages,
            timeWindowCachedData
          );
          callback?.(
            idx,
            statusFromStatuses(
              signalsWithStatuses.map(annotateStageWithStatuses)
            )
          );
        }
      });
      setIsLoading?.(false);
    },
    [
      fetchAlertsStatus,
      fetchEntitiesStatus,
      stages,
      accounts,
      setIsLoading,
      signalsInStages,
    ]
  );

  const seek = useCallback(async (timeWindow) => {
    if (!timeWindow) return;
    playbackTimeWindow.current = timeWindow;
    setCurrentPlaybackTimeWindow?.(timeWindow);
    const key = keyFromTimeWindow(timeWindow);
    const timeWindowCachedData = timeBandDataCache.current.get(key);
    if (timeWindowCachedData) {
      setStatuses((s) => ({
        ...s,
        [SIGNAL_TYPES.ENTITY]: timeWindowCachedData[SIGNAL_TYPES.ENTITY],
        [SIGNAL_TYPES.ALERT]: timeWindowCachedData[SIGNAL_TYPES.ALERT],
      }));
    }
  }, []);

  const clearPlaybackTimeWindow = useCallback(() => {
    playbackTimeWindow.current = null;
    prevPreloadArgs.current = null;
    setCurrentPlaybackTimeWindow?.(null);

    shouldPollRef.current = true;
    runFetch();
  }, [runFetch, setCurrentPlaybackTimeWindow]);

  return {
    statuses,
    refresh,
    preload,
    seek,
    clearPlaybackTimeWindow,
    currentPlaybackTimeWindow,
  };
};

export default useSignalsManager;

const stagesSignalGuidsSetsByType = (stages = [], accounts = []) => {
  const guids = {
    [SIGNAL_TYPES.ENTITY]: new Set(),
    [SIGNAL_TYPES.ALERT]: new Set(),
  };
  const noAccessGuidsSet = new Set();
  let markSignalsToSkip = {};

  const signalsByTypeCount = { ...COUNTS_BY_TYPE_DEFAULT };
  stages.forEach(({ id: stageId, levels = [] }) =>
    levels.forEach(({ id: levelId, steps = [] }) =>
      steps.forEach(({ id: stepId, signals = [] }) => {
        const signalsInStepByTypeCount = { ...COUNTS_BY_TYPE_DEFAULT };
        signals.forEach(({ guid, name, type }) => {
          const [acctId] = atob(guid)?.split('|') || [];
          if (!acctId || !accounts.length) return;

          const hasAccess = accounts.some(({ id }) => id === Number(acctId));
          if (!hasAccess) {
            noAccessGuidsSet.add(guid);
            return;
          }

          const currentFlowCount = (signalsByTypeCount[type] || 0) + 1;
          signalsByTypeCount[type] = currentFlowCount;

          const currentStepCount = (signalsInStepByTypeCount[type] || 0) + 1;
          signalsInStepByTypeCount[type] = currentStepCount;

          if (currentStepCount > MAX_ENTITIES_IN_STEP) {
            const reason = 'step_limit_exceeded';
            markSignalsToSkip = addSignalToTree(
              markSignalsToSkip,
              stageId,
              levelId,
              stepId,
              guid,
              { name, type, reason, count: currentStepCount }
            );
            return;
          }

          if (currentFlowCount > MAX_ENTITIES_IN_FLOW) {
            const reason = 'flow_limit_exceeded';
            markSignalsToSkip = addSignalToTree(
              markSignalsToSkip,
              stageId,
              levelId,
              stepId,
              guid,
              { name, type, reason, count: currentFlowCount }
            );
            return;
          }

          if (type in guids) {
            guids[type].add(guid);
          }
        });
      })
    )
  );

  return {
    guids,
    noAccessGuidsSet,
    markSignalsToSkip,
  };
};

const addSignalToTree = (
  treeObj,
  stageId,
  levelId,
  stepId,
  guid,
  value = null
) => ({
  ...treeObj,
  [stageId]: {
    ...treeObj[stageId],
    [levelId]: {
      ...treeObj[stageId]?.[levelId],
      [stepId]: {
        ...treeObj[stageId]?.[levelId]?.[stepId],
        [guid]: value,
      },
    },
  },
});

const addSignalStatusesAndClassify = (
  stages = [],
  statuses = {},
  noAccessGuidsSet = new Set(),
  markSignalsToSkip = {}
) => {
  let signalsWithNoStatus = {};
  let signalsWithNoAccess = {};
  let tooManySignalInStep = {};
  let dynamicQuerySignals = {};

  const signalsWithStatuses = stages.map(({ levels = [], ...stage }) => ({
    ...stage,
    levels: levels.map(({ steps = [], ...level }) => ({
      ...level,
      steps: steps.map(({ signals = [], ...step }) => ({
        ...step,
        signals: signals.reduce(
          (signalsAcc, { guid, name, type, included, queryId }) => {
            const isEntity = type === SIGNAL_TYPES.ENTITY;
            const entity = statuses[type]?.[guid] || {};

            if (queryId) {
              if (!dynamicQuerySignals[step.id]) {
                dynamicQuerySignals[step.id] = {};
              }
              if (!dynamicQuerySignals[step.id][queryId]) {
                dynamicQuerySignals[step.id][queryId] = [];
              }

              dynamicQuerySignals[step.id][queryId].push({
                guid,
                name,
                type,
                queryId,
                included,
              });
            }

            if (noAccessGuidsSet.has(guid)) {
              signalsWithNoAccess = addSignalToTree(
                signalsWithNoAccess,
                stage.id,
                level.id,
                step.id,
                guid
              );
              return signalsAcc;
            }

            const skippedSignal =
              markSignalsToSkip?.[stage.id]?.[level.id]?.[step.id]?.[guid];
            if (skippedSignal) {
              const { reason, count } = skippedSignal;
              tooManySignalInStep = addSignalToTree(
                tooManySignalInStep,
                stage.id,
                level.id,
                step.id,
                guid,
                { name, type, reason, count }
              );
              return signalsAcc;
            }

            if (isEntity) {
              if (!entity || !Object.keys(entity).length) {
                signalsWithNoStatus = addSignalToTree(
                  signalsWithNoStatus,
                  stage.id,
                  level.id,
                  step.id,
                  guid,
                  { name, type }
                );
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
    signalsWithNoAccess,
    signalsWithNoStatus,
    tooManySignalInStep,
    dynamicQuerySignals,
    signalsWithStatuses,
  };
};
