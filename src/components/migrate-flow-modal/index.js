import React, { useCallback, useEffect, useState } from 'react';
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
import { useFlowExport } from '../../hooks';

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
  onMigrateClick,
}) => {
  const [view, setView] = useState(VIEWS.OPTIONS);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(null);
  const { getMigrationCode, getTerraformCode } = useFlowExport({ accountId });

  // reset back to the tile picker whenever the panel closes, regardless of
  // how it was closed (X button, backdrop click, or the Migrate button)
  useEffect(() => {
    if (hidden) {
      setView(VIEWS.OPTIONS);
      setCodeError(null);
    }
  }, [hidden]);

  const nerdGraphTileClickHandler = useCallback(() => {
    const { code: generatedCode, error } = getMigrationCode(flowDoc || {});
    console.log('migration mutation', generatedCode);
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

  const flowNameSlug = (flowDoc?.name || 'flow')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const fileName = `${flowNameSlug}.graphql`;
  const terraformFileName = `${flowNameSlug}.tf`;

  return (
    <Modal hidden={hidden} onClose={onClose}>
      <div className="migrate-flow-modal">
        {view === VIEWS.OPTIONS ? (
          <>
            <HeadingText
              className="migrate-header"
              type={HeadingText.TYPE.HEADING_3}
            >
              Export flow
            </HeadingText>
            <BlockText className="migrate-byline">
              Choose a format to export this flow for migration.
            </BlockText>
          </>
        ) : (
          <>
            <HeadingText
              className="migrate-header"
              type={HeadingText.TYPE.HEADING_3}
            >
              {view === VIEWS.TERRAFORM
                ? 'Export flow via Terraform'
                : 'Export flow via NerdGraph'}
            </HeadingText>
            <BlockText className="migrate-byline">
              {view === VIEWS.TERRAFORM
                ? 'Preview the newrelic_pathpoint_flow HCL to migrate this flow to the new Pathpoint'
                : 'Preview the NerdGraph code to migrate this flow to the new Pathpoint'}
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
            className="migrate-options"
            gapType={TileGroup.GAP_TYPE.SMALL}
          >
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
            <Tile onClick={nerdGraphTileClickHandler}>
              <HeadingText type={HeadingText.TYPE.HEADING_6}>
                NerdGraph
              </HeadingText>
              <BlockText>
                Generate a ready-to-run NerdGraph mutation that recreates this
                flow as a Pathpoint, to run here or in the GraphiQL explorer.
              </BlockText>
            </Tile>
          </TileGroup>
        )}
        {view === VIEWS.TERRAFORM && (
          <div className="migrate-terraform">
            <div className="code-wrapper">
              <AutoSizer>
                {({ width, height }) => (
                  <CodeViewer
                    code={code}
                    language={CodeViewer.LANGUAGE.HCL}
                    fileName={terraformFileName}
                    width={width}
                    height={height}
                  />
                )}
              </AutoSizer>
            </div>
            <div className="button-bar">
              <Button
                variant={Button.VARIANT.TERTIARY}
                onClick={backButtonClickHandler}
              >
                Back
              </Button>
            </div>
          </div>
        )}
        {view === VIEWS.NERDGRAPH && (
          <div className="migrate-nerdgraph">
            <div className="code-wrapper">
              <AutoSizer>
                {({ width, height }) => (
                  <CodeViewer
                    code={code}
                    language={CodeViewer.LANGUAGE.GRAPHQL}
                    fileName={fileName}
                    width={width}
                    height={height}
                  />
                )}
              </AutoSizer>
            </div>
            <div className="button-bar">
              <Button
                variant={Button.VARIANT.TERTIARY}
                onClick={backButtonClickHandler}
              >
                Back
              </Button>
              <Button
                variant={Button.VARIANT.PRIMARY}
                onClick={() => onMigrateClick?.()}
              >
                Migrate
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
  onMigrateClick: PropTypes.func,
};

export default MigrateFlowModal;
