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
      <div className="page-element-header-new">
        <h2>Welcome back, {user?.name || 'User'}!</h2>
        <p>Here's a quick overview of your activity on the Detection Platform.</p>
      </div>

      {errorStats && (
        <div className="page-element-error-new">
          <FiAlertCircle /> {errorStats}
        </div>
      )}

      <div className="page-element-column-container-new">
        <div className="page-element-row-new">
          <div className="page-element-card-new page-element-half-new">
            <h3>Total Reports Submitted</h3>
            <p className="page-element-value-new">{dashboardStats?.total_reports || 0}</p>
            <p className="page-element-subvalue-new">Analyzed documents</p>
          </div>

          <div className="page-element-card-new page-element-half-new">
            <h3>Quick Actions</h3>
            <div className="page-element-links-new">
              <Link to="/history" className="btn-modern">
                <FiClock /> View History
              </Link>
              <Link to="/search" className="btn-modern">
                <FiSearch /> Quick Search
              </Link>
              <Link to="/profile" className="btn-modern">
                <FiUser /> Your Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="page-element-card-new page-element-full-new">
          <h3>Last Checked Document</h3>
          {dashboardStats?.last_checked_document ? (
            <>
              <p className="page-element-meta-new">
                File: <strong>{dashboardStats.last_checked_document.file_name}</strong>
              </p>
              <p className="page-element-meta-new">
                Date: <strong>{new Date(dashboardStats.last_checked_document.submission_date).toLocaleDateString()}</strong>
              </p>
              <div className="page-element-scores-new">
                <div className="page-element-circle-new">
                  <span>{dashboardStats.last_checked_document.originality_score.toFixed(0)}%</span>
                  <p>Originality</p>
                </div>
                <div className="page-element-circle-new ai">
                  <span>{dashboardStats.last_checked_document.ai_probability.toFixed(0)}%</span>
                  <p>AI Probability</p>
                </div>
              </div>
              {dashboardStats.last_checked_document.pdf_file_name && (
                <Link
                  to={`/download-report/${dashboardStats.last_checked_document.pdf_file_name}`}
                  className="btn-modern-outline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Last Report
                </Link>
              )}
            </>
          ) : (
            <p className="page-element-subvalue-new">No documents checked yet. Start by uploading one!</p>
          )}
        </div>
      </div>
    </>
  );
}

export default DashboardPage;
