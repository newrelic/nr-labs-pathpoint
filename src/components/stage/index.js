import React, {
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import { Button, HeadingText, Icon, Tooltip } from 'nr1';

import { EmptyBlock, Level, Signal, StageIssuesModal } from '../';
import StageHeader from './header';
import {
  COMPONENTS,
  MODES,
  SIGNAL_EXPAND,
  SIGNAL_TYPES,
  STATUSES,
  UI_CONTENT,
} from '../../constants';

import {
  FlowDispatchContext,
  SelectionsContext,
  SignalsClassificationsContext,
  SignalsContext,
  StagesContext,
} from '../../contexts';
import { FLOW_DISPATCH_COMPONENTS, FLOW_DISPATCH_TYPES } from '../../reducers';

// set statuses in order of most critical to least critical -> 0: critical, 1: warning, 2: success, 3: unknown
const ORDERED_STATUSES = [
  STATUSES.CRITICAL,
  STATUSES.WARNING,
  STATUSES.SUCCESS,
  STATUSES.UNKNOWN,
];
const SUCCESS_STATUS_INDEX = ORDERED_STATUSES.indexOf(STATUSES.SUCCESS);
const CRITICAL_STATUS_INDEX = ORDERED_STATUSES.indexOf(STATUSES.CRITICAL);
const ORDERED_SIGNAL_TYPES = [SIGNAL_TYPES.ENTITY, SIGNAL_TYPES.ALERT];

const Stage = ({
  stageId,
  mode = MODES.INLINE,
  signalExpandOption = 0,
  signalCollapseOption,
  stageIndex = -1,
  isLoading,
  onDragStart,
  onDragOver,
  onDrop,
  saveFlow,
}) => {
  const { stages } = useContext(StagesContext);
  const signalsDetails = useContext(SignalsContext);
  const dispatch = useContext(FlowDispatchContext);
  const { selections } = useContext(SelectionsContext);
  const {
    classifications: {
      signalsWithNoAccess = {},
      signalsWithNoStatus = {},
      tooManyDynamicSignals = {},
    } = {},
  } = useContext(SignalsClassificationsContext);
  const [name, setName] = useState('');
  const [levels, setLevels] = useState([]);
  const [related, setRelated] = useState({});
  const [link, setLink] = useState('');
  const [signals, setSignals] = useState({});
  const [status, setStatus] = useState(STATUSES.UNKNOWN);
  const [tooManySignalsSteps, setTooManySignalsSteps] = useState([]);
  const [missingSignalsSteps, setMissingSignalsSteps] = useState([]);
  const [guidsInSelectedStep, setGuidsInSelectedStep] = useState([]);
  const isDragHandleClicked = useRef(false);
  const dragItemIndex = useRef();
  const dragOverItemIndex = useRef();
  const missingSignalsModal = useRef();
  const tooManySignalsModal = useRef();

  useEffect(() => {
    const stage = (stages || []).find(({ id }) => id === stageId) || {};
    setName(stage.name || '');
    setLevels(stage.levels || []);
    setRelated(stage.related || {});
    setLink(stage.link || '');
    setStatus(stage.status || STATUSES.UNKNOWN);
  }, [stageId, stages]);

  useEffect(
    () =>
      setMissingSignalsSteps(() =>
        Object.keys(signalsWithNoStatus[stageId] || {}).reduce(
          (acc, levelId) =>
            Object.keys(signalsWithNoStatus[stageId][levelId]).reduce(
              (acc, stepId) => [
                ...acc,
                {
                  levelId,
                  stepId,
                  signals: Object.keys(
                    signalsWithNoStatus[stageId][levelId][stepId]
                  ).map((guid) => ({
                    guid,
                    ...signalsWithNoStatus[stageId][levelId][stepId][guid],
                  })),
                },
              ],
              acc
            ),
          []
        )
      ),
    [signalsWithNoStatus]
  );

  useEffect(
    () =>
      setTooManySignalsSteps((tms) =>
        Object.keys(tooManyDynamicSignals[stageId] || {}).reduce(
          (acc, levelId) =>
            Object.keys(tooManyDynamicSignals[stageId][levelId]).reduce(
              (acc, stepId) =>
                acc.some(
                  (existing) =>
                    existing.levelId === levelId && existing.stepId === stepId
                )
                  ? acc
                  : [...acc, { levelId, stepId }],
              acc
            ),
          tms || []
        )
      ),
    [tooManyDynamicSignals]
  );

  useEffect(() => {
    const selGuids = [];
    const sigs = levels.reduce(
      (acc, { steps = [] }) => ({
        ...acc,
        ...steps.reduce((acc, { id, signals = [], excluded, status }) => {
          const isInExcludedStep = excluded === true;
          const isInHealthyStep = status === 'unknown' || status === 'success';
          return {
            ...acc,
            ...signals.reduce((acc, { guid, name, status, type }) => {
              const isInSelectedStep =
                selections.type === COMPONENTS.STEP && selections.id === id;
              if (isInSelectedStep) selGuids.push(guid);
              return {
                ...acc,
                [guid]: {
                  name: signalsDetails[guid]?.name || name,
                  status,
                  guid,
                  type,
                  statusIndex: ORDERED_STATUSES.indexOf(status),
                  typeIndex: ORDERED_SIGNAL_TYPES.indexOf(type),
                  isInSelectedStep,
                  isInExcludedStep,
                  isInHealthyStep,
                },
              };
            }, {}),
          };
        }, {}),
      }),
      {}
    );
    setSignals(sigs);
    setGuidsInSelectedStep(selGuids);
  }, [levels, selections]);

  const SignalsList = memo(() => {
    const expandOption =
      mode === MODES.STACKED && signalExpandOption & SIGNAL_EXPAND.ALL
        ? signalExpandOption ^ SIGNAL_EXPAND.ALL
        : signalExpandOption;

    const sortFactor = guidsInSelectedStep.length ? ORDERED_STATUSES.length : 0;

    return Object.values(signals)
      .filter((s) => {
        switch (expandOption) {
          case SIGNAL_EXPAND.UNHEALTHY_ONLY:
            return (
              !s.isInExcludedStep &&
              !s.isInHealthyStep &&
              s.statusIndex < SUCCESS_STATUS_INDEX
            );
          case SIGNAL_EXPAND.CRITICAL_ONLY:
            return (
              !s.isInExcludedStep &&
              !s.isInHealthyStep &&
              s.statusIndex === CRITICAL_STATUS_INDEX
            );
          case SIGNAL_EXPAND.UNHEALTHY_ONLY | SIGNAL_EXPAND.CRITICAL_ONLY:
            return (
              !s.isInExcludedStep &&
              !s.isInHealthyStep &&
              s.statusIndex === CRITICAL_STATUS_INDEX
            );
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const a1 =
          selections.type === COMPONENTS.STEP &&
          guidsInSelectedStep.some((guid) => guid === a.guid)
            ? a.statusIndex - sortFactor + a.typeIndex * 0.1
            : a.statusIndex + a.typeIndex * 0.1;

        const b1 =
          selections.type === COMPONENTS.STEP &&
          guidsInSelectedStep.some((guid) => guid === b.guid)
            ? b.statusIndex - sortFactor + b.typeIndex * 0.1
            : b.statusIndex + b.typeIndex * 0.1;

        return a1 - b1;
      })
      .map((signal) => (
        <Signal
          key={signal.guid}
          name={signal.name}
          guid={signal.guid}
          type={signal.type}
          status={signal.status}
          isInSelectedStep={signal.isInSelectedStep}
          mode={mode}
        />
      ));
  }, [signals]);
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

  const addLevelHandler = () =>
    dispatch({
      type: FLOW_DISPATCH_TYPES.ADDED,
      component: FLOW_DISPATCH_COMPONENTS.LEVEL,
      componentIds: { stageId },
      saveFlow,
    });

  const addLevel = useMemo(
    () =>
      levels.length ? (
        <Button
          className="button-tertiary-border"
          variant={Button.VARIANT.TERTIARY}
          iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE}
          onClick={addLevelHandler}
        >
          Add a level
        </Button>
      ) : (
        <EmptyBlock
          title={UI_CONTENT.STAGE.NO_LEVELS.TITLE}
          description={UI_CONTENT.STAGE.NO_LEVELS.DESCRIPTION}
          actionButtonText="Add a level"
          onAdd={addLevelHandler}
        />
      ),
    [levels, addLevelHandler]
  );

  const statusIcons = useMemo(() => {
    if (isLoading) return null;

    const si = [];
    if (missingSignalsSteps?.length)
      si.push(
        <Tooltip text={UI_CONTENT.STAGE.MISSING_SIGNALS}>
          <span
            className="notify missing-signals"
            onClick={() => missingSignalsModal.current?.open?.()}
          >
            <Icon type={Icon.TYPE.INTERFACE__STATE__WARNING} />
          </span>
        </Tooltip>
      );
    if (tooManySignalsSteps.length)
      si.push(
        <Tooltip text={UI_CONTENT.STAGE.TOO_MANY_SIGNALS}>
          <span
            className="notify too-many-signals"
            onClick={() => tooManySignalsModal.current?.open?.()}
          >
            <Icon type={Icon.TYPE.INTERFACE__STATE__CRITICAL} />
          </span>
        </Tooltip>
      );
    if (Object.keys(signalsWithNoAccess?.[stageId] || {}).length)
      si.push(
        <Tooltip text={UI_CONTENT.STAGE.NO_ACCESS_SIGNALS}>
          <span className="notify no-access">
            <Icon type={Icon.TYPE.INTERFACE__STATE__UNAVAILABLE} />
          </span>
        </Tooltip>
      );

    return si;
  }, [
    isLoading,
    missingSignalsSteps,
    signalsWithNoAccess,
    tooManySignalsSteps,
  ]);

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
    <>
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
          link={link}
          status={status}
          onUpdate={updateStageHandler}
          onDelete={deleteStageHandler}
          mode={mode}
          onDragHandle={dragHandleHandler}
        />
        <div className="body">
          <div className={`levels ${mode}`}>
            <div className="section-title">
              {stageIndex === 0 ? (
                <>
                  <HeadingText type={HeadingText.TYPE.HEADING_5}>
                    Levels
                  </HeadingText>
                  <Tooltip text={UI_CONTENT.LEVEL.TOOLTIP}>
                    <Icon
                      className="info-icon"
                      type={Icon.TYPE.INTERFACE__INFO__INFO}
                    />
                  </Tooltip>
                </>
              ) : (
                <div className="empty-header"></div>
              )}
              {statusIcons}
            </div>
            <div className={`step-groups ${mode}`}>
              {levels
                .filter(
                  (level) =>
                    mode === MODES.EDIT ||
                    level.steps.reduce(
                      (acc, cur) =>
                        signalExpandOption === SIGNAL_EXPAND.NONE || // no expansion options selected
                        signalExpandOption === SIGNAL_EXPAND.ALL || // expand all signals
                        acc + cur.signals.length
                          ? { ...acc, ...cur }
                          : acc,
                      0
                    )
                )
                .map(({ id }, index) => (
                  <Level
                    key={id}
                    stageId={stageId}
                    levelId={id}
                    order={index + 1}
                    onDragStart={(e) => levelDragStartHandler(e, index)}
                    onDragOver={(e) => levelDragOverHandler(e, index)}
                    onDrop={(e) => levelDropHandler(e)}
                    mode={mode}
                    signalExpandOption={signalExpandOption}
                    signalCollapseOption={signalCollapseOption}
                    saveFlow={saveFlow}
                  />
                ))}
              {mode === MODES.EDIT ? addLevel : null}
            </div>
          </div>
          {mode === MODES.STACKED ? (
            <div className="signals stacked">
              <div className="section-title">
                {stageIndex === 0 ? (
                  <HeadingText type={HeadingText.TYPE.HEADING_5}>
                    Signals
                  </HeadingText>
                ) : (
                  <div className="empty-header"></div>
                )}
              </div>
              <div className="signals-listing">
                <SignalsList />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <StageIssuesModal
        type={StageIssuesModal.TYPES.MISSING_SIGNALS}
        items={missingSignalsSteps}
        stageId={stageId}
        ref={missingSignalsModal}
      />
      <StageIssuesModal
        type={StageIssuesModal.TYPES.TOO_MANY_SIGNALS}
        items={tooManySignalsSteps}
        stageId={stageId}
        ref={tooManySignalsModal}
      />
    </>
  );
};

Stage.propTypes = {
  stageId: PropTypes.string,
  mode: PropTypes.oneOf(Object.values(MODES)),
  signalExpandOption: PropTypes.number,
  signalCollapseOption: PropTypes.bool,
  stageIndex: PropTypes.number,
  isLoading: PropTypes.bool,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  saveFlow: PropTypes.func,
};

export default Stage;
