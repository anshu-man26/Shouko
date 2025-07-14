# Shouko Detective Case Management System

A full-stack detective case management system with a React + Vite frontend and a Node.js (Express) + MySQL backend.

---

## 🗄️ Backend (Node.js + MySQL)

### Prerequisites
- MySQL Server installed and running
- Node.js (v16+ recommended) and npm

### Database Setup
1. **Create MySQL Database:**
   ```sql
   CREATE DATABASE shouko_db;
   ```
2. **Environment Variables:**
   Create a `.env` file in the `server/` directory:
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   DB_HOST=your_mysql_host.com
   DB_PORT=3306
   DB_NAME=shouko_db
   DB_USER=your_username
   DB_PASS=your_password
   DB_SSL=true
   ```

### Install & Run Backend
```bash
cd server
npm install
npm start
```

---

## 💻 Frontend (React + Vite)

### Prerequisites
- Node.js (v16+ recommended) and npm

### Environment Variables
If needed, create a `.env` file in the `client/` directory for API URLs, etc.

### Install & Run Frontend
```bash
cd client
npm install
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173) by default.

---

## 📦 Project Structure
```
Shouko/
  client/   # React + Vite frontend
  server/   # Node.js + Express backend
```

---

## 🛠️ Useful Scripts
- **Backend:**
  - `npm start` (production or dev, see nodemon config)
- **Frontend:**
  - `npm run dev` (development)
  - `npm run build` (production build)

---

## 📝 Features
- User authentication (JWT)
- Case management (CRUD)
- Evidence upload
- PDF report generation
- MySQL with Sequelize ORM
- Modern React UI

---

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License
[MIT](LICENSE) 