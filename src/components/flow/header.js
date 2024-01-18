import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  HeadingText,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverBody,
  SegmentedControl,
  SegmentedControlItem,
} from 'nr1';
import { EditInPlace } from '@newrelic/nr-labs-components';

import IconsLib from '../icons-lib';
import { FlowListDropdown, ImageUploadModal, LastSavedMessage } from '../';
import { MODES, UI_CONTENT } from '../../constants';

const FlowHeader = ({
  name = 'Flow',
  imageUrl,
  onUpdate,
  onClose,
  mode = MODES.INLINE,
  setMode = () => null,
  flows = [],
  onSelectFlow = () => null,
  onExportFlow = () => null,
  onDeleteFlow = () => null,
  lastSavedTimestamp,
  resetLastSavedTimestamp = () => null,
}) => {
  const [imageModalHidden, setImageModalHidden] = useState(true);

  const doneEditingHandler = () => {
    resetLastSavedTimestamp();
    setMode(MODES.INLINE);
  };

  const capitalize = useCallback((word) =>
    word.replace(/\b\w/g, (l) => l.toUpperCase())
  );

  return mode === MODES.EDIT ? (
    <div className="flow-header">
      <div className="back" onClick={onClose}>
        <Icon type={Icon.TYPE.INTERFACE__CHEVRON__CHEVRON_LEFT} />
      </div>
      <div
        className="logo-image edit"
        onClick={() => setImageModalHidden(false)}
      >
        {imageUrl ? (
          <img src={imageUrl} />
        ) : (
          <IconsLib type={IconsLib.TYPES.CAMERA} />
        )}
      </div>
      <HeadingText type={HeadingText.TYPE.HEADING_4}>
        <EditInPlace
          value={name}
          setValue={(newName) =>
            name !== newName && onUpdate ? onUpdate({ name: newName }) : null
          }
        />
      </HeadingText>
      {lastSavedTimestamp ? (
        <LastSavedMessage lastSavedTimestamp={lastSavedTimestamp} />
      ) : null}
      <ImageUploadModal
        imageUrl={imageUrl}
        hidden={imageModalHidden}
        onChange={(newImageUrl) =>
          newImageUrl !== imageUrl && onUpdate
            ? onUpdate({ imageUrl: newImageUrl })
            : null
        }
        onClose={() => setImageModalHidden(true)}
      />
      <div className="flow-header-actions">
        <Button
          type={Button.TYPE.PRIMARY}
          iconType={Icon.TYPE.INTERFACE__SIGN__CHECKMARK}
          sizeType={Button.SIZE_TYPE.SMALL}
          onClick={doneEditingHandler}
        >
          {UI_CONTENT.GLOBAL.BUTTON_LABEL_EXIT_EDIT_MODE}
        </Button>
        <Button
          type={Button.TYPE.DESTRUCTIVE}
          iconType={Icon.TYPE.INTERFACE__OPERATIONS__TRASH}
          sizeType={Button.SIZE_TYPE.SMALL}
          onClick={() => onDeleteFlow()}
        ></Button>
      </div>
    </div>
  ) : (
    <div className="flow-header">
      <div className="back" onClick={onClose}>
        <Icon type={Icon.TYPE.INTERFACE__CHEVRON__CHEVRON_LEFT} />
      </div>
      <Popover openOnHover={true}>
        <PopoverTrigger>
          <div className="flow-heading">
            {imageUrl ? (
              <div className="logo-image">
                <img src={imageUrl} />
              </div>
            ) : null}
            <HeadingText type={HeadingText.TYPE.HEADING_4}>{name}</HeadingText>
            <Icon type={Icon.TYPE.INTERFACE__CHEVRON__CHEVRON_BOTTOM} />
            {lastSavedTimestamp ? (
              <LastSavedMessage lastSavedTimestamp={lastSavedTimestamp} />
            ) : null}
          </div>
        </PopoverTrigger>
        <PopoverBody>
          <div className="flow-listing-dropdown">
            <FlowListDropdown flows={flows} onSelectFlow={onSelectFlow} />
          </div>
        </PopoverBody>
      </Popover>
      <div className="flow-header-actions">
        <Button
          type={Button.TYPE.PLAIN}
          sizeType={Button.SIZE_TYPE.SMALL}
          iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__DOWNLOAD}
          onClick={onExportFlow}
        >
          {UI_CONTENT.FLOW.BUTTON_EXPORT}
        </Button>
        <SegmentedControl
          className="view-mode"
          value={mode}
          onChange={(_, value) => setMode(value)}
        >
          <SegmentedControlItem
            label={capitalize(MODES.STACKED)}
            value={MODES.STACKED}
            iconType={
              SegmentedControlItem.ICON_TYPE.DATAVIZ__DATAVIZ__TABLE_CHART
            }
          />
          <SegmentedControlItem
            label={capitalize(MODES.INLINE)}
            value={MODES.INLINE}
            iconType={SegmentedControlItem.ICON_TYPE.INTERFACE__VIEW__LIST_VIEW}
          />
        </SegmentedControl>
      </div>
    </div>
  );
};

FlowHeader.propTypes = {
  name: PropTypes.string,
  imageUrl: PropTypes.string,
  onUpdate: PropTypes.func,
  onClose: PropTypes.func,
  mode: PropTypes.oneOf(Object.values(MODES)),
  setMode: PropTypes.func,
  flows: PropTypes.array,
  onSelectFlow: PropTypes.func,
  onExportFlow: PropTypes.func,
  onDeleteFlow: PropTypes.func,
  lastSavedTimestamp: PropTypes.number,
  resetLastSavedTimestamp: PropTypes.func,
};

export default FlowHeader;
