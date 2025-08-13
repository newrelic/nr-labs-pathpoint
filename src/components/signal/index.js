import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'nr1';

import IconsLib from '../icons-lib';
import {
  COMPONENTS,
  MODES,
  SIGNAL_TYPES,
  STATUSES,
  UI_CONTENT,
} from '../../constants';
import { SelectionsContext } from '../../contexts';
import SignalTooltipBasic from '../signal-tooltip-basic';

const Signal = ({
  name,
  guid,
  isInSelectedStep,
  hasTooltip,
  type = SIGNAL_TYPES.ENTITY,
  status = STATUSES.UNKNOWN,
  mode = MODES.INLINE,
  onDelete,
}) => {
  const { selections, markSelection } = useContext(SelectionsContext);

  const signalUI = (
    <div
      className={`signal ${mode === MODES.EDIT ? 'edit' : ''} ${
        [MODES.INLINE, MODES.STACKED].includes(mode)
          ? `detail ${status} ${
              selections?.type === COMPONENTS.SIGNAL && selections?.id === guid
                ? 'selected'
                : ''
            }`
          : ''
      } ${
        mode !== MODES.EDIT &&
        ((selections?.type === COMPONENTS.STEP && !isInSelectedStep) ||
          (selections?.type === COMPONENTS.SIGNAL && selections.id !== guid))
          ? 'faded'
          : ''
      }`}
      onClick={
        mode !== MODES.EDIT
          ? (e) => {
              e.stopPropagation();
              if (markSelection)
                markSelection(COMPONENTS.SIGNAL, guid, { name, type, status });
            }
          : null
      }
    >
      <div className="status">
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
        <span className={`name`} title={hasTooltip ? null : name}>
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

  if (hasTooltip)
    return (
      <SignalTooltipBasic name={name} guid={guid}>
        {signalUI}
      </SignalTooltipBasic>
    );

  return signalUI;
};

Signal.propTypes = {
  name: PropTypes.string,
  guid: PropTypes.string,
  isInSelectedStep: PropTypes.bool,
  hasTooltip: PropTypes.bool,
  type: PropTypes.oneOf(Object.values(SIGNAL_TYPES)),
  status: PropTypes.oneOf(Object.values(STATUSES)),
  mode: PropTypes.oneOf(Object.values(MODES)),
  onDelete: PropTypes.func,
};

export default Signal;
