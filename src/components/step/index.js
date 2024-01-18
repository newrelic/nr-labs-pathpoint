import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { Button, navigation } from 'nr1';
import { StatusIconsLayout } from '@newrelic/nr-labs-components';

import Signal from '../signal';
import StepHeader from './header';
import DeleteConfirmModal from '../delete-confirm-modal';
import { MODES, STATUSES } from '../../constants';
import {
  FlowContext,
  FlowDispatchContext,
  SignalsContext,
  StagesContext,
} from '../../contexts';
import { FLOW_DISPATCH_COMPONENTS, FLOW_DISPATCH_TYPES } from '../../reducers';

const Step = ({
  stageId,
  levelId,
  levelOrder,
  stepId,
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
  const dispatch = useContext(FlowDispatchContext);
  const [title, setTitle] = useState();
  const [signals, setSignals] = useState([]);
  const [status, setStatus] = useState(STATUSES.UNKNOWN);
  const [stageName, setStageName] = useState('');
  const [deleteModalHidden, setDeleteModalHidden] = useState(true);
  const signalToDelete = useRef({});
  const isDragHandleClicked = useRef(false);

  useEffect(() => {
    const { name, levels = [] } =
      (stages || []).find(({ id }) => id === stageId) || {};
    const { steps = [] } = levels.find(({ id }) => id === levelId) || {};
    const step = steps.find(({ id }) => id === stepId) || {};
    setStageName(name);
    setTitle(step.title);
    setSignals(step.signals || []);
    setStatus(step.status || STATUSES.UNKNOWN);
  }, [stageId, levelId, stepId, stages]);

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
      <StatusIconsLayout
        statuses={signals.map(({ status = STATUSES.UNKNOWN } = {}) => ({
          status,
        }))}
      />
    ),
    [signals]
  );
  SignalsGrid.displayName = 'SignalsGrid';

  const SignalsList = memo(
    () =>
      signals.map(({ guid, name, status }) => (
        <Signal
          key={guid}
          name={signalsDetails[guid]?.name || name}
          onDelete={() => openDeleteModalHandler(guid, name)}
          status={status}
          mode={mode}
        />
      )),
    [signals, mode]
  );
  SignalsList.displayName = 'SignalsList';

  return (
    <div
      className={`step ${status}`}
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
      ) : null}
      <div className="signals">
        {mode === MODES.INLINE ? <SignalsGrid /> : null}
        {mode === MODES.STACKED ? <SignalsList /> : null}
      </div>
    </div>
  );
};

Step.propTypes = {
  stageId: PropTypes.string,
  levelId: PropTypes.string,
  levelOrder: PropTypes.string,
  stepId: PropTypes.string,
  onDelete: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  mode: PropTypes.oneOf(Object.values(MODES)),
  saveFlow: PropTypes.func,
};

export default Step;
