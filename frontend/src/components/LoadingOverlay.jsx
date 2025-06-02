// frontend/src/components/LoadingOverlay.jsx
import React from 'react';
import './LoadingOverlay.css'; // Ensure you have a CSS file for styling

const LoadingOverlay = ({ message, onCancel }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
      {onCancel && (
        <button onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
      )}
    </div>
  );
};

export default LoadingOverlay;