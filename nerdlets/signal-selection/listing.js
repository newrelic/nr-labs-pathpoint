import React from 'react';
import PropTypes from 'prop-types';

import { Button, HeadingText } from 'nr1';

import ListingTable from './listing-table';
import { Signal } from '../../src/components';
import { SIGNAL_TYPES, STATUSES } from '../../src/constants';
import { signalStatus } from '../../src/utils';

const Listing = ({
  currentTab,
  entities = [],
  alerts = [],
  selectedEntities = [],
  selectedAlerts = [],
  signalsDetails = {},
  onSelect,
}) => {
  return (
    <div className="listing">
      <ListingTable
        type={currentTab}
        entities={entities}
        alerts={alerts}
        selectedEntities={selectedEntities}
        selectedAlerts={selectedAlerts}
        onSelect={onSelect}
      />
      <div className="selection">
        <HeadingText type={HeadingText.TYPE.HEADING_4}>
          Selected signals
        </HeadingText>
        <div className="selected">
          <div className="title">
            <HeadingText type={HeadingText.TYPE.HEADING_6}>
              Entities
            </HeadingText>
            <span className="selection-count">
              <span>{selectedEntities.length}</span>
              /25 entities
            </span>
            <Button
              type={Button.TYPE.SECONDARY}
              sizeType={Button.SIZE_TYPE.SMALL}
              iconType={
                Button.ICON_TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__WORKLOADS
              }
              disabled={true}
            >
              Convert to workload
            </Button>
          </div>
          <div className="list">
            {selectedEntities.map(({ name, guid, alertSeverity }) => (
              <Signal
                key={guid}
                name={signalsDetails[guid]?.name || name}
                status={signalStatus({
                  type: SIGNAL_TYPES.ENTITY,
                  alertSeverity,
                })}
              />
            ))}
          </div>
          <hr className="rule" />
          <div className="title">
            <HeadingText type={HeadingText.TYPE.HEADING_6}>Alerts</HeadingText>
            <span className="selection-count">
              <span>{selectedAlerts.length}</span>
              /50 conditions
            </span>
          </div>
          <div className="list">
            {selectedAlerts.map(({ name, guid }) => (
              <Signal
                key={guid}
                name={signalsDetails[guid]?.name || name}
                type={SIGNAL_TYPES.ALERT}
                status={STATUSES.UNKNOWN}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

Listing.propTypes = {
  currentTab: PropTypes.string,
  entities: PropTypes.array,
  alerts: PropTypes.array,
  selectedEntities: PropTypes.array,
  selectedAlerts: PropTypes.array,
  signalsDetails: PropTypes.object,
  onSelect: PropTypes.func,
};

export default Listing;
