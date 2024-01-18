import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Button,
  Icon,
  nerdlet,
  PlatformStateContext,
  Spinner,
  useAccountsQuery,
  useNerdletState,
  usePlatformState,
} from 'nr1';

import {
  Flow,
  FlowList,
  GetStarted,
  NoFlows,
  Sidebar,
} from '../../src/components';
import {
  useFlowLoader,
  useFlowWriter,
  useFetchUser,
  useReadUserPreferences,
} from '../../src/hooks';
import { MODES, REFRESH_INTERVALS, UI_CONTENT } from '../../src/constants';
import { AppContext, SidebarProvider } from '../../src/contexts';
import { uuid } from '../../src/utils';

const createFlowButtonAttributes = {
  label: UI_CONTENT.GLOBAL.BUTTON_LABEL_CREATE_FLOW,
  type: Button.TYPE.PRIMARY,
  iconType: Icon.TYPE.DATAVIZ__DATAVIZ__SERVICE_MAP_CHART,
};

const editButtonAttributes = {
  label: UI_CONTENT.GLOBAL.BUTTON_LABEL_EDIT_MODE,
  type: Button.TYPE.PRIMARY,
  iconType: Icon.TYPE.INTERFACE__OPERATIONS__EDIT,
};

const showAuditLogAttributes = {
  label: UI_CONTENT.GLOBAL.BUTTON_LABEL_AUDIT_LOG,
  type: Button.TYPE.PRIMARY,
  iconType: Icon.TYPE.DATE_AND_TIME__DATE_AND_TIME__DATE,
};

const editButtonFlowSettingsAttributes = {
  type: Button.TYPE.PRIMARY,
  iconType: Icon.TYPE.INTERFACE__OPERATIONS__CONFIGURE,
};

const HomeNerdlet = () => {
  const [app, setApp] = useState({});
  const [mode, setMode] = useState(MODES.INLINE);
  const [flows, setFlows] = useState([]);
  const [currentFlowIndex, setCurrentFlowIndex] = useState(-1);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [editFlowSettings, setEditFlowSettings] = useState(false);
  const { accountId } = useContext(PlatformStateContext);
  const [{ filters: platformStateFilters }] = usePlatformState();
  const [nerdletState] = useNerdletState();
  const { user } = useFetchUser();
  const { userPreferences, loading: userPreferencesLoading } =
    useReadUserPreferences();
  const {
    flows: flowsData,
    error: flowsError,
    loading: flowsLoading,
    refetch: flowsRefetch,
  } = useFlowLoader({ accountId });
  const flowWriter = useFlowWriter({ accountId, user });
  const { data: accounts = [] } = useAccountsQuery();

  useEffect(
    () =>
      setApp({
        account: {
          id: accountId,
          name: accounts.find(({ id }) => id === accountId)?.name,
        },
        accounts: accounts.map(({ id, name }) => ({ id, name })),
        user,
      }),
    [accountId, accounts, user]
  );

  useEffect(() => {
    nerdlet.setConfig({
      accountPicker: true,
      actionControls: true,
      actionControlButtons:
        currentFlowIndex > -1
          ? [
              {
                ...createFlowButtonAttributes,
                onClick: newFlowHandler,
              },
              {
                ...showAuditLogAttributes,
                onClick: () => {
                  setShowAuditLog((sal) => !sal);
              },
              {
                ...editButtonFlowSettingsAttributes,
                onClick: () => setEditFlowSettings(true),
              },
              {
                ...editButtonAttributes,
                onClick: () => setMode(MODES.EDIT),
              },
            ]
          : [
              {
                ...createFlowButtonAttributes,
                onClick: newFlowHandler,
              },
            ],
      headerType: nerdlet.HEADER_TYPE.CUSTOM,
      headerTitle: 'Project Hedgehog 🦔',
    });
  }, [user, newFlowHandler, currentFlowIndex, editFlowSettings, showAuditLog]);

  useEffect(() => {
    if (platformStateFilters === UI_CONTENT.DUMMY_FILTER) {
      flowsRefetch();
    }
  }, [platformStateFilters]);

  useEffect(() => setFlows(flowsData || []), [flowsData]);

  useEffect(() => {
    if (flowsError) console.error('Error fetching flows', flowsError);
  }, [flowsError]);

  const newFlowHandler = useCallback(() => {
    const id = uuid();
    flowWriter.write({
      documentId: id,
      document: {
        id,
        name: 'Untitled',
        refreshInterval: REFRESH_INTERVALS[0].value,
        stages: [],
        kpis: [],
        created: {
          user,
          timestamp: Date.now(),
        },
      },
    });
  }, [user]);

  const flowClickHandler = useCallback(
    (id) => setCurrentFlowIndex(flows.findIndex((f) => f.id === id)),
    [flows]
  );

  const backToFlowsHandler = useCallback(() => {
    setCurrentFlowIndex(-1);
    setMode(MODES.INLINE);
  }, []);

  useEffect(() => {
    const { nerdStorageWriteDocument: { id } = {} } = flowWriter?.data || {};
    if (id) {
      setMode(MODES.EDIT);
      flowClickHandler(id);
    }
  }, [flowWriter.data]);

  const currentView = useMemo(() => {
    if (
      nerdletState?.redirfrom !== 'product-tour' &&
      !userPreferencesLoading &&
      !userPreferences?.tour?.skipped
    )
      return <GetStarted />;

    if (currentFlowIndex > -1 && flows?.[currentFlowIndex]?.document) {
      return (
        <AppContext.Provider value={app}>
          <SidebarProvider>
            <Flow
              flowDoc={flows[currentFlowIndex].document}
              onClose={backToFlowsHandler}
              mode={mode}
              setMode={setMode}
              flows={flows}
              onSelectFlow={flowClickHandler}
              user={user}
              showAuditLog={showAuditLog}
              setShowAuditLog={setShowAuditLog}
              editFlowSettings={editFlowSettings}
              setEditFlowSettings={setEditFlowSettings}
            />
            <Sidebar />
          </SidebarProvider>
        </AppContext.Provider>
      );
    }
    if (flows && flows.length) {
      backToFlowsHandler();
      return <FlowList flows={flows} onClick={flowClickHandler} />;
    }
    if (flowsLoading) {
      return <Spinner />;
    } else {
      return <NoFlows newFlowHandler={newFlowHandler} />;
    }
  }, [
    flows,
    flowsLoading,
    currentFlowIndex,
    accountId,
    mode,
    flowClickHandler,
    showAuditLog,
    editFlowSettings,
  ]);

  return <div className="container">{currentView}</div>;
};

export default HomeNerdlet;
