// Quick script to create test promotional offers
// Run with: node create-test-promos.js

require('dotenv').config();
const Promo = require('./models/Promo');

async function createTestPromos() {
  console.log('🎉 Creating test promotional offers...\n');

  try {
    // Promo 1: Pizza Special
    const promo1 = await Promo.create({
      restaurantId: 'rest001',
      restaurantName: 'Pizza Palace',
      title: 'Weekend Pizza Special - 20% Off!',
      description: 'Get 20% off on all large pizzas this weekend. Use code at checkout!',
      discountPercent: 20,
      code: 'PIZZA20',
      validFrom: new Date('2024-11-01'),
      validUntil: new Date('2024-12-31'),
      active: true,
      targetCuisines: ['Italian', 'American']
    });
    console.log('✓ Created Promo 1:', promo1.title);

    // Promo 2: Taco Tuesday
    const promo2 = await Promo.create({
      restaurantId: 'rest002',
      restaurantName: 'Taco Town',
      title: 'Taco Tuesday - Buy 2 Get 1 Free!',
      description: 'Every Tuesday, buy 2 tacos and get 1 free!',
      discountPercent: 33,
      code: 'TACOTUESDAY',
      validFrom: new Date('2024-11-01'),
      validUntil: new Date('2024-12-31'),
      active: true,
      targetCuisines: ['Mexican']
    });
    console.log('✓ Created Promo 2:', promo2.title);

    // Promo 3: Sushi Special
    const promo3 = await Promo.create({
      restaurantId: 'rest003',
      restaurantName: 'Sushi Express',
      title: 'Happy Hour Sushi - 30% Off!',
      description: 'Get 30% off all sushi rolls from 3-6 PM daily',
      discountPercent: 30,
      code: 'SUSHI30',
      validFrom: new Date('2024-11-01'),
      validUntil: new Date('2024-12-31'),
      active: true,
      targetCuisines: ['Japanese']
    });
    console.log('✓ Created Promo 3:', promo3.title);

    // Promo 4: General Welcome Offer
    const promo4 = await Promo.create({
      restaurantId: 'rest001',
      restaurantName: 'Hungry Wolf',
      title: 'Welcome! First Order 15% Off',
      description: 'New to Hungry Wolf? Get 15% off your first order!',
      discountPercent: 15,
      code: 'WELCOME15',
      validFrom: new Date('2024-11-01'),
      validUntil: new Date('2024-12-31'),
      active: true,
      targetCuisines: [] // General promo for all cuisines
    });
    console.log('✓ Created Promo 4:', promo4.title);

    // Promo 5: Indian Cuisine Promo
    const promo5 = await Promo.create({
      restaurantId: 'rest004',
      restaurantName: 'Curry House',
      title: 'Curry Special - 25% Off!',
      description: 'Celebrate with us! 25% off all curry dishes',
      discountPercent: 25,
      code: 'CURRY25',
      validFrom: new Date('2024-11-01'),
      validUntil: new Date('2024-12-31'),
      active: true,
      targetCuisines: ['Indian']
    });
    console.log('✓ Created Promo 5:', promo5.title);

    console.log('\n🎉 All test promos created successfully!');
    console.log('\nYou can now see these promos in the Meal Subscription page.');
    console.log('They will be personalized based on customer cuisine preferences.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating promos:', error.message);
    process.exit(1);
  }
}

// Run the script
createTestPromos();

