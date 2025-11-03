import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import DeliveryHome from '../components/delivery/DeliveryHome';
import OrderManagement from '../components/delivery/OrderManagement';
import Profile from '../components/delivery/Profile';
import './Dashboard.css';

const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ['deliveryOrders', user?.id],
    queryFn: async () => {
      const response = await api.get(`/delivery/orders?riderId=${user?.id}`);
      return response.data.orders;
    },
    enabled: !!user
  });

  const activeOrders = orders?.filter((order: any) => 
    ['ready', 'out_for_delivery'].includes(order.status)
  ) || [];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Delivery Dashboard - {user?.profile?.name || 'Delivery Partner'} 🚚</h1>
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">🚚</div>
            <div className="stat-content">
              <div className="stat-number">{activeOrders.length}</div>
              <div className="stat-label">Active Deliveries</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-number">{orders?.length || 0}</div>
              <div className="stat-label">Total Deliveries</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <Routes>
          <Route path="/" element={<DeliveryHome />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
