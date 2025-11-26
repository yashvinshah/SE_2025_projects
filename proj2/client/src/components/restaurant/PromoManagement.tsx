import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import './PromoManagement.css';

interface Promo {
  id: string;
  restaurantId: string;
  restaurantName: string;
  title: string;
  description: string;
  discountPercent: number;
  code: string;
  validFrom: string;
  validUntil: string;
  active: boolean;
  targetCuisines: string[];
  createdAt: string;
  updatedAt: string;
}

const PromoManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountPercent: 10,
    code: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    targetCuisines: [] as string[]
  });

  // Fetch restaurant's promos
  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['restaurantPromos', user?.id],
    queryFn: async () => {
      const response = await api.get(`/promos/restaurant/${user?.id}`);
      return response.data.promos;
    },
    enabled: !!user?.id
  });

  // Create promo mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/promos', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantPromos', user?.id] });
      setIsCreating(false);
      resetForm();
      alert('Promo created successfully! 🎉');
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.error || 'Failed to create promo'}`);
    }
  });

  // Deactivate promo mutation
  const deactivateMutation = useMutation({
    mutationFn: async (promoId: string) => {
      const response = await api.patch(`/promos/${promoId}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantPromos', user?.id] });
      alert('Promo deactivated successfully!');
    }
  });

  // Delete promo mutation
  const deleteMutation = useMutation({
    mutationFn: async (promoId: string) => {
      const response = await api.delete(`/promos/${promoId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantPromos', user?.id] });
      alert('Promo deleted successfully!');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discountPercent: 10,
      code: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      targetCuisines: []
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.validUntil) {
      alert('Please select an end date');
      return;
    }

    createMutation.mutate({
      restaurantId: user?.id,
      restaurantName: user?.profile?.name || 'Restaurant',
      title: formData.title,
      description: formData.description,
      discountPercent: Number(formData.discountPercent),
      code: formData.code.toUpperCase(),
      validFrom: new Date(formData.validFrom).toISOString(),
      validUntil: new Date(formData.validUntil).toISOString(),
      active: true,
      targetCuisines: formData.targetCuisines
    });
  };

  const handleCuisineToggle = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      targetCuisines: prev.targetCuisines.includes(cuisine)
        ? prev.targetCuisines.filter(c => c !== cuisine)
        : [...prev.targetCuisines, cuisine]
    }));
  };

  const generatePromoCode = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, code: random }));
  };

  const cuisineOptions = ['Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'American', 'Thai', 'Mediterranean'];

  if (isLoading) {
    return <div className="loading">Loading promos...</div>;
  }

  return (
    <div className="promo-management">
      <div className="promo-header">
        <h2>🎉 Promotional Offers</h2>
        <button 
          className="create-promo-btn"
          onClick={() => setIsCreating(true)}
        >
          + Create New Promo
        </button>
      </div>

      {/* Create Promo Form */}
      {isCreating && (
        <div className="promo-form-container">
          <div className="promo-form-header">
            <h3>Create New Promotional Offer</h3>
            <button className="close-btn" onClick={() => { setIsCreating(false); resetForm(); }}>✕</button>
          </div>
          
          <form onSubmit={handleSubmit} className="promo-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Promo Title *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Weekend Special - 20% Off!"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Describe your promotional offer..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="discountPercent">Discount Percentage *</label>
                <input
                  type="number"
                  id="discountPercent"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                  required
                  min="1"
                  max="100"
                />
                <span className="discount-preview">{formData.discountPercent}% OFF</span>
              </div>

              <div className="form-group">
                <label htmlFor="code">Promo Code *</label>
                <div className="code-input-group">
                  <input
                    type="text"
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    placeholder="PROMO20"
                    maxLength={20}
                  />
                  <button type="button" onClick={generatePromoCode} className="generate-btn">
                    🎲 Generate
                  </button>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="validFrom">Valid From *</label>
                <input
                  type="date"
                  id="validFrom"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="validUntil">Valid Until *</label>
                <input
                  type="date"
                  id="validUntil"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  required
                  min={formData.validFrom}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Target Cuisines (Optional)</label>
              <p className="help-text">Leave empty to show to all customers, or select specific cuisines</p>
              <div className="cuisine-options">
                {cuisineOptions.map(cuisine => (
                  <button
                    key={cuisine}
                    type="button"
                    className={`cuisine-btn ${formData.targetCuisines.includes(cuisine) ? 'selected' : ''}`}
                    onClick={() => handleCuisineToggle(cuisine)}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => { setIsCreating(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : '🎉 Create Promo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promos List */}
      <div className="promos-section">
        <h3>Your Promotional Offers ({promos.length})</h3>
        
        {promos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎁</div>
            <h4>No Promos Yet</h4>
            <p>Create your first promotional offer to attract more customers!</p>
          </div>
        ) : (
          <div className="promos-grid">
            {promos.map((promo: Promo) => (
              <div key={promo.id} className={`promo-card ${!promo.active ? 'inactive' : ''}`}>
                <div className="promo-card-header">
                  <span className="discount-badge">{promo.discountPercent}% OFF</span>
                  <span className={`status-badge ${promo.active ? 'active' : 'inactive'}`}>
                    {promo.active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>

                <h4>{promo.title}</h4>
                <p className="promo-description">{promo.description}</p>

                <div className="promo-details">
                  <div className="detail-row">
                    <span className="detail-label">Code:</span>
                    <span className="promo-code">{promo.code}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Valid:</span>
                    <span>{new Date(promo.validFrom).toLocaleDateString()} - {new Date(promo.validUntil).toLocaleDateString()}</span>
                  </div>
                  {promo.targetCuisines.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Targets:</span>
                      <span className="cuisine-tags">
                        {promo.targetCuisines.map(c => (
                          <span key={c} className="cuisine-tag">{c}</span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>

                <div className="promo-actions">
                  {promo.active && (
                    <button
                      className="deactivate-btn"
                      onClick={() => {
                        if (window.confirm('Deactivate this promo?')) {
                          deactivateMutation.mutate(promo.id);
                        }
                      }}
                      disabled={deactivateMutation.isPending}
                    >
                      ⏸️ Deactivate
                    </button>
                  )}
                  <button
                    className="delete-btn"
                    onClick={() => {
                      if (window.confirm('Permanently delete this promo?')) {
                        deleteMutation.mutate(promo.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoManagement;

