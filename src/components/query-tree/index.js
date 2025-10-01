import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'nr1';

import { Signal } from '../';
import { STATUSES } from '../../constants';

const QueryTree = ({ query = '', results = [], type, onDelete, onEdit }) => {
  const [queryComponents, setQueryComponents] = useState([]);

  useEffect(
    () =>
      setQueryComponents(() =>
        query.split(/( AND | OR )/).map((s, i) =>
          s === ' AND ' || s === ' OR ' ? (
            <div key={i} className="query-tree-query-conjunction">
              {s.trim()}
            </div>
          ) : (
            <div key={i} className="query-tree-query-component">
              {s}
            </div>
          )
        )
      ),
    [query]
  );

  if (!query) return null;

  return (
    <>
      <div className="query-tree-query">
        <Icon
          color="#E8E8E8"
          type={Icon.TYPE.INTERFACE__CARET__CARET_BOTTOM__WEIGHT_BOLD__SIZE_8}
        />
        <span className="query-tree-query-components">{queryComponents}</span>
        <div className="query-tree-query-actions">
          {onEdit ? (
            <span className="query-tree-query-action" onClick={onEdit}>
              <Icon type={Icon.TYPE.INTERFACE__OPERATIONS__EDIT} />
            </span>
          ) : null}
          {onDelete ? (
            <span className="query-tree-query-action" onClick={onDelete}>
              <Icon type={Icon.TYPE.INTERFACE__OPERATIONS__CLOSE} />
            </span>
          ) : null}
        </div>
      </div>
      {results.map(({ guid, name }) => (
        <div className="query-tree-list-item" key={guid}>
          <Signal
            name={name}
            guid={guid}
            status={STATUSES.UNKNOWN}
            type={type}
            hasTooltip
          />
        </div>
      ))}
    </>
  );
};

QueryTree.propTypes = {
  query: PropTypes.string,
  results: PropTypes.array,
  type: PropTypes.string,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
};

export default QueryTree;
