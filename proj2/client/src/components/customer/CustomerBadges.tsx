import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import './CustomerBadges.css';

const SINGLE_ORDER_THRESHOLD = 30;
const LIFETIME_SPEND_THRESHOLD = 200;
const LOYAL_CUSTOMER_THRESHOLD = 150;

type LoyalRestaurantMap = Record<string, {
  restaurantName: string;
  totalSpent: number;
}>;

interface BigSpenderBadge {
  hasSingleOrder: boolean;
  hasLifetimeSpend: boolean;
  highestOrderAmount: number;
  totalSpent: number;
}

interface CustomerBadgesData {
  streakDays: number;
  bigSpender: BigSpenderBadge;
  loyalRestaurants: LoyalRestaurantMap;
  lastComputedAt: string | null;
}

const defaultBadges: CustomerBadgesData = {
  streakDays: 0,
  bigSpender: {
    hasSingleOrder: false,
    hasLifetimeSpend: false,
    highestOrderAmount: 0,
    totalSpent: 0,
  },
  loyalRestaurants: {},
  lastComputedAt: null,
};

const CustomerBadges: React.FC = () => {
  const { user } = useAuth();
  const customerId = user?.id;
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: badges = defaultBadges, isLoading, refetch, isFetching } = useQuery<CustomerBadgesData>({
    queryKey: ['customerBadges', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const response = await api.get(`/badges?customerId=${customerId}`);
      return response.data.badges as CustomerBadgesData;
    },
    staleTime: 1000 * 60 * 5,
  });

  const loyalRestaurantBadges = useMemo(
    () => Object.values(badges?.loyalRestaurants || {}),
    [badges?.loyalRestaurants]
  );

  const refreshBadges = useCallback(async () => {
    if (!customerId) return;
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      await api.post('/badges/update', { customerId });
      await queryClient.invalidateQueries({ queryKey: ['customerBadges', customerId] });
      await refetch();
    } catch (error: any) {
      console.error('Failed to refresh badges:', error);
      setErrorMessage(error?.response?.data?.error || 'Unable to refresh badges right now.');
    } finally {
      setIsSyncing(false);
    }
  }, [customerId, queryClient, refetch]);

  useEffect(() => {
    if (!customerId) return;
    refreshBadges();
  }, [customerId, refreshBadges]);

  if (!customerId) {
    return null;
  }

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const lastUpdatedLabel = badges?.lastComputedAt
    ? new Date(badges.lastComputedAt).toLocaleString()
    : 'Not computed yet';

  return (
    <section className="customer-badges">
      <div className="badges-header">
        <div>
          <p className="badge-eyebrow">Community perks</p>
          <h2>Your Badges</h2>
          <p className="badge-subtitle">
            Keep ordering to maintain your streaks and unlock exclusive loyalty badges.
          </p>
        </div>
        <div className="badge-actions">
          <button
            className="badge-refresh"
            onClick={refreshBadges}
            disabled={isSyncing || isLoading || isFetching}
          >
            {isSyncing ? 'Refreshing...' : 'Refresh badges'}
          </button>
          <span className="badge-updated">Last updated: {lastUpdatedLabel}</span>
        </div>
      </div>

      {errorMessage && <div className="badge-error">{errorMessage}</div>}

      {isLoading ? (
        <div className="badge-loading">
          <div className="loading-spinner">🏅</div>
          <p>Loading your badge progress...</p>
        </div>
      ) : (
        <>
          <div className="badge-grid">
            <div className={`badge-card ${badges.streakDays > 0 ? 'unlocked' : 'locked'}`}>
              <div className="badge-icon">🔥</div>
              <div className="badge-content">
                <p className="badge-label">Order Streak</p>
                <h3 className="badge-value">{badges.streakDays} day{badges.streakDays === 1 ? '' : 's'}</h3>
                <p className="badge-description">Place at least one order every day to keep your streak alive.</p>
              </div>
              <div className="badge-status">
                {badges.streakDays > 0 ? 'Unlocked' : 'Locked'}
              </div>
            </div>

            <div className={`badge-card ${badges.bigSpender.hasSingleOrder ? 'unlocked' : 'locked'}`}>
              <div className="badge-icon">💎</div>
              <div className="badge-content">
                <p className="badge-label">Big Spender (Single Order)</p>
                <h3 className="badge-value">Highest: {formatCurrency(badges.bigSpender.highestOrderAmount)}</h3>
                <p className="badge-description">
                  Unlock by placing one order above {formatCurrency(SINGLE_ORDER_THRESHOLD)}.
                </p>
              </div>
              <div className="badge-status">
                {badges.bigSpender.hasSingleOrder ? 'Unlocked' : 'Locked'}
              </div>
            </div>

            <div className={`badge-card ${badges.bigSpender.hasLifetimeSpend ? 'unlocked' : 'locked'}`}>
              <div className="badge-icon">🏆</div>
              <div className="badge-content">
                <p className="badge-label">Big Spender (Lifetime)</p>
                <h3 className="badge-value">Total: {formatCurrency(badges.bigSpender.totalSpent)}</h3>
                <p className="badge-description">
                  Spend {formatCurrency(LIFETIME_SPEND_THRESHOLD)} overall to earn this badge.
                </p>
              </div>
              <div className="badge-status">
                {badges.bigSpender.hasLifetimeSpend ? 'Unlocked' : 'Locked'}
              </div>
            </div>
          </div>

          <div className="loyal-section">
            <div className="loyal-header">
              <div>
                <p className="badge-label">Loyal Customer</p>
                <h3>Favorite Restaurants</h3>
                <p className="badge-description">
                  Spend at least {formatCurrency(LOYAL_CUSTOMER_THRESHOLD)} at a single restaurant to unlock a loyalty badge for them.
                </p>
              </div>
            </div>
            <div className="loyal-grid">
              {loyalRestaurantBadges.length > 0 ? (
                loyalRestaurantBadges.map((restaurant) => (
                  <div key={restaurant.restaurantName} className="loyal-card unlocked">
                    <div className="loyal-icon">🍽️</div>
                    <div>
                      <p className="loyal-name">{restaurant.restaurantName}</p>
                      <p className="loyal-spend">Spent {formatCurrency(restaurant.totalSpent)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="loyal-card locked">
                  <div className="loyal-icon">🔒</div>
                  <div>
                    <p className="loyal-name">No loyal badges yet</p>
                    <p className="loyal-spend">
                      Support a restaurant with {formatCurrency(LOYAL_CUSTOMER_THRESHOLD)}+ spend to unlock.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default CustomerBadges;
