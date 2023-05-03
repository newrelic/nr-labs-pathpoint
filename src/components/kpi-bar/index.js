import React, { useCallback, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { EmptyState, PlatformStateContext, Button } from 'nr1';

import { KpiModal } from '../';
import { SimpleBillboard } from '@newrelic/nr-labs-components';

import { nrqlQueries } from '../utils/nerdGraph';

const KpiBar = ({
  nerdletMode = 'view', // valid modes: view, add, edit
  kpiArray = {},
  setKpiArray,
  loading,
  setLoading,
}) => {
  const { accountId } = useContext(PlatformStateContext);

  const [showModal, setShowModal] = useState(false);
  const [modalMounted, setModalMounted] = useState(true);

  const [currentKpi, setCurrentKpi] = useState({});
  const [kpiMode, setKpiMode] = useState('view');
  const [kpiIndex, setKpiIndex] = useState(-1);

  useEffect(() => {
    if (loading) {
      setLoading(false);
      updateKpis(kpiArray);
    }
  }, [loading]);

  useEffect(() => {
    if (showModal) {
      setModalMounted(true);
    }
  }, [showModal]);

  const updateKpis = useCallback(async (updatedKpiArray) => {
    const newKpiArray = await nrqlQueries(updatedKpiArray, true);
    if (setKpiArray) setKpiArray(newKpiArray);
  });

  const deleteKpi = useCallback(async (index) => {
    await updateKpis(kpiArray.filter((_, i) => i !== index));
  });

  const updateKpi = useCallback(async (updatedKpi, kpiIndex) => {
    kpiArray = kpiArray.map((k, i) => {
      if (i === kpiIndex) {
        return { ...k, ...updatedKpi };
      } else {
        return k;
      }
    });
    setShowModal(false);
    setKpiMode('view');
    await updateKpis(kpiArray);
  });

  const addNewKpi = useCallback(
    async (currentKpi) => {
      currentKpi.accountIds = [Number(currentKpi.accountIds)];
      const newKpiArray = [...kpiArray, currentKpi];
      setShowModal(false);
      setKpiMode('view');
      await updateKpis(newKpiArray);
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
                    value: kpi.value,
                    previousValue: kpi.previousValue,
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
          {kpiMode !== 'view' && modalMounted && (
            <KpiModal
              kpi={currentKpi}
              kpiIndex={kpiIndex}
              kpiMode={kpiMode} // kpiMode = view, add=add new KPI, edit=edit existing KPI
              showModal={showModal}
              setShowModal={setShowModal}
              setModalMounted={setModalMounted}
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
  loading: PropTypes.object,
  setLoading: PropTypes.func,
};

export default KpiBar;
