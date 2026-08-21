import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AutoSizer,
  BlockText,
  Button,
  HeadingText,
  InlineMessage,
  Tile,
  TileGroup,
} from 'nr1';
import CodeViewer from '../code-viewer';
import Modal from '../modal';
import { useFlowMigrate } from '../../hooks';

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

  const VIEW_CONFIG = {
    [VIEWS.JSON]: {
      heading: 'Export flow as JSON',
      byline: 'Preview the raw flow document as JSON.',
      language: CodeViewer.LANGUAGE.JSON,
      fileName: `${flowNameSlug}.json`,
      mimeType: 'application/json',
    },
    [VIEWS.NERDGRAPH]: {
      heading: 'Export flow via NerdGraph',
      byline:
        'Preview the NerdGraph code to migrate this flow to the new Pathpoint',
      language: CodeViewer.LANGUAGE.GRAPHQL,
      fileName: `${flowNameSlug}.graphql`,
      mimeType: 'text/plain',
    },
    [VIEWS.TERRAFORM]: {
      heading: 'Export flow via Terraform',
      byline:
        'Preview the newrelic_pathpoint_flow HCL to migrate this flow to the new Pathpoint',
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
              Export flow
            </HeadingText>
            <BlockText className="export-byline">
              Choose a format to export this flow.
            </BlockText>
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
                Export the raw flow document as JSON, useful for backup or
                inspection.
              </BlockText>
            </Tile>
            <Tile onClick={nerdGraphTileClickHandler}>
              <HeadingText type={HeadingText.TYPE.HEADING_6}>
                NerdGraph
              </HeadingText>
              <BlockText>
                Generate a ready-to-run NerdGraph mutation that recreates this
                flow as a Pathpoint, to run here or in the GraphiQL explorer.
              </BlockText>
            </Tile>
            <Tile onClick={terraformTileClickHandler}>
              <HeadingText type={HeadingText.TYPE.HEADING_6}>
                Terraform
              </HeadingText>
              <BlockText>
                Manage this flow as code with the New Relic Terraform provider,
                ideal for teams that already version-control their observability
                configuration.
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
