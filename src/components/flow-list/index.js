import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { Icon, TextField } from 'nr1';

import { getStageHeaderShape } from '../../utils';

const FlowList = ({
  flows = [],
  userConfig = {},
  setUserConfig = () => null,
  onClick = () => null,
}) => {
  const [searchPattern, setSearchPattern] = useState('');
  const [filteredFlows, setFilteredFlows] = useState([]);

  useEffect(() => {
    const tmpFlows = userConfig.favorite_flows.size
      ? flows.map((f) => ({
          ...f,
          favorite: Boolean(userConfig.favorite_flows.has(f.id)) || false,
        }))
      : flows;

    const sortedFlows = tmpFlows.sort(
      (a, b) => Number(b.favorite || false) - Number(a.favorite || false)
    );

    setFilteredFlows(
      sortedFlows.length && searchPattern
        ? sortedFlows.filter((item) =>
            `${item.document.name} ${item.document.stages
              .map((s) => s.name)
              .join(' ')}`
              .toLowerCase()
              .includes(searchPattern.toLowerCase())
          )
        : sortedFlows
    );
  }, [searchPattern, JSON.stringify(Array.from(userConfig.favorite_flows))]);

  const renderStageShape = useCallback((stage, index) => {
    const className = getStageHeaderShape(stage, '-border');

    return (
      <div key={index} className="stage-shape">
        {className !== 'has-none-border' && (
          <div
            key={`border-${index}`}
            className={`stage-name ${getStageHeaderShape(stage, '-border')}`}
            style={{ position: 'relative' }}
            title={`${stage.name}_border`}
          ></div>
        )}
        <div
          key={`stage-${index}`}
          className={`stage-name ${getStageHeaderShape(stage)}`}
          title={stage.name}
        >
          <div className="name-text">{stage.name}</div>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="flows-container">
      <div id="search-bar">
        <TextField
          className="search-bar"
          type={TextField.TYPE.SEARCH}
          placeholder={'Search for Flow'}
          onChange={(evt) => {
            setSearchPattern(evt.target.value);
          }}
        />
      </div>

      <div className="flowlist-container">
        <div className="flowlist-header">
          <div className="row">
            <div className="cell col-0-format"></div>
            <div className="cell col-1-format">Flow</div>
            <div className="cell col-2-format">Stages</div>
          </div>
        </div>
        <div className="flowlist-content">
          {filteredFlows.map((flow, flowIndex) => (
            <div
              key={`flow-${flowIndex}`}
              className="row body"
              onClick={(event) => {
                event.target.nodeName === 'DIV' && onClick(flow.id);
              }}
            >
              <span
                className="cell col-0-format"
                onClick={() => {
                  setFilteredFlows(
                    filteredFlows.map((f, i) =>
                      i === flowIndex
                        ? {
                            ...f,
                            favorite: !filteredFlows[flowIndex].favorite
                              ? true
                              : !filteredFlows[flowIndex].favorite,
                          }
                        : f
                    )
                  );
                  const ff = userConfig.favorite_flows;
                  !filteredFlows[flowIndex].favorite
                    ? ff.add(filteredFlows[flowIndex].id)
                    : ff.delete(filteredFlows[flowIndex].id);
                  setUserConfig({ ...userConfig, favorite_flows: ff });
                }}
              >
                <Icon
                  type={
                    userConfig.favorite_flows.has(flow.id)
                      ? Icon.TYPE.PROFILES__EVENTS__FAVORITE__WEIGHT_BOLD
                      : Icon.TYPE.PROFILES__EVENTS__FAVORITE
                  }
                  color={
                    userConfig.favorite_flows.has(flow.id)
                      ? '#f0b400'
                      : '#9ea5a9'
                  }
                />
              </span>
              <div className="cell col-1-format flow-info">
                <div className="flow-name">{flow.document.name}</div>
                <div className="createdby-user">
                  {`Created by: ${
                    flow?.document?.createdBy?.name || 'unknown user'
                  }`}
                </div>
              </div>
              <div className="cell col-2-format stage-names">
                {flow.document.stages.map((stage, index) =>
                  renderStageShape(stage, index)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

FlowList.propTypes = {
  flows: PropTypes.array,
  userConfig: PropTypes.object,
  setUserConfig: PropTypes.object,
  onClick: PropTypes.func,
};

export default FlowList;
