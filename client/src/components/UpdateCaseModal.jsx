import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'
import '../components/model.css'; 
import { toast } from 'react-hot-toast'
import api from '../api'
import { FiX } from 'react-icons/fi'

const UpdateCaseModal = ({ caseData, onClose, onCaseUpdated }) => {
  const [data, setData] = useState({
    title: '',
    description: '',
    priority: 'Low',
    status: 'Open'
  });

  useEffect(() => {
    if (caseData) {
      setData({
        title: caseData.title || '',
        description: caseData.description || '',
        priority: caseData.priority || 'Low',
        status: caseData.status || 'Open'
      });
    }
  }, [caseData]);

  const updateCase = async (e) => {
    e.preventDefault();
    const { title, description, priority, status } = data;
    
    try {
      const caseId = caseData._id || caseData.id;
      const responseData = await api.put(`/cases/${caseId}`, {
        title,
        description,
        priority,
        status,
        userId: caseData.userId
      });
      
      if (responseData.data.error) {
        toast.error(responseData.data.error);
      } else {
        toast.success('Case updated successfully');
        onCaseUpdated(responseData.data.case);
        onClose();
      }
    } catch (error) {
      console.log(error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleModalClick = (e) => {
    if (e.target.className === 'modal') {
      onClose();
    }
  };

  return (
    <div className="modal" onClick={handleModalClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <FiX size={20} />
        </button>
        
        <div className="modal-header">
          <h2>✏️ Update Case</h2>
        </div>
        
        <form onSubmit={updateCase}>
          <div className="form-group">
            <label htmlFor="title">Case Title (max 15 characters)</label>
            <input 
              type="text" 
              className="form-control" 
              id="title" 
              placeholder="Enter case title..."  
              value={data.title} 
              onChange={(e) => setData({...data, title: e.target.value})}
              maxLength={15}
            />
            <small className="form-text text-muted">
              {data.title.length}/15 characters
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Case Description</label>
            <textarea 
              className="form-control" 
              id="description" 
              rows="4" 
              placeholder="Describe the case details..."  
              value={data.description} 
              onChange={(e) => setData({...data, description: e.target.value})} 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="priority">Priority Level</label>
            <div className="priority-selector">
              <select 
                className="form-control" 
                id="priority" 
                value={data.priority || 'Low'} 
                onChange={(e) => setData({...data, priority: e.target.value})}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
              <div 
                className={`priority-option ${data.priority === 'Low' ? 'selected' : ''}`}
                data-priority="Low"
                onClick={() => setData({...data, priority: 'Low'})}
              >
                🔵 Low
              </div>
              <div 
                className={`priority-option ${data.priority === 'Medium' ? 'selected' : ''}`}
                data-priority="Medium"
                onClick={() => setData({...data, priority: 'Medium'})}
              >
                🟡 Medium
              </div>
              <div 
                className={`priority-option ${data.priority === 'High' ? 'selected' : ''}`}
                data-priority="High"
                onClick={() => setData({...data, priority: 'High'})}
              >
                🔴 High
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Case Status</label>
            <div className="status-selector">
              <select 
                className="form-control" 
                id="status" 
                value={data.status || 'Open'} 
                onChange={(e) => setData({...data, status: e.target.value})}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
              <div 
                className={`status-option ${data.status === 'Open' ? 'selected' : ''}`}
                data-status="Open"
                onClick={() => setData({...data, status: 'Open'})}
              >
                🔴 Open
              </div>
              <div 
                className={`status-option ${data.status === 'In Progress' ? 'selected' : ''}`}
                data-status="In Progress"
                onClick={() => setData({...data, status: 'In Progress'})}
              >
                🟡 In Progress
              </div>
              <div 
                className={`status-option ${data.status === 'Closed' ? 'selected' : ''}`}
                data-status="Closed"
                onClick={() => setData({...data, status: 'Closed'})}
              >
                🟢 Closed
              </div>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary">
            Update Case
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateCaseModal; 