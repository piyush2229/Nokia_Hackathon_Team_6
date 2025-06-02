import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  FiLogOut,
  FiUser,
  FiMenu,
  FiX,
  FiHome,
  FiUploadCloud,
  FiClock,
  FiSearch,
  FiSettings
} from 'react-icons/fi';

import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinks = isAuthenticated ? [
    { to: "/", icon: <FiHome />, label: "Dashboard" },
    { to: "/history", icon: <FiClock />, label: "Reports History" },
    { to: "/search", icon: <FiSearch />, label: "Search Plagiarism" },
    { to: "/profile", icon: <FiUser />, label: "Profile" },
  ] : [];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
        Detection Platform
      </Link>

      <div className="navbar-desktop-links">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link-desktop ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="navbar-user-info">
        {isAuthenticated ? (
          <>
            <span className="welcome-message">
              Welcome, {user.name}!
            </span>
            <div style={{ position: 'relative', display: 'inline-block', width: '40px', height: '40px' }}>
              <FiUser style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }} />
              <FiSettings
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  padding: '2px',
                  fontSize: '0.75rem',
                  color: 'var(--primary-color)',
                  boxShadow: '0 0 3px rgba(0, 0, 0, 0.2)',
                }}
              />
            </div>
            <button onClick={handleLogout} className="logout-btn btn btn-primary">
              <FiLogOut /> Logout
            </button>
          </>
        ) : (
          <Link to="/auth" className="login-btn btn btn-primary">
            Login
          </Link>
        )}

        {isAuthenticated && (
          <button className="hamburger-menu" onClick={toggleMobileMenu}>
            <FiMenu />
          </button>
        )}
      </div>

      {isAuthenticated && (
        <div className={`mobile-nav-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={closeMobileMenu}>
          <div className="mobile-nav-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <h4>Navigation</h4>
              <button className="mobile-nav-close-btn" onClick={closeMobileMenu}>
                <FiX />
              </button>
            </div>
            <div className="mobile-nav-links">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `nav-link-mobile ${isActive ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  {link.icon} {link.label}
                </NavLink>
              ))}
            </div>
            <div className="mobile-nav-user-details">
              <div style={{ position: 'relative', display: 'inline-block', width: '48px', height: '48px' }}>
                <FiUser style={{ fontSize: '3rem', color: 'var(--primary-color)' }} />
                <FiSettings
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    padding: '2px',
                    fontSize: '0.85rem',
                    color: 'var(--primary-color)',
                    boxShadow: '0 0 3px rgba(0, 0, 0, 0.2)',
                  }}
                />
              </div>
              <span>{user.name}</span>
              <small>{user.email}</small>
              <button onClick={handleLogout} className="logout-btn btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                <FiLogOut /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
