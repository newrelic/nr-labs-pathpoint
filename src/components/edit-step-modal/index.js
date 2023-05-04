import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  BlockText,
  Button,
  Checkbox,
  CheckboxGroup,
  HeadingText,
  Icon,
  Modal,
  TextField,
} from 'nr1';
import { useServiceLevelsSearch } from '../../hooks';
import { isMatchPattern } from '../../utils/regex';

const EditStepModal = ({
  accountId,
  stageName = 'Stage',
  stepGroup = 0,
  stepName = 'Step',
  existingSignals = [],
  onChange,
}) => {
  const [selectedSignals, setSelectedSignals] = useState([]);
  const [hidden, setHidden] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { serviceLevels, refetchServiceLevels } = useServiceLevelsSearch({
    accountId,
  });
  const [serviceLevelsLookup, setServiceLevelsLookup] = useState({});

  useEffect(() => setSelectedSignals(existingSignals), []);

  useEffect(
    () =>
      setServiceLevelsLookup(
        serviceLevels.reduce(
          (acc, { guid, name }) => ({ ...acc, [guid]: name }),
          {}
        )
      ),
    [serviceLevels]
  );

  const closeHandler = useCallback(() => {
    setHidden(true);
  }, []);

  return (
    <Modal hidden={hidden} onClose={closeHandler}>
      <div className="edit-step-modal">
        <div className="signals-picker">
          <div className="heading">
            <HeadingText type={HeadingText.TYPE.HEADING_3}>
              {stageName}:
            </HeadingText>
            <HeadingText
              type={HeadingText.TYPE.HEADING_5}
              className="step-group"
            >
              {stepGroup}
            </HeadingText>
            <HeadingText type={HeadingText.TYPE.HEADING_3}>
              {stepName}
            </HeadingText>
          </div>

          <div className="search-bar">
            <TextField
              className="search-input"
              type={TextField.TYPE.SEARCH}
              placeholder="Search by service level name or attribute"
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
            />
          </div>

          <div className="signals-list">
            <CheckboxGroup>
              {serviceLevels.map(({ guid, name }) =>
                isMatchPattern(searchText, name) ? (
                  <Checkbox
                    key={guid}
                    label={name}
                    checked={selectedSignals.includes(guid)}
                    onChange={() => {
                      if (selectedSignals.includes(guid)) {
                        setSelectedSignals(
                          selectedSignals.filter((id) => id !== guid)
                        );
                      } else {
                        setSelectedSignals([...selectedSignals, guid]);
                      }
                    }}
                  />
                ) : null
              )}
            </CheckboxGroup>
          </div>

          <div className="footer-buttons">
            <Button
              onClick={() =>
                window.open(
                  'https://one.newrelic.com/service-levels-management/sli-edit',
                  '_blank',
                  'noreferrer'
                )
              }
            >
              Create signal
            </Button>
            <Button
              type={Button.TYPE.PLAIN}
              iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__REFRESH}
              onClick={() =>
                refetchServiceLevels ? refetchServiceLevels() : null
              }
            />
          </div>
        </div>

        <div className="signals-selections">
          <div className="header-bar">
            <HeadingText type={HeadingText.TYPE.HEADING_4}>
              Selected signals
            </HeadingText>
            <BlockText className="muted">
              {selectedSignals.length} signals selected
            </BlockText>
          </div>
          <div className="selections-list">
            {selectedSignals.map((guid) => (
              <div className="selection" key={guid}>
                <span className="name">{serviceLevelsLookup[guid]}</span>
                <span
                  className="remove"
                  onClick={() =>
                    setSelectedSignals(
                      selectedSignals.filter((id) => id !== guid)
                    )
                  }
                >
                  <Icon type={Icon.TYPE.INTERFACE__OPERATIONS__CLOSE__SIZE_8} />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="footer-buttons">
          <Button onClick={() => (onChange ? onChange(selectedSignals) : null)}>
            Add signal(s)
          </Button>
        </div>
      </div>
    </Modal>
  );
};

EditStepModal.propTypes = {
  accountId: PropTypes.number,
  stageName: PropTypes.string,
  stepGroup: PropTypes.number,
  stepName: PropTypes.string,
  existingSignals: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
};

export default EditStepModal;
