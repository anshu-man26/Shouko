import React from 'react';
import { FiX, FiCalendar, FiUser, FiMapPin, FiTag } from 'react-icons/fi';
import './CaseDetailsModal.css';

const CaseDetailsModal = ({ caseData, onClose }) => {
  if (!caseData) return null;

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

  const handleModalClick = (e) => {
    if (e.target.className === 'case-details-modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="case-details-modal-overlay" onClick={handleModalClick}>
      <div className="case-details-modal">
        <div className="modal-header">
          <h2>🕵️ Case Details</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="case-title-section">
            <h3 className="case-title">{caseData.title}</h3>
            <div className="case-badges">
              <span className="case-badge priority">
                <FiTag size={12} />
                {caseData.priority || 'Low'} Priority
              </span>
              <span className="case-badge status">
                {caseData.status || 'Open'}
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
                {new Date(caseData.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <FiUser size={14} />
                People Involved
              </div>
              <div className="info-value">
                {caseData.people?.length || 0} people
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <FiMapPin size={14} />
                Clues Found
              </div>
              <div className="info-value">
                {caseData.clues?.length || 0} clues
              </div>
            </div>
          </div>

          <div className="case-description-section">
            <h4>Description</h4>
            <p className="case-description">{caseData.description}</p>
          </div>

          {caseData.people && caseData.people.length > 0 && (
            <div className="case-people-section">
              <h4>People Involved</h4>
              <div className="people-list">
                {caseData.people.map((person, index) => (
                  <div key={index} className="person-item">
                    <div className="person-name">{person.name}</div>
                    {person.role && <div className="person-role">{person.role}</div>}
                    {person.contact && <div className="person-contact">{person.contact}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {caseData.clues && caseData.clues.length > 0 && (
            <div className="case-clues-section">
              <h4>Clues & Evidence</h4>
              <div className="clues-list">
                {caseData.clues.map((clue, index) => (
                  <div key={index} className="clue-item">
                    <div className="clue-description">{clue.description}</div>
                    {clue.type && <div className="clue-type">Type: {clue.type}</div>}
                    {clue.location && <div className="clue-location">Location: {clue.location}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsModal; 