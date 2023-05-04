import { ngql } from 'nr1';

const serviceLevelsSearchQuery = ngql`{
    actor {
      entitySearch(query: "type = 'SERVICE_LEVEL'") {
        results {
          entities {
            accountId
            guid
            name
            serviceLevel {
              indicators {
                resultQueries {
                  indicator {
                    nrql
                  }
                }
                objectives {
                  resultQueries {
                    attainment {
                      nrql
                    }
                  }
                  target
                }
              }
            }
          }
          nextCursor
        }
      }
    }
  }`;

export { serviceLevelsSearchQuery };
