import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Route, Routes } from 'react-router-dom'
import Add from './pages/Add'
import List from './pages/List'
import Edit from './pages/Edit'
import Dashboard from './pages/Dashboard'
import SalesReport from './pages/SalesReport'
import Orders from './pages/Orders'
import { useState } from 'react'
import Login from './components/Login'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import CategoryManager from './pages/CategoryManager'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = "Rs."

const App = () => {

  const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : "")

  useEffect(() => {
    localStorage.setItem('token', token)
  }, [token])

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      {token === ""
        ? <Login setToken={setToken} />
        : <>
          <Navbar setToken={setToken} />
          <hr />
          <div className='flex w-full'>
            <Sidebar />
            <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
              <Routes>
                <Route path='/' element={<Dashboard token={token} />} />
                <Route path='/sales' element={<SalesReport token={token} />} />
                <Route path='/add' element={<Add token={token} />} />
                <Route path='/list' element={<List token={token} />} />
                <Route path='/edit/:id' element={<Edit token={token} />} />  
                <Route path='/category' element={<CategoryManager token={token} />} />
                <Route path='/orders' element={<Orders token={token} />} />
              </Routes>
            </div>
          </div>
        </>}

    </div>
  )
}

export default App