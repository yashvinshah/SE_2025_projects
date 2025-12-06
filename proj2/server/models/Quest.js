const { db } = require('../config/firebase');

class Quest {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.type = data.type; // 'order_count', 'cuisine_type', 'spending_amount', 'restaurant_visit'
    this.target = data.target; // Target value to achieve
    this.reward = data.reward; // Points reward
    this.difficulty = data.difficulty; // 'easy', 'medium', 'hard'
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.expiresAt = data.expiresAt;
  }

  static async create(questData) {
    try {
      const questRef = db.collection('quests').doc();
      const questDoc = {
        id: questRef.id,
        ...questData,
        createdAt: new Date()
      };
      
      await questRef.set(questDoc);
      return new Quest(questDoc);
    } catch (error) {
      throw new Error(`Failed to create quest: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const questDoc = await db.collection('quests').doc(id).get();
      if (!questDoc.exists) {
        return null;
      }
      return new Quest({ id: questDoc.id, ...questDoc.data() });
    } catch (error) {
      throw new Error(`Failed to find quest: ${error.message}`);
    }
  }

  static async getActiveQuests() {
    try {
      const questsSnapshot = await db.collection('quests')
        .where('isActive', '==', true)
        .get();
      
      return questsSnapshot.docs.map(doc => 
        new Quest({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw new Error(`Failed to get active quests: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      type: this.type,
      target: this.target,
      reward: this.reward,
      difficulty: this.difficulty,
      isActive: this.isActive,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt
    };
  }
}

module.exports = Quest;