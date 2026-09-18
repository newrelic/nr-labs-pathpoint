import { useCallback } from 'react';
import { AccountStorageMutation, AccountStorageQuery } from 'nr1';

import {
  buildMigrationQuery,
  buildTerraformConfig,
  findFlowEntity,
  migrateFlow,
  transformForExport,
} from '../../utils';
import { NERD_STORAGE } from '../../constants';

const POLL_INTERVAL_MS = 5000;

const resolveAccountId = (doc = {}, accountId) => {
  const docAccountId = doc.accountId ?? doc.input?.accountId;
  return docAccountId ? Number(docAccountId) : Number(accountId);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const recordMigration = async ({ homeAccountId, flowId, guid, user }) => {
  const { data, error } = await AccountStorageQuery.query({
    accountId: homeAccountId,
    collection: NERD_STORAGE.FLOW_MIGRATIONS_COLLECTION,
    documentId: flowId,
  });
  if (error) {
    console.error('Error reading flow migrations', error);
    return;
  }

  const document = {
    migrations: [
      ...(data?.migrations || []),
      { guid, user, timestamp: Date.now() },
    ],
  };
  const { error: writeError } = await AccountStorageMutation.mutate({
    accountId: homeAccountId,
    actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
    collection: NERD_STORAGE.FLOW_MIGRATIONS_COLLECTION,
    documentId: flowId,
    document,
  });
  if (writeError) console.error('Error writing flow migration', writeError);
};

const useFlowMigrate = ({ accountId, homeAccountId, user } = {}) => {
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

  const getTerraformCode = useCallback(
    (doc = {}) => {
      try {
        const code = buildTerraformConfig(
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
    async (doc = {}, flowId) => {
      // the target account the user picked always wins here - unlike the
      // read-only code previews above, this is the account the new
      // Pathpoint actually gets created in, so doc.accountId must never
      // override it
      const outcome = await migrateFlow(
        Number(accountId),
        transformForExport(doc)
      );
      if (outcome?.success)
        await recordMigration({
          homeAccountId,
          flowId,
          guid: outcome.guid,
          user,
        });
      return outcome;
    },
    [accountId, homeAccountId, user]
  );

  const checkPreviousMigration = useCallback(
    async (flowId) => {
      const { data, error } = await AccountStorageQuery.query({
        accountId: homeAccountId,
        collection: NERD_STORAGE.FLOW_MIGRATIONS_COLLECTION,
        documentId: flowId,
      });
      if (error) {
        console.error('Error checking previous migrations', error);
        return null;
      }
      const migrations = data?.migrations || [];
      return migrations[0] ?? null;
    },
    [homeAccountId]
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
    getTerraformCode,
    migrateFlow: migrateFlowHandler,
    checkPreviousMigration,
    pollForFlowEntity,
  };
};

export default useFlowMigrate;
