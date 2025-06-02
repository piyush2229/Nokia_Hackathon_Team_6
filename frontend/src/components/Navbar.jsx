// frontend/src/components/Navbar.jsx
import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom'; // Use NavLink for active styling
import { useAuth } from '../hooks/useAuth.jsx';
import { FiLogOut, FiUser, FiMenu, FiX, FiHome, FiUploadCloud, FiClock, FiSearch, FiSettings } from 'react-icons/fi';

import './Navbar.css'; // Ensure you have a CSS file for styling
const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false); // Close menu on logout
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

      {/* Desktop Navigation (hidden on mobile) */}
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
            {user.profile_pic ? (
              <img src={user.profile_pic} alt={user.name} />
            ) : (
              <FiUser style={{ fontSize: '2rem', color: 'var(--primary-color)' }} />
            )}
            <button onClick={handleLogout} className="logout-btn btn btn-primary"> {/* Use btn styles */}
              <FiLogOut /> Logout
            </button>
          </>
        ) : (
          <Link to="/auth" className="login-btn btn btn-primary"> {/* Use btn styles */}
            Login
          </Link>
        )}

        {/* Hamburger Menu Icon (visible on mobile) */}
        {isAuthenticated && (
          <button className="hamburger-menu" onClick={toggleMobileMenu}>
            <FiMenu />
          </button>
        )}
      </div>

      {/* Mobile Navigation Overlay */}
      {isAuthenticated && (
        <div className={`mobile-nav-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={closeMobileMenu}>
          <div className="mobile-nav-sidebar" onClick={(e) => e.stopPropagation()}> {/* Prevent closing on sidebar click */}
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
              {user.profile_pic ? (
                <img src={user.profile_pic} alt={user.name} />
              ) : (
                <FiUser style={{ fontSize: '3rem', color: 'var(--primary-dark-color)' }} />
              )}
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