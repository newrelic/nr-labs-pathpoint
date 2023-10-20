import React from 'react';

import { BlockText, Button, HeadingText, Icon, navigation } from 'nr1';

import { UI_CONTENT } from '../../constants';

const GetStarted = () => {
  return (
    <div className="get-started">
      <div className="background">
        <div className="right-side" />
      </div>
      <div className="foreground">
        <div className="content">
          <div className="title">
            <div className="icon">
              <Icon type={Icon.TYPE.INTERFACE__INFO__INFO} />
            </div>
            <HeadingText>
              {UI_CONTENT.GET_STARTED.BUTTON_LABEL_GET_STARTED}
            </HeadingText>
          </div>
          <div className="product-name">
            <HeadingText type={HeadingText.TYPE.HEADING_1}>
              {UI_CONTENT.GET_STARTED.HEADING}
            </HeadingText>
          </div>
          <div className="description">
            <BlockText type={BlockText.TYPE.PARAGRAPH}>
              {UI_CONTENT.GET_STARTED.DESCRIPTION}
            </BlockText>
          </div>
          <div className="action">
            <Button
              type={Button.TYPE.PRIMARY}
              sizeType={Button.SIZE_TYPE.LARGE}
              onClick={() =>
                navigation.openNerdlet({
                  id: 'product-tour',
                })
              }
            >
              {UI_CONTENT.GET_STARTED.BUTTON_LABEL_GET_STARTED}
            </Button>
          </div>
        </div>
        <div className="hero-image"></div>
      </div>
    </div>
  );
};

export default GetStarted;
