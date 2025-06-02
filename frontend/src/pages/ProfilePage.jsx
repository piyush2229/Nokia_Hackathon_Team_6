// frontend/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingOverlay from '../components/LoadingOverlay';
import { FiMail, FiUser, FiInfo, FiFileText } from 'react-icons/fi';

const API_BASE_URL = 'http://127.0.0.1:5000';

import './ProfilePage.css'; // Ensure you have a CSS file for styling
function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [totalReports, setTotalReports] = useState(null);
  const [loadingProfileStats, setLoadingProfileStats] = useState(true);
  const [errorProfileStats, setErrorProfileStats] = useState(null);

  useEffect(() => {
    const fetchProfileStats = async () => {
      if (!isAuthenticated) {
        setLoadingProfileStats(false);
        return;
      }
      setLoadingProfileStats(true);
      setErrorProfileStats(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard_stats`, { // Re-use dashboard stats endpoint
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setTotalReports(data.total_reports);
      } catch (err) {
        console.error("Failed to fetch profile stats:", err);
        setErrorProfileStats("Failed to load profile data. Please try again.");
      } finally {
        setLoadingProfileStats(false);
      }
    };

    fetchProfileStats();
  }, [isAuthenticated]);

  if (loadingProfileStats) {
    return <LoadingOverlay message="Loading profile..." />;
  }

  return (
    <>
      <header className="app-header">
        <h1>Your Profile</h1>
        <p className="subtitle">Manage your account information and view your activity summary.</p>
      </header>

      {errorProfileStats && (
        <div className="message-box error" style={{ marginBottom: 'var(--spacing-unit)' }}>
          <FiAlertCircle /> {errorProfileStats}
        </div>
      )}

      <div className="profile-card card">
        <img src={user?.profile_pic || 'https://via.placeholder.com/120'} alt="Profile" className="profile-avatar" />
        <h3>{user?.name || 'User'}</h3>
        <p><FiMail /> {user?.email || 'N/A'}</p>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="value">{totalReports !== null ? totalReports : '...'}</span>
            <span className="label">Total Reports Submitted</span>
          </div>
        </div>

        <div className="profile-actions">
          {/* Placeholder for future features */}
          <div className="message-box info">
            <FiInfo />
            <p>Profile picture update and other account settings are coming soon!</p>
          </div>
          {/* <button className="btn btn-primary">Update Profile</button> */}
        </div>
      </div>
    </>
  );
}

export default ProfilePage;