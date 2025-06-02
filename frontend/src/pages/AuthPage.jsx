// frontend/src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { FiMail, FiLock, FiUser, FiInfo, FiXCircle } from 'react-icons/fi'; // Added FiUser for name input

function AuthPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '...' }

  const { login, register, loadingAuth } = useAuth(); // Renamed loadingAuth from the hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null); // Clear previous messages

    if (activeTab === 'login') {
      const response = await login(email, password);
      if (response && response.error) {
        setMessage({ type: 'error', text: response.error });
      } else {
        // Login successful, App.jsx useEffect will redirect
      }
    } else { // signup
      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: "Passwords do not match." });
        return;
      }
      if (password.length < 6) { // Basic password policy
        setMessage({ type: 'error', text: "Password must be at least 6 characters long." });
        return;
      }

      const response = await register(email, password, name);
      if (response && response.error) {
        setMessage({ type: 'error', text: response.error });
      } else {
        setMessage({ type: 'success', text: "Registration successful! You are now logged in." });
        // Optionally switch to login tab or redirect immediately after successful signup
        // App.jsx useEffect will redirect if registration logs them in
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setMessage(null); }}
            disabled={loadingAuth}
          >
            Login
          </button>
          <button
            className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => { setActiveTab('signup'); setMessage(null); }}
            disabled={loadingAuth}
          >
            Sign Up
          </button>
        </div>

        {message && (
          <div className={`auth-message ${message.type}`}>
            {message.type === 'error' ? <FiXCircle /> : <FiInfo />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-field-group">
            <FiMail className="input-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loadingAuth}
            />
          </div>
          <div className="input-field-group">
            <FiLock className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loadingAuth}
            />
          </div>

          {activeTab === 'signup' && (
            <>
              <div className="input-field-group">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loadingAuth}
                />
              </div>
              <div className="input-field-group">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loadingAuth}
                />
              </div>
            </>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loadingAuth}>
            {loadingAuth ? 'Processing...' : (activeTab === 'login' ? 'Login' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;