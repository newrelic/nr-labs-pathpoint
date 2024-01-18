import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { AccountPicker, Button, Dropdown, DropdownItem } from 'nr1';
import { FilterBar } from '@newrelic/nr-labs-components';

import { SIGNAL_TYPES } from '../../src/constants';

const Filters = ({
  currentTab,
  accountId,
  entityTypeTitle,
  entityTypes,
  onAccountChange,
  onEntityTypeChange,
}) => {
  const [entitySearchText, setEntitySearchText] = useState('');

  const filteredEntityTypes = useMemo(() => {
    if (!entitySearchText.trim()) return entityTypes;
    const est = entitySearchText.toLocaleUpperCase();
    return entityTypes.filter(
      ({ domain, type }) => domain.includes(est) || type.includes(est)
    );
  }, [entityTypes, entitySearchText]);

  const entityTypeChangeHandler = useCallback((e) => {
    setEntitySearchText('');
    if (onEntityTypeChange) onEntityTypeChange(e);
  }, []);

  return (
    <div className="filters">
      <AccountPicker value={accountId} onChange={onAccountChange} />
      {currentTab === SIGNAL_TYPES.ENTITY ? (
        <Dropdown
          title={entityTypeTitle}
          items={filteredEntityTypes}
          search={entitySearchText}
          onSearch={({ target: { value } = {} } = {}) =>
            setEntitySearchText(value)
          }
        >
          {({ item }) => (
            <DropdownItem
              key={`${item.domain}_${item.type}`}
              onClick={() => entityTypeChangeHandler(item)}
            >
              {`${item.domain}/${item.type} (${item.count})`}
            </DropdownItem>
          )}
        </Dropdown>
      ) : null}
      <FilterBar options={[]} />
      <Button
        className="add-filter-btn"
        type={Button.TYPE.PRIMARY}
        disabled={true}
        iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS}
      >
        Add this filter
      </Button>
    </div>
  );
};

Filters.propTypes = {
  currentTab: PropTypes.string,
  accountId: PropTypes.any,
  entityTypeTitle: PropTypes.string,
  entityTypes: PropTypes.array,
  onAccountChange: PropTypes.func,
  onEntityTypeChange: PropTypes.func,
};

export default Filters;
