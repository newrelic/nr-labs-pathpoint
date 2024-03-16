import React from 'react';
import PropTypes from 'prop-types';

import { SIGNAL_TYPES, STATUSES } from '../../constants';

import Incidents from './incidents';
import GoldenMetrics from './golden-metrics';

const SignalDetail = ({ guid, name, type, status }) => {
  return (
    <div className="signal-sidebar">
      <Incidents guid={guid} name={name} type={type} status={status} />
      {type === SIGNAL_TYPES.ENTITY && <GoldenMetrics guid={guid} />}
    </div>
  );
};

SignalDetail.propTypes = {
  guid: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.oneOf(Object.values(SIGNAL_TYPES)),
  status: PropTypes.oneOf(Object.values(STATUSES)),
};

export default SignalDetail;
