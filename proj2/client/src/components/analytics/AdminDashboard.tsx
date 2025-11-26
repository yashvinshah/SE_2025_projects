import React, { useState } from 'react';
import OrdersAnalytics from './OrdersAnalytics';
import CustomerAnalytics from './CustomerAnalytics';
import RestaurantAnalytics from './RestaurantAnalytics';
import DonationAnalytics from './DonationAnalytics';
import './AdminDashboard.css';

type TabType = 'orders' | 'customers' | 'restaurants' | 'donations';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('orders');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersAnalytics />;
      case 'customers':
        return <CustomerAnalytics />;
      case 'restaurants':
        return <RestaurantAnalytics />;
      case 'donations':
        return <DonationAnalytics />;
      default:
        return <OrdersAnalytics />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>📊 Advanced Analytics Dashboard</h1>
        <p className="subtitle">Monitor performance and insights across Hungry Wolf</p>
      </div>

      <div className="analytics-tabs">
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Orders
        </button>
        <button
          className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          👥 Customers
        </button>
        <button
          className={`tab-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
          onClick={() => setActiveTab('restaurants')}
        >
          🍽️ Restaurants
        </button>
        <button
          className={`tab-btn ${activeTab === 'donations' ? 'active' : ''}`}
          onClick={() => setActiveTab('donations')}
        >
          💝 Donations
        </button>
      </div>

      <div className="analytics-content">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default AdminDashboard;