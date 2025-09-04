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

import { ALERTS_DOMAIN_TYPE_NRQL } from '../../../src/constants';

const AlertsDataTable = ({
  dynamicAlerts = [],
  entitySearchFilter = '',
  onSelectionChangeHandler,
  onUpdateTags,
  policies = [],
  selection = {},
  setEntities,
}) => {
  const {
    data: { count = 0, entities = [] } = {},
    error,
    fetchMore,
  } = useEntitySearchQuery({
    filters: `${ALERTS_DOMAIN_TYPE_NRQL} AND ${entitySearchFilter}`,
    includeTags: true,
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching entities:', error);
    }
  }, [error]);

  useEffect(() => setEntities(entities), [entities, setEntities]);

  useEffect(() => onUpdateTags?.(entities), [entities, onUpdateTags]);

  const getIsRowSelectable = useCallback(
    ({ item: { guid } = {} }) => !dynamicAlerts.some((de) => de.guid === guid),
    [dynamicAlerts]
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
            ariaLabel="Alerts"
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
              <DataTableHeaderCell name="condition" value="name">
                Condition
              </DataTableHeaderCell>
              <DataTableHeaderCell name="policy" value="tags">
                Policy
              </DataTableHeaderCell>
            </DataTableHeader>
            <DataTableBody>
              {() => (
                <DataTableRow>
                  <DataTableRowCell />
                  <DataTableRowCell>
                    {(tags) => {
                      const policyId = tags.find(
                        ({ key }) => key === 'policyId'
                      )?.values?.[0];
                      return policies[policyId] || '';
                    }}
                  </DataTableRowCell>
                </DataTableRow>
              )}
            </DataTableBody>
          </DataTable>
        )}
      </AutoSizer>
    </div>
  );
};

AlertsDataTable.propTypes = {
  dynamicAlerts: PropTypes.arrayOf(PropTypes.object),
  entitySearchFilter: PropTypes.string,
  onSelectionChangeHandler: PropTypes.func,
  onUpdateTags: PropTypes.func,
  policies: PropTypes.object,
  selection: PropTypes.object,
  setEntities: PropTypes.func,
};

export default AlertsDataTable;
