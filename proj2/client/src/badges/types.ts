export type BadgeTierId = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface BadgeTierConfig {
  tier: BadgeTierId;
  threshold: number;
}

export interface CustomerStats {
  uniqueRestaurantsCount: number;
  totalOrdersCount: number;
  maxStreakDays: number;
  lifetimeSpend: number;
  highValueOrdersCount: number;
  totalReviewsCount: number;
  oneStarReviewsCount: number;
  fiveStarReviewsCount: number;
  sameRestaurantMaxOrders: number;
  fridayOrdersCount: number;
  lateNightOrdersCount: number;
  pointsOrdersCount: number;
  bigFeastOrdersCount: number;
  uniqueMenuItemsCount: number;
  longReviewsCount: number;
  reviewedRestaurantsCount: number;
  totalTipAmount: number;
  tipOrdersCount: number;
}
