import React, {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  HeadingText,
  Icon,
  NerdGraphQuery,
  Switch,
  Tooltip,
  useNerdletState,
} from 'nr1';

import { EmptyBlock, SignalDetailSidebar, Stage, StepDetailSidebar } from '../';
import { FLOW_DISPATCH_COMPONENTS, FLOW_DISPATCH_TYPES } from '../../reducers';
import {
  AppContext,
  FlowContext,
  FlowDispatchContext,
  PlaybackContext,
  SelectionsContext,
  SignalsClassificationsContext,
  SignalsContext,
  StagesContext,
  useSidebar,
} from '../../contexts';
import {
  conditionsDetailsQuery,
  incidentsSearchQuery,
  issuesForConditionsQuery,
  statusesFromGuidsArray,
  workloadsStatusesQuery,
} from '../../queries';
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
  stagesSignalGuidsSetsByType,
  statusFromStatuses,
  threeDaysAgo,
  validRefreshInterval,
} from '../../utils';
import {
  MODES,
  SIGNAL_TYPES,
  SIGNAL_EXPAND,
  COMPONENTS,
  UI_CONTENT,
  ALERT_STATUSES,
  MAX_PARAMS_IN_QUERY,
} from '../../constants';
import { useDebugLogger } from '../../hooks';

const keyFromTimeWindow = ({ start, end }) =>
  start && end ? `${start}:${end}` : null;

const FETCH_TYPES = {
  POLLED: 'polled',
  MANUAL: 'manual',
  RESUME: 'resume',
};

const Stages = forwardRef(
  ({ mode = MODES.INLINE, isPlayback, setIsLoading, saveFlow }, ref) => {
    const { refreshInterval, stages = [] } = useContext(FlowContext);
    const dispatch = useContext(FlowDispatchContext);
    const { accounts, debugMode } = useContext(AppContext);
    const [guids, setGuids] = useState({});
    const [statuses, setStatuses] = useState({});
    const [stagesData, setStagesData] = useState({ stages });
    const [signalsDetails, setSignalsDetails] = useState({});
    const [dynamicEntities, setDynamicEntities] = useState({});
    const [dynamicAlerts, setDynamicAlerts] = useState({});
    const [selections, setSelections] = useState({});
    const [classifications, setClassifications] = useState({});
    const [signalExpandOption, setSignalExpandOption] = useState(0); // bitwise: (00000001) = unhealthy signals ;; (00000010) = critical signals ;; (00000100)= all signals
    const [signalCollapseOption, setSignalCollapseOption] = useState(false);
    const [currentPlaybackTimeWindow, setCurrentPlaybackTimeWindow] =
      useState(null);
    const { debugString } = useDebugLogger({ allowDebug: debugMode });
    const dragItemIndex = useRef();
    const dragOverItemIndex = useRef();
    const stagesDataRef = useRef(stages);
    const noAccessGuidsLastState = useRef([]);
    const timeBandDataCache = useRef(new Map());
    const timeWindowAlertsCache = useRef(new Map());
    const playbackTimeWindow = useRef(null);
    const entitiesStatusTimeoutId = useRef();
    const alertsStatusTimeoutId = useRef();
    const stepsDynamicEntities = useRef({});
    const stepsDynamicAlerts = useRef({});
    const guidsRef = useRef(guids);
    const prevPreloadArgs = useRef(null);
    const prevPreloadGuids = useRef({
      [SIGNAL_TYPES.ENTITY]: [],
      [SIGNAL_TYPES.ALERT]: [],
    });
    const fetchStatusesTimerId = useRef(null);
    const isFetchingStatuses = useRef(false);
    const shouldResumeFetchStatuses = useRef(false);
    const { openSidebar, closeSidebar } = useSidebar();
    const [nerdletState, setNerdletState] = useNerdletState();

    useEffect(() => {
      return () => {
        clearTimeout(entitiesStatusTimeoutId.current);
        clearTimeout(alertsStatusTimeoutId.current);
      };
    }, []);

    useEffect(() => {
      guidsRef.current = guids;
      if (
        [SIGNAL_TYPES.ENTITY, SIGNAL_TYPES.ALERT].some(
          (t) =>
            (guids[t] || []).length > (prevPreloadGuids.current[t] || []).length
        )
      ) {
        const { timeBands, callback } = prevPreloadArgs.current || {};
        if (isPlayback && timeBands && callback) {
          preload(timeBands, callback, true);
        } else {
          runFetch(FETCH_TYPES.MANUAL);
        }
        prevPreloadGuids.current = {
          [SIGNAL_TYPES.ENTITY]: guids[SIGNAL_TYPES.ENTITY],
          [SIGNAL_TYPES.ALERT]: guids[SIGNAL_TYPES.ALERT],
        };
      }
    }, [guids, isPlayback, preload, runFetch]);

    useEffect(() => {
      if (!accounts?.length) return;
      clearTimeout(entitiesStatusTimeoutId.current);
      clearTimeout(alertsStatusTimeoutId.current);
      const uniqueGuidsSetsByType = stagesSignalGuidsSetsByType(
        stages,
        accounts
      );
      setGuids((gs) => ({
        ...gs,
        ...Object.keys(uniqueGuidsSetsByType)?.reduce(
          (types, type) => ({
            ...types,
            [type]: [
              ...(gs[type] || []).reduce(
                (acc, cur) => acc.add(cur),
                uniqueGuidsSetsByType[type]
              ),
            ],
          }),
          {}
        ),
      }));
      setStagesData(() => ({ stages: [...stages] }));
    }, [stages, accounts]);

    useEffect(() => {
      stepsDynamicEntities.current = dynamicEntities;
      setGuids((gs) => {
        const entitiesGuidsSet = new Set(gs[SIGNAL_TYPES.ENTITY] || []);
        Object.keys(dynamicEntities).forEach((stp) =>
          dynamicEntities[stp]?.forEach(({ guid }) =>
            entitiesGuidsSet.add(guid)
          )
        );
        return {
          ...gs,
          [SIGNAL_TYPES.ENTITY]: [...entitiesGuidsSet],
        };
      });
    }, [dynamicEntities]);

    useEffect(() => {
      stepsDynamicAlerts.current = dynamicAlerts;
      setGuids((gs) => {
        const alertsGuidsSet = new Set(gs[SIGNAL_TYPES.ALERT] || []);
        Object.keys(dynamicAlerts).forEach((stp) =>
          dynamicAlerts[stp]?.forEach(({ guid }) => alertsGuidsSet.add(guid))
        );
        return {
          ...gs,
          [SIGNAL_TYPES.ALERT]: [...alertsGuidsSet],
        };
      });
    }, [dynamicAlerts]);

    const fetchEntitiesStatus = useCallback(
      async (entitiesGuids, timeWindow, isForCache) => {
        setIsLoading?.(true);
        clearTimeout(entitiesStatusTimeoutId.current);
        const entitiesGuidsArray = guidsToArray(
          { entitiesGuids },
          MAX_PARAMS_IN_QUERY
        );
        const query = statusesFromGuidsArray(entitiesGuidsArray, timeWindow);
        debugString(query, 'Entities query');
        const { data: { actor = {} } = {}, error } = await NerdGraphQuery.query(
          {
            query,
          }
        );
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
      [debugString]
    );

    const fetchAlertsStatus = useCallback(
      async (alertsGuids, timeWindow, isForCache) => {
        setIsLoading?.(true);
        clearTimeout(alertsStatusTimeoutId.current);

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
              console.error(
                'Error fetching conditions details:',
                error.message
              );
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
            if (error)
              console.error('Error fetching incidents:', error.message);
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
      []
    );

    const fetchStatuses = useCallback(
      async (guidsArr = {}, timeWindow) => {
        const {
          [SIGNAL_TYPES.ENTITY]: entitiesGuids = [],
          [SIGNAL_TYPES.ALERT]: alertsGuids = [],
          [SIGNAL_TYPES.NO_ACCESS]: noAccessGuids = [],
        } = guidsArr;

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

        if (
          noAccessGuids.length &&
          !(
            noAccessGuids.length === noAccessGuidsLastState.current.length &&
            noAccessGuids.every((g) =>
              noAccessGuidsLastState.current.includes(g)
            )
          )
        ) {
          noAccessGuidsLastState.current = noAccessGuids;
          setStatuses((s) => ({
            ...s,
            [SIGNAL_TYPES.NO_ACCESS]: noAccessGuids.reduce(
              (acc, cur) => ({ ...acc, [cur]: true }),
              {}
            ),
          }));
        }
      },
      [fetchEntitiesStatus, fetchAlertsStatus]
    );

    const runFetch = useCallback(
      async (fetchType = FETCH_TYPES.POLLED) => {
        if (isFetchingStatuses.current) {
          if (fetchType === FETCH_TYPES.MANUAL)
            shouldResumeFetchStatuses.current = true;
          return;
        }

        isFetchingStatuses.current = true;
        try {
          await fetchStatuses(guidsRef.current);
        } finally {
          isFetchingStatuses.current = false;

          if (shouldResumeFetchStatuses.current) {
            shouldResumeFetchStatuses.current = false;
            runFetch(FETCH_TYPES.MANUAL);
          }
        }
      },
      [fetchStatuses]
    );

    useEffect(() => {
      let isRunCancelled = false;

      const clearTimer = () => {
        if (fetchStatusesTimerId.current !== null) {
          clearTimeout(fetchStatusesTimerId.current);
          fetchStatusesTimerId.current = null;
        }
      };

      if (isPlayback) {
        clearTimer();
        return clearTimer;
      }

      runFetch(FETCH_TYPES.RESUME);

      const scheduleNextFetch = () => {
        if (isRunCancelled) return;

        const timeout = validRefreshInterval(refreshInterval);

        fetchStatusesTimerId.current = window.setTimeout(() => {
          void runFetch(FETCH_TYPES.POLLED).finally(() => {
            if (!isRunCancelled) scheduleNextFetch();
          });
        }, timeout);
      };

      scheduleNextFetch();

      return () => {
        isRunCancelled = true;
        clearTimer();
      };
    }, [isPlayback, runFetch, refreshInterval]);

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
                ...(stepsDynamicEntities.current?.[stp.id] || []).map(
                  signalWithQueryIncluded
                ),
                ...(stepsDynamicAlerts.current?.[stp.id] || []).map(
                  signalWithQueryIncluded
                ),
              ],
            };
          }),
        })),
      }),
      []
    );

    useEffect(() => {
      const updatedStages = stages.map(updateStagesWithDynamic);
      const {
        entitiesInStepCount,
        signalsWithNoAccess,
        signalsWithNoStatus,
        signalsWithStatuses,
      } = addSignalStatuses(updatedStages, statuses);
      setStagesData(() => ({
        stages: signalsWithStatuses.map(annotateStageWithStatuses),
      }));
      setClassifications((cls = {}) => ({
        ...cls,
        entitiesInStepCount,
        signalsWithNoAccess,
        signalsWithNoStatus,
      }));
      const sigDetails = signalDetailsObject(statuses);
      if (sigDetails) setSignalsDetails(sigDetails);
    }, [stages, statuses, updateStagesWithDynamic]);

    useEffect(() => {
      if (nerdletState.staging) {
        const {
          stageId,
          levelId,
          stepId,
          signals = [],
          queries = [],
        } = nerdletState.staging;
        const updates = (stagesDataRef.current || []).reduce(
          (acc, stage) =>
            stage.id === stageId
              ? {
                  ...stage,
                  levels: (stage.levels || []).map((level) =>
                    level.id === levelId
                      ? {
                          ...level,
                          steps: (level.steps || []).map((step) =>
                            step.id === stepId
                              ? {
                                  ...step,
                                  signals,
                                  queries,
                                }
                              : step
                          ),
                        }
                      : level
                  ),
                }
              : acc,
          null
        );
        if (updates)
          dispatch({
            type: FLOW_DISPATCH_TYPES.UPDATED,
            component: FLOW_DISPATCH_COMPONENTS.STAGE,
            componentIds: { stageId },
            updates,
            saveFlow,
          });
        setNerdletState({ staging: false });
      }
    }, [nerdletState.staging]);

    useEffect(() => {
      setSignalExpandOption(nerdletState.signalExpandOption);
    }, [nerdletState.signalExpandOption]);

    useEffect(() => {
      if (selections.type === COMPONENTS.SIGNAL && selections.id) {
        openSidebar({
          content: (
            <SignalDetailSidebar
              guid={selections.id}
              name={selections.data?.name}
              type={selections.data?.type}
              status={selections.data?.status}
              data={statuses[selections.data?.type]?.[selections.id]}
              timeWindow={playbackTimeWindow.current}
            />
          ),
          status: selections.data?.status,
          onClose: closeSidebarHandler,
        });
      } else if (selections.type === COMPONENTS.STEP && selections.id) {
        const { stageId, levelId } = selections.data || {};
        const { levels = [] } =
          (stagesData.stages || []).find(({ id }) => id === stageId) || {};
        const { steps = [] } = levels.find(({ id }) => id === levelId) || {};
        const step = steps.find(({ id }) => id === selections.id) || {};
        if (step)
          openSidebar({
            content: <StepDetailSidebar step={step} />,
            status: step?.status,
            onClose: closeSidebarHandler,
          });
      } else {
        closeSidebar();
      }
    }, [selections, statuses, stagesData, closeSidebarHandler]);

    const markSelection = useCallback((type, id, data) => {
      if (!type || !id) return;
      setSelections((sel) =>
        sel.type === type && sel.id === id ? {} : { type, id, data }
      );
    }, []);

    const closeSidebarHandler = useCallback(() => setSelections({}), []);

    const updateStagesDataRef = useCallback(() => {
      stagesDataRef.current = [...stages];
    }, [stages]);

    const preload = useCallback(
      async (timeBands = [], callback, overwriteCache = false) => {
        prevPreloadArgs.current = { timeBands, callback };
        const { [SIGNAL_TYPES.ALERT]: alertsGuids = [] } =
          guidsRef.current || {};
        const timeWindow = {
          start: threeDaysAgo(timeBands?.[0]?.start),
          end: timeBands?.[timeBands.length - 1]?.end,
        };
        const key = keyFromTimeWindow(timeWindow);
        const timeWindowCachedAlerts = timeWindowAlertsCache.current.get(key);
        let timeBandsDataArray;
        if (overwriteCache || !timeWindowCachedAlerts) {
          const alertsData = alertsGuids.length
            ? await fetchAlertsStatus(alertsGuids, timeWindow, true)
            : {};
          timeBandsDataArray = timeBands.map((timeWindow) => ({
            key: keyFromTimeWindow(timeWindow),
            alertsStatusesObj: alertsStatusesObjFromData(
              alertsData,
              timeWindow
            ),
          }));
          timeWindowAlertsCache.current.set(key, timeBandsDataArray);
        } else {
          timeBandsDataArray = timeWindowCachedAlerts;
        }
        setIsLoading(true);

        const { [SIGNAL_TYPES.ENTITY]: entitiesGuids = [] } =
          guidsRef.current || {};
        const workloads = entitiesGuids?.reduce((acc, cur) => {
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
        timeBands.forEach(async (timeWindow, idx) => {
          const { key, alertsStatusesObj } = timeBandsDataArray[idx] || {};
          const timeWindowCachedData = timeBandDataCache.current.get(key);
          if (overwriteCache || !timeWindowCachedData) {
            let entitiesStatusesObj = entitiesGuids.length
              ? await fetchEntitiesStatus(entitiesGuids, timeWindow, true)
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
                        timeWindow
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
            timeBandDataCache.current.set(key, timeWindowStatuses);
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
        setIsLoading(false);
      },
      [
        fetchAlertsStatus,
        fetchEntitiesStatus,
        updateStagesWithDynamic,
        stages,
        setIsLoading,
      ]
    );

    useImperativeHandle(
      ref,
      () => ({
        refresh: async () => {
          noAccessGuidsLastState.current = [];
          runFetch(FETCH_TYPES.MANUAL);
        },
        preload,
        seek: async (timeWindow) => {
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
        },
        clearPlaybackTimeWindow: () => {
          playbackTimeWindow.current = null;
          prevPreloadArgs.current = null;
          setCurrentPlaybackTimeWindow?.(null);
        },
      }),
      [preload, runFetch, setCurrentPlaybackTimeWindow]
    );

    const addStageHandler = () =>
      dispatch({
        type: FLOW_DISPATCH_TYPES.ADDED,
        component: FLOW_DISPATCH_COMPONENTS.STAGE,
        saveFlow,
      });

    const dragStartHandler = (e, index) => {
      dragItemIndex.current = index;
      e.dataTransfer.effectAllowed = 'move';
    };

    const dragOverHandler = (e, index) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dragOverItemIndex.current = index;
    };

    const dropHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const sourceIndex = dragItemIndex.current;
      const targetIndex = dragOverItemIndex.current;
      dispatch({
        type: FLOW_DISPATCH_TYPES.REORDERED,
        component: FLOW_DISPATCH_COMPONENTS.STAGE,
        updates: { sourceIndex, targetIndex },
        saveFlow,
      });
      dragItemIndex.current = null;
      dragOverItemIndex.current = null;
    };

    return (
      <StagesContext.Provider
        value={{
          stages: stagesData.stages,
          updateStagesDataRef,
          dynamicEntities,
          dynamicAlerts,
          setDynamicEntities,
          setDynamicAlerts,
        }}
      >
        <SignalsContext.Provider value={signalsDetails}>
          <SelectionsContext.Provider value={{ selections, markSelection }}>
            <SignalsClassificationsContext.Provider
              value={{ classifications, setClassifications }}
            >
              <PlaybackContext.Provider
                value={{ timeWindow: currentPlaybackTimeWindow }}
              >
                <div className="stages-header">
                  <div className="heading">
                    <HeadingText type={HeadingText.TYPE.HEADING_5}>
                      Stages
                    </HeadingText>
                    <Tooltip text={UI_CONTENT.STAGE.TOOLTIP}>
                      <Icon
                        className="info-icon"
                        type={Icon.TYPE.INTERFACE__INFO__INFO}
                      />
                    </Tooltip>
                  </div>
                  {mode === MODES.EDIT ? (
                    <>
                      <Button
                        className="button-tertiary-border"
                        variant={Button.VARIANT.TERTIARY}
                        sizeType={Button.SIZE_TYPE.SMALL}
                        iconType={
                          Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE
                        }
                        onClick={addStageHandler}
                      >
                        {UI_CONTENT.STAGE.ADD_STAGE}
                      </Button>
                      <Switch
                        checked={signalCollapseOption}
                        label="Collapse all signals"
                        onChange={() =>
                          setSignalCollapseOption(
                            (prevCollapseOption) => !prevCollapseOption
                          )
                        }
                      />
                    </>
                  ) : (
                    <>
                      <Switch
                        checked={
                          signalExpandOption & SIGNAL_EXPAND.UNHEALTHY_ONLY
                        }
                        label="Unhealthy only"
                        onChange={() =>
                          setNerdletState({
                            signalExpandOption:
                              signalExpandOption ^ SIGNAL_EXPAND.UNHEALTHY_ONLY,
                          })
                        }
                      />
                      <Switch
                        checked={
                          signalExpandOption & SIGNAL_EXPAND.CRITICAL_ONLY
                        }
                        label="Critical only"
                        onChange={() =>
                          setNerdletState({
                            signalExpandOption:
                              signalExpandOption ^ SIGNAL_EXPAND.CRITICAL_ONLY,
                          })
                        }
                      />
                    </>
                  )}
                  {mode === MODES.INLINE && (
                    <Switch
                      checked={signalExpandOption & SIGNAL_EXPAND.ALL}
                      label="Expand all steps"
                      onChange={() =>
                        setNerdletState({
                          signalExpandOption:
                            signalExpandOption ^ SIGNAL_EXPAND.ALL,
                        })
                      }
                    />
                  )}
                </div>
                <div className="stages">
                  {(stagesData.stages || []).map(({ id }, i) => (
                    <Stage
                      key={id}
                      stageId={id}
                      mode={mode}
                      signalExpandOption={signalExpandOption}
                      signalCollapseOption={signalCollapseOption}
                      stageIndex={i}
                      onDragStart={(e) => dragStartHandler(e, i)}
                      onDragOver={(e) => dragOverHandler(e, i)}
                      onDrop={(e) => dropHandler(e)}
                      saveFlow={saveFlow}
                    />
                  ))}
                  {mode === MODES.EDIT && !stagesData.stages.length ? (
                    <EmptyBlock
                      title={UI_CONTENT.FLOW.NO_STAGES.TITLE}
                      description={UI_CONTENT.FLOW.NO_STAGES.DESCRIPTION}
                      actionButtonText="Add a stage"
                      onAdd={addStageHandler}
                      fullWidth
                    />
                  ) : null}
                </div>
              </PlaybackContext.Provider>
            </SignalsClassificationsContext.Provider>
          </SelectionsContext.Provider>
        </SignalsContext.Provider>
      </StagesContext.Provider>
    );
  }
);

Stages.propTypes = {
  mode: PropTypes.oneOf(Object.values(MODES)),
  isPlayback: PropTypes.bool,
  setIsLoading: PropTypes.func,
  saveFlow: PropTypes.func,
};

Stages.displayName = 'Stages';

export default Stages;
