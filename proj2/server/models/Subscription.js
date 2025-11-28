const { db } = require('../config/firebase');

class Subscription {
  constructor(data) {
    this.id = data.id;
    this.customerId = data.customerId;
    this.planType = data.planType; // 'weekly', 'biweekly', 'monthly'
    this.preferences = data.preferences || {}; // { cuisines: [], dietaryRestrictions: [], budget: '' }
    this.mealPlan = data.mealPlan || []; // Array of meals for the week
    this.active = data.active !== undefined ? data.active : true;
    this.startDate = data.startDate || new Date();
    this.nextDeliveryDate = data.nextDeliveryDate;
    this.promoAlerts = data.promoAlerts !== undefined ? data.promoAlerts : true; // Subscribe to promo alerts
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new subscription
  static async create(subscriptionData) {
    try {
      const subscriptionRef = db.collection('subscriptions').doc();
      const subscriptionDoc = {
        id: subscriptionRef.id,
        ...subscriptionData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await subscriptionRef.set(subscriptionDoc);
      return new Subscription(subscriptionDoc);
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  // Get subscription by customer ID
  static async findByCustomerId(customerId) {
    try {
      const subscriptionSnapshot = await db.collection('subscriptions')
        .where('customerId', '==', customerId)
        .get();
      
      if (subscriptionSnapshot.empty) {
        return null;
      }
      
      // Return the most recent subscription
      const subscriptions = subscriptionSnapshot.docs.map(doc => 
        new Subscription({ id: doc.id, ...doc.data() })
      );
      
      // Sort by createdAt descending and return the first one
      subscriptions.sort((a, b) => b.createdAt - a.createdAt);
      return subscriptions[0];
    } catch (error) {
      throw new Error(`Failed to find subscription: ${error.message}`);
    }
  }

  // Get all active subscriptions
  static async findAllActive() {
    try {
      const subscriptionSnapshot = await db.collection('subscriptions')
        .where('active', '==', true)
        .get();
      
      return subscriptionSnapshot.docs.map(doc => 
        new Subscription({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw new Error(`Failed to find active subscriptions: ${error.message}`);
    }
  }

  // Update subscription
  async update(updateData) {
    try {
      const subscriptionRef = db.collection('subscriptions').doc(this.id);
      const updatePayload = {
        ...updateData,
        updatedAt: new Date()
      };
      
      await subscriptionRef.update(updatePayload);
      
      // Update local instance
      Object.assign(this, updatePayload);
      return this;
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  // Update meal plan
  async updateMealPlan(mealPlan) {
    try {
      const subscriptionRef = db.collection('subscriptions').doc(this.id);
      await subscriptionRef.update({
        mealPlan: mealPlan,
        updatedAt: new Date()
      });

      this.mealPlan = mealPlan;
      this.updatedAt = new Date();
      return this;
    } catch (error) {
      throw new Error(`Failed to update meal plan: ${error.message}`);
    }
  }

  // Toggle active status
  async toggleActive() {
    try {
      const newStatus = !this.active;
      const subscriptionRef = db.collection('subscriptions').doc(this.id);
      await subscriptionRef.update({
        active: newStatus,
        updatedAt: new Date()
      });

      this.active = newStatus;
      this.updatedAt = new Date();
      return this;
    } catch (error) {
      throw new Error(`Failed to toggle subscription status: ${error.message}`);
    }
  }

  // Delete subscription
  async delete() {
    try {
      await db.collection('subscriptions').doc(this.id).delete();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete subscription: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      customerId: this.customerId,
      planType: this.planType,
      preferences: this.preferences,
      mealPlan: this.mealPlan,
      active: this.active,
      startDate: this.startDate,
      nextDeliveryDate: this.nextDeliveryDate,
      promoAlerts: this.promoAlerts,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Subscription;

