// frontend/src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../hooks/useAuth.jsx';
import { FiMail, FiLock, FiUser, FiInfo, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import './AuthPage.css';

function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState(null);
  
  // --- NEW: State for the self-hosted CAPTCHA ---
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaUrl, setCaptchaUrl] = useState('');

  const { login, register, loadingAuth } = useAuth();

  // --- NEW: Function to refresh the CAPTCHA image ---
  const refreshCaptcha = () => {
    // Appending a timestamp to the URL busts the browser cache
    setCaptchaUrl(`${API_BASE_URL}/api/auth/captcha?_=${new Date().getTime()}`);
  };

  // --- NEW: useEffect to load CAPTCHA on component mount and tab switch ---
  useEffect(() => {
    refreshCaptcha();
  }, [activeTab]); // Reruns when the active tab changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    let response;
    if (activeTab === 'login') {
      response = await login(email, password, captchaInput);
    } else { // signup
      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: "Passwords do not match." });
        refreshCaptcha(); // Get a new captcha after a failed attempt
        setCaptchaInput('');
        return;
      }
      if (password.length < 6) {
        setMessage({ type: 'error', text: "Password must be at least 6 characters long." });
        refreshCaptcha(); // Get a new captcha after a failed attempt
        setCaptchaInput('');
        return;
      }
      response = await register(email, password, name, captchaInput);
    }
    
    // Handle response
    if (response && response.error) {
        setMessage({ type: 'error', text: response.error });
    } else if (activeTab === 'signup') {
        setMessage({ type: 'success', text: "Registration successful! You are now logged in." });
    }
    
    // Always get a new CAPTCHA and clear the input after any submission attempt
    refreshCaptcha();
    setCaptchaInput('');
  };
  
  const handleTabSwitch = (tabName) => {
    setActiveTab(tabName);
    setMessage(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setCaptchaInput('');
    // The useEffect will automatically refresh the captcha
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('login')}
            disabled={loadingAuth}
          >
            Login
          </button>
          <button
            className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('signup')}
            disabled={loadingAuth}
          >
            Sign Up
          </button>
        </div>

        {message && (
          <div className={`message-box ${message.type}`}>
            {message.type === 'error' ? <FiXCircle /> : <FiInfo />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-field-group">
            <FiMail className="input-icon" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loadingAuth} />
          </div>
          <div className="input-field-group">
            <FiLock className="input-icon" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loadingAuth} />
          </div>

          {activeTab === 'signup' && (
            <>
              <div className="input-field-group">
                <FiLock className="input-icon" />
                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loadingAuth} />
              </div>
              <div className="input-field-group">
                <FiUser className="input-icon" />
                <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required disabled={loadingAuth} />
              </div>
            </>
          )}

          {/* --- NEW: Self-hosted CAPTCHA section --- */}
          <div className="captcha-container">
            <img src={captchaUrl} alt="CAPTCHA" className="captcha-image" />
            <button type="button" onClick={refreshCaptcha} className="captcha-refresh-btn" aria-label="Refresh CAPTCHA">
                <FiRefreshCw />
            </button>
          </div>
          <div className="input-field-group">
             <input
              type="text"
              placeholder="Enter CAPTCHA"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              required
              disabled={loadingAuth}
              style={{ paddingLeft: '15px' }} // No icon, so less padding needed
            />
          </div>


          <button type="submit" className="auth-submit-btn btn btn-primary" disabled={loadingAuth}>
            {loadingAuth ? 'Processing...' : (activeTab === 'login' ? 'Login' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
}
export default AuthPage;