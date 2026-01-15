import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, HeadingText, JsonChart } from 'nr1';
import Modal from '../modal';

const ExportFlowModal = ({ flowDoc, hidden = true, onClose }) => {
  const [data, setData] = useState(null);
  const [chartHeight, setChartHeight] = useState(0);
  const linkRef = useRef(null);
  const chartWrapperRef = useRef(null);

  useEffect(() => {
    const { created: _, ...flow } = flowDoc || {}; // eslint-disable-line no-unused-vars
    setData(flow);
  }, [flowDoc]);

  useEffect(() => {
    if (!chartWrapperRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setChartHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(chartWrapperRef.current);

    return () => resizeObserver.disconnect();
  }, [hidden]);

  const downloadButtonClickHandler = useCallback(() => {
    const exportBtn = linkRef.current;
    if (!exportBtn) return;

    const jsonString = JSON.stringify(data, null, 2);
    const url = `data:application/json;charset=utf-8,${encodeURIComponent(
      jsonString
    )}`;
    const fileName = `${(data?.name || 'flow')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()}.json`;
    exportBtn.download = fileName;
    exportBtn.href = url;
    exportBtn.click();
  }, [data]);

  const closeHandler = () => onClose?.();

  return (
    <Modal hidden={hidden} onClose={closeHandler}>
      <div className="export-flow-modal">
        <div className="json-content">
          <HeadingText
            className="export-header"
            type={HeadingText.TYPE.HEADING_3}
          >
            Export flow
          </HeadingText>
          <div ref={chartWrapperRef} className="chart-wrapper">
            {chartHeight > 0 && (
              <JsonChart
                className="json-chart"
                data={data}
                fullWidth
                style={{ height: chartHeight }}
              />
            )}
          </div>
        </div>
        <div className="button-bar">
          <a ref={linkRef} className="hidden-download-btn" />
          <Button
            disabled={!data}
            variant={Button.VARIANT.PRIMARY}
            onClick={downloadButtonClickHandler}
          >
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
};

ExportFlowModal.propTypes = {
  flowDoc: PropTypes.object,
  hidden: PropTypes.bool,
  onClose: PropTypes.func,
};

export default ExportFlowModal;
