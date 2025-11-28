import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import './RatingsManagement.css';

const RatingsManagement: React.FC = () => {
  const { user } = useAuth();

  // Fetch rating statistics
  const { data: ratingStats, isLoading: statsLoading } = useQuery({
    queryKey: ['restaurant-rating-stats', user?.id],
    queryFn: async () => {
      const response = await api.get(`/ratings/restaurant/${user?.id}/stats`);
      return response.data;
    },
    enabled: !!user
  });

  // Fetch all ratings
  const { data: ratingsData, isLoading: ratingsLoading } = useQuery({
    queryKey: ['restaurant-ratings', user?.id],
    queryFn: async () => {
      const response = await api.get(`/ratings/restaurant/${user?.id}`);
      return response.data;
    },
    enabled: !!user
  });

  if (statsLoading || ratingsLoading) {
    return (
      <div className="ratings-management">
        <div className="loading-container">
          <div className="loading-spinner">⭐</div>
          <p>Loading ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ratings-management">
      <div className="ratings-header">
        <h2>Customer Ratings & Reviews</h2>
        <p>See what customers are saying about your restaurant</p>
      </div>

      {/* Rating Statistics Overview */}
      {ratingStats && (
        <div className="ratings-overview">
          <div className="overview-card average-rating-card">
            <div className="rating-display">
              <div className="rating-number">{ratingStats.averageRating}</div>
              <div className="rating-stars">
                {'⭐'.repeat(Math.round(ratingStats.averageRating))}
              </div>
              <div className="total-ratings">
                Based on {ratingStats.totalRatings} {ratingStats.totalRatings === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>

          <div className="overview-card distribution-card">
            <h3>Rating Distribution</h3>
            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="distribution-row">
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
                  <span className="count">
                    {ratingStats.ratingDistribution[star]} 
                    ({ratingStats.totalRatings > 0 
                      ? Math.round((ratingStats.ratingDistribution[star] / ratingStats.totalRatings) * 100)
                      : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Individual Reviews */}
      <div className="reviews-section">
        <h3>All Reviews ({ratingsData?.count || 0})</h3>
        
        {ratingsData && ratingsData.ratings.length > 0 ? (
          <div className="reviews-list">
            {ratingsData.ratings.map((rating: any) => (
              <div key={rating.orderId} className="review-card">
                <div className="review-header">
                  <div className="review-rating">
                    <span className="stars">{'⭐'.repeat(rating.rating)}</span>
                    <span className="rating-value">{rating.rating}/5</span>
                  </div>
                  <div className="review-date">
                    {new Date(rating.ratedAt?.toDate?.() || rating.ratedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                
                {rating.review && (
                  <div className="review-text">
                    <p>"{rating.review}"</p>
                  </div>
                )}
                
                <div className="review-footer">
                  <span className="order-id">Order #{rating.orderId.substring(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-reviews">
            <div className="empty-state">
              <span className="empty-icon">📝</span>
              <h4>No reviews yet</h4>
              <p>Your reviews will appear here once customers rate their orders</p>
            </div>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="ratings-tips">
        <h3>💡 Tips to Improve Your Ratings</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">🍔</span>
            <h4>Quality Food</h4>
            <p>Ensure consistent food quality and taste</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">⚡</span>
            <h4>Quick Service</h4>
            <p>Prepare orders promptly and accurately</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">📦</span>
            <h4>Good Packaging</h4>
            <p>Pack food securely to maintain freshness</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">💬</span>
            <h4>Respond to Feedback</h4>
            <p>Address concerns and improve continuously</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingsManagement;