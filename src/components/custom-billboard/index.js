import React from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'nr1';

const CustomBillboard = (metric) => {
  // metric = {
  //   name: PropTypes.string,
  //   value: PropTypes.number,
  //   previousValue: PropTypes.number,
  // }

  const MetricStatus = (value) => {
    let metricStatus = (
      <Icon
        type={Icon.TYPE.INTERFACE__CARET__CARET_BOTTOM__WEIGHT_BOLD}
        color={'red'}
      />
    );
    metricStatus =
      value === 0 ? (
        <Icon
          type={Icon.TYPE.INTERFACE__CARET__CARET_RIGHT__WEIGHT_BOLD}
          color={'gold'}
        />
      ) : (
        metricStatus
      );
    metricStatus =
      value > 0 ? (
        <Icon
          type={Icon.TYPE.INTERFACE__CARET__CARET_TOP__WEIGHT_BOLD}
          color={'green'}
        />
      ) : (
        metricStatus
      );
    return <div className="metric-status">{metricStatus}</div>;
  };

  const formatValue = (metric) => {
    if (isNaN(metric.value)) return '-';
    let decimalCount = 1;
    let millar = 1000;
    let million = 1000000;
    let billion = 1000000000;
    let trillion = 1000000000000;
    if (metric.previousValue) {
      decimalCount = 100;
      millar = 10;
      million = 10000;
      billion = 10000000;
      trillion = 10000000000;
    }
    if (metric.value > trillion)
      return `${Math.round(metric.value / trillion) / decimalCount} t`;
    else if (metric.value > billion)
      return `${Math.round(metric.value / billion) / decimalCount} b`;
    else if (metric.value > million)
      return `${Math.round(metric.value / million) / decimalCount} m`;
    else if (metric.value > millar)
      return `${Math.round(metric.value / millar) / decimalCount} k`;
    else return `${Math.round(metric.value * decimalCount) / decimalCount}`;
  };

  const renderMetric = (metric) => {
    if (!isNaN(metric.value) && !isNaN(metric.previousValue)) {
      return (
        <div className="metric">
          {formatValue(metric)}
          {metric.previousValue ? (
            <span>{MetricStatus(metric.value - metric.previousValue)}</span>
          ) : (
            ''
          )}
        </div>
      );
    }
  };

  return (
    <div>
      <div className="metric-content">
        <div className="metric-content--colorblack metric-content--size24 metric-content--weight900">
          {renderMetric(metric)}
        </div>
        <div className="metric-content--colorblack metric-content--size24">
          {metric.name}
        </div>
      </div>
    </div>
  );
};

CustomBillboard.propTypes = {
  metric: PropTypes.object,
};

export default CustomBillboard;
