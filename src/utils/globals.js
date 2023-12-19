import { MONTH } from '../constants';

export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return (
    MONTH[date.getMonth()] +
    ' ' +
    ('0' + date.getDate()).slice(-2) +
    ', ' +
    date.getFullYear() +
    ', ' +
    date
      .toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })
      .toLowerCase()
  );
};
