import { api } from './api';

export interface Promo {
  id: string;
  restaurantId: string;
  restaurantName: string;
  title: string;
  description: string;
  discountPercent: number;
  code: string;
  validFrom: Date;
  validUntil: Date;
  active: boolean;
  targetCuisines: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const promoApi = {
  // Get all active promos
  getActivePromos: async () => {
    const response = await api.get('/promos/active');
    return response.data.promos;
  },

  // Get personalized promos for a customer
  getCustomerPromos: async (customerId: string) => {
    const response = await api.get(`/promos/customer/${customerId}`);
    return response.data.promos;
  },

  // Get promos for a specific restaurant
  getRestaurantPromos: async (restaurantId: string) => {
    const response = await api.get(`/promos/restaurant/${restaurantId}`);
    return response.data.promos;
  }
};

