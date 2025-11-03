const { db } = require('../config/firebase');

class Points {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.userRole = data.userRole;
    this.totalPoints = data.totalPoints || 0;
    this.availablePoints = data.availablePoints || 0;
    this.usedPoints = data.usedPoints || 0;
    this.transactions = data.transactions || []; // Array of {type, points, description, orderId?, createdAt}
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create or get points record for user
  static async getOrCreate(userId, userRole) {
    try {
      const pointsSnapshot = await db.collection('points')
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (!pointsSnapshot.empty) {
        const doc = pointsSnapshot.docs[0];
        return new Points({ id: doc.id, ...doc.data() });
      }
      
      // Create new points record
      const pointsRef = db.collection('points').doc();
      const pointsDoc = {
        id: pointsRef.id,
        userId,
        userRole,
        totalPoints: 0,
        availablePoints: 0,
        usedPoints: 0,
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await pointsRef.set(pointsDoc);
      return new Points(pointsDoc);
    } catch (error) {
      throw new Error(`Failed to get or create points: ${error.message}`);
    }
  }

  // Add points
  async addPoints(points, type, description, orderId = null) {
    try {
      const transaction = {
        type, // 'earned', 'used', 'bonus'
        points: type === 'used' ? -points : points,
        description,
        orderId,
        createdAt: new Date()
      };

      const newTotalPoints = this.totalPoints + (type === 'used' ? -points : points);
      const newAvailablePoints = this.availablePoints + (type === 'used' ? -points : points);
      const newUsedPoints = this.usedPoints + (type === 'used' ? points : 0);

      const pointsRef = db.collection('points').doc(this.id);
      await pointsRef.update({
        totalPoints: newTotalPoints,
        availablePoints: newAvailablePoints,
        usedPoints: newUsedPoints,
        transactions: [...this.transactions, transaction],
        updatedAt: new Date()
      });

      // Update local instance
      this.totalPoints = newTotalPoints;
      this.availablePoints = newAvailablePoints;
      this.usedPoints = newUsedPoints;
      this.transactions.push(transaction);
      this.updatedAt = new Date();

      return this;
    } catch (error) {
      throw new Error(`Failed to add points: ${error.message}`);
    }
  }

  // Use points (for discounts)
  async usePoints(points, description) {
    if (points > this.availablePoints) {
      throw new Error('Insufficient points available');
    }

    return await this.addPoints(points, 'used', description);
  }

  // Get points by user ID
  static async findByUserId(userId) {
    try {
      const pointsSnapshot = await db.collection('points')
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (pointsSnapshot.empty) {
        return null;
      }
      
      const doc = pointsSnapshot.docs[0];
      return new Points({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Failed to find points by user ID: ${error.message}`);
    }
  }

  // Get all points records (for admin)
  static async findAll() {
    try {
      const pointsSnapshot = await db.collection('points')
        .orderBy('totalPoints', 'desc')
        .get();
      
      return pointsSnapshot.docs.map(doc => 
        new Points({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw new Error(`Failed to find all points: ${error.message}`);
    }
  }

  // Get recent transactions
  getRecentTransactions(limit = 10) {
    return this.transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  // Calculate discount amount (1 point = $0.01)
  calculateDiscountAmount(points) {
    return Math.min(points * 0.01, this.availablePoints * 0.01);
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      userRole: this.userRole,
      totalPoints: this.totalPoints,
      availablePoints: this.availablePoints,
      usedPoints: this.usedPoints,
      transactions: this.transactions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Points;
