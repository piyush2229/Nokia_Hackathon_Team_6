// frontend/src/pages/SearchPlagiarismPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlagiarismCheck } from '../hooks/usePlagiarismCheck';
import FileUploader from '../components/FileUploader';
import LoadingOverlay from '../components/LoadingOverlay';
import { FiSearch, FiXCircle } from 'react-icons/fi';
import './SearchPlagiarismPage.css'; // Ensure you have a CSS file for styling

function SearchPlagiarismPage() {
  const navigate = useNavigate();

  const {
    loading,
    loadingMessage,
    error,
    results,
    analyseContent,
    downloadPdf, // Keep download PDF for the report
    cancelAnalysis
  } = usePlagiarismCheck();

  const [searchText, setSearchText] = useState('');
  const [searchFile, setSearchFile] = useState(null);
  const [highlightedText, setHighlightedText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!searchText && !searchFile) {
      alert("Please enter text or upload a file for search.");
      return;
    }

    // Call the core analysis function.
    // The main_text and main_file are the only relevant ones for simple search.
    const success = await analyseContent(searchText, searchFile);

    // Redirect to /history after success
    if (success) {
      navigate('/history');
    }
  };

  useEffect(() => {
    if (results && results.citations && results.citations.length > 0 && searchText) {
      let tempText = searchText;
      const citations = results.citations.filter(c => c !== "No overlaps.");

      // Simple keyword highlight based on search text
      citations.forEach(() => {
        const keywords = searchText
          .split(/\s+/)
          .filter(word => word.length > 3 && !['the','a','is','in','of'].includes(word.toLowerCase()));
        keywords.forEach(kw => {
          const regex = new RegExp(`(${kw})`, 'gi');
          tempText = tempText.replace(regex, `<mark>$1</mark>`);
        });
      });

      setHighlightedText(tempText);
    } else {
      setHighlightedText(searchText);
    }
  }, [results, searchText]);

  const handleClear = () => {
    setSearchText('');
    setSearchFile(null);
    setHighlightedText('');
  };

  return (
    <>
      {loading && (
        <LoadingOverlay message={loadingMessage} onCancel={cancelAnalysis} />
      )}

      <header className="app-header">
        <h1>Search Plagiarism</h1>
        <p className="subtitle">Quickly check text or a document for potential plagiarism against web sources.</p>
      </header>

      <div className="search-page-layout">
        <div className="search-input-section card">
          <h3 className="card-title">Enter Text or Upload File</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-field-group" style={{ marginBottom: 'var(--spacing-unit)' }}>
              <FiSearch className="input-icon" />
              <textarea
                type="text"
                className="input-field"
                placeholder="Enter text or keywords to search for..."
                rows="6"
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setSearchFile(null); }}
                disabled={loading}
              />
            </div>
            <div className="or-divider"><span>OR</span></div>
            <FileUploader
              onFileChange={(file) => {
                setSearchFile(file);
                setSearchText('');
              }}
              selectedFile={searchFile}
              label="Search File"
            />
            
            {error && (
              <div className="message-box error" style={{ marginTop: 'var(--spacing-unit)' }}>
                <FiXCircle /> {error}
              </div>
            )}

            <div className="form-actions" style={{ justifyContent: 'space-between', marginTop: 'calc(var(--spacing-unit) * 1.5)' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={loading}>
                Clear
              </button>
            </div>
          </form>
        </div>

        <div className="search-results-display card">
          <h3 className="card-title">Search Results</h3>
          {results ? (
            <>
              {/* Assuming you have a ResultsCard component */}
              {/* <ResultsCard
                originality={results.originality}
                aiProbability={results.aiProbability}
                onDownloadPdf={() => downloadPdf(results.pdfReportPath)}
                pdfReportPath={results.pdfReportPath}
              /> */}
              <div className="document-reader-style" style={{ marginTop: 'var(--spacing-unit)' }}>
                {highlightedText ? (
                  <div dangerouslySetInnerHTML={{ __html: highlightedText }} />
                ) : (
                  <p className="no-results-message">Your text will appear here with highlights from found overlaps.</p>
                )}
              </div>
              {/* Citations UI can be added here if needed */}
            </>
          ) : (
            <p className="no-results-message">Enter text or upload a document to perform a quick plagiarism search.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default SearchPlagiarismPage;
