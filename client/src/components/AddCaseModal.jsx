import React, { useState, useEffect, useContext } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { UserContext } from '../../context/userContext';
import api from '../api';
import './AddCaseModal.css';
import ReactDOM from 'react-dom';

const AddCaseModal = ({ onClose, onCaseAdded, caseData }) => {
  const { user } = useContext(UserContext);
  const isEditing = !!caseData;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Low',
  });

  // Pre-fill form with existing case data when editing
  useEffect(() => {
    if (caseData) {
      setFormData({
        title: caseData.title || '',
        description: caseData.description || '',
        priority: caseData.priority || 'Low',
      });
    }
  }, [caseData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, priority } = formData;
    
    if (!user) {
      toast.error("Please login first");
      return;
    }
    
    try {
      let responseData;
      
      if (isEditing) {
        // Update existing case
        const caseId = caseData._id || caseData.id;
        responseData = await api.put(`/cases/${caseId}`, {
          title, description, priority, userId: user.id
        });
      } else {
        // Create new case
        responseData = await api.post("/cases", {
          title, description, priority, userId: user.id
        });
      }
      
      if (responseData.data.error) {
        toast.error(responseData.data.error);
      } else {
        toast.success(responseData.data.message);
        if (onClose) onClose();
        // Delay onCaseAdded to next tick to avoid modal reopening
        setTimeout(() => {
          if (onCaseAdded) {
            onCaseAdded(responseData.data.case || responseData.data);
          }
        }, 0);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleClose = () => {
    setFormData({ title: '', description: '', priority: 'Low' });
    onClose();
  };

  const modalContent = (
    <div className="add-case-modal-overlay" onClick={handleClose}>
      <div className="add-case-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🕵️ {isEditing ? 'Edit Case' : 'New Case'}</h3>
          <button className="close-btn" onClick={handleClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            {/* Case Title */}
            <div className="form-group">
              <label htmlFor="title">Case Title</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter case title..."
                maxLength={15}
                required
              />
              <small className="char-count">{formData.title.length}/15 characters</small>
            </div>

            {/* Case Description */}
            <div className="form-group">
              <label htmlFor="description">Case Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the case details..."
                rows="4"
                required
              />
            </div>

            {/* Priority Selection */}
            <div className="form-group">
              <label>Priority Level</label>
              <div className="priority-options">
                <label className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value="Low"
                    checked={formData.priority === 'Low'}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  />
                  <span className="priority-label low">🔵 Low</span>
                </label>
                <label className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value="Medium"
                    checked={formData.priority === 'Medium'}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  />
                  <span className="priority-label medium">🟡 Medium</span>
                </label>
                <label className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value="High"
                    checked={formData.priority === 'High'}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  />
                  <span className="priority-label high">🔴 High</span>
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-actions">
          <button 
            className="cancel-btn" 
            onClick={handleClose}
          >
            Cancel
          </button>
          <button 
            className="submit-btn" 
            onClick={handleSubmit}
          >
            {isEditing ? 'Update Case' : 'Create Case'}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default AddCaseModal; 