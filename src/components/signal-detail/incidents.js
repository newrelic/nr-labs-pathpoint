import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Card,
  CardBody,
  HeadingText,
  Link,
  navigation,
  NerdGraphQuery,
  PlatformStateContext,
  SectionMessage,
} from 'nr1';

import { timeRangeToNrql } from '@newrelic/nr-labs-components';

import { latestIncidents, queriesGQL } from '../../queries';
import { SIGNAL_TYPES, STATUSES } from '../../constants';
import { capitalize, formatTimestamp, getIncidentDuration } from '../../utils';

const Incidents = ({ guid, name, status = STATUSES.UNKNOWN, type }) => {
  if (![SIGNAL_TYPES.ENTITY, SIGNAL_TYPES.ALERT].includes(type)) return;

  const platformState = useContext(PlatformStateContext);
  const [accountInfo, setAccountInfo] = useState('');
  const [incidentDisplayCount, toggleIncidentDisplayCount] = useState(0);
  const [incidentsList, setIncidentsList] = useState([]);
  const [firstTime, setFirstTime] = useState(true);
  const [bannerMessage, setBannerMessage] = useState(null);

  useEffect(() => {
    if (!guid || ![SIGNAL_TYPES.ENTITY, SIGNAL_TYPES.ALERT].includes(type))
      return;

    const fetchIncidents = async () => {
      const guidParts = atob(guid).split('|');
      setFirstTime(true);
      setIncidentsList([]);
      setBannerMessage(null);
      let attempt = 0;
      while (attempt < 2) {
        attempt++;
        const queryParams = {
          timeRange:
            attempt === 1
              ? timeRangeToNrql(platformState)
              : 'SINCE 30 DAYS AGO',
          limit: attempt === 1 ? 'max' : 1,
        };
        const incidentsQuery = [
          {
            accounts: Number(guidParts[0]),
            alias: 'incidentsDetail',
            query: latestIncidents({
              ...queryParams,
              attribute:
                type === SIGNAL_TYPES.ENTITY ? 'entity.guid' : 'conditionId',
              value:
                type === SIGNAL_TYPES.ENTITY
                  ? `'${guid}'`
                  : Number(guidParts[3]),
            }),
          },
        ];

        const {
          data: {
            actor: {
              account,
              incidentsDetail: { results: incidents = [] } = [],
            } = {},
          },
        } = await NerdGraphQuery.query({
          query: queriesGQL(incidentsQuery, {}, guidParts[0]),
        });

        if (incidents.length) {
          setIncidentsList(incidents.sort((a, b) => b.openTime - a.openTime));
          setAccountInfo(account);
          toggleIncidentDisplayCount(incidents.length ? 1 : 0);

          if (firstTime) {
            break;
          } else {
            setBannerMessage(
              'No incidents were found for the selected time period - the incident displayed below is the most recent incident located.'
            );
          }
        } else {
          if (
            firstTime &&
            ![STATUSES.CRITICAL, STATUSES.WARNING].includes(status)
          ) {
            setBannerMessage(
              'No incidents were found for the selected time period'
            );
            break;
          } else if (firstTime) {
            setBannerMessage(`No open incidents for the past 30 days.`);
            break; // no second attempt for "success" & "unknown" statuses
          }
        }
      } // while
    }; // fetchIncidents

    fetchIncidents();
  }, [guid, platformState.timeRange]);

  return (
    (bannerMessage || incidentsList?.length > 0) && (
      <>
        <div className="signal-header">
          <Card>
            <CardBody className="signal-header-card-body">
              <HeadingText type={HeadingText.TYPE.HEADING_6}>
                SIGNAL DETAILS
              </HeadingText>
              <HeadingText type={HeadingText.TYPE.HEADING_3}>
                {name}
              </HeadingText>
              <HeadingText type={HeadingText.TYPE.HEADING_5}>
                {`${accountInfo?.name} | ${accountInfo?.id}`}
              </HeadingText>
              <Link
                className="detail-link"
                onClick={() => navigation.openStackedEntity(guid)}
              >
                {type === SIGNAL_TYPES.ENTITY
                  ? 'View full entity details'
                  : 'View alert condition'}
              </Link>
            </CardBody>
          </Card>
        </div>
        <div className="alert-incidents">
          {bannerMessage && <SectionMessage description={bannerMessage} />}
          {incidentsList?.length > 0 &&
            Array.from(
              {
                length:
                  type === SIGNAL_TYPES.ENTITY &&
                  incidentDisplayCount <= incidentsList.length
                    ? incidentDisplayCount
                    : incidentsList.length,
              },
              (_, i) => {
                return (
                  <>
                    <div key={i} className="alert-incident">
                      <Card>
                        <CardBody className="incident-card-body">
                          <div className="incident-header">
                            <div
                              className={`square ${incidentsList[i]?.priority}`}
                            ></div>
                            <div
                              className={`signal-status ${incidentsList[i]?.priority}`}
                            >
                              <span>
                                {`${capitalize(
                                  incidentsList[i]?.priority
                                )} Issue ${capitalize(incidentsList[i].event)}`}
                              </span>
                            </div>
                          </div>
                          <HeadingText type={HeadingText.TYPE.HEADING_5}>
                            {incidentsList[i].title}
                          </HeadingText>
                          <div className="incident-links">
                            <Link to={incidentsList[i].incidentLink}>
                              View incident
                            </Link>
                            {type === SIGNAL_TYPES.ENTITY && (
                              <Link
                                className="detail-link"
                                onClick={() =>
                                  navigation.openStackedEntity(
                                    btoa(
                                      `${incidentsList[i].accountId}|AIOPS|CONDITION|${incidentsList[i].conditionId}`
                                    ).replace(/=+$/, '')
                                  )
                                }
                              >
                                View condition
                              </Link>
                            )}
                          </div>
                          <div>
                            {`Started: ${formatTimestamp(
                              incidentsList[i].openTime
                            )}`}
                          </div>
                          <div>
                            Duration:&nbsp;
                            {getIncidentDuration(
                              incidentsList[i].openTime,
                              incidentsList[i].durationSeconds
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                    {type === SIGNAL_TYPES.ENTITY &&
                    (incidentDisplayCount === 1 ||
                      i === incidentsList?.length - 1) &&
                    (incidentDisplayCount !== 1 ||
                      incidentsList?.length !== 1) ? (
                      <div className="incidents-footer">
                        <Button
                          type={Button.TYPE.PLAIN_NEUTRAL}
                          onClick={() => {
                            toggleIncidentDisplayCount((idc) =>
                              idc === 1 ? incidentsList.length : 1
                            );
                          }}
                        >
                          {incidentDisplayCount === 1 &&
                          incidentsList?.length > 1 ? (
                            `Show ${incidentsList?.length - 1} more incidents`
                          ) : (
                            <span>Show less incidents</span>
                          )}
                        </Button>
                      </div>
                    ) : (
                      ''
                    )}
                  </>
                );
              }
            )}
        </div>
      </>
    )
  );
};

Incidents.propTypes = {
  guid: PropTypes.string,
  name: PropTypes.string,
  status: PropTypes.oneOf(Object.values(STATUSES)),
  type: PropTypes.oneOf(Object.values(SIGNAL_TYPES)),
};

export default Incidents;
