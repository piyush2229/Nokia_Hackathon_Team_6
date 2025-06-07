import React, { useState, useEffect } from 'react';
import { usePlagiarismCheck } from '../hooks/usePlagiarismCheck';
import { useNavigate, Link } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import LoadingOverlay from '../components/LoadingOverlay';
import { FiSearch, FiXCircle, FiCheckCircle } from 'react-icons/fi';
import './SearchPlagiarismPage.css';

function SearchPlagiarismPage() {
  const {
    loading,
    loadingMessage,
    error,
    results,
    analyseContent,
    downloadPdf,
    cancelAnalysis
  } = usePlagiarismCheck();

  const [searchText, setSearchText] = useState('');
  const [searchFile, setSearchFile] = useState(null);
  const [highlightedText, setHighlightedText] = useState('');
  const [reportGenerated, setReportGenerated] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setReportGenerated(false);
    
    if (!searchText && !searchFile) {
      alert("Please enter text or upload a file for search.");
      return;
    }

    try {
      await analyseContent(searchText, searchFile);
      setReportGenerated(true);
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  };

  useEffect(() => {
    if (results && results.citations && results.citations.length > 0 && searchText) {
      let tempText = searchText;
      let overlapsExist = false;
      const citations = results.citations.filter(c => c !== "No overlaps.");

      citations.forEach(citation => {
        const match = citation.match(/\[F(\d+)\/C([\d.]+)] (.*)/);
        if (match) {
          const snippet = match[3];
          const keywords = searchText.split(/\s+/).filter(word => word.length > 3 && !['the','a','is','in','of'].includes(word.toLowerCase()));
          keywords.forEach(kw => {
            const regex = new RegExp(`(${kw})`, 'gi');
            tempText = tempText.replace(regex, `<mark>$1</mark>`);
            if (regex.test(searchText)) overlapsExist = true;
          });
        }
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
    <div className="search-plagiarism-container">
      {loading && (
        <LoadingOverlay message={loadingMessage} onCancel={cancelAnalysis} />
      )}

      <header className="search-header">
        <h1>Search Plagiarism</h1>
        <p>Quickly check text or a document for potential plagiarism against web sources.</p>
      </header>

      <div className="search-content-grid">
        <div className="search-input-card">
          <h3>Enter Text or Upload File</h3>
          <form onSubmit={handleSubmit}>
            <div className="text-input-container">
              <FiSearch className="search-icon" />
              <textarea
                placeholder="Enter text or keywords to search for..."
                rows="6"
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setSearchFile(null); }}
                disabled={loading}
              ></textarea>
            </div>
            <div className="divider-with-text">
              <div className="divider-line"></div>
              <span>OR</span>
              <div className="divider-line"></div>
            </div>
            <FileUploader
              onFileChange={(file) => {
                setSearchFile(file);
                setSearchText('');
              }}
              selectedFile={searchFile}
              label="Search File"
            />
            
            {error && (
              <div className="error-message">
                <FiXCircle /> {error}
              </div>
            )}

            {reportGenerated && (
              <div className="success-message">
                <div className="success-header">
                  <FiCheckCircle /> Report generated successfully!
                </div>
                <div className="success-actions">
                  <button 
                    className="btn btn-alt"
                    onClick={() => window.location.reload()}
                  >
                    Perform New Check
                  </button>
                  <Link 
                    to="/history" 
                    className="btn btn-main"
                  >
                    View Report History
                  </Link>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-main"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button 
                type="button" 
                className="btn btn-alt"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        <div className="results-card">
          <h3>Search Results</h3>
          {results ? (
            <>
              <div className="results-content">
                {highlightedText ? (
                  <div dangerouslySetInnerHTML={{ __html: highlightedText }} />
                ) : (
                  <p className="placeholder-text">
                    Your text will appear here with highlights from found overlaps.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="placeholder-text">
              Enter text or upload a document to perform a quick plagiarism search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPlagiarismPage;