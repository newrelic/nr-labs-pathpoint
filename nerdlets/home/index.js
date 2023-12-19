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
  useNerdletState,
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
import { MODES, UI_CONTENT } from '../../src/constants';
import { SidebarProvider } from '../../src/contexts';
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

const HomeNerdlet = () => {
  const [mode, setMode] = useState(MODES.INLINE);
  const [flows, setFlows] = useState([]);
  const [currentFlowIndex, setCurrentFlowIndex] = useState(-1);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const { accountId } = useContext(PlatformStateContext);
  const [nerdletState] = useNerdletState();
  const { user } = useFetchUser();
  const { userPreferences, loading: userPreferencesLoading } =
    useReadUserPreferences();
  const {
    flows: flowsData,
    error: flowsError,
    loading: flowsLoading,
  } = useFlowLoader({ accountId });
  const flowWriter = useFlowWriter({ accountId, user });

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
                  if (!showAuditLog) setShowAuditLog((sal) => !sal);
                },
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
  }, [user, newFlowHandler, currentFlowIndex, showAuditLog]);

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
    setShowAuditLog(false);
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
        <SidebarProvider>
          <>
            <Flow
              flowDoc={flows[currentFlowIndex].document}
              onClose={backToFlowsHandler}
              accountId={accountId}
              mode={mode}
              setMode={setMode}
              flows={flows}
              onSelectFlow={flowClickHandler}
              user={user}
              showAuditLog={showAuditLog}
              setShowAuditLog={setShowAuditLog}
            />
            <Sidebar />
          </>
        </SidebarProvider>
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
  ]);

  return <div className="container">{currentView}</div>;
};

export default HomeNerdlet;
