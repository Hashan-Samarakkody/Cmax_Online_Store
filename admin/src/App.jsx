import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Route, Routes, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import AdminSignup from './pages/SignUp'
import Add from './pages/Add'
import List from './pages/List'
import Edit from './pages/Edit'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import AdminManagement from './pages/AdminManagement'
import SalesReport from './pages/SalesReport'
import Orders from './pages/Orders'
import ReturnRequests from './pages/ReturnRequests'
import CategoryManager from './pages/CategoryManager'
import ReturnAnalysis from './pages/ReturnAnalysis'
import UserActivityReport from './pages/UserActivityReport'
import AdminChatBot from './components/AdminChatBot'
import { useState } from 'react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = "Rs."

const App = () => {
  // Use adminToken consistently throughout the app
  const [token, setToken] = useState(localStorage.getItem('adminToken') || "")

  useEffect(() => {
    // Make sure we save to adminToken consistently
    localStorage.setItem('adminToken', token)
  }, [token])

  // If no token, redirect to login page
  if (token === "") {
    return (
      <div className='bg-gray-50 min-h-screen'>
        <ToastContainer />
        <Routes>
          <Route path='/' element={<LoginPage setToken={setToken} />} />
          <Route path='/signup' element={<AdminSignup setToken={setToken} />} />
          <Route path='*' element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    )
  }
  // If token exists, show the main application
  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      <Navbar setToken={setToken} />
      <hr />
      <div className='flex w-full'>
        <Sidebar />
        <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
          <Routes>
            <Route path='/' element={<Navigate to="/dashboard" replace />} />
            <Route path='/dashboard' element={<Dashboard token={token} />} />
            <Route path='/sales' element={<SalesReport token={token} />} />
            <Route path='/add' element={<Add token={token} />} />
            <Route path='/list' element={<List token={token} />} />
            <Route path='/edit/:id' element={<Edit token={token} />} />
            <Route path='/category' element={<CategoryManager token={token} />} />
            <Route path='/orders' element={<Orders token={token} />} />
            <Route path='/profile' element={<Profile token={token} setToken={setToken} />} />
            <Route path='/admin-management' element={<AdminManagement token={token} />} />
            <Route path='/signup' element={<AdminSignup setToken={setToken} />} />
            <Route path='/return-requests' element={<ReturnRequests token={token} />} />
            <Route path='/return-analysis' element={<ReturnAnalysis token={token} />} />
            <Route path='/user-activity-report' element={<UserActivityReport token={token} />} />
            <Route path='*' element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
      <AdminChatBot token={token} />
    </div>
  )
}

export default App