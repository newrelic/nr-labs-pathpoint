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
  NERDGRAPH: 'nerdgraph',
  TERRAFORM: 'terraform',
};

const MigrateFlowModal = ({
  flowDoc,
  accountId,
  hidden = true,
  onClose,
  onManagedMigrate,
}) => {
  const [view, setView] = useState(VIEWS.OPTIONS);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(null);
  const { getMigrationCode, getTerraformCode } = useFlowMigrate({
    accountId,
  });
  const linkRef = useRef(null);

  // reset back to the method picker whenever the modal closes, regardless of
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
    [VIEWS.NERDGRAPH]: {
      heading: `Migrate ${flowName}`,
      byline:
        'Use the following code in NerdGraph to create this flow in our Pathpoint capability—your original stays where it is. The 2 flows won’t be linked, so make all future changes in the new version.',
      language: CodeViewer.LANGUAGE.GRAPHQL,
      fileName: `${flowNameSlug}.graphql`,
      mimeType: 'text/plain',
    },
    [VIEWS.TERRAFORM]: {
      heading: `Migrate ${flowName}`,
      byline:
        'Use the following code in Terraform to create this flow in our Pathpoint capability—your original stays where it is. The 2 flows won’t be linked, so make all future changes in the new version.',
      language: CodeViewer.LANGUAGE.HCL,
      fileName: `${flowNameSlug}.tf`,
      mimeType: 'text/plain',
    },
  };

  const managedMigrateTileClickHandler = useCallback(
    () => onManagedMigrate?.(),
    [onManagedMigrate]
  );

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
      <div className="migrate-flow-modal">
        {view === VIEWS.OPTIONS ? (
          <>
            <HeadingText
              className="migrate-modal-header"
              type={HeadingText.TYPE.HEADING_3}
            >
              Migrate this flow for more features
            </HeadingText>
            <BlockText className="migrate-modal-byline">
              Connect your technical health to your business metrics. Migrate to
              our fully integrated Pathpoint capability to get the latest
              updates and improvements, such as stage KPIs, alerts on KPIs, and
              custom health parameters.
            </BlockText>
            <Link
              className="migrate-modal-docs-link"
              to="https://docs.newrelic.com/docs/pathpoint/create-manage-flows/#migrate-a-flow"
            >
              {UI_CONTENT.MIGRATE.DOCS_LINK_LABEL}
            </Link>
            <BlockText className="migrate-modal-byline">
              Select a method to migrate:
            </BlockText>
          </>
        ) : (
          <>
            <HeadingText
              className="migrate-modal-header"
              type={HeadingText.TYPE.HEADING_3}
            >
              {currentConfig.heading}
            </HeadingText>
            <BlockText className="migrate-modal-byline">
              {currentConfig.byline}
            </BlockText>
            {view === VIEWS.NERDGRAPH && nonTransferableKpis.length > 0 && (
              <InlineMessage
                className="dialog-kpi-warning"
                type={InlineMessage.TYPE.WARNING}
                label={`${nonTransferableKpis.length} KPI${
                  nonTransferableKpis.length === 1 ? '' : 's'
                } won't transfer`}
                description={
                  nonTransferableKpis.length === 1 ? (
                    `This KPI won't transfer: ${nonTransferableKpis[0]}. We're working on a way to transfer KPIs that use metric data or query from multiple accounts.`
                  ) : (
                    <>
                      These KPIs won&apos;t transfer right now:
                      <ul className="dialog-kpi-list">
                        {nonTransferableKpis.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                      We&apos;re working on a way to transfer KPIs that use
                      metric data or query from multiple accounts.
                    </>
                  )
                }
                action={{
                  label: UI_CONTENT.MIGRATE.DOCS_LINK_LABEL,
                  to: UI_CONTENT.MIGRATE.DOCS_URL,
                }}
              />
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
            className="migrate-modal-options"
            gapType={TileGroup.GAP_TYPE.SMALL}
          >
            <Tile onClick={managedMigrateTileClickHandler}>
              <HeadingText type={HeadingText.TYPE.HEADING_6}>
                Have us handle it
              </HeadingText>
              <BlockText>You select an account; we do the rest.</BlockText>
            </Tile>
            <Tile onClick={nerdGraphTileClickHandler}>
              <HeadingText type={HeadingText.TYPE.HEADING_6}>
                Use NerdGraph
              </HeadingText>
              <BlockText>We provide the JSON; you do the rest.</BlockText>
            </Tile>
            <Tile onClick={terraformTileClickHandler}>
              <HeadingText type={HeadingText.TYPE.HEADING_6}>
                Use Terraform
              </HeadingText>
              <BlockText>We provide the JSON; you do the rest.</BlockText>
            </Tile>
          </TileGroup>
        )}
        {view !== VIEWS.OPTIONS && (
          <div className="migrate-modal-code-view">
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

MigrateFlowModal.propTypes = {
  flowDoc: PropTypes.object,
  accountId: PropTypes.number,
  hidden: PropTypes.bool,
  onClose: PropTypes.func,
  onManagedMigrate: PropTypes.func,
};

export default MigrateFlowModal;
