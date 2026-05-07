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
const PRELOAD_BAND_CONCURRENCY = 5;
const WORKLOAD_QUERY_CHUNK_MS = 2 * 60 * 60 * 1000;

const keyFromTimeWindow = ({ start, end }) =>
  start && end ? `${start}:${end}` : null;

const chunkArray = (array, size) => {
  const chunked = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
};

const chunkTimeRange = (start, end, chunkMs) => {
  const chunks = [];
  for (let s = start; s < end; s += chunkMs) {
    chunks.push({ start: s, end: Math.min(s + chunkMs, end) });
  }
  return chunks;
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
    batches.map(async (batch, index) => {
      let batchGraphql = '';
      batch.forEach(({ name, type, query: qry }) => {
        let prefix = '';
        if (type === SIGNAL_TYPES.ENTITY)
          prefix = `${SKIP_ENTITY_TYPES_NRQL} AND `;
        if (type === SIGNAL_TYPES.ALERT)
          prefix = `${ALERTS_DOMAIN_TYPE_NRQL} AND `;

        batchGraphql += `
          ${name}: entitySearch(query: "${prefix}${qry}") {
            count
            results { entities { guid name } }
          }`;
      });

      const query = `{ actor { ${batchGraphql} } }`;
      const result = await NerdGraphQuery.query({ query });
      return { ...result, query, index };
    })
  );

  responses.forEach(({ data, error, query, index }) => {
    if (data?.actor) Object.assign(actor, data.actor);
    if (error) {
      errors.push(error);
      queryErrorHandler(
        error,
        query,
        `Error fetching dynamic queries [batch ${index + 1}]`,
        {}
      );
    }
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

const queryErrorHandler = (error, query, label, signalsCounts) => {
  const errorMsg = error.message || error.toString();
  console.group(label || 'Query error');
  console.error('Query:', query);
  if (
    errorMsg.includes('query was too complex') ||
    errorMsg.includes('reduce the number of fields')
  ) {
    const {
      [SIGNAL_TYPES.ENTITY]: entityCount = 0,
      [SIGNAL_TYPES.ALERT]: alertCount = 0,
    } = signalsCounts || {};
    if (entityCount > MAX_ENTITIES_IN_FLOW) {
      console.warn(`⚠️ ${entityCount} entities in flow`);
    }
    if (alertCount > MAX_ENTITIES_IN_FLOW) {
      console.warn(`⚠️ ${alertCount} alerts in flow`);
    }
  }
  console.groupEnd();
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

  const { debugString, debugTable } = useDebugLogger({
    allowDebug: debugMode,
  });

  const guidsRef = useRef(guids);
  const noAccessGuidsSetRef = useRef(new Set());
  const signalsMarkedToSkip = useRef({});
  const signalsCountsRef = useRef(COUNTS_BY_TYPE_DEFAULT);
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

      const errorsLen = errors.length;
      if (errorsLen) {
        console.error(
          `Error(s) in ${errorsLen} batch(es) fetching dynamic signals`
        );
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
      signalsByTypeCount,
    } = stagesSignalGuidsSetsByType(stagesWithDynamicSignals, curAccounts);

    Object.entries(signalsByTypeCount || {}).forEach(([type, count]) => {
      if (count > MAX_ENTITIES_IN_FLOW) {
        console.warn(
          `${count} ${type} signals (recommended limit: ${MAX_ENTITIES_IN_FLOW})`
        );
      }
    });
    guidsRef.current = gs;
    noAccessGuidsSetRef.current = noAccessGuidsSet;
    signalsMarkedToSkip.current = markSignalsToSkip;
    signalsCountsRef.current = signalsByTypeCount;

    return { guids: gs, stagesWithDynamicSignals };
  }, []);

  useEffect(() => {
    if (!stages?.length || !accounts?.length) return;
    const init = async () => {
      setIsLoading?.(true);
      try {
        const { guids: gs } = await signalsInStages(stages, accounts);
        setGuids(gs);
      } catch (e) {
        console.error('Error initializing flow:', e);
      } finally {
        setIsLoading?.(false);
      }
    };

    init();
  }, [stages, accounts, signalsInStages, setIsLoading]);

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
      if (!isForCache) setIsLoading?.(true);
      const batches = chunkArray(entitiesGuids, MAX_ENTITIES_IN_FLOW);
      let errorCount = 0;
      const batchPromises = batches.map(async (batchGuids, bIdx) => {
        const entitiesGuidsArray = guidsToArray(
          { entitiesGuids: batchGuids },
          MAX_PARAMS_IN_QUERY
        );
        const query = statusesFromGuidsArray(entitiesGuidsArray, timeWindow);

        const { data: { actor = {} } = {}, error } = await NerdGraphQuery.query(
          {
            query,
          }
        );
        if (error) {
          errorCount++;
          queryErrorHandler(
            error,
            query,
            `Error fetching entities [batch ${bIdx + 1}]`,
            signalsCountsRef.current
          );
          return {};
        }

        return entitiesDetailsFromQueryResults(actor);
      });

      const results = await Promise.all(batchPromises);
      const entitiesStatusesObj = results.reduce(
        (acc, result) => ({ ...acc, ...result }),
        {}
      );
      if (!isForCache)
        debugString(
          `Entities: ${entitiesGuids.length} guid(s) across ${batches.length} batch(es). ${errorCount} error(s).`,
          'Fetch summary'
        );
      if (!isForCache) setIsLoading?.(false);

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
      if (!isForCache) setIsLoading?.(true);

      const batchedConditions = alertsGuids.reduce(
        batchAlertConditionsByAccount,
        []
      );
      let errorCount = 0;

      const [conditionsResponses, issuesBlocks] = await Promise.all([
        Promise.allSettled(
          batchedConditions?.map(async ({ acctId, condIds }, bIdx) => {
            const query = conditionsDetailsQuery(acctId, condIds);
            const {
              data: { actor: { account: { alerts } = {} } = {} } = {},
              error,
            } = await NerdGraphQuery.query({ query });
            if (error) {
              errorCount++;
              queryErrorHandler(
                error,
                query,
                `Error fetching conditions details [batch ${bIdx + 1}]`,
                signalsCountsRef.current
              );
            }
            return { acctId, alerts };
          })
        ),
        Promise.allSettled(
          batchedConditions?.map(async ({ acctId, condIds }, bIdx) => {
            const query = issuesForConditionsQuery(acctId, condIds, timeWindow);
            const {
              data: {
                actor: {
                  account: { aiIssues: { issues: { issues } = {} } = {} } = {},
                } = {},
              } = {},
              error,
            } = await NerdGraphQuery.query({ query });
            if (error) {
              errorCount++;
              queryErrorHandler(
                error,
                query,
                `Error fetching issues [batch ${bIdx + 1}]`,
                signalsCountsRef.current
              );
            }
            return { acctId, issues };
          })
        ),
      ]);
      const batchedIncidentIds =
        batchedIncidentIdsFromIssuesQuery(issuesBlocks);

      const incidentsBlocks = await Promise.allSettled(
        batchedIncidentIds?.map(async ({ acctId, incidentIds }, iIdx) => {
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
          if (error) {
            errorCount++;
            queryErrorHandler(
              error,
              query,
              `Error fetching incidents [batch ${iIdx + 1}]`
            );
          }
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

      debugString(
        `Alerts: ${alertsGuids.length} condition(s) across ${batchedConditions.length} account batch(es), ${batchedIncidentIds.length} incident batch(es). ${errorCount} error(s).`,
        'Fetch summary'
      );
      if (!isForCache) setIsLoading?.(false);
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
        `Fetching status for ${alertsGuids.length} alert(s) and ${entitiesGuids.length} entity(ies).`,
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
    if (!shouldPollRef.current) return;
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
          console.error('Error loading playback', err);
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
        const queryStart = fifteenMinutesAgo(timeBands?.[0]?.start);
        const queryEnd = timeBands?.[timeBands.length - 1]?.end;
        const timeChunks = chunkTimeRange(
          queryStart,
          queryEnd,
          WORKLOAD_QUERY_CHUNK_MS
        );
        const chunkResults = await Promise.allSettled(
          timeChunks.map((tw) =>
            NerdGraphQuery.query({
              query: workloadsStatusesQuery(workloads, tw),
            })
          )
        );
        workloadsStatuses = chunkResults.reduce((acc, result) => {
          if (result.status !== 'fulfilled') return acc;
          const { data: { actor: w = {} } = {}, error } = result.value;
          if (error || !w) return acc;
          Object.keys(w).forEach((key) => {
            if (key === '__typename') return;
            (w[key].results || []).forEach(
              ({ statusValueCode, timestamp, workloadGuid }) => {
                if (!acc[workloadGuid]) acc[workloadGuid] = [];
                acc[workloadGuid].push({ statusValueCode, timestamp });
              }
            );
          });
          return acc;
        }, {});
      }

      const updatedStages = stages.map(updateStagesWithDynamic);
      const bandDiagnostics = [];

      for (let i = 0; i < timeBands.length; i += PRELOAD_BAND_CONCURRENCY) {
        const chunk = timeBands.slice(i, i + PRELOAD_BAND_CONCURRENCY);
        await Promise.all(
          chunk.map(async (tw, chunkIdx) => {
            const idx = i + chunkIdx;
            const { key: bandKey, alertsStatusesObj } =
              timeBandsDataArray[idx] || {};
            const timeWindowCachedData = timeBandDataCache.current.get(bandKey);

            if (overwriteCache || !timeWindowCachedData) {
              let entitiesStatusesObj = entitiesGuidsArray.length
                ? await fetchEntitiesStatus(entitiesGuidsArray, tw, true)
                : {};

              const returnedCount = Object.keys(entitiesStatusesObj).length;
              if (returnedCount < entitiesGuidsArray.length) {
                bandDiagnostics.push({
                  idx,
                  expected: entitiesGuidsArray.length,
                  returned: returnedCount,
                });
              }

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
          })
        );
      }

      const anomalyLines = bandDiagnostics.map(
        ({ idx, expected, returned }) =>
          `  Band ${idx}: expected ${expected}, got ${returned}`
      );
      debugString(
        bandDiagnostics.length
          ? `${entitiesGuidsArray.length} entity(ies), ${
              alertsGuidsArray.length
            } alert(s) × ${timeBands.length} timeslices. ${
              bandDiagnostics.length
            } timeslice(s) with missing entities:\n${anomalyLines.join('\n')}`
          : `${entitiesGuidsArray.length} entity(ies), ${alertsGuidsArray.length} alert(s) × ${timeBands.length} timeslices. All OK.`,
        'Playback summary'
      );

      setIsLoading?.(false);
    },
    [
      debugString,
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
    signalsByTypeCount,
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
