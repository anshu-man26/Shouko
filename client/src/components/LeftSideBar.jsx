import React, { useState, useEffect } from 'react';
import "../components/leftsidebar.css";
import api from '../api';
import AddCaseModal from './AddCaseModal';
import Cases from './Cases';
import { UserContext } from '../../context/userContext';
import { useContext } from 'react';
import { toast } from 'react-hot-toast';
import { FiClock, FiFolder } from 'react-icons/fi';

const LeftSideBar = ({ onCaseSelect, selectedCase: parentSelectedCase, onCaseDeleted, onCaseUpdated }) => {
  const [addCase, setaddCase] = useState(false);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const { user } = useContext(UserContext);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cases', {
        params: { userId: user?.id }
      });
      setCases(response.data.cases || []);
    } catch (error) {
      console.log('Error fetching cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const handleCaseClick = (caseData) => {
    console.log('Case clicked:', caseData.title, 'ID:', caseData._id || caseData.id);
    console.log('Current parentSelectedCase:', parentSelectedCase?.title, 'ID:', parentSelectedCase?._id || parentSelectedCase?.id);
    if (onCaseSelect) {
      onCaseSelect(caseData);
    }
  };

  const handleCaseAdded = () => {
    setaddCase(false);
    fetchCases(); // Refresh the cases list
  };

  const handleCaseDeleted = (deletedCaseId) => {
    // Remove the deleted case from the list
    setCases(prevCases => prevCases.filter(caseItem => 
      caseItem._id !== deletedCaseId && caseItem.id !== deletedCaseId
    ));
    
    // If the deleted case was selected, clear the selection
    if (parentSelectedCase && (parentSelectedCase._id === deletedCaseId || parentSelectedCase.id === deletedCaseId)) {
      if (onCaseSelect) {
        onCaseSelect(null);
      }
    }
    
    // Notify parent component
    if (onCaseDeleted) {
      onCaseDeleted(deletedCaseId);
    }
  };

  const handleCaseUpdated = (updatedCase) => {
    // Update the case in the list
    setCases(prevCases => {
      const updatedCases = prevCases.map(caseItem => {
        const caseId = caseItem._id || caseItem.id;
        const updatedCaseId = updatedCase._id || updatedCase.id;
        if (caseId === updatedCaseId) {
          return updatedCase;
        }
        return caseItem;
      });
      return updatedCases;
    });

    // If the updated case is currently selected, update the selection
    if (parentSelectedCase && (parentSelectedCase._id === updatedCase._id || parentSelectedCase.id === updatedCase.id)) {
      if (onCaseSelect) {
        onCaseSelect(updatedCase);
      }
    }

    // Notify parent component
    if (onCaseUpdated) {
      onCaseUpdated(updatedCase);
    }
  };

  // Filter cases based on active tab
  const activeCases = cases.filter(caseItem => caseItem.status !== 'Closed');
  const closedCases = cases.filter(caseItem => caseItem.status === 'Closed');
  const currentCases = activeTab === 'active' ? activeCases : closedCases;

  return (
    <div className='leftsidebar'>
      <div className='sidebar-header'>
        <h2>🕵️ Detective Cases</h2>
        <button className='add-case-btn' onClick={() => {
          console.log('🔍 Add Case button clicked, setting addCase to true');
          setaddCase(true);
        }}>
          + New Case
        </button>
      </div>

      {addCase && (
        <>
          {console.log('🔍 Rendering AddCaseModal, addCase:', addCase)}
          <AddCaseModal onClose={handleCaseAdded} onCaseAdded={handleCaseAdded} />
        </>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <FiFolder size={16} />
          Active Cases ({activeCases.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FiClock size={16} />
          History ({closedCases.length})
        </button>
      </div>

      <div className='cases-container'>
        {loading ? (
          <div className="loading">Loading cases...</div>
        ) : currentCases.length === 0 ? (
          <div className="no-cases">
            <p>
              {activeTab === 'active' 
                ? 'No active cases. Start by adding your first case!' 
                : 'No closed cases in history yet.'
              }
            </p>
          </div>
        ) : (
          <div className='cases'> 
            {currentCases.map((caseData, index) => (
              <div key={caseData._id || caseData.id || index} className='case-box'>
                <Cases 
                  case={caseData}
                  onClick={handleCaseClick}
                  isSelected={(() => {
                    const caseId = caseData._id || caseData.id;
                    const selectedId = parentSelectedCase?._id || parentSelectedCase?.id;
                    const isSelected = parentSelectedCase && (caseId === selectedId);
                    
                    if (isSelected) {
                      console.log(`✅ "${caseData.title}" is selected. Case ID: ${caseId}, Selected ID: ${selectedId}`);
                    }
                    
                    return isSelected;
                  })()}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeftSideBar;
