import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="profile">
      <h1>Delivery Partner Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">🚚</div>
          <h2>{user?.profile?.name || 'Delivery Partner'}</h2>
        </div>
        <div className="profile-details">
          <div className="detail-row">
            <span className="label">Email:</span>
            <span className="value">{user?.email}</span>
          </div>
          <div className="detail-row">
            <span className="label">Vehicle Type:</span>
            <span className="value">{user?.profile?.vehicleType || 'Not specified'}</span>
          </div>
          <div className="detail-row">
            <span className="label">License Plate:</span>
            <span className="value">{user?.profile?.licensePlate || 'Not provided'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Phone:</span>
            <span className="value">{user?.profile?.phone || 'Not provided'}</span>
          </div>
        </div>
        <button className="btn btn-primary">Edit Profile</button>
      </div>
    </div>
  );
};

export default Profile;
