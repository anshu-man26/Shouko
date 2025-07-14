import React from 'react'
import './Cases.css'
import { FiUsers, FiSearch, FiCalendar } from 'react-icons/fi';

const Cases = ({ case: caseData, onClick, isSelected }) => {
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
    <div 
      className={`case-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(caseData)}
    >
      <div className="case-header">
        <h4 className="case-title">{caseData.title}</h4>
        <div className="case-actions">
          <div className="case-badges">
            <span 
              className="priority-badge"
              style={{ backgroundColor: getPriorityColor(caseData.priority) }}
            >
              {caseData.priority || 'Low'}
            </span>
            <span 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(caseData.status) }}
            >
              {caseData.status || 'Open'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="case-footer">
        <span className="case-date">
          <FiCalendar size={12} />
          {new Date(caseData.created_at).toLocaleDateString()}
        </span>
        <div className="case-stats">
          <span className="people-count">
            <FiUsers size={12} />
            {caseData.people?.length || 0}
          </span>
          <span className="clues-count">
            <FiSearch size={12} />
            {caseData.clues?.length || 0}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Cases
