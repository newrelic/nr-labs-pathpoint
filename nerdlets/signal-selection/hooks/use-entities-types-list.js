import { useEffect, useState } from 'react';

import { useEntityCountQuery } from 'nr1';

import typesList from '../types.json';

const useEntitiesTypesList = ({ accountId }) => {
  const [entitiesCount, setEntitiesCount] = useState(0);
  const [entitiesTypesList, setEntitiesTypesList] = useState([]);
  const {
    data: { types = [] } = {},
    error,
    fetchMore,
  } = useEntityCountQuery({
    filters: accountId ? `accountId = ${accountId}` : '',
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching entity types', error);
    }
  }, [error]);

  useEffect(() => fetchMore?.(), [fetchMore]);

  useEffect(() => {
    if (!types || !types.length) return;
    const typesMap = new Map(
      types.map(({ count, domain, type }) => [`${domain}:${type}`, count])
    );

    const { entityTypes, count } = typesList.reduce(
      (acc, { type, domain, displayName }) => {
        if (!type || !domain || !displayName) return acc;
        const count = typesMap.get(`${domain}:${type}`) || 0;
        acc.entityTypes.push({ type, domain, displayName, count });
        acc.count += count;
        return acc;
      },
      { entityTypes: [], count: 0 }
    );
    setEntitiesCount(count);
    setEntitiesTypesList(entityTypes);
  }, [types]);

  return { entitiesCount, entitiesTypesList };
};

export default useEntitiesTypesList;
