import { NerdGraphQuery } from 'nr1';

const runQuery = async (kpiArray, debug = false) => {
  let nrqls = '';
  kpiArray.forEach((k, index) => {
    nrqls += `
          nrql${index}: nrql(accounts: ${k.accountIds[0]}, query: "${k.nrqlQuery}", timeout: 30) {
            results
          }`;
  });
  const gql = {
    query: `
      {
        actor {
          ${nrqls}
        }
      }
    `,
  };

  debug && console.log('### SK >>> runQuery:gql: ', gql); // SK TEMP
  try {
    const { data, error } = await NerdGraphQuery.query(gql);
    // const { data, error } = await NerdGraphQuery.query({
    //   gql,
    //   fetchPolicyType: NerdGraphQuery.FETCH_POLICY_TYPE.NO_CACHE,
    // });
    if (error) {
      console.error(`error returned by query. ${gql}: `, error?.graphQLErrors);
      return error; // false;
    } else {
      const updatedKpiArray = kpiArray.map((kpi, index) => {
        return {
          ...kpi,
          ...mapQueryResult(data.actor[`nrql${index}`].results),
        };
      });
      debug &&
        console.log('### SK >>> runQuery:unpdatedKpiArray: ', updatedKpiArray); // SK TEMP
      return updatedKpiArray;
    }
  } catch (e) {
    console.error(`error querying data: `, e);
    return false;
  }
};

const mapQueryResult = (result, debug = false) => {
  if (
    result.length === 2 &&
    result[0].comparison === 'current' &&
    result[1].comparison === 'previous'
  ) {
    return {
      value: result[0][Object.keys(result[0])[1]],
      previousValue: result[1][Object.keys(result[1])[1]],
    };
  } else if (result.length === 1) {
    // query has a count/percentile/etc.
    return {
      value: result[0][Object.keys(result[0])[0]],
      previousValue: '',
    };
  } else {
    // can't be used - may need to validate the nrql at entry to ensure it returns 1 or 2 values
    return null;
  }
};

export const utils = {
  runQuery,
  mapQueryResult,
};
