import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  HeadingText,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverBody,
} from 'nr1';
import { EditInPlace } from '@newrelic/nr-labs-components';

import IconsLib from '../icons-lib';
import { FlowListDropdown } from '../';
import ImageUploadModal from '../image-upload-modal';
import { MODES } from '../../constants';

const FlowHeader = ({
  name = 'Flow',
  imageUrl,
  onUpdate,
  onClose,
  mode = MODES.KIOSK,
  flows = [],
  onSelectFlow = () => null,
  onDeleteFlow = () => null,
}) => {
  const [imageModalHidden, setImageModalHidden] = useState(true);

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
      <Button
        type={Button.TYPE.DESTRUCTIVE}
        iconType={Icon.TYPE.INTERFACE__OPERATIONS__TRASH}
        sizeType={Button.SIZE_TYPE.SMALL}
        onClick={() => onDeleteFlow()}
      >
        Delete Flow
      </Button>
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
          </div>
        </PopoverTrigger>
        <PopoverBody>
          <div className="flow-listing-dropdown">
            <FlowListDropdown flows={flows} onSelectFlow={onSelectFlow} />
          </div>
        </PopoverBody>
      </Popover>
    </div>
  );
};

FlowHeader.propTypes = {
  name: PropTypes.string,
  imageUrl: PropTypes.string,
  onUpdate: PropTypes.func,
  onClose: PropTypes.func,
  mode: PropTypes.oneOf(Object.values(MODES)),
  flows: PropTypes.array,
  onSelectFlow: PropTypes.func,
  onDeleteFlow: PropTypes.func,
};

export default FlowHeader;
