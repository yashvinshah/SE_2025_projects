import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="profile">
      <h1>Restaurant Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">🍽️</div>
          <h2>{user?.profile?.name || 'Restaurant'}</h2>
        </div>
        <div className="profile-details">
          <div className="detail-row">
            <span className="label">Email:</span>
            <span className="value">{user?.email}</span>
          </div>
          <div className="detail-row">
            <span className="label">Cuisine:</span>
            <span className="value">{user?.profile?.cuisine || 'Not specified'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Phone:</span>
            <span className="value">{user?.profile?.phone || 'Not provided'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Address:</span>
            <span className="value">
              {user?.profile?.address ? 
                `${user.profile.address.street}, ${user.profile.address.city}, ${user.profile.address.state} ${user.profile.address.zipCode}` :
                'Not provided'
              }
            </span>
          </div>
        </div>
        <button className="btn btn-primary">Edit Profile</button>
      </div>
    </div>
  );
};

export default Profile;
