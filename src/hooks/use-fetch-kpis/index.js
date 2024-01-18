import { useEffect, useState } from 'react';
import { useNerdGraphQuery } from 'nr1';

import { queriesGQL } from '../../queries';

const valueFromResult = (result = {}) => {
  const { comparison, ...vals } = result;
  const values = Object.values(vals);
  if (values.length === 1) {
    const [value] = values;
    if (!comparison) return { value };
    if (comparison === 'current') return { value };
    if (comparison === 'previous') return { previousValue: value };
  }
};

const kpisFromData = ({ actor = {} } = {}) =>
  Object.keys(actor).reduce((acc, key) => {
    if (!key.startsWith('q') || !actor[key]) return acc;
    const index = key.substring(1);
    const {
      metadata: { timeWindow: { compareWith, since, until } = {} } = {},
      results: [first, second, ...rest] = [],
    } = actor[key] || {};
    if (!rest?.length) {
      acc[index] = {
        metadata: {
          timeWindow: { compareWith, since, until },
        },
        value: '',
        previousValue: '',
        ...valueFromResult(first),
        ...valueFromResult(second),
      };
    }
    return acc;
  }, []);

const useFetchKpis = ({ kpiData = [] } = {}) => {
  const [kpis, setKpis] = useState([]);
  const [query, setQuery] = useState(queriesGQL());
  const { data, error, loading } = useNerdGraphQuery({ query });

  useEffect(() => {
    if (kpiData?.length) {
      const queries = kpiData.map(
        ({ accountIds = [], nrqlQuery = '' }, index) => ({
          accounts: accountIds.join(', '),
          alias: `q${index}`,
          query: nrqlQuery,
        })
      );
      setQuery(queriesGQL(queries));
    }
  }, [kpiData]);

  useEffect(() => {
    if (data && !loading) {
      setKpis(kpisFromData(data));
    }
  }, [data, loading]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching Kpi values', error);
    }
  }, [error]);

  return { kpis, error, loading };
};

export default useFetchKpis;
