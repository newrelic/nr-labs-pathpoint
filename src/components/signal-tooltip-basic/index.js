import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  HeadingText,
  Popover,
  PopoverBody,
  PopoverTrigger,
  useAccountsQuery,
} from 'nr1';

import types from '../../../nerdlets/signal-selection/types.json';

import { CONDITION_DOMAIN_TYPE, UI_CONTENT } from '../../constants';

const { UNKNOWN_TEXT } = UI_CONTENT.GLOBAL;

const SignalTooltipBasic = ({ name, guid, children }) => {
  const [accountName, setAccountName] = useState(UNKNOWN_TEXT);
  const [signalType, setSignalType] = useState(UNKNOWN_TEXT);
  const { data: accounts = [] } = useAccountsQuery();

  useEffect(() => {
    if (!guid) return;
    const [acctIdStr, sigDomain, sigType] = atob(guid)?.split('|') || [];
    const acctId = Number(acctIdStr || 0);
    if (acctId && accounts?.length)
      setAccountName(
        () => accounts.find(({ id }) => id === acctId)?.name || UNKNOWN_TEXT
      );
    if (sigDomain && sigType)
      setSignalType(() =>
        sigDomain === CONDITION_DOMAIN_TYPE.domain && CONDITION_DOMAIN_TYPE.type
          ? 'Alert Condition'
          : types.find(
              ({ domain, type }) => domain === sigDomain && type === sigType
            )?.displayName || UNKNOWN_TEXT
      );
  }, [guid, accounts]);

  return (
    <Popover openOnHover>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverBody>
        <div className="signal-tooltip-basic">
          <HeadingText className="info">{name || UNKNOWN_TEXT}</HeadingText>
          <div className="meta">
            <span>{signalType}</span>
            <span>|</span>
            <span>{accountName}</span>
          </div>
        </div>
      </PopoverBody>
    </Popover>
  );
};

SignalTooltipBasic.propTypes = {
  name: PropTypes.string,
  guid: PropTypes.string,
  children: PropTypes.any,
};

export default SignalTooltipBasic;
