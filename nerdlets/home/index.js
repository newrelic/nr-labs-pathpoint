import React, { useCallback, useContext, useEffect, useState } from 'react';

import { Button, Icon, nerdlet, PlatformStateContext } from 'nr1';

import { NoFlows, KpiBar } from '../../src/components';
import { useFetchFlows } from '../../src/hooks';

const HomeNerdlet = () => {
  const [flows, setFlows] = useState([]);
  const { accountId } = useContext(PlatformStateContext);
  const { data: flowsData, error: flowsError } = useFetchFlows({ accountId });

  const [debug, setDebug] = useState(true);
  const [mode, setMode] = useState('edit');
  const [loadingKpis, setLoadingKpis] = useState(true);

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

  const [kpiArray, setKpiArray] = useState([
    {
      id: 0,
      accountIds: [192626],
      name: 'TRANSACTIONS',
      desc: 'Transactions',
      nrqlQuery:
        'SELECT count(*) as value FROM Transaction since 1 day ago COMPARE WITH 1 day ago',
      source: 'nr-hedgehog-kpis:useUpdateKpisCollection',
    },
    {
      id: 1,
      accountIds: [192626],
      name: 'PAGE VIEWS',
      desc: 'Browser Page Views',
      nrqlQuery:
        'SELECT count(*) as value FROM PageView since 1 day ago COMPARE WITH 1 day ago',
      source: 'nr-hedgehog-kpis:useUpdateKpisCollection',
    },
    {
      id: 2,
      accountIds: [192626],
      name: 'PUBLIC CALLS',
      desc: 'Public API Calls',
      nrqlQuery: 'SELECT count(*) as value FROM Public_APICall SINCE 1 DAY AGO',
      source: 'nr-hedgehog-kpis:useUpdateKpisCollection',
    },
    {
      id: 3,
      accountIds: [192626],
      name: 'UNIQUE USER SESSIONS',
      desc: 'Unique browser user sessions',
      nrqlQuery:
        'SELECT uniqueCount(session) as value FROM PageView SINCE 1 DAY AGO COMPARE WITH 1 DAY AGO',
      source: 'nr-hedgehog-kpis:useUpdateKpisCollection',
    },
  ]);

  // return (
  //   <div className="container">
  //     {flows && flows.length ? null : (
  //       <NoFlows newFlowHandler={newFlowHandler} />
  //     )}
  //   </div>
  // );

  return (
    <div className="container">
      <div className="flows">
        {flows && flows.length ? null : (
          <NoFlows newFlowHandler={newFlowHandler} />
        )}
      </div>

      <div className="dev-buttons">
        <Button
          type={Button.TYPE.SECONDARY}
          sizeType={Button.SIZE_TYPE.SMALL}
          onClick={() => (mode === 'view' ? setMode('edit') : setMode('view'))}
        >
          {mode === 'edit' ? `Done Editing KPIs` : `Edit KPIs`}
        </Button>

        <Button
          type={Button.TYPE.SECONDARY}
          sizeType={Button.SIZE_TYPE.SMALL}
          onClick={() => setDebug(!debug)}
        >
          {debug ? `Disable Debug` : `Enable Debug`}
        </Button>
      </div>

      <div>
        <KpiBar
          mode={mode} // view / edit
          kpiArray={kpiArray} // array of kpis [ { "id": 0, "name": "", "desc": "", "query": "", "accountIds": [] } ]
          setKpiArray={setKpiArray}
          loading={loadingKpis} // initially true
          setLoading={setLoadingKpis}
          debug={debug}
        />
      </div>
    </div>
  );
};

export default HomeNerdlet;
