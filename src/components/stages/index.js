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
} from '../../queries';
import {
  addSignalStatuses,
  alertsStatusesObjFromData,
  annotateStageWithStatuses,
  batchAlertConditionsByAccount,
  batchedIncidentIdsFromIssuesQuery,
  entitiesDetailsFromQueryResults,
  guidsToArray,
  incidentsFromIncidentsBlocks,
  signalDetailsObject,
  statusFromStatuses,
  threeDaysAgo,
  uniqueSignalGuidsInStages,
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

const WORKLOAD_TYPE = 'WORKLOAD';
const WORKLOAD_SKIP_SEVERITIES = [
  ALERT_STATUSES.NOT_CONFIGURED,
  ALERT_STATUSES.NOT_ALERTING,
];

const keyFromTimeWindow = ({ start, end }) =>
  start && end ? `${start}:${end}` : null;

const Stages = forwardRef(({ mode = MODES.INLINE, saveFlow }, ref) => {
  const { refreshInterval, stages = [] } = useContext(FlowContext);
  const dispatch = useContext(FlowDispatchContext);
  const { accounts } = useContext(AppContext);
  const [guids, setGuids] = useState({});
  const [statuses, setStatuses] = useState({});
  const [stagesData, setStagesData] = useState({ stages });
  const [signalsDetails, setSignalsDetails] = useState({});
  const [selections, setSelections] = useState({});
  const [classifications, setClassifications] = useState({});
  const [signalExpandOption, setSignalExpandOption] = useState(0); // bitwise: (00000001) = unhealthy signals ;; (00000010) = critical signals ;; (00000100)= all signals
  const dragItemIndex = useRef();
  const dragOverItemIndex = useRef();
  const stagesDataRef = useRef(stages);
  const entitiesGuidsLastState = useRef([]);
  const alertsGuidsLastState = useRef([]);
  const noAccessGuidsLastState = useRef([]);
  const timeBandDataCache = useRef(new Map());
  const timeWindowAlertsCache = useRef(new Map());
  const playbackTimeWindow = useRef(null);
  const statusTimeoutDelay = useRef(validRefreshInterval(refreshInterval));
  const entitiesStatusTimeoutId = useRef();
  const alertsStatusTimeoutId = useRef();
  const { openSidebar, closeSidebar } = useSidebar();
  const [nerdletState, setNerdletState] = useNerdletState();

  useEffect(() => {
    return () => {
      clearInterval(entitiesStatusTimeoutId.current);
      clearTimeout(alertsStatusTimeoutId.current);
    };
  }, []);

  useEffect(() => {
    statusTimeoutDelay.current = validRefreshInterval(refreshInterval);
  }, [refreshInterval]);

  useEffect(() => {
    if (!accounts?.length) return;
    clearInterval(entitiesStatusTimeoutId.current);
    clearTimeout(alertsStatusTimeoutId.current);
    setGuids(uniqueSignalGuidsInStages(stages, accounts));
    setStagesData(() => ({ stages: [...stages] }));
  }, [stages, accounts]);

  const fetchEntitiesStatus = useCallback(
    async (entitiesGuids, timeWindow, isForCache) => {
      clearTimeout(entitiesStatusTimeoutId.current);
      const entitesGuidsArray = guidsToArray(
        { entitiesGuids },
        MAX_PARAMS_IN_QUERY
      );
      const query = statusesFromGuidsArray(entitesGuidsArray, timeWindow);
      const { data: { actor = {} } = {}, error } = await NerdGraphQuery.query({
        query,
      });
      if (error) {
        console.error('Error fetching entities:', error.message);
        return;
      }
      const entitiesStatusesObj = entitiesDetailsFromQueryResults(actor);
      const { workloads, workloadEntities } = Object.keys(
        entitiesStatusesObj
      ).reduce(
        (acc, cur) => {
          const {
            type: t,
            alertSeverity,
            relatedEntities,
          } = entitiesStatusesObj[cur];
          if (
            t !== WORKLOAD_TYPE ||
            WORKLOAD_SKIP_SEVERITIES.includes(alertSeverity) ||
            !relatedEntities?.results?.length
          )
            return acc;
          const { workloadEntitiesGuids, guidsWOStatus } =
            relatedEntities.results.reduce(
              ({ workloadEntitiesGuids, guidsWOStatus }, re) => {
                const g = re?.target?.entity?.guid;
                if (!g) return { workloadEntitiesGuids, guidsWOStatus };
                return {
                  workloadEntitiesGuids: [...workloadEntitiesGuids, g],
                  guidsWOStatus:
                    g in entitiesStatusesObj || guidsWOStatus.includes(g)
                      ? guidsWOStatus
                      : [...guidsWOStatus, g],
                };
              },
              { workloadEntitiesGuids: [], guidsWOStatus: acc.workloadEntities }
            );
          return {
            ...acc,
            workloads: {
              ...acc.workloads,
              [cur]: workloadEntitiesGuids,
            },
            workloadEntities: guidsWOStatus,
          };
        },
        { workloads: {}, workloadEntities: [] }
      );
      if (Object.keys(workloads).length && workloadEntities.length) {
        const workloadEntitiesStatuses = await fetchEntitiesStatus(
          workloadEntities,
          timeWindow,
          true
        );
        const key =
          timeWindow?.start && timeWindow?.end
            ? 'alertViolations'
            : 'recentAlertViolations';
        Object.keys(workloads).forEach((wlg) => {
          entitiesStatusesObj[wlg][key] = workloads[wlg]?.reduce(
            (acc, cur) => [
              ...acc,
              ...(entitesGuidsArray[cur]?.[key] ||
                workloadEntitiesStatuses[cur]?.[key] ||
                []),
            ],
            entitiesStatusesObj[wlg][key] || []
          );
        });
      }
      if (isForCache) return entitiesStatusesObj;
      if (statusTimeoutDelay.current && !timeWindow) {
        entitiesStatusTimeoutId.current = setTimeout(
          () => fetchEntitiesStatus(entitiesGuids),
          statusTimeoutDelay.current
        );
      }
      setStatuses((s) => ({
        ...s,
        [SIGNAL_TYPES.ENTITY]: entitiesStatusesObj,
      }));
    },
    []
  );

  const fetchAlertsStatus = useCallback(
    async (alertsGuids, timeWindow, isForCache) => {
      clearTimeout(alertsStatusTimeoutId.current);

      const batchedConditions = alertsGuids.reduce(
        batchAlertConditionsByAccount,
        []
      );
      const conditionsResponses = await Promise.allSettled(
        batchedConditions?.map(async ({ acctId, condIds }) => {
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
        batchedIncidentIds?.map(async ({ acctId, incidentIds }) => {
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

      if (isForCache) return alertsStatusesObj;
      if (statusTimeoutDelay.current && !timeWindow) {
        alertsStatusTimeoutId.current = setTimeout(
          () => fetchAlertsStatus(alertsGuids),
          statusTimeoutDelay.current
        );
      }
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

      if (
        entitiesGuids.length &&
        !(
          entitiesGuids.length === entitiesGuidsLastState.current.length &&
          entitiesGuids.every((g) => entitiesGuidsLastState.current.includes(g))
        )
      ) {
        entitiesGuidsLastState.current = entitiesGuids;
        fetchers.push(() => fetchEntitiesStatus(entitiesGuids, timeWindow));
      }

      if (
        alertsGuids.length &&
        !(
          alertsGuids.length === alertsGuidsLastState.current.length &&
          alertsGuids.every((g) => alertsGuidsLastState.current.includes(g))
        )
      ) {
        alertsGuidsLastState.current = alertsGuids;
        fetchers.push(() => fetchAlertsStatus(alertsGuids, timeWindow));
      }

      await Promise.all(fetchers.map((fetcher) => fetcher()));

      if (
        noAccessGuids.length &&
        !(
          noAccessGuids.length === noAccessGuidsLastState.current.length &&
          noAccessGuids.every((g) => noAccessGuidsLastState.current.includes(g))
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

  useEffect(() => {
    if (!guids || !Object.keys(guids).length) return;
    fetchStatuses(guids);
  }, [fetchStatuses, guids]);

  useEffect(() => {
    const {
      entitiesInStepCount,
      signalsWithNoAccess,
      signalsWithNoStatus,
      signalsWithStatuses,
    } = addSignalStatuses([...stages], statuses);
    setStagesData(() => ({
      stages: signalsWithStatuses.map(annotateStageWithStatuses),
    }));
    setClassifications({
      entitiesInStepCount,
      signalsWithNoAccess,
      signalsWithNoStatus,
    });
    const sigDetails = signalDetailsObject(statuses);
    if (sigDetails) setSignalsDetails(sigDetails);
  }, [stages, statuses]);

  useEffect(() => {
    if (nerdletState.staging) {
      const { stageId, levelId, stepId, signals = [] } = nerdletState.staging;
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

  useImperativeHandle(
    ref,
    () => ({
      refresh: async () => {
        entitiesGuidsLastState.current = [];
        alertsGuidsLastState.current = [];
        noAccessGuidsLastState.current = [];
        fetchStatuses(guids);
      },
      preload: async (timeBands = [], callback) => {
        const { [SIGNAL_TYPES.ALERT]: alertsGuids = [] } = guids;
        const timeWindow = {
          start: threeDaysAgo(timeBands?.[0]?.start),
          end: timeBands?.[timeBands.length - 1]?.end,
        };
        const key = keyFromTimeWindow(timeWindow);
        const timeWindowCachedAlerts = timeWindowAlertsCache.current.get(key);
        let timeBandsDataArray;
        if (!timeWindowCachedAlerts) {
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

        timeBands.forEach(async (timeWindow, idx) => {
          const { key, alertsStatusesObj } = timeBandsDataArray[idx] || {};
          const timeWindowCachedData = timeBandDataCache.current.get(key);
          if (!timeWindowCachedData) {
            const { [SIGNAL_TYPES.ENTITY]: entitiesGuids = [] } = guids;
            const entitiesStatusesObj = entitiesGuids.length
              ? await fetchEntitiesStatus(entitiesGuids, timeWindow, true)
              : {};
            const timeWindowStatuses = {
              [SIGNAL_TYPES.ENTITY]: entitiesStatusesObj,
              [SIGNAL_TYPES.ALERT]: alertsStatusesObj,
            };
            timeBandDataCache.current.set(key, timeWindowStatuses);
            const { signalsWithStatuses } = addSignalStatuses(
              [...stages],
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
              [...stages],
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
      },
      seek: async (timeWindow) => {
        if (!timeWindow) return;
        playbackTimeWindow.current = timeWindow;
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
      clearPlaybackTimeWindow: () => (playbackTimeWindow.current = null),
    }),
    [fetchStatuses, guids, stages]
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
      value={{ stages: stagesData.stages, updateStagesDataRef }}
    >
      <SignalsContext.Provider value={signalsDetails}>
        <SelectionsContext.Provider value={{ selections, markSelection }}>
          <SignalsClassificationsContext.Provider value={classifications}>
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
                <Button
                  className="button-tertiary-border"
                  variant={Button.VARIANT.TERTIARY}
                  sizeType={Button.SIZE_TYPE.SMALL}
                  iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE}
                  onClick={addStageHandler}
                >
                  Add a stage
                </Button>
              ) : (
                <>
                  <Switch
                    checked={signalExpandOption & SIGNAL_EXPAND.UNHEALTHY_ONLY}
                    label="Unhealthy only"
                    onChange={() =>
                      setSignalExpandOption(
                        (seo) => seo ^ SIGNAL_EXPAND.UNHEALTHY_ONLY
                      )
                    }
                  />
                  <Switch
                    checked={signalExpandOption & SIGNAL_EXPAND.CRITICAL_ONLY}
                    label="Critical only"
                    onChange={() =>
                      setSignalExpandOption(
                        (seo) => seo ^ SIGNAL_EXPAND.CRITICAL_ONLY
                      )
                    }
                  />
                </>
              )}
              {mode === MODES.INLINE && (
                <Switch
                  checked={signalExpandOption & SIGNAL_EXPAND.ALL}
                  label="Expand all steps"
                  onChange={() =>
                    setSignalExpandOption((seo) => seo ^ SIGNAL_EXPAND.ALL)
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
          </SignalsClassificationsContext.Provider>
        </SelectionsContext.Provider>
      </SignalsContext.Provider>
    </StagesContext.Provider>
  );
});

Stages.propTypes = {
  mode: PropTypes.oneOf(Object.values(MODES)),
  saveFlow: PropTypes.func,
};

Stages.displayName = 'Stages';

export default Stages;
