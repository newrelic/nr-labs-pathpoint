import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { Button, Dropdown, DropdownItem, Icon, useNerdletState } from 'nr1';

import { TimeRangePicker } from '@newrelic/nr-labs-components';
import { uuid } from '../../utils';
import { SHORT_DATETIME_FORMATTER, STATUSES } from '../../constants';

const playbackIncrementOptions = [
  { display: '1 minute', timeInMs: 60000 },
  { display: '5 minutes', timeInMs: 300000 },
  { display: '15 minutes', timeInMs: 900000 },
  { display: '30 minutes', timeInMs: 1800000 },
  { display: '60 minutes', timeInMs: 3600000 },
];

const playbackIncrementForSelectedDuration = ({
  begin_time,
  duration,
  end_time,
} = {}) => {
  const dur = duration || (end_time ?? 0) - (begin_time ?? 0);
  if (!dur || dur <= 3600000) return playbackIncrementOptions[0];
  if (dur <= 21600000) return playbackIncrementOptions[1];
  if (dur <= 86400000) return playbackIncrementOptions[2];
  if (dur <= 259200000) return playbackIncrementOptions[3];
  return playbackIncrementOptions[4];
};

const isPlaybackIncrementDisabled = ({ timeInMs } = {}, timeRange = {}) => {
  const duration = durationFromTimeRange(timeRange);
  if (!timeInMs || !duration || timeInMs > duration) return true;
  if (timeInMs === 60000 && duration > 3600000) return true;
  if (timeInMs === 300000 && duration > 21600000) return true;
  if (timeInMs === 900000 && duration > 86400000) return true;
  if (timeInMs === 1800000 && duration > 259200000) return true;
  return false;
};

const durationFromTimeRange = (timeRange = {}) =>
  timeRange.duration || timeRange.end_time - timeRange.begin_time || 0;

const widthPerBand = (trackWidth = 0, numBandsOnTrack = 1) =>
  trackWidth / numBandsOnTrack;

const timesForTimeBand = (firstBandStartTime, timeBandDurationMs, index) => {
  const start = firstBandStartTime + timeBandDurationMs * index;
  const end = start + timeBandDurationMs;
  return { start, end };
};

const hintDateTimeFormat = (timestamp) =>
  SHORT_DATETIME_FORMATTER.format(new Date(timestamp));

const PlaybackBar = ({ isLoading, onPreload, onSeek, onChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldLoopCheck, setShouldLoopCheck] = useState(false);
  const [selectedIncrement, setSelectedIncrement] = useState(
    playbackIncrementForSelectedDuration
  );
  const [seekerStyle, setSeekerStyle] = useState({ width: 8, left: 0 });
  const [timeRange, setTimeRange] = useState({
    begin_time: null,
    duration: 1800000,
    end_time: null,
  });
  const [timeBands, setTimeBands] = useState([]);
  const [displayBands, setDisplayBands] = useState([]);
  const [seekHintText, setSeekHintText] = useState('');
  const seek = useRef();
  const intervalId = useRef();
  const shouldLoop = useRef(false);
  const seekX = useRef(0);
  const bandIndex = useRef(0);
  const seekBandsCount = useRef(0);
  const seekBandWidth = useRef(0);
  const seekDragStartX = useRef(0);
  const isMouseDownOnSeeker = useRef(false);
  const showingTimeWindow = useRef({ start: 0, end: 0 });
  const [nerdletState, setNerdletState] = useNerdletState();

  const loadDataCache = useCallback(async (tbs) => {
    if (!onPreload) return;
    await onPreload(tbs, (idx, status) => {
      setDisplayBands((dbs) =>
        dbs.map((db, i) => (i === idx ? { ...db, status } : db))
      );
      if (seekX.current === 0 && idx === 0 && onSeek) {
        onSeek(showingTimeWindow.current);
      }
    });
  }, []);

  const redrawBands = useCallback((isResized = false) => {
    if (seekBandsCount.current && seekBandWidth.current) {
      const width = seekBandWidth.current;
      setDisplayBands((dbs) =>
        isResized
          ? dbs.map((db, i) => ({
              ...db,
              style: {
                ...db.style,
                left: i * width,
                width: width - 1,
              },
            }))
          : Array.from({ length: seekBandsCount.current }, (_, i) => ({
              key: uuid(),
              style: { left: i * width, width: width - 1 },
            }))
      );
      const newX = isResized ? width * bandIndex.current : 0;
      seekX.current = newX;
      setSeekerStyle((sty) => ({
        ...sty,
        width,
        transform: `translateX(${newX}px)`,
      }));
    }
  }, []);

  const mouseDownHandler = useCallback((e) => {
    isMouseDownOnSeeker.current = true;
    seekDragStartX.current = e.clientX;
  }, []);

  const timeRangeChangeHandler = useCallback((selectedTimeRange) => {
    setNerdletState({
      playbackTimeRange: selectedTimeRange,
      playbackIncrement:
        playbackIncrementForSelectedDuration(selectedTimeRange),
    });
  }, []);

  useEffect(() => {
    if (nerdletState.playbackTimeRange) {
      setTimeRange(nerdletState.playbackTimeRange);
      setSelectedIncrement(
        nerdletState.playbackIncrement
          ? nerdletState.playbackIncrement
          : playbackIncrementForSelectedDuration(nerdletState.playbackTimeRange)
      );
    }
  }, [nerdletState.playbackTimeRange]);

  useEffect(() => {
    const mouseUpHandler = () => {
      isMouseDownOnSeeker.current = false;
      setSeekerStyle((sty) => ({ ...sty, cursor: 'grab' }));
    };
    const mouseMoveHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isMouseDownOnSeeker.current) {
        setIsPlaying(false);
        const { left: minX = 0, width = 0 } =
          seek.current?.getBoundingClientRect() || {};
        const maxX = width + minX;
        let cursorPosPct = ((e.clientX - minX) / (maxX - minX)) * 100;
        if (cursorPosPct < 0) cursorPosPct = 0;
        if (cursorPosPct > 100) cursorPosPct = 100;
        const trackUsableWidth = width - seekBandWidth.current;
        const pos = (cursorPosPct / 100) * trackUsableWidth;
        const left =
          Math.round(pos / seekBandWidth.current) * seekBandWidth.current;
        seekX.current = left;
        setSeekerStyle((sty) => ({
          ...sty,
          transform: `translateX(${left}px)`,
        }));
      }
    };
    const seekResizeObserver = new ResizeObserver(
      ([{ contentRect: { width } = {} }] = [{}]) => {
        const bandWidth = widthPerBand(width, seekBandsCount.current);
        seekBandWidth.current = bandWidth;
        setSeekerStyle((sty) => ({ ...sty, width: bandWidth }));
        redrawBands(true);
      }
    );
    const seekElm = seek.current;
    document.addEventListener('mouseup', mouseUpHandler, true);
    document.addEventListener('mousemove', mouseMoveHandler, true);
    seekResizeObserver.observe(seekElm);

    return () => {
      document.removeEventListener('mouseup', mouseUpHandler, true);
      document.removeEventListener('mousemove', mouseMoveHandler, true);
      seekResizeObserver.unobserve(seekElm);
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalId.current = setInterval(() => {
        const curBandIdx = bandIndex.current;
        const maxIdx = seekBandsCount.current - 1;
        const isLoopOn = shouldLoop.current;
        const willLoop = isLoopOn && curBandIdx === maxIdx;
        if (curBandIdx < maxIdx || willLoop) {
          bandIndex.current = willLoop ? 0 : curBandIdx + 1;
          setSeekerStyle((sty) => {
            const bandW = seekBandWidth.current;
            let newX = seekX.current + bandW;
            if (newX + bandW > seek.current.offsetWidth)
              newX = isLoopOn ? 0 : seekX.current;
            seekX.current = newX;
            return {
              ...sty,
              transform: `translateX(${newX}px)`,
            };
          });
        } else {
          setIsPlaying(false);
          clearInterval(intervalId.current);
        }
      }, 1500);
    } else {
      clearInterval(intervalId.current);
    }

    () => clearInterval(intervalId.current);
  }, [isPlaying]);

  const seekToBandIndex = useCallback(
    (idx) => {
      if (idx >= timeBands.length) return;
      bandIndex.current = idx;
      const { start, end } = timeBands[idx] || {};
      if (
        start &&
        end &&
        start !== showingTimeWindow.current.start &&
        end !== showingTimeWindow.current.end
      ) {
        showingTimeWindow.current = { start, end };
        setSeekHintText(
          `${hintDateTimeFormat(start)} - ${hintDateTimeFormat(end)}`
        );
        if (onSeek) onSeek(showingTimeWindow.current);
      }
    },
    [timeBands]
  );

  useEffect(() => {
    if (isMouseDownOnSeeker.current) return;
    seekToBandIndex(bandIndex.current);
  }, [seekerStyle, seekToBandIndex]);

  useEffect(() => {
    onChange?.({ selectedIncrement, timeRange });
    setIsPlaying(false);
    bandIndex.current = 0;
    const duration = durationFromTimeRange(timeRange);
    const playheadIncrement = selectedIncrement.timeInMs;
    const numBands = Math.round(duration / playheadIncrement);
    seekBandsCount.current = numBands;
    const bandWidth = widthPerBand(seek.current.offsetWidth, numBands);
    seekBandWidth.current = bandWidth;
    const bandsEndTime = new Date(
      timeRange.begin_time || Date.now()
    ).setSeconds(0, 0);
    const firstBandStartTime = bandsEndTime - timeRange.duration;
    const tbs = Array.from({ length: numBands }, (_, i) =>
      timesForTimeBand(firstBandStartTime, selectedIncrement.timeInMs, i)
    );
    setTimeBands(tbs);
    redrawBands();
    loadDataCache(tbs);
  }, [selectedIncrement, timeRange]);

  const bandClickHandler = useCallback(
    (idx) => {
      const { style: { left } = {} } = displayBands[idx] || {};
      if (!Number.isFinite(left)) return;
      seekX.current = left;
      setSeekerStyle((sty) => ({
        ...sty,
        transform: `translateX(${left}px)`,
      }));
      seekToBandIndex(idx);
    },
    [displayBands, seekToBandIndex]
  );

  return (
    <div className="playback-bar">
      <TimeRangePicker
        timeRange={timeRange}
        hideDefault={true}
        maxRangeMins={10080} // 7 days
        onChange={timeRangeChangeHandler}
      />
      <Dropdown
        className="playback-settings"
        iconType={Dropdown.ICON_TYPE.INTERFACE__OPERATIONS__CONFIGURE}
      >
        <DropdownItem items={playbackIncrementOptions}>
          <div className="playback-setting">
            <span className="setting-name">Playhead increment</span>
            <span className="setting-value">{selectedIncrement.display}</span>
          </div>
          {({ item }) => (
            <DropdownItem
              key={item.timeInSeconds}
              disabled={isPlaybackIncrementDisabled(item, timeRange)}
              onClick={() => setNerdletState({ playbackIncrement: item })}
            >
              {item.display}
            </DropdownItem>
          )}
        </DropdownItem>
        <DropdownItem
          onClick={() =>
            setShouldLoopCheck((slc) => (shouldLoop.current = !slc) && !slc)
          }
        >
          <div className="playback-setting">
            <span className="setting-name">Loop</span>
            <span className="setting-value">
              {shouldLoopCheck ? (
                <Icon type={Icon.TYPE.INTERFACE__SIGN__CHECKMARK} />
              ) : (
                <span className="loop-blank" />
              )}
            </span>
          </div>
        </DropdownItem>
      </Dropdown>
      <Button
        variant={Button.VARIANT.PRIMARY}
        sizeType={Button.SIZE_TYPE.SMALL}
        iconType={
          isPlaying
            ? Button.ICON_TYPE.INTERFACE__OPERATIONS__PAUSE
            : Button.ICON_TYPE.INTERFACE__OPERATIONS__PLAY
        }
        loading={isLoading}
        ariaLabel="Toggle playback"
        onClick={() => setIsPlaying((p) => !p)}
      />
      <div className="seek" ref={seek}>
        <div className="seek-hint">{seekHintText}</div>
        <div className="bands">
          {displayBands.map(({ key, status, style }, idx) => (
            <div
              key={key}
              className={`band ${status || STATUSES.UNKNOWN}`}
              style={style}
              onClick={() => bandClickHandler(idx)}
            />
          ))}
        </div>
        <span
          className="seeker"
          onMouseDown={mouseDownHandler}
          style={seekerStyle}
        />
      </div>
    </div>
  );
};

PlaybackBar.propTypes = {
  isLoading: PropTypes.bool,
  onPreload: PropTypes.func,
  onSeek: PropTypes.func,
  onChange: PropTypes.func,
};

export default PlaybackBar;
