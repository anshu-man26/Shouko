import React, { useState, useContext } from 'react'
import'./css/login.css'
import api from '../api'
import {toast} from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { PiDetective } from "react-icons/pi";
import { MdOutlinePassword } from "react-icons/md";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { UserContext } from '../../context/userContext'
export default function Login() {

  const navigate=useNavigate();
  const {setUser} = useContext(UserContext);
  const[data,setData]=useState({
    email:'',
    password:'',
  })
  const [showPassword, setShowPassword] = useState(false);
  
  const loginUser=async (e)=>{
   e.preventDefault()
   const{email,password}=data
   console.log('Attempting login with:', { email, password: '***' });
   
   try {
    const response = await api.post('/login',{
      email,
      password
    })
    
    console.log('Login response:', response);
    console.log('Response data:', response.data);
    
    if(response.data.error)
    {
      console.log('Login error:', response.data.error);
      toast.error(response.data.error)
    }
    else{
      console.log('Login successful, user data:', response.data);
      
      setData({});
      toast.success('Login Successful. Welcome!')
      
      // Save token to localStorage for ngrok compatibility
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      // Update user context with the logged-in user data
      setUser(response.data);
      
      console.log('User context updated, redirecting...');
      
      // Force a small delay to ensure context is updated
      setTimeout(() => {
        navigate('/');
      }, 100);
    }
   } catch (error) {
    console.log('Login request failed:', error);
    console.log('Error response:', error.response?.data);
    toast.error('Login failed. Please try again.');
   }
   }
  return (
    <>
        <Navbar/>
        <div className="loginBody">
        
            <div className="loginForm">
                <form onSubmit={loginUser}>
                    <h1>Login</h1>
                    <div className='input-box'>
                        <input 
                            type='Email' 
                            placeholder='Email'
                            value={data.email} 
                            onChange={(e )=>setData({...data,email: e.target.value})}
                        />
                        <div className='iconsLogin'>
                            <PiDetective />
                        </div>
                    </div>

            
                    <div className='input-box'>
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            placeholder='Password'
                            value={data.password} 
                            onChange={(e )=>setData({...data,password: e.target.value})}
                        />
                        <div className='iconsLogin'>
                            <MdOutlinePassword />
                        </div>
                        <div 
                            className='password-toggle'
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '45px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'pointer',
                                color: '#666',
                                fontSize: '18px'
                            }}
                        >
                            {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                        </div>
                    </div>
                    
                    <div className="remember-forgot">
                        <label><input type="checkbox" />Remember me</label>
                        <a href="#">Forgot password?</a>
                    </div>

                    <button type='submit'> Login</button>
                </form>
            </div>
        </div>
    </>
    
  )
}
