import React, {
  forwardRef,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import { BlockText, Button, HeadingText, Icon, navigation } from 'nr1';

import Modal from '../modal';
import { FlowContext, StagesContext } from '../../contexts';
import { SIGNAL_TYPES, UI_CONTENT } from '../../constants';

const STAGE_ISSUE_TYPES = {
  TOO_MANY_SIGNALS: 1,
  MISSING_SIGNALS: 2,
};

const configs = {
  [STAGE_ISSUE_TYPES.TOO_MANY_SIGNALS]: {
    ...UI_CONTENT.SIGNAL.TOO_MANY,
    icon: {
      type: Icon.TYPE.INTERFACE__STATE__CRITICAL__WEIGHT_BOLD,
      color: '#df2d24',
    },
  },
  [STAGE_ISSUE_TYPES.MISSING_SIGNALS]: {
    ...UI_CONTENT.SIGNAL.MISSING,
    icon: {
      type: Icon.TYPE.INTERFACE__STATE__WARNING__WEIGHT_BOLD,
      color: '#F07A0E',
    },
  },
};

const signalIcons = {
  [SIGNAL_TYPES.ENTITY]:
    Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__ENTITY_NOT_REPORTING,
  [SIGNAL_TYPES.ALERT]: Icon.TYPE.INTERFACE__OPERATIONS__ALERT__S_OFF,
};

const StageIssuesModal = forwardRef(({ type, items, stageId }, ref) => {
  const { id: flowId, stages = [] } = useContext(FlowContext);
  const { updateStagesDataRef } = useContext(StagesContext);
  const [hidden, setHidden] = useState(true);
  const [lookupTable, setLookupTable] = useState({});

  useImperativeHandle(ref, () => ({
    open: () => setHidden(false),
  }));

  useEffect(
    () =>
      setLookupTable((lt) =>
        items.reduce((acc, { levelId, stepId }) => {
          const { levels = [], name: stageName } = (stages || []).find(
            ({ id }) => id === stageId
          );
          const levelIndex = levels.findIndex(({ id }) => id === levelId);
          const levelOrder = levelIndex + 1;
          const step = (levels[levelIndex]?.steps || []).find(
            ({ id }) => id === stepId
          );

          return {
            ...acc,
            [stepId]: {
              stageId,
              stageName,
              levelId,
              levelOrder,
              step,
            },
          };
        }, lt || {})
      ),
    [items, stageId, stages]
  );

  const closeHandler = useCallback(() => setHidden(true), []);

  const openSettings = useCallback(
    (stepId) => {
      closeHandler();
      updateStagesDataRef?.();
      navigation.openStackedNerdlet({
        id: 'signal-selection',
        urlState: {
          flowId,
          ...lookupTable[stepId],
        },
      });
    },
    [flowId, lookupTable]
  );

  const config = useMemo(() => configs[type] || {}, [type]);

  const issueTableBody = useMemo(
    () =>
      items.map(({ stepId, signals }) => {
        const itemName = lookupTable[stepId]?.step?.title || '(unknown)';
        return (
          <Fragment key={stepId}>
            <div className="issues-table-row">
              <div className="issues-table-col" title={itemName}>
                {itemName}
              </div>
              <Button
                variant={Button.VARIANT.PRIMARY}
                sizeType={Button.SIZE_TYPE.SMALL}
                onClick={() => openSettings(stepId)}
              >
                Update signals
              </Button>
              {type === STAGE_ISSUE_TYPES.MISSING_SIGNALS ? (
                <div className="issues-table-signals">
                  {signals.map(({ guid, name, type: signalType }) => (
                    <div key={guid} className="issues-table-signal">
                      <Icon type={signalIcons[signalType]} />
                      <div className="issues-table-signal-name">
                        {name || '(unknown)'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Fragment>
        );
      }),
    [items, type, lookupTable, openSettings]
  );

  return (
    <Modal hidden={hidden} onClose={closeHandler}>
      <div className="stage-issues-modal">
        <div className="modal-header">
          <Icon {...config.icon} />
          <HeadingText type={HeadingText.TYPE.HEADING_3}>
            {config.HEADING || ''}
          </HeadingText>
        </div>
        <div className="modal-content">
          <BlockText>{config.DETAILS || ''}</BlockText>
          <div className="issues-table">
            <div className="issues-table-row">
              <HeadingText
                className="issues-table-col"
                type={HeadingText.TYPE.HEADING_6}
              >
                Step
              </HeadingText>
            </div>
            {issueTableBody}
          </div>
        </div>
        <div className="modal-footer">
          <Button type={Button.TYPE.TERTIARY} onClick={closeHandler}>
            Back
          </Button>
        </div>
      </div>
    </Modal>
  );
});

StageIssuesModal.TYPES = STAGE_ISSUE_TYPES;

StageIssuesModal.propTypes = {
  type: PropTypes.oneOf(Object.values(STAGE_ISSUE_TYPES)),
  items: PropTypes.array,
  stageId: PropTypes.string,
};

StageIssuesModal.displayName = 'StageIssuesModal';

export default StageIssuesModal;
