/* eslint-disable prettier/prettier, no-unused-vars */
import React, { useCallback, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { EmptyState, PlatformStateContext, Button } from 'nr1';

import { IconsLib } from '../';
// import { SimpleBillboard } from '@newrelic/nr-labs-components';
import { SimpleBillboard } from 'labs-components';
// import SimpleBillboard from '../simple-billboard';

import { utils } from '../utils/utils';
import KpiModal from '../kpi-modal';

const KpiBar = ({
  mode = 'view', // valid modes: view, add, edit
  kpiArray = {},
  setKpiArray,
  loading,
  setLoading,
  debug = false,
}) => {
  const { accountId } = useContext(PlatformStateContext);
  
  const [showModal, setShowModal] = useState(false);
  const [modalMounted, setModalMounted] = useState(true);

  const [currentKpi, setCurrentKpi] = useState({});
  const [kpiMode, setKpiMode] = useState('view');
  const [kpiIndex, setKpiIndex] = useState(-1);

  useEffect(() => {
    debug && console.log(`### SK >>> before useEffect(loading): `, loading, kpiArray);
    if (loading) {
      setLoading(false);
      updateKpis(kpiArray);
    }
    debug && console.log(`### SK >>> after useEffect(loading): `, loading, kpiArray);  
  }, [loading])

  useEffect(() => {
    if (showModal) {
      setModalMounted(true);
    }
  }, [showModal])

  const updateKpis = useCallback(async (kpiArray) => {
    debug && console.log(`### SK >>> updateKpis:kpiArray `, kpiArray);
    const newKpiArray = await utils.runQuery(kpiArray);
    debug && console.log(`### SK >>> updateKpis:newKpiArray:`, newKpiArray);
    if (setKpiArray) setKpiArray(newKpiArray);
  });

  const deleteKpi = useCallback(async (index) => {
    debug && console.log(`### SK >>> deleteKpi: `, kpiArray, index);
    kpiArray.splice(index, 1);
    debug && console.log(`### SK >>> deleteKpi: updated array:`, kpiArray);
    await updateKpis(kpiArray);
  });

  const updateKpi = useCallback(async (updatedKpi, kpiIndex) => {
    kpiArray = kpiArray.map((k, i) => {
      if (i === kpiIndex) {
        return { ...k, ...updatedKpi };
      } else {
        return k;
      };
    });
    setShowModal(false);
    setKpiMode('view');
    await updateKpis(kpiArray);
  });

  // const updateNewKpi = useCallback((event, inputName) => {
  //   event.persist();
  //   currentKpi[inputName] = event.target.value;
  //   debug && console.log(`### SK >>> KpiBar::updateNewKpi - ${inputName} set to: `, currentKpi);
  // });

  const addNewKpi = useCallback(async (currentKpi) => {
    currentKpi.accountIds = [Number(currentKpi.accountIds)];
    kpiArray.push(currentKpi);
    setShowModal(false);
    setKpiMode('view');
    debug && console.log("### SK >>> KpiBar::addNewKpi - new kpi added: ", kpiArray);
    await updateKpis(kpiArray);
  }, []);

  // ##############################################################################


  return (
    <div className="kpi-bar">
      <div className="kpi-title">
        <label>Critical Measures</label>
      </div>

      <div className="kpi-containers">
        {!(kpiArray || kpiArray.length) ? (
          <EmptyState
            fullWidth
            title="Fetching KPI data..."
            type={EmptyState.TYPE.LOADING}
          />
        ) : (
          kpiArray.map((kpi, index) => (
            <div key={index} className="kpi-container">
              {/* <div>
                <IconsLib type={'handle'} />
              </div> */}
              <div className="kpi-data">
                <div>
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
              </div>
              {mode==="edit" && <div className="kpi-buttons">
                <Button
                  className="box-shadow"
                  type={Button.TYPE.SECONDARY}
                  iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__CLOSE}
                  sizeType={Button.SIZE_TYPE.SMALL}
                  onClick={e => {
                    debug && console.log('### SK >>> DELETE KPI: ', e, ' --- index: ',index);
                    setKpiIndex(index); // kpi array bucket that is being deleted
                    setCurrentKpi(kpi);
                    setKpiMode("delete");
                    setShowModal(true);
                  }}
                />
                <Button
                  className="box-shadow"
                  type={Button.TYPE.SECONDARY}
                  iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__EDIT}
                  sizeType={Button.SIZE_TYPE.SMALL}
                  onClick={e => {
                    debug && console.log(`### SK >>> EDIT KPI - e: ${e} - index: ${index} - kpi: `, kpi);
                    setKpiIndex(index); // kpi array bucket that is being edited
                    setCurrentKpi(kpi);
                    setKpiMode("edit");
                    setShowModal(true);
                  }}
                />
              </div>}
            </div>
          ))
        )}
      </div>

      {mode==="edit" && <div>
        <div className="kpi-bar-add-button">
          <Button
            type={Button.TYPE.SECONDARY}
            iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS__V_ALTERNATE}
            sizeType={Button.SIZE_TYPE.LARGE}
            onClick={e => {
              debug && console.log('### SK >>> CREATE NEW KPI: ', e);
              setKpiIndex(kpiArray.length); // kpi array bucket that is being added
              setCurrentKpi({
                id: kpiArray.length ? kpiArray[kpiArray.length-1].id + 1 : 0,
                accountIds: [accountId],
                name: '',
                desc: '',
                nrqlQuery: '',
              });
              setKpiMode('add');
              setShowModal(true);
            }}
          >
            Create new KPI
          </Button>
        </div>
        {kpiMode !== 'view' && modalMounted && <KpiModal
          kpi={currentKpi}
          kpiIndex={kpiIndex}
          kpiMode={kpiMode} // kpiMode = view, add=add new KPI, edit=edit existing KPI
          showModal={showModal}
          setShowModal={setShowModal}
          setModalMounted={setModalMounted}
          updateKpiArray={kpiMode === 'add' ? addNewKpi : kpiMode === 'edit' ? updateKpi : deleteKpi}
          debug={debug}
        />}
      </div>}
      
    </div>
  )
};

KpiBar.propTypes = {
  mode: PropTypes.string,
  kpiArray: PropTypes.object,
  setKpiArray: PropTypes.func,
  loading: PropTypes.object,
  setLoading: PropTypes.func,
  debug: PropTypes.boolean,
};

export default KpiBar;
/* eslint-enable prettier/prettier, no-unused-vars */
