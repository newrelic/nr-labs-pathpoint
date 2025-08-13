import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AccountPicker,
  Button,
  navigation,
  Tabs,
  TabsItem,
  useEntitySearchQuery,
  useNerdletState,
  usePlatformState,
} from 'nr1';

import { FilterBar } from '@newrelic/nr-labs-components';

import {
  AlertsDataTable,
  EntitiesDataTable,
  FiltersInfoPopover,
  Footer,
  Header,
  SelectedSignals,
} from './components';
import { useEntitiesTypesList, usePoliciesList } from './hooks';
import { filtersArrayToNrql } from './utils';
import { uuid } from '../../src/utils';
import {
  ALERTS_DOMAIN_TYPE_NRQL,
  MODES,
  SIGNAL_TYPES,
  SKIP_ENTITY_TYPES_NRQL,
} from '../../src/constants';

const DEFAULT_FILTER_OPTIONS = {
  [SIGNAL_TYPES.ENTITY]: [
    { option: 'name', type: 'string', values: [] },
    { option: 'entity type', type: 'string', values: [] },
  ],
  [SIGNAL_TYPES.ALERT]: [{ option: 'name', type: 'string', values: [] }],
};

const SignalSelectionNerdlet = () => {
  const [accountId, setAccountId] = useState();
  const [entities, setEntities] = useState([]);
  const [entitiesFilters, setEntitiesFilters] = useState([]);
  const [entitySearchFilter, setEntitySearchFilter] = useState(
    SKIP_ENTITY_TYPES_NRQL
  );
  const [currentTab, setCurrentTab] = useState(SIGNAL_TYPES.ENTITY);
  const [filterOptions, setFilterOptions] = useState({
    [SIGNAL_TYPES.ENTITY]: DEFAULT_FILTER_OPTIONS[SIGNAL_TYPES.ENTITY],
    [SIGNAL_TYPES.ALERT]: DEFAULT_FILTER_OPTIONS[SIGNAL_TYPES.ALERT],
  });
  const [signalSelections, setSignalSelections] = useState({
    [SIGNAL_TYPES.ENTITY]: [],
    [SIGNAL_TYPES.ALERT]: [],
  });
  const [dynamicQueries, setDynamicQueries] = useState({
    [SIGNAL_TYPES.ENTITY]: '',
    [SIGNAL_TYPES.ALERT]: '',
  });
  const [{ accountId: platformAccountId }] = usePlatformState();
  const [{ flowId, levelId, levelOrder, stageId, stageName, step }] =
    useNerdletState();
  const { entitiesCount, entitiesTypesList } = useEntitiesTypesList({
    accountId,
  });
  const { data: { count: alertsCount = 0 } = {} } = useEntitySearchQuery({
    filters: ALERTS_DOMAIN_TYPE_NRQL,
    includeCount: true,
    includeResults: false,
  });
  const { policies } = usePoliciesList({ accountId });
  const { data: { entities: dynamicEntities = [] } = {} } =
    useEntitySearchQuery({
      filters: `${SKIP_ENTITY_TYPES_NRQL} AND ${
        dynamicQueries[SIGNAL_TYPES.ENTITY]
      }`,
    });
  const { data: { entities: dynamicAlerts = [] } = {} } = useEntitySearchQuery({
    filters: `${ALERTS_DOMAIN_TYPE_NRQL} AND ${
      dynamicQueries[SIGNAL_TYPES.ALERT]
    }`,
  });
  const entitiesSelections = useRef({});
  const alertsSelections = useRef({});
  const dynamicEntitiesQuery = useRef(null);
  const dynamicEntitiesGuids = useRef(new Set());
  const dynamicEntitiesQueryId = useRef(null);
  const dynamicAlertsQuery = useRef(null);
  const dynamicAlertsGuids = useRef(new Set());
  const dynamicAlertsQueryId = useRef(null);
  const selectingStepId = useRef(null);

  useEffect(() => setAccountId(platformAccountId), [platformAccountId]);

  useEffect(() => {
    if (
      !step ||
      !Array.isArray(step.signals) ||
      step.id === selectingStepId.current
    )
      return;
    selectingStepId.current = step.id;
    const stepQueries = (step.queries || [])?.reduce(
      (acc, { type, query, id }) => {
        if (type === SIGNAL_TYPES.ENTITY && query) {
          dynamicEntitiesQueryId.current = id;
          return { ...acc, [SIGNAL_TYPES.ENTITY]: query };
        } else if (type === SIGNAL_TYPES.ALERT && query) {
          dynamicAlertsQueryId.current = id;
          return { ...acc, [SIGNAL_TYPES.ALERT]: query };
        }
        return acc;
      },
      {}
    );
    if (Object.keys(stepQueries).length) {
      setDynamicQueries(stepQueries);
    }
    setSignalSelections(() =>
      step.signals.reduce(
        (acc, { type: signalType, ...signal }) => {
          if (!(signalType in acc)) return acc;
          return {
            ...acc,
            [signalType]: [...acc[signalType], signal],
          };
        },
        {
          [SIGNAL_TYPES.ENTITY]: [],
          [SIGNAL_TYPES.ALERT]: [],
        }
      )
    );
  }, [step]);

  useEffect(() => {
    const entitiesGuids = new Set(dynamicEntities.map(({ guid }) => guid));
    dynamicEntitiesGuids.current = entitiesGuids;
    if (entitiesGuids.size)
      setSignalSelections((sigs) => ({
        ...sigs,
        [SIGNAL_TYPES.ENTITY]: sigs[SIGNAL_TYPES.ENTITY].filter(
          ({ guid }) => guid && !entitiesGuids.has(guid)
        ),
      }));
  }, [dynamicEntities]);

  useEffect(() => {
    const alertsGuids = new Set(dynamicAlerts.map(({ guid }) => guid));
    dynamicAlertsGuids.current = alertsGuids;
    if (alertsGuids.size)
      setSignalSelections((sigs) => ({
        ...sigs,
        [SIGNAL_TYPES.ALERT]: sigs[SIGNAL_TYPES.ALERT].filter(
          ({ guid }) => guid && !alertsGuids.has(guid)
        ),
      }));
  }, [dynamicAlerts]);

  useEffect(() => {
    const filtersStr = filtersArrayToNrql(entitiesFilters);
    const entitiesSearchNRQL = [
      ...(typeof accountId === 'number' ? [`accountId = ${accountId}`] : []),
      ...(filtersStr ? [filtersStr] : []),
    ].join(' AND ');
    if (currentTab === SIGNAL_TYPES.ENTITY) {
      dynamicEntitiesQuery.current = entitiesSearchNRQL;
    } else if (currentTab === SIGNAL_TYPES.ALERT) {
      dynamicAlertsQuery.current = entitiesSearchNRQL;
    }
    setEntitySearchFilter(entitiesSearchNRQL);
  }, [accountId, currentTab, entitiesFilters]);

  useEffect(
    () =>
      setFilterOptions(({ [SIGNAL_TYPES.ENTITY]: fos, ...opts }) => ({
        ...opts,
        [SIGNAL_TYPES.ENTITY]: fos.map((fo) =>
          fo.option === 'entity type'
            ? {
                ...fo,
                values: entitiesTypesList?.map((et) => ({
                  ...et,
                  value: et.displayName,
                })),
              }
            : fo
        ),
      })),
    [entitiesTypesList]
  );

  const updateTagsHandler = useCallback(
    (entitiesArr, policiesLookup) =>
      setFilterOptions(({ [currentTab]: fos, ...opts }) => {
        const map = fos.reduce((acc, { option, values }) => {
          acc[option] = new Map(values.map((vObj) => [vObj.value, vObj]));
          return acc;
        }, {});

        entitiesArr.forEach(({ name: entityName, tags }) => {
          if (typeof entityName === 'string') {
            if (!map.name.has(entityName)) {
              map.name.set(entityName, { value: entityName });
            }
          }

          if (Array.isArray(tags)) {
            tags.forEach(({ key, values: tagVals } = {}) => {
              if (!map[key]) map[key] = new Map();

              if (Array.isArray(tagVals)) {
                tagVals.forEach((strVal) => {
                  if (!map[key].has(strVal)) {
                    if (key === 'policyId') {
                      map[key].set(strVal, {
                        value: strVal,
                        label:
                          `${strVal}: ${policiesLookup?.[strVal]}` || strVal,
                      });
                    } else {
                      map[key].set(strVal, { value: strVal });
                    }
                  }
                });
              }
            });
          }
        });

        return {
          ...opts,
          [currentTab]: Object.entries(map).map(([option, valMap]) => ({
            option,
            type: 'string',
            values: Array.from(valMap.values()),
          })),
        };
      }),
    [currentTab]
  );

  const selectedEntities = useMemo(() => {
    const entitiesIndexes = entities.reduce(
      (acc, { guid }, idx) => (guid ? { ...acc, [guid]: idx } : acc),
      {}
    );
    const entitiesSelectionsObj = signalSelections[SIGNAL_TYPES.ENTITY]?.reduce(
      (acc, { guid }) =>
        guid in entitiesIndexes
          ? { ...acc, [entitiesIndexes[guid]]: true }
          : acc,
      {}
    );
    entitiesSelections.current = entitiesSelectionsObj;
    const dynamicSelectionsObj = dynamicEntities.reduce(
      (acc, { guid }) =>
        guid in entitiesIndexes
          ? { ...acc, [entitiesIndexes[guid]]: true }
          : acc,
      {}
    );
    return { ...entitiesSelectionsObj, ...dynamicSelectionsObj };
  }, [signalSelections[SIGNAL_TYPES.ENTITY], entities, dynamicEntities]);

  const selectedAlerts = useMemo(() => {
    const entitiesIndexes = entities.reduce(
      (acc, { guid }, idx) => (guid ? { ...acc, [guid]: idx } : acc),
      {}
    );
    const entitiesSelectionsObj = signalSelections[SIGNAL_TYPES.ALERT]?.reduce(
      (acc, { guid }) =>
        guid in entitiesIndexes
          ? { ...acc, [entitiesIndexes[guid]]: true }
          : acc,
      {}
    );
    alertsSelections.current = entitiesSelectionsObj;
    const dynamicSelectionsObj = dynamicAlerts.reduce(
      (acc, { guid }) =>
        guid in entitiesIndexes
          ? { ...acc, [entitiesIndexes[guid]]: true }
          : acc,
      {}
    );
    return { ...entitiesSelectionsObj, ...dynamicSelectionsObj };
  }, [signalSelections[SIGNAL_TYPES.ALERT], entities, dynamicAlerts]);

  const isAddFilterDisabled = useMemo(
    () =>
      dynamicQueries[currentTab] || entities.length > 25 || !entities.length,
    [dynamicQueries, currentTab, entities]
  );

  const accountChangeHandler = useCallback((_, a) => setAccountId(a), []);

  const cancelHandler = useCallback(() => navigation.closeNerdlet(), []);

  const entitiesSelectionChangeHandler = useCallback(
    (changedSel, entitiesArr) => {
      const dynamicGuids = dynamicEntitiesGuids.current;

      setSignalSelections(
        ({ [SIGNAL_TYPES.ENTITY]: entitiesSels, ...sels }) => {
          const entitiesByIndexes = entitiesArr.reduce(
            (acc, { guid, name }, idx) =>
              guid ? { ...acc, [idx]: { guid, name } } : acc,
            {}
          );
          const prevSelIdxs = Object.keys(entitiesSelections.current);
          const nextSelIdxs = Object.keys(changedSel);
          const removeFilterFn = dynamicGuids.size
            ? (guid, compareEntity) =>
                guid !== compareEntity.guid && dynamicGuids.has(guid)
            : (guid, compareEntity) => guid !== compareEntity.guid;

          const cleanedSels = prevSelIdxs.reduce(
            (acc, cur) =>
              nextSelIdxs.includes(cur)
                ? acc
                : acc.filter(({ guid }) =>
                    removeFilterFn(guid, entitiesByIndexes[cur])
                  ),
            entitiesSels
          );

          const updatedSels = nextSelIdxs.reduce(
            (acc, cur) =>
              prevSelIdxs.includes(cur)
                ? acc
                : [...acc, entitiesByIndexes[cur]],
            cleanedSels
          );

          return {
            ...sels,
            [SIGNAL_TYPES.ENTITY]: updatedSels,
          };
        }
      );
    },
    []
  );

  const alertsSelectionChangeHandler = useCallback(
    (changedSel, entitiesArr) => {
      const dynamicGuids = dynamicAlertsGuids.current;

      setSignalSelections(({ [SIGNAL_TYPES.ALERT]: alertsSels, ...sels }) => {
        const entitiesByIndexes = entitiesArr.reduce(
          (acc, { guid, name }, idx) =>
            guid ? { ...acc, [idx]: { guid, name } } : acc,
          {}
        );
        const prevSelIdxs = Object.keys(alertsSelections.current);
        const nextSelIdxs = Object.keys(changedSel);
        const removeFilterFn = dynamicGuids.size
          ? (guid, compareEntity) =>
              guid !== compareEntity.guid && dynamicGuids.has(guid)
          : (guid, compareEntity) => guid !== compareEntity.guid;

        const cleanedSels = prevSelIdxs.reduce(
          (acc, cur) =>
            nextSelIdxs.includes(cur)
              ? acc
              : acc.filter(({ guid }) =>
                  removeFilterFn(guid, entitiesByIndexes[cur])
                ),
          alertsSels
        );

        const updatedSels = nextSelIdxs.reduce(
          (acc, cur) =>
            prevSelIdxs.includes(cur) ? acc : [...acc, entitiesByIndexes[cur]],
          cleanedSels
        );

        return {
          ...sels,
          [SIGNAL_TYPES.ALERT]: updatedSels,
        };
      });
    },
    []
  );

  const saveHandler = useCallback(() => {
    let queries = [];
    const queryIds = {
      [SIGNAL_TYPES.ENTITY]: dynamicEntitiesQueryId.current,
      [SIGNAL_TYPES.ALERT]: dynamicAlertsQueryId.current,
    };
    [SIGNAL_TYPES.ENTITY, SIGNAL_TYPES.ALERT].forEach((type) => {
      const query = dynamicQueries[type];
      if (query) {
        queries.push({
          type,
          query,
          id: queryIds[type] || uuid(),
        });
      }
    });

    navigation.openNerdlet({
      id: 'home',
      urlState: {
        flow: { id: flowId },
        mode: MODES.EDIT,
        staging: {
          stageId,
          levelId,
          stepId: step?.id,
          signals: [
            ...(signalSelections[SIGNAL_TYPES.ENTITY] || []).map(
              ({ guid, name, included }) => ({
                guid,
                name,
                type: SIGNAL_TYPES.ENTITY,
                included: included !== undefined ? included : true,
              })
            ),
            ...(signalSelections[SIGNAL_TYPES.ALERT] || []).map(
              ({ guid, name, included }) => ({
                guid,
                name,
                type: SIGNAL_TYPES.ALERT,
                included: included !== undefined ? included : true,
              })
            ),
          ],
          queries,
        },
      },
    });
  }, [flowId, stageId, levelId, step, dynamicQueries, signalSelections]);

  const tooManySignals = useMemo(
    () =>
      (signalSelections[SIGNAL_TYPES.ENTITY]?.length || 0) +
        (signalSelections[SIGNAL_TYPES.ALERT]?.length || 0) +
        (dynamicEntities.length || 0) +
        (dynamicAlerts.length || 0) >
      25,
    [signalSelections, dynamicEntities, dynamicAlerts]
  );

  return (
    <div className="container nerdlet">
      <div className="signal-select">
        <Header
          stageName={stageName}
          levelOrder={levelOrder}
          stepTitle={step?.title}
        />
        <div className="signal-select-content">
          <div className="signals-browser">
            <Tabs className="tabs" value={currentTab} onChange={setCurrentTab}>
              <TabsItem
                className="tab"
                value={SIGNAL_TYPES.ENTITY}
                label={`Entities (${entitiesCount})`}
              />
              <TabsItem
                className="tab"
                value={SIGNAL_TYPES.ALERT}
                label={`Alerts (${alertsCount})`}
              />
            </Tabs>
            <div className="filters">
              <AccountPicker
                value={accountId}
                onChange={accountChangeHandler}
              />
              <FilterBar
                options={filterOptions[currentTab]}
                onChange={setEntitiesFilters}
              />
              <div className="filter-tail">
                <Button
                  sizeType={Button.SIZE_TYPE.SMALL}
                  iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS}
                  disabled={isAddFilterDisabled}
                  onClick={() => {
                    if (currentTab === SIGNAL_TYPES.ENTITY) {
                      const qry = dynamicEntitiesQuery.current;
                      if (qry)
                        setDynamicQueries((prev) => ({
                          ...prev,
                          [SIGNAL_TYPES.ENTITY]: qry,
                        }));
                    } else if (currentTab === SIGNAL_TYPES.ALERT) {
                      const qry = dynamicAlertsQuery.current;
                      if (qry)
                        setDynamicQueries((prev) => ({
                          ...prev,
                          [SIGNAL_TYPES.ALERT]: qry,
                        }));
                    }
                  }}
                >
                  Add this filter
                </Button>
                <FiltersInfoPopover />
              </div>
            </div>
            {currentTab === SIGNAL_TYPES.ENTITY ? (
              <EntitiesDataTable
                dynamicEntities={dynamicEntities}
                entitySearchFilter={entitySearchFilter}
                onSelectionChangeHandler={entitiesSelectionChangeHandler}
                onUpdateTags={updateTagsHandler}
                selection={selectedEntities}
                setEntities={setEntities}
              />
            ) : null}
            {currentTab === SIGNAL_TYPES.ALERT ? (
              <AlertsDataTable
                dynamicAlerts={dynamicAlerts}
                entitySearchFilter={entitySearchFilter}
                onUpdateTags={updateTagsHandler}
                policies={policies}
                onSelectionChangeHandler={alertsSelectionChangeHandler}
                selection={selectedAlerts}
                setEntities={setEntities}
              />
            ) : null}
          </div>
          <SelectedSignals
            signalSelections={signalSelections}
            setSignalSelections={setSignalSelections}
            dynamicQueries={dynamicQueries}
            dynamicEntities={dynamicEntities}
            dynamicAlerts={dynamicAlerts}
            onDeleteEntitiesQuery={() =>
              setDynamicQueries((prev) => ({
                ...prev,
                [SIGNAL_TYPES.ENTITY]: '',
              }))
            }
            onDeleteAlertsQuery={() =>
              setDynamicQueries((prev) => ({
                ...prev,
                [SIGNAL_TYPES.ALERT]: '',
              }))
            }
          />
        </div>
        <Footer
          tooManySignals={tooManySignals}
          saveHandler={saveHandler}
          cancelHandler={cancelHandler}
        />
      </div>
    </div>
  );
};

export default SignalSelectionNerdlet;
