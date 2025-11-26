import { api } from './api';

export interface WishlistItem {
  type: 'restaurant' | 'menuItem';
  itemId: string;
  name: string;
  details?: any;
  addedAt?: Date;
}

export interface Wishlist {
  id: string;
  customerId: string;
  items: WishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export const wishlistApi = {
  // Get customer's wishlist
  getWishlist: async (customerId: string) => {
    const response = await api.get(`/wishlist/${customerId}`);
    return response.data.wishlist;
  },

  // Add item to wishlist
  addItem: async (customerId: string, item: WishlistItem) => {
    const response = await api.post(`/wishlist/${customerId}/add`, item);
    return response.data.wishlist;
  },

  // Remove item from wishlist
  removeItem: async (customerId: string, itemId: string, type: 'restaurant' | 'menuItem') => {
    const response = await api.delete(`/wishlist/${customerId}/remove`, {
      data: { itemId, type }
    });
    return response.data.wishlist;
  },

  // Clear entire wishlist
  clearWishlist: async (customerId: string) => {
    const response = await api.delete(`/wishlist/${customerId}/clear`);
    return response.data.wishlist;
  }
};

