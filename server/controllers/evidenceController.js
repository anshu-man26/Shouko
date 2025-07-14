const { Evidence, Case, User } = require('../models');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|avi|mov|wmv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, video, and document files are allowed!'));
    }
  }
});

// Upload evidence file
const uploadEvidence = async (req, res) => {
  try {
    console.log('🔍 Upload Evidence - Request received');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const { caseId, description, importance } = req.body;
    const userId = req.user.id;

    console.log('Case ID:', caseId);
    console.log('User ID:', userId);
    console.log('Description:', description);

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Description is now optional
    const descriptionText = description ? description.trim() : '';

    // Check if case exists and belongs to user
    const caseData = await Case.findOne({
      where: { id: caseId, userId: userId }
    });

    if (!caseData) {
      console.log('❌ Case not found or user not authorized');
      return res.status(404).json({ error: 'Case not found' });
    }

    // Generate unique file ID and name
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFileName = `EVID_${timestamp}_${randomId}${fileExtension}`;
    
    console.log('📁 Generated unique filename:', uniqueFileName);
    console.log('📁 Original filename:', req.file.originalname);
    console.log('📁 File extension:', fileExtension);
    
    // Generate display title like "Evidence 1", "Evidence 2", etc.
    const evidenceCount = await Evidence.count({
      where: { caseId: caseId }
    });
    const evidenceTitle = `Evidence ${evidenceCount + 1}`;

    console.log('✅ Case found, proceeding with Cloudinary upload');

    // Upload to Cloudinary with unique filename
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'detective-evidence',
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'avi', 'mov', 'wmv'],
          public_id: uniqueFileName.replace(fileExtension, '') // Use unique ID without extension
        },
        (error, result) => {
          if (error) {
            console.log('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload successful:', result);
            console.log('📁 Cloudinary public_id:', result.public_id);
            console.log('📁 Cloudinary secure_url:', result.secure_url);
            resolve(result);
          }
        }
      );

      stream.end(req.file.buffer);
    });

    console.log('✅ Cloudinary upload completed, saving to database');

    // Save to database
    const evidenceData = {
      caseId: caseId,
      fileName: evidenceTitle, // Display name for UI
      originalName: req.file.originalname, // Original uploaded filename
      uniqueFileName: uniqueFileName, // Unique system filename
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      description: descriptionText,
      importance: importance || 'medium',
      uploadedBy: userId,
      status: 'completed'
    };
    
    console.log('💾 Saving evidence to database:', evidenceData);
    
    const evidence = await Evidence.create(evidenceData);

    console.log('✅ Evidence saved to database:', evidence.id);

    res.status(201).json({
      message: 'Evidence uploaded successfully',
      evidence: {
        id: evidence.id,
        fileName: evidence.fileName,
        originalName: evidence.originalName,
        uniqueFileName: evidence.uniqueFileName,
        fileType: evidence.fileType,
        fileSize: evidence.fileSize,
        cloudinaryUrl: evidence.cloudinaryUrl,
        description: evidence.description,
        uploadDate: evidence.uploadDate
      }
    });

  } catch (error) {
    console.error('❌ Error uploading evidence:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to upload evidence', details: error.message });
  }
};

// Get evidence for a case
const getCaseEvidence = async (req, res) => {
  try {
    console.log('🔍 Getting evidence for case:', req.params.caseId);
    console.log('User ID:', req.user.id);
    
    const { caseId } = req.params;
    const userId = req.user.id;

    // Check if case exists and belongs to user
    const caseData = await Case.findOne({
      where: { id: caseId, userId: userId }
    });

    if (!caseData) {
      console.log('❌ Case not found or user not authorized');
      return res.status(404).json({ error: 'Case not found' });
    }

    console.log('✅ Case found, fetching evidence...');

    // Get evidence without uploader info for now to avoid association issues
    console.log('🔍 Querying evidence for case ID:', caseId);
    const evidence = await Evidence.findAll({
      where: { caseId: caseId },
      order: [['uploadDate', 'DESC']]
    });

    console.log('✅ Evidence fetched successfully, count:', evidence.length);

    res.json({ evidence });

  } catch (error) {
    console.error('❌ Error fetching evidence:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch evidence', details: error.message });
  }
};

// Delete evidence
const deleteEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const userId = req.user.id;

    // Find evidence and check ownership
    const evidence = await Evidence.findOne({
      where: { id: evidenceId },
      include: [
        {
          model: Case,
          as: 'case',
          where: { userId: userId }
        }
      ]
    });

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(evidence.cloudinaryPublicId);

    // Delete from database
    await evidence.destroy();

    res.json({ message: 'Evidence deleted successfully' });

  } catch (error) {
    console.error('Error deleting evidence:', error);
    res.status(500).json({ error: 'Failed to delete evidence' });
  }
};

module.exports = {
  uploadEvidence,
  getCaseEvidence,
  deleteEvidence,
  upload
}; 