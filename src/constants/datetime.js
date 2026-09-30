export const DEFAULT_DATETIME_FORMATTER = new Intl.DateTimeFormat('default', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const SHORT_DATETIME_FORMATTER = new Intl.DateTimeFormat('default', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('default', {
  dateStyle: 'long',
});
