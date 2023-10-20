import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

import { Button } from 'nr1';

const Callout = forwardRef(
  (
    {
      content: { title = '', subtitle = '', text = '' },
      nextHandler,
      backHandler,
      ctaHandler,
      dismissHandler,
      style,
    },
    ref
  ) => {
    return (
      <div className="callout" ref={ref} style={style}>
        <div className="body">
          <div className="title">{title}</div>
          <div className="text">{subtitle}</div>
          <div className="text">{text}</div>
        </div>
        <div className="footer">
          <div className="dismiss">
            <Button
              className="secondary"
              type={Button.TYPE.PRIMARY}
              sizeType={Button.SIZE_TYPE.SMALL}
              onClick={dismissHandler}
            >
              Dismiss
            </Button>
          </div>
          <div className="steps">
            {backHandler ? (
              <Button
                type={Button.TYPE.PRIMARY}
                sizeType={Button.SIZE_TYPE.SMALL}
                onClick={backHandler}
              >
                Back
              </Button>
            ) : null}
            {nextHandler ? (
              <Button
                className="primary"
                type={Button.TYPE.PRIMARY}
                sizeType={Button.SIZE_TYPE.SMALL}
                onClick={nextHandler}
              >
                Next
              </Button>
            ) : null}
            {ctaHandler ? (
              <Button
                className="primary"
                type={Button.TYPE.PRIMARY}
                sizeType={Button.SIZE_TYPE.SMALL}
                onClick={ctaHandler}
              >
                Create flow
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);

Callout.propTypes = {
  content: PropTypes.object,
  nextHandler: PropTypes.func,
  backHandler: PropTypes.func,
  ctaHandler: PropTypes.func,
  dismissHandler: PropTypes.func,
  style: PropTypes.object,
};

Callout.displayName = 'Callout';

export default Callout;
