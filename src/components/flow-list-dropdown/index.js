import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { Dropdown, DropdownItem } from 'nr1';

const FlowListDropdown = ({ flows = [], onSelect = () => null }) => {
  const [searchPattern, setSearchPattern] = useState('');

  const items = useMemo(() => {
    return flows.map((f) => {
      return {
        id: f.id,
        name: f.document.name,
      };
    });
  }, [flows]);

  const filteredItems = useCallback(() => {
    return items.filter(({ name }) =>
      name.toLowerCase().includes(searchPattern.toLowerCase())
    );
  }, [items, searchPattern]);

  return (
    <Dropdown
      title="Select a Flow"
      items={filteredItems()}
      search={searchPattern}
      onSearch={(evt) => setSearchPattern(evt.target.value)}
    >
      {({ item }) => (
        <DropdownItem key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </DropdownItem>
      )}
    </Dropdown>
  );
};

FlowListDropdown.propTypes = {
  flows: PropTypes.array,
  onSelect: PropTypes.func,
};

export default FlowListDropdown;
