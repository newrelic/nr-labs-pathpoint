import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { BlockText, Button, HeadingText, Icon, Switch, TextField } from 'nr1';

import Modal from '../modal';
import { AppContext } from '../../contexts';
import { validRefreshInterval } from '../../utils';
import { REFRESH_INTERVALS, UI_CONTENT } from '../../constants';

const ACCESS_LEVELS = [
  { value: 0, label: 'Private' },
  { value: 1, label: 'Read-only' },
  { value: 2, label: 'Privileged' },
  { value: 3, label: 'Public' },
];

const DEFAULT_REFRESH_INTERVAL_VALUE = REFRESH_INTERVALS[0].value;

const DEFAULT_ACCESS_LEVEL_VALUE = ACCESS_LEVELS.at(-1).value;

const EditFlowSettingsModal = ({
  flow,
  onUpdate,
  onDeleteFlow,
  editFlowSettings = false,
  setEditFlowSettings,
}) => {
  const { account } = useContext(AppContext);
  const [updatedName, setupdatedName] = useState('');
  const [updatedRefreshInterval, setupdatedRefreshInterval] = useState(
    DEFAULT_REFRESH_INTERVAL_VALUE
  );
  const [updatedStepRowOverride, setUpdatedStepRowOverride] = useState(false);
  const [updatedAccessLevel] = useState(DEFAULT_ACCESS_LEVEL_VALUE);

  useEffect(() => {
    if (!flow) return;
    const {
      name: flowName = '',
      refreshInterval: flowRefreshInterval,
      stepRowOverride,
    } = flow;
    setupdatedName(flowName);
    setupdatedRefreshInterval(validRefreshInterval(flowRefreshInterval));
    setUpdatedStepRowOverride(stepRowOverride || false);
  }, [flow]);

  const closeHandler = (action) => {
    switch (action) {
      case 'update':
        if (
          (updatedName !== flow?.name ||
            updatedRefreshInterval !== flow?.refreshInterval ||
            updatedStepRowOverride !== flow?.stepRowOverride ||
            updatedAccessLevel !== flow?.accessLevel) &&
          onUpdate
        ) {
          onUpdate({
            name: updatedName,
            refreshInterval: Number(updatedRefreshInterval),
            stepRowOverride: updatedStepRowOverride,
            accessLevel: Number(updatedAccessLevel),
          });
        }
        break;

      case 'delete':
        onDeleteFlow?.();
    }

    setEditFlowSettings?.(false);
  };

  return (
    <Modal hidden={!editFlowSettings} onClose={closeHandler}>
      <div>
        <HeadingText type={HeadingText.TYPE.HEADING_1}>Settings</HeadingText>
        <div className="entry-form">
          <div>
            <TextField
              className="flow-name"
              label="Flow name"
              value={updatedName}
              onChange={(e) => setupdatedName(e?.target?.value)}
            />
          </div>
          <div>
            <label>Created by</label>
            <BlockText className="attribute">
              {flow.created.user.email}
            </BlockText>
          </div>
          <div>
            <label>Account</label>
            <BlockText className="attribute">{`${account.id || ''} - ${
              account.name || ''
            }`}</BlockText>
          </div>
          <div>
            <label>Flow ID</label>
            <BlockText className="attribute">{flow.id || 'unknown'}</BlockText>
          </div>
          <div>
            <label htmlFor="refresh-interval-select">Refresh data every</label>
            <div>
              <select
                className="refresh-interval"
                id="refresh-interval-select"
                value={updatedRefreshInterval}
                onChange={(e) =>
                  setupdatedRefreshInterval(
                    e?.target?.value || DEFAULT_REFRESH_INTERVAL_VALUE
                  )
                }
              >
                {REFRESH_INTERVALS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="access-level-select">Access</label>
            <div>
              <select
                className="access-level"
                id="access-level-select"
                value={updatedAccessLevel}
                onChange={(e) =>
                  setupdatedRefreshInterval(
                    e?.target?.value || DEFAULT_ACCESS_LEVEL_VALUE
                  )
                }
              >
                {ACCESS_LEVELS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Switch
              className="step-row-override"
              checked={updatedStepRowOverride}
              label={UI_CONTENT.FLOW.SETTINGS.STEP_ROW_OVERRIDE_TITLE}
              onChange={() =>
                setUpdatedStepRowOverride((prevStepOption) => !prevStepOption)
              }
            />
            <div
              className="info-icon-container"
              title={UI_CONTENT.FLOW.SETTINGS.STEP_ROW_OVERRIDE_TOOLTIP}
            >
              <Icon
                className="step-row-override-info-icon"
                type={Icon.TYPE.INTERFACE__INFO__INFO}
              />
            </div>
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
  onUpdate: PropTypes.func,
  onDeleteFlow: PropTypes.func,
  editFlowSettings: PropTypes.bool,
  setEditFlowSettings: PropTypes.func,
};

export default EditFlowSettingsModal;
