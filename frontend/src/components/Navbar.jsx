// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx'; // Explicitly use .jsx
import { FiLogOut, FiUser } from 'react-icons/fi';
// frontend/src/components/Navbar.jsx

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // The App.jsx useEffect will handle navigation to /auth after logout
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        Detection Platform
      </Link>
      <div className="navbar-user-info">
        {isAuthenticated ? (
          <>
            <span className="welcome-message">
              Welcome, {user.name}!
            </span>
            {user.profile_pic ? (
              <img src={user.profile_pic} alt={user.name} />
            ) : (
              <FiUser style={{ fontSize: '2rem', color: 'var(--primary-color)' }} />
            )}
            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut /> Logout
            </button>
          </>
        ) : (
          <Link to="/auth" className="login-btn">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;