import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { icons, TYPES } from './icons';
import { COMPONENTS, SIGNAL_TYPES } from '../../constants';
import { SelectionsContext, SignalsContext, useSidebar } from '../../contexts';
import SignalDetail from './../signal-detail';

const IconsLib = ({
  type,
  style = {},
  guid,
  displayMode = '',
  className = '',
  title = '',
  shouldShowTitle = true,
}) => {
  const {
    selections: { [COMPONENTS.SIGNAL]: selectedSignal } = {},
    toggleSelection,
  } = useContext(SelectionsContext);
  const signalsDetails = useContext(SignalsContext);
  const { openSidebar, closeSidebar } = useSidebar();
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

            if (selectedSignal !== guid) {
              toggleSelection(COMPONENTS.SIGNAL, guid);
              openSidebar({
                content: (
                  <SignalDetail
                    guid={guid}
                    name={signalsDetails[guid]?.name}
                    type={type}
                    status={className}
                  />
                ),
                onClose: closeSidebar(),
                status: className,
              });
            } else {
              toggleSelection(COMPONENTS.SIGNAL, guid);
              closeSidebar();
            }
          }
        }}
      >
        {shouldShowTitle ? <title>{title || `${type} icon`}</title> : null}
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
  title: PropTypes.string,
  shouldShowTitle: PropTypes.bool,
};

export default IconsLib;
