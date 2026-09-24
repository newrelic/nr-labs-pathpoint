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
  SectionMessage,
  Spinner,
  useNerdGraphQuery,
} from 'nr1';
import { AppContext } from '../../contexts';
import { useFlowMigrate } from '../../hooks';
import { getCrossAccountKpis, getUnsupportedKpis } from '../../utils';
import { LONG_DATE_FORMATTER, UI_CONTENT } from '../../constants';

// used to confirm the entity a prior migration recorded still exists - a
// stored migration whose flow has since been deleted should not block a
// fresh migration, so we verify the guid rather than trusting the record
const PREVIOUS_MIGRATION_ENTITY_QUERY = `
  query($guid: EntityGuid!) {
    actor {
      entity(guid: $guid) {
        accountId
        name
      }
    }
  }
`;

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
  const [migrationRecord, setMigrationRecord] = useState(undefined);
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
  const crossAccountKpis = useMemo(
    () => getCrossAccountKpis(flowDoc || {}, selectedAccountId),
    [flowDoc, selectedAccountId]
  );

  const previousGuid = migrationRecord?.guid;
  const {
    loading: entityLoading,
    error: entityError,
    data: entityData,
  } = useNerdGraphQuery({
    query: PREVIOUS_MIGRATION_ENTITY_QUERY,
    variables: { guid: previousGuid },
    skip: !previousGuid,
  });

  // `undefined` while we're still determining (checking storage, then
  // verifying the recorded entity still exists); otherwise a boolean
  const previousMigration = useMemo(() => {
    if (migrationRecord === undefined) return undefined; // still reading storage
    if (!migrationRecord) return false; // no migration on record
    if (entityLoading) return undefined; // verifying the recorded entity
    if (entityError) return false; // can't confirm - allow migrating
    if (!entityData) return undefined; // query not resolved yet
    return Boolean(entityData?.actor?.entity);
  }, [migrationRecord, entityLoading, entityError, entityData]);

  useEffect(() => {
    if (hidden) return;

    setSelectedAccountId(accountId);
    setResult(null);
    setMigrationRecord(undefined);
    cancelledRef.current = false;

    (async () => {
      const previous = await checkPreviousMigration(flowId);
      if (!cancelledRef.current) setMigrationRecord(previous);
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
    navigation.openEntity(migrationRecord.guid, {
      platformState: { accountId: accountIdFromGuid(migrationRecord.guid) },
    });
  }, [onClose, migrationRecord]);

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
              {migrationRecord.user?.name || 'Someone'} migrated{' '}
              {flowDoc?.name || 'this'} flow to the new pathpoint on{' '}
              {LONG_DATE_FORMATTER.format(new Date(migrationRecord.timestamp))}.
              Make any necessary changes in the new version.
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
                Migrate {flowDoc?.name || 'Untitled flow'}
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
            {result && (
              <SectionMessage
                className="dialog-error"
                type={SectionMessage.TYPE.CRITICAL}
                title="You don't have access to this account"
                description="Ask your admin for access, or switch to an account where you can create flows."
                actions={[
                  {
                    label: UI_CONTENT.MIGRATE.DOCS_LINK_LABEL,
                    to: UI_CONTENT.MIGRATE.DOCS_URL,
                  },
                ]}
              />
            )}
            {unsupportedKpis.length > 0 && (
              <InlineMessage
                className="dialog-kpi-warning"
                type={InlineMessage.TYPE.WARNING}
                label={`${unsupportedKpis.length} KPI${
                  unsupportedKpis.length === 1 ? '' : 's'
                } won't transfer`}
                description={
                  unsupportedKpis.length === 1 ? (
                    `We use metrics instead of events for KPIs in the new Pathpoint, so this KPI won't transfer: ${unsupportedKpis[0]}. You'll need to create a new KPI using metric data.`
                  ) : (
                    <>
                      We use metrics instead of events for KPIs in the new
                      Pathpoint, so these KPIs won&apos;t transfer:
                      <ul className="dialog-kpi-list">
                        {unsupportedKpis.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                      You&apos;ll need to create new KPIs using metric data.
                    </>
                  )
                }
                action={{
                  label: UI_CONTENT.MIGRATE.DOCS_LINK_LABEL,
                  to: UI_CONTENT.MIGRATE.DOCS_URL,
                }}
              />
            )}
            {crossAccountKpis.length > 0 && (
              <InlineMessage
                className="dialog-kpi-warning"
                type={InlineMessage.TYPE.WARNING}
                label={`${crossAccountKpis.length} KPI${
                  crossAccountKpis.length === 1 ? '' : 's'
                } won't transfer`}
                description={
                  crossAccountKpis.length === 1 ? (
                    `This KPI is in a different account: ${crossAccountKpis[0]}. You'll need to create a new KPI in this account.`
                  ) : (
                    <>
                      These KPIs are in a different account:
                      <ul className="dialog-kpi-list">
                        {crossAccountKpis.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                      You&apos;ll need to create new KPIs in this account.
                    </>
                  )
                }
                action={{
                  label: UI_CONTENT.MIGRATE.DOCS_LINK_LABEL,
                  to: UI_CONTENT.MIGRATE.DOCS_URL,
                }}
              />
            )}
            <BlockText className="dialog-description">
              We&apos;ll recreate this flow in our Pathpoint
              capability&mdash;your original stays where it is. The 2 flows
              won&apos;t be linked, so make all future changes in the new
              version.
            </BlockText>
            <div className="dialog-field">
              <span className="dialog-field-label">Accounts</span>
              <AccountPicker
                value={selectedAccountId}
                onChange={accountChangeHandler}
              />
            </div>
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
