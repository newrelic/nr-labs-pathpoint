import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import { StatusIcon } from '@newrelic/nr-labs-components';

const Signal = ({ name, attainment, target }) => {
  const signalStatus = useMemo(() => {
    if ((!attainment && attainment !== 0) || !target)
      return StatusIcon.STATUSES.UNKNOWN;

    if (attainment >= target) return StatusIcon.STATUSES.SUCCESS;
    return StatusIcon.STATUSES.CRITICAL;
  }, [attainment, target]);

  return (
    <div className="signal">
      <StatusIcon status={signalStatus} />
      <span className="name">{name}</span>
    </div>
  );
};

Signal.propTypes = {
  name: PropTypes.string,
  attainment: PropTypes.number,
  target: PropTypes.number,
};

export default Signal;
