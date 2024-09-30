import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import {
  AutoSizer,
  DataTable,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableBody,
  DataTableRow,
  DataTableRowCell,
  EmptyState,
} from 'nr1';
import { SIGNAL_TYPES, UI_CONTENT } from '../../src/constants';

const emptyState = (hasNoSignals) =>
  hasNoSignals ? (
    <EmptyState
      fullHeight
      fullWidth
      iconType={EmptyState.ICON_TYPE.INTERFACE__STATE__CRITICAL}
      title={UI_CONTENT.SIGNAL_SELECTION.SIGNALS_NOT_FOUND.TITLE}
      description={UI_CONTENT.SIGNAL_SELECTION.SIGNALS_NOT_FOUND.DESCRIPTION}
    />
  ) : (
    <EmptyState
      fullHeight
      fullWidth
      title={UI_CONTENT.SIGNAL_SELECTION.SIGNALS_LOADING}
      type={EmptyState.TYPE.LOADING}
    />
  );

const entitiesTableHeader = (
  <DataTableHeader>
    <DataTableHeaderCell name="name" value="name">
      Name
    </DataTableHeaderCell>
    <DataTableHeaderCell name="type" value="type">
      Entity type
    </DataTableHeaderCell>
  </DataTableHeader>
);

const alertsTableHeader = (
  <DataTableHeader>
    <DataTableHeaderCell name="condition" value="name">
      Condition
    </DataTableHeaderCell>
    <DataTableHeaderCell name="policy" value="policyName">
      Policy
    </DataTableHeaderCell>
  </DataTableHeader>
);

const ListingTable = ({
  type,
  entities = [],
  alerts = [],
  selectedEntities = [],
  selectedAlerts = [],
  rowCount,
  onLoadMore,
  onLoadMoreAlerts,
  onSelect,
  isLoading,
}) => {
  const [tableSettings, setTableSettings] = useState({});
  const [tableHeader, setTableHeader] = useState(null);
  const [selection, setSelection] = useState({});
  const selectionsSet = useRef();

  useEffect(() => {
    let selectedItems, sel;
    if (type === SIGNAL_TYPES.ENTITY) selectedItems = selectedEntities;
    if (type === SIGNAL_TYPES.ALERT) selectedItems = selectedAlerts;
    const selectionLookup = selectedItems.reduce(
      (acc, { guid }) => ({ ...acc, [guid]: true }),
      {}
    );
    const selectionReducer = (acc, { guid }, idx) =>
      selectionLookup[guid] ? { ...acc, [idx]: true } : acc;
    if (type === SIGNAL_TYPES.ENTITY) {
      sel = entities.reduce(selectionReducer, {});
      setTableSettings({
        ariaLabel: 'Entities',
        items: entities,
        itemCount: rowCount,
        onLoadMoreItems: onLoadMore,
      });
      setTableHeader(entitiesTableHeader);
    }
    if (type === SIGNAL_TYPES.ALERT) {
      sel = alerts.reduce(selectionReducer, {});
      setTableSettings({
        ariaLabel: 'Alert conditions',
        items: alerts,
        itemCount: rowCount,
        onLoadMoreItems: onLoadMoreAlerts,
      });
      setTableHeader(alertsTableHeader);
    }
    if (sel) {
      setSelection(sel);
      selectionsSet.current = new Set(Object.keys(sel));
    }
  }, [type, entities, alerts, selectedEntities, selectedAlerts]);

  const itemSelectionHandler = useCallback(
    (sel) => {
      const curSelectionsSet = new Set(Object.keys(sel));
      const added = curSelectionsSet.difference(selectionsSet.current);
      const removed = selectionsSet.current.difference(curSelectionsSet);
      selectionsSet.current = curSelectionsSet;
      let items = [];
      if (type === SIGNAL_TYPES.ENTITY) items = entities;
      if (type === SIGNAL_TYPES.ALERT) items = alerts;
      if (added.size === 1) {
        onSelect?.(type, true, items[added.keys().next().value]);
      } else if (removed.size === 1) {
        onSelect?.(type, false, items[removed.keys().next().value]);
      }
      if (added.size > 1) {
        items.map((i) => {
          onSelect?.(type, true, i);
        });
      } else if (removed.size > 1) {
        items.map((i) => {
          onSelect?.(type, false, i);
        });
      }
    },
    [type, entities, alerts, onSelect]
  );

  if (isLoading) return emptyState();

  return (type === SIGNAL_TYPES.ALERT && !alerts.length) ||
    (type === SIGNAL_TYPES.ENTITY && !entities.length) ? (
    emptyState(true)
  ) : (
    <div className="data-table">
      <AutoSizer>
        {({ height }) => (
          <DataTable
            {...tableSettings}
            height={height}
            selectionType={DataTable.SELECTION_TYPE.MULTIPLE}
            selection={selection}
            onSelectionChange={itemSelectionHandler}
          >
            {tableHeader}
            <DataTableBody>
              {() => (
                <DataTableRow>
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

ListingTable.propTypes = {
  type: PropTypes.oneOf([SIGNAL_TYPES.ALERT, SIGNAL_TYPES.ENTITY]),
  entities: PropTypes.array,
  alerts: PropTypes.array,
  selectedEntities: PropTypes.array,
  selectedAlerts: PropTypes.array,
  rowCount: PropTypes.number,
  onLoadMore: PropTypes.func,
  onLoadMoreAlerts: PropTypes.func,
  onSelect: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default ListingTable;
