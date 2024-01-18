export const formatKpiHoverDatime = (dateClause) => {
  if (!dateClause) {
    return '';
  } else if (dateClause.startsWith("'")) {
    let date;
    try {
      date = new Date(dateClause.slice(1, -1));
      return new Intl.DateTimeFormat('default', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
        .format(date)
        .replace(/[APM]{2}/, (match) => match.toLowerCase());
    } catch (err) {
      return dateClause;
    }
  } else {
    return dateClause.toLowerCase();
  }
};
