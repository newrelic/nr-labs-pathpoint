import React from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'nr1';
import { StatusIcon } from '@newrelic/nr-labs-components';

import { MODES, STATUSES } from '../../constants';

const Signal = ({
  name,
  onDelete,
  status = STATUSES.UNKNOWN,
  mode = MODES.INLINE,
  ghost = false,
}) => (
  <div
    className={`signal ${mode === MODES.EDIT ? 'edit' : ''} ${
      ghost ? 'ghost' : ''
    } ${mode === MODES.STACKED && !ghost ? 'detail' : ''} ${
      mode === MODES.STACKED && !ghost && status !== STATUSES.SUCCESS
        ? status
        : ''
    }`}
    onClick={() => {
      if (mode === MODES.STACKED && !ghost) {
        // render signal graph for selected signal in <SideBar> component
        console.log('### render signal graph in <SideBar> component for', name);
      }
    }}
  >
    <div className="status">
      <StatusIcon status={mode === MODES.EDIT ? STATUSES.UNKNOWN : status} />
    </div>
    <span className="name">{name}</span>
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
  onDelete: PropTypes.func,
  status: PropTypes.oneOf(Object.values(STATUSES)),
  mode: PropTypes.oneOf(Object.values(MODES)),
  ghost: PropTypes.bool,
};

export default Signal;
