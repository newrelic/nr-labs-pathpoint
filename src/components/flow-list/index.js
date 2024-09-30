import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import { Icon, TextField } from 'nr1';

import { getStageHeaderShape } from '../../utils';
import { useReadUserPreferences, useSaveUserPreferences } from '../../hooks';

const favIcons = [
  <Icon
    key="favorite-off"
    type={Icon.TYPE.PROFILES__EVENTS__FAVORITE}
    color="#9ea5a9"
  />,
  <Icon
    key="favorite-on"
    type={Icon.TYPE.PROFILES__EVENTS__FAVORITE__WEIGHT_BOLD}
    color="#f0b400"
  />,
];

const FlowList = forwardRef(({ flows = [], onClick = () => null }, ref) => {
  const [searchPattern, setSearchPattern] = useState('');
  const [filteredFlows, setFilteredFlows] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const { userPreferences, loading: userPreferencesLoading } =
    useReadUserPreferences();
  const saveUserPreferences = useSaveUserPreferences();

  useEffect(() => {
    if (!userPreferencesLoading && userPreferences)
      setFavorites(userPreferences.favoriteFlows || {});
  }, [userPreferences, userPreferencesLoading]);

  useEffect(() => {
    setFilteredFlows(
      flows.length && searchPattern
        ? flows.filter((item) =>
            `${item.document.name}
           ${item.document.created.user.name}
           ${item.document.stages.map((s) => s.name).join(' ')}`
              .toLowerCase()
              .includes(searchPattern.toLowerCase())
          )
        : flows
    );
  }, [flows, searchPattern]);

  const toggleFavorite = useCallback(
    async (id) => {
      let document;
      if (id in favorites) {
        const { [id]: _, ...favs } = favorites; // eslint-disable-line no-unused-vars
        document = favs;
      } else {
        document = { ...favorites, [id]: null };
      }

      await saveUserPreferences.save({
        documentId: 'favoriteFlows',
        document,
      });

      setFavorites(document);
    },
    [favorites]
  );

  const flowsList = useMemo(
    () =>
      filteredFlows.reduce(
        (acc, { id, document: { name, created, stages = [] } = {} }) => {
          if (id in favorites) {
            acc.unshift({ id, name, created, stages, favorite: true });
          } else {
            acc.push({ id, name, created, stages, favorite: false });
          }
          return acc;
        },
        []
      ),
    [filteredFlows, favorites]
  );

  return (
    <div className="flows-container">
      <div className="search-bar">
        <TextField
          className="search"
          type={TextField.TYPE.SEARCH}
          placeholder={'Search for Flow'}
          onChange={(evt) => setSearchPattern(evt.target.value)}
        />
      </div>
      <div className="flow-list">
        <div className="listing" ref={ref}>
          <div className="header">
            <div className="cell" />
            <div className="cell">Flow</div>
            <div className="cell">Stages</div>
          </div>
          {(flowsList || []).map(({ id, name, created, stages, favorite }) => (
            <div key={id} className="row">
              <div className="cell" onClick={() => toggleFavorite(id)}>
                {favIcons[+favorite]}
              </div>
              <div className="details" onClick={() => onClick(id)}>
                <div className="cell name">
                  <span>{name}</span>
                  {userText(created)}
                </div>
                <div className="cell stages-list">{stages.map(stageShape)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const userText = ({ user: { name: user } = {} } = {}) =>
  user ? <span className="user">Created by {user}</span> : null;

const stageShape = (stage = {}) => {
  const className = getStageHeaderShape(stage);

  return (
    <div key={stage.id} className="stage-shape" title={stage.name}>
      {className !== 'has-none' ? (
        <div className={`stage-name ${className}-border border`} />
      ) : null}
      <div className={`stage-name ${className} shape`}>
        <div className="name-text">{stage.name}</div>
      </div>
    </div>
  );
};

FlowList.propTypes = {
  flows: PropTypes.array,
  onClick: PropTypes.func,
};

FlowList.displayName = 'FlowList';

export default FlowList;
