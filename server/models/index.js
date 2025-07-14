// Import Sequelize instance
const { sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Case = require('./Case');
const Clue = require('./Clue');
const Person = require('./Person');
const Evidence = require('./Evidence');
const Report = require('./Report');

// Debug: Check if models are properly imported
console.log('User model:', typeof User);
console.log('Case model:', typeof Case);
console.log('Clue model:', typeof Clue);
console.log('Person model:', typeof Person);
console.log('Evidence model:', typeof Evidence);
console.log('Report model:', typeof Report);

// Export models first
const models = {
  sequelize,
  User,
  Case,
  Clue,
  Person,
  Evidence,
  Report
};

// Define associations in a separate function
const setupAssociations = () => {
  try {
    // User associations
    if (User && typeof User.hasMany === 'function') {
      User.hasMany(Case, { foreignKey: 'userId', as: 'cases' });
      Case.belongsTo(User, { foreignKey: 'userId', as: 'user' });
      
      User.hasMany(Evidence, { foreignKey: 'uploadedBy', as: 'evidence' });
      Evidence.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
      
      User.hasMany(Report, { foreignKey: 'generatedBy', as: 'reports' });
      Report.belongsTo(User, { foreignKey: 'generatedBy', as: 'generator' });
    } else {
      console.error('User model is not properly initialized');
    }

    // Case associations
    if (Case && typeof Case.hasMany === 'function') {
      Case.hasMany(Clue, { foreignKey: 'caseId', as: 'clues' });
      Clue.belongsTo(Case, { foreignKey: 'caseId', as: 'case' });

      Case.hasMany(Person, { foreignKey: 'caseId', as: 'people' });
      Person.belongsTo(Case, { foreignKey: 'caseId', as: 'case' });
      
      Case.hasMany(Evidence, { foreignKey: 'caseId', as: 'evidence' });
      Evidence.belongsTo(Case, { foreignKey: 'caseId', as: 'case' });
      
      Case.hasMany(Report, { foreignKey: 'caseId', as: 'reports' });
      Report.belongsTo(Case, { foreignKey: 'caseId', as: 'case' });
    } else {
      console.error('Case model is not properly initialized');
    }
  } catch (error) {
    console.error('Error setting up associations:', error);
  }
};

// Setup associations
setupAssociations();

module.exports = models; 