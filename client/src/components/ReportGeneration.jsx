import React, { useState } from 'react';
import { FiFileText, FiClock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import './ReportGeneration.css';

const ReportGeneration = ({ caseId, caseStatus }) => {
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    if (caseStatus !== 'Closed') {
      toast.error('Reports can only be generated for closed cases');
      return;
    }

    setGenerating(true);
    try {
      // Show loading state
      toast.loading('Generating report...', { id: 'generate' });
      
      // Generate and download the report directly
      const response = await fetch(`http://localhost:5000/api/reports/generate/${caseId}`, {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Report-${Date.now()}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      // Show success message
      toast.success('Report generated and downloaded successfully!', { id: 'generate' });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.message || 'Failed to generate report', { id: 'generate' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="report-generation">
      <div className="report-header">
        <h3>📜 Generate Investigation Report</h3>
      </div>

      {caseStatus !== 'Closed' ? (
        <div className="case-not-closed">
          <p>📋 Reports can only be generated for closed cases.</p>
          <p>Current status: <span className="status-badge">{caseStatus}</span></p>
        </div>
      ) : (
        <div className="generate-section">
          <div className="generate-info">
            <div className="info-icon">
              <FiFileText size={48} />
            </div>
            <div className="info-content">
              <h4>Generate PDF Report</h4>
              <p>Create a comprehensive investigation report with all case details, people involved, clues, evidence, and timeline.</p>
              <ul className="report-features">
                <li>✓ Complete case information</li>
                <li>✓ People involved details</li>
                <li>✓ Clues and evidence summary</li>
                <li>✓ Case timeline</li>
                <li>✓ Professional formatting</li>
              </ul>
            </div>
          </div>
          
          <button 
            className="generate-btn"
            onClick={generateReport}
            disabled={generating}
          >
            {generating ? (
              <>
                <FiClock className="spinning" />
                Generating...
              </>
            ) : (
              <>
                <FiFileText />
                Generate & Download Report
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportGeneration; 