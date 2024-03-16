import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Card,
  CardBody,
  CardHeader,
  LineChart,
  NerdGraphQuery,
  PlatformStateContext,
} from 'nr1';

import { timeRangeToNrql } from '@newrelic/nr-labs-components';

import { getSignalGoldenMetricsQueries } from '../../queries';
import { formatTimestamp, getGoldenMetricName } from '../../utils';

const GoldenMetrics = ({ guid = null }) => {
  const platformState = useContext(PlatformStateContext);
  const [goldenMetricInfo, setGoldenMetricInfo] = useState({});

  useEffect(() => {
    if (!guid) return;

    const fetchGoldenMetricQueries = async () => {
      const query = getSignalGoldenMetricsQueries(guid);
      const { data: { actor = {} } = {} } = await NerdGraphQuery.query({
        query,
      });

      setGoldenMetricInfo({
        accountId: actor?.entity?.accountId,
        metrics: actor?.entity?.goldenMetrics?.metrics || [],
      });
    };

    fetchGoldenMetricQueries();
  }, [guid]);

  const formatTimeRange = (timeRange) => {
    if (timeRange.includes('UNTIL')) {
      const timeRangeParts = timeRange.split(' ');
      return `${timeRangeParts[0]} ${formatTimestamp(
        Number(timeRangeParts[1])
      )} ${timeRangeParts[2]} ${formatTimestamp(Number(timeRangeParts[3]))}`;
    } else {
      return timeRange;
    }
  };

  return (
    <>
      {goldenMetricInfo?.metrics?.length &&
        goldenMetricInfo.metrics?.map(({ query }, idx) => {
          return (
            <Card key={idx} className="golden-metric-card">
              <CardHeader
                className="golden-metric-card-header"
                title={getGoldenMetricName(query, " AS *'")}
                subtitle={formatTimeRange(timeRangeToNrql(platformState))}
              />
              <CardBody className="golden-metric-card-body">
                <LineChart
                  accountIds={[goldenMetricInfo.accountId]}
                  query={`${query} ${timeRangeToNrql(platformState)}`}
                />
              </CardBody>
            </Card>
          );
        })}
    </>
  );
};

GoldenMetrics.propTypes = {
  guid: PropTypes.string,
};

export default GoldenMetrics;
