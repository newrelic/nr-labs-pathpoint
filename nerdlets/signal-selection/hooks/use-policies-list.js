import { useEffect, useState } from 'react';

import { useEntitiesByDomainTypeQuery } from 'nr1';

import { POLICY_DOMAIN_TYPE } from '../../../src/constants';

const policyIdFromGuid = (guid) =>
  Number((atob(guid)?.split('|') || []).pop() || 0);

const usePoliciesList = ({ accountId }) => {
  const [policies, setPolicies] = useState({});
  const {
    data: { entities = [] } = {},
    error,
    fetchMore,
  } = useEntitiesByDomainTypeQuery({
    ...POLICY_DOMAIN_TYPE,
    filters: accountId ? `accountId = ${accountId}` : '',
  });

  useEffect(
    () =>
      setPolicies((pols) => ({
        ...pols,
        ...entities.reduce(
          (acc, { guid, name }) => ({ ...acc, [policyIdFromGuid(guid)]: name }),
          pols || {}
        ),
      })),
    [entities]
  );

  useEffect(() => fetchMore?.(), [fetchMore]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching policies:', error);
    }
  }, [error]);

  return { policies };
};

export default usePoliciesList;
