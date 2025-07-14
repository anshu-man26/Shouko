import React, { useState } from 'react'
import api from '../api';
import { useContext } from "react"
import{UserContext} from "../../context/userContext"
import Topbar from '../components/Topbar'
import LeftSideBar from '../components/LeftSideBar'
import CaseDetailsPanel from '../components/CaseDetailsPanel'
import UpdateCaseModal from '../components/UpdateCaseModal'
import { toast } from 'react-hot-toast'
import './Home.css'

export default function Home() {
  const [selectedCase, setSelectedCase] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [caseToUpdate, setCaseToUpdate] = useState(null);
  const { user } = useContext(UserContext);

  const handleCaseSelect = (caseData) => {
    console.log('Home: Setting selected case:', caseData?.title, 'ID:', caseData?._id || caseData?.id);
    setSelectedCase(caseData);
  };

  const handleEditCase = (caseData) => {
    setCaseToUpdate(caseData);
    setShowUpdateModal(true);
  };

  const handleDeleteCase = async (caseData) => {
    if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      try {
        const caseId = caseData._id || caseData.id;
        await api.delete(`/cases/${caseId}`, {
          params: { userId: user?.id }
        });
        toast.success('Case deleted successfully');
        setSelectedCase(null); // Clear selection after deletion
        // The LeftSideBar will handle refreshing the cases list
      } catch (error) {
        console.log('Delete error:', error);
        toast.error('Failed to delete case');
      }
    }
  };

  const handleCaseUpdated = (updatedCase) => {
    setSelectedCase(updatedCase);
    setShowUpdateModal(false);
    setCaseToUpdate(null);
  };

  const handleCaseDeleted = (deletedCaseId) => {
    // Clear selection if the deleted case was selected
    if (selectedCase && (selectedCase._id === deletedCaseId || selectedCase.id === deletedCaseId)) {
      setSelectedCase(null);
    }
  };

  const handleUpdateModalClose = () => {
    setShowUpdateModal(false);
    setCaseToUpdate(null);
  };
  
  return (
    <div className="home-container">
      <Topbar/>
      <div className="main-content">
        <LeftSideBar 
          onCaseSelect={handleCaseSelect} 
          selectedCase={selectedCase}
          onCaseDeleted={handleCaseDeleted}
          onCaseUpdated={handleCaseUpdated}
        />
        <div className="content-area">
          <CaseDetailsPanel 
            selectedCase={selectedCase}
            onEditCase={handleEditCase}
            onDeleteCase={handleDeleteCase}
            userId={user?.id}
          />
        </div>
      </div>
      
      {showUpdateModal && caseToUpdate && (
        <UpdateCaseModal 
          caseData={caseToUpdate}
          onClose={handleUpdateModalClose}
          onCaseUpdated={handleCaseUpdated}
        />
      )}
    </div>
  )
}
