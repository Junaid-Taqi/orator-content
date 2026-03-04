import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import '../styles/TimelinePage.css';
import { serverUrl } from '../Services/Constants/Constants';

const getPoolColor = (pool, fallbackIndex = 0) => {
  const palette = ['#22c55e', '#58a6ff', '#c084fc', '#f59e0b', '#ef4444', '#14b8a6'];
  const raw = String(pool?.color || '').trim().toLowerCase();

  if (raw.startsWith('#')) return raw;
  const map = {
    green: '#22c55e',
    blue: '#58a6ff',
    purple: '#c084fc',
    orange: '#f59e0b',
    red: '#ef4444',
    teal: '#14b8a6',
    yellow: '#eab308',
    cyan: '#06b6d4',
  };

  return map[raw] || palette[fallbackIndex % palette.length];
};

const formatClock = (date) => {
  try {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (e) {
    return '--:--';
  }
};

const formatDateInput = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const TimelinePage = ({ user }) => {
  const groupId = user?.groups?.[0]?.id;

  const [devices, setDevices] = useState([]);
  const [selectedDisplayId, setSelectedDisplayId] = useState('');
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));

  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [error, setError] = useState('');

  const [timelineData, setTimelineData] = useState(null);
  const [clockNow, setClockNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDevices = async () => {
      if (!groupId) return;
      setLoadingDevices(true);
      setError('');

      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        };

        const response = await axios.post(
          `${serverUrl}/o/displayManagementApplication/getAllDisplays`,
          { groupId: String(groupId) },
          config
        );

        const list = response?.data?.displays || [];
        setDevices(list);

        if (list.length) {
          setSelectedDisplayId((prev) => prev || String(list[0].displayId));
        } else {
          setSelectedDisplayId('');
          setTimelineData(null);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load displays.');
      } finally {
        setLoadingDevices(false);
      }
    };

    fetchDevices();
  }, [groupId]);

  const fetchTimeline = async (displayId) => {
    if (!groupId || !displayId) return;

    setLoadingTimeline(true);
    setError('');

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      };

      const response = await axios.post(
        `${serverUrl}/o/displayManagementApplication/getTimelineData`,
        {
          groupId: String(groupId),
          displayId: String(displayId),
        },
        config
      );

      if (response?.data?.success) {
        setTimelineData(response.data.data || null);
      } else {
        setTimelineData(null);
        setError(response?.data?.message || 'Unable to fetch timeline data.');
      }
    } catch (err) {
      setTimelineData(null);
      setError(err?.response?.data?.message || 'Failed to fetch timeline data.');
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    if (selectedDisplayId) {
      fetchTimeline(selectedDisplayId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDisplayId, groupId]);

  const pools = useMemo(() => timelineData?.poolBlocks || [], [timelineData]);
  const counters = timelineData?.counters || {};
  const display = timelineData?.display || {};
  const nowPlaying = timelineData?.nowPlaying || {};

  const cycleDurationSeconds = Number(counters?.cycleDurationSeconds || 0);

  const totalSlides = useMemo(
    () => pools.reduce((sum, p) => sum + Number(p?.slides || 0), 0),
    [pools]
  );

  const legend = useMemo(
    () => pools.map((pool, index) => ({
      key: pool?.contentPoolId || `${pool?.name}-${index}`,
      name: pool?.name || `Pool ${index + 1}`,
      color: getPoolColor(pool, index),
      durationSeconds: Number(pool?.durationSeconds || 0),
      slides: Number(pool?.slides || 0),
      isAlwaysOn: !!pool?.isAlwaysOn,
    })),
    [pools]
  );

  const shiftDateByDays = (days) => {
    const current = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
    current.setDate(current.getDate() + days);
    setSelectedDate(formatDateInput(current));
  };

  const statusText = timelineData?.active ? 'Live & Playing' : 'Inactive';

  return (
    <div className="timeline-page">
      <div className="timeline-header">
        <div>
          <h1>Timeline</h1>
          <p>Dynamic device work cycle visualization with pool-based rotation</p>
        </div>
        <div className={`timeline-live-pill ${timelineData?.active ? 'active' : ''}`}>{statusText}</div>
      </div>

      <div className="timeline-filters">
        <div className="timeline-field">
          <label>Device</label>
          <select
            value={selectedDisplayId}
            onChange={(e) => setSelectedDisplayId(e.target.value)}
            disabled={loadingDevices || !devices.length}
          >
            {!devices.length && <option value="">No Devices</option>}
            {devices.map((d) => (
              <option key={d.displayId} value={String(d.displayId)}>
                {d.name}
              </option>
            ))}
          </select>
          <small>{display?.orientation || '-'}</small>
        </div>
      </div>

      {!!error && <div className="timeline-error">{error}</div>}

      <div className="timeline-work-banner">
        <div>
          <h3>{display?.name || 'No Device Selected'} - Work Schedule</h3>
          <p>
            Wake: {display?.wakeTime || '--:--'} | Sleep: {display?.sleepTime || '--:--'} | Total: {counters?.workDurationText || '0s'}
          </p>
        </div>
        <div className="now-playing-box">
          <span>Now Playing</span>
          <strong>{nowPlaying?.poolName || nowPlaying?.slideTitle || '-'}</strong>
          <small>Cycle #{counters?.fullCycles ?? 0}</small>
        </div>
      </div>

      <div className="timeline-stats">
        <div className="timeline-stat-card">
          <label>Total Pools</label>
          <strong>{counters?.totalPools ?? 0}</strong>
        </div>
        <div className="timeline-stat-card">
          <label>Timeline Blocks</label>
          <strong className='green'>{counters?.timelineBlocks ?? 0}</strong>
        </div>
        <div className="timeline-stat-card">
          <label>Full Cycles</label>
          <strong className='text-purple'>{counters?.fullCycles ?? 0}</strong>
        </div>
        <div className="timeline-stat-card">
          <label>Work Duration</label>
          <strong className='text-orange'>{counters?.workDurationText || '0s'}</strong>
        </div>
        <div className="timeline-stat-card">
          <label>Current Time</label>
          <strong className='text-primary'>{formatClock(clockNow)}</strong>
        </div>
      </div>

      <div className="timeline-panel">
        <div className="timeline-panel-head">
          <h2>Cycle Configurator</h2>
          <button type="button" onClick={() => fetchTimeline(selectedDisplayId)} disabled={loadingTimeline || !selectedDisplayId}>Reset to Default</button>
        </div>
        <p className="timeline-help text-primary">{timelineData?.timelinePattern || 'Start -> Loop'}</p>

        <div className="cycle-cards-row mt-4">
          {legend.map((pool) => {
            const pct = cycleDurationSeconds > 0 ? Math.round((pool.durationSeconds / cycleDurationSeconds) * 100) : 0;
            return (
              <div
                key={pool.key}
                className="cycle-card"
                style={{ borderColor: pool.color }}
              >
                <h4>{pool.name}</h4>
                <div className='d-flex justify-content-between mt-3'>
                  <p className='text-primary'>Slides:</p>
                  <p>{pool.slides}</p>
                </div>
                <div className='d-flex justify-content-between'>
                  <p className='text-primary'>Duration:</p>
                  <p>{pool.durationSeconds}s</p>
                </div>
                <div className='d-flex justify-content-between'>
                  <p className='text-primary'>% of Cycle:</p>
                  <p>{pct}%</p>
                </div>

                {pool.isAlwaysOn && <span className="always-on-badge">Always On</span>}
              </div>
            );
          })}
          {!legend.length && <div className="timeline-empty">No pool blocks available for this device.</div>}
        </div>

        <div className="cycle-summary-row">
          <div>
            <label>Content Pools</label>
            <strong>{legend.length}</strong>
          </div>
          <div>
            <label>Estimated Cycle</label>
            <strong>{counters?.cycleDurationText || '0s'}</strong>
          </div>
          <div>
            <label>Total Slides</label>
            <strong>{totalSlides}</strong>
          </div>
        </div>
      </div>

      <div className="timeline-panel">
        <div className="timeline-panel-head daily">
          <div>
            <h2>Daily Timeline Visualization</h2>
            <p className="text-primary">
              Single cycle pattern repeating {counters?.fullCycles ?? 0} times
              from {display?.wakeTime || '--:--'} to {display?.sleepTime || '--:--'}
            </p>
          </div>
          <div className="legend-row">
            {legend.map((pool) => (
              <div key={`legend-${pool.key}`} className="legend-item">
                <span style={{ background: pool.color }}></span>
                <small>{pool.name}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="pool-rotation-strip">
          {legend.map((pool) => {
            const widthPercent = cycleDurationSeconds > 0 ? (pool.durationSeconds / cycleDurationSeconds) * 100 : 0;
            return (
              <div
                key={`strip-${pool.key}`}
                className="strip-item"
                style={{ width: `${widthPercent}%`, background: pool.color }}
              >
                <span>{pool.name}</span>
                <small>{pool.durationSeconds}s</small>
              </div>
            );
          })}
        </div>

        <div className="sequence-line">
          <span className="text-primary">{timelineData?.timelinePattern || 'Start --> Loop'}</span>
          {counters?.fullCycles ? <strong>Loop {counters.fullCycles}x</strong> : null}
        </div>

        <div className="daily-summary-grid">
          <div>
            <label>Total Cycles Today</label>
            <strong>{counters?.fullCycles ?? 0}</strong>
          </div>
          <div>
            <label>Cycle Duration</label>
            <strong>{counters?.cycleDurationText || '0s'}</strong>
          </div>
          <div>
            <label>Total Active Time</label>
            <strong>{counters?.workDurationText || '0s'}</strong>
          </div>
          <div>
            <label>Status</label>
            <strong className={timelineData?.active ? 'green' : ''}>{timelineData?.active ? 'Active' : 'Inactive'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelinePage;
