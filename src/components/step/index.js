import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { Button, navigation } from 'nr1';
import SignalsGridLayout from '../signals-grid-layout';

import Signal from '../signal';
import StepHeader from './header';
import DeleteConfirmModal from '../delete-confirm-modal';
import {
  COMPONENTS,
  MODES,
  SIGNAL_EXPAND,
  SIGNAL_TYPES,
  STATUSES,
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
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  mode = MODES.INLINE,
  saveFlow,
}) => {
  const { id: flowId } = useContext(FlowContext);
  const stages = useContext(StagesContext);
  const signalsDetails = useContext(SignalsContext);
  const {
    selections: {
      [COMPONENTS.STAGE]: selectedStage,
      [COMPONENTS.LEVEL]: selectedLevel,
      [COMPONENTS.STEP]: selectedStep,
      [COMPONENTS.SIGNAL]: selectedSignal,
    } = {},
    toggleSelection,
  } = useContext(SelectionsContext);
  const dispatch = useContext(FlowDispatchContext);
  const [title, setTitle] = useState();
  const [status, setStatus] = useState(STATUSES.UNKNOWN);
  const [stageName, setStageName] = useState('');
  const [deleteModalHidden, setDeleteModalHidden] = useState(true);
  const [signalsListView, setSignalsListView] = useState(false);
  const [stepBackgroundIsSet, setStepBackground] = useState(false);
  const signalToDelete = useRef({});
  const isDragHandleClicked = useRef(false);

  useEffect(() => {
    const { name, levels = [] } =
      (stages || []).find(({ id }) => id === stageId) || {};
    const { steps = [] } = levels.find(({ id }) => id === levelId) || {};
    const step = steps.find(({ id }) => id === stepId) || {};
    setStageName(name);
    setTitle(step.title);
    setStatus(step.status || STATUSES.UNKNOWN);

    const clickedSignal = selectedSignal
      ? step.signals.find((signal) => signal.guid === selectedSignal)
      : false;
    setStepBackground(clickedSignal);
  }, [stageId, levelId, stepId, stages, signals, selectedSignal]);

  useEffect(() => {
    setSignalsListView([STATUSES.CRITICAL, STATUSES.WARNING].includes(status));
  }, [status]);

  const updateSignalsHandler = () =>
    navigation.openStackedNerdlet({
      id: 'signal-selection',
      urlState: {
        flowId,
        stageId,
        stageName,
        levelId,
        levelOrder,
        stepId,
        stepTitle: title,
      },
    });

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

  const SignalsGrid = memo(
    () => (
      <SignalsGridLayout
        statuses={signals.map(
          ({
            status = STATUSES.UNKNOWN,
            type = SIGNAL_TYPES.ENTITY,
            guid = '',
            mode,
            stageId,
          } = {}) => ({
            status,
            type,
            guid,
            mode,
            stageId,
            style: {
              opacity: selectedSignal && selectedSignal !== guid ? 0.3 : 1.0,
            },
          })
        )}
      />
    ),
    [signals, mode, signalExpandOption]
  );
  SignalsGrid.displayName = 'SignalsGrid';

  const SignalsList = memo(
    () =>
      signals.map(({ guid, name, status, type }) => (
        <Signal
          key={guid}
          guid={guid}
          type={type}
          name={signalsDetails[guid]?.name || name}
          onDelete={() => openDeleteModalHandler(guid, name)}
          status={status}
          mode={mode}
          stageId={stageId}
        />
      )),
    [signals, mode, signalExpandOption]
  );
  SignalsList.displayName = 'SignalsList';

  const handleStepHeaderClick = () => {
    if (signals.length) {
      setSignalsListView((slw) => !slw);
    }
  };

  const setStepClassName = () => {
    let className = `step ${mode} detail`;

    if (mode === MODES.STACKED && (selectedStep || selectedSignal)) {
      if (selectedStep === stepId || stepBackgroundIsSet) {
        className += ` selected ${status}`;
      } else {
        className += ' faded';
      }
    }

    return className;
  };

  return (
    <div
      className={setStepClassName()}
      onClick={(evt) => {
        evt.stopPropagation();

        if (mode === MODES.INLINE) {
          handleStepHeaderClick();
        } else if (mode === MODES.STACKED) {
          if (
            (selectedStep === stepId && selectedStage === stageId) ||
            (selectedStep !== stepId && selectedStage !== stageId)
          ) {
            toggleSelection(COMPONENTS.STAGE, stageId);
          }
          if (
            (selectedStep === stepId && selectedLevel === levelId) ||
            (selectedStep !== stepId && selectedLevel !== levelId)
          ) {
            toggleSelection(COMPONENTS.LEVEL, levelId);
          }
          if (selectedSignal) {
            toggleSelection(COMPONENTS.SIGNAL, selectedSignal);
          }
          toggleSelection(COMPONENTS.STEP, stepId);
        }
      }}
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
        onDelete={onDelete}
        onDragHandle={dragHandleHandler}
        mode={mode}
        saveFlow={saveFlow}
      />
      {mode === MODES.EDIT ? (
        <>
          <div className="add-signal-btn">
            <Button
              type={Button.TYPE.SECONDARY}
              sizeType={Button.SIZE_TYPE.SMALL}
              iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE}
              onClick={updateSignalsHandler}
            >
              Add a signal
            </Button>
          </div>
          <div className="edit-signals-list">
            <SignalsList />
          </div>
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
            </div>
          ) : (
            <div className="grid">
              <SignalsGrid />
            </div>
          )}
        </div>
      ) : (
        ''
      )}
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
  onDelete: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  mode: PropTypes.oneOf(Object.values(MODES)),
  saveFlow: PropTypes.func,
};

export default Step;
