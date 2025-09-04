import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { Popover, PopoverBody, PopoverTrigger, TextField } from 'nr1';

const ListSelect = ({ label, list = [], clear = {}, onChange }) => {
  const [searchText, setSearchText] = useState('');
  const [isClear, setIsClear] = useState(true);
  const [clearText, setClearText] = useState({
    title: '',
    subtitle: '',
  });

  useEffect(
    () =>
      setClearText(() => ({
        title: clear?.title || '',
        subtitle: clear?.subtitle || '',
      })),
    [clear]
  );

  useEffect(() => {
    if (!list.length) return;
    setIsClear(() => !list.some(({ isSelected }) => isSelected));
  }, [list]);

  const clearCheckHandler = useCallback(
    (checked) => {
      if (checked)
        onChange?.(list.map((item) => ({ ...item, isSelected: false })));
      setIsClear(checked);
    },
    [list, onChange]
  );

  const changeHandler = useCallback(
    ({ id, checked }) => {
      if (!onChange) return;
      onChange((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                isSelected: checked,
              }
            : item
        )
      );
    },
    [onChange]
  );

  const displayedList = useMemo(() => {
    const lowerCaseSearchText = String(searchText).trim().toLocaleLowerCase();
    if (!lowerCaseSearchText) return list;
    return list.filter(({ title }) =>
      title.toLocaleLowerCase().includes(lowerCaseSearchText)
    );
  }, [list, searchText]);

  return (
    <Popover>
      <PopoverTrigger>
        <div className="list-select-label">{label}</div>
      </PopoverTrigger>
      <PopoverBody>
        <div className="list-select-body">
          <div className="list-select-search">
            <TextField
              type={TextField.TYPE.SEARCH}
              className="list-select-search-input"
              name="search"
              placeholder="Search..."
              value={searchText}
              onChange={({ target: { value } = {} }) => setSearchText(value)}
            />
          </div>
          <hr className="list-select-rule" />
          <ul className="list-select-list">
            {clearText.title ? (
              <>
                <li className="list-select-item">
                  <label className="list-select-item-label">
                    <input
                      type="checkbox"
                      checked={isClear}
                      onChange={() => !isClear && clearCheckHandler(true)}
                      name={clearText.title}
                    />
                    <span
                      className="list-select-item-title"
                      title={clearText.title}
                    >
                      {clearText.title}
                    </span>
                  </label>
                  {clearText.subtitle ? (
                    <span className="list-select-item-subtitle">
                      {clearText.subtitle}
                    </span>
                  ) : null}
                </li>
                <hr className="list-select-rule" />
              </>
            ) : null}
            <div className="list-select-spacer" />
            {displayedList.map(({ id, isSelected, subtitle, title }) => (
              <li key={id} className="list-select-item">
                <label className="list-select-item-label">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => changeHandler({ id, checked: !isSelected })}
                    name={title}
                  />
                  <span className="list-select-item-title" title={title}>
                    {title}
                  </span>
                </label>
                {subtitle ? (
                  <span className="list-select-item-subtitle">{subtitle}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </PopoverBody>
    </Popover>
  );
};

ListSelect.propTypes = {
  label: PropTypes.node,
  list: PropTypes.array,
  clear: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
  }),
  onChange: PropTypes.func,
};

export default ListSelect;
