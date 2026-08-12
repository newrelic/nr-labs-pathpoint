import { useCallback } from 'react';

import {
  buildMigrationQuery,
  migrateFlow,
  transformForExport,
} from '../../utils';

const resolveAccountId = (doc = {}, accountId) => {
  const docAccountId = doc.accountId ?? doc.input?.accountId;
  return docAccountId ? Number(docAccountId) : Number(accountId);
};

const useFlowExport = ({ accountId } = {}) => {
  const getMigrationCode = useCallback(
    (doc = {}) => {
      try {
        const code = buildMigrationQuery(
          transformForExport(doc),
          resolveAccountId(doc, accountId)
        );
        return { code, error: null };
      } catch (error) {
        return { code: null, error };
      }
    },
    [accountId]
  );

  const migrateFlowHandler = useCallback(
    (doc = {}) =>
      migrateFlow(resolveAccountId(doc, accountId), transformForExport(doc)),
    [accountId]
  );

  return { getMigrationCode, migrateFlow: migrateFlowHandler };
};

export default useFlowExport;
