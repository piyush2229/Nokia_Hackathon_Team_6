// frontend/src/components/LoadingOverlay.jsx
import React from 'react';

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