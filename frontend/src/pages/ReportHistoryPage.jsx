import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ✅ Fix: Added for navigation
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingOverlay from '../components/LoadingOverlay';
import { FiDownload, FiClock, FiAlertCircle, FiUploadCloud } from 'react-icons/fi'; // ✅ Added FiUploadCloud
import './ReportHistoryPage.css'; // Ensure you have a CSS file for styling

const API_BASE_URL = 'http://127.0.0.1:5000'; // Your Flask backend URL

function ReportHistoryPage() {
  const { isAuthenticated } = useAuth();
  const [reports, setReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorHistory, setErrorHistory] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isAuthenticated) {
        setLoadingHistory(false);
        return;
      }
      setLoadingHistory(true);
      setErrorHistory(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/history`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setReports(data);
      } catch (err) {
        console.error("Failed to fetch reports history:", err);
        setErrorHistory("Failed to load reports history. Please try again.");
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated]);

  const handleDownloadPdf = async (pdfFileName) => {
    if (!pdfFileName) {
      alert("No PDF report available for download.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/download-report/${pdfFileName}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plagiarism_report.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert(err.message || "Failed to download PDF report.");
    }
  };

  if (loadingHistory) {
    return <LoadingOverlay message="Loading reports history..." />;
  }

  return (
    <>
      <header className="app-header">
        <h1>Reports History</h1>
        <p className="subtitle">View your previously submitted and analyzed documents.</p>
      </header>

      {errorHistory && (
        <div className="message-box error" style={{ marginBottom: 'var(--spacing-unit)' }}>
          <FiAlertCircle /> {errorHistory}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-unit) * 3' }}>
          <FiClock style={{ fontSize: '3rem', color: 'var(--text-light-color)', marginBottom: '1rem' }} />
          <p className="no-results-message">No reports found. Submit a document to see your history here!</p>
          <Link to="/check" className="btn btn-primary" style={{ marginTop: 'var(--spacing-unit)' }}>
            <FiUploadCloud /> Start New Analysis
          </Link>
        </div>
      ) : (
        <div className="reports-history-list">
          {reports.map((report) => (
            <div key={report._id} className="history-item-card">
              <div className="item-detail">
                <strong>{report.file_name}</strong>
                <span>{new Date(report.submission_date).toLocaleString()}</span>
              </div>
              <div className="item-detail">
                <span>Originality:</span>
                <span className="score-value-sm originality">{report.originality_score.toFixed(1)}%</span>
              </div>
              <div className="item-detail">
                <span>AI Probability:</span>
                <span className="score-value-sm ai-probability">{report.ai_probability.toFixed(1)}%</span>
              </div>
              <div className="history-item-actions">
                {report.pdf_file_name && (
                  <button
                    onClick={() => handleDownloadPdf(report.pdf_file_name)}
                    className="btn btn-primary"
                  >
                    <FiDownload /> Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default ReportHistoryPage;
