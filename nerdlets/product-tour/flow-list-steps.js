import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { FlowList } from '../../src/components';
import Callout from './callout';

const FlowListSteps = ({
  flows = [],
  content,
  nextHandler,
  dismissHandler,
}) => {
  const [overlayStyle, setOverlayStyle] = useState({});
  const [calloutStyle, setCalloutStyle] = useState({});
  const flowListRef = useRef();
  const calloutRef = useRef();

  useEffect(() => {
    const {
      left = 0,
      top = 0,
      width = 0,
      height = 0,
    } = flowListRef?.current?.children?.[0]?.getBoundingClientRect?.() || {};
    setOverlayStyle((os) => {
      if (
        os.left === left &&
        os.top === top &&
        os.width === width &&
        os.height === height
      )
        return os;
      return { ...os, left, top, width, height };
    });
    setCalloutStyle({
      top: 0,
      left: '50%',
      transform: `translate(-50%, ${top + height + 10}px)`,
    });
  });

  return (
    <div className="product-tour">
      <FlowList flows={flows} onClick={null} ref={flowListRef} />
      <div className="focused-overlay" style={overlayStyle}></div>
      <Callout
        content={content}
        nextHandler={nextHandler}
        dismissHandler={dismissHandler}
        style={calloutStyle}
        ref={calloutRef}
      />
    </div>
  );
};

FlowListSteps.propTypes = {
  flows: PropTypes.array,
  content: PropTypes.object,
  nextHandler: PropTypes.func,
  dismissHandler: PropTypes.func,
};

export default FlowListSteps;
