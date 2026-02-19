import React from 'react';
import '../styles/PoolsPage.css';

const PoolsPage = () => {
  return (
    <div className="pools-container">
      {/* 1. Header Section */}
      <div className="pools-header">
        <div className="header-text">
          <h1>Content Pools</h1>
          <p>Category-based pools in fixed rotation with Always On insertion</p>
        </div>
        <div className="header-btns">
          <button className="btn btn-create">+ Create Pool</button>
          <button className="btn btn-always">Always On Settings</button>
          <button className="btn btn-emergency">Emergency Settings</button>
        </div>
      </div>

      {/* 2. Purple Rotation Bar */}
      <div className="rotation-banner">
        <div className="rotation-icon">
          <span className="icon-box">📚</span>
        </div>
        <div className="rotation-details">
          <strong>Fixed Playback Rotation</strong>
          <p>News → Always On → Official News → Always On → Events → Always On → (repeat)</p>
        </div>
      </div>

      {/* 3. Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <label>Active Slides</label>
          <span className="value text-green">25</span>
        </div>
        <div className="stat-card">
          <label>Scheduled</label>
          <span className="value text-orange">9</span>
        </div>
        <div className="stat-card">
          <label>Archived</label>
          <span className="value">38</span>
        </div>
        <div className="stat-card">
          <label>Enabled Pools</label>
          <span className="value text-purple">4</span>
        </div>
        <div className="stat-card">
          <label>Emergency Ready</label>
          <span className="value text-red">2</span>
        </div>
      </div>

      {/* 4. Device Filter Bar */}
      <div className="device-filter">
        <div className="filter-info">
          <span>🖥️ Device-Specific Content</span>
          <p>View and manage pool content for specific displays</p>
        </div>
        <select className="device-dropdown">
          <option>All Devices (Global)</option>
        </select>
      </div>

      {/* 5. Always On Card */}
      <div className="pool-accordion">
        <div className="accordion-header">
          <div className="accordion-title">
            <span className="status-indicator"></span>
            <h3>Always On</h3>
            <span className="badge-enabled">Enabled</span>
          </div>
          <span className="arrow">▼</span>
        </div>
        
        <p className="category-label">Category: Always On</p>

        <div className="accordion-body">
          <div className="sub-stat">
            <label>Active</label>
            <span className="sub-val">4</span>
          </div>
          <div className="sub-stat">
            <label>Scheduled</label>
            <span className="sub-val">0</span>
          </div>
          <div className="sub-stat">
            <label>Archived</label>
            <span className="sub-val">0</span>
          </div>
          <div className="sub-stat">
            <label>Pool Status</label>
            <div className="toggle-switch">
               <input type="checkbox" defaultChecked />
               <span className="slider"></span>
            </div>
          </div>
          <div className="sub-stat">
            <label>Order</label>
            <span className="sub-val">#1</span>
          </div>
        </div>

        <div className="accordion-footer">
            <div className="priority-mode">
                <span>🔄 Slide Priority Mode:</span>
                <p>Slides play in priority order (High → Medium → Low)</p>
            </div>
            <select className="priority-dropdown">
                <option>By Priority</option>
            </select>
        </div>
      </div>
    </div>
  );
};

export default PoolsPage;