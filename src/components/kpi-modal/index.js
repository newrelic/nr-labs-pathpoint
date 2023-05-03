import React, {
  useCallback,
  useContext,
  useRef,
  useEffect,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  EmptyState,
  HeadingText,
  Modal,
  PlatformStateContext,
} from 'nr1';

import {
  EditInPlace,
  NrqlEditor,
  SimpleBillboard,
} from '@newrelic/nr-labs-components';

import { nrqlQueries } from '../utils/nerdGraph';

const KpiModal = ({
  kpi,
  kpiIndex,
  kpiMode, // kpiMode = "view" / "add" kpi / "edit" existing kpi / "delete" existing kpi
  showModal,
  setShowModal,
  setModalMounted,
  updateKpiArray,
}) => {
  const [accountId, setAccountId] = useState(
    useContext(PlatformStateContext).accountId
  );
  if (!accountId && kpi.accountIds[0])
    useContext(PlatformStateContext).accountId = kpi.accountIds[0];

  const [name, setName] = useState(
    ['edit', 'delete'].includes(kpiMode) ? kpi.name : ''
  );
  const [nrqlQuery, setNrqlQuery] = useState(
    ['edit', 'delete'].includes(kpiMode) ? kpi.nrqlQuery : ''
  ); // SK TODO - trigger refreshPreview() !!??

  // values passed to render Perview
  const [kpiValues, setKpiValues] = useState({
    name: kpi.name,
    value: '',
    previousValue: '',
    error: null,
  });

  // ready to run query / save kpi
  const [previewEnabled, setPreviewEnabled] = useState(
    Boolean(kpi.name && kpi.nrqlQuery && kpi.accountIds[0])
  );

  // last nrql query empty or failed with error
  const [nrqlSuccessful, setNrqlSuccessful] = useState(false);

  const nameRef = useRef('name');

  useEffect(() => {
    setName(kpi.name);
    setNrqlQuery(kpi.nrqlQuery);
  }, [kpi]);

  useEffect(() => {
    setPreviewEnabled(Boolean(name && nrqlQuery && accountId));
    previewEnabled &&
      refreshPreview({ accountId: kpi.accountIds[0], query: nrqlQuery });
  }, [name, nrqlQuery, accountId]);

  const refreshPreview = useCallback(async (res) => {
    if (!res.query) {
      setNrqlSuccessful(false);
      setPreviewEnabled(false);
    } else {
      const result = await nrqlQueries(
        {
          index: kpiIndex,
          accountIds: [res.accountId],
          nrqlQuery: res.query,
        },
        true // map nrql result to kpi value & previousValue
      );

      if (result.graphQLErrors) {
        setNrqlSuccessful(false);
        setKpiValues({
          error: result.graphQLErrors[0].message,
        });
      } else {
        setNrqlSuccessful(true);
        setKpiValues({
          value: (result || [])[0].value || '',
          previousValue: (result || [])[0].previousValue || '',
          error: null,
        });
      }
      setPreviewEnabled(true);
    }
  }, []);

  return (
    <Modal
      hidden={!showModal}
      onHideEnd={() => setModalMounted(false)}
      onClose={() => setShowModal(false)}
    >
      <div className="modal-component">
        <div
          className={`${kpiMode !== 'delete' && 'modal-component-kpi-title'}`}
        ></div>

        <div className={`${kpiMode !== 'delete' && 'modal-component-detail'}`}>
          {kpiMode === 'delete' ? (
            <div>
              <HeadingText type={HeadingText.TYPE.HEADING_3}>
                Are you sure you want to delete &quot;{kpi.name}&quot; KPI ?
              </HeadingText>
            </div>
          ) : (
            <>
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
              </div>

              <div className="modal-component-nrql-editor">
                <NrqlEditor
                  className="test-class"
                  query={kpi.nrqlQuery}
                  accountId={accountId}
                  saveButtonText="Preview"
                  onSave={(res) => {
                    setAccountId(res.accountId);
                    setNrqlQuery(res.query);
                    refreshPreview(res);
                  }}
                />
              </div>
              <div className="modal-component-preview-heading">
                <HeadingText type={HeadingText.TYPE.HEADING_1}>
                  Preview:
                </HeadingText>
              </div>
              {!previewEnabled || kpiValues.error ? (
                <div className="modal-component-empty-state">
                  <EmptyState
                    fullWidth
                    iconType={
                      EmptyState.ICON_TYPE
                        .INTERFACE__PLACEHOLDERS__ICON_PLACEHOLDER
                    }
                    title={
                      kpiValues.error ? 'Error!' : 'No preview available yet'
                    }
                    description={
                      !previewEnabled
                        ? 'Run a query to view the preview'
                        : kpiValues.error
                    }
                    type={
                      !previewEnabled
                        ? EmptyState.TYPE.NORMAL
                        : EmptyState.TYPE.ERROR
                    }
                    additionalInfoLink={{
                      label: 'See our NRQL reference',
                      to: 'https://docs.newrelic.com/docs/query-your-data/nrql-new-relic-query-language/get-started/nrql-syntax-clauses-functions/',
                    }}
                  />
                </div>
              ) : (
                <div className="kpi-data">
                  <SimpleBillboard
                    metric={{
                      value: kpiValues.value,
                      previousValue: kpiValues.previousValue,
                      className: 'modal-component-metric-value',
                    }}
                    statusTrend={{
                      className: 'modal-component-status-trend',
                    }}
                    title={{
                      name: name,
                      className: 'modal-component-metric-name',
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="kpi-modal-button-bar">
          <Button
            className={`kpi-modal-buttons ${
              kpiMode === 'add' ? 'add' : kpiMode === 'edit' ? 'save' : 'delete'
            }`}
            type={
              kpiMode === 'delete'
                ? Button.TYPE.DESTRUCTIVE
                : Button.TYPE.PRIMARY
            }
            sizeType={Button.SIZE_TYPE.LARGE}
            spacingType={[Button.SPACING_TYPE.EXTRA_LARGE]}
            disabled={!(name && accountId && nrqlQuery && nrqlSuccessful)}
            onClick={() => {
              switch (kpiMode) {
                case 'add':
                  updateKpiArray({
                    id: kpi.id,
                    accountIds: [accountId],
                    name,
                    nrqlQuery,
                  });
                  break;
                case 'edit':
                  updateKpiArray(
                    {
                      id: kpi.id,
                      accountIds: [accountId],
                      name,
                      nrqlQuery,
                    },
                    kpiIndex
                  );
                  break;
                case 'delete':
                  updateKpiArray(kpiIndex);
              }
              setShowModal(false);
            }}
          >
            {kpiMode === 'add'
              ? 'Add KPI'
              : kpiMode === 'edit'
              ? 'Save changes'
              : 'Delete KPI'}
          </Button>

          {kpiMode === 'delete' && (
            <Button
              className={`kpi-modal-buttons cancel`}
              type={Button.TYPE.NORMAL}
              sizeType={Button.SIZE_TYPE.LARGE}
              spacingType={[Button.SPACING_TYPE.EXTRA_LARGE]}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

KpiModal.propTypes = {
  kpi: PropTypes.object,
  kpiIndex: PropTypes.number,
  kpiMode: PropTypes.string,
  showModal: PropTypes.bool,
  setShowModal: PropTypes.func,
  setModalMounted: PropTypes.func,
  updateKpiArray: PropTypes.func,
};

export default KpiModal;
