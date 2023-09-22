import React, { useCallback, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'nr1';

import Step from '../step';
import IconsLib from '../icons-lib';
import DeleteConfirmModal from '../delete-confirm-modal';
import { MODES, STATUSES } from '../../constants';

const Level = ({
  order = 0,
  steps = [],
  stageName,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  status = STATUSES.UNKNOWN,
  mode = MODES.INLINE,
  stepClickHandler = () => null,
}) => {
  const [deleteModalHidden, setDeleteModalHidden] = useState(true);
  const isDragHandleClicked = useRef(false);
  const dragItemIndex = useRef();
  const dragOverItemIndex = useRef();
  const stepCellsRefs = useRef([]);

  const stepsRows = useMemo(() => {
    if (!steps.length) return [];

    return steps.reduce(
      (acc, { id, title, signals = [], status }, index, arr) => {
        const isLastStep = index + 1 === arr.length;
        const cell = (
          <div
            className={`step-cell ${
              mode === MODES.EDIT
                ? 'edit'
                : mode === MODES.STACKED &&
                  signals.length &&
                  [STATUSES.CRITICAL, STATUSES.WARNING].includes(status)
                ? status
                : ''
            }`}
            key={id || index}
            ref={(el) => (stepCellsRefs.current[index] = el)}
            onClick={() => {
              if (
                mode === MODES.STACKED &&
                signals.length &&
                [STATUSES.CRITICAL, STATUSES.WARNING].includes(status)
              ) {
                stepClickHandler({
                  clickedStepRef: {
                    id: `${order}_${title}`,
                    stageName,
                    stepStatus: status,
                  },
                  clickedStep: stepCellsRefs.current[index],
                });
              }
            }}
          >
            <Step
              title={title}
              signals={signals}
              stageName={stageName}
              level={order}
              onUpdate={(updates) => updateStepHandler(index, updates)}
              onDelete={() => deleteStepHandler(index)}
              onDragStart={(e) => stepDragStartHandler(e, index)}
              onDragOver={(e) => stepDragOverHandler(e, index)}
              onDrop={(e) => stepDropHandler(e)}
              status={status}
              mode={mode}
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

  const deleteHandler = useCallback(() => {
    if (onDelete) onDelete();
    setDeleteModalHidden(true);
  }, []);

  const updateStepHandler = (index, updates = {}) => {
    if (onUpdate) {
      onUpdate({
        steps: steps.map((step, i) =>
          i === index ? { ...step, ...updates } : step
        ),
      });
    }
  };

  const deleteStepHandler = (index) => {
    if (onUpdate) {
      onUpdate({ steps: steps.filter((_, i) => i !== index) });
    }
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
    const itemIndex = dragItemIndex.current;
    const overIndex = dragOverItemIndex.current;
    if (
      !Number.isInteger(itemIndex) ||
      !Number.isInteger(overIndex) ||
      itemIndex === overIndex
    )
      return;
    const updatedSteps = [...steps];
    const item = updatedSteps[itemIndex];
    updatedSteps.splice(itemIndex, 1);
    updatedSteps.splice(overIndex, 0, item);
    if (onUpdate) onUpdate({ steps: updatedSteps });
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
  order: PropTypes.number,
  steps: PropTypes.arrayOf(PropTypes.object),
  stageName: PropTypes.string,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  status: PropTypes.oneOf(Object.values(STATUSES)),
  mode: PropTypes.oneOf(Object.values(MODES)),
  stepClickHandler: PropTypes.func,
};

export default Level;
