import { useCallback, useEffect, useRef, useState } from 'react';

import { useNerdGraphQuery, NerdGraphQuery } from 'nr1';

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

const EMPTY_GQL = `{
  actor {
    user {
      id
    }
  }
}`;

const EMPTY_DYNAMIC_SIGNALS = {
  [SIGNAL_TYPES.ALERT]: {},
  [SIGNAL_TYPES.ENTITY]: {},
};

const DYNAMIC_SIGNALS_RESULTS_SKIP_KEYS = ['__typename', 'user'];

const COUNTS_BY_TYPE_DEFAULT = {
  [SIGNAL_TYPES.ALERT]: 0,
  [SIGNAL_TYPES.ENTITY]: 0,
};

const keyFromTimeWindow = ({ start, end }) =>
  start && end ? `${start}:${end}` : null;

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
  const [dynamicQueriesGQL, setDynamicQueriesGQL] = useState(EMPTY_GQL);
  const [statuses, setStatuses] = useState({});
  const [currentPlaybackTimeWindow, setCurrentPlaybackTimeWindow] =
    useState(null);

  const {
    loading: dqLoading,
    error: dqError,
    data: dqData,
  } = useNerdGraphQuery({ query: dynamicQueriesGQL });
  const { debugString } = useDebugLogger({ allowDebug: debugMode });

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

  useEffect(() => {
    if (!stages?.length || !accounts?.length) return;

    let graphql = ``;
    dynamicQueries.current = stages.reduce((acc, { id: stageId, levels }) => {
      levels?.map(({ id: levelId, steps }) =>
        steps?.map(({ id: stepId, queries }) =>
          queries?.map(({ query, type, ...qry }) => {
            let typeSpecificQryPrefix = '';
            const name = `q${acc.length + 1}`;
            if (type === SIGNAL_TYPES.ENTITY) {
              typeSpecificQryPrefix = `${SKIP_ENTITY_TYPES_NRQL} AND `;
            }
            if (type === SIGNAL_TYPES.ALERT) {
              typeSpecificQryPrefix = `${ALERTS_DOMAIN_TYPE_NRQL} AND `;
            }
            graphql = `${graphql}
            ${name}: entitySearch(query: "${typeSpecificQryPrefix}${query}") {
              count
              results { entities { guid name } }
            }`;
            acc.push({
              ...qry,
              name,
              type,
              query,
              stageId,
              levelId,
              stepId,
            });
          })
        )
      );
      return acc;
    }, []);
    if (dynamicQueries.current.length && graphql) {
      setDynamicQueriesGQL(`{ actor { ${graphql} } }`);
    } else {
      const {
        guids: gs,
        noAccessGuidsSet,
        markSignalsToSkip,
      } = stagesSignalGuidsSetsByType(stages, accounts, debugString);

      debugString(
        JSON.stringify(markSignalsToSkip, null, 2),
        'Skipped signals - no dynamic queries'
      );
      debugString(
        `Allowed signals: Entities (${
          gs[SIGNAL_TYPES.ENTITY]?.size || 0
        }), Alerts (${gs[SIGNAL_TYPES.ALERT]?.size || 0})`,
        'Allowed signals counts - no dynamic queries'
      );

      noAccessGuidsSetRef.current = noAccessGuidsSet;
      signalsMarkedToSkip.current = markSignalsToSkip;
      setGuids(gs);
    }
  }, [stages, accounts, debugString]);

  useEffect(() => {
    setIsLoading(dqLoading);
  }, [dqLoading, setIsLoading]);

  useEffect(() => {
    if (
      dqLoading ||
      !Object.keys(dqData?.actor || {}).filter(
        (key) => !DYNAMIC_SIGNALS_RESULTS_SKIP_KEYS.includes(key)
      ).length
    )
      return;

    dynamicSignalsByStep.current = dynamicQueries.current.reduce(
      (acc, { id: queryId, included, name, type, stepId }) => {
        const { [name]: { results: { entities = [] } = {} } = {} } =
          dqData?.actor || {};
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
    const stagesWithDynamicSignals = stages.map(updateStagesWithDynamic);
    const {
      guids: gs,
      noAccessGuidsSet,
      markSignalsToSkip,
    } = stagesSignalGuidsSetsByType(
      stagesWithDynamicSignals,
      accounts,
      debugString
    );

    debugString(
      JSON.stringify(markSignalsToSkip, null, 2),
      'Skipped signals - with dynamic queries'
    );
    debugString(
      `Allowed signals: Entities (${
        gs[SIGNAL_TYPES.ENTITY]?.size || 0
      }), Alerts (${gs[SIGNAL_TYPES.ALERT]?.size || 0})`,
      'Allowed signals counts - with dynamic queries'
    );

    noAccessGuidsSetRef.current = noAccessGuidsSet;
    signalsMarkedToSkip.current = markSignalsToSkip;
    setGuids(gs);
  }, [
    dqData,
    dqLoading,
    stages,
    accounts,
    updateStagesWithDynamic,
    debugString,
  ]);

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

    debugString(
      JSON.stringify(tooManySignalInStep, null, 2),
      'Too many signals in step'
    );

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
    debugString,
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
      debugString(JSON.stringify(batchedConditions), 'Batched conditions');
      const conditionsResponses = await Promise.allSettled(
        batchedConditions?.map(async ({ acctId, condIds }, bIdx) => {
          debugString(JSON.stringify(condIds), `Alerts batch ${bIdx + 1}`);
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
          debugString(JSON.stringify(incidentIds), `Incidents ${iIdx + 1}`);
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
    [debugString, setIsLoading]
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

      if (dynamicQueries.current.length > 0) {
        const dynamicQueryBody = dynamicQueries.current.reduce(
          (acc, { name, query, type }) => {
            let typeSpecificQryPrefix = '';
            if (type === SIGNAL_TYPES.ENTITY) {
              typeSpecificQryPrefix = `${SKIP_ENTITY_TYPES_NRQL} AND `;
            }
            if (type === SIGNAL_TYPES.ALERT) {
              typeSpecificQryPrefix = `${ALERTS_DOMAIN_TYPE_NRQL} AND `;
            }
            return `${acc}
              ${name}: entitySearch(query: "${typeSpecificQryPrefix}${query}") {
                count
                results { entities { guid name } }
              }`;
          },
          ''
        );

        if (dynamicQueryBody) {
          const { data: dqData, error: dqError } = await NerdGraphQuery.query({
            query: `{ actor { ${dynamicQueryBody} } }`,
          });

          if (dqError) {
            console.error('Error pre-fetching dynamic signals', dqError);
          } else if (dqData?.actor) {
            dynamicSignalsByStep.current = dynamicQueries.current.reduce(
              (acc, { id: queryId, included, name, type, stepId }) => {
                const { [name]: { results: { entities = [] } = {} } = {} } =
                  dqData.actor;
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

            const stagesWithDynamicSignals = stages.map(
              updateStagesWithDynamic
            );
            const { guids: newGuids } = stagesSignalGuidsSetsByType(
              stagesWithDynamicSignals,
              accounts,
              debugString
            );

            guidsRef.current = newGuids;
          }
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
      updateStagesWithDynamic,
      stages,
      accounts,
      setIsLoading,
      debugString,
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

const stagesSignalGuidsSetsByType = (
  stages = [],
  accounts = [],
  debugString
) => {
  const guids = {
    [SIGNAL_TYPES.ENTITY]: new Set(),
    [SIGNAL_TYPES.ALERT]: new Set(),
  };
  const noAccessGuidsSet = new Set();
  let markSignalsToSkip = {};

  const signalsByTypeCount = { ...COUNTS_BY_TYPE_DEFAULT };
  stages.forEach(({ id: stageId, name: stageName, levels = [] }) =>
    levels.forEach(({ id: levelId, steps = [] }) =>
      steps.forEach(({ id: stepId, title: stepTitle, signals = [] }) => {
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
            if (debugString) {
              debugString(
                `Skipping [${type}] "${name}" (from "${stepTitle}" in "${stageName}") (${reason} ${currentStepCount})`,
                'Signal skipped'
              );
            }

            markSignalsToSkip = addSignalToTree(
              markSignalsToSkip,
              stageId,
              levelId,
              stepId,
              guid,
              { name, type, reason }
            );
            return;
          }

          if (currentFlowCount > MAX_ENTITIES_IN_FLOW) {
            const reason = 'flow_limit_exceeded';
            if (debugString) {
              debugString(
                `Skipping [${type}] "${name}" (from "${stepTitle}" in "${stageName}") (${reason} ${currentFlowCount})`,
                'Signal skipped'
              );
            }

            markSignalsToSkip = addSignalToTree(
              markSignalsToSkip,
              stageId,
              levelId,
              stepId,
              guid,
              { name, type, reason }
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
              tooManySignalInStep = addSignalToTree(
                tooManySignalInStep,
                stage.id,
                level.id,
                step.id,
                guid,
                { name, type, reason: skippedSignal.reason }
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
