import React, { useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Card,
  CardBody,
  HeadingText,
  InlineMessage,
  NerdGraphQuery,
  SectionMessage,
  navigation,
} from 'nr1';

import Incidents from './incidents';
import GoldenMetrics from './golden-metrics';
import { AppContext } from '../../contexts';
import {
  workloadEntitiesQuery,
  workloadEntitiesViolationsFromGuidsArray,
} from '../../queries';
import { formatTimestamp, getOrigin, isWorkload } from '../../utils';
import { MAX_PARAMS_IN_QUERY, SIGNAL_TYPES, STATUSES } from '../../constants';

import typesList from '../../../nerdlets/signal-selection/types.json';

const NO_ENTITY_TYPE = '(unknown entity type)';

const entityTypeFromData = (entityData) => {
  const { domain, type } = entityData || {};
  if (!domain || !type) return NO_ENTITY_TYPE;
  return (
    typesList.find((t) => t.domain === domain && t.type === type)
      ?.displayName || NO_ENTITY_TYPE
  );
};

const isWorkloadNotOK = ({ statusValueCode, alertSeverity } = {}) => {
  const notOKStatusValueCodes = [2, 3];
  const notOKAlertSeveritiesRE = new RegExp(
    `${STATUSES.CRITICAL}|${STATUSES.WARNING}`,
    'i'
  );

  return (
    notOKStatusValueCodes.includes(statusValueCode) ||
    notOKAlertSeveritiesRE.test(alertSeverity)
  );
};

const SignalDetailSidebar = ({ guid, name, type, data, timeWindow }) => {
  const { account = {}, accounts = [] } = useContext(AppContext);
  const [hasAccessToEntity, setHasAccessToEntity] = useState(false);
  const [signalAccount, setSignalAccount] = useState();
  const [detailLinkText, setDetailLinkText] = useState('View entity details');
  const [incidentsData, setIncidentsData] = useState(null);
  const [isLoadingWorkloadViolations, setIsLoadingWorkloadViolations] =
    useState(false);

  useEffect(() => {
    const [acctId, condId] = ((atob(guid) || '').split('|') || []).reduce(
      (acc, cur, idx) => (idx === 0 || idx === 3 ? [...acc, Number(cur)] : acc),
      []
    );
    if (acctId === account.id) {
      setHasAccessToEntity(true);
      setSignalAccount(account);
    } else {
      const acct = accounts.find((a) => a.id === acctId);
      if (acct) {
        setHasAccessToEntity(true);
        setSignalAccount(acct);
      }
    }
    if (type === SIGNAL_TYPES.ALERT) {
      setDetailLinkText(condId ? 'View alert condition' : '');
    } else if (type === SIGNAL_TYPES.ENTITY) {
      setDetailLinkText('View entity details');
    }
  }, [guid, type, account, accounts]);

  useEffect(() => {
    if (!guid || !type) return;
    let curData = { ...data };
    if (
      !data ||
      type !== SIGNAL_TYPES.ENTITY ||
      !isWorkload(data) ||
      !isWorkloadNotOK(data)
    ) {
      setIncidentsData(data);
      return;
    }

    setIsLoadingWorkloadViolations(true);
    const loadWorkloadIncidents = async (g) => {
      const {
        data: {
          actor: {
            entity: { relatedEntities: { results = [] } = {} } = {},
          } = {},
        } = {},
        error,
      } = await NerdGraphQuery.query({
        query: workloadEntitiesQuery,
        variables: { guid: g },
      });
      if (error) {
        console.error('Error listing workload entities', error);
        return;
      }
      let workloadEntitiesGuids = [];
      for (let i = 0; i < results?.length; i += MAX_PARAMS_IN_QUERY) {
        const guidsArr = results
          .slice(i, i + MAX_PARAMS_IN_QUERY)
          .map(({ target: { guid: g } = {} }) => g)
          .filter((g) => !!g);
        workloadEntitiesGuids = [...workloadEntitiesGuids, guidsArr];
      }
      if (!workloadEntitiesGuids.length) {
        console.error('Unable to fetch workload entities');
        setIsLoadingWorkloadViolations(false);
        return;
      }
      const {
        data: { actor: { __typename, ...entitiesObj } = {} } = {}, // eslint-disable-line no-unused-vars
        error: error2,
      } = await NerdGraphQuery.query({
        query: workloadEntitiesViolationsFromGuidsArray(
          workloadEntitiesGuids,
          timeWindow
        ),
      });
      if (error2) {
        console.error('Error loading workload entities', error2);
        return;
      }
      const violationsKey =
        timeWindow?.start && timeWindow?.end
          ? 'alertViolations'
          : 'recentAlertViolations';
      Object.keys(entitiesObj).forEach((entitiesKey) => {
        entitiesObj[entitiesKey]?.forEach((entity) => {
          if (isWorkload(entity)) {
            loadWorkloadIncidents(entity.guid);
            return;
          }
          const violations = entity?.[violationsKey] || [];
          if (violations.length) {
            curData = {
              ...curData,
              [violationsKey]: [
                ...(curData[violationsKey] || []),
                ...violations,
              ],
            };
          }
        });
      });
      setIncidentsData(curData);
      setIsLoadingWorkloadViolations(false);
    };
    loadWorkloadIncidents(guid);
  }, [guid, type, data, timeWindow]);

  const signalLink = useMemo(() => {
    if (!hasAccessToEntity || !guid) return null;
    const { pathname, search } = navigation.getOpenEntityLocation(guid) || {};
    if (!pathname) return null;

    const link = `${getOrigin()}${pathname}${search || ''}`;
    return (
      <a className="detail-link" href={link} target="_blank" rel="noreferrer">
        {detailLinkText}
      </a>
    );
  }, [detailLinkText, hasAccessToEntity, guid]);

  return (
    <div className="signal-detail-sidebar">
      <div className="signal-header">
        <Card>
          <CardBody className="signal-header-card-body">
            <HeadingText type={HeadingText.TYPE.HEADING_6}>
              SIGNAL DETAILS
            </HeadingText>
            <HeadingText type={HeadingText.TYPE.HEADING_3}>{name}</HeadingText>
            <HeadingText type={HeadingText.TYPE.HEADING_5}>
              {`${signalAccount?.name || '(unknown account)'} | ${
                type === SIGNAL_TYPES.ENTITY
                  ? entityTypeFromData(data)
                  : 'Alert condition'
              }`}
            </HeadingText>
            {signalLink}
            {timeWindow ? (
              <InlineMessage
                className="detail-time-info"
                description="Showing data for the specified time period."
                label={`${formatTimestamp(
                  timeWindow.start
                )} - ${formatTimestamp(timeWindow.end)}`}
              />
            ) : null}
          </CardBody>
        </Card>
      </div>
      {hasAccessToEntity ? (
        <>
          <Incidents
            type={type}
            data={incidentsData}
            timeWindow={timeWindow}
            isLoading={isLoadingWorkloadViolations}
          />
          {type === SIGNAL_TYPES.ENTITY ? (
            <GoldenMetrics guid={guid} data={data} timeWindow={timeWindow} />
          ) : null}
        </>
      ) : (
        <SectionMessage
          type={SectionMessage.TYPE.CRITICAL}
          description="You do not have access to view this signal!"
        />
      )}
    </div>
  );
};

SignalDetailSidebar.propTypes = {
  guid: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.oneOf(Object.values(SIGNAL_TYPES)),
  data: PropTypes.object,
  timeWindow: PropTypes.object,
};

export default SignalDetailSidebar;
