// frontend/src/components/ResultsCard.jsx
import React from 'react';
import { FiDownload, FiCheckCircle, FiCpu } from 'react-icons/fi'; // Added icons

const ResultsCard = ({ originality, aiProbability, onDownloadPdf, pdfReportPath }) => {
  return (
    <div className="card results-card">
      <h3 className="card-title">Analysis Results</h3>
      <div className="result-grid">
        <div className="result-item originality-score">
          <p>Originality Score</p>
          <p className="score-value">
            <FiCheckCircle style={{ color: 'var(--green-500)' }} /> {/* Green check for originality */}
            {originality !== null ? `${originality.toFixed(1)}%` : 'N/A'}
          </p>
        </div>
        <div className="result-item ai-probability">
          <p>AI Probability</p>
          <p className="score-value">
            <FiCpu style={{ color: 'var(--purple-500)' }} /> {/* CPU icon for AI */}
            {aiProbability !== null ? `${aiProbability.toFixed(1)}%` : 'N/A'}
          </p>
        </div>
      </div>
      {pdfReportPath && (
        <div className="download-btn-wrapper">
          <button
            onClick={onDownloadPdf}
            className="download-btn"
          >
            <FiDownload /> Download Detailed Report
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultsCard;