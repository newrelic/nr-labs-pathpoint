import React from 'react';

import { BlockText, Icon, Popover, PopoverBody, PopoverTrigger } from 'nr1';

import { UI_CONTENT } from '../../../../src/constants';

const FiltersInfoPopover = () => (
  <Popover openOnHover={true}>
    <PopoverTrigger>
      <Icon className="help-cursor" type={Icon.TYPE.INTERFACE__INFO__HELP} />
    </PopoverTrigger>
    <PopoverBody className="filters-info-popover-body">
      <div className="info-text">
        {UI_CONTENT.SIGNAL_SELECTION.FILTER_INFO_TEXT.map((paragraph, i) => (
          <BlockText key={i}>{paragraph}</BlockText>
        ))}
      </div>
    </PopoverBody>
  </Popover>
);

export default FiltersInfoPopover;
