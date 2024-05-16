import React, { memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Badge,
  Button,
  HeadingText,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverBody,
  SegmentedControl,
  SegmentedControlItem,
  Tooltip,
} from 'nr1';
import { EditInPlace } from '@newrelic/nr-labs-components';

import IconsLib from '../icons-lib';
import { FlowListDropdown, ImageUploadModal, LastSavedMessage } from '../';
import { MODES, UI_CONTENT } from '../../constants';

const FlowHeader = ({
  name = 'Flow',
  imageUrl,
  isPreview,
  onPreview,
  onUpdate,
  onDiscard,
  onPersist,
  onClose,
  mode = MODES.INLINE,
  setMode = () => null,
  flows = [],
  onSelectFlow = () => null,
  onDeleteFlow = () => null,
  onRefreshFlow = () => null,
  lastSavedTimestamp,
}) => {
  const [imageModalHidden, setImageModalHidden] = useState(true);

  const capitalize = useCallback((word) =>
    word.replace(/\b\w/g, (l) => l.toUpperCase())
  );

  const EditButtons = memo(
    () => (
      <>
        <Button
          type={Button.TYPE.TERTIARY}
          iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__CLOSE}
          sizeType={Button.SIZE_TYPE.SMALL}
          onClick={onDiscard}
        >
          {UI_CONTENT.GLOBAL.BUTTON_LABEL_EDIT_DISCARD}
        </Button>
        {isPreview ? (
          <Button
            type={Button.TYPE.SECONDARY}
            iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__EDIT}
            sizeType={Button.SIZE_TYPE.SMALL}
            onClick={onPreview}
          >
            {UI_CONTENT.GLOBAL.BUTTON_LABEL_PREVIEW_EXIT}
          </Button>
        ) : (
          <Button
            type={Button.TYPE.SECONDARY}
            iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__SHOW}
            sizeType={Button.SIZE_TYPE.SMALL}
            onClick={onPreview}
          >
            {UI_CONTENT.GLOBAL.BUTTON_LABEL_PREVIEW}
          </Button>
        )}
        <Button
          type={Button.TYPE.PRIMARY}
          iconType={Button.ICON_TYPE.INTERFACE__SIGN__CHECKMARK}
          sizeType={Button.SIZE_TYPE.SMALL}
          onClick={onPersist}
        >
          {UI_CONTENT.GLOBAL.BUTTON_LABEL_EDIT_PERSIST}
        </Button>
      </>
    ),
    [isPreview]
  );
  EditButtons.displayName = 'EditButtons';

  const ViewModeSegmentedControl = memo(
    () => (
      <SegmentedControl
        className="view-mode"
        type={
          isPreview
            ? SegmentedControl.TYPE.ICONS_ONLY
            : SegmentedControl.TYPE.NORMAL
        }
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
    ),
    [isPreview]
  );
  ViewModeSegmentedControl.displayName = 'ViewModeSegmentedControl';

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
        <EditButtons />
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
      <div className="flow-status">
        <Tooltip text="Flow shows active incidents affecting the configured signals">
          <div className="flow-status-badge">
            {UI_CONTENT.FLOW.CURRENT_STATUS}
          </div>
        </Tooltip>
        <Tooltip text="Refresh data in flow">
          <Button
            variant={Button.VARIANT.TERTIARY}
            sizeType={Button.SIZE_TYPE.SMALL}
            iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__REFRESH}
            ariaLabel="Refresh data in flow"
            onClick={onRefreshFlow}
          />
        </Tooltip>
      </div>
      <div className="flow-header-actions">
        {isPreview ? (
          <>
            <EditButtons />
            <ViewModeSegmentedControl />
          </>
        ) : (
          <ViewModeSegmentedControl />
        )}
      </div>
    </div>
  );
};

FlowHeader.propTypes = {
  name: PropTypes.string,
  imageUrl: PropTypes.string,
  isPreview: PropTypes.bool,
  onPreview: PropTypes.func,
  onUpdate: PropTypes.func,
  onDiscard: PropTypes.func,
  onPersist: PropTypes.func,
  onClose: PropTypes.func,
  mode: PropTypes.oneOf(Object.values(MODES)),
  setMode: PropTypes.func,
  flows: PropTypes.array,
  onSelectFlow: PropTypes.func,
  onDeleteFlow: PropTypes.func,
  onRefreshFlow: PropTypes.func,
  lastSavedTimestamp: PropTypes.number,
};

export default FlowHeader;
