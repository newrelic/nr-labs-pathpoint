import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { HeadingText, Icon, Tooltip } from 'nr1';
import { EditInPlace } from '@newrelic/nr-labs-components';

import IconsLib from '../icons-lib';
import DeleteConfirmModal from '../delete-confirm-modal';
import { MODES } from '../../constants';

const StepHeader = ({
  title = 'Step',
  onUpdate,
  onDelete,
  onDragHandle,
  mode = MODES.INLINE,
}) => {
  const [deleteModalHidden, setDeleteModalHidden] = useState(true);

  return mode === MODES.EDIT ? (
    <div className="step-header edit">
      <span
        className="drag-handle"
        onMouseDown={() => (onDragHandle ? onDragHandle(true) : null)}
        onMouseUp={() => (onDragHandle ? onDragHandle(false) : null)}
      >
        <IconsLib type={IconsLib.TYPES.HANDLE} />
      </span>
      <HeadingText type={HeadingText.TYPE.HEADING_6} className="title">
        <EditInPlace
          value={title}
          setValue={(newTitle) =>
            newTitle !== title && onUpdate
              ? onUpdate({ title: newTitle })
              : null
          }
        />
      </HeadingText>
      <span className="delete-btn" onClick={() => setDeleteModalHidden(false)}>
        <Icon type={Icon.TYPE.INTERFACE__OPERATIONS__CLOSE} />
      </span>
      <DeleteConfirmModal
        name={title}
        type="step"
        hidden={deleteModalHidden}
        onConfirm={onDelete}
        onClose={() => setDeleteModalHidden(true)}
      />
    </div>
  ) : (
    <div className={`step-header ${mode}`}>
      <Tooltip text={title} placementType={Tooltip.PLACEMENT_TYPE.TOP}>
        <HeadingText type={HeadingText.TYPE.HEADING_6} className="title">
          {title}
        </HeadingText>
      </Tooltip>
    </div>
  );
};

StepHeader.propTypes = {
  title: PropTypes.string,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  onDragHandle: PropTypes.func,
  mode: PropTypes.oneOf(Object.values(MODES)),
};

export default StepHeader;
