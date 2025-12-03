const { db } = require('../config/firebase');
const { buildCustomerStats } = require('./buildCustomerStats');
const { badgeDefinitions } = require('../../src/badges/badgeDefinitions');
const { evaluateBadges } = require('../../src/badges/evaluateBadges');

const formatBadgesForStorage = (evaluatedBadges, timestamp) =>
  evaluatedBadges.reduce((acc, badge) => {
    acc[badge.id] = {
      currentTier: badge.currentTier,
      progress: badge.value,
      nextTierThreshold: badge.nextTier ? badge.nextTier.threshold : null,
      lastUpdatedAt: timestamp,
    };
    return acc;
  }, {});

const persistBadgeSnapshot = async (customerId, badges, stats, lastComputedAt) => {
  await db.collection('users').doc(customerId).set(
    {
      badges,
      badgesStats: stats,
      badgesLastComputedAt: lastComputedAt,
    },
    { merge: true }
  );
};

const computeBadges = async (customerId) => {
  const stats = await buildCustomerStats(customerId);
  const evaluatedBadges = evaluateBadges(stats, badgeDefinitions);
  const lastComputedAt = new Date().toISOString();
  const badgesMap = formatBadgesForStorage(evaluatedBadges, lastComputedAt);
  await persistBadgeSnapshot(customerId, badgesMap, stats, lastComputedAt);
  return { evaluatedBadges, stats, lastComputedAt, badgesMap };
};

const updateCustomerBadges = async (customerId) => {
  if (!customerId) {
    throw new Error('Customer ID is required to update badges');
  }
  return computeBadges(customerId);
};

const getCustomerBadges = async (customerId, { refresh = false } = {}) => {
  if (!customerId) {
    throw new Error('Customer ID is required to fetch badges');
  }

  const userRef = db.collection('users').doc(customerId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    throw new Error('Customer not found');
  }

  const data = userDoc.data() || {};
  const hasStoredBadges = data.badges && data.badgesStats;

  if (refresh || !hasStoredBadges) {
    return computeBadges(customerId);
  }

  const stats = data.badgesStats || {};
  const evaluatedBadges = evaluateBadges(stats, badgeDefinitions);
  return {
    evaluatedBadges,
    stats,
    lastComputedAt: data.badgesLastComputedAt || null,
  };
};

module.exports = {
  updateCustomerBadges,
  getCustomerBadges,
};
