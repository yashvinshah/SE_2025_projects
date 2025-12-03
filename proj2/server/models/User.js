const { db } = require('../config/firebase');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role; // 'customer', 'restaurant', 'delivery'
    this.profile = data.profile;
    this.deliveryStatus = data.deliveryStatus || (data.role === 'delivery' ? 'free' : null); // 'free', 'busy'
    this.totalEarnings = data.totalEarnings || 0; 
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new user
  static async create(userData) {
    try {
      const userRef = db.collection('users').doc();
      const userDoc = {
        id: userRef.id,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await userRef.set(userDoc);
      return new User(userDoc);
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Get user by ID
  static async findById(id) {
    try {
      const userDoc = await db.collection('users').doc(id).get();
      if (!userDoc.exists) {
        return null;
      }
      return new User({ id: userDoc.id, ...userDoc.data() });
    } catch (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  // Get user by email
  static async findByEmail(email) {
    try {
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (usersSnapshot.empty) {
        return null;
      }
      
      const userDoc = usersSnapshot.docs[0];
      return new User({ id: userDoc.id, ...userDoc.data() });
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  // Update user
  async update(updateData) {
    try {
      const userRef = db.collection('users').doc(this.id);
      const updatePayload = {
        ...updateData,
        updatedAt: new Date()
      };
      
      await userRef.update(updatePayload);
      
      // Update local instance
      Object.assign(this, updatePayload);
      return this;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Delete user
  async delete() {
    try {
      await db.collection('users').doc(this.id).delete();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Get all users by role
  static async findByRole(role) {
    try {
      const usersSnapshot = await db.collection('users')
        .where('role', '==', role)
        .get();
      
      return usersSnapshot.docs.map(doc => 
        new User({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw new Error(`Failed to find users by role: ${error.message}`);
    }
  }

  // Find free delivery riders
  static async findFreeRiders() {
    try {
      const usersSnapshot = await db.collection('users')
        .where('role', '==', 'delivery')
        .where('deliveryStatus', '==', 'free')
        .get();
      
      return usersSnapshot.docs.map(doc => 
        new User({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw new Error(`Failed to find free riders: ${error.message}`);
    }
  }

  // Update delivery status
  async updateDeliveryStatus(status) {
    try {
      const userRef = db.collection('users').doc(this.id);
      await userRef.update({
        deliveryStatus: status,
        updatedAt: new Date()
      });
      
      this.deliveryStatus = status;
      this.updatedAt = new Date();
      return this;
    } catch (error) {
      throw new Error(`Failed to update delivery status: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      profile: this.profile,
      deliveryStatus: this.deliveryStatus,
      totalEarnings: this.totalEarnings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  async updateEarnings(amount) {
    try {
      const userRef = db.collection('users').doc(this.id);
      const newTotal = (this.totalEarnings || 0) + amount;
      await userRef.update({
        totalEarnings: newTotal,
        updatedAt: new Date()
      });
      this.totalEarnings = newTotal;
      return this;
    } catch (error) {
      throw new Error(`Failed to update earnings: ${error.message}`);
    }
  }
}

module.exports = User;
