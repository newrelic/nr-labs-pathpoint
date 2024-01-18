import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import {
  EmptyState,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
} from 'nr1';
import { SIGNAL_TYPES, UI_CONTENT } from '../../src/constants';

const EMPTY_STATE = (
  <EmptyState
    fullHeight
    fullWidth
    iconType={EmptyState.ICON_TYPE.INTERFACE__STATE__CRITICAL}
    title={UI_CONTENT.SIGNAL_SELECTION.TOO_MANY_ENTITIES_EMPTY_STATE.TITLE}
    description={
      UI_CONTENT.SIGNAL_SELECTION.TOO_MANY_ENTITIES_EMPTY_STATE.DESCRIPTION
    }
  />
);

const ListingTable = ({
  type,
  entities = [],
  alerts = [],
  selectedEntities = [],
  selectedAlerts = [],
  onSelect,
}) => {
  const selectedHandler = useCallback(
    ({ item: { guid } = {} }) => {
      let selectionLookup = {};
      if (type === SIGNAL_TYPES.ENTITY)
        selectionLookup = selectedEntities.reduce(
          (acc, { guid }) => ({ ...acc, [guid]: null }),
          {}
        );
      if (type === SIGNAL_TYPES.ALERT)
        selectionLookup = selectedAlerts.reduce(
          (acc, { guid }) => ({ ...acc, [guid]: null }),
          {}
        );
      return guid in selectionLookup;
    },
    [type, selectedEntities, selectedAlerts]
  );

  const selectItemHandler = ({ target: { checked } = {} } = {}, { item }) => {
    if (onSelect) onSelect(type, checked, item);
  };

  if (
    (type === SIGNAL_TYPES.ALERT && !alerts.length) ||
    (type === SIGNAL_TYPES.ENTITY && !entities.length)
  )
    return EMPTY_STATE;

  if (type === SIGNAL_TYPES.ENTITY)
    return (
      <Table
        items={entities}
        selected={selectedHandler}
        onSelect={selectItemHandler}
      >
        <TableHeader>
          <TableHeaderCell value={({ item }) => item?.name}>
            Name
          </TableHeaderCell>
          <TableHeaderCell value={({ item }) => item?.type}>
            Entity type
          </TableHeaderCell>
          <TableHeaderCell value={({ item }) => item?.account?.id}>
            Account
          </TableHeaderCell>
        </TableHeader>
        {({ item }) => (
          <TableRow>
            <TableRowCell>{item?.name}</TableRowCell>
            <TableRowCell>
              {item?.domain}/{item?.type}
            </TableRowCell>
            <TableRowCell>
              {item?.account?.name} - {item?.account?.id}
            </TableRowCell>
          </TableRow>
        )}
      </Table>
    );

  if (type === SIGNAL_TYPES.ALERT)
    return (
      <Table
        items={alerts}
        selected={selectedHandler}
        onSelect={selectItemHandler}
      >
        <TableHeader>
          <TableHeaderCell value={({ item }) => item?.name}>
            Name
          </TableHeaderCell>
        </TableHeader>
        {({ item }) => (
          <TableRow>
            <TableRowCell>{item?.name}</TableRowCell>
          </TableRow>
        )}
      </Table>
    );

  return EMPTY_STATE;
};

ListingTable.propTypes = {
  type: PropTypes.oneOf([SIGNAL_TYPES.ALERT, SIGNAL_TYPES.ENTITY]),
  entities: PropTypes.array,
  alerts: PropTypes.array,
  selectedEntities: PropTypes.array,
  selectedAlerts: PropTypes.array,
  onSelect: PropTypes.func,
};

export default ListingTable;
