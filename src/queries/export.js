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
