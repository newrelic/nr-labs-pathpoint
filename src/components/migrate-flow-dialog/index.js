import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import {
  AccountPicker,
  BlockText,
  Button,
  HeadingText,
  InlineMessage,
  navigation,
  Spinner,
} from 'nr1';
import { AppContext } from '../../contexts';
import { useFlowMigrate } from '../../hooks';
import { getUnsupportedKpis } from '../../utils';
import { LONG_DATE_FORMATTER, UI_CONTENT } from '../../constants';

const MigrateFlowDialog = ({
  accountId,
  flowId,
  flowDoc,
  hidden = true,
  onClose,
}) => {
  const { accounts = [], user } = useContext(AppContext) || {};
  const [selectedAccountId, setSelectedAccountId] = useState(accountId);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);
  const [previousMigration, setPreviousMigration] = useState(undefined);
  const { migrateFlow, pollForFlowEntity, checkPreviousMigration } =
    useFlowMigrate({
      accountId: selectedAccountId,
      homeAccountId: accountId,
      user,
    });
  const cancelledRef = useRef(false);
  const unsupportedKpis = useMemo(
    () => getUnsupportedKpis(flowDoc || {}),
    [flowDoc]
  );

  useEffect(() => {
    if (hidden) return;

    setSelectedAccountId(accountId);
    setResult(null);
    setPreviousMigration(undefined);
    cancelledRef.current = false;

    (async () => {
      const previous = await checkPreviousMigration(flowId);
      if (!cancelledRef.current) setPreviousMigration(previous);
    })();
  }, [hidden, accountId, flowId]);

  useEffect(
    () => () => {
      cancelledRef.current = true;
    },
    []
  );

  useEffect(() => {
    if (hidden || migrating) return;

    const keyDownHandler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', keyDownHandler);

    return () => document.removeEventListener('keydown', keyDownHandler);
  }, [hidden, migrating, onClose]);

  const backdropClickHandler = (e) => {
    if (!migrating && e.target === e.currentTarget) onClose?.();
  };

  // entity guids are base64-encoded `accountId|domain|type|identifier`, and
  // are the only reliably up-to-date source for which account an entity
  // actually lives in - trusting a separately-stored accountId risks it
  // being stale or, for older records, missing entirely
  const accountIdFromGuid = (guid) => {
    const [acctId] = atob(guid)?.split('|') || [];
    return Number(acctId);
  };

  const accountChangeHandler = useCallback(
    (_, id) => setSelectedAccountId(id),
    []
  );

  const migrateClickHandler = useCallback(async () => {
    setMigrating(true);
    const outcome = await migrateFlow(flowDoc || {}, flowId);
    if (outcome?.success) {
      await pollForFlowEntity(outcome.guid, () => cancelledRef.current);
      if (cancelledRef.current) return;
      setMigrating(false);
      onClose?.();
      navigation.openEntity(outcome.guid, {
        platformState: { accountId: accountIdFromGuid(outcome.guid) },
      });
    } else {
      setMigrating(false);
      setResult(outcome);
    }
  }, [flowDoc, flowId, migrateFlow, onClose, pollForFlowEntity]);

  const openInNewPathpointClickHandler = useCallback(() => {
    onClose?.();
    navigation.openEntity(previousMigration.guid, {
      platformState: { accountId: accountIdFromGuid(previousMigration.guid) },
    });
  }, [onClose, previousMigration]);

  if (hidden) return null;

  const selectedAccountName =
    accounts.find(({ id }) => id === selectedAccountId)?.name ||
    selectedAccountId;

  return (
    <div className="migrate-flow-dialog-overlay" onClick={backdropClickHandler}>
      <div className="migrate-flow-dialog">
        {previousMigration === undefined ? (
          <div className="dialog-checking">
            <Spinner />
          </div>
        ) : previousMigration ? (
          <>
            <div className="dialog-header">
              <HeadingText type={HeadingText.TYPE.HEADING_4}>
                Someone already migrated this flow
              </HeadingText>
              <Button
                ariaLabel="Close dialog"
                className="dialog-close-button"
                iconType={Button.ICON_TYPE.INTERFACE__SIGN__CLOSE}
                sizeType={Button.SIZE_TYPE.SMALL}
                variant={Button.VARIANT.TERTIARY}
                onClick={onClose}
              />
            </div>
            <BlockText className="dialog-description">
              {previousMigration.user?.name || 'Someone'} migrated{' '}
              {flowDoc?.name || 'this'} flow to the new pathpoint on{' '}
              {LONG_DATE_FORMATTER.format(
                new Date(previousMigration.timestamp)
              )}
              . Make any necessary changes in the new version.
            </BlockText>
            <div className="dialog-button-bar">
              <Button variant={Button.VARIANT.TERTIARY} onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant={Button.VARIANT.PRIMARY}
                onClick={openInNewPathpointClickHandler}
              >
                Open in new pathpoint
              </Button>
            </div>
          </>
        ) : migrating ? (
          <div className="dialog-migrating">
            <div className="dialog-migrating-header">
              <HeadingText type={HeadingText.TYPE.HEADING_4}>
                {flowDoc?.name || 'Untitled flow'}
              </HeadingText>
              <BlockText className="dialog-migrating-target">
                Migrating to: {selectedAccountName}
              </BlockText>
            </div>
            <div className="dialog-migrating-status">
              <Spinner />
              <HeadingText type={HeadingText.TYPE.HEADING_5}>
                Hang tight &mdash; we&apos;re migrating your flow
              </HeadingText>
              <BlockText>
                This can take up to a minute. We&apos;ll open it in the new
                Pathpoint when it&apos;s ready. Your original stays where it is.
              </BlockText>
            </div>
          </div>
        ) : (
          <>
            <div className="dialog-header">
              <HeadingText type={HeadingText.TYPE.HEADING_4}>
                Migrate to the new Pathpoint
              </HeadingText>
              <Button
                ariaLabel="Close dialog"
                className="dialog-close-button"
                iconType={Button.ICON_TYPE.INTERFACE__SIGN__CLOSE}
                sizeType={Button.SIZE_TYPE.SMALL}
                variant={Button.VARIANT.TERTIARY}
                onClick={onClose}
              />
            </div>
            {unsupportedKpis.length > 0 && (
              <InlineMessage
                className="dialog-kpi-warning"
                type={InlineMessage.TYPE.WARNING}
                label={`${unsupportedKpis.length} KPI${
                  unsupportedKpis.length === 1 ? '' : 's'
                } won't transfer`}
                description={
                  unsupportedKpis.length === 1
                    ? `We use metrics instead of events for KPIs in the new Pathpoint, so this KPI won't transfer: ${unsupportedKpis[0]}. You'll need to create a new KPI using metric data.`
                    : `We use metrics instead of events for KPIs in the new Pathpoint, so these KPIs won't transfer: ${unsupportedKpis.join(
                        ', '
                      )}. You'll need to create new KPIs using metric data.`
                }
                action={{
                  label: UI_CONTENT.MIGRATE.DOCS_LINK_LABEL,
                  to: UI_CONTENT.MIGRATE.DOCS_URL,
                }}
              />
            )}
            <BlockText className="dialog-description">
              You&apos;ll move a copy of this flow to the new Pathpoint — your
              original stays where it is.
            </BlockText>
            <div className="dialog-field">
              <span className="dialog-field-label">Accounts</span>
              <AccountPicker
                value={selectedAccountId}
                onChange={accountChangeHandler}
              />
            </div>
            {result && (
              <InlineMessage
                type={InlineMessage.TYPE.CRITICAL}
                label={`Migration failed: ${
                  result.error?.message || result.error || 'unknown error'
                }`}
              />
            )}
            <div className="dialog-button-bar">
              <Button variant={Button.VARIANT.TERTIARY} onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant={Button.VARIANT.PRIMARY}
                disabled={!selectedAccountId}
                onClick={migrateClickHandler}
              >
                Migrate flow
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

MigrateFlowDialog.propTypes = {
  accountId: PropTypes.number,
  flowId: PropTypes.string,
  flowDoc: PropTypes.object,
  hidden: PropTypes.bool,
  onClose: PropTypes.func,
};

export default MigrateFlowDialog;
