// frontend/src/components/FileUploader.jsx
import React from 'react';
import { FiUpload, FiFileText } from 'react-icons/fi'; // Added FiFileText icon

const FileUploader = ({ onFileChange, selectedFile, label = "Upload File" }) => {
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      onFileChange(event.target.files[0]);
    }
  };

  return (
    <div className="file-uploader">
      <label htmlFor={`dropzone-file-${label.replace(/\s/g, '-')}`} className="file-uploader-label">
        <div className="file-uploader-content">
          {selectedFile ? (
            <div className="file-selected-info">
              <FiFileText className="icon file-icon" />
              <p className="text-main selected-file-name">{selectedFile.name}</p>
              <p className="text-hint">Click to change file</p>
            </div>
          ) : (
            <>
              <FiUpload className="icon" />
              <p className="text-main">
                <span>Click to upload</span> or drag and drop
              </p>
              <p className="text-hint">
                PDF, DOCX, TXT (MAX. 50MB)
              </p>
            </>
          )}
        </div>
        <input
          id={`dropzone-file-${label.replace(/\s/g, '-')}`}
          type="file"
          className="file-uploader-input"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          key={selectedFile ? selectedFile.name : 'no-file'} // Key to re-render input if file changes
        />
      </label>
    </div>
  );
};

export default FileUploader;