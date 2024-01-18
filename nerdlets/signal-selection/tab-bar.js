import React from 'react';
import PropTypes from 'prop-types';

import { Tabs, TabsItem } from 'nr1';
import { SIGNAL_TYPES } from '../../src/constants';

const TabBar = ({ currentTab, setCurrentTab, labels }) => (
  <div className="tabs">
    <Tabs
      className="tabs"
      value={currentTab}
      onChange={(t) => setCurrentTab(t)}
    >
      <TabsItem
        className="tab"
        value={SIGNAL_TYPES.ENTITY}
        label={labels[SIGNAL_TYPES.ENTITY]}
      />
      <TabsItem
        className="tab"
        value={SIGNAL_TYPES.ALERT}
        label={labels[SIGNAL_TYPES.ALERT]}
      />
    </Tabs>
  </div>
);

TabBar.propTypes = {
  currentTab: PropTypes.string,
  setCurrentTab: PropTypes.func,
  labels: PropTypes.shape({
    [SIGNAL_TYPES.ENTITY]: PropTypes.string,
    [SIGNAL_TYPES.ALERT]: PropTypes.string,
  }),
};

export default TabBar;
