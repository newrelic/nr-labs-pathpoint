import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import {
  HeadingText,
  Icon,
  LineChart,
  Link,
  NrqlQuery,
  Tooltip,
  navigation,
} from 'nr1';
import { useSidebar } from '../../contexts';

import Level from '../level';
import Signal from '../signal';
import StageHeader from './header';
import AddStep from '../add-step';
import { MODES, STATUSES, SIGNAL_EXPAND } from '../../constants';

const Stage = ({
  name = 'Stage',
  levels = [],
  related = {},
  status = STATUSES.UNKNOWN,
  mode = MODES.INLINE,
  signalExpandOption = SIGNAL_EXPAND.NONE,
  selectedStep = {},
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  stepClickHandler = () => null,
  previousGuid = null,
  selectedSignal = '',
  setSelectedSignal = () => null,
}) => {
  const [signals, setSignals] = useState({});
  const isDragHandleClicked = useRef(false);
  const dragItemIndex = useRef();
  const dragOverItemIndex = useRef();
  const { openSidebar, closeSidebar } = useSidebar();

  useEffect(
    () =>
      setSignals(
        levels.reduce((acc, { steps = [] }, levelIndex) => {
          steps.forEach(
            ({ signals = [], title: stepTitle, status: stepStatus }) => {
              signals.forEach(({ guid, name, status, nrql, accountId }) => {
                if (!acc[guid]) {
                  acc[guid] = {
                    guid,
                    accountId,
                    name,
                    status,
                    nrql,
                    stepStatus,
                    references: [],
                    selected: guid === previousGuid.current,
                  };
                }
                acc[guid].references.push(`${levelIndex + 1}_${stepTitle}`);
              });
            }
          );
          return acc;
        }, {})
      ),
    [levels, selectedSignal]
  );

  const StageSignalsList = memo(() => {
    const orderedStatuses = [
      STATUSES.CRITICAL,
      STATUSES.WARNING,
      STATUSES.SUCCESS,
      STATUSES.UNKNOWN,
    ];
    return Object.values(signals)
      .filter((s) => {
        if (signalExpandOption & SIGNAL_EXPAND.CRITICAL_ONLY) {
          return (
            orderedStatuses.indexOf(s.status) ===
            orderedStatuses.indexOf(STATUSES.CRITICAL)
          );
        } else if (signalExpandOption & SIGNAL_EXPAND.UNHEALTHY_ONLY) {
          return (
            orderedStatuses.indexOf(s.status) <
            orderedStatuses.indexOf(STATUSES.SUCCESS)
          );
        } else if (signalExpandOption === SIGNAL_EXPAND.NONE) {
          return true;
        } else return false;
      })
      .sort((a, b) => {
        const a1 =
          a.status === STATUSES.UNKNOWN &&
          a.references.includes(selectedStep.id)
            ? 1.5
            : orderedStatuses.indexOf(a.status);

        const b1 =
          b.status === STATUSES.UNKNOWN &&
          b.references.includes(selectedStep.id)
            ? 1.5
            : orderedStatuses.indexOf(b.status);

        return a1 - b1;
      })
      .map((signal, i) => {
        return (
          <Signal
            key={i}
            name={signal.name}
            status={signal.status}
            accountId={signal.accountId}
            nrql={signal.nrql}
            mode={mode}
            grayed={
              name !== selectedStep.stageName ||
              (name === selectedStep.stageName &&
                signal.references.find((ref) => ref === selectedStep.id))
                ? ''
                : 'grayed'
            }
            guid={signal.guid}
            showSignalDetail={showSignalDetail}
            selected={signal.selected}
          />
        );
      });
  }, [signals]);
  StageSignalsList.displayName = 'StageSignalsList';

  const showSignalDetail = useCallback((guid) => {
    if (selectedSignal && signals[selectedSignal]) {
      signals[selectedSignal].selected = false;
    }

    if (signals[guid] && selectedSignal !== guid) {
      signals[guid].selected = true;
    }

    setSelectedSignal((ss) => (ss === guid ? '' : guid));

    const currentSignal = signals[guid];

    if (previousGuid.current === guid) {
      previousGuid.current = null;
      setSelectedSignal('');
      closeSidebar();
    } else {
      previousGuid.current = guid;
      openSidebar({
        content: (
          <div className="signal-sidebar">
            <HeadingText
              className="signal-label"
              type={HeadingText.TYPE.HEADING_6}
            >
              SIGNAL:
            </HeadingText>
            <HeadingText
              className="signal-title"
              type={HeadingText.TYPE.HEADING_3}
            >
              {currentSignal?.name}
            </HeadingText>
            <HeadingText
              className="account-info"
              type={HeadingText.TYPE.HEADING_5}
            >
              Account | {currentSignal.accountId}
            </HeadingText>
            <Link
              className="detail-link"
              onClick={() => navigation.openStackedEntity(guid)}
            >
              View full entity details
            </Link>
            <HeadingText type={HeadingText.TYPE.HEADING_5}>
              <br />
              <span className="signal-name">{currentSignal.name}</span>
              <span className="signal-info">{' is reporting '}</span>
              <span className={`signal-status ${currentSignal.status}`}>
                {['critical', 'warning'].includes(currentSignal.status)
                  ? 'blow threshold'
                  : currentSignal.status === 'success'
                  ? 'success'
                  : 'unknown'}
              </span>
              <hr />
            </HeadingText>
            <NrqlQuery
              accountIds={[currentSignal.accountId]}
              query={`${currentSignal.nrql} TIMESERIES`}
            >
              {({ data }) => {
                if (data) {
                  data.forEach(
                    ({ metadata }) =>
                      (metadata.color = STATUSES[currentSignal.status])
                  );
                }
                return <LineChart data={data} />;
              }}
            </NrqlQuery>
          </div>
        ),
        status: currentSignal.status,
      });
    }
  });

  const updateStageHandler = (updates = {}) => {
    if (onUpdate) onUpdate({ name, levels, related, ...updates });
  };

  const deleteLevelHandler = (index) => {
    if (onUpdate)
      onUpdate({
        name,
        related,
        levels: levels.filter((_, i) => i !== index),
      });
  };

  const updateLevelHandler = (index, updates = {}) =>
    updateStageHandler({
      levels: levels.map((level, i) =>
        i === index ? { ...level, ...updates } : level
      ),
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
    const itemIndex = dragItemIndex.current;
    const overIndex = dragOverItemIndex.current;
    if (
      !Number.isInteger(itemIndex) ||
      !Number.isInteger(overIndex) ||
      itemIndex === overIndex
    )
      return;
    const updatedLevels = [...levels];
    const item = updatedLevels[itemIndex];
    updatedLevels.splice(itemIndex, 1);
    updatedLevels.splice(overIndex, 0, item);
    if (onUpdate) onUpdate({ name, related, levels: updatedLevels });
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
        onDelete={onDelete}
        mode={mode}
        onDragHandle={dragHandleHandler}
      />
      <div className="body">
        <div className="levels-title">
          <HeadingText type={HeadingText.TYPE.HEADING_5}>Levels</HeadingText>
          <Tooltip
            text={
              'Collection of potential paths a user may traverse through this stage'
            }
          >
            <Icon
              className="info-icon"
              type={Icon.TYPE.INTERFACE__INFO__INFO}
            />
          </Tooltip>
          {mode === MODES.EDIT ? (
            <AddStep levels={levels} onUpdate={updateStageHandler} />
          ) : null}
        </div>
        <div className={`step-groups ${mode}`}>
          {levels
            .filter((level) =>
              level.steps.reduce(
                (acc, cur) =>
                  signalExpandOption === SIGNAL_EXPAND.NONE || // no expansion options selected
                  signalExpandOption === SIGNAL_EXPAND.ALL || // expand all signals
                  acc + cur.signals.length,
                0
              )
            )
            .map(({ id, steps, status }, index) => (
              <Level
                key={id}
                order={index + 1}
                steps={steps}
                stageName={name}
                status={status}
                mode={mode}
                onUpdate={(updates) => updateLevelHandler(index, updates)}
                onDelete={() => deleteLevelHandler(index)}
                onDragStart={(e) => levelDragStartHandler(e, index)}
                onDragOver={(e) => levelDragOverHandler(e, index)}
                onDrop={(e) => levelDropHandler(e)}
                stepClickHandler={stepClickHandler}
                showSignalDetail={showSignalDetail}
                signalExpandOption={signalExpandOption}
                selectedSignal={selectedSignal}
              />
            ))}
        </div>
        {mode === MODES.STACKED ? (
          <div className="signals stacked">
            <div className="signals-title">
              <HeadingText type={HeadingText.TYPE.HEADING_5}>
                Signals
              </HeadingText>
            </div>
            <div className="signals-listing">
              <StageSignalsList />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

Stage.propTypes = {
  name: PropTypes.string,
  levels: PropTypes.arrayOf(PropTypes.object),
  related: PropTypes.shape({
    target: PropTypes.bool,
    source: PropTypes.bool,
  }),
  status: PropTypes.oneOf(Object.values(STATUSES)),
  mode: PropTypes.oneOf(Object.values(MODES)),
  signalExpandOption: PropTypes.number,
  selectedStep: PropTypes.object,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  stepClickHandler: PropTypes.func,
  previousGuid: PropTypes.object,
  selectedSignal: PropTypes.string,
  setSelectedSignal: PropTypes.func,
};

export default Stage;
