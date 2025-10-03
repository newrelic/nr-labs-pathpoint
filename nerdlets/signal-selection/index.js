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
  Tooltip,
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
import { ListSelect } from '../../src/components';
import { useEntitiesTypesList, usePoliciesList } from './hooks';
import { filtersArrayToNrql, keyValuesFromEntities } from './utils';
import { uuid } from '../../src/utils';
import {
  ALERTS_DOMAIN_TYPE_NRQL,
  MAX_ENTITIES_IN_STEP,
  MODES,
  POLICY_ID_TAG,
  SIGNAL_TYPES,
  SKIP_ENTITY_TYPES_NRQL,
  UI_CONTENT,
} from '../../src/constants';

const { ADD_FILTER_BUTTON } = UI_CONTENT.SIGNAL_SELECTION;

const DEFAULT_FILTER_OPTIONS = [{ option: 'name', type: 'string', values: [] }];

const SignalSelectionNerdlet = () => {
  const [accountId, setAccountId] = useState();
  const [entities, setEntities] = useState([]);
  const [entitiesTypesList, setEntitiesTypesList] = useState([]);
  const [policiesList, setPoliciesList] = useState([]);
  const [entitiesFilters, setEntitiesFilters] = useState([]);
  const [entitySearchFilter, setEntitySearchFilter] = useState(
    SKIP_ENTITY_TYPES_NRQL
  );
  const [currentTab, setCurrentTab] = useState(SIGNAL_TYPES.ENTITY);
  const [filterOptions, setFilterOptions] = useState({
    [SIGNAL_TYPES.ENTITY]: DEFAULT_FILTER_OPTIONS,
    [SIGNAL_TYPES.ALERT]: DEFAULT_FILTER_OPTIONS,
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
  const { entitiesCount, entitiesTypesList: entitiesTypesListInitial } =
    useEntitiesTypesList({
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
  const dynamicAlertsQuery = useRef(null);
  const dynamicAlertsGuids = useRef(new Set());
  const selectingStepId = useRef(null);
  const existingDynamicQueries = useRef({});

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
      (acc, { type, query, id, included }) => {
        if (type === SIGNAL_TYPES.ENTITY && query) {
          existingDynamicQueries.current = {
            ...existingDynamicQueries.current,
            [type]: { id, included },
          };
          return { ...acc, [SIGNAL_TYPES.ENTITY]: query };
        } else if (type === SIGNAL_TYPES.ALERT && query) {
          existingDynamicQueries.current = {
            ...existingDynamicQueries.current,
            [type]: { id, included },
          };
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
    let keyFilters;
    if (currentTab === SIGNAL_TYPES.ENTITY) {
      keyFilters = entitiesTypesList
        .reduce(
          (acc, { domain, type, isSelected }) =>
            isSelected
              ? [...acc, `(domain = '${domain}' AND type = '${type}')`]
              : acc,
          []
        )
        .join(' OR ');
    } else if (currentTab === SIGNAL_TYPES.ALERT) {
      const policyIds = policiesList.reduce(
        (acc, { subtitle, isSelected }) =>
          isSelected ? [...acc, subtitle] : acc,
        []
      );
      if (policyIds.length === 1) {
        keyFilters = `\`tags.${POLICY_ID_TAG}\` = '${policyIds[0]}'`;
      } else if (policyIds.length > 1) {
        keyFilters = `\`tags.${POLICY_ID_TAG}\` IN ('${policyIds.join(
          "', '"
        )}')`;
      }
    }
    const entitiesSearchNRQLArr = [];
    if (typeof accountId === 'number')
      entitiesSearchNRQLArr.push(`accountId = ${accountId}`);
    if (keyFilters) entitiesSearchNRQLArr.push(keyFilters);
    if (filtersStr) entitiesSearchNRQLArr.push(filtersStr);
    const entitiesSearchNRQL = entitiesSearchNRQLArr.join(' AND ');
    if (currentTab === SIGNAL_TYPES.ENTITY) {
      dynamicEntitiesQuery.current = entitiesSearchNRQL;
    } else if (currentTab === SIGNAL_TYPES.ALERT) {
      dynamicAlertsQuery.current = entitiesSearchNRQL;
    }
    setEntitySearchFilter(entitiesSearchNRQL);
  }, [accountId, currentTab, entitiesFilters, entitiesTypesList, policiesList]);

  useEffect(
    () =>
      setEntitiesTypesList(() =>
        entitiesTypesListInitial.reduce(
          (acc, { count, displayName, domain, type }) =>
            count
              ? [
                  ...acc,
                  {
                    id: `${domain}:${type}`,
                    title: displayName,
                    subtitle: `${count}`,
                    isSelected: false,
                    domain,
                    type,
                  },
                ]
              : acc,
          []
        )
      ),
    [entitiesTypesListInitial]
  );

  useEffect(
    () =>
      setPoliciesList(
        () =>
          Object.keys(policies)?.map((key) => ({
            id: key,
            title: policies[key],
            subtitle: key,
            isSelected: false,
          })) || []
      ),
    [policies]
  );

  const updateTagsHandler = useCallback(
    (entitiesArr) =>
      setFilterOptions(({ [currentTab]: existingOptions, ...opts }) => ({
        ...opts,
        [currentTab]: keyValuesFromEntities(entitiesArr, existingOptions),
      })),
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
      dynamicQueries[currentTab] ||
      entities.length > MAX_ENTITIES_IN_STEP ||
      !entities.length,
    [dynamicQueries, currentTab, entities]
  );

  const addFilterTooltipText = useMemo(() => {
    if (dynamicQueries[currentTab])
      return ADD_FILTER_BUTTON.TOOLTIP.DYNAMIC_QUERY_EXISTS[currentTab];
    if (entities.length > MAX_ENTITIES_IN_STEP || !entities.length)
      return ADD_FILTER_BUTTON.TOOLTIP.NO_FILTER_OR_MAXED[currentTab];
    return '';
  }, [dynamicQueries, currentTab, entities]);

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
    [SIGNAL_TYPES.ENTITY, SIGNAL_TYPES.ALERT].forEach((type) => {
      const query = dynamicQueries[type];
      const { id, included } =
        (existingDynamicQueries.current || {})[type] || {};
      if (query) {
        queries.push({
          type,
          query,
          id: id || uuid(),
          included: included !== undefined ? included : true,
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
        (dynamicEntities.length || 0) >
        MAX_ENTITIES_IN_STEP ||
      (signalSelections[SIGNAL_TYPES.ALERT]?.length || 0) +
        (dynamicAlerts.length || 0) >
        MAX_ENTITIES_IN_STEP,
    [signalSelections, dynamicEntities, dynamicAlerts]
  );

  const keyFilterLabel = useMemo(() => {
    if (currentTab === SIGNAL_TYPES.ENTITY) {
      const selectedEntitiesTypes = entitiesTypesList
        .reduce(
          (acc, { title, isSelected }) => (isSelected ? [...acc, title] : acc),
          []
        )
        .join(', ');
      return (
        <>
          <span>Entity Type</span>
          <span>=</span>
          <span>{selectedEntitiesTypes || 'All'}</span>
        </>
      );
    }
    if (currentTab === SIGNAL_TYPES.ALERT) {
      const selectedPolicies = policiesList
        .reduce(
          (acc, { title, isSelected }) => (isSelected ? [...acc, title] : acc),
          []
        )
        .join(', ');
      return (
        <>
          <span>Policy Name</span>
          <span>=</span>
          <span>{selectedPolicies || 'All'}</span>
        </>
      );
    }
    return null;
  }, [currentTab, entitiesTypesList, policiesList]);

  const keyFilterClear = useMemo(() => {
    if (currentTab === SIGNAL_TYPES.ENTITY)
      return {
        title: 'All',
        subtitle: `${entitiesCount}`,
      };
    if (currentTab === SIGNAL_TYPES.ALERT)
      return {
        title: 'All',
      };
    return null;
  }, [currentTab, entitiesCount]);

  const keyFilterList = useMemo(() => {
    if (currentTab === SIGNAL_TYPES.ENTITY) return entitiesTypesList;
    if (currentTab === SIGNAL_TYPES.ALERT) return policiesList;
    return [];
  }, [currentTab, entitiesTypesList, policiesList]);

  const keyFilterChangeHandler = useMemo(() => {
    if (currentTab === SIGNAL_TYPES.ENTITY) return setEntitiesTypesList;
    if (currentTab === SIGNAL_TYPES.ALERT) return setPoliciesList;
  }, [currentTab]);

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
              <ListSelect
                label={keyFilterLabel}
                clear={keyFilterClear}
                list={keyFilterList}
                onChange={keyFilterChangeHandler}
              />
              <FilterBar
                options={filterOptions[currentTab]}
                onChange={setEntitiesFilters}
              />
              <div className="filter-tail">
                <Tooltip text={addFilterTooltipText}>
                  <Button
                    sizeType={Button.SIZE_TYPE.SMALL}
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
                    {ADD_FILTER_BUTTON.BUTTON_TEXT}
                  </Button>
                </Tooltip>
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
