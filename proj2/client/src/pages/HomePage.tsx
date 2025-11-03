import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  
  const { data: donationStats } = useQuery({
    queryKey: ['donationStats'],
    queryFn: async () => {
      const response = await api.get('/donations/stats');
      return response.data;
    },
  });

  // Redirect logged-in users to their appropriate dashboard
  if (user) {
    console.log('User detected in HomePage:', user);
    console.log('User role:', user.role);
    switch (user.role) {
      case 'customer':
        console.log('Redirecting to customer dashboard');
        return <Navigate to="/customer" replace />;
      case 'restaurant':
        console.log('Redirecting to restaurant dashboard');
        return <Navigate to="/restaurant" replace />;
      case 'delivery':
        console.log('Redirecting to delivery dashboard');
        return <Navigate to="/delivery" replace />;
      default:
        console.log('Unknown role, redirecting to customer dashboard');
        return <Navigate to="/customer" replace />;
    }
  }

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            🐺 Hungry Wolf
            <span className="hero-subtitle">Not Just Food, A Quest Worth Savoring</span>
          </h1>
          <p className="hero-description">
            Experience gamified food delivery that supports local restaurants and makes a difference in your community.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary">
              Start Your Quest
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Continue Adventure
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Hungry Wolf?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎮</div>
              <h3>Gamified Experience</h3>
              <p>Earn points for every order and review. Use your points for discounts and special offers!</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Local Legends</h3>
              <p>Support local restaurants and earn extra points for choosing our Local Legend partners.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">❤️</div>
              <h3>Social Impact</h3>
              <p>Every 10 orders helps donate a meal to those in need through our Meal-for-a-Meal program.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Counter */}
      {donationStats && (
        <section className="donation-counter">
          <div className="container">
            <div className="donation-stats">
              <h2>Community Impact</h2>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">{donationStats.mealsDonated}</div>
                  <div className="stat-label">Meals Donated</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{donationStats.nextDonationIn}</div>
                  <div className="stat-label">Orders Until Next Donation</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{donationStats.totalOrders}</div>
                  <div className="stat-label">Orders Delivered</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Start Your Food Adventure?</h2>
          <p>Join thousands of food lovers who are making a difference with every bite.</p>
          <Link to="/signup" className="btn btn-primary btn-large">
            Join the Pack
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
