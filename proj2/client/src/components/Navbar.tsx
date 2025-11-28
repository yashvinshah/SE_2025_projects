import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'customer':
        return '/customer';
      case 'restaurant':
        return '/restaurant';
      case 'delivery':
        return '/delivery';
      default:
        return '/';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          🐺 Hungry Wolf
        </Link>

        <div className="navbar-menu">
          {user ? (
            <>
              <Link to={getDashboardLink()} className="navbar-link">
                Dashboard
              </Link>

              {user.role === 'customer' && (
                <Link to="/customer/restaurants" className="navbar-link">
                  Restaurants
                </Link>
              )}

              {user.role === 'customer' && (
                <Link to="/customer/orders" className="navbar-link">
                  Orders
                </Link>
              )}

              {user.role === 'customer' && (
                <Link to="/customer/quests" className="navbar-link">
                  Quests 🎯
                </Link>
              )}

              {user.role === 'customer' && (
                <Link to="/customer/cart" className="navbar-link cart-link">
                  Cart ({getTotalItems()})
                </Link>
              )}

              {user.role === 'restaurant' && (
                <Link to="/restaurant/menu" className="navbar-link">
                  Menu
                </Link>
              )}

              {user.role === 'restaurant' && (
                <Link to="/restaurant/orders" className="navbar-link">
                  Orders
                </Link>
              )}

              {user.role === 'restaurant' && (
                <Link to="/restaurant/analytics" className="navbar-link">
                  Analytics
                </Link>
              )}

              {user.role === 'restaurant' && (
                <NavLink
                  to="/restaurant/ratings"
                  className={({ isActive }) =>
                    isActive ? 'navbar-link active' : 'navbar-link'
                  }
                >
                  <span className="nav-icon">⭐</span>
                  <span className="nav-text">Ratings</span>
                </NavLink>
              )}

              {user.role === 'delivery' && (
                <Link to="/delivery/orders" className="navbar-link">
                  Orders
                </Link>
              )}

              <div className="navbar-user">
                <span className="user-name">
                  {user.profile?.name || user.email}
                </span>
                <span className="user-role">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
