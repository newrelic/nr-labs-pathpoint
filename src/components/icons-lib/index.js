import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { icons, TYPES } from './icons';
import { COMPONENTS, SIGNAL_TYPES } from '../../constants';
import { SelectionsContext } from '../../contexts';

const IconsLib = ({
  type,
  style = {},
  guid,
  displayMode = '',
  className = '',
}) => {
  const { toggleSelection } = useContext(SelectionsContext);
  return (
    <span className="icons-lib-wrapper">
      <svg
        className={`icons-lib ${className}`}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
        role="img"
        style={style}
        onClick={(evt) => {
          if ([SIGNAL_TYPES.ENTITY, SIGNAL_TYPES.ALERT].includes(type)) {
            if (displayMode === 'grid') evt.stopPropagation();

            toggleSelection(COMPONENTS.SIGNAL, guid);
          }
        }}
      >
        <title>{`${type} icon`}</title>
        {icons[type]}
      </svg>
    </span>
  );
};

IconsLib.TYPES = TYPES;

IconsLib.propTypes = {
  type: PropTypes.oneOf(Object.keys(TYPES)),
  style: PropTypes.object,
  guid: PropTypes.string,
  displayMode: PropTypes.string,
  className: PropTypes.string,
};

export default IconsLib;
