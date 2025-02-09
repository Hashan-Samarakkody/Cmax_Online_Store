import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Product from './pages/Product'
import Cart from './pages/Cart'
import PlaceOrder from './pages/PlaceOrder'
import Collection from './pages/Collection'
import Orders from './pages/Orders'
import Navbar from './components/navbar'
import Footer from './components/Footer'


const App = () => {
  return (
    <div className='px-4 smnpx-[5vw] md:px-[7vw] lg:px[9vw]'>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/login' element={<Login />} />
        <Route path='/product/:product[id]' element={<Product />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/palace-order' element={<PlaceOrder />} />
        <Route path='/collection' element={<Collection />} />
        <Route path='/orders' element={<Orders />} />
      </Routes>
      <Footer/>
    </div>
  )
}

export default App