import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import DeliveryMap from "../../components/delivery/DeliveryMap";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { api } from "../../services/api";
import "./Orders.css";

/* -------------------------------
   Interfaces
--------------------------------*/
interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  deliveredAt?: string;
  items: OrderItem[];
  tipAmount?: number;

  customerLocation?: {
    lat: number;
    lng: number;
  };

  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };

  ratings?: {
    customer?: {
      rating: number;
      review?: string;
    };
  };
}

interface RestaurantLocation {
  lat: number;
  lng: number;
}

interface RestaurantData {
  id: string;
  name: string;
  cuisine: string;
  menu: any[];
  location?: RestaurantLocation;
}

/* -------------------------------
   Component
--------------------------------*/
const Orders: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addItem } = useCart();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  /* -------------------------------
     1️⃣ Fetch User Orders
  --------------------------------*/
  const { data: orders, isLoading } = useQuery({
    queryKey: ["customerOrders", user?.id],
    queryFn: async (): Promise<Order[]> => {
      const res = await api.get(`/orders/customer?customerId=${user?.id}`);
      return res.data.orders;
    },
    enabled: !!user,
  });

  /* -------------------------------
     2️⃣ Fetch Restaurants Map + 正規化 location
  --------------------------------*/
  const { data: restaurantMap } = useQuery({
    queryKey: ["restaurantDataMap"],
    queryFn: async () => {
      const res = await api.get("/customer/restaurants");
      const list: any[] = res.data.restaurants;

      const map: Record<string, RestaurantData> = {};
      list.forEach((r: any) => {
        const rawLoc = r.location;
        let normalizedLoc: RestaurantLocation | undefined = undefined;

        if (rawLoc) {
          // 如果 API 已經是 { lat, lng }
          if (
            typeof rawLoc.lat === "number" &&
            typeof rawLoc.lng === "number"
          ) {
            normalizedLoc = { lat: rawLoc.lat, lng: rawLoc.lng };
          }
          // 如果是 { latitude, longitude }，轉成 { lat, lng }
          else if (
            typeof rawLoc.latitude === "number" &&
            typeof rawLoc.longitude === "number"
          ) {
            normalizedLoc = {
              lat: rawLoc.latitude,
              lng: rawLoc.longitude,
            };
          }
        }

        map[r.id] = {
          id: r.id,
          name: r.name,
          cuisine: r.cuisine,
          menu: r.menu ?? [],
          location: normalizedLoc,
        };
      });

      return map;
    },
  });

  /* -------------------------------
     3️⃣ Rating Mutation
  --------------------------------*/
  const rateOrderMutation = useMutation({
    mutationFn: async ({
      orderId,
      rating,
      review,
    }: {
      orderId: string;
      rating: number;
      review: string;
    }) => {
      const response = await api.post(`/orders/${orderId}/rate`, {
        rating,
        review,
        customerId: user?.id,
      });
      return response.data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      if (user?.id) {
        try {
          console.log('[Orders] triggering badge recompute after review');
          await api.post('/badges/update', { customerId: user.id });
          await queryClient.invalidateQueries({ queryKey: ['customerBadges', user.id] });
        } catch (error) {
          console.error('[Orders] failed to refresh badges after review', error);
        }
      }
      setShowRatingModal(false);
      setRatingOrder(null);
      setRating(5);
      setReview("");
      alert("Rating submitted successfully!");
    },
    onError: (error: any) => {
      alert(
        "Failed to submit rating: " +
          (error.response?.data?.error || "Unknown error")
      );
    },
  });

  /* -------------------------------
     Loading
  --------------------------------*/
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">📦</div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  /* -------------------------------
     Active / Completed Orders
  --------------------------------*/
  const activeOrders =
    orders?.filter((o) =>
      [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
      ].includes(o.status)
    ) || [];

  const completedOrders =
    orders?.filter((o) => ["delivered", "cancelled"].includes(o.status)) || [];

  /* -------------------------------
     Handlers
  --------------------------------*/
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((it) => {
      addItem({
        id: it.menuItemId,
        name: it.name,
        price: it.price,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
      });
    });
  };

  const handleRateOrder = (order: Order) => {
    setRatingOrder(order);
    setShowRatingModal(true);
  };

  const submitRating = () => {
    if (!ratingOrder) return;
    rateOrderMutation.mutate({
      orderId: ratingOrder.id,
      rating,
      review,
    });
  };

  /* -------------------------------
     Debug Map Coordinates (安全版)
  --------------------------------*/
  if (selectedOrder && restaurantMap) {
    const restaurantLoc =
      restaurantMap[selectedOrder.restaurantId]?.location ?? null;
    const customerLoc = user?.profile?.location ?? null;
    console.log("DEBUG order restaurantId:", selectedOrder.restaurantId);
    console.log("DEBUG restaurantMap keys:", Object.keys(restaurantMap));
    console.log("DEBUG MAP COORDS:", {
      restaurantLoc,
      customerLoc,
    });
  }

  /* -------------------------------
     JSX
  --------------------------------*/
  return (
    <div className="orders">
      <h1>Your Orders</h1>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="orders-section">
          <h2>Active Orders ({activeOrders.length})</h2>
          <div className="orders-list">
            {activeOrders.map((order) => (
              <div key={order.id} className="order-card active">
                <div className="order-header">
                  <h3>Order #{order.id.slice(-6)}</h3>
                  <span className={`status status-${order.status}`}>
                    {order.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div className="order-details">
                  <p>
                    <strong>Total:</strong> ${order.totalAmount.toFixed(2)}
                  </p>
                  <p>
                    <strong>Tips:</strong> ${(order.tipAmount || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Items:</strong> {order.items.length}
                  </p>
                  <p>
                    <strong>Ordered:</strong>{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="order-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleViewDetails(order)}
                  >
                    View Details
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={() => handleReorder(order)}
                  >
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div className="orders-section">
          <h2>Order History ({completedOrders.length})</h2>
          <div className="orders-list">
            {completedOrders.map((order) => (
              <div
                key={order.id}
                className={`order-card ${
                  order.status === "cancelled" ? "cancelled" : "completed"
                }`}
              >
                <div className="order-header">
                  <h3>Order #{order.id.slice(-6)}</h3>
                  <span className={`status status-${order.status}`}>
                    {order.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className="order-details">
                  <p>
                    <strong>Total:</strong> ${order.totalAmount.toFixed(2)}
                  </p>
                  <p>
                    <strong>Items:</strong> {order.items.length}
                  </p>
                  <p>
                    <strong>Ordered:</strong>{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>

                  {order.deliveredAt && (
                    <p>
                      <strong>Delivered:</strong>{" "}
                      {new Date(order.deliveredAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="order-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleReorder(order)}
                  >
                    Reorder
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleViewDetails(order)}
                  >
                    View Details
                  </button>

                  {order.status === "delivered" && !order.ratings?.customer && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleRateOrder(order)}
                    >
                      Rate Order
                    </button>
                  )}

                  {order.status === "delivered" && order.ratings?.customer && (
                    <div className="rating-display">
                      <span className="rating-stars">
                        {"★".repeat(order.ratings.customer.rating)}
                        {"☆".repeat(5 - order.ratings.customer.rating)}
                      </span>
                      <span className="rating-text">Rated</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="no-orders">
          <div className="no-orders-icon">📦</div>
          <h2>No orders yet</h2>
          <p>Start your food adventure by placing your first order!</p>
        </div>
      )}

      {/* ------------------------------ */}
      {/* 🔥 ORDER DETAILS MODAL + MAP  */}
      {/* ------------------------------ */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={closeOrderDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details #{selectedOrder.id.slice(-6)}</h2>
              <button className="close-btn" onClick={closeOrderDetails}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="order-info">
                {/* Order Info */}
                <div className="info-section">
                  <h3>Order Information</h3>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className={`status status-${selectedOrder.status}`}>
                      {selectedOrder.status.replace("_", " ").toUpperCase()}
                    </span>
                  </p>
                  <p>
                    <strong>Subtotal:</strong> $
                    {selectedOrder.totalAmount.toFixed(2)}
                  </p>

                  {/* DISPLAY TIP AMOUNT */}
                  {(selectedOrder.tipAmount ?? 0) > 0 && (
                    <p>
                      <strong>Tip:</strong> $
                      {(selectedOrder.tipAmount ?? 0).toFixed(2)}
                    </p>
                  )}
                  {/* DISPLAY GRAND TOTAL */}
                  <p>
                    <strong>Total Paid:</strong> $
                    {(
                      selectedOrder.totalAmount + (selectedOrder.tipAmount || 0)
                    ).toFixed(2)}
                  </p>

                  <p>
                    <strong>Ordered:</strong>{" "}
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                  {/* <div className="info-section">
                  <h3>Order Information</h3>
                  <p><strong>Status:</strong> <span className={`status status-${selectedOrder.status}`}>
                    {selectedOrder.status.replace('_', ' ').toUpperCase()}
                  </span></p>
                  <p><strong>Total Amount:</strong> ${selectedOrder.totalAmount.toFixed(2)}</p>
                  <p><strong>Ordered:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p> */}
                  {selectedOrder.deliveredAt && (
                    <p>
                      <strong>Delivered:</strong>{" "}
                      {new Date(selectedOrder.deliveredAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Order Items */}
                <div className="info-section">
                  <h3>Items Ordered</h3>
                  <div className="items-list">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span className="item-quantity">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                        <span className="item-price">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address */}
                {selectedOrder.deliveryAddress && (
                  <div className="info-section">
                    <h3>Delivery Address</h3>
                    <p>
                      {selectedOrder.deliveryAddress.street}
                      <br />
                      {selectedOrder.deliveryAddress.city},{" "}
                      {selectedOrder.deliveryAddress.state}{" "}
                      {selectedOrder.deliveryAddress.zipCode}
                    </p>
                  </div>
                )}

                {/* Delivery Simulation */}
                {restaurantMap &&
                  restaurantMap[selectedOrder.restaurantId] &&
                  restaurantMap[selectedOrder.restaurantId].location &&
                  user?.profile?.location && (
                    <div className="info-section">
                      <h3>Delivery Simulation</h3>

                      <DeliveryMap
                        restaurant={{
                          lat: restaurantMap[selectedOrder.restaurantId]
                            .location!.lat,
                          lng: restaurantMap[selectedOrder.restaurantId]
                            .location!.lng,
                        }}
                        customer={{
                          lat: user.profile.location.lat,
                          lng: user.profile.location.lng,
                        }}
                        onDelivered={() =>
                          console.log("Delivery animation completed!")
                        }
                      />
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && ratingOrder && (
        <div
          className="modal-overlay"
          onClick={() => setShowRatingModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rate Your Order #{ratingOrder.id.slice(-6)}</h2>
              <button
                className="close-btn"
                onClick={() => setShowRatingModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="rating-form">
                <label>Rating:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star ${star <= rating ? "active" : ""}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <label>Review (optional):</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                />

                <div className="modal-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowRatingModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={submitRating}
                    disabled={rateOrderMutation.isPending}
                  >
                    {rateOrderMutation.isPending
                      ? "Submitting..."
                      : "Submit Rating"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
