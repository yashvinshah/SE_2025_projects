import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import "./RestaurantList.css";

const normalizeLocation = (
  loc: unknown
): { latitude: number; longitude: number } | null => {
  if (!loc || typeof loc !== "object") return null;

  const obj = loc as Record<string, number>;

  // Case 1: { lat, lng }
  if (typeof obj.lat === "number" && typeof obj.lng === "number") {
    return { latitude: obj.lat, longitude: obj.lng };
  }

  // Case 2: { latitude, longitude }
  if (typeof obj.latitude === "number" && typeof obj.longitude === "number") {
    return { latitude: obj.latitude, longitude: obj.longitude };
  }

  // Case 3: Firestore GeoPoint { _latitude, _longitude }
  if (typeof obj._latitude === "number" && typeof obj._longitude === "number") {
    return { latitude: obj._latitude, longitude: obj._longitude };
  }

  return null;
};

// -----------------------
// Distance Calculation (Miles)
// -----------------------
const calculateDistanceMiles = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

interface RestaurantLocation {
  latitude?: number;
  longitude?: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  description?: string;
  rating: number;
  deliveryTime: string;
  isLocalLegend?: boolean;
  menu: MenuItem[];
  location?: RestaurantLocation | null;
  distanceMiles?: string | null;
}

const RestaurantList: React.FC = () => {
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();
  const { user } = useAuth();

  // -------------------------------------------------------
  // Query restaurants
  // -------------------------------------------------------
  const { data: rawRestaurants, isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async (): Promise<Restaurant[]> => {
      const response = await api.get("/customer/restaurants");
      return response.data.restaurants;
    },
  });

  // -------------------------------------------------------
  // Extract user coordinates (lat/lng)
  // -------------------------------------------------------
  const userLat = user?.location
    ? (user.location as { latitude?: number }).latitude ?? null
    : null;

  const userLng = user?.location
    ? (user.location as { longitude?: number }).longitude ?? null
    : null;

  // -------------------------------------------------------
  // Compute restaurant distances
  // -------------------------------------------------------
  const restaurants: Restaurant[] | undefined = useMemo(() => {
    if (!rawRestaurants) return undefined;

    // If user has no saved location → return list without distances
    if (userLat == null || userLng == null) {
      return rawRestaurants.map((r) => ({ ...r, distanceMiles: null }));
    }

    const processed = rawRestaurants.map((r) => {
      const loc = normalizeLocation(r.location);

      if (loc?.latitude != null && loc.longitude != null) {
        const miles = calculateDistanceMiles(
          userLat,
          userLng,
          loc.latitude,
          loc.longitude
        );
        return {
          ...r,
          distanceMiles: miles.toFixed(2),
        };
      }

      return { ...r, distanceMiles: null };
    });

    // Auto-sort by distance if available
    return processed.sort((a, b) => {
      if (a.distanceMiles && b.distanceMiles) {
        return parseFloat(a.distanceMiles) - parseFloat(b.distanceMiles);
      }
      return 0;
    });
  }, [rawRestaurants, userLat, userLng]);

  // -------------------------------------------------------
  // Handle ?restaurant=123 (URL param)
  // -------------------------------------------------------
  useEffect(() => {
    const restaurantId = searchParams.get("restaurant");
    if (restaurantId && restaurants) {
      const found = restaurants.find((r) => r.id === restaurantId);
      if (found) setSelectedRestaurant(found);
    }
  }, [searchParams, restaurants]);

  // -------------------------------------------------------
  // Add to cart
  // -------------------------------------------------------
  const handleAddToCart = (menuItem: MenuItem) => {
    if (!selectedRestaurant) return;

    addItem({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      restaurantId: selectedRestaurant.id,
      restaurantName: selectedRestaurant.name,
    });
  };

  // -------------------------------------------------------
  // Loading UI
  // -------------------------------------------------------
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🍽️</div>
        <p>Loading restaurants...</p>
      </div>
    );
  }

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
  return (
    <div className="restaurant-list">
      <h1>Restaurants</h1>

      {/* No restaurant selected */}
      {!selectedRestaurant ? (
        <div className="restaurants-grid">
          {restaurants?.map((restaurant) => (
            <div key={restaurant.id} className="restaurant-card">
              <div className="restaurant-header">
                <h3>{restaurant.name}</h3>
                {restaurant.isLocalLegend && (
                  <span className="local-legend-badge">🏆 Local Legend</span>
                )}
              </div>

              <p className="restaurant-cuisine">{restaurant.cuisine}</p>

              {restaurant.distanceMiles ? (
                <p>{restaurant.distanceMiles} miles away</p>
              ) : (
                <p>Distance unavailable</p>
              )}

              <div className="restaurant-rating">
                <span className="rating">⭐ {restaurant.rating}</span>
                <span className="delivery-time">{restaurant.deliveryTime}</span>
              </div>

              <p className="restaurant-description">
                {restaurant.description || "Delicious food awaits you!"}
              </p>

              <button
                onClick={() => setSelectedRestaurant(restaurant)}
                className="btn btn-primary"
              >
                View Menu
              </button>
            </div>
          ))}
        </div>
      ) : (
        // Restaurant selected → show menu
        <div className="menu-view">
          <div className="menu-header">
            <button
              onClick={() => setSelectedRestaurant(null)}
              className="back-btn"
            >
              ← Back to Restaurants
            </button>

            <h2>{selectedRestaurant.name}</h2>

            {selectedRestaurant.isLocalLegend && (
              <span className="local-legend-badge">
                🏆 Local Legend - Extra Points!
              </span>
            )}
          </div>

          <div className="menu-items">
            {selectedRestaurant.menu?.map((item) => (
              <div key={item.id} className="menu-item">
                <div className="menu-item-info">
                  <h4>{item.name}</h4>
                  <p>{item.description}</p>
                  <span className="price">${item.price}</span>
                </div>

                <button
                  onClick={() => handleAddToCart(item)}
                  className="btn btn-primary"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantList;
