import React, { useEffect, useState } from 'react'
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
import FinancialSalesReport from './pages/FinancialSalesReport'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = "Rs."

const App = () => {
  // Use adminToken consistently throughout the app
  const [token, setToken] = useState(localStorage.getItem('adminToken') || "")
  const [isValidToken, setIsValidToken] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    localStorage.setItem('adminToken', token)

    // Validate token when it changes
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false)
        setIsLoading(false)
        return
      }

      try {
        const profileResponse = await axios.get(`${backendUrl}/api/admin/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        })

        if (profileResponse.status === 200) {
          setIsValidToken(true)
        } else {
          setIsValidToken(false)
          setToken('')
        }
      } catch (error) {
        console.error('Token validation error:', error)
        setIsValidToken(false)
        setToken('')
      } finally {
        setIsLoading(false)
      }
    }

    validateToken()
  }, [token])

  // Display loading state while validating token
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  // If no valid token, show login/signup pages
  if (!isValidToken) {
    return (
      <div className='bg-gray-50 min-h-screen'>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<LoginPage setToken={setToken} />} />
          <Route path="/signup" element={<AdminSignup setToken={setToken} />} />
        </Routes>
      </div>
    )
  }

  // If token exists and is valid, show the main application
  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      <Navbar setToken={setToken} />
      <hr />
      <div className='flex w-full'>
        <Sidebar />
        <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
          <Routes>
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
            <Route path='/financial-sales-report' element={<FinancialSalesReport token={token} />} />
          </Routes>
        </div>
      </div>
      <AdminChatBot token={token} />
    </div>
  )
}

export default App