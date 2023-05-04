import { useEffect, useState } from 'react';
import { useAccountStorageQuery } from 'nr1';

import { NERD_STORAGE } from '../../constants';

const useFetchFlows = ({ accountId }) => {
  const [skip, setSkip] = useState(true);
  const { data, error, loading } = useAccountStorageQuery({
    skip,
    accountId,
    collection: NERD_STORAGE.COLLECTION,
    documentId: NERD_STORAGE.DOCUMENTS.FLOWS,
  });

  useEffect(() => {
    if (accountId) setSkip(false);
  }, [accountId]);

  return { data, error, loading };
};

export default useFetchFlows;
