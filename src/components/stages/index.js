import React, {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  HeadingText,
  Icon,
  Switch,
  Tooltip,
  useNerdletState,
} from 'nr1';

import { EmptyBlock, SignalDetailSidebar, Stage, StepDetailSidebar } from '../';
import { FLOW_DISPATCH_COMPONENTS, FLOW_DISPATCH_TYPES } from '../../reducers';
import { useSignalsManager } from '../../hooks';
import {
  AppContext,
  FlowContext,
  FlowDispatchContext,
  PlaybackContext,
  SelectionsContext,
  SignalsClassificationsContext,
  SignalsContext,
  StagesContext,
  useSidebar,
} from '../../contexts';
import { MODES, SIGNAL_EXPAND, COMPONENTS, UI_CONTENT } from '../../constants';

const Stages = forwardRef(
  ({ mode = MODES.INLINE, setIsLoading, saveFlow }, ref) => {
    const { refreshInterval, stages = [] } = useContext(FlowContext);
    const dispatch = useContext(FlowDispatchContext);
    const { accounts, debugMode } = useContext(AppContext);
    const [stagesData, setStagesData] = useState({ stages });
    const [signalsDetails, setSignalsDetails] = useState({});
    const [selections, setSelections] = useState({});
    const [classifications, setClassifications] = useState({});
    const [signalExpandOption, setSignalExpandOption] = useState(0); // bitwise: (00000001) = unhealthy signals ;; (00000010) = critical signals ;; (00000100)= all signals
    const [signalCollapseOption, setSignalCollapseOption] = useState(false);
    const dragItemIndex = useRef();
    const dragOverItemIndex = useRef();
    const stagesDataRef = useRef(stages);
    const playbackTimeWindow = useRef(null);
    const { openSidebar, closeSidebar } = useSidebar();
    const [nerdletState, setNerdletState] = useNerdletState();
    const {
      statuses,
      refresh,
      preload,
      seek,
      clearPlaybackTimeWindow,
      currentPlaybackTimeWindow,
    } = useSignalsManager({
      stages,
      mode,
      accounts,
      debugMode,
      refreshInterval,
      setIsLoading,
      setStagesData,
      setSignalsDetails,
      setClassifications,
    });

    useEffect(() => {
      if (nerdletState.staging) {
        const {
          stageId,
          levelId,
          stepId,
          signals = [],
          queries = [],
        } = nerdletState.staging;
        const updates = (stagesDataRef.current || []).reduce(
          (acc, stage) =>
            stage.id === stageId
              ? {
                  ...stage,
                  levels: (stage.levels || []).map((level) =>
                    level.id === levelId
                      ? {
                          ...level,
                          steps: (level.steps || []).map((step) =>
                            step.id === stepId
                              ? {
                                  ...step,
                                  signals,
                                  queries,
                                }
                              : step
                          ),
                        }
                      : level
                  ),
                }
              : acc,
          null
        );
        if (updates)
          dispatch({
            type: FLOW_DISPATCH_TYPES.UPDATED,
            component: FLOW_DISPATCH_COMPONENTS.STAGE,
            componentIds: { stageId },
            updates,
            saveFlow,
          });
        setNerdletState({ staging: false });
      }
    }, [nerdletState.staging]);

    useEffect(() => {
      setSignalExpandOption(nerdletState.signalExpandOption);
    }, [nerdletState.signalExpandOption]);

    useEffect(() => {
      if (selections.type === COMPONENTS.SIGNAL && selections.id) {
        openSidebar({
          content: (
            <SignalDetailSidebar
              guid={selections.id}
              name={selections.data?.name}
              type={selections.data?.type}
              status={selections.data?.status}
              data={statuses[selections.data?.type]?.[selections.id]}
              timeWindow={playbackTimeWindow.current}
            />
          ),
          status: selections.data?.status,
          onClose: closeSidebarHandler,
        });
      } else if (selections.type === COMPONENTS.STEP && selections.id) {
        const { stageId, levelId } = selections.data || {};
        const { levels = [] } =
          (stagesData.stages || []).find(({ id }) => id === stageId) || {};
        const { steps = [] } = levels.find(({ id }) => id === levelId) || {};
        const step = steps.find(({ id }) => id === selections.id) || {};
        if (step)
          openSidebar({
            content: <StepDetailSidebar step={step} />,
            status: step?.status,
            onClose: closeSidebarHandler,
          });
      } else {
        closeSidebar();
      }
    }, [selections, statuses, stagesData, closeSidebarHandler]);

    const markSelection = useCallback((type, id, data) => {
      if (!type || !id) return;
      setSelections((sel) =>
        sel.type === type && sel.id === id ? {} : { type, id, data }
      );
    }, []);

    const closeSidebarHandler = useCallback(() => setSelections({}), []);

    const updateStagesDataRef = useCallback(() => {
      stagesDataRef.current = [...stages];
    }, [stages]);

    useImperativeHandle(
      ref,
      () => ({
        refresh,
        preload,
        seek,
        clearPlaybackTimeWindow,
      }),
      [preload, refresh, seek, clearPlaybackTimeWindow]
    );

    const addStageHandler = () =>
      dispatch({
        type: FLOW_DISPATCH_TYPES.ADDED,
        component: FLOW_DISPATCH_COMPONENTS.STAGE,
        saveFlow,
      });

    const dragStartHandler = (e, index) => {
      dragItemIndex.current = index;
      e.dataTransfer.effectAllowed = 'move';
    };

    const dragOverHandler = (e, index) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dragOverItemIndex.current = index;
    };

    const dropHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const sourceIndex = dragItemIndex.current;
      const targetIndex = dragOverItemIndex.current;
      dispatch({
        type: FLOW_DISPATCH_TYPES.REORDERED,
        component: FLOW_DISPATCH_COMPONENTS.STAGE,
        updates: { sourceIndex, targetIndex },
        saveFlow,
      });
      dragItemIndex.current = null;
      dragOverItemIndex.current = null;
    };

    return (
      <StagesContext.Provider
        value={{
          ...(stagesData || {}),
          updateStagesDataRef,
        }}
      >
        <SignalsContext.Provider value={signalsDetails}>
          <SelectionsContext.Provider value={{ selections, markSelection }}>
            <SignalsClassificationsContext.Provider
              value={{ classifications, setClassifications }}
            >
              <PlaybackContext.Provider
                value={{ timeWindow: currentPlaybackTimeWindow }}
              >
                <div className="stages-header">
                  <div className="heading">
                    <HeadingText type={HeadingText.TYPE.HEADING_5}>
                      Stages
                    </HeadingText>
                    <Tooltip text={UI_CONTENT.STAGE.TOOLTIP}>
                      <Icon
                        className="info-icon"
                        type={Icon.TYPE.INTERFACE__INFO__INFO}
                      />
                    </Tooltip>
                  </div>
                  {mode === MODES.EDIT ? (
                    <>
                      <Button
                        className="button-tertiary-border"
                        variant={Button.VARIANT.TERTIARY}
                        sizeType={Button.SIZE_TYPE.SMALL}
                        iconType={
                          Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE
                        }
                        onClick={addStageHandler}
                      >
                        {UI_CONTENT.STAGE.ADD_STAGE}
                      </Button>
                      <Switch
                        checked={signalCollapseOption}
                        label="Collapse all signals"
                        onChange={() =>
                          setSignalCollapseOption(
                            (prevCollapseOption) => !prevCollapseOption
                          )
                        }
                      />
                    </>
                  ) : (
                    <>
                      <Switch
                        checked={
                          signalExpandOption & SIGNAL_EXPAND.UNHEALTHY_ONLY
                        }
                        label="Unhealthy only"
                        onChange={() =>
                          setNerdletState({
                            signalExpandOption:
                              signalExpandOption ^ SIGNAL_EXPAND.UNHEALTHY_ONLY,
                          })
                        }
                      />
                      <Switch
                        checked={
                          signalExpandOption & SIGNAL_EXPAND.CRITICAL_ONLY
                        }
                        label="Critical only"
                        onChange={() =>
                          setNerdletState({
                            signalExpandOption:
                              signalExpandOption ^ SIGNAL_EXPAND.CRITICAL_ONLY,
                          })
                        }
                      />
                    </>
                  )}
                  {mode === MODES.INLINE && (
                    <Switch
                      checked={signalExpandOption & SIGNAL_EXPAND.ALL}
                      label="Expand all steps"
                      onChange={() =>
                        setNerdletState({
                          signalExpandOption:
                            signalExpandOption ^ SIGNAL_EXPAND.ALL,
                        })
                      }
                    />
                  )}
                </div>
                <div className="stages">
                  {(stagesData.stages || []).map(({ id }, i) => (
                    <Stage
                      key={id}
                      stageId={id}
                      mode={mode}
                      signalExpandOption={signalExpandOption}
                      signalCollapseOption={signalCollapseOption}
                      stageIndex={i}
                      onDragStart={(e) => dragStartHandler(e, i)}
                      onDragOver={(e) => dragOverHandler(e, i)}
                      onDrop={(e) => dropHandler(e)}
                      saveFlow={saveFlow}
                    />
                  ))}
                  {mode === MODES.EDIT && !stagesData.stages.length ? (
                    <EmptyBlock
                      title={UI_CONTENT.FLOW.NO_STAGES.TITLE}
                      description={UI_CONTENT.FLOW.NO_STAGES.DESCRIPTION}
                      actionButtonText="Add a stage"
                      onAdd={addStageHandler}
                      fullWidth
                    />
                  ) : null}
                </div>
              </PlaybackContext.Provider>
            </SignalsClassificationsContext.Provider>
          </SelectionsContext.Provider>
        </SignalsContext.Provider>
      </StagesContext.Provider>
    );
  }
);

Stages.propTypes = {
  mode: PropTypes.oneOf(Object.values(MODES)),
  isPlayback: PropTypes.bool,
  setIsLoading: PropTypes.func,
  saveFlow: PropTypes.func,
};

Stages.displayName = 'Stages';

export default Stages;
