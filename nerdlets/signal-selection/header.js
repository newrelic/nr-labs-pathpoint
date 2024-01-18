import React from 'react';
import PropTypes from 'prop-types';

import { HeadingText } from 'nr1';

const Header = ({
  stageName = 'Stage',
  levelOrder = 0,
  stepTitle = 'Step',
}) => (
  <header>
    <HeadingText type={HeadingText.TYPE.HEADING_2}>Select signals</HeadingText>
    <div className="identification">
      <HeadingText type={HeadingText.TYPE.HEADING_6} className="stage-name">
        {stageName}
      </HeadingText>
      <span className="step-group">
        <HeadingText type={HeadingText.TYPE.HEADING_6}>
          {levelOrder}
        </HeadingText>
      </span>
      <HeadingText type={HeadingText.TYPE.HEADING_6}>{stepTitle}</HeadingText>
    </div>
  </header>
);

Header.propTypes = {
  stageName: PropTypes.string,
  levelOrder: PropTypes.number,
  stepTitle: PropTypes.string,
};

export default Header;
