import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import CustomerBadges from './CustomerBadges';
import './CustomerHome.css';

const CustomerHome: React.FC = () => {
  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const response = await api.get('/customer/restaurants');
      return response.data.restaurants;
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: async () => {
      const response = await api.get('/orders/customer');
      return response.data.orders.slice(0, 3); // Get last 3 orders
    },
  });

  return (
    <div className="customer-home">
      <CustomerBadges />
      <div className="quick-actions">
        <Link to="/customer/restaurants" className="action-card">
          <div className="action-icon">🍽️</div>
          <h3>Browse Restaurants</h3>
          <p>Discover amazing local restaurants</p>
        </Link>
        
        <Link to="/customer/cart" className="action-card">
          <div className="action-icon">🛒</div>
          <h3>View Cart</h3>
          <p>Check your current order</p>
        </Link>
        
        <Link to="/customer/orders" className="action-card">
          <div className="action-icon">📦</div>
          <h3>Order History</h3>
          <p>Track your past orders</p>
        </Link>
      </div>
      
      <div className="featured-restaurants">
        <h2>Featured Restaurants</h2>
        <div className="restaurants-grid">
          {restaurants?.slice(0, 3).map((restaurant: any) => (
            <div key={restaurant.id} className="restaurant-card">
              <div className="restaurant-header">
                <h3>{restaurant.name}</h3>
                {restaurant.isLocalLegend && (
                  <span className="local-legend-badge">🏆 Local Legend</span>
                )}
              </div>
              <p className="restaurant-cuisine">{restaurant.cuisine}</p>
              <div className="restaurant-rating">
                <span className="rating">⭐ {restaurant.rating}</span>
                <span className="delivery-time">{restaurant.deliveryTime}</span>
              </div>
              <Link 
                to={`/customer/restaurants?restaurant=${restaurant.id}`} 
                className="btn btn-primary"
              >
                View Menu
              </Link>
            </div>
          ))}
        </div>
      </div>

      {recentOrders && recentOrders.length > 0 && (
        <div className="recent-orders">
          <h2>Recent Orders</h2>
          <div className="orders-list">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="order-card">
                <div className="order-info">
                  <h4>Order #{order.id.slice(-6)}</h4>
                  <p>Total: ${order.totalAmount}</p>
                  <span className={`status status-${order.status}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="order-actions">
                  <Link to={`/customer/orders/${order.id}`} className="btn btn-secondary">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerHome;
