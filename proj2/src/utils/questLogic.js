// Quest System Business Logic
// Extracted functions for testing and coverage

// Calculate quest progress based on type
function calculateQuestProgress(currentProgress, target, questType, orderData) {
  let newProgress = currentProgress;
  
  switch (questType) {
    case 'order_count':
    case 'frequency':
      const currentCount = currentProgress * target;
      const newCount = currentCount + 1;
      newProgress = Math.min(1, newCount / target);
      break;
      
    case 'spending_amount':
    case 'spending':
      const currentSpent = currentProgress * target;
      const newSpent = currentSpent + orderData.totalAmount;
      newProgress = Math.min(1, newSpent / target);
      break;
      
    case 'cuisine':
    case 'cuisine_type':
      const cuisinesTried = orderData.cuisinesTried || [];
      const newCuisine = orderData.cuisineType;
      if (newCuisine && !cuisinesTried.includes(newCuisine)) {
        const updatedCuisines = [...cuisinesTried, newCuisine];
        newProgress = Math.min(1, updatedCuisines.length / target);
      }
      break;
  }
  
  return newProgress;
}

// Check if current day is weekend
function isWeekend(date = new Date()) {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
}

// Validate quest completion
function isQuestCompleted(progress) {
  return progress >= 1;
}

// Validate reward type
function isNumericReward(reward) {
  return typeof reward === 'number';
}

// Validate badge reward structure
function isValidBadgeReward(reward) {
  return reward.type === 'badge' && !!reward.badgeId;
}

// Calculate cuisine progress
function calculateCuisineProgress(cuisinesTried, target) {
  return Math.min(1, cuisinesTried.length / target);
}

// Normalize progress to valid range
function normalizeProgress(progress) {
  return Math.max(0, Math.min(1, progress));
}

// Validate quest data
function isValidQuest(quest) {
  return !!(quest && quest.id && quest.title && quest.type && quest.target > 0);
}

module.exports = {
  calculateQuestProgress,
  isWeekend,
  isQuestCompleted,
  isNumericReward,
  isValidBadgeReward,
  calculateCuisineProgress,
  normalizeProgress,
  isValidQuest
};