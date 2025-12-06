import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi, WishlistItem } from '../../services/wishlist-api';
import './Wishlist.css';

const Wishlist: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'all' | 'restaurant' | 'menuItem'>('all');

  // Fetch wishlist
  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: () => wishlistApi.getWishlist(user!.id),
    enabled: !!user?.id
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: ({ itemId, type }: { itemId: string; type: 'restaurant' | 'menuItem' }) =>
      wishlistApi.removeItem(user!.id, itemId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
    }
  });

  // Clear wishlist mutation
  const clearWishlistMutation = useMutation({
    mutationFn: () => wishlistApi.clearWishlist(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
    }
  });

  const handleRemoveItem = (itemId: string, type: 'restaurant' | 'menuItem') => {
    if (window.confirm('Remove this item from your wishlist?')) {
      removeItemMutation.mutate({ itemId, type });
    }
  };

  const handleClearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      clearWishlistMutation.mutate();
    }
  };

  const filteredItems = wishlist?.items?.filter((item: WishlistItem) => 
    filterType === 'all' ? true : item.type === filterType
  ) || [];

  if (isLoading) {
    return (
      <div className="wishlist-container">
        <div className="loading">Loading your wishlist...</div>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <div className="header-content">
          <h2>❤️ My Wishlist</h2>
          <p className="wishlist-subtitle">Your saved favorites and must-try items</p>
        </div>
        {wishlist?.items?.length > 0 && (
          <button 
            className="clear-btn"
            onClick={handleClearWishlist}
            disabled={clearWishlistMutation.isPending}
          >
            🗑️ Clear All
          </button>
        )}
      </div>

      <div className="wishlist-filters">
        <button 
          className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All ({wishlist?.items?.length || 0})
        </button>
        <button 
          className={`filter-btn ${filterType === 'restaurant' ? 'active' : ''}`}
          onClick={() => setFilterType('restaurant')}
        >
          🏪 Restaurants ({wishlist?.items?.filter((i: WishlistItem) => i.type === 'restaurant').length || 0})
        </button>
        <button 
          className={`filter-btn ${filterType === 'menuItem' ? 'active' : ''}`}
          onClick={() => setFilterType('menuItem')}
        >
          🍽️ Menu Items ({wishlist?.items?.filter((i: WishlistItem) => i.type === 'menuItem').length || 0})
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-wishlist">
          <div className="empty-icon">💝</div>
          <h3>Your wishlist is empty</h3>
          <p>Start adding your favorite restaurants and dishes!</p>
        </div>
      ) : (
        <div className="wishlist-grid">
          {filteredItems.map((item: WishlistItem) => (
            <div key={`${item.type}-${item.itemId}`} className="wishlist-card">
              <div className="card-header">
                <span className="item-type-badge">
                  {item.type === 'restaurant' ? '🏪 Restaurant' : '🍽️ Menu Item'}
                </span>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item.itemId, item.type)}
                  disabled={removeItemMutation.isPending}
                  title="Remove from wishlist"
                >
                  ✕
                </button>
              </div>
              
              <div className="card-content">
                <h3 className="item-name">{item.name}</h3>
                
                {item.details && (
                  <div className="item-details">
                    {item.details.cuisine && (
                      <span className="detail-tag">🍴 {item.details.cuisine}</span>
                    )}
                    {item.details.price && (
                      <span className="detail-tag">💰 ${item.details.price}</span>
                    )}
                    {item.details.rating && (
                      <span className="detail-tag">⭐ {item.details.rating}</span>
                    )}
                    {item.details.description && (
                      <p className="item-description">{item.details.description}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="card-footer">
                <span className="added-date">
                  Added: {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;

