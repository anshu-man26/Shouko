import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'
import '../components/model.css'; 
import { UserContext } from '../../context/userContext';
import { useContext } from 'react';
import {toast} from 'react-hot-toast'
import { useState, useEffect } from 'react';
import api from '../api'
import { FiX } from 'react-icons/fi'


const Modal = ({onClose, case: caseData}) => {
  const {user}= useContext(UserContext);
  const isEditing = !!caseData;

  const[data,setData]=useState({
    title:'',
    description:'',
    priority:'Low',
  })

  // Pre-fill form with existing case data when editing
  useEffect(() => {
    if (caseData) {
      setData({
        title: caseData.title || '',
        description: caseData.description || '',
        priority: caseData.priority || 'Low',
      });
    }
  }, [caseData]);

  const registerCase=async (e)=>{
    e.preventDefault();
    const{title,description,priority}=data;
    
    // Check if user exists before accessing user.id
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
      
      console.log(responseData);
      if(responseData.data.error) {
        toast.error(responseData.data.error);
      } else {
        setData({});
        toast.success(responseData.data.message);
        onClose();
      }
    } catch (error) {
      console.log(error);
      toast.error("An unexpected error occurred.");
    }
  }

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
          <h2>🕵️ {isEditing ? 'Edit Case' : 'New Case'}</h2>
        </div>
        
        <form onSubmit={registerCase}>
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
          
          <button type="submit" className="btn btn-primary">
            {isEditing ? 'Update Case' : 'Create Case'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Modal;