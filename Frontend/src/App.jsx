import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Product from './pages/Product'
import Cart from './pages/Cart'
import PlaceOrder from './pages/PlaceOrder'
import Collection from './pages/Collection'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'
import SignUpLoginNavbar from './components/SigupLoginNavbar'
import Footer from './components/Footer'
import SearchBar from './components/SearchBar'
import Returns from './pages/Returns'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Verify from './pages/Verify'
import ChatBot from './components/ChatBot'


const App = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className='px-2 py-0 smnpx-[5vw] md:px-[7vw] lg:px[9vw]'>
      <ToastContainer />
      {isAuthPage ? <SignUpLoginNavbar /> : <Navbar />}
      {!isAuthPage && <SearchBar />}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path='/product/:productId' element={<Product />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/place-order' element={<PlaceOrder />} />
        <Route path='/collection' element={<Collection />} />
        <Route path='/orders' element={<Orders />} />
        <Route path='/verify' element={<Verify />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/returns' element={<Returns />} />
      </Routes>
      <Footer />
      <ChatBot />
    </div>
  )
}

export default App