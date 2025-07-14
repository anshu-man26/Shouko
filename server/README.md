# Shouko Detective Case Management System - Backend

## 🗄️ MySQL Database Setup

### Prerequisites
- MySQL Server installed and running
- Node.js and npm

### Database Configuration

1. **Create MySQL Database:**
   ```sql
   CREATE DATABASE shouko_db;
   ```

2. **Environment Variables:**
   Create a `.env` file in the server directory with:
   ```env
   # Server Configuration
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here

   # MySQL Database Configuration
   DB_HOST=your_mysql_host.com
   DB_PORT=3306
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASS=your_password
   DB_SSL=true
   ```

### Installation & Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Server:**
   ```bash
   npm start
   ```

### Database Tables

The following tables will be automatically created:
- `users` - User accounts
- `cases` - Detective cases
- `clues` - Case clues/evidence
- `people` - People involved in cases

### API Endpoints

- `POST /register` - User registration
- `POST /login` - User login
- `GET /profile` - Get user profile
- `POST /logout` - User logout
- `GET /cases` - Get user's cases
- `POST /cases` - Create new case
- `DELETE /cases/:caseId` - Delete case

### Features

- ✅ **MySQL Database** - Relational database with Sequelize ORM
- ✅ **User Authentication** - JWT-based authentication
- ✅ **Case Management** - Create, read, delete cases
- ✅ **Data Relationships** - Proper foreign key relationships
- ✅ **Password Hashing** - Secure password storage
- ✅ **Input Validation** - Server-side validation 