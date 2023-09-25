import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button, Icon, nerdlet, PlatformStateContext, Spinner } from 'nr1';

import { Flow, FlowList, NoFlows, Sidebar } from '../../src/components';
import {
  useFlowLoader,
  useFlowWriter,
  useFetchUser,
  useFetchUserConfig,
  useUpdateUserConfig,
} from '../../src/hooks';
import { MODES, UI_CONTENT } from '../../src/constants';
import { uuid } from '../../src/utils';
import { SidebarProvider } from '../../src/contexts';

const HomeNerdlet = () => {
  const [mode, setMode] = useState(MODES.INLINE);
  const [flows, setFlows] = useState([]);
  const [currentFlowIndex, setCurrentFlowIndex] = useState(-1);
  const { accountId } = useContext(PlatformStateContext);
  const userRef = useRef();
  userRef.current = useFetchUser();
  const [userConfig, setUserConfig] = useState({});
  const { userStorageConfig } = useFetchUserConfig();
  const { userStorageHandler } = useUpdateUserConfig();
  const [loadingUserConfig, setLoadingUserConfig] = useState(true);

  useEffect(() => {
    if (
      loadingUserConfig &&
      userStorageConfig &&
      Object.prototype.toString.call(userStorageConfig) !== '[object Set]'
    ) {
      setUserConfig({
        ...userStorageConfig,
        favorite_flows: new Set(
          userStorageConfig.favorite_flows &&
          Object.prototype.toString.call(userStorageConfig.favorite_flows) ===
            '[object Array]'
            ? userStorageConfig.favorite_flows
            : []
        ),
        last_updated: new Date().getTime(),
      });
      setLoadingUserConfig(false);
    }
  }, [userStorageConfig]);

  useEffect(() => {
    if (
      Object.prototype.toString.call(userConfig.favorite_flows) ===
      '[object Set]'
    ) {
      userStorageHandler({
        ...userConfig,
        favorite_flows: Array.from(userConfig.favorite_flows),
      });
    }
  }, [userConfig?.favorite_flows?.size]);

  const {
    flows: flowsData,
    error: flowsError,
    loading: flowsLoading,
  } = useFlowLoader({ accountId });

  const flowWriter = useFlowWriter({ accountId, user: userRef.current.user });
  const newFlowId = useRef();

  const actionControlButtons = useMemo(() => {
    const buttons = [];
    if (mode !== MODES.EDIT) {
      buttons.push({
        label: UI_CONTENT.GLOBAL.BUTTON_LABEL_CREATE_FLOW,
        type: Button.TYPE.PRIMARY,
        iconType: Icon.TYPE.DATAVIZ__DATAVIZ__SERVICE_MAP_CHART,
        onClick: () => newFlowHandler(),
      });
      if (currentFlowIndex > -1) {
        buttons.push({
          label: UI_CONTENT.GLOBAL.BUTTON_LABEL_EDIT_MODE,
          type: Button.TYPE.PRIMARY,
          iconType: Icon.TYPE.INTERFACE__OPERATIONS__EDIT,
          onClick: () => setMode(MODES.EDIT),
        });
      }
    }
    return buttons;
  }, [mode, newFlowHandler, currentFlowIndex, newFlowId, setMode]);

  useEffect(() => {
    nerdlet.setConfig({
      accountPicker: true,
      actionControls: true,
      actionControlButtons: actionControlButtons,
      headerType: nerdlet.HEADER_TYPE.CUSTOM,
      headerTitle: 'Project Hedgehog 🦔',
    });
  }, [mode, newFlowHandler, currentFlowIndex]);

  useEffect(() => {
    setFlows(flowsData || []);
    if (newFlowId.current) {
      // TODO: set current flow
      // const index = flowsData.findIndex((f) => f.id === newFlowId.current);
      newFlowId.current = null;
    }
  }, [flowsData]);

  useEffect(() => {
    if (flowsError) console.error('Error fetching flows', flowsError);
  }, [flowsError]);

  const newFlowHandler = useCallback(() => {
    const id = uuid();
    newFlowId.current = id;
    flowWriter.write({
      documentId: id,
      document: {
        id,
        name: 'Untitled',
        stages: [],
        kpis: [],
        createdBy: {
          name: userRef.current.user.name,
          timestamp: Date.now(),
        },
      },
    });
  }, []);

  const updateFlowHandler = useCallback(
    ({ id, ...doc }) => {
      const updatedFlows = [...flows];
      const index = updatedFlows.findIndex((f) => f.id === id);
      if (index > -1) updatedFlows[index] = { id, document: { id, ...doc } };
      setFlows(updatedFlows);
    },
    [flows]
  );

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
    if (currentFlowIndex > -1 && flows?.[currentFlowIndex]?.document) {
      return (
        <SidebarProvider>
          <>
            <Flow
              flow={flows[currentFlowIndex].document}
              onUpdate={updateFlowHandler}
              onClose={backToFlowsHandler}
              accountId={accountId}
              mode={mode}
              setMode={setMode}
              flows={flows}
              onSelectFlow={flowClickHandler}
              user={userRef.current.user}
            />
            <Sidebar />
          </>
        </SidebarProvider>
      );
    }
    if (flows && flows.length) {
      backToFlowsHandler();
      return (
        <FlowList
          flows={flows}
          userConfig={userConfig}
          setUserConfig={setUserConfig}
          onClick={flowClickHandler}
        />
      );
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
  ]);

  return <div className="container">{currentView}</div>;
};

export default HomeNerdlet;
