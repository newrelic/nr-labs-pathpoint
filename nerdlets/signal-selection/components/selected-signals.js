import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { Badge, HeadingText } from 'nr1';

import { QueryTree, Signal } from '../../../src/components';
import { MODES, SIGNAL_TYPES, STATUSES } from '../../../src/constants';

const SelectedSignals = ({
  signalSelections,
  setSignalSelections,
  dynamicQueries,
  dynamicEntities = [],
  dynamicAlerts = [],
  onDeleteEntitiesQuery,
  onDeleteAlertsQuery,
}) => {
  const [entitySelections, setEntitySelections] = useState([]); //dynamicQuery, setDynamicQuery
  const [alertSelections, setAlertSelections] = useState([]); // () => setDynamicQuery('')

  useEffect(() => {
    setEntitySelections(signalSelections[SIGNAL_TYPES.ENTITY] || []);
    setAlertSelections(signalSelections[SIGNAL_TYPES.ALERT] || []);
  }, [signalSelections]);

  return (
    <div className="selected-signals">
      <HeadingText type={HeadingText.TYPE.HEADING_4}>
        Selected signals
      </HeadingText>
      <div className="selections">
        <div className="title">
          <HeadingText type={HeadingText.TYPE.HEADING_6}>Entities</HeadingText>
          <Badge>{`${
            entitySelections.length + dynamicEntities.length || 0
          }/25`}</Badge>
        </div>
        <div className="list">
          {entitySelections.map(({ name, guid }) => (
            <Signal
              key={guid}
              name={name}
              guid={guid}
              hasTooltip={true}
              status={STATUSES.UNKNOWN}
              mode={MODES.EDIT}
              onDelete={() =>
                setSignalSelections((sigs) => ({
                  ...sigs,
                  [SIGNAL_TYPES.ENTITY]: sigs[SIGNAL_TYPES.ENTITY].filter(
                    (sel) => sel.guid !== guid
                  ),
                }))
              }
            />
          ))}
          <QueryTree
            query={dynamicQueries[SIGNAL_TYPES.ENTITY]}
            results={dynamicEntities}
            onDelete={onDeleteEntitiesQuery}
          />
        </div>
        <hr className="rule" />
        <div className="title">
          <HeadingText type={HeadingText.TYPE.HEADING_6}>Alerts</HeadingText>
          <Badge>{`${
            alertSelections.length + dynamicAlerts.length || 0
          }/25`}</Badge>
        </div>
        <div className="list">
          {alertSelections.map(({ name, guid }) => (
            <Signal
              key={guid}
              name={name}
              guid={guid}
              hasTooltip={true}
              type={SIGNAL_TYPES.ALERT}
              status={STATUSES.UNKNOWN}
              mode={MODES.EDIT}
              onDelete={() =>
                setSignalSelections((sigs) => ({
                  ...sigs,
                  [SIGNAL_TYPES.ALERT]: sigs[SIGNAL_TYPES.ALERT].filter(
                    (sel) => sel.guid !== guid
                  ),
                }))
              }
            />
          ))}
          <QueryTree
            query={dynamicQueries[SIGNAL_TYPES.ALERT]}
            results={dynamicAlerts}
            type={SIGNAL_TYPES.ALERT}
            onDelete={onDeleteAlertsQuery}
          />
        </div>
      </div>
    </div>
  );
};

SelectedSignals.propTypes = {
  signalSelections: PropTypes.shape({
    [SIGNAL_TYPES.ENTITY]: PropTypes.arrayOf(PropTypes.object),
    [SIGNAL_TYPES.ALERT]: PropTypes.arrayOf(PropTypes.object),
  }),
  setSignalSelections: PropTypes.func,
  dynamicQueries: PropTypes.shape({
    [SIGNAL_TYPES.ENTITY]: PropTypes.string,
    [SIGNAL_TYPES.ALERT]: PropTypes.string,
  }),
  dynamicEntities: PropTypes.arrayOf(PropTypes.object),
  dynamicAlerts: PropTypes.arrayOf(PropTypes.object),
  onDeleteEntitiesQuery: PropTypes.func,
  onDeleteAlertsQuery: PropTypes.func,
};

export default SelectedSignals;
