// frontend/src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/hooks/useAuth.jsx';
import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';
import HomePage from '../src/pages/HomePage';
import AuthPage from '../src/pages/AuthPage'; // NEW: AuthPage for login/signup
import LoadingOverlay from '../src/components/LoadingOverlay';

function AppContent() {
  const { isAuthenticated, loadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingAuth) {
      // If not authenticated, redirect to /auth
      if (!isAuthenticated) {
        if (window.location.pathname !== '/auth') {
          navigate('/auth', { replace: true });
        }
      } else {
        // If authenticated, and currently on /auth, redirect to home
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
    <> {/* Removed app-container here as Navbar/Footer are outside */}
      <Navbar />
      <div className="app-container"> {/* This div now holds the main content */}
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          {/* Protected Route: Only accessible if isAuthenticated is true */}
          {isAuthenticated ? (
            <Route path="/" element={<HomePage />} />
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