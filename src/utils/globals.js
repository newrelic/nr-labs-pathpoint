export const formatTimestamp = (timestamp) =>
  new Intl.DateTimeFormat('default', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
