import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import {
  AutoSizer,
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableRow,
  DataTableRowCell,
  useEntitySearchQuery,
} from 'nr1';

import { SKIP_ENTITY_TYPES_NRQL } from '../../../src/constants';

const EntitiesDataTable = ({
  dynamicEntities = [],
  entitySearchFilter = '',
  onSelectionChangeHandler,
  onUpdateTags,
  selection = {},
  setEntities,
}) => {
  const {
    data: { count = 0, entities = [] } = {},
    error,
    fetchMore,
  } = useEntitySearchQuery({
    filters: `${SKIP_ENTITY_TYPES_NRQL} AND ${entitySearchFilter}`,
    includeTags: true,
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching entities:', error);
    }
  }, [error]);

  useEffect(() => setEntities?.(entities), [entities, setEntities]);

  useEffect(() => onUpdateTags?.(entities), [entities, onUpdateTags]);

  const getIsRowSelectable = useCallback(
    ({ item: { guid } = {} }) =>
      !dynamicEntities.some((de) => de.guid === guid),
    [dynamicEntities]
  );

  const changeHandler = useCallback(
    (changedSel) => onSelectionChangeHandler(changedSel, entities),
    [entities]
  );

  return (
    <div className="data-table">
      <AutoSizer>
        {({ height }) => (
          <DataTable
            ariaLabel="Entities"
            items={entities}
            itemCount={count}
            onLoadMoreItems={fetchMore}
            height={height}
            getIsRowSelectable={getIsRowSelectable}
            selectionType={DataTable.SELECTION_TYPE.MULTIPLE}
            selection={selection}
            onSelectionChange={changeHandler}
          >
            <DataTableHeader>
              <DataTableHeaderCell name="name" value="name">
                Name
              </DataTableHeaderCell>
              <DataTableHeaderCell name="domain" value="domain">
                Domain
              </DataTableHeaderCell>
              <DataTableHeaderCell name="type" value="type">
                Type
              </DataTableHeaderCell>
            </DataTableHeader>
            <DataTableBody>
              {() => (
                <DataTableRow>
                  <DataTableRowCell />
                  <DataTableRowCell />
                  <DataTableRowCell />
                </DataTableRow>
              )}
            </DataTableBody>
          </DataTable>
        )}
      </AutoSizer>
    </div>
  );
};

EntitiesDataTable.propTypes = {
  dynamicEntities: PropTypes.arrayOf(PropTypes.object),
  entitySearchFilter: PropTypes.string,
  onSelectionChangeHandler: PropTypes.func,
  onUpdateTags: PropTypes.func,
  selection: PropTypes.object,
  setEntities: PropTypes.func,
};

export default EntitiesDataTable;
