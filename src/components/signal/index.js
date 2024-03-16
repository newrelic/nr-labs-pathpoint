import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'nr1';

import SignalDetail from './../signal-detail';
import IconsLib from '../icons-lib';
import {
  COMPONENTS,
  MODES,
  SIGNAL_TYPES,
  STATUSES,
  UI_CONTENT,
} from '../../constants';
import { SelectionsContext, SignalsContext, useSidebar } from '../../contexts';

const Signal = ({
  name,
  guid,
  type = SIGNAL_TYPES.ENTITY,
  onDelete,
  status = STATUSES.UNKNOWN,
  mode = MODES.INLINE,
  stageId = '',
}) => {
  const {
    selections: {
      [COMPONENTS.STAGE]: selectedStage,
      [COMPONENTS.LEVEL]: selectedLevel,
      [COMPONENTS.STEP]: selectedStep,
      [COMPONENTS.SIGNAL]: selectedSignal,
    } = {},
    toggleSelection,
  } = useContext(SelectionsContext);
  const signalsDetails = useContext(SignalsContext);
  const { openSidebar, closeSidebar } = useSidebar();

  const setSignalClassName = () => {
    let className = `signal ${mode === MODES.EDIT ? 'edit' : ''}`;

    if (
      (mode !== MODES.EDIT && selectedSignal && selectedSignal !== guid) ||
      (mode === MODES.STACKED &&
        selectedStep &&
        selectedStage &&
        (selectedStage !== stageId ||
          !signalsDetails[guid]?.stepRefs?.includes(selectedStep)))
    ) {
      className += ' faded';
    } else {
      if (mode !== MODES.EDIT) {
        className += ` detail ${status}`;
        if (
          (selectedSignal === guid && selectedStage && !selectedStep) ||
          (mode === MODES.STACKED &&
            selectedStep &&
            signalsDetails[guid]?.stepRefs?.includes(selectedStep))
        ) {
          className += ' selected';
        }
      }
    }

    return className;
  };

  return (
    <div
      className={setSignalClassName()}
      onClick={(evt) => {
        evt.stopPropagation();

        if (mode !== MODES.EDIT) {
          if (
            (selectedSignal === guid && selectedStage === stageId) ||
            (selectedSignal !== guid && selectedStage !== stageId)
          ) {
            toggleSelection(COMPONENTS.STAGE, stageId);
          }

          if (selectedLevel) {
            toggleSelection(COMPONENTS.LEVEL, selectedLevel);
          }

          if (selectedStep) {
            toggleSelection(COMPONENTS.STEP, selectedStep);
          }

          if (selectedSignal !== guid) {
            toggleSelection(COMPONENTS.SIGNAL, guid);
            openSidebar({
              content: (
                <SignalDetail
                  guid={guid}
                  name={signalsDetails[guid]?.name}
                  type={type}
                  status={status}
                />
              ),
              onClose: closeSidebar(),
              status: status,
            });
          } else {
            toggleSelection(COMPONENTS.SIGNAL, guid);
            closeSidebar();
          }
        }
      }}
    >
      <div className={`status ${status}`}>
        <IconsLib
          className={mode === MODES.EDIT ? STATUSES.UNKNOWN : status}
          type={
            type === SIGNAL_TYPES.ALERT
              ? IconsLib.TYPES.ALERT
              : IconsLib.TYPES.ENTITY
          }
          shouldShowTitle={false}
        />
      </div>
      {name ? (
        <span className={`name`} title={name}>
          {name}
        </span>
      ) : (
        <span className="name unknown">{UI_CONTENT.SIGNAL.DEFAULT_NAME}</span>
      )}
      {mode === MODES.EDIT ? (
        <span
          className="delete-signal"
          onClick={() => (onDelete ? onDelete() : null)}
        >
          <Icon type={Icon.TYPE.INTERFACE__OPERATIONS__CLOSE} />
        </span>
      ) : null}
    </div>
  );
};

Signal.propTypes = {
  name: PropTypes.string,
  guid: PropTypes.string,
  type: PropTypes.oneOf(Object.values(SIGNAL_TYPES)),
  onDelete: PropTypes.func,
  status: PropTypes.oneOf(Object.values(STATUSES)),
  mode: PropTypes.oneOf(Object.values(MODES)),
  stageId: PropTypes.string,
};

export default Signal;
