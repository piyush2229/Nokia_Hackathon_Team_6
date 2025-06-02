// frontend/src/components/Footer.jsx
import React from 'react';
import './Footer.css'; // Ensure you have a CSS file for styling
const Footer = () => {
  return (
    <footer className="app-footer">
      <p>© {new Date().getFullYear()} Detection Platform. All rights reserved.</p>
      <p>Tailored for Whitepapers & Research Documents.</p>
    </footer>
  );
};

export default Footer;