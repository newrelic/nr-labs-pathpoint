import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { Button, HeadingText, Switch } from 'nr1';

import { Stage } from '../';
import { useFetchServiceLevels } from '../../hooks';
import { MODES, STATUSES, STATUS_COLORS, SIGNAL_EXPAND } from '../../constants';
import {
  addSignalStatuses,
  annotateStageWithStatuses,
  uniqueSignalGuidsInStages,
} from '../../utils';

const Stages = ({ stages = [], onUpdate, mode = MODES.INLINE }) => {
  const [stagesWithStatuses, setStagesWithStatuses] = useState([]);
  const [guids, setGuids] = useState([]);
  const [signalExpandOption, setSignalExpandOption] = useState(0); // bitwise: (00000001) = unhealthy signals ;; (00000010) = critical signals ;; (00000100)= all signals
  const [selectedStep, setSelectedStep] = useState({}); // to pass to SignalsList()
  const prevClickedStep = useRef({}); // useRef to memorize previously clicked step DOM object
  const dragItemIndex = useRef();
  const dragOverItemIndex = useRef();
  const [oldGuid, setOldGuid] = useState(null);
  const { data: serviceLevelsData, error: serviceLevelsError } =
    useFetchServiceLevels({ guids });

  useEffect(() => {
    setStagesWithStatuses(stages);
    setGuids(uniqueSignalGuidsInStages(stages));
  }, [stages]);

  useEffect(() => {
    if (!Object.keys(serviceLevelsData).length) return;
    const stagesWithSLData = addSignalStatuses(stages, serviceLevelsData);
    setStagesWithStatuses(stagesWithSLData.map(annotateStageWithStatuses));
  }, [serviceLevelsData]);

  useEffect(() => {
    if (serviceLevelsError)
      console.error('Error fetching service levels', serviceLevelsError);
  }, [serviceLevelsError]);

  useEffect(() => {
    // when mode is changed set step background back to normal
    if (
      mode !== MODES.STACKED &&
      selectedStep &&
      prevClickedStep?.clickedStep
    ) {
      prevClickedStep.clickedStep.style.background =
        STATUS_COLORS[STATUSES.BLANK];
      prevClickedStep.current = {};
      setSelectedStep({});
    }
  }, [mode]);

  const addStageHandler = () =>
    onUpdate
      ? onUpdate({
          stages: [
            ...stages,
            {
              name: 'New Stage',
              levels: [],
            },
          ],
        })
      : null;

  const updateStageHandler = (updatedStage, index) => {
    const updatedStages = [...stages];
    updatedStages[index] = updatedStage;
    if (onUpdate) onUpdate({ stages: updatedStages });
  };

  const deleteStageHandler = (index) => {
    const updatedStages = stages.filter((_, i) => i !== index);
    if (onUpdate) onUpdate({ stages: updatedStages });
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
    const itemIndex = dragItemIndex.current;
    const overIndex = dragOverItemIndex.current;
    if (
      !Number.isInteger(itemIndex) ||
      !Number.isInteger(overIndex) ||
      itemIndex === overIndex
    )
      return;
    const updatedStages = [...stages];
    const item = updatedStages[itemIndex];
    updatedStages.splice(itemIndex, 1);
    updatedStages.splice(overIndex, 0, item);
    if (onUpdate) onUpdate({ stages: updatedStages });
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  const stepClickHandler = useCallback(
    (stepInfo) => {
      // clickedStepRef: { id: `${level}_${stepName}`, stageName, stepStatus }
      const { clickedStepRef, clickedStep } = stepInfo;

      if (
        prevClickedStep.current?.clickedStep &&
        prevClickedStep.current.clickedStepRef.id !== clickedStepRef.id
      ) {
        prevClickedStep.current.clickedStep.style.background =
          STATUS_COLORS[STATUSES.BLANK]; // toggle bg color back to normal
      }

      if (
        [STATUSES.CRITICAL, STATUSES.WARNING].includes(
          clickedStepRef.stepStatus
        )
      ) {
        if (
          clickedStep.style.background !==
          STATUS_COLORS[clickedStepRef.stepStatus]
        ) {
          clickedStep.style.background =
            STATUS_COLORS[clickedStepRef.stepStatus];
          setSelectedStep(clickedStepRef);
        } else {
          clickedStep.style.background = STATUS_COLORS[STATUSES.BLANK];
          setSelectedStep({});
        }
      }

      prevClickedStep.current =
        prevClickedStep.current?.clickedStepRef?.id === clickedStepRef.id
          ? {}
          : stepInfo;
    },
    [prevClickedStep]
  );

  return (
    <>
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
                  signalExpandOption ^ SIGNAL_EXPAND.UNHEALTHY_ONLY
                )
              }
            />
            <Switch
              checked={signalExpandOption & SIGNAL_EXPAND.CRITICAL_ONLY}
              label="Critical only"
              onChange={() =>
                setSignalExpandOption(
                  signalExpandOption ^ SIGNAL_EXPAND.CRITICAL_ONLY
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
              setSignalExpandOption(signalExpandOption ^ SIGNAL_EXPAND.ALL)
            }
          />
        )}
      </div>
      <div className="stages">
        {(stagesWithStatuses || []).map(
          (
            { name = '', levels = [], related = {}, status = STATUSES.UNKNOWN },
            i
          ) => (
            <Stage
              key={i}
              name={name}
              levels={levels}
              related={related}
              status={status}
              mode={mode}
              signalExpandOption={signalExpandOption}
              selectedStep={selectedStep}
              onUpdate={(updateStage) => updateStageHandler(updateStage, i)}
              onDelete={() => deleteStageHandler(i)}
              onDragStart={(e) => dragStartHandler(e, i)}
              onDragOver={(e) => dragOverHandler(e, i)}
              onDrop={(e) => dropHandler(e)}
              stepClickHandler={stepClickHandler}
              oldGuid={oldGuid}
              setOldGuid={setOldGuid}
            />
          )
        )}
      </div>
    </>
  );
};

Stages.propTypes = {
  stages: PropTypes.array,
  onUpdate: PropTypes.func,
  mode: PropTypes.oneOf(Object.values(MODES)),
};

export default Stages;
