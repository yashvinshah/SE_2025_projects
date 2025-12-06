import { api } from './api';

export interface SubscriptionPreferences {
  cuisines?: string[];
  dietaryRestrictions?: string[];
  budget?: string;
}

export interface MealPlanItem {
  day: string;
  restaurantId: string;
  restaurantName: string;
  items: any[];
}

export interface Subscription {
  id: string;
  customerId: string;
  planType: 'weekly' | 'biweekly' | 'monthly';
  preferences: SubscriptionPreferences;
  mealPlan: MealPlanItem[];
  active: boolean;
  startDate: Date;
  nextDeliveryDate?: Date;
  promoAlerts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const subscriptionApi = {
  // Get customer's subscription
  getSubscription: async (customerId: string) => {
    const response = await api.get(`/subscriptions/${customerId}`);
    return response.data.subscription;
  },

  // Create a new subscription
  createSubscription: async (data: {
    customerId: string;
    planType: 'weekly' | 'biweekly' | 'monthly';
    preferences?: SubscriptionPreferences;
    promoAlerts?: boolean;
  }) => {
    const response = await api.post('/subscriptions', data);
    return response.data.subscription;
  },

  // Update subscription preferences
  updateSubscription: async (
    customerId: string,
    data: {
      planType?: 'weekly' | 'biweekly' | 'monthly';
      preferences?: SubscriptionPreferences;
      promoAlerts?: boolean;
    }
  ) => {
    const response = await api.put(`/subscriptions/${customerId}`, data);
    return response.data.subscription;
  },

  // Update meal plan
  updateMealPlan: async (customerId: string, mealPlan: MealPlanItem[]) => {
    const response = await api.put(`/subscriptions/${customerId}/meal-plan`, { mealPlan });
    return response.data.subscription;
  },

  // Toggle subscription active status
  toggleSubscription: async (customerId: string) => {
    const response = await api.patch(`/subscriptions/${customerId}/toggle`);
    return response.data.subscription;
  },

  // Delete subscription
  deleteSubscription: async (customerId: string) => {
    const response = await api.delete(`/subscriptions/${customerId}`);
    return response.data;
  }
};

