import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import RestaurantHome from '../components/restaurant/RestaurantHome';
import OrderManagement from '../components/restaurant/OrderManagement';
import MenuManagement from '../components/restaurant/MenuManagement';
import Profile from '../components/restaurant/Profile';
import PromoManagement from '../components/restaurant/PromoManagement';
import RatingsManagement from '../components/restaurant/RatingsManagement';
import './Dashboard.css';

const RestaurantDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ['restaurantOrders', user?.id],
    queryFn: async () => {
      const response = await api.get(`/orders/restaurant?restaurantId=${user?.id}`);
      return response.data.orders;
    },
    enabled: !!user
  });

  // Fetch rating stats for the header
  const { data: ratingStats } = useQuery({
    queryKey: ['restaurant-rating-stats', user?.id],
    queryFn: async () => {
      const response = await api.get(`/ratings/restaurant/${user?.id}/stats`);
      return response.data;
    },
    enabled: !!user
  });

  // Calculate pending orders from the main orders data
  const pendingOrders = orders?.filter((order: any) => order.status === 'pending') || [];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Restaurant Dashboard - {user?.profile?.name || 'Restaurant'} 🍽️</h1>
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-number">{pendingOrders.length}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-number">{orders?.length || 0}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>
          <div className="stat-card stat-card-rating">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-number">
                {ratingStats?.averageRating || '0.0'}
              </div>
              <div className="stat-label">
                Average Rating ({ratingStats?.totalRatings || 0} reviews)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <Routes>
          <Route path="/" element={<RestaurantHome />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/menu" element={<MenuManagement />} />
          <Route path="/ratings" element={<RatingsManagement />} />
          <Route path="/promos" element={<PromoManagement />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
