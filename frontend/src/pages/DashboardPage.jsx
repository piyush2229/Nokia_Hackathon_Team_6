// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingOverlay from '../components/LoadingOverlay';
import { FiClock, FiSearch, FiUser, FiAlertCircle } from 'react-icons/fi';
import './DashboardPage.css';

function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!isAuthenticated) {
        setLoadingStats(false);
        return;
      }
      setLoadingStats(true);
      setErrorStats(null);
      try {
        const response = await fetch('http://127.0.0.1:5000/api/dashboard_stats', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setDashboardStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setErrorStats("Failed to load dashboard data. Please try again.");
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, [isAuthenticated]);

  if (loadingStats) {
    return <LoadingOverlay message="Loading dashboard..." />;
  }

  return (
    <>
      <div className="page-welcome-header">
        <h2>Welcome back, {user?.name || 'User'}!</h2>
        <p>Here's a quick overview of your activity on the Detection Platform.</p>
      </div>

      {errorStats && (
        <div className="message-box error" style={{ marginBottom: 'var(--spacing-unit)' }}>
          <FiAlertCircle /> {errorStats}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Total Reports Card */}
        <div className="card dashboard-card">
          <h3>Total Reports Submitted</h3>
          <p className="value">{dashboardStats?.total_reports || 0}</p>
          <p className="sub-value">Analyzed documents</p>
        </div>

        {/* Last Checked Document Card */}
        <div className="card dashboard-card last-checked-doc-card" style={{ gridColumn: 'span 2' }}>
          <h3>Last Checked Document</h3>
          {dashboardStats?.last_checked_document ? (
            <>
              <p className="meta-info">
                File: <strong>{dashboardStats.last_checked_document.file_name}</strong>
              </p>
              <p className="meta-info">
                Date: <strong>{new Date(dashboardStats.last_checked_document.submission_date).toLocaleDateString()}</strong>
              </p>
              <div className="score-display" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                {/* Simplified originality display */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1f2937' }}>
                    {dashboardStats.last_checked_document.originality_score.toFixed(0)}%
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-light-color)', marginTop: '0.5rem' }}>
                    Originality
                  </p>
                </div>

                {/* Replace circle with simple linear bar + percentage for AI Probability */}
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="aiProbability"
                    style={{ fontSize: '0.8rem', color: 'var(--text-light-color)', marginBottom: '0.3rem', display: 'block' }}
                  >
                    AI Probability
                  </label>
                  <progress
                    id="aiProbability"
                    value={dashboardStats.last_checked_document.ai_probability}
                    max="100"
                    style={{ width: '100%', height: '1rem', borderRadius: '0.25rem' }}
                  />
                  <p style={{ fontSize: '0.8rem', textAlign: 'right', marginTop: '0.2rem' }}>
                    {dashboardStats.last_checked_document.ai_probability.toFixed(0)}%
                  </p>
                </div>
              </div>
              {dashboardStats.last_checked_document.pdf_file_name && (
                <Link
                  to={`/download-report/${dashboardStats.last_checked_document.pdf_file_name}`}
                  className="btn btn-secondary"
                  style={{ marginTop: '1rem' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Last Report
                </Link>
              )}
            </>
          ) : (
            <p className="sub-value">No documents checked yet. Start by uploading one!</p>
          )}
        </div>

        {/* Quick Links Card */}
        <div className="card dashboard-card">
          <h3>Quick Actions</h3>
          <div className="dashboard-quick-links">
            <Link to="/history" className="btn btn-primary">
              <FiClock /> View History
            </Link>
            <Link to="/search" className="btn btn-primary">
              <FiSearch /> Quick Search
            </Link>
            <Link to="/profile" className="btn btn-primary">
              <FiUser /> Your Profile
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;
