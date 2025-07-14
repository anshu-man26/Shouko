import React, { useContext } from 'react'
import'./css/register.css'
import Navbar from '../components/Navbar'

import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
import { MdOutlinePassword } from "react-icons/md";
import { MdOutlineMail } from "react-icons/md";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import {useState} from "react"
import api from '../api'
import {toast} from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../../context/userContext'
export default function Register() {
  const Navigate= useNavigate();
  const {setUser} = useContext(UserContext);
  const [data,setData]=useState({
    name: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false);
  
  const registerUser=async (e)=>{
    e.preventDefault();
    const {name,email,password}=data
    try {
      const {data}=await api.post('/register',{
        name,email,password
      })
      if(data.error){
        toast.error(data.error)
      }
      else
      {
        setData({})
        toast.success('Registration Successful. Welcome!')
        
        // Update user context with the registered user data
        setUser(data);
        
        // Redirect to homepage immediately
        Navigate('/')
      }
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <div>
        <Navbar/>

        <div className="registerBody">
           
            <div className="registerForm">
                <form onSubmit={registerUser}>
                    <h1>Register</h1>
                    <div className='input-box'>
                        <input 
                            type='text' 
                            placeholder='Name' 
                            value={data.name} 
                            onChange={(e )=>setData({...data,name: e.target.value})}
                        />
                        <div className='iconsRegister'>
                            <MdOutlineDriveFileRenameOutline />
                        </div>
                    </div>
                    
                    <div className='input-box'>
                        <input 
                            type='Email' 
                            placeholder='Email' 
                            value={data.email} 
                            onChange={(e )=>setData({...data,email: e.target.value})}
                        />
                        <div className='iconsRegister'>
                            <MdOutlineMail />
                        </div>
                    </div>

                    <div className='input-box'>
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            placeholder='Password'
                            value={data.password} 
                            onChange={(e )=>setData({...data,password: e.target.value})}
                        />
                        <div className='iconsRegister'>
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

                    <button type='submit'> Register</button>
                </form>
            </div>
        </div>
    </div>
  )
}
