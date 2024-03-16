import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Icon,
  HeadingText,
  PlatformStateContext,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverBody,
} from 'nr1';

import { SimpleBillboard, TimeRangePicker } from '@newrelic/nr-labs-components';

import IconsLib from '../icons-lib';
import { KPI_MODES, MODES, SIGNAL_TYPES, UI_CONTENT } from '../../constants';
import { useFetchKpis } from '../../hooks';
import KpiEditButtons from './edit-buttons';
import KpiModal from '../kpi-modal';
import { FlowContext } from '../../contexts';
import { uuid, formatKpiHoverDatime } from '../../utils';

const blankKpi = ({
  type = SIGNAL_TYPES.NRQL_QUERY,
  id = '',
  name = '',
  accountIds = [],
  nrqlQuery = '',
}) => ({
  type,
  id,
  name,
  accountIds,
  nrqlQuery,
});

const metricFromQuery = (results) => ({
  value: results?.value || 0,
  previousValue: isNaN(results?.previousValue) ? '' : results?.previousValue,
});

const KpiBar = ({ onChange = () => null, mode = MODES.INLINE }) => {
  const { kpis = [] } = useContext(FlowContext);
  const { accountId } = useContext(PlatformStateContext);
  const [showModal, setShowModal] = useState(false);
  const [queryResults, setQueryResults] = useState([]);

  const [timeRange, setTimeRange] = useState(null);
  const { kpis: qryResults = [] } = useFetchKpis({ kpiData: kpis, timeRange });
  const selectedKpi = useRef({});
  const selectedKpiMode = useRef(KPI_MODES.VIEW);

  const kpisContainer = useRef();

  const dragItemIndex = useRef();
  const dragOverItemIndex = useRef();

  const dragStartHandler = (e, index) => {
    dragItemIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const dragOverHandler = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverItemIndex.current = index;
  };

  const dropHandler = (e) => {
    e.preventDefault();
    const itemIndex = dragItemIndex.current;
    const overIndex = dragOverItemIndex.current;
    if (
      !Number.isInteger(itemIndex) ||
      !Number.isInteger(overIndex) ||
      itemIndex === overIndex
    )
      return;
    const updatedKpis = [...kpis];
    const item = updatedKpis[itemIndex];
    updatedKpis.splice(itemIndex, 1);
    updatedKpis.splice(overIndex, 0, item);
    onChange(updatedKpis);
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  useEffect(() => {
    selectedKpi.current = {};
    selectedKpiMode.current = KPI_MODES.VIEW;
    setShowModal(false);
  }, [kpis]);

  useEffect(() => setQueryResults(qryResults), [qryResults]);

  const modeClassText = useMemo(
    () => (mode === MODES.EDIT ? 'Edit' : 'View'),
    [mode]
  );

  const createKpiHandler = useCallback(() => {
    selectedKpi.current = blankKpi({
      id: uuid(),
      accountIds: [accountId],
    });
    selectedKpiMode.current = KPI_MODES.ADD;
    setShowModal(true);
  }, [kpis, accountId]);

  const updateKpiHandler = useCallback(
    (updatedKpi) => {
      if (!onChange) return;
      const kpiId = updatedKpi.id;
      const kpiMode = selectedKpiMode.current;

      if (kpiMode === KPI_MODES.ADD) {
        const type = SIGNAL_TYPES.NRQL_QUERY;
        onChange([...kpis, { ...updatedKpi, type }]);
      } else if (kpiMode === KPI_MODES.EDIT) {
        onChange(kpis.map((k) => (k.id === kpiId ? updatedKpi : k)));
      } else if (kpiMode === KPI_MODES.DELETE) {
        onChange(kpis.filter((k) => k.id !== kpiId));
      }
    },
    [kpis, onChange]
  );

  const editButtonsClickHandler = useCallback(
    (kpiId, editType) => {
      selectedKpi.current = kpis.find((k) => k.id === kpiId);
      selectedKpiMode.current = editType;
      setShowModal(true);
    },
    [kpis]
  );

  const [scrollPosition, setScrollPosition] = useState(0);

  const shouldHideSliderButton = useCallback(
    (direction) => {
      const { scrollWidth, offsetWidth } = kpisContainer.current || {};
      if (scrollWidth > offsetWidth) {
        switch (direction) {
          case 'left':
            return scrollPosition <= 0;
          case 'right':
            return (
              Math.round(scrollPosition + offsetWidth) >=
              Math.round(scrollWidth - 5)
            );
          default:
            return true;
        }
      }
      return true;
    },
    [scrollPosition]
  );

  const slideKpiBar = useCallback((direction) => {
    const {
      current: container,
      current: { offsetWidth },
    } = kpisContainer || {};
    const elements = Array.from(container.querySelectorAll('.kpi-container'));

    const partialKpiNode = elements.find((el) =>
      direction === 'left'
        ? container.getBoundingClientRect().left -
            el.getBoundingClientRect().left <=
          offsetWidth
        : el.getBoundingClientRect().right -
            container.getBoundingClientRect().left >
          offsetWidth
    );

    if (partialKpiNode) {
      container.scrollLeft +=
        partialKpiNode.getBoundingClientRect().left -
        container.getBoundingClientRect().left;
      setScrollPosition(container.scrollLeft);
    }
  }, []);

  return (
    <div className="kpi-bar">
      <div className="kpi-bar-heading">
        <div className={`heading-title heading${modeClassText}ModeWidth`}>
          <HeadingText type={HeadingText.TYPE.HEADING_5}>
            {UI_CONTENT.KPI_BAR.TITLE}
          </HeadingText>
          <Tooltip text={UI_CONTENT.KPI_BAR.TITLE_TOOLTIP}>
            <Icon
              className="info-icon"
              type={Icon.TYPE.INTERFACE__INFO__INFO}
            />
          </Tooltip>
        </div>
        {mode === MODES.EDIT ? (
          <div className="kpi-bar-add-button">
            <Button
              type={Button.TYPE.SECONDARY}
              iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE}
              onClick={createKpiHandler}
            >
              Create new KPI
            </Button>
          </div>
        ) : (
          <TimeRangePicker timeRange={timeRange} onChange={setTimeRange} />
        )}
      </div>
      <div
        className="slider-button"
        style={{
          visibility: shouldHideSliderButton('left') ? 'hidden' : 'visible',
        }}
        onClick={() => slideKpiBar('left')}
      >
        <Icon type={Icon.TYPE.INTERFACE__CHEVRON__CHEVRON_LEFT} />
      </div>
      <div
        ref={kpisContainer}
        className={`kpi-containers kpiBar${modeClassText}ModeMaxWidth`}
      >
        {kpis.map((kpi, index) => (
          <div
            key={kpi.id}
            className="kpi-container"
            draggable={mode === MODES.EDIT}
            onDragStart={(e) => dragStartHandler(e, index)}
            onDragOver={(e) => dragOverHandler(e, index)}
            onDrop={(e) => dropHandler(e)}
          >
            {mode === MODES.EDIT && (
              <span className="drag-handle">
                <IconsLib type={IconsLib.TYPES.HANDLE} />
              </span>
            )}
            <div className="kpi-data">
              <Popover openOnHover={true}>
                <PopoverTrigger>
                  <SimpleBillboard
                    metric={metricFromQuery(queryResults[index])}
                    title={{ name: kpi.alias || kpi.name }}
                  />
                </PopoverTrigger>
                <PopoverBody>
                  <p className="kpi-hover">
                    <span>
                      {queryResults[index]?.metadata?.timeWindow?.since
                        ? `Since ${formatKpiHoverDatime(
                            queryResults[index]?.metadata?.timeWindow?.since
                          )}`
                        : ''}
                    </span>
                    <span>
                      {queryResults[index]?.metadata?.timeWindow?.until !==
                      'NOW'
                        ? ` - until ${formatKpiHoverDatime(
                            queryResults[index]?.metadata?.timeWindow?.until
                          )}`
                        : ''}
                    </span>
                    <span>
                      {queryResults[index]?.metadata?.timeWindow?.compareWith
                        ? ` vs. ${queryResults[
                            index
                          ]?.metadata?.timeWindow?.compareWith.toLowerCase()}`
                        : ''}
                    </span>
                  </p>
                </PopoverBody>
              </Popover>
            </div>
            {mode === MODES.EDIT && (
              <KpiEditButtons
                kpiId={kpi.id}
                onClick={editButtonsClickHandler}
              />
            )}
          </div>
        ))}
      </div>
      <div
        className="slider-button"
        style={{
          visibility: shouldHideSliderButton('right') ? 'hidden' : 'visible',
        }}
        onClick={() => slideKpiBar('right')}
      >
        <Icon type={Icon.TYPE.INTERFACE__CHEVRON__CHEVRON_RIGHT} />
      </div>
      <KpiModal
        kpi={selectedKpi.current}
        kpiMode={selectedKpiMode.current}
        showModal={showModal}
        setShowModal={setShowModal}
        updateKpiArray={updateKpiHandler}
      />
    </div>
  );
};

KpiBar.propTypes = {
  onChange: PropTypes.func,
  mode: PropTypes.oneOf(Object.values(MODES)),
};

export default KpiBar;
