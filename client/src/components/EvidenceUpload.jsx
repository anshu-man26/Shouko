import React, { useState, useRef } from 'react';
import { FiUpload, FiX, FiPlus, FiFile, FiImage, FiVideo, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../api';
import './EvidenceUpload.css';

const EvidenceUpload = ({ caseId, onEvidenceUploaded }) => {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState('medium');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleCircleClick = () => {
    setShowModal(true);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported. Please upload images, videos, or documents.');
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('caseId', caseId);
      formData.append('description', description);
      formData.append('importance', importance);

      const response = await api.post('/api/evidence/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Evidence uploaded successfully!');
      handleCloseModal();
      if (onEvidenceUploaded) {
        onEvidenceUploaded(response.data.evidence);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload evidence');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFile(null);
    setFileName('');
    setDescription('');
    setImportance('medium');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType && fileType.startsWith('image/')) return <FiImage size={20} />;
    if (fileType && fileType.startsWith('video/')) return <FiVideo size={20} />;
    return <FiFileText size={20} />;
  };

  return (
    <div className="evidence-upload">
      {/* Small Circle Upload Button */}
      <div className="upload-circle" onClick={handleCircleClick}>
        <FiPlus size={24} />
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="upload-modal-overlay" onClick={handleCloseModal}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Evidence</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                <FiX size={20} />
              </button>
            </div>

            <div className="modal-content">
              {/* File Selection */}
              <div className="file-selection">
                <label className="file-input-label">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,video/*,.pdf,.doc,.docx"
          style={{ display: 'none' }}
        />
                  <div className="file-drop-zone">
                    {selectedFile ? (
                      <div className="selected-file">
                        {getFileIcon(selectedFile.type)}
                        <span className="file-name">{fileName}</span>
                        <span className="file-size">
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    ) : (
                      <div className="file-placeholder">
                        <FiUpload size={32} />
                        <p>Click to select file</p>
                        <small>Images, Videos, PDFs, Documents (Max 10MB)</small>
                      </div>
                    )}
        </div>
                </label>
      </div>

              {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this evidence..."
            rows="3"
            disabled={uploading}
          />
        </div>

              {/* Importance Selection */}
              <div className="form-group">
                <label>Evidence Importance</label>
                <div className="importance-options">
                  <label className="importance-option">
                    <input
                      type="radio"
                      name="importance"
                      value="low"
                      checked={importance === 'low'}
                      onChange={(e) => setImportance(e.target.value)}
                      disabled={uploading}
                    />
                    <span className="importance-label low">Low</span>
                  </label>
                  <label className="importance-option">
                    <input
                      type="radio"
                      name="importance"
                      value="medium"
                      checked={importance === 'medium'}
                      onChange={(e) => setImportance(e.target.value)}
                      disabled={uploading}
                    />
                    <span className="importance-label medium">Medium</span>
                  </label>
                  <label className="importance-option">
                    <input
                      type="radio"
                      name="importance"
                      value="high"
                      checked={importance === 'high'}
                      onChange={(e) => setImportance(e.target.value)}
                      disabled={uploading}
                    />
                    <span className="importance-label high">High</span>
                  </label>
                </div>
              </div>
      </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={handleCloseModal}
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                className="upload-btn" 
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Evidence'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceUpload; 