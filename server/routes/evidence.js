const express = require('express');
const router = express.Router();
const { uploadEvidence, getCaseEvidence, deleteEvidence, upload } = require('../controllers/evidenceController');
const { authenticateToken } = require('../helpers/auth');

// All routes require authentication
router.use(authenticateToken);

// Upload evidence file
router.post('/upload', upload.single('file'), uploadEvidence);

// Get evidence for a case
router.get('/case/:caseId', getCaseEvidence);

// Delete evidence
router.delete('/:evidenceId', deleteEvidence);

module.exports = router; 