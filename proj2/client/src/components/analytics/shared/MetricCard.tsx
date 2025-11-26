import React from 'react';
import './MetricCard.css';

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendUp = true,
}) => {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <h4 className="metric-title">{title}</h4>
        <div className="metric-value">{value}</div>
        {trend && (
          <div className={`metric-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
            <span className="trend-arrow">{trendUp ? '↑' : '↓'}</span>
            <span className="trend-value">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;