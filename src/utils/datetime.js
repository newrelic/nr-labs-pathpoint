import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import {
  DEFAULT_DATETIME_FORMATTER,
  SHORT_DATETIME_FORMATTER,
} from '../constants';

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const threeDaysAgo = (d = new Date()) =>
  dayjs(d).subtract(3, 'day').valueOf();

export const formatTimestamp = (timestamp) =>
  DEFAULT_DATETIME_FORMATTER.format(new Date(timestamp));

export const formatTimeRange = (timeRange) => {
  if (timeRange.includes('UNTIL')) {
    const timeRangeParts = timeRange.split(' ');
    return `${timeRangeParts[0]} ${formatTimestamp(
      Number(timeRangeParts[1])
    )} ${timeRangeParts[2]} ${formatTimestamp(Number(timeRangeParts[3]))}`;
  } else {
    return timeRange;
  }
};

export const formatForDisplay = (timeRange) => {
  const { begin_time, end_time, duration } = timeRange;

  if (duration) {
    dayjs.extend(relativeTime);
    const formatted = dayjs().to(dayjs().subtract(duration, 'ms'));
    return `Since ${formatted}`;
  } else if (begin_time && end_time) {
    return `Since ${dayjs(begin_time).format('MMM DD hh:mm')} Until ${dayjs(
      end_time
    ).format('MMM DD hh:mm')}`;
  }
  return '';
};

export const durationStringForViolation = (closed, opened) => {
  if (!opened) return '';
  const duration = ((closed || Date.now()) - opened) / 1000;
  if (duration < 60) return 'less than 1 m';
  if (duration < 3600) {
    const mins = Number(duration / 60).toFixed();
    return `${mins} m`;
  }
  const mins = Number((duration % 3600) / 60).toFixed();
  if (duration < 86400) {
    const hours = Number(duration / 3600).toFixed();
    return `${hours} h ${mins} m`;
  }
  const days = Number(duration / 86400).toFixed();
  const hours = Number((duration % 86400) / 3600).toFixed();
  return `${days} d ${hours} h ${mins} m`;
};

export const playbackTime = (
  { begin_time, end_time, duration } = {},
  { display } = {}
) => {
  const incrementStr = display ? `in incements of ${display}` : '';
  if (begin_time && end_time) {
    const bTime = SHORT_DATETIME_FORMATTER.format(new Date(begin_time));
    const eTime = SHORT_DATETIME_FORMATTER.format(new Date(end_time));
    return {
      label: 'Showing custom time',
      description: `
        From ${bTime} 
        to ${eTime}
        ${incrementStr}
      `,
    };
  }
  if (!duration) return { label: 'Unable to display playback time window' };
  if (duration <= HOUR)
    return {
      label: `Showing last ${duration / MINUTE} minutes`,
      description: `...${incrementStr}`,
    };
  if (duration <= DAY)
    return {
      label: `Showing last ${duration / HOUR} hours`,
      description: `...${incrementStr}`,
    };
  return {
    label: `Showing last ${duration / DAY} days`,
    description: `...${incrementStr}`,
  };
};
