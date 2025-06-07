// frontend/src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingOverlay from './components/LoadingOverlay';

// Import all pages using correct relative paths
import AuthPage from './pages/AuthPage'; // Correct relative import for AuthPage
import DashboardPage from './pages/DashboardPage';
import ReportHistoryPage from './pages/ReportHistoryPage';
import SearchPlagiarismPage from './pages/SearchPlagiarismPage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const { isAuthenticated, loadingAuth } = useAuth();
  const navigate = useNavigate();

  // Handle protected routes and redirects
  useEffect(() => {
    if (!loadingAuth) {
      if (!isAuthenticated) {
        // If not authenticated, and not on the auth page, redirect to auth
        if (window.location.pathname !== '/auth') {
          navigate('/auth', { replace: true });
        }
      } else {
        // If authenticated, and currently on the auth page, redirect to dashboard
        if (window.location.pathname === '/auth') {
          navigate('/', { replace: true });
        }
      }
    }
  }, [isAuthenticated, loadingAuth, navigate]);

  if (loadingAuth) {
    return <LoadingOverlay message="Checking authentication..." />;
  }

  return (
    <>
      <Navbar />
      {/* The app-container div ensures main content respects max-width and padding */}
      <div className="app-container">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          {/* Protected Routes */}
          {isAuthenticated ? (
            <>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/history" element={<ReportHistoryPage />} />
              <Route path="/search" element={<SearchPlagiarismPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {/* Fallback for any other path if authenticated */}
              <Route path="*" element={<DashboardPage />} />
            </>
          ) : (
            // Fallback for any other route if not authenticated, redirect to /auth
            <Route path="*" element={<AuthPage />} />
          )}
        </Routes>
      </div>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;