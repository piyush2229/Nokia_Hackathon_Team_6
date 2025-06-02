// frontend/src/hooks/usePlagiarismCheck.js
import { useState, useCallback, useRef } from 'react';

const API_BASE_URL = 'http://127.0.0.1:5000';// Your Flask backend URL

export const usePlagiarismCheck = () => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Preparing analysis...");
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const abortControllerRef = useRef(null); // Ref to hold AbortController instance

  const analyseContent = useCallback(async (
    mainText, mainFile,
    comparisonText = null, comparisonFile = null
  ) => {
    setLoading(true);
    setLoadingMessage("Initializing analysis...");
    setError(null);
    setResults(null);

    abortControllerRef.current = new AbortController(); // Create new controller for each analysis
    const signal = abortControllerRef.current.signal;

    const formData = new FormData();
    if (mainText) {
      formData.append('main_text', mainText);
    }
    if (mainFile) {
      formData.append('main_file', mainFile);
    }
    if (comparisonText) {
      formData.append('comparison_text', comparisonText);
    }
    if (comparisonFile) {
      formData.append('comparison_file', comparisonFile);
    }

    // Simulate progress messages (backend is synchronous)
    const messages = [
      "Analyzing document structure...",
      "Generating search queries...",
      "Searching the web for similar content...",
      "Fetching external sources...",
      "Comparing content for overlaps...",
      "Detecting AI-generated patterns...",
      "Compiling detailed report..." // Removed visualization steps
    ];
    let msgIndex = 0;
    const interval = setInterval(() => {
      if (msgIndex < messages.length) {
        setLoadingMessage(messages[msgIndex]);
        msgIndex++;
      } else {
        setLoadingMessage("Finalizing report..."); // Loop or hold last message
      }
    }, 2000); // Update message every 2 seconds

    try {
      const response = await fetch(`${API_BASE_URL}/analyse`, {
        method: 'POST',
        body: formData,
        signal: signal, // Pass the signal to the fetch request
        credentials: 'include', // Important for sending session cookies
      });

      clearInterval(interval); // Stop the interval once response is received

      if (!response.ok) {
        // If not authenticated, Flask will redirect to login page.
        // Frontend should handle 401 specifically if needed.
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.");
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      clearInterval(interval); // Ensure interval is cleared on error
      if (err.name === 'AbortError') {
        setError("Analysis cancelled by user.");
        setLoadingMessage("Analysis cancelled.");
      } else {
        console.error("Analysis failed:", err);
        setError(err.message || "An unexpected error occurred during analysis.");
        setLoadingMessage("Analysis failed!");
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null; // Clear controller reference
    }
  }, []);

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Abort the ongoing fetch request
    }
  }, []);


  const downloadPdf = useCallback(async (serverPdfPath) => {
    if (!serverPdfPath) {
      console.warn("No PDF report path available to download.");
      setError("No PDF report available for download.");
      return;
    }
    try {
      const encodedPath = encodeURIComponent(serverPdfPath);
      // Ensure the path sent to Flask's download_report endpoint
      // is just the basename to prevent directory traversal vulnerabilities.
      const filenameOnly = encodedPath.split('/').pop().split('\\').pop(); // Get actual filename
      const response = await fetch(`${API_BASE_URL}/download-report/${filenameOnly}`, {
        method: 'GET',
        credentials: 'include', // Important for sending session cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required to download report.");
        }
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
      window.URL.revokeObjectURL(url); // Clean up the object URL
    } catch (err) {
      console.error("PDF download failed:", err);
      setError(err.message || "Failed to download PDF report.");
    }
  }, []);

  return { loading, loadingMessage, error, results, analyseContent, downloadPdf, cancelAnalysis };
};