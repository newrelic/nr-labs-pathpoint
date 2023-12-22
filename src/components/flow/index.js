import React, {
  forwardRef,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import {
  Spinner,
  useAccountStorageMutation,
  useAccountStorageQuery,
  HeadingText,
} from 'nr1';

import { KpiBar, Stages, DeleteConfirmModal } from '../';
import FlowHeader from './header';
import { MODES, NERD_STORAGE } from '../../constants';
import { useFlowWriter } from '../../hooks';
import { FlowContext, FlowDispatchContext, useSidebar } from '../../contexts';
import { formatTimestamp } from '../../utils';
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
      accountId,
      mode = MODES.INLINE,
      setMode = () => null,
      flows = [],
      onSelectFlow = () => null,
      user,
      showAuditLog = false,
      setShowAuditLog = () => null,
    },
    ref
  ) => {
    const [flow, dispatch] = useReducer(flowReducer, {});
    const [isDeletingFlow, setDeletingFlow] = useState(false);
    const [kpis, setKpis] = useState([]);
    const [deleteModalHidden, setDeleteModalHidden] = useState(true);
    const [lastSavedTimestamp, setLastSavedTimestamp] = useState();
    const flowWriter = useFlowWriter({ accountId, user });
    const { openSidebar, closeSidebar, isOpen } = useSidebar();

    useEffect(async () => {
      if (showAuditLog && flowDoc.id > '') {
        const loadAuditLog = async (accountId, documentId) => {
          const { data: logsData, error: logReadError } =
            await useAccountStorageQuery.query({
              accountId,
              collection: NERD_STORAGE.EDITS_LOG_COLLECTION,
              documentId,
            });
          return { logsData, logReadError };
        };

        const { logsData, logReadError } = await loadAuditLog(
          accountId,
          flowDoc.id
        );

        if (logReadError) {
          console.error('Error loading audit log', logReadError);
        }

        openSidebar({
          content: (
            <div className="audit-log-content">
              <div className="audit-log-header">
                <HeadingText type={HeadingText.TYPE.HEADING_2}>
                  Audit Log
                </HeadingText>
              </div>
              <div className="audit-log-items">
                {logsData.logs.reverse().map((log) => (
                  <div key={`log_${log.id}`} className="audit-log-item">
                    <p className="user-name">
                      {log.user.name}
                      <span className="change-date">{` (${log.user.email})`}</span>
                    </p>
                    <p className="change-date">
                      {formatTimestamp(log.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ),
        });
      } else {
        closeSidebar();
      }
    }, [showAuditLog, flowDoc.id]);

    useEffect(() => {
      if (!isOpen) {
        setShowAuditLog(false);
      }
    }, [isOpen]);

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
      if (deleted) {
        closeSidebar();
        setShowAuditLog(false);
        onClose();
      }
    }, [deleteFlowData]);

    useEffect(() => {
      if (deleteFlowError)
        console.error('Error deleting flow', deleteFlowError);
    }, [deleteFlowError]);

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
  accountId: PropTypes.number,
  mode: PropTypes.oneOf(Object.values(MODES)),
  setMode: PropTypes.func,
  flows: PropTypes.array,
  onSelectFlow: PropTypes.func,
  user: PropTypes.object,
  showAuditLog: PropTypes.bool,
  setShowAuditLog: PropTypes.func,
};

Flow.displayName = 'Flow';

export default Flow;
