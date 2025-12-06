import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { wishlistApi } from '../../services/wishlist-api';
import './RestaurantList.css';

const RestaurantList: React.FC = () => {
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const response = await api.get('/customer/restaurants');
      return response.data.restaurants;
    },
  });

  // Fetch ratings for selected restaurant
  const { data: restaurantRatings, isLoading: ratingsLoading } = useQuery({
    queryKey: ['ratings', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant?.id) return null;
      const response = await api.get(`/ratings/restaurant/${selectedRestaurant.id}`);
      return response.data;
    },
    enabled: !!selectedRestaurant
  });

  // Fetch rating statistics
  const { data: ratingStats } = useQuery({
    queryKey: ['rating-stats', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant?.id) return null;
      const response = await api.get(`/ratings/restaurant/${selectedRestaurant.id}/stats`);
      return response.data;
    },
    enabled: !!selectedRestaurant
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: (item: any) => wishlistApi.addItem(user!.id, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
      alert('Added to wishlist! ❤️');
    },
    onError: () => {
      alert('Failed to add to wishlist. Please try again.');
    }
  });

  // Handle restaurant parameter from URL
  useEffect(() => {
    const restaurantId = searchParams.get('restaurant');
    if (restaurantId && restaurants) {
      const restaurant = restaurants.find((r: any) => r.id === restaurantId);
      if (restaurant) {
        setSelectedRestaurant(restaurant);
      }
    }
  }, [searchParams, restaurants]);

  const handleAddToCart = (menuItem: any) => {
    addItem({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      restaurantId: selectedRestaurant.id,
      restaurantName: selectedRestaurant.name
    });
  };

  const handleAddRestaurantToWishlist = (restaurant: any) => {
    addToWishlistMutation.mutate({
      type: 'restaurant',
      itemId: restaurant.id,
      name: restaurant.name,
      details: {
        cuisine: restaurant.cuisine,
        rating: restaurant.rating,
        description: restaurant.description
      }
    });
  };

  const handleAddMenuItemToWishlist = (menuItem: any) => {
    addToWishlistMutation.mutate({
      type: 'menuItem',
      itemId: menuItem.id,
      name: menuItem.name,
      details: {
        price: menuItem.price,
        description: menuItem.description,
        restaurantName: selectedRestaurant.name
      }
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🍽️</div>
        <p>Loading restaurants...</p>
      </div>
    );
  }

  return (
    <div className="restaurant-list">
      <h1>Restaurants</h1>
      
      {!selectedRestaurant ? (
        <div className="restaurants-grid">
          {restaurants?.map((restaurant: any) => (
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
                {restaurant.totalRatings > 0 && (
                  <span className="rating-count">({restaurant.totalRatings} reviews)</span>
                )}
                <span className="delivery-time">{restaurant.deliveryTime}</span>
              </div>
              <p className="restaurant-description">
                {restaurant.description || 'Delicious food awaits you!'}
              </p>
              <div className="restaurant-actions">
                <button 
                  onClick={() => setSelectedRestaurant(restaurant)}
                  className="btn btn-primary"
                >
                  View Menu
                </button>
                <button 
                  onClick={() => handleAddRestaurantToWishlist(restaurant)}
                  className="btn btn-wishlist"
                  title="Add to wishlist"
                  disabled={addToWishlistMutation.isPending}
                >
                  ❤️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="menu-view">
          <div className="menu-header">
            <button 
              onClick={() => setSelectedRestaurant(null)}
              className="back-btn"
            >
              ← Back to Restaurants
            </button>
            <div className="restaurant-info">
              <h2>{selectedRestaurant.name}</h2>
              {selectedRestaurant.isLocalLegend && (
                <span className="local-legend-badge">🏆 Local Legend - Extra Points!</span>
              )}
              {ratingStats && (
                <div className="rating-summary">
                  <span className="rating-stars">⭐ {ratingStats.averageRating}</span>
                  <span className="rating-count">({ratingStats.totalRatings} reviews)</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="menu-items">
            <h3>Menu</h3>
            {selectedRestaurant.menu?.map((item: any) => (
              <div key={item.id} className="menu-item">
                <div className="menu-item-info">
                  <h4>{item.name}</h4>
                  <p>{item.description}</p>
                  <span className="price">${item.price}</span>
                </div>
                <div className="menu-item-actions">
                  <button 
                    onClick={() => handleAddToCart(item)}
                    className="btn btn-primary"
                  >
                    Add to Cart
                  </button>
                  <button 
                    onClick={() => handleAddMenuItemToWishlist(item)}
                    className="btn btn-wishlist"
                    title="Add to wishlist"
                    disabled={addToWishlistMutation.isPending}
                  >
                    ❤️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Ratings Section */}
          <div className="restaurant-ratings-section">
            <h3>Customer Reviews</h3>
            
            {ratingStats && ratingStats.totalRatings > 0 && (
              <div className="rating-stats">
                <div className="rating-overview">
                  <div className="average-rating">
                    <span className="rating-number">{ratingStats.averageRating}</span>
                    <div className="rating-stars">
                      {'⭐'.repeat(Math.round(ratingStats.averageRating))}
                    </div>
                    <span className="total-reviews">{ratingStats.totalRatings} reviews</span>
                  </div>
                  
                  <div className="rating-distribution">
                    {[5, 4, 3, 2, 1].map(star => (
                      <div key={star} className="distribution-bar">
                        <span className="star-label">{star} ⭐</span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ 
                              width: `${ratingStats.totalRatings > 0 
                                ? (ratingStats.ratingDistribution[star] / ratingStats.totalRatings * 100) 
                                : 0}%` 
                            }}
                          />
                        </div>
                        <span className="count">{ratingStats.ratingDistribution[star]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {ratingsLoading ? (
              <div className="ratings-loading">Loading reviews...</div>
            ) : restaurantRatings && restaurantRatings.ratings.length > 0 ? (
              <div className="ratings-list">
                {restaurantRatings.ratings.map((rating: any) => (
                  <div key={rating.orderId} className="rating-card">
                    <div className="rating-header">
                      <div className="rating-stars">
                        {'⭐'.repeat(rating.rating)}
                      </div>
                      <small className="rating-date">
                        {new Date(rating.ratedAt?.toDate?.() || rating.ratedAt).toLocaleDateString()}
                      </small>
                    </div>
                    {rating.review && (
                      <p className="rating-review">{rating.review}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-ratings">
                <p>No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantList;