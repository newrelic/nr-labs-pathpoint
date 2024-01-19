import React from 'react';
import PropTypes from 'prop-types';

import { HeadingText } from 'nr1';

const formatTimestamp = (timestamp) =>
  new Intl.DateTimeFormat('default', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
    .format(new Date(timestamp))
    .replace(/[APM]{2}/, (match) => match.toLowerCase());

const AuditLog = ({ auditLogs }) => {
  return (
    <div className="audit-log-content">
      <div className="audit-log-header">
        <HeadingText type={HeadingText.TYPE.HEADING_2}>Audit Log</HeadingText>
      </div>
      <div className="audit-log-items">
        {auditLogs.reverse().map((log) => (
          <div key={`log_${log.id}`} className="audit-log-item">
            <p className="user-name">
              {log.user.name}
              <span className="change-date">{` (${log.user.email})`}</span>
            </p>
            <p className="change-date">{formatTimestamp(log.timestamp)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

AuditLog.propTypes = {
  auditLogs: PropTypes.array,
};

AuditLog.displayName = 'AuditLog';

export default AuditLog;
