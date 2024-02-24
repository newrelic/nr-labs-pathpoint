import React, { useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  HeadingText,
  NerdGraphQuery,
  Switch,
  useEntitiesByGuidsQuery,
} from 'nr1';

import { Stage } from '../';
import { MODES, SIGNAL_TYPES, SIGNAL_EXPAND } from '../../constants';
import {
  addSignalStatuses,
  alertConditionsStatusGQL,
  alertsStatusFromQueryResults,
  alertsTree,
  annotateStageWithStatuses,
  entitiesDetailsFromQueryResults,
  updateSignalsWithStepsRefs,
  guidsToArray,
  uniqueSignalGuidsInStages,
} from '../../utils';
import {
  FlowContext,
  FlowDispatchContext,
  SelectionsContext,
  SignalsContext,
  StagesContext,
} from '../../contexts';
import { FLOW_DISPATCH_COMPONENTS, FLOW_DISPATCH_TYPES } from '../../reducers';
import { queryFromGuidsArray } from '../../queries';

const MAX_GUIDS_PER_CALL = 25;

const Stages = ({ mode = MODES.INLINE, saveFlow }) => {
  const { stages = [] } = useContext(FlowContext);
  const dispatch = useContext(FlowDispatchContext);
  const [guids, setGuids] = useState({});
  const [statuses, setStatuses] = useState({});
  const [stagesData, setStagesData] = useState({ stages });
  const [signalsDetails, setSignalsDetails] = useState({});
  const [selections, setSelections] = useState({});
  const [signalExpandOption, setSignalExpandOption] = useState(0); // bitwise: (00000001) = unhealthy signals ;; (00000010) = critical signals ;; (00000100)= all signals
  const dragItemIndex = useRef();
  const dragOverItemIndex = useRef();
  const entitiesDetails = useEntitiesByGuidsQuery({
    entityGuids: guids[SIGNAL_TYPES.ENTITY] || [],
  });

  useEffect(() => {
    setGuids(uniqueSignalGuidsInStages(stages));
    setStagesData(() => ({ stages: [...stages] }));
  }, [stages]);

  useEffect(() => {
    const arrayOfGuids = guidsToArray(guids, MAX_GUIDS_PER_CALL);
    const fetchSignalsDetails = async () => {
      const query = queryFromGuidsArray(arrayOfGuids);
      const { data: { actor = {} } = {} } = await NerdGraphQuery.query({
        query,
      });
      setSignalsDetails(
        updateSignalsWithStepsRefs(
          stages,
          entitiesDetailsFromQueryResults(actor)
        )
      );
    };

    if (arrayOfGuids.length) fetchSignalsDetails();
  }, [guids]);

  useEffect(() => {
    if (statuses[SIGNAL_TYPES.ENTITY]) return;
    const {
      loading,
      data: { entities = [] },
    } = entitiesDetails;
    if (loading || !entities.length) return;
    setStatuses((s) => ({
      ...s,
      [SIGNAL_TYPES.ENTITY]: entities.reduce(
        (acc, { guid, ...entity }) => ({ ...acc, [guid]: entity }),
        {}
      ),
    }));
  }, [entitiesDetails]);

  useEffect(() => {
    const signalsWithStatuses = addSignalStatuses([...stages], statuses);
    setStagesData(() => ({
      stages: signalsWithStatuses.map(annotateStageWithStatuses),
    }));
  }, [stages, statuses]);

  useEffect(() => {
    const alertGuids = guids[SIGNAL_TYPES.ALERT] || [];
    if (!alertGuids.length) return;

    const fetchAlerts = async (alertGuids) => {
      if (alertGuids.length) {
        const alerts = alertGuids.reduce(alertsTree, {});
        const query = alertConditionsStatusGQL(alerts);
        if (query) {
          const { data: { actor: res = {} } = {} } = await NerdGraphQuery.query(
            {
              query,
            }
          );
          setStatuses((s) => ({
            ...s,
            [SIGNAL_TYPES.ALERT]: alertsStatusFromQueryResults(alerts, res),
          }));
        }
      }
    };

    fetchAlerts(alertGuids);
  }, [stages, guids]);

  const addStageHandler = () =>
    dispatch({
      type: FLOW_DISPATCH_TYPES.ADDED,
      component: FLOW_DISPATCH_COMPONENTS.STAGE,
      saveFlow,
    });

  const toggleSelection = (type, id) => {
    if (!type || !id) return;
    setSelections((s) => ({
      ...s,
      [type]: s[type] === id ? null : id,
    }));
  };

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
    <StagesContext.Provider value={stagesData.stages}>
      <SignalsContext.Provider value={signalsDetails}>
        <SelectionsContext.Provider value={{ selections, toggleSelection }}>
          <div className="stages-header">
            <HeadingText type={HeadingText.TYPE.HEADING_4}>Stages</HeadingText>
            {mode === MODES.EDIT ? (
              <Button
                type={Button.TYPE.SECONDARY}
                sizeType={Button.SIZE_TYPE.SMALL}
                iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE}
                onClick={addStageHandler}
              >
                Add a stage
              </Button>
            ) : (
              <>
                <Switch
                  checked={signalExpandOption & SIGNAL_EXPAND.UNHEALTHY_ONLY}
                  label="Unhealthy only"
                  onChange={() =>
                    setSignalExpandOption(
                      (seo) => seo ^ SIGNAL_EXPAND.UNHEALTHY_ONLY
                    )
                  }
                />
                <Switch
                  checked={signalExpandOption & SIGNAL_EXPAND.CRITICAL_ONLY}
                  label="Critical only"
                  onChange={() =>
                    setSignalExpandOption(
                      (seo) => seo ^ SIGNAL_EXPAND.CRITICAL_ONLY
                    )
                  }
                />
              </>
            )}
            {mode === MODES.INLINE && (
              <Switch
                checked={signalExpandOption & SIGNAL_EXPAND.ALL}
                label="Expand all steps"
                onChange={() =>
                  setSignalExpandOption((seo) => seo ^ SIGNAL_EXPAND.ALL)
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
                stageIndex={i}
                onDragStart={(e) => dragStartHandler(e, i)}
                onDragOver={(e) => dragOverHandler(e, i)}
                onDrop={(e) => dropHandler(e)}
                saveFlow={saveFlow}
              />
            ))}
          </div>
        </SelectionsContext.Provider>
      </SignalsContext.Provider>
    </StagesContext.Provider>
  );
};

Stages.propTypes = {
  mode: PropTypes.oneOf(Object.values(MODES)),
  saveFlow: PropTypes.func,
};

export default Stages;
