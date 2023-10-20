import React, { memo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { Button } from 'nr1';
import { StatusIconsLayout } from '@newrelic/nr-labs-components';

import Signal from '../signal';
import StepHeader from './header';
import EditStepModal from '../edit-step-modal';
import DeleteConfirmModal from '../delete-confirm-modal';
import { MODES, STATUSES, SIGNAL_EXPAND } from '../../constants';

const Step = ({
  title = 'Step',
  signals = [],
  stageName,
  level,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  status = STATUSES.UNKNOWN,
  mode = MODES.INLINE,
  showSignalDetail = () => null,
  signalExpandOption = SIGNAL_EXPAND.NONE,
}) => {
  const [editModalHidden, setEditModalHidden] = useState(true);
  const [deleteModalHidden, setDeleteModalHidden] = useState(true);
  const [signalsListView, setSignalsListView] = useState(
    [STATUSES.CRITICAL, STATUSES.WARNING].includes(status)
  );
  const signalToDelete = useRef({});
  const isDragHandleClicked = useRef(false);

  const addSignalsHandler = (guids) => {
    if (onUpdate)
      onUpdate({
        signals: guids.map((guid) => ({
          guid,
          type: 'service_level',
        })),
      });
  };

  const openDeleteModalHandler = (index, name) => {
    signalToDelete.current = { index, name };
    setDeleteModalHidden(false);
  };

  const deleteSignalHandler = () => {
    if (onUpdate) {
      const { index } = signalToDelete.current;
      onUpdate({
        signals: signals.filter((_, i) => i !== index),
      });
      signalToDelete.current = {};
    }
  };

  const closeDeleteModalHandler = () => {
    signalToDelete.current = {};
    setDeleteModalHidden(true);
  };

  const dragHandleHandler = (b) => (isDragHandleClicked.current = b);

  const dragStartHandler = (e) => {
    if (isDragHandleClicked.current) {
      if (onDragStart) onDragStart(e);
    } else {
      e.preventDefault();
    }
  };

  const onDropHandler = (e) => {
    if (onDrop) onDrop(e);
    isDragHandleClicked.current = false;
  };

  const dragEndHandler = () => {
    isDragHandleClicked.current = false;
  };

  const SignalsGrid = memo(
    () => (
      <StatusIconsLayout
        statuses={signals.map(({ status = STATUSES.UNKNOWN } = {}) => ({
          status,
        }))}
      />
    ),
    [signals, mode, signalExpandOption]
  );
  SignalsGrid.displayName = 'SignalsGrid';

  const SignalsList = memo(() => {
    return signals.map(({ name, status, guid, selected }, i) => (
      <Signal
        key={guid}
        name={name}
        onDelete={() => openDeleteModalHandler(i, name)}
        status={status}
        mode={mode}
        guid={guid}
        showSignalDetail={showSignalDetail}
        selected={selected}
      />
    ));
  }, [signals, mode, signalExpandOption]);
  SignalsList.displayName = 'SignalsList';

  return (
    <div
      className={`step ${status}`}
      draggable={mode === MODES.EDIT}
      onDragStart={dragStartHandler}
      onDragOver={onDragOver}
      onDrop={onDropHandler}
      onDragEnd={dragEndHandler}
      onClick={() => {
        if (
          signals.length &&
          [STATUSES.CRITICAL, STATUSES.WARNING].includes(status)
        )
          setSignalsListView(!signalsListView);
      }}
    >
      <StepHeader
        title={title}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDragHandle={dragHandleHandler}
        mode={mode}
      />
      {mode === MODES.EDIT ? (
        <>
          <div className="add-signal-btn">
            <Button
              type={Button.TYPE.SECONDARY}
              sizeType={Button.SIZE_TYPE.SMALL}
              iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE}
              onClick={() => setEditModalHidden(false)}
            >
              Add a signal
            </Button>
          </div>
          <div className="edit-signals-list">
            <SignalsList />
          </div>
          <EditStepModal
            stageName={stageName}
            level={level}
            stepTitle={title}
            existingSignals={signals.map(({ guid }) => guid)}
            hidden={editModalHidden}
            onChange={addSignalsHandler}
            onClose={() => setEditModalHidden(true)}
          />
          <DeleteConfirmModal
            name={signalToDelete.current.name}
            hidden={deleteModalHidden}
            onConfirm={deleteSignalHandler}
            onClose={closeDeleteModalHandler}
          />
        </>
      ) : mode === MODES.INLINE ? (
        <div className="signals">
          {Boolean(signalExpandOption & SIGNAL_EXPAND.ALL) ||
          signalsListView ? (
            <SignalsList />
          ) : (
            <SignalsGrid />
          )}
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

Step.propTypes = {
  title: PropTypes.string,
  signals: PropTypes.arrayOf(PropTypes.object),
  stageName: PropTypes.string,
  level: PropTypes.string,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  status: PropTypes.oneOf(Object.values(STATUSES)),
  mode: PropTypes.oneOf(Object.values(MODES)),
  showSignalDetail: PropTypes.func,
  signalExpandOption: PropTypes.number,
};

export default Step;
