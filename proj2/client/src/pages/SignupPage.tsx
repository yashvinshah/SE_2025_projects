import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'customer' as 'customer' | 'restaurant' | 'delivery',
    profile: {
      name: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      // Restaurant-specific fields
      cuisine: '',
      description: '',
      // Delivery-specific fields
      vehicleType: '',
      licensePlate: ''
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      if (profileField === 'address') {
        const addressField = name.split('.')[2];
        setFormData(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            address: {
              ...prev.profile.address,
              [addressField]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            [profileField]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'restaurant':
        return (
          <>
            <div className="form-group">
              <label htmlFor="profile.cuisine">Cuisine Type</label>
              <input
                type="text"
                id="profile.cuisine"
                name="profile.cuisine"
                value={formData.profile.cuisine || ''}
                onChange={handleChange}
                placeholder="e.g., Italian, Mexican, Asian"
              />
            </div>
            <div className="form-group">
              <label htmlFor="profile.description">Restaurant Description</label>
              <textarea
                id="profile.description"
                name="profile.description"
                value={formData.profile.description || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  profile: {
                    ...prev.profile,
                    description: e.target.value
                  }
                }))}
                placeholder="Tell us about your restaurant"
                rows={3}
              />
            </div>
          </>
        );
      case 'delivery':
        return (
          <>
            <div className="form-group">
              <label htmlFor="profile.vehicleType">Vehicle Type</label>
              <select
                id="profile.vehicleType"
                name="profile.vehicleType"
                value={formData.profile.vehicleType || ''}
                onChange={handleChange}
              >
                <option value="">Select vehicle type</option>
                <option value="car">Car</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="bicycle">Bicycle</option>
                <option value="scooter">Scooter</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="profile.licensePlate">License Plate</label>
              <input
                type="text"
                id="profile.licensePlate"
                name="profile.licensePlate"
                value={formData.profile.licensePlate || ''}
                onChange={handleChange}
                placeholder="Enter license plate number"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🐺 Join the Hungry Wolf Pack</h1>
          <p>Start your food adventure today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a password (min 6 characters)"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">I want to join as:</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="customer">Customer</option>
              <option value="restaurant">Restaurant Owner</option>
              <option value="delivery">Delivery Partner</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="profile.name">Full Name</label>
            <input
              type="text"
              id="profile.name"
              name="profile.name"
              value={formData.profile.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile.phone">Phone Number</label>
            <input
              type="tel"
              id="profile.phone"
              name="profile.phone"
              value={formData.profile.phone}
              onChange={handleChange}
              required
              placeholder="Enter your phone number"
            />
          </div>

          <div className="address-section">
            <h3>Address Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="profile.address.street">Street Address</label>
                <input
                  type="text"
                  id="profile.address.street"
                  name="profile.address.street"
                  value={formData.profile.address.street}
                  onChange={handleChange}
                  required
                  placeholder="123 Main St"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="profile.address.city">City</label>
                <input
                  type="text"
                  id="profile.address.city"
                  name="profile.address.city"
                  value={formData.profile.address.city}
                  onChange={handleChange}
                  required
                  placeholder="City"
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile.address.state">State</label>
                <input
                  type="text"
                  id="profile.address.state"
                  name="profile.address.state"
                  value={formData.profile.address.state}
                  onChange={handleChange}
                  required
                  placeholder="State"
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile.address.zipCode">ZIP Code</label>
                <input
                  type="text"
                  id="profile.address.zipCode"
                  name="profile.address.zipCode"
                  value={formData.profile.address.zipCode}
                  onChange={handleChange}
                  required
                  placeholder="12345"
                />
              </div>
            </div>
          </div>

          {renderRoleSpecificFields()}

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Join the Pack'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
