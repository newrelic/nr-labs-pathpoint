import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { Tooltip } from 'nr1';

import IconsLib from '../icons-lib';
import { SIGNAL_TYPES, UI_CONTENT } from '../../constants';

const renderSignalIcon = (
  {
    style,
    name = UI_CONTENT.SIGNAL.DEFAULT_NAME,
    type,
    guid,
    status,
    ...statusProps
  },
  i
) => (
  <Tooltip text={name}>
    <IconsLib
      key={i}
      className={`${status}`}
      type={type}
      guid={guid}
      shouldShowTitle={false}
      {...statusProps}
      style={{ ...style, margin: 1, marginBottom: -3 }}
    />
  </Tooltip>
);

const SignalsGridLayout = ({ statuses }) => {
  const [grid, setGrid] = useState({ entities: [], alerts: [] });
  const [width, setWidth] = useState(null);
  const wrapperRef = useRef();

  useEffect(() => {
    if (statuses) {
      setGrid(
        statuses.reduce(
          (acc, signal, index) => ({
            entities:
              signal.type === SIGNAL_TYPES.ENTITY
                ? [...acc.entities, renderSignalIcon(signal, index)]
                : [...acc.entities],
            alerts:
              signal.type === SIGNAL_TYPES.ALERT
                ? [...acc.alerts, renderSignalIcon(signal, index)]
                : [...acc.alerts],
          }),
          { entities: [], alerts: [] }
        )
      );
    }
  }, [statuses]);

  useLayoutEffect(() => {
    const { width } = wrapperRef.current.getBoundingClientRect();
    setWidth(width);
  }, []);

  return (
    <>
      <div className="icons-grid-wrapper" ref={wrapperRef}>
        {width && grid.entities.length ? (
          <div className="icons-grid-container" style={{ width }}>
            {grid.entities}
          </div>
        ) : (
          ''
        )}
      </div>
      <div className="icons-grid-wrapper" ref={wrapperRef}>
        {width && grid.alerts.length ? (
          <div className="icons-grid-container" style={{ width }}>
            {grid.alerts}
          </div>
        ) : (
          ''
        )}
      </div>
    </>
  );
};

SignalsGridLayout.propTypes = {
  statuses: PropTypes.array,
};

export default SignalsGridLayout;
