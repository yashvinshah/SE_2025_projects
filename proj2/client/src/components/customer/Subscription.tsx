import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi, SubscriptionPreferences } from '../../services/subscription-api';
import { promoApi, Promo } from '../../services/promo-api';
import './Subscription.css';

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPromos, setShowPromos] = useState(true);
  
  // Form state
  const [planType, setPlanType] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [promoAlerts, setPromoAlerts] = useState(true);

  // Fetch subscription
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => subscriptionApi.getSubscription(user!.id),
    enabled: !!user?.id
  });

  // Fetch personalized promos
  const { data: promos = [], isLoading: promosLoading } = useQuery({
    queryKey: ['promos', user?.id],
    queryFn: () => promoApi.getCustomerPromos(user!.id),
    enabled: !!user?.id && showPromos
  });

  // Create subscription mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => subscriptionApi.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      setIsCreating(false);
      resetForm();
    }
  });

  // Update subscription mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => subscriptionApi.updateSubscription(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      setIsEditing(false);
      alert('Subscription updated successfully! ✓');
    }
  });

  // Toggle subscription mutation
  const toggleMutation = useMutation({
    mutationFn: () => subscriptionApi.toggleSubscription(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    }
  });

  // Delete subscription mutation
  const deleteMutation = useMutation({
    mutationFn: () => subscriptionApi.deleteSubscription(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      alert('Subscription cancelled successfully!');
    }
  });

  const resetForm = () => {
    setPlanType('weekly');
    setCuisines([]);
    setDietaryRestrictions([]);
    setBudget('');
    setPromoAlerts(true);
  };

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      customerId: user!.id,
      planType,
      preferences: {
        cuisines,
        dietaryRestrictions,
        budget
      },
      promoAlerts
    });
  };

  const handleToggleCuisine = (cuisine: string) => {
    setCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleToggleRestriction = (restriction: string) => {
    setDietaryRestrictions(prev =>
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const handleEditSubscription = () => {
    if (subscription) {
      // Pre-fill form with existing subscription data
      setPlanType(subscription.planType);
      setCuisines(subscription.preferences?.cuisines || []);
      setDietaryRestrictions(subscription.preferences?.dietaryRestrictions || []);
      setBudget(subscription.preferences?.budget || '');
      setPromoAlerts(subscription.promoAlerts);
      setIsEditing(true);
    }
  };

  const handleUpdateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      planType,
      preferences: {
        cuisines,
        dietaryRestrictions,
        budget
      },
      promoAlerts
    });
  };

  const handleDeleteSubscription = () => {
    if (window.confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const cuisineOptions = ['Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'American', 'Thai', 'Mediterranean'];
  const restrictionOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher'];
  const budgetOptions = ['$', '$$', '$$$', '$$$$'];

  if (subLoading) {
    return (
      <div className="subscription-container">
        <div className="loading">Loading subscription details...</div>
      </div>
    );
  }

  return (
    <div className="subscription-container">
      <div className="subscription-header">
        <h2>🗓️ Meal Plan Subscription</h2>
        <p className="subscription-subtitle">Weekly meal plans delivered to your door</p>
      </div>

      {/* Promo Alerts Section */}
      <div className="promo-alerts-section">
        <div className="section-header">
          <h3>🎉 Active Promotions & Deals</h3>
          <button 
            className="toggle-promos-btn"
            onClick={() => setShowPromos(!showPromos)}
          >
            {showPromos ? 'Hide' : 'Show'} Promos
          </button>
        </div>
        
        {showPromos && (
          <div className="promos-container">
            {promosLoading ? (
              <p className="loading-text">Loading promos...</p>
            ) : promos.length === 0 ? (
              <div className="no-promos">
                <p>No active promotions at the moment. Check back soon!</p>
              </div>
            ) : (
              <div className="promos-grid">
                {promos.map((promo: Promo) => (
                  <div key={promo.id} className="promo-card">
                    <div className="promo-badge">{promo.discountPercent}% OFF</div>
                    <h4>{promo.title}</h4>
                    <p className="promo-restaurant">📍 {promo.restaurantName}</p>
                    <p className="promo-description">{promo.description}</p>
                    <div className="promo-code">
                      <span>Code:</span>
                      <strong>{promo.code}</strong>
                    </div>
                    <p className="promo-validity">
                      Valid until: {new Date(promo.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subscription Section */}
      {!subscription ? (
        <div className="no-subscription">
          {!isCreating ? (
            <>
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No Active Subscription</h3>
                <p>Subscribe to a weekly meal plan and never worry about what to eat!</p>
                <button 
                  className="create-btn"
                  onClick={() => setIsCreating(true)}
                >
                  ✨ Create Subscription
                </button>
              </div>
            </>
          ) : (
            <div className="create-subscription-form">
              <h3>Create Your Meal Plan</h3>
              <form onSubmit={handleCreateSubscription}>
                
                {/* Plan Type */}
                <div className="form-group">
                  <label>Plan Type</label>
                  <div className="plan-options">
                    {['weekly', 'biweekly', 'monthly'].map(type => (
                      <button
                        key={type}
                        type="button"
                        className={`plan-option ${planType === type ? 'active' : ''}`}
                        onClick={() => setPlanType(type as any)}
                      >
                        {type === 'weekly' ? '📅 Weekly' : type === 'biweekly' ? '📆 Bi-Weekly' : '🗓️ Monthly'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cuisine Preferences */}
                <div className="form-group">
                  <label>Preferred Cuisines</label>
                  <div className="options-grid">
                    {cuisineOptions.map(cuisine => (
                      <button
                        key={cuisine}
                        type="button"
                        className={`option-btn ${cuisines.includes(cuisine) ? 'selected' : ''}`}
                        onClick={() => handleToggleCuisine(cuisine)}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div className="form-group">
                  <label>Dietary Restrictions</label>
                  <div className="options-grid">
                    {restrictionOptions.map(restriction => (
                      <button
                        key={restriction}
                        type="button"
                        className={`option-btn ${dietaryRestrictions.includes(restriction) ? 'selected' : ''}`}
                        onClick={() => handleToggleRestriction(restriction)}
                      >
                        {restriction}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div className="form-group">
                  <label>Budget per Meal</label>
                  <div className="budget-options">
                    {budgetOptions.map(b => (
                      <button
                        key={b}
                        type="button"
                        className={`budget-btn ${budget === b ? 'active' : ''}`}
                        onClick={() => setBudget(b)}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Promo Alerts */}
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={promoAlerts}
                      onChange={(e) => setPromoAlerts(e.target.checked)}
                    />
                    <span>Send me promotional alerts and deals</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setIsCreating(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : '✨ Create Subscription'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="active-subscription">
          {!isEditing ? (
            <div className="subscription-card">
              <div className="subscription-status">
                <span className={`status-badge ${subscription.active ? 'active' : 'paused'}`}>
                  {subscription.active ? '✓ Active' : '⏸️ Paused'}
                </span>
                <div className="status-actions">
                  <button
                    className="toggle-status-btn"
                    onClick={() => toggleMutation.mutate()}
                    disabled={toggleMutation.isPending}
                  >
                    {subscription.active ? '⏸️ Pause' : '▶️ Resume'}
                  </button>
                  <button
                    className="edit-btn"
                    onClick={handleEditSubscription}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={handleDeleteSubscription}
                    disabled={deleteMutation.isPending}
                  >
                    🗑️ Cancel Subscription
                  </button>
                </div>
              </div>

              <div className="subscription-info">
                <div className="info-item">
                  <span className="info-label">Plan Type:</span>
                  <span className="info-value">{subscription.planType.toUpperCase()}</span>
                </div>
                
                {subscription.nextDeliveryDate && (
                  <div className="info-item">
                    <span className="info-label">Next Delivery:</span>
                    <span className="info-value">
                      {new Date(subscription.nextDeliveryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="info-item">
                  <span className="info-label">Promo Alerts:</span>
                  <span className="info-value">
                    {subscription.promoAlerts ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>

                {subscription.preferences?.budget && (
                  <div className="info-item">
                    <span className="info-label">Budget:</span>
                    <span className="info-value">{subscription.preferences.budget} per meal</span>
                  </div>
                )}

                {subscription.preferences?.cuisines?.length > 0 && (
                  <div className="info-item">
                    <span className="info-label">Preferred Cuisines:</span>
                    <div className="preference-tags">
                      {subscription.preferences.cuisines.map((cuisine: string) => (
                        <span key={cuisine} className="preference-tag">{cuisine}</span>
                      ))}
                    </div>
                  </div>
                )}

                {subscription.preferences?.dietaryRestrictions?.length > 0 && (
                  <div className="info-item">
                    <span className="info-label">Dietary Restrictions:</span>
                    <div className="preference-tags">
                      {subscription.preferences.dietaryRestrictions.map((restriction: string) => (
                        <span key={restriction} className="preference-tag">{restriction}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="edit-subscription-form">
              <h3>Edit Your Subscription</h3>
              <form onSubmit={handleUpdateSubscription}>
                
                {/* Plan Type */}
                <div className="form-group">
                  <label>Plan Type</label>
                  <div className="plan-options">
                    {['weekly', 'biweekly', 'monthly'].map(type => (
                      <button
                        key={type}
                        type="button"
                        className={`plan-option ${planType === type ? 'active' : ''}`}
                        onClick={() => setPlanType(type as any)}
                      >
                        {type === 'weekly' ? '📅 Weekly' : type === 'biweekly' ? '📆 Bi-Weekly' : '🗓️ Monthly'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cuisine Preferences */}
                <div className="form-group">
                  <label>Preferred Cuisines</label>
                  <div className="options-grid">
                    {cuisineOptions.map(cuisine => (
                      <button
                        key={cuisine}
                        type="button"
                        className={`option-btn ${cuisines.includes(cuisine) ? 'selected' : ''}`}
                        onClick={() => handleToggleCuisine(cuisine)}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div className="form-group">
                  <label>Dietary Restrictions</label>
                  <div className="options-grid">
                    {restrictionOptions.map(restriction => (
                      <button
                        key={restriction}
                        type="button"
                        className={`option-btn ${dietaryRestrictions.includes(restriction) ? 'selected' : ''}`}
                        onClick={() => handleToggleRestriction(restriction)}
                      >
                        {restriction}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div className="form-group">
                  <label>Budget per Meal</label>
                  <div className="budget-options">
                    {budgetOptions.map(b => (
                      <button
                        key={b}
                        type="button"
                        className={`budget-btn ${budget === b ? 'active' : ''}`}
                        onClick={() => setBudget(b)}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Promo Alerts */}
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={promoAlerts}
                      onChange={(e) => setPromoAlerts(e.target.checked)}
                    />
                    <span>Send me promotional alerts and deals</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setIsEditing(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Updating...' : '✓ Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Subscription;

