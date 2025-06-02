// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { usePlagiarismCheck } from '../hooks/usePlagiarismCheck';
import { useAuth } from '../hooks/useAuth.jsx'; // Import useAuth to get user name
import FileUploader from '../components/FileUploader';
import ResultsCard from '../components/ResultsCard';
import CitationTable from '../components/CitationTable';
import MobileCitationList from '../components/MobileCitationList';
import LoadingOverlay from '../components/LoadingOverlay';
import { FiInfo, FiXCircle } from 'react-icons/fi';

function HomePage() {
  const { user } = useAuth(); // Get user from auth context

  const {
    loading,
    loadingMessage,
    error,
    results,
    analyseContent,
    downloadPdf,
    cancelAnalysis
  } = usePlagiarismCheck();

  const [mainText, setMainText] = useState('');
  const [mainFile, setMainFile] = useState(null);
  const [comparisonText, setComparisonText] = useState('');
  const [comparisonFile, setComparisonFile] = useState(null);
  const [showMobileCitations, setShowMobileCitations] = useState(false);

  const resultsRef = useRef(null);

  // Determine if mobile view based on window width
  useEffect(() => {
    const handleResize = () => {
      setShowMobileCitations(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to results when they are available
  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [results]);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mainText && !mainFile) {
      alert("Please provide main text or upload a main file for analysis.");
      return;
    }

    await analyseContent(mainText, mainFile, comparisonText, comparisonFile);
  };

  const handleClearInputs = () => {
    setMainText('');
    setMainFile(null);
    setComparisonText('');
    setComparisonFile(null);
    // Optionally clear results and error messages on clear
    // setResults(null);
    // setError(null);
  };

  return (
    <>
      {/* Loading Overlay (now a separate component) */}
      {loading && (
        <LoadingOverlay message={loadingMessage} onCancel={cancelAnalysis} />
      )}

      {/* Prominent Welcome Message on the Page */}
      <div className="page-welcome-header">
        <h2>Hello, {user?.name || 'User'}!</h2>
        <p>Ready to check your whitepaper or research document for originality?</p>
      </div>

      <form onSubmit={handleSubmit} className="analysis-form">
        <div className="input-section">
          <div className="input-group">
            <label htmlFor="main-text">Main Document for Analysis</label>
            <textarea
              id="main-text"
              className="text-input"
              placeholder="Paste your text here (e.g., essay, article, research paper)..."
              value={mainText}
              onChange={(e) => {
                setMainText(e.target.value);
                setMainFile(null);
              }}
              rows="10"
              disabled={loading}
            ></textarea>
            <div className="or-divider"><span>OR</span></div>
            <FileUploader
              onFileChange={(file) => {
                setMainFile(file);
                setMainText('');
              }}
              selectedFile={mainFile}
              label="Main File"
            />
          </div>

          <div className="input-group">
            <label htmlFor="comparison-text">Comparison Document (Optional)</label>
            <textarea
              id="comparison-text"
              className="text-input"
              placeholder="Paste text for comparison (e.g., source material)..."
              value={comparisonText}
              onChange={(e) => {
                setComparisonText(e.target.value);
                setComparisonFile(null);
              }}
              rows="10"
              disabled={loading}
            ></textarea>
            <div className="or-divider"><span>OR</span></div>
            <FileUploader
              onFileChange={(file) => {
                setComparisonFile(file);
                setComparisonText('');
              }}
              selectedFile={comparisonFile}
              label="Comparison File"
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            <FiXCircle /> {error}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="analyze-btn" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Content'}
          </button>
          <button type="button" className="clear-btn" onClick={handleClearInputs} disabled={loading}>
            Clear All Inputs
          </button>
        </div>
      </form>

      {results && (
        <div className="results-section" ref={resultsRef}>
          <ResultsCard
            originality={results.originality}
            aiProbability={results.aiProbability}
            onDownloadPdf={() => downloadPdf(results.pdfReportPath)}
            pdfReportPath={results.pdfReportPath}
          />
          {showMobileCitations ? (
            <MobileCitationList citations={results.citations} />
          ) : (
            <CitationTable citations={results.citations} />
          )}
          
          <div className="info-box">
              <FiInfo />
              <p>
                  The "Comparison Document" feature is currently accepted but not yet fully integrated into the core plagiarism logic.
                  Currently, analysis primarily compares your main document against web sources.
                  A detailed report is available for download as a PDF.
              </p>
          </div>
        </div>
      )}
    </>
  );
}

export default HomePage;