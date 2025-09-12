import { useEffect, useState } from 'react';
import { useNerdGraphQuery } from 'nr1';

import { timeRangeToNrql } from '@newrelic/nr-labs-components';
import { queriesGQL } from '../../queries';

import {
  removeDateClauseFromNrql,
  sanitizeQuery,
  validRefreshInterval,
} from '../../utils';

const updateQueryTime = (nrqlQuery, timeRange) => {
  const sanitizedQuery = sanitizeQuery(nrqlQuery);
  const q1 = removeDateClauseFromNrql(sanitizedQuery, 'since');
  const newQuery = removeDateClauseFromNrql(q1, 'until');
  return `${newQuery} ${timeRangeToNrql({ timeRange })}`;
};

const valueFromResult = (result = {}) => {
  const { comparison, ...vals } = result;
  const values = Object.values(vals);
  if (values.length === 1) {
    const [val] = values;
    const value =
      typeof val === 'object' && Object.keys(val).length === 1
        ? Object.values(val)[0]
        : val;
    return comparison === 'previous' ? { previousValue: value } : { value };
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

const useFetchKpis = ({
  kpiData = [],
  timeRange = {},
  refreshInterval,
} = {}) => {
  const [kpis, setKpis] = useState([]);
  const [query, setQuery] = useState(queriesGQL());
  const [pollInterval, setPollInterval] = useState(
    validRefreshInterval(refreshInterval)
  );
  const { data, error, loading } = useNerdGraphQuery({ query, pollInterval });

  useEffect(
    () => setPollInterval(validRefreshInterval(refreshInterval)),
    [refreshInterval]
  );

  useEffect(() => {
    if (kpiData?.length) {
      const queries = kpiData.map(
        ({ accountIds = [], nrqlQuery = '' }, index) => ({
          accounts: accountIds.join(', '),
          alias: `q${index}`,
          query:
            timeRange?.begin_time || timeRange?.duration
              ? updateQueryTime(nrqlQuery, timeRange)
              : sanitizeQuery(nrqlQuery),
        })
      );
      setQuery(queriesGQL(queries));
    }
  }, [kpiData, timeRange]);

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
