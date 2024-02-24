import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'nr1';

import IconsLib from '../icons-lib';
import { COMPONENTS, MODES, SIGNAL_TYPES, STATUSES } from '../../constants';
import { SelectionsContext, SignalsContext } from '../../contexts';

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

  const setSignalClassName = () => {
    let className = `signal ${mode === MODES.EDIT ? 'edit' : ''}`;

    className +=
      mode !== MODES.EDIT &&
      ((selectedSignal && selectedSignal !== guid) ||
        (selectedStep && selectedStage && selectedStage !== stageId) ||
        (selectedStep &&
          !signalsDetails[guid]?.stepRefs?.includes(selectedStep)))
        ? ' faded'
        : '';

    className +=
      mode !== MODES.EDIT
        ? ` detail ${status} ${
            (selectedSignal === guid && selectedStage && !selectedStep) ||
            (selectedStep &&
              signalsDetails[guid]?.stepRefs?.includes(selectedStep))
              ? 'selected'
              : ''
          }`
        : '';

    return className;
  };

  return (
    <div
      className={setSignalClassName()}
      onClick={(evt) => {
        evt.stopPropagation();

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

        toggleSelection(COMPONENTS.SIGNAL, guid);
      }}
    >
      <div className={`status ${status}`}>
        {type === SIGNAL_TYPES.ALERT ? (
          <IconsLib
            className={mode === MODES.EDIT ? STATUSES.UNKNOWN : status}
            type={IconsLib.TYPES.ALERT}
          />
        ) : (
          <IconsLib
            className={mode === MODES.EDIT ? STATUSES.UNKNOWN : status}
            type={IconsLib.TYPES.ENTITY}
          />
        )}
      </div>
      {name ? (
        <span className={`name ${status}`}>{name}</span>
      ) : (
        <span className="name unknown">(unknown)</span>
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
