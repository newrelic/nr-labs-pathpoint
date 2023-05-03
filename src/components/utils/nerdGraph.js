import { NerdGraphQuery } from 'nr1';

const nrqlQueries = async (inputObject, mapResult = false) => {
  const kpis = Array.isArray(inputObject)
    ? inputObject
    : typeof inputObject === 'object'
    ? [inputObject]
    : [];
  if (!kpis.length) return [];
  let nrqls = '';
  kpis.forEach((k, index) => {
    nrqls += `
          nrql${index}: nrql(accounts: [${k.accountIds[0]}], query: "${k.nrqlQuery}", timeout: 30) {
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

  try {
    const { data, error } = await NerdGraphQuery.query(gql);
    if (error) {
      return error;
    } else {
      return mapResult
        ? kpis.map((kpi, index) => {
            return {
              ...kpi,
              ...mapQueryResult(data.actor[`nrql${index}`].results),
            };
          })
        : data.actor;
    }
  } catch (e) {
    return false;
  }
};

const mapQueryResult = (result) => {
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
    return {
      value: result[0][Object.keys(result[0])[0]],
      previousValue: '',
    };
  } else {
    // can't be used in simple-billboard
    return null;
  }
};

export { nrqlQueries, mapQueryResult };
