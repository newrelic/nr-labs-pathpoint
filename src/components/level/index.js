import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'nr1';

import Step from '../step';
import IconsLib from '../icons-lib';
import DeleteConfirmModal from '../delete-confirm-modal';
import {
  COMPONENTS,
  MODES,
  SIGNAL_EXPAND,
  SIGNAL_TYPES,
  STATUSES,
} from '../../constants';

import {
  FlowDispatchContext,
  StagesContext,
  SelectionsContext,
} from '../../contexts';

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
  signalExpandOption = SIGNAL_EXPAND.NONE,
}) => {
  const stages = useContext(StagesContext);
  const dispatch = useContext(FlowDispatchContext);
  const {
    selections: {
      [COMPONENTS.LEVEL]: selectedLevel,
      [COMPONENTS.STEP]: selectedStep,
      [COMPONENTS.SIGNAL]: selectedSignal,
    } = {},
  } = useContext(SelectionsContext);
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

    const orderedStatuses = [
      STATUSES.CRITICAL,
      STATUSES.WARNING,
      STATUSES.SUCCESS,
      STATUSES.UNKNOWN,
    ];
    const signalTypes = [SIGNAL_TYPES.ENTITY, SIGNAL_TYPES.ALERT];

    let validStatuses = [...orderedStatuses];

    if (signalExpandOption & SIGNAL_EXPAND.UNHEALTHY_ONLY)
      validStatuses = [STATUSES.CRITICAL, STATUSES.WARNING];

    if (signalExpandOption & SIGNAL_EXPAND.CRITICAL_ONLY)
      validStatuses = [STATUSES.CRITICAL];

    const filteredSteps = steps.filter(
      (step) =>
        (Boolean(signalExpandOption % SIGNAL_EXPAND.ALL) &&
          step.signals.length) ||
        (!(signalExpandOption % SIGNAL_EXPAND.ALL) &&
          validStatuses.includes(step.status))
    );

    return filteredSteps.reduce(
      (acc, { id, signals = [], status }, index, arr) => {
        let startNextRow = false;
        if (
          mode === MODES.INLINE &&
          ((signalExpandOption & SIGNAL_EXPAND.UNHEALTHY_ONLY &&
            [STATUSES.CRITICAL, STATUSES.WARNING].includes(status)) ||
            (signalExpandOption & SIGNAL_EXPAND.CRITICAL_ONLY &&
              status === STATUSES.CRITICAL) ||
            signalExpandOption & SIGNAL_EXPAND.ALL)
        ) {
          startNextRow = true;
        }

        const filteredSortedSignals = signals
          .filter((s) => validStatuses.includes(s.status))
          .sort((a, b) => {
            const a1 =
              a.status === STATUSES.UNKNOWN && a.guid === selectedSignal
                ? 1.5 + signalTypes.indexOf(a.type) * 0.1
                : orderedStatuses.indexOf(a.status) +
                  signalTypes.indexOf(a.type) * 0.1;

            const b1 =
              b.status === STATUSES.UNKNOWN && b.guid === selectedSignal
                ? 1.5 + signalTypes.indexOf(b.type) * 0.1
                : orderedStatuses.indexOf(b.status) +
                  signalTypes.indexOf(b.type) * 0.1;

            return a1 - b1;
          });

        const isLastStep = index + 1 === arr.length;

        const setStepCellClassName = () => {
          let className = 'step-cell';

          if (mode === MODES.EDIT) {
            className += ' edit';
          } else if (mode === MODES.STACKED) {
            if (
              [STATUSES.SUCCESS, STATUSES.UNKNOWN].includes(status) &&
              ((selectedStep && id === selectedStep) ||
                filteredSortedSignals.find(
                  ({ guid }) => guid === selectedSignal
                ))
            ) {
              className += ' healthy';
            }
            className += ` ${status}`;
          }

          return className;
        };

        const cell = (
          <div key={id} className={setStepCellClassName()}>
            <Step
              stageId={stageId}
              levelId={levelId}
              levelOrder={order}
              stepId={id}
              signals={filteredSortedSignals}
              signalExpandOption={signalExpandOption}
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
          if (
            (signalExpandOption & SIGNAL_EXPAND.UNHEALTHY_ONLY &&
              !['critical', 'warning'].includes(status)) ||
            (signalExpandOption & SIGNAL_EXPAND.CRITICAL_ONLY &&
              status !== 'critical')
          ) {
            if (mode === MODES.STACKED && acc.cols.length) {
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
            return isLastStep ? acc.rows : acc;
          }

          acc.cols.push(cell);

          if (acc.cols.length === 3) startNextRow = true;
          if (isLastStep) startNextRow = true;
          if (mode === MODES.INLINE) {
            if (['critical', 'warning'].includes(status)) startNextRow = true;
            if (
              !isLastStep &&
              ['critical', 'warning'].includes(arr[index + 1].status)
            ) {
              startNextRow = true;
            }
          }

          if (startNextRow) {
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
  }, [steps, mode, signalExpandOption, selectedSignal, selectedStep]);

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

  const setLevelClassName = () => {
    const shouldLevelBeFaded = selectedSignal
      ? !steps.reduce(
          (acc, { signals }) =>
            acc |
            signals.reduce((acc, { guid }) => {
              return Boolean(acc | (guid === selectedSignal));
            }, false),
          false
        )
      : false;

    let className = `order ${status}`;

    className += `${
      mode === MODES.STACKED &&
      (shouldLevelBeFaded || (selectedLevel && selectedLevel !== levelId))
        ? ' faded'
        : ''
    }`;

    return className;
  };

  return mode === MODES.EDIT || stepsRows.length ? (
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
        <div className={setLevelClassName()}>{order}</div>
      )}
      <div className="steps">{stepsRows}</div>
    </div>
  ) : (
    ''
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
  signalExpandOption: PropTypes.number,
};

export default Level;
