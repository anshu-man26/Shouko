const { Report, Case, User, Clue, Person, Evidence } = require('../models');
const cloudinary = require('../config/cloudinary');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate PDF report for a case
const generateReport = async (req, res) => {
  try {
    console.log('🔍 Generating report for case:', req.params.caseId);
    console.log('User ID:', req.user.id);
    
    const { caseId } = req.params;
    const userId = req.user.id;

    // Check if case exists and belongs to user
    const caseData = await Case.findOne({
      where: { id: caseId, userId: userId }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Get related data separately to avoid association issues
    const clues = await Clue.findAll({ where: { caseId: caseId } });
    const people = await Person.findAll({ where: { caseId: caseId } });
    const evidence = await Evidence.findAll({ where: { caseId: caseId } });

    // Add the related data to caseData
    caseData.clues = clues;
    caseData.people = people;
    caseData.evidence = evidence;

    // Allow reports for any case status for now
    console.log('📋 Case status:', caseData.status);

    // Generate report number
    const reportNumber = `RPT-${Date.now()}-${caseId}`;
    const reportTitle = `Investigation Report - ${caseData.title}`;

    // Set headers for direct PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportNumber}.pdf"`);

    // Create PDF and pipe directly to response
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: reportTitle,
        Author: 'Detective Case Management System',
        Subject: 'Investigation Report',
        Keywords: 'detective, investigation, case, report',
        CreationDate: new Date()
      }
    });

    // Pipe PDF directly to response
    doc.pipe(res);

    // Helper function to draw a line
    const drawLine = () => {
      doc.moveTo(40, doc.y)
         .lineTo(555, doc.y)
         .stroke();
    };

    // Helper function to add section header
    const addSectionHeader = (text, yOffset = 0) => {
      const headerY = doc.y + yOffset;
      
      // Section header background
      doc.rect(40, headerY, 515, 20)
         .fill('#f8f9fa')
         .stroke('#dee2e6');
      
      // Section header text with accent
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1a237e')
         .text(text, 45, headerY + 5);
      
      // Add accent line
      doc.moveTo(45, headerY + 18)
         .lineTo(200, headerY + 18)
         .stroke('#007bff')
         .lineWidth(1);
      
      doc.y = headerY + 25;
    };

    // Helper function to add content
    const addContent = (text) => {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#2c3e50')
         .text(text, 40, doc.y, { width: 515, align: 'justify' });
      doc.moveDown(0.3);
    };

    // Helper function to add info box
    const addInfoBox = (label, value, yOffset = 0) => {
      const startY = doc.y + yOffset;
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#34495e')
         .text(label + ':', 40, startY);
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#2c3e50')
         .text(value, 140, startY);
      
      doc.moveDown(0.5);
    };

    // Helper function to check if we need a page break
    const checkPageBreak = (estimatedHeight = 0) => {
      const currentY = doc.y + estimatedHeight;
      const pageHeight = 842; // A4 height
      const margin = 50; // Safe margin from bottom
      
      if (currentY > pageHeight - margin) {
        doc.addPage();
        doc.y = 40; // Reset to top of new page
        return true;
      }
      return false;
    };

    // ===== HEADER SECTION =====
    // Create a sophisticated header with multiple layers
    const headerHeight = 90;
    
    // Main background with gradient effect
    doc.rect(0, 0, 595, headerHeight)
       .fill('#1e3a8a'); // Deep blue background
    
    // Add subtle diagonal pattern for texture
    for (let i = 0; i < 595; i += 15) {
      doc.moveTo(i, 0)
         .lineTo(i + 8, headerHeight)
         .stroke('#2563eb')
         .lineWidth(0.3);
    }
    
    // Add a professional border accent
    doc.rect(0, 0, 595, 3)
       .fill('#fbbf24'); // Gold accent line
    
    // Left side - Agency branding
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#fbbf24')
       .text('SHOUKO', 40, 15);
    
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#93c5fd')
       .text('Detective Agency', 40, 30);
    
    // Center - Main title with clean typography
    doc.fontSize(26)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('INVESTIGATION REPORT', 0, 25, { width: 595, align: 'center' });
    
    // Subtitle with better positioning
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#93c5fd')
       .text('Comprehensive Case Analysis & Documentation', 0, 50, { width: 595, align: 'center' });
    
    // Right side - Report metadata
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#fbbf24')
       .text('CONFIDENTIAL', 470, 15);
    
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#93c5fd')
       .text('Classified Document', 470, 30);
    
    // Add professional decorative elements
    // Left decorative line
    doc.moveTo(40, 70)
       .lineTo(120, 70)
       .stroke('#fbbf24')
       .lineWidth(2);
    
    // Right decorative line
    doc.moveTo(475, 70)
       .lineTo(555, 70)
       .stroke('#fbbf24')
       .lineWidth(2);
    
    // Center badge-like element
    doc.circle(297.5, 70, 8)
       .fill('#fbbf24');
    
    doc.fontSize(6)
       .font('Helvetica-Bold')
       .fillColor('#1e3a8a')
       .text('S', 295, 68);
    
    doc.moveDown(2);

    // ===== CASE INFORMATION SECTION =====
    addSectionHeader('CASE INFORMATION');

    // Case info card with improved styling
    const infoCardY = doc.y;
    const infoCardHeight = 120;
    
    // Card background
    doc.rect(40, infoCardY, 515, infoCardHeight)
       .fill('#ffffff')
       .stroke('#dee2e6');
    
    // Case details in a structured format with better layout
    const caseInfo = [
      { label: 'Case Title', value: caseData.title, x: 50, y: infoCardY + 15 },
      { label: 'Report Number', value: reportNumber, x: 50, y: infoCardY + 35 },
      { label: 'Case ID', value: `#${caseData.id || caseData._id}`, x: 50, y: infoCardY + 55 },
      { label: 'Priority', value: caseData.priority || 'Low', x: 50, y: infoCardY + 75 },
      { label: 'Status', value: caseData.status || 'Open', x: 50, y: infoCardY + 95 },
      { label: 'Created', value: new Date(caseData.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }), x: 300, y: infoCardY + 15 },
      { label: 'Generated', value: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }), x: 300, y: infoCardY + 35 }
    ];

    caseInfo.forEach(info => {
      // Label with background
      doc.rect(info.x, info.y, 80, 12)
         .fill('#e3f2fd')
         .stroke('#bbdefb');
      
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#1565c0')
         .text(info.label, info.x + 3, info.y + 2);
      
      // Value
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#212529')
         .text(info.value, info.x + 85, info.y + 2);
    });
    
    doc.y = infoCardY + infoCardHeight + 10;

    // ===== CASE DESCRIPTION SECTION =====
    addSectionHeader('CASE DESCRIPTION');

    // Description card
    const descCardY = doc.y;
    const descCardHeight = 60;
    
    // Card background
    doc.rect(40, descCardY, 515, descCardHeight)
       .fill('#ffffff')
       .stroke('#dee2e6');
    
    // Description header
    doc.rect(40, descCardY, 515, 15)
       .fill('#e8f5e8');
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#2e7d32')
       .text('Case Details', 45, descCardY + 3);

    // Description text
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#212529')
       .text(caseData.description || 'No description provided for this case.', 50, descCardY + 20, { 
         width: 505, 
         align: 'justify' 
       });
    
    doc.y = descCardY + descCardHeight + 10;

    // ===== PEOPLE INVOLVED SECTION =====
    if (caseData.people && caseData.people.length > 0) {
      addSectionHeader('PEOPLE INVOLVED');
      drawLine();
      doc.moveDown(0.3);

      caseData.people.forEach((person, index) => {
        // Person header with background
        doc.rect(40, doc.y, 515, 15)
           .fill('#ecf0f1');
        
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text(`${index + 1}. ${person.name}`, 45, doc.y + 3);
        
        doc.y += 20;
        
        // Person details
        if (person.role) {
          addInfoBox('   Role', person.role, -15);
        }
        if (person.contact) {
          addInfoBox('   Contact', person.contact, -15);
        }
        
        doc.moveDown(0.3);
      });
    }

    // ===== CLUES AND EVIDENCE SECTION =====
    if (caseData.clues && caseData.clues.length > 0) {
      addSectionHeader('CLUES AND EVIDENCE');
      drawLine();
      doc.moveDown(0.3);

      caseData.clues.forEach((clue, index) => {
        // Clue header with background
        doc.rect(40, doc.y, 515, 15)
           .fill('#e8f5e8');
        
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text(`Clue ${index + 1}`, 45, doc.y + 3);
        
        doc.y += 20;
        
        // Clue details
        addContent(`Description: ${clue.description}`);
        if (clue.type) {
          addInfoBox('   Type', clue.type, -15);
        }
        if (clue.location) {
          addInfoBox('   Location', clue.location, -15);
        }
        
        doc.moveDown(0.3);
      });
    }

    // ===== EVIDENCE FILES SECTION =====
    if (caseData.evidence && caseData.evidence.length > 0) {
      // Check if we need a page break before evidence section
      checkPageBreak(100); // Estimate 100 points for section header
      
      addSectionHeader('EVIDENCE FILES');
      drawLine();
      doc.moveDown(0.3);

      for (let index = 0; index < caseData.evidence.length; index++) {
        const evidence = caseData.evidence[index];
        
        // Check if we need a page break before this evidence item
        const estimatedCardHeight = 80 + 150 + 20; // card + image + spacing
        checkPageBreak(estimatedCardHeight);
        
        // Evidence card with improved styling
        const cardY = doc.y;
        const cardHeight = 80; // Base height for text content
        
        // Card background with subtle gradient effect
        doc.rect(40, cardY, 515, cardHeight)
           .fill('#f8f9fa')
           .stroke('#e9ecef');
        
        // Evidence header with accent color
        doc.rect(40, cardY, 515, 20)
           .fill('#007bff');
        
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#ffffff')
           .text(evidence.fileName, 45, cardY + 5);
        
        doc.y = cardY + 25;
        
        // Evidence description in a styled box (only if description exists)
        if (evidence.description && evidence.description.trim()) {
          doc.fontSize(9)
         .font('Helvetica-Bold')
             .fillColor('#495057')
             .text('Description:', 50, doc.y);
          
          // Description background
          doc.rect(50, doc.y + 2, 280, 15)
             .fill('#ffffff')
             .stroke('#dee2e6');
          
          doc.fontSize(9)
           .font('Helvetica')
             .fillColor('#212529')
             .text(evidence.description, 55, doc.y + 5, { width: 270, align: 'left' });
          
          doc.y += 20;
        }
        
        // Evidence details in a compact table format
        const details = [
          { label: 'Type', value: evidence.fileType },
          { label: 'Size', value: `${(evidence.fileSize / 1024 / 1024).toFixed(2)} MB` },
          { label: 'File ID', value: evidence.uniqueFileName || 'N/A' },
          { label: 'Uploaded', value: new Date(evidence.uploadDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        ];

        // Create a compact details table
        details.forEach((detail, detailIndex) => {
          const detailY = cardY + 25 + (detailIndex * 12);
          
          // Detail label with background
          doc.rect(50, detailY, 60, 10)
             .fill('#e9ecef');
          
          doc.fontSize(8)
       .font('Helvetica-Bold')
             .fillColor('#495057')
             .text(detail.label, 55, detailY + 2);

          // Detail value
          doc.fontSize(8)
       .font('Helvetica')
             .fillColor('#212529')
             .text(detail.value, 115, detailY + 2);
        });
        
        // Set position for image processing
        doc.y = cardY + cardHeight + 5;
        
        // Add image if it's an image file
        if (evidence.fileType && evidence.fileType.startsWith('image/') && evidence.cloudinaryUrl) {
          try {
            // Check if we need a page break before adding image
            const totalImageHeight = 150 + 15 + 10; // image + caption + spacing
            checkPageBreak(totalImageHeight);
            
            doc.moveDown(0.5);
            
            // Calculate image dimensions - smaller and positioned to the right
            const maxWidth = 200;
            const maxHeight = 150;
            let imageWidth = maxWidth;
            let imageHeight = maxHeight;
            
            // Position image to the right side of the page
            const imageX = 350;
            const imageY = doc.y;
            
            // Try to embed the actual image
            try {
              const https = require('https');
              const url = require('url');
              
              const parsedUrl = url.parse(evidence.cloudinaryUrl);
              const options = {
                hostname: parsedUrl.hostname,
                path: parsedUrl.path,
                method: 'GET'
              };
              
              // Fetch image data
              const imageData = await new Promise((resolve, reject) => {
                const request = https.request(options, (response) => {
                  if (response.statusCode === 200) {
                    const chunks = [];
                    response.on('data', (chunk) => chunks.push(chunk));
                    response.on('end', () => resolve(Buffer.concat(chunks)));
                  } else {
                    reject(new Error(`HTTP ${response.statusCode}`));
                  }
                });
                
                request.on('error', reject);
                request.end();
              });
              
              // Add image border and background
              doc.rect(imageX - 2, imageY - 2, imageWidth + 4, imageHeight + 4)
                 .fill('#f8f9fa')
                 .stroke('#dee2e6');
              
              // Embed the image in the PDF
              doc.image(imageData, imageX, imageY, { 
                width: imageWidth, 
                height: imageHeight,
                fit: [imageWidth, imageHeight]
              });
              
              // Add image caption below the image
              doc.fontSize(7)
                 .font('Helvetica')
                 .fillColor('#6c757d')
                 .text(`Evidence Image`, imageX, imageY + imageHeight + 5, { width: imageWidth, align: 'center' });
              
              // Add success indicator
              doc.fontSize(7)
                 .font('Helvetica')
                 .fillColor('#28a745')
                 .text('✓ Embedded', imageX + imageWidth + 5, imageY + 5);
              
            } catch (imageError) {
              console.error('Error loading image:', imageError);
              // Add error placeholder
              doc.rect(imageX - 2, imageY - 2, imageWidth + 4, imageHeight + 4)
                 .fill('#f8d7da')
                 .stroke('#dc3545');
              
              doc.fontSize(8)
                 .font('Helvetica')
                 .fillColor('#721c24')
                 .text('Image Error', imageX + (imageWidth / 2) - 25, imageY + (imageHeight / 2) - 5);
              
              doc.fontSize(7)
                 .font('Helvetica')
                 .fillColor('#dc3545')
                 .text('✗ Failed to load', imageX + imageWidth + 5, imageY + 5);
            }
            
            // Adjust document position to account for image height
            doc.y = Math.max(doc.y, imageY + imageHeight + 20);
            
          } catch (error) {
            console.error('Error processing image evidence:', error);
          }
        }
        
        doc.moveDown(0.5);
      }
    }

    // ===== CASE TIMELINE SECTION =====
    // Check if we need a page break before timeline
    checkPageBreak(150); // Estimate 150 points for timeline section
    
    addSectionHeader('CASE TIMELINE');

    // Timeline card
    const timelineCardY = doc.y;
    const timelineCardHeight = 120; // Increased height for better spacing
    
    // Card background
    doc.rect(40, timelineCardY, 515, timelineCardHeight)
       .fill('#ffffff')
       .stroke('#dee2e6');
    
    // Timeline header
    doc.rect(40, timelineCardY, 515, 15)
       .fill('#fff3cd');
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#856404')
       .text('Case Timeline', 45, timelineCardY + 3);
    
    // Timeline with visual elements
    const timelineData = [
      { date: new Date(caseData.created_at), event: 'Case Created' },
      { date: new Date(caseData.updated_at), event: 'Last Updated' },
      { date: new Date(), event: 'Report Generated' }
    ];

    timelineData.forEach((item, index) => {
      const timelineY = timelineCardY + 25 + (index * 30); // Increased spacing from 18 to 30
      
      // Timeline dot
      doc.circle(60, timelineY + 3, 3) // Increased dot size from 2 to 3
         .fill('#007bff');
      
      // Timeline line
      if (index < timelineData.length - 1) {
        doc.moveTo(60, timelineY + 6) // Adjusted line start
           .lineTo(60, timelineY + 27) // Adjusted line end
           .stroke('#007bff')
           .lineWidth(1); // Increased line width from 0.5 to 1
      }
      
      // Event details
      doc.fontSize(10) // Increased font size from 9 to 10
         .font('Helvetica-Bold')
         .fillColor('#212529')
         .text(item.event, 75, timelineY);
      
      doc.fontSize(9) // Increased font size from 8 to 9
         .font('Helvetica')
         .fillColor('#6c757d')
         .text(item.date.toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'short', 
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
         }), 75, timelineY + 12); // Increased spacing from 10 to 12
    });
    
    doc.y = timelineCardY + timelineCardHeight + 10;



    // End the PDF document - this will trigger the download
    console.log('📄 PDF generation completed, ending document...');
    doc.end();

  } catch (error) {
    console.error('❌ Error generating report:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
};

// Get reports for a case
const getCaseReports = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;

    // Check if case exists and belongs to user
    const caseData = await Case.findOne({
      where: { id: caseId, userId: userId }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Get reports with generator info
    const reports = await Report.findAll({
      where: { caseId: caseId },
      include: [
        {
          model: User,
          as: 'generator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['generationDate', 'DESC']]
    });

    res.json({ reports });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Download report
const downloadReport = async (req, res) => {
  try {
    console.log('🔍 Download request received for report ID:', req.params.reportId);
    const { reportId } = req.params;
    const userId = req.user.id;

    console.log('🔍 User ID:', userId);

    // Find report and check ownership
    const report = await Report.findOne({
      where: { id: reportId },
      include: [
        {
          model: Case,
          as: 'case',
          where: { userId: userId }
        }
      ]
    });

    if (!report) {
      console.log('❌ Report not found or access denied');
      return res.status(404).json({ error: 'Report not found' });
    }

    console.log('✅ Report found:', report.reportNumber);
    console.log('🔗 Cloudinary URL:', report.cloudinaryUrl);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.reportNumber}.pdf"`);
    
    console.log('📋 Headers set, starting download...');
    
    // Fetch the file from Cloudinary and pipe it to response
    const https = require('https');
    const url = require('url');
    
    const parsedUrl = url.parse(report.cloudinaryUrl);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'GET'
    };

    console.log('🌐 Making request to Cloudinary...');

    const request = https.request(options, (response) => {
      console.log('📥 Cloudinary response status:', response.statusCode);
      if (response.statusCode === 200) {
        // Set additional headers from Cloudinary response
        res.setHeader('Content-Length', response.headers['content-length']);
        console.log('📦 Piping file to response...');
        // Pipe the file stream to the response
        response.pipe(res);
      } else {
        console.log('❌ Cloudinary request failed with status:', response.statusCode);
        res.status(response.statusCode).json({ error: 'Failed to download file from Cloudinary' });
      }
    });

    request.on('error', (error) => {
      console.error('❌ Error downloading from Cloudinary:', error);
      res.status(500).json({ error: 'Failed to download report' });
    });

    request.end();

  } catch (error) {
    console.error('❌ Error in downloadReport:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
};

// Delete report
const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    // Find report and check ownership
    const report = await Report.findOne({
      where: { id: reportId },
      include: [
        {
          model: Case,
          as: 'case',
          where: { userId: userId }
        }
      ]
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(report.cloudinaryPublicId);

    // Delete from database
    await report.destroy();

    res.json({ message: 'Report deleted successfully' });

  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};

module.exports = {
  generateReport,
  getCaseReports,
  deleteReport,
  downloadReport
}; 