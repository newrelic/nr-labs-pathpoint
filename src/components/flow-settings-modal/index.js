import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  BlockText,
  Button,
  HeadingText,
  Modal,
  Select,
  SelectItem,
  TextField,
} from 'nr1';

import { REFRESH_INTERVALS } from '../../constants';

const EditFlowSettingsModal = ({
  flow = {},
  accountName = '',
  onUpdate = () => null,
  onDeleteFlow = () => null,
  editFlowSettings = false,
  setEditFlowSettings = () => null,
}) => {
  const [updatedRefreshInterval, setupdatedRefreshInterval] = useState(
    flow?.refreshInterval?.toString() || REFRESH_INTERVALS[0].value
  );
  const [updatedName, setupdatedName] = useState(flow.name || '');

  const closeHandler = (action) => {
    switch (action) {
      case 'update':
        if (
          (updatedName !== flow?.name ||
            flow?.refreshInterval !== updatedRefreshInterval) &&
          onUpdate
        ) {
          onUpdate({
            name: updatedName,
            refreshInterval: Number(updatedRefreshInterval),
          });
        }
        break;

      case 'delete':
        onDeleteFlow();
    }

    setEditFlowSettings(false);
  };

  const handleChange = (event, value) =>
    value
      ? setupdatedRefreshInterval(value)
      : setupdatedName(event?.target?.value);

  return (
    <Modal hidden={!editFlowSettings} onClose={closeHandler}>
      <div>
        <HeadingText type={HeadingText.TYPE.HEADING_1}>Settings</HeadingText>
        <div className="entry-form">
          <div>
            <TextField
              className="flow-name"
              label="Flow name"
              defaultValue={flow.name}
              onChange={(event) => handleChange(event)}
            />
          </div>
          <div>
            <label>Created by</label>
            <BlockText className="attribute">
              {flow.created.user.email}
            </BlockText>
          </div>
          <div>
            <label>Account name</label>
            <BlockText className="attribute">{accountName}</BlockText>
          </div>
          <div>
            <Select
              className="refresh-interval"
              label="Refresh data every"
              onChange={handleChange}
              value={updatedRefreshInterval}
            >
              {REFRESH_INTERVALS.map((item, index) => (
                <SelectItem key={index} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
        <div className="buttons-bar">
          <Button
            type={Button.TYPE.DESTRUCTIVE}
            onClick={() => closeHandler('delete')}
          >
            Delete
          </Button>
          <div className="right">
            <Button onClick={() => closeHandler('cancel')}> Cancel </Button>
            <Button
              type={Button.TYPE.PRIMARY}
              onClick={() => closeHandler('update')}
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

EditFlowSettingsModal.propTypes = {
  flow: PropTypes.object,
  accountName: PropTypes.string,
  onUpdate: PropTypes.func,
  onDeleteFlow: PropTypes.func,
  editFlowSettings: PropTypes.bool,
  setEditFlowSettings: PropTypes.func,
};

export default EditFlowSettingsModal;
