// frontend/src/components/MobileCitationList.jsx
import React from 'react';
import { FiLink } from 'react-icons/fi';

const MobileCitationList = ({ citations }) => {
  if (!citations || citations.length === 0 || (citations.length === 1 && citations[0] === "No overlaps.")) {
    return (
      <div className="card mobile-citation-list-container">
        <h3 className="card-title">Detected Overlaps</h3>
        <p className="no-results-message">No significant overlaps detected.</p>
      </div>
    );
  }

  // Parse citations from the format "[F{fs}/C{cs}] {u}"
  // We still parse them here, but will only display the URL
  const parsedCitations = citations
    .filter(citation => citation !== "No overlaps.")
    .map(citation => {
      const match = citation.match(/\[F(\d+)\/C([\d.]+)] (.*)/);
      if (match) {
        return {
          fuzz: parseInt(match[1], 10),
          cosine: parseFloat(match[2]),
          url: match[3]
        };
      }
      return { fuzz: 'N/A', cosine: 'N/A', url: citation }; // Fallback
    });

  if (parsedCitations.length === 0) {
    return (
      <div className="card mobile-citation-list-container">
        <h3 className="card-title">Detected Overlaps</h3>
        <p className="no-results-message">No significant overlaps detected.</p>
      </div>
    );
  }

  return (
    <div className="card mobile-citation-list-container">
      <h3 className="card-title">Detected Overlaps</h3>
      <ul className="mobile-citation-list">
        {parsedCitations.map((cite, index) => (
          <li key={index}>
            {/* Removed Fuzz and Cosine scores from mobile display */}
            <a
              href={cite.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              <FiLink />
              {cite.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MobileCitationList;