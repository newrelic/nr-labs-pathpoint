import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { HeadingText } from 'nr1';

import Level from '../level';
import Signal from '../signal';
import StageHeader from './header';
import AddStep from '../add-step';
import { MODES, STATUSES } from '../../constants';
import {
  FlowDispatchContext,
  SignalsContext,
  StagesContext,
} from '../../contexts';
import { FLOW_DISPATCH_COMPONENTS, FLOW_DISPATCH_TYPES } from '../../reducers';

const Stage = ({
  stageId,
  mode = MODES.INLINE,
  onDragStart,
  onDragOver,
  onDrop,
  saveFlow,
}) => {
  const stages = useContext(StagesContext);
  const signalsDetails = useContext(SignalsContext);
  const dispatch = useContext(FlowDispatchContext);
  const [name, setName] = useState('Stage');
  const [levels, setLevels] = useState([]);
  const [related, setRelated] = useState({});
  const [signals, setSignals] = useState({});
  const [status, setStatus] = useState(STATUSES.UNKNOWN);
  const isDragHandleClicked = useRef(false);
  const dragItemIndex = useRef();
  const dragOverItemIndex = useRef();

  useEffect(() => {
    const stage = (stages || []).find(({ id }) => id === stageId) || {};
    setName(stage.name || 'Stage');
    setLevels(stage.levels || []);
    setRelated(stage.related || {});
    setStatus(stage.status || STATUSES.UNKNOWN);
  }, [stageId, stages]);

  useEffect(
    () =>
      setSignals(
        levels.reduce(
          (acc, { steps = [] }) => ({
            ...acc,
            ...steps.reduce(
              (acc, { signals = [] }) => ({
                ...acc,
                ...signals.reduce(
                  (acc, { guid, name, status }) => ({
                    ...acc,
                    [guid]: {
                      name: signalsDetails[guid]?.name || name,
                      status,
                    },
                  }),
                  {}
                ),
              }),
              {}
            ),
          }),
          {}
        )
      ),
    [levels]
  );

  const SignalsList = memo(
    () =>
      Object.keys(signals).map((guid) => {
        const { name, status } = signals[guid];
        return <Signal key={guid} name={name} status={status} />;
      }),
    [signals]
  );
  SignalsList.displayName = 'SignalsList';

  const updateStageHandler = (updates = {}) =>
    dispatch({
      type: FLOW_DISPATCH_TYPES.UPDATED,
      component: FLOW_DISPATCH_COMPONENTS.STAGE,
      componentIds: { stageId },
      updates,
      saveFlow,
    });

  const deleteStageHandler = () =>
    dispatch({
      type: FLOW_DISPATCH_TYPES.DELETED,
      component: FLOW_DISPATCH_COMPONENTS.STAGE,
      componentIds: { stageId },
      saveFlow,
    });

  const dragHandleHandler = (b) => (isDragHandleClicked.current = b);

  const dragStartHandler = (e) => {
    if (isDragHandleClicked.current) {
      if (onDragStart) onDragStart(e);
    } else {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onDropHandler = (e) => {
    if (onDrop) onDrop(e);
    isDragHandleClicked.current = false;
  };

  const dragEndHandler = () => {
    isDragHandleClicked.current = false;
  };

  const levelDragStartHandler = (e, index) => {
    e.stopPropagation();
    dragItemIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const levelDragOverHandler = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    dragOverItemIndex.current = index;
  };

  const levelDropHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceIndex = dragItemIndex.current;
    const targetIndex = dragOverItemIndex.current;
    dispatch({
      type: FLOW_DISPATCH_TYPES.REORDERED,
      component: FLOW_DISPATCH_COMPONENTS.LEVEL,
      componentIds: { stageId },
      updates: { sourceIndex, targetIndex },
      saveFlow,
    });
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  return (
    <div
      className="stage"
      draggable={mode === MODES.EDIT}
      onDragStart={dragStartHandler}
      onDragOver={onDragOver}
      onDrop={onDropHandler}
      onDragEnd={dragEndHandler}
    >
      <StageHeader
        name={name}
        related={related}
        status={status}
        onUpdate={updateStageHandler}
        onDelete={deleteStageHandler}
        mode={mode}
        onDragHandle={dragHandleHandler}
      />
      <div className="body">
        <div className="section-title">
          <HeadingText>Steps</HeadingText>
          {mode === MODES.EDIT ? (
            <AddStep stageId={stageId} saveFlow={saveFlow} />
          ) : null}
        </div>
        <div className="step-groups">
          {levels.map(({ id }, index) => (
            <Level
              key={id}
              stageId={stageId}
              levelId={id}
              order={index + 1}
              onDragStart={(e) => levelDragStartHandler(e, index)}
              onDragOver={(e) => levelDragOverHandler(e, index)}
              onDrop={(e) => levelDropHandler(e)}
              mode={mode}
              saveFlow={saveFlow}
            />
          ))}
        </div>
        {mode === MODES.INLINE ? (
          <>
            <div className="section-title">
              <HeadingText className="title">Signals</HeadingText>
            </div>
            <div className="signals-listing">
              <SignalsList />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

Stage.propTypes = {
  stageId: PropTypes.string,
  mode: PropTypes.oneOf(Object.values(MODES)),
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  saveFlow: PropTypes.func,
};

export default Stage;
