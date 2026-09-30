import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import {
  AutoSizer,
  BlockText,
  Button,
  HeadingText,
  InlineMessage,
  Link,
  Tile,
  TileGroup,
} from 'nr1';
import CodeViewer from '../code-viewer';
import Modal from '../modal';
import { useFlowMigrate } from '../../hooks';
import { getCrossAccountKpis, getUnsupportedKpis } from '../../utils';
import { UI_CONTENT } from '../../constants';

const VIEWS = {
  OPTIONS: 'options',
  JSON: 'json',
  NERDGRAPH: 'nerdgraph',
  TERRAFORM: 'terraform',
};

const ExportFlowModal = ({ flowDoc, accountId, hidden = true, onClose }) => {
  const [view, setView] = useState(VIEWS.OPTIONS);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(null);
  const { getMigrationCode, getTerraformCode } = useFlowMigrate({
    accountId,
  });
  const linkRef = useRef(null);

  // reset back to the tile picker whenever the panel closes, regardless of
  // how it was closed (X button, backdrop click, or the Back button)
  useEffect(() => {
    if (hidden) {
      setView(VIEWS.OPTIONS);
      setCodeError(null);
    }
  }, [hidden]);

  const flowNameSlug = (flowDoc?.name || 'flow')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const flowName = flowDoc?.name || 'this flow';

  // KPIs that can't be recreated in the new Pathpoint yet (metric/event-data
  // queries or cross-account) - deduped in case a KPI hits both checks
  const nonTransferableKpis = useMemo(() => {
    const unsupported = getUnsupportedKpis(flowDoc || {});
    const crossAccount = getCrossAccountKpis(flowDoc || {}, accountId);
    return [...new Set([...unsupported, ...crossAccount])];
  }, [flowDoc, accountId]);

  const VIEW_CONFIG = {
    [VIEWS.JSON]: {
      heading: 'Export flow as JSON',
      byline: 'Preview the raw flow document as JSON.',
      language: CodeViewer.LANGUAGE.JSON,
      fileName: `${flowNameSlug}.json`,
      mimeType: 'application/json',
    },
    [VIEWS.NERDGRAPH]: {
      heading: `Migrate ${flowName}`,
      byline:
        "Use the following code in NerdGraph to create this flow in our Pathpoint capability—your original stays where it is. The 2 flows won't be linked, so make all future changes in the new version.",
      language: CodeViewer.LANGUAGE.GRAPHQL,
      fileName: `${flowNameSlug}.graphql`,
      mimeType: 'text/plain',
    },
    [VIEWS.TERRAFORM]: {
      heading: `Migrate ${flowName}`,
      byline:
        "Use the following code in Terraform to create this flow in our Pathpoint capability—your original stays where it is. The 2 flows won't be linked, so make all future changes in the new version.",
      language: CodeViewer.LANGUAGE.HCL,
      fileName: `${flowNameSlug}.tf`,
      mimeType: 'text/plain',
    },
  };

  const jsonTileClickHandler = useCallback(() => {
    const { created: _omit, ...flow } = flowDoc || {}; // eslint-disable-line no-unused-vars
    setCode(JSON.stringify(flow, null, 2));
    setCodeError(null);
    setView(VIEWS.JSON);
  }, [flowDoc]);

  const nerdGraphTileClickHandler = useCallback(() => {
    const { code: generatedCode, error } = getMigrationCode(flowDoc || {});
    setCode(generatedCode || '');
    setCodeError(error);
    setView(VIEWS.NERDGRAPH);
  }, [flowDoc, getMigrationCode]);

  const terraformTileClickHandler = useCallback(() => {
    const { code: generatedCode, error } = getTerraformCode(flowDoc || {});
    setCode(generatedCode || '');
    setCodeError(error);
    setView(VIEWS.TERRAFORM);
  }, [flowDoc, getTerraformCode]);

  const backButtonClickHandler = useCallback(() => {
    setCodeError(null);
    setView(VIEWS.OPTIONS);
  }, []);

  const downloadButtonClickHandler = useCallback(() => {
    const anchor = linkRef.current;
    const { fileName, mimeType } = VIEW_CONFIG[view] || {};
    if (!anchor || !code) return;
    anchor.href = `data:${
      mimeType || 'text/plain'
    };charset=utf-8,${encodeURIComponent(code)}`;
    anchor.download = fileName || 'export.txt';
    anchor.click();
  }, [code, view, flowNameSlug]);

  const currentConfig = VIEW_CONFIG[view];

  return (
    <Modal hidden={hidden} onClose={onClose}>
      <div className="export-flow-modal">
        {view === VIEWS.OPTIONS ? (
          <>
            <HeadingText
              className="export-header"
              type={HeadingText.TYPE.HEADING_3}
            >
              Export this flow
            </HeadingText>
            <BlockText className="export-byline">
              Choose a format to export {flowName}.
            </BlockText>
            <Link
              className="export-docs-link"
              to="https://docs.newrelic.com/docs/pathpoint/flow-view/#migrate-a-flow"
            >
              {UI_CONTENT.MIGRATE.DOCS_LINK_LABEL}
            </Link>
          </>
        ) : (
          <>
            <HeadingText
              className="export-header"
              type={HeadingText.TYPE.HEADING_3}
            >
              {currentConfig.heading}
            </HeadingText>
            <BlockText className="export-byline">
              {currentConfig.byline}
            </BlockText>
            {view === VIEWS.NERDGRAPH && nonTransferableKpis.length > 0 && (
              <div className="export-kpi-warning">
                <span className="export-kpi-warning-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    focusable="false"
                  >
                    <path d="M8 10.5a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5zM8 5.5a.5.5 0 01.5.5v3a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z" />
                    <path
                      fillRule="evenodd"
                      d="M8 .5a.5.5 0 01.438.257l7.5 13.5A.501.501 0 0115.5 15H.5a.5.5 0 01-.437-.743l7.5-13.5L7.6.7A.5.5 0 018 .5zM1.35 14h13.3L8 2.03 1.35 14z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <div className="export-kpi-warning-content">
                  <div className="export-kpi-warning-label">
                    {`${nonTransferableKpis.length} KPI${
                      nonTransferableKpis.length === 1 ? '' : 's'
                    } won't transfer`}
                  </div>
                  <BlockText className="export-kpi-description">
                    {nonTransferableKpis.length === 1 ? (
                      `This KPI won't transfer: ${nonTransferableKpis[0]}. We're working on a way to transfer KPIs that use metric data or query from multiple accounts.`
                    ) : (
                      <>
                        These KPIs won&apos;t transfer right now:
                        <ul className="export-kpi-list">
                          {nonTransferableKpis.map((name) => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                        We&apos;re working on a way to transfer KPIs that use
                        metric data or query from multiple accounts.
                      </>
                    )}
                  </BlockText>
                  <Link
                    className="export-kpi-docs-link"
                    to={UI_CONTENT.MIGRATE.DOCS_URL}
                  >
                    {UI_CONTENT.MIGRATE.DOCS_LINK_LABEL}
                  </Link>
                </div>
              </div>
            )}
            {codeError && (
              <InlineMessage
                type={InlineMessage.TYPE.WARNING}
                label="We couldn't generate the code."
              />
            )}
          </>
        )}
        {view === VIEWS.OPTIONS && (
          <TileGroup
            className="export-options"
            gapType={TileGroup.GAP_TYPE.SMALL}
          >
            <Tile onClick={jsonTileClickHandler}>
              <HeadingText type={HeadingText.TYPE.HEADING_6}>JSON</HeadingText>
              <BlockText>
                Export the raw flow document as JSON. Useful for backup,
                inspection, or directly migrating this flow to the new
                Pathpoint.
              </BlockText>
            </Tile>
            <Tile onClick={nerdGraphTileClickHandler}>
              <HeadingText type={HeadingText.TYPE.HEADING_6}>
                NerdGraph
              </HeadingText>
              <BlockText>
                Generate a NerdGraph mutation. You can run the mutation in our
                NerdGraph API explorer to migrate this flow to the new
                Pathpoint.
              </BlockText>
            </Tile>
            <Tile onClick={terraformTileClickHandler}>
              <HeadingText type={HeadingText.TYPE.HEADING_6}>
                Terraform
              </HeadingText>
              <BlockText>
                Manage this flow as code, or migrate it to the new Pathpoint,
                using our Terraform provider. This is a good option if you
                version-control your observability configuration.
              </BlockText>
            </Tile>
          </TileGroup>
        )}
        {view !== VIEWS.OPTIONS && (
          <div className="export-code-view">
            <div className="code-wrapper">
              <AutoSizer>
                {({ width, height }) => (
                  <CodeViewer
                    code={code}
                    language={currentConfig.language}
                    fileName={currentConfig.fileName}
                    width={width}
                    height={height}
                  />
                )}
              </AutoSizer>
            </div>
            <div className="button-bar">
              <a ref={linkRef} className="hidden-download-btn" />
              <Button
                variant={Button.VARIANT.TERTIARY}
                onClick={backButtonClickHandler}
              >
                Back
              </Button>
              <Button
                variant={Button.VARIANT.PRIMARY}
                disabled={!code}
                onClick={downloadButtonClickHandler}
              >
                Download
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

ExportFlowModal.propTypes = {
  flowDoc: PropTypes.object,
  accountId: PropTypes.number,
  hidden: PropTypes.bool,
  onClose: PropTypes.func,
};

export default ExportFlowModal;
