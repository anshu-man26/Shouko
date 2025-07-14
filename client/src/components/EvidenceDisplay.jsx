import React, { useState, useEffect } from 'react';
import { FiDownload, FiTrash2, FiImage, FiVideo, FiFileText, FiEye, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../api';
import './EvidenceDisplay.css';

const EvidenceDisplay = ({ caseId, onEvidenceDeleted, evidenceList, setEvidenceList }) => {
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (evidenceList.length === 0) {
      fetchEvidence();
    } else {
      setLoading(false);
    }
  }, [caseId, evidenceList.length]);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/evidence/case/${caseId}`);
      const fetchedEvidence = response.data.evidence || [];
      setEvidenceList(fetchedEvidence);
    } catch (error) {
      console.error('Error fetching evidence:', error);
      toast.error('Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (evidenceId) => {
    if (!window.confirm('Are you sure you want to delete this evidence?')) {
      return;
    }

    try {
      await api.delete(`/api/evidence/${evidenceId}`);
      toast.success('Evidence deleted successfully');
      setEvidenceList(prevEvidence => prevEvidence.filter(item => item.id !== evidenceId));
      if (onEvidenceDeleted) {
        onEvidenceDeleted(evidenceId);
      }
    } catch (error) {
      console.error('Error deleting evidence:', error);
      toast.error('Failed to delete evidence');
    }
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.cloudinaryUrl;
    link.download = file.fileName; // Use display name instead of original name
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (file) => {
    setSelectedFile(file);
    setShowPreview(true);
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <FiImage />;
    if (fileType.startsWith('video/')) return <FiVideo />;
    return <FiFileText />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="evidence-display">
        <div className="evidence-header">
          <h3>📁 Evidence Files</h3>
        </div>
        <div className="loading">Loading evidence...</div>
      </div>
    );
  }

  return (
    <div className="evidence-display">
      <div className="evidence-header">
        <h3>📁 Evidence Files ({evidenceList.length})</h3>
      </div>

      {evidenceList.length === 0 ? (
        <div className="no-evidence">
          <p>No evidence files uploaded yet.</p>
        </div>
      ) : (
        <div className="evidence-grid">
          {evidenceList.map((file) => (
            <div key={file.id} className="evidence-card">
              <div className="evidence-preview">
                {file.fileType.startsWith('image/') ? (
                  <img 
                    src={file.cloudinaryUrl} 
                    alt={file.fileName}
                    onClick={() => handlePreview(file)}
                    className="evidence-image"
                  />
                ) : (
                  <div className="evidence-placeholder">
                    {getFileIcon(file.fileType)}
                  </div>
                )}
              </div>

              <div className="evidence-info">
                <h4 className="evidence-name">{file.fileName}</h4>
                <p className="evidence-meta">
                  {formatFileSize(file.fileSize)} • {formatDate(file.uploadDate)}
                </p>
                {file.description && (
                  <p className="evidence-description">{file.description}</p>
                )}
              </div>

              <div className="evidence-actions">
                <button 
                  className="action-btn preview-btn"
                  onClick={() => handlePreview(file)}
                  title="Preview"
                >
                  <FiEye />
                </button>
                <button 
                  className="action-btn download-btn"
                  onClick={() => handleDownload(file)}
                  title="Download"
                >
                  <FiDownload />
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(file.id)}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedFile && (
        <div className="preview-modal" onClick={() => setShowPreview(false)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="preview-close"
              onClick={() => setShowPreview(false)}
            >
              <FiX />
            </button>
            
            <div className="preview-header">
              <h3>{selectedFile.fileName}</h3>
              <p>{formatFileSize(selectedFile.fileSize)} • {formatDate(selectedFile.uploadDate)}</p>
            </div>

            <div className="preview-body">
              {selectedFile.fileType.startsWith('image/') ? (
                <img 
                  src={selectedFile.cloudinaryUrl} 
                  alt={selectedFile.fileName}
                  className="preview-image"
                />
              ) : selectedFile.fileType.startsWith('video/') ? (
                <video 
                  src={selectedFile.cloudinaryUrl} 
                  controls
                  className="preview-video"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="preview-document">
                  <div className="document-icon">
                    {getFileIcon(selectedFile.fileType)}
                  </div>
                  <p>Document preview not available</p>
                  <button 
                    className="download-btn-large"
                    onClick={() => handleDownload(selectedFile)}
                  >
                    <FiDownload /> Download Document
                  </button>
                </div>
              )}
            </div>

            {selectedFile.description && (
              <div className="preview-description">
                <h4>Description:</h4>
                <p>{selectedFile.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceDisplay; 