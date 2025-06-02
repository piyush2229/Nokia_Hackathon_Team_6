import React, { useState, useEffect } from 'react';
import { usePlagiarismCheck } from '../hooks/usePlagiarismCheck';
import { useNavigate, Link } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import LoadingOverlay from '../components/LoadingOverlay';
import { FiSearch, FiXCircle, FiCheckCircle } from 'react-icons/fi';

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
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {loading && (
        <LoadingOverlay message={loadingMessage} onCancel={cancelAnalysis} />
      )}

      <header style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        padding: '20px 0',
        borderBottom: '1px solid #eee'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          color: '#333',
          marginBottom: '10px'
        }}>Search Plagiarism</h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#666',
          maxWidth: '800px',
          margin: '0 auto'
        }}>Quickly check text or a document for potential plagiarism against web sources.</p>
      </header>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginTop: '20px'
      }}>
        <div style={{ 
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          padding: '25px'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem',
            marginBottom: '20px',
            color: '#444'
          }}>Enter Text or Upload File</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ 
              marginBottom: '20px',
              position: 'relative'
            }}>
              <FiSearch style={{ 
                position: 'absolute',
                left: '15px',
                top: '15px',
                color: '#999',
                fontSize: '1.2rem'
              }} />
              <textarea
                type="text"
                style={{ 
                  width: '100%',
                  padding: '15px 15px 15px 40px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '150px',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
                placeholder="Enter text or keywords to search for..."
                rows="6"
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setSearchFile(null); }}
                disabled={loading}
              ></textarea>
            </div>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              margin: '20px 0',
              color: '#999'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
              <span style={{ padding: '0 15px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
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
              <div style={{ 
                marginTop: '20px',
                padding: '15px',
                borderRadius: '4px',
                backgroundColor: '#ffeeee',
                color: '#d32f2f',
                border: '1px solid #ffcdd2',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FiXCircle /> {error}
              </div>
            )}

            {reportGenerated && (
              <div style={{ 
                marginTop: '20px',
                padding: '15px',
                borderRadius: '4px',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                border: '1px solid #c8e6c9',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiCheckCircle /> Report generated successfully!
                </div>
                <div style={{ 
                  display: 'flex',
                  gap: '10px',
                  marginTop: '10px'
                }}>
                  <button 
                    style={{ 
                      padding: '8px 15px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => window.location.reload()}
                  >
                    Perform New Check
                  </button>
                  <Link 
                    to="/history" 
                    style={{ 
                      padding: '8px 15px',
                      backgroundColor: '#4285f4',
                      color: 'white',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    View Report History
                  </Link>
                </div>
              </div>
            )}

            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '30px'
            }}>
              <button 
                type="submit" 
                style={{ 
                  padding: '10px 20px',
                  backgroundColor: '#4285f4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button 
                type="button" 
                style={{ 
                  padding: '10px 20px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        <div style={{ 
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          padding: '25px'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem',
            marginBottom: '20px',
            color: '#444'
          }}>Search Results</h3>
          {results ? (
            <>
              {/* Your existing ResultsCard component would go here */}
              <div style={{ marginTop: '20px' }}>
                {highlightedText ? (
                  <div dangerouslySetInnerHTML={{ __html: highlightedText }} />
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>
                    Your text will appear here with highlights from found overlaps.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: '#999', fontStyle: 'italic' }}>
              Enter text or upload a document to perform a quick plagiarism search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPlagiarismPage;