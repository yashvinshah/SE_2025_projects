const evaluateBadge = (definition, stats = {}) => {
  const value = Number(stats[definition.metric]) || 0;

  let currentTier = null;
  let nextTier = null;

  for (let i = 0; i < definition.tiers.length; i += 1) {
    const tierConfig = definition.tiers[i];
    if (value >= tierConfig.threshold) {
      currentTier = tierConfig.tier;
      continue;
    }

    if (!nextTier) {
      nextTier = tierConfig;
    }
    break;
  }

  if (!currentTier && definition.tiers.length > 0 && value >= definition.tiers[0].threshold) {
    currentTier = definition.tiers[0].tier;
  }

  if (!nextTier) {
    const higherTier = definition.tiers.find((tier) => tier.threshold > value);
    nextTier = higherTier || null;
  }

  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    icon: definition.icon,
    metric: definition.metric,
    value,
    currentTier,
    nextTier,
  };
};

const evaluateBadges = (stats = {}, definitions = []) => {
  if (!Array.isArray(definitions) || definitions.length === 0) {
    return [];
  }
  const evaluated = definitions.map((definition) => evaluateBadge(definition, stats));
  const harshCritic = evaluated.find((badge) => badge.id === 'one_star_reviews');
  console.log('[evaluateBadges] evaluation complete', {
    metricsEvaluated: definitions.map((def) => def.metric),
    badgeCount: evaluated.length,
    harshCritic,
  });
  return evaluated;
};

module.exports = {
  evaluateBadges,
};
