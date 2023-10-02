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
  grayed = false,
  guid = '',
  showSignalDetail = () => null,
}) => (
  <div
    className={`signal ${mode === MODES.EDIT ? 'edit' : ''} ${
      grayed ? 'grayed' : ''
    } ${mode === MODES.STACKED && !grayed ? 'detail' : ''} ${
      mode === MODES.STACKED && !grayed && status !== STATUSES.SUCCESS
        ? status
        : ''
    }`}
    onClick={() => {
      if (mode === MODES.STACKED && !grayed) showSignalDetail(guid);
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
  accountId: PropTypes.number,
  nrql: PropTypes.string,
  mode: PropTypes.oneOf(Object.values(MODES)),
  grayed: PropTypes.bool,
  guid: PropTypes.string,
  showSignalDetail: PropTypes.func,
};

export default Signal;
