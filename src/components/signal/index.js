import React from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'nr1';
import { StatusIcon } from '@newrelic/nr-labs-components';

import IconsLib from '../icons-lib';
import { MODES, SIGNAL_TYPES, STATUSES } from '../../constants';

const Signal = ({
  name,
  type = SIGNAL_TYPES.ENTITY,
  onDelete,
  status = STATUSES.UNKNOWN,
  mode = MODES.INLINE,
}) => (
  <div className={`signal ${mode === MODES.EDIT ? 'edit' : ''}`}>
    <div className="status">
      {type === SIGNAL_TYPES.ALERT ? (
        <IconsLib
          className={mode === MODES.EDIT ? STATUSES.UNKNOWN : status}
          type={IconsLib.TYPES.ALERT}
        />
      ) : (
        <StatusIcon status={mode === MODES.EDIT ? STATUSES.UNKNOWN : status} />
      )}
    </div>
    {name ? (
      <span className="name">{name}</span>
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

Signal.propTypes = {
  name: PropTypes.string,
  type: PropTypes.oneOf(Object.values(SIGNAL_TYPES)),
  onDelete: PropTypes.func,
  status: PropTypes.oneOf(Object.values(STATUSES)),
  mode: PropTypes.oneOf(Object.values(MODES)),
};

export default Signal;
