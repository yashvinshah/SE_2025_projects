const express = require('express');
const Quest = require('../models/Quest');
const UserQuest = require('../models/UserQuest');
const Order = require('../models/Order');
const { awardPoints } = require('./points');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all active quests
router.get('/', async (req, res) => {
  try {
    const quests = await Quest.getActiveQuests();
    res.json({ quests: quests.map(quest => quest.toJSON()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's quest progress
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userQuests = await UserQuest.findByUserId(userId);
    const activeQuests = await Quest.getActiveQuests();
    
    const questsWithProgress = await Promise.all(
      activeQuests.map(async (quest) => {
        const userQuest = userQuests.find(uq => uq.questId === quest.id);
        return {
          ...quest.toJSON(),
          progress: userQuest ? userQuest.progress : 0,
          isCompleted: userQuest ? userQuest.isCompleted : false,
          completedAt: userQuest ? userQuest.completedAt : null,
          hasStarted: !!userQuest
        };
      })
    );
    
    res.json({ quests: questsWithProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start a quest
router.post('/start', async (req, res) => {
  try {
    const { userId, questId } = req.body;
    
    const existingUserQuest = await UserQuest.findByUserAndQuest(userId, questId);
    if (existingUserQuest) {
      return res.status(400).json({ error: 'Quest already started' });
    }
    
    const userQuest = await UserQuest.create({ userId, questId });
    res.json({ userQuest: userQuest.toJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update quest progress (called when orders are placed)
async function updateQuestProgress(userId, order) {
  try {
    const userQuests = await UserQuest.findByUserId(userId);
    const activeQuests = await Quest.getActiveQuests();
    
    for (const quest of activeQuests) {
      const userQuest = userQuests.find(uq => uq.questId === quest.id && !uq.isCompleted);
      if (!userQuest) continue;
      
      let newProgress = userQuest.progress;
      
      switch (quest.type) {
        case 'order_count':
        case 'frequency':
          // Check if this is Weekend Warrior quest
          if (quest.title === 'Weekend Warrior') {
            const orderDate = new Date();
            const dayOfWeek = orderDate.getDay(); // 0 = Sunday, 6 = Saturday
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              newProgress = Math.min(1, (userQuest.progress * quest.target + 1) / quest.target);
            }
          } else {
            newProgress = Math.min(1, (userQuest.progress * quest.target + 1) / quest.target);
          }
          break;
        case 'spending_amount':
        case 'spending':
          const currentSpent = userQuest.progress * quest.target;
          newProgress = Math.min(1, (currentSpent + order.totalAmount) / quest.target);
          break;
        case 'cuisine_type':
        case 'cuisine':
          // Get restaurant to find cuisine type
          try {
            const restaurantDoc = await db.collection('restaurants').doc(order.restaurantId).get();
            if (restaurantDoc.exists) {
              const restaurant = restaurantDoc.data();
              const cuisineType = restaurant.cuisineType || 'Unknown';
              
              // Get current cuisines tried (stored in userQuest metadata)
              const currentCuisines = userQuest.cuisinesTried || [];
              
              // Add new cuisine if not already tried
              if (!currentCuisines.includes(cuisineType)) {
                const newCuisines = [...currentCuisines, cuisineType];
                newProgress = Math.min(1, newCuisines.length / quest.target);
                
                // Update userQuest with new cuisines list
                await db.collection('userQuests').doc(userQuest.id).update({
                  cuisinesTried: newCuisines
                });
              }
            }
          } catch (error) {
            console.error('Error tracking cuisine:', error);
          }
          break;
        case 'restaurant_visit':
          // For now, increment by 1 for each order (simplified)
          newProgress = Math.min(1, (userQuest.progress * quest.target + 1) / quest.target);
          break;
      }
      
      if (newProgress > userQuest.progress) {
        console.log(`Updating quest progress: ${quest.title} from ${userQuest.progress} to ${newProgress}`);
        await userQuest.updateProgress(newProgress);
        
        if (newProgress >= 1 && typeof quest.reward === 'number') {
          console.log(`Quest completed! Awarding ${quest.reward} points for: ${quest.title}`);
          await awardPoints(userId, quest.reward, `Quest completed: ${quest.title}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to update quest progress:', error);
  }
}

module.exports = { router, updateQuestProgress };