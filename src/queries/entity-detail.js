import { ngql } from 'nr1';

const getSignalGoldenMetricsQueries = (signalGuid = '') => ngql`{
  actor {
    entity(guid: "${signalGuid}") {
      accountId
      goldenMetrics {
        metrics {
          query
        }
      }
      name
    }
  }
}`;

const latestIncidents = (params) =>
  `SELECT 
    latest(account.id) as accountId, 
    latest(conditionId) as conditionId, 
    latest(incidentId) as incidentId, 
    latest(incidentLink) as incidentLink, 
    latest(event) as event, 
    latest(openTime) as openTime, 
    latest(title) as title, 
    latest(priority) as priority 
  FROM NrAiIncident 
  where ${params.attribute} = ${params.value} and closeTime is null 
  FACET incidentId limit ${params.limit} 
  ${params.timeRange}`.replace(/\s+/g, ' ');

export { getSignalGoldenMetricsQueries, latestIncidents };
