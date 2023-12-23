import { AccountStorageQuery } from 'nr1';

import { NERD_STORAGE } from '../../constants';

const loadAuditLog = async (accountId, documentId) => {
  const { data: logsData, error: logReadError } =
    await AccountStorageQuery.query({
      accountId,
      collection: NERD_STORAGE.EDITS_LOG_COLLECTION,
      documentId,
    });

  if (logReadError) {
    console.error('Error loading audit log', logReadError);
  }

  return { auditLogs: logsData?.logs || [], logReadError };
};

export default loadAuditLog;
