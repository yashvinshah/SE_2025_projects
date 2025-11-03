const { db } = require('../config/firebase');

class Order {
  constructor(data) {
    this.id = data.id;
    this.customerId = data.customerId;
    this.restaurantId = data.restaurantId;
    this.deliveryPartnerId = data.deliveryPartnerId || null;
    this.items = data.items; // Array of {menuItemId, quantity, price}
    this.totalAmount = data.totalAmount;
    this.status = data.status; // 'pending', 'accepted', 'rejected', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'
    this.deliveryAddress = data.deliveryAddress;
    this.specialInstructions = data.specialInstructions || '';
    this.paymentMethod = data.paymentMethod || 'cash_on_delivery';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.deliveredAt = data.deliveredAt || null;
    this.ratings = data.ratings || {}; // {customer: {restaurant: 5, delivery: 4}, restaurant: {customer: 4}}
  }

  // Create a new order
  static async create(orderData) {
    try {
      const orderRef = db.collection('orders').doc();
      const orderDoc = {
        id: orderRef.id,
        ...orderData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await orderRef.set(orderDoc);
      return new Order(orderDoc);
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  // Get order by ID
  static async findById(id) {
    try {
      const orderDoc = await db.collection('orders').doc(id).get();
      if (!orderDoc.exists) {
        return null;
      }
      return new Order({ id: orderDoc.id, ...orderDoc.data() });
    } catch (error) {
      throw new Error(`Failed to find order: ${error.message}`);
    }
  }

  // Get orders by customer ID
  static async findByCustomerId(customerId) {
    try {
      const ordersSnapshot = await db.collection('orders')
        .where('customerId', '==', customerId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return ordersSnapshot.docs.map(doc => 
        new Order({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw new Error(`Failed to find orders by customer: ${error.message}`);
    }
  }

  // Get orders by restaurant ID
  static async findByRestaurantId(restaurantId) {
    try {
      const ordersSnapshot = await db.collection('orders')
        .where('restaurantId', '==', restaurantId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return ordersSnapshot.docs.map(doc => 
        new Order({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw new Error(`Failed to find orders by restaurant: ${error.message}`);
    }
  }

  // Get orders by delivery partner ID
  static async findByDeliveryPartnerId(deliveryPartnerId) {
    try {
      const ordersSnapshot = await db.collection('orders')
        .where('deliveryPartnerId', '==', deliveryPartnerId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return ordersSnapshot.docs.map(doc => 
        new Order({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw new Error(`Failed to find orders by delivery partner: ${error.message}`);
    }
  }

  // Update order status
  async updateStatus(newStatus) {
    try {
      const orderRef = db.collection('orders').doc(this.id);
      const updateData = {
        status: newStatus,
        updatedAt: new Date()
      };

      if (newStatus === 'delivered') {
        updateData.deliveredAt = new Date();
      }

      await orderRef.update(updateData);
      
      // Update local instance
      this.status = newStatus;
      this.updatedAt = updateData.updatedAt;
      if (newStatus === 'delivered') {
        this.deliveredAt = updateData.deliveredAt;
      }
      
      return this;
    } catch (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  // Assign delivery partner
  async assignDeliveryPartner(deliveryPartnerId) {
    try {
      const orderRef = db.collection('orders').doc(this.id);
      await orderRef.update({
        deliveryPartnerId,
        updatedAt: new Date()
      });
      
      this.deliveryPartnerId = deliveryPartnerId;
      this.updatedAt = new Date();
      
      return this;
    } catch (error) {
      throw new Error(`Failed to assign delivery partner: ${error.message}`);
    }
  }

  // Add rating
  async addRating(raterRole, ratingData) {
    try {
      const orderRef = db.collection('orders').doc(this.id);
      const currentRatings = this.ratings || {};
      
      if (!currentRatings[raterRole]) {
        currentRatings[raterRole] = {};
      }
      
      currentRatings[raterRole] = { ...currentRatings[raterRole], ...ratingData };
      
      await orderRef.update({
        ratings: currentRatings,
        updatedAt: new Date()
      });
      
      this.ratings = currentRatings;
      this.updatedAt = new Date();
      
      return this;
    } catch (error) {
      throw new Error(`Failed to add rating: ${error.message}`);
    }
  }

  // Get pending orders for restaurant
  static async getPendingOrders() {
    try {
      const ordersSnapshot = await db.collection('orders')
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'asc')
        .get();
      
      return ordersSnapshot.docs.map(doc => 
        new Order({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw new Error(`Failed to get pending orders: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      customerId: this.customerId,
      restaurantId: this.restaurantId,
      deliveryPartnerId: this.deliveryPartnerId,
      items: this.items,
      totalAmount: this.totalAmount,
      status: this.status,
      deliveryAddress: this.deliveryAddress,
      specialInstructions: this.specialInstructions,
      paymentMethod: this.paymentMethod,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deliveredAt: this.deliveredAt,
      ratings: this.ratings
    };
  }
}

module.exports = Order;
