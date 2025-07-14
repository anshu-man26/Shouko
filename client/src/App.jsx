
import './App.css'
import {Routes,Route} from 'react-router-dom'
import Home from '../src/Pages/Home'
import Navbar from '../src/components/Navbar'
import Register from "../src/Pages/Register"
import Login from "../src/Pages/Login"
import api from './api'
import {Toaster} from 'react-hot-toast'
import { UserContextProvider } from '../context/userContext'
import { UserContext } from '../context/userContext'
import { useContext, useEffect } from "react"
import { useNavigate } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import Dashboard from './Pages/Dashboard'
import { testBackendConnection } from './testConnection'
import SpotifyCallback from './components/SpotifyCallback'


function App() {
  return (
    <UserContextProvider>
      <AppContent />
    </UserContextProvider>
  )
}

function AppContent() {
  const {user, isLoading}= useContext(UserContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Test backend connection on app load
    testBackendConnection();
  }, []);
  
  return (
    <>
      <Toaster position='bottom-right' toastOptions={{duration :2000}}/>
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>Loading...</p>
        </div>
      ) : (
        <Routes>
          <Route path='/' element={user ? <Home/> : <Navigate to="/login" replace />} />

          <Route path='/register' element={user ? <Navigate to="/" replace /> : <Register/>} />
          <Route path='/login' element={user ? <Navigate to="/" replace /> : <Login/>} />

          <Route path='/dashboard' element={user ? <Dashboard/> : <Navigate to="/login" replace />} />

          <Route path='/spotify-callback' element={<SpotifyCallback />} />

          {/* Catch all route for undefined paths */}
          <Route path='*' element={user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />

        </Routes>
      )}
    </>
  )
}

export default App
