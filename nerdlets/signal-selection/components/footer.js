import React from 'react';
import PropTypes from 'prop-types';

import { Button } from 'nr1';

import { UI_CONTENT } from '../../../src/constants';

const Footer = ({ tooManySignals, saveHandler, cancelHandler }) => (
  <footer>
    <div className="message-bar">
      {tooManySignals
        ? UI_CONTENT.SIGNAL_SELECTION.TOO_MANY_ENTITIES_ERROR_MESSAGE
        : ''}
    </div>
    <div className="buttons-bar">
      <Button type={Button.TYPE.TERTIARY} onClick={cancelHandler}>
        Cancel
      </Button>
      <Button
        type={Button.TYPE.PRIMARY}
        disabled={tooManySignals}
        onClick={saveHandler}
      >
        Save changes
      </Button>
    </div>
  </footer>
);

Footer.propTypes = {
  tooManySignals: PropTypes.bool,
  saveHandler: PropTypes.func,
  cancelHandler: PropTypes.func,
};

export default Footer;
