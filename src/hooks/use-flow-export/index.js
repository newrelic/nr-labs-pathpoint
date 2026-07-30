import { useCallback } from 'react';

import { migrateFlow, transformForExport } from '../../utils';

const useFlowExport = ({ accountId } = {}) => {
  const exportFlow = useCallback(
    async (doc = {}) => {
      const docAccountId = doc.accountId ?? doc.input?.accountId;
      const targetAccountId = docAccountId
        ? Number(docAccountId)
        : Number(accountId);
      const input = transformForExport(doc);
      console.log('transformForExport result', input);
      return migrateFlow(targetAccountId, input);
    },
    [accountId]
  );

  return { exportFlow };
};

export default useFlowExport;
