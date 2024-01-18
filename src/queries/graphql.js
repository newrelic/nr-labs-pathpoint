import { ngql } from 'nr1';

const queryFieldsParser = (query, fields = {}) => {
  const alias = fields.alias ? query[fields.alias] : query.alias;
  const accounts = fields.accounts ? query[fields.accounts] : query.accounts;
  const queryStr = fields.query ? query[fields.query] : query.query;
  return { alias, accounts, query: queryStr };
};

const queryFragment = (alias, accounts, query) => `
  ${alias}: nrql(accounts: [${accounts}], query: "${query}") {
    results
    metadata {
      timeWindow {
        compareWith
        since
        until
      }
    }
  }
`;

const queriesGQL = (queries = [], fields = {}) => {
  if (!queries.length) return ngql`{ actor { user { id } } }`;

  const queriesFragment = queries.reduce((acc, qry) => {
    const { alias, accounts, query } = queryFieldsParser(qry, fields);
    if (!alias || !accounts || !query) return acc;
    return [...acc, queryFragment(alias, accounts, query)];
  }, []);

  return ngql`{ actor { ${queriesFragment.join(' ')} } }`;
};

export { queriesGQL };
