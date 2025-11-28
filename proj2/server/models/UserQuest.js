const { db } = require('../config/firebase');

class UserQuest {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.questId = data.questId;
    this.progress = data.progress || 0;
    this.isCompleted = data.isCompleted || false;
    this.completedAt = data.completedAt || null;
    this.startedAt = data.startedAt || new Date();
    this.cuisinesTried = data.cuisinesTried || [];
  }

  static async create(userQuestData) {
    try {
      const userQuestRef = db.collection('userQuests').doc();
      const userQuestDoc = {
        id: userQuestRef.id,
        ...userQuestData,
        startedAt: new Date()
      };
      
      await userQuestRef.set(userQuestDoc);
      return new UserQuest(userQuestDoc);
    } catch (error) {
      throw new Error(`Failed to create user quest: ${error.message}`);
    }
  }

  static async findByUserAndQuest(userId, questId) {
    try {
      const userQuestSnapshot = await db.collection('userQuests')
        .where('userId', '==', userId)
        .where('questId', '==', questId)
        .limit(1)
        .get();
      
      if (userQuestSnapshot.empty) {
        return null;
      }
      
      const doc = userQuestSnapshot.docs[0];
      return new UserQuest({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Failed to find user quest: ${error.message}`);
    }
  }

  static async findByUserId(userId) {
    try {
      const userQuestsSnapshot = await db.collection('userQuests')
        .where('userId', '==', userId)
        .get();
      
      return userQuestsSnapshot.docs.map(doc => 
        new UserQuest({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw new Error(`Failed to find user quests: ${error.message}`);
    }
  }

  async updateProgress(newProgress) {
    try {
      const userQuestRef = db.collection('userQuests').doc(this.id);
      const updateData = {
        progress: newProgress
      };

      if (newProgress >= 1) {
        updateData.isCompleted = true;
        updateData.completedAt = new Date();
      }

      await userQuestRef.update(updateData);
      
      this.progress = newProgress;
      if (newProgress >= 1) {
        this.isCompleted = true;
        this.completedAt = updateData.completedAt;
      }
      
      return this;
    } catch (error) {
      throw new Error(`Failed to update quest progress: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      questId: this.questId,
      progress: this.progress,
      isCompleted: this.isCompleted,
      completedAt: this.completedAt,
      startedAt: this.startedAt
    };
  }
}

module.exports = UserQuest;