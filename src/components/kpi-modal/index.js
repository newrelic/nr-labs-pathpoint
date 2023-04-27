/* eslint-disable prettier/prettier, no-unused-vars */
import React, { useCallback, useContext, useMemo, useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  BlockText,
  Button,
  EmptyState,
  HeadingText,
  Modal,
  PlatformStateContext,
  debug,
} from 'nr1';

// import { EditInPlace, NrqlEditor/* , SimpleBillboard */ } from '@newrelic/nr-labs-components';
import { EditInPlace, NrqlEditor, SimpleBillboard } from 'nr-labs-components';

import { utils } from '../utils/utils';


const KpiModal = ({
  kpi,
  kpiIndex,
  kpiMode, // kpiMode = "view" / "add" kpi / "edit" existing kpi / "delete" existing kpi
  showModal,
  setShowModal,
  setModalMounted,
  updateKpiArray,
  // updateCurrentKpi,
  // deleteKpi,
}) => {
  debug && console.log(`### SK >>> MODAL - ${new Date().getTime()}: kpiMode: ${kpiMode}, kpi.name: ${kpi.name}, showModal: ${showModal}`);

  // const { accountId } = useContext(PlatformStateContext);
  const [accountId, setAccountId] = useState(useContext(PlatformStateContext).accountId);
  if (!accountId && kpi.accountIds[0]) useContext(PlatformStateContext).accountId = kpi.accountIds[0];

  const [name, setName] = useState(['edit', 'delete'].includes(kpiMode) ? kpi.name : '');
  const [desc, setDesc] = useState(['edit', 'delete'].includes(kpiMode) ? kpi.desc : '');
  const [nrqlQuery, setNrqlQuery] = useState(['edit', 'delete'].includes(kpiMode) ? kpi.nrqlQuery : ''); // SK TODO - trigger refreshPreview() !!??

  // values passed to render Perview
  const [kpiValues, setKpiValues] = useState({name: kpi.name, value: '', previousValue: '', error: null})

  // ready to run query / save kpi
  const [previewEnabled, setPreviewEnabled] = useState(Boolean(kpi.name && kpi.nrqlQuery && kpi.accountIds[0]));

  // last nrql query empty or failed with error
  const [nrqlSuccessful, setNrqlSuccessful] = useState(false);

  const nameRef = useRef('name');
  const descRef = useRef('desc');

  useEffect(() => {
    debug && console.log(`### SK >>> MODAL - ${new Date().getTime()}: useEffect(kpi)`);
    setName(kpi.name);
    setDesc(kpi.desc);
    setNrqlQuery(kpi.nrqlQuery);
  },[kpi]);

  useEffect(() => {
    setPreviewEnabled(Boolean(name && nrqlQuery && accountId));
    previewEnabled && refreshPreview({ accountId: kpi.accountIds[0], query: nrqlQuery })
  }, [name, nrqlQuery, accountId]);

  const refreshPreview = useCallback( async (res) => {
    if (!res.query) {
      setNrqlSuccessful(false);
      setPreviewEnabled(false);
    } else {
      const result = await utils.runQuery([{ index: 0, accountIds: [res.accountId], nrqlQuery: res.query }]);

      if (result.graphQLErrors) {
        setNrqlSuccessful(false);
        setKpiValues({
          error: result.graphQLErrors[0].message,
        });
      } else {
        setNrqlSuccessful(true);
        setKpiValues({
          value: result[0].value,
          previousValue: result[0].previousValue,
          error: null,
        });
      }
      setPreviewEnabled(true);
    }
  }, []);
  
  debug && console.log(`### SK >>> MODAL - ${new Date().getTime()}: kpiMode: ${kpiMode}, kpi.name: ${kpi.name}, showModal: ${showModal}, previewEnabled: ${previewEnabled}`);
  return (
    <div>
      <Modal hidden={!showModal} onHideEnd={() => setModalMounted(false)} onClose={() => setShowModal(false)}>
        <div className="modal-component">
          <div>
            <HeadingText 
              className="modal-component-kpi-title"
              type={HeadingText.TYPE.HEADING_3}
            >
              {kpiMode === 'add' ? 'Create new KPI' : kpiMode === 'edit' ? 'Update KPI' : 'Delete KPI'}
            </HeadingText>
          </div>

          <div className="modal-component-detail">
            {kpiMode === 'delete' 
              ? (
                <div className="modal-component-delete">
                  <BlockText type={BlockText.TYPE.PARAGRAPH}>
                    Are you sure you want to delete &quot;<strong>{kpi.name}</strong>&quot; KPI ?
                  </BlockText>
                </div>
              )
              : (
                <div>
                  <div className="modal-component-edit-in-place">

                    <div className="modal-component-kpi-name">
                      <EditInPlace
                        className="test-class"
                        value={name}
                        setValue={setName}
                        ref={nameRef}
                        placeholder="Enter KPI name"
                      />
                    </div>

                    <div>
                      <EditInPlace
                        className="test-class"
                        value={desc}
                        setValue={setDesc}
                        ref={descRef}
                        placeholder="Description"
                      />
                    </div>

                  </div>


                  <div className="modal-component-nrql-editor">
                    <NrqlEditor 
                      className="test-class"
                      query={kpi.nrqlQuery}
                      accountId={accountId}
                      saveButtonText="Preview"
                      onSave={res => {
                        setAccountId(res.accountId);
                        setNrqlQuery(res.query);
                        debug && console.log('Preview button clicked - res: ', res);
                        refreshPreview(res);
                      }} 
                    />
                  </div>


                  <div>
                    <div className="modal-component-preview-heading">
                      <HeadingText type={HeadingText.TYPE.HEADING_3}>Preview</HeadingText>
                    </div>
                    {!previewEnabled || kpiValues.error
                      ? <div className="modal-component-empty-state">
                        <EmptyState
                          fullWidth
                          iconType={
                            EmptyState.ICON_TYPE.INTERFACE__PLACEHOLDERS__ICON_PLACEHOLDER
                          }
                          title={kpiValues.error ? "Error!" : "No preview available yet"}

                          description={!previewEnabled ? "Run a query to view the preview" : kpiValues.error}

                          type={!previewEnabled ? EmptyState.TYPE.NORMAL : EmptyState.TYPE.ERROR}

                          additionalInfoLink={{
                            label: 'See our NRQL reference',
                            onClick: console.log('### SK >>> additional link clicked'),
                            to: 'https://docs.newrelic.com/docs/query-your-data/nrql-new-relic-query-language/get-started/nrql-syntax-clauses-functions/',
                            // query builder -> to: 'https://docs.newrelic.com/docs/query-your-data/explore-query-data/query-builder/introduction-query-builder/',
                          }}
                        />
                      </div>
                      : ( 
                        <div className="kpi-data">
                          <SimpleBillboard
                            metric={{
                              value: kpiValues.value,
                              previousValue: kpiValues.previousValue,
                            }}
                            title={{
                              name: name, 
                              style: { width: '360px'},
                            }}
                          />
                        </div>
                      )
                    }
                  </div>

                </div>
              )
            }
          </div>

          <div>

            <Button
              className={`kpi-modal-buttons ${kpiMode === 'add' ? 'add' : kpiMode === 'edit' ? 'save' : 'delete'}`}
              type={kpiMode === 'delete' ? Button.TYPE.DESTRUCTIVE : Button.TYPE.PRIMARY}
              sizeType={Button.SIZE_TYPE.LARGE}
              spacingType={[ HeadingText.SPACING_TYPE.EXTRA_LARGE ]}
              disabled={!(name && accountId && nrqlQuery && nrqlSuccessful)}
              onClick={e => {
                debug && console.log(`### SK >>> MODAL - ${new Date().getTime()}: SAVE button cliecked - "${kpiMode === 'add' ? 'Add' : kpiMode === 'delete' ? 'Delete' : 'Edit'} KPI" -- event: `, e);
                switch(kpiMode) {
                  case 'add':
                    updateKpiArray({ id: kpi.id, accountIds: [accountId], name, desc, nrqlQuery })
                    break;
                  case 'edit':
                    updateKpiArray({ id: kpi.id, accountIds: [accountId], name, desc, nrqlQuery }, kpiIndex)
                    break;
                  case 'delete':
                    updateKpiArray(kpiIndex);
                }
                setShowModal(false);
              }}
            >
              {kpiMode === 'add' ? 'Add KPI' : kpiMode === 'edit' ? 'Save changes' : 'Delete KPI'}
            </Button>

            {kpiMode === 'delete' && (
                <Button
                  className={`kpi-modal-buttons delete`}
                  type={Button.TYPE.NORMAL}
                  sizeType={Button.SIZE_TYPE.LARGE}
                  spacingType={[ HeadingText.SPACING_TYPE.EXTRA_LARGE ]}
                  onClick={e => {
                    debug && console.log(`### SK >>> MODAL - ${new Date().getTime()}: CANCEL button cliecked -- event: `, e);
                    setShowModal(false);
                  }}
                >
                  Cancel
                </Button>
            )}

          </div>
        </div>
      </Modal>
    </div>
  )
}

KpiModal.propTypes = {
  kpi: PropTypes.object,
  kpiIndex:PropTypes.number,
  kpiMode: PropTypes.string,
  showModal: PropTypes.bool,
  setShowModal: PropTypes.func,
  setModalMounted: PropTypes.func,
  updateKpiArray: PropTypes.func,
  debug: PropTypes.boolean,
};

export default KpiModal;
/* eslint-enable prettier/prettier, no-unused-vars */
