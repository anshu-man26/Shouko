const express=require('express');
const dotenv= require('dotenv').config();
const cors= require('cors')
const cookieParser= require('cookie-parser')
const { testConnection } = require('./config/database');
const { sequelize, User, Case, Clue, Person, Evidence, Report } = require('./models');
const app=express();

// Check required environment variables
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

// Debug: Check Cloudinary environment variables
console.log('🔍 Environment Variables Check:');
console.log('CLOUDINARY_NAME:', process.env.CLOUDINARY_NAME ? '✅ Set' : '❌ Missing');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('CLOUDINARY_SECRET_KEY:', process.env.CLOUDINARY_SECRET_KEY ? '✅ Set' : '❌ Missing');

// Initialize database and sync models
const initializeDatabase = async () => {
  try {
    await testConnection();
    await sequelize.sync({ alter: true }); // Alter tables to match current models
    console.log('✅ Database models synchronized and tables recreated');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};

// Initialize database on startup
initializeDatabase();

app.use(express.json())
app.use(cookieParser());
app.use(express.urlencoded({extended:false}))

// Add CORS middleware - Allow all origins for development
app.use(cors({
  credentials: true,
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and ngrok URLs
    if (origin.includes('localhost:5173') || origin.includes('ngrok-free.app')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  }
}))

app.use('/',require('./routes/authRoutes'))
app.use('/api/evidence', require('./routes/evidence'))
app.use('/api/reports', require('./routes/reports'))

// Test endpoint to check server status
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    env: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasCloudinary: !!(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_SECRET_KEY),
      hasDatabase: !!(process.env.DB_NAME || process.env.DB_USER || process.env.DB_PASS)
    }
  });
});

// Test database connection and models
app.get('/api/test-db', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    // Test if tables exist
    const tables = await sequelize.showAllSchemas();
    
    // Test if we can query cases
    const caseCount = await Case.count();
    
    res.json({
      message: 'Database connection successful',
      tables: tables.length,
      caseCount: caseCount,
      models: {
        Case: !!Case,
        Evidence: !!Evidence,
        User: !!User,
        Clue: !!Clue,
        Person: !!Person,
        Report: !!Report
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      error: 'Database test failed',
      details: error.message
    });
  }
});

// Create test user for development
app.post('/api/create-test-user', async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    
    // Check if test user already exists
    const existingUser = await User.findOne({ where: { email: 'test@example.com' } });
    if (existingUser) {
      return res.json({ 
        message: 'Test user already exists', 
        user: { id: existingUser.id, email: existingUser.email, name: existingUser.name }
      });
    }
    
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 8);
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword
    });
    
    res.json({ 
      message: 'Test user created successfully', 
      user: { id: testUser.id, email: testUser.email, name: testUser.name }
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    res.status(500).json({ error: 'Failed to create test user', details: error.message });
  }
});

const port=process.env.PORT || 5000;
app.listen(port,()=>console.log(`Server is Running on port ${port}`))