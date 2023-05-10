import React, { useCallback, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { EmptyState, PlatformStateContext, Button } from 'nr1';

import { KpiModal } from '../';
import { SimpleBillboard } from '@newrelic/nr-labs-components';

import useFetchKpis from '../../hooks/fetch-kpi-values';

const KpiBar = ({
  nerdletMode = 'view', // valid modes: view, add, edit
  kpiArray = {},
  setKpiArray,
}) => {
  const { accountId } = useContext(PlatformStateContext);

  const [showModal, setShowModal] = useState(false);
  const [currentKpi, setCurrentKpi] = useState({});
  const [kpiMode, setKpiMode] = useState('view');
  const [kpiIndex, setKpiIndex] = useState(-1);

  useEffect(() => {
    if (kpiMode === 'view') {
      updateKpis(kpiArray);
    }
  }, [kpiMode]);

  const [queryResults, setQueryResults] = useState([]);

  const hookData = useFetchKpis({ kpiData: kpiArray });

  useEffect(() => {
    if (hookData.kpis && hookData.kpis.length) {
      setQueryResults(hookData.kpis);
    }
  }, [hookData]);

  const updateKpis = useCallback((updatedKpiArray) => {
    setKpiIndex(-1);
    setShowModal(false);
    setKpiMode('view');
    setKpiArray(updatedKpiArray);
  });

  const deleteKpi = useCallback((index) => {
    updateKpis(kpiArray.filter((_, i) => i !== index));
  });

  const updateKpi = useCallback((updatedKpi, kpiIndex) => {
    const newKpis = kpiArray.map((k, i) => {
      if (i === kpiIndex) {
        return { ...k, ...updatedKpi };
      } else {
        return k;
      }
    });
    updateKpis(newKpis);
  });

  const addNewKpi = useCallback(
    (currentKpi) => {
      currentKpi.accountIds = [Number(currentKpi.accountIds)];
      const newKpiArray = [...kpiArray, currentKpi];
      updateKpis(newKpiArray);
    },
    [kpiArray]
  );

  return (
    <div className="kpi-bar">
      <div className="kpi-title">
        <label>Critical Measures</label>
      </div>
      <div
        className="kpi-containers"
        style={{
          maxWidth: `${
            nerdletMode === 'edit' ? 'calc(99% - 340px)' : 'calc(99% - 120px)}'
          }`,
        }}
      >
        {!kpiArray || !kpiArray.length ? (
          <div className="empty-state-component">
            <EmptyState
              fullWidth
              title="No KPIs available"
              type={EmptyState.TYPE.NORMAL}
            />
          </div>
        ) : (
          kpiArray.map((kpi, index) => (
            <div
              key={index}
              className="kpi-container"
              style={{ width: `${nerdletMode === 'edit' ? '140px' : '115px'}` }}
            >
              <div className="kpi-data">
                <SimpleBillboard
                  metric={{
                    value: ((queryResults || [])[index] || {}).value || 0,
                    previousValue:
                      ((queryResults || [])[index] || {}).previousValue || '',
                  }}
                  title={{
                    name: kpi.name,
                  }}
                />
              </div>
              {nerdletMode === 'edit' && (
                <div className="kpi-buttons">
                  <Button
                    className="box-shadow"
                    type={Button.TYPE.SECONDARY}
                    iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__CLOSE}
                    sizeType={Button.SIZE_TYPE.SMALL}
                    onClick={() => {
                      setKpiIndex(index); // kpi array bucket being deleted
                      setCurrentKpi(kpi);
                      setKpiMode('delete');
                      setShowModal(true);
                    }}
                  />
                  <Button
                    className="box-shadow"
                    type={Button.TYPE.SECONDARY}
                    iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__EDIT}
                    sizeType={Button.SIZE_TYPE.SMALL}
                    onClick={() => {
                      setKpiIndex(index); // kpiArray bucket being edited
                      setCurrentKpi(kpi);
                      setKpiMode('edit');
                      setShowModal(true);
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {nerdletMode === 'edit' && (
        <div>
          <div className="kpi-bar-add-button">
            <Button
              type={Button.TYPE.SECONDARY}
              iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE}
              sizeType={Button.SIZE_TYPE.LARGE}
              onClick={() => {
                setKpiIndex(kpiArray.length); // new kpiArray bucket being added
                setCurrentKpi({
                  id: kpiArray.length
                    ? kpiArray[kpiArray.length - 1].id + 1
                    : 0,
                  accountIds: [accountId],
                  name: '',
                  nrqlQuery: '',
                });
                setKpiMode('add');
                setShowModal(true);
              }}
            >
              Create new KPI
            </Button>
          </div>
          {kpiMode !== 'view' && (
            <KpiModal
              kpi={currentKpi}
              kpiIndex={kpiIndex}
              kpiMode={kpiMode} // kpiMode = view, add=add new KPI, edit=edit existing KPI
              showModal={showModal}
              setShowModal={setShowModal}
              updateKpiArray={
                kpiMode === 'add'
                  ? addNewKpi
                  : kpiMode === 'edit'
                  ? updateKpi
                  : deleteKpi
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

KpiBar.propTypes = {
  nerdletMode: PropTypes.string,
  kpiArray: PropTypes.object,
  setKpiArray: PropTypes.func,
};

export default KpiBar;
