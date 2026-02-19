import React from 'react';
import '../styles/StatsCard.css';

const StatsCard = ({ title, count, bgColor = 'primary' }) => {
  return (
    <div className={`stats-card stats-card-${bgColor}`}>
      <h3 className="stats-title">{title}</h3>
      <p className="stats-count">{count}</p>
    </div>
  );
};

export default StatsCard;
