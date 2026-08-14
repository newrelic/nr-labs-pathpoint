import React, {
  useCallback,
  useContext,
  useEffect,
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
import { useFlowExport } from '../../hooks';

const MigrateFlowDialog = ({ flowDoc, hidden = true, onClose }) => {
  const { account, accounts = [] } = useContext(AppContext) || {};
  const [selectedAccountId, setSelectedAccountId] = useState(account?.id);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);
  const { migrateFlow, pollForFlowEntity } = useFlowExport({
    accountId: selectedAccountId,
  });
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!hidden) {
      setSelectedAccountId(account?.id);
      setResult(null);
      cancelledRef.current = false;
    }
  }, [hidden, account?.id]);

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

  const accountChangeHandler = useCallback(
    (_, id) => setSelectedAccountId(id),
    []
  );

  const migrateClickHandler = useCallback(async () => {
    setMigrating(true);
    const outcome = await migrateFlow(flowDoc || {});
    console.log('migrateFlow mutation result', outcome);
    if (outcome?.success) {
      await pollForFlowEntity(outcome.guid, () => cancelledRef.current);
      if (cancelledRef.current) return;
      setMigrating(false);
      onClose?.();
      navigation.openEntity(outcome.guid);
    } else {
      setMigrating(false);
      setResult(outcome);
    }
  }, [flowDoc, migrateFlow, onClose, pollForFlowEntity]);

  if (hidden) return null;

  const selectedAccountName =
    accounts.find(({ id }) => id === selectedAccountId)?.name ||
    selectedAccountId;

  return (
    <div className="migrate-flow-dialog-overlay" onClick={backdropClickHandler}>
      <div className="migrate-flow-dialog">
        {migrating ? (
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
  flowDoc: PropTypes.object,
  hidden: PropTypes.bool,
  onClose: PropTypes.func,
};

export default MigrateFlowDialog;
