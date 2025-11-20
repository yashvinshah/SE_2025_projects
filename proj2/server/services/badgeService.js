const { db } = require('../config/firebase');

const BADGE_THRESHOLDS = {
  bigSpenderSingleOrderAmount: 30,
  bigSpenderLifetimeAmount: 200,
  loyalCustomerAmount: 150,
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const convertToDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDayUTC = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const createDefaultBadges = () => ({
  streakDays: 0,
  bigSpender: {
    hasSingleOrder: false,
    hasLifetimeSpend: false,
    highestOrderAmount: 0,
    totalSpent: 0,
  },
  loyalRestaurants: {},
  lastComputedAt: null,
});

const fetchCustomerOrders = async (customerId) => {
  const snapshot = await db
    .collection('orders')
    .where('customerId', '==', customerId)
    .where('status', '==', 'delivered')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      restaurantId: data.restaurantId,
      totalAmount: data.totalAmount || 0,
      createdAt: convertToDate(data.createdAt) || new Date(0),
      deliveredAt: convertToDate(data.deliveredAt) || convertToDate(data.updatedAt) || new Date(0),
    };
  });
};

const compileUniqueDayKeys = (orders) => {
  const keys = [];
  const seen = new Set();
  orders
    .sort((a, b) => (b.deliveredAt || b.createdAt) - (a.deliveredAt || a.createdAt))
    .forEach((order) => {
      const deliveryDate = startOfDayUTC(order.deliveredAt || order.createdAt);
      if (!deliveryDate) return;
      const dayKey = deliveryDate.toISOString();
      if (!seen.has(dayKey)) {
        seen.add(dayKey);
        keys.push(dayKey);
      }
    });
  return keys;
};

const calculateCurrentStreak = (dayKeys) => {
  if (!dayKeys.length) return 0;
  let streak = 1;
  for (let i = 1; i < dayKeys.length; i += 1) {
    const prev = new Date(dayKeys[i - 1]);
    const current = new Date(dayKeys[i]);
    const diff = Math.round((prev - current) / DAY_IN_MS);
    if (diff === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
};

const computeSpendMetrics = (orders) => {
  const spendByRestaurant = {};
  let highestOrderAmount = 0;
  let totalSpent = 0;

  orders.forEach((order) => {
    const amount = Number(order.totalAmount) || 0;
    highestOrderAmount = Math.max(highestOrderAmount, amount);
    totalSpent += amount;

    if (order.restaurantId) {
      spendByRestaurant[order.restaurantId] = (spendByRestaurant[order.restaurantId] || 0) + amount;
    }
  });

  return {
    spendByRestaurant,
    highestOrderAmount: Number(highestOrderAmount.toFixed(2)),
    totalSpent: Number(totalSpent.toFixed(2)),
  };
};

const fetchRestaurantNames = async (restaurantIds) => {
  const names = {};
  if (!restaurantIds.length) return names;

  await Promise.all(
    restaurantIds.map(async (restaurantId) => {
      try {
        const restaurantDoc = await db.collection('users').doc(restaurantId).get();
        if (restaurantDoc.exists) {
          const data = restaurantDoc.data();
          names[restaurantId] = data?.profile?.name || 'Favorite Spot';
        }
      } catch (error) {
        console.error(`Failed to fetch restaurant ${restaurantId}:`, error.message);
      }
    })
  );

  return names;
};

const buildLoyalRestaurantBadges = async (spendByRestaurant) => {
  const qualifiedEntries = Object.entries(spendByRestaurant).filter(
    ([, total]) => total >= BADGE_THRESHOLDS.loyalCustomerAmount
  );

  const restaurantIds = qualifiedEntries.map(([restaurantId]) => restaurantId);
  const nameLookup = await fetchRestaurantNames(restaurantIds);

  return qualifiedEntries.reduce((acc, [restaurantId, total]) => {
    acc[restaurantId] = {
      restaurantName: nameLookup[restaurantId] || 'Favorite Spot',
      totalSpent: Number(total.toFixed(2)),
    };
    return acc;
  }, {});
};

const updateCustomerBadges = async (customerId) => {
  if (!customerId) {
    throw new Error('Customer ID is required to update badges');
  }

  const orders = await fetchCustomerOrders(customerId);
  const dayKeys = compileUniqueDayKeys(orders);
  const streakDays = calculateCurrentStreak(dayKeys);
  const spendMetrics = computeSpendMetrics(orders);
  const loyalRestaurants = await buildLoyalRestaurantBadges(spendMetrics.spendByRestaurant);

  const badges = {
    streakDays,
    bigSpender: {
      hasSingleOrder: spendMetrics.highestOrderAmount >= BADGE_THRESHOLDS.bigSpenderSingleOrderAmount,
      hasLifetimeSpend: spendMetrics.totalSpent >= BADGE_THRESHOLDS.bigSpenderLifetimeAmount,
      highestOrderAmount: spendMetrics.highestOrderAmount,
      totalSpent: spendMetrics.totalSpent,
    },
    loyalRestaurants,
    lastComputedAt: new Date(),
  };

  await db.collection('users').doc(customerId).set({ badges }, { merge: true });
  return badges;
};

const getCustomerBadges = async (customerId) => {
  if (!customerId) {
    throw new Error('Customer ID is required to fetch badges');
  }

  const userDoc = await db.collection('users').doc(customerId).get();
  if (!userDoc.exists) {
    throw new Error('Customer not found');
  }

  const data = userDoc.data();
  if (!data.badges) {
    return createDefaultBadges();
  }

  return {
    ...createDefaultBadges(),
    ...data.badges,
    bigSpender: {
      ...createDefaultBadges().bigSpender,
      ...data.badges.bigSpender,
    },
    loyalRestaurants: data.badges.loyalRestaurants || {},
  };
};

module.exports = {
  BADGE_THRESHOLDS,
  updateCustomerBadges,
  getCustomerBadges,
};
