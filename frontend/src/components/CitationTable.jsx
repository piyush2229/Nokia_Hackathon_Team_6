// frontend/src/components/CitationTable.jsx
import React from 'react';

import './CitationTable.css'; // Import the CSS file for styling

const CitationTable = ({ citations }) => {
  if (!citations || citations.length === 0 || (citations.length === 1 && citations[0] === "No overlaps.")) {
    return (
      <div className="card citation-table-container">
        <h3 className="card-title">Detected Overlaps</h3>
        <p className="no-results-message">No significant overlaps detected.</p>
      </div>
    );
  }

  // Parse citations from the format "[F{fs}/C{cs}] {u}"
  // We still parse them here, but will only display the URL
  const parsedCitations = citations
    .filter(citation => citation !== "No overlaps.") // Filter out the specific string
    .map(citation => {
      const match = citation.match(/\[F(\d+)\/C([\d.]+)] (.*)/);
      if (match) {
        return {
          fuzz: parseInt(match[1], 10),
          cosine: parseFloat(match[2]),
          url: match[3]
        };
      }
      return { fuzz: 'N/A', cosine: 'N/A', url: citation }; // Fallback for unexpected formats
    });

  if (parsedCitations.length === 0) {
    return (
      <div className="card citation-table-container">
        <h3 className="card-title">Detected Overlaps</h3>
        <p className="no-results-message">No significant overlaps detected.</p>
      </div>
    );
  }

  return (
    <div className="card citation-table-container">
      <h3 className="card-title">Detected Overlaps</h3>
      <table className="citation-table">
        <thead>
          <tr>
            {/* Removed Fuzz Score and Cosine Score columns */}
            <th>Source URL</th>
          </tr>
        </thead>
        <tbody>
          {parsedCitations.map((cite, index) => (
            <tr key={index}>
              <td>
                <a href={cite.url} target="_blank" rel="noopener noreferrer">
                  {cite.url}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CitationTable;