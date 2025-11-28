// import React, { useState } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { wishlistApi, WishlistItem } from '../../services/wishlist-api';
// import './Wishlist.css';

// const Wishlist: React.FC = () => {
//   const { user } = useAuth();
//   const queryClient = useQueryClient();
//   const [filterType, setFilterType] = useState<'all' | 'restaurant' | 'menuItem'>('all');

//   // Fetch wishlist
//   const { data: wishlist, isLoading } = useQuery({
//     queryKey: ['wishlist', user?.id],
//     queryFn: () => wishlistApi.getWishlist(user!.id),
//     enabled: !!user?.id
//   });

//   // Remove item mutation
//   const removeItemMutation = useMutation({
//     mutationFn: ({ itemId, type }: { itemId: string; type: 'restaurant' | 'menuItem' }) =>
//       wishlistApi.removeItem(user!.id, itemId, type),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
//     }
//   });

//   // Clear wishlist mutation
//   const clearWishlistMutation = useMutation({
//     mutationFn: () => wishlistApi.clearWishlist(user!.id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
//     }
//   });

//   const handleRemoveItem = (itemId: string, type: 'restaurant' | 'menuItem') => {
//     if (window.confirm('Remove this item from your wishlist?')) {
//       removeItemMutation.mutate({ itemId, type });
//     }
//   };

//   const handleClearWishlist = () => {
//     if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
//       clearWishlistMutation.mutate();
//     }
//   };

//   const filteredItems = wishlist?.items?.filter((item: WishlistItem) => 
//     filterType === 'all' ? true : item.type === filterType
//   ) || [];

//   if (isLoading) {
//     return (
//       <div className="wishlist-container">
//         <div className="loading">Loading your wishlist...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="wishlist-container">
//       <div className="wishlist-header">
//         <div className="header-content">
//           <h2>❤️ My Wishlist</h2>
//           <p className="wishlist-subtitle">Your saved favorites and must-try items</p>
//         </div>
//         {wishlist?.items?.length > 0 && (
//           <button 
//             className="clear-btn"
//             onClick={handleClearWishlist}
//             disabled={clearWishlistMutation.isPending}
//           >
//             🗑️ Clear All
//           </button>
//         )}
//       </div>

//       <div className="wishlist-filters">
//         <button 
//           className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
//           onClick={() => setFilterType('all')}
//         >
//           All ({wishlist?.items?.length || 0})
//         </button>
//         <button 
//           className={`filter-btn ${filterType === 'restaurant' ? 'active' : ''}`}
//           onClick={() => setFilterType('restaurant')}
//         >
//           🏪 Restaurants ({wishlist?.items?.filter((i: WishlistItem) => i.type === 'restaurant').length || 0})
//         </button>
//         <button 
//           className={`filter-btn ${filterType === 'menuItem' ? 'active' : ''}`}
//           onClick={() => setFilterType('menuItem')}
//         >
//           🍽️ Menu Items ({wishlist?.items?.filter((i: WishlistItem) => i.type === 'menuItem').length || 0})
//         </button>
//       </div>

//       {filteredItems.length === 0 ? (
//         <div className="empty-wishlist">
//           <div className="empty-icon">💝</div>
//           <h3>Your wishlist is empty</h3>
//           <p>Start adding your favorite restaurants and dishes!</p>
//         </div>
//       ) : (
//         <div className="wishlist-grid">
//           {filteredItems.map((item: WishlistItem) => (
//             <div key={`${item.type}-${item.itemId}`} className="wishlist-card">
//               <div className="card-header">
//                 <span className="item-type-badge">
//                   {item.type === 'restaurant' ? '🏪 Restaurant' : '🍽️ Menu Item'}
//                 </span>
//                 <button
//                   className="remove-btn"
//                   onClick={() => handleRemoveItem(item.itemId, item.type)}
//                   disabled={removeItemMutation.isPending}
//                   title="Remove from wishlist"
//                 >
//                   ✕
//                 </button>
//               </div>
              
//               <div className="card-content">
//                 <h3 className="item-name">{item.name}</h3>
                
//                 {item.details && (
//                   <div className="item-details">
//                     {item.details.cuisine && (
//                       <span className="detail-tag">🍴 {item.details.cuisine}</span>
//                     )}
//                     {item.details.price && (
//                       <span className="detail-tag">💰 ${item.details.price}</span>
//                     )}
//                     {item.details.rating && (
//                       <span className="detail-tag">⭐ {item.details.rating}</span>
//                     )}
//                     {item.details.description && (
//                       <p className="item-description">{item.details.description}</p>
//                     )}
//                   </div>
//                 )}
//               </div>

//               <div className="card-footer">
//                 <span className="added-date">
//                   Added: {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : 'Recently'}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Wishlist;

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi, WishlistItem } from '../../services/wishlist-api';

const Wishlist: React.FC = () => {
  console.log('🎯 WISHLIST COMPONENT RENDERED');
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'all' | 'restaurant' | 'menuItem'>('all');

  console.log('👤 User:', user);

  // Fetch wishlist
  const { data: wishlist, isLoading, error } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      console.log('📡 Fetching wishlist...');
      if (!user?.id) {
        console.log('❌ No user ID');
        return null;
      }
      try {
        const result = await wishlistApi.getWishlist(user.id);
        console.log('✅ Wishlist received:', result);
        return result;
      } catch (err: any) {
        console.error('❌ Wishlist error:', err);
        throw err;
      }
    },
    enabled: !!user?.id,
    retry: 1,
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: ({ itemId, type }: { itemId: string; type: 'restaurant' | 'menuItem' }) =>
      wishlistApi.removeItem(user!.id, itemId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
    },
  });

  // Clear wishlist mutation
  const clearWishlistMutation = useMutation({
    mutationFn: () => wishlistApi.clearWishlist(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
    },
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

  // Safely filter items
  const filteredItems = React.useMemo(() => {
    if (!wishlist?.items || !Array.isArray(wishlist.items)) {
      return [];
    }
    return wishlist.items.filter((item: WishlistItem) => 
      filterType === 'all' ? true : item.type === filterType
    );
  }, [wishlist?.items, filterType]);

  if (isLoading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px' }}>⏳</div>
        <p>Loading your wishlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px' }}>❌</div>
        <h3>Error loading wishlist</h3>
        <p>{(error as any).message}</p>
      </div>
    );
  }

  const totalItems = wishlist?.items?.length || 0;
  const restaurantCount = wishlist?.items?.filter((i: WishlistItem) => i.type === 'restaurant').length || 0;
  const menuItemCount = wishlist?.items?.filter((i: WishlistItem) => i.type === 'menuItem').length || 0;

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '32px' }}>❤️ My Wishlist</h2>
          <p style={{ margin: '10px 0 0 0', color: '#666' }}>Your saved favorites and must-try items</p>
        </div>
        {totalItems > 0 && (
          <button 
            onClick={handleClearWishlist}
            disabled={clearWishlistMutation.isPending}
            style={{
              padding: '12px 24px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🗑️ Clear All
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setFilterType('all')}
          style={{
            padding: '12px 24px',
            background: filterType === 'all' ? '#2196f3' : '#f5f5f5',
            color: filterType === 'all' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          All ({totalItems})
        </button>
        <button 
          onClick={() => setFilterType('restaurant')}
          style={{
            padding: '12px 24px',
            background: filterType === 'restaurant' ? '#2196f3' : '#f5f5f5',
            color: filterType === 'restaurant' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🏪 Restaurants ({restaurantCount})
        </button>
        <button 
          onClick={() => setFilterType('menuItem')}
          style={{
            padding: '12px 24px',
            background: filterType === 'menuItem' ? '#2196f3' : '#f5f5f5',
            color: filterType === 'menuItem' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🍽️ Menu Items ({menuItemCount})
        </button>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>💝</div>
          <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>Your wishlist is empty</h3>
          <p style={{ color: '#666' }}>Start adding your favorite restaurants and dishes!</p>
        </div>
      ) : (
        /* Items Grid */
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {filteredItems.map((item: WishlistItem) => (
            <div 
              key={`${item.type}-${item.itemId}`}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: item.type === 'restaurant' ? '#e3f2fd' : '#fff3e0',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {item.type === 'restaurant' ? '🏪 Restaurant' : '🍽️ Menu Item'}
                </span>
                <button
                  onClick={() => handleRemoveItem(item.itemId, item.type)}
                  disabled={removeItemMutation.isPending}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#f44336',
                    lineHeight: 1
                  }}
                  title="Remove from wishlist"
                >
                  ×
                </button>
              </div>
              
              {/* Card Content */}
              <h3 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>{item.name}</h3>
              
              {item.details && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                  {item.details.cuisine && (
                    <span style={{ 
                      padding: '4px 10px', 
                      background: '#f5f5f5', 
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}>
                      🍴 {item.details.cuisine}
                    </span>
                  )}
                  {item.details.price && (
                    <span style={{ 
                      padding: '4px 10px', 
                      background: '#f5f5f5', 
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}>
                      💰 ${item.details.price}
                    </span>
                  )}
                  {item.details.rating && (
                    <span style={{ 
                      padding: '4px 10px', 
                      background: '#f5f5f5', 
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}>
                      ⭐ {item.details.rating}
                    </span>
                  )}
                </div>
              )}
              
              {item.details?.description && (
                <p style={{ 
                  fontSize: '14px', 
                  color: '#666',
                  lineHeight: '1.5',
                  marginBottom: '15px'
                }}>
                  {item.details.description}
                </p>
              )}

              {/* Card Footer */}
              <div style={{ 
                paddingTop: '15px',
                borderTop: '1px solid #e0e0e0',
                fontSize: '12px',
                color: '#999'
              }}>
                Added: {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : 'Recently'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;