import React from 'react';
import { FiX, FiDownload, FiMaximize2 } from 'react-icons/fi';
import './PDFViewer.css';

const PDFViewer = ({ pdfUrl, fileName, onClose }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="pdf-viewer-overlay" onClick={onClose}>
      <div className="pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-viewer-header">
          <div className="pdf-viewer-title">
            <span className="pdf-icon">📄</span>
            <h3>{fileName}</h3>
          </div>
          <div className="pdf-viewer-actions">
            <button 
              className="pdf-action-btn download-btn"
              onClick={handleDownload}
              title="Download PDF"
            >
              <FiDownload />
              Download
            </button>
            <button 
              className="pdf-action-btn fullscreen-btn"
              onClick={handleFullscreen}
              title="Open in new tab"
            >
              <FiMaximize2 />
              Fullscreen
            </button>
            <button 
              className="pdf-action-btn close-btn"
              onClick={onClose}
              title="Close"
            >
              <FiX />
            </button>
          </div>
        </div>
        
        <div className="pdf-viewer-content">
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            title={fileName}
            className="pdf-iframe"
            frameBorder="0"
          />
        </div>
      </div>
    </div>
  );
};

export default PDFViewer; 