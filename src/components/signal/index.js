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
  grayed = '',
  guid = '',
  showSignalDetail = () => null,
  selected = false,
}) => {
  return (
    <div
      className={`signal ${mode === MODES.EDIT ? 'edit' : ''} ${grayed} ${
        [MODES.INLINE, MODES.STACKED].includes(mode) && !grayed
          ? `detail ${status} ${selected ? 'selected' : ''}`
          : ''
      }`}
      onClick={() => {
        if ([MODES.INLINE, MODES.STACKED].includes(mode) && !grayed)
          showSignalDetail(guid);
      }}
    >
      <div className="status">
        <StatusIcon status={mode === MODES.EDIT ? STATUSES.UNKNOWN : status} />
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
};

Signal.propTypes = {
  name: PropTypes.string,
  onDelete: PropTypes.func,
  status: PropTypes.oneOf(Object.values(STATUSES)),
  accountId: PropTypes.number,
  nrql: PropTypes.string,
  mode: PropTypes.oneOf(Object.values(MODES)),
  grayed: PropTypes.bool,
  guid: PropTypes.string,
  showSignalDetail: PropTypes.func,
  selected: PropTypes.bool,
};

export default Signal;
