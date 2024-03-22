import React, {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import { BlockText, Button, HeadingText, Icon, Modal, navigation } from 'nr1';

import { FlowContext } from '../../contexts';

const StageNotifyModal = forwardRef(
  (
    {
      heading = '',
      text = '',
      icon,
      iconColor = '',
      itemsTitle = '',
      items = [],
    },
    ref
  ) => {
    const { id: flowId, stages = [] } = useContext(FlowContext);
    const [hidden, setHidden] = useState(true);
    const [itemNames, setItemNames] = useState({});

    useImperativeHandle(ref, () => ({
      open: () => setHidden(false),
    }));

    useEffect(() => {
      setItemNames(
        items.reduce((acc, { stageId, levelId, stepId, guid }) => {
          const { levels = [], name: stageName } = (stages || []).find(
            ({ id }) => id === stageId
          );
          const levelIndex = levels.findIndex(({ id }) => id === levelId);
          const { title = '(untitled)', signals = [] } = (
            levels[levelIndex]?.steps || []
          ).find(({ id }) => id === stepId);
          const signal = guid
            ? signals.find((s) => s.guid === guid) || {}
            : null;
          return {
            ...acc,
            [stageId]: {
              ...acc[stageId],
              [levelId]: {
                ...acc[stageId]?.[levelId],
                [stepId]: {
                  stageName,
                  levelOrder: levelIndex + 1,
                  title,
                  signal,
                },
              },
            },
          };
        }, {})
      );
    }, [items]);

    const updateSignalsHandler = useCallback(
      (stageId, levelId, stepId) => {
        closeHandler();
        const {
          stageName,
          levelOrder,
          title: stepTitle,
        } = itemNames[stageId]?.[levelId]?.[stepId] || {};
        navigation.openStackedNerdlet({
          id: 'signal-selection',
          urlState: {
            flowId,
            stageId,
            stageName,
            levelId,
            levelOrder,
            stepId,
            stepTitle,
          },
        });
      },
      [flowId, itemNames]
    );

    const displayName = useCallback(
      (stageId, levelId, stepId) => {
        const { signal, title } = itemNames[stageId]?.[levelId]?.[stepId] || {};
        if (signal) return signal.name || '(unknown)';
        return title;
      },
      [itemNames]
    );

    const closeHandler = useCallback(() => setHidden(true), []);

    return (
      <Modal hidden={hidden} onClose={closeHandler}>
        <div className="stage-notify-modal">
          <div className="modal-header">
            {icon ? <Icon type={icon} color={iconColor} /> : null}
            <HeadingText type={HeadingText.TYPE.HEADING_3}>
              {heading}
            </HeadingText>
          </div>
          <div className="modal-content">
            <BlockText>{text}</BlockText>
            {items.length ? (
              <div className="items-table">
                {itemsTitle ? (
                  <div className="item-row heading">
                    <HeadingText type={HeadingText.TYPE.HEADING_6}>
                      {itemsTitle}
                    </HeadingText>
                  </div>
                ) : null}
                {items.map(({ stageId, levelId, stepId }, i) => (
                  <div className="item-row" key={i}>
                    <div className="item-name">
                      <BlockText>
                        {displayName(stageId, levelId, stepId)}
                      </BlockText>
                    </div>
                    <Button
                      variant={Button.VARIANT.PRIMARY}
                      sizeType={Button.SIZE_TYPE.SMALL}
                      onClick={() =>
                        updateSignalsHandler(stageId, levelId, stepId)
                      }
                    >
                      Update signals
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="modal-footer">
            <Button type={Button.TYPE.TERTIARY} onClick={closeHandler}>
              Back
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

StageNotifyModal.propTypes = {
  heading: PropTypes.string,
  text: PropTypes.string,
  icon: PropTypes.string,
  iconColor: PropTypes.string,
  itemsTitle: PropTypes.string,
  items: PropTypes.array,
};

StageNotifyModal.displayName = 'StageNotifyModal';

export default StageNotifyModal;