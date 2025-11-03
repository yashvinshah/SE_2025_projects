import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import './RestaurantHome.css';

const RestaurantHome: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ['restaurantOrders', user?.id],
    queryFn: async () => {
      const response = await api.get(`/orders/restaurant?restaurantId=${user?.id}`);
      return response.data.orders;
    },
    enabled: !!user
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantOrders'] });
    }
  });

  const handleAcceptOrder = (orderId: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: 'confirmed' });
  };

  const handleRejectOrder = (orderId: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: 'cancelled' });
  };

  const pendingOrders = orders?.filter((order: any) => order.status === 'pending') || [];

  return (
    <div className="restaurant-home">
      <div className="welcome-section">
        <h2>Welcome to your restaurant dashboard! 🍽️</h2>
        <p>Manage your orders, update your menu, and grow your business.</p>
      </div>

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{pendingOrders?.length || 0}</div>
            <div className="stat-label">Pending Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-number">4.8</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>
      </div>

      {pendingOrders && pendingOrders.length > 0 && (
        <div className="pending-orders">
          <h3>Recent Pending Orders</h3>
          <div className="orders-list">
            {pendingOrders.slice(0, 3).map((order: any) => (
              <div key={order.id} className="order-card">
                <div className="order-info">
                  <h4>Order #{order.id.slice(-6)}</h4>
                  <p>Total: ${order.totalAmount}</p>
                  <p>Items: {order.items.length}</p>
                </div>
                <div className="order-actions">
                  <button 
                    className="btn btn-success"
                    onClick={() => handleAcceptOrder(order.id)}
                    disabled={updateOrderStatusMutation.isPending}
                  >
                    Accept
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleRejectOrder(order.id)}
                    disabled={updateOrderStatusMutation.isPending}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantHome;
