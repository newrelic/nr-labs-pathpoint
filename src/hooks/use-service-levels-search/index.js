import { useCallback, useEffect, useState } from 'react';
import { useNerdGraphQuery } from 'nr1';

import { serviceLevelsSearchQuery as query } from '../../queries';

const serviceLevelsFromData = (data) => {
  const {
    actor: { entitySearch: { results: { entities = [] } = {} } = {} } = {},
  } = data;
  return entities.map(({ guid, name }) => ({ guid, name }));
};

const useServiceLevelsSearch = ({ accountId }) => {
  const [skip, setSkip] = useState(true);
  const [serviceLevels, setServiceLevels] = useState([]);
  const { data, error, loading, refetch } = useNerdGraphQuery({
    skip,
    accountId,
    query,
  }); // , fetchMore

  useEffect(() => {
    if (accountId) setSkip(false);
  }, [accountId]);

  useEffect(() => {
    if (data && !loading) {
      setServiceLevels(serviceLevelsFromData(data));
    }
  }, [data, loading]);

  useEffect(() => {
    if (error) console.error('Error fetching service levels', error);
  }, [error]);

  const refetchServiceLevels = useCallback(async () => {
    if (!refetch) return;
    const { data: refetchedData } = await refetch();
    setServiceLevels(serviceLevelsFromData(refetchedData));
  }, [refetch]);

  return { serviceLevels, refetchServiceLevels };
};

export default useServiceLevelsSearch;
