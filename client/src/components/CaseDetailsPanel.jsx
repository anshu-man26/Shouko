import React, { useState, useEffect } from 'react';
import { FiCalendar, FiUser, FiMapPin, FiTag, FiEdit3, FiTrash2, FiX, FiAlertTriangle } from 'react-icons/fi';
import EvidenceUpload from './EvidenceUpload';
import EvidenceDisplay from './EvidenceDisplay';
import ReportGeneration from './ReportGeneration';
import UpdateCaseModal from './UpdateCaseModal';
import './CaseDetailsPanel.css';
import api from '../api';

const CaseDetailsPanel = ({ selectedCase, onEditCase, onDeleteCase, userId }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [evidenceList, setEvidenceList] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch evidence for the selected case
  const fetchEvidence = async () => {
    if (!selectedCase) return;
    try {
      const response = await api.get(`/api/evidence/case/${selectedCase.id || selectedCase._id}`);
      setEvidenceList(response.data.evidence || []);
    } catch (error) {
      setEvidenceList([]);
    }
  };

  // Fetch evidence when selectedCase changes or when switching to evidence tab
  useEffect(() => {
    fetchEvidence();
    // eslint-disable-next-line
  }, [selectedCase]);

  // Real-time update after upload
  const handleEvidenceUploaded = () => {
    fetchEvidence();
  };

  const handleEvidenceDeleted = (evidenceId) => {
    setEvidenceList(prevEvidence => prevEvidence.filter(item => item.id !== evidenceId));
  };

  const handleReportGenerated = (report) => {
    // Handle report generation
    console.log('Report generated:', report);
  };

  const handleViewFile = (evidence) => {
    if (evidence.fileType === 'application/pdf') {
      // For PDFs, download directly
      const link = document.createElement('a');
      link.href = evidence.cloudinaryUrl;
      link.download = evidence.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(evidence.cloudinaryUrl, '_blank');
    }
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
  };

  const handleCaseUpdated = (updatedCase) => {
    if (onEditCase) {
      onEditCase(updatedCase);
    }
    setShowEditModal(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (onDeleteCase) {
      onDeleteCase(selectedCase);
    }
    setShowDeleteModal(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };


  if (!selectedCase) {
    return (
      <div className="case-details-panel empty">
        <div className="empty-state">
          <div className="empty-icon">🕵️</div>
          <h2>No Case Selected</h2>
          <p>Select a case from the sidebar to view its details</p>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return '#ff4444';
      case 'Medium': return '#ffaa00';
      case 'Low': return '#44aa44';
      default: return '#666666';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return '#ff4444';
      case 'In Progress': return '#ffaa00';
      case 'Closed': return '#44aa44';
      default: return '#666666';
    }
  };


  return (
    <div className="case-details-panel">
      <div className="panel-header">
        <h2>🕵️ Case Details</h2>
        <div className="panel-actions">
          <button 
            className="action-btn edit-btn"
            onClick={handleEditClick}
            title="Edit case"
          >
            <FiEdit3 />
            Edit
          </button>
          <button 
            className="action-btn delete-btn"
            onClick={handleDeleteClick}
            title="Delete case"
          >
            <FiTrash2 />
            Delete
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="panel-tabs">
        <button 
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          📋 Details
        </button>
        <button 
          className={`tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          📁 Evidence
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📜 Reports
        </button>
      </div>
      
      <div className="panel-content">
        {activeTab === 'details' && (
          <>
            <div className="case-title-section">
              <h3 className="case-details-title">{selectedCase.title}</h3>
              <div className="case-badges">
                <span className="case-badge priority">
                  <FiTag size={12} />
                  {selectedCase.priority || 'Low'} Priority
                </span>
                <span className="case-badge status">
                  {selectedCase.status || 'Open'}
                </span>
              </div>
            </div>

            <div className="case-info-grid">
              <div className="info-item">
                <div className="info-label">
                  <FiCalendar size={14} />
                  Created Date
                </div>
                <div className="info-value">
                  {new Date(selectedCase.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <FiCalendar size={14} />
                  Last Updated
                </div>
                <div className="info-value">
                  {new Date(selectedCase.updated_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <FiUser size={14} />
                  Case ID
                </div>
                <div className="info-value">
                  #{selectedCase.id || selectedCase._id}
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <FiMapPin size={14} />
                  Status
                </div>
                <div className="info-value">
                  <span 
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor(selectedCase.status) }}
                  >
                    {selectedCase.status || 'Open'}
                  </span>
                </div>
              </div>
            </div>

            <div className="case-description-section">
              <h4>📝 Case Description</h4>
              <div className="case-description">
                {selectedCase.description || 'No description provided.'}
              </div>
            </div>

            {selectedCase.people && selectedCase.people.length > 0 && (
              <div className="case-people-section">
                <h4>👥 People Involved ({selectedCase.people.length})</h4>
                <div className="people-list">
                  {selectedCase.people.map((person, index) => (
                    <div key={person.id || index} className="person-item">
                      <div className="person-name">{person.name}</div>
                      {person.role && <div className="person-role">Role: {person.role}</div>}
                      {person.contact && <div className="person-contact">Contact: {person.contact}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCase.clues && selectedCase.clues.length > 0 && (
              <div className="case-clues-section">
                <h4>🔍 Clues & Evidence ({selectedCase.clues.length})</h4>
                <div className="clues-list">
                  {selectedCase.clues.map((clue, index) => (
                    <div key={clue.id || index} className="clue-item">
                      <div className="clue-description">{clue.description}</div>
                      {clue.type && <div className="clue-type">Type: {clue.type}</div>}
                      {clue.location && <div className="clue-location">Location: {clue.location}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display uploaded evidence files in the details tab */}
            {evidenceList.length > 0 && (
              <div className="case-evidence-section">
                <h4>📁 Evidence Files ({evidenceList.length})</h4>
                <div className="evidence-files-list">
                  {evidenceList.map((evidence) => (
                    <div key={evidence.id} className="evidence-file-item">
                      {evidence.fileType.startsWith('image/') ? (
                        <div className="evidence-image-preview">
                          <img 
                            src={evidence.cloudinaryUrl} 
                            alt={evidence.fileName}
                            className="evidence-thumbnail"
                            onClick={() => window.open(evidence.cloudinaryUrl, '_blank')}
                          />
                        </div>
                      ) : (
                        <div className="evidence-file-icon">
                          {evidence.fileType.startsWith('video/') ? '🎥' : '📄'}
                        </div>
                      )}
                      <div className="evidence-file-info">
                        <div className="evidence-file-name">{evidence.fileName}</div>
                        <div className="evidence-file-meta">
                          {new Date(evidence.uploadDate).toLocaleDateString()}
                        </div>
                        {evidence.description && (
                          <div className="evidence-file-description">{evidence.description}</div>
                        )}
                      </div>
                      <div className="evidence-file-actions">
                        {evidence.fileType === 'application/pdf' ? (
                          <button 
                            className="evidence-download-btn"
                            onClick={() => handleViewFile(evidence)}
                            title="Download PDF"
                          >
                            📥 Download
                          </button>
                        ) : (
                          <button 
                            className="evidence-view-btn"
                            onClick={() => handleViewFile(evidence)}
                            title="View file"
                          >
                            👁️ View
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!selectedCase.people || selectedCase.people.length === 0) && 
             (!selectedCase.clues || selectedCase.clues.length === 0) && (
              <div className="empty-sections">
                <div className="empty-section">
                  <h4>👥 People Involved</h4>
                  <p>No people have been added to this case yet.</p>
                </div>
                <div className="empty-section">
                  <h4>🔍 Clues & Evidence</h4>
                  <p>No clues or evidence have been added to this case yet.</p>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'evidence' && (
          <>
            <EvidenceUpload 
              caseId={selectedCase.id || selectedCase._id}
              onEvidenceUploaded={handleEvidenceUploaded}
            />
            <EvidenceDisplay 
              caseId={selectedCase.id || selectedCase._id}
              onEvidenceDeleted={handleEvidenceDeleted}
              evidenceList={evidenceList}
              setEvidenceList={setEvidenceList}
            />
          </>
        )}

        {activeTab === 'reports' && (
          <ReportGeneration 
            caseId={selectedCase.id || selectedCase._id}
            caseStatus={selectedCase.status}
            onReportGenerated={handleReportGenerated}
          />
        )}
      </div>
      
      {/* Edit Case Modal */}
      {showEditModal && selectedCase && (
        <UpdateCaseModal 
          caseData={selectedCase}
          onClose={handleEditClose}
          onCaseUpdated={handleCaseUpdated}
        />
      )}

      {/* Delete Case Modal */}
      {showDeleteModal && (
        <div className="delete-confirmation-modal">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this case? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={handleDeleteConfirm}>
                <FiAlertTriangle /> Confirm Delete
              </button>
              <button className="cancel-btn" onClick={handleDeleteCancel}>
                <FiX /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetailsPanel; 