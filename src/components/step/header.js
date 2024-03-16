import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { HeadingText, Icon } from 'nr1';
import { EditInPlace } from '@newrelic/nr-labs-components';

import IconsLib from '../icons-lib';
import DeleteConfirmModal from '../delete-confirm-modal';
import { MODES } from '../../constants';
import { FlowDispatchContext, StagesContext } from '../../contexts';
import { FLOW_DISPATCH_COMPONENTS, FLOW_DISPATCH_TYPES } from '../../reducers';

const StepHeader = ({
  stageId,
  levelId,
  stepId,
  onDragHandle,
  mode = MODES.INLINE,
  saveFlow,
  handleStepHeaderClick = () => null,
}) => {
  const stages = useContext(StagesContext);
  const dispatch = useContext(FlowDispatchContext);
  const [title, setTitle] = useState();
  const [deleteModalHidden, setDeleteModalHidden] = useState(true);

  useEffect(() => {
    const { levels = [] } =
      (stages || []).find(({ id }) => id === stageId) || {};
    const { steps = [] } = levels.find(({ id }) => id === levelId) || {};
    const { title: stepTitle } = steps.find(({ id }) => id === stepId) || {};
    setTitle(stepTitle);
  }, [stageId, levelId, stepId, stages]);

  const updateTitleHandler = (newTitle) => {
    if (newTitle === title) return;
    dispatch({
      type: FLOW_DISPATCH_TYPES.UPDATED,
      component: FLOW_DISPATCH_COMPONENTS.STEP,
      componentIds: { stageId, levelId, stepId },
      updates: { title: newTitle },
      saveFlow,
    });
  };

  const deleteStepHandler = () =>
    dispatch({
      type: FLOW_DISPATCH_TYPES.DELETED,
      component: FLOW_DISPATCH_COMPONENTS.STEP,
      componentIds: { stageId, levelId, stepId },
      saveFlow,
    });

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
        <EditInPlace value={title} setValue={updateTitleHandler} />
      </HeadingText>
      <span className="delete-btn" onClick={() => setDeleteModalHidden(false)}>
        <Icon type={Icon.TYPE.INTERFACE__OPERATIONS__CLOSE} />
      </span>
      <DeleteConfirmModal
        name={title}
        type="step"
        hidden={deleteModalHidden}
        onConfirm={deleteStepHandler}
        onClose={() => setDeleteModalHidden(true)}
      />
    </div>
  ) : (
    <div
      className="step-header"
      onClick={(evt) => {
        if (mode === MODES.INLINE) {
          evt.stopPropagation();
          handleStepHeaderClick();
        }
      }}
    >
      <HeadingText type={HeadingText.TYPE.HEADING_6} className="title">
        {title}
      </HeadingText>
    </div>
  );
};

StepHeader.propTypes = {
  stageId: PropTypes.string,
  levelId: PropTypes.string,
  stepId: PropTypes.string,
  onDragHandle: PropTypes.func,
  mode: PropTypes.oneOf(Object.values(MODES)),
  saveFlow: PropTypes.func,
  handleStepHeaderClick: PropTypes.func,
};

export default StepHeader;
