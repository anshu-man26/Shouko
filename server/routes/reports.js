const express = require('express');
const router = express.Router();
const { generateReport, getCaseReports, deleteReport, downloadReport } = require('../controllers/reportController');
const { authenticateToken } = require('../helpers/auth');

// All routes require authentication
router.use(authenticateToken);

// Generate PDF report for a case
router.post('/generate/:caseId', generateReport);

// Get reports for a case
router.get('/case/:caseId', getCaseReports);

// Download report
router.get('/download/:reportId', downloadReport);

// Delete report
router.delete('/:reportId', deleteReport);

module.exports = router; 