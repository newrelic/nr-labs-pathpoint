import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  HeadingText,
  Modal,
  PlatformStateContext,
  Popover,
  PopoverTrigger,
  PopoverBody,
} from 'nr1';

import {
  EditInPlace,
  NrqlEditor,
  SimpleBillboard,
} from '@newrelic/nr-labs-components';

import KpiModalDeleteContent from './delete';
import KpiModalEmptyState from './empty';
import { useFetchKpis } from '../../hooks';
import { KPI_MODES, UI_CONTENT } from '../../constants';
import { lexer, NRQL_STYLES, formatKpiHoverDatime } from '../../utils';

const metricFromQuery = (results) => ({
  value: results?.value || 0,
  previousValue: isNaN(results?.previousValue) ? '' : results?.previousValue,
});

const KpiModal = ({
  kpi = {},
  kpiMode = KPI_MODES.VIEW, // kpiMode = "view" / "add" kpi / "edit" existing kpi / "delete" existing kpi
  showModal = false,
  setShowModal = setShowModal ? setShowModal : () => null,
  updateKpiArray = updateKpiArray ? updateKpiArray : () => null,
}) => {
  const { accountId: platformAcctId } = useContext(PlatformStateContext);
  const [accountId, setAccountId] = useState(
    Number.isInteger(platformAcctId) ? platformAcctId : ''
  );

  const [name, setName] = useState(
    [KPI_MODES.EDIT, KPI_MODES.DELETE].includes(kpiMode) ? kpi.name : ''
  );
  const [alias, setAlias] = useState(
    [KPI_MODES.EDIT, KPI_MODES.DELETE].includes(kpiMode) ? kpi.alias : ''
  );
  const [nrqlQuery, setNrqlQuery] = useState(
    [KPI_MODES.EDIT, KPI_MODES.DELETE].includes(kpiMode) ? kpi.nrqlQuery : ''
  );

  const [previewOk, setPreviewOk] = useState(false);
  const [kpiResults, setKpiResult] = useState({});

  useEffect(() => {
    setAccountId(kpi.accountIds?.length ? kpi.accountIds[0] : '');
    [KPI_MODES.ADD, KPI_MODES.EDIT].includes(kpiMode) && setName(kpi.name);
    [KPI_MODES.ADD, KPI_MODES.EDIT].includes(kpiMode) && setAlias(kpi.alias);
    [KPI_MODES.ADD, KPI_MODES.EDIT].includes(kpiMode) &&
      setNrqlQuery(kpi.nrqlQuery);
  }, [kpi, kpiMode]);

  const hookData = useFetchKpis({
    kpiData:
      Number.isInteger(accountId) && nrqlQuery
        ? [
            {
              accountIds: [accountId],
              nrqlQuery: nrqlQuery,
            },
          ]
        : [],
  });

  useEffect(() => {
    if (Number.isInteger(accountId) && nrqlQuery && !hookData?.error) {
      setPreviewOk(true);
      setKpiResult(hookData?.kpis[0]);
    } else {
      setPreviewOk(false);
    }
  }, [accountId, nrqlQuery, hookData]);

  const handleClick = useCallback((query) => {
    setPreviewOk(false);
    setNrqlQuery(query);
  }, []);

  return (
    <Modal hidden={!showModal} onClose={() => setShowModal(false)}>
      <div className="modal-component">
        {kpiMode === KPI_MODES.DELETE ? (
          <KpiModalDeleteContent
            kpi={kpi}
            setShowModal={setShowModal}
            updateKpiArray={updateKpiArray}
          />
        ) : (
          <>
            <div className="modal-component-kpi-title"></div>
            <div className="modal-component-detail">
              <>
                <div className="modal-component-edit-in-place">
                  <div className="modal-component-kpi-name">
                    <EditInPlace
                      value={name}
                      setValue={setName}
                      placeholder="Untitled KPI"
                    />
                  </div>
                  <div className="modal-component-kpi-alias">
                    <EditInPlace
                      value={alias}
                      setValue={setAlias}
                      placeholder="Alias (optional)"
                    />
                  </div>
                </div>
                <div
                  id="nrql-editor-div"
                  className="modal-component-nrql-editor"
                >
                  <NrqlEditor
                    id={'nrqlEditor'}
                    query={
                      nrqlQuery ||
                      kpi.nrqlQuery ||
                      UI_CONTENT.KPI_MODAL.QUERY_PROMPT
                    }
                    accountId={accountId}
                    saveButtonText="Preview"
                    onSave={(res) => {
                      setAccountId(res.accountId);
                      if (res.query !== UI_CONTENT.KPI_MODAL.QUERY_PROMPT)
                        setNrqlQuery(res.query);
                    }}
                  />
                  <div className="modal-component-nrql-editor-help">
                    <details>
                      <summary>
                        {` ${UI_CONTENT.KPI_MODAL.NRQL_EDITOR_INSTRUCTIONS_HEADING}`}
                      </summary>
                      <p>{UI_CONTENT.KPI_MODAL.NRQL_EDITOR_INSTRUCTIONS}</p>
                    </details>
                    <details>
                      <summary>
                        {` ${UI_CONTENT.KPI_MODAL.BILLBOARD_HELP_TITLE}`}
                      </summary>
                      {UI_CONTENT.KPI_MODAL.BILLBOARD_HELP_QUERY_EXAMPLE.map(
                        (query, index) => (
                          <div
                            key={`query_${index}`}
                            className="query-example"
                            onClick={() => handleClick(query)}
                          >
                            <code
                              style={{ color: NRQL_STYLES.normal }}
                              dangerouslySetInnerHTML={{ __html: lexer(query) }}
                            />
                          </div>
                        )
                      )}
                    </details>
                  </div>
                </div>
                <div className="modal-component-preview-heading">
                  <HeadingText type={HeadingText.TYPE.HEADING_3}>
                    Preview:
                  </HeadingText>
                </div>
                {!Number.isInteger(accountId) ||
                !nrqlQuery ||
                hookData?.error ? (
                  <div className="modal-component-empty-state">
                    <KpiModalEmptyState
                      accountId={accountId}
                      nrqlQuery={nrqlQuery}
                      error={hookData?.error}
                    />
                  </div>
                ) : (
                  <div className="kpi-data">
                    <Popover openOnHover={true}>
                      <PopoverTrigger>
                        <SimpleBillboard
                          metric={{
                            ...metricFromQuery(kpiResults),
                            className: 'modal-component-metric-value',
                          }}
                          statusTrend={{
                            className: 'modal-component-status-trend',
                          }}
                          title={{
                            name: alias || name,
                            className: 'modal-component-metric-name',
                          }}
                        />
                      </PopoverTrigger>
                      <PopoverBody>
                        <p className="kpi-hover">
                          <span>
                            {kpiResults?.metadata?.timeWindow?.since
                              ? `Since ${formatKpiHoverDatime(
                                  kpiResults?.metadata?.timeWindow?.since
                                )}`
                              : ''}
                          </span>
                          <span>
                            {kpiResults?.metadata?.timeWindow?.until !== 'NOW'
                              ? ` - until ${formatKpiHoverDatime(
                                  kpiResults?.metadata?.timeWindow?.until
                                )}`
                              : ''}
                          </span>
                          <span>
                            {kpiResults?.metadata?.timeWindow?.compareWith
                              ? ` vs. ${kpiResults?.metadata?.timeWindow?.compareWith.toLowerCase()}`
                              : ''}
                          </span>
                        </p>
                      </PopoverBody>
                    </Popover>
                  </div>
                )}
              </>
            </div>
            <div className="kpi-modal-button-bar">
              <Button
                className={`kpi-modal-buttons ${
                  kpiMode === KPI_MODES.ADD ? 'add' : 'save'
                }`}
                type={Button.TYPE.PRIMARY}
                sizeType={Button.SIZE_TYPE.LARGE}
                spacingType={[Button.SPACING_TYPE.EXTRA_LARGE]}
                disabled={!previewOk || !name}
                onClick={() => {
                  switch (kpiMode) {
                    case KPI_MODES.ADD:
                      updateKpiArray({
                        id: kpi.id,
                        accountIds: [accountId],
                        name,
                        alias,
                        nrqlQuery,
                      });
                      break;
                    case KPI_MODES.EDIT:
                      updateKpiArray({
                        id: kpi.id,
                        accountIds: [accountId],
                        name,
                        alias,
                        nrqlQuery,
                      });
                      break;
                  }
                  setShowModal(false);
                }}
              >
                {kpiMode === KPI_MODES.ADD ? 'Add KPI' : 'Save changes'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

KpiModal.propTypes = {
  kpi: PropTypes.object,
  kpiMode: PropTypes.oneOf(Object.values(KPI_MODES)),
  showModal: PropTypes.bool,
  setShowModal: PropTypes.func,
  updateKpiArray: PropTypes.func,
};

export default KpiModal;
