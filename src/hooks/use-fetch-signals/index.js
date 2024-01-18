import { useCallback } from 'react';

import { EntitiesByDomainTypeQuery, NerdGraphQuery } from 'nr1';
import { nrqlConditionsSearchQuery } from '../../queries';

const useFetchSignals = () => {
  const fetchEntities = useCallback(async ({ entityDomainType, filters }) => {
    const { data, fetchMore, error, loading } =
      await EntitiesByDomainTypeQuery.query({
        entityDomain: entityDomainType.domain,
        entityType: entityDomainType.type,
        filters,
      });

    if (error) throw error;
    if (fetchMore) fetchMore();
    if (data && !loading) return { data };
    return {};
  }, []);

  const fetchAlerts = useCallback(async ({ id, searchQuery, countOnly }) => {
    if (id) {
      const { data, fetchMore, error, loading } = await NerdGraphQuery.query({
        query: nrqlConditionsSearchQuery(searchQuery, countOnly),
        variables: { id },
      });

      if (error) throw error;
      if (fetchMore) fetchMore();
      if (data && !loading)
        return { data: data?.actor?.account?.alerts?.nrqlConditionsSearch };
    }
    return {};
  }, []);

  return { fetchEntities, fetchAlerts };
};

export default useFetchSignals;
