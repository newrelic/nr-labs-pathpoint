import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'nr1';

import Step from '../step';
import IconsLib from '../icons-lib';
import DeleteConfirmModal from '../delete-confirm-modal';
import { MODES, STATUSES } from '../../constants';
import { FlowDispatchContext, StagesContext } from '../../contexts';
import { FLOW_DISPATCH_COMPONENTS, FLOW_DISPATCH_TYPES } from '../../reducers';

const Level = ({
  stageId,
  levelId,
  order = 0,
  onDragStart,
  onDragOver,
  onDrop,
  mode = MODES.INLINE,
  saveFlow,
}) => {
  const stages = useContext(StagesContext);
  const dispatch = useContext(FlowDispatchContext);
  const [steps, setSteps] = useState([]);
  const [status, setStatus] = useState(STATUSES.UNKNOWN);
  const [deleteModalHidden, setDeleteModalHidden] = useState(true);
  const isDragHandleClicked = useRef(false);
  const dragItemIndex = useRef();
  const dragOverItemIndex = useRef();

  useEffect(() => {
    const { levels = [] } =
      (stages || []).find(({ id }) => id === stageId) || {};
    const level = levels.find(({ id }) => id === levelId) || {};
    setSteps(level.steps || []);
    setStatus(level.status || STATUSES.UNKNOWN);
  }, [stageId, levelId, stages]);

  const stepsRows = useMemo(() => {
    if (!steps.length) return [];

    return steps.reduce(
      (acc, { id }, index, arr) => {
        const isLastStep = index + 1 === arr.length;
        const cell = (
          <div
            className={`step-cell ${mode === MODES.EDIT ? 'edit' : ''}`}
            key={id}
          >
            <Step
              stageId={stageId}
              levelId={levelId}
              levelOrder={order}
              stepId={id}
              onDragStart={(e) => stepDragStartHandler(e, index)}
              onDragOver={(e) => stepDragOverHandler(e, index)}
              onDrop={(e) => stepDropHandler(e)}
              mode={mode}
              saveFlow={saveFlow}
            />
          </div>
        );
        if (mode === MODES.EDIT) {
          acc.rows.push(
            <div
              className="steps-row cols-1"
              key={`steps_row_${order}_${index}`}
            >
              {cell}
            </div>
          );
        } else {
          acc.cols.push(cell);
          if (index % 3 === 2 || isLastStep) {
            acc.rows.push(
              <div
                className={`steps-row cols-${acc.cols.length}`}
                key={`steps_row_${order}_${index}`}
              >
                {[...acc.cols]}
              </div>
            );
            acc.cols = [];
          }
        }
        return isLastStep ? acc.rows : acc;
      },
      { rows: [], cols: [] }
    );
  }, [steps, mode]);

  const deleteHandler = () => {
    setDeleteModalHidden(true);
    dispatch({
      type: FLOW_DISPATCH_TYPES.DELETED,
      component: FLOW_DISPATCH_COMPONENTS.LEVEL,
      componentIds: { stageId, levelId },
      saveFlow,
    });
  };

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

  const stepDragStartHandler = (e, index) => {
    e.stopPropagation();
    dragItemIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const stepDragOverHandler = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    dragOverItemIndex.current = index;
  };

  const stepDropHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceIndex = dragItemIndex.current;
    const targetIndex = dragOverItemIndex.current;
    dispatch({
      type: FLOW_DISPATCH_TYPES.REORDERED,
      component: FLOW_DISPATCH_COMPONENTS.STEP,
      componentIds: { stageId, levelId },
      updates: { sourceIndex, targetIndex },
      saveFlow,
    });
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  return (
    <div
      className="level"
      draggable={mode === MODES.EDIT}
      onDragStart={dragStartHandler}
      onDragOver={onDragOver}
      onDrop={onDropHandler}
      onDragEnd={dragEndHandler}
    >
      {mode === MODES.EDIT ? (
        <>
          <div className={`order edit ${STATUSES.UNKNOWN}`}>
            {order}
            <span
              className="drag-handle"
              onMouseDown={() => (isDragHandleClicked.current = true)}
              onMouseUp={() => (isDragHandleClicked.current = false)}
            >
              <IconsLib type={IconsLib.TYPES.HANDLE} />
            </span>
            <span
              className="delete-btn"
              onClick={() => setDeleteModalHidden(false)}
            >
              <Icon
                type={Icon.TYPE.INTERFACE__OPERATIONS__CLOSE__V_ALTERNATE}
              />
            </span>
          </div>
          <DeleteConfirmModal
            name={`Level ${order}`}
            type="level"
            hidden={deleteModalHidden}
            onConfirm={deleteHandler}
            onClose={() => setDeleteModalHidden(true)}
          />
        </>
      ) : (
        <div className={`order ${status}`}>{order}</div>
      )}
      <div className="steps">{stepsRows}</div>
    </div>
  );
};

Level.propTypes = {
  stageId: PropTypes.string,
  levelId: PropTypes.string,
  order: PropTypes.number,
  onDelete: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  mode: PropTypes.oneOf(Object.values(MODES)),
  saveFlow: PropTypes.func,
};

export default Level;