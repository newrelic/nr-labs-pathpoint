import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { Spinner, useAccountStorageMutation } from 'nr1';

import { KpiBar, Stages, DeleteConfirmModal } from '../';
import FlowHeader from './header';
import { MODES, NERD_STORAGE } from '../../constants';
import { useFlowWriter } from '../../hooks';

const Flow = forwardRef(
  (
    {
      flow = {},
      onUpdate,
      onClose,
      accountId,
      mode = MODES.INLINE,
      setMode = () => null,
      flows = [],
      onSelectFlow = () => null,
      user,
    },
    ref
  ) => {
    const [isDeletingFlow, setDeletingFlow] = useState(false);
    const [stages, setStages] = useState([]);
    const [kpis, setKpis] = useState([]);
    const [deleteModalHidden, setDeleteModalHidden] = useState(true);
    const [lastSavedTimestamp, setLastSavedTimestamp] = useState();
    const flowWriter = useFlowWriter({ accountId, user });

    useEffect(() => {
      setStages(flow.stages || []);
      setKpis(flow.kpis || []);
    }, [flow]);

    const flowUpdateHandler = useCallback(
      (updates = {}) => {
        setLastSavedTimestamp(0);
        flowWriter.write({
          documentId: flow.id,
          document: {
            ...flow,
            ...updates,
          },
        });
      },
      [flow]
    );

    useEffect(() => {
      const { nerdStorageWriteDocument: document } = flowWriter?.data || {};
      if (document) {
        if (onUpdate) onUpdate(document);
        setLastSavedTimestamp(Date.now());
      }
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

    return (
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
            <Stages stages={stages} onUpdate={flowUpdateHandler} mode={mode} />
            <KpiBar kpis={kpis} onChange={updateKpisHandler} mode={mode} />
          </>
        ) : (
          <Spinner />
        )}
      </div>
    );
  }
);

Flow.propTypes = {
  flow: PropTypes.object,
  onUpdate: PropTypes.func,
  onClose: PropTypes.func,
  accountId: PropTypes.number,
  mode: PropTypes.oneOf(Object.values(MODES)),
  setMode: PropTypes.func,
  flows: PropTypes.array,
  onSelectFlow: PropTypes.func,
  user: PropTypes.object,
};

Flow.displayName = 'Flow';

export default Flow;
