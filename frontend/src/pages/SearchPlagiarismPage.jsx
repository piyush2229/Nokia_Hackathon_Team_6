// frontend/src/pages/SearchPlagiarismPage.jsx
import React, { useState, useEffect } from 'react';
import { usePlagiarismCheck } from '../hooks/usePlagiarismCheck';
import FileUploader from '../components/FileUploader';
import LoadingOverlay from '../components/LoadingOverlay';
import { FiSearch, FiXCircle, FiInfo } from 'react-icons/fi';
import './SearchPlagiarismPage.css'; // Ensure you have a CSS file for styling
function SearchPlagiarismPage() {
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
    await analyseContent(searchText, searchFile);
  };

  useEffect(() => {
    if (results && results.citations && results.citations.length > 0 && searchText) {
      let tempText = searchText;
      let overlapsExist = false;
      const citations = results.citations.filter(c => c !== "No overlaps.");

      // For a simple search, we just highlight any occurrence of terms from overlaps
      // A more sophisticated approach would involve re-analyzing the main text with regex or NLP for found overlaps.
      // For this example, we'll do a very basic highlight based on snippets.
      citations.forEach(citation => {
        const match = citation.match(/\[F(\d+)\/C([\d.]+)] (.*)/);
        if (match) {
          // This is a very simplistic highlighting. In a real scenario, you'd match the 'sn' (source_text) from backend.
          // Since the backend only sends URL in the current frontend setup, this is illustrative.
          // For true highlighting, backend needs to return the matched text snippets.
          // For now, let's just highlight words found in snippets of the results.
          const snippet = match[3]; // This is the URL
          // If backend provided "sn" (source_text) in citations:
          // const overlapSnippet = citation.split('] ')[1].split('<br/>')[0].replace('<i>','').replace('</i>','').replace('…','');
          // For simplicity, let's just try to highlight a few words from the search query.
          const keywords = searchText.split(/\s+/).filter(word => word.length > 3 && !['the','a','is','in','of'].includes(word.toLowerCase()));
          keywords.forEach(kw => {
            const regex = new RegExp(`(${kw})`, 'gi');
            tempText = tempText.replace(regex, `<mark>$1</mark>`);
            if (regex.test(searchText)) overlapsExist = true;
          });
        }
      });
      
      setHighlightedText(tempText);
      // You could also iterate over the original `cite_txt` if it contained the `sn` (source text) from backend
      // and highlight *those specific sentences* within the `searchText`.
      // For a document reader, you'd load the full text and highlight.
      // This is a placeholder for highlighting logic.
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
              ></textarea>
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
              <ResultsCard
                originality={results.originality}
                aiProbability={results.aiProbability}
                onDownloadPdf={() => downloadPdf(results.pdfReportPath)}
                pdfReportPath={results.pdfReportPath}
              />
              <div className="document-reader-style" style={{ marginTop: 'var(--spacing-unit)' }}>
                {highlightedText ? (
                  <div dangerouslySetInnerHTML={{ __html: highlightedText }} />
                ) : (
                  <p className="no-results-message">Your text will appear here with highlights from found overlaps.</p>
                )}
              </div>
              {results.citations && results.citations.length > 0 && results.citations[0] !== "No overlaps." && (
                <div style={{ marginTop: 'var(--spacing-unit)' }}>
                  {window.innerWidth <= 768 ? (
                    <MobileCitationList citations={results.citations} />
                  ) : (
                    <CitationTable citations={results.citations} />
                  )}
                </div>
              )}
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