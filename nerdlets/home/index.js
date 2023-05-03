import React, { useCallback, useContext, useEffect, useState } from 'react';

import { Icon, nerdlet, PlatformStateContext } from 'nr1';

import { NoFlows, KpiBar } from '../../src/components';
import { useFetchFlows } from '../../src/hooks';

const HomeNerdlet = () => {
  const [flows, setFlows] = useState([]);
  const { accountId } = useContext(PlatformStateContext);
  const { data: flowsData, error: flowsError } = useFetchFlows({ accountId });

  const [nerdletMode, setNerdletMode] = useState('edit'); // eslint-disable-line no-unused-vars
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [kpiArray, setKpiArray] = useState([]);

  useEffect(() => {
    nerdlet.setConfig({
      accountPicker: true,
      actionControls: true,
      actionControlButtons: [
        {
          label: 'Create new flow',
          iconType: Icon.TYPE.DATAVIZ__DATAVIZ__SERVICE_MAP_CHART,
          onClick: newFlowHandler,
        },
      ],
      headerType: nerdlet.HEADER_TYPE.CUSTOM,
      headerTitle: 'Project Hedgehog 🦔',
    });
  }, []);

  useEffect(() => {
    // TODO: set flows
    setFlows(flowsData || []);
  }, [flowsData]);

  useEffect(() => {
    if (flowsError) console.error('Error fetching flows', flowsError);
  }, [flowsError]);

  const newFlowHandler = useCallback(() => {
    // TODO: handle creation of new flows
  });

  return (
    <div className="container">
      <div className="flows">
        {flows && flows.length ? null : (
          <NoFlows newFlowHandler={newFlowHandler} />
        )}
      </div>
      <KpiBar
        nerdletMode={nerdletMode} // view / edit
        kpiArray={kpiArray} // array of kpis [ { "id": 0, "name": "", "query": "", "accountIds": [] } ]
        setKpiArray={setKpiArray}
        loading={loadingKpis} // initially true
        setLoading={setLoadingKpis}
      />
    </div>
  );
};

export default HomeNerdlet;
