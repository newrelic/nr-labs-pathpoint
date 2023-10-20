import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { Flow } from '../../src/components';
import Callout from './callout';

const FlowSteps = ({
  step,
  flow = {},
  accountId,
  mode,
  setMode,
  user,
  content,
  nextHandler,
  backHandler,
  ctaHandler,
  dismissHandler,
}) => {
  const [overlayStyle, setOverlayStyle] = useState({});
  const [calloutStyle, setCalloutStyle] = useState({});
  const flowRef = useRef();
  const calloutRef = useRef();

  useEffect(() => {
    if (step === 2) {
      setOverlayStyle({ left: 0, top: 0, width: '100%', height: '100%' });
      positionCallout({ top: '50%', left: '50%', tx: '-50%', ty: '-50%' });
    } else if (step === 3) {
      spotlightElement(
        flowRef?.current?.querySelector('.stages')?.children?.[0]
      );
    } else if (step === 4) {
      spotlightElement(
        flowRef?.current
          ?.querySelector('.stages')
          ?.children?.[0]?.querySelector('.step-groups')?.children?.[0]
      );
    } else if (step === 5) {
      spotlightElement(
        flowRef?.current
          ?.querySelector('.stages')
          ?.children?.[0]?.querySelector('.step-groups')
          ?.children?.[0]?.querySelector('.steps')?.children?.[0]
      );
    } else if (step === 6) {
      spotlightElement(
        flowRef?.current
          ?.querySelector('.stages')
          ?.children?.[0]?.querySelector('.signals-listing')?.children?.[0]
      );
    } else if (step === 7) {
      spotlightElement(flowRef?.current?.querySelector('.kpi-bar'));
    } else if (step === 8) {
      spotlightElement(flowRef?.current, true);
    }
  }, [step]);

  useEffect(() => {
    const { left = 0, top = 0, width = 0, height = 0 } = overlayStyle || {};
    if (width && height) {
      const { width: calloutWidth = 0, height: calloutHeight = 0 } =
        calloutRef?.current?.getBoundingClientRect?.() || {};
      if (step === 3) {
        positionCallout({
          top: '50%',
          tx: `${left + width + 10}px`,
          ty: '-50%',
        });
      } else if (step === 4 || step === 5) {
        positionCallout({ ty: `${top - calloutHeight - 10}px` });
      } else if (step === 6) {
        positionCallout({
          tx: `${left + width + 10}px`,
          ty: `${top - calloutHeight / 2}px`,
        });
      } else if (step === 7) {
        positionCallout({
          left: '50%',
          tx: '-50%',
          ty: `${top - calloutHeight - 10}px`,
        });
      } else if (step === 8) {
        positionCallout({ tx: `${width - calloutWidth}px`, ty: '10px' });
      }
    }
  }, [step, overlayStyle]);

  const spotlightElement = useCallback((el, shouldCoverCanvas = false) => {
    const rect = el?.getBoundingClientRect?.() || {};
    const { left = 0, top = 0 } = rect;
    const { width = 0, height = 0 } = shouldCoverCanvas ? {} : rect;
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
  }, []);

  const positionCallout = useCallback(
    ({ top = 0, left = 0, tx = 0, ty = 0 }) =>
      setCalloutStyle({
        top,
        left,
        transform: `translate(${tx}, ${ty})`,
      }),
    []
  );

  return (
    <div className="product-tour">
      <Flow
        flow={flow}
        onUpdate={null}
        onClose={null}
        accountId={accountId}
        mode={mode}
        setMode={setMode}
        flows={[]}
        onSelectFlow={null}
        user={user}
        ref={flowRef}
      />
      <div className="focused-overlay" style={overlayStyle}></div>
      <Callout
        content={content}
        nextHandler={step < 8 ? nextHandler : null}
        backHandler={backHandler}
        ctaHandler={step === 8 ? ctaHandler : null}
        dismissHandler={dismissHandler}
        style={calloutStyle}
        ref={calloutRef}
      />
    </div>
  );
};

FlowSteps.propTypes = {
  step: PropTypes.number,
  flow: PropTypes.object,
  accountId: PropTypes.number,
  mode: PropTypes.string,
  setMode: PropTypes.func,
  user: PropTypes.object,
  content: PropTypes.object,
  nextHandler: PropTypes.func,
  backHandler: PropTypes.func,
  ctaHandler: PropTypes.func,
  dismissHandler: PropTypes.func,
};

export default FlowSteps;
