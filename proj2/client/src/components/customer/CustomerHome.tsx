import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import "./CustomerHome.css";

import { useAuth } from "../../contexts/AuthContext";
import LocationPickerMap from "../../components/LocationPickerMap";

const CustomerHome: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const response = await api.get("/customer/restaurants");
      return response.data.restaurants;
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["recentOrders"],
    queryFn: async () => {
      const response = await api.get("/orders/customer");
      return response.data.orders.slice(0, 3); // Get last 3 orders
    },
  });

  // 保險：如果還沒有 user 就先不要 render
  if (!user) {
    return <div className="customer-home">Loading user...</div>;
  }

  // ⭐ 使用者在地圖上選好位置、按下 Set 時要呼叫的 function
  const handleLocationSelected = async (
    lat: number,
    lng: number,
    addr: string
  ) => {
    setSaving(true);
    try {
      await api.put(`/users/${user.id}`, {
        profile: {
          ...user.profile,
          location: { lat, lng },
          address: {
            ...user.profile?.address,
            fullAddress: addr, // 不覆蓋原本 street/city/state/zip，只是多存一個字串
          },
        },
      });

      await refreshUser();
    } catch (err) {
      console.error("Failed to update location:", err);
      alert("Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="customer-home">
      {/* ⭐⭐ 這一塊是「顯示目前地址 + 按鈕打開 map」 ⭐⭐ */}
      <section className="user-location-section">
        <div className="user-location-header">
          <span>
            📍 Current address:{" "}
            {user.profile?.address?.fullAddress ||
              "No address set. Click the button to set one."}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setShowLocationPicker((prev) => !prev)}
          >
            {showLocationPicker
              ? "Close map"
              : user.profile?.address?.fullAddress
              ? "Change address"
              : "Set address"}
          </button>
        </div>

        {showLocationPicker && (
          <div className="user-location-map-wrapper">
            <LocationPickerMap
              // 如果你有把 Firestore 的 GeoPoint 回傳到 user.location
              defaultLat={user.location?.latitude}
              defaultLng={user.location?.longitude}
              defaultAddress={user.profile?.address?.fullAddress}
              onLocationSelected={handleLocationSelected}
            />
            {saving && <p>Saving your location...</p>}
          </div>
        )}
      </section>

      {/* 原本的 quick actions */}
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

      {/* Featured restaurants */}
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

      {/* Recent orders */}
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
                    {order.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div className="order-actions">
                  <Link
                    to={`/customer/orders/${order.id}`}
                    className="btn btn-secondary"
                  >
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
