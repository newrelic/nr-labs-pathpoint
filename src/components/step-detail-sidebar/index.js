import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { Card, CardBody, HeadingText, Icon, Link } from 'nr1';

import IconsLib from '../icons-lib';
import {
  SIGNAL_TYPES,
  STEP_STATUS_OPTIONS,
  STEP_STATUS_UNITS,
  UI_CONTENT,
} from '../../constants';

const StepDetailSidebar = ({ step: { title, link, signals, ...step } }) => {
  const [includedSignals, setIncludedSignals] = useState([]);

  useEffect(
    () =>
      setIncludedSignals(() =>
        (signals || []).filter(
          ({ included }) => included || included === undefined
        )
      ),
    [signals]
  );

  const signalsStatusRule = useMemo(() => {
    if (!includedSignals.length)
      return <span>{UI_CONTENT.STEP.CONFIG.TOOLTIPS.UNKNOWN}</span>;

    const {
      status: {
        option: statusOption = STEP_STATUS_OPTIONS.WORST,
        weight: {
          unit: statusWeightUnit = STEP_STATUS_UNITS.PERCENT,
          value: statusWeightValue = '',
        } = {},
      } = {},
    } = step?.config || {};

    if (statusWeightValue) {
      const unit = statusWeightUnit === STEP_STATUS_UNITS.PERCENT ? '%' : '';
      const weightAppliedMessage =
        statusWeightUnit === STEP_STATUS_UNITS.PERCENT
          ? `${statusWeightValue}${unit} of `
          : `${statusWeightValue}/`;

      return (
        <>
          <span className="status-option">{statusOption}</span>
          <span>
            status -{` ${weightAppliedMessage}${includedSignals.length} `}
            selected signals:
          </span>
        </>
      );
    }

    return (
      <>
        <span className="status-option">{statusOption}</span>
        <span> status of {includedSignals.length} selected signals:</span>
      </>
    );
  }, [includedSignals, step]);

  return (
    <div className="step-detail-sidebar">
      <div className="step-header">
        <Card>
          <CardBody className="step-header-card-body">
            <HeadingText type={HeadingText.TYPE.HEADING_6}>
              STEP DETAILS
            </HeadingText>
            <HeadingText type={HeadingText.TYPE.HEADING_3}>{title}</HeadingText>
            {link ? (
              <Link
                className="detail-link"
                to={link}
                onClick={(e) => e.target.setAttribute('target', '_blank')}
              >
                View additional context...
              </Link>
            ) : null}
          </CardBody>
        </Card>
      </div>
      <div className="signals-status-rule">
        <HeadingText type={HeadingText.TYPE.HEADING_5}>
          {UI_CONTENT.STEP.PANEL.CONFIG_TITLE}
        </HeadingText>
        {step.excluded ? (
          <div className="step-excluded">
            <Icon color="#f07a0e" type={Icon.TYPE.INTERFACE__STATE__WARNING} />
            <span className="excluded-message">
              {UI_CONTENT.STEP.PANEL.EXCLUDE_MESSAGE}
            </span>
          </div>
        ) : (
          ''
        )}
        <div className="status-calculation">{signalsStatusRule}</div>
        <div className="included-signals-list">
          {includedSignals.map(({ guid, name, status, type }) => (
            <div key={guid} className="included-signal">
              <IconsLib
                className={`icons-lib ${status}`}
                type={
                  type === SIGNAL_TYPES.ALERT
                    ? IconsLib.TYPES.ALERT
                    : IconsLib.TYPES.ENTITY
                }
                shouldShowTitle={false}
              />
              <span title={name}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

StepDetailSidebar.propTypes = {
  step: PropTypes.object,
};

export default StepDetailSidebar;
