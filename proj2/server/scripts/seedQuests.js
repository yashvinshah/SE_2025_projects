const { db } = require('../config/firebase');

const sampleQuests = [
  {
    title: "First Steps",
    description: "Place your first 3 orders to get started on your food journey!",
    type: "order_count",
    target: 3,
    reward: 50,
    difficulty: "easy",
    isActive: true
  },
  {
    title: "Big Spender",
    description: "Spend $100 total on food orders to unlock this achievement!",
    type: "spending_amount",
    target: 100,
    reward: 100,
    difficulty: "medium",
    isActive: true
  },
  {
    title: "Frequent Foodie",
    description: "Place 10 orders to become a frequent foodie!",
    type: "order_count",
    target: 10,
    reward: 150,
    difficulty: "medium",
    isActive: true
  },
  {
    title: "High Roller",
    description: "Spend $250 total to become a high roller!",
    type: "spending_amount",
    target: 250,
    reward: 250,
    difficulty: "hard",
    isActive: true
  },
  {
    title: "Order Master",
    description: "Complete 25 orders to master the art of food ordering!",
    type: "order_count",
    target: 25,
    reward: 300,
    difficulty: "hard",
    isActive: true
  },
  {
    title: "Weekend Warrior",
    description: "Place 5 orders to fuel your weekend adventures!",
    type: "order_count",
    target: 5,
    reward: 75,
    difficulty: "easy",
    isActive: true
  }
];

async function seedQuests() {
  try {
    console.log('🌱 Seeding quests...');
    
    for (const questData of sampleQuests) {
      const questRef = db.collection('quests').doc();
      const questDoc = {
        id: questRef.id,
        ...questData,
        createdAt: new Date()
      };
      
      await questRef.set(questDoc);
      console.log(`✅ Created quest: ${questData.title}`);
    }
    
    console.log('🎯 Quest seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding quests:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedQuests().then(() => process.exit(0));
}

module.exports = { seedQuests };