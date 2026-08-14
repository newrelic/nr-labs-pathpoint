import { useCallback } from 'react';

import {
  buildMigrationQuery,
  findFlowEntity,
  migrateFlow,
  transformForExport,
} from '../../utils';

const POLL_INTERVAL_MS = 5000;

const resolveAccountId = (doc = {}, accountId) => {
  const docAccountId = doc.accountId ?? doc.input?.accountId;
  return docAccountId ? Number(docAccountId) : Number(accountId);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const pollForFlowEntity = useCallback(
    async (guid, isCancelled = () => false) => {
      while (!isCancelled()) {
        const entity = await findFlowEntity(accountId, guid);
        if (entity) return entity;
        await delay(POLL_INTERVAL_MS);
      }
      return null;
    },
    [accountId]
  );

  return {
    getMigrationCode,
    migrateFlow: migrateFlowHandler,
    pollForFlowEntity,
  };
};

export default useFlowExport;
