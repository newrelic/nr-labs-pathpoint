import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { SignalsGridLayout } from '../';

import { COMPONENTS, SIGNAL_TYPES, STATUSES } from '../../constants';

const SignalsGrid = memo(({ signals, selections, signalDisplayName }) => (
  <SignalsGridLayout
    statuses={signals.map(
      ({
        name,
        guid,
        status = STATUSES.UNKNOWN,
        type = SIGNAL_TYPES.ENTITY,
      } = {}) => ({
        name: signalDisplayName({ name, guid }),
        guid,
        status,
        type,
        isFaded:
          selections.type === COMPONENTS.SIGNAL && selections.id !== guid,
      })
    )}
  />
));
SignalsGrid.displayName = 'SignalsGrid';

SignalsGrid.propTypes = {
  signals: PropTypes.array,
  selections: PropTypes.object,
  signalDisplayName: PropTypes.func,
};

export default SignalsGrid;
