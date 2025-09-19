import React from 'react';
import PropTypes from 'prop-types';

import { EmptyState } from 'nr1';

const NoFlows = ({ newFlowHandler }) => {
  return (
    <EmptyState
      fullHeight
      fullWidth
      iconType={EmptyState.ICON_TYPE.DATAVIZ__DATAVIZ__SERVICE_MAP_CHART}
      title="No flows yet"
      description="Flows are..."
      action={{
        label: 'Create new flow',
        onClick: newFlowHandler,
      }}
    />
  );
};

NoFlows.propTypes = {
  newFlowHandler: PropTypes.func,
};

export default NoFlows;
