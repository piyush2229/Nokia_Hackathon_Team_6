// frontend/src/pages/LoginPage.jsx
import React from 'react';
import { FiMail } from 'react-icons/fi'; // Icon for Google login

const LoginPage = () => {
  const handleGoogleLogin = () => {
    // Redirect to Flask's Google OAuth login endpoint
    window.location.href = 'http://127.0.0.1:5000/login';
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Welcome</h2>
        <p>Sign in to access the Detection Platform and analyze your documents.</p>
        <button onClick={handleGoogleLogin} className="google-sign-in-btn">
          <FiMail /> Sign In with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;