import React from 'react'
import { Link } from 'react-router-dom'

import shoko from '../assets/shokoTM.png'
import './Navbar.css'

export default function Navbar() {
  return (
    <div>
        <div className='registerLinks'>
            <Link to="/"><img src={shoko} alt="" /></Link>
            <div>
                <Link to="/register">Register</Link>
                <Link to="/login">Login</Link>
            </div>
        </div>
    </div>
  )
}
