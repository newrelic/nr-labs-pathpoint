import { ngql } from 'nr1';

export const CREATE_PATHPOINT_MUTATION = ngql`
  mutation CreatePathpoint($input: PathPointFlowInput!, $accountId: Int!) {
    pathPointCreate(pathpoint: $input, scope: {id: $accountId, type: ACCOUNT}) {
      name
      guid
      id
    }
  }
`;

export const flowEntityQuery = (accountId, guid) => ngql`
  query GetFlowEntities {
    actor {
      entitySearch(
        query: "domain = 'NGEP' and type = 'FLOW' and accountId = '${accountId}' and (id = '${guid}')"
      ) {
        results {
          entities {
            guid
            name
          }
        }
      }
    }
  }
`;
