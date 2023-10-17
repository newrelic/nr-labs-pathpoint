import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { Button, HeadingText, Modal, Radio } from 'nr1';

import IconsLib from '../icons-lib';
import { STAGE_SHAPES_ARRAY, STAGE_SHAPES_ICON } from '../../constants';
import { stageShapeDataFromIndex, stageShapeIndexFromData } from '../../utils';

const shapeId = (shape) => shape.replace(/\s+/g, '_').toLowerCase();

const ChangeShapeModal = ({
  related = {},
  hidden = true,
  onChange,
  onClose,
}) => {
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(0);

  useEffect(
    () => setSelectedShapeIndex(stageShapeIndexFromData(related)),
    [related]
  );

  const changeHandler = useCallback(() => {
    if (onChange)
      onChange({ related: stageShapeDataFromIndex(selectedShapeIndex) });
    if (onClose) onClose();
  }, [selectedShapeIndex]);

  const closeHandler = useCallback(() => {
    if (onClose) onClose();
  }, []);

  return (
    <Modal hidden={hidden} onClose={closeHandler}>
      <div className="change-shape-modal">
        <div className="modal-content">
          <HeadingText type={HeadingText.TYPE.HEADING_3}>
            Stage shape
          </HeadingText>
          <div className="shape-options">
            {STAGE_SHAPES_ARRAY.map((shape, index) => (
              <label key={shapeId(shape)}>
                <Radio
                  onChange={({ target: { checked } }) =>
                    checked ? setSelectedShapeIndex(index) : null
                  }
                  label=""
                  checked={selectedShapeIndex === index}
                />
                <IconsLib
                  type={IconsLib.TYPES[STAGE_SHAPES_ICON[shape.toUpperCase()]]}
                />
                {shape}
              </label>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <Button type={Button.TYPE.PRIMARY} onClick={changeHandler}>
            Save
          </Button>
          <Button type={Button.TYPE.TERTIARY} onClick={closeHandler}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

ChangeShapeModal.propTypes = {
  related: PropTypes.shape({
    target: PropTypes.bool,
    source: PropTypes.bool,
  }),
  hidden: PropTypes.bool,
  onChange: PropTypes.func,
  onClose: PropTypes.func,
};

export default ChangeShapeModal;
