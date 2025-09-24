import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import { Button, navigation, useEntitySearchQuery } from 'nr1';

import SignalsGrid from './signals-grid';
import SignalsList from './signals-list';
import StepHeader from './header';
import { EmptyBlock, DeleteConfirmModal } from '../';
import {
  FlowContext,
  FlowDispatchContext,
  SelectionsContext,
  SignalsContext,
  StagesContext,
} from '../../contexts';
import { FLOW_DISPATCH_COMPONENTS, FLOW_DISPATCH_TYPES } from '../../reducers';
import {
  ALERTS_DOMAIN_TYPE_NRQL,
  COMPONENTS,
  MAX_ENTITIES_IN_STEP,
  MODES,
  OK_STATUSES,
  SIGNAL_EXPAND,
  SIGNAL_TYPES,
  SKIP_ENTITY_TYPES_NRQL,
  STATUSES,
  UI_CONTENT,
  UNHEALTHY_STATUSES,
} from '../../constants';

const Step = ({
  stageId,
  levelId,
  levelOrder,
  stepId,
  signals = [],
  signalExpandOption = SIGNAL_EXPAND.NONE,
  signalCollapseOption,
  onDragStart,
  onDragOver,
  onDrop,
  mode = MODES.INLINE,
  saveFlow,
}) => {
  const { id: flowId, stages: flowStages } = useContext(FlowContext);
  const { stages, updateStagesDataRef, setDynamicEntities, setDynamicAlerts } =
    useContext(StagesContext);
  const { selections = {}, markSelection } = useContext(SelectionsContext);
  const dispatch = useContext(FlowDispatchContext);
  const [thisStep, setThisStep] = useState();
  const [status, setStatus] = useState(STATUSES.UNKNOWN);
  const [stageName, setStageName] = useState('');
  const [isFaded, setIsFaded] = useState(false);
  const [deleteModalHidden, setDeleteModalHidden] = useState(true);
  const [signalsListView, setSignalsListView] = useState(false);
  const [hideHealthy, setHideHealthy] = useState(true);
  const [hideSignals, setHideSignals] = useState(false);
  const [entitiesQuery, setEntitiesQuery] = useState('');
  const [alertsQuery, setAlertsQuery] = useState('');
  const signalsDetails = useContext(SignalsContext);
  const signalToDelete = useRef({});
  const isDragHandleClicked = useRef(false);
  const dynamicQueries = useRef({});
  const { data: { entities: dynamicEntities = [] } = {} } =
    useEntitySearchQuery({
      filters: `${SKIP_ENTITY_TYPES_NRQL} AND ${entitiesQuery}`,
      limit: entitiesQuery ? MAX_ENTITIES_IN_STEP + 1 : 0,
    });
  const { data: { entities: dynamicAlerts = [] } = {} } = useEntitySearchQuery({
    filters: `${ALERTS_DOMAIN_TYPE_NRQL} AND ${alertsQuery}`,
    limit: alertsQuery ? MAX_ENTITIES_IN_STEP + 1 : 0,
  });

  useEffect(() => {
    const { name: stgName, levels = [] } =
      (stages || []).find(({ id }) => id === stageId) || {};
    const { steps = [] } = levels.find(({ id }) => id === levelId) || {};
    const { queries = [], ...step } =
      steps.find(({ id }) => id === stepId) || {};
    [SIGNAL_TYPES.ENTITY, SIGNAL_TYPES.ALERT].forEach((type) => {
      const { query, id, included } =
        queries.find(({ type: qType }) => qType === type) || {};
      if (!query) return;
      dynamicQueries.current = {
        ...dynamicQueries.current,
        [type]: { queryId: id, included },
      };
      if (type === SIGNAL_TYPES.ENTITY) {
        setEntitiesQuery(query);
      } else if (type === SIGNAL_TYPES.ALERT) {
        setAlertsQuery(query);
      }
    });
    setStageName(stgName);
    setStatus(step.status || STATUSES.UNKNOWN);
  }, [stageId, levelId, stepId, stages]);

  useEffect(
    () =>
      setIsFaded(() => {
        if (selections.type === COMPONENTS.STEP) {
          return selections.id !== stepId;
        } else if (selections.type === COMPONENTS.SIGNAL) {
          return !signals?.some(({ guid }) => selections.id === guid);
        }
        return false;
      }),
    [signals, selections, stepId]
  );

  useEffect(() => {
    if (!flowStages || !stageId || !levelId || !stepId) return;
    const { levels = [] } =
      (flowStages || []).find(({ id }) => id === stageId) || {};
    const { steps = [] } = levels.find(({ id }) => id === levelId) || {};
    const currentStep = steps.find(({ id }) => id === stepId);
    if (currentStep) setThisStep(currentStep);
  }, [flowStages, stageId, levelId, stepId]);

  useEffect(() => {
    if (
      !stepId ||
      dynamicEntities.length > MAX_ENTITIES_IN_STEP ||
      !setDynamicEntities
    )
      return;
    setDynamicEntities((des) => ({
      ...des,
      [stepId]: dynamicEntities.map(({ guid, name }) => ({
        guid,
        name,
        type: SIGNAL_TYPES.ENTITY,
        ...(dynamicQueries.current[SIGNAL_TYPES.ENTITY] || {}),
      })),
    }));
  }, [stepId, dynamicEntities]);

  useEffect(() => {
    if (
      !stepId ||
      dynamicAlerts.length > MAX_ENTITIES_IN_STEP ||
      !setDynamicAlerts
    )
      return;
    setDynamicAlerts((das) => ({
      ...das,
      [stepId]: dynamicAlerts.map(({ guid, name }) => ({
        guid,
        name,
        type: SIGNAL_TYPES.ALERT,
        ...(dynamicQueries.current[SIGNAL_TYPES.ALERT] || {}),
      })),
    }));
  }, [stepId, dynamicAlerts]);

  useEffect(() => {
    setSignalsListView([STATUSES.CRITICAL, STATUSES.WARNING].includes(status));
  }, [status]);

  useEffect(() => {
    if (signalCollapseOption) {
      setHideSignals(false);
    }
  }, [signalCollapseOption]);

  const updateSignalsHandler = (e) => {
    e.stopPropagation();
    if (updateStagesDataRef) updateStagesDataRef();
    navigation.openStackedNerdlet({
      id: 'signal-selection',
      urlState: {
        flowId,
        stageId,
        stageName,
        levelId,
        levelOrder,
        step: thisStep,
      },
    });
  };

  const openDeleteModalHandler = (guid, name) => {
    signalToDelete.current = { guid, name };
    setDeleteModalHidden(false);
  };

  const deleteSignalHandler = () => {
    const { guid: signalId } = signalToDelete.current;
    dispatch({
      type: FLOW_DISPATCH_TYPES.DELETED,
      component: FLOW_DISPATCH_COMPONENTS.SIGNAL,
      componentIds: { stageId, levelId, stepId, signalId },
      saveFlow,
    });
  };

  const closeDeleteModalHandler = () => {
    signalToDelete.current = {};
    setDeleteModalHidden(true);
  };

  const dragHandleHandler = (b) => (isDragHandleClicked.current = b);

  const dragStartHandler = (e) => {
    if (isDragHandleClicked.current) {
      if (onDragStart) onDragStart(e);
    } else {
      e.preventDefault();
    }
  };

  const onDropHandler = (e) => {
    if (onDrop) onDrop(e);
    isDragHandleClicked.current = false;
  };

  const dragEndHandler = () => {
    isDragHandleClicked.current = false;
  };

  const signalDisplayName = useCallback(
    ({ name = '', guid }) => {
      const latestName = signalsDetails?.[guid]?.name;
      if (latestName && latestName !== UI_CONTENT.SIGNAL.DEFAULT_NAME)
        return latestName;
      return name || UI_CONTENT.SIGNAL.DEFAULT_NAME;
    },
    [signalsDetails]
  );

  const isSelected = useMemo(
    () => selections.type === COMPONENTS.STEP && selections.id === stepId,
    [selections, stepId]
  );

  const showHideOkText = useMemo(
    () =>
      `${hideHealthy ? 'Show' : 'Hide'} ${
        signals.filter(({ status }) => OK_STATUSES.includes(status))?.length
      } healthy/unknown signal(s)`,
    [hideHealthy, signals]
  );

  const handleStepExpandCollapse = (e) => {
    if (mode === MODES.INLINE) {
      e.stopPropagation();
      if (signals.length) setSignalsListView((slw) => !slw);
    }
  };

  const queriesWithResults = useMemo(
    () =>
      (thisStep?.queries || []).map((query) => {
        if (query.type === SIGNAL_TYPES.ENTITY)
          return {
            ...query,
            results: dynamicEntities,
          };
        if (query.type === SIGNAL_TYPES.ALERT)
          return {
            ...query,
            results: dynamicAlerts,
          };
        return query;
      }),
    [thisStep, dynamicEntities, dynamicAlerts]
  );

  return (
    <div
      className={`step ${mode === MODES.STACKED ? 'stacked' : ''} ${
        isSelected || (selections.type === COMPONENTS.SIGNAL && !isFaded)
          ? 'selected'
          : ''
      } ${[MODES.STACKED, MODES.INLINE].includes(mode) ? status : ''} ${
        isFaded ? 'faded' : ''
      }`}
      draggable={mode === MODES.EDIT}
      onDragStart={dragStartHandler}
      onDragOver={onDragOver}
      onDrop={onDropHandler}
      onDragEnd={dragEndHandler}
    >
      <StepHeader
        stageId={stageId}
        levelId={levelId}
        stepId={stepId}
        step={thisStep}
        onDragHandle={dragHandleHandler}
        markSelection={markSelection}
        mode={mode}
        saveFlow={saveFlow}
        isStepExpanded={signalsListView}
        onStepExpandCollapse={handleStepExpandCollapse}
      />
      {mode === MODES.EDIT ? (
        <>
          {thisStep?.signals?.length || thisStep?.queries?.length ? (
            <div className="add-signal-btn">
              <Button
                className="button-tertiary-border"
                variant={Button.VARIANT.TERTIARY}
                sizeType={Button.SIZE_TYPE.SMALL}
                iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE}
                onClick={updateSignalsHandler}
              >
                Update signals
              </Button>
            </div>
          ) : (
            <EmptyBlock
              title={UI_CONTENT.STEP.NO_SIGNALS.TITLE}
              description={UI_CONTENT.STEP.NO_SIGNALS.DESCRIPTION}
              actionButtonText="Add signals"
              onAdd={updateSignalsHandler}
            />
          )}
          {signalCollapseOption && signals.length > 0 ? (
            <>
              <Button
                className="show-signals-btn"
                iconType={
                  !hideSignals
                    ? Button.ICON_TYPE.INTERFACE__CHEVRON__CHEVRON_RIGHT
                    : Button.ICON_TYPE.INTERFACE__CHEVRON__CHEVRON_BOTTOM
                }
                ariaLabel="step-signal-collapse-edit-mode"
                variant={Button.VARIANT.TERTIARY}
                spacingType={[Button.SPACING_TYPE.OMIT]}
                sizeType={Button.SIZE_TYPE.SMALL}
                onClick={() =>
                  setHideSignals((prevHideSignals) => !prevHideSignals)
                }
              >
                {`${!hideSignals ? 'Show' : 'Hide'} ${
                  signals.length
                } signal(s)`}
              </Button>
              {hideSignals ? (
                <div className="edit-signals-list">
                  <SignalsList
                    signals={thisStep?.signals || []}
                    queries={queriesWithResults}
                    mode={mode}
                    signalExpandOption={signalExpandOption}
                    hideHealthy={hideHealthy}
                    signalDisplayName={signalDisplayName}
                    openDeleteModalHandler={openDeleteModalHandler}
                  />
                </div>
              ) : (
                ''
              )}
            </>
          ) : (
            <div className="edit-signals-list">
              <SignalsList
                signals={thisStep?.signals || []}
                queries={queriesWithResults}
                mode={mode}
                signalExpandOption={signalExpandOption}
                hideHealthy={hideHealthy}
                signalDisplayName={signalDisplayName}
                openDeleteModalHandler={openDeleteModalHandler}
              />
            </div>
          )}
          <DeleteConfirmModal
            name={signalToDelete.current.name}
            hidden={deleteModalHidden}
            onConfirm={deleteSignalHandler}
            onClose={closeDeleteModalHandler}
          />
        </>
      ) : mode === MODES.INLINE ? (
        <div className="signals inline">
          {Boolean(signalExpandOption & SIGNAL_EXPAND.ALL) ||
          signalsListView ? (
            <div className="list">
              <SignalsList
                signals={signals}
                mode={mode}
                signalExpandOption={signalExpandOption}
                hideHealthy={hideHealthy}
                signalDisplayName={signalDisplayName}
                openDeleteModalHandler={openDeleteModalHandler}
              />
              {signals.some(({ status }) => OK_STATUSES.includes(status)) &&
              signals.some(({ status }) =>
                UNHEALTHY_STATUSES.includes(status)
              ) &&
              signalExpandOption !== SIGNAL_EXPAND.ALL ? (
                <Button
                  className="show-healthy-btn"
                  iconType={
                    hideHealthy
                      ? Button.ICON_TYPE.INTERFACE__CHEVRON__CHEVRON_RIGHT
                      : Button.ICON_TYPE.INTERFACE__CHEVRON__CHEVRON_TOP
                  }
                  ariaLabel="Expand/collapse signals"
                  variant={Button.VARIANT.TERTIARY}
                  onClick={() =>
                    setHideHealthy((prevHideHealthy) => !prevHideHealthy)
                  }
                >
                  {showHideOkText}
                </Button>
              ) : (
                ''
              )}
            </div>
          ) : (
            <div className="grid">
              <SignalsGrid
                signals={signals}
                selections={selections}
                signalDisplayName={signalDisplayName}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

Step.propTypes = {
  stageId: PropTypes.string,
  levelId: PropTypes.string,
  levelOrder: PropTypes.string,
  stepId: PropTypes.string,
  signals: PropTypes.array,
  signalExpandOption: PropTypes.number,
  signalCollapseOption: PropTypes.bool,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  mode: PropTypes.oneOf(Object.values(MODES)),
  saveFlow: PropTypes.func,
};

export default Step;
