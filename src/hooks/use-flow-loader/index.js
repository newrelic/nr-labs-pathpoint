import { useEffect, useState } from 'react';
import { useAccountStorageQuery } from 'nr1';

import { NERD_STORAGE } from '../../constants';

const useFlowLoader = ({ accountId, flowId }) => {
  const [skip, setSkip] = useState(true);
  const [flows, setFlows] = useState([]);
  const { data, error, loading, refetch } = useAccountStorageQuery({
    skip,
    accountId,
    collection: NERD_STORAGE.FLOWS_COLLECTION,
    documentId: flowId,
  });

  useEffect(() => {
    if (accountId) setSkip(false);
  }, [accountId]);

  useEffect(() => {
    if (!loading && data) setFlows(data);
  }, [data, loading]);

  return { flows, error, loading, refetch };
};

export default useFlowLoader;
