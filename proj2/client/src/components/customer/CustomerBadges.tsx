import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import './CustomerBadges.css';

type BadgeTierId = 'bronze' | 'silver' | 'gold' | 'diamond';

interface BadgeTierConfig {
  tier: BadgeTierId;
  threshold: number;
}

interface EvaluatedBadge {
  id: string;
  label: string;
  description: string;
  icon?: string;
  metric: string;
  value: number;
  currentTier: BadgeTierId | null;
  nextTier: BadgeTierConfig | null;
}

interface BadgesResponse {
  badges: EvaluatedBadge[];
  lastComputedAt: string | null;
}

const defaultResponse: BadgesResponse = {
  badges: [],
  lastComputedAt: null,
};

const tierEmojiMap: Record<BadgeTierId, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  diamond: '💎',
};

const CustomerBadges: React.FC = () => {
  const { user } = useAuth();
  const customerId = user?.id;
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data = defaultResponse, isLoading, refetch, isFetching } = useQuery<BadgesResponse>({
    queryKey: ['customerBadges', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const response = await api.get(`/badges?customerId=${customerId}`);
      return response.data as BadgesResponse;
    },
    staleTime: 1000 * 60 * 5,
  });

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

  const lastUpdatedLabel = data?.lastComputedAt
    ? new Date(data.lastComputedAt).toLocaleString()
    : 'Not computed yet';

  const sortedBadges = useMemo(
    () => [...(data?.badges || [])].sort((a, b) => a.label.localeCompare(b.label)),
    [data?.badges]
  );

  const updateScrollButtons = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  const scrollByCards = useCallback((direction: 'left' | 'right') => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const scrollAmount = carousel.clientWidth * 0.8;
    carousel.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    updateScrollButtons();

    const handleScroll = () => updateScrollButtons();
    const handleResize = () => updateScrollButtons();

    carousel.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [sortedBadges.length, updateScrollButtons]);

  if (!customerId) {
    return null;
  }

  const renderProgress = (badge: EvaluatedBadge) => {
    if (badge.nextTier) {
      return `${badge.value} / ${badge.nextTier.threshold}`;
    }
    return `${badge.value}`;
  };

  const getBadgeCardClass = (badge: EvaluatedBadge) => {
    if (badge.currentTier) {
      return `badge-card unlocked tier-${badge.currentTier}`;
    }
    return 'badge-card locked';
  };

  const renderStatus = (badge: EvaluatedBadge) => {
    if (badge.currentTier) {
      const tierLabel = `${badge.currentTier.charAt(0).toUpperCase()}${badge.currentTier.slice(1)}`;
      const emoji = tierEmojiMap[badge.currentTier];
      return `${emoji ? `${emoji} ` : ''}${tierLabel}`;
    }
    return 'Locked';
  };

  const renderNextTier = (badge: EvaluatedBadge) => {
    if (badge.nextTier) {
      return `Next: ${badge.nextTier.tier} at ${badge.nextTier.threshold}`;
    }
    return 'Max tier achieved';
  };

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
        <div className="badge-carousel">
          {sortedBadges.length === 0 ? (
            <p className="badge-description">No badges yet. Start ordering to unlock rewards!</p>
          ) : (
            <>
              <button
                type="button"
                className="carousel-nav prev"
                onClick={() => scrollByCards('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll badges left"
              >
                ←
              </button>
              <div className="badge-carousel-track" ref={carouselRef}>
                {sortedBadges.map((badge) => (
                  <div key={badge.id} className={getBadgeCardClass(badge)}>
                    {badge.icon && <div className="badge-icon">{badge.icon}</div>}
                    <div className="badge-content">
                      <p className="badge-label">{badge.label}</p>
                      <h3 className="badge-value">{renderStatus(badge)}</h3>
                      <p className="badge-description">{badge.description}</p>
                      <p className="badge-progress">
                        Progress: {renderProgress(badge)}
                      </p>
                      <p className="badge-next-tier">{renderNextTier(badge)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="carousel-nav next"
                onClick={() => scrollByCards('right')}
                disabled={!canScrollRight}
                aria-label="Scroll badges right"
              >
                →
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default CustomerBadges;
