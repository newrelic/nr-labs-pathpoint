import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Button,
  EmptyState,
  Icon,
  navigation,
  nerdlet,
  PlatformStateContext,
  Spinner,
  useAccountsQuery,
  useNerdletState,
} from 'nr1';
import { HelpModal, Messages } from '@newrelic/nr-labs-components';

import {
  ExportFlowModal,
  Flow,
  FlowList,
  NoFlows,
  Sidebar,
} from '../../src/components';
import { useFlowLoader, useFetchUser } from '../../src/hooks';
import { AppContext, SidebarProvider } from '../../src/contexts';
import { flowDocument } from '../../src/utils';
import { MAX_ENTITIES_IN_STEP, MODES, UI_CONTENT } from '../../src/constants';

const ACTION_BTN_ATTRIBS = {
  CREATE_FLOW: {
    type: Button.TYPE.PRIMARY,
    label: UI_CONTENT.GLOBAL.BUTTON_LABEL_CREATE_FLOW,
    iconType: Icon.TYPE.DATAVIZ__DATAVIZ__SERVICE_MAP_CHART,
  },
  EDIT_FLOW: {
    type: Button.TYPE.SECONDARY,
    iconType: Icon.TYPE.INTERFACE__OPERATIONS__EDIT,
    hint: UI_CONTENT.GLOBAL.BUTTON_LABEL_EDIT_MODE,
  },
  EDIT_FLOW_SETTINGS: {
    type: Button.TYPE.TERTIARY,
    label: UI_CONTENT.GLOBAL.BUTTON_LABEL_EDIT_SETTINGS,
  },
  EXPORT_FLOW: {
    type: Button.TYPE.TERTIARY,
    label: UI_CONTENT.GLOBAL.BUTTON_LABEL_EXPORT_FLOW,
  },
  AUDIT_LOG: {
    type: Button.TYPE.TERTIARY,
    label: UI_CONTENT.GLOBAL.BUTTON_LABEL_AUDIT_LOG,
  },
  HELP: {
    type: Button.TYPE.TERTIARY,
    label: UI_CONTENT.GLOBAL.BUTTON_LABEL_HELP,
  },
};

const HomeNerdlet = () => {
  const [app, setApp] = useState({});
  const [mode, setMode] = useState(MODES.INLINE);
  const [debugMode, setDebugMode] = useState(false);
  const [prevNonEditMode, setPrevNonEditMode] = useState(MODES.INLINE);
  const [flows, setFlows] = useState([]);
  const [currentFlowId, setCurrentFlowId] = useState();
  const [isAuditLogShown, setisAuditLogShown] = useState(false);
  const [isHelpModalShown, setIsHelpModalShown] = useState(false);
  const [editFlowSettings, setEditFlowSettings] = useState(false);
  const [transitionToFlow, setTransitionToFlow] = useState(false);
  const [isExportFlowModalShown, setIsExportFlowModalShown] = useState(false);
  const { accountId } = useContext(PlatformStateContext);
  const [nerdletState, setNerdletState] = useNerdletState();
  const { user } = useFetchUser();
  const {
    flows: flowsData,
    error: flowsError,
    loading: flowsLoading,
    refetch: flowsRefetch,
  } = useFlowLoader({ accountId });
  const { data: accounts = [], loading: isAcctsLoading } = useAccountsQuery();
  const transitionTimeoutId = useRef();

  useEffect(() => {
    return () => {
      if (transitionTimeoutId.current)
        clearTimeout(transitionTimeoutId.current);
    };
  }, []);

  useEffect(() => {
    if (!isAcctsLoading) {
      setApp({
        account: {
          id: accountId,
          name: accounts.find(({ id }) => id === accountId)?.name,
        },
        accounts: accounts.map(({ id, name }) => ({ id, name })),
        debugMode,
        maxEntitiesInStep: MAX_ENTITIES_IN_STEP,
        user,
      });
    }
  }, [accountId, accounts, user, debugMode, isAcctsLoading]);

  useEffect(() => {
    let actionControlButtons;
    if (!flowsError?.message) {
      const defaultButtons = currentFlowId
        ? [
            {
              ...ACTION_BTN_ATTRIBS.EDIT_FLOW_SETTINGS,
              onClick: () => setEditFlowSettings(true),
            },
            {
              ...ACTION_BTN_ATTRIBS.HELP,
              onClick: () => setIsHelpModalShown(true),
            },
            {
              type: Button.TYPE.TERTIARY,
              label: UI_CONTENT.GLOBAL.BUTTON_LABEL_DEBUG[+debugMode],
              onClick: () => setDebugMode((dm) => !dm),
            },
          ]
        : [
            {
              ...ACTION_BTN_ATTRIBS.CREATE_FLOW,
              onClick: newFlowHandler,
            },
            {
              ...ACTION_BTN_ATTRIBS.HELP,
              onClick: () => setIsHelpModalShown(true),
            },
            {
              type: Button.TYPE.TERTIARY,
              label: UI_CONTENT.GLOBAL.BUTTON_LABEL_DEBUG[+debugMode],
              onClick: () => setDebugMode((dm) => !dm),
            },
          ];

      actionControlButtons =
        currentFlowId && mode !== MODES.EDIT
          ? [
              {
                ...ACTION_BTN_ATTRIBS.EDIT_FLOW,
                onClick: () => transitionToMode(MODES.EDIT),
              },
              {
                ...ACTION_BTN_ATTRIBS.EXPORT_FLOW,
                onClick: () => setIsExportFlowModalShown(true),
              },
              {
                ...ACTION_BTN_ATTRIBS.AUDIT_LOG,
                onClick: () => setisAuditLogShown(true),
              },
              ...defaultButtons,
              {
                ...ACTION_BTN_ATTRIBS.CREATE_FLOW,
                onClick: newFlowHandler,
              },
            ]
          : [...defaultButtons];
    }

    nerdlet.setConfig({
      accountPicker: true,
      actionControls: true,
      actionControlButtons,
      headerType: nerdlet.HEADER_TYPE.CUSTOM,
      headerTitle: 'Pathpoint',
      timePicker: false,
    });
  }, [currentFlowId, flows, flowsError, mode, debugMode]);

  useEffect(() => setCurrentFlowId(nerdletState.flow?.id), [nerdletState.flow]);

  useEffect(() => {
    const newMode = nerdletState.mode || MODES.INLINE;
    if (newMode !== MODES.EDIT) setPrevNonEditMode(newMode);
    setMode(newMode);
  }, [nerdletState.mode]);

  useEffect(() => {
    if (nerdletState.refreshFlows) {
      flowsRefetch();
      setNerdletState({ refreshFlows: false });
    }
  }, [nerdletState.refreshFlows]);

  useEffect(() => setFlows(flowsData || []), [flowsData]);

  const newFlowHandler = () =>
    navigation.openStackedNerdlet({
      id: 'create-flow',
    });

  const flowClickHandler = useCallback(
    (id) =>
      setNerdletState({
        flow: { id },
        isPlayback: false,
        signalExpandOption: 0,
        playbackTimeRange: null,
        playbackIncrement: null,
      }),
    []
  );

  const backToFlowsHandler = useCallback(() => {
    setNerdletState({
      flow: {},
      isPlayback: false,
      signalExpandOption: 0,
      playbackTimeRange: null,
      playbackIncrement: null,
      mode: MODES.INLINE,
    });
    flowsRefetch?.();
  }, [flowsRefetch]);

  const transitionToMode = useCallback((newMode) => {
    setTransitionToFlow(true);
    transitionTimeoutId.current = setTimeout(() => {
      setTransitionToFlow(false);
    }, 1000);
    if (newMode)
      setNerdletState({
        mode: newMode,
      });
  }, []);

  const auditLogCloseHandler = () => setisAuditLogShown(false);

  const exportModalCloseHandler = () => setIsExportFlowModalShown(false);

  const currentFlowDoc = useMemo(
    () => (currentFlowId ? flowDocument(flows, currentFlowId) : null),
    [currentFlowId, flows]
  );

  const currentView = useMemo(() => {
    if (flowsLoading || transitionToFlow) return <Spinner />;

    if (flowsError?.message)
      return (
        <EmptyState
          fullHeight
          fullWidth
          type={EmptyState.TYPE.ERROR}
          iconType={
            EmptyState.ICON_TYPE.INTERFACE__SIGN__EXCLAMATION__V_ALTERNATE
          }
          title="Error fetching flows!"
          description={flowsError.message}
        />
      );

    if (currentFlowDoc)
      return (
        <AppContext.Provider value={app}>
          <SidebarProvider>
            <Flow
              flowDoc={currentFlowDoc}
              onClose={backToFlowsHandler}
              mode={mode}
              setMode={transitionToMode}
              prevNonEditMode={prevNonEditMode}
              flows={flows}
              onRefetch={flowsRefetch}
              onSelectFlow={flowClickHandler}
              onTransition={transitionToMode}
              isAuditLogShown={isAuditLogShown}
              onAuditLogClose={auditLogCloseHandler}
              editFlowSettings={editFlowSettings}
              setEditFlowSettings={setEditFlowSettings}
            />
            <Sidebar />
          </SidebarProvider>
        </AppContext.Provider>
      );

    if (flows && flows.length)
      return <FlowList flows={flows} onClick={flowClickHandler} />;

    return <NoFlows newFlowHandler={newFlowHandler} />;
  }, [
    flows,
    flowsError,
    flowsLoading,
    flowsRefetch,
    currentFlowDoc,
    accountId,
    mode,
    flowClickHandler,
    isAuditLogShown,
    editFlowSettings,
    transitionToFlow,
  ]);

  return (
    <div className="container">
      <div className="messages-wrapper">
        <Messages
          org="newrelic"
          repo="nr-labs-pathpoint"
          branch="main"
          directory="docs"
          timeoutPeriod={604800} // 1 week
        />
      </div>
      <div className="main">{currentView}</div>
      {isHelpModalShown && (
        <HelpModal
          isModalOpen={isHelpModalShown}
          setModalOpen={setIsHelpModalShown}
          about={UI_CONTENT.HELP_MODAL.ABOUT}
          urls={UI_CONTENT.HELP_MODAL.URLS}
          ownerBadge={UI_CONTENT.HELP_MODAL.OWNER_BADGE}
        />
      )}
      <ExportFlowModal
        flowDoc={currentFlowDoc}
        hidden={!isExportFlowModalShown}
        onClose={exportModalCloseHandler}
      />
    </div>
  );
};

export default HomeNerdlet;
