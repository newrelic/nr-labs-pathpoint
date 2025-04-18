import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { Button, navigation } from 'nr1';

import { EmptyBlock, DeleteConfirmModal, Signal, SignalsGridLayout } from '../';
import StepHeader from './header';
import {
  COMPONENTS,
  MODES,
  SIGNAL_EXPAND,
  SIGNAL_TYPES,
  STATUSES,
  UI_CONTENT,
} from '../../constants';
import {
  FlowContext,
  FlowDispatchContext,
  SelectionsContext,
  SignalsContext,
  StagesContext,
} from '../../contexts';
import { FLOW_DISPATCH_COMPONENTS, FLOW_DISPATCH_TYPES } from '../../reducers';

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
  const { id: flowId } = useContext(FlowContext);
  const { stages, updateStagesDataRef } = useContext(StagesContext);
  const signalsDetails = useContext(SignalsContext);
  const { selections, markSelection } = useContext(SelectionsContext);
  const dispatch = useContext(FlowDispatchContext);
  const [thisStep, setThisStep] = useState();
  const [title, setTitle] = useState();
  const [status, setStatus] = useState(STATUSES.UNKNOWN);
  const [stageName, setStageName] = useState('');
  const [isFaded, setIsFaded] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [deleteModalHidden, setDeleteModalHidden] = useState(true);
  const [signalsListView, setSignalsListView] = useState(false);
  const [hideHealthy, setHideHealthy] = useState(true);
  const [hideSignals, setHideSignals] = useState(false);
  const signalToDelete = useRef({});
  const isDragHandleClicked = useRef(false);

  useEffect(() => {
    const { name, levels = [] } =
      (stages || []).find(({ id }) => id === stageId) || {};
    const { steps = [] } = levels.find(({ id }) => id === levelId) || {};
    const step = steps.find(({ id }) => id === stepId) || {};
    setIsFaded(() => {
      if (selections.type === COMPONENTS.STEP) {
        return selections.id !== step.id;
      } else if (selections.type === COMPONENTS.SIGNAL) {
        return !step.signals?.some(({ guid }) => selections.id === guid);
      }
      return false;
    });
    setIsSelected(
      () => selections.type === COMPONENTS.STEP && selections.id === step.id
    );
    setStageName(name);
    setTitle(step.title);
    setStatus(step.status || STATUSES.UNKNOWN);
    setThisStep(step);
  }, [stageId, levelId, stepId, stages, signals, selections]);

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
        step: {
          id: stepId,
          title,
          signals,
        },
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

  const signalDisplayName = ({ name = '', guid }) => {
    const latestName = signalsDetails?.[guid]?.name;
    if (latestName && latestName !== UI_CONTENT.SIGNAL.DEFAULT_NAME)
      return latestName;
    return name || UI_CONTENT.SIGNAL.DEFAULT_NAME;
  };

  const SignalsGrid = memo(
    () => (
      <SignalsGridLayout
        statuses={signals.map(
          ({
            name,
            guid,
            status = STATUSES.UNKNOWN,
            type = SIGNAL_TYPES.ENTITY,
          } = {}) => ({
            name: signalDisplayName({ name, guid }),
            guid,
            status,
            type,
            isFaded:
              selections.type === COMPONENTS.SIGNAL && selections.id !== guid,
          })
        )}
      />
    ),
    [signals, mode, signalExpandOption]
  );

  SignalsGrid.displayName = 'SignalsGrid';

  const SignalsList = memo(() => {
    if (mode === MODES.EDIT || signalExpandOption === SIGNAL_EXPAND.ALL) {
      return signals.map(({ guid, name, status, type }) => {
        return (
          <Signal
            key={guid}
            guid={guid}
            type={type}
            name={signalDisplayName({ name, guid })}
            onDelete={() => openDeleteModalHandler(guid, name)}
            status={status}
            mode={mode}
          />
        );
      });
    }
    const filteredSignals =
      !hideHealthy ||
      !signals.some((s) => s.status === 'critical' || s.status === 'warning')
        ? signals
        : signals.filter(
            (s) => s.status !== 'success' && s.status !== 'unknown'
          );

    return filteredSignals.map(({ guid, name, status, type }) => {
      return (
        <Signal
          key={guid}
          guid={guid}
          type={type}
          name={signalDisplayName({ name, guid })}
          onDelete={() => openDeleteModalHandler(guid, name)}
          status={status}
          mode={mode}
        />
      );
    });
  }, [signals, mode, signalExpandOption, hideHealthy, signalCollapseOption]);
  SignalsList.displayName = 'SignalsList';

  const handleStepExpandCollapse = (e) => {
    if (mode === MODES.INLINE) {
      e.stopPropagation();
      if (signals.length) setSignalsListView((slw) => !slw);
    }
  };

  const renderButtonText = () => {
    const healthySignalCount = signals.filter(
      (s) => s.status === 'success' || s.status === 'unknown'
    ).length;
    const firstWord = hideHealthy ? 'Show' : 'Hide';

    return `${firstWord} ${healthySignalCount} healthy/unknown signal(s)`;
  };

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
          {signals.length ? (
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
                  <SignalsList />
                </div>
              ) : (
                ''
              )}
            </>
          ) : (
            <div className="edit-signals-list">
              <SignalsList />
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
              <SignalsList />
              {signals.some(
                (s) => s.status === 'success' || s.status === 'unknown'
              ) &&
              signals.some(
                (s) => s.status === 'critical' || s.status === 'warning'
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
                  {renderButtonText()}
                </Button>
              ) : (
                ''
              )}
            </div>
          ) : (
            <div className="grid">
              <SignalsGrid />
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
