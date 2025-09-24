import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Checkbox,
  HeadingText,
  Icon,
  InlineMessage,
  RadioGroup,
  Radio,
  Select,
  SelectItem,
  Switch,
  TextField,
} from 'nr1';

import Modal from '../modal';
import SignalStatusSelectionTable from './signal-status-selection-table';
import {
  STEP_STATUS_OPTIONS,
  STEP_STATUS_UNITS,
  UI_CONTENT,
} from '../../constants';

const NUM_ONLY_RE = /^[0-9\b]+$/;

const StepSettingsModal = ({
  title,
  signals,
  queries,
  link,
  excluded,
  config,
  hidden = true,
  onChange,
  onDelete,
  onClose,
}) => {
  const [isModalHidden, setIsModalHidden] = useState(true);
  const [url, setUrl] = useState('');
  const [hasWorstStatusArgs, setHasWorstStatusArgs] = useState(false);
  const [statusOption, setStatusOption] = useState(STEP_STATUS_OPTIONS.WORST);
  const [statusWeightUnit, setStatusWeightUnit] = useState(
    STEP_STATUS_UNITS.PERCENT
  );
  const [statusWeightValue, setStatusWeightValue] = useState('');
  const [isWeightValInvalid, setIsWeightValInvalid] = useState(false);
  const [isExcluded, setIsExcluded] = useState(false);
  const [stepSignals, setStepSignals] = useState([]);
  const [stepQueries, setStepQueries] = useState([]);

  useEffect(() => setIsModalHidden(hidden), [hidden]);

  const modalShowEndHandler = () => {
    setUrl(link);
    setIsExcluded(excluded || false);
    configSetup(config);
    stepSignalsSetup(signals);
    setStepQueries(() =>
      (queries || []).map((q) => ({
        ...q,
        included: q.included === undefined ? true : q.included,
      }))
    );
  };

  const stepSignalsSetup = useCallback(
    (sigs) =>
      setStepSignals(() =>
        (sigs || []).map((s) =>
          s.included === undefined ? { ...s, included: true } : s
        )
      ),
    []
  );

  const configSetup = useCallback(
    ({ status: { option, weight: { unit, value } = {} } = {} } = {}) => {
      setStatusOption(option || STEP_STATUS_OPTIONS.WORST);
      setStatusWeightUnit(unit || STEP_STATUS_UNITS.PERCENT);
      setStatusWeightValue(value || '');
      if (value) setHasWorstStatusArgs(true);
    },
    []
  );

  const saveHandler = useCallback(() => {
    onChange?.({
      signals: stepSignals.map((s) => ({ ...s, included: !!s.included })),
      queries: stepQueries,
      link: url?.trim(),
      excluded: isExcluded,
      config: {
        status: {
          option: statusOption,
          weight:
            statusOption === STEP_STATUS_OPTIONS.WORST && hasWorstStatusArgs
              ? {
                  unit: statusWeightUnit,
                  value: statusWeightValue,
                }
              : {
                  unit: STEP_STATUS_UNITS.PERCENT,
                  value: '',
                },
        },
      },
    });
    onClose?.();
  }, [
    onChange,
    onClose,
    url,
    isExcluded,
    stepSignals,
    stepQueries,
    statusOption,
    statusWeightUnit,
    statusWeightValue,
    hasWorstStatusArgs,
  ]);

  const statusOptionChangeHandler = useCallback((_, value) => {
    if (value === STEP_STATUS_OPTIONS.BEST) {
      setStatusWeightUnit(STEP_STATUS_UNITS.PERCENT);
      setStatusWeightValue('');
      setHasWorstStatusArgs(false);
    }
    setStatusOption(value);
  }, []);

  const statusWeightValueHandler = useCallback(
    ({ target: { value = '' } = {} } = {}) => {
      if (value === '' || NUM_ONLY_RE.test(value)) {
        setStatusWeightValue(value);
        setIsWeightValInvalid(false);
      } else {
        setIsWeightValInvalid(true);
      }
    },
    []
  );

  const isWorstStatusArgsDisabled = useMemo(
    () => !hasWorstStatusArgs,
    [hasWorstStatusArgs]
  );

  return (
    <Modal
      hidden={isModalHidden}
      onClose={onClose}
      onShow={modalShowEndHandler}
    >
      <div className="step-settings-modal">
        <div className="modal-heading">
          <HeadingText type={HeadingText.TYPE.HEADING_1}>
            {UI_CONTENT.STEP.CONFIG.TITLE}
          </HeadingText>
          <HeadingText type={HeadingText.TYPE.HEADING_3}>{title}</HeadingText>
        </div>
        <div className="step-settings-form">
          <div className="step-settings-section">
            <HeadingText type={HeadingText.TYPE.HEADING_4}>
              Step Link
            </HeadingText>
            <TextField
              type={TextField.TYPE.URL}
              description={UI_CONTENT.STEP.CONFIG.LINK.DESCRIPTION}
              placeholder={UI_CONTENT.STEP.CONFIG.LINK.PLACEHOLDER}
              value={url || ''}
              onChange={({ target: { value = '' } = {} } = {}) => setUrl(value)}
            />
          </div>
          <div className="step-settings-section">
            <HeadingText type={HeadingText.TYPE.HEADING_4}>
              {UI_CONTENT.STEP.CONFIG.STATUS_CONFIG.TITLE}
            </HeadingText>
            <div className="step-settings-section">
              <div className="step-exclude-container">
                <Checkbox
                  className="step-exclude-option"
                  checked={isExcluded}
                  onChange={() =>
                    setIsExcluded((prevExcluded) => !prevExcluded)
                  }
                  label={UI_CONTENT.STEP.CONFIG.EXCLUSION.LABEL}
                />
                <div
                  className="step-info-icon-container"
                  title={UI_CONTENT.STEP.CONFIG.EXCLUSION.DESCRIPTION}
                >
                  <Icon
                    className="info-icon"
                    type={Icon.TYPE.INTERFACE__INFO__INFO}
                  />
                </div>
              </div>
            </div>
            <span>{UI_CONTENT.STEP.CONFIG.STATUS_CONFIG.DESCRIPTION}</span>
            <RadioGroup
              className="step-settings-options"
              value={statusOption}
              onChange={statusOptionChangeHandler}
            >
              <Radio
                className="step-settings-option"
                label={UI_CONTENT.STEP.CONFIG.STATUS_CONFIG.RADIO_WORST_LABEL}
                value={STEP_STATUS_OPTIONS.WORST}
              />
              <div
                className="step-info-icon-container"
                title={UI_CONTENT.STEP.CONFIG.TOOLTIPS.WORST}
              >
                <Icon
                  className="info-icon"
                  type={Icon.TYPE.INTERFACE__INFO__INFO}
                />
              </div>
              <div className="settings-worst-options">
                <Switch
                  disabled={statusOption === STEP_STATUS_OPTIONS.BEST}
                  checked={hasWorstStatusArgs}
                  label={UI_CONTENT.STEP.CONFIG.STATUS_CONFIG.APPLY_LABEL}
                  onChange={({ target: { checked = false } = {} } = {}) =>
                    setHasWorstStatusArgs(checked)
                  }
                />
                <TextField
                  className="settings-weight-value"
                  disabled={isWorstStatusArgsDisabled}
                  placeholder="1"
                  value={statusWeightValue}
                  invalid={isWeightValInvalid}
                  onChange={statusWeightValueHandler}
                />
                <Select
                  onChange={(_, val) => setStatusWeightUnit(val)}
                  value={statusWeightUnit}
                  disabled={isWorstStatusArgsDisabled}
                >
                  <SelectItem value={STEP_STATUS_UNITS.PERCENT}>
                    {UI_CONTENT.STEP.CONFIG.STATUS_CONFIG.SELECT.PERCENT}
                  </SelectItem>
                  <SelectItem value={STEP_STATUS_UNITS.COUNT}>
                    {UI_CONTENT.STEP.CONFIG.STATUS_CONFIG.SELECT.COUNT}
                  </SelectItem>
                </Select>
              </div>
              <div className="step-best-status-container">
                <Radio
                  className="step-settings-option"
                  label={UI_CONTENT.STEP.CONFIG.STATUS_CONFIG.RADIO_BEST_LABEL}
                  value={STEP_STATUS_OPTIONS.BEST}
                />
                <div
                  className="step-info-icon-container"
                  title={UI_CONTENT.STEP.CONFIG.TOOLTIPS.BEST}
                >
                  <Icon
                    className="info-icon"
                    type={Icon.TYPE.INTERFACE__INFO__INFO}
                  />
                </div>
              </div>
            </RadioGroup>
            <div className="step-settings-signals-settings">
              {queries?.length ? (
                <div className="step-settings-section">
                  <HeadingText type={HeadingText.TYPE.HEADING_5}>
                    {UI_CONTENT.STEP.CONFIG.SELECT_QUERIES.TITLE}
                  </HeadingText>
                  <span>
                    {UI_CONTENT.STEP.CONFIG.SELECT_QUERIES.DESCRIPTION}
                  </span>
                  {stepQueries.map(({ id, included, query }) => (
                    <Checkbox
                      key={id}
                      checked={included}
                      onChange={() =>
                        setStepQueries((sqs) =>
                          sqs.map((sq) =>
                            sq.id === id
                              ? {
                                  ...sq,
                                  included: !sq.included,
                                }
                              : sq
                          )
                        )
                      }
                      label={query}
                    />
                  ))}
                </div>
              ) : null}
              {signals?.length ? (
                <div className="step-settings-section">
                  <HeadingText type={HeadingText.TYPE.HEADING_5}>
                    {UI_CONTENT.STEP.CONFIG.SELECT_SIGNALS.TITLE}
                  </HeadingText>
                  <span>
                    {UI_CONTENT.STEP.CONFIG.SELECT_SIGNALS.DESCRIPTION}
                  </span>
                  <div className="signal-settings-table">
                    <SignalStatusSelectionTable
                      signals={stepSignals}
                      onChange={(selection) =>
                        setStepSignals((sigs) =>
                          sigs.map((s, i) => ({ ...s, included: selection[i] }))
                        )
                      }
                    />
                  </div>
                </div>
              ) : null}
              {!(signals?.length || queries?.length) ? (
                <InlineMessage
                  label={
                    UI_CONTENT.STEP.CONFIG.NO_QUERIES_OR_SIGNALS.DESCRIPTION
                  }
                />
              ) : null}
            </div>
          </div>
        </div>
        <div className="step-settings-button-bar">
          <Button variant={Button.VARIANT.DESTRUCTIVE} onClick={onDelete}>
            Delete
          </Button>
          <div className="right">
            <Button variant={Button.VARIANT.TERTIARY} onClick={onClose}>
              Cancel
            </Button>
            <Button variant={Button.VARIANT.PRIMARY} onClick={saveHandler}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

StepSettingsModal.propTypes = {
  title: PropTypes.string,
  excluded: PropTypes.bool,
  signals: PropTypes.array,
  queries: PropTypes.array,
  link: PropTypes.string,
  config: PropTypes.object,
  hidden: PropTypes.bool,
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
  onClose: PropTypes.func,
};

export default StepSettingsModal;
