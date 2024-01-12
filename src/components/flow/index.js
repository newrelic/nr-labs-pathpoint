import React, {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import { Spinner, useAccountStorageMutation } from 'nr1';

import { KpiBar, Stages, DeleteConfirmModal } from '../';
import FlowHeader from './header';
import { MODES, NERD_STORAGE } from '../../constants';
import { useFlowWriter } from '../../hooks';
import { AppContext, FlowContext, FlowDispatchContext } from '../../contexts';
import {
  FLOW_DISPATCH_COMPONENTS,
  FLOW_DISPATCH_TYPES,
  flowReducer,
} from '../../reducers';

const Flow = forwardRef(
  (
    {
      flowDoc = {},
      onClose,
      mode = MODES.INLINE,
      setMode = () => null,
      flows = [],
      onSelectFlow = () => null,
    },
    ref
  ) => {
    const [flow, dispatch] = useReducer(flowReducer, {});
    const [isDeletingFlow, setDeletingFlow] = useState(false);
    const [kpis, setKpis] = useState([]);
    const [deleteModalHidden, setDeleteModalHidden] = useState(true);
    const [lastSavedTimestamp, setLastSavedTimestamp] = useState();
    const flowWriter = useFlowWriter({ accountId, user });
    const { account: { id: accountId } = {}, user } = useContext(AppContext);

    useEffect(
      () =>
        dispatch({
          type: FLOW_DISPATCH_TYPES.CHANGED,
          component: FLOW_DISPATCH_COMPONENTS.FLOW,
          updates: flowDoc,
        }),
      [flowDoc]
    );

    useEffect(() => {
      setKpis(flow.kpis || []);
    }, [flow]);

    const saveFlow = useCallback((document) => {
      setLastSavedTimestamp(0);
      const documentId = document.id;
      flowWriter.write({ documentId, document });
    }, []);

    const flowUpdateHandler = (updates = {}) =>
      dispatch({
        type: FLOW_DISPATCH_TYPES.UPDATED,
        component: FLOW_DISPATCH_COMPONENTS.FLOW,
        updates,
        saveFlow,
      });

    useEffect(() => {
      const { nerdStorageWriteDocument: document } = flowWriter?.data || {};
      if (document) setLastSavedTimestamp(Date.now());
    }, [flowWriter.data]);

    const updateKpisHandler = (updatedKpis) =>
      flowUpdateHandler({ kpis: updatedKpis });

    const [deleteFlow, { data: deleteFlowData, error: deleteFlowError }] =
      useAccountStorageMutation({
        actionType: useAccountStorageMutation.ACTION_TYPE.DELETE_DOCUMENT,
        collection: NERD_STORAGE.FLOWS_COLLECTION,
        accountId: accountId,
      });

    const deleteFlowHandler = useCallback(async () => {
      setDeletingFlow(true);
      await deleteFlow({
        documentId: flow.id,
      });
      setDeletingFlow(false);
    }, [flow]);

    useEffect(() => {
      const { nerdStorageDeleteDocument: { deleted } = {} } =
        deleteFlowData || {};
      if (deleted) onClose();
    }, [deleteFlowData]);

    useEffect(() => {
      if (deleteFlowError)
        console.error('Error deleting flow', deleteFlowError);
    }, [deleteFlowError]);

    const exportFlowHandler = useCallback(() => {
      const { created, ...exportableFlow } = flow || {}; // eslint-disable-line no-unused-vars
      const exportBtn = document.createElement('a');
      exportBtn.download = `${(flow?.name || 'flow')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()}.json`;
      exportBtn.href = URL.createObjectURL(
        new Blob([JSON.stringify(exportableFlow)], { type: 'application/json' })
      );
      exportBtn.click();
      exportBtn.remove();
    }, [flow]);

    return (
      <FlowContext.Provider value={flow}>
        <FlowDispatchContext.Provider value={dispatch}>
          <div className="flow" ref={ref}>
            {mode === MODES.EDIT && (
              <DeleteConfirmModal
                name={flow.name}
                type="flow"
                hidden={deleteModalHidden}
                onConfirm={() => deleteFlowHandler()}
                onClose={() => setDeleteModalHidden(true)}
                isDeletingFlow={isDeletingFlow}
              />
            )}
            {!isDeletingFlow ? (
              <>
                <FlowHeader
                  name={flow.name}
                  imageUrl={flow.imageUrl}
                  onUpdate={flowUpdateHandler}
                  onClose={onClose}
                  mode={mode}
                  setMode={setMode}
                  flows={flows}
                  onSelectFlow={onSelectFlow}
                  onExportFlow={exportFlowHandler}
                  onDeleteFlow={() => setDeleteModalHidden(false)}
                  lastSavedTimestamp={lastSavedTimestamp}
                  resetLastSavedTimestamp={() => setLastSavedTimestamp(0)}
                />
                <Stages mode={mode} saveFlow={saveFlow} />
                <KpiBar kpis={kpis} onChange={updateKpisHandler} mode={mode} />
              </>
            ) : (
              <Spinner />
            )}
          </div>
        </FlowDispatchContext.Provider>
      </FlowContext.Provider>
    );
  }
);

Flow.propTypes = {
  flowDoc: PropTypes.object,
  onClose: PropTypes.func,
  mode: PropTypes.oneOf(Object.values(MODES)),
  setMode: PropTypes.func,
  flows: PropTypes.array,
  onSelectFlow: PropTypes.func,
};

Flow.displayName = 'Flow';

export default Flow;
